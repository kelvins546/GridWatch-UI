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

  const [activeTab, setActiveTab] = useState("system"); // 'system' or 'login'
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. HELPER: CATEGORIZE NOTIFICATIONS ---
  const parseNotification = (note) => {
    const title = note.title.toLowerCase();
    const body = note.body.toLowerCase();
    let type = "info";
    let icon = "notifications";
    let category = "system";

    if (title.includes("login") || title.includes("password")) {
      category = "login";
      type = title.includes("failed") ? "login_failed" : "login_success";
      icon = title.includes("failed") ? "gpp-bad" : "lock-open";
    } else if (title.includes("accepted")) {
      type = "success";
      icon = "check-circle";
    } else if (title.includes("declined")) {
      type = "critical";
      icon = "cancel";
    } else if (title.includes("fault") || body.includes("detected")) {
      type = "critical";
      icon = "error-outline";
    } else if (title.includes("budget") || body.includes("limit")) {
      type = "budget";
      icon = "account-balance-wallet";
    }

    const dateObj = new Date(note.created_at);
    const timeString =
      dateObj.toLocaleDateString() === new Date().toLocaleDateString()
        ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : dateObj.toLocaleDateString();

    return {
      id: note.id,
      type,
      icon,
      category,
      title: note.title,
      desc: note.body,
      time: timeString,
      unread: !note.is_read,
      rawDate: dateObj,
    };
  };

  // --- 2. FETCH DATA ---
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("app_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsed = data.map(parseNotification);
      setNotifications(parsed);
    } catch (err) {
      console.log("Error fetching notifications:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. REALTIME LISTENER ---
  useEffect(() => {
    let subscription;
    const setupLive = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      subscription = supabase
        .channel("notif_screen_updates")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "app_notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNote = parseNotification(payload.new);
            setNotifications((prev) => [newNote, ...prev]);
          },
        )
        .subscribe();
    };
    setupLive();
    fetchNotifications();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  // --- 4. MARK AS READ ---
  const handleMarkAllRead = async () => {
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

      {/* --- FIXED HEADER --- */}
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(24)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontWeight: "bold",
            color: theme.text,
            fontSize: scaledSize(18),
          }}
        >
          Activity Logs
        </Text>

        <TouchableOpacity onPress={handleMarkAllRead}>
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

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchNotifications}
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

function NotificationCard({ data, theme, isDarkMode, scaledSize }) {
  let mainColor, bgColor;

  if (data.type === "critical" || data.type === "login_failed") {
    mainColor = isDarkMode ? "#ff4444" : "#c62828";
    bgColor = isDarkMode ? "rgba(255, 68, 68, 0.15)" : "rgba(198, 40, 40, 0.1)";
  } else if (data.type === "budget") {
    mainColor = isDarkMode ? "#ffaa00" : "#b37400";
    bgColor = isDarkMode ? "rgba(255, 170, 0, 0.15)" : "rgba(179, 116, 0, 0.1)";
  } else if (data.type === "offline") {
    mainColor = theme.textSecondary;
    bgColor = theme.buttonNeutral;
  } else if (data.type === "login_success" || data.type === "security") {
    mainColor = "#0055ff";
    bgColor = isDarkMode ? "rgba(0, 85, 255, 0.15)" : "rgba(0, 85, 255, 0.1)";
  } else {
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
});
