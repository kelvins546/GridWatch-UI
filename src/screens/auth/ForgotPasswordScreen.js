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
import { supabase } from "../../lib/supabase";

const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.com$/;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  // --- STATE ---
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [emailError, setEmailError] = useState(null);

  // OTP State
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);

  // Alert Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: "error",
    title: "",
    message: "",
    onPress: null,
  });

  const inputRefs = useRef([]);

  // --- EFFECTS ---
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

  // --- HELPERS ---
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

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // --- LOGIC ---

  const handleSendCode = async () => {
    setTouched(true);
    const error = validateEmail(email);
    setEmailError(error);
    if (error) return;

    setIsLoading(true);

    try {
      // 1. Send OTP via Supabase (Uses the custom HTML template you set in Dashboard)
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });

      if (error) throw error;

      setOtpModalVisible(true);
      setTimer(180);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 500);
    } catch (err) {
      showModal("error", "Failed", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    const token = otp.join("");
    if (token.length < 6) return;

    setIsLoading(true);

    try {
      // 2. Verify OTP (Logs user in securely)
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token,
        type: "email",
      });

      if (error) throw error;

      setOtpModalVisible(false);
      navigation.navigate("ResetPassword", { email: email });
    } catch (err) {
      showModal("error", "Verification Failed", "Invalid code or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setCanResend(false);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });
      if (error) throw error;

      setTimer(180);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      showModal("error", "Resend Failed", err.message);
      setCanResend(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setTouched(true);
    setEmailError(validateEmail(text));
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text.length === 1 && index < 5) inputRefs.current[index + 1]?.focus();
    if (text.length === 0 && index > 0) inputRefs.current[index - 1]?.focus();
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
    otpModalContainer: {
      borderWidth: 1,
      padding: 24,
      borderRadius: 20,
      width: "85%",
      maxWidth: 300,
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
      marginHorizontal: 1,
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

      {/* --- UPDATED LOADING STATE --- */}
      {isLoading && (
        <View className="absolute z-50 w-full h-full bg-black/70 justify-center items-center">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text
            className="mt-3 font-medium"
            style={{ color: "#d1d5db", fontSize: scaledSize(12) }}
          >
            Processing...
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
                  editable={!isLoading}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSendCode}
              activeOpacity={0.8}
              disabled={isLoading}
            >
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
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={otpModalVisible}
        onRequestClose={() => {
          if (!isLoading) setOtpModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.otpModalContainer}>
            <Text style={styles.modalTitle}>Verify Email</Text>
            <Text style={styles.modalBody}>
              Enter the 6-digit code sent to{"\n"}
              <Text style={{ fontWeight: "bold", color: theme.text }}>
                {email}
              </Text>
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
                  editable={!isLoading}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleVerify}
              style={{ width: "100%", marginBottom: 12 }}
              disabled={isLoading}
            >
              <View
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.buttonPrimary },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.buttonPrimaryText}
                  />
                ) : (
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
                )}
              </View>
            </TouchableOpacity>

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

              <TouchableOpacity
                onPress={() => setOtpModalVisible(false)}
                disabled={isLoading}
              >
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                    textDecorationLine: "underline",
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ERROR MODAL */}
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
