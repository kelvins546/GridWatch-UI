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
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [deviceStatus, setDeviceStatus] = useState(true);
  const [tipsNews, setTipsNews] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);

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

      {}
      <View
        className="flex-row items-center px-6 py-5 border-b"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        <Text
          className="flex-1 text-center text-base font-bold"
          style={{ color: theme.text }}
        >
          Notification Preferences
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 p-6">
        <Text
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: theme.textSecondary }}
        >
          General
        </Text>

        <View
          className="rounded-2xl border overflow-hidden mb-6"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
        >
          <ToggleRow
            label="Push Notifications"
            desc="Enable or disable all app notifications."
            icon="notifications-active"
            value={pushEnabled}
            onValueChange={setPushEnabled}
            theme={theme}
            isDarkMode={isDarkMode}
            isLast={true}
          />
        </View>

        <Text
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: theme.textSecondary }}
        >
          Alert Types
        </Text>

        <View
          className="rounded-2xl border overflow-hidden mb-6"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
        >
          <ToggleRow
            label="Budget & Cost Alerts"
            desc="Get notified when you reach 50%, 80%, or 100% of your budget."
            icon="attach-money"
            value={budgetAlerts}
            onValueChange={setBudgetAlerts}
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <ToggleRow
            label="Device Status"
            desc="Alerts when a hub goes offline or a device is unreachable."
            icon="router"
            value={deviceStatus}
            onValueChange={setDeviceStatus}
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <ToggleRow
            label="Smart Tips & News"
            desc="Energy saving recommendations and app updates."
            icon="lightbulb"
            value={tipsNews}
            onValueChange={setTipsNews}
            theme={theme}
            isDarkMode={isDarkMode}
            isLast={true}
          />
        </View>

        <Text
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: theme.textSecondary }}
        >
          Other
        </Text>

        <View
          className="rounded-2xl border overflow-hidden mb-6"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
        >
          <ToggleRow
            label="Monthly Email Digest"
            desc="Receive a summary of your energy usage via email."
            icon="email"
            value={emailDigest}
            onValueChange={setEmailDigest}
            theme={theme}
            isDarkMode={isDarkMode}
            isLast={true}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  desc,
  icon,
  value,
  onValueChange,
  theme,
  isDarkMode,
  isLast,
}) {
  return (
    <View
      className={`p-4 flex-row justify-between items-center ${
        !isLast ? "border-b" : ""
      }`}
      style={{ borderColor: theme.cardBorder }}
    >
      <View className="flex-1 flex-row items-start mr-4">
        <View
          className="w-9 h-9 rounded-full justify-center items-center mr-3"
          style={{
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0,0,0,0.05)",
          }}
        >
          <MaterialIcons name={icon} size={20} color={theme.text} />
        </View>
        <View className="flex-1">
          <Text
            className="text-sm font-semibold mb-0.5"
            style={{ color: theme.text }}
          >
            {label}
          </Text>
          <Text
            className="text-[11px] leading-4"
            style={{ color: theme.textSecondary }}
          >
            {desc}
          </Text>
        </View>
      </View>
      <Switch
        trackColor={{
          false: "#d1d1d1",
          true: isDarkMode ? "rgba(0, 255, 153, 0.2)" : "rgba(0, 153, 94, 0.2)",
        }}
        thumbColor={value ? theme.primary : "#f4f3f4"}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );
}
