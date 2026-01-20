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
  Image,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
  Switch,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { supabase } from "../../lib/supabase";
import { decode } from "base64-arraybuffer";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- HELPER: PASSWORD STRENGTH CHECKER ---
const checkPasswordStrength = (str) => {
  const hasLength = str.length >= 8;
  const hasNumber = /\d/.test(str);
  const hasUpper = /[A-Z]/.test(str);
  const hasLower = /[a-z]/.test(str);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(str);
  const isValid = hasLength && hasNumber && hasUpper && hasLower && hasSpecial;
  return { hasLength, hasNumber, hasUpper, hasLower, hasSpecial, isValid };
};

// --- HELPER: PHONE NUMBER FORMATTER (+63 Strict) ---
const formatPhoneNumber = (text) => {
  if (!text) return "+63 ";

  // Remove non-numeric characters
  let cleaned = text.replace(/\D/g, "");

  // If it starts with '63', keep it. If '0', strip it.
  if (cleaned.startsWith("63")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // Limit to 10 digits (9XX XXX XXXX)
  const trimmed = cleaned.slice(0, 10);

  let formatted = "+63";
  if (trimmed.length > 0) formatted += " " + trimmed.substring(0, 3);
  if (trimmed.length > 3) formatted += " " + trimmed.substring(3, 6);
  if (trimmed.length > 6) formatted += " " + trimmed.substring(6, 10);

  return formatted;
};

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();

  const scaledSize = (size) => size * (fontScale || 1);

  // --- STATE MANAGEMENT ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+63 ");

  const [unitNumber, setUnitNumber] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [initialData, setInitialData] = useState({});

  // Password Fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // --- UI TOGGLES ---
  const [isChangePasswordExpanded, setIsChangePasswordExpanded] =
    useState(false);
  const [isAccountControlExpanded, setIsAccountControlExpanded] =
    useState(false);

  // --- 2FA STATE ---
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [mfaModalVisible, setMfaModalVisible] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isMfaLoading, setIsMfaLoading] = useState(false);

  // --- SECURITY GATE STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [hasPasswordSet, setHasPasswordSet] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Verification & Setup
  const [verificationPassword, setVerificationPassword] = useState("");
  const [showVerifyPass, setShowVerifyPass] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [setupPasswordMode, setSetupPasswordMode] = useState(false);
  const [createPassword, setCreatePassword] = useState("");
  const [confirmCreatePassword, setConfirmCreatePassword] = useState("");
  const [showCreatePass, setShowCreatePass] = useState(false);

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

  // --- PASSWORD ANALYSIS ---
  const passAnalysis = checkPasswordStrength(newPassword);
  const isMatch = newPassword === confirmPassword && newPassword.length > 0;
  const createPassAnalysis = checkPasswordStrength(createPassword);
  const isCreateMatch =
    createPassword === confirmCreatePassword && createPassword.length > 0;

  useEffect(() => {
    fetchProfile();
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totpFactor = data.totp.find((f) => f.status === "verified");
      const isEnabled = !!totpFactor;

      setIs2FAEnabled(isEnabled);
      if (totpFactor) setMfaFactorId(totpFactor.id);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({ is_2fa_enabled: isEnabled })
          .eq("id", user.id);
      }
    } catch (e) {
      console.log("MFA Check Error:", e);
    }
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (user) {
        setEmail(user.email);
        const isEmailProvider =
          user.app_metadata.provider === "email" ||
          (user.app_metadata.providers &&
            user.app_metadata.providers.includes("email"));
        const hasMetadataPass = user.user_metadata?.has_password === true;
        const passwordExists = isEmailProvider || hasMetadataPass;

        setHasPasswordSet(passwordExists);
        if (!passwordExists) {
          setSetupPasswordMode(true);
          setIsVerified(false);
        } else {
          setSetupPasswordMode(false);
          setIsVerified(false);
        }

        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        const dbData = profile || {};
        const meta = user.user_metadata || {};
        const googleName = meta.full_name || meta.name || "";
        const googleParts = googleName.split(" ");
        const googleFirst = googleParts[0] || "";
        const googleLast = googleParts.slice(1).join(" ") || "";

        const data = {
          firstName: dbData.first_name || googleFirst || "",
          lastName: dbData.last_name || googleLast || "",
          phoneNumber: dbData.phone_number
            ? formatPhoneNumber(dbData.phone_number)
            : "+63 ",
          unitNumber: "",
          region: dbData.region || "",
          city: dbData.city || "",
          zipCode: dbData.zip_code || "",
          streetAddress: dbData.street_address || "",
          avatarUrl:
            dbData.avatar_url || meta.avatar_url || meta.picture || null,
        };

        setFirstName(data.firstName);
        setLastName(data.lastName);
        setPhoneNumber(data.phoneNumber);
        setUnitNumber(data.unitNumber);
        setRegion(data.region);
        setCity(data.city);
        setZipCode(data.zipCode);
        setStreetAddress(data.streetAddress);
        setAvatarUrl(data.avatarUrl);
        setInitialData(data);
      }
    } catch (error) {
      console.log("Error loading profile:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2FA LOGIC (With Robust Cleanup) ---
  const handleToggle2FA = async () => {
    if (is2FAEnabled) {
      showModal(
        "confirm",
        "Disable 2FA?",
        "Are you sure you want to turn off Two-Factor Authentication? Your account will be less secure.",
        disable2FA,
        null,
        "Disable",
        "Cancel",
      );
    } else {
      startMfaEnrollment();
    }
  };

  // 1. CLEANUP OLD FACTORS ON START
  const cleanupUnverifiedFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data.totp) {
        const unverified = data.totp.filter((f) => f.status === "unverified");
        for (const factor of unverified) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
    } catch (e) {
      console.log("Cleanup warning:", e);
    }
  };

  const startMfaEnrollment = async () => {
    setIsMfaLoading(true);
    try {
      await cleanupUnverifiedFactors(); // Remove any stale attempts first

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error) throw error;

      setMfaFactorId(data.id);
      setMfaSecret(data.totp.secret);
      setMfaCode("");
      setMfaModalVisible(true);
    } catch (error) {
      showModal("error", "Enrollment Failed", error.message);
    } finally {
      setIsMfaLoading(false);
    }
  };

  // 2. CLEANUP ON CANCEL (Explicit Function)
  const handleCancelMfaSetup = async () => {
    if (mfaFactorId) {
      // If we have an ID but didn't verify, delete it immediately
      await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
      setMfaFactorId("");
    }
    setMfaModalVisible(false);
  };

  const verifyAndEnableMfa = async () => {
    if (mfaCode.length !== 6) {
      showModal("error", "Invalid Code", "Please enter the 6-digit code.");
      return;
    }
    setIsMfaLoading(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: mfaCode,
      });

      if (verify.error) throw verify.error;

      setIs2FAEnabled(true);
      setMfaModalVisible(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({ is_2fa_enabled: true })
          .eq("id", user.id);
      }

      showModal(
        "success",
        "2FA Enabled",
        "Two-Factor Authentication is now active on your account.",
      );
    } catch (error) {
      showModal(
        "error",
        "Verification Failed",
        "Invalid code. Please try again.",
      );
    } finally {
      setIsMfaLoading(false);
    }
  };

  const disable2FA = async () => {
    setIsMfaLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: mfaFactorId,
      });
      if (error) throw error;

      setIs2FAEnabled(false);
      setMfaFactorId("");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({ is_2fa_enabled: false })
          .eq("id", user.id);
      }

      showModal("success", "2FA Disabled", "You have turned off 2FA.");
    } catch (error) {
      showModal("error", "Error", error.message);
    } finally {
      setIsMfaLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(mfaSecret);
    showModal("success", "Copied!", "Secret key copied to clipboard.");
  };

  const verifyIdentity = async () => {
    if (!verificationPassword) return;
    setIsVerifying(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: verificationPassword,
    });
    setIsVerifying(false);
    if (error) showModal("error", "Incorrect Password", "Please try again.");
    else setIsVerified(true);
  };

  const handleCreatePassword = async () => {
    if (!createPassword || !confirmCreatePassword) return;
    if (!createPassAnalysis.isValid) {
      showModal(
        "error",
        "Weak Password",
        "Please meet all password requirements.",
      );
      return;
    }
    if (createPassword !== confirmCreatePassword) {
      showModal("error", "Mismatch", "Passwords do not match.");
      return;
    }
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: createPassword,
        data: { has_password: true },
      });
      if (error) throw error;
      setHasPasswordSet(true);
      setSetupPasswordMode(false);
      setIsVerified(true);
      showModal("success", "Password Set", "Your password has been created.");
    } catch (error) {
      showModal("error", "Error", error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const showModal = (
    type,
    title,
    message,
    onConfirm = null,
    onCancel = null,
    confirmText = "Okay",
    cancelText = "Cancel",
  ) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      onConfirm:
        onConfirm ||
        (() => setModalConfig((prev) => ({ ...prev, visible: false }))),
      onCancel:
        onCancel ||
        (() => setModalConfig((prev) => ({ ...prev, visible: false }))),
      confirmText,
      cancelText,
    });
  };

  const hasUnsavedChanges = () => {
    return (
      firstName !== initialData.firstName ||
      lastName !== initialData.lastName ||
      region !== initialData.region ||
      city !== initialData.city ||
      zipCode !== initialData.zipCode ||
      streetAddress !== initialData.streetAddress ||
      newPassword.length > 0 ||
      selectedImage !== null
    );
  };

  const handleBackPress = () => {
    if (isVerified && hasUnsavedChanges()) {
      showModal(
        "confirm",
        "Unsaved Changes",
        "Discard changes?",
        () => navigation.goBack(),
        null,
        "Discard",
        "Keep Editing",
      );
    } else {
      navigation.goBack();
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) setSelectedImage(result.assets[0]);
  };

  const uploadImage = async (userId, imageAsset) => {
    try {
      const fileName = `${userId}/${Date.now()}.jpg`;
      const fileData = decode(imageAsset.base64);
      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, fileData, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      return null;
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      showModal("error", "Missing Info", "First Name is required.");
      return;
    }

    if (newPassword.length > 0) {
      if (!passAnalysis.isValid) {
        showModal(
          "error",
          "Weak Password",
          "Please meet all password requirements.",
        );
        return;
      }
      if (!isMatch) {
        showModal("error", "Mismatch", "Passwords do not match.");
        return;
      }
    }
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      let uploadedAvatarUrl = avatarUrl;
      if (selectedImage) {
        const publicUrl = await uploadImage(user.id, selectedImage);
        if (publicUrl) uploadedAvatarUrl = publicUrl;
      }

      const updates = {
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName || "",
        region: region || "",
        city: city || "",
        zip_code: zipCode || "",
        street_address: streetAddress || "",
        avatar_url: uploadedAvatarUrl,
        role: "resident",
        status: "active",
      };

      const { error: dbError } = await supabase.from("users").upsert(updates);
      if (dbError) throw dbError;

      if (newPassword) {
        const { error: passError } = await supabase.auth.updateUser({
          password: newPassword,
          data: { has_password: true },
        });
        if (passError) throw passError;
      }

      setInitialData({ ...initialData, ...updates, firstName, lastName });
      setNewPassword("");
      setConfirmPassword("");
      setAvatarUrl(uploadedAvatarUrl);
      setSelectedImage(null);
      setIsChangePasswordExpanded(false);
      showModal("success", "Saved", "Profile updated successfully.", null);
    } catch (error) {
      showModal("error", "Save Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeactivate = () => {
    showModal(
      "delete",
      "Sign Out?",
      "This will sign you out of the app.",
      async () => {
        await supabase.auth.signOut();
        setModalConfig((prev) => ({ ...prev, visible: false }));
        navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
      },
      null,
      "Sign Out",
      "Cancel",
    );
  };

  const togglePasswordExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsChangePasswordExpanded(!isChangePasswordExpanded);
  };

  const toggleAccountControlExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAccountControlExpanded(!isAccountControlExpanded);
  };

  const displayImageUri = selectedImage ? selectedImage.uri : avatarUrl;
  const initials = firstName
    ? firstName.charAt(0)
    : email
      ? email.charAt(0)
      : "?";

  if (isLoading && !modalConfig.visible) {
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
          onPress={handleBackPress}
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
          Edit Profile
        </Text>
        {isVerified && (
          <TouchableOpacity
            onPress={handleSave}
            style={{ position: "absolute", right: 24, padding: 4, zIndex: 10 }}
          >
            <Text
              className="font-bold"
              style={{ color: theme.buttonPrimary, fontSize: scaledSize(14) }}
            >
              Save
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!isVerified ? (
        // --- SECURITY GATE ---
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 32,
              paddingBottom: 150,
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
                name={setupPasswordMode ? "lock-clock" : "lock"}
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
              {setupPasswordMode ? "Setup Password" : "Security Verification"}
            </Text>
            <Text
              style={{
                fontSize: scaledSize(14),
                color: theme.textSecondary,
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              {setupPasswordMode
                ? "To secure your account, you must set a password first."
                : "To view or edit details, please enter your password."}
            </Text>

            <View style={{ width: "100%", maxWidth: 320 }}>
              {setupPasswordMode ? (
                <>
                  <InputGroup
                    label="Create Password"
                    icon="lock"
                    placeholder="New password"
                    isPassword
                    showPassword={showCreatePass}
                    togglePassword={() => setShowCreatePass(!showCreatePass)}
                    value={createPassword}
                    onChangeText={setCreatePassword}
                    theme={theme}
                    scaledSize={scaledSize}
                  />
                  <InputGroup
                    label="Confirm Password"
                    icon="lock-outline"
                    placeholder="Confirm new password"
                    isPassword
                    showPassword={showCreatePass}
                    togglePassword={() => setShowCreatePass(!showCreatePass)}
                    value={confirmCreatePassword}
                    onChangeText={setConfirmCreatePassword}
                    theme={theme}
                    scaledSize={scaledSize}
                  />
                  <TouchableOpacity
                    onPress={handleCreatePassword}
                    disabled={isVerifying || !createPassword}
                    style={{
                      backgroundColor: theme.buttonPrimary,
                      borderRadius: 12,
                      height: 48,
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 8,
                      opacity: 0.9,
                    }}
                  >
                    {isVerifying ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: scaledSize(14),
                        }}
                      >
                        Set Password
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
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
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: scaledSize(14),
                        }}
                      >
                        Verify
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        // --- MAIN FORM ---
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 150 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="p-6 pb-10">
              {/* AVATAR */}
              <View className="items-center mb-8">
                <View className="relative w-24 h-24 mb-4">
                  {displayImageUri ? (
                    <Image
                      source={{ uri: displayImageUri }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 50,
                      }}
                    />
                  ) : (
                    <View
                      className="w-full h-full rounded-full justify-center items-center"
                      style={{ backgroundColor: theme.buttonNeutral }}
                    >
                      <Text
                        className="font-bold"
                        style={{
                          fontSize: scaledSize(36),
                          color: theme.textSecondary,
                        }}
                      >
                        {initials}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={pickImage}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full justify-center items-center border-[3px]"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.background,
                    }}
                  >
                    <MaterialIcons
                      name="camera-alt"
                      size={scaledSize(14)}
                      color={theme.text}
                    />
                  </TouchableOpacity>
                </View>
                <View
                  className="px-3 py-1 rounded-xl border"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(0, 255, 153, 0.1)"
                      : "rgba(0, 153, 94, 0.1)",
                    borderColor: isDarkMode
                      ? "rgba(0, 255, 153, 0.2)"
                      : "rgba(0, 153, 94, 0.2)",
                  }}
                >
                  <Text
                    className="font-semibold tracking-wider"
                    style={{
                      color: theme.buttonPrimary,
                      fontSize: scaledSize(10),
                    }}
                  >
                    HOME ADMIN
                  </Text>
                </View>
              </View>

              {/* PERSONAL INFO */}
              <Text
                className="font-bold uppercase tracking-widest mb-3"
                style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
              >
                Personal Information
              </Text>
              <InputGroup
                label="First Name"
                icon="person"
                placeholder="First name"
                value={firstName}
                onChangeText={setFirstName}
                theme={theme}
                scaledSize={scaledSize}
              />
              <InputGroup
                label="Last Name"
                icon="person-outline"
                placeholder="Last name"
                value={lastName}
                onChangeText={setLastName}
                theme={theme}
                scaledSize={scaledSize}
              />
              {/* PHONE (READ-ONLY) */}
              <InputGroup
                label="Phone Number"
                icon="phone"
                placeholder="09XX XXX XXXX"
                value={phoneNumber}
                onChangeText={() => {}}
                keyboardType="phone-pad"
                theme={theme}
                scaledSize={scaledSize}
                disabled
              />
              <InputGroup
                label="Email Address"
                icon="email"
                value={email}
                theme={theme}
                scaledSize={scaledSize}
                disabled
              />

              {/* LOCATION */}
              <Text
                className="font-bold uppercase tracking-widest mb-3 mt-5"
                style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
              >
                Location
              </Text>
              <InputGroup
                label="Unit Number"
                icon="apartment"
                placeholder="Unit no."
                value={unitNumber}
                onChangeText={setUnitNumber}
                theme={theme}
                scaledSize={scaledSize}
              />
              <InputGroup
                label="Region"
                icon="map"
                placeholder="Region"
                value={region}
                onChangeText={setRegion}
                theme={theme}
                scaledSize={scaledSize}
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <InputGroup
                    label="City"
                    icon="location-city"
                    placeholder="City"
                    value={city}
                    onChangeText={setCity}
                    theme={theme}
                    scaledSize={scaledSize}
                  />
                </View>
                <View className="flex-[0.7]">
                  <InputGroup
                    label="Zip"
                    icon="markunread-mailbox"
                    placeholder="0000"
                    value={zipCode}
                    onChangeText={(t) => /^\d*$/.test(t) && setZipCode(t)}
                    maxLength={4}
                    keyboardType="number-pad"
                    theme={theme}
                    scaledSize={scaledSize}
                  />
                </View>
              </View>
              <InputGroup
                label="Address"
                icon="home"
                placeholder="Full address"
                value={streetAddress}
                onChangeText={setStreetAddress}
                theme={theme}
                scaledSize={scaledSize}
              />

              {/* SECURITY */}
              <Text
                className="font-bold uppercase tracking-widest mb-3 mt-5"
                style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
              >
                Security & Account
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
                      className="p-4 rounded-xl border mb-2"
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
                      <RequirementRow
                        met={isMatch}
                        text="Match"
                        theme={theme}
                      />
                    </View>
                  )}
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
                    This will disable your access and disconnect all linked
                    hubs.
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
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* MODAL */}
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

      {/* 2FA SETUP MODAL - WITH "CLICK OUTSIDE" FIX */}
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
          {/* INVISIBLE BACKDROP TO CATCH CLICKS */}
          <TouchableOpacity
            style={[
              { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            ]}
            onPress={() => !isMfaLoading && handleCancelMfaSetup()}
            activeOpacity={1}
          />

          {/* CONTENT */}
          <View
            style={{
              width: "100%",
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
              Setup 2FA
            </Text>
            <Text
              className="text-center mb-6"
              style={{ color: theme.textSecondary, fontSize: scaledSize(13) }}
            >
              Copy this secret key into your Authenticator App
            </Text>
            <TouchableOpacity
              onPress={copyToClipboard}
              className="p-4 rounded-xl mb-6 items-center border border-dashed"
              style={{
                borderColor: theme.textSecondary,
                backgroundColor: theme.buttonNeutral,
              }}
            >
              <Text
                className="font-mono font-bold text-center mb-2"
                style={{ color: theme.buttonPrimary, fontSize: scaledSize(16) }}
              >
                {mfaSecret}
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(10),
                  textTransform: "uppercase",
                }}
              >
                Tap to Copy
              </Text>
            </TouchableOpacity>
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
              onPress={verifyAndEnableMfa}
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
                  Verify & Enable
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
    </SafeAreaView>
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

function InputGroup({
  label,
  icon,
  placeholder,
  isPassword,
  showPassword,
  togglePassword,
  value,
  onChangeText,
  error,
  maxLength,
  keyboardType,
  disabled,
  theme,
  scaledSize,
  placeholderTextColor,
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
        color={met ? theme.buttonPrimary : theme.textSecondary}
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
