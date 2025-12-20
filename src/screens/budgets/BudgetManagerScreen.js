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
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

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
          onPress={() => navigation.navigate("Home")}
        >
          <MaterialIcons
            name="arrow-back"
            size={18}
            color={theme.textSecondary}
          />
          <Text style={[styles.backText, { color: theme.textSecondary }]}>
            Home
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Select Hub
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.introText, { color: theme.textSecondary }]}>
          Choose a Smart Hub to manage the budget and settings for its connected
          appliances.
        </Text>

        <View style={styles.hubList}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

function HubCard({ data, theme, isDarkMode, onPress }) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
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
      style={{ marginBottom: 12 }}
    >
      <Animated.View
        style={[
          styles.hubItem,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            transform: [{ scale: scaleValue }],
            opacity: isOffline ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.hubLeft}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <MaterialIcons
              name={isOffline ? "wifi-off" : "router"}
              size={24}
              color={iconColor}
            />
          </View>
          <View style={styles.hubInfo}>
            <Text style={[styles.hubName, { color: theme.text }]}>
              {data.name}
            </Text>
            <View style={styles.hubStatusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: statusColor,
                    boxShadow:
                      data.type === "active"
                        ? `0 0 5px ${statusColor}`
                        : "none",
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                {data.status}
                {!isOffline && ` • ${data.devices} Devices`}
              </Text>
            </View>
          </View>
        </View>
        <MaterialIcons
          name={isOffline ? "lock" : "chevron-right"}
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
  hubList: { gap: 12 },
  hubItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  hubLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  hubInfo: { gap: 4 },
  hubName: { fontSize: 15, fontWeight: "700" },
  hubStatusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12 },
});
