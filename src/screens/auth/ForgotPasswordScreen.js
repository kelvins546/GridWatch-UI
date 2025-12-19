import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
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
          <MaterialIcons name="lock-reset" size={40} color="#0055ff" />
        </View>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.desc}>
          Enter the email address associated with your GridWatch account and
          we'll send you a secure link.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Registered Email</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons
              name="email"
              size={20}
              color="#666"
              style={{ marginRight: 12 }}
            />
            <TextInput
              style={styles.inputField}
              placeholder="natasha@example.com"
              placeholderTextColor="#555"
              keyboardType="email-address"
            />
          </View>
        </View>

        <TouchableOpacity onPress={() => alert("Reset link sent!")}>
          <LinearGradient
            colors={["#0055ff", "#00ff99"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnText}>SEND RESET LINK</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  header: { padding: 24 },
  backBtn: { flexDirection: "row", alignItems: "center" },
  content: { paddingHorizontal: 30, paddingBottom: 40 },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,85,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,85,255,0.3)",
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
  btnText: { fontWeight: "700", fontSize: 15, color: "#000" },
});
