import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.com$/;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [touched, setTouched] = useState(false);
  const [emailError, setEmailError] = useState(null);

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "error",
    title: "",
    message: "",
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

  const showAlert = (type, title, message) => {
    setAlertConfig({ type, title, message });
    setAlertVisible(true);
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
      showAlert(
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
        showAlert(
          "error",
          "Verification Failed",
          "The code is incorrect. For demo purposes, use '123456'."
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

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00ff99" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={18} color="#888" />
          <Text style={{ color: "#888", marginLeft: 5 }}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="lock-reset" size={40} color="#00ff99" />
        </View>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.desc}>
          Enter your email address and we will send you a 6-digit verification
          code.
        </Text>

        <View style={styles.inputGroup}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={[
                styles.label,
                touched && emailError ? { color: "#ff4444" } : {},
              ]}
            >
              Registered Email
            </Text>
            {touched && emailError && (
              <Text style={styles.errorText}>{emailError}</Text>
            )}
          </View>

          <View
            style={[
              styles.inputWrapper,
              touched && emailError ? { borderColor: "#ff4444" } : {},
            ]}
          >
            <MaterialIcons
              name="email"
              size={20}
              color={touched && emailError ? "#ff4444" : "#666"}
              style={{ marginRight: 12 }}
            />
            <TextInput
              style={styles.inputField}
              placeholder="natasha@example.com"
              placeholderTextColor="#555"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={handleEmailChange}
            />
          </View>
        </View>

        <TouchableOpacity onPress={handleSendOtp}>
          <LinearGradient
            colors={["#0055ff", "#00ff99"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnText}>SEND CODE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {}
      <Modal animationType="fade" transparent={true} visible={otpModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <MaterialIcons name="mark-email-read" size={24} color="#00ff99" />
            </View>
            <Text style={styles.modalTitle}>Verify Email</Text>
            <Text style={styles.modalDescSmall}>
              Enter 123456 to simulate success.
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={{ width: "100%", marginBottom: 15 }}
              onPress={handleVerify}
            >
              <LinearGradient
                colors={["#0055ff", "#00ff99"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtnSmall}
              >
                <Text style={styles.btnTextBlack}>VERIFY CODE</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <Text style={{ color: "#666", fontSize: 11 }}>
                Didn't receive code?{" "}
              </Text>
              <TouchableOpacity disabled={!canResend} onPress={handleSendOtp}>
                <Text
                  style={{
                    color: canResend ? "#00ff99" : "#444",
                    fontWeight: "bold",
                    fontSize: 11,
                  }}
                >
                  {canResend ? "Resend" : `Resend in ${formatTime(timer)}`}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
              <Text style={{ color: "#888", fontSize: 12 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {}
      <Modal animationType="fade" transparent={true} visible={alertVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.alertCard}>
            <MaterialIcons
              name={
                alertConfig.type === "success"
                  ? "check-circle"
                  : "error-outline"
              }
              size={36}
              color={alertConfig.type === "success" ? "#00ff99" : "#ff4444"}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.modalTitleSmall}>{alertConfig.title}</Text>
            <Text style={styles.modalDescSmall}>{alertConfig.message}</Text>
            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={() => setAlertVisible(false)}
            >
              <LinearGradient
                colors={
                  alertConfig.type === "success"
                    ? ["#0055ff", "#00ff99"]
                    : ["#ff4444", "#ff8800"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtnSmall}
              >
                <Text style={styles.btnTextBlack}>
                  {alertConfig.type === "success" ? "OK" : "TRY AGAIN"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  header: { padding: 24 },
  backBtn: { flexDirection: "row", alignItems: "center" },
  content: { paddingHorizontal: 30, paddingBottom: 40 },
  loadingOverlay: {
    position: "absolute",
    zIndex: 50,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#fff", marginTop: 15, fontWeight: "bold" },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,255,153,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,255,153,0.2)",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 10 },
  desc: { fontSize: 14, color: "#888", lineHeight: 22, marginBottom: 40 },
  inputGroup: { marginBottom: 30 },
  label: {
    fontSize: 11,
    color: "#888",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 10,
    color: "#ff4444",
    fontStyle: "italic",
    marginRight: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#333",
  },
  inputField: { flex: 1, color: "#fff", fontSize: 14 },
  btnPrimary: { padding: 16, borderRadius: 16, alignItems: "center" },
  btnText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  btnTextBlack: {
    fontWeight: "700",
    fontSize: 12,
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  modalCard: {
    width: "80%",
    maxWidth: 300,
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  alertCard: {
    width: "70%",
    maxWidth: 260,
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,255,153,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  modalTitleSmall: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },
  modalDescSmall: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 16,
  },
  otpContainer: { flexDirection: "row", gap: 6, marginBottom: 20 },
  otpInput: {
    width: 38,
    height: 44,
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBtnSmall: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
});
