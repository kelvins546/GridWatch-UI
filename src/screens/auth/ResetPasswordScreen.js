import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode, fontScale } = useTheme();

  const scaledSize = (size) => size * (fontScale || 1);
  const userEmail = route.params?.email || "your account";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: "success",
    title: "",
    message: "",
    onPress: null,
  });

  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<> ]/.test(password);
  const isMatch = password === confirmPassword && password.length > 0;

  const showModal = (type, title, message, onPress = null) => {
    setModalConfig({ type, title, message, onPress });
    setModalVisible(true);
  };

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      showModal("error", "Missing Fields", "Please fill in both fields.");
      return;
    }

    if (!hasLength || !hasNumber || !hasUpper || !hasSpecial) {
      showModal("error", "Weak Password", "Please follow all requirements.");
      return;
    }

    if (!isMatch) {
      showModal("error", "Mismatch", "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showModal(
        "success",
        "Success!",
        "Password updated. Please log in again.",
        () => navigation.reset({ index: 0, routes: [{ name: "Login" }] })
      );
    }, 1500);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {isLoading && (
        <View className="absolute z-50 w-full h-full bg-black/70 justify-center items-center">
          <ActivityIndicator size="large" color={theme.buttonPrimary} />
          <Text className="mt-4 font-bold" style={{ color: theme.text }}>
            Updating...
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="p-[30px]">
            {/* Header */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mb-6 flex-row items-center"
            >
              <MaterialIcons
                name="arrow-back"
                size={scaledSize(20)}
                color={theme.textSecondary}
              />
              <Text
                className="ml-2 font-medium"
                style={{ color: theme.textSecondary, fontSize: scaledSize(14) }}
              >
                Back
              </Text>
            </TouchableOpacity>

            <View className="items-center mb-8">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${theme.buttonPrimary}15` }}
              >
                <MaterialIcons
                  name="security"
                  size={40}
                  color={theme.buttonPrimary}
                />
              </View>
              <Text
                className="font-bold text-2xl mb-2"
                style={{ color: theme.text }}
              >
                New Password
              </Text>
              <Text
                className="text-center text-sm"
                style={{ color: theme.textSecondary }}
              >
                Create a strong password for{" "}
                <Text style={{ color: theme.text, fontWeight: "bold" }}>
                  {userEmail}
                </Text>
              </Text>
            </View>

            {/* Form */}
            <View className="mb-6">
              <Text
                className="text-[11px] font-bold uppercase mb-2"
                style={{ color: theme.textSecondary }}
              >
                New Password
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-2.5 border mb-5"
                style={{
                  backgroundColor: theme.buttonNeutral,
                  borderColor: theme.cardBorder,
                }}
              >
                <MaterialIcons
                  name="lock"
                  size={20}
                  color={theme.textSecondary}
                  className="mr-3"
                />
                <TextInput
                  className="flex-1 text-sm"
                  style={{ color: theme.text, marginLeft: 10 }}
                  placeholder="New Password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <MaterialIcons
                    name={showPass ? "visibility" : "visibility-off"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text
                className="text-[11px] font-bold uppercase mb-2"
                style={{ color: theme.textSecondary }}
              >
                Confirm Password
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-2.5 border"
                style={{
                  backgroundColor: theme.buttonNeutral,
                  borderColor: theme.cardBorder,
                }}
              >
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color={theme.textSecondary}
                  className="mr-3"
                />
                <TextInput
                  className="flex-1 text-sm"
                  style={{ color: theme.text, marginLeft: 10 }}
                  placeholder="Confirm Password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <MaterialIcons
                    name={showConfirm ? "visibility" : "visibility-off"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Requirements Box */}
            {password.length > 0 && (
              <View
                className="p-4 rounded-xl border mb-6"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                }}
              >
                <Text
                  className="text-[10px] font-bold uppercase mb-3"
                  style={{ color: theme.textSecondary }}
                >
                  Password Requirements
                </Text>
                <RequirementRow
                  met={hasLength}
                  text="At least 8 characters"
                  theme={theme}
                />
                <RequirementRow
                  met={hasUpper}
                  text="At least 1 uppercase letter"
                  theme={theme}
                />
                <RequirementRow
                  met={hasNumber}
                  text="Contains at least 1 number"
                  theme={theme}
                />
                <RequirementRow
                  met={hasSpecial}
                  text="At least 1 special character"
                  theme={theme}
                />
                <RequirementRow
                  met={isMatch}
                  text="Passwords match"
                  theme={theme}
                />
              </View>
            )}

            <TouchableOpacity
              onPress={handleUpdatePassword}
              activeOpacity={0.8}
            >
              <View
                className="p-4 rounded-2xl items-center shadow-sm"
                style={{ backgroundColor: theme.buttonPrimary }}
              >
                <Text
                  className="font-bold text-[15px]"
                  style={{ color: theme.buttonPrimaryText }}
                >
                  RESET PASSWORD
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* COMPACT TIGHT MODAL */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View className="flex-1 justify-center items-center bg-black/80">
          <View
            className="w-[70%] max-w-[260px] border p-5 rounded-2xl items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            {/* NO ICONS AS PER SETTINGS */}
            <Text
              className="text-lg font-bold mb-1 text-center"
              style={{ color: theme.text }}
            >
              {modalConfig.title}
            </Text>
            <Text
              className="text-xs text-center mb-5 leading-5"
              style={{ color: theme.textSecondary }}
            >
              {modalConfig.message}
            </Text>

            <TouchableOpacity
              style={{ width: "50%" }}
              onPress={() => {
                setModalVisible(false);
                if (modalConfig.onPress) modalConfig.onPress();
              }}
            >
              <View
                className="p-3 rounded-xl items-center"
                style={{
                  backgroundColor:
                    modalConfig.type === "success"
                      ? theme.buttonPrimary
                      : theme.buttonDangerText,
                }}
              >
                <Text className="font-bold text-xs text-white uppercase tracking-wider">
                  {modalConfig.type === "success" ? "OK" : "TRY AGAIN"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RequirementRow({ met, text, theme }) {
  return (
    <View className="flex-row items-center mb-1.5">
      <MaterialIcons
        name={met ? "check-circle" : "radio-button-unchecked"}
        size={14}
        color={met ? theme.buttonPrimary : theme.textSecondary}
      />
      <Text
        className="ml-2 text-[12px]"
        style={{ color: met ? theme.buttonPrimary : theme.textSecondary }}
      >
        {text}
      </Text>
    </View>
  );
}
