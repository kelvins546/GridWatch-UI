import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "../../lib/supabase";

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

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("users")
          .select("full_name, email, unit_location, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          setFullName(data.full_name || "");
          setEmail(data.email || "");
          setUnitNumber(data.unit_location || "");
          setAvatarUrl(data.avatar_url || null);

          setInitialData({
            fullName: data.full_name || "",
            unitNumber: data.unit_location || "",
            avatarUrl: data.avatar_url || null,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
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
      setShowDiscardModal(true);
    } else {
      navigation.goBack();
    }
  };

  const handleDiscardChanges = () => {
    setShowDiscardModal(false);
    navigation.goBack();
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
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let finalAvatarUrl = avatarUrl;

      if (selectedImage) {
        const fileExt = selectedImage.uri.split(".").pop().toLowerCase();
        const mimeType =
          fileExt === "jpg" || fileExt === "jpeg"
            ? "image/jpeg"
            : `image/${fileExt}`;
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, decode(selectedImage.base64), {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        finalAvatarUrl = urlData.publicUrl;
      }

      const { error: profileError } = await supabase
        .from("users")
        .update({
          full_name: fullName,
          unit_location: unitNumber,
          avatar_url: finalAvatarUrl,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (currentPassword && newPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) throw new Error("Current password is incorrect.");

        const { error: updatePwError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updatePwError) throw updatePwError;

        setCurrentPassword("");
        setNewPassword("");
      } else if (
        (currentPassword && !newPassword) ||
        (!currentPassword && newPassword)
      ) {
        throw new Error(
          "Please fill both Current and New Password fields to change it."
        );
      }

      setAvatarUrl(finalAvatarUrl);
      setSelectedImage(null);

      setInitialData({
        fullName: fullName,
        unitNumber: unitNumber,
        avatarUrl: finalAvatarUrl,
      });

      setShowSaveModal(true);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfirm = () => {
    setShowSaveModal(false);
    setTimeout(() => navigation.goBack(), 200);
  };

  const performDeactivate = () => {
    setShowDeactivateModal(false);
    console.log("Account Deactivated");
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

  if (isLoading && !showSaveModal) {
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
              onPress={() => setShowDeactivateModal(true)}
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
        visible={showDiscardModal}
        icon="edit-off"
        iconColor="#ffaa00"
        title="Unsaved Changes"
        msg="You have unsaved changes. Are you sure you want to discard them and leave?"
        onClose={() => setShowDiscardModal(false)}
        theme={theme}
        secondaryAction={{
          text: "Keep Editing",
          onPress: () => setShowDiscardModal(false),
          textColor: theme.text,
        }}
        primaryAction={{
          text: "Discard",
          onPress: handleDiscardChanges,
          solidColor: isDarkMode ? "#333" : "#eee",
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
            className="text-lg font-bold mb-2.5"
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
          <View className="flex-row w-full justify-center">
            {secondaryAction && (
              <TouchableOpacity
                className="flex-1 border mr-2.5 h-10 justify-center items-center rounded-lg"
                style={{ borderColor: theme.textSecondary }}
                onPress={secondaryAction.onPress}
              >
                <Text
                  className="font-bold text-xs"
                  style={{ color: secondaryAction.textColor }}
                >
                  {secondaryAction.text}
                </Text>
              </TouchableOpacity>
            )}
            {primaryAction && (
              <TouchableOpacity
                className="flex-1 rounded-lg h-10 justify-center items-center overflow-hidden"
                style={{
                  backgroundColor: primaryAction.solidColor || "transparent",
                }}
                onPress={primaryAction.onPress}
              >
                {primaryAction.color ? (
                  <LinearGradient
                    colors={primaryAction.color}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="w-full h-full justify-center items-center"
                  >
                    <Text className="text-black font-bold">
                      {primaryAction.text}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View className="w-full h-full justify-center items-center">
                    <Text
                      className={`font-bold ${
                        primaryAction.solidColor === "#eee" ||
                        primaryAction.solidColor === "#333"
                          ? primaryAction.solidColor === "#eee"
                            ? "text-black"
                            : "text-white"
                          : "text-white"
                      }`}
                    >
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
