import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  BackHandler,
  Alert, // Added Alert for user feedback
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

const APPLIANCE_OPTIONS = [
  "Air Conditioner",
  "Television",
  "Refrigerator",
  "Electric Fan",
  "Lights / Lamp",
  "Desktop Computer",
  "Wi-Fi Router",
  "Game Console",
  "Microwave",
  "Washing Machine",
  "Unused",
  "Others",
];

const HUB_LOCATIONS = [
  "Living Room",
  "Master Bedroom",
  "Kitchen",
  "Dining Room",
  "Home Office",
  "Guest Room",
  "Garage",
  "Others",
];

const INVALID_SELECTION = "Select Device";
const PLACEHOLDER_HUB = "Select Location";

export default function HubConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, fontScale } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const { hubId } = route.params || { hubId: null };

  const [isLoading, setIsLoading] = useState(false);

  // --- EXIT & RESET STATES ---
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [hubName, setHubName] = useState({
    selection: PLACEHOLDER_HUB,
    custom: "",
  });

  const [outlet1, setOutlet1] = useState({ selection: "Unused", custom: "" });
  const [outlet2, setOutlet2] = useState({ selection: "Unused", custom: "" });
  const [outlet3, setOutlet3] = useState({ selection: "Unused", custom: "" });
  const [outlet4, setOutlet4] = useState({ selection: "Unused", custom: "" });

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error",
    onPress: null,
  });

  // ============================================================
  // 1. HARDWARE BACK BUTTON INTERCEPTOR
  // ============================================================
  useEffect(() => {
    const onBackPress = () => {
      setExitModalVisible(true);
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () =>
      BackHandler.removeEventListener("hardwareBackPress", onBackPress);
  }, []);

  // ============================================================
  // 2. ROBUST RESET LOGIC (With Live IP Fetch)
  // ============================================================
  const handleResetAndExit = async () => {
    setIsResetting(true);

    // 1. Get the absolute latest IP from DB (in case it just connected)
    let freshIP = null;
    if (hubId) {
      const { data } = await supabase
        .from("hubs")
        .select("ip_address")
        .eq("serial_number", hubId)
        .single();
      if (data?.ip_address) freshIP = data.ip_address;
    }

    // 2. Build Targets
    const targets = [];
    if (freshIP) targets.push(`http://${freshIP}/reset`); // Try Home Network
    targets.push("http://192.168.4.1/reset"); // Try Hotspot (Fallback)

    let resetSuccess = false;

    // 3. Attempt Reset
    for (const url of targets) {
      try {
        console.log(`Attempting reset at: ${url}`);
        const controller = new AbortController();
        // Increased timeout to 5s to be safe
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
          method: "POST",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log("Reset command success at " + url);
          resetSuccess = true;
          break; // Stop if successful
        }
      } catch (e) {
        console.log(`Failed to reach ${url}:`, e.message);
      }
    }

    // 4. Handle Result
    if (resetSuccess) {
      // Best Case: Hub accepted reset. We wipe DB and exit.
      await performCloudUnlink();
      setIsResetting(false);
      setExitModalVisible(false);
      navigation.navigate("SetupHub");
    } else {
      // Worst Case: Hub is unreachable.
      setIsResetting(false);
      // Ask user to Force Exit since software reset failed
      Alert.alert(
        "Connection Failed",
        "Could not reach the Hub to reset Wi-Fi. It might be on a different network.\n\nDo you want to force exit? (You must reset the Hub manually using the physical button).",
        [
          { text: "Retry", style: "cancel" },
          {
            text: "Force Exit",
            style: "destructive",
            onPress: async () => {
              await performCloudUnlink();
              setExitModalVisible(false);
              navigation.navigate("SetupHub");
            },
          },
        ],
      );
    }
  };

  const performCloudUnlink = async () => {
    if (!hubId) return;
    try {
      console.log("Unlinking from Database...");
      await supabase.from("hubs").delete().eq("serial_number", hubId);
    } catch (e) {
      console.log("DB Cleanup failed:", e);
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

  const getFinalName = (state) =>
    state.selection === "Others" || state.selection === "Unused"
      ? state.custom.trim() || state.selection
      : state.selection;

  const isValid = (state, placeholder) => {
    if (placeholder && state.selection === placeholder) return false;
    if (state.selection === "Others" && !state.custom.trim()) return false;
    return true;
  };

  const handleFinishSetup = async () => {
    if (!hubId) return showAlert("Error", "No Hub Serial Number found.");
    if (!isValid(hubName, PLACEHOLDER_HUB))
      return showAlert("Missing Info", "Please select or name your Hub.");
    if (!isValid(outlet1, INVALID_SELECTION))
      return showAlert("Missing Info", "Check Outlet 1.");
    if (!isValid(outlet2, INVALID_SELECTION))
      return showAlert("Missing Info", "Check Outlet 2.");
    if (!isValid(outlet3, INVALID_SELECTION))
      return showAlert("Missing Info", "Check Outlet 3.");
    if (!isValid(outlet4, INVALID_SELECTION))
      return showAlert("Missing Info", "Check Outlet 4.");

    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) throw new Error("No user logged in");

      const { data: hubData, error: hubError } = await supabase
        .from("hubs")
        .upsert(
          {
            user_id: user.id,
            serial_number: hubId,
            name: getFinalName(hubName),
            status: "online",
            model: "GridWatch-V1",
            last_seen: new Date().toISOString(),
          },
          { onConflict: "serial_number" },
        )
        .select()
        .single();

      if (hubError) {
        if (
          hubError.message &&
          (hubError.message.includes("Network request failed") ||
            hubError.code === "PGRST000")
        ) {
          throw new Error("No Internet. Please disconnect from Hub Wi-Fi.");
        }
        throw hubError;
      }

      const realHubUUID = hubData.id;

      const outlets = [
        { data: outlet1, num: 1 },
        { data: outlet2, num: 2 },
        { data: outlet3, num: 3 },
        { data: outlet4, num: 4 },
      ];

      for (const outlet of outlets) {
        const { error: deviceError } = await supabase.from("devices").upsert(
          {
            hub_id: realHubUUID,
            user_id: user.id,
            name: getFinalName(outlet.data),
            type: outlet.data.selection,
            outlet_number: outlet.num,
            status: "off",
            is_monitored: true,
          },
          { onConflict: "hub_id, outlet_number" },
        );

        if (deviceError) throw deviceError;
      }

      setIsLoading(false);
      showAlert("Setup Complete", "Hub & Outlets Synced!", "success", () =>
        navigation.navigate("ProviderSetup", { fromOnboarding: true }),
      );
    } catch (error) {
      console.error("Setup Error:", error);
      setIsLoading(false);
      showAlert("Error", "Could not save: " + error.message);
    }
  };

  // --- STYLES ---
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

      <Modal transparent visible={isLoading} animationType="fade">
        <View style={styles.modalOverlay}>
          <ActivityIndicator size="large" color="#B0B0B0" />
          <Text
            style={{
              color: "#B0B0B0",
              marginTop: 15,
              fontWeight: "500",
              fontSize: scaledSize(12),
              letterSpacing: 0.5,
            }}
          >
            Finalizing Setup...
          </Text>
        </View>
      </Modal>

      <View
        className="flex-row items-center justify-between px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity onPress={() => setExitModalVisible(true)}>
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
          Configure Hub
        </Text>

        <View style={{ width: scaledSize(20) }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="p-6">
            <Text
              className="mb-5 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(14) }}
            >
              Give your hub a name and identify the devices plugged into each
              outlet.
            </Text>

            <ConfigDropdown
              label="Hub Location / Name"
              options={HUB_LOCATIONS}
              state={hubName}
              setState={setHubName}
              placeholder={PLACEHOLDER_HUB}
              theme={theme}
              scaledSize={scaledSize}
            />

            <View
              className="border-t border-dashed mb-5"
              style={{ borderColor: theme.cardBorder }}
            />

            <View
              className="p-4 rounded-xl border mb-8"
              style={{
                backgroundColor: "rgba(255, 170, 0, 0.1)",
                borderColor: "#ffaa00",
              }}
            >
              <View className="flex-row gap-2.5 mb-1.5 items-center">
                <MaterialIcons
                  name="warning"
                  size={scaledSize(20)}
                  color="#ffaa00"
                />
                <Text
                  className="font-bold"
                  style={{ color: "#ffaa00", fontSize: scaledSize(14) }}
                >
                  Important for Accuracy
                </Text>
              </View>
              <Text
                className="leading-5"
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(12),
                }}
              >
                Ensure you plug the correct appliance into the matching physical
                outlet number on the Hub.
              </Text>
            </View>

            <Text
              className="font-bold mb-5"
              style={{ color: theme.text, fontSize: scaledSize(16) }}
            >
              Outlet Devices
            </Text>

            <ConfigDropdown
              label="Outlet 1"
              options={APPLIANCE_OPTIONS}
              state={outlet1}
              setState={setOutlet1}
              placeholder={INVALID_SELECTION}
              theme={theme}
              scaledSize={scaledSize}
            />
            <ConfigDropdown
              label="Outlet 2"
              options={APPLIANCE_OPTIONS}
              state={outlet2}
              setState={setOutlet2}
              placeholder={INVALID_SELECTION}
              theme={theme}
              scaledSize={scaledSize}
            />
            <ConfigDropdown
              label="Outlet 3"
              options={APPLIANCE_OPTIONS}
              state={outlet3}
              setState={setOutlet3}
              placeholder={INVALID_SELECTION}
              theme={theme}
              scaledSize={scaledSize}
            />
            <ConfigDropdown
              label="Outlet 4"
              options={APPLIANCE_OPTIONS}
              state={outlet4}
              setState={setOutlet4}
              placeholder={INVALID_SELECTION}
              theme={theme}
              scaledSize={scaledSize}
            />

            <View className="h-10" />
          </View>
        </ScrollView>

        <View className="p-6">
          <TouchableOpacity onPress={handleFinishSetup}>
            <View
              className="p-4 rounded-xl items-center"
              style={{ backgroundColor: theme.buttonPrimary }}
            >
              <Text
                className="font-bold uppercase"
                style={{ color: "#fff", fontSize: scaledSize(16) }}
              >
                Finish Setup
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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

      {/* --- EXIT WARNING MODAL (NO ICON) --- */}
      <Modal transparent visible={exitModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Setup Not Finished</Text>
            <Text style={styles.modalBody}>
              Your Hub is likely already connected to Wi-Fi. If you exit now,
              you will need to provision it again.
              {"\n\n"}
              <Text style={{ fontStyle: "italic", fontSize: scaledSize(11) }}>
                We will try to reset the Hub automatically. If that fails, hold
                the Hub's physical button for 5s to reset.
              </Text>
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setExitModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Resume
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleResetAndExit}
                disabled={isResetting}
              >
                {isResetting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                    Reset & Exit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ConfigDropdown({
  label,
  options,
  state,
  setState,
  placeholder,
  theme,
  scaledSize,
}) {
  const [isModalVisible, setModalVisible] = useState(false);

  const handleSelect = (option) => {
    setState((prev) => ({
      ...prev,
      selection: option,
      custom: option === "Others" ? prev.custom : "",
    }));
    setModalVisible(false);
  };

  const isCustom = state.selection === "Others";
  const displayColor =
    state.selection === placeholder ? theme.textSecondary : theme.text;

  return (
    <View className="mb-5">
      <Text
        className="font-bold uppercase mb-2"
        style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
      >
        {label} <Text style={{ color: "#ff4444" }}>*</Text>
      </Text>

      <View
        className="flex-row items-center border rounded-xl"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        {isCustom ? (
          <TextInput
            className="flex-1 p-4"
            style={{ color: theme.text, fontSize: scaledSize(16) }}
            value={state.custom}
            onChangeText={(text) =>
              setState((prev) => ({ ...prev, custom: text }))
            }
            placeholder="Type name..."
            placeholderTextColor={theme.textSecondary}
            autoFocus
          />
        ) : (
          <TouchableOpacity
            className="flex-1 p-4"
            onPress={() => setModalVisible(true)}
          >
            <Text style={{ color: displayColor, fontSize: scaledSize(16) }}>
              {state.selection}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity className="p-4" onPress={() => setModalVisible(true)}>
          <MaterialIcons
            name="arrow-drop-down"
            size={scaledSize(24)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <Modal transparent visible={isModalVisible} animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/60 justify-center items-center"
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            className="w-4/5 max-h-[60%] rounded-2xl p-5 shadow-lg"
            style={{ backgroundColor: theme.card }}
          >
            <Text
              className="font-bold mb-4"
              style={{ color: theme.text, fontSize: scaledSize(16) }}
            >
              Select Option
            </Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="py-4 border-b flex-row justify-between items-center"
                  style={{ borderBottomColor: theme.cardBorder }}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={{
                      color:
                        item === state.selection
                          ? theme.buttonPrimary
                          : theme.text,
                      fontWeight: item === state.selection ? "700" : "400",
                      fontSize: scaledSize(16),
                    }}
                  >
                    {item}
                  </Text>
                  {item === state.selection && (
                    <MaterialIcons
                      name="check"
                      size={scaledSize(18)}
                      color={theme.buttonPrimary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
