import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function BudgetDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();

  const { deviceName } = route.params || { deviceName: "Air Conditioner" };

  const [period, setPeriod] = useState("Monthly");
  const [limit, setLimit] = useState(2000);
  const [autoCutoff, setAutoCutoff] = useState(true);

  const usedAmount = 1450.75;
  const percentage = Math.min((usedAmount / limit) * 100, 100).toFixed(0);
  const remaining = Math.max(limit - usedAmount, 0).toFixed(2);

  const adjustLimit = (amount) =>
    setLimit((prev) => Math.max(0, prev + amount));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

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
          {deviceName}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.saveBtn, { color: theme.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Budget Period
        </Text>
        <View style={[styles.segmentControl, { backgroundColor: theme.card }]}>
          {["Daily", "Weekly", "Monthly"].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.segmentBtn,
                period === item && {
                  backgroundColor: isDarkMode ? "#333" : "#fff",
                  shadowOpacity: 0.1,
                },
              ]}
              onPress={() => setPeriod(item)}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: period === item ? theme.text : theme.textSecondary },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Set Limit (Pesos)
        </Text>
        <View
          style={[
            styles.limitContainer,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.controlBtn,
              { backgroundColor: isDarkMode ? "#333" : "#eee" },
            ]}
            onPress={() => adjustLimit(-100)}
          >
            <MaterialIcons name="remove" size={24} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.limitValue, { color: theme.text }]}>
            ₱ {limit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Text>

          <TouchableOpacity
            style={[
              styles.controlBtn,
              { backgroundColor: isDarkMode ? "#333" : "#eee" },
            ]}
            onPress={() => adjustLimit(100)}
          >
            <MaterialIcons name="add" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Current Usage Status
        </Text>
        <View style={[styles.statusCard, { backgroundColor: "transparent" }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.usageText, { color: theme.textSecondary }]}>
              Used: ₱ {usedAmount.toLocaleString()}
            </Text>
            <Text style={[styles.percentText, { color: theme.primary }]}>
              {percentage}%
            </Text>
          </View>

          <View
            style={[
              styles.progressTrack,
              { backgroundColor: isDarkMode ? "#333" : "#e0e0e0" },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${percentage}%`, backgroundColor: theme.primary },
              ]}
            />
          </View>

          <View style={styles.statsRow}>
            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
              Remaining: ₱ {remaining}
            </Text>
            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
              Resets in: 12 Days
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Automation Rules
        </Text>

        <RuleItem
          title="Auto-Cutoff Power"
          desc="If limit is reached, automatically turn off the device to save cost."
          value={autoCutoff}
          onToggle={setAutoCutoff}
          theme={theme}
          isDarkMode={isDarkMode}
        />

        <RuleItem
          title="Push Notifications"
          desc="Receive alerts when usage hits 80%, 90%, and 100% of limit."
          value={true}
          onToggle={() => {}}
          disabled={true}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function RuleItem({
  title,
  desc,
  value,
  onToggle,
  disabled,
  theme,
  isDarkMode,
}) {
  return (
    <View
      style={[
        styles.ruleItem,
        { backgroundColor: theme.card, opacity: disabled ? 0.8 : 1 },
      ]}
    >
      <View style={styles.ruleInfo}>
        <Text style={[styles.ruleTitle, { color: theme.text }]}>
          {title}{" "}
          {disabled && (
            <Text
              style={{ fontSize: 10, color: theme.primary, fontWeight: "700" }}
            >
              (Always On)
            </Text>
          )}
        </Text>
        <Text style={[styles.ruleDesc, { color: theme.textSecondary }]}>
          {desc}
        </Text>
      </View>
      <Switch
        disabled={disabled}
        trackColor={{
          false: "#767577",
          true: isDarkMode ? "rgba(0, 255, 153, 0.2)" : "rgba(0, 153, 94, 0.2)",
        }}
        thumbColor={value ? theme.primary : "#f4f3f4"}
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  backText: { fontSize: 14, fontWeight: "500" },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  saveBtn: { fontSize: 14, fontWeight: "600" },

  content: { padding: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },

  segmentControl: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
    marginBottom: 30,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: { fontSize: 12, fontWeight: "600" },

  limitContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 30,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  limitValue: { fontSize: 28, fontWeight: "700" },

  statusCard: { marginBottom: 30 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  usageText: { fontSize: 13 },
  percentText: { fontSize: 13, fontWeight: "700" },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%" },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },

  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  ruleInfo: { flex: 1, marginRight: 15 },
  ruleTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  ruleDesc: { fontSize: 11, lineHeight: 16 },
});
