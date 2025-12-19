import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function FaultDetailScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [checks, setChecks] = useState([false, false, false]);
  const [showModal, setShowModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const toggleCheck = (index) => {
    const newChecks = [...checks];
    newChecks[index] = !newChecks[index];
    setChecks(newChecks);
  };

  const allChecked = checks.every(Boolean);

  const handleReset = () => {
    if (!allChecked) return;
    setIsResetting(true);
    // Simulate network delay
    setTimeout(() => {
      setIsResetting(false);
      setShowModal(true);
    }, 1500);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#ff4444" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* HERO SECTION - RED GRADIENT */}
      <LinearGradient
        colors={["#ff4444", theme.background]}
        style={styles.hero}
      >
        <View style={styles.alertIconBox}>
          <MaterialIcons name="flash-off" size={40} color="#fff" />
        </View>
        <Text style={styles.alertTitle}>Power Cutoff Active</Text>
        <Text style={styles.alertSub}>Safety Protection Triggered</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* INFO CARD */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <DetailRow label="Device Name" value="Outlet 3" theme={theme} />
          <DetailRow
            label="Fault Type"
            value="Short Circuit Detected"
            valueColor="#ff4444"
            theme={theme}
          />
          <DetailRow
            label="Time of Incident"
            value="Today, 10:42 AM"
            theme={theme}
          />
          <DetailRow
            label="Peak Current"
            value="45.2 Amps (Limit: 15A)"
            theme={theme}
          />
        </View>

        {/* CHECKLIST */}
        <Text style={styles.checklistTitle}>REQUIRED SAFETY CHECKS</Text>

        <CheckItem
          text="I have unplugged the faulty appliance connected to Outlet 3."
          checked={checks[0]}
          onPress={() => toggleCheck(0)}
          theme={theme}
        />
        <CheckItem
          text="I have inspected the outlet for any visible burn marks or smoke."
          checked={checks[1]}
          onPress={() => toggleCheck(1)}
          theme={theme}
        />
        <CheckItem
          text="I understand that resetting power to a faulty circuit can be dangerous."
          checked={checks[2]}
          onPress={() => toggleCheck(2)}
          theme={theme}
        />

        {/* RESET BUTTON */}
        <View style={styles.actionArea}>
          <TouchableOpacity
            style={[
              styles.resetBtn,
              allChecked ? styles.resetBtnActive : styles.resetBtnDisabled,
            ]}
            disabled={!allChecked || isResetting}
            onPress={handleReset}
          >
            {isResetting ? (
              <Text style={styles.resetBtnText}>Resetting...</Text>
            ) : (
              <Text style={styles.resetBtnText}>
                {allChecked ? "RESET OUTLET POWER" : "Complete Checks to Reset"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.safetyNote}>GridWatch System ID: GW-SAFE-9921</Text>
      </ScrollView>

      {/* SUCCESS MODAL */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <MaterialIcons
              name="check-circle"
              size={48}
              color="#00ff99"
              style={{ marginBottom: 15 }}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Power Restored
            </Text>
            <Text style={[styles.modalMsg, { color: theme.textSecondary }]}>
              Safety protocols verified. Power has been safely restored to
              Outlet 3.
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { borderColor: theme.text }]}
              onPress={() => navigation.navigate("MainApp", { screen: "Home" })}
            >
              <Text style={{ color: theme.text, fontWeight: "700" }}>
                Return to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, valueColor, theme }) {
  return (
    <View style={styles.cardRow}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: valueColor || theme.text }]}>
        {value}
      </Text>
    </View>
  );
}

function CheckItem({ text, checked, onPress, theme }) {
  return (
    <TouchableOpacity
      style={styles.checkItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkBox, checked && styles.checkBoxChecked]}>
        {checked && <MaterialIcons name="check" size={14} color="#000" />}
      </View>
      <Text style={[styles.checkText, { color: theme.textSecondary }]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { position: "absolute", top: 50, left: 24, zIndex: 10 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  backText: { color: "#fff", fontSize: 14, fontWeight: "500" },

  hero: { paddingTop: 100, paddingBottom: 30, alignItems: "center" },
  alertIconBox: {
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
  alertTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 5,
  },
  alertSub: { fontSize: 14, color: "rgba(255,255,255,0.9)" },

  content: { padding: 24 },
  infoCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: "600" },

  checklistTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    marginBottom: 12,
    letterSpacing: 1,
  },
  checkItem: { flexDirection: "row", marginBottom: 15, paddingRight: 10 },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#444",
    marginRight: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxChecked: { backgroundColor: "#00ff99", borderColor: "#00ff99" },
  checkText: { fontSize: 13, lineHeight: 20, flex: 1 },

  actionArea: { marginTop: 10 },
  resetBtn: { padding: 18, borderRadius: 16, alignItems: "center" },
  resetBtnDisabled: { backgroundColor: "#333" },
  resetBtnActive: { backgroundColor: "#ff4444" }, // Simplified gradient for React Native
  resetBtnText: {
    color: "#fff",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  safetyNote: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    marginTop: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 280,
    padding: 30,
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
  modalBtn: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
});
