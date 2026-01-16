import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function BudgetDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode, fontScale } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const { deviceName } = route.params || { deviceName: "Air Conditioner" };

  const [period, setPeriod] = useState("Monthly");
  const [limit, setLimit] = useState("2000");
  const [autoCutoff, setAutoCutoff] = useState(true);

  const [pushNotifications, setPushNotifications] = useState(true);

  // --- SIMULATION DATA ---
  const globalBudget = 3000; // Your Global Goal
  const otherDevicesLimit = 1500; // Total limits of ALL OTHER devices
  const currentDeviceLimit = parseFloat(limit) || 0;
  const totalAllocated = otherDevicesLimit + currentDeviceLimit;

  // Logic: Does this specific device push the total over the global goal?
  const isOverAllocated = totalAllocated > globalBudget;

  const primaryColor = isDarkMode ? theme.buttonPrimary : "#00995e";
  const dangerColor = isDarkMode ? theme.buttonDangerText : "#cc0000";

  const usedAmount = 1450.75;
  const numericLimit = parseFloat(limit) || 0;

  const percentage =
    numericLimit > 0
      ? Math.min((usedAmount / numericLimit) * 100, 100).toFixed(0)
      : 100;

  const remaining = Math.max(numericLimit - usedAmount, 0).toFixed(2);

  const adjustLimit = (amount) => {
    const current = parseFloat(limit) || 0;
    const next = Math.max(0, current + amount);
    setLimit(next.toString());
  };

  const handleLimitChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setLimit(cleaned);
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

      {/* --- UPDATED HEADER --- */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 20,
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
          backgroundColor: theme.background,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 4 }}
        >
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(20)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <Text
          style={{
            color: theme.text,
            fontSize: scaledSize(18),
            fontWeight: "bold",
          }}
        >
          {deviceName}
        </Text>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 4 }}
        >
          <Text
            style={{
              color: theme.buttonPrimary,
              fontSize: scaledSize(14),
              fontWeight: "bold",
            }}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
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
                  className="font-semibold"
                  style={{
                    color: period === item ? theme.text : theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
          >
            Set Limit (Pesos)
          </Text>
          <View
            className="flex-row items-center justify-between p-5 rounded-[20px] border mb-4"
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
              <MaterialIcons
                name="remove"
                size={scaledSize(24)}
                color={theme.text}
              />
            </TouchableOpacity>

            <View className="flex-row items-center">
              <Text
                className="font-bold mr-1"
                style={{ color: theme.text, fontSize: scaledSize(28) }}
              >
                ₱
              </Text>
              <TextInput
                value={limit}
                onChangeText={handleLimitChange}
                keyboardType="numeric"
                className="font-bold text-center"
                style={{
                  color: theme.text,
                  fontSize: scaledSize(28),
                  minWidth: 80,
                }}
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: isDarkMode ? "#333" : "#eee" }}
              onPress={() => adjustLimit(100)}
            >
              <MaterialIcons
                name="add"
                size={scaledSize(24)}
                color={theme.text}
              />
            </TouchableOpacity>
          </View>

          {/* --- [ADDED] BUDGET HEALTH WARNING --- */}
          <View
            className="p-3 rounded-xl border mb-8"
            style={{
              backgroundColor: isOverAllocated
                ? isDarkMode
                  ? "rgba(255,68,68,0.1)"
                  : "rgba(255,200,200,0.3)"
                : isDarkMode
                ? "rgba(0,153,94,0.1)"
                : "rgba(200,255,220,0.3)",
              borderColor: isOverAllocated ? dangerColor : primaryColor,
            }}
          >
            <View className="flex-row items-center">
              <MaterialIcons
                name={isOverAllocated ? "warning" : "check-circle"}
                size={16}
                color={isOverAllocated ? dangerColor : primaryColor}
              />
              <Text
                className="font-bold ml-2"
                style={{
                  color: isOverAllocated ? dangerColor : primaryColor,
                  fontSize: scaledSize(12),
                }}
              >
                {isOverAllocated ? "Exceeds Global Goal" : "Within Global Goal"}
              </Text>
            </View>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: scaledSize(11),
                marginTop: 4,
                lineHeight: 16,
              }}
            >
              {isOverAllocated
                ? `This limit combined with others (₱${otherDevicesLimit}) exceeds your global goal of ₱${globalBudget}.`
                : "This limit fits safely within your overall budget goal."}
            </Text>
          </View>
          {/* ------------------------------------- */}

          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
          >
            Current Usage Status
          </Text>
          <View className="mb-8">
            <View className="flex-row justify-between mb-2">
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(13),
                }}
              >
                Used: ₱ {usedAmount.toLocaleString()}
              </Text>
              <Text
                className="font-bold"
                style={{
                  color: theme.buttonPrimary,
                  fontSize: scaledSize(13),
                }}
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
                  backgroundColor: theme.buttonPrimary,
                }}
              />
            </View>

            <View className="flex-row justify-between">
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(11),
                }}
              >
                Remaining: ₱ {remaining}
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(11),
                }}
              >
                Resets in: 12 Days
              </Text>
            </View>
          </View>

          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
          >
            Automation Rules
          </Text>

          <RuleItem
            title="Auto-Cutoff Power"
            desc="If limit is reached, automatically turn off the device to save cost."
            value={autoCutoff}
            onToggle={() => setAutoCutoff(!autoCutoff)}
            theme={theme}
            scaledSize={scaledSize}
          />

          <RuleItem
            title="Push Notifications"
            desc="Receive alerts when usage hits 80%, 90%, and 100% of limit."
            value={pushNotifications}
            onToggle={() => setPushNotifications(!pushNotifications)}
            disabled={false}
            theme={theme}
            scaledSize={scaledSize}
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
  scaledSize,
}) {
  return (
    <View
      className="flex-row items-center justify-between p-4 rounded-2xl mb-3"
      style={{
        backgroundColor: theme.card,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <View className="flex-1 mr-4">
        <Text
          className="font-semibold mb-1"
          style={{ color: theme.text, fontSize: scaledSize(14) }}
        >
          {title}{" "}
          {disabled && (
            <Text
              className="font-bold"
              style={{
                color: theme.buttonPrimary,
                fontSize: scaledSize(10),
              }}
            >
              (Always On)
            </Text>
          )}
        </Text>
        <Text
          className="leading-4"
          style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
        >
          {desc}
        </Text>
      </View>

      {/* Switch */}
      <CustomSwitch
        value={value}
        onToggle={disabled ? null : onToggle}
        theme={theme}
      />
    </View>
  );
}

function CustomSwitch({ value, onToggle, theme }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      style={{
        width: 42,
        height: 26,
        borderRadius: 16,
        backgroundColor: value ? theme.buttonPrimary : theme.buttonNeutral,
        padding: 2,
        justifyContent: "center",
        alignItems: value ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 2.5,
          elevation: 2,
        }}
      />
    </TouchableOpacity>
  );
}
