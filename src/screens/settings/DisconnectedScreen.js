import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function DisconnectedScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();

  const { hubName, lastSeen } = route.params || {};

  const pulseAnim = useRef(new Animated.Value(0)).current;

  const redColor = isDarkMode ? "#ff4444" : "#c62828";
  const greenColor = isDarkMode ? "#00ff99" : "#00995e";

  const redBg = isDarkMode
    ? "rgba(255, 68, 68, 0.1)"
    : "rgba(198, 40, 40, 0.1)";

  const greenBg = isDarkMode
    ? "rgba(0, 255, 153, 0.05)"
    : "rgba(0, 153, 94, 0.05)";

  const greenBorder = isDarkMode
    ? "rgba(0, 255, 153, 0.15)"
    : "rgba(0, 153, 94, 0.15)";

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={18}
            color={theme.textSecondary}
          />
          <Text style={[styles.backText, { color: theme.textSecondary }]}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Status</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  borderColor: redColor,
                  transform: [{ scale }],
                  opacity: opacity,
                },
              ]}
            />
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: redBg,
                  borderColor: isDarkMode
                    ? "rgba(255, 68, 68, 0.2)"
                    : "rgba(198, 40, 40, 0.2)",
                },
              ]}
            >
              <MaterialIcons name="cloud-off" size={48} color={redColor} />
            </View>
          </View>

          <Text style={[styles.statusTitle, { color: theme.text }]}>
            Hub Unreachable
          </Text>

          <Text style={[styles.statusDesc, { color: theme.textSecondary }]}>
            Request failed. {hubName || "GridWatch Hub"} is not responding to
            commands.
          </Text>

          <Text style={[styles.lastUpdate, { color: theme.textSecondary }]}>
            Last Connection: {lastSeen || "Unknown"}
          </Text>

          <View
            style={[
              styles.safetyNote,
              {
                backgroundColor: greenBg,
                borderColor: greenBorder,
              },
            ]}
          >
            <MaterialIcons name="security" size={24} color={greenColor} />
            <Text style={[styles.safetyText, { color: theme.textSecondary }]}>
              Critical features like Short Circuit & Overload Protection run
              locally on the hardware, so you are fully protected even while
              offline.
            </Text>
          </View>

          <View
            style={[
              styles.troubleshootBox,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <Text style={styles.boxTitle}>DIAGNOSTIC STEPS:</Text>

            <StepItem
              num="1"
              text="Ensure the Hub is plugged in and the LED is blinking."
              theme={theme}
            />
            <StepItem
              num="2"
              text="Check if your Wi-Fi router is online and transmitting."
              theme={theme}
            />
            <StepItem
              num="3"
              text="Move the Hub closer to your router (weak signal)."
              theme={theme}
            />
            <StepItem
              num="4"
              text="Verify your phone is on the same 2.4GHz network."
              theme={theme}
            />
            <StepItem
              num="5"
              text="Manual Reset: Unplug the device, wait 10s, and plug it back in."
              theme={theme}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.retryBtn,
              { backgroundColor: isDarkMode ? "#fff" : "#000" },
            ]}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
          >
            <Text
              style={[
                styles.retryBtnText,
                { color: isDarkMode ? "#000" : "#fff" },
              ]}
            >
              Return to Device
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StepItem({ num, text, theme }) {
  return (
    <View style={styles.stepItem}>
      <View
        style={[
          styles.stepNum,
          { backgroundColor: theme.textSecondary + "20" },
        ]}
      >
        <Text style={[styles.stepNumText, { color: theme.text }]}>{num}</Text>
      </View>
      <Text style={[styles.stepText, { color: theme.textSecondary }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  headerSpacer: {
    width: 50,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 30,
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    marginTop: 10,
    marginBottom: 25,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    zIndex: 2,
  },
  pulseRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    zIndex: 1,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  statusDesc: {
    fontSize: 15,
    marginBottom: 4,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "90%",
  },
  lastUpdate: {
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 30,
  },

  troubleshootBox: {
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 25,
    borderWidth: 1,
  },
  boxTitle: {
    fontSize: 11,
    color: "#888",
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 1,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  stepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 0,
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  stepText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  safetyNote: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    gap: 14,
  },
  safetyText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  retryBtn: {
    width: "100%",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  retryBtnText: {
    fontWeight: "800",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
