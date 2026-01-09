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

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale, updateFontScale } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const [pushEnabled, setPushEnabled] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [deviceStatus, setDeviceStatus] = useState(true);
  const [tipsNews, setTipsNews] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);

  const handleToggle = (setter, value) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter(!value);
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

      {}
      <View
        className="flex-row items-center px-6 py-5 border-b"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(24)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        <Text
          className="flex-1 text-center font-bold"
          style={{ color: theme.text, fontSize: scaledSize(18) }}
        >
          Notification Preferences
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 p-6">
        {}
        <Text
          className="font-bold uppercase tracking-widest mb-3"
          style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
        >
          Appearance
        </Text>

        <View
          className="rounded-2xl border p-4 mb-6"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <MaterialIcons
                name="text-fields"
                size={scaledSize(20)}
                color={theme.text}
                style={{ marginRight: 10 }}
              />
              <Text
                className="font-semibold"
                style={{ color: theme.text, fontSize: scaledSize(16) }}
              >
                Text Size
              </Text>
            </View>
            <Text
              style={{
                color: theme.buttonPrimary,
                fontSize: scaledSize(14),
                fontWeight: "bold",
              }}
            >
              {fontScale === 0.85
                ? "Small"
                : fontScale === 1
                ? "Standard"
                : "Large"}
            </Text>
          </View>

          {}
          <View className="flex-row gap-3">
            {[
              { label: "Small", value: 0.85 },
              { label: "Standard", value: 1 },
              { label: "Large", value: 1.15 },
            ].map((option) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => updateFontScale(option.value)}
                className="flex-1 items-center justify-center py-3 rounded-xl border"
                style={{
                  backgroundColor:
                    fontScale === option.value
                      ? theme.buttonPrimary
                      : "transparent",
                  borderColor:
                    fontScale === option.value
                      ? theme.buttonPrimary
                      : theme.cardBorder,
                }}
              >
                <Text
                  style={{
                    color: fontScale === option.value ? "#fff" : theme.text,
                    fontSize:
                      option.value === 0.85 ? 12 : option.value === 1 ? 16 : 20,
                    fontWeight: "bold",
                  }}
                >
                  Aa
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {}
        <Text
          className="font-bold uppercase tracking-widest mb-3"
          style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
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
            onToggle={() => handleToggle(setPushEnabled, pushEnabled)}
            theme={theme}
            scaledSize={scaledSize}
            isLast={true}
          />
        </View>

        {}
        <Text
          className="font-bold uppercase tracking-widest mb-3"
          style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
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
            desc="Get notified when you reach limits."
            icon="attach-money"
            value={budgetAlerts}
            onToggle={() => handleToggle(setBudgetAlerts, budgetAlerts)}
            theme={theme}
            scaledSize={scaledSize}
          />
          <ToggleRow
            label="Device Status"
            desc="Alerts when a hub goes offline."
            icon="router"
            value={deviceStatus}
            onToggle={() => handleToggle(setDeviceStatus, deviceStatus)}
            theme={theme}
            scaledSize={scaledSize}
          />
          <ToggleRow
            label="Smart Tips & News"
            desc="Energy saving recommendations."
            icon="lightbulb"
            value={tipsNews}
            onToggle={() => handleToggle(setTipsNews, tipsNews)}
            theme={theme}
            scaledSize={scaledSize}
            isLast={true}
          />
        </View>

        {}
        <Text
          className="font-bold uppercase tracking-widest mb-3"
          style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
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
            desc="Receive a summary via email."
            icon="email"
            value={emailDigest}
            onToggle={() => handleToggle(setEmailDigest, emailDigest)}
            theme={theme}
            scaledSize={scaledSize}
            isLast={true}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
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

function ToggleRow({
  label,
  desc,
  icon,
  value,
  onToggle,
  theme,
  scaledSize,
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
            backgroundColor: theme.buttonNeutral,
          }}
        >
          <MaterialIcons name={icon} size={scaledSize(20)} color={theme.text} />
        </View>
        <View className="flex-1">
          <Text
            className="font-semibold mb-0.5"
            style={{ color: theme.text, fontSize: scaledSize(14) }}
          >
            {label}
          </Text>
          <Text
            className="leading-4"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            {desc}
          </Text>
        </View>
      </View>

      {}
      <CustomSwitch value={value} onToggle={onToggle} theme={theme} />
    </View>
  );
}
