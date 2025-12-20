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
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => navigation.navigate("Menu")}>
          <MaterialIcons name="menu" size={28} color={theme.textSecondary} />
        </TouchableOpacity>

        <Image
          source={require("../../../assets/GridWatch-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
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
        <View style={styles.greeting}>
          <Text style={[styles.greetingText, { color: theme.textSecondary }]}>
            Good Evening, Natasha
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.statusText, { color: theme.text }]}>
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
              style={[styles.mainCard, { borderColor: theme.cardBorder }]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>Current Spending (MTD)</Text>
                <MaterialIcons
                  name="edit"
                  size={16}
                  color={theme.textSecondary}
                />
              </View>

              <Text style={[styles.amount, { color: theme.text }]}>
                ₱ 1,450.75
              </Text>
              <Text style={[styles.loadInfo, { color: theme.textSecondary }]}>
                Total Load:{" "}
                <Text style={{ color: theme.text, fontWeight: "700" }}>
                  1.46 kWh
                </Text>
              </Text>

              <View
                style={[
                  styles.barTrack,
                  { backgroundColor: isDarkMode ? "#333" : "#e5e5ea" },
                ]}
              >
                <LinearGradient
                  colors={
                    isDarkMode ? ["#0055ff", "#00ff99"] : ["#0055ff", "#00995e"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: "52%" }]}
                />
              </View>
              <Text style={[styles.percentage, { color: theme.primary }]}>
                52% of Budget
              </Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        {HUBS_DATA.map((hub) => (
          <View key={hub.id} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {hub.name} ({hub.active}/{hub.total})
            </Text>
            <View style={styles.grid}>
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
      style={styles.deviceWrapper}
    >
      <Animated.View
        style={[
          styles.deviceCard,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.cardRow}>
          <View
            style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}
          >
            <MaterialIcons name={data.icon} size={18} color={colors.icon} />
          </View>
          <View
            style={[styles.tagContainer, { backgroundColor: colors.tagBg }]}
          >
            <Text style={[styles.tagText, { color: colors.tag }]}>
              {data.tag}
            </Text>
          </View>
        </View>
        <View>
          <Text style={[styles.nameText, { color: theme.text }]}>
            {data.name}
          </Text>
          <Text style={[styles.costText, { color: colors.cost }]}>
            {data.cost}
          </Text>
          <Text style={[styles.wattText, { color: theme.textSecondary }]}>
            {data.watts}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

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
  scrollContent: { paddingBottom: 100 },
  greeting: { paddingHorizontal: 24, marginBottom: 20 },
  greetingText: { fontSize: 14, fontWeight: "500", marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: "600" },
  mainCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
  },
  amount: { fontSize: 38, fontWeight: "700", marginBottom: 4 },
  loadInfo: { fontSize: 13, marginBottom: 20 },
  barTrack: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    marginBottom: 8,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
  percentage: { textAlign: "right", fontSize: 11, fontWeight: "600" },
  section: { marginBottom: 20 },
  sectionTitle: {
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
  deviceWrapper: { width: "48%", marginBottom: 16 },
  deviceCard: {
    width: "100%",
    borderRadius: 20,
    padding: 16,
    height: 140,
    justifyContent: "space-between",
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tagContainer: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 9, fontWeight: "bold" },
  nameText: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  costText: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  wattText: { fontSize: 10 },
});
