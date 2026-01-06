import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Modal,
  ActivityIndicator,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function BudgetManagerScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [billingDate, setBillingDate] = useState("15th");
  const [monthlyBudget, setMonthlyBudget] = useState(2800);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateButton = (toValue) => {
    Animated.spring(scaleAnim, {
      toValue,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleManualReset = () => {
    setShowConfirmModal(false);
    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
    }, 2000);
  };

  const handleSaveBudget = () => {
    setShowBudgetModal(false);
    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
    }, 1000);
  };

  const handleDateSelect = (day) => {
    setBillingDate(`${day}${getDaySuffix(day)}`);
    setShowDatePicker(false);
  };

  const handleBudgetChange = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, "");
    const number = parseInt(cleanedText);

    if (!isNaN(number)) {
      setMonthlyBudget(number);
    } else if (cleanedText === "") {
      setMonthlyBudget(0);
    }
  };

  const getDaySuffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const getDayNumber = (dateString) => parseInt(dateString);

  const hubs = [
    {
      id: "living",
      name: "Living Room Hub",
      status: "Online",
      devices: 3,
      type: "active",
    },
    {
      id: "kitchen",
      name: "Kitchen Hub",
      status: "Online",
      devices: 2,
      type: "active",
    },
    {
      id: "bedroom",
      name: "Bedroom Hub",
      status: "Slow Connection",
      devices: 1,
      type: "warn",
    },
    {
      id: "garage",
      name: "Garage Hub",
      status: "Offline",
      devices: 0,
      type: "offline",
    },
  ];

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

      {isResetting && (
        <View className="absolute z-[100] w-full h-full bg-black/70 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-white mt-4 font-bold">
            Updating Settings...
          </Text>
        </View>
      )}

      {}
      <View
        className="flex-row items-center justify-center px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <Text className="text-base font-bold" style={{ color: theme.text }}>
          Budget & Management
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="p-6">
          {}
          <TouchableOpacity
            activeOpacity={1}
            style={{ marginBottom: 20 }}
            onPress={() => setShowBudgetModal(true)}
            onPressIn={() => animateButton(0.98)}
            onPressOut={() => animateButton(1)}
          >
            <Animated.View
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                transform: [{ scale: scaleAnim }],
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text
                    className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: theme.textSecondary }}
                  >
                    Total Spending
                  </Text>
                  <Text
                    className="text-3xl font-extrabold"
                    style={{ color: theme.text }}
                  >
                    ₱ 1,450.75
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={theme.textSecondary}
                />
              </View>

              <View className="mb-4">
                <View className="flex-row justify-between mb-1.5">
                  <Text
                    className="text-xs font-medium"
                    style={{ color: theme.primary }}
                  >
                    48% Used
                  </Text>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: theme.textSecondary }}
                  >
                    ₱ {monthlyBudget.toLocaleString()} Limit
                  </Text>
                </View>
                <View
                  className="h-3 rounded-full w-full overflow-hidden"
                  style={{ backgroundColor: isDarkMode ? "#333" : "#f0f0f0" }}
                >
                  <LinearGradient
                    colors={
                      isDarkMode
                        ? ["#0055ff", "#00ff99"]
                        : ["#0055ff", "#00995e"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-full rounded-full w-[48%]"
                  />
                </View>
              </View>

              <View
                className="flex-row border-t pt-4"
                style={{ borderColor: theme.cardBorder }}
              >
                <StatItem
                  label="Daily Average"
                  value="₱ 120.50"
                  icon="trending-up"
                  theme={theme}
                  isDarkMode={isDarkMode}
                />
                <View
                  className="w-[1px] h-8 mx-4"
                  style={{ backgroundColor: theme.cardBorder }}
                />
                <StatItem
                  label="Reset Date"
                  value={`Every ${billingDate}`}
                  icon="event-repeat"
                  theme={theme}
                  isDarkMode={isDarkMode}
                />
              </View>
            </Animated.View>
          </TouchableOpacity>

          {}
          <TouchableOpacity
            className="flex-row items-center justify-between p-4 rounded-xl border mb-3"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            onPress={() => setShowDatePicker(true)}
          >
            <View className="flex-row items-center">
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={theme.primary}
              />
              <View className="ml-3">
                <Text
                  className="text-sm font-bold"
                  style={{ color: theme.text }}
                >
                  Billing Cycle Date
                </Text>
                <Text
                  className="text-[11px]"
                  style={{ color: theme.textSecondary }}
                >
                  App resets automatically every month
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <Text
                className="text-xs font-bold mr-1"
                style={{ color: theme.primary }}
              >
                {billingDate}
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={18}
                color={theme.textSecondary}
              />
            </View>
          </TouchableOpacity>

          {}
          <TouchableOpacity
            onPress={() => setShowConfirmModal(true)}
            className="flex-row items-center justify-center py-4 rounded-xl border mb-8"
            style={{
              borderColor: "#ff4444",
              backgroundColor: isDarkMode
                ? "rgba(255, 68, 68, 0.05)"
                : "rgba(255, 68, 68, 0.02)",
            }}
          >
            <MaterialIcons name="restart-alt" size={20} color="#ff4444" />
            <Text
              className="ml-2 font-bold text-xs uppercase tracking-wider"
              style={{ color: "#ff4444" }}
            >
              Manual Reset
            </Text>
          </TouchableOpacity>

          <Text
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary }}
          >
            Select Hub to Manage
          </Text>

          <View className="gap-2">
            {hubs.map((hub) => (
              <HubCard
                key={hub.id}
                data={hub}
                theme={theme}
                isDarkMode={isDarkMode}
                onPress={() =>
                  navigation.navigate("BudgetDeviceList", { hubName: hub.name })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {}

      {}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View
            className="w-[85%] max-w-[280px] p-5 rounded-2xl border items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="w-12 h-12 rounded-full bg-[#ff4444]/10 items-center justify-center mb-3">
              <MaterialIcons name="warning" size={28} color="#ff4444" />
            </View>
            <Text
              className="text-base font-bold mb-2 text-center"
              style={{ color: theme.text }}
            >
              Reset Spending?
            </Text>
            <Text
              className="text-[11px] text-center mb-5 leading-4"
              style={{ color: theme.textSecondary }}
            >
              This will clear your current spending. Use this if your billing
              cycle started earlier than scheduled.
            </Text>
            <View className="flex-row gap-2.5 w-full">
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border items-center"
                style={{ borderColor: theme.cardBorder }}
              >
                <Text
                  className="font-bold text-xs"
                  style={{ color: theme.text }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleManualReset}
                className="flex-1 py-2.5 bg-[#ff4444] rounded-xl items-center"
              >
                <Text className="text-white font-bold text-xs">Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <TouchableOpacity
            className="absolute w-full h-full bg-black/50"
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          />
          <View
            className="rounded-t-3xl p-6 border-t"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              height: "50%",
            }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg font-bold" style={{ color: theme.text }}>
                Select Billing Day
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <Text
              className="text-xs mb-4"
              style={{ color: theme.textSecondary }}
            >
              GridWatch will automatically reset your month-to-date spending
              tracker on this day every month.
            </Text>
            <FlatList
              data={Array.from({ length: 31 }, (_, i) => i + 1)}
              keyExtractor={(item) => item.toString()}
              numColumns={5}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isSelected = item === getDayNumber(billingDate);
                return (
                  <TouchableOpacity
                    onPress={() => handleDateSelect(item)}
                    className="flex-1 h-12 m-1 rounded-xl items-center justify-center border"
                    style={{
                      borderColor: theme.cardBorder,
                      backgroundColor: isSelected
                        ? isDarkMode
                          ? "#0055ff"
                          : "#0055ff"
                        : "transparent",
                    }}
                  >
                    <Text
                      className="font-bold"
                      style={{ color: isSelected ? "#fff" : theme.text }}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {}
      <Modal visible={showBudgetModal} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <TouchableOpacity
            className="absolute w-full h-full bg-black/50"
            activeOpacity={1}
            onPress={() => setShowBudgetModal(false)}
          />
          <View
            className="rounded-t-3xl p-6 border-t"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              paddingBottom: 40,
            }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg font-bold" style={{ color: theme.text }}>
                Monthly Budget
              </Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View className="items-center mb-8">
              <Text
                className="text-xs font-bold mb-5 tracking-[1px]"
                style={{ color: theme.textSecondary }}
              >
                SET TOTAL LIMIT
              </Text>

              <View
                className="flex-row items-center justify-between w-full p-5 rounded-[20px] border mb-5"
                style={{
                  backgroundColor: theme.background,
                  borderColor: theme.cardBorder,
                }}
              >
                <TouchableOpacity
                  className="p-2.5 bg-black/5 dark:bg-white/5 rounded-full"
                  onPress={() =>
                    setMonthlyBudget((prev) => Math.max(0, prev - 100))
                  }
                >
                  <MaterialIcons name="remove" size={24} color={theme.text} />
                </TouchableOpacity>

                {}
                <View className="flex-row items-center justify-center flex-1 mx-2">
                  <Text
                    className="text-[32px] font-bold mr-1"
                    style={{ color: theme.text }}
                  >
                    ₱
                  </Text>
                  <TextInput
                    value={monthlyBudget.toString()}
                    onChangeText={handleBudgetChange}
                    keyboardType="numeric"
                    className="text-[32px] font-bold text-center"
                    style={{ color: theme.text, minWidth: 80 }}
                    maxLength={7}
                  />
                </View>

                <TouchableOpacity
                  className="p-2.5 bg-black/5 dark:bg-white/5 rounded-full"
                  onPress={() => setMonthlyBudget((prev) => prev + 100)}
                >
                  <MaterialIcons name="add" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <Text
                className="text-center text-[13px] leading-5 px-4"
                style={{ color: theme.textSecondary }}
              >
                You will receive alerts when your total spending approaches this
                limit.
              </Text>
            </View>

            {}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSaveBudget}
              style={{ width: "100%", borderRadius: 12, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#0055ff", "#00ff99"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center justify-center"
              >
                <Text className="text-black font-bold text-sm">
                  Save Changes
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatItem({ label, value, icon, color, theme, isDarkMode }) {
  const iconBg = isDarkMode
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.05)";
  return (
    <View className="flex-1 flex-row items-center gap-3">
      <View
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <MaterialIcons name={icon} size={16} color={color || theme.text} />
      </View>
      <View>
        <Text
          className="text-[10px] font-medium uppercase"
          style={{ color: theme.textSecondary }}
        >
          {label}
        </Text>
        <Text className="text-xs font-bold" style={{ color: theme.text }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function HubCard({ data, theme, isDarkMode, onPress }) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const isOffline = data.type === "offline";
  const handlePressIn = () =>
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

  let statusColor = isDarkMode ? "#00ff99" : "#00995e";
  let iconBg = isDarkMode ? "rgba(0, 255, 153, 0.1)" : "rgba(0, 153, 94, 0.1)";

  if (data.type === "warn") {
    statusColor = "#ffaa00";
    iconBg = "rgba(255, 170, 0, 0.1)";
  } else if (data.type === "offline") {
    statusColor = "#ff4444";
    iconBg = "rgba(255, 68, 68, 0.1)";
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={!isOffline ? onPress : null}
      onPressIn={!isOffline ? handlePressIn : null}
      onPressOut={!isOffline ? handlePressOut : null}
      className="mb-3"
    >
      <Animated.View
        className="flex-row items-center justify-between p-4 rounded-xl border"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          transform: [{ scale: scaleValue }],
          opacity: isOffline ? 0.6 : 1,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="w-10 h-10 rounded-lg items-center justify-center"
            style={{ backgroundColor: iconBg }}
          >
            <MaterialIcons
              name={isOffline ? "wifi-off" : "router"}
              size={20}
              color={statusColor}
            />
          </View>
          <View>
            <Text className="text-sm font-bold" style={{ color: theme.text }}>
              {data.name}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              <Text
                className="text-[11px]"
                style={{ color: theme.textSecondary }}
              >
                {data.status} {!isOffline && `• ${data.devices} Devices`}
              </Text>
            </View>
          </View>
        </View>
        <MaterialIcons
          name={isOffline ? "lock" : "chevron-right"}
          size={18}
          color={theme.textSecondary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}
