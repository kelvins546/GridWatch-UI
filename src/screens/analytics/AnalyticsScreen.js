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
  const [activeTab, setActiveTab] = useState("This Week");
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

  const faultLogs = [
    {
      id: 1,
      type: "Limit",
      device: "Air Conditioner",
      msg: "Daily budget limit (₱150) reached. Auto-cutoff triggered.",
      date: "Feb 16, 2026 • 14:30",
      color: "#ffaa00",
    },
    {
      id: 2,
      type: "Fault",
      device: "Washing Machine",
      msg: "Short circuit detected on Outlet 2. Safe shutdown completed.",
      date: "Feb 14, 2026 • 09:15",
      color: "#ff4444",
    },
  ];

  const getBarColor = (percent) => {
    if (percent > 80) return isDarkMode ? "#ff4444" : "#cc0000"; // Red
    if (percent > 50) return isDarkMode ? "#ffaa00" : "#ff9900"; // Yellow
    return theme.buttonPrimary; // Green
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
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

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

      // --- DATE LOGIC ---
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
          // --- AS REQUESTED: PUT ALL DATA INTO 12PM BUCKET ---
          // Index 3 corresponds to the "12pm" label in the labels array
          buckets[3] += cost;
        }
      });

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
              currentTotal > 0
                ? `${Math.round((deviceTotals[id] / currentTotal) * 100)}%`
                : "0%",
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

  const sourceHubs = activeScope === "personal" ? personalHubs : sharedHubs;

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
            Breakdown
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
                <Text
                  style={{
                    fontSize: scaledSize(11),
                    color: theme.textSecondary,
                  }}
                >
                  {item.percent}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Limit & Fault Events
          </Text>
          {faultLogs.map((log) => (
            <View
              key={log.id}
              style={[
                styles.logCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}
            >
              <View
                style={[styles.logIndicator, { backgroundColor: log.color }]}
              />
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text
                  style={{
                    color: theme.text,
                    fontWeight: "bold",
                    fontSize: 13,
                  }}
                >
                  {log.device} - {log.type}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                  {log.msg}
                </Text>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 10,
                    marginTop: 4,
                  }}
                >
                  {log.date}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 15 },
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
  logCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  logIndicator: { width: 4, height: "100%", borderRadius: 2 },
});
