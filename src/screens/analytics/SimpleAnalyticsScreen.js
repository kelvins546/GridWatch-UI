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

// --- HUB LISTS ---
const PERSONAL_HUBS = [
  { id: "living", name: "Living Room" },
  { id: "kitchen", name: "Kitchen" },
];

// --- RAW DATA (Personal Only) ---
const RAW_DATA = {
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
};

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

export default function SimpleAnalyticsScreen() {
  const navigation = useNavigation();
  const { theme, fontScale, isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState("Week");
  const [activeHubFilter, setActiveHubFilter] = useState("all");

  const scaledSize = (size) => size * (fontScale || 1);

  // --- DYNAMIC CALCULATION ---
  const currentHubList = PERSONAL_HUBS;
  const rawDataList = RAW_DATA[activeTab];

  const filteredData =
    activeHubFilter === "all"
      ? rawDataList
      : rawDataList.filter((item) => item.hubId === activeHubFilter);

  const totalValue = filteredData.reduce((acc, item) => acc + item.cost, 0);

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

  const handleFilterChange = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveHubFilter(id);
  };

  const handleTabChange = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  // --- STYLES ---
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingVertical: 20,
      backgroundColor: theme.background,
    },
    headerTitleWrapper: {
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    headerText: {
      fontWeight: "bold",
      color: theme.text,
      fontSize: scaledSize(16),
    },
    scrollContent: {
      paddingBottom: 100,
    },
    section: {
      paddingHorizontal: 24,
      paddingBottom: 10,
      paddingTop: 6,
    },
    // Filter Chip Styles
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    chipText: {
      fontWeight: "bold",
      fontSize: scaledSize(11),
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Menu")}
          style={{ padding: 4 }}
        >
          <MaterialIcons
            name="menu"
            size={scaledSize(28)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerText}>Energy Insights</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications")}
          style={{ padding: 4 }}
        >
          <MaterialIcons
            name="notifications-none"
            size={scaledSize(28)}
            color={theme.text}
          />
          <View
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              backgroundColor: "#ff4d4d",
              width: 14,
              height: 14,
              borderRadius: 7,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: theme.background,
            }}
          >
            <Text style={{ color: "white", fontSize: 8, fontWeight: "bold" }}>
              2
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          {/* --- HUB FILTER CHIPS (Personal Only) --- */}
          <View style={{ marginBottom: 20, marginTop: 0 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              // Changed back to standard left alignment by removing justifyContent: center
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {/* 'All' Chip */}
              <TouchableOpacity
                onPress={() => handleFilterChange("all")}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      activeHubFilter === "all"
                        ? theme.buttonPrimary
                        : theme.card,
                    borderColor:
                      activeHubFilter === "all"
                        ? theme.buttonPrimary
                        : theme.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        activeHubFilter === "all"
                          ? "#fff"
                          : theme.textSecondary,
                    },
                  ]}
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
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive
                          ? theme.buttonPrimary
                          : theme.card,
                        borderColor: isActive
                          ? theme.buttonPrimary
                          : theme.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isActive ? "#fff" : theme.textSecondary },
                      ]}
                    >
                      {hub.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* --- TIME PERIOD SELECTOR (Segmented Style) --- */}
          <View
            style={{
              flexDirection: "row",
              padding: 4,
              borderRadius: 12,
              marginBottom: 32,
              backgroundColor: theme.buttonNeutral,
            }}
          >
            {["Day", "Week", "Month"].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => handleTabChange(tab)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isActive ? theme.card : "transparent",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isActive ? 0.1 : 0,
                    shadowRadius: 2,
                    elevation: isActive ? 2 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: scaledSize(12),
                      color: isActive ? theme.text : theme.textSecondary,
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
            style={{
              alignItems: "center",
              marginBottom: 32,
              borderBottomWidth: 1,
              borderStyle: "dashed",
              paddingBottom: 24,
              borderColor: theme.cardBorder,
            }}
          >
            <Text
              style={{
                textTransform: "uppercase",
                letterSpacing: 2,
                fontWeight: "bold",
                marginBottom: 6,
                color: theme.textSecondary,
                fontSize: scaledSize(11),
              }}
            >
              {labelMap[activeTab]}
            </Text>
            <Text
              style={{
                fontWeight: "bold",
                marginBottom: 6,
                color: theme.text,
                fontSize: scaledSize(36),
              }}
            >
              ₱{" "}
              {totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                gap: 4,
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
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              height: 176,
              alignItems: "flex-end",
              marginBottom: 32,
              borderBottomWidth: 1,
              paddingBottom: 20,
              paddingHorizontal: 8,
              borderColor: theme.cardBorder,
            }}
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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                color: theme.text,
                fontSize: scaledSize(14),
              }}
            >
              Cost Distribution (
              {activeHubFilter === "all" ? "All Hubs" : "Selected"})
            </Text>
            <TouchableOpacity>
              <Text
                style={{
                  color: theme.buttonPrimary,
                  fontSize: scaledSize(12),
                }}
              >
                See All
              </Text>
            </TouchableOpacity>
          </View>

          {filteredData.length > 0 ? (
            filteredData.map((item, index) => (
              <DistributionItem
                key={index}
                name={item.name}
                location={item.location}
                cost={"₱ " + item.cost.toFixed(2)}
                percent={item.percent}
                color={theme.text}
                theme={theme}
                scaledSize={scaledSize}
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
      style={{
        alignItems: "center",
        height: "100%",
        justifyContent: "flex-end",
        width: barWidth,
      }}
    >
      <View style={{ width: 10, height: "100%", justifyContent: "flex-end" }}>
        <View
          style={{
            width: "100%",
            borderRadius: 999,
            height: height,
            backgroundColor: active ? theme.buttonPrimary : theme.cardBorder,
          }}
        />
      </View>
      <Text
        style={{
          marginTop: 10,
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
  cost,
  percent,
  color,
  theme,
  scaledSize,
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <View>
          <Text
            style={{
              fontWeight: "500",
              marginBottom: 4,
              color: theme.textSecondary,
              fontSize: scaledSize(14),
            }}
          >
            {name}
          </Text>
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
        <Text
          style={{
            fontWeight: "bold",
            color: theme.text,
            fontSize: scaledSize(14),
          }}
        >
          {cost}
        </Text>
      </View>

      <View
        style={{
          height: 6,
          width: "100%",
          borderRadius: 999,
          overflow: "hidden",
          marginTop: 4,
          backgroundColor: theme.cardBorder,
        }}
      >
        <View
          style={{
            height: "100%",
            borderRadius: 999,
            width: percent,
            backgroundColor: color,
          }}
        />
      </View>

      <Text
        style={{
          marginTop: 4,
          textAlign: "right",
          color: theme.textSecondary,
          fontSize: scaledSize(10),
        }}
      >
        {percent}
      </Text>
    </View>
  );
}
