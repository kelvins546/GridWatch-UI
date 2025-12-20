import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const dangerColor = isDarkMode ? "#ff4444" : "#c62828";
  const dangerBg = isDarkMode
    ? "rgba(255, 68, 68, 0.05)"
    : "rgba(198, 40, 40, 0.05)";
  const dangerBorder = isDarkMode
    ? "rgba(255, 68, 68, 0.3)"
    : "rgba(198, 40, 40, 0.2)";

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const handleSaveConfirm = () => {
    setShowSaveModal(false);

    setTimeout(() => {
      navigation.goBack();
    }, 200);
  };

  const performDeactivate = () => {
    setShowDeactivateModal(false);
    console.log("Account Deactivated");
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
          Edit Profile
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: theme.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={
                isDarkMode ? ["#0055ff", "#00ff99"] : ["#0055ff", "#00995e"]
              }
              style={styles.avatarImg}
            >
              <Text style={styles.avatarText}>NA</Text>
            </LinearGradient>

            <TouchableOpacity
              style={[styles.editBadge, { borderColor: theme.background }]}
            >
              <MaterialIcons name="camera-alt" size={16} color="#000" />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.userRole,
              {
                backgroundColor: isDarkMode
                  ? "rgba(0, 255, 153, 0.1)"
                  : "rgba(0, 153, 94, 0.1)",
                borderColor: isDarkMode
                  ? "rgba(0, 255, 153, 0.2)"
                  : "rgba(0, 153, 94, 0.2)",
              },
            ]}
          >
            <Text style={[styles.userRoleText, { color: theme.primary }]}>
              HOME ADMIN
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Personal Information
        </Text>
        <InputGroup label="Full Name" value="Natasha Alonzo" theme={theme} />
        <InputGroup
          label="Email Address"
          value="natasha@ex.com"
          theme={theme}
          disabled
        />
        <InputGroup
          label="Unit Number"
          value="Unit 402, Congress Ville"
          theme={theme}
        />

        <Text
          style={[
            styles.sectionLabel,
            { color: theme.textSecondary, marginTop: 20 },
          ]}
        >
          Security
        </Text>
        <InputGroup
          label="Current Password"
          placeholder="••••••••"
          isPassword
          theme={theme}
        />
        <InputGroup
          label="New Password"
          placeholder="Enter new password"
          isPassword
          theme={theme}
        />

        <View
          style={[
            styles.dangerCard,
            { backgroundColor: dangerBg, borderColor: dangerBorder },
          ]}
        >
          <View style={styles.dangerTitleRow}>
            <MaterialIcons name="warning" size={18} color={dangerColor} />
            <Text style={[styles.dangerTitle, { color: dangerColor }]}>
              Deactivate Account
            </Text>
          </View>
          <Text style={[styles.dangerDesc, { color: theme.textSecondary }]}>
            This will disable your access and disconnect all linked hubs. This
            action cannot be undone.
          </Text>
          <TouchableOpacity
            style={[styles.deactivateBtn, { borderColor: dangerColor }]}
            onPress={() => setShowDeactivateModal(true)}
          >
            <Text style={[styles.deactivateBtnText, { color: dangerColor }]}>
              Deactivate Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomModal
        visible={showSaveModal}
        icon="check-circle"
        iconColor={theme.primary}
        title="Profile Updated"
        msg="Your changes have been saved successfully."
        onClose={() => setShowSaveModal(false)}
        theme={theme}
        primaryAction={{
          text: "Okay",
          onPress: handleSaveConfirm,
          color: ["#0055ff", isDarkMode ? "#00ff99" : "#00995e"],
        }}
      />

      <CustomModal
        visible={showDeactivateModal}
        icon="report-problem"
        iconColor={dangerColor}
        title="Are you sure?"
        msg="You are about to permanently deactivate your account. All data will be lost."
        onClose={() => setShowDeactivateModal(false)}
        theme={theme}
        secondaryAction={{
          text: "Cancel",
          onPress: () => setShowDeactivateModal(false),
          textColor: theme.text,
        }}
        primaryAction={{
          text: "Yes, Deactivate",
          onPress: performDeactivate,
          solidColor: dangerColor,
        }}
      />
    </SafeAreaView>
  );
}

function InputGroup({
  label,
  value,
  placeholder,
  isPassword,
  disabled,
  theme,
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.inputField,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            color: theme.text,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={isPassword}
        editable={!disabled}
      />
    </View>
  );
}

function CustomModal({
  visible,
  icon,
  iconColor,
  title,
  msg,
  onClose,
  theme,
  primaryAction,
  secondaryAction,
}) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <MaterialIcons
            name={icon}
            size={48}
            color={iconColor}
            style={{ marginBottom: 15 }}
          />
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {title}
          </Text>
          <Text style={[styles.modalMsg, { color: theme.textSecondary }]}>
            {msg}
          </Text>

          <View style={styles.modalActions}>
            {secondaryAction && (
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    borderWidth: 1,
                    borderColor: theme.textSecondary,
                    marginRight: 10,
                  },
                ]}
                onPress={secondaryAction.onPress}
              >
                <Text
                  style={{
                    color: secondaryAction.textColor,
                    fontWeight: "700",
                  }}
                >
                  {secondaryAction.text}
                </Text>
              </TouchableOpacity>
            )}

            {primaryAction && (
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: primaryAction.solidColor || "transparent",
                  },
                ]}
                onPress={primaryAction.onPress}
              >
                {primaryAction.color ? (
                  <LinearGradient
                    colors={primaryAction.color}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={{ color: "#000", fontWeight: "700" }}>
                      {primaryAction.text}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.gradientBtn}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {primaryAction.text}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
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
  scrollContent: { padding: 24, paddingBottom: 40 },
  avatarSection: { alignItems: "center", marginBottom: 30 },
  avatarWrapper: {
    position: "relative",
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 40, fontWeight: "700", color: "#1a1a1a" },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
  },
  userRole: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  userRoleText: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 12, marginBottom: 6, fontWeight: "500" },
  inputField: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
  },
  dangerCard: { borderWidth: 1, borderRadius: 16, padding: 20, marginTop: 30 },
  dangerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  dangerTitle: { fontSize: 14, fontWeight: "700" },
  dangerDesc: { fontSize: 11, lineHeight: 18, marginBottom: 15 },
  deactivateBtn: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
  },
  deactivateBtnText: { fontWeight: "600", fontSize: 13 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
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
  modalActions: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
  },
  modalBtn: {
    flex: 1,
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  gradientBtn: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
