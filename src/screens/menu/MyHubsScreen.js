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
  const { theme } = useTheme();

  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHubs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("hubs")
        .select(`*, devices(count)`)
        .eq("user_id", user.id);

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
              h.id === payload.new.id ? { ...h, ...payload.new } : h
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHubs();
    }, [])
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
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        <Text
          className="flex-1 text-center text-base font-bold"
          style={{ color: theme.text }}
        >
          My Hubs
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SetupHub")}>
          <MaterialIcons name="add" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <View className="p-6">
          {loading ? (
            <ActivityIndicator
              size="large"
              color={theme.primary}
              style={{ marginTop: 20 }}
            />
          ) : hubs.length === 0 ? (
            <View className="items-center py-20">
              <MaterialIcons name="router" size={60} color={theme.cardBorder} />
              <Text
                className="mt-4 text-center"
                style={{ color: theme.textSecondary }}
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
                navigation={navigation}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HubCard({ hub, theme, navigation }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  let isOnline = false;
  let diffInSeconds = 0;
  let timeAgoText = "";

  if (hub.last_seen) {
    let timeStr = hub.last_seen.replace(" ", "T");
    if (!timeStr.endsWith("Z") && !timeStr.includes("+")) {
      timeStr += "Z";
    }

    const lastSeenMs = new Date(timeStr).getTime();
    if (!isNaN(lastSeenMs)) {
      diffInSeconds = (now - lastSeenMs) / 1000;

      isOnline = diffInSeconds < 8 && diffInSeconds > -5;

      if (!isOnline) {
        let displayDiff = Math.max(1, diffInSeconds - 7);

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

  const deviceCount = hub.devices?.[0]?.count || 0;
  const statusColor = isOnline ? "#00ff99" : "#ff4444";
  const statusBg = isOnline
    ? "rgba(0, 255, 153, 0.1)"
    : "rgba(255, 68, 68, 0.1)";

  return (
    <TouchableOpacity
      className="rounded-2xl p-4 mb-4 border relative"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate("DeviceConfig", {
          hubName: hub.name,
          hubId: hub.id,
          status: isOnline ? "Online" : "Offline",
        })
      }
    >
      <View className="flex-row justify-between items-start mb-3">
        <View
          className="w-10 h-10 rounded-xl justify-center items-center"
          style={{ backgroundColor: statusBg }}
        >
          <MaterialIcons
            name={isOnline ? "router" : "wifi-off"}
            size={24}
            color={statusColor}
          />
        </View>

        <View className="items-end">
          <View
            className="px-2 py-1 rounded-md border mb-1"
            style={{
              backgroundColor: isOnline
                ? "rgba(0, 255, 153, 0.15)"
                : "rgba(255, 68, 68, 0.15)",
              borderColor: isOnline
                ? "rgba(0, 255, 153, 0.3)"
                : "rgba(255, 68, 68, 0.3)",
            }}
          >
            <Text
              className="text-[10px] font-bold uppercase"
              style={{ color: statusColor }}
            >
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>

          {!isOnline && (
            <Text
              className="text-[10px] font-medium"
              style={{ color: theme.textSecondary }}
            >
              Seen {timeAgoText}
            </Text>
          )}
        </View>
      </View>

      <Text
        className="text-[15px] font-bold mb-1"
        style={{ color: theme.text }}
      >
        {hub.name}
      </Text>
      <Text className="text-[11px] mb-3" style={{ color: theme.textSecondary }}>
        SN: {hub.serial_number}
      </Text>

      <View
        className="flex-row border-t pt-3 mt-1"
        style={{ borderTopColor: theme.cardBorder }}
      >
        <StatCol label="SSID" value={hub.wifi_ssid || "---"} theme={theme} />

        <StatCol
          label="Signal"
          value={isOnline ? "Strong" : "Unplugged"}
          color={isOnline ? "#00ff99" : "#ff4444"}
          theme={theme}
        />

        <StatCol
          label="Devices"
          value={`${deviceCount} Linked`}
          theme={theme}
        />
      </View>

      <View className="absolute bottom-4 right-4">
        <MaterialIcons name="settings" size={20} color={theme.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

function StatCol({ label, value, color, theme }) {
  return (
    <View className="flex-1 gap-1">
      <Text
        className="text-[10px] uppercase font-semibold"
        style={{ color: theme.textSecondary }}
      >
        {label}
      </Text>
      <Text
        className="text-xs font-medium"
        style={{ color: color || theme.text }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
