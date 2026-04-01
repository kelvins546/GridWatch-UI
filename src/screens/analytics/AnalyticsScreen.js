import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- HELPER: Get Local YYYY-MM-DD String ---
const getLocalDateString = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 10);
  return localISOTime;
};

const getCategoryIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes("air") || n.includes("ac") || n.includes("conditioner"))
    return "ac-unit";
  if (
    n.includes("fridge") ||
    n.includes("refrigerator") ||
    n.includes("freezer")
  )
    return "kitchen";
  if (n.includes("tv") || n.includes("vision")) return "tv";
  if (n.includes("wash") || n.includes("laundry"))
    return "local-laundry-service";
  if (n.includes("light") || n.includes("lamp")) return "lightbulb";
  if (n.includes("computer") || n.includes("pc")) return "computer";
  return "bolt";
};

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const { theme, fontScale, isDarkMode } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const [activeScope, setActiveScope] = useState("personal");
  const [activeTab, setActiveTab] = useState("This Month");
  const [activeHubFilter, setActiveHubFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Time Travel State
  const [dateOffset, setDateOffset] = useState(0);

  const [personalHubs, setPersonalHubs] = useState([]);
  const [sharedHubs, setSharedHubs] = useState([]);
  const [breakdownData, setBreakdownData] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [chartBars, setChartBars] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [dateRangeText, setDateRangeText] = useState("");

  // Budget Forecasting State
  const [userBudget, setUserBudget] = useState(2000);
  const [projectedSpend, setProjectedSpend] = useState(0);

  // --- AI Smart Coach State ---
  const [isGeneratingCoach, setIsGeneratingCoach] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [coachData, setCoachData] = useState({
    rawText: "",
    summary: "",
    consumer: "",
    savings: "0.00",
    challenge: "",
    tip: "",
  });

  // --- Advanced AI Audit State ---
  const [isGeneratingAudit, setIsGeneratingAudit] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditData, setAuditData] = useState({
    rawText: "",
    diagnosis: "",
    consumer: "",
    savings: "0.00",
    tips: [],
  });

  const getBarColor = (percent) => {
    if (percent > 80) return isDarkMode ? "#ff4444" : "#cc0000";
    if (percent > 50) return isDarkMode ? "#ffaa00" : "#ff9900";
    return theme.buttonPrimary;
  };

  const handleTabChange = (tab) => {
    if (activeTab !== tab) {
      setDateOffset(0);
      setActiveTab(tab);
    }
  };

  const handleDateNav = (direction) => {
    setDateOffset((prev) => prev + direction);
  };

  const handleHubFilterChange = (hubId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveHubFilter(hubId);
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setCoachData({
      rawText: "",
      summary: "",
      consumer: "",
      savings: "0.00",
      challenge: "",
      tip: "",
    });
    setAuditData({
      rawText: "",
      diagnosis: "",
      consumer: "",
      savings: "0.00",
      tips: [],
    });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("monthly_budget")
        .eq("id", user.id)
        .single();

      if (userData && userData.monthly_budget) {
        setUserBudget(userData.monthly_budget);
      }

      const { data: ownedHubs } = await supabase
        .from("hubs")
        .select("id, name, devices(id, name, type)")
        .eq("user_id", user.id);

      const { data: sharedAccess } = await supabase
        .from("hub_access")
        .select("hub_id")
        .eq("user_id", user.id);

      let sharedHubsList = [];
      if (sharedAccess && sharedAccess.length > 0) {
        const sharedIds = sharedAccess.map((r) => r.hub_id);
        const { data: sharedData } = await supabase
          .from("hubs")
          .select("id, name, devices(id, name, type)")
          .in("id", sharedIds);
        sharedHubsList = sharedData || [];
      }

      setPersonalHubs(ownedHubs || []);
      setSharedHubs(sharedHubsList);

      const targetHubs =
        activeScope === "personal" ? ownedHubs || [] : sharedHubsList;
      const filteredHubs =
        activeHubFilter === "all"
          ? targetHubs
          : targetHubs.filter((h) => h.id === activeHubFilter);

      const allDeviceIds = [];
      const deviceMap = {};

      filteredHubs.forEach((hub) => {
        hub.devices?.forEach((d) => {
          if (d.type !== "Unused") {
            deviceMap[d.id] = { name: d.name, location: hub.name };
            allDeviceIds.push(d.id);
          }
        });
      });

      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      let labels = [];
      let buckets = [];

      if (activeTab === "This Day") {
        startDate.setDate(now.getDate() + dateOffset);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);
        setDateRangeText(
          startDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        );
        labels = ["12am", "4am", "8am", "12pm", "4pm", "8pm"];
        buckets = new Array(6).fill(0);
      } else if (activeTab === "This Week") {
        const currentDay = now.getDay();
        const diff = now.getDate() - currentDay + dateOffset * 7;
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        const endDisplay = new Date(endDate);
        endDisplay.setDate(endDisplay.getDate() - 1);
        const startStr = startDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const endStr = endDisplay.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const yearStr =
          startDate.getFullYear() !== now.getFullYear()
            ? `, ${startDate.getFullYear()}`
            : "";
        setDateRangeText(`${startStr} - ${endStr}${yearStr}`);
        labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        buckets = new Array(7).fill(0);
      } else if (activeTab === "This Month") {
        startDate.setMonth(now.getMonth() + dateOffset, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1);
        setDateRangeText(
          startDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
        );
        labels = ["W1", "W2", "W3", "W4", "W5"];
        buckets = new Array(5).fill(0);
      } else if (activeTab === "This Year") {
        startDate.setFullYear(now.getFullYear() + dateOffset, 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setFullYear(startDate.getFullYear() + 1);
        setDateRangeText(startDate.getFullYear().toString());
        labels = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        buckets = new Array(12).fill(0);
      }

      const startStr = getLocalDateString(startDate);
      const endStr = getLocalDateString(endDate);

      let usageData = [];
      if (allDeviceIds.length > 0) {
        const { data } = await supabase
          .from("usage_analytics")
          .select("device_id, cost_incurred, date, created_at")
          .in("device_id", allDeviceIds)
          .gte("date", startStr)
          .lt("date", endStr);
        usageData = data || [];
      }

      let currentTotal = 0;
      const deviceTotals = {};

      usageData.forEach((row) => {
        const cost = row.cost_incurred || 0;
        currentTotal += cost;
        deviceTotals[row.device_id] = (deviceTotals[row.device_id] || 0) + cost;

        const rowDate = new Date(row.date);
        if (activeTab === "This Week") {
          const dayIndex = rowDate.getDay();
          if (buckets[dayIndex] !== undefined) buckets[dayIndex] += cost;
        } else if (activeTab === "This Month") {
          const dayOfMonth = rowDate.getDate();
          const weekIdx = Math.min(Math.floor((dayOfMonth - 1) / 7), 4);
          if (buckets[weekIdx] !== undefined) buckets[weekIdx] += cost;
        } else if (activeTab === "This Year") {
          const monthIdx = rowDate.getMonth();
          if (buckets[monthIdx] !== undefined) buckets[monthIdx] += cost;
        } else if (activeTab === "This Day") {
          buckets[3] += cost;
        }
      });

      if (activeTab === "This Month" && dateOffset === 0 && currentTotal > 0) {
        const daysInMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
        ).getDate();
        const currentDayOfMonth = Math.max(1, now.getDate());
        const averageDailyBurn = currentTotal / currentDayOfMonth;
        const projectedEndMonthCost = averageDailyBurn * daysInMonth;
        setProjectedSpend(projectedEndMonthCost);
      } else {
        setProjectedSpend(0);
      }

      const maxVal = Math.max(...buckets, 1);
      setChartBars(buckets.map((v) => (v / maxVal) * 100));
      setChartLabels(labels);
      setTotalValue(currentTotal);
      setBreakdownData(
        Object.keys(deviceTotals)
          .map((id) => ({
            name: deviceMap[id].name,
            location: deviceMap[id].location,
            cost: deviceTotals[id],
            percent:
              currentTotal > 0 ? (deviceTotals[id] / currentTotal) * 100 : 0,
          }))
          .sort((a, b) => b.cost - a.cost),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [activeScope, activeTab, activeHubFilter, dateOffset]),
  );

  // --- Handlers for Modals ---
  const handleOpenCoach = () => {
    setShowCoachModal(true);
    if (!coachData.summary && !isGeneratingCoach) generateCoachSummary();
  };

  const handleOpenAudit = () => {
    setShowAuditModal(true);
    if (!auditData.diagnosis && !isGeneratingAudit) generateAuditSummary();
  };

  // --- 1. AI SMART COACH GENERATOR (Friendly) ---
  const generateCoachSummary = async () => {
    if (breakdownData.length === 0 || totalValue === 0) {
      setCoachData({
        rawText:
          "We need a little more data to give you good advice! Check back after using your devices for a bit.",
      });
      return;
    }
    setIsGeneratingCoach(true);
    setCoachData({
      rawText: "",
      summary: "",
      consumer: "",
      savings: "0.00",
      challenge: "",
      tip: "",
    });
    try {
      const dataContext = breakdownData
        .map(
          (d) => `${d.name} (₱${d.cost.toFixed(2)}, ${Math.round(d.percent)}%)`,
        )
        .join(", ");

      const prompt = `You are a friendly, helpful energy-saving coach. Use simple, everyday language. No confusing technical words.
      Period: ${dateRangeText}
      Total Cost: ₱${totalValue.toFixed(2)}
      Breakdown: ${dataContext}.

      Analyze the data and respond EXACTLY in this format using the exact keywords below. DO NOT use markdown like ** or *. Do not use emojis.

      SUMMARY: [1 simple sentence explaining how they are doing with their spending so far.]
      TOP_CONSUMER: [Name the appliance using the most power. Explain simply why it might be costing so much.]
      SAVINGS_ESTIMATE: [Give a realistic peso amount they could easily save this month, e.g., 150.00. Just the number.]
      CHALLENGE: [Give them one fun, super easy task they can do TODAY to save money on their top consuming appliance.]
      TIP: [Give one easy, general tip for the rest of the house.]`;

      const { data, error } = await supabase.functions.invoke("chat-support", {
        body: {
          system_instruction: {
            parts: [
              {
                text: "You are a friendly energy coach speaking to a homeowner in simple terms.",
              },
            ],
          },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_LOW_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_LOW_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_LOW_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_LOW_AND_ABOVE",
            },
          ],
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error.message);

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const summaryMatch = text.match(/SUMMARY:\s*(.*?)(?=TOP_CONSUMER:|$)/is);
      const consumerMatch = text.match(
        /TOP_CONSUMER:\s*(.*?)(?=SAVINGS_ESTIMATE:|$)/is,
      );
      const savingsMatch = text.match(
        /SAVINGS_ESTIMATE:\s*(.*?)(?=CHALLENGE:|$)/is,
      );
      const challengeMatch = text.match(/CHALLENGE:\s*(.*?)(?=TIP:|$)/is);
      const tipMatch = text.match(/TIP:\s*(.*?)$/is);

      if (summaryMatch) {
        setCoachData({
          summary: summaryMatch[1].trim(),
          consumer: consumerMatch ? consumerMatch[1].trim() : "",
          savings: savingsMatch
            ? savingsMatch[1].replace(/[^\d.-]/g, "")
            : "0.00",
          challenge: challengeMatch ? challengeMatch[1].trim() : "",
          tip: tipMatch ? tipMatch[1].trim() : "",
        });
      } else {
        setCoachData({ rawText: text.trim() });
      }
    } catch (error) {
      console.log("Coach Error:", error);
      setCoachData({
        rawText:
          "Oops! We couldn't fetch your insights right now. Please try again later.",
      });
    } finally {
      setIsGeneratingCoach(false);
    }
  };

  // --- 2. ADVANCED AI AUDIT GENERATOR (Strict) ---
  const generateAuditSummary = async () => {
    if (breakdownData.length === 0 || totalValue === 0) {
      setAuditData({
        rawText:
          "There is not enough energy usage data to generate an insight for this period.",
      });
      return;
    }
    setIsGeneratingAudit(true);
    setAuditData({
      rawText: "",
      diagnosis: "",
      consumer: "",
      savings: "0.00",
      tips: [],
    });
    try {
      const dataContext = breakdownData
        .map(
          (d) => `${d.name} (₱${d.cost.toFixed(2)}, ${Math.round(d.percent)}%)`,
        )
        .join(", ");

      const prompt = `You are a strict, expert Energy Auditor analyzing a home's power usage.
      Period: ${dateRangeText}
      Total Cost: ₱${totalValue.toFixed(2)}
      Breakdown: ${dataContext}.

      DO NOT use emojis. DO NOT use markdown like ** or *. 
      Analyze the data and respond EXACTLY in this format using the exact keywords below:

      DIAGNOSIS: [1-2 sentences analyzing the overall spend professionally]
      CONSUMER: [Identify the biggest energy drain and explain why it costs this much]
      SAVINGS: [Estimate a realistic peso amount they could save, e.g., 150.00]
      TIP1: [Highly specific, unconventional tip to reduce cost for the top consumer]
      TIP2: [Another highly specific tip to reduce overall cost]`;

      const { data, error } = await supabase.functions.invoke("chat-support", {
        body: {
          system_instruction: {
            parts: [
              {
                text: "You are a highly structured energy analyst. Do not use emojis.",
              },
            ],
          },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_LOW_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_LOW_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_LOW_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_LOW_AND_ABOVE",
            },
          ],
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error.message);

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const diagnosisMatch = text.match(/DIAGNOSIS:\s*(.*?)(?=CONSUMER:|$)/is);
      const consumerMatch = text.match(/CONSUMER:\s*(.*?)(?=SAVINGS:|$)/is);
      const savingsMatch = text.match(/SAVINGS:\s*(.*?)(?=TIP1:|$)/is);
      const tip1Match = text.match(/TIP1:\s*(.*?)(?=TIP2:|$)/is);
      const tip2Match = text.match(/TIP2:\s*(.*?)$/is);

      if (diagnosisMatch) {
        setAuditData({
          diagnosis: diagnosisMatch[1].trim(),
          consumer: consumerMatch ? consumerMatch[1].trim() : "",
          savings: savingsMatch
            ? savingsMatch[1].replace(/[^\d.-]/g, "")
            : "0.00",
          tips: [
            tip1Match ? tip1Match[1].trim() : "",
            tip2Match ? tip2Match[1].trim() : "",
          ].filter(Boolean),
        });
      } else {
        setAuditData({ rawText: text.trim() });
      }
    } catch (error) {
      console.log("Audit Error:", error);
      setAuditData({
        rawText: "Failed to generate insights. Please try again later.",
      });
    } finally {
      setIsGeneratingAudit(false);
    }
  };

  const sourceHubs = activeScope === "personal" ? personalHubs : sharedHubs;
  const isOverBudget = projectedSpend > userBudget;
  const currentSpendPercent = Math.min((totalValue / userBudget) * 100, 100);
  const projectedSpendPercent = Math.min(
    (projectedSpend / userBudget) * 100,
    100,
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      <View style={styles.header}>
        <Text
          style={{
            fontSize: scaledSize(20),
            fontWeight: "bold",
            color: theme.text,
          }}
        >
          Analytics
        </Text>
        <View
          style={[
            styles.scopeToggle,
            { backgroundColor: isDarkMode ? theme.buttonNeutral : "#f0f0f0" },
          ]}
        >
          {["personal", "shared"].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => {
                LayoutAnimation.easeInEaseOut();
                setActiveScope(s);
                setActiveHubFilter("all");
              }}
              style={[
                styles.scopeBtn,
                activeScope === s && {
                  backgroundColor: theme.card,
                  elevation: 2,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: scaledSize(12),
                  fontWeight: "600",
                  color: activeScope === s ? theme.text : theme.textSecondary,
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={{ marginBottom: 20 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            <TouchableOpacity
              onPress={() => handleHubFilterChange("all")}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor:
                  activeHubFilter === "all" ? theme.text : theme.buttonNeutral,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  fontSize: scaledSize(12),
                  fontWeight: "600",
                  color:
                    activeHubFilter === "all"
                      ? theme.background
                      : theme.textSecondary,
                }}
              >
                All
              </Text>
            </TouchableOpacity>
            {sourceHubs.map((hub) => (
              <TouchableOpacity
                key={hub.id}
                onPress={() => handleHubFilterChange(hub.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor:
                    activeHubFilter === hub.id
                      ? theme.text
                      : theme.buttonNeutral,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: scaledSize(12),
                    fontWeight: "600",
                    color:
                      activeHubFilter === hub.id
                        ? theme.background
                        : theme.textSecondary,
                  }}
                >
                  {hub.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.timeTabs}>
          {["This Day", "This Week", "This Month", "This Year"].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => handleTabChange(t)}
              style={[
                styles.tab,
                activeTab === t && { borderBottomColor: theme.buttonPrimary },
              ]}
            >
              <Text
                style={{
                  color:
                    activeTab === t ? theme.buttonPrimary : theme.textSecondary,
                  fontWeight: activeTab === t ? "bold" : "500",
                }}
              >
                {t.replace("This ", "")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.totalContainer}>
          <View style={styles.dateNavRow}>
            <TouchableOpacity
              onPress={() => handleDateNav(-1)}
              style={styles.navArrow}
            >
              <MaterialIcons
                name="chevron-left"
                size={24}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.subLabel,
                { color: theme.textSecondary, marginTop: 4 },
              ]}
            >
              {dateRangeText}
            </Text>
            <TouchableOpacity
              onPress={() => handleDateNav(1)}
              style={styles.navArrow}
            >
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.totalText, { color: theme.text }]}>
            ₱
            {totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text
            style={[
              styles.subLabel,
              { marginTop: 4, color: theme.textSecondary },
            ]}
          >
            Total Spending
          </Text>
        </View>

        {activeTab === "This Month" &&
          dateOffset === 0 &&
          projectedSpend > 0 && (
            <View style={{ paddingHorizontal: 24, marginBottom: 30 }}>
              <View
                style={{
                  backgroundColor: theme.card,
                  padding: 20,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: "bold",
                      fontSize: scaledSize(14),
                    }}
                  >
                    Estimated Monthly Bill
                  </Text>
                </View>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                    marginBottom: 16,
                  }}
                >
                  {isOverBudget
                    ? `Careful! You are on track to go over your budget by ₱${(projectedSpend - userBudget).toFixed(0)}.`
                    : `Great job! You are on track to save ₱${(userBudget - projectedSpend).toFixed(0)} this month.`}
                </Text>
                <View
                  style={{
                    height: 12,
                    backgroundColor: theme.buttonNeutral,
                    borderRadius: 6,
                    overflow: "hidden",
                    flexDirection: "row",
                    position: "relative",
                  }}
                >
                  <View
                    style={{
                      width: `${currentSpendPercent}%`,
                      height: "100%",
                      backgroundColor: theme.text,
                      zIndex: 2,
                      borderRadius: 6,
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      width: `${projectedSpendPercent}%`,
                      height: "100%",
                      backgroundColor: isOverBudget
                        ? isDarkMode
                          ? "#ff444450"
                          : "#cc000050"
                        : `${theme.buttonPrimary}50`,
                      zIndex: 1,
                      borderRadius: 6,
                    }}
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: scaledSize(12),
                      fontWeight: "600",
                    }}
                  >
                    Expected: ₱{projectedSpend.toFixed(0)}
                  </Text>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(12),
                    }}
                  >
                    Budget: ₱{userBudget.toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>
          )}

        <View style={styles.chartContainer}>
          <View style={styles.gridLinesContainer}>
            <View
              style={[styles.gridLine, { backgroundColor: theme.cardBorder }]}
            />
            <View
              style={[styles.gridLine, { backgroundColor: theme.cardBorder }]}
            />
            <View
              style={[styles.gridLine, { backgroundColor: theme.cardBorder }]}
            />
          </View>
          {chartBars.map((height, idx) => (
            <View
              key={idx}
              style={[
                styles.chartColumn,
                { width: `${100 / chartBars.length}%` },
              ]}
            >
              <View
                style={[
                  styles.chartBar,
                  {
                    height: `${height}%`,
                    backgroundColor: getBarColor(height),
                  },
                ]}
              />
              <Text
                style={[
                  styles.chartLabelText,
                  {
                    color: theme.textSecondary,
                    fontSize: activeTab === "This Year" ? 9 : 10,
                  },
                ]}
              >
                {chartLabels[idx]}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Device Breakdown
          </Text>
          {breakdownData.map((item, i) => (
            <View key={i} style={styles.breakdownItem}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: `${theme.buttonPrimary}15` },
                ]}
              >
                <MaterialIcons
                  name={getCategoryIcon(item.name)}
                  size={24}
                  color={theme.buttonPrimary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", color: theme.text }}>
                  {item.name}
                </Text>
                <Text
                  style={{
                    fontSize: scaledSize(12),
                    color: theme.textSecondary,
                  }}
                >
                  {item.location}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    fontSize: scaledSize(14),
                    fontWeight: "bold",
                    color: theme.text,
                  }}
                >
                  ₱{item.cost.toFixed(2)}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 2,
                  }}
                >
                  {item.percent > 40 && (
                    <MaterialIcons
                      name="local-fire-department"
                      size={12}
                      color={isDarkMode ? "#ffaa00" : "#ff9900"}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text
                    style={{
                      fontSize: scaledSize(11),
                      color: theme.textSecondary,
                    }}
                  >
                    {Math.round(item.percent)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* --- AI SMART COACH CARD --- */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            AI Smart Coach
          </Text>
          <TouchableOpacity
            onPress={handleOpenCoach}
            style={[
              styles.aiCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                padding: 20,
                alignItems: "center",
                flexDirection: "row",
                marginBottom: 16,
              },
            ]}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: `${theme.buttonPrimary}20`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <MaterialIcons
                name="lightbulb"
                size={24}
                color={theme.buttonPrimary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.text,
                  fontWeight: "bold",
                  fontSize: scaledSize(14),
                  marginBottom: 4,
                }}
              >
                Get Advice & Challenges
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(12),
                  paddingRight: 10,
                }}
              >
                Tap to see simple tips and a daily challenge to lower your bill!
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {/* --- ADVANCED AI AUDIT CARD --- */}
          <Text
            style={[styles.sectionTitle, { color: theme.text, marginTop: 10 }]}
          >
            Advanced AI Insights
          </Text>
          <TouchableOpacity
            onPress={handleOpenAudit}
            style={[
              styles.aiCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                padding: 20,
                alignItems: "center",
                flexDirection: "row",
              },
            ]}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isDarkMode ? "#333" : "#f0f0f0",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <MaterialIcons
                name="insights"
                size={24}
                color={isDarkMode ? "#fff" : "#333"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.text,
                  fontWeight: "bold",
                  fontSize: scaledSize(14),
                  marginBottom: 4,
                }}
              >
                Full Energy Audit
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(12),
                  paddingRight: 10,
                }}
              >
                View a professional breakdown with projected savings and
                analysis.
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- 1. AI SMART COACH MODAL --- */}
      <Modal
        visible={showCoachModal}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowCoachModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                width: "92%",
                maxHeight: "85%",
                backgroundColor: theme.background,
                borderColor: theme.cardBorder,
                borderWidth: 1,
              },
            ]}
          >
            <View
              style={{
                padding: 24,
                backgroundColor: isDarkMode ? theme.card : theme.buttonPrimary,
                borderBottomWidth: isDarkMode ? 1 : 0,
                borderBottomColor: theme.cardBorder,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: isDarkMode ? theme.text : "#fff",
                  fontSize: scaledSize(18),
                  fontWeight: "bold",
                  letterSpacing: 0.5,
                }}
              >
                AI Smart Coach
              </Text>
              <Text
                style={{
                  color: isDarkMode
                    ? theme.textSecondary
                    : "rgba(255,255,255,0.8)",
                  fontSize: scaledSize(12),
                  marginTop: 4,
                }}
              >
                {dateRangeText}
              </Text>
            </View>
            <ScrollView
              style={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {isGeneratingCoach ? (
                <View style={{ paddingVertical: 50, alignItems: "center" }}>
                  <ActivityIndicator size="large" color={theme.buttonPrimary} />
                  <Text
                    style={{
                      color: theme.text,
                      marginTop: 16,
                      fontWeight: "600",
                      fontSize: scaledSize(14),
                    }}
                  >
                    Thinking of ideas...
                  </Text>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      marginTop: 8,
                      fontSize: scaledSize(12),
                      textAlign: "center",
                    }}
                  >
                    Looking at your devices to find the best ways to save.
                  </Text>
                </View>
              ) : coachData.rawText ? (
                <Text
                  style={{
                    color: theme.text,
                    fontSize: scaledSize(14),
                    lineHeight: 24,
                    textAlign: "center",
                  }}
                >
                  {coachData.rawText}
                </Text>
              ) : (
                <View>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: scaledSize(14),
                      lineHeight: 22,
                      textAlign: "center",
                      marginBottom: 20,
                    }}
                  >
                    {coachData.summary}
                  </Text>
                  <View
                    style={{
                      backgroundColor: `${theme.buttonPrimary}15`,
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 24,
                      borderWidth: 1,
                      borderColor: `${theme.buttonPrimary}30`,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <MaterialIcons
                        name="stars"
                        size={22}
                        color={isDarkMode ? "#ffaa00" : "#ff9900"}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          color: theme.text,
                          fontSize: scaledSize(14),
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      >
                        Today's Challenge
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: scaledSize(13),
                        lineHeight: 22,
                        marginBottom: 12,
                      }}
                    >
                      {coachData.challenge}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: theme.background,
                        padding: 10,
                        borderRadius: 8,
                      }}
                    >
                      <MaterialIcons
                        name="savings"
                        size={16}
                        color={theme.buttonPrimary}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          color: theme.textSecondary,
                          fontSize: scaledSize(12),
                        }}
                      >
                        Potential Savings:{" "}
                        <Text style={{ color: theme.text, fontWeight: "bold" }}>
                          ₱{coachData.savings}
                        </Text>
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: theme.text,
                        fontSize: scaledSize(14),
                        marginBottom: 12,
                      },
                    ]}
                  >
                    What's Using the Most Power?
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: theme.card,
                      padding: 14,
                      borderRadius: 12,
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <MaterialIcons
                      name="search"
                      size={22}
                      color={isDarkMode ? "#ff4444" : "#cc0000"}
                      style={{ marginRight: 12, marginTop: 2 }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        color: theme.text,
                        fontSize: scaledSize(13),
                        lineHeight: 22,
                      }}
                    >
                      {coachData.consumer}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: theme.text,
                        fontSize: scaledSize(14),
                        marginBottom: 12,
                      },
                    ]}
                  >
                    Quick Tip
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: theme.card,
                      padding: 14,
                      borderRadius: 12,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <MaterialIcons
                      name="wb-sunny"
                      size={22}
                      color={theme.buttonPrimary}
                      style={{ marginRight: 12, marginTop: 2 }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        color: theme.text,
                        fontSize: scaledSize(13),
                        lineHeight: 22,
                      }}
                    >
                      {coachData.tip}
                    </Text>
                  </View>
                </View>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
            <View
              style={{
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: theme.cardBorder,
                flexDirection: "row",
                gap: 12,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowCoachModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: theme.buttonNeutral,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.text,
                    fontWeight: "bold",
                    fontSize: scaledSize(13),
                  }}
                >
                  Close
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={generateCoachSummary}
                disabled={isGeneratingCoach}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: theme.buttonPrimary,
                  alignItems: "center",
                  opacity: isGeneratingCoach ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: scaledSize(13),
                  }}
                >
                  Get New Advice
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- 2. ADVANCED AI AUDIT MODAL --- */}
      <Modal
        visible={showAuditModal}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowAuditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                width: "92%",
                maxHeight: "85%",
                backgroundColor: theme.background,
                borderColor: theme.cardBorder,
                borderWidth: 1,
              },
            ]}
          >
            <View
              style={{
                padding: 24,
                backgroundColor: isDarkMode
                  ? theme.card
                  : isDarkMode
                    ? "#333"
                    : "#2c3e50",
                borderBottomWidth: isDarkMode ? 1 : 0,
                borderBottomColor: theme.cardBorder,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: scaledSize(18),
                  fontWeight: "bold",
                  letterSpacing: 0.5,
                }}
              >
                Smart Audit Report
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: scaledSize(12),
                  marginTop: 4,
                }}
              >
                {dateRangeText}
              </Text>
            </View>
            <ScrollView
              style={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {isGeneratingAudit ? (
                <View style={{ paddingVertical: 50, alignItems: "center" }}>
                  <ActivityIndicator size="large" color={theme.text} />
                  <Text
                    style={{
                      color: theme.text,
                      marginTop: 16,
                      fontWeight: "600",
                      fontSize: scaledSize(14),
                    }}
                  >
                    Auditing Power Data...
                  </Text>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      marginTop: 8,
                      fontSize: scaledSize(12),
                      textAlign: "center",
                    }}
                  >
                    Cross-referencing devices and calculating potential savings.
                  </Text>
                </View>
              ) : auditData.rawText ? (
                <Text
                  style={{
                    color: theme.text,
                    fontSize: scaledSize(14),
                    lineHeight: 24,
                    textAlign: "justify",
                  }}
                >
                  {auditData.rawText}
                </Text>
              ) : (
                <View>
                  <View
                    style={{
                      backgroundColor: theme.card,
                      padding: 16,
                      borderRadius: 12,
                      alignItems: "center",
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: scaledSize(11),
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 4,
                      }}
                    >
                      Projected Monthly Savings
                    </Text>
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: scaledSize(28),
                        fontWeight: "bold",
                      }}
                    >
                      ₱{auditData.savings}
                    </Text>
                  </View>
                  {breakdownData.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          {
                            color: theme.text,
                            fontSize: scaledSize(14),
                            marginBottom: 10,
                          },
                        ]}
                      >
                        TOP DRAINS
                      </Text>
                      {breakdownData.slice(0, 3).map((item, idx) => (
                        <View
                          key={idx}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: theme.text,
                              width: 80,
                              fontSize: scaledSize(12),
                            }}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <View
                            style={{
                              flex: 1,
                              height: 8,
                              backgroundColor: theme.cardBorder,
                              borderRadius: 4,
                              marginHorizontal: 10,
                              overflow: "hidden",
                            }}
                          >
                            <View
                              style={{
                                width: `${item.percent}%`,
                                height: "100%",
                                backgroundColor:
                                  idx === 0
                                    ? isDarkMode
                                      ? "#ff4444"
                                      : "#cc0000"
                                    : theme.textSecondary,
                                borderRadius: 4,
                              }}
                            />
                          </View>
                          <Text
                            style={{
                              color: theme.textSecondary,
                              fontSize: scaledSize(12),
                              width: 40,
                              textAlign: "right",
                            }}
                          >
                            {Math.round(item.percent)}%
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: theme.text,
                        fontSize: scaledSize(14),
                        marginBottom: 8,
                      },
                    ]}
                  >
                    ANALYSIS
                  </Text>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: scaledSize(13),
                      lineHeight: 22,
                      textAlign: "justify",
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>Overview: </Text>
                    {auditData.diagnosis}
                  </Text>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: scaledSize(13),
                      lineHeight: 22,
                      textAlign: "justify",
                      marginBottom: 24,
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>Main Culprit: </Text>
                    {auditData.consumer}
                  </Text>
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: theme.text,
                        fontSize: scaledSize(14),
                        marginBottom: 12,
                      },
                    ]}
                  >
                    ACTION PLAN
                  </Text>
                  {auditData.tips.map((tip, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        backgroundColor: theme.card,
                        padding: 12,
                        borderRadius: 10,
                        marginBottom: 10,
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <MaterialIcons
                        name="arrow-right"
                        size={20}
                        color={theme.text}
                        style={{ marginRight: 10, marginTop: 2 }}
                      />
                      <Text
                        style={{
                          flex: 1,
                          color: theme.text,
                          fontSize: scaledSize(13),
                          lineHeight: 20,
                          textAlign: "justify",
                        }}
                      >
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
            <View
              style={{
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: theme.cardBorder,
                flexDirection: "row",
                gap: 12,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowAuditModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: theme.buttonNeutral,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.text,
                    fontWeight: "bold",
                    fontSize: scaledSize(13),
                  }}
                >
                  Close
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={generateAuditSummary}
                disabled={isGeneratingAudit}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: theme.text,
                  alignItems: "center",
                  opacity: isGeneratingAudit ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    color: theme.background,
                    fontWeight: "bold",
                    fontSize: scaledSize(13),
                  }}
                >
                  Regenerate
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
  },
  scopeToggle: { flexDirection: "row", borderRadius: 20, padding: 4 },
  scopeBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
  timeTabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    marginBottom: 20,
  },
  tab: {
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  totalContainer: { alignItems: "center", marginBottom: 30 },
  dateNavRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  navArrow: { padding: 8 },
  subLabel: { textTransform: "uppercase", fontSize: 10, letterSpacing: 1 },
  totalText: { fontSize: 36, fontWeight: "bold" },
  chartContainer: {
    height: 150,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    marginBottom: 40,
    justifyContent: "space-between",
  },
  gridLinesContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    left: 24,
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  gridLine: { width: "100%", height: 1 },
  chartColumn: { alignItems: "center", zIndex: 1 },
  chartBar: { width: 10, borderRadius: 5, marginBottom: 8, zIndex: 1 },
  chartLabelText: { fontSize: 10 },
  section: { paddingHorizontal: 24, marginBottom: 30 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  aiCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
});
