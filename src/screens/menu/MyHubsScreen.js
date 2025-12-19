import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function MyHubsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Hubs</Text>
        <TouchableOpacity onPress={() => navigation.navigate("SetupHub")}>
          <MaterialIcons name="add" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ACTIVE HUB CARD */}
        <TouchableOpacity
          style={[
            styles.hubCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.hubHeader}>
            <View
              style={[
                styles.hubIcon,
                { backgroundColor: "rgba(0, 255, 153, 0.1)" },
              ]}
            >
              <MaterialIcons name="router" size={24} color="#00ff99" />
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: "rgba(0, 255, 153, 0.15)",
                  borderColor: "rgba(0, 255, 153, 0.3)",
                },
              ]}
            >
              <Text
                style={{
                  color: "#00ff99",
                  fontSize: 10,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                Online
              </Text>
            </View>
          </View>

          <Text style={[styles.hubName, { color: theme.text }]}>
            Living Room Hub
          </Text>
          <Text style={[styles.hubMeta, { color: theme.textSecondary }]}>
            Unit 402 • ID: GW-A101
          </Text>

          <View style={[styles.hubStats, { borderTopColor: theme.cardBorder }]}>
            <StatCol label="Load" value="1.2 kW" theme={theme} />
            <StatCol
              label="Signal"
              value="Strong"
              color="#00ff99"
              theme={theme}
            />
            <StatCol label="Devices" value="4 Active" theme={theme} />
          </View>

          <MaterialIcons
            name="settings"
            size={20}
            color={theme.textSecondary}
            style={styles.settingsIcon}
          />
        </TouchableOpacity>

        {/* OFFLINE HUB CARD */}
        <TouchableOpacity
          style={[
            styles.hubCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.hubHeader}>
            <View
              style={[
                styles.hubIcon,
                { backgroundColor: "rgba(255, 68, 68, 0.1)" },
              ]}
            >
              <MaterialIcons name="wifi-off" size={24} color="#ff4444" />
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: "rgba(255, 68, 68, 0.15)",
                  borderColor: "rgba(255, 68, 68, 0.3)",
                },
              ]}
            >
              <Text
                style={{
                  color: "#ff4444",
                  fontSize: 10,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                Offline
              </Text>
            </View>
          </View>

          <Text style={[styles.hubName, { color: theme.text }]}>
            Bedroom Hub
          </Text>
          <Text style={[styles.hubMeta, { color: theme.textSecondary }]}>
            Unit 402 • ID: GW-B205
          </Text>

          <View style={[styles.hubStats, { borderTopColor: theme.cardBorder }]}>
            <StatCol label="Last Seen" value="2h ago" theme={theme} />
            <StatCol
              label="Reason"
              value="No Power"
              color="#ff4444"
              theme={theme}
            />
            <View style={{ flex: 1 }} />
          </View>

          <MaterialIcons
            name="chevron-right"
            size={24}
            color={theme.textSecondary}
            style={styles.settingsIcon}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCol({ label, value, color, theme }) {
  return (
    <View style={styles.statCol}>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.statVal, { color: color || theme.text }]}>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  backText: { fontSize: 14, fontWeight: "500" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 0,
  },

  content: { padding: 24 },

  hubCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  hubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  hubIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },

  hubName: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  hubMeta: { fontSize: 11, marginBottom: 12 },

  hubStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  statCol: { flex: 1, gap: 4 },
  statLabel: { fontSize: 10, textTransform: "uppercase", fontWeight: "600" },
  statVal: { fontSize: 12, fontWeight: "500" },

  settingsIcon: { position: "absolute", bottom: 16, right: 16 },
});
