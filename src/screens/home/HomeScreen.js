import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
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

export default function HomeScreen() {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation();

  // --- AUTOMATIC DETECTION TRIGGER ---
  useEffect(() => {
    // This simulates the "Detection" process exactly like your HTML file.
    // It waits 1.5 seconds after the Home Screen loads, then shows the modal.
    const timer = setTimeout(() => {
      navigation.navigate("DndCheck");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // --- ANIMATION FOR MAIN CARD ---
  const mainCardScale = useRef(new Animated.Value(1)).current;

  const handleMainIn = () => {
    Animated.spring(mainCardScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };
  const handleMainOut = () => {
    Animated.spring(mainCardScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // MOCK DATA
  const hubsData = [
    {
      id: "hub1",
      name: "LIVING ROOM HUB",
      active: 4,
      total: 4,
      devices: [
        {
          id: 1,
          name: "Air Conditioner",
          cost: "₱ 18.20 / hr",
          watts: "1456 Watts • ON",
          icon: "ac-unit",
          type: "normal",
          tag: "DAILY",
        },
        {
          id: 2,
          name: "Smart TV",
          cost: "₱ 1.50 / hr",
          watts: "120 Watts • ON",
          icon: "tv",
          type: "warning",
          tag: "LIMIT",
        },
        {
          id: 3,
          name: "Outlet 3",
          cost: "SHORT CIRCUIT",
          watts: "0 Watts • RESET REQ.",
          icon: "power-off",
          type: "critical",
          tag: "LOCKED",
        },
        {
          id: 4,
          name: "Electric Fan",
          cost: "Standby Mode",
          watts: "₱ 0.00 / hr",
          icon: "mode-fan-off",
          type: "off",
          tag: "WEEKLY",
        },
      ],
    },
    {
      id: "hub2",
      name: "KITCHEN HUB",
      active: 2,
      total: 2,
      devices: [
        {
          id: 5,
          name: "Refrigerator",
          cost: "₱ 2.10 / hr",
          watts: "150 Watts • ON",
          icon: "kitchen",
          type: "normal",
          tag: "24/7",
        },
        {
          id: 6,
          name: "Microwave",
          cost: "Standby Mode",
          watts: "0 Watts",
          icon: "microwave",
          type: "off",
          tag: "MANUAL",
        },
      ],
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
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => navigation.navigate("Menu")}>
          <MaterialIcons name="menu" size={28} color={theme.textSecondary} />
        </TouchableOpacity>

        <Image
          source={require("../../../assets/GridWatch-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.bellContainer}
          onPress={() => navigation.navigate("Notifications")}
        >
          <MaterialIcons
            name="notifications-none"
            size={28}
            color={theme.text}
          />
          <View style={[styles.badge, { borderColor: theme.background }]}>
            <Text style={styles.badgeText}>2</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingText, { color: theme.textSecondary }]}>
            Good Evening, Natasha
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[styles.statusDot, { backgroundColor: theme.primary }]}
            />
            <Text style={[styles.statusText, { color: theme.text }]}>
              All Systems Normal
            </Text>
          </View>
        </View>

        {/* MAIN CARD */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => navigation.navigate("MonthlyBudget")}
          onPressIn={handleMainIn}
          onPressOut={handleMainOut}
        >
          <Animated.View style={{ transform: [{ scale: mainCardScale }] }}>
            <LinearGradient
              colors={
                isDarkMode ? ["#252525", "#1e1e1e"] : ["#ffffff", "#f2f2f7"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.mainCard, { borderColor: theme.cardBorder }]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.cardLabel}>
                  CURRENT SPENDING (MONTH-TO-DATE)
                </Text>
                <MaterialIcons
                  name="edit"
                  size={16}
                  color={theme.textSecondary}
                />
              </View>
              <Text style={[styles.currency, { color: theme.text }]}>
                ₱ 1,450.75
              </Text>
              <Text style={[styles.kwhText, { color: theme.textSecondary }]}>
                Total Load:{" "}
                <Text style={{ color: theme.text, fontWeight: "700" }}>
                  1.46 kWh
                </Text>
              </Text>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: isDarkMode ? "#333" : "#e5e5ea" },
                ]}
              >
                <LinearGradient
                  colors={
                    isDarkMode ? ["#0055ff", "#00ff99"] : ["#0055ff", "#00995e"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: "52%" }]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.primary }]}>
                52% of Budget
              </Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        {/* DEVICE LIST */}
        {hubsData.map((hub) => (
          <View key={hub.id} style={{ marginBottom: 20 }}>
            <Text
              style={[styles.sectionHeader, { color: theme.textSecondary }]}
            >
              {hub.name} ({hub.active}/{hub.total})
            </Text>
            <View style={styles.grid}>
              {hub.devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  name={device.name}
                  cost={device.cost}
                  watts={device.watts}
                  icon={device.icon}
                  tag={device.tag}
                  type={device.type}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  onPress={() => {
                    if (device.type === "critical") {
                      navigation.navigate("FaultDetail");
                    } else {
                      navigation.navigate("DeviceControl", {
                        deviceName: device.name,
                        status: device.cost,
                      });
                    }
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

// --- DEVICE CARD COMPONENT ---
function DeviceCard({
  name,
  cost,
  watts,
  icon,
  tag,
  type,
  theme,
  isDarkMode,
  onPress,
}) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

  let bgStyle = { backgroundColor: theme.card, borderColor: theme.cardBorder };
  let iconColor = theme.primary;
  let iconBg = isDarkMode ? "rgba(0, 255, 153, 0.1)" : "rgba(0, 153, 94, 0.1)";
  let costColor = theme.primary;
  let tagColor = theme.textSecondary;
  let tagBg = theme.background;

  if (type === "warning") {
    const yellowColor = isDarkMode ? "#ffaa00" : "#b37400";
    bgStyle = {
      backgroundColor: isDarkMode
        ? "rgba(255, 170, 0, 0.05)"
        : "rgba(179, 116, 0, 0.05)",
      borderColor: isDarkMode
        ? "rgba(255, 170, 0, 0.3)"
        : "rgba(179, 116, 0, 0.2)",
    };
    iconColor = yellowColor;
    iconBg = isDarkMode ? "rgba(255, 170, 0, 0.15)" : "rgba(179, 116, 0, 0.1)";
    costColor = yellowColor;
    tagColor = yellowColor;
  } else if (type === "critical") {
    const redColor = isDarkMode ? "#ff4444" : "#c62828";
    bgStyle = {
      backgroundColor: isDarkMode
        ? "rgba(255, 68, 68, 0.05)"
        : "rgba(198, 40, 40, 0.05)",
      borderColor: isDarkMode
        ? "rgba(255, 68, 68, 0.3)"
        : "rgba(198, 40, 40, 0.2)",
    };
    iconColor = redColor;
    iconBg = isDarkMode ? "rgba(255, 68, 68, 0.15)" : "rgba(198, 40, 40, 0.1)";
    costColor = redColor;
    tagColor = redColor;
  } else if (type === "off") {
    iconColor = theme.textSecondary;
    costColor = theme.textSecondary;
    bgStyle = { backgroundColor: theme.card, borderColor: theme.cardBorder };
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={{ width: "48%", marginBottom: 16 }}
    >
      <Animated.View
        style={[
          styles.deviceCard,
          bgStyle,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        <View style={styles.cardTop}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <MaterialIcons name={icon} size={18} color={iconColor} />
          </View>
          <View style={[styles.limitTag, { backgroundColor: tagBg }]}>
            <Text style={[styles.limitTagText, { color: tagColor }]}>
              {tag}
            </Text>
          </View>
        </View>
        <View>
          <Text style={[styles.deviceName, { color: theme.text }]}>{name}</Text>
          <Text style={[styles.deviceCost, { color: costColor }]}>{cost}</Text>
          <Text style={[styles.deviceWatts, { color: theme.textSecondary }]}>
            {watts}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  logo: { width: 32, height: 32 },
  bellContainer: { position: "relative" },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ff4d4d",
    borderRadius: 7,
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  badgeText: { color: "white", fontSize: 8, fontWeight: "bold" },
  greetingSection: { paddingHorizontal: 24, marginBottom: 20 },
  greetingText: { fontSize: 14, fontWeight: "500", marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: "600" },
  mainCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
  },
  currency: { fontSize: 38, fontWeight: "700", marginBottom: 4 },
  kwhText: { fontSize: 13, marginBottom: 20 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { textAlign: "right", fontSize: 11, fontWeight: "600" },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  deviceCard: {
    width: "100%",
    borderRadius: 20,
    padding: 16,
    height: 140,
    justifyContent: "space-between",
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  limitTag: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  limitTagText: { fontSize: 9, fontWeight: "bold" },
  deviceName: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  deviceCost: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  deviceWatts: { fontSize: 10 },
});
