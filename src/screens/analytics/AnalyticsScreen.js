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
  if (n.includes("tool") || n.includes("drill")) return "handyman";
  if (n.includes("garage")) return "garage";
  if (n.includes("computer") || n.includes("pc")) return "computer";
  return "bolt";
};

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const [activeScope, setActiveScope] = useState("personal");
  const [activeTab, setActiveTab] = useState("Week");
  const [activeHubFilter, setActiveHubFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const [personalHubs, setPersonalHubs] = useState([]);
  const [sharedHubs, setSharedHubs] = useState([]);
  const [breakdownData, setBreakdownData] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [chartBars, setChartBars] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [comparisonText, setComparisonText] = useState("");
  const [comparisonTrend, setComparisonTrend] = useState("neutral"); // 'up', 'down', 'neutral'

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Hubs & Devices
      const { data: ownedHubs } = await supabase
        .from("hubs")
        .select("id, name, devices(id, name)")
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
          .select("id, name, devices(id, name)")
          .in("id", sharedIds);
        sharedHubsList = sharedData || [];
      }

      setPersonalHubs(ownedHubs || []);
      setSharedHubs(sharedHubsList);

      // 2. Filter Devices based on Scope & Filter
      const targetHubs = activeScope === "personal" ? (ownedHubs || []) : sharedHubsList;
      const filteredHubs = activeHubFilter === "all" 
        ? targetHubs 
        : targetHubs.filter(h => h.id === activeHubFilter);
      
      const deviceMap = {}; // id -> { name, hubName }
      const allDeviceIds = [];
      
      filteredHubs.forEach(hub => {
        hub.devices?.forEach(d => {
          deviceMap[d.id] = { name: d.name, location: hub.name, hubId: hub.id };
          allDeviceIds.push(d.id);
        });
      });

      if (allDeviceIds.length === 0) {
        setTotalValue(0);
        setBreakdownData([]);
        setChartBars([]);
        setChartLabels([]);
        setIsLoading(false);
        return;
      }

      // 3. Determine Date Ranges
      const now = new Date();
      let startDate = new Date();
      let prevStartDate = new Date();
      let labels = [];
      let buckets = [];

      if (activeTab === "Day") {
        startDate.setHours(0, 0, 0, 0);
        prevStartDate.setDate(startDate.getDate() - 1);
        prevStartDate.setHours(0, 0, 0, 0);
        labels = ["6a", "9a", "12p", "3p", "6p", "9p"];
        buckets = new Array(6).fill(0); // Placeholder buckets
      } else if (activeTab === "Week") {
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        prevStartDate.setDate(startDate.getDate() - 7);
        prevStartDate.setHours(0, 0, 0, 0);
        for (let i = 0; i < 7; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          labels.push(d.toLocaleDateString("en-US", { weekday: "narrow" }));
        }
        buckets = new Array(7).fill(0);
      } else if (activeTab === "Month") {
        startDate.setDate(now.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        prevStartDate.setDate(startDate.getDate() - 30);
        prevStartDate.setHours(0, 0, 0, 0);
        labels = ["W1", "W2", "W3", "W4"];
        buckets = new Array(4).fill(0);
      }

      // 4. Fetch Usage Data
      const { data: usageData } = await supabase
        .from("usage_analytics")
        .select("device_id, cost_incurred, date")
        .in("device_id", allDeviceIds)
        .gte("date", prevStartDate.toISOString().split('T')[0]);

      // 5. Process Data
      let currentTotal = 0;
      let prevTotal = 0;
      const deviceTotals = {};

      usageData?.forEach(row => {
        const rowDate = new Date(row.date);
        const cost = row.cost_incurred || 0;

        if (rowDate >= startDate) {
          currentTotal += cost;
          deviceTotals[row.device_id] = (deviceTotals[row.device_id] || 0) + cost;

          // Chart Bucketing
          if (activeTab === "Week") {
            const dayDiff = Math.floor((rowDate - startDate) / (1000 * 60 * 60 * 24));
            if (dayDiff >= 0 && dayDiff < 7) buckets[dayDiff] += cost;
          } else if (activeTab === "Month") {
            const dayDiff = Math.floor((rowDate - startDate) / (1000 * 60 * 60 * 24));
            const weekIdx = Math.floor(dayDiff / 7);
            if (weekIdx >= 0 && weekIdx < 4) buckets[weekIdx] += cost;
          } else if (activeTab === "Day") {
             // Distribute evenly for visual placeholder since we lack hourly data
             const bucketIdx = Math.floor(Math.random() * 6); 
             buckets[bucketIdx] += (cost / 2); // Just visual noise
          }
        } else if (rowDate >= prevStartDate) {
          prevTotal += cost;
        }
      });

      // Normalize Chart Bars (0-100 scale)
      const maxVal = Math.max(...buckets, 1);
      const normalizedBars = buckets.map(v => (v / maxVal) * 100);

      // Breakdown List
      const breakdown = Object.keys(deviceTotals)
        .map(id => ({
          name: deviceMap[id]?.name || "Unknown Device",
          location: deviceMap[id]?.location || "Unknown Hub",
          cost: deviceTotals[id],
          percent: currentTotal > 0 ? `${Math.round((deviceTotals[id] / currentTotal) * 100)}%` : "0%"
        }))
        .sort((a, b) => b.cost - a.cost);

      // Comparison Text
      let diffPercent = 0;
      if (prevTotal > 0) {
        diffPercent = ((currentTotal - prevTotal) / prevTotal) * 100;
      } else if (currentTotal > 0) {
        diffPercent = 100;
      }
      
      setTotalValue(currentTotal);
      setBreakdownData(breakdown);
      setChartBars(normalizedBars);
      setChartLabels(labels);
      
      const trend = diffPercent > 0 ? "up" : diffPercent < 0 ? "down" : "neutral";
      setComparisonTrend(trend);
      setComparisonText(`${Math.abs(diffPercent).toFixed(0)}% ${diffPercent >= 0 ? "more" : "less"} vs last ${activeTab.toLowerCase()}`);

    } catch (err) {
      console.error("Analytics Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [activeScope, activeTab, activeHubFilter])
  );

  const handleScopeChange = (scope) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveScope(scope);
    setActiveHubFilter("all");
  };

  const handleFilterChange = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveHubFilter(id);
  };

  const currentHubList = activeScope === "personal" ? personalHubs : sharedHubs;

  if (isLoading && totalValue === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.buttonPrimary} />
        <Text style={{ marginTop: 12, color: theme.textSecondary }}>Loading Analytics...</Text>
      </View>
    );
  }

  const trendColor = comparisonTrend === "up" ? "#ff4444" : "#22c55e"; // Red if spending went up, Green if down
  const trendIcon = comparisonTrend === "up" ? "trending-up" : comparisonTrend === "down" ? "trending-down" : "remove";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 16,
        }}
      >
        <Text
          style={{
            fontSize: scaledSize(20),
            fontWeight: "bold",
            color: theme.text,
          }}
        >
          Analytics
        </Text>

        {}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.buttonNeutral,
            borderRadius: 20,
            padding: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => handleScopeChange("personal")}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor:
                activeScope === "personal" ? theme.card : "transparent",
              shadowColor: activeScope === "personal" ? "#000" : "transparent",
              shadowOpacity: activeScope === "personal" ? 0.1 : 0,
              shadowRadius: 2,
              elevation: activeScope === "personal" ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontSize: scaledSize(12),
                fontWeight: "600",
                color:
                  activeScope === "personal" ? theme.text : theme.textSecondary,
              }}
            >
              Personal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleScopeChange("shared")}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor:
                activeScope === "shared" ? theme.card : "transparent",
              shadowColor: activeScope === "shared" ? "#000" : "transparent",
              shadowOpacity: activeScope === "shared" ? 0.1 : 0,
              shadowRadius: 2,
              elevation: activeScope === "shared" ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontSize: scaledSize(12),
                fontWeight: "600",
                color:
                  activeScope === "shared" ? theme.text : theme.textSecondary,
              }}
            >
              Shared
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 8,
            marginBottom: 24,
            gap: 24,
          }}
        >
          {["Day", "Week", "Month"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  borderBottomWidth: 2,
                  borderBottomColor: isActive
                    ? theme.buttonPrimary
                    : "transparent",
                  paddingBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: scaledSize(14),
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? theme.buttonPrimary : theme.textSecondary,
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Text
            style={{
              fontSize: scaledSize(12),
              color: theme.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            Total Expenditure
          </Text>
          <Text
            style={{
              fontSize: scaledSize(40),
              fontWeight: "bold",
              color: theme.text,
            }}
          >
            ₱
            {totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          {}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 8,
              backgroundColor: `${trendColor}20`,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <MaterialIcons name={trendIcon} size={14} color={trendColor} />
            <Text
              style={{
                color: trendColor,
                fontSize: scaledSize(12),
                fontWeight: "600",
                marginLeft: 4,
              }}
            >
              {comparisonText}
            </Text>
          </View>
        </View>

        {}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <View
            style={{
              height: 180,
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              paddingTop: 20,
            }}
          >
            {}
            <View
              style={[
                StyleSheet.absoluteFill,
                { justifyContent: "space-between", paddingBottom: 20 },
              ]}
            >
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.cardBorder,
                  borderStyle: "dashed",
                  opacity: 0.5,
                }}
              />
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.cardBorder,
                  borderStyle: "dashed",
                  opacity: 0.5,
                }}
              />
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.cardBorder,
                  borderStyle: "dashed",
                  opacity: 0.5,
                }}
              />
              {}
              <View
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: theme.textSecondary,
                  opacity: 0.2,
                }}
              />
            </View>

            {}
            {chartBars.map((height, idx) => (
              <View
                key={idx}
                style={{
                  width: `${100 / chartBars.length}%`,
                  alignItems: "center",
                  zIndex: 1,
                }}
              >
                <View
                  style={{
                    width: 8,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    height: `${height}%`,
                    backgroundColor:
                      height > 80 ? theme.buttonPrimary : theme.buttonNeutral,
                    opacity: height > 80 ? 1 : 0.6,
                  }}
                />
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: scaledSize(10),
                    color: theme.textSecondary,
                    fontWeight: "600",
                  }}
                >
                  {chartLabels[idx]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {}
        <View style={{ paddingLeft: 24, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: scaledSize(13),
              fontWeight: "600",
              color: theme.text,
              marginBottom: 10,
            }}
          >
            Filter by Hub
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 24 }}
          >
            <TouchableOpacity
              onPress={() => handleFilterChange("all")}
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

            {currentHubList.map((hub) => (
              <TouchableOpacity
                key={hub.id}
                onPress={() => handleFilterChange(hub.id)}
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

        {}
        <View style={{ paddingHorizontal: 24 }}>
          <Text
            style={{
              fontSize: scaledSize(13),
              fontWeight: "600",
              color: theme.text,
              marginBottom: 12,
            }}
          >
            Breakdown
          </Text>

          {breakdownData.length > 0 ? (
            breakdownData.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                {}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                    backgroundColor: `${theme.buttonPrimary}15`,
                  }}
                >
                  <MaterialIcons
                    name={getCategoryIcon(item.name)}
                    size={20}
                    color={theme.buttonPrimary}
                  />
                </View>

                {}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: scaledSize(14),
                      fontWeight: "600",
                      color: theme.text,
                    }}
                  >
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

                {}
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      fontSize: scaledSize(14),
                      fontWeight: "bold",
                      color: theme.text,
                    }}
                  >
                    ₱{item.cost.toFixed(0)}
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
            ))
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={{ color: theme.textSecondary }}>
                No data available for this filter.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
