import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const [activeTab, setActiveTab] = useState("system");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATIC SIMULATION DATA (Faults/Limits) ---
  const SIMULATED_FAULTS = [
    {
      id: "sim-1",
      title: "Daily Limit Reached",
      body: "Air Conditioner reached daily budget limit (₱150). Auto-cutoff triggered.",
      type: "budget", // Maps to orange color
      created_at: "2026-02-16T14:30:00", // ISO format for sorting
      is_read: true,
    },
    {
      id: "sim-2",
      title: "Critical Fault Detected",
      body: "Short circuit detected on Washing Machine (Outlet 2). Safe shutdown completed.",
      type: "critical", // Maps to red color
      created_at: "2026-02-14T09:15:00",
      is_read: true,
    },
    {
      id: "sim-3",
      title: "Monthly Allocation Alert",
      body: "Smart TV has consumed 90% of its monthly budget.",
      type: "budget",
      created_at: "2026-02-12T18:45:00",
      is_read: true,
    },
  ];

  const normalizeData = (item, source) => {
    let title, body, category, type, icon, dateObj, isRead;

    if (source === "invite") {
      title = "New Invitation";
      body = "You have been invited to join a Hub! Tap to view.";
      category = "system";
      type = "success";
      icon = "person-add";
      dateObj = new Date(item.created_at);
      isRead = false;
    } else if (source === "simulation") {
      // Handle Simulated Faults
      title = item.title;
      body = item.body;
      category = "system";
      type = item.type;
      icon =
        item.type === "critical" ? "error-outline" : "account-balance-wallet";
      dateObj = new Date(item.created_at);
      isRead = item.is_read;
    } else {
      // Handle Supabase Notifications
      title = item.title;
      body = item.body;
      isRead = item.is_read;
      dateObj = new Date(item.created_at);

      const tLower = title.toLowerCase();
      const bLower = body.toLowerCase();

      if (
        tLower.includes("login successful") ||
        tLower.includes("other device") ||
        bLower.includes("other device") ||
        bLower.includes("someone login") ||
        bLower.includes("did you just login")
      ) {
        if (title === "Security Alert" || tLower.includes("other device")) {
          category = "system";
          type = "critical";
          icon = "security";
        } else {
          category = "login";
          type = "login_success";
          icon = "lock-open";
        }
      } else {
        if (tLower.includes("login") || tLower.includes("password")) {
          category = "login";
          type = tLower.includes("failed") ? "login_failed" : "login_success";
          icon = tLower.includes("failed") ? "gpp-bad" : "lock-open";
        } else {
          category = "system";
          if (tLower.includes("accepted")) {
            type = "success";
            icon = "check-circle";
          } else if (tLower.includes("declined")) {
            type = "critical";
            icon = "cancel";
          } else if (tLower.includes("fault") || bLower.includes("detected")) {
            type = "critical";
            icon = "error-outline";
          } else if (tLower.includes("budget") || bLower.includes("limit")) {
            type = "budget";
            icon = "account-balance-wallet";
          } else {
            type = "info";
            icon = "notifications";
          }
        }
      }
    }

    const timeString =
      dateObj.toLocaleDateString() === new Date().toLocaleDateString()
        ? dateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : dateObj.toLocaleDateString();

    return {
      id: item.id,
      type,
      icon,
      category,
      title,
      desc: body,
      time: timeString,
      unread: !isRead,
      rawDate: dateObj,
      source,
    };
  };

  const fetchAllLogs = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: notifs, error: notifError } = await supabase
        .from("app_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (notifError) throw notifError;

      const { data: invites, error: inviteError } = await supabase
        .from("hub_invites")
        .select("*")
        .eq("email", user.email)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (inviteError) throw inviteError;

      const parsedNotifs = notifs.map((n) => normalizeData(n, "notification"));
      const parsedInvites = invites.map((i) => normalizeData(i, "invite"));

      // --- INTEGRATE SIMULATION DATA ---
      const parsedSims = SIMULATED_FAULTS.map((s) =>
        normalizeData(s, "simulation"),
      );

      const combined = [...parsedNotifs, ...parsedInvites, ...parsedSims].sort(
        (a, b) => b.rawDate - a.rawDate,
      );

      setNotifications(combined);
    } catch (err) {
      console.log("Error fetching logs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let subscription;
    const setupLive = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      subscription = supabase
        .channel("screen_logs")

        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "app_notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            let rawData = payload.new;
            if (rawData.title.toLowerCase().includes("login successful")) {
              rawData = {
                ...rawData,
                title: "Security Alert",
                body: "New Login Detected: Did you just log in on another device? If not, please change your password immediately.",
              };
            }
            const newNote = normalizeData(rawData, "notification");
            setNotifications((prev) => [newNote, ...prev]);
          },
        )

        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "hub_invites",
            filter: `email=eq.${user.email}`,
          },
          (payload) => {
            const newInvite = normalizeData(payload.new, "invite");
            setNotifications((prev) => [newInvite, ...prev]);
          },
        )
        .subscribe();
    };

    setupLive();
    fetchAllLogs();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  const handleMarkAllRead = async () => {
    // Only mark real notifications as read in state, keep simulation as is or mark read locally
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase
        .from("app_notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);
    } catch (err) {
      console.log("Error marking read:", err);
    }
  };

  const activeData = notifications.filter((n) => n.category === activeTab);
  const newItems = activeData.filter((n) => n.unread);
  const earlierItems = activeData.filter((n) => !n.unread);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 20,
          borderBottomWidth: 1,
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ zIndex: 10 }}
        >
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(24)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              color: theme.text,
              fontSize: scaledSize(18),
            }}
          >
            Activity Logs
          </Text>
        </View>

        <TouchableOpacity onPress={handleMarkAllRead} style={{ zIndex: 10 }}>
          <Text
            style={{
              color: theme.buttonPrimary,
              fontWeight: "bold",
              fontSize: scaledSize(12),
            }}
          >
            Mark read
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
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

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchAllLogs}
            tintColor={theme.buttonPrimary}
          />
        }
      >
        {loading && notifications.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={theme.buttonPrimary}
            style={{ marginTop: 20 }}
          />
        ) : (
          <>
            {newItems.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: theme.textSecondary,
                      fontSize: scaledSize(11),
                    },
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
                    navigation={navigation}
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
                  navigation={navigation}
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
          </>
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

function NotificationCard({ data, theme, isDarkMode, scaledSize, navigation }) {
  let mainColor, bgColor;

  if (data.type === "critical" || data.type === "login_failed") {
    mainColor = isDarkMode ? "#ff4444" : "#c62828";
    bgColor = isDarkMode ? "rgba(255, 68, 68, 0.15)" : "rgba(198, 40, 40, 0.1)";
  } else if (data.type === "budget") {
    mainColor = isDarkMode ? "#ffaa00" : "#b37400";
    bgColor = isDarkMode ? "rgba(255, 170, 0, 0.15)" : "rgba(179, 116, 0, 0.1)";
  } else if (data.type === "login_success") {
    mainColor = "#0055ff";
    bgColor = isDarkMode ? "rgba(0, 85, 255, 0.15)" : "rgba(0, 85, 255, 0.1)";
  } else if (data.type === "success") {
    mainColor = theme.buttonPrimary;
    bgColor = isDarkMode ? "rgba(0, 255, 153, 0.15)" : "rgba(0, 153, 94, 0.15)";
  } else {
    mainColor = theme.buttonPrimary;
    bgColor = isDarkMode ? "rgba(0, 255, 153, 0.15)" : "rgba(0, 153, 94, 0.15)";
  }

  const handlePress = () => {
    if (data.source === "invite") {
      navigation.navigate("Invitations");
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={data.source === "invite" ? 0.7 : 1}
      onPress={handlePress}
    >
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
          {data.source === "invite" && (
            <Text
              style={{
                color: theme.buttonPrimary,
                fontSize: scaledSize(10),
                fontWeight: "bold",
                marginTop: 4,
              }}
            >
              Tap to manage invite →
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
});
