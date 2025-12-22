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

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Week");
  const { theme, isDarkMode } = useTheme();

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <View
        className="flex-row items-center justify-between px-6 py-5"
        style={{ backgroundColor: theme.background }}
      >
        <TouchableOpacity
          className="flex-row items-center gap-1"
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={18}
            color={theme.textSecondary}
          />
          <Text
            className="text-sm font-medium"
            style={{ color: theme.textSecondary }}
          >
            Back
          </Text>
        </TouchableOpacity>
        <Text className="text-base font-bold" style={{ color: theme.text }}>
          Analytics & Trends
        </Text>
        <View className="w-[60px]" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-10">
          <View
            className="flex-row p-1 rounded-xl mb-6"
            style={{ backgroundColor: isDarkMode ? "#222" : "#e0e0e0" }}
          >
            {["Day", "Week", "Month"].map((tab) => (
              <TouchableOpacity
                key={tab}
                className={`flex-1 py-2 rounded-lg items-center ${
                  activeTab === tab ? "bg-[#333]" : ""
                }`}
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

          <View
            className="items-center mb-8 border-b border-dashed pb-6"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            <Text className="text-[11px] text-[#888] uppercase tracking-widest font-bold mb-1.5">
              TOTAL SPENDING (NOV 1 - NOV 7)
            </Text>
            <Text
              className="text-4xl font-bold mb-1.5"
              style={{ color: theme.text }}
            >
              ₱ 850.50
            </Text>
            <View className="flex-row items-center bg-red-500/10 px-2 py-1 rounded-md gap-1">
              <MaterialIcons name="trending-up" size={14} color="#ff4d4d" />
              <Text className="text-[#ff4d4d] text-xs font-semibold">
                +12% vs. last week
              </Text>
            </View>
          </View>

          <View
            className="flex-row justify-between h-44 items-end mb-8 border-b pb-5"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            <Bar label="Mon" height="40%" theme={theme} />
            <Bar label="Tue" height="35%" theme={theme} />
            <Bar label="Wed" height="70%" active theme={theme} />
            <Bar label="Thu" height="50%" theme={theme} />
            <Bar label="Fri" height="55%" theme={theme} />
            <Bar label="Sat" height="20%" theme={theme} />
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

          <DistributionItem
            name="1. Air Conditioner"
            cost="₱ 552.00"
            percent="65%"
            color={theme.primary}
            theme={theme}
          />

          <DistributionItem
            name="2. Refrigerator"
            cost="₱ 212.00"
            percent="25%"
            color="#0055ff"
            theme={theme}
          />
          <DistributionItem
            name="3. Smart TV"
            cost="₱ 86.50"
            percent="10%"
            color="#ffaa00"
            theme={theme}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Bar({ label, height, active, theme }) {
  return (
    <View className="items-center w-[14%] h-full justify-end">
      <View className="w-2 h-full justify-end">
        <View
          className="w-full rounded-full"
          style={{
            height: height,
            backgroundColor: active ? theme.text : theme.cardBorder,
          }}
        />
      </View>
      <Text
        className="mt-2.5 text-[11px]"
        style={{
          color: active ? theme.text : theme.textSecondary,
          fontWeight: active ? "700" : "400",
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
          // CHANGED: text-sm (14px)
          className="text-sm font-medium"
          style={{ color: theme.textSecondary }}
        >
          {name}
        </Text>
        <Text
          // CHANGED: text-sm (14px)
          className="text-sm font-bold"
          style={{ color: theme.text }}
        >
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
