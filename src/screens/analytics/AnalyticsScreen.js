import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- CONSTANTS ---
const PERSONAL_HUBS = [
  { id: "living", name: "Living Room" },
  { id: "kitchen", name: "Kitchen" },
];

const SHARED_HUBS = [
  { id: "francis", name: "Francis' Garage", owner: "Francis Gian" },
  { id: "cielo", name: "Cielo's House", owner: "Cielo Cortado" },
];

const RAW_DATA = {
  personal: {
    Day: [
      {
        name: "Air Conditioner",
        location: "Living Room",
        hubId: "living",
        cost: 85.0,
        percent: "70%",
      },
      {
        name: "Refrigerator",
        location: "Kitchen",
        hubId: "kitchen",
        cost: 25.5,
        percent: "21%",
      },
      {
        name: "Others",
        location: "Various",
        hubId: "living",
        cost: 10.0,
        percent: "9%",
      },
    ],
    Week: [
      {
        name: "Air Conditioner",
        location: "Living Room",
        hubId: "living",
        cost: 552.0,
        percent: "65%",
      },
      {
        name: "Refrigerator",
        location: "Kitchen",
        hubId: "kitchen",
        cost: 212.0,
        percent: "25%",
      },
      {
        name: "Smart TV",
        location: "Living Room",
        hubId: "living",
        cost: 86.5,
        percent: "10%",
      },
    ],
    Month: [
      {
        name: "Air Conditioner",
        location: "Living Room",
        hubId: "living",
        cost: 1944.0,
        percent: "60%",
      },
      {
        name: "Refrigerator",
        location: "Kitchen",
        hubId: "kitchen",
        cost: 972.0,
        percent: "30%",
      },
      {
        name: "Washing Machine",
        location: "Living Room",
        hubId: "living",
        cost: 324.0,
        percent: "10%",
      },
    ],
  },
  shared: {
    Day: [
      {
        name: "Power Tools",
        location: "Francis' Garage",
        hubId: "francis",
        owner: "Francis Gian",
        cost: 35.0,
        percent: "78%",
      },
      {
        name: "Garage Light",
        location: "Francis' Garage",
        hubId: "francis",
        owner: "Francis Gian",
        cost: 10.0,
        percent: "22%",
      },
      {
        name: "Main AC",
        location: "Cielo's House",
        hubId: "cielo",
        owner: "Cielo Cortado",
        cost: 125.0,
        percent: "100%",
      },
    ],
    Week: [
      {
        name: "Main AC",
        location: "Cielo's House",
        hubId: "cielo",
        owner: "Cielo Cortado",
        cost: 250.0,
        percent: "60%",
      },
      {
        name: "Power Tools",
        location: "Francis' Garage",
        hubId: "francis",
        owner: "Francis Gian",
        cost: 170.5,
        percent: "40%",
      },
    ],
    Month: [
      {
        name: "Main AC",
        location: "Cielo's House",
        hubId: "cielo",
        owner: "Cielo Cortado",
        cost: 1200.0,
        percent: "65%",
      },
      {
        name: "Garage Ops",
        location: "Francis' Garage",
        hubId: "francis",
        owner: "Francis Gian",
        cost: 650.0,
        percent: "35%",
      },
    ],
  },
};

// --- HELPER: Get Icon based on device name ---
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
  return "bolt"; // Default fallback
};

// Mock Bar Heights
const getBars = (tab) => {
  if (tab === "Day") return [20, 45, 90, 60, 70, 30];
  if (tab === "Week") return [40, 35, 70, 50, 55, 20, 15];
  return [60, 85, 40, 95];
};

const getBarLabels = (tab) => {
  if (tab === "Day") return ["6a", "9a", "12p", "3p", "6p", "9p"];
  if (tab === "Week") return ["M", "T", "W", "T", "F", "S", "S"];
  return ["W1", "W2", "W3", "W4"];
};

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const [activeScope, setActiveScope] = useState("personal");
  const [activeTab, setActiveTab] = useState("Week");
  const [activeHubFilter, setActiveHubFilter] = useState("all");

  const currentHubList =
    activeScope === "personal" ? PERSONAL_HUBS : SHARED_HUBS;
  const rawDataList = RAW_DATA[activeScope][activeTab];

  const filteredData =
    activeHubFilter === "all"
      ? rawDataList
      : rawDataList.filter((item) => item.hubId === activeHubFilter);

  const totalValue = filteredData.reduce((acc, item) => acc + item.cost, 0);
  const bars = getBars(activeTab);
  const labels = getBarLabels(activeTab);

  const handleScopeChange = (scope) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveScope(scope);
    setActiveHubFilter("all");
  };

  const handleFilterChange = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveHubFilter(id);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* --- HEADER --- */}
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

        {/* --- PILL SWITCHER --- */}
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
        {/* --- TIME PERIOD TABS --- */}
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

        {/* --- HERO: TOTAL COST --- */}
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
          {/* Simple Trend Indicator */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 8,
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <MaterialIcons name="trending-up" size={14} color="#22c55e" />
            <Text
              style={{
                color: "#22c55e",
                fontSize: scaledSize(12),
                fontWeight: "600",
                marginLeft: 4,
              }}
            >
              +12% vs last {activeTab.toLowerCase()}
            </Text>
          </View>
        </View>

        {/* --- UPDATED GRAPH (With Grid Lines) --- */}
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
            {/* Background Grid Lines */}
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
              {/* X-Axis Line */}
              <View
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: theme.textSecondary,
                  opacity: 0.2,
                }}
              />
            </View>

            {/* Bars */}
            {bars.map((height, idx) => (
              <View
                key={idx}
                style={{
                  width: `${100 / bars.length}%`,
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
                  {labels[idx]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- FILTER CHIPS --- */}
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

        {/* --- BREAKDOWN LIST (Dynamic Icons) --- */}
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

          {filteredData.length > 0 ? (
            filteredData.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                {/* Dynamic Icon Box */}
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
                    name={getCategoryIcon(item.name)} // DYNAMIC ICON HERE
                    size={20}
                    color={theme.buttonPrimary}
                  />
                </View>

                {/* Details */}
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

                {/* Cost & Bar */}
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
