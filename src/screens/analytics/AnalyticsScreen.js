import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

const ANALYTICS_DATA = {
  Day: {
    total: "₱ 120.50",
    label: "TODAY (JAN 6)",
    comparison: "+5% vs. yesterday",
    bars: [
      { label: "6am", height: "20%" },
      { label: "9am", height: "45%" },
      { label: "12pm", height: "80%", active: true },
      { label: "3pm", height: "60%" },
      { label: "6pm", height: "70%" },
      { label: "9pm", height: "30%" },
    ],

    distribution: [
      {
        name: "1. Air Conditioner",
        cost: "₱ 85.00",
        percent: "70%",
        color: "#00ff99",
      },
      {
        name: "2. Refrigerator",
        cost: "₱ 25.50",
        percent: "21%",
        color: "#0055ff",
      },
      { name: "3. Others", cost: "₱ 10.00", percent: "9%", color: "#ffaa00" },
    ],
  },
  Week: {
    total: "₱ 850.50",
    label: "THIS WEEK (JAN 1 - JAN 7)",
    comparison: "+12% vs. last week",
    bars: [
      { label: "Mon", height: "40%" },
      { label: "Tue", height: "35%" },
      { label: "Wed", height: "70%", active: true },
      { label: "Thu", height: "50%" },
      { label: "Fri", height: "55%" },
      { label: "Sat", height: "20%" },
      { label: "Sun", height: "15%" },
    ],

    distribution: [
      {
        name: "1. Air Conditioner",
        cost: "₱ 552.00",
        percent: "65%",
        color: "#00ff99",
      },
      {
        name: "2. Refrigerator",
        cost: "₱ 212.00",
        percent: "25%",
        color: "#0055ff",
      },
      {
        name: "3. Smart TV",
        cost: "₱ 86.50",
        percent: "10%",
        color: "#ffaa00",
      },
    ],
  },
  Month: {
    total: "₱ 3,240.00",
    label: "THIS MONTH (JANUARY)",
    comparison: "-8% vs. last month",
    bars: [
      { label: "W1", height: "60%" },
      { label: "W2", height: "85%" },
      { label: "W3", height: "40%" },
      { label: "W4", height: "95%", active: true },
    ],

    distribution: [
      {
        name: "1. Air Conditioner",
        cost: "₱ 1,944.00",
        percent: "60%",
        color: "#00ff99",
      },
      {
        name: "2. Refrigerator",
        cost: "₱ 972.00",
        percent: "30%",
        color: "#0055ff",
      },
      {
        name: "3. Washing Machine",
        cost: "₱ 324.00",
        percent: "10%",
        color: "#ffaa00",
      },
    ],
  },
};

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Week");
  const { theme, isDarkMode } = useTheme();

  const currentData = ANALYTICS_DATA[activeTab];

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
        <Text className="text-base font-bold" style={{ color: theme.text }}>
          Energy Insights
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-10 pt-6">
          {}
          <View
            className="flex-row p-1 rounded-xl mb-6"
            style={{ backgroundColor: isDarkMode ? "#222" : "#e0e0e0" }}
          >
            {["Day", "Week", "Month"].map((tab) => (
              <TouchableOpacity
                key={tab}
                className="flex-1 py-2 rounded-lg items-center"
                style={activeTab === tab ? { backgroundColor: theme.card } : {}}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: activeTab === tab ? theme.text : theme.textSecondary,
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <View
            className="items-center mb-8 border-b border-dashed pb-6"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            <Text className="text-[11px] text-[#888] uppercase tracking-widest font-bold mb-1.5">
              {currentData.label}
            </Text>
            <Text
              className="text-4xl font-bold mb-1.5"
              style={{ color: theme.text }}
            >
              {currentData.total}
            </Text>
            <View
              className={`flex-row items-center px-2 py-1 rounded-md gap-1 ${
                currentData.comparison.includes("+")
                  ? "bg-red-500/10"
                  : "bg-green-500/10"
              }`}
            >
              <MaterialIcons
                name={
                  currentData.comparison.includes("+")
                    ? "trending-up"
                    : "trending-down"
                }
                size={14}
                color={
                  currentData.comparison.includes("+") ? "#ff4d4d" : "#00ff99"
                }
              />
              <Text
                style={{
                  color: currentData.comparison.includes("+")
                    ? "#ff4d4d"
                    : "#00ff99",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {currentData.comparison}
              </Text>
            </View>
          </View>

          {}
          <View
            className="flex-row justify-between h-44 items-end mb-8 border-b pb-5 px-2"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            {currentData.bars.map((bar, index) => (
              <Bar
                key={index}
                label={bar.label}
                height={bar.height}
                active={bar.active}
                theme={theme}
                count={currentData.bars.length}
              />
            ))}
          </View>

          <View className="flex-row justify-between items-center mb-5">
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.text }}
            >
              Cost Distribution
            </Text>
            <TouchableOpacity>
              <Text className="text-xs" style={{ color: theme.primary }}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          {}
          {currentData.distribution.map((item, index) => (
            <DistributionItem
              key={index}
              name={item.name}
              cost={item.cost}
              percent={item.percent}
              color={item.color}
              theme={theme}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Bar({ label, height, active, theme, count }) {
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
            backgroundColor: active ? theme.primary : theme.cardBorder,
          }}
        />
      </View>
      <Text
        className="mt-2.5 text-[10px]"
        style={{
          color: active ? theme.text : theme.textSecondary,
          fontWeight: active ? "700" : "500",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function DistributionItem({ name, cost, percent, color, theme }) {
  return (
    <View className="mb-6">
      <View className="flex-row justify-between mb-2">
        <Text
          className="text-sm font-medium"
          style={{ color: theme.textSecondary }}
        >
          {name}
        </Text>
        <Text className="text-sm font-bold" style={{ color: theme.text }}>
          {cost}
        </Text>
      </View>
      <View
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: theme.cardBorder }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: percent, backgroundColor: color }}
        />
      </View>
      <Text
        className="text-[10px] mt-1 text-right"
        style={{ color: theme.textSecondary }}
      >
        {percent}
      </Text>
    </View>
  );
}
