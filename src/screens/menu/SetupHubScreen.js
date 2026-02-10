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
import { CameraView, useCameraPermissions } from "expo-camera";
import { supabase } from "../../lib/supabase";

const { width } = Dimensions.get("window");

export default function SetupHubScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, fontScale } = useTheme();

  const scaledSize = (size) => size * fontScale;

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

  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [isPairing, setIsPairing] = useState(false);
  const [statusStep, setStatusStep] = useState("");

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error",
    onPress: null,
  });

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
        "Failed to open specific settings, fallback to general settings",
      );
      await Linking.openSettings();
    }
  };

  const handleStartPairing = async (autoSSID = null, autoPass = null) => {
    const targetSSID = autoSSID !== null ? autoSSID : wifiSSID;
    const targetPass = autoPass !== null ? autoPass : wifiPass;

    if (!targetSSID) {
      showAlert("Missing Info", "Please scan a QR code or enter Wi-Fi Name.");
      return;
    }

    setIsPairing(true);

    try {
      setStatusStep(`Connecting to Hub...`);

      const details = {
        ssid: targetSSID,
        pass: targetPass,
      };

      const formBody = Object.keys(details)
        .map(
          (key) =>
            encodeURIComponent(key) + "=" + encodeURIComponent(details[key]),
        )
        .join("&");

      await new Promise((resolve) => setTimeout(resolve, 2000));
      setStatusStep("Sending credentials...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      console.log("Attempting fetch to 192.168.4.1...");

      const response = await fetch("http://192.168.4.1/connect-hub", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: formBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const text = await response.text();
      console.log("Hub Response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        if (
          text.toLowerCase().includes("success") ||
          text.includes("Connected")
        ) {
          data = { status: "success", hub_id: "unknown_hub" };
        } else {
          throw new Error("Invalid response from Hub");
        }
      }

      if (data.status === "success") {
        setStatusStep("Success! Connected.");
        await new Promise((resolve) => setTimeout(resolve, 500));
        setIsPairing(false);

        navigation.navigate("HubConfig", { hubId: data.hub_id });
      } else {
        throw new Error("Hub refused connection");
      }
    } catch (error) {
      console.log("PAIRING ERROR:", error);

      setStatusStep("Verifying with cloud...");
      try {
        await new Promise((resolve) => setTimeout(resolve, 4000));

        const { data: verifiedHub, error: dbError } = await supabase
          .from("hubs")
          .select("serial_number")
          .eq("wifi_ssid", targetSSID)
          .eq("status", "online")
          .order("last_seen", { ascending: false })
          .limit(1)
          .single();

        if (verifiedHub && !dbError) {
          setIsPairing(false);
          navigation.navigate("HubConfig", {
            hubId: verifiedHub.serial_number,
          });
        } else {
          throw error;
        }
      } catch (cloudError) {
        setIsPairing(false);
        showAlert(
          "Connection Failed",
          `Could not reach Hub.\n\nDebug: ${error.message}\n\nTip: Ensure Mobile Data is OFF and you are connected to 'GridWatch-Setup'.`,
          "error",
        );
      }
    }
  };

  const handleOpenScanner = async () => {
    if (!permission) return;
    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setScanned(false);
    setIsScanning(true);
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setIsScanning(false);

    let raw = data.trim();
    let ssid = "";
    let password = "";

    const ssidMatch = raw.match(/S:(.*?)(?:;|$)/i);
    const passMatch = raw.match(/P:(.*?)(?:;|$)/i);

    if (ssidMatch) {
      ssid = ssidMatch[1];
      if (passMatch) password = passMatch[1];
    } else if (raw.includes(",")) {
      const parts = raw.split(",");
      if (parts.length >= 2) {
        ssid = parts[0].trim();
        password = parts[1].trim();
      }
    } else if (raw.includes(" ")) {
      const lastSpaceIndex = raw.lastIndexOf(" ");
      if (lastSpaceIndex > 0) {
        ssid = raw.substring(0, lastSpaceIndex).trim();
        password = raw.substring(lastSpaceIndex + 1).trim();
      }
    }

    if (ssid) {
      setWifiSSID(ssid);
      setWifiPass(password);
      handleStartPairing(ssid, password);
    } else {
      setWifiSSID(raw);
      showAlert("Notice", "Could not read full credentials. SSID set.");
    }
  };

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

      {}
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
                <TouchableOpacity onPress={handleOpenScanner} className="p-2.5">
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

      {}
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

      {}
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
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            <View
              style={StyleSheet.absoluteFill}
              className="justify-center items-center"
            >
              {}
              <View
                className="w-64 h-64 border-4 rounded-xl justify-center items-center relative"
                style={{ borderColor: theme.buttonPrimary }}
              >
                <View
                  className="w-[90%] h-[2px] opacity-70 shadow-lg"
                  style={{ backgroundColor: theme.buttonPrimary }}
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

      {}
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

      {}
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
