import React, { useState } from "react";
import {
  View,
  Text,
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
          onPress={() => navigation.goBack()}
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
              <LinearGradient
                colors={
                  isDarkMode ? ["#0055ff", "#00ff99"] : ["#0055ff", "#00995e"]
                }
                className="w-full h-full rounded-full justify-center items-center"
              >
                <Text className="text-4xl font-bold text-gray-900">NA</Text>
              </LinearGradient>

              <TouchableOpacity
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
            className="text-xs font-bold uppercase tracking-widest mb-3 mt-5"
            style={{ color: theme.textSecondary }}
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
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
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
                    <Text className="text-white font-bold">
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
