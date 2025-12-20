import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function LandingScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={["#1a1a1a", "#1a1a1a"]} style={styles.hero}>
        <Animated.View
          style={[
            styles.logoCircle,
            { transform: [{ translateY: floatAnim }] },
          ]}
        >
          <Image
            source={require("../../../assets/GridWatch-logo.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.slideContent}>
          <Text style={styles.appName}>GridWatch</Text>
          <Text style={styles.tagline}>
            Smart energy monitoring and automated fault protection for your
            home.
          </Text>
        </View>

        {/* Dots */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </LinearGradient>

      <View style={styles.bottomSheet}>
        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <LinearGradient
            colors={["#0055ff", "#00ff99"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnText}>GET STARTED</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.loginLink}>
          <Text style={{ color: "#666", fontSize: 13 }}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },

  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00ff99",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 40,
    backgroundColor: "#1a1a1a",
  },
  logoImg: { width: 120, height: 120 },

  slideContent: { alignItems: "center", marginBottom: 20 },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 10,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },

  dots: { flexDirection: "row", gap: 8, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#444" },
  activeDot: { width: 24, backgroundColor: "#00ff99" },

  bottomSheet: {
    backgroundColor: "#222",
    padding: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  btnPrimary: {
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  btnText: { fontWeight: "700", fontSize: 16, color: "#000", letterSpacing: 1 },
  loginLink: { flexDirection: "row", justifyContent: "center" },
  linkText: {
    color: "#fff",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
