import React, { useRef, useState, useMemo } from "react";
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
  const { theme, isDarkMode, fontScale } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const primaryColor = isDarkMode ? theme.buttonPrimary : "#00995e";
  const dangerColor = isDarkMode ? theme.buttonDangerText : "#cc0000";

  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const [billingDate, setBillingDate] = useState("15th");
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    new Date().getMonth()
  );

  const [monthlyBudget, setMonthlyBudget] = useState(2800);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const daysInCurrentMonth = useMemo(() => {
    const year = new Date().getFullYear();
    return new Date(year, selectedMonthIndex + 1, 0).getDate();
  }, [selectedMonthIndex]);

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
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="text-white mt-4 font-bold">
            Updating Settings...
          </Text>
        </View>
      )}

      <View
        className="flex-row items-center justify-center px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(16) }}
        >
          Budget & Management
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="p-6">
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
                    className="font-bold uppercase tracking-widest mb-1"
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(12),
                    }}
                  >
                    Total Spending
                  </Text>
                  <Text
                    className="font-extrabold"
                    style={{ color: theme.text, fontSize: scaledSize(30) }}
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
                    className="font-medium"
                    style={{
                      color: primaryColor,
                      fontSize: scaledSize(12),
                    }}
                  >
                    48% Used
                  </Text>
                  <Text
                    className="font-medium"
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(12),
                    }}
                  >
                    ₱ {monthlyBudget.toLocaleString()} Limit
                  </Text>
                </View>
                <View
                  className="h-3 rounded-full w-full overflow-hidden"
                  style={{ backgroundColor: isDarkMode ? "#333" : "#f0f0f0" }}
                >
                  <View
                    className="h-full rounded-full w-[48%]"
                    style={{ backgroundColor: primaryColor }}
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
                  primaryColor={primaryColor}
                  scaledSize={scaledSize}
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
                  primaryColor={primaryColor}
                  scaledSize={scaledSize}
                />
              </View>
            </Animated.View>
          </TouchableOpacity>

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
                color={primaryColor}
              />
              <View className="ml-3">
                <Text
                  className="font-bold"
                  style={{ color: theme.text, fontSize: scaledSize(14) }}
                >
                  Billing Cycle Date
                </Text>
                <Text
                  className=""
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(11),
                  }}
                >
                  App resets automatically every month
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <Text
                className="font-bold mr-1"
                style={{
                  color: primaryColor,
                  fontSize: scaledSize(12),
                }}
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

          <TouchableOpacity
            onPress={() => setShowConfirmModal(true)}
            className="flex-row items-center justify-center py-4 rounded-xl border mb-8"
            style={{
              borderColor: dangerColor,
              backgroundColor: isDarkMode
                ? "rgba(255, 68, 68, 0.05)"
                : "rgba(204, 0, 0, 0.05)",
            }}
          >
            <MaterialIcons name="restart-alt" size={20} color={dangerColor} />
            <Text
              className="ml-2 font-bold uppercase tracking-wider"
              style={{
                color: dangerColor,
                fontSize: scaledSize(12),
              }}
            >
              Manual Reset
            </Text>
          </TouchableOpacity>

          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
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
                primaryColor={primaryColor}
                dangerColor={dangerColor}
                scaledSize={scaledSize}
                onPress={() =>
                  navigation.navigate("BudgetDeviceList", {
                    hubName: hub.name,
                  })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>

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
            <View
              className="w-12 h-12 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: `${dangerColor}22` }}
            >
              <MaterialIcons name="warning" size={28} color={dangerColor} />
            </View>
            <Text
              className="font-bold mb-2 text-center"
              style={{ color: theme.text, fontSize: scaledSize(16) }}
            >
              Reset Spending?
            </Text>
            <Text
              className="text-center mb-5 leading-4"
              style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
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
                  className="font-bold"
                  style={{ color: theme.text, fontSize: scaledSize(12) }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleManualReset}
                className="flex-1 py-2.5 rounded-xl items-center"
                style={{ backgroundColor: dangerColor }}
              >
                <Text
                  className="text-white font-bold"
                  style={{ fontSize: scaledSize(12) }}
                >
                  Reset
                </Text>
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
              height: "60%",
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
              className="mb-4"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              First, select the reference month to determine available days:
            </Text>

            <View className="h-12 mb-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
              >
                {months.map((m, index) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedMonthIndex(index)}
                    className="mr-2 px-4 h-9 rounded-full justify-center items-center border"
                    style={{
                      backgroundColor:
                        selectedMonthIndex === index
                          ? primaryColor
                          : "transparent",
                      borderColor:
                        selectedMonthIndex === index
                          ? primaryColor
                          : theme.cardBorder,
                    }}
                  >
                    <Text
                      className="font-bold"
                      style={{
                        color:
                          selectedMonthIndex === index ? "#fff" : theme.text,
                        fontSize: scaledSize(12),
                      }}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text
              className="mb-4"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              Select the day of the month your bill resets:
            </Text>

            <FlatList
              data={Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1)}
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
                        ? primaryColor
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
                className="font-bold mb-5 tracking-[1px]"
                style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
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

                <View className="flex-row items-center justify-center flex-1 mx-2">
                  <Text
                    className="font-bold mr-1"
                    style={{ color: theme.text, fontSize: scaledSize(32) }}
                  >
                    ₱
                  </Text>
                  <TextInput
                    value={monthlyBudget.toString()}
                    onChangeText={handleBudgetChange}
                    keyboardType="numeric"
                    className="font-bold text-center"
                    style={{
                      color: theme.text,
                      minWidth: 80,
                      fontSize: scaledSize(32),
                    }}
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
                className="text-center leading-5 px-4"
                style={{ color: theme.textSecondary, fontSize: scaledSize(13) }}
              >
                You will receive alerts when your total spending approaches this
                limit.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSaveBudget}
              style={{
                width: "100%",
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: primaryColor,
              }}
            >
              <View className="py-4 items-center justify-center">
                <Text className="text-white font-bold text-sm">
                  Save Changes
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatItem({
  label,
  value,
  icon,
  color,
  theme,
  primaryColor,
  scaledSize,
}) {
  const iconBg = `${primaryColor}26`;

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
          className="font-medium uppercase"
          style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
        >
          {label}
        </Text>
        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(12) }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function HubCard({
  data,
  theme,
  isDarkMode,
  primaryColor,
  dangerColor,
  scaledSize,
  onPress,
}) {
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

  let statusColor = primaryColor;
  let iconBg = `${primaryColor}1A`;

  if (data.type === "warn") {
    statusColor = isDarkMode ? "#ffaa00" : "#b37400";
    iconBg = "rgba(255, 170, 0, 0.1)";
  } else if (data.type === "offline") {
    statusColor = theme.textSecondary;
    iconBg = `${theme.textSecondary}1A`;
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
          opacity: isOffline ? 0.7 : 1,
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
            <Text
              className="font-bold"
              style={{ color: theme.text, fontSize: scaledSize(14) }}
            >
              {data.name}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              <Text
                className=""
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(11),
                }}
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
