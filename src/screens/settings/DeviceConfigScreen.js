import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

export default function DeviceConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();

  const { hubName, hubId } = route.params || {};

  const [hubData, setHubData] = useState({
    wifi_ssid: "Loading...",
    ip_address: "---",
    model: "GW-ESP32-PRO",
    serial_number: "---",
    last_seen: null,
    current_firmware: "1.0.0",
  });

  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    const fetchHubInfo = async () => {
      const { data, error } = await supabase
        .from("hubs")
        .select("*")
        .eq("id", hubId)
        .single();

      if (!error && data) {
        setHubData(data);
      }
      setLoading(false);
    };

    if (hubId) fetchHubInfo();

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
          setHubData((prev) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    const timer = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [hubId]);

  let isOnline = false;
  let diffInSeconds = 0;
  let statusDetailText = "Checking...";
  let statusColor = theme.textSecondary;
  let statusBg = "transparent";
  let statusIcon = "help-outline";

  if (hubData.last_seen) {
    let timeStr = hubData.last_seen.replace(" ", "T");
    if (!timeStr.endsWith("Z") && !timeStr.includes("+")) {
      timeStr += "Z";
    }
    const lastSeenMs = new Date(timeStr).getTime();
    if (!isNaN(lastSeenMs)) {
      diffInSeconds = (now - lastSeenMs) / 1000;
      isOnline = diffInSeconds < 8 && diffInSeconds > -5;
    }
  }

  if (isRestarting) {
    statusDetailText = "System Rebooting...";
    statusColor = "#FFC107";
    statusBg = "rgba(255, 193, 7, 0.15)";
    statusIcon = "hourglass-top";
  } else if (isOnline) {
    statusDetailText = "Online • Stable";
    statusColor = theme.primary;
    statusBg = isDarkMode ? "rgba(0, 255, 153, 0.1)" : "rgba(0, 153, 94, 0.1)";
    statusIcon = "router";
  } else if (!loading) {
    let displayDiff = Math.max(1, diffInSeconds - 7);
    let timeAgo = "";
    if (displayDiff < 60) timeAgo = `${Math.floor(displayDiff)}s ago`;
    else if (displayDiff < 3600)
      timeAgo = `${Math.floor(displayDiff / 60)}m ago`;
    else if (displayDiff < 86400)
      timeAgo = `${Math.floor(displayDiff / 3600)}h ago`;
    else timeAgo = `${Math.floor(displayDiff / 86400)}d ago`;

    statusDetailText = `Offline • Seen ${timeAgo}`;
    statusColor = "#ff4444";
    statusBg = "rgba(255, 68, 68, 0.1)";
    statusIcon = "wifi-off";
  } else {
    statusDetailText = "Offline • Never Seen";
    statusColor = "#ff4444";
    statusBg = "rgba(255, 68, 68, 0.1)";
    statusIcon = "wifi-off";
  }

  const [modalState, setModalState] = useState({
    visible: false,
    type: null,
    title: "",
    msg: "",
    icon: "",
    iconColor: "",
    loading: false,
  });

  const openModal = (type) => {
    let config = { visible: true, type, loading: false };

    if (type === "wifi") {
      config = {
        ...config,
        title: "Wi-Fi Setup",
        msg: "To change Wi-Fi, please connect to 'GridWatch-Setup' hotspot first.",
        icon: "wifi-find",
        iconColor: isDarkMode ? "#ffaa00" : "#b37400",
      };
    } else if (type === "restart") {
      config = {
        ...config,
        title: "Restart Hub?",
        msg: "The device will go offline for approximately 10 seconds.",
        icon: "warning",
        iconColor: isDarkMode ? "#ffaa00" : "#b37400",
      };
    } else if (type === "unpair") {
      config = {
        ...config,
        title: "Reset & Unpair?",
        msg: "This will wipe the Hub's Wi-Fi memory, delete ALL connected devices, and remove this Hub from your account.",
        icon: "delete-forever",
        iconColor: isDarkMode ? "#ff4444" : "#c62828",
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
      msg: "Removing device from your account...",
    }));

    try {
      await supabase.from("devices").delete().eq("hub_id", hubId);
      const { error } = await supabase.from("hubs").delete().eq("id", hubId);
      if (error) throw error;

      setModalState({
        visible: true,
        type: "success",
        title: "Unlinked",
        msg: "Device removed successfully.",
        icon: "check-circle",
        iconColor: "#00995e",
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
        icon: "error",
        iconColor: "#ff4444",
        loading: false,
      });
    }
  };

  const handleConfirm = async () => {
    if (modalState.type === "restart") {
      setModalState((prev) => ({
        ...prev,
        loading: true,
        title: "Sending Command...",
        msg: "Contacting Hub...",
      }));

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        await fetch(`http://${hubData.ip_address}/reboot`, {
          method: "POST",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } catch (e) {
        closeModal();
        navigation.navigate("Disconnected", {
          hubName: hubName,
          lastSeen: "Just now",
        });
        return;
      }

      setIsRestarting(true);
      let countdown = 10;
      setModalState((prev) => ({
        ...prev,
        title: "Restarting Device...",
        msg: `Please wait while the system reboots.\nTime remaining: ${countdown}s`,
      }));

      const intervalId = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(intervalId);
          setIsRestarting(false);
          closeModal();
        } else {
          setModalState((prev) => ({
            ...prev,
            msg: `Please wait while the system reboots.\nTime remaining: ${countdown}s`,
          }));
        }
      }, 1000);
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
          msg: "Please turn on the Hub if you want to erase its data, or you can Force Remove it from the app only.",
          icon: "wifi-off",
          iconColor: isDarkMode ? "#ffaa00" : "#ff8c00",
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

  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: theme.background }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

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
        className="flex-row items-center justify-between px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={18}
            color={theme.textSecondary}
          />
          <Text
            className="text-sm font-medium ml-1"
            style={{ color: theme.textSecondary }}
          >
            Back
          </Text>
        </TouchableOpacity>
        <Text className="text-base font-bold" style={{ color: theme.text }}>
          Device Configuration
        </Text>
        <View className="w-[50px]" />
      </View>

      <ScrollView>
        <View className="p-6">
          <View
            className="items-center py-5 border-b mb-5"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            <View
              className="w-20 h-20 rounded-full border-2 justify-center items-center mb-4"
              style={{ borderColor: statusColor, backgroundColor: statusBg }}
            >
              <MaterialIcons name={statusIcon} size={40} color={statusColor} />
            </View>
            <Text
              className="text-lg font-bold mb-1.5"
              style={{ color: theme.text }}
            >
              {hubName || "GridWatch Hub"}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              <Text
                className="text-xs font-semibold"
                style={{ color: statusColor }}
              >
                {statusDetailText}
              </Text>
            </View>
          </View>

          <Text
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary }}
          >
            System Information
          </Text>
          <View
            className="rounded-2xl border overflow-hidden mb-5"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <InfoItem label="Model" value={hubData.model} theme={theme} />
            <InfoItem
              label="Serial Number"
              value={hubData.serial_number}
              theme={theme}
            />
            <View
              className="p-4 flex-row justify-between border-b"
              style={{ borderBottomColor: theme.cardBorder }}
            >
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                Firmware
              </Text>
              <View className="items-end">
                <Text
                  className="text-sm font-mono"
                  style={{ color: theme.text }}
                >
                  v{hubData.current_firmware}
                </Text>
                <Text
                  className="text-[10px]"
                  style={{ color: theme.textSecondary }}
                >
                  Auto updates
                </Text>
              </View>
            </View>
          </View>

          <Text
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary }}
          >
            Network Connection
          </Text>
          <View
            className="p-4 rounded-2xl border flex-row justify-between items-center mb-6"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="flex-row items-center gap-3">
              <MaterialIcons
                name="wifi"
                size={24}
                color={theme.textSecondary}
              />
              <View>
                <Text
                  className="text-sm font-semibold"
                  style={{ color: theme.text }}
                >
                  {hubData.wifi_ssid}
                </Text>
                <Text
                  className="text-[11px] mt-0.5"
                  style={{ color: theme.textSecondary }}
                >
                  IP: {hubData.ip_address}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="px-3 py-1.5 rounded-lg border"
              style={{
                backgroundColor: isDarkMode ? "#333" : "#f0f0f0",
                borderColor: theme.cardBorder,
              }}
              onPress={() => openModal("wifi")}
            >
              <Text
                className="text-[11px] font-semibold"
                style={{ color: theme.text }}
              >
                Change
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary }}
          >
            Outlet Configuration
          </Text>
          <TouchableOpacity
            className="flex-row items-center justify-between p-4 rounded-2xl border mb-6"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            onPress={() =>
              navigation.navigate("HubConfig", {
                hubId: hubData.serial_number,
              })
            }
          >
            <View className="flex-row items-center gap-3">
              <View
                className="w-10 h-10 rounded-full justify-center items-center"
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
                }}
              >
                <MaterialIcons
                  name="settings-input-component"
                  size={20}
                  color={theme.textSecondary}
                />
              </View>
              <View>
                <Text
                  className="text-sm font-bold"
                  style={{ color: theme.text }}
                >
                  Edit Outlet Devices
                </Text>
                <Text
                  className="text-[11px]"
                  style={{ color: theme.textSecondary }}
                >
                  Rename appliances and change types
                </Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <Text
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary }}
          >
            Advanced Actions
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 p-3.5 rounded-xl border mb-4"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            onPress={() => openModal("restart")}
          >
            <MaterialIcons name="restart-alt" size={18} color={theme.text} />
            <Text
              className="font-semibold text-sm"
              style={{ color: theme.text }}
            >
              Restart Hub
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 p-3.5 rounded-xl border mb-3"
            style={{ backgroundColor: dangerBg, borderColor: dangerBorder }}
            onPress={() => openModal("unpair")}
          >
            <MaterialIcons name="link-off" size={18} color={dangerColor} />
            <Text
              className="font-semibold text-sm"
              style={{ color: dangerColor }}
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
        onRequestClose={closeModal}
      >
        <View className="flex-1 bg-black/80 justify-center items-center">
          <View
            className="w-[280px] p-6 rounded-[20px] border items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            {modalState.loading ? (
              <ActivityIndicator
                size="large"
                color={theme.primary}
                className="my-5"
              />
            ) : (
              <MaterialIcons
                name={modalState.icon}
                size={40}
                color={modalState.iconColor}
                style={{ marginBottom: 15 }}
              />
            )}
            <Text
              className="text-lg font-bold mb-2.5"
              style={{ color: theme.text }}
            >
              {modalState.title}
            </Text>
            <Text
              className="text-[13px] text-center mb-6 leading-5"
              style={{ color: theme.textSecondary }}
            >
              {modalState.msg}
            </Text>
            {!modalState.loading && (
              <View className="flex-row w-full justify-center">
                {(modalState.type === "restart" ||
                  modalState.type === "unpair" ||
                  modalState.type === "force_unpair" ||
                  modalState.type === "error") && (
                  <TouchableOpacity
                    className="flex-1 h-10 rounded-lg justify-center items-center mr-2.5 border"
                    style={{ borderColor: theme.cardBorder }}
                    onPress={closeModal}
                  >
                    <Text className="font-bold" style={{ color: theme.text }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  className="flex-1 h-10 rounded-lg justify-center items-center"
                  style={{
                    backgroundColor:
                      modalState.type === "unpair" ||
                      modalState.type === "force_unpair" ||
                      modalState.type === "error"
                        ? "#c62828"
                        : "#00995e",
                  }}
                  onPress={
                    modalState.type === "wifi" || modalState.type === "success"
                      ? closeModal
                      : handleConfirm
                  }
                >
                  <Text className="text-white font-bold">
                    {modalState.type === "wifi" || modalState.type === "success"
                      ? "Okay"
                      : modalState.type === "force_unpair"
                      ? "Force Remove"
                      : "Confirm"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoItem({ label, value, theme }) {
  return (
    <View
      className="p-4 flex-row justify-between border-b"
      style={{ borderBottomColor: theme.cardBorder }}
    >
      <Text className="text-sm" style={{ color: theme.textSecondary }}>
        {label}
      </Text>
      <Text className="text-sm font-mono" style={{ color: theme.text }}>
        {value}
      </Text>
    </View>
  );
}
