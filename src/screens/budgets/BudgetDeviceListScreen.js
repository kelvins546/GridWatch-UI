import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  StyleSheet,
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
      currentLoad: "₱ 1,450",
      limit: "₱ 2,000",
      statusText: "72% Used",
      type: "good",
    },
    {
      id: "tv",
      name: "Smart TV",
      icon: "tv",
      currentLoad: "₱ 452",
      limit: "₱ 400",
      statusText: "Over Limit (113%)",
      type: "warn",
    },
    {
      id: "fridge",
      name: "Refrigerator",
      icon: "kitchen",
      currentLoad: "₱ 850",
      limit: "No Limit",
      statusText: "Running Normal",
      type: "neutral",
    },
    {
      id: "outlet",
      name: "Outlet 3",
      icon: "power-off",
      currentLoad: "₱ 0.00",
      limit: "₱ 500",
      statusText: "Offline - Short Circuit",
      type: "critical",
    },
    {
      id: "fan",
      name: "Electric Fan",
      icon: "mode-fan-off",
      currentLoad: "₱ 120",
      limit: "₱ 300",
      statusText: "Standby",
      type: "neutral",
    },
  ];

  const handleDevicePress = (device) => {
    if (device.type === "critical") {
      navigation.navigate("FaultDetail", {
        deviceName: device.name,
        status: device.statusText,
      });
    } else if (device.id === "tv") {
      navigation.navigate("LimitDetail");
    } else {
      navigation.navigate("BudgetDetail", { deviceName: device.name });
    }
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

      {/* HEADER */}
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
          Budget Management
        </Text>
        <View style={{ width: scaledSize(20) + 8 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            marginBottom: 20,
            lineHeight: 20,
            color: theme.textSecondary,
            fontSize: scaledSize(13),
          }}
        >
          Select a device from{" "}
          <Text style={{ fontWeight: "700", color: theme.buttonPrimary }}>
            {hubName}
          </Text>{" "}
          to configure spending limits, automation rules, and alerts.
        </Text>

        <View style={{ gap: 12 }}>
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
      toValue: 0.98,
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

  // Determining Colors based on status
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
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ marginBottom: 0 }}
    >
      <Animated.View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          // MATCHING HUB CARD STYLE
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          transform: [{ scale: scaleValue }],
          opacity: data.isLocked ? 0.6 : 1,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {/* ICON BOX - Matching HubCard Size */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: iconBg,
              marginRight: 16,
            }}
          >
            <MaterialIcons
              name={data.icon}
              size={scaledSize(22)}
              color={iconColor}
            />
          </View>

          {/* TEXT CONTENT */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text
              style={{
                color: theme.text,
                fontSize: scaledSize(14),
                fontWeight: "700", // Bold title like HubCard
                marginBottom: 2,
              }}
            >
              {data.name}
            </Text>

            {/* SUBTITLE ROW (Status / Load) */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(11),
                }}
              >
                {data.currentLoad}
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(10),
                  marginHorizontal: 4,
                }}
              >
                •
              </Text>
              <Text
                style={{
                  color: statusTextColor,
                  fontSize: scaledSize(11),
                  fontWeight: "500",
                }}
              >
                {data.statusText}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Arrow */}
        <MaterialIcons
          name={data.isLocked ? "lock" : "chevron-right"}
          size={scaledSize(20)}
          color={theme.textSecondary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}
