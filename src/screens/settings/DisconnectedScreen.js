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

export default function DisconnectedScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { hubName, lastSeen } = route.params || {};

  const pulseAnim = useRef(new Animated.Value(0)).current;

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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={18} color="#999" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Status</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale }],
                  opacity: opacity,
                },
              ]}
            />
            <View style={styles.iconCircle}>
              <MaterialIcons name="cloud-off" size={48} color="#ff4444" />
            </View>
          </View>

          <Text style={styles.statusTitle}>Hub Unreachable</Text>

          <Text style={styles.statusDesc}>
            Request failed. {hubName || "GridWatch Hub"} is not responding to
            commands.
          </Text>

          <Text style={styles.lastUpdate}>
            Last Connection: {lastSeen || "Unknown"}
          </Text>

          <View style={styles.safetyNote}>
            <MaterialIcons name="security" size={24} color="#00ff99" />
            <Text style={styles.safetyText}>
              Critical features like Short Circuit & Overload Protection run
              locally on the hardware, so you are fully protected even while
              offline.
            </Text>
          </View>

          <View style={styles.troubleshootBox}>
            <Text style={styles.boxTitle}>DIAGNOSTIC STEPS:</Text>

            <StepItem
              num="1"
              text="Ensure the Hub is plugged in and the LED is blinking."
            />
            <StepItem
              num="2"
              text="Check if your Wi-Fi router is online and transmitting."
            />
            <StepItem
              num="3"
              text="Move the Hub closer to your router (weak signal)."
            />
            <StepItem
              num="4"
              text="Verify your phone is on the same 2.4GHz network."
            />
            <StepItem
              num="5"
              text="Manual Reset: Unplug the device, wait 10s, and plug it back in."
            />
          </View>

          <TouchableOpacity
            style={styles.retryBtn}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryBtnText}>Return to Device</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StepItem({ num, text }) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{num}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    backgroundColor: "#0f0f0f",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
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
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.2)",
    zIndex: 2,
  },
  pulseRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#ff4444",
    zIndex: 1,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  statusDesc: {
    fontSize: 15,
    color: "#ccc",
    marginBottom: 4,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "90%",
  },
  lastUpdate: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 30,
  },

  troubleshootBox: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#333",
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
    backgroundColor: "#333",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 0,
  },
  stepNumText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  stepText: {
    fontSize: 13,
    color: "#ddd",
    flex: 1,
    lineHeight: 18,
  },

  safetyNote: {
    backgroundColor: "rgba(0, 255, 153, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 153, 0.15)",
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
    color: "#bbb",
    lineHeight: 18,
    flex: 1,
  },
  safetyHighlight: {
    color: "#00ff99",
    fontWeight: "700",
  },
  retryBtn: {
    width: "100%",
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  retryBtnText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
