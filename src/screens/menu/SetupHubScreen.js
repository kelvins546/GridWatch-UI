import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function SetupHubScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [isPairing, setIsPairing] = useState(false);
  const [statusStep, setStatusStep] = useState("");

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error",
    onPress: null,
  });

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

  const handleStartPairing = async () => {
    if (!wifiSSID || !wifiPass) {
      showAlert(
        "Missing Info",
        "Please enter the Home Wi-Fi details you want the Hub to use."
      );
      return;
    }

    setIsPairing(true);

    try {
      setStatusStep("Connecting to Hub...");
      await new Promise((r) => setTimeout(r, 1500));

      setStatusStep("Sending Wi-Fi credentials to Hub...");
      await new Promise((r) => setTimeout(r, 2000));

      setStatusStep("Hub is verifying connection...");
      await new Promise((r) => setTimeout(r, 3000));

      // Success!
      const mockHubID = "hub-123-uuid";
      setIsPairing(false);

      navigation.navigate("HubConfig", { hubId: mockHubID });
    } catch (error) {
      setIsPairing(false);
      showAlert(
        "Pairing Failed",
        "Could not talk to the Hub. Please ensure you are connected to 'GridWatch-Setup'."
      );
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <StatusBar barStyle={theme.statusBarStyle} />

      <View className="flex-row justify-between items-center p-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: theme.text }}>
          Connect Hub
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          <Text
            className="text-sm font-bold uppercase mb-2.5 tracking-wide"
            style={{ color: theme.text }}
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
                  Your phone needs to talk directly to the Hub to configure it.
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
            className="text-sm font-bold uppercase mt-5 mb-2.5 tracking-wide"
            style={{ color: theme.text }}
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
            <TextInput
              className="border rounded-xl p-4 text-base"
              style={{
                color: theme.text,
                borderColor: theme.cardBorder,
                backgroundColor: theme.card,
              }}
              placeholder="e.g. PLDT_Home_FIBR"
              placeholderTextColor={theme.textSecondary}
              value={wifiSSID}
              onChangeText={setWifiSSID}
            />
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
        <TouchableOpacity onPress={handleStartPairing}>
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
            className="w-3/4 p-6 rounded-3xl border items-center shadow-lg"
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
                    : "rgba(255, 68, 68, 0.1)",
              }}
            >
              <MaterialIcons
                name={
                  alertConfig.type === "success" ? "check" : "priority-high"
                }
                size={28}
                color={alertConfig.type === "success" ? "#00ff99" : "#ff4444"}
              />
            </View>

            <Text
              className="text-lg font-bold mb-2 text-center"
              style={{ color: theme.text }}
            >
              {alertConfig.title}
            </Text>

            <Text
              className="text-sm text-center mb-5 leading-5"
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
