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
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function BudgetManagerScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  const hubs = [
    {
      id: "living",
      name: "Living Room Hub",
      status: "Online",
      devices: 3,
      type: "active",
    },
    {
      id: "kitchen",
      name: "Kitchen Hub",
      status: "Online",
      devices: 2,
      type: "active",
    },
    {
      id: "bedroom",
      name: "Bedroom Hub",
      status: "Slow Connection",
      devices: 1,
      type: "warn",
    },
    {
      id: "garage",
      name: "Garage Hub",
      status: "Offline",
      devices: 0,
      type: "offline",
    },
  ];

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
          Select Hub
        </Text>
      </View>

      <ScrollView>
        <View className="p-6">
          <Text
            className="text-xs leading-5 mb-5"
            style={{ color: theme.textSecondary }}
          >
            Choose a Smart Hub to manage the budget and settings for its
            connected appliances.
          </Text>

          <View className="gap-2">
            {hubs.map((hub) => (
              <HubCard
                key={hub.id}
                data={hub}
                theme={theme}
                isDarkMode={isDarkMode}
                onPress={() =>
                  navigation.navigate("BudgetDeviceList", { hubName: hub.name })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HubCard({ data, theme, isDarkMode, onPress }) {
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

  let statusColor, iconBg, iconColor;
  const isOffline = data.type === "offline";

  if (data.type === "active") {
    statusColor = isDarkMode ? "#00ff99" : "#00995e";
    iconBg = isDarkMode ? "rgba(0, 255, 153, 0.1)" : "rgba(0, 153, 94, 0.1)";
    iconColor = statusColor;
  } else if (data.type === "warn") {
    statusColor = "#ffaa00";
    iconBg = "rgba(255, 170, 0, 0.1)";
    iconColor = statusColor;
  } else {
    statusColor = "#ff4444";
    iconBg = "rgba(255, 68, 68, 0.1)";
    iconColor = statusColor;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={!isOffline ? onPress : null}
      onPressIn={!isOffline ? handlePressIn : null}
      onPressOut={!isOffline ? handlePressOut : null}
      className="mb-3"
    >
      <Animated.View
        className="flex-row items-center justify-between p-4 rounded-xl border"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          transform: [{ scale: scaleValue }],
          opacity: isOffline ? 0.6 : 1,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="w-10 h-10 rounded-lg items-center justify-center"
            style={{ backgroundColor: iconBg }}
          >
            <MaterialIcons
              name={isOffline ? "wifi-off" : "router"}
              size={20}
              color={iconColor}
            />
          </View>
          <View className="gap-0.5">
            <Text className="text-sm font-bold" style={{ color: theme.text }}>
              {data.name}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: statusColor,
                  shadowColor: statusColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: data.type === "active" ? 0.5 : 0,
                  shadowRadius: 5,
                  elevation: data.type === "active" ? 2 : 0,
                }}
              />
              <Text
                className="text-[11px]"
                style={{ color: theme.textSecondary }}
              >
                {data.status}
                {!isOffline && ` • ${data.devices} Devices`}
              </Text>
            </View>
          </View>
        </View>
        <MaterialIcons
          name={isOffline ? "lock" : "chevron-right"}
          size={18}
          color={theme.textSecondary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}
