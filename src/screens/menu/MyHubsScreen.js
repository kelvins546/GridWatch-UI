import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

export default function MyHubsScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();

  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scaledSize = (baseSize) => baseSize * (fontScale || 1);

  const fetchHubs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("hubs")
        .select(`*, devices(id, type)`)
        .eq("user_id", user.id)
        .neq("devices.type", "Unused");

      if (error) throw error;
      setHubs(data || []);
    } catch (error) {
      console.error("Error fetching hubs:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Keep data fresh every 5s (Database sync)
    const autoRefreshInterval = setInterval(() => {
      fetchHubs();
    }, 5000);

    return () => clearInterval(autoRefreshInterval);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("hubs_realtime_check")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "hubs",
        },
        (payload) => {
          setHubs((current) =>
            current.map((h) =>
              h.id === payload.new.id ? { ...h, ...payload.new } : h,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHubs();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHubs();
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

      {/* Header */}
      <View
        className="flex-row items-center px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(20)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        <Text
          className="flex-1 text-center font-bold"
          style={{ color: theme.text, fontSize: scaledSize(18) }}
        >
          My Hubs
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SetupHub")}>
          <MaterialIcons
            name="add"
            size={scaledSize(28)}
            color={theme.buttonPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="gray"
          />
        }
      >
        <View className="p-6">
          {loading ? (
            <ActivityIndicator
              size="large"
              color="gray"
              style={{ marginTop: 20 }}
            />
          ) : hubs.length === 0 ? (
            <View className="items-center py-20">
              <MaterialIcons name="router" size={60} color={theme.cardBorder} />
              <Text
                className="mt-4 text-center"
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(14),
                }}
              >
                No hubs connected.
              </Text>
            </View>
          ) : (
            hubs.map((hub) => (
              <HubCard
                key={hub.id}
                hub={hub}
                theme={theme}
                scaledSize={scaledSize}
                navigation={navigation}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HubCard({ hub, theme, scaledSize, navigation }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // UPDATED: Check 2x per second (500ms) for fast Traffic Light updates
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // --- TRAFFIC LIGHT LOGIC START ---
  let statusText = "Offline";
  let statusColor = "#ef4444"; // Red Default
  let statusIcon = "wifi-off";
  let isOnline = false;
  let timeAgoText = "";

  if (hub.last_seen) {
    let timeStr = hub.last_seen.replace(" ", "T");
    if (!timeStr.endsWith("Z") && !timeStr.includes("+")) {
      timeStr += "Z";
    }

    const lastSeenMs = new Date(timeStr).getTime();
    if (!isNaN(lastSeenMs)) {
      const diffSeconds = (now - lastSeenMs) / 1000;
      const displayDiff = Math.max(0, diffSeconds);

      // LOGIC 1: ONLINE (Green) - < 3 seconds
      if (diffSeconds < 3) {
        statusText = "Online";
        statusColor = "#22c55e"; // Green
        statusIcon = "router";
        isOnline = true;
      }
      // LOGIC 2: UNSTABLE (Yellow) - 3 to 6 seconds
      else if (diffSeconds < 6) {
        statusText = "Unstable";
        statusColor = "#eab308"; // Yellow/Orange
        statusIcon = "wifi";
        isOnline = true; // Still reachable
      }
      // LOGIC 3: OFFLINE (Red) - > 6 seconds
      else {
        statusText = "Offline";
        statusColor = "#ef4444"; // Red
        statusIcon = "wifi-off";
        isOnline = false;

        // Calculate time ago string
        if (displayDiff < 60) {
          timeAgoText = `${Math.floor(displayDiff)}s ago`;
        } else if (displayDiff < 3600) {
          timeAgoText = `${Math.floor(displayDiff / 60)}m ago`;
        } else if (displayDiff < 86400) {
          timeAgoText = `${Math.floor(displayDiff / 3600)}h ago`;
        } else {
          timeAgoText = `${Math.floor(displayDiff / 86400)}d ago`;
        }
      }
    }
  }
  // --- TRAFFIC LIGHT LOGIC END ---

  const deviceCount = hub.devices ? hub.devices.length : 0;

  // Card Styles based on status
  const cardBgColor = isOnline ? `${statusColor}0D` : theme.card; // Very faint bg if online
  const borderColor = isOnline ? statusColor : theme.cardBorder;
  const borderWidth = isOnline ? 1.5 : 1;
  const iconContainerBg = `${statusColor}26`; // 15% opacity of status color

  return (
    <TouchableOpacity
      className="rounded-2xl p-4 mb-4 border relative"
      style={{
        backgroundColor: cardBgColor,
        borderColor: borderColor,
        borderWidth: borderWidth,
      }}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate("DeviceConfig", {
          hubName: hub.name,
          hubId: hub.id,
          // Pass the calculated status to next screen
          status: statusText,
        })
      }
    >
      <View className="flex-row justify-between items-start mb-3">
        <View
          className="w-10 h-10 rounded-xl justify-center items-center"
          style={{ backgroundColor: iconContainerBg }}
        >
          <MaterialIcons
            name={statusIcon}
            size={scaledSize(24)}
            color={statusColor}
          />
        </View>

        <View className="items-end">
          <View
            className="px-2 py-1 rounded-md border mb-1"
            style={{
              backgroundColor: isOnline ? statusColor : "transparent",
              borderColor: statusColor,
            }}
          >
            <Text
              className="font-bold uppercase"
              style={{
                color: isOnline ? "#ffffff" : statusColor,
                fontSize: scaledSize(10),
              }}
            >
              {statusText}
            </Text>
          </View>

          {!isOnline && (
            <Text
              className="font-medium"
              style={{
                color: theme.textSecondary,
                fontSize: scaledSize(10),
              }}
            >
              Seen {timeAgoText}
            </Text>
          )}
        </View>
      </View>

      <Text
        className="font-bold mb-1"
        style={{ color: theme.text, fontSize: scaledSize(16) }}
      >
        {hub.name}
      </Text>
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: scaledSize(11),
          marginBottom: 12,
        }}
      >
        SN: {hub.serial_number}
      </Text>

      <View
        className="flex-row border-t pt-3 mt-1"
        style={{
          borderTopColor: isOnline ? `${statusColor}33` : theme.cardBorder,
        }}
      >
        <StatCol
          label="SSID"
          value={hub.wifi_ssid || "---"}
          theme={theme}
          scaledSize={scaledSize}
        />
        <StatCol
          label="Signal"
          value={
            statusText === "Unstable" ? "Weak" : isOnline ? "Strong" : "None"
          }
          color={theme.text}
          theme={theme}
          scaledSize={scaledSize}
        />
        <StatCol
          label="Devices"
          value={`${deviceCount} Linked`}
          theme={theme}
          scaledSize={scaledSize}
        />
      </View>

      <View className="absolute bottom-4 right-4">
        <MaterialIcons
          name="settings"
          size={scaledSize(20)}
          color={theme.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

function StatCol({ label, value, color, theme, scaledSize }) {
  return (
    <View className="flex-1 gap-1">
      <Text
        className="uppercase font-semibold"
        style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
      >
        {label}
      </Text>
      <Text
        className="font-medium"
        style={{ color: color || theme.text, fontSize: scaledSize(12) }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
