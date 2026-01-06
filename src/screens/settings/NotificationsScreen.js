import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

const INITIAL_NOTIFICATIONS = [
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
    type: "info",
    icon: "power",
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

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    setNotifications(updated);
  };

  const newNotifications = notifications.filter((n) => n.unread);
  const earlierNotifications = notifications.filter((n) => !n.unread);

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
          Notifications
        </Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={[styles.markRead, { color: theme.primary }]}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {newNotifications.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              New ({newNotifications.length})
            </Text>
            {newNotifications.map((item) => (
              <NotificationCard
                key={item.id}
                data={item}
                theme={theme}
                isDarkMode={isDarkMode}
              />
            ))}
          </>
        )}

        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textSecondary, marginTop: 20 },
          ]}
        >
          Earlier
        </Text>

        {earlierNotifications.length > 0 ? (
          earlierNotifications.map((item) => (
            <NotificationCard
              key={item.id}
              data={item}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          ))
        ) : (
          <Text
            style={{
              textAlign: "center",
              marginTop: 10,
              color: theme.textSecondary,
              fontSize: 12,
            }}
          >
            No earlier notifications.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationCard({ data, theme, isDarkMode }) {
  let mainColor, bgColor;

  if (data.type === "critical") {
    mainColor = isDarkMode ? "#ff4444" : "#c62828";
    bgColor = isDarkMode ? "rgba(255, 68, 68, 0.15)" : "rgba(198, 40, 40, 0.1)";
  } else if (data.type === "budget") {
    mainColor = isDarkMode ? "#ffaa00" : "#b37400";
    bgColor = isDarkMode ? "rgba(255, 170, 0, 0.15)" : "rgba(179, 116, 0, 0.1)";
  } else {
    mainColor = theme.primary;
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
        <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
      )}
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <MaterialIcons name={data.icon} size={24} color={mainColor} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            {data.title}
          </Text>
          <Text style={[styles.timeAgo, { color: theme.textSecondary }]}>
            {data.time}
          </Text>
        </View>
        <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
          {data.desc}
        </Text>
        {data.action && (
          <TouchableOpacity>
            <Text style={[styles.actionLink, { color: mainColor }]}>
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
    padding: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { fontSize: 14, fontWeight: "500", marginLeft: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  markRead: { fontSize: 12, fontWeight: "600" },
  content: { padding: 24 },
  sectionTitle: {
    fontSize: 11,
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
  cardTitle: { fontSize: 14, fontWeight: "700" },
  timeAgo: { fontSize: 11, marginRight: 15 },
  cardDesc: { fontSize: 12, lineHeight: 18, marginBottom: 6 },
  actionLink: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
});
