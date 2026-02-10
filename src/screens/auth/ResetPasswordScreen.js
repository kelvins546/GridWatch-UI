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
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, fontScale } = useTheme();

  const scaledSize = (size) => size * (fontScale || 1);
  const userEmail = route.params?.email;
  const userToken = route.params?.token;

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
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<> ]/.test(password);
  const isMatch = password === confirmPassword && password.length > 0;
  const isStrong = hasLength && hasNumber && hasUpper && hasSpecial && isMatch;

  const showModal = (type, title, message, onPress = null) => {
    setModalConfig({ type, title, message, onPress });
    setModalVisible(true);
  };

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      showModal("error", "Missing Fields", "Please fill in both fields.");
      return;
    }

    if (!isStrong) {
      showModal("error", "Weak Password", "Please follow all requirements.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: userToken,
        type: "email",
      });

      if (verifyError) throw verifyError;

      if (data?.session) {
        await supabase.auth.setSession(data.session);
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      await supabase.auth.signOut();

      setIsLoading(false);
      showModal(
        "success",
        "Success!",
        "Your password has been updated. Please log in with your new credentials.",
        () => navigation.reset({ index: 0, routes: [{ name: "Login" }] }),
      );
    } catch (error) {
      setIsLoading(false);
      showModal("error", "Update Failed", error.message);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      borderWidth: 1,
      padding: 20,
      borderRadius: 16,
      width: 288,
      alignItems: "center",
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
    },
    modalTitle: {
      fontWeight: "bold",
      marginBottom: 8,
      textAlign: "center",
      color: theme.text,
      fontSize: scaledSize(18),
    },
    modalBody: {
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 20,
      color: theme.textSecondary,
      fontSize: scaledSize(12),
    },
    modalButton: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
  });

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
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 32,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <View className="items-center mb-10">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-6"
                style={{
                  backgroundColor: `${theme.buttonPrimary}15`,
                  borderWidth: 1,
                  borderColor: `${theme.buttonPrimary}30`,
                }}
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
                Create a strong password for{"\n"}
                <Text style={{ color: theme.text, fontWeight: "bold" }}>
                  {userEmail}
                </Text>
              </Text>
            </View>

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
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  className="flex-1 text-sm"
                  style={{ color: theme.text }}
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
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  className="flex-1 text-sm"
                  style={{ color: theme.text }}
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

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={isLoading}
              className="mt-8 items-center justify-center flex-row"
            >
              <MaterialIcons
                name="arrow-back"
                size={scaledSize(18)}
                color={theme.textSecondary}
              />
              <Text
                className="font-medium text-sm ml-2"
                style={{ color: theme.textSecondary }}
              >
                Back
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (modalConfig.type === "error") setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalBody}>{modalConfig.message}</Text>

            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={() => {
                setModalVisible(false);
                if (modalConfig.onPress) modalConfig.onPress();
              }}
            >
              <View
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      modalConfig.type === "success"
                        ? theme.buttonPrimary
                        : theme.buttonDangerText,
                  },
                ]}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: scaledSize(12),
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {modalConfig.type === "success" ? "CONTINUE" : "TRY AGAIN"}
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
