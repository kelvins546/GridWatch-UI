import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  AppState,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons"; // ADDED FontAwesome5 for temp icon
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

// --- FIRMWARE UPDATE CONFIGURATION ---
const LATEST_FIRMWARE_VERSION = "1.8.0";

const checkUpdateAvailable = (current, latest) => {
  if (!current || !latest) return false;
  const currParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);
  for (let i = 0; i < Math.max(currParts.length, latestParts.length); i++) {
    const c = currParts[i] || 0;
    const l = latestParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
};

export default function DeviceConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode, fontScale } = useTheme();
  const appState = useRef(AppState.currentState);

  // --- TIMERS & TRACKING ---
  const otaTimeoutRef = useRef(null);
  const successTimeoutRef = useRef(null);

  const [preUpdateVersion, setPreUpdateVersion] = useState(null);

  const scaledSize = (size) => size * fontScale;

  const { hubName, hubId } = route.params || {};

  const pulseAnim = useRef(new Animated.Value(0)).current;

  const [hubData, setHubData] = useState({
    wifi_ssid: "Loading...",
    ip_address: "---",
    model: "GW-ESP32-PRO",
    serial_number: "---",
    last_seen: null,
    current_firmware: "1.0.0",
    current_voltage: 0,
    core_temperature: null, // NEW: Temperature State
    update_command_url: "",
  });

  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);
  const [rebootStartTime, setRebootStartTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [modalState, setModalState] = useState({
    visible: false,
    type: null,
    title: "",
    msg: "",
    loading: false,
  });

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("MainApp", { screen: "Home" });
    }
  };

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  const fetchHubInfo = async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true);

    const { data, error } = await supabase
      .from("hubs")
      .select("*")
      .eq("id", hubId)
      .single();

    if (!error && data) {
      setHubData(data);
      setNow(Date.now());
    }

    if (showLoader) setIsRefreshing(false);
    setLoading(false);
  };

  const onRefresh = () => {
    fetchHubInfo(true);
  };

  useEffect(() => {
    let mounted = true;
    fetchHubInfo();

    const channel = supabase
      .channel(`device_config_${hubId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "hubs",
          filter: `id=eq.${hubId}`,
        },
        (payload) => {
          if (mounted) {
            setHubData((prev) => ({ ...prev, ...payload.new }));
            setNow(Date.now());
          }
        },
      )
      .subscribe();

    const timer = setInterval(() => {
      if (mounted) setNow(Date.now());
    }, 500);

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        fetchHubInfo(true);
      }
      appState.current = nextAppState;
    });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      clearInterval(timer);
      subscription.remove();
    };
  }, [hubId]);

  useEffect(() => {
    return () => {
      if (otaTimeoutRef.current) clearTimeout(otaTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  // ====================================================================
  // DYNAMIC REBOOT SYNC: Clears UI the exact second the hub reconnects!
  // ====================================================================
  useEffect(() => {
    if (isRestarting && rebootStartTime && hubData.last_seen) {
      const elapsed = Date.now() - rebootStartTime;
      // Wait 6 seconds to ensure the hardware has fully shut off first
      if (elapsed > 6000) {
        let timeStr = String(hubData.last_seen).replace(" ", "T");
        if (!timeStr.endsWith("Z") && !timeStr.includes("+")) timeStr += "Z";
        const lastSeenMs = new Date(timeStr).getTime();
        const currentDiff = (Date.now() - lastSeenMs) / 1000;

        // If diff is < 8 seconds, it means the Hub is sending fresh heartbeats again!
        if (currentDiff < 8) {
          setIsRestarting(false);
          setRebootStartTime(null);
        }
      }
    }
  }, [now, isRestarting, rebootStartTime, hubData.last_seen]);

  // ====================================================================
  // DYNAMIC OTA SYNC: Watches for ANY change in the firmware version!
  // ====================================================================
  useEffect(() => {
    if (modalState.type === "updating_locked") {
      const currentUrl = hubData.update_command_url || "";
      if (currentUrl === "") {
        setModalState({
          visible: true,
          type: "updating_rebooting",
          title: "Installing OS...",
          msg: "Hardware received the file and is flashing the update. Waiting for reboot verification...",
          loading: true,
        });
      }
    }

    if (
      modalState.type === "updating_locked" ||
      modalState.type === "updating_rebooting"
    ) {
      if (
        preUpdateVersion &&
        hubData.current_firmware !== preUpdateVersion &&
        hubData.current_firmware !== "Loading..."
      ) {
        if (otaTimeoutRef.current) clearTimeout(otaTimeoutRef.current);

        setModalState({
          visible: true,
          type: "success",
          title: "Update Successful!",
          msg: `Hub updated from v${preUpdateVersion} to v${hubData.current_firmware}!`,
          loading: false,
        });

        setPreUpdateVersion(null);

        successTimeoutRef.current = setTimeout(() => closeModal(), 3500);
      }
    }
  }, [
    hubData.update_command_url,
    hubData.current_firmware,
    modalState.type,
    preUpdateVersion,
  ]);

  // --- TRAFFIC LIGHT STATUS LOGIC START ---
  let diffInSeconds = 0;
  if (hubData.last_seen) {
    let timeStr = String(hubData.last_seen).replace(" ", "T");
    if (!timeStr.endsWith("Z") && !timeStr.includes("+")) timeStr += "Z";
    const lastSeenMs = new Date(timeStr).getTime();
    if (!isNaN(lastSeenMs)) {
      diffInSeconds = (now - lastSeenMs) / 1000;
    }
  }

  let statusDetailText = "Initializing...";
  let statusIcon = "wifi-off";
  let statusColor = "#94a3b8";
  let isOnline = false;

  let displayDiff = Math.max(0, diffInSeconds);

  if (loading) {
    statusDetailText = "Checking Status...";
  } else if (diffInSeconds < 35) {
    statusDetailText = "Online • Stable";
    statusIcon = "router";
    statusColor = "#22c55e";
    isOnline = true;
  } else if (diffInSeconds < 65) {
    statusDetailText = "Signal Unstable...";
    statusIcon = "wifi";
    statusColor = "#eab308";
    isOnline = true;
  } else {
    let timeAgo = "";
    if (displayDiff < 60) timeAgo = `${Math.floor(displayDiff)}s ago`;
    else if (displayDiff < 3600)
      timeAgo = `${Math.floor(displayDiff / 60)}m ago`;
    else timeAgo = `${Math.floor(displayDiff / 3600)}h ago`;

    statusDetailText = `OFFLINE (Power or WiFi) • ${timeAgo}`;
    statusIcon = "cloud-off";
    statusColor = "#ef4444";
    isOnline = false;
  }

  if (isRestarting) {
    statusDetailText = "System Rebooting...";
    statusIcon = "hourglass-top";
    statusColor = "#3b82f6";
  }

  const gradientColors = [statusColor, theme.background];
  // --- TRAFFIC LIGHT STATUS LOGIC END ---

  const rawUrl = hubData.update_command_url || "";
  const isCurrentlyUpdating = rawUrl.endsWith("#trigger");

  const isProcessingCommand =
    rawUrl === "COMMAND_RESTART" ||
    rawUrl === "COMMAND_UNPAIR" ||
    rawUrl === "COMMAND_CHANGE_WIFI";

  const hasUpdateUrl =
    rawUrl.length > 10 && !isCurrentlyUpdating && !isProcessingCommand;

  const openModal = (type) => {
    let config = { visible: true, type, loading: false };
    if (type === "wifi") {
      config = {
        ...config,
        title: "Change Wi-Fi?",
        msg: "This safely disconnects the Hub from its current Wi-Fi and reboots it into Setup Mode. Your appliances and energy history will NOT be deleted.",
      };
    } else if (type === "restart") {
      config = {
        ...config,
        title: "Restart Hub?",
        msg: "Device will go offline for ~10 seconds.",
      };
    } else if (type === "unpair") {
      config = {
        ...config,
        title: "Reset & Unpair?",
        msg: "This removes the Hub and all devices from your account.",
      };
    } else if (type === "update_firmware") {
      config = {
        ...config,
        title: "Update Firmware?",
        msg: "Start the OTA Update? ALL appliances will be securely locked OFF during the process.",
      };
    }
    setModalState(config);
  };

  const closeModal = () => setModalState({ ...modalState, visible: false });

  const deleteDeviceFromDB = async () => {
    setModalState((prev) => ({
      ...prev,
      loading: true,
      title: "Unpairing...",
      msg: "Removing device...",
    }));
    try {
      await supabase.from("devices").delete().eq("hub_id", hubId);
      const { error } = await supabase.from("hubs").delete().eq("id", hubId);
      if (error) throw error;
      setModalState({
        visible: true,
        type: "success",
        title: "Unlinked",
        msg: "Device removed.",
        loading: false,
      });
      setTimeout(() => {
        closeModal();
        navigation.navigate("MainApp", { screen: "Home" });
      }, 1500);
    } catch (err) {
      setModalState({
        visible: true,
        type: "error",
        title: "Error",
        msg: err.message,
        loading: false,
      });
    }
  };

  const handleConfirm = async () => {
    if (modalState.type === "restart") {
      setModalState((prev) => ({
        ...prev,
        loading: true,
        msg: "Sending restart command...",
      }));
      try {
        const { error } = await supabase
          .from("hubs")
          .update({ update_command_url: "COMMAND_RESTART" })
          .eq("id", hubId);

        if (error) throw error;

        setIsRestarting(true);
        setRebootStartTime(Date.now());
        closeModal();
        setTimeout(() => {
          setIsRestarting(false);
          setRebootStartTime(null);
        }, 15000);
      } catch (e) {
        closeModal();
        setModalState({
          visible: true,
          type: "error",
          title: "Command Failed",
          msg: "Could not send restart command.",
          loading: false,
        });
      }
    } else if (modalState.type === "wifi") {
      setModalState((prev) => ({
        ...prev,
        loading: true,
        msg: "Sending Wi-Fi reset command...",
      }));
      try {
        // Send command to cloud
        const { error } = await supabase
          .from("hubs")
          .update({ update_command_url: "COMMAND_CHANGE_WIFI" })
          .eq("id", hubId);

        if (error) throw error;

        // Try local fallback just in case we are on the same network
        try {
          if (hubData?.ip_address && hubData.ip_address !== "---") {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 2000);
            await fetch(`http://${hubData.ip_address}/reset`, {
              method: "POST",
              signal: controller.signal,
            });
          }
        } catch (e) {
          // Ignore local error
        }

        closeModal();
        navigation.navigate("SetupHub"); // Redirect user to provisioning screen
      } catch (e) {
        closeModal();
        setModalState({
          visible: true,
          type: "error",
          title: "Command Failed",
          msg: "Could not send Wi-Fi reset command.",
          loading: false,
        });
      }
    } else if (modalState.type === "unpair") {
      setModalState((prev) => ({ ...prev, loading: true }));
      try {
        await supabase
          .from("hubs")
          .update({ update_command_url: "COMMAND_UNPAIR" })
          .eq("id", hubId);

        setTimeout(async () => {
          await deleteDeviceFromDB();
        }, 2000);
      } catch (e) {
        setModalState({
          visible: true,
          type: "force_unpair",
          title: "Device Offline",
          msg: "Hub is offline. Force remove from app?",
          loading: false,
        });
      }
    } else if (modalState.type === "force_unpair") {
      await deleteDeviceFromDB();
    } else if (modalState.type === "update_firmware") {
      setPreUpdateVersion(hubData.current_firmware);

      if (otaTimeoutRef.current) clearTimeout(otaTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);

      setModalState({
        visible: true,
        type: "updating_locked",
        title: "Downloading OS...",
        msg: "Please do not close the app. Appliances are safely locked. Hub is downloading...",
        loading: true,
      });

      try {
        let currentUrl = hubData.update_command_url || "";
        let triggerUrl = currentUrl;
        if (!triggerUrl.endsWith("#trigger")) {
          triggerUrl += "#trigger";
        }

        setHubData((prev) => ({ ...prev, update_command_url: triggerUrl }));

        const { error } = await supabase
          .from("hubs")
          .update({ update_command_url: triggerUrl, status: "online" })
          .eq("id", hubId);

        if (error) throw error;

        otaTimeoutRef.current = setTimeout(() => {
          setModalState((prev) => {
            if (
              prev.type === "updating_locked" ||
              prev.type === "updating_rebooting"
            ) {
              setPreUpdateVersion(null);
              return {
                visible: true,
                type: "error",
                title: "Timeout",
                msg: "Hub failed to report back online. It may have failed to update.",
                loading: false,
              };
            }
            return prev;
          });
        }, 45000);
      } catch (err) {
        setPreUpdateVersion(null);
        setModalState({
          visible: true,
          type: "error",
          title: "Failed",
          msg: err.message,
          loading: false,
        });
      }
    }
  };

  const dangerColor = isDarkMode ? "#ff4444" : "#c62828";
  const dangerBg = isDarkMode
    ? "rgba(255, 68, 68, 0.1)"
    : "rgba(198, 40, 40, 0.05)";
  const dangerBorder = isDarkMode
    ? "rgba(255, 68, 68, 0.3)"
    : "rgba(198, 40, 40, 0.2)";

  // Dynamic Temperature Styling
  let tempColor = theme.text;
  let tempIcon = "thermometer-empty";
  const tempVal = hubData.core_temperature;

  if (tempVal !== null && tempVal !== undefined) {
    if (tempVal > 60) {
      tempColor = dangerColor;
      tempIcon = "thermometer-full";
    } else if (tempVal > 45) {
      tempColor = isDarkMode ? "#ffaa00" : "#ff9900";
      tempIcon = "thermometer-half";
    } else {
      tempColor = "#22c55e"; // Healthy Green
      tempIcon = "thermometer-quarter";
    }
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    headerOverlay: {
      position: "absolute",
      top: Platform.OS === "android" ? 60 : 60,
      left: 24,
      right: 24,
      zIndex: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    heroContainer: { paddingTop: 110, paddingBottom: 25, alignItems: "center" },
    heroIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(0,0,0,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
      borderWidth: 1,
      position: "relative",
    },
    heroTitle: {
      fontSize: scaledSize(28),
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 2,
    },
    heroSubtitle: { fontSize: scaledSize(14), color: "rgba(255,255,255,0.9)" },
    sectionTitle: {
      fontSize: scaledSize(11),
      fontWeight: "bold",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 12,
    },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 24,
    },
    actionBtn: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 16,
      marginBottom: 12,
      borderRadius: 16,
      gap: 10,
      borderWidth: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: 288,
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 8,
      textAlign: "center",
    },
    modalMsg: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 20,
    },
    modalBtnRow: { flexDirection: "row", gap: 10, width: "100%" },
    modalBtn: {
      flex: 1,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
  });

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color="#B0B0B0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <View style={styles.headerOverlay}>
        <TouchableOpacity
          onPress={handleBack}
          style={{
            padding: 4,
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: 20,
          }}
        >
          <MaterialIcons name="arrow-back" size={scaledSize(24)} color="#fff" />
        </TouchableOpacity>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.text}
            colors={[theme.buttonPrimary]}
          />
        }
      >
        <LinearGradient colors={gradientColors} style={styles.heroContainer}>
          <View
            style={[styles.heroIconContainer, { borderColor: statusColor }]}
          >
            <Animated.View
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: 9999,
                borderWidth: 2,
                borderColor: statusColor,
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              }}
            />
            <MaterialIcons name={statusIcon} size={40} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>{hubName || "Hub"}</Text>
          <Text style={styles.heroSubtitle}>
            {isRefreshing ? "Checking Status..." : statusDetailText}
          </Text>
        </LinearGradient>

        <View style={{ padding: 24 }}>
          <Text style={styles.sectionTitle}>System Information</Text>
          <View style={styles.card}>
            <InfoItem
              label="Model"
              value={hubData.model}
              theme={theme}
              scaledSize={scaledSize}
            />
            <InfoItem
              label="Serial Number"
              value={hubData.serial_number}
              theme={theme}
              scaledSize={scaledSize}
            />

            {/* --- ADDED: ESP32 Core Temperature Row --- */}
            <View
              style={{
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottomWidth: 1,
                borderBottomColor: theme.cardBorder,
              }}
            >
              <View>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(14),
                    fontWeight: "500",
                  }}
                >
                  Core Temperature
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <FontAwesome5
                  name={tempIcon}
                  size={16}
                  color={tempColor}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: tempColor,
                    fontSize: scaledSize(14),
                    fontWeight: "bold",
                    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                  }}
                >
                  {tempVal !== null && tempVal !== undefined
                    ? `${tempVal.toFixed(1)} °C`
                    : "---"}
                </Text>
              </View>
            </View>

            <View
              style={{
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottomWidth: 0,
              }}
            >
              <View>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(14),
                    fontWeight: "500",
                  }}
                >
                  Firmware
                </Text>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: scaledSize(14),
                    marginTop: 2,
                  }}
                >
                  v{hubData.current_firmware}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                {isCurrentlyUpdating ||
                modalState.type === "updating_locked" ||
                modalState.type === "updating_rebooting" ? (
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: theme.buttonPrimary,
                      opacity: 0.8,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: scaledSize(11),
                        fontWeight: "600",
                      }}
                    >
                      Updating...
                    </Text>
                  </View>
                ) : hasUpdateUrl ? (
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: theme.buttonPrimary,
                      opacity: !isOnline || isRestarting ? 0.5 : 1,
                    }}
                    disabled={!isOnline || isRestarting}
                    onPress={() => openModal("update_firmware")}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: scaledSize(11),
                        fontWeight: "600",
                      }}
                    >
                      Update Available
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: scaledSize(11),
                        fontWeight: "600",
                      }}
                    >
                      Up to date
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Network Connection</Text>
          <View
            style={[
              styles.card,
              {
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <MaterialIcons
                name="wifi"
                size={scaledSize(24)}
                color={theme.textSecondary}
              />
              <View>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: scaledSize(14),
                    fontWeight: "600",
                  }}
                >
                  {hubData.wifi_ssid}
                </Text>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(11),
                    marginTop: 2,
                  }}
                >
                  IP: {hubData.ip_address}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: isDarkMode ? "#333" : "#f0f0f0",
                borderWidth: 1,
                borderColor: theme.cardBorder,
                opacity: isRestarting ? 0.5 : 1,
              }}
              disabled={isRestarting}
              onPress={() => openModal("wifi")}
            >
              <Text
                style={{
                  color: theme.text,
                  fontSize: scaledSize(11),
                  fontWeight: "600",
                }}
              >
                Change
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Outlet Configuration</Text>
          <TouchableOpacity
            style={[
              styles.card,
              {
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: isRestarting ? 0.5 : 1,
              },
            ]}
            disabled={isRestarting}
            onPress={() =>
              navigation.navigate("HubConfig", {
                hubId: hubData.serial_number || hubId,
                fromBudget: true,
                status: isOnline ? "Online" : "Offline",
              })
            }
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons
                  name="settings-input-component"
                  size={scaledSize(20)}
                  color={theme.textSecondary}
                />
              </View>
              <View>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: scaledSize(14),
                    fontWeight: "bold",
                  }}
                >
                  Edit Outlet Devices
                </Text>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(11),
                  }}
                >
                  Rename appliances & types
                </Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={scaledSize(24)}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Advanced Actions</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isRestarting || isProcessingCommand}
            onPress={() => openModal("restart")}
            style={[
              styles.actionBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                opacity: isRestarting || isProcessingCommand ? 0.5 : 1,
              },
            ]}
          >
            <MaterialIcons
              name="restart-alt"
              size={scaledSize(20)}
              color={theme.text}
            />
            <Text
              style={{
                color: theme.text,
                fontSize: scaledSize(15),
                fontWeight: "600",
              }}
            >
              Restart Hub
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isRestarting || isProcessingCommand}
            onPress={() => openModal("unpair")}
            style={[
              styles.actionBtn,
              {
                backgroundColor: dangerBg,
                borderColor: dangerBorder,
                opacity: isRestarting || isProcessingCommand ? 0.5 : 1,
              },
            ]}
          >
            <MaterialIcons
              name="link-off"
              size={scaledSize(20)}
              color={dangerColor}
            />
            <Text
              style={{
                color: dangerColor,
                fontSize: scaledSize(15),
                fontWeight: "600",
              }}
            >
              Unpair & Reset
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={modalState.visible}
        animationType="fade"
        onRequestClose={() => {
          if (!modalState.loading) {
            closeModal();
          }
        }}
      >
        <View style={styles.modalOverlay}>
          {modalState.loading ? (
            <View style={styles.modalContent}>
              <ActivityIndicator size="large" color="#B0B0B0" />
              <Text
                style={{
                  color: "#B0B0B0",
                  marginTop: 15,
                  fontSize: 12,
                  fontWeight: "500",
                  textAlign: "center",
                  paddingHorizontal: 10,
                  lineHeight: 18,
                }}
              >
                {modalState.msg}
              </Text>
            </View>
          ) : (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{modalState.title}</Text>
              <Text style={styles.modalMsg}>{modalState.msg}</Text>

              <View style={styles.modalBtnRow}>
                {(modalState.type === "restart" ||
                  modalState.type === "unpair" ||
                  modalState.type === "wifi" ||
                  modalState.type === "force_unpair" ||
                  modalState.type === "update_firmware" ||
                  modalState.type === "error") && (
                  <TouchableOpacity
                    style={[styles.modalBtn, { borderColor: theme.cardBorder }]}
                    onPress={closeModal}
                  >
                    <Text style={{ color: theme.text, fontWeight: "bold" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor:
                        modalState.type === "unpair" ||
                        modalState.type === "force_unpair" ||
                        modalState.type === "error"
                          ? theme.buttonDangerText
                          : theme.buttonPrimary,
                      borderWidth: 0,
                    },
                  ]}
                  onPress={
                    modalState.type === "success" ? closeModal : handleConfirm
                  }
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    {modalState.type === "success"
                      ? "Okay"
                      : modalState.type === "force_unpair"
                        ? "Force Remove"
                        : modalState.type === "wifi"
                          ? "Change Wi-Fi"
                          : "Confirm"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

function InfoItem({ label, value, theme, scaledSize }) {
  return (
    <View
      style={{
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: theme.cardBorder,
      }}
    >
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: scaledSize(14),
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: theme.text,
          fontSize: scaledSize(14),
          fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
