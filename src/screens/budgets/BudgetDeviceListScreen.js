import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BudgetDeviceListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode, fontScale } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const { hubName, hubId } = route.params || {
    hubName: "Smart Hub",
    hubId: null,
  };

  const [realDevices, setRealDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [hubLastSeen, setHubLastSeen] = useState(null);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedUnusedDevice, setSelectedUnusedDevice] = useState(null);

  // --- MOCK DEVICES (Kept as requested) ---
  const mockDevices = [
    {
      id: "tv",
      name: "Smart TV",
      icon: "tv",
      currentLoad: "₱ 452.00",
      limit: "₱ 400.00",
      statusText: "Over Limit (113%)",
      type: "warn",
      dbType: "Television",
    },
    {
      id: "outlet",
      name: "Outlet 3",
      icon: "power-off",
      currentLoad: "₱ 0.00",
      limit: "₱ 500.00",
      statusText: "Offline - Short Circuit",
      type: "critical",
      dbType: "Outlet",
    },
  ];

  // --- TIMER: Updates 'now' every second for relative time calc ---
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- REALTIME: Fetch Online/Offline Status (Copied & Improved) ---
  useEffect(() => {
    if (!hubId) return;

    const channel = supabase
      .channel(`budget_hub_${hubId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "hubs",
          filter: `id=eq.${hubId}`,
        },
        (payload) => {
          if (payload.new) {
            if (payload.new.last_seen) {
              setHubLastSeen(payload.new.last_seen);
            }
            // Force immediate UI update when heartbeat arrives
            setNow(Date.now());
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hubId]);

  const fetchRealData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const { data: hubInfo } = await supabase
        .from("hubs")
        .select("last_seen")
        .eq("id", hubId)
        .single();

      if (hubInfo) setHubLastSeen(hubInfo.last_seen);

      const { data: devs, error } = await supabase
        .from("devices")
        .select("*")
        .eq("hub_id", hubId);

      if (error) throw error;

      if (devs && devs.length > 0) {
        devs.sort((a, b) => (a.outlet_number || 0) - (b.outlet_number || 0));
        const startOfMonth = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ).toISOString();

        const promises = devs.map(async (d) => {
          const { data: usage } = await supabase
            .from("usage_analytics")
            .select("cost_incurred")
            .eq("device_id", d.id)
            .gte("date", startOfMonth);

          const totalCost =
            usage?.reduce((sum, row) => sum + (row.cost_incurred || 0), 0) || 0;
          return { ...d, totalCost };
        });

        const formatted = await Promise.all(promises);
        setRealDevices(formatted);
      }
    } catch (err) {
      console.error("Error loading devices:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (hubId) fetchRealData();
    else setLoading(false);
  }, [hubId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRealData(true);
  }, [hubId]);

  const processedRealDevices = realDevices.map((d) => {
    let isHubOnline = false;

    // --- FIX: Increased Threshold to 120s (2 mins) to match Home Screen ---
    if (hubLastSeen) {
      let timeStr = hubLastSeen.replace(" ", "T");
      if (!timeStr.endsWith("Z") && !timeStr.includes("+")) timeStr += "Z";
      const lastSeenMs = new Date(timeStr).getTime();

      if (!isNaN(lastSeenMs)) {
        const diffSeconds = (now - lastSeenMs) / 1000;
        isHubOnline = diffSeconds < 120; // 2 minute buffer
      }
    }

    const isOn = d.status?.toLowerCase() === "on";
    let type = "neutral";
    let statusText = "Off";

    if (!isHubOnline) {
      statusText = "Offline";
    } else if (d.type === "Unused") {
      statusText = "Not Configured";
    } else if (isOn) {
      type = "good";
      const watts =
        d.current_power_watts != null
          ? d.current_power_watts.toFixed(1)
          : "0.0";
      statusText = `Active • ${watts} W`;
    }

    return {
      id: d.id,
      name: d.name || `Outlet ${d.outlet_number}`,
      icon: "power",
      currentLoad:
        d.type === "Unused" ? "---" : `₱ ${(d.totalCost || 0).toFixed(2)}`,
      limit:
        d.type === "Unused"
          ? "---"
          : d.budget_limit
            ? `₱ ${d.budget_limit.toFixed(2)}`
            : "No Limit",
      statusText: statusText,
      type: type,
      isReal: true,
      dbType: d.type,
    };
  });

  const displayList = [...processedRealDevices, ...mockDevices];

  const handleDevicePress = (device) => {
    if (device.dbType === "Unused") {
      setSelectedUnusedDevice(device);
      setShowConfigModal(true);
      return;
    }

    if (device.id === "tv") {
      navigation.navigate("LimitDetail");
      return;
    }

    if (device.id === "outlet") {
      navigation.navigate("FaultDetail");
      return;
    }

    navigation.navigate("BudgetDetail", {
      deviceName: device.name,
      deviceId: device.id,
    });
  };

  const handleGoToConfig = () => {
    setShowConfigModal(false);
    navigation.navigate("HubConfig", { hubId: hubId, fromBudget: true });
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      borderWidth: 1,
      padding: 20,
      borderRadius: 16,
      width: 288,
      alignItems: "center",
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
    },
    modalTitle: {
      fontWeight: "bold",
      marginBottom: 8,
      textAlign: "center",
      color: theme.text,
      fontSize: scaledSize(18),
    },
    modalBody: {
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 20,
      color: theme.textSecondary,
      fontSize: scaledSize(12),
    },
    buttonRow: { flexDirection: "row", gap: 10, width: "100%" },
    modalCancelBtn: {
      flex: 1,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    modalConfirmBtn: {
      flex: 1,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    modalButtonText: {
      fontWeight: "bold",
      fontSize: scaledSize(12),
      textTransform: "uppercase",
    },
  });

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#B0B0B0" />
        <Text
          style={{ marginTop: 12, color: "#B0B0B0", fontSize: scaledSize(12) }}
        >
          Loading Devices...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 20,
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 4 }}
        >
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(20)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        <Text
          style={{
            color: theme.text,
            fontSize: scaledSize(18),
            fontWeight: "bold",
          }}
        >
          Budget Management
        </Text>
        <View style={{ width: scaledSize(20) + 8 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.buttonPrimary}
          />
        }
      >
        <Text
          style={{
            marginBottom: 20,
            color: theme.textSecondary,
            fontSize: scaledSize(13),
          }}
        >
          Select a device from{" "}
          <Text style={{ fontWeight: "700", color: theme.buttonPrimary }}>
            {hubName}
          </Text>{" "}
          to configure spending limits.
        </Text>

        <View style={{ gap: 12 }}>
          {displayList.map((device) => (
            <DeviceRow
              key={device.id}
              data={device}
              theme={theme}
              isDarkMode={isDarkMode}
              scaledSize={scaledSize}
              onPress={() => handleDevicePress(device)}
            />
          ))}
        </View>
      </ScrollView>

      <Modal transparent visible={showConfigModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Outlet Not Configured</Text>
            <Text style={styles.modalBody}>
              {selectedUnusedDevice?.name} is currently marked as{" "}
              <Text style={{ fontWeight: "bold", color: theme.text }}>
                Unused
              </Text>
              .
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setShowConfigModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGoToConfig}
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: theme.buttonPrimary },
                ]}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Configure
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DeviceRow({ data, theme, isDarkMode, onPress, scaledSize }) {
  let iconColor, iconBg, statusTextColor;
  let borderColor = theme.cardBorder;

  if (data.statusText === "Offline") {
    iconColor = theme.textSecondary;
    iconBg = theme.buttonNeutral;
    statusTextColor = theme.textSecondary;
  } else if (data.type === "good") {
    iconColor = theme.buttonPrimary;
    iconBg = `${theme.buttonPrimary}22`;
    statusTextColor = iconColor;
  } else if (data.type === "warn") {
    iconColor = isDarkMode ? "#ffaa00" : "#b37400";
    iconBg = isDarkMode ? "rgba(255, 170, 0, 0.15)" : "rgba(179, 116, 0, 0.1)";
    statusTextColor = iconColor;
    borderColor = iconColor;
  } else if (data.type === "critical") {
    iconColor = isDarkMode ? "#ff4444" : "#c62828";
    iconBg = isDarkMode ? "rgba(255, 68, 68, 0.15)" : "rgba(198, 40, 40, 0.1)";
    statusTextColor = iconColor;
    borderColor = iconColor;
  } else {
    iconColor = theme.textSecondary;
    iconBg = theme.buttonNeutral;
    statusTextColor = theme.textSecondary;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{ marginBottom: 0 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          backgroundColor: theme.card,
          borderColor: borderColor,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: iconBg,
              marginRight: 16,
            }}
          >
            <MaterialIcons
              name={data.icon}
              size={scaledSize(22)}
              color={iconColor}
            />
          </View>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  color: theme.text,
                  fontSize: scaledSize(14),
                  fontWeight: "700",
                  marginBottom: 2,
                }}
              >
                {data.name}
              </Text>
              {data.statusText.includes("Active") && (
                <View
                  style={{
                    backgroundColor: theme.buttonNeutral,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    marginLeft: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "bold",
                      color: theme.buttonPrimary,
                    }}
                  >
                    LIVE
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(11),
                }}
              >
                {data.currentLoad}
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(10),
                  marginHorizontal: 4,
                }}
              >
                •
              </Text>
              <Text
                style={{
                  color: statusTextColor,
                  fontSize: scaledSize(11),
                  fontWeight: "500",
                }}
              >
                {data.statusText}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", marginRight: 10 }}>
          <Text
            style={{
              fontSize: scaledSize(10),
              color: theme.textSecondary,
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Limit
          </Text>
          <Text
            style={{
              fontSize: scaledSize(12),
              color: theme.text,
              fontWeight: "bold",
            }}
          >
            {data.limit}
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={scaledSize(20)}
          color={theme.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}
