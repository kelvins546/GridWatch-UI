import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  LogBox,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

const { width } = Dimensions.get("window");

export default function SetupHubScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, fontScale } = useTheme();

  const scaledSize = (size) => size * fontScale;

  // Detect if user came from Signup flow
  const fromSignup = route.params?.fromSignup;

  useEffect(() => {
    LogBox.ignoreLogs([
      "Network request failed",
      "Possible Unhandled Promise Rejection",
    ]);
  }, []);

  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [statusStep, setStatusStep] = useState("");

  // Generic Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error",
    onPress: null,
  });

  // Logout Confirmation Modal State
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleBack = () => {
    if (fromSignup) {
      setLogoutModalVisible(true);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace("MainApp");
    }
  };

  const handleConfirmLogout = async () => {
    try {
      setLogoutModalVisible(false);
      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: "Landing" }],
      });
    } catch (error) {
      console.log("Error signing out:", error);
      navigation.reset({
        index: 0,
        routes: [{ name: "Landing" }],
      });
    }
  };

  const showAlert = (title, message, type = "error", onPress = null) => {
    setAlertConfig({ visible: true, title, message, type, onPress });
  };

  const closeAlert = () => {
    const callback = alertConfig.onPress;
    setAlertConfig({ ...alertConfig, visible: false });
    if (callback) callback();
  };

  const openWifiSettings = async () => {
    try {
      if (Platform.OS === "ios") {
        await Linking.openURL("App-Prefs:root=WIFI");
      } else {
        await Linking.sendIntent("android.settings.WIFI_SETTINGS");
      }
    } catch (error) {
      console.log(
        "Failed to open specific settings, fallback to general settings"
      );
      await Linking.openSettings();
    }
  };

  const handleStartPairing = async () => {
    if (!wifiSSID || !wifiPass) {
      showAlert("Missing Info", "Please enter Wi-Fi Name and Password.");
      return;
    }

    setIsPairing(true);
    setStatusStep(`Connecting to Hub...`);

    setTimeout(() => {
      setStatusStep("Sending credentials...");
      setTimeout(() => {
        setStatusStep("Verifying with cloud...");
        setTimeout(() => {
          setStatusStep("Success! Connected.");
          setTimeout(() => {
            setIsPairing(false);
            navigation.navigate("HubConfig", { hubId: "demo_hub_123" });
          }, 1000);
        }, 2000);
      }, 2000);
    }, 2000);
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setWifiSSID("PLDT_Home_FIBR");
      setWifiPass("password123");
    }, 2500);
  };

  // --- STANDARD MODAL STYLES ---
  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      borderWidth: 1,
      padding: 20,
      borderRadius: 16,
      width: 288,
      alignItems: "center",
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
    },
    modalTitle: {
      fontWeight: "bold",
      marginBottom: 8,
      textAlign: "center",
      color: theme.text,
      fontSize: scaledSize(18),
    },
    modalBody: {
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 20,
      color: theme.textSecondary,
      fontSize: scaledSize(12),
    },
    buttonRow: {
      flexDirection: "row",
      gap: 10,
      width: "100%",
    },
    modalCancelBtn: {
      flex: 1,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.textSecondary,
    },
    modalConfirmBtn: {
      flex: 1,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.buttonDangerText,
      overflow: "hidden",
    },
    modalButtonFull: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    modalButtonText: {
      fontWeight: "bold",
      fontSize: scaledSize(12),
      textTransform: "uppercase",
      letterSpacing: 1,
    },
  });

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* --- UPDATED HEADER (No Text, Adjusted Sizes) --- */}
      <View
        className="flex-row items-center justify-between px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity onPress={handleBack}>
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(20)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(18) }}
        >
          Connect Hub
        </Text>

        {/* Placeholder for perfect center alignment */}
        <View style={{ width: scaledSize(20) }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-6 py-6">
            <Text
              className="font-bold uppercase tracking-widest mb-3"
              style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
            >
              Step 1: Connect to Device
            </Text>

            <View
              className="p-5 rounded-2xl border mb-5"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
            >
              <View className="flex-row gap-3 mb-2.5">
                <View
                  className="w-9 h-9 rounded-full justify-center items-center"
                  style={{ backgroundColor: theme.buttonNeutral }}
                >
                  <MaterialIcons
                    name="wifi-tethering"
                    size={scaledSize(20)}
                    color={theme.buttonPrimary}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="font-bold mb-1"
                    style={{ color: theme.text, fontSize: scaledSize(16) }}
                  >
                    Connect Phone to Hub
                  </Text>
                  <Text
                    className="leading-5"
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(12),
                    }}
                  >
                    Your phone needs to talk directly to the Hub to configure
                    it.
                  </Text>
                </View>
              </View>

              <View
                className="p-4 rounded-xl my-4 border border-dashed"
                style={{
                  backgroundColor: theme.background,
                  borderColor: theme.cardBorder,
                }}
              >
                <Text
                  className="mb-2 leading-5"
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  1. Tap the button below to open Settings.
                </Text>
                <Text
                  className="mb-2 leading-5"
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  2. Connect to{" "}
                  <Text
                    className="font-bold"
                    style={{ color: theme.buttonPrimary }}
                  >
                    GridWatch-Setup
                  </Text>
                  .
                </Text>
                <Text
                  className="leading-5"
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  3. Return to this app.
                </Text>
              </View>

              <TouchableOpacity
                onPress={openWifiSettings}
                className="border rounded-xl py-3 items-center"
                style={{ borderColor: theme.buttonPrimary }}
              >
                <Text
                  className="font-semibold"
                  style={{
                    color: theme.buttonPrimary,
                    fontSize: scaledSize(14),
                  }}
                >
                  Open Wi-Fi Settings
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              className="font-bold uppercase tracking-widest mt-5 mb-3"
              style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
            >
              Step 2: Configure Network
            </Text>
            <Text
              className="mb-5 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              Enter the details of your **Home Wi-Fi**. We will send this to the
              Hub so it can get online.
            </Text>

            <View className="mb-5">
              <Text
                className="font-semibold mb-2"
                style={{ color: theme.text, fontSize: scaledSize(12) }}
              >
                Home Wi-Fi Name (SSID)
              </Text>
              <View
                className="flex-row border rounded-xl items-center pr-1.5"
                style={{
                  borderColor: theme.cardBorder,
                  backgroundColor: theme.card,
                  height: scaledSize(50),
                }}
              >
                <TextInput
                  className="flex-1 p-4 h-full"
                  style={{ color: theme.text, fontSize: scaledSize(16) }}
                  placeholder="e.g. PLDT_Home_FIBR"
                  placeholderTextColor={theme.textSecondary}
                  value={wifiSSID}
                  onChangeText={setWifiSSID}
                />
                <TouchableOpacity
                  onPress={handleSimulateScan}
                  className="p-2.5"
                >
                  <MaterialIcons
                    name="qr-code-scanner"
                    size={scaledSize(22)}
                    color={theme.buttonPrimary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-5">
              <Text
                className="font-semibold mb-2"
                style={{ color: theme.text, fontSize: scaledSize(12) }}
              >
                Home Wi-Fi Password
              </Text>
              <View
                className="flex-row border rounded-xl items-center pr-1.5"
                style={{
                  borderColor: theme.cardBorder,
                  backgroundColor: theme.card,
                  height: scaledSize(50),
                }}
              >
                <TextInput
                  className="flex-1 p-4 h-full"
                  style={{ color: theme.text, fontSize: scaledSize(16) }}
                  placeholder="Enter Password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showPass}
                  value={wifiPass}
                  onChangeText={setWifiPass}
                />
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  className="p-2.5"
                >
                  <MaterialIcons
                    name={showPass ? "visibility" : "visibility-off"}
                    size={scaledSize(20)}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="h-10" />
          </View>
        </ScrollView>

        <View className="p-6">
          <TouchableOpacity
            onPress={() => handleStartPairing()}
            className="rounded-xl items-center justify-center py-4"
            style={{ backgroundColor: theme.buttonPrimary }}
          >
            <Text
              className="font-bold"
              style={{ color: "#fff", fontSize: scaledSize(16) }}
            >
              Send Configuration to Hub
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* --- CONFIRM LOGOUT MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancel Setup?</Text>
            <Text style={styles.modalBody}>
              If you continue, you will be logged out and your progress will be
              lost.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmLogout}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- SCANNING MODAL (UPDATED LOADER) --- */}
      <Modal visible={isScanning} animationType="slide">
        <View className="flex-1 bg-black">
          <SafeAreaView edges={["top"]} className="bg-black z-20">
            <View className="flex-row justify-between items-center px-5 py-4">
              <TouchableOpacity onPress={() => setIsScanning(false)}>
                <MaterialIcons
                  name="close"
                  size={scaledSize(28)}
                  color="white"
                />
              </TouchableOpacity>
              <Text
                className="font-bold"
                style={{ color: "white", fontSize: scaledSize(16) }}
              >
                Scan QR Code
              </Text>
              <View style={{ width: 28 }} />
            </View>
          </SafeAreaView>

          <View className="flex-1 justify-center items-center relative">
            <View style={StyleSheet.absoluteFill} className="bg-gray-800" />
            <View
              style={StyleSheet.absoluteFill}
              className="justify-center items-center"
            >
              <View className="w-full h-full bg-black/60 absolute" />
              <View className="w-64 h-64 bg-transparent justify-center items-center relative">
                <View
                  className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4"
                  style={{ borderColor: theme.buttonPrimary }}
                />
                <View
                  className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4"
                  style={{ borderColor: theme.buttonPrimary }}
                />
                <View
                  className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4"
                  style={{ borderColor: theme.buttonPrimary }}
                />
                <View
                  className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4"
                  style={{ borderColor: theme.buttonPrimary }}
                />
                <View
                  className="w-[90%] h-[2px] opacity-70 shadow-lg"
                  style={{
                    backgroundColor: theme.buttonPrimary,
                    shadowColor: theme.buttonPrimary,
                  }}
                />
              </View>
              <Text
                className="mt-8 opacity-80"
                style={{ color: "white", fontSize: scaledSize(14) }}
              >
                Align QR code within the frame
              </Text>
            </View>
          </View>

          <SafeAreaView
            edges={["bottom"]}
            className="bg-black p-8 items-center"
          >
            {/* UPDATED LOADER AND TEXT STYLE */}
            <ActivityIndicator size="large" color="#B0B0B0" />
            <Text
              className="mt-3 font-medium"
              style={{
                color: "#B0B0B0",
                fontSize: scaledSize(12),
                letterSpacing: 0.5,
              }}
            >
              Searching for code...
            </Text>
          </SafeAreaView>
        </View>
      </Modal>

      {/* --- PAIRING SPINNER (UPDATED: NO CARD) --- */}
      <Modal transparent visible={isPairing}>
        <View className="flex-1 justify-center items-center bg-black/80">
          <ActivityIndicator size="large" color="#B0B0B0" />
          <Text
            className="mt-5 font-medium"
            style={{
              color: "#B0B0B0",
              fontSize: scaledSize(12),
              letterSpacing: 0.5,
            }}
          >
            {statusStep}
          </Text>
        </View>
      </Modal>

      {/* --- STANDARD ALERT MODAL --- */}
      <Modal transparent visible={alertConfig.visible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{alertConfig.title}</Text>
            <Text style={styles.modalBody}>{alertConfig.message}</Text>

            <TouchableOpacity
              onPress={closeAlert}
              style={[
                styles.modalButtonFull,
                {
                  backgroundColor:
                    alertConfig.type === "success"
                      ? theme.buttonPrimary
                      : alertConfig.type === "warning"
                      ? "#FFA500"
                      : theme.buttonDangerText,
                },
              ]}
            >
              <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                {alertConfig.type === "success" ? "CONTINUE" : "OKAY"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
