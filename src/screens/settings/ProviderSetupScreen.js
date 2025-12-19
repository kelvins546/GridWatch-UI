import React, { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

export default function ProviderSetupScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  // State to track selection (Default: 'meralco')
  const [selectedId, setSelectedId] = useState("meralco");

  const providers = [
    {
      id: "meralco",
      name: "Meralco",
      sub: "Rate: ₱ 12.50 / kWh",
      logo: "M",
      color: "#ff6600",
      isRec: true,
    },
    {
      id: "veco",
      name: "VECO",
      sub: "Visayan Electric",
      logo: "V",
      color: "#0055ff",
    },
    {
      id: "davao",
      name: "Davao Light",
      sub: "Davao Light & Power Co.",
      logo: "D",
      color: "#ffcc00",
    },
  ];

  const handleSelect = (id) => setSelectedId(id);

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
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Select Utility Provider
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Choose your local electricity distributor to sync the latest kWh rates
          automatically.
        </Text>

        {/* RECOMMENDED SECTION */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Recommended (Caloocan)
        </Text>
        <ProviderCard
          item={providers[0]}
          isSelected={selectedId === "meralco"}
          onPress={() => handleSelect("meralco")}
          theme={theme}
          isDarkMode={isDarkMode}
        />

        {/* OTHER PROVIDERS */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Other Providers
        </Text>
        {providers.slice(1).map((item) => (
          <ProviderCard
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            onPress={() => handleSelect(item.id)}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        ))}

        {/* MANUAL CONFIG */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Manual Configuration
        </Text>
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor:
                selectedId === "manual" ? "#0055ff" : theme.cardBorder,
            },
            selectedId === "manual" && {
              backgroundColor: isDarkMode
                ? "rgba(0, 85, 255, 0.1)"
                : "rgba(0, 85, 255, 0.05)",
            },
          ]}
          onPress={() => handleSelect("manual")}
          activeOpacity={0.7}
        >
          {selectedId === "manual" && (
            <View style={styles.checkIcon}>
              <MaterialIcons name="check" size={12} color="#fff" />
            </View>
          )}

          <View style={[styles.logoBox, { backgroundColor: "#333" }]}>
            <MaterialIcons name="edit" size={20} color="#fff" />
          </View>

          <View>
            <Text style={[styles.providerName, { color: theme.text }]}>
              Set Custom Rate
            </Text>
            <Text style={[styles.rateText, { color: theme.textSecondary }]}>
              Enter your own ₱/kWh value
            </Text>
          </View>
        </TouchableOpacity>

        {/* CONFIRM BUTTON */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => navigation.goBack()}
        >
          <LinearGradient
            colors={["#0055ff", "#00ff99"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            <Text style={styles.btnText}>Confirm Selection</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- REUSABLE CARD COMPONENT ---
function ProviderCard({ item, isSelected, onPress, theme, isDarkMode }) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: isSelected ? "#0055ff" : theme.cardBorder,
        },
        isSelected && {
          backgroundColor: isDarkMode
            ? "rgba(0, 85, 255, 0.15)"
            : "rgba(0, 85, 255, 0.05)",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Absolute Check Icon */}
      {isSelected && (
        <View style={[styles.checkIcon, { borderColor: theme.card }]}>
          <MaterialIcons name="check" size={12} color="#fff" />
        </View>
      )}

      {/* Logo Box */}
      <View style={[styles.logoBox, { backgroundColor: "#fff" }]}>
        <Text style={[styles.logoText, { color: item.color }]}>
          {item.logo}
        </Text>
      </View>

      {/* Text Info */}
      <View>
        <Text style={[styles.providerName, { color: theme.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.rateText, { color: theme.textSecondary }]}>
          {item.id === "meralco" ? (
            <Text>
              Rate:{" "}
              <Text style={{ color: theme.primary, fontWeight: "600" }}>
                ₱ 12.50 / kWh
              </Text>
            </Text>
          ) : (
            item.sub
          )}
        </Text>
      </View>
    </TouchableOpacity>
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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  content: { padding: 24 },
  description: {
    textAlign: "center",
    fontSize: 13,
    marginBottom: 30,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 10,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  logoText: { fontSize: 18, fontWeight: "900" },
  providerName: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  rateText: { fontSize: 12 },

  checkIcon: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#0055ff",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  confirmBtn: {
    marginTop: 20,
    height: 50,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientBtn: { flex: 1, justifyContent: "center", alignItems: "center" },
  btnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
