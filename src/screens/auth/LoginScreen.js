import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const navigation = useNavigation();
  const [showPass, setShowPass] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandSection}>
          <Image
            source={require("../../../assets/GridWatch-logo.png")}
            style={styles.logoImg}
          />
          <Text style={styles.logoText}>GRIDWATCH</Text>
          <Text style={styles.tagline}>Smart Energy Monitoring</Text>
        </View>

        <InputGroup
          label="Email Address"
          icon="email"
          placeholder="natasha@example.com"
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons
              name="lock"
              size={20}
              color="#666"
              style={{ marginRight: 12 }}
            />
            <TextInput
              style={styles.inputField}
              placeholder="••••••••"
              placeholderTextColor="#555"
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <MaterialIcons
                name={showPass ? "visibility" : "visibility-off"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgotPass}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace("MainApp")}>
          <LinearGradient
            colors={["#0055ff", "#00ff99"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnText}>LOG IN</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.signupLink}>
          <Text style={{ color: "#888" }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.quote}>"Don't wait for the bill. Control it."</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InputGroup({ label, icon, placeholder }) {
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
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  content: { padding: 30, flexGrow: 1, justifyContent: "center" },

  brandSection: { alignItems: "center", marginBottom: 40 },
  logoImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#1a1a1a",
  },
  logoText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 5,
  },
  tagline: { fontSize: 13, color: "#888", letterSpacing: 0.5 },

  inputGroup: { marginBottom: 20 },
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

  forgotPass: {
    alignSelf: "flex-end",
    color: "#0055ff",
    fontWeight: "600",
    fontSize: 12,
    marginBottom: 25,
  },

  btnPrimary: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#00ff99",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  btnText: { fontWeight: "700", fontSize: 15, color: "#000" },

  signupLink: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  linkText: { color: "#00ff99", fontWeight: "700" },

  quote: {
    textAlign: "center",
    fontSize: 12,
    color: "#00ff99",
    fontStyle: "italic",
    marginTop: 40,
    opacity: 0.8,
  },
});
