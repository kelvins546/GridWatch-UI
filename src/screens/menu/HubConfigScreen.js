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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

const PLACEHOLDER_DEVICE = "Select Device";
const PLACEHOLDER_HUB = "Select Location";

export default function HubConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();

  const { hubId } = route.params || { hubId: null };

  const [hubName, setHubName] = useState({
    selection: PLACEHOLDER_HUB,
    custom: "",
  });
  const [outlet1, setOutlet1] = useState({
    selection: PLACEHOLDER_DEVICE,
    custom: "",
  });
  const [outlet2, setOutlet2] = useState({
    selection: PLACEHOLDER_DEVICE,
    custom: "",
  });
  const [outlet3, setOutlet3] = useState({
    selection: PLACEHOLDER_DEVICE,
    custom: "",
  });
  const [outlet4, setOutlet4] = useState({
    selection: PLACEHOLDER_DEVICE,
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

  const getFinalName = (state) =>
    state.selection === "Others" ? state.custom.trim() : state.selection;

  const isValid = (state, placeholder) => {
    if (state.selection === placeholder) return false;
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
    if (!isValid(outlet1, PLACEHOLDER_DEVICE))
      return showAlert("Missing Info", "Please configure Outlet 1.");
    if (!isValid(outlet2, PLACEHOLDER_DEVICE))
      return showAlert("Missing Info", "Please configure Outlet 2.");
    if (!isValid(outlet3, PLACEHOLDER_DEVICE))
      return showAlert("Missing Info", "Please configure Outlet 3.");
    if (!isValid(outlet4, PLACEHOLDER_DEVICE))
      return showAlert("Missing Info", "Please configure Outlet 4.");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
          },
          { onConflict: "serial_number" }
        )
        .select()
        .single();

      if (hubError) throw hubError;

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
          { onConflict: "hub_id, outlet_number" }
        );

        if (deviceError) throw deviceError;
      }

      showAlert("Setup Complete", "Hub & Outlets Synced!", "success", () =>
        navigation.navigate("MainApp", { screen: "Home" })
      );
    } catch (error) {
      console.error("Setup Error:", error);
      showAlert("Error", "Could not save configuration: " + error.message);
    }
  };

  const getAlertColor = (type) => (type === "success" ? "#00ff99" : "#ff4444");
  const getAlertBg = (type) =>
    type === "success" ? "rgba(0, 255, 153, 0.1)" : "rgba(255, 68, 68, 0.1)";
  const getAlertBtnColors = (type) =>
    type === "success" ? ["#0055ff", "#00ff99"] : ["#333", "#444"];

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
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
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
          Configure Hub
        </Text>
        <View className="w-[50px]" />
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          <Text
            className="text-sm mb-5 leading-5"
            style={{ color: theme.textSecondary }}
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
              <MaterialIcons name="warning" size={20} color="#ffaa00" />
              <Text className="font-bold text-sm" style={{ color: "#ffaa00" }}>
                Important for Accuracy
              </Text>
            </View>
            <Text
              className="text-xs leading-5"
              style={{ color: theme.textSecondary }}
            >
              Ensure you plug the correct appliance into the matching physical
              outlet number on the Hub.
            </Text>
          </View>

          <Text
            className="text-base font-bold mb-5"
            style={{ color: theme.text }}
          >
            Outlet Devices
          </Text>

          <ConfigDropdown
            label="Outlet 1"
            options={APPLIANCE_OPTIONS}
            state={outlet1}
            setState={setOutlet1}
            placeholder={PLACEHOLDER_DEVICE}
            theme={theme}
          />
          <ConfigDropdown
            label="Outlet 2"
            options={APPLIANCE_OPTIONS}
            state={outlet2}
            setState={setOutlet2}
            placeholder={PLACEHOLDER_DEVICE}
            theme={theme}
          />
          <ConfigDropdown
            label="Outlet 3"
            options={APPLIANCE_OPTIONS}
            state={outlet3}
            setState={setOutlet3}
            placeholder={PLACEHOLDER_DEVICE}
            theme={theme}
          />
          <ConfigDropdown
            label="Outlet 4"
            options={APPLIANCE_OPTIONS}
            state={outlet4}
            setState={setOutlet4}
            placeholder={PLACEHOLDER_DEVICE}
            theme={theme}
          />

          <View className="h-10" />
        </View>
      </ScrollView>

      <View className="p-6">
        <TouchableOpacity onPress={handleFinishSetup}>
          <LinearGradient
            colors={["#0055ff", "#00ff99"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="p-4 rounded-xl items-center"
          >
            <Text className="font-bold text-base text-black uppercase">
              Finish Setup
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={alertConfig.visible} animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View
            className="w-3/4 p-6 rounded-3xl border items-center shadow-lg"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View
              className="w-12 h-12 rounded-full justify-center items-center mb-4"
              style={{ backgroundColor: getAlertBg(alertConfig.type) }}
            >
              <MaterialIcons
                name={
                  alertConfig.type === "success" ? "check" : "priority-high"
                }
                size={28}
                color={getAlertColor(alertConfig.type)}
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
                colors={getAlertBtnColors(alertConfig.type)}
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

function ConfigDropdown({
  label,
  options,
  state,
  setState,
  placeholder,
  theme,
}) {
  const [isModalVisible, setModalVisible] = useState(false);
  const handleSelect = (option) => {
    setState((prev) => ({ ...prev, selection: option }));
    setModalVisible(false);
  };
  const displayColor =
    state.selection === placeholder ? theme.textSecondary : theme.text;

  return (
    <View className="mb-5">
      <Text
        className="text-xs font-bold uppercase mb-2"
        style={{ color: theme.textSecondary }}
      >
        {label} <Text style={{ color: "#ff4444" }}>*</Text>
      </Text>
      <TouchableOpacity
        className="flex-row justify-between items-center border rounded-xl p-4"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-base" style={{ color: displayColor }}>
          {state.selection}
        </Text>
        <MaterialIcons
          name="arrow-drop-down"
          size={24}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
      {state.selection === "Others" && (
        <TextInput
          className="mt-3 border rounded-xl p-4 text-base"
          style={{
            color: theme.text,
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
          value={state.custom}
          onChangeText={(text) =>
            setState((prev) => ({ ...prev, custom: text }))
          }
          placeholder="Type custom name..."
          placeholderTextColor={theme.textSecondary}
          autoFocus
        />
      )}
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
              className="text-base font-bold mb-4"
              style={{ color: theme.text }}
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
                    className="text-base"
                    style={{
                      color:
                        item === state.selection ? theme.primary : theme.text,
                      fontWeight: item === state.selection ? "700" : "400",
                    }}
                  >
                    {item}
                  </Text>
                  {item === state.selection && (
                    <MaterialIcons
                      name="check"
                      size={18}
                      color={theme.primary}
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
