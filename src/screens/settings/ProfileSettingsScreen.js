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
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);

  const [initialData, setInitialData] = useState({
    fullName: "",
    unitNumber: "",
    avatarUrl: null,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

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
      const demoData = {
        full_name: "Kelvin Manalad",
        email: "kelvin.manalad@example.com",
        unit_location: "Unit 402, Tower 1",
        avatar_url: null,
      };

      setFullName(demoData.full_name);
      setEmail(demoData.email);
      setUnitNumber(demoData.unit_location);
      setAvatarUrl(demoData.avatar_url);

      setInitialData({
        fullName: demoData.full_name,
        unitNumber: demoData.unit_location,
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
    const passwordTyped = currentPassword.length > 0 || newPassword.length > 0;
    const imageChanged = selectedImage !== null;

    return nameChanged || unitChanged || passwordTyped || imageChanged;
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
    if (!fullName.trim() || !unitNumber.trim()) {
      showModal(
        "error",
        "Missing Information",
        "Full Name and Unit Number cannot be empty."
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
      setInitialData({
        fullName,
        unitNumber,
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
    console.log("Account Deactivated");
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
  const dangerColor = isDarkMode ? "#ff4444" : "#c62828";
  const dangerBg = isDarkMode
    ? "rgba(255, 68, 68, 0.05)"
    : "rgba(198, 40, 40, 0.05)";
  const dangerBorder = isDarkMode
    ? "rgba(255, 68, 68, 0.3)"
    : "rgba(198, 40, 40, 0.2)";

  const displayImageUri = selectedImage ? selectedImage.uri : avatarUrl;

  if (isLoading && !modalConfig.visible) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
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
            size={18}
            color={theme.textSecondary}
          />
          <Text
            className="text-sm font-medium"
            style={{ color: theme.textSecondary }}
          >
            Back
          </Text>
        </TouchableOpacity>
        <Text className="text-base font-bold" style={{ color: theme.text }}>
          Edit Profile
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text
            className="text-sm font-semibold"
            style={{ color: theme.primary }}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6 pb-10">
          <View className="items-center mb-8">
            <View className="relative w-24 h-24 mb-4">
              {displayImageUri ? (
                <Image
                  source={{ uri: displayImageUri }}
                  style={{ width: "100%", height: "100%", borderRadius: 50 }}
                />
              ) : (
                <LinearGradient
                  colors={
                    isDarkMode ? ["#0055ff", "#00ff99"] : ["#0055ff", "#00995e"]
                  }
                  className="w-full h-full rounded-full justify-center items-center"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text className="text-4xl font-bold text-gray-900">
                    {initials}
                  </Text>
                </LinearGradient>
              )}

              <TouchableOpacity
                onPress={pickImage}
                className="absolute bottom-0 right-0 bg-white w-8 h-8 rounded-full justify-center items-center border-[3px]"
                style={{ borderColor: theme.background }}
              >
                <MaterialIcons name="camera-alt" size={16} color="#000" />
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
                className="text-xs font-semibold tracking-wider"
                style={{ color: theme.primary }}
              >
                HOME ADMIN
              </Text>
            </View>
          </View>

          <Text
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary }}
          >
            Personal Information
          </Text>
          <InputGroup
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            theme={theme}
          />
          <InputGroup
            label="Email Address"
            value={email}
            theme={theme}
            disabled
          />
          <InputGroup
            label="Unit Number"
            value={unitNumber}
            onChangeText={setUnitNumber}
            theme={theme}
          />

          <Text
            className="text-xs font-bold uppercase tracking-widest mb-3 mt-5"
            style={{ color: theme.textSecondary }}
          >
            Security
          </Text>

          <InputGroup
            label="Current Password"
            placeholder="Required to change password"
            isPassword
            theme={theme}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <InputGroup
            label="New Password"
            placeholder="Enter new password"
            isPassword
            theme={theme}
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <View
            className="border rounded-2xl p-5 mt-8"
            style={{ backgroundColor: dangerBg, borderColor: dangerBorder }}
          >
            <View className="flex-row items-center gap-2 mb-1.5">
              <MaterialIcons name="warning" size={18} color={dangerColor} />
              <Text
                className="text-sm font-bold"
                style={{ color: dangerColor }}
              >
                Deactivate Account
              </Text>
            </View>
            <Text
              className="text-xs leading-5 mb-4"
              style={{ color: theme.textSecondary }}
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
                className="font-semibold text-xs"
                style={{ color: dangerColor }}
              >
                Deactivate Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {}
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
      />
    </SafeAreaView>
  );
}

function InputGroup({
  label,
  value,
  onChangeText,
  placeholder,
  isPassword,
  disabled,
  theme,
}) {
  return (
    <View className="mb-4">
      <Text
        className="text-xs mb-1.5 font-medium"
        style={{ color: theme.textSecondary }}
      >
        {label}
      </Text>
      <TextInput
        className="w-full border rounded-xl p-3.5 text-sm"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          color: theme.text,
          opacity: disabled ? 0.5 : 1,
        }}
        value={value}
        onChangeText={onChangeText}
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
  type,
  title,
  msg,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  theme,
  isDarkMode,
}) {
  let icon = "check-circle";
  let iconColor = theme.primary;
  let buttonColor = ["#0055ff", isDarkMode ? "#00ff99" : "#00995e"];

  if (type === "error") {
    icon = "error-outline";
    iconColor = "#ff4444";
    buttonColor = ["#ff4444", "#ff8800"];
  } else if (type === "confirm" || type === "delete") {
    icon = type === "delete" ? "report-problem" : "help-outline";
    iconColor = type === "delete" ? "#ff4444" : "#ffaa00";
    buttonColor =
      type === "delete" ? ["#ff4444", "#cc0000"] : ["#0055ff", "#00ff99"];
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
          className="border p-6 rounded-2xl w-72 items-center"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
        >
          <MaterialIcons
            name={icon}
            size={48}
            color={iconColor}
            style={{ marginBottom: 15 }}
          />
          <Text
            className="text-lg font-bold mb-2.5 text-center"
            style={{ color: theme.text }}
          >
            {title}
          </Text>
          <Text
            className="text-xs text-center mb-6 leading-5"
            style={{ color: theme.textSecondary }}
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
                  className="font-bold text-xs"
                  style={{ color: theme.text }}
                >
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="flex-1 rounded-lg h-10 justify-center items-center overflow-hidden"
              onPress={onConfirm}
            >
              <LinearGradient
                colors={buttonColor}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full h-full justify-center items-center"
              >
                <Text className="text-black font-bold text-xs">
                  {confirmText}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
