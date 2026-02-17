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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

export default function DeviceConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode, fontScale } = useTheme();
  const appState = useRef(AppState.currentState);

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
  });

  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);
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

    // UPDATED: Check 2x per second (500ms) for fast Traffic Light updates
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

  // --- TRAFFIC LIGHT STATUS LOGIC START ---
  let diffInSeconds = 0;
  if (hubData.last_seen) {
    let timeStr = hubData.last_seen.replace(" ", "T");
    if (!timeStr.endsWith("Z") && !timeStr.includes("+")) timeStr += "Z";
    const lastSeenMs = new Date(timeStr).getTime();
    if (!isNaN(lastSeenMs)) {
      diffInSeconds = (now - lastSeenMs) / 1000;
    }
  }

  let statusDetailText = "Initializing...";
  let statusIcon = "wifi-off";
  let statusColor = "#94a3b8"; // Grey default
  let isDanger = false;
  let isOnline = false;

  let displayDiff = Math.max(0, diffInSeconds);

  if (loading) {
    statusDetailText = "Checking Status...";
  }
  // LOGIC 1: HARDWARE FAILURE (Voltage=0 check)
  else if (hubData.current_voltage < 50 && diffInSeconds < 5) {
    statusDetailText = "MAINS POWER FAILURE";
    statusIcon = "flash-off";
    statusColor = "#ef4444"; // Red
    isDanger = true;
    isOnline = false;
  }
  // LOGIC 2: ONLINE (Green) - < 3 seconds
  else if (diffInSeconds < 3) {
    statusDetailText = "Online • Stable";
    statusIcon = "check-circle";
    statusColor = "#22c55e"; // Green
    isOnline = true;
  }
  // LOGIC 3: UNSTABLE WIFI (Yellow) - 3 to 6 seconds
  else if (diffInSeconds < 6) {
    statusDetailText = "Signal Unstable...";
    statusIcon = "wifi";
    statusColor = "#eab308"; // Yellow/Orange
    isOnline = true; // Still considered online
  }
  // LOGIC 4: OFFLINE (Red) - > 6 seconds
  else {
    let timeAgo = "";
    if (displayDiff < 60) timeAgo = `${Math.floor(displayDiff)}s ago`;
    else if (displayDiff < 3600)
      timeAgo = `${Math.floor(displayDiff / 60)}m ago`;
    else timeAgo = `${Math.floor(displayDiff / 3600)}h ago`;

    statusDetailText = `OFFLINE (Power or WiFi) • ${timeAgo}`;
    statusIcon = "cloud-off";
    statusColor = "#ef4444"; // Red
    isDanger = true;
    isOnline = false;
  }

  // Reboot Override
  if (isRestarting) {
    statusDetailText = "System Rebooting...";
    statusIcon = "hourglass-top";
    statusColor = "#3b82f6"; // Blue
  }

  const gradientColors = [statusColor, theme.background];
  // --- TRAFFIC LIGHT STATUS LOGIC END ---

  const openModal = (type) => {
    let config = { visible: true, type, loading: false };
    if (type === "wifi") {
      config = {
        ...config,
        title: "Wi-Fi Setup",
        msg: "Connect to 'GridWatch-Setup' hotspot first.",
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
        msg: "Contacting Hub...",
      }));

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`http://${hubData.ip_address}/reboot`, {
          method: "POST",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error("Failed to reach hub");
        }

        setIsRestarting(true);
        closeModal();

        setTimeout(() => setIsRestarting(false), 15000);
      } catch (e) {
        closeModal();
        navigation.navigate("Disconnected", {
          hubName: hubName || "Hub",
          lastSeen: "Just now",
        });
      }
    } else if (modalState.type === "unpair") {
      setModalState((prev) => ({ ...prev, loading: true }));
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const response = await fetch(`http://${hubData.ip_address}/reset`, {
          method: "POST",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error("Connection Refused");
        await deleteDeviceFromDB();
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
    }
  };

  const dangerColor = isDarkMode ? "#ff4444" : "#c62828";
  const dangerBg = isDarkMode
    ? "rgba(255, 68, 68, 0.1)"
    : "rgba(198, 40, 40, 0.05)";
  const dangerBorder = isDarkMode
    ? "rgba(255, 68, 68, 0.3)"
    : "rgba(198, 40, 40, 0.2)";

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
    heroContainer: {
      paddingTop: 110,
      paddingBottom: 25,
      alignItems: "center",
    },
    heroIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(0,0,0,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
      borderWidth: 1,
      // Dynamic border color handled inline
      position: "relative",
    },
    heroTitle: {
      fontSize: scaledSize(28),
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 2,
    },
    heroSubtitle: {
      fontSize: scaledSize(14),
      color: "rgba(255,255,255,0.9)",
    },
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
    modalBtnRow: {
      flexDirection: "row",
      gap: 10,
      width: "100%",
    },
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
      >
        <LinearGradient colors={gradientColors} style={styles.heroContainer}>
          {/* Updated Hero Icon to match Traffic Light Logic */}
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
          {/* System Info */}
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
            <View
              style={{
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottomWidth: 0,
              }}
            >
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(14),
                  fontWeight: "500",
                }}
              >
                Firmware
              </Text>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: theme.text, fontSize: scaledSize(14) }}>
                  v{hubData.current_firmware}
                </Text>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(10),
                  }}
                >
                  Auto updates
                </Text>
              </View>
            </View>
          </View>

          {/* Network Connection */}
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

          {/* Outlet Configuration */}
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

          {/* Advanced Actions */}
          <Text style={styles.sectionTitle}>Advanced Actions</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isRestarting}
            onPress={() => openModal("restart")}
            style={[
              styles.actionBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                opacity: isRestarting ? 0.5 : 1,
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
            disabled={isRestarting}
            onPress={() => openModal("unpair")}
            style={[
              styles.actionBtn,
              {
                backgroundColor: dangerBg,
                borderColor: dangerBorder,
                opacity: isRestarting ? 0.5 : 1,
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

      {/* Modal Overlay */}
      <Modal
        transparent
        visible={modalState.visible}
        animationType="fade"
        onRequestClose={closeModal}
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
                {/* Cancel Button */}
                {(modalState.type === "restart" ||
                  modalState.type === "unpair" ||
                  modalState.type === "force_unpair" ||
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

                {/* Confirm Button */}
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
                    modalState.type === "wifi" || modalState.type === "success"
                      ? closeModal
                      : handleConfirm
                  }
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    {modalState.type === "wifi" || modalState.type === "success"
                      ? "Okay"
                      : modalState.type === "force_unpair"
                        ? "Force Remove"
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
