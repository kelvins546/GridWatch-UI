import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function BudgetDeviceListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode, fontScale } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const { hubName } = route.params || { hubName: "Smart Hub" };

  const devices = [
    {
      id: "ac",
      name: "Air Conditioner",
      icon: "ac-unit",
      status: "₱ 1,450 / ₱ 2,000 (Monthly)",
      type: "good",
    },
    {
      id: "tv",
      name: "Smart TV",
      icon: "tv",
      status: "Over Limit (113%)",
      type: "warn",
    },
    {
      id: "fridge",
      name: "Refrigerator",
      icon: "kitchen",
      status: "No Limit Set",
      type: "neutral",
    },
    {
      id: "outlet",
      name: "Outlet 3",
      icon: "power-off",
      status: "Offline - Short Circuit",
      type: "critical",
      isLocked: true,
    },
    {
      id: "fan",
      name: "Electric Fan",
      icon: "mode-fan-off",
      status: "Standby",
      type: "neutral",
    },
  ];

  const handleDevicePress = (device) => {
    if (device.id === "tv") {
      navigation.navigate("LimitDetail");
    } else {
      navigation.navigate("BudgetDetail", { deviceName: device.name });
    }
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
        className="flex-row items-center justify-between px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(18)}
            color={theme.textSecondary}
          />
          <Text
            className="font-medium ml-1"
            style={{ color: theme.textSecondary, fontSize: scaledSize(14) }}
          >
            Back
          </Text>
        </TouchableOpacity>
        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(16) }}
        >
          Budget Management
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="mb-6 leading-5"
          style={{ color: theme.textSecondary, fontSize: scaledSize(13) }}
        >
          Select a device from{" "}
          <Text style={{ fontWeight: "700", color: theme.buttonPrimary }}>
            {hubName}
          </Text>{" "}
          to configure spending limits, automation rules, and alerts.
        </Text>

        <View className="gap-3">
          {devices.map((device) => (
            <DeviceRow
              key={device.id}
              data={device}
              theme={theme}
              isDarkMode={isDarkMode}
              scaledSize={scaledSize}
              onPress={() => handleDevicePress(device)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DeviceRow({ data, theme, isDarkMode, onPress, scaledSize }) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  let iconColor, iconBg, statusTextColor;

  if (data.type === "good") {
    iconColor = theme.buttonPrimary;
    iconBg = `${theme.buttonPrimary}22`;
    statusTextColor = iconColor;
  } else if (data.type === "warn") {
    iconColor = isDarkMode ? "#ffaa00" : "#b37400";
    iconBg = isDarkMode ? "rgba(255, 170, 0, 0.15)" : "rgba(179, 116, 0, 0.1)";
    statusTextColor = iconColor;
  } else if (data.type === "critical") {
    iconColor = isDarkMode ? "#ff4444" : "#c62828";
    iconBg = isDarkMode ? "rgba(255, 68, 68, 0.15)" : "rgba(198, 40, 40, 0.1)";
    statusTextColor = iconColor;
  } else {
    iconColor = theme.textSecondary;
    iconBg = theme.buttonNeutral;
    statusTextColor = theme.textSecondary;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={!data.isLocked ? onPress : null}
      onPressIn={!data.isLocked ? handlePressIn : null}
      onPressOut={!data.isLocked ? handlePressOut : null}
      style={{ marginBottom: 12 }}
    >
      <Animated.View
        className="flex-row items-center justify-between p-4 rounded-2xl border"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          transform: [{ scale: scaleValue }],
          opacity: data.isLocked ? 0.6 : 1,
        }}
      >
        <View className="flex-row items-center gap-4">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: iconBg }}
          >
            <MaterialIcons
              name={data.icon}
              size={scaledSize(22)}
              color={iconColor}
            />
          </View>

          <View className="gap-0.5">
            <Text
              className="font-semibold"
              style={{ color: theme.text, fontSize: scaledSize(14) }}
            >
              {data.name}
            </Text>
            <Text
              className="font-medium"
              style={{ color: statusTextColor, fontSize: scaledSize(11) }}
            >
              {data.status}
            </Text>
          </View>
        </View>

        <MaterialIcons
          name={data.isLocked ? "lock" : "chevron-right"}
          size={scaledSize(20)}
          color={theme.textSecondary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}
