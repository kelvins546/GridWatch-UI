import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Switch,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function DeviceControlScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();

  const { deviceName, status } = route.params || {
    deviceName: "Device",
    status: "ON",
  };
  const initialPower = !status?.includes("Standby") && !status?.includes("OFF");
  const [isPowered, setIsPowered] = useState(initialPower);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const [scheduleTime, setScheduleTime] = useState("22:00");
  const [selectedDays, setSelectedDays] = useState([
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]);
  const [isActionOn, setIsActionOn] = useState(false); // false = Turn OFF, true = Turn ON

  const heroColors = isPowered
    ? ["#0055ff", theme.background]
    : ["#2c3e50", theme.background];

  const confirmToggle = () => {
    setIsPowered(!isPowered);
    setShowConfirm(false);
  };

  const toggleDay = (index) => {
    const newDays = [...selectedDays];
    newDays[index] = !newDays[index];
    setSelectedDays(newDays);
  };

  const saveSchedule = () => {
    setShowSchedule(false);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar barStyle="light-content" />

      <View className="absolute top-12 left-6 right-6 z-10 flex-row justify-between">
        <TouchableOpacity
          className="flex-row items-center gap-1.5"
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={18} color="#fff" />
          <Text className="text-white text-sm font-medium">Back</Text>
        </TouchableOpacity>
        <MaterialIcons
          name="settings"
          size={24}
          color="rgba(255,255,255,0.8)"
        />
      </View>

      <LinearGradient colors={heroColors} className="pt-24 pb-8 items-center">
        <View className="w-20 h-20 rounded-full bg-black/20 items-center justify-center border-2 border-white/20 mb-4">
          <MaterialIcons
            name={isPowered ? "ac-unit" : "power-off"}
            size={40}
            color="#fff"
          />
        </View>
        <Text className="text-2xl font-extrabold text-white mb-1.5">
          {isPowered ? "Power ON" : "Standby Mode"}
        </Text>
        <Text className="text-sm text-white/80">
          {deviceName} is {isPowered ? "running" : "idle"}
        </Text>
      </LinearGradient>

      <ScrollView>
        <View className="p-6">
          <View
            className="p-5 rounded-3xl border mb-4"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <DetailRow
              label="Current Load"
              value={isPowered ? "1,456 Watts" : "0 Watts"}
              theme={theme}
            />
            <DetailRow label="Voltage" value="220.1 V" theme={theme} />
            <DetailRow
              label="Cost / Hour"
              value={isPowered ? "₱ 18.20" : "₱ 0.00"}
              theme={theme}
            />
          </View>

          <View className="items-center my-8">
            <TouchableOpacity
              className={`w-[90px] h-[90px] rounded-full items-center justify-center ${
                isPowered
                  ? "bg-[#00ff99] border-0 shadow-lg shadow-[#00ff99]"
                  : "bg-[#333] border-2 border-[#444]"
              }`}
              onPress={() => setShowConfirm(true)}
              activeOpacity={0.9}
            >
              <MaterialIcons
                name="power-settings-new"
                size={36}
                color={isPowered ? "#000" : "#666"}
              />
            </TouchableOpacity>
            <Text
              className="mt-4 text-xs font-bold uppercase tracking-widest"
              style={{ color: theme.textSecondary }}
            >
              {isPowered ? "Tap to Cut Power" : "Tap to Restore Power"}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xs font-bold uppercase tracking-widest text-[#888]">
              UPCOMING SCHEDULE
            </Text>
            <TouchableOpacity onPress={() => setShowSchedule(true)}>
              <Text className="text-xs font-semibold text-[#00ff99]">Edit</Text>
            </TouchableOpacity>
          </View>

          <View
            className="flex-row items-center justify-between p-4 rounded-xl border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View>
              <Text
                className="text-base font-bold"
                style={{ color: theme.text }}
              >
                {scheduleTime}
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{ color: theme.textSecondary }}
              >
                {isActionOn ? "Auto-ON" : "Auto-OFF"} • Daily
              </Text>
            </View>
            <Switch
              value={true}
              trackColor={{ true: "#00ff99" }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>

      {/* CONFIRM MODAL */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center">
          <View
            // CHANGED: Fixed width to 300px and reduced padding to p-6 (24px)
            className="w-[300px] p-6 rounded-3xl items-center border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <MaterialIcons
              name={isPowered ? "power-off" : "power"}
              size={48}
              color={isPowered ? "#ff4444" : "#00ff99"}
              style={{ marginBottom: 15 }}
            />
            <Text
              className="text-lg font-bold mb-2.5"
              style={{ color: theme.text }}
            >
              {isPowered ? "Turn Off Device?" : "Restore Power?"}
            </Text>
            <Text
              className="text-xs text-center mb-6 leading-5"
              style={{ color: theme.textSecondary }}
            >
              {isPowered
                ? "This will physically cut power to the outlet. The device will enter standby mode."
                : "This will reactivate the outlet relay. Ensure appliance is safe to turn on."}
            </Text>
            <View className="flex-row gap-2.5 w-full">
              <TouchableOpacity
                className="flex-1 p-3 rounded-lg border items-center"
                style={{ borderColor: theme.cardBorder }}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 p-3 rounded-lg border items-center"
                style={{
                  backgroundColor: isPowered ? "#ff4444" : "#00ff99",
                  borderColor: isPowered ? "#ff4444" : "#00ff99",
                }}
                onPress={confirmToggle}
              >
                <Text
                  className="font-bold"
                  style={{ color: isPowered ? "#fff" : "#000" }}
                >
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SCHEDULE MODAL */}
      <Modal visible={showSchedule} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-center items-center">
          <View
            className="w-[300px] p-6 rounded-3xl items-center border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <Text
              className="text-lg font-bold mb-5"
              style={{ color: theme.text }}
            >
              Edit Schedule
            </Text>

            <View className="mb-6 items-center">
              <TextInput
                className="text-3xl font-bold py-2.5 px-8 rounded-xl border text-center min-w-[140px]"
                style={{
                  color: theme.text,
                  borderColor: theme.cardBorder,
                  backgroundColor: theme.background,
                }}
                value={scheduleTime}
                onChangeText={setScheduleTime}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View className="flex-row justify-between w-full mb-6">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleDay(index)}
                  className="w-8 h-8 rounded-full justify-center items-center"
                  style={{
                    backgroundColor: selectedDays[index]
                      ? "#00ff99"
                      : theme.background,
                    ...(selectedDays[index] && {
                      shadowColor: "#00ff99",
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                      elevation: 5,
                    }),
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{
                      color: selectedDays[index] ? "#000" : theme.textSecondary,
                    }}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              className="flex-row justify-between items-center w-full p-4 rounded-xl border mb-6"
              style={{
                backgroundColor: theme.background,
                borderColor: theme.cardBorder,
              }}
              onPress={() => setIsActionOn(!isActionOn)}
              activeOpacity={0.8}
            >
              <Text className="font-semibold" style={{ color: theme.text }}>
                Action: {isActionOn ? "Turn ON" : "Turn OFF"}
              </Text>
              <View
                className="w-11 h-6 rounded-full border justify-center"
                style={{
                  borderColor: isActionOn ? "#00ff99" : "#555",
                  backgroundColor: isActionOn ? "rgba(0,255,153,0.1)" : "#333",
                }}
              >
                <View
                  className="w-4 h-4 rounded-full absolute"
                  style={{
                    backgroundColor: isActionOn ? "#00ff99" : "#fff",
                    right: isActionOn ? 2 : undefined,
                    left: isActionOn ? undefined : 2,
                  }}
                />
              </View>
            </TouchableOpacity>

            <View className="flex-row gap-2.5 w-full">
              <TouchableOpacity
                className="flex-1 p-3 rounded-lg border items-center"
                style={{ borderColor: theme.cardBorder }}
                onPress={() => setShowSchedule(false)}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 p-3 rounded-lg border items-center"
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                }}
                onPress={saveSchedule}
              >
                <Text className="font-bold text-black">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, theme }) {
  return (
    <View className="flex-row justify-between mb-3 last:mb-0">
      <Text className="text-sm" style={{ color: theme.textSecondary }}>
        {label}
      </Text>
      <Text className="text-sm font-semibold" style={{ color: theme.text }}>
        {value}
      </Text>
    </View>
  );
}
