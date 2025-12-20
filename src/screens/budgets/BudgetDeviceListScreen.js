import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
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
  const { theme, isDarkMode } = useTheme();

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={18}
            color={theme.textSecondary}
          />
          <Text style={[styles.backText, { color: theme.textSecondary }]}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Budget Management
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.introText, { color: theme.textSecondary }]}>
          Select a device from{" "}
          <Text style={{ fontWeight: "700", color: theme.primary }}>
            {hubName}
          </Text>{" "}
          to configure spending limits, automation rules, and alerts.
        </Text>

        <View style={styles.listContainer}>
          {devices.map((device) => (
            <DeviceRow
              key={device.id}
              data={device}
              theme={theme}
              isDarkMode={isDarkMode}
              onPress={() =>
                navigation.navigate("BudgetDetail", { deviceName: device.name })
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DeviceRow({ data, theme, isDarkMode, onPress }) {
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
    iconColor = isDarkMode ? "#00ff99" : "#00995e";
    iconBg = isDarkMode ? "rgba(0, 255, 153, 0.1)" : "rgba(0, 153, 94, 0.1)";
    statusTextColor = iconColor;
  } else if (data.type === "warn") {
    iconColor = "#ffaa00";
    iconBg = "rgba(255, 170, 0, 0.1)";
    statusTextColor = iconColor;
  } else if (data.type === "critical") {
    iconColor = "#ff4444";
    iconBg = "rgba(255, 68, 68, 0.1)";
    statusTextColor = iconColor;
  } else {
    iconColor = theme.textSecondary;
    iconBg = theme.cardBorder;
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
        style={[
          styles.deviceItem,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            transform: [{ scale: scaleValue }],
            opacity: data.isLocked ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.deviceLeft}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <MaterialIcons name={data.icon} size={22} color={iconColor} />
          </View>

          <View style={styles.deviceInfo}>
            <Text style={[styles.deviceName, { color: theme.text }]}>
              {data.name}
            </Text>
            <Text style={[styles.deviceStatus, { color: statusTextColor }]}>
              {data.status}
            </Text>
          </View>
        </View>

        <MaterialIcons
          name={data.isLocked ? "lock" : "chevron-right"}
          size={20}
          color={theme.textSecondary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  backText: { fontSize: 14, fontWeight: "500" },
  headerTitle: { fontSize: 16, fontWeight: "700" },

  content: { padding: 24 },
  introText: { fontSize: 13, lineHeight: 20, marginBottom: 25 },

  listContainer: { gap: 12 },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },

  deviceLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  deviceInfo: { gap: 2 },
  deviceName: { fontSize: 14, fontWeight: "600" },
  deviceStatus: { fontSize: 11, fontWeight: "500" },
});
