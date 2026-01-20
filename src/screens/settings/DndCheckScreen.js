import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Linking,
  Platform,
  StyleSheet,
  AppState, // <--- 1. Import AppState
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import * as IntentLauncher from "expo-intent-launcher";

// --- 2. IMPORT checkRingerMode ALONG WITH THE HOOK ---
import {
  useRingerMode,
  RingerModeType,
  checkRingerMode,
} from "react-native-ringer-mode";

export default function DndCheckScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const [step, setStep] = useState("manual");

  // This hook handles live updates while the app is OPEN
  const { mode } = useRingerMode();

  const z1Anim = useRef(new Animated.Value(0)).current;
  const z2Anim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // --- 3. HELPER FUNCTION TO EVALUATE MODE ---
  const evaluateMode = (currentMode) => {
    if (currentMode === RingerModeType.normal) {
      setStep("success");
    } else {
      setStep("manual");
    }
  };

  // --- 4. LISTENER FOR APP FOCUS (Coming back from Settings) ---
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (nextAppState === "active") {
          // App has come to the foreground, force a check
          try {
            const currentMode = await checkRingerMode();
            evaluateMode(currentMode);
          } catch (error) {
            console.log("Error checking ringer mode:", error);
          }
        }
      },
    );

    // Check once on mount as well
    checkRingerMode().then(evaluateMode);

    return () => {
      subscription.remove();
    };
  }, []);

  // --- 5. LISTEN FOR LIVE CHANGES (While app is open) ---
  useEffect(() => {
    if (mode) {
      evaluateMode(mode);
    }
  }, [mode]);

  // --- Animations ---
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();

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
        ]),
      ).start();
    };

    floatZ(z1Anim, 0);
    floatZ(z2Anim, 800);
  }, []);

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === "android") {
        await IntentLauncher.startActivityAsync(
          "android.settings.ZEN_MODE_PRIORITY_SETTINGS",
        );
      } else {
        Linking.openSettings();
      }
    } catch (error) {
      Linking.openSettings();
    }
  };

  const handleConfirm = async () => {
    // Optional: Double check before forcing success
    const currentMode = await checkRingerMode();
    if (currentMode === RingerModeType.normal) {
      setStep("success");
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } else {
      // If they click confirm but it's still silent, maybe let them pass or warn again
      // For now, assume manual override is okay:
      setStep("success");
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    }
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
            outputRange: [startY, startY - 15],
          }),
        },
        {
          translateX: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [startX, startX + 10],
          }),
        },
        {
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
        },
      ],
    };
  };

  return (
    <View style={styles.centeredContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="rgba(0,0,0,0.7)"
        translucent
      />

      <Animated.View
        style={[
          styles.modalCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {step === "manual" ? (
          <>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(168, 85, 247, 0.1)"
                    : "rgba(168, 85, 247, 0.05)",
                  borderColor: isDarkMode
                    ? "rgba(168, 85, 247, 0.3)"
                    : "#d8b4fe",
                },
              ]}
            >
              <MaterialIcons name="nights-stay" size={24} color="#a855f7" />
              <Animated.Text
                style={[styles.floatingZ, getZStyle(z1Anim, 8, -8)]}
              >
                Z
              </Animated.Text>
              <Animated.Text
                style={[styles.floatingZ, getZStyle(z2Anim, 16, -18)]}
              >
                Z
              </Animated.Text>
            </View>

            <Text
              style={[
                styles.title,
                { color: theme.text, fontSize: scaledSize(16) },
              ]}
            >
              Check "Do Not Disturb"
            </Text>

            <Text
              style={[
                styles.description,
                { color: theme.textSecondary, fontSize: scaledSize(12) },
              ]}
            >
              Please ensure your phone is not silencing alerts. You might miss{" "}
              <Text
                style={{ color: theme.buttonDangerText, fontWeight: "bold" }}
              >
                Critical Safety Alerts
              </Text>
              .
            </Text>

            <View style={styles.buttonContainer}>
              <View style={styles.rowContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: theme.buttonNeutral,
                      borderColor: theme.cardBorder,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={handleOpenSettings}
                >
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: "600",
                      fontSize: scaledSize(11),
                      textAlign: "center",
                    }}
                  >
                    Open Settings
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: theme.buttonPrimary,
                    },
                  ]}
                  onPress={handleConfirm}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: scaledSize(11),
                      textAlign: "center",
                    }}
                  >
                    I Have Checked
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleIgnore}
              >
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontWeight: "600",
                    fontSize: scaledSize(10),
                  }}
                >
                  Skip for now
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: `${theme.buttonPrimary}15`,
                  borderColor: theme.buttonPrimary,
                },
              ]}
            >
              <MaterialIcons
                name="notifications-active"
                size={24}
                color={theme.buttonPrimary}
              />
            </View>
            <Text
              style={[
                styles.title,
                { color: theme.text, fontSize: scaledSize(16) },
              ]}
            >
              Great!
            </Text>
            <Text
              style={[
                styles.description,
                { color: theme.textSecondary, fontSize: scaledSize(12) },
              ]}
            >
              You will now receive safety alerts instantly.
            </Text>
            {/* Added a close button for better UX in success state */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginTop: 10 }}
            >
              <Text
                style={{
                  color: theme.buttonPrimary,
                  fontWeight: "bold",
                  fontSize: scaledSize(12),
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 280,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  floatingZ: {
    position: "absolute",
    color: "#a855f7",
    fontWeight: "bold",
    fontSize: 12,
  },
  title: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  rowContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 8,
    marginBottom: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
});
