import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

export default function SignupScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
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
        <View style={styles.titleGroup}>
          <Text style={styles.pageTitle}>Create Account</Text>
          <Text style={styles.pageDesc}>
            Join GridWatch to monitor your energy.
          </Text>
        </View>

        <InputGroup
          label="Full Name"
          icon="person"
          placeholder="Natasha Alonzo"
        />
        <InputGroup
          label="Unit / House Number"
          icon="home"
          placeholder="Unit 402"
        />
        <InputGroup
          label="Email Address"
          icon="email"
          placeholder="name@email.com"
        />
        <InputGroup
          label="Password"
          icon="lock"
          placeholder="Create a password"
          isPassword
        />

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <LinearGradient
            colors={["#0055ff", "#00ff99"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnText}>SIGN UP</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.loginLink}>
          <Text style={{ color: "#888" }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}>Log In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.quote}>
          "Smart protection for the modern Filipino home."
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InputGroup({ label, icon, placeholder, isPassword }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <MaterialIcons
          name={icon}
          size={20}
          color="#666"
          style={{ marginRight: 12 }}
        />
        <TextInput
          style={styles.inputField}
          placeholder={placeholder}
          placeholderTextColor="#555"
          secureTextEntry={isPassword}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  header: { padding: 24 },
  backBtn: { flexDirection: "row", alignItems: "center" },
  content: { paddingHorizontal: 30 },

  titleGroup: { marginBottom: 25 },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  pageDesc: { fontSize: 14, color: "#888" },

  inputGroup: { marginBottom: 18 },
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

  btnPrimary: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { fontWeight: "700", fontSize: 15, color: "#0f0f0f" },

  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
    marginBottom: 30,
  },
  linkText: { color: "#00ff99", fontWeight: "700" },

  quote: {
    textAlign: "center",
    fontSize: 12,
    color: "#00ff99",
    fontStyle: "italic",
    opacity: 0.8,
  },
});
