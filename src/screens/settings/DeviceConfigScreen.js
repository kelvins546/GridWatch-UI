import React, { useState } from "react";
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

export default function DeviceConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();

  // 1. GET PARAMS (Added 'status')
  const { hubName, hubId, status = "Online" } = route.params || {};

  // 2. DEFINE STATUS LOGIC
  const isOffline = status === "Offline";
  const statusColor = isOffline ? "#ff4444" : theme.primary; // Red if offline
  const statusBg = isOffline
    ? "rgba(255, 68, 68, 0.1)" // Red tint
    : isDarkMode
    ? "rgba(0, 255, 153, 0.1)"
    : "rgba(0, 153, 94, 0.1)";
  const statusIcon = isOffline ? "wifi-off" : "router";
  const statusText = isOffline ? "Offline • Check Power" : "Online • Stable";

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

    if (type === "update") {
      config = {
        ...config,
        title: "Checking Firmware...",
        msg: "Your device is up to date (v1.0.4).",
        icon: "cloud-sync",
        iconColor: "#0055ff",
      };
    } else if (type === "wifi") {
      config = {
        ...config,
        title: "Wi-Fi Setup",
        msg: "To change Wi-Fi, please put the device in pairing mode first.",
        icon: "wifi-find",
        iconColor: isDarkMode ? "#ffaa00" : "#b37400",
      };
    } else if (type === "restart") {
      config = {
        ...config,
        title: "Restart Hub?",
        msg: "The device will go offline for approximately 45 seconds.",
        icon: "warning",
        iconColor: isDarkMode ? "#ffaa00" : "#b37400",
      };
    } else if (type === "unpair") {
      config = {
        ...config,
        title: "Unpair Device?",
        msg: "This will remove the hub from your account. You will need to set it up again.",
        icon: "delete-forever",
        iconColor: isDarkMode ? "#ff4444" : "#c62828",
      };
    }
    setModalState(config);
  };

  const closeModal = () => setModalState({ ...modalState, visible: false });

  const handleConfirm = () => {
    if (modalState.type === "restart") {
      setModalState((prev) => ({
        ...prev,
        loading: true,
        title: "Restarting...",
        msg: "Command sent. Please wait for the hub to reboot.",
        icon: "check-circle",
        iconColor: theme.primary,
      }));
      setTimeout(() => closeModal(), 2000);
    } else if (modalState.type === "unpair") {
      closeModal();
      navigation.goBack();
    }
  };

  const dangerColor = isDarkMode ? "#ff4444" : "#c62828";
  const dangerBg = isDarkMode
    ? "rgba(255, 68, 68, 0.1)"
    : "rgba(198, 40, 40, 0.05)";
  const dangerBorder = isDarkMode
    ? "rgba(255, 68, 68, 0.3)"
    : "rgba(198, 40, 40, 0.2)";

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

      {/* HEADER */}
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
          Device Config
        </Text>
        <View className="w-[50px]" />
      </View>

      <ScrollView>
        <View className="p-6">
          {/* DEVICE STATUS CARD */}
          <View
            className="items-center py-5 border-b mb-5"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            {/* DYNAMIC ICON & BACKGROUND */}
            <View
              className="w-20 h-20 rounded-full border-2 justify-center items-center mb-4"
              style={{
                borderColor: statusColor,
                backgroundColor: statusBg,
              }}
            >
              <MaterialIcons name={statusIcon} size={40} color={statusColor} />
            </View>

            {/* DYNAMIC HUB NAME */}
            <Text
              className="text-lg font-bold mb-1.5"
              style={{ color: theme.text }}
            >
              {hubName || "GridWatch Hub"}
            </Text>

            {/* DYNAMIC STATUS TEXT */}
            <View className="flex-row items-center gap-1.5">
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              <Text
                className="text-xs font-semibold"
                style={{ color: statusColor }}
              >
                {statusText}
              </Text>
            </View>
          </View>

          {/* SYSTEM INFO */}
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
            <InfoItem label="Model" value="GW-ESP32-PRO" theme={theme} />
            {/* DYNAMIC ID */}
            <InfoItem
              label="Serial Number"
              value={hubId ? `ID: ${hubId}` : "SN: 8821-992A-X1"}
              theme={theme}
            />
            <View
              className="p-4 flex-row justify-between border-b"
              style={{ borderBottomColor: theme.cardBorder }}
            >
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                Firmware
              </Text>
              <TouchableOpacity onPress={() => openModal("update")}>
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: theme.primary }}
                >
                  v1.0.4 (Check Update)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* NETWORK CONNECTION */}
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
              <MaterialIcons name="wifi" size={24} color={theme.text} />
              <View>
                <Text
                  className="text-sm font-semibold"
                  style={{ color: theme.text }}
                >
                  PLDT_Home_FIBR
                </Text>
                <Text
                  className="text-[11px] mt-0.5"
                  style={{ color: theme.textSecondary }}
                >
                  IP: 192.168.1.15
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="px-3 py-1.5 rounded-lg border"
              style={{
                backgroundColor: isDarkMode ? "#333" : "#e0e0e0",
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

          {/* ADVANCED ACTIONS */}
          <Text
            className="text-[11px] font-bold uppercase tracking-widest mb-6"
            style={{ color: theme.textSecondary }}
          >
            Advanced Actions
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 p-3.5 rounded-xl border mb-6"
            style={{ backgroundColor: dangerBg, borderColor: dangerBorder }}
            onPress={() => openModal("restart")}
          >
            <MaterialIcons name="restart-alt" size={18} color={dangerColor} />
            <Text
              className="font-semibold text-sm text-center"
              style={{
                color: dangerColor,
                includeFontPadding: false,
                textAlignVertical: "center",
              }}
            >
              Restart Device
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 p-3.5 rounded-xl border mb-3 bg-transparent"
            style={{ borderColor: dangerColor }}
            onPress={() => openModal("unpair")}
          >
            <MaterialIcons name="link-off" size={18} color={dangerColor} />
            <Text
              className="font-semibold text-sm text-center"
              style={{
                color: dangerColor,
                includeFontPadding: false,
                textAlignVertical: "center",
              }}
            >
              Unpair from Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL */}
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
                  modalState.type === "unpair") && (
                  <TouchableOpacity
                    className="flex-1 h-10 rounded-lg justify-center items-center mr-2.5 border"
                    style={{ borderColor: theme.textSecondary }}
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
                      modalState.type === "restart" ||
                      modalState.type === "wifi"
                        ? isDarkMode
                          ? "#ffaa00"
                          : "#b37400"
                        : modalState.type === "unpair"
                        ? dangerColor
                        : theme.primary,
                  }}
                  onPress={
                    modalState.type === "update" || modalState.type === "wifi"
                      ? closeModal
                      : handleConfirm
                  }
                >
                  <Text className="text-white font-bold">
                    {modalState.type === "restart" ||
                    modalState.type === "unpair"
                      ? "Confirm"
                      : "Okay"}
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
      <Text
        className="text-sm font-mono"
        style={{ color: theme.textSecondary }}
      >
        {value}
      </Text>
    </View>
  );
}
