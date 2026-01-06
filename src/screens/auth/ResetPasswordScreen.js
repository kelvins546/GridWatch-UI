import React, { useState } from "react";
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
import { useNavigation, useRoute } from "@react-navigation/native";

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
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
      showModal(
        "error",
        "Missing Fields",
        "Please fill in both password fields."
      );
      return;
    }

    if (!hasLength || !hasNumber || !hasUpper || !hasSpecial) {
      showModal(
        "error",
        "Weak Password",
        "Please follow all password requirements before proceeding."
      );
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
        "Password Updated!",
        "Successfully changed. Use your new password to log in.",
        () => navigation.reset({ index: 0, routes: [{ name: "Login" }] })
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00ff99" />
          <Text style={styles.loadingText}>Updating Password...</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={18} color="#888" />
          <Text style={{ color: "#888", marginLeft: 5 }}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="security" size={40} color="#00ff99" />
        </View>

        <Text style={styles.title}>New Password</Text>
        <Text style={styles.desc}>
          Identity verified. Please create a new strong password for{" "}
          <Text style={{ color: "#fff" }}>{userEmail}</Text>.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={[styles.inputWrapper, { marginBottom: 20 }]}>
            <MaterialIcons
              name="lock"
              size={20}
              color="#666"
              style={{ marginRight: 12 }}
            />
            <TextInput
              style={styles.inputField}
              placeholder="Create new password"
              placeholderTextColor="#555"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <MaterialIcons
                name={showPass ? "visibility" : "visibility-off"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons
              name="lock-outline"
              size={20}
              color="#666"
              style={{ marginRight: 12 }}
            />
            <TextInput
              style={styles.inputField}
              placeholder="Re-enter password"
              placeholderTextColor="#555"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <MaterialIcons
                name={showConfirm ? "visibility" : "visibility-off"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        {}
        {password.length > 0 && (
          <View style={styles.requirementsBox}>
            <Text style={styles.reqTitle}>PASSWORD REQUIREMENTS</Text>
            <RequirementRow met={hasLength} text="At least 8 characters" />
            <RequirementRow met={hasUpper} text="At least 1 uppercase letter" />
            <RequirementRow met={hasNumber} text="Contains at least 1 number" />
            <RequirementRow
              met={hasSpecial}
              text="At least 1 special character"
            />
            <RequirementRow met={isMatch} text="Passwords match" />
          </View>
        )}

        <TouchableOpacity
          onPress={handleUpdatePassword}
          style={{ marginTop: 20 }}
        >
          <LinearGradient
            colors={["#0055ff", "#00ff99"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnText}>RESET PASSWORD</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (modalConfig.type === "error") setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <MaterialIcons
              name={
                modalConfig.type === "success"
                  ? "check-circle"
                  : "error-outline"
              }
              size={40}
              color={modalConfig.type === "success" ? "#00ff99" : "#ff4444"}
              style={{ marginBottom: 15 }}
            />
            <Text style={styles.modalTitleSmall}>{modalConfig.title}</Text>
            <Text style={styles.modalDescSmall}>{modalConfig.message}</Text>
            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={() => {
                setModalVisible(false);
                if (modalConfig.onPress) modalConfig.onPress();
              }}
            >
              <LinearGradient
                colors={
                  modalConfig.type === "success"
                    ? ["#0055ff", "#00ff99"]
                    : ["#ff4444", "#ff8800"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtnSmall}
              >
                <Text style={styles.btnTextBlack}>
                  {modalConfig.type === "success" ? "OK" : "TRY AGAIN"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RequirementRow({ met, text }) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}
    >
      <MaterialIcons
        name={met ? "check-circle" : "radio-button-unchecked"}
        size={14}
        color={met ? "#00ff99" : "#555"}
        style={{ marginRight: 8 }}
      />
      <Text style={{ fontSize: 12, color: met ? "#00ff99" : "#555" }}>
        {text}
      </Text>
    </View>
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
  desc: { fontSize: 14, color: "#888", lineHeight: 22, marginBottom: 30 },
  inputGroup: { marginBottom: 10 },
  label: {
    fontSize: 11,
    color: "#888",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
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
  requirementsBox: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 20,
  },
  reqTitle: {
    fontSize: 11,
    color: "#888",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 10,
  },
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
    width: "75%",
    maxWidth: 280,
    backgroundColor: "#1a1a1a",
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  modalTitleSmall: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescSmall: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  modalBtnSmall: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
});
