import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function SetupHubScreen() {
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Add New Hub
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* STEP 1 */}
        <View style={styles.formGroup}>
          <Text style={[styles.stepLabel, { color: theme.primary }]}>
            Step 1: Wi-Fi Provisioning
          </Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
            Connect the ESP32 Gateway to your home network.
          </Text>

          <View
            style={[
              styles.wifiList,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.wifiItem,
                {
                  borderBottomColor: theme.cardBorder,
                  backgroundColor: isDarkMode
                    ? "rgba(0, 255, 153, 0.1)"
                    : "#f0fdf4",
                },
              ]}
            >
              <MaterialIcons name="wifi" size={18} color={theme.text} />
              <Text style={[styles.wifiName, { color: theme.text }]}>
                PLDT_Home_FIBR_5G
              </Text>
              <MaterialIcons
                name="check-circle"
                size={18}
                color={theme.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.wifiItem}>
              <MaterialIcons
                name="wifi"
                size={18}
                color={theme.textSecondary}
              />
              <Text style={[styles.wifiName, { color: theme.textSecondary }]}>
                Globe_At_Home
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.inputBox,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <TextInput
              style={[styles.inputField, { color: theme.text }]}
              value="MySecurePassword123"
              secureTextEntry={true}
              editable={false}
            />
            <Text style={{ fontSize: 12, color: "#0055ff", fontWeight: "600" }}>
              Show
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { borderTopColor: theme.cardBorder }]} />

        {/* STEP 2 */}
        <View style={styles.formGroup}>
          <Text style={[styles.stepLabel, { color: theme.primary }]}>
            Step 2: Outlet Configuration
          </Text>
          <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>
            Identify appliances plugged into the Hub.
          </Text>

          <OutletRow
            label="Outlet 1 (30A Relay)"
            value="Air Conditioner"
            theme={theme}
          />
          <OutletRow label="Outlet 2" value="Television" theme={theme} />
          <OutletRow label="Outlet 3" value="Refrigerator" theme={theme} />
          <OutletRow
            label="Outlet 4"
            value="Empty / Unused"
            isPlaceholder
            theme={theme}
          />
        </View>
      </ScrollView>

      {/* FOOTER BTN */}
      <View
        style={[
          styles.btnContainer,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          // --- FIX APPLIED HERE ---
          // Navigate to 'MainApp' stack first, then find 'Home' inside it.
          onPress={() => navigation.navigate("MainApp", { screen: "Home" })}
        >
          <LinearGradient
            colors={["#0055ff", "#00ff99"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtn}
          >
            <Text style={styles.btnText}>Complete Setup & Pair</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function OutletRow({ label, value, isPlaceholder, theme }) {
  return (
    <View style={styles.outletRow}>
      <Text style={[styles.outletLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <View
        style={[
          styles.dropdown,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
      >
        <Text
          style={[
            styles.dropdownText,
            { color: isPlaceholder ? theme.textSecondary : theme.text },
          ]}
        >
          {value}
        </Text>
        <MaterialIcons
          name="keyboard-arrow-down"
          size={20}
          color={theme.textSecondary}
        />
      </View>
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

  content: { padding: 24 },

  stepLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  stepDesc: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  formGroup: { marginBottom: 25 },

  wifiList: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 15,
  },
  wifiItem: { flexDirection: "row", alignItems: "center", padding: 15 },
  wifiName: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: "500" },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputField: { flex: 1, fontSize: 14 },

  divider: { marginVertical: 30, borderTopWidth: 1, borderStyle: "dashed" },

  outletRow: { marginBottom: 15 },
  outletLabel: { fontSize: 13, marginBottom: 6 },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  dropdownText: { fontSize: 14 },

  btnContainer: { padding: 24, borderTopWidth: 1 },
  primaryBtn: { padding: 16, borderRadius: 16, alignItems: "center" },
  btnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
