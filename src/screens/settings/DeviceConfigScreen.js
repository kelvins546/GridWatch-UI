import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function DeviceConfigScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  // Modal States
  const [modalState, setModalState] = useState({
    visible: false,
    type: null, // 'update', 'wifi', 'restart', 'unpair'
    title: "",
    msg: "",
    icon: "",
    iconColor: "",
    loading: false,
  });

  // Helper to open modal
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

  // Helper to close modal
  const closeModal = () => setModalState({ ...modalState, visible: false });

  // Simulate Actions
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

  // Colors for Light/Dark mode
  const dangerColor = isDarkMode ? "#ff4444" : "#c62828";
  const dangerBg = isDarkMode
    ? "rgba(255, 68, 68, 0.1)"
    : "rgba(198, 40, 40, 0.05)";
  const dangerBorder = isDarkMode
    ? "rgba(255, 68, 68, 0.3)"
    : "rgba(198, 40, 40, 0.2)";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* HEADER */}
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
          Device Config
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HUB HERO */}
        <View style={[styles.hubHero, { borderBottomColor: theme.cardBorder }]}>
          <View
            style={[
              styles.hubIconCircle,
              {
                borderColor: theme.primary,
                backgroundColor: isDarkMode
                  ? "rgba(0, 255, 153, 0.1)"
                  : "rgba(0, 153, 94, 0.1)",
              },
            ]}
          >
            <MaterialIcons name="router" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.hubName, { color: theme.text }]}>
            GridWatch Hub
          </Text>
          <View style={styles.hubStatus}>
            <View
              style={[styles.statusDot, { backgroundColor: theme.primary }]}
            />
            <Text style={[styles.statusText, { color: theme.primary }]}>
              Online • Stable
            </Text>
          </View>
        </View>

        {/* SYSTEM INFO */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          System Information
        </Text>
        <View
          style={[
            styles.infoGroup,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <InfoItem label="Model" value="GW-ESP32-PRO" theme={theme} />
          <InfoItem
            label="Serial Number"
            value="SN: 8821-992A-X1"
            theme={theme}
          />
          <View
            style={[styles.infoItem, { borderBottomColor: theme.cardBorder }]}
          >
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Firmware
            </Text>
            <TouchableOpacity onPress={() => openModal("update")}>
              <Text style={[styles.actionLink, { color: theme.primary }]}>
                v1.0.4 (Check Update)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NETWORK */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Network Connection
        </Text>
        <View
          style={[
            styles.networkCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.netLeft}>
            <MaterialIcons name="wifi" size={24} color={theme.text} />
            <View>
              <Text style={[styles.netName, { color: theme.text }]}>
                PLDT_Home_FIBR
              </Text>
              <Text style={[styles.netIp, { color: theme.textSecondary }]}>
                IP: 192.168.1.15
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.changeBtn,
              {
                backgroundColor: isDarkMode ? "#333" : "#e0e0e0",
                borderColor: theme.cardBorder,
              },
            ]}
            onPress={() => openModal("wifi")}
          >
            <Text
              style={{ color: theme.text, fontSize: 11, fontWeight: "600" }}
            >
              Change
            </Text>
          </TouchableOpacity>
        </View>

        {/* ADVANCED ACTIONS */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Advanced Actions
        </Text>

        <TouchableOpacity
          style={[
            styles.dangerBtn,
            { backgroundColor: dangerBg, borderColor: dangerBorder },
          ]}
          onPress={() => openModal("restart")}
        >
          <MaterialIcons name="restart-alt" size={18} color={dangerColor} />
          <Text style={{ color: dangerColor, fontWeight: "600", fontSize: 14 }}>
            Restart Device
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.dangerBtn,
            { backgroundColor: "transparent", borderColor: dangerColor },
          ]}
          onPress={() => openModal("unpair")}
        >
          <MaterialIcons name="link-off" size={18} color={dangerColor} />
          <Text style={{ color: dangerColor, fontWeight: "600", fontSize: 14 }}>
            Unpair from Account
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* SHARED MODAL */}
      <Modal
        transparent
        visible={modalState.visible}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            {modalState.loading ? (
              <ActivityIndicator
                size="large"
                color={theme.primary}
                style={{ marginVertical: 20 }}
              />
            ) : (
              <MaterialIcons
                name={modalState.icon}
                size={40}
                color={modalState.iconColor}
                style={{ marginBottom: 15 }}
              />
            )}

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {modalState.title}
            </Text>
            <Text style={[styles.modalMsg, { color: theme.textSecondary }]}>
              {modalState.msg}
            </Text>

            {!modalState.loading && (
              <View style={styles.modalActions}>
                {(modalState.type === "restart" ||
                  modalState.type === "unpair") && (
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      {
                        borderColor: theme.textSecondary,
                        borderWidth: 1,
                        marginRight: 10,
                      },
                    ]}
                    onPress={closeModal}
                  >
                    <Text style={{ color: theme.text, fontWeight: "700" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor:
                        modalState.type === "restart" ||
                        modalState.type === "wifi"
                          ? isDarkMode
                            ? "#ffaa00"
                            : "#b37400"
                          : modalState.type === "unpair"
                          ? dangerColor
                          : theme.primary,
                    },
                  ]}
                  onPress={
                    modalState.type === "update" || modalState.type === "wifi"
                      ? closeModal
                      : handleConfirm
                  }
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
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
    <View style={[styles.infoItem, { borderBottomColor: theme.cardBorder }]}>
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.infoVal, { color: theme.textSecondary }]}>
        {value}
      </Text>
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
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { fontSize: 14, fontWeight: "500", marginLeft: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  scrollContent: { padding: 24 },

  hubHero: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  hubIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  hubName: { fontSize: 18, fontWeight: "700", marginBottom: 5 },
  hubStatus: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  infoItem: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 14 },
  infoVal: { fontSize: 14, fontFamily: "monospace" },
  actionLink: { fontSize: 13, fontWeight: "600" },

  networkCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  netLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  netName: { fontSize: 14, fontWeight: "600" },
  netIp: { fontSize: 11, marginTop: 2 },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },

  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 280,
    padding: 25,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  modalMsg: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
  },
  modalBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
