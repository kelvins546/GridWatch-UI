import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext"; // Import Hook

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Week");
  const { theme, isDarkMode } = useTheme(); // Get Theme

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
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
          Analytics & Trends
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TABS */}
        <View
          style={[
            styles.tabsBg,
            { backgroundColor: isDarkMode ? "#222" : "#e0e0e0" },
          ]}
        >
          {["Day", "Week", "Month"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabItem,
                activeTab === tab && { backgroundColor: theme.card },
              ]} // Active tab color
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab
                    ? { color: theme.text }
                    : { color: theme.textSecondary },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SUMMARY CARD */}
        <View
          style={[styles.summaryCard, { borderBottomColor: theme.cardBorder }]}
        >
          <Text style={styles.label}>TOTAL SPENDING (NOV 1 - NOV 7)</Text>
          <Text style={[styles.totalAmount, { color: theme.text }]}>
            ₱ 850.50
          </Text>
          <View style={styles.trendBadge}>
            <MaterialIcons name="trending-up" size={14} color="#ff4d4d" />
            <Text style={styles.trendText}>+12% vs. last week</Text>
          </View>
        </View>

        {/* BAR CHART */}
        <View
          style={[
            styles.chartContainer,
            { borderBottomColor: theme.cardBorder },
          ]}
        >
          <Bar label="Mon" height="40%" theme={theme} />
          <Bar label="Tue" height="35%" theme={theme} />
          <Bar label="Wed" height="70%" active theme={theme} />
          <Bar label="Thu" height="50%" theme={theme} />
          <Bar label="Fri" height="55%" theme={theme} />
          <Bar label="Sat" height="20%" theme={theme} />
        </View>

        {/* DISTRIBUTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Cost Distribution
          </Text>
          {/* UPDATED: Uses theme.primary */}
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: theme.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {/* UPDATED: Item 1 uses theme.primary (Green) */}
        <DistributionItem
          name="1. Air Conditioner"
          cost="₱ 552.00"
          percent="65%"
          color={theme.primary}
          theme={theme}
        />

        {/* Other items keep their specific colors (Blue, Orange) unless you want them darker too */}
        <DistributionItem
          name="2. Refrigerator"
          cost="₱ 212.00"
          percent="25%"
          color="#0055ff"
          theme={theme}
        />
        <DistributionItem
          name="3. Smart TV"
          cost="₱ 86.50"
          percent="10%"
          color="#ffaa00"
          theme={theme}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Bar({ label, height, active, theme }) {
  return (
    <View style={styles.barGroup}>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              height: height,
              backgroundColor: active ? theme.text : theme.cardBorder,
            },
          ]}
        />
      </View>
      <Text
        style={[
          styles.dayLabel,
          {
            color: active ? theme.text : theme.textSecondary,
            fontWeight: active ? "700" : "400",
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function DistributionItem({ name, cost, percent, color, theme }) {
  return (
    <View style={styles.breakdownItem}>
      <View style={styles.itemRow}>
        <Text style={[styles.itemName, { color: theme.textSecondary }]}>
          {name}
        </Text>
        <Text style={[styles.itemCost, { color: theme.text }]}>{cost}</Text>
      </View>
      <View style={[styles.progressBg, { backgroundColor: theme.cardBorder }]}>
        <View
          style={[
            styles.progressFill,
            { width: percent, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.percentLabel, { color: theme.textSecondary }]}>
        {percent}
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
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { fontSize: 14, fontWeight: "500", marginLeft: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  tabsBg: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
    marginBottom: 25,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  tabText: { fontSize: 12, fontWeight: "600" },
  summaryCard: {
    alignItems: "center",
    marginBottom: 30,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    paddingBottom: 25,
  },
  label: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
    marginBottom: 5,
  },
  totalAmount: { fontSize: 36, fontWeight: "700", marginBottom: 5 },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 77, 77, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  trendText: { color: "#ff4d4d", fontSize: 12, fontWeight: "600" },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 180,
    alignItems: "flex-end",
    marginBottom: 30,
    borderBottomWidth: 1,
    paddingBottom: 20,
  },
  barGroup: {
    alignItems: "center",
    width: "14%",
    height: "100%",
    justifyContent: "flex-end",
  },
  barTrack: { width: 8, height: "100%", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 4 },
  dayLabel: { marginTop: 10, fontSize: 11 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600" },
  seeAll: { fontSize: 12 },
  breakdownItem: { marginBottom: 24 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemName: { fontSize: 13, fontWeight: "500" },
  itemCost: { fontSize: 13, fontWeight: "700" },
  progressBg: { height: 6, borderRadius: 4, width: "100%", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  percentLabel: { fontSize: 10, marginTop: 4, textAlign: "right" },
});
