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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { CameraView, useCameraPermissions } from "expo-camera";
import { supabase } from "../../lib/supabase";

export default function SetupHubScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

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

  // --- 🔴 FIXED BACK BUTTON LOGIC ---
  const handleBack = () => {
    if (navigation.canGoBack()) {
      // Normal behavior for existing users coming from Menu
      navigation.goBack();
    } else {
      // For New Users who landed here directly:
      // "Replace" the current screen with MainApp (Home) so they can access the dashboard.
      navigation.replace("MainApp");
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

  const openWifiSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("App-Prefs:root=WIFI");
    } else {
      Linking.sendIntent("android.settings.WIFI_SETTINGS");
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
            encodeURIComponent(key) + "=" + encodeURIComponent(details[key])
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
          `Could not reach Hub.\n\nDebug: ${error.message}\n\nTip: Ensure Mobile Data is OFF and you clicked 'Keep Connection'.`,
          "error"
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
      handleStartPairing(ssid, password);
    } else {
      setWifiSSID(raw);
      showAlert("Notice", "Could not read QR. Please check.");
    }
  };

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

      <View
        className="flex-row items-center justify-between px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity
          className="flex-row items-center"
          onPress={handleBack} // <--- USING THE FIXED BACK HANDLER
        >
          <MaterialIcons
            name="arrow-back" // <--- RESTORED ICON
            size={18}
            color={theme.textSecondary}
          />
          <Text
            className="text-sm font-medium ml-1"
            style={{ color: theme.textSecondary }}
          >
            Back
          </Text>
        </TouchableOpacity>
        <Text className="text-base font-bold" style={{ color: theme.text }}>
          Connect Hub
        </Text>
        <View className="w-[50px]" />
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
              className="text-[11px] font-bold uppercase tracking-widest mb-3"
              style={{ color: theme.textSecondary }}
            >
              Step 1: Connect to Device
            </Text>

            <View
              className="p-5 rounded-2xl border mb-5"
              style={{
                backgroundColor: "rgba(0, 85, 255, 0.08)",
                borderColor: "rgba(0, 85, 255, 0.3)",
              }}
            >
              <View className="flex-row gap-3 mb-2.5">
                <View className="w-9 h-9 rounded-full bg-[#0055ff] justify-center items-center">
                  <MaterialIcons name="wifi-tethering" size={20} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text
                    className="font-bold mb-1 text-base"
                    style={{ color: theme.text }}
                  >
                    Connect Phone to Hub
                  </Text>
                  <Text
                    className="text-xs leading-5"
                    style={{ color: theme.textSecondary }}
                  >
                    Your phone needs to talk directly to the Hub to configure
                    it.
                  </Text>
                </View>
              </View>

              <View
                className="p-4 rounded-xl my-4"
                style={{ backgroundColor: theme.card }}
              >
                <Text
                  className="text-xs mb-2 leading-5"
                  style={{ color: theme.textSecondary }}
                >
                  1. Tap the button below to open Settings.
                </Text>
                <Text
                  className="text-xs mb-2 leading-5"
                  style={{ color: theme.textSecondary }}
                >
                  2. Connect to{" "}
                  <Text className="font-bold text-[#0055ff]">
                    GridWatch-Setup
                  </Text>
                  .
                </Text>
                <Text
                  className="text-xs leading-5"
                  style={{ color: theme.textSecondary }}
                >
                  3. Return to this app.
                </Text>
              </View>

              <TouchableOpacity
                onPress={openWifiSettings}
                className="border border-[#0055ff] rounded-xl py-3 items-center"
              >
                <Text className="text-[#0055ff] font-semibold text-sm">
                  Open Wi-Fi Settings
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              className="text-[11px] font-bold uppercase tracking-widest mt-5 mb-3"
              style={{ color: theme.textSecondary }}
            >
              Step 2: Configure Network
            </Text>
            <Text
              className="text-xs mb-5 leading-5"
              style={{ color: theme.textSecondary }}
            >
              Enter the details of your **Home Wi-Fi**. We will send this to the
              Hub so it can get online.
            </Text>

            <View className="mb-5">
              <Text
                className="text-xs font-semibold mb-2"
                style={{ color: theme.text }}
              >
                Home Wi-Fi Name (SSID)
              </Text>
              <View
                className="flex-row border rounded-xl items-center pr-1.5"
                style={{
                  borderColor: theme.cardBorder,
                  backgroundColor: theme.card,
                }}
              >
                <TextInput
                  className="flex-1 p-4 text-base h-full border-0"
                  style={{ color: theme.text }}
                  placeholder="e.g. PLDT_Home_FIBR"
                  placeholderTextColor={theme.textSecondary}
                  value={wifiSSID}
                  onChangeText={setWifiSSID}
                />
                <TouchableOpacity onPress={handleOpenScanner} className="p-2.5">
                  <MaterialIcons
                    name="qr-code-scanner"
                    size={22}
                    color="#0055ff"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-5">
              <Text
                className="text-xs font-semibold mb-2"
                style={{ color: theme.text }}
              >
                Home Wi-Fi Password
              </Text>
              <View
                className="flex-row border rounded-xl items-center pr-1.5"
                style={{
                  borderColor: theme.cardBorder,
                  backgroundColor: theme.card,
                }}
              >
                <TextInput
                  className="flex-1 p-4 text-base h-full border-0"
                  style={{ color: theme.text }}
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
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="h-10" />
          </View>
        </ScrollView>

        <View className="p-6">
          <TouchableOpacity onPress={() => handleStartPairing()}>
            <LinearGradient
              colors={["#0055ff", "#00ff99"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4 rounded-xl items-center"
            >
              <Text className="font-bold text-base text-black">
                Send Configuration to Hub
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={isScanning} animationType="slide">
        <SafeAreaView className="flex-1 bg-black">
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />

          <View className="flex-1 justify-between p-5">
            <TouchableOpacity
              onPress={() => setIsScanning(false)}
              className="self-end p-2 bg-black/50 rounded-full"
            >
              <MaterialIcons name="close" size={30} color="white" />
            </TouchableOpacity>

            <View className="items-center mb-10">
              <Text className="text-white font-bold text-lg mb-2">
                Scan Wi-Fi QR Code
              </Text>
              <View className="w-64 h-64 border-2 border-[#00ff99] rounded-xl bg-transparent" />
              <Text className="text-gray-300 text-sm mt-4 text-center">
                Point at the QR code on your router or phone.
              </Text>
            </View>
            <View />
          </View>
        </SafeAreaView>
      </Modal>

      <Modal transparent visible={isPairing}>
        <View className="flex-1 justify-center items-center bg-black/80">
          <View
            className="p-8 rounded-2xl items-center w-4/5"
            style={{ backgroundColor: theme.card }}
          >
            <ActivityIndicator size="large" color="#00ff99" />
            <Text
              className="mt-5 text-base font-semibold"
              style={{ color: theme.text }}
            >
              {statusStep}
            </Text>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={alertConfig.visible} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60">
          <View
            className="w-[280px] p-6 rounded-[20px] border items-center shadow-lg"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View
              className="w-12 h-12 rounded-full justify-center items-center mb-4"
              style={{
                backgroundColor:
                  alertConfig.type === "success"
                    ? "rgba(0, 255, 153, 0.1)"
                    : alertConfig.type === "warning"
                    ? "rgba(255, 165, 0, 0.1)"
                    : "rgba(255, 68, 68, 0.1)",
              }}
            >
              <MaterialIcons
                name={
                  alertConfig.type === "success"
                    ? "check"
                    : alertConfig.type === "warning"
                    ? "wifi-off"
                    : "priority-high"
                }
                size={28}
                color={
                  alertConfig.type === "success"
                    ? "#00ff99"
                    : alertConfig.type === "warning"
                    ? "#FFA500"
                    : "#ff4444"
                }
              />
            </View>

            <Text
              className="text-lg font-bold mb-2 text-center"
              style={{ color: theme.text }}
            >
              {alertConfig.title}
            </Text>

            <Text
              className="text-[13px] text-center mb-6 leading-5"
              style={{ color: theme.textSecondary }}
            >
              {alertConfig.message}
            </Text>

            <TouchableOpacity onPress={closeAlert} className="w-full">
              <LinearGradient
                colors={
                  alertConfig.type === "success"
                    ? ["#0055ff", "#00ff99"]
                    : ["#333", "#444"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-3 rounded-xl w-full items-center"
              >
                <Text
                  className="font-bold text-xs tracking-widest uppercase"
                  style={{
                    color: alertConfig.type === "success" ? "#000" : "#fff",
                  }}
                >
                  {alertConfig.type === "success" ? "CONTINUE" : "OKAY"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
