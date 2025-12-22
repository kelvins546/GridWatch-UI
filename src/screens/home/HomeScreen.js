import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

import { requestNotificationPermission } from "./src/services/notifications";

const HUBS_DATA = [
  {
    id: "hub1",
    name: "Living Room Hub",
    active: 4,
    total: 4,
    devices: [
      {
        id: 1,
        name: "Air Conditioner",
        cost: "₱ 18.20 / hr",
        watts: "1456 W",
        icon: "ac-unit",
        type: "normal",
        tag: "DAILY",
      },
      {
        id: 2,
        name: "Smart TV",
        cost: "₱ 1.50 / hr",
        watts: "120 W",
        icon: "tv",
        type: "warning",
        tag: "LIMIT",
      },
      {
        id: 3,
        name: "Outlet 3",
        cost: "Check Circuit",
        watts: "0 W",
        icon: "power-off",
        type: "critical",
        tag: "ERROR",
      },
      {
        id: 4,
        name: "Electric Fan",
        cost: "Standby",
        watts: "0 W",
        icon: "mode-fan-off",
        type: "off",
        tag: "WEEKLY",
      },
    ],
  },
  {
    id: "hub2",
    name: "Kitchen Hub",
    active: 2,
    total: 2,
    devices: [
      {
        id: 5,
        name: "Refrigerator",
        cost: "₱ 2.10 / hr",
        watts: "150 W",
        icon: "kitchen",
        type: "normal",
        tag: "24/7",
      },
      {
        id: 6,
        name: "Microwave",
        cost: "Standby",
        watts: "0 W",
        icon: "microwave",
        type: "off",
        tag: "MANUAL",
      },
    ],
  },
];

export default function HomeScreen() {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => navigation.navigate("DndCheck"), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const animateButton = (toValue) => {
    Animated.spring(scaleAnim, {
      toValue,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
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
        className="flex-row justify-between items-center px-6 py-5"
        style={{ backgroundColor: theme.background }}
      >
        <TouchableOpacity onPress={() => navigation.navigate("Menu")}>
          <MaterialIcons name="menu" size={28} color={theme.textSecondary} />
        </TouchableOpacity>

        <Image
          source={require("../../../assets/GridWatch-logo.png")}
          className="w-8 h-8"
          resizeMode="contain"
        />

        <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
          <MaterialIcons
            name="notifications-none"
            size={28}
            color={theme.text}
          />
          <View
            className="absolute -top-0.5 -right-0.5 bg-[#ff4d4d] rounded-[7px] w-3.5 h-3.5 justify-center items-center border-2"
            style={{ borderColor: theme.background }}
          >
            <Text className="text-white text-[8px] font-bold">2</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerClassName="pb-24"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 mb-5">
          <Text
            className="text-sm font-medium mb-1"
            style={{ color: theme.textSecondary }}
          >
            Good Evening, Natasha
          </Text>
          <View className="flex-row items-center">
            <View
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: theme.primary }}
            />
            <Text
              className="text-xs font-semibold"
              style={{ color: theme.text }}
            >
              All Systems Normal
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => navigation.navigate("MonthlyBudget")}
          onPressIn={() => animateButton(0.96)}
          onPressOut={() => animateButton(1)}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <LinearGradient
              colors={
                isDarkMode ? ["#252525", "#1e1e1e"] : ["#ffffff", "#f2f2f7"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="mx-6 rounded-3xl p-6 mb-8 border"
              style={{ borderColor: theme.cardBorder }}
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-[11px] text-[#888] uppercase font-semibold tracking-widest mb-2">
                  Current Spending (MTD)
                </Text>
                <MaterialIcons
                  name="edit"
                  size={16}
                  color={theme.textSecondary}
                />
              </View>

              <Text
                className="text-4xl font-bold mb-1"
                style={{ color: theme.text }}
              >
                ₱ 1,450.75
              </Text>
              <Text
                className="text-[13px] mb-5"
                style={{ color: theme.textSecondary }}
              >
                Total Load:{" "}
                <Text className="font-bold" style={{ color: theme.text }}>
                  1.46 kWh
                </Text>
              </Text>

              <View
                className="h-2 rounded-full w-full mb-2 overflow-hidden"
                style={{ backgroundColor: isDarkMode ? "#333" : "#e5e5ea" }}
              >
                <LinearGradient
                  colors={
                    isDarkMode ? ["#0055ff", "#00ff99"] : ["#0055ff", "#00995e"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-full rounded-full w-[52%]"
                />
              </View>
              <Text
                className="text-right text-[11px] font-semibold"
                style={{ color: theme.primary }}
              >
                52% of Budget
              </Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        {HUBS_DATA.map((hub) => (
          <View key={hub.id} className="mb-5">
            <Text
              className="text-[13px] font-semibold uppercase tracking-wider mb-3 px-6"
              style={{ color: theme.textSecondary }}
            >
              {hub.name} ({hub.active}/{hub.total})
            </Text>
            <View className="flex-row flex-wrap justify-between px-6">
              {hub.devices.map((device) => (
                <DeviceItem
                  key={device.id}
                  data={device}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  onPress={() => {
                    const target =
                      device.type === "critical"
                        ? "FaultDetail"
                        : "DeviceControl";
                    navigation.navigate(target, {
                      deviceName: device.name,
                      status: device.cost,
                    });
                  }}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const DeviceItem = ({ data, theme, isDarkMode, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

  let colors = {
    bg: theme.card,
    border: theme.cardBorder,
    icon: theme.primary,
    iconBg: isDarkMode ? "rgba(0, 255, 153, 0.1)" : "rgba(0, 153, 94, 0.1)",
    cost: theme.primary,
    tag: theme.textSecondary,
    tagBg: theme.background,
  };

  if (data.type === "warning") {
    const yellow = isDarkMode ? "#ffaa00" : "#b37400";
    colors = {
      ...colors,
      bg: isDarkMode ? "rgba(255, 170, 0, 0.05)" : "rgba(179, 116, 0, 0.05)",
      icon: yellow,
      iconBg: "rgba(255, 170, 0, 0.15)",
      cost: yellow,
      tag: yellow,
    };
  } else if (data.type === "critical") {
    const red = isDarkMode ? "#ff4444" : "#c62828";
    colors = {
      ...colors,
      bg: isDarkMode ? "rgba(255, 68, 68, 0.05)" : "rgba(198, 40, 40, 0.05)",
      icon: red,
      iconBg: "rgba(255, 68, 68, 0.15)",
      cost: red,
      tag: red,
    };
  } else if (data.type === "off") {
    colors = {
      ...colors,
      icon: theme.textSecondary,
      cost: theme.textSecondary,
    };
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      activeOpacity={1}
      className="w-[48%] mb-4"
    >
      <Animated.View
        className="w-full rounded-[20px] p-4 h-[140px] justify-between border"
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          transform: [{ scale }],
        }}
      >
        <View className="flex-row justify-between items-start">
          <View
            className="w-8 h-8 rounded-[10px] justify-center items-center"
            style={{ backgroundColor: colors.iconBg }}
          >
            <MaterialIcons name={data.icon} size={18} color={colors.icon} />
          </View>
          <View
            className="px-1.5 py-1 rounded-md"
            style={{ backgroundColor: colors.tagBg }}
          >
            <Text
              className="text-[9px] font-bold"
              style={{ color: colors.tag }}
            >
              {data.tag}
            </Text>
          </View>
        </View>
        <View>
          <Text
            className="text-[13px] font-semibold mb-1"
            style={{ color: theme.text }}
          >
            {data.name}
          </Text>
          <Text
            className="text-[13px] font-semibold mb-0.5"
            style={{ color: colors.cost }}
          >
            {data.cost}
          </Text>
          <Text className="text-[10px]" style={{ color: theme.textSecondary }}>
            {data.watts}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};
