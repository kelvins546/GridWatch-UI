import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import * as Clipboard from "expo-clipboard";
import { supabase } from "../../lib/supabase";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const checkPasswordStrength = (str) => {
  const hasLength = str.length >= 8;
  const hasNumber = /\d/.test(str);
  const hasUpper = /[A-Z]/.test(str);
  const hasLower = /[a-z]/.test(str);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(str);
  const isValid = hasLength && hasNumber && hasUpper && hasLower && hasSpecial;
  return { hasLength, hasNumber, hasUpper, hasLower, hasSpecial, isValid };
};

export default function AccountSettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const [isLoading, setIsLoading] = useState(true);

  // --- SECURITY GATE STATE ---
  const [isVerified, setIsVerified] = useState(false);
  const [verificationPassword, setVerificationPassword] = useState("");
  const [showVerifyPass, setShowVerifyPass] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // --- SETTINGS STATE ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangePasswordExpanded, setIsChangePasswordExpanded] =
    useState(false);

  // --- 2FA STATE ---
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [mfaModalVisible, setMfaModalVisible] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'DISABLE_2FA' | 'SAVE_PASSWORD'
  const [isCopied, setIsCopied] = useState(false);

  // --- DEACTIVATION STATE ---
  const [isAccountControlExpanded, setIsAccountControlExpanded] =
    useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateTimer, setDeactivateTimer] = useState(10);
  const [deactivateAgreed, setDeactivateAgreed] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
    confirmText: "Okay",
    cancelText: "Cancel",
  });

  const passAnalysis = checkPasswordStrength(newPassword);
  const isMatch = newPassword === confirmPassword && newPassword.length > 0;

  useEffect(() => {
    checkUserAndMfaStatus();
  }, []);

  // Timer for Deactivation
  useEffect(() => {
    let interval;
    if (showDeactivateModal && deactivateTimer > 0) {
      interval = setInterval(() => {
        setDeactivateTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showDeactivateModal, deactivateTimer]);

  const checkUserAndMfaStatus = async () => {
    setIsLoading(true);
    try {
      // 1. Check User & verification status
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email);
        const isEmailProvider =
          user.app_metadata.provider === "email" ||
          (user.app_metadata.providers &&
            user.app_metadata.providers.includes("email"));
        const hasMetadataPass = user.user_metadata?.has_password === true;

        // If user has a password, require verification. Else (Google only), allow access.
        if (isEmailProvider || hasMetadataPass) {
          setIsVerified(false);
        } else {
          setIsVerified(true);
        }

        // 2. Check MFA Status
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (!error) {
          const totpFactor = data.totp.find((f) => f.status === "verified");
          setIs2FAEnabled(!!totpFactor);
          if (totpFactor) setMfaFactorId(totpFactor.id);
        }
      }
    } catch (e) {
      console.log("Init Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- GATEKEEPER LOGIC ---
  const verifyIdentity = async () => {
    if (!verificationPassword) return;
    setIsVerifying(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: verificationPassword,
    });
    setIsVerifying(false);
    if (error) {
      showModal("error", "Incorrect Password", "Please try again.");
    } else {
      setIsVerified(true);
    }
  };

  // --- PASSWORD LOGIC ---
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) return;
    if (!passAnalysis.isValid || !isMatch) {
      showModal(
        "error",
        "Password Error",
        "Please check password requirements.",
      );
      return;
    }

    // If 2FA is ON, require elevation
    if (is2FAEnabled) {
      const { data: level } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (level && level.currentLevel !== "aal2") {
        setPendingAction("SAVE_PASSWORD");
        setMfaCode("");
        setMfaModalVisible(true);
        return;
      }
    }

    updatePassword();
  };

  const updatePassword = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { has_password: true },
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      setIsChangePasswordExpanded(false);
      showModal("success", "Success", "Password updated successfully.");
    } catch (error) {
      showModal("error", "Update Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2FA LOGIC ---
  const handleToggle2FA = () => {
    if (is2FAEnabled) {
      // Disable needs verification
      setPendingAction("DISABLE_2FA");
      if (!mfaFactorId) {
        supabase.auth.mfa.listFactors().then(({ data }) => {
          const factor = data?.totp?.find((f) => f.status === "verified");
          if (factor) setMfaFactorId(factor.id);
        });
      }
      setMfaCode("");
      setMfaModalVisible(true);
    } else {
      startMfaEnrollment();
    }
  };

  const cleanupUnverifiedFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data.totp) {
        const unverified = data.totp.filter((f) => f.status === "unverified");
        await Promise.all(
          unverified.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })),
        );
      }
    } catch (e) {
      console.log("Cleanup warning:", e);
    }
  };

  const startMfaEnrollment = async () => {
    setIsMfaLoading(true);
    try {
      await cleanupUnverifiedFactors();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error) throw error;
      setMfaFactorId(data.id);
      setMfaSecret(data.totp.secret);
      setMfaCode("");
      setPendingAction(null); // Normal enrollment
      setMfaModalVisible(true);
    } catch (e) {
      console.log("Enrollment error silenced:", e.message);
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (mfaCode.length !== 6) return;
    setIsMfaLoading(true);
    try {
      const c = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (c.error) throw c.error;

      const v = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: c.data.id,
        code: mfaCode,
      });

      if (v.error) throw v.error;

      setMfaModalVisible(false);

      if (pendingAction === "DISABLE_2FA") {
        await disable2FA();
      } else if (pendingAction === "SAVE_PASSWORD") {
        await updatePassword();
      } else {
        // Enable Success
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await supabase
          .from("users")
          .update({ is_2fa_enabled: true })
          .eq("id", user.id);
        setIs2FAEnabled(true);
        showModal(
          "success",
          "2FA Enabled",
          "Two-Factor Authentication active.",
        );
      }
      setPendingAction(null);
    } catch (e) {
      showModal("error", "Failed", "Invalid code or expired session.");
    } finally {
      setIsMfaLoading(false);
    }
  };

  const disable2FA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      if (data.totp) {
        await Promise.all(
          data.totp.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })),
        );
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({ is_2fa_enabled: false })
          .eq("id", user.id);
      }
      setIs2FAEnabled(false);
      setMfaFactorId(null);
      showModal("success", "2FA Disabled", "You have turned off 2FA.");
    } catch (e) {
      showModal("error", "Error", e.message);
    }
  };

  const handleCancelMfaSetup = async () => {
    if (!pendingAction && mfaFactorId) {
      await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
      setMfaFactorId(null);
    }
    setMfaModalVisible(false);
    setPendingAction(null);
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(mfaSecret);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- DEACTIVATION LOGIC ---
  const confirmDeactivate = () => {
    setDeactivateTimer(10);
    setDeactivateAgreed(false);
    setShowDeactivateModal(true);
  };

  const performDeactivation = async () => {
    setIsLoading(true);
    setShowDeactivateModal(false);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error: updateError } = await supabase
        .from("users")
        .update({
          status: "archived",
          archived_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await supabase.auth.signOut();
      navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
    } catch (error) {
      setIsLoading(false);
      showModal("error", "Deactivation Failed", error.message);
    }
  };

  const togglePasswordExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsChangePasswordExpanded(!isChangePasswordExpanded);
  };
  const toggleAccountControlExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAccountControlExpanded(!isAccountControlExpanded);
  };

  const showModal = (
    type,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText,
    cancelText,
  ) =>
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      onConfirm:
        onConfirm || (() => setModalConfig((p) => ({ ...p, visible: false }))),
      onCancel:
        onCancel || (() => setModalConfig((p) => ({ ...p, visible: false }))),
      confirmText: confirmText || "Okay",
      cancelText: cancelText || "Cancel",
    });

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#B0B0B0" />
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top", "left", "right", "bottom"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* HEADER */}
      <View
        className="flex-row items-center justify-center px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ position: "absolute", left: 24, padding: 4, zIndex: 10 }}
        >
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(20)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(18) }}
        >
          Account Settings
        </Text>
      </View>

      {!isVerified ? (
        // SECURITY GATE VIEW
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 32,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.buttonNeutral,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <MaterialIcons
                name="lock"
                size={40}
                color={theme.textSecondary}
              />
            </View>
            <Text
              style={{
                fontSize: scaledSize(20),
                fontWeight: "bold",
                color: theme.text,
                marginBottom: 8,
              }}
            >
              Security Verification
            </Text>
            <Text
              style={{
                fontSize: scaledSize(14),
                color: theme.textSecondary,
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              To access security settings, please enter your current password.
            </Text>

            <View style={{ width: "100%", maxWidth: 320 }}>
              <InputGroup
                label="Current Password"
                icon="lock"
                placeholder="Enter password"
                isPassword
                showPassword={showVerifyPass}
                togglePassword={() => setShowVerifyPass(!showVerifyPass)}
                value={verificationPassword}
                onChangeText={setVerificationPassword}
                theme={theme}
                scaledSize={scaledSize}
              />
              <TouchableOpacity
                onPress={verifyIdentity}
                disabled={isVerifying || !verificationPassword}
                style={{
                  backgroundColor: theme.buttonPrimary,
                  borderRadius: 12,
                  height: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Verify
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        // MAIN SETTINGS VIEW (Protected)
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24 }}
          >
            <Text
              className="font-bold uppercase tracking-widest mb-3"
              style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
            >
              Security
            </Text>

            {/* 1. Change Password */}
            <TouchableOpacity
              onPress={togglePasswordExpand}
              className="p-4 rounded-xl mb-3 flex-row justify-between items-center border h-[72px]"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name="lock"
                  size={scaledSize(22)}
                  color={theme.icon}
                />
                <Text
                  className="font-medium ml-3"
                  style={{ color: theme.text, fontSize: scaledSize(14) }}
                >
                  Change Password
                </Text>
              </View>
              <MaterialIcons
                name={
                  isChangePasswordExpanded
                    ? "keyboard-arrow-up"
                    : "chevron-right"
                }
                size={scaledSize(22)}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {isChangePasswordExpanded && (
              <View className="mb-4 pl-2">
                <InputGroup
                  label="New Password"
                  icon="lock"
                  placeholder="New password"
                  isPassword
                  showPassword={showNewPass}
                  togglePassword={() => setShowNewPass(!showNewPass)}
                  theme={theme}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  scaledSize={scaledSize}
                />
                <InputGroup
                  label="Confirm Password"
                  icon="lock-outline"
                  placeholder="Confirm password"
                  isPassword
                  showPassword={showConfirmPass}
                  togglePassword={() => setShowConfirmPass(!showConfirmPass)}
                  theme={theme}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  scaledSize={scaledSize}
                />
                {newPassword.length > 0 && (
                  <View
                    className="p-4 rounded-xl border mb-4"
                    style={{
                      backgroundColor: theme.buttonNeutral,
                      borderColor:
                        !passAnalysis.isValid ||
                        (!isMatch && confirmPassword.length > 0)
                          ? theme.buttonDangerText
                          : theme.cardBorder,
                    }}
                  >
                    <RequirementRow
                      met={passAnalysis.hasLength}
                      text="8+ chars"
                      theme={theme}
                    />
                    <RequirementRow
                      met={passAnalysis.hasNumber}
                      text="1+ number"
                      theme={theme}
                    />
                    <RequirementRow
                      met={passAnalysis.hasUpper}
                      text="Uppercase"
                      theme={theme}
                    />
                    <RequirementRow
                      met={passAnalysis.hasSpecial}
                      text="Special char"
                      theme={theme}
                    />
                    <RequirementRow met={isMatch} text="Match" theme={theme} />
                  </View>
                )}
                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={isLoading}
                  style={{
                    backgroundColor: theme.buttonPrimary,
                    borderRadius: 12,
                    height: 48,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: scaledSize(14),
                      }}
                    >
                      Update Password
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 2. Enable 2FA */}
            <View
              className="p-4 rounded-xl mb-3 flex-row justify-between items-center border h-[72px]"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name="security"
                  size={scaledSize(22)}
                  color={theme.icon}
                />
                <Text
                  className="font-medium ml-3"
                  style={{ color: theme.text, fontSize: scaledSize(14) }}
                >
                  Enable 2FA
                </Text>
              </View>
              <CustomSwitch
                value={is2FAEnabled}
                onToggle={handleToggle2FA}
                theme={theme}
              />
            </View>

            {/* 3. Account Ownership */}
            <TouchableOpacity
              onPress={toggleAccountControlExpand}
              className="p-4 rounded-xl mb-3 flex-row justify-between items-center border h-[72px]"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name="admin-panel-settings"
                  size={scaledSize(22)}
                  color={theme.icon}
                />
                <Text
                  className="font-medium ml-3"
                  style={{ color: theme.text, fontSize: scaledSize(14) }}
                >
                  Account Control
                </Text>
              </View>
              <MaterialIcons
                name={
                  isAccountControlExpanded
                    ? "keyboard-arrow-up"
                    : "chevron-right"
                }
                size={scaledSize(22)}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {isAccountControlExpanded && (
              <View
                className="mb-6 p-4 rounded-xl border"
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(255, 68, 68, 0.05)"
                    : "rgba(198, 40, 40, 0.05)",
                  borderColor: isDarkMode
                    ? "rgba(255, 68, 68, 0.3)"
                    : "rgba(198, 40, 40, 0.2)",
                }}
              >
                <Text
                  className="font-bold mb-2"
                  style={{
                    color: isDarkMode ? "#ff4444" : "#c62828",
                    fontSize: scaledSize(14),
                  }}
                >
                  Deactivate Account
                </Text>
                <Text
                  className="mb-4"
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  This will disable your access and disconnect all linked hubs.
                </Text>
                <TouchableOpacity
                  onPress={confirmDeactivate}
                  className="w-full p-3 border rounded-xl items-center"
                  style={{ borderColor: isDarkMode ? "#ff4444" : "#c62828" }}
                >
                  <Text
                    className="font-semibold"
                    style={{
                      color: isDarkMode ? "#ff4444" : "#c62828",
                      fontSize: scaledSize(12),
                    }}
                  >
                    Deactivate
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* --- MODALS --- */}

      {/* DEACTIVATION CONFIRM MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeactivateModal}
        onRequestClose={() => setShowDeactivateModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: 300,
              backgroundColor: theme.card,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="mb-4">
              <Text
                style={{
                  fontSize: scaledSize(18),
                  fontWeight: "bold",
                  color: theme.text,
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                Deactivate Account
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  color: theme.textSecondary,
                  fontSize: scaledSize(13),
                  lineHeight: 20,
                  marginBottom: 10,
                }}
              >
                Your account will be deactivated immediately.
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  color: theme.textSecondary,
                  fontSize: scaledSize(13),
                  lineHeight: 20,
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontWeight: "bold", color: theme.text }}>
                  Reactivation:
                </Text>{" "}
                Log in anytime to reactivate.
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  color: "#ff4444",
                  fontSize: scaledSize(13),
                  lineHeight: 20,
                  fontWeight: "500",
                }}
              >
                Important: Permanently deleted if not reactivated in 6 months.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setDeactivateAgreed(!deactivateAgreed)}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                paddingVertical: 12,
                marginBottom: 20,
              }}
            >
              <MaterialIcons
                name={
                  deactivateAgreed ? "check-box" : "check-box-outline-blank"
                }
                size={24}
                color={
                  deactivateAgreed ? theme.buttonPrimary : theme.textSecondary
                }
                style={{ marginTop: 2 }}
              />
              <Text
                style={{
                  marginLeft: 12,
                  color: theme.text,
                  fontSize: scaledSize(12),
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                I understand the deletion policy.
              </Text>
            </TouchableOpacity>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={performDeactivation}
                disabled={deactivateTimer > 0 || !deactivateAgreed}
                style={{
                  backgroundColor:
                    deactivateTimer > 0 || !deactivateAgreed
                      ? theme.buttonNeutral
                      : "#ff4444",
                  height: 48,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      color:
                        deactivateTimer > 0 || !deactivateAgreed
                          ? theme.textSecondary
                          : "#fff",
                      fontWeight: "bold",
                      fontSize: scaledSize(14),
                    }}
                  >
                    {deactivateTimer > 0
                      ? `Wait ${deactivateTimer}s`
                      : "Deactivate"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDeactivateModal(false)}
                style={{
                  height: 44,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontWeight: "600",
                    fontSize: scaledSize(14),
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2FA SETUP MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={mfaModalVisible}
        onRequestClose={() => {
          if (!isMfaLoading) handleCancelMfaSetup();
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.9)",
            padding: 24,
          }}
        >
          <TouchableOpacity
            style={[
              { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            ]}
            onPress={() => !isMfaLoading && handleCancelMfaSetup()}
            activeOpacity={1}
          />
          <View
            style={{
              width: 300,
              maxWidth: 350,
              backgroundColor: theme.card,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <Text
              className="text-center font-bold mb-4"
              style={{ color: theme.text, fontSize: scaledSize(18) }}
            >
              {pendingAction === "DISABLE_2FA"
                ? "Verify to Disable"
                : pendingAction === "SAVE_PASSWORD"
                  ? "Verify to Save"
                  : "Setup 2FA"}
            </Text>

            {pendingAction !== "DISABLE_2FA" &&
              pendingAction !== "SAVE_PASSWORD" && (
                <>
                  <Text
                    className="text-center mb-6"
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(13),
                    }}
                  >
                    Copy this key to your Authenticator App:
                  </Text>
                  <TouchableOpacity
                    onPress={async () => {
                      await Clipboard.setStringAsync(mfaSecret);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="p-3 rounded-xl mb-4 items-center border border-dashed"
                    style={{
                      borderColor: theme.textSecondary,
                      backgroundColor: theme.buttonNeutral,
                    }}
                  >
                    <Text
                      className="font-mono font-bold text-center mb-1"
                      style={{
                        color: theme.buttonPrimary,
                        fontSize: scaledSize(14),
                      }}
                    >
                      {mfaSecret}
                    </Text>
                    <Text
                      style={{
                        color: isCopied
                          ? theme.buttonPrimary
                          : theme.textSecondary,
                        fontSize: scaledSize(10),
                        textTransform: "uppercase",
                        fontWeight: isCopied ? "bold" : "normal",
                      }}
                    >
                      {isCopied ? "Copied!" : "Tap to Copy"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

            <Text
              className="mb-2 ml-1 font-bold uppercase"
              style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
            >
              Enter 6-Digit Code
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.buttonNeutral,
                color: theme.text,
                borderRadius: 12,
                padding: 12,
                textAlign: "center",
                fontSize: scaledSize(18),
                letterSpacing: 4,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                marginBottom: 20,
              }}
              placeholder="000 000"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              value={mfaCode}
              onChangeText={setMfaCode}
            />
            <TouchableOpacity
              onPress={handleVerifyMfa}
              disabled={isMfaLoading}
              style={{
                backgroundColor: theme.buttonPrimary,
                borderRadius: 12,
                height: 48,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isMfaLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: scaledSize(14),
                  }}
                >
                  {pendingAction === "DISABLE_2FA"
                    ? "Verify & Disable"
                    : pendingAction === "SAVE_PASSWORD"
                      ? "Verify & Update"
                      : "Verify & Enable"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancelMfaSetup}
              disabled={isMfaLoading}
              style={{ marginTop: 16, alignItems: "center" }}
            >
              <Text
                style={{ color: theme.textSecondary, fontSize: scaledSize(14) }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ALERT MODAL */}
      <CustomModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        msg={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        theme={theme}
        isDarkMode={isDarkMode}
        scaledSize={scaledSize}
      />
    </SafeAreaView>
  );
}

function InputGroup({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  maxLength,
  keyboardType,
  disabled,
  theme,
  scaledSize,
  placeholderTextColor,
  isPassword,
  showPassword,
  togglePassword,
}) {
  return (
    <View className="mb-3">
      <Text
        className="font-bold uppercase mb-1.5 ml-1"
        style={{
          color: error ? theme.buttonDangerText : theme.textSecondary,
          fontSize: scaledSize(10),
        }}
      >
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-xl px-4 h-14 border"
        style={{
          backgroundColor: theme.buttonNeutral,
          borderColor: error ? theme.buttonDangerText : theme.cardBorder,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <MaterialIcons
          name={icon}
          size={scaledSize(20)}
          color={theme.textSecondary}
          style={{ marginRight: 10 }}
        />
        <TextInput
          className="flex-1 h-full"
          style={{ color: theme.text, fontSize: scaledSize(14) }}
          placeholder={placeholder}
          placeholderTextColor={
            placeholderTextColor || `${theme.textSecondary}80`
          }
          secureTextEntry={isPassword && !showPassword}
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
          keyboardType={keyboardType}
          editable={!disabled}
        />
        {isPassword && (
          <TouchableOpacity onPress={togglePassword}>
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={scaledSize(18)}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text
          className="italic mt-1 ml-1"
          style={{ color: theme.buttonDangerText, fontSize: scaledSize(10) }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

function RequirementRow({ met, text, theme }) {
  return (
    <View className="flex-row items-center mb-1">
      <MaterialIcons
        name={met ? "check-circle" : "radio-button-unchecked"}
        size={12}
        color={met ? "#fff" : theme.textSecondary}
        style={{ marginRight: 6 }}
      />
      <Text
        className="text-[10px]"
        style={{ color: met ? theme.buttonPrimary : theme.textSecondary }}
      >
        {text}
      </Text>
    </View>
  );
}

function CustomModal({
  visible,
  type,
  title,
  msg,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  theme,
  isDarkMode,
  scaledSize,
}) {
  let buttonBg = theme.buttonPrimary;
  if (type === "error" || type === "delete") buttonBg = "#ff4444";
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel || onConfirm}
    >
      <View className="flex-1 bg-black/80 justify-center items-center z-50">
        <View
          className="border p-5 rounded-2xl w-72 items-center"
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
        >
          <Text
            className="font-bold mb-2 text-center"
            style={{ color: theme.text, fontSize: scaledSize(18) }}
          >
            {title}
          </Text>
          <Text
            className="text-center mb-6 leading-5"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            {msg}
          </Text>
          <View className="flex-row w-full justify-center gap-2.5">
            {onCancel && (
              <TouchableOpacity
                className="flex-1 border h-10 justify-center items-center rounded-xl"
                style={{ borderColor: theme.textSecondary }}
                onPress={onCancel}
              >
                <Text
                  className="font-bold"
                  style={{ color: theme.text, fontSize: scaledSize(12) }}
                >
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="flex-1 h-10 justify-center items-center rounded-xl overflow-hidden"
              style={{ backgroundColor: buttonBg }}
              onPress={onConfirm}
            >
              <Text
                className="font-bold"
                style={{ color: "#fff", fontSize: scaledSize(12) }}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

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
