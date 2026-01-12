import React, { useState } from "react";
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

// --- MOCK DATA: SYSTEM LOGS ---
const SYSTEM_LOGS = [
  {
    id: 1,
    type: "critical",
    icon: "error-outline",
    title: "Critical Fault",
    time: "2m ago",
    desc: "Short circuit detected on Outlet 3. Power was cut automatically.",
    action: "Review Logs >",
    unread: true,
  },
  {
    id: 2,
    type: "budget",
    icon: "account-balance-wallet",
    title: "Budget Alert",
    time: "2h ago",
    desc: "AC reached 90% of your daily limit (₱135 / ₱150).",
    action: "Adjust Limit >",
    unread: true,
  },
  {
    id: 3,
    type: "offline",
    icon: "wifi-off",
    title: "Device Offline",
    time: "5h ago",
    desc: "Living Room Hub lost connection. Please check your Wi-Fi.",
    action: "Troubleshoot >",
    unread: true,
  },
  {
    id: 4,
    type: "info",
    icon: "lightbulb-outline",
    title: "Energy Tip",
    time: "Yesterday",
    desc: "You saved ₱45.00 yesterday by turning off the TV during peak hours.",
    unread: false,
  },
];

// --- MOCK DATA: LOGIN LOGS (NEW) ---
const LOGIN_LOGS = [
  {
    id: 101,
    type: "login_success",
    icon: "smartphone",
    title: "Login Successful",
    time: "Just now",
    desc: "Samsung Galaxy S23 • 192.168.1.45",
    unread: true,
  },
  {
    id: 102,
    type: "login_failed",
    icon: "gpp-bad",
    title: "Failed Login Attempt",
    time: "Yesterday, 10:23 PM",
    desc: "Unknown Device • IP 112.198.2.1",
    action: "Block IP >",
    unread: false,
  },
  {
    id: 103,
    type: "security",
    icon: "lock-reset",
    title: "Password Changed",
    time: "Jan 10, 2026",
    desc: "Password updated successfully via Settings.",
    unread: false,
  },
  {
    id: 104,
    type: "login_success",
    icon: "laptop-mac",
    title: "Web Login",
    time: "Jan 08, 2026",
    desc: "Chrome on MacOS • 110.55.2.1",
    unread: false,
  },
];

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();

  // Helper for font scaling
  const scaledSize = (size) => size * fontScale;

  const [activeTab, setActiveTab] = useState("system"); // 'system' or 'login'
  const [systemLogs, setSystemLogs] = useState(SYSTEM_LOGS);
  const [loginLogs, setLoginLogs] = useState(LOGIN_LOGS);

  // Get current data based on tab
  const activeData = activeTab === "system" ? systemLogs : loginLogs;
  const newItems = activeData.filter((n) => n.unread);
  const earlierItems = activeData.filter((n) => !n.unread);

  const handleMarkAllRead = () => {
    if (activeTab === "system") {
      setSystemLogs(systemLogs.map((n) => ({ ...n, unread: false })));
    } else {
      setLoginLogs(loginLogs.map((n) => ({ ...n, unread: false })));
    }
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
            size={scaledSize(18)}
            color={theme.textSecondary}
          />
          <Text
            style={[
              styles.backText,
              { color: theme.textSecondary, fontSize: scaledSize(14) },
            ]}
          >
            Back
          </Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: scaledSize(16) },
          ]}
        >
          Activity Logs
        </Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text
            style={[
              styles.markRead,
              { color: theme.buttonPrimary, fontSize: scaledSize(12) },
            ]}
          >
            Mark read
          </Text>
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TabButton
          label="System Logs"
          isActive={activeTab === "system"}
          onPress={() => setActiveTab("system")}
          theme={theme}
          scaledSize={scaledSize}
        />
        <TabButton
          label="Login Logs"
          isActive={activeTab === "login"}
          onPress={() => setActiveTab("login")}
          theme={theme}
          scaledSize={scaledSize}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {newItems.length > 0 && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textSecondary, fontSize: scaledSize(11) },
              ]}
            >
              New ({newItems.length})
            </Text>
            {newItems.map((item) => (
              <NotificationCard
                key={item.id}
                data={item}
                theme={theme}
                isDarkMode={isDarkMode}
                scaledSize={scaledSize}
              />
            ))}
          </>
        )}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.textSecondary,
              marginTop: newItems.length > 0 ? 20 : 0,
              fontSize: scaledSize(11),
            },
          ]}
        >
          Earlier
        </Text>

        {earlierItems.length > 0 ? (
          earlierItems.map((item) => (
            <NotificationCard
              key={item.id}
              data={item}
              theme={theme}
              isDarkMode={isDarkMode}
              scaledSize={scaledSize}
            />
          ))
        ) : (
          <Text
            style={{
              textAlign: "center",
              marginTop: 10,
              color: theme.textSecondary,
              fontSize: scaledSize(12),
            }}
          >
            No earlier logs found.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({ label, isActive, onPress, theme, scaledSize }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tabButton,
        { borderBottomColor: isActive ? theme.buttonPrimary : "transparent" },
      ]}
    >
      <Text
        style={{
          color: isActive ? theme.buttonPrimary : theme.textSecondary,
          fontWeight: isActive ? "bold" : "normal",
          fontSize: scaledSize(13),
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function NotificationCard({ data, theme, isDarkMode, scaledSize }) {
  let mainColor, bgColor;

  // --- LOGIC FOR COLORS BASED ON TYPE ---
  if (data.type === "critical" || data.type === "login_failed") {
    // RED (Faults & Failed Logins)
    mainColor = isDarkMode ? "#ff4444" : "#c62828";
    bgColor = isDarkMode ? "rgba(255, 68, 68, 0.15)" : "rgba(198, 40, 40, 0.1)";
  } else if (data.type === "budget") {
    // AMBER (Budget)
    mainColor = isDarkMode ? "#ffaa00" : "#b37400";
    bgColor = isDarkMode ? "rgba(255, 170, 0, 0.15)" : "rgba(179, 116, 0, 0.1)";
  } else if (data.type === "offline") {
    // GRAY (Offline)
    mainColor = theme.textSecondary;
    bgColor = theme.buttonNeutral;
  } else if (data.type === "login_success" || data.type === "security") {
    // BLUE (Security & Logins)
    mainColor = "#0055ff";
    bgColor = isDarkMode ? "rgba(0, 85, 255, 0.15)" : "rgba(0, 85, 255, 0.1)";
  } else {
    // GREEN (Info/Tips)
    mainColor = theme.buttonPrimary;
    bgColor = isDarkMode ? "rgba(0, 255, 153, 0.15)" : "rgba(0, 153, 94, 0.15)";
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          borderLeftColor: mainColor,
        },
      ]}
    >
      {data.unread && (
        <View
          style={[styles.unreadDot, { backgroundColor: theme.buttonPrimary }]}
        />
      )}

      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <MaterialIcons
          name={data.icon}
          size={scaledSize(24)}
          color={mainColor}
        />
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.cardHeader}>
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text, fontSize: scaledSize(14) },
            ]}
          >
            {data.title}
          </Text>
          <Text
            style={[
              styles.timeAgo,
              { color: theme.textSecondary, fontSize: scaledSize(11) },
            ]}
          >
            {data.time}
          </Text>
        </View>
        <Text
          style={[
            styles.cardDesc,
            { color: theme.textSecondary, fontSize: scaledSize(12) },
          ]}
        >
          {data.desc}
        </Text>
        {data.action && (
          <TouchableOpacity>
            <Text
              style={[
                styles.actionLink,
                { color: mainColor, fontSize: scaledSize(11) },
              ]}
            >
              {data.action}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { fontWeight: "500", marginLeft: 4 },
  headerTitle: { fontWeight: "700" },
  markRead: { fontWeight: "600" },

  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 5,
  },
  tabButton: {
    marginRight: 20,
    paddingBottom: 8,
    borderBottomWidth: 2,
  },

  content: { padding: 24, paddingBottom: 50 },
  sectionTitle: {
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    gap: 14,
    overflow: "hidden",
  },
  unreadDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: { fontWeight: "700" },
  timeAgo: { marginRight: 15 },
  cardDesc: { lineHeight: 18, marginBottom: 6 },
  actionLink: { fontWeight: "700", textTransform: "uppercase" },
});
