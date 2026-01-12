import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
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

// --- HUB LISTS FOR CHIPS ---
const PERSONAL_HUBS = [
  { id: "living", name: "Living Room" },
  { id: "kitchen", name: "Kitchen" },
];

const SHARED_HUBS = [
  { id: "francis", name: "Francis' Garage", owner: "Francis Gian" },
  { id: "cielo", name: "Cielo's House", owner: "Cielo Cortado" },
];

// --- RAW DATA (Source of Truth) ---
const RAW_DATA = {
  // PERSONAL DATA
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
  // SHARED DATA
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

// Mock Bar Data Generator
const getBars = (tab, filterId) => {
  if (tab === "Day")
    return [
      { label: "6am", height: filterId === "all" ? "20%" : "10%" },
      { label: "9am", height: filterId === "all" ? "45%" : "30%" },
      {
        label: "12pm",
        height: filterId === "all" ? "80%" : "90%",
        active: true,
      },
      { label: "3pm", height: filterId === "all" ? "60%" : "40%" },
      { label: "6pm", height: "70%" },
      { label: "9pm", height: "30%" },
    ];
  if (tab === "Week")
    return [
      { label: "Mon", height: "40%" },
      { label: "Tue", height: "35%" },
      { label: "Wed", height: "70%", active: true },
      { label: "Thu", height: "50%" },
      { label: "Fri", height: "55%" },
      { label: "Sat", height: "20%" },
      { label: "Sun", height: "15%" },
    ];
  return [
    { label: "W1", height: "60%" },
    { label: "W2", height: "85%" },
    { label: "W3", height: "40%" },
    { label: "W4", height: "95%", active: true },
  ];
};

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();

  const [activeScope, setActiveScope] = useState("personal"); // 'personal' | 'shared'
  const [activeTab, setActiveTab] = useState("Week"); // 'Day', 'Week', 'Month'
  const [activeHubFilter, setActiveHubFilter] = useState("all");

  const scaledSize = (size) => size * (fontScale || 1);

  // --- DYNAMIC CALCULATION ---
  const currentHubList =
    activeScope === "personal" ? PERSONAL_HUBS : SHARED_HUBS;
  const rawDataList = RAW_DATA[activeScope][activeTab];

  // 1. Filter Data based on selected Hub Chip
  const filteredData =
    activeHubFilter === "all"
      ? rawDataList
      : rawDataList.filter((item) => item.hubId === activeHubFilter);

  // 2. Calculate Total
  const totalValue = filteredData.reduce((acc, item) => acc + item.cost, 0);

  // 3. Labels
  const labelMap = { Day: "TODAY", Week: "THIS WEEK", Month: "THIS MONTH" };
  const comparisonMap = {
    Day: "yesterday",
    Week: "last week",
    Month: "last month",
  };

  const isPositive = activeHubFilter === "all";
  const comparisonText = isPositive
    ? `+12% vs. ${comparisonMap[activeTab]}`
    : `-5% vs. ${comparisonMap[activeTab]}`;

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
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      <View
        className="flex-row items-center justify-center px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(16) }}
        >
          Energy Insights
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-10 pt-6">
          {/* --- SCOPE TOGGLE (Personal / Shared) --- */}
          <View
            className="flex-row p-1 rounded-xl mb-4"
            style={{ backgroundColor: theme.buttonNeutral }}
          >
            <TouchableOpacity
              onPress={() => handleScopeChange("personal")}
              className="flex-1 py-2 rounded-lg items-center justify-center"
              style={{
                backgroundColor:
                  activeScope === "personal" ? theme.card : "transparent",
                shadowColor:
                  activeScope === "personal" ? "#000" : "transparent",
                shadowOpacity: activeScope === "personal" ? 0.1 : 0,
                shadowRadius: 2,
                elevation: activeScope === "personal" ? 2 : 0,
              }}
            >
              <Text
                className="font-bold"
                style={{
                  color:
                    activeScope === "personal"
                      ? theme.text
                      : theme.textSecondary,
                  fontSize: scaledSize(12),
                }}
              >
                My Hubs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleScopeChange("shared")}
              className="flex-1 py-2 rounded-lg items-center justify-center"
              style={{
                backgroundColor:
                  activeScope === "shared" ? theme.card : "transparent",
                shadowColor: activeScope === "shared" ? "#000" : "transparent",
                shadowOpacity: activeScope === "shared" ? 0.1 : 0,
                shadowRadius: 2,
                elevation: activeScope === "shared" ? 2 : 0,
              }}
            >
              <Text
                className="font-bold"
                style={{
                  color:
                    activeScope === "shared" ? theme.text : theme.textSecondary,
                  fontSize: scaledSize(12),
                }}
              >
                Shared
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- HUB FILTER CHIPS (Horizontal Scroll) --- */}
          <View style={{ marginBottom: 20 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              <TouchableOpacity
                onPress={() => handleFilterChange("all")}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  marginRight: 8,
                  backgroundColor:
                    activeHubFilter === "all"
                      ? theme.buttonPrimary
                      : theme.card,
                  borderColor:
                    activeHubFilter === "all"
                      ? theme.buttonPrimary
                      : theme.cardBorder,
                }}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: scaledSize(11),
                    color:
                      activeHubFilter === "all" ? "#fff" : theme.textSecondary,
                  }}
                >
                  All
                </Text>
              </TouchableOpacity>

              {currentHubList.map((hub) => {
                const isActive = activeHubFilter === hub.id;
                return (
                  <TouchableOpacity
                    key={hub.id}
                    onPress={() => handleFilterChange(hub.id)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      marginRight: 8,
                      backgroundColor: isActive
                        ? theme.buttonPrimary
                        : theme.card,
                      borderColor: isActive
                        ? theme.buttonPrimary
                        : theme.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: scaledSize(11),
                        color: isActive ? "#fff" : theme.textSecondary,
                      }}
                    >
                      {activeScope === "shared"
                        ? hub.name.split(" ")[0] + "'s"
                        : hub.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* --- TIME PERIOD PILLS --- */}
          <View className="flex-row justify-between mb-8 mt-2">
            {["Day", "Week", "Month"].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className="flex-1 mx-1 py-1.5 rounded-full items-center justify-center border"
                  style={{
                    backgroundColor: isActive
                      ? theme.buttonPrimary
                      : "transparent",
                    borderColor: isActive
                      ? theme.buttonPrimary
                      : theme.cardBorder,
                  }}
                >
                  <Text
                    className="font-bold uppercase"
                    style={{
                      fontSize: scaledSize(10),
                      color: isActive ? "#FFFFFF" : theme.textSecondary,
                    }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* --- TOTAL & COMPARISON --- */}
          <View
            className="items-center mb-8 border-b border-dashed pb-6"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            <Text
              className="uppercase tracking-widest font-bold mb-1.5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
            >
              {labelMap[activeTab]}
            </Text>
            <Text
              className="font-bold mb-1.5"
              style={{ color: theme.text, fontSize: scaledSize(36) }}
            >
              ₱{" "}
              {totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>

            <View
              className="flex-row items-center px-2 py-1 rounded-md gap-1"
              style={{
                backgroundColor: isPositive
                  ? `${theme.buttonDangerText}1A`
                  : `${theme.buttonPrimary}1A`,
              }}
            >
              <MaterialIcons
                name={isPositive ? "trending-up" : "trending-down"}
                size={scaledSize(14)}
                color={
                  isPositive ? theme.buttonDangerText : theme.buttonPrimary
                }
              />
              <Text
                style={{
                  color: isPositive
                    ? theme.buttonDangerText
                    : theme.buttonPrimary,
                  fontSize: scaledSize(12),
                  fontWeight: "600",
                }}
              >
                {comparisonText}
              </Text>
            </View>
          </View>

          {/* --- BAR CHART --- */}
          <View
            className="flex-row justify-between h-44 items-end mb-8 border-b pb-5 px-2"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            {getBars(activeTab, activeHubFilter).map((bar, index) => (
              <Bar
                key={index}
                label={bar.label}
                height={bar.height}
                active={bar.active}
                theme={theme}
                scaledSize={scaledSize}
                count={getBars(activeTab, activeHubFilter).length}
              />
            ))}
          </View>

          {/* --- DISTRIBUTION LIST --- */}
          <View className="flex-row justify-between items-center mb-5">
            <Text
              className="font-semibold"
              style={{ color: theme.text, fontSize: scaledSize(14) }}
            >
              Cost Distribution (
              {activeHubFilter === "all"
                ? activeScope === "shared"
                  ? "All Shared"
                  : "All Hubs"
                : "Selected"}
              )
            </Text>
          </View>

          {filteredData.length > 0 ? (
            filteredData.map((item, index) => (
              <DistributionItem
                key={index}
                name={item.name}
                location={item.location}
                owner={item.owner}
                cost={"₱ " + item.cost.toFixed(2)}
                percent={item.percent}
                color={theme.text}
                theme={theme}
                scaledSize={scaledSize}
                isShared={activeScope === "shared"}
              />
            ))
          ) : (
            <Text
              style={{
                color: theme.textSecondary,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              No data for this selection.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Bar({ label, height, active, theme, scaledSize, count }) {
  const barWidth = count > 10 ? "8%" : count > 5 ? "12%" : "20%";
  return (
    <View
      className="items-center h-full justify-end"
      style={{ width: barWidth }}
    >
      <View className="w-2.5 h-full justify-end">
        <View
          className="w-full rounded-full"
          style={{
            height: height,
            backgroundColor: active ? theme.buttonPrimary : theme.cardBorder,
          }}
        />
      </View>
      <Text
        className="mt-2.5"
        style={{
          color: active ? theme.text : theme.textSecondary,
          fontWeight: active ? "700" : "500",
          fontSize: scaledSize(10),
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function DistributionItem({
  name,
  location,
  owner,
  cost,
  percent,
  color,
  theme,
  scaledSize,
  isShared,
}) {
  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text
            className="font-medium mb-1" // Added margin-bottom for spacing
            style={{ color: theme.textSecondary, fontSize: scaledSize(14) }}
          >
            {name}
          </Text>

          {/* --- USER ICON LOGIC (FIXED) --- */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {isShared && owner && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: theme.buttonNeutral, // High contrast background
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  marginRight: 6,
                }}
              >
                <MaterialIcons
                  name="person"
                  size={scaledSize(10)}
                  color={theme.text}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    color: theme.text,
                    fontSize: scaledSize(10),
                    fontWeight: "bold",
                  }}
                >
                  {owner.split(" ")[0]}
                </Text>
              </View>
            )}
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: scaledSize(10),
                opacity: 0.7,
              }}
            >
              {location}
            </Text>
          </View>
          {/* ----------------------- */}
        </View>

        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(14) }}
        >
          {cost}
        </Text>
      </View>

      <View
        className="h-1.5 w-full rounded-full overflow-hidden mt-1"
        style={{ backgroundColor: theme.cardBorder }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: percent, backgroundColor: color }}
        />
      </View>

      <Text
        className="mt-1 text-right"
        style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
      >
        {percent}
      </Text>
    </View>
  );
}
