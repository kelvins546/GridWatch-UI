import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function FaultDetailScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [checks, setChecks] = useState([false, false, false]);
  const [showModal, setShowModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const toggleCheck = (index) => {
    const newChecks = [...checks];
    newChecks[index] = !newChecks[index];
    setChecks(newChecks);
  };

  const allChecked = checks.every(Boolean);

  const handleReset = () => {
    if (!allChecked) return;
    setIsResetting(true);

    setTimeout(() => {
      setIsResetting(false);
      setShowModal(true);
    }, 1500);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#ff4444" />

      <View className="absolute top-12 left-6 z-10">
        <TouchableOpacity
          className="flex-row items-center gap-1.5"
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={18} color="#fff" />
          <Text className="text-white text-sm font-medium">Back</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={["#ff4444", theme.background]}
        className="pt-24 pb-8 items-center"
      >
        <View className="w-20 h-20 rounded-full bg-black/20 items-center justify-center border-2 border-white/20 mb-4">
          <MaterialIcons name="flash-off" size={40} color="#fff" />
        </View>
        <Text className="text-2xl font-extrabold text-white mb-1.5">
          Power Cutoff Active
        </Text>
        <Text className="text-sm text-white/90">
          Safety Protection Triggered
        </Text>
      </LinearGradient>

      <ScrollView>
        <View className="p-6">
          <View
            className="p-5 rounded-3xl border mb-5"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <DetailRow label="Device Name" value="Outlet 3" theme={theme} />
            <DetailRow
              label="Fault Type"
              value="Short Circuit Detected"
              valueColor="#ff4444"
              theme={theme}
            />
            <DetailRow
              label="Time of Incident"
              value="Today, 10:42 AM"
              theme={theme}
            />
            <DetailRow
              label="Peak Current"
              value="45.2 Amps (Limit: 15A)"
              theme={theme}
            />
          </View>

          <Text className="text-xs font-bold text-neutral-500 mb-3 tracking-widest">
            REQUIRED SAFETY CHECKS
          </Text>

          <CheckItem
            text="I have unplugged the faulty appliance connected to Outlet 3."
            checked={checks[0]}
            onPress={() => toggleCheck(0)}
            theme={theme}
          />
          <CheckItem
            text="I have inspected the outlet for any visible burn marks or smoke."
            checked={checks[1]}
            onPress={() => toggleCheck(1)}
            theme={theme}
          />
          <CheckItem
            text="I understand that resetting power to a faulty circuit can be dangerous."
            checked={checks[2]}
            onPress={() => toggleCheck(2)}
            theme={theme}
          />

          <View className="mt-4">
            <TouchableOpacity
              className="w-full py-4 rounded-2xl items-center"
              style={{
                backgroundColor: allChecked ? "#ff4444" : "#333",
              }}
              disabled={!allChecked || isResetting}
              onPress={handleReset}
            >
              <Text className="text-white font-bold uppercase tracking-widest text-sm">
                {isResetting
                  ? "Resetting..."
                  : allChecked
                  ? "RESET OUTLET POWER"
                  : "Complete Checks to Reset"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-neutral-500 text-center mt-6">
            GridWatch System ID: GW-SAFE-9921
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center">
          <View
            className="w-72 p-8 rounded-3xl items-center border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <MaterialIcons
              name="check-circle"
              size={48}
              color="#00ff99"
              style={{ marginBottom: 15 }}
            />
            <Text
              className="text-lg font-bold mb-2.5"
              style={{ color: theme.text }}
            >
              Power Restored
            </Text>
            <Text
              className="text-xs text-center mb-6 leading-5"
              style={{ color: theme.textSecondary }}
            >
              Safety protocols verified. Power has been safely restored to
              Outlet 3.
            </Text>
            <TouchableOpacity
              className="w-full py-3.5 rounded-xl border items-center"
              style={{ borderColor: theme.text }}
              onPress={() => navigation.navigate("MainApp", { screen: "Home" })}
            >
              <Text className="font-bold text-sm" style={{ color: theme.text }}>
                Return to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, valueColor, theme }) {
  return (
    <View className="flex-row justify-between mb-3 last:mb-0">
      <Text className="text-sm" style={{ color: theme.textSecondary }}>
        {label}
      </Text>
      <Text
        className="text-sm font-semibold"
        style={{ color: valueColor || theme.text }}
      >
        {value}
      </Text>
    </View>
  );
}

function CheckItem({ text, checked, onPress, theme }) {
  return (
    <TouchableOpacity
      className="flex-row mb-4 pr-2.5"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        className="w-5 h-5 rounded-md border-2 mr-4 items-center justify-center"
        style={{
          borderColor: checked ? "#00ff99" : "#444",
          backgroundColor: checked ? "#00ff99" : "transparent",
        }}
      >
        {checked && <MaterialIcons name="check" size={14} color="#000" />}
      </View>
      <Text
        // CHANGED: 'text-sm' (14px) instead of 'text-xs' (12px)
        className="text-sm flex-1 leading-5"
        style={{ color: theme.textSecondary }}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}
