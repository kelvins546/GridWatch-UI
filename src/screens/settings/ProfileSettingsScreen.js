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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();

  // Helper for font scaling
  const scaledSize = (size) => size * (fontScale || 1);

  // --- STATE MANAGEMENT ---
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Location Fields (Added from Signup)
  const [unitNumber, setUnitNumber] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [initialData, setInitialData] = useState({});

  // Password Fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);

    setTimeout(() => {
      // Mock Data (Simulating DB fetch)
      const demoData = {
        full_name: "Kelvin Manalad",
        email: "kelvin.manalad@example.com",
        unit_number: "Unit 402",
        region: "Metro Manila",
        city: "Caloocan City",
        zip_code: "1400",
        street_address: "#173 Rainbow Village, Brgy 173",
        avatar_url: null,
      };

      setFullName(demoData.full_name);
      setEmail(demoData.email);
      setUnitNumber(demoData.unit_number);
      setRegion(demoData.region);
      setCity(demoData.city);
      setZipCode(demoData.zip_code);
      setStreetAddress(demoData.street_address);
      setAvatarUrl(demoData.avatar_url);

      // Save initial state to check for changes later
      setInitialData({
        fullName: demoData.full_name,
        unitNumber: demoData.unit_number,
        region: demoData.region,
        city: demoData.city,
        zipCode: demoData.zip_code,
        streetAddress: demoData.street_address,
        avatarUrl: demoData.avatar_url,
      });
      setIsLoading(false);
    }, 500);
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
    const nameChanged = fullName !== initialData.fullName;
    const unitChanged = unitNumber !== initialData.unitNumber;
    const regionChanged = region !== initialData.region;
    const cityChanged = city !== initialData.city;
    const zipChanged = zipCode !== initialData.zipCode;
    const streetChanged = streetAddress !== initialData.streetAddress;
    const passwordTyped = currentPassword.length > 0 || newPassword.length > 0;
    const imageChanged = selectedImage !== null;

    return (
      nameChanged ||
      unitChanged ||
      regionChanged ||
      cityChanged ||
      zipChanged ||
      streetChanged ||
      passwordTyped ||
      imageChanged
    );
  };

  const handleBackPress = () => {
    if (hasUnsavedChanges()) {
      showModal(
        "confirm",
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to discard them?",
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

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim() || !city.trim() || !streetAddress.trim()) {
      showModal(
        "error",
        "Missing Information",
        "Name, City, and Address fields cannot be empty."
      );
      return;
    }

    if (
      (currentPassword && !newPassword) ||
      (!currentPassword && newPassword)
    ) {
      showModal(
        "error",
        "Password Error",
        "Please fill both Current and New Password fields to change it."
      );
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Update Initial Data (Simulate Save)
      setInitialData({
        fullName,
        unitNumber,
        region,
        city,
        zipCode,
        streetAddress,
        avatarUrl: selectedImage ? selectedImage.uri : avatarUrl,
      });
      setCurrentPassword("");
      setNewPassword("");
      setSelectedImage(null);
      setIsLoading(false);

      showModal(
        "success",
        "Profile Updated",
        "Your profile has been updated successfully.",
        () => navigation.goBack()
      );
    }, 1500);
  };

  const performDeactivate = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
    navigation.reset({
      index: 0,
      routes: [{ name: "Landing" }],
    });
  };

  const confirmDeactivate = () => {
    showModal(
      "delete",
      "Deactivate Account?",
      "This will disable your access and disconnect all linked hubs. This action cannot be undone.",
      performDeactivate,
      null,
      "Yes, Deactivate",
      "Cancel"
    );
  };

  const initials = fullName ? fullName.substring(0, 2).toUpperCase() : "US";
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
        <ActivityIndicator size="large" color={theme.buttonPrimary} />
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

      {/* HEADER */}
      <View
        className="flex-row items-center justify-between px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity
          className="flex-row items-center gap-1.5"
          onPress={handleBackPress}
        >
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(18)}
            color={theme.textSecondary}
          />
          <Text
            className="font-medium"
            style={{ color: theme.textSecondary, fontSize: scaledSize(14) }}
          >
            Back
          </Text>
        </TouchableOpacity>
        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(16) }}
        >
          Edit Profile
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text
            className="font-semibold"
            style={{ color: theme.buttonPrimary, fontSize: scaledSize(14) }}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6 pb-10">
          {/* PROFILE IMAGE SECTION (No Gradient) */}
          <View className="items-center mb-8">
            <View className="relative w-24 h-24 mb-4">
              {displayImageUri ? (
                <Image
                  source={{ uri: displayImageUri }}
                  style={{ width: "100%", height: "100%", borderRadius: 50 }}
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
                style={{ color: theme.buttonPrimary, fontSize: scaledSize(10) }}
              >
                HOME ADMIN
              </Text>
            </View>
          </View>

          {/* PERSONAL INFORMATION */}
          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
          >
            Personal Information
          </Text>
          <InputGroup
            label="Full Name"
            icon="person"
            placeholder="Enter your name"
            value={fullName}
            onChangeText={setFullName}
            theme={theme}
            scaledSize={scaledSize}
          />
          <InputGroup
            label="Email Address"
            icon="email"
            placeholder="email@example.com"
            value={email}
            theme={theme}
            scaledSize={scaledSize}
            disabled // Email is typically not editable
          />

          {/* LOCATION DETAILS (Added from Signup) */}
          <Text
            className="font-bold uppercase tracking-widest mb-3 mt-5"
            style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
          >
            Location Details
          </Text>
          <InputGroup
            label="Unit Number"
            icon="apartment"
            placeholder="Unit 101"
            value={unitNumber}
            onChangeText={setUnitNumber}
            theme={theme}
            scaledSize={scaledSize}
          />
          <InputGroup
            label="Region / Province"
            icon="map"
            placeholder="Metro Manila"
            value={region}
            onChangeText={setRegion}
            theme={theme}
            scaledSize={scaledSize}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <InputGroup
                label="City / Municipality"
                icon="location-city"
                placeholder="Caloocan"
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
                placeholder="1400"
                value={zipCode}
                onChangeText={(text) => {
                  // Only allow numbers
                  if (/^\d*$/.test(text)) setZipCode(text);
                }}
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
            placeholder="Street, Barangay, Village"
            value={streetAddress}
            onChangeText={setStreetAddress}
            theme={theme}
            scaledSize={scaledSize}
          />

          {/* SECURITY SECTION */}
          <Text
            className="font-bold uppercase tracking-widest mb-3 mt-5"
            style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
          >
            Security
          </Text>

          <InputGroup
            label="Current Password"
            icon="lock"
            placeholder="Required to change password"
            isPassword
            showPassword={showCurrentPass}
            togglePassword={() => setShowCurrentPass(!showCurrentPass)}
            theme={theme}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            scaledSize={scaledSize}
          />
          <InputGroup
            label="New Password"
            icon="lock-outline"
            placeholder="Enter new password"
            isPassword
            showPassword={showNewPass}
            togglePassword={() => setShowNewPass(!showNewPass)}
            theme={theme}
            value={newPassword}
            onChangeText={setNewPassword}
            scaledSize={scaledSize}
          />

          {/* DEACTIVATE ACCOUNT SECTION */}
          <View
            className="border rounded-2xl p-5 mt-8"
            style={{ backgroundColor: dangerBg, borderColor: dangerBorder }}
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
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              This will disable your access and disconnect all linked hubs. This
              action cannot be undone.
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

      {/* CUSTOM MODAL */}
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

// REUSABLE INPUT GROUP (Adapted from Signup, added scaling)
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

// CUSTOM MODAL (Removed Gradients)
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
  let icon = "check-circle";
  let iconColor = theme.buttonPrimary;
  let buttonBg = theme.buttonPrimary;

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
            style={{ color: theme.textSecondary, fontSize: scaledSize(13) }}
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
