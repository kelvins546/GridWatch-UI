import React, { useState, useRef, useEffect } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.com$/;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [emailError, setEmailError] = useState(null);

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: "error",
    title: "",
    message: "",
    onPress: null,
  });

  const inputRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (otpModalVisible && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpModalVisible, timer]);

  const showModal = (type, title, message, onPress = null) => {
    setModalConfig({ type, title, message, onPress });
    setModalVisible(true);
  };

  const validateEmail = (value) => {
    if (!value) return "Email is required";
    if (!ALLOWED_EMAIL_REGEX.test(value)) {
      return "Use a valid provider (Gmail, Yahoo, etc)";
    }
    return null;
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setTouched(true);
    setEmailError(validateEmail(text));
  };

  const handleSendOtp = async () => {
    setTouched(true);
    const error = validateEmail(email);
    setEmailError(error);
    if (error) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpModalVisible(true);
      setTimer(120);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
    }, 1500);
  };

  const handleVerify = async () => {
    const token = otp.join("");
    if (token.length < 6) {
      showModal(
        "error",
        "Incomplete Code",
        "Please enter the full 6-digit code."
      );
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (token === "123456") {
        setOtpModalVisible(false);
        navigation.navigate("ResetPassword", { email: email });
      } else {
        showModal(
          "error",
          "Verification Failed",
          "The code is incorrect. Use '123456'."
        );
      }
    }, 1500);
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text.length === 1 && index < 5) inputRefs.current[index + 1]?.focus();
    if (text.length === 0 && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleResend = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setTimer(120);
      setCanResend(false);
    }, 1000);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // --- STYLES (MATCHING SIGNUP SCREEN EXACTLY) ---
  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    // Standard Modal (Alerts)
    modalContainer: {
      borderWidth: 1,
      padding: 20, // p-5
      borderRadius: 16, // rounded-2xl
      width: 288, // w-72 (Standard)
      alignItems: "center",
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
    },
    // OTP Modal (Exception - Wider)
    otpModalContainer: {
      borderWidth: 1,
      padding: 24,
      borderRadius: 20,
      width: "85%",
      maxWidth: 300, // Wider for inputs
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
    // OTP Inputs (Matching Signup)
    otpInput: {
      width: 42,
      height: 50,
      borderRadius: 10,
      textAlign: "center",
      fontSize: scaledSize(20),
      fontWeight: "bold",
      borderWidth: 1,
      backgroundColor: theme.buttonNeutral,
      borderColor: theme.cardBorder,
      color: theme.text,
      marginHorizontal: 1, // Tight spacing
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
            Processing...
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          <View className="p-[30px]">
            {/* Header Icon Section */}
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
                  name="lock-reset"
                  size={40}
                  color={theme.buttonPrimary}
                />
              </View>
              <Text
                className="font-bold text-2xl mb-2"
                style={{ color: theme.text }}
              >
                Reset Password
              </Text>
              <Text
                className="text-center text-sm"
                style={{ color: theme.textSecondary }}
              >
                Enter your email address and we will send you a 6-digit
                verification code.
              </Text>
            </View>

            {/* Email Input */}
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className="text-[11px] font-bold uppercase"
                  style={{
                    color:
                      touched && emailError
                        ? theme.buttonDangerText
                        : theme.textSecondary,
                  }}
                >
                  Registered Email
                </Text>
                {touched && emailError && (
                  <Text
                    className="text-[10px] italic"
                    style={{ color: theme.buttonDangerText }}
                  >
                    {emailError}
                  </Text>
                )}
              </View>

              <View
                className="flex-row items-center rounded-xl px-4 py-2.5 border"
                style={{
                  backgroundColor: theme.buttonNeutral,
                  borderColor: theme.cardBorder,
                }}
              >
                <MaterialIcons
                  name="email"
                  size={20}
                  color={
                    touched && emailError
                      ? theme.buttonDangerText
                      : theme.textSecondary
                  }
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  className="flex-1 text-sm"
                  style={{ color: theme.text }}
                  placeholder="natasha@example.com"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={handleEmailChange}
                />
              </View>
            </View>

            {/* Send Code Button */}
            <TouchableOpacity onPress={handleSendOtp} activeOpacity={0.8}>
              <View
                className="p-4 rounded-2xl items-center shadow-sm"
                style={{ backgroundColor: theme.buttonPrimary }}
              >
                <Text
                  className="font-bold text-[15px]"
                  style={{ color: theme.buttonPrimaryText }}
                >
                  SEND CODE
                </Text>
              </View>
            </TouchableOpacity>

            {/* Centered Back to Login Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
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
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- OTP MODAL (MATCHING SIGNUP EXCEPTION) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={otpModalVisible}
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.otpModalContainer}>
            <Text style={styles.modalTitle}>Verify Email</Text>
            <Text style={styles.modalBody}>
              Enter the 6-digit code. (Use 123456)
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 1,
                marginBottom: 20,
                justifyContent: "center",
              }}
            >
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  placeholder="-"
                  placeholderTextColor={theme.textSecondary}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleVerify}
              style={{ width: "100%", marginBottom: 12 }}
            >
              <View
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.buttonPrimary },
                ]}
              >
                <Text
                  style={{
                    color: theme.buttonPrimaryText,
                    fontWeight: "bold",
                    fontSize: scaledSize(12),
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  VERIFY
                </Text>
              </View>
            </TouchableOpacity>

            {/* Centered Bottom Layout like Signup */}
            <View style={{ width: "100%", alignItems: "center", gap: 12 }}>
              <TouchableOpacity disabled={!canResend} onPress={handleResend}>
                <Text
                  style={{
                    fontSize: scaledSize(12),
                    fontWeight: "bold",
                    color: canResend
                      ? theme.buttonPrimary
                      : theme.textSecondary,
                  }}
                >
                  {canResend ? "Resend Code" : `Resend in ${formatTime(timer)}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                    textDecorationLine: "underline",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- STANDARD ALERT MODAL --- */}
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
