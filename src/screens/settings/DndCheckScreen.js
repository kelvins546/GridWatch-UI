import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function DndCheckScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [step, setStep] = useState("detect"); // 'detect' | 'resolve'

  // --- ANIMATIONS ---
  const z1Anim = useRef(new Animated.Value(0)).current;
  const z2Anim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Slide Up
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();

    // Loop Zzz Animation
    const floatZ = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    floatZ(z1Anim, 0);
    floatZ(z2Anim, 800);
  }, []);

  const handleResolve = () => {
    setStep("resolve");
    setTimeout(() => {
      navigation.goBack();
    }, 2000);
  };

  const handleIgnore = () => {
    navigation.goBack();
  };

  const getZStyle = (anim, startX, startY) => {
    return {
      opacity: anim.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [0, 1, 1, 0],
      }),
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [startY, startY - 20],
          }),
        },
        {
          translateX: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [startX, startX + 15],
          }),
        },
        {
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1.2],
          }),
        },
      ],
    };
  };

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.85)" />

      <Animated.View
        style={[styles.modal, { transform: [{ translateY: slideAnim }] }]}
      >
        {step === "detect" ? (
          <>
            {/* --- DETECTION STATE --- */}
            <View style={styles.iconWrapper}>
              <MaterialIcons name="nights-stay" size={32} color="#a855f7" />
              <Animated.Text style={[styles.zzz, getZStyle(z1Anim, 10, -10)]}>
                Z
              </Animated.Text>
              <Animated.Text style={[styles.zzz, getZStyle(z2Anim, 20, -25)]}>
                Z
              </Animated.Text>
            </View>

            <Text style={styles.title}>"Do Not Disturb" is On</Text>

            <Text style={styles.message}>
              GridWatch detected that your notifications are silenced. You might
              miss <Text style={styles.highlight}>Critical Safety Alerts</Text>{" "}
              (Short Circuits).
            </Text>

            <View style={styles.btnGroup}>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleResolve}
              >
                <LinearGradient
                  colors={["#0055ff", "#00ff99"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnTextPrimary}>Turn Off DND</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={handleIgnore}
              >
                <Text style={styles.btnTextSecondary}>I accept the risk</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* --- SUCCESS STATE --- */}
            <View style={[styles.iconWrapper, styles.successWrapper]}>
              <MaterialIcons
                name="notifications-active"
                size={32}
                color="#00ff99"
              />
            </View>
            <Text style={styles.title}>Great!</Text>
            <Text style={styles.message}>
              You will now receive safety alerts instantly.
            </Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  iconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(147, 51, 234, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.3)",
  },
  successWrapper: {
    backgroundColor: "rgba(0, 255, 153, 0.1)",
    borderColor: "#00ff99",
  },
  zzz: {
    position: "absolute",
    color: "#a855f7",
    fontWeight: "700",
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    color: "#bbb",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 25,
  },
  highlight: {
    color: "#ff4444",
    fontWeight: "700",
  },
  btnGroup: {
    width: "100%",
    gap: 12,
  },
  btnPrimary: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  gradientBtn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTextPrimary: {
    color: "#0f0f0f",
    fontWeight: "700",
    fontSize: 14,
  },
  btnSecondary: {
    paddingVertical: 10,
    alignItems: "center",
  },
  btnTextSecondary: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
  },
});
