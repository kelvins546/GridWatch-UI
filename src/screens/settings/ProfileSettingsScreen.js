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
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";

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

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();

  const scaledSize = (size) => size * (fontScale || 1);

  // --- STATE MANAGEMENT ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

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

  // --- SECURITY GATE STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [hasPasswordSet, setHasPasswordSet] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Controls visibility
  const [verificationPassword, setVerificationPassword] = useState("");
  const [showVerifyPass, setShowVerifyPass] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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

  useEffect(() => {
    fetchProfile();
  }, []);

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

        // Check if user is Email/Password based
        const isEmailProvider =
          user.app_metadata.provider === "email" ||
          (user.app_metadata.providers &&
            user.app_metadata.providers.includes("email"));

        setHasPasswordSet(isEmailProvider);
        // If they have a password, they are NOT verified initially.
        // If they logged in via Google/Apple (no password), they are auto-verified.
        setIsVerified(!isEmailProvider);

        const { data: profile, error: dbError } = await supabase
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

  const verifyIdentity = async () => {
    if (!verificationPassword) return;
    setIsVerifying(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: verificationPassword,
    });

    setIsVerifying(false);

    if (error) {
      showModal("error", "Incorrect Password", "Please try again.");
    } else {
      setIsVerified(true);
    }
  };

  const showModal = (
    type,
    title,
    message,
    onConfirm = null,
    onCancel = null,
    confirmText = "Okay",
    cancelText = "Cancel"
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
        "You have unsaved changes. Discard them?",
        () => navigation.goBack(),
        null,
        "Discard",
        "Keep Editing"
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
          "Please meet all password requirements."
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

      const updates = {
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName || "",
        region: region || "",
        city: city || "",
        zip_code: zipCode || "",
        street_address: streetAddress || "",
        avatar_url: selectedImage ? selectedImage.uri : avatarUrl,
        role: "resident",
        status: "active",
        monthly_budget: 2000.0,
      };

      const { error: dbError } = await supabase.from("users").upsert(updates);

      if (dbError) throw dbError;

      if (newPassword) {
        const { error: passError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (passError) throw passError;
      }

      setInitialData({ ...initialData, ...updates, firstName, lastName });
      setNewPassword("");
      setConfirmPassword("");
      setSelectedImage(null);

      showModal("success", "Saved", "Profile updated successfully.", () => {});
    } catch (error) {
      showModal("error", "Save Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const performDeactivate = async () => {
    try {
      await supabase.auth.signOut();
      setModalConfig((prev) => ({ ...prev, visible: false }));
      navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
    } catch (error) {
      console.log(error);
    }
  };

  const confirmDeactivate = () => {
    showModal(
      "delete",
      "Sign Out?",
      "This will sign you out of the app.",
      performDeactivate,
      null,
      "Sign Out",
      "Cancel"
    );
  };

  const initials = firstName
    ? firstName.charAt(0).toUpperCase() +
      (lastName ? lastName.charAt(0).toUpperCase() : "")
    : email
    ? email.charAt(0).toUpperCase()
    : "?";

  const displayImageUri = selectedImage ? selectedImage.uri : avatarUrl;
  const dangerColor = isDarkMode ? "#ff4444" : "#c62828";
  const dangerBg = isDarkMode
    ? "rgba(255, 68, 68, 0.05)"
    : "rgba(198, 40, 40, 0.05)";
  const dangerBorder = isDarkMode
    ? "rgba(255, 68, 68, 0.3)"
    : "rgba(198, 40, 40, 0.2)";

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
        <Text
          style={{
            marginTop: 20,
            color: "#B0B0B0",
            fontSize: 12,
            textAlign: "center",
            width: "100%",
            fontFamily: theme.fontRegular,
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

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

      {/* --- SECURITY GATE VIEW (FIXED KEYBOARD OFFSET) --- */}
      {!isVerified ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          // IMPORTANT: This offset accounts for Header (~60) + Status Bar (~20-40)
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 32,
              paddingBottom: 100, // Extra padding at bottom
            }}
            keyboardShouldPersistTaps="handled"
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
                textAlign: "center",
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
                lineHeight: 22,
              }}
            >
              To view or edit your personal details, please enter your current
              password.
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
                  opacity: isVerifying || !verificationPassword ? 0.7 : 1,
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
                    Verify & Access
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        /* --- MAIN PROFILE CONTENT (FIXED KEYBOARD OFFSET) --- */
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
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

              {/* FORM FIELDS */}
              <Text
                className="font-bold uppercase tracking-widest mb-3"
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(10),
                }}
              >
                Personal Information
              </Text>
              <InputGroup
                label="First Name"
                icon="person"
                placeholder="Enter first name"
                value={firstName}
                onChangeText={setFirstName}
                theme={theme}
                scaledSize={scaledSize}
              />
              <InputGroup
                label="Last Name (Optional)"
                icon="person-outline"
                placeholder="Enter last name"
                value={lastName}
                onChangeText={setLastName}
                theme={theme}
                scaledSize={scaledSize}
              />
              <InputGroup
                label="Email Address"
                icon="email"
                placeholder="Email address"
                value={email}
                theme={theme}
                scaledSize={scaledSize}
                disabled
              />

              <Text
                className="font-bold uppercase tracking-widest mb-3 mt-5"
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(10),
                }}
              >
                Location Details
              </Text>
              <InputGroup
                label="Unit Number"
                icon="apartment"
                placeholder="Enter unit number"
                value={unitNumber}
                onChangeText={setUnitNumber}
                theme={theme}
                scaledSize={scaledSize}
              />
              <InputGroup
                label="Region / Province"
                icon="map"
                placeholder="Enter region"
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
                    placeholder="Enter city"
                    value={city}
                    onChangeText={setCity}
                    theme={theme}
                    scaledSize={scaledSize}
                  />
                </View>
                <View className="flex-[0.7]">
                  <InputGroup
                    label="Zip Code"
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
                label="Full Address"
                icon="home"
                placeholder="Enter full address"
                value={streetAddress}
                onChangeText={setStreetAddress}
                theme={theme}
                scaledSize={scaledSize}
              />

              {/* SECURITY SECTION */}
              <Text
                className="font-bold uppercase tracking-widest mb-3 mt-5"
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(10),
                }}
              >
                Security
              </Text>

              <InputGroup
                label="Set a Password"
                icon="lock"
                placeholder="Create new password"
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
                placeholder="Confirm new password"
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
                  className="mb-5 p-4 rounded-xl border"
                  style={{
                    backgroundColor: theme.buttonNeutral,
                    borderColor:
                      !passAnalysis.isValid ||
                      (confirmPassword.length > 0 && !isMatch)
                        ? theme.buttonDangerText
                        : theme.cardBorder,
                  }}
                >
                  <Text
                    className="text-[10px] font-bold uppercase mb-2"
                    style={{ color: theme.textSecondary }}
                  >
                    Password Strength
                  </Text>
                  <RequirementRow
                    met={passAnalysis.hasLength}
                    text="8+ characters"
                    theme={theme}
                  />
                  <RequirementRow
                    met={passAnalysis.hasNumber}
                    text="At least 1 number"
                    theme={theme}
                  />
                  <RequirementRow
                    met={passAnalysis.hasUpper}
                    text="Uppercase letter"
                    theme={theme}
                  />
                  <RequirementRow
                    met={passAnalysis.hasLower}
                    text="Lowercase letter"
                    theme={theme}
                  />
                  <RequirementRow
                    met={passAnalysis.hasSpecial}
                    text="Special char (!@#$)"
                    theme={theme}
                  />
                  <View
                    className="h-[1px] my-2"
                    style={{ backgroundColor: theme.cardBorder }}
                  />
                  <RequirementRow
                    met={isMatch}
                    text="Passwords match"
                    theme={theme}
                  />
                </View>
              )}

              {/* DEACTIVATE */}
              <View
                className="border rounded-2xl p-5 mt-8"
                style={{
                  backgroundColor: dangerBg,
                  borderColor: dangerBorder,
                }}
              >
                <View className="flex-row items-center gap-2 mb-1.5">
                  <MaterialIcons
                    name="warning"
                    size={scaledSize(18)}
                    color={dangerColor}
                  />
                  <Text
                    className="font-bold"
                    style={{ color: dangerColor, fontSize: scaledSize(14) }}
                  >
                    Deactivate Account
                  </Text>
                </View>
                <Text
                  className="leading-5 mb-4"
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  This will disable your access and disconnect all linked hubs.
                </Text>
                <TouchableOpacity
                  className="w-full p-3 border rounded-xl items-center"
                  style={{ borderColor: dangerColor }}
                  onPress={confirmDeactivate}
                >
                  <Text
                    className="font-semibold"
                    style={{ color: dangerColor, fontSize: scaledSize(12) }}
                  >
                    Deactivate Account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

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

// ... InputGroup, RequirementRow, CustomModal helper functions ...
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
          placeholderTextColor={theme.textSecondary}
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
          style={{
            color: theme.buttonDangerText,
            fontSize: scaledSize(10),
          }}
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
  let icon = "check-circle",
    iconColor = theme.buttonPrimary,
    buttonBg = theme.buttonPrimary;
  if (type === "error") {
    icon = "error-outline";
    iconColor = "#ff4444";
    buttonBg = "#ff4444";
  } else if (type === "confirm" || type === "delete") {
    icon = type === "delete" ? "report-problem" : "help-outline";
    iconColor = type === "delete" ? "#ff4444" : "#ffaa00";
    buttonBg = type === "delete" ? "#ff4444" : theme.buttonPrimary;
  }

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel || onConfirm}
    >
      <View className="flex-1 bg-black/80 justify-center items-center z-50">
        <View
          className="border p-6 rounded-2xl w-[75%] max-w-[280px] items-center"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
        >
          <MaterialIcons
            name={icon}
            size={scaledSize(48)}
            color={iconColor}
            style={{ marginBottom: 15 }}
          />
          <Text
            className="font-bold mb-2.5 text-center"
            style={{ color: theme.text, fontSize: scaledSize(18) }}
          >
            {title}
          </Text>
          <Text
            className="text-center mb-6 leading-5"
            style={{
              color: theme.textSecondary,
              fontSize: scaledSize(13),
            }}
          >
            {msg}
          </Text>
          <View className="flex-row w-full justify-center gap-2.5">
            {onCancel && (
              <TouchableOpacity
                className="flex-1 border h-10 justify-center items-center rounded-lg"
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
              className="flex-1 rounded-lg h-10 justify-center items-center"
              style={{ backgroundColor: buttonBg }}
              onPress={onConfirm}
            >
              <Text
                className="font-bold"
                style={{
                  color: isDarkMode ? "#000" : "#fff",
                  fontSize: scaledSize(12),
                }}
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
