import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Switch,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function DeviceControlScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();

  // --- PARAMS & POWER STATE ---
  const { deviceName, status } = route.params || {
    deviceName: "Device",
    status: "ON",
  };
  const initialPower = !status?.includes("Standby") && !status?.includes("OFF");
  const [isPowered, setIsPowered] = useState(initialPower);

  // --- MODAL STATES ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  // --- SCHEDULE STATE ---
  const [scheduleTime, setScheduleTime] = useState("22:00");
  const [selectedDays, setSelectedDays] = useState([
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]); // M T W T F S S
  const [isActionOn, setIsActionOn] = useState(false); // false = Turn OFF, true = Turn ON

  // --- COLORS ---
  const heroColors = isPowered
    ? ["#0055ff", theme.background]
    : ["#2c3e50", theme.background];

  // --- HANDLERS ---
  const confirmToggle = () => {
    setIsPowered(!isPowered);
    setShowConfirm(false);
  };

  const toggleDay = (index) => {
    const newDays = [...selectedDays];
    newDays[index] = !newDays[index];
    setSelectedDays(newDays);
  };

  const saveSchedule = () => {
    // Logic to save schedule would go here
    setShowSchedule(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <MaterialIcons
          name="settings"
          size={24}
          color="rgba(255,255,255,0.8)"
        />
      </View>

      {/* HERO SECTION */}
      <LinearGradient colors={heroColors} style={styles.hero}>
        <View style={styles.iconBox}>
          <MaterialIcons
            name={isPowered ? "ac-unit" : "power-off"}
            size={40}
            color="#fff"
          />
        </View>
        <Text style={styles.title}>
          {isPowered ? "Power ON" : "Standby Mode"}
        </Text>
        <Text style={styles.sub}>
          {deviceName} is {isPowered ? "running" : "idle"}
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* STATS CARD */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <DetailRow
            label="Current Load"
            value={isPowered ? "1,456 Watts" : "0 Watts"}
            theme={theme}
          />
          <DetailRow label="Voltage" value="220.1 V" theme={theme} />
          <DetailRow
            label="Cost / Hour"
            value={isPowered ? "₱ 18.20" : "₱ 0.00"}
            theme={theme}
          />
        </View>

        {/* POWER BUTTON */}
        <View style={styles.powerContainer}>
          <TouchableOpacity
            style={[styles.powerBtn, isPowered ? styles.btnOn : styles.btnOff]}
            onPress={() => setShowConfirm(true)}
            activeOpacity={0.9}
          >
            <MaterialIcons
              name="power-settings-new"
              size={36}
              color={isPowered ? "#000" : "#666"}
            />
          </TouchableOpacity>
          <Text style={[styles.powerLabel, { color: theme.textSecondary }]}>
            {isPowered ? "Tap to Cut Power" : "Tap to Restore Power"}
          </Text>
        </View>

        {/* SCHEDULE ROW */}
        <View style={styles.schedHeader}>
          <Text style={styles.schedTitle}>UPCOMING SCHEDULE</Text>
          <TouchableOpacity onPress={() => setShowSchedule(true)}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.schedItem,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <View>
            <Text style={[styles.time, { color: theme.text }]}>
              {scheduleTime}
            </Text>
            <Text style={[styles.days, { color: theme.textSecondary }]}>
              {isActionOn ? "Auto-ON" : "Auto-OFF"} • Daily
            </Text>
          </View>
          <Switch
            value={true}
            trackColor={{ true: "#00ff99" }}
            thumbColor="#fff"
          />
        </View>
      </ScrollView>

      {/* --- CONFIRM MODAL --- */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <MaterialIcons
              name={isPowered ? "power-off" : "power"}
              size={48}
              color={isPowered ? "#ff4444" : "#00ff99"}
              style={{ marginBottom: 15 }}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isPowered ? "Turn Off Device?" : "Restore Power?"}
            </Text>
            <Text style={[styles.modalMsg, { color: theme.textSecondary }]}>
              {isPowered
                ? "This will physically cut power to the outlet. The device will enter standby mode."
                : "This will reactivate the outlet relay. Ensure appliance is safe to turn on."}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: isPowered ? "#ff4444" : "#00ff99",
                    borderColor: isPowered ? "#ff4444" : "#00ff99",
                  },
                ]}
                onPress={confirmToggle}
              >
                <Text
                  style={{
                    color: isPowered ? "#fff" : "#000",
                    fontWeight: "700",
                  }}
                >
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- EDIT SCHEDULE MODAL (FULL UI) --- */}
      <Modal visible={showSchedule} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                padding: 30,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.text, marginBottom: 20 },
              ]}
            >
              Edit Schedule
            </Text>

            {/* 1. Time Input */}
            <View style={styles.timeInputContainer}>
              <TextInput
                style={[
                  styles.timeInput,
                  {
                    color: theme.text,
                    borderColor: theme.cardBorder,
                    backgroundColor: theme.background,
                  },
                ]}
                value={scheduleTime}
                onChangeText={setScheduleTime}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            {/* 2. Days Selector */}
            <View style={styles.daysSelector}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleDay(index)}
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: selectedDays[index]
                        ? "#00ff99"
                        : theme.background,
                    },
                    selectedDays[index] && {
                      shadowColor: "#00ff99",
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                      elevation: 5,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selectedDays[index] ? "#000" : theme.textSecondary,
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 3. Action Toggle */}
            <TouchableOpacity
              style={[
                styles.actionRow,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.cardBorder,
                },
              ]}
              onPress={() => setIsActionOn(!isActionOn)}
              activeOpacity={0.8}
            >
              <Text style={{ color: theme.text, fontWeight: "600" }}>
                Action: {isActionOn ? "Turn ON" : "Turn OFF"}
              </Text>
              <View
                style={[
                  styles.customSwitch,
                  isActionOn ? styles.switchOn : styles.switchOff,
                ]}
              >
                <View
                  style={[
                    styles.switchHandle,
                    isActionOn
                      ? { right: 2, backgroundColor: "#00ff99" }
                      : { left: 2, backgroundColor: "#fff" },
                  ]}
                />
              </View>
            </TouchableOpacity>

            {/* 4. Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setShowSchedule(false)}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={saveSchedule}
              >
                <Text style={{ color: "#000", fontWeight: "700" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, theme }) {
  return (
    <View style={styles.cardRow}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: "absolute",
    top: 50,
    left: 24,
    right: 24,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  backText: { color: "#fff", fontSize: 14, fontWeight: "500" },

  hero: { paddingTop: 100, paddingBottom: 30, alignItems: "center" },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 15,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 5 },
  sub: { fontSize: 14, color: "rgba(255,255,255,0.8)" },

  content: { padding: 24 },
  card: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: "600" },

  powerContainer: { alignItems: "center", marginVertical: 30 },
  powerBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },

  // FIXED CIRCLE SHADOWS
  btnOn: {
    backgroundColor: "#00ff99",
    shadowColor: "#00ff99",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 15,
    borderRadius: 45, // Critical for Android shadow
    borderWidth: 0,
  },
  btnOff: {
    backgroundColor: "#333",
    borderWidth: 2,
    borderColor: "#444",
    elevation: 0,
    borderRadius: 45,
  },

  powerLabel: {
    marginTop: 15,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  schedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  schedTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  editLink: { fontSize: 12, color: "#00ff99", fontWeight: "600" },

  schedItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  time: { fontSize: 16, fontWeight: "700" },
  days: { fontSize: 11, marginTop: 2 },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 300,
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  modalMsg: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },
  modalActions: { flexDirection: "row", gap: 10, width: "100%" },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },

  // SCHEDULE MODAL SPECIFIC
  timeInputContainer: { marginBottom: 25, alignItems: "center" },
  timeInput: {
    fontSize: 32,
    fontWeight: "700",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: "center",
    minWidth: 140,
  },

  daysSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 25,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 25,
  },
  customSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
  },
  switchOn: { borderColor: "#00ff99", backgroundColor: "rgba(0,255,153,0.1)" },
  switchOff: { borderColor: "#555", backgroundColor: "#333" },
  switchHandle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: "absolute",
  },
});
