import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Platform,
  StyleSheet,
  UIManager,
  LayoutAnimation,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DeviceControlScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, fontScale, isDarkMode } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const { deviceName, status } = route.params || {
    deviceName: "Smart Socket",
    status: "ON",
  };

  const initialPower = !status?.includes("Standby") && !status?.includes("OFF");
  const [isPowered, setIsPowered] = useState(initialPower);

  // --- NEW STATE FOR LOADING ---
  const [isToggling, setIsToggling] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  // --- MOCK DATA ---
  const [schedules, setSchedules] = useState([
    {
      id: "1",
      time: "22:00",
      days: [true, true, true, true, true, true, true],
      action: false, // OFF
      active: true,
    },
    {
      id: "2",
      time: "06:30",
      days: [false, true, true, true, true, true, false],
      action: true, // ON
      active: false,
    },
  ]);

  const [scheduleTime, setScheduleTime] = useState("07:00");
  const [selectedDays, setSelectedDays] = useState([
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]);
  const [isActionOn, setIsActionOn] = useState(true);

  // --- DYNAMIC COLORS ---
  const gradientColors = isPowered
    ? [theme.buttonPrimary, theme.background]
    : isDarkMode
      ? ["#2c3e50", theme.background]
      : ["#94a3b8", theme.background];

  const activeColor = theme.buttonPrimary;

  // --- ACTIONS ---
  const confirmToggle = () => {
    // 1. Close the modal first
    setShowConfirm(false);

    // 2. Start Loading
    setIsToggling(true);

    // 3. Simulate API Delay
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsPowered((prev) => !prev);
      setIsToggling(false); // Stop loading
    }, 2000);
  };

  const toggleDay = (index) => {
    const newDays = [...selectedDays];
    newDays[index] = !newDays[index];
    setSelectedDays(newDays);
  };

  const saveSchedule = () => {
    const newSchedule = {
      id: Date.now().toString(),
      time: scheduleTime,
      days: selectedDays,
      action: isActionOn,
      active: true,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSchedules([...schedules, newSchedule]);
    setShowSchedule(false);
  };

  const toggleScheduleActive = (id) => {
    setSchedules((current) =>
      current.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    );
  };

  // --- STYLES ---
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
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
    card: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
    },
    detailLabel: {
      color: theme.textSecondary,
      fontSize: scaledSize(13),
    },
    detailValue: {
      color: theme.text,
      fontSize: scaledSize(15),
      fontWeight: "600",
    },
    powerBtn: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 4,
      borderColor: isPowered ? `${activeColor}40` : theme.cardBorder,
      backgroundColor: isPowered ? activeColor : theme.card,
      shadowColor: isPowered ? activeColor : "#000",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isPowered ? 0.6 : 0.1,
      shadowRadius: 20,
      elevation: 10,
    },
    // --- MODAL STYLES ---
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
    modalBtnRow: {
      flexDirection: "row",
      gap: 10,
      width: "100%",
    },
    modalBtnCancel: {
      flex: 1,
      borderRadius: 12,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.textSecondary,
    },
    modalBtnConfirm: {
      flex: 1,
      borderRadius: 12,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    modalBtnText: {
      fontWeight: "bold",
      fontSize: scaledSize(12),
    },
    // --- LOADING OVERLAY STYLE ---
    loaderOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 50,
    },
    loaderText: {
      color: "#fff",
      marginTop: 16,
      fontSize: scaledSize(14),
      fontWeight: "600",
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* --- HEADER OVERLAY --- */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            padding: 4,
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: 20,
          }}
        >
          <MaterialIcons name="arrow-back" size={scaledSize(24)} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            padding: 4,
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: 20,
          }}
        >
          <MaterialIcons name="settings" size={scaledSize(24)} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* --- HERO SECTION (Adjusted Spacing) --- */}
      <LinearGradient
        colors={gradientColors}
        // REDUCED PADDING TOP AND BOTTOM HERE
        style={{ paddingTop: 110, paddingBottom: 25, alignItems: "center" }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "rgba(0,0,0,0.2)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10, // Reduced from 16
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <MaterialIcons
            name={isPowered ? "power" : "power-off"}
            size={40}
            color="#fff"
          />
        </View>
        <Text
          style={{
            fontSize: scaledSize(28),
            fontWeight: "bold",
            color: isDarkMode ? "#fff" : isPowered ? "#fff" : theme.text,
            marginBottom: 2, // Reduced from 4
          }}
        >
          {isPowered ? "Power ON" : "Standby"}
        </Text>
        <Text
          style={{
            fontSize: scaledSize(14),
            color: isDarkMode
              ? "rgba(255,255,255,0.7)"
              : isPowered
                ? "rgba(255,255,255,0.9)"
                : theme.textSecondary,
          }}
        >
          {deviceName} is {isPowered ? "running" : "idle"}
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* --- MAIN METRICS CARD --- */}
        <View style={styles.card}>
          <Text
            style={[
              styles.detailLabel,
              {
                marginBottom: 12,
                fontWeight: "bold",
                textTransform: "uppercase",
              },
            ]}
          >
            Real-time Metrics
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View>
              <Text style={styles.detailLabel}>Current Load</Text>
              <Text style={styles.detailValue}>
                {isPowered ? "1,456 W" : "0 W"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.detailLabel}>Voltage</Text>
              <Text style={styles.detailValue}>220.1 V</Text>
            </View>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: theme.cardBorder,
              marginVertical: 12,
            }}
          />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text style={styles.detailLabel}>Est. Cost/Hr</Text>
              <Text
                style={[styles.detailValue, { color: theme.buttonPrimary }]}
              >
                {isPowered ? "₱ 18.20" : "₱ 0.00"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.detailLabel}>Daily Usage</Text>
              <Text style={styles.detailValue}>4.2 kWh</Text>
            </View>
          </View>
        </View>

        {/* --- SECONDARY DETAILS --- */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 30 }}>
          <View
            style={[
              styles.card,
              { flex: 1, marginBottom: 0, alignItems: "center" },
            ]}
          >
            <MaterialIcons
              name="timer"
              size={20}
              color={theme.textSecondary}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.detailLabel}>Runtime</Text>
            <Text style={styles.detailValue}>
              {isPowered ? "5h 20m" : "0h 0m"}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { flex: 1, marginBottom: 0, alignItems: "center" },
            ]}
          >
            <MaterialIcons
              name="wifi"
              size={20}
              color={theme.textSecondary}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.detailLabel}>Signal</Text>
            <Text style={styles.detailValue}>-42 dBm</Text>
          </View>
        </View>

        {/* --- POWER BUTTON --- */}
        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <TouchableOpacity
            style={styles.powerBtn}
            onPress={() => setShowConfirm(true)}
            activeOpacity={0.9}
          >
            <MaterialIcons
              name="power-settings-new"
              size={40}
              color={isPowered ? "#fff" : theme.textSecondary}
            />
          </TouchableOpacity>
          <Text
            style={{
              marginTop: 12,
              fontSize: scaledSize(12),
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: theme.textSecondary,
            }}
          >
            {isPowered ? "Tap to Cut Power" : "Tap to Restore Power"}
          </Text>
        </View>

        {/* --- SCHEDULES --- */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: scaledSize(12),
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: 1,
              color: theme.textSecondary,
            }}
          >
            Upcoming Schedules
          </Text>
          <TouchableOpacity onPress={() => setShowSchedule(true)}>
            <Text
              style={{
                color: theme.buttonPrimary,
                fontWeight: "bold",
                fontSize: scaledSize(12),
              }}
            >
              + Add New
            </Text>
          </TouchableOpacity>
        </View>

        {schedules.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              {
                marginBottom: 10,
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              },
            ]}
          >
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <MaterialIcons
                  name="schedule"
                  size={16}
                  color={theme.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: scaledSize(18),
                    fontWeight: "bold",
                    color: theme.text,
                  }}
                >
                  {item.time}
                </Text>
              </View>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(12),
                }}
              >
                {item.action ? "Auto-ON" : "Auto-OFF"} •{" "}
                {item.days.every((d) => d) ? "Everyday" : "Custom"}
              </Text>
            </View>

            <CustomSwitch
              value={item.active}
              onToggle={() => toggleScheduleActive(item.id)}
              theme={theme}
            />
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* --- CONFIRMATION MODAL --- */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {isPowered ? "Turn Off Device?" : "Restore Power?"}
            </Text>
            <Text style={styles.modalBody}>
              {isPowered
                ? "This will physically cut power to the outlet immediately."
                : "This will reactivate the outlet relay and resume power flow."}
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnConfirm,
                  {
                    backgroundColor: isPowered
                      ? theme.buttonDangerText
                      : theme.buttonPrimary,
                  },
                ]}
                onPress={confirmToggle}
              >
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                    Confirm
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- SCHEDULE MODAL --- */}
      <Modal visible={showSchedule} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Schedule</Text>

            <View
              style={{
                marginBottom: 20,
                width: "100%",
                alignItems: "center",
              }}
            >
              <TextInput
                style={{
                  fontSize: scaledSize(32),
                  fontWeight: "bold",
                  color: theme.text,
                  textAlign: "center",
                  borderBottomWidth: 1,
                  borderBottomColor: theme.cardBorder,
                  paddingBottom: 8,
                  minWidth: 120,
                }}
                value={scheduleTime}
                onChangeText={setScheduleTime}
                keyboardType="numeric"
                maxLength={5}
                placeholder="00:00"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                marginBottom: 24,
              }}
            >
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleDay(index)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: selectedDays[index]
                      ? theme.buttonPrimary
                      : theme.background,
                    borderWidth: selectedDays[index] ? 0 : 1,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "bold",
                      color: selectedDays[index] ? "#fff" : theme.textSecondary,
                    }}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: 12,
                borderRadius: 12,
                backgroundColor: theme.background,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                marginBottom: 24,
              }}
              onPress={() => setIsActionOn(!isActionOn)}
            >
              <Text
                style={{
                  color: theme.text,
                  fontWeight: "500",
                  fontSize: scaledSize(12),
                }}
              >
                Action:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {isActionOn ? "Turn ON" : "Turn OFF"}
                </Text>
              </Text>
              <CustomSwitch
                value={isActionOn}
                onToggle={() => setIsActionOn(!isActionOn)}
                theme={theme}
              />
            </TouchableOpacity>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowSchedule(false)}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnConfirm,
                  { backgroundColor: theme.buttonPrimary },
                ]}
                onPress={saveSchedule}
              >
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                    Save
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- LOADING OVERLAY --- */}
      {isToggling && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loaderText}>
            {isPowered ? "Turning Off..." : "Turning On..."}
          </Text>
        </View>
      )}
    </View>
  );
}

// Reused CustomSwitch from SettingsScreen
function CustomSwitch({ value, onToggle, theme }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      style={{
        width: 42,
        height: 26,
        borderRadius: 16,
        backgroundColor: value ? theme.buttonPrimary : theme.buttonNeutral,
        padding: 2,
        justifyContent: "center",
        alignItems: value ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 2.5,
          elevation: 2,
        }}
      />
    </TouchableOpacity>
  );
}
