import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function BudgetDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();

  const { deviceName } = route.params || { deviceName: "Air Conditioner" };

  const [period, setPeriod] = useState("Monthly");
  const [limit, setLimit] = useState(2000);
  const [autoCutoff, setAutoCutoff] = useState(true);

  const usedAmount = 1450.75;
  const percentage = Math.min((usedAmount / limit) * 100, 100).toFixed(0);
  const remaining = Math.max(limit - usedAmount, 0).toFixed(2);

  const adjustLimit = (amount) =>
    setLimit((prev) => Math.max(0, prev + amount));

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
        className="flex-row items-center justify-between px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity
          className="flex-row items-center gap-1.5"
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
          {deviceName}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text
            className="text-sm font-semibold"
            style={{ color: theme.primary }}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View className="p-6">
          <Text
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary }}
          >
            Budget Period
          </Text>
          <View
            className="flex-row p-1 rounded-xl mb-8"
            style={{ backgroundColor: theme.card }}
          >
            {["Daily", "Weekly", "Monthly"].map((item) => (
              <TouchableOpacity
                key={item}
                className="flex-1 py-2 rounded-lg items-center justify-center"
                style={
                  period === item && {
                    backgroundColor: isDarkMode ? "#333" : "#fff",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 1,
                    elevation: 1,
                  }
                }
                onPress={() => setPeriod(item)}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: period === item ? theme.text : theme.textSecondary,
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary }}
          >
            Set Limit (Pesos)
          </Text>
          <View
            className="flex-row items-center justify-between p-5 rounded-[20px] border mb-8"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: isDarkMode ? "#333" : "#eee" }}
              onPress={() => adjustLimit(-100)}
            >
              <MaterialIcons name="remove" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text
              className="text-[28px] font-bold"
              style={{ color: theme.text }}
            >
              ₱ {limit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </Text>

            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: isDarkMode ? "#333" : "#eee" }}
              onPress={() => adjustLimit(100)}
            >
              <MaterialIcons name="add" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <Text
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary }}
          >
            Current Usage Status
          </Text>
          <View className="mb-8">
            <View className="flex-row justify-between mb-2">
              <Text
                className="text-[13px]"
                style={{ color: theme.textSecondary }}
              >
                Used: ₱ {usedAmount.toLocaleString()}
              </Text>
              <Text
                className="text-[13px] font-bold"
                style={{ color: theme.primary }}
              >
                {percentage}%
              </Text>
            </View>

            <View
              className="h-3 rounded-full overflow-hidden mb-2"
              style={{ backgroundColor: isDarkMode ? "#333" : "#e0e0e0" }}
            >
              <View
                className="h-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: theme.primary,
                }}
              />
            </View>

            <View className="flex-row justify-between">
              <Text
                className="text-[11px]"
                style={{ color: theme.textSecondary }}
              >
                Remaining: ₱ {remaining}
              </Text>
              <Text
                className="text-[11px]"
                style={{ color: theme.textSecondary }}
              >
                Resets in: 12 Days
              </Text>
            </View>
          </View>

          <Text
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary }}
          >
            Automation Rules
          </Text>

          <RuleItem
            title="Auto-Cutoff Power"
            desc="If limit is reached, automatically turn off the device to save cost."
            value={autoCutoff}
            onToggle={setAutoCutoff}
            theme={theme}
            isDarkMode={isDarkMode}
          />

          <RuleItem
            title="Push Notifications"
            desc="Receive alerts when usage hits 80%, 90%, and 100% of limit."
            value={true}
            onToggle={() => {}}
            disabled={true}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RuleItem({
  title,
  desc,
  value,
  onToggle,
  disabled,
  theme,
  isDarkMode,
}) {
  return (
    <View
      className="flex-row items-center justify-between p-4 rounded-2xl mb-3"
      style={{
        backgroundColor: theme.card,
        opacity: disabled ? 0.8 : 1,
      }}
    >
      <View className="flex-1 mr-4">
        <Text
          className="text-sm font-semibold mb-1"
          style={{ color: theme.text }}
        >
          {title}{" "}
          {disabled && (
            <Text
              className="text-[10px] font-bold"
              style={{ color: theme.primary }}
            >
              (Always On)
            </Text>
          )}
        </Text>
        <Text
          className="text-[11px] leading-4"
          style={{ color: theme.textSecondary }}
        >
          {desc}
        </Text>
      </View>
      <Switch
        disabled={disabled}
        trackColor={{
          false: "#767577",
          true: isDarkMode ? "rgba(0, 255, 153, 0.2)" : "rgba(0, 153, 94, 0.2)",
        }}
        thumbColor={value ? theme.primary : "#f4f3f4"}
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );
}
