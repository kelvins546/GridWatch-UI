import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

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

const PLACEHOLDER_HUB = "Select Location";

export default function HubConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, fontScale } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const { hubId } = route.params || { hubId: "demo_hub_123" };

  const [isLoading, setIsLoading] = useState(false);

  const [hubName, setHubName] = useState({
    selection: PLACEHOLDER_HUB,
    custom: "",
  });

  const [outlet1, setOutlet1] = useState({
    selection: "Unused",
    custom: "",
  });
  const [outlet2, setOutlet2] = useState({
    selection: "Unused",
    custom: "",
  });
  const [outlet3, setOutlet3] = useState({
    selection: "Unused",
    custom: "",
  });
  const [outlet4, setOutlet4] = useState({
    selection: "Unused",
    custom: "",
  });

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

  const isValid = (state, placeholder) => {
    if (placeholder && state.selection === placeholder) return false;

    if (state.selection === "Others" && !state.custom.trim()) return false;
    return true;
  };

  const handleFinishSetup = async () => {
    if (!hubId) {
      return showAlert(
        "Error",
        "No Hub Serial Number found. Please scan again."
      );
    }

    if (!isValid(hubName, PLACEHOLDER_HUB))
      return showAlert("Missing Info", "Please select or name your Hub.");

    if (!isValid(outlet1))
      return showAlert("Missing Info", "Please check Outlet 1 configuration.");
    if (!isValid(outlet2))
      return showAlert("Missing Info", "Please check Outlet 2 configuration.");
    if (!isValid(outlet3))
      return showAlert("Missing Info", "Please check Outlet 3 configuration.");
    if (!isValid(outlet4))
      return showAlert("Missing Info", "Please check Outlet 4 configuration.");

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      showAlert("Setup Complete", "Hub & Outlets Synced!", "success", () =>
        navigation.navigate("MainApp", { screen: "Home" })
      );
    }, 2000);
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

      {/* --- FIXED: LOADING MODAL (COVERS FULL SCREEN) --- */}
      <Modal transparent visible={isLoading} animationType="fade">
        <View
          style={{
            flex: 1,
            // Keeping subtle background dim
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Color: #B0B0B0, Size: Large */}
          <ActivityIndicator size="large" color="#B0B0B0" />
          <Text
            style={{
              color: "#B0B0B0", // Matching Text Color
              marginTop: 15,
              fontWeight: "500", // Medium Weight
              fontSize: scaledSize(12),
              letterSpacing: 0.5,
            }}
          >
            Finalizing Setup...
          </Text>
        </View>
      </Modal>

      {/* --- UPDATED HEADER (Balanced Layout & Correct Sizes) --- */}
      <View
        className="flex-row items-center justify-between px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
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

        {/* Placeholder View for alignment balance */}
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
              theme={theme}
              scaledSize={scaledSize}
            />
            <ConfigDropdown
              label="Outlet 2"
              options={APPLIANCE_OPTIONS}
              state={outlet2}
              setState={setOutlet2}
              theme={theme}
              scaledSize={scaledSize}
            />
            <ConfigDropdown
              label="Outlet 3"
              options={APPLIANCE_OPTIONS}
              state={outlet3}
              setState={setOutlet3}
              theme={theme}
              scaledSize={scaledSize}
            />
            <ConfigDropdown
              label="Outlet 4"
              options={APPLIANCE_OPTIONS}
              state={outlet4}
              setState={setOutlet4}
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

      {/* ALERT MODAL */}
      <Modal transparent visible={alertConfig.visible} animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center p-6">
          <View
            className="w-[85%] max-w-[320px] p-5 rounded-2xl border items-center shadow-lg"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <Text
              className="font-bold mb-2 text-center"
              style={{ color: theme.text, fontSize: scaledSize(18) }}
            >
              {alertConfig.title}
            </Text>

            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(13) }}
            >
              {alertConfig.message}
            </Text>

            <TouchableOpacity onPress={closeAlert} className="w-full">
              <View
                className="py-3 rounded-xl w-full items-center"
                style={{
                  backgroundColor: theme.buttonPrimary,
                }}
              >
                <Text
                  className="font-bold tracking-widest uppercase"
                  style={{
                    color: "#fff",
                    fontSize: scaledSize(12),
                  }}
                >
                  {alertConfig.type === "success" ? "CONTINUE" : "OKAY"}
                </Text>
              </View>
            </TouchableOpacity>
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

      {/* Container for Input/Select */}
      <View
        className="flex-row items-center border rounded-xl"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        }}
      >
        {isCustom ? (
          <TextInput
            className="flex-1 p-4"
            style={{
              color: theme.text,
              fontSize: scaledSize(16),
            }}
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
            <Text
              style={{
                color: displayColor,
                fontSize: scaledSize(16),
              }}
            >
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
