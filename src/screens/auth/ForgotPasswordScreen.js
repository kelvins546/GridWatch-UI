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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

import { supabase } from "../../lib/supabase";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
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

  const handleSendOtp = async () => {
    setError(null);
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      setIsLoading(false);
      setOtpModalVisible(true);
      setTimer(120);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setIsLoading(false);
      setError(err.message);
    }
  };

  const handleVerify = async () => {
    const token = otp.join("");
    if (token.length < 6) {
      Alert.alert("Invalid Code", "Please enter the full 6-digit code.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: "email",
      });

      if (error) throw error;

      setIsLoading(false);
      setOtpModalVisible(false);

      navigation.navigate("ResetPassword", { email: email });
    } catch (err) {
      setIsLoading(false);
      Alert.alert(
        "Verification Failed",
        "The code is incorrect or has expired."
      );
    }
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
            <Text style={[styles.label, error && { color: "#ff4444" }]}>
              Registered Email
            </Text>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <View
            style={[styles.inputWrapper, error && { borderColor: "#ff4444" }]}
          >
            <MaterialIcons
              name="email"
              size={20}
              color={error ? "#ff4444" : "#666"}
              style={{ marginRight: 12 }}
            />
            <TextInput
              style={styles.inputField}
              placeholder="natasha@example.com"
              placeholderTextColor="#555"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
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
      =
      <Modal
        animationType="fade"
        transparent={true}
        visible={otpModalVisible}
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <MaterialIcons name="mark-email-read" size={24} color="#00ff99" />
            </View>

            <Text style={styles.modalTitle}>Verify Email</Text>
            <Text style={styles.modalDesc}>
              Enter the 6-digit code sent to your email.
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
                  placeholder="-"
                  placeholderTextColor="#444"
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
                style={styles.modalBtn}
              >
                <Text style={styles.btnText}>VERIFY CODE</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <Text style={{ color: "#666", fontSize: 12 }}>
                Didn't receive code?{" "}
              </Text>
              <TouchableOpacity disabled={!canResend} onPress={handleSendOtp}>
                <Text
                  style={{
                    color: canResend ? "#00ff99" : "#444",
                    fontWeight: "bold",
                    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  modalCard: {
    width: "85%",
    maxWidth: 340,
    backgroundColor: "#1a1a1a",
    padding: 24,
    borderRadius: 20,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 24,
  },
  otpContainer: { flexDirection: "row", gap: 8, marginBottom: 24 },
  otpInput: {
    width: 40,
    height: 48,
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
});
