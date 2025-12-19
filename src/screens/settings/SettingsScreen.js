import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const { isDarkMode, toggleTheme, theme } = useTheme();

  const handleLogout = () => {
    setModalVisible(false);
    console.log("Logged Out");
  };

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
          Settings
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE CARD */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate("ProfileSettings")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isDarkMode ? ["#0055ff", "#00ff99"] : ["#0055ff", "#00995e"]
            }
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>N</Text>
          </LinearGradient>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.text }]}>
              Natasha Alonzo
            </Text>
            <Text style={[styles.userAddress, { color: theme.textSecondary }]}>
              Unit 402, Congress Ville
            </Text>
          </View>
          <MaterialIcons name="edit" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* --- ANIMATED SECTIONS --- */}

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Utility & Rates
        </Text>

        {/* PROVIDER ROW (Navigates to ProviderSetup) */}
        <SettingsRow
          icon="business"
          title="Meralco"
          subtitle="Current Provider"
          onPress={() => navigation.navigate("ProviderSetup")}
          theme={theme}
          customIcon={
            <View style={styles.providerLogo}>
              <Text style={styles.providerLogoText}>M</Text>
            </View>
          }
        />

        {/* RATE ROW (Static Info) */}
        <View
          style={[
            styles.settingItem,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.settingLeft}>
            <MaterialIcons name="bolt" size={22} color={theme.icon} />
            <View>
              <Text style={[styles.settingText, { color: theme.text }]}>
                Electricity Rate
              </Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Last updated: Today, 8:00 AM
              </Text>
            </View>
          </View>
          <View style={styles.rateDisplay}>
            <Text style={[styles.rateValue, { color: theme.text }]}>
              ₱ 12.50
            </Text>
            <Text style={[styles.rateLabel, { color: theme.primary }]}>
              Auto-Sync ON
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Device Configuration
        </Text>

        <SettingsRow
          icon="router"
          title="GridWatch Hub"
          subtitle="Online • 192.168.1.15"
          onPress={() => navigation.navigate("DeviceConfig")}
          theme={theme}
        />

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Preferences
        </Text>

        <SettingsRow
          icon="notifications"
          title="Notifications"
          onPress={() => navigation.navigate("Notifications")}
          theme={theme}
        />

        <SettingsRow
          icon="help-outline"
          title="Help & Support"
          onPress={() => navigation.navigate("HelpSupport")}
          theme={theme}
        />

        {/* DARK MODE SWITCH */}
        <View
          style={[
            styles.settingItem,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.settingLeft}>
            <MaterialIcons name="dark-mode" size={22} color={theme.icon} />
            <Text
              style={[
                styles.settingText,
                { marginLeft: 12, color: theme.text },
              ]}
            >
              Dark Mode
            </Text>
          </View>
          <Switch
            // FIX: Gray track when off
            trackColor={{
              false: "#d1d1d1",
              true: isDarkMode
                ? "rgba(0, 255, 153, 0.2)"
                : "rgba(0, 153, 94, 0.2)",
            }}
            thumbColor={isDarkMode ? theme.primary : "#f4f3f4"}
            onValueChange={toggleTheme}
            value={isDarkMode}
          />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* LOGOUT MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <MaterialIcons
              name="logout"
              size={40}
              color="#ff4444"
              style={{ marginBottom: 15 }}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Log Out?
            </Text>
            <Text style={[styles.modalMsg, { color: theme.textSecondary }]}>
              Are you sure you want to sign out?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.btnCancel,
                  { borderColor: theme.textSecondary },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.btnCancelText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.btnConfirm]}
                onPress={handleLogout}
              >
                <LinearGradient
                  colors={["#ff4444", "#ff8800"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnConfirmText}>Log Out</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- REUSABLE COMPONENT: SettingsRow with Icon Animation ---
function SettingsRow({ icon, title, subtitle, onPress, theme, customIcon }) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    // Shrink icon
    Animated.spring(scaleValue, {
      toValue: 0.8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    // Bounce back
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        {/* Animated Icon Wrapper */}
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          {customIcon ? (
            customIcon
          ) : (
            <MaterialIcons name={icon} size={22} color={theme.icon} />
          )}
        </Animated.View>

        <View>
          <Text
            style={[styles.settingText, { marginLeft: 12, color: theme.text }]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.settingSub,
                { marginLeft: 12, color: theme.textSecondary },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={20}
        color={theme.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { fontSize: 14, fontWeight: "500", marginLeft: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  scrollContent: { padding: 24, paddingBottom: 40 },
  profileCard: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  userDetails: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "700" },
  userAddress: { fontSize: 12, marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 10,
  },

  settingItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
  },
  settingLeft: { flexDirection: "row", alignItems: "center" },
  settingText: { fontSize: 14, fontWeight: "500" },
  settingSub: { fontSize: 11, marginTop: 2 },

  providerLogo: {
    width: 28,
    height: 28,
    backgroundColor: "#fff",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  providerLogoText: { color: "#000", fontWeight: "900", fontSize: 14 },
  rateDisplay: { alignItems: "flex-end" },
  rateValue: { fontSize: 14, fontWeight: "700" },
  rateLabel: { fontSize: 10, fontWeight: "600" },
  logoutBtn: {
    marginTop: 30,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  logoutText: { color: "#ff4d4d", fontWeight: "600", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderWidth: 1,
    padding: 25,
    borderRadius: 20,
    width: 280,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  modalMsg: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 18,
  },
  modalActions: { flexDirection: "row", gap: 10, width: "100%" },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  btnCancel: { backgroundColor: "transparent", borderWidth: 1 },
  btnCancelText: { fontWeight: "700", fontSize: 13 },
  btnConfirm: { overflow: "hidden" },
  gradientBtn: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  btnConfirmText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
