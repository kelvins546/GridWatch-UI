import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
} from "react";

import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const TOUR_STEPS = [
  {
    id: "welcome",
    type: "modal",
    title: "Welcome to GridWatch",
    description:
      "Let's take a quick tour to help you manage your energy efficiently.",
    buttonText: "Start Tour",
  },
  {
    id: "budget",
    type: "highlight",
    title: "Monitor Spending",
    description:
      "This card shows your real-time costs. View your total spending and daily average here.",
    target: "budgetRef",
    shape: "card",
  },
  {
    id: "limit",
    type: "highlight",
    title: "Usage Limits",
    description:
      "Devices with 'LIMIT' tags have set thresholds. You'll get notified if they exceed their budget.",
    target: "limitDeviceRef",
    shape: "rect",
  },
  {
    id: "error",
    type: "highlight",
    title: "Fault Detection",
    description:
      "Critical errors appear in red. Tap this card to diagnose the circuit issue immediately.",
    target: "errorDeviceRef",
    shape: "rect",
  },
  {
    id: "device",
    type: "highlight",
    title: "Control Devices",
    description:
      "Tap any standard device card to view power usage stats or toggle it ON/OFF.",
    target: "deviceRef",
    shape: "rect",
  },
  {
    id: "notifications",
    type: "highlight",
    title: "Stay Updated",
    description:
      "Check here for alerts on budget limits, device faults, and energy tips.",
    target: "notifRef",
    shape: "circle",
  },
  {
    id: "menu",
    type: "highlight",
    title: "Manage Hubs",
    description:
      "Add new devices, configure Hub settings, or switch accounts here.",
    target: "menuRef",
    shape: "circle",
  },
];

const HUBS_DATA = [
  {
    id: "hub1",
    name: "Living Room Hub",
    active: 4,
    total: 4,
    devices: [
      {
        id: 1,
        name: "Air Conditioner",
        cost: "₱ 18.20 / hr",
        watts: "1456 W",
        icon: "ac-unit",
        type: "normal",
        tag: "DAILY",
      },
      {
        id: 2,
        name: "Smart TV",
        cost: "₱ 1.50 / hr",
        watts: "120 W",
        icon: "tv",
        type: "warning",
        tag: "LIMIT",
      },
      {
        id: 3,
        name: "Outlet 3",
        cost: "Check Circuit",
        watts: "0 W",
        icon: "power-off",
        type: "critical",
        tag: "ERROR",
      },
      {
        id: 4,
        name: "Electric Fan",
        cost: "Offline",
        watts: "0 W",
        icon: "mode-fan-off",
        type: "off",
        tag: "WEEKLY",
      },
    ],
  },
  {
    id: "hub2",
    name: "Kitchen Hub",
    active: 2,
    total: 2,
    devices: [
      {
        id: 5,
        name: "Refrigerator",
        cost: "₱ 2.10 / hr",
        watts: "150 W",
        icon: "kitchen",
        type: "normal",
        tag: "24/7",
      },
      {
        id: 6,
        name: "Microwave",
        cost: "Standby",
        watts: "0 W",
        icon: "microwave",
        type: "off",
        tag: "MANUAL",
      },
    ],
  },
];

export default function HomeScreen() {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [tourStepIndex, setTourStepIndex] = useState(-1);
  const [activeLayout, setActiveLayout] = useState(null);

  const notifRef = useRef(null);
  const budgetRef = useRef(null);
  const menuRef = useRef(null);
  const deviceRef = useRef(null);
  const limitDeviceRef = useRef(null);
  const errorDeviceRef = useRef(null);

  const refMap = {
    notifRef,
    budgetRef,
    menuRef,
    deviceRef,
    limitDeviceRef,
    errorDeviceRef,
  };

  useEffect(() => {
    checkTourStatus();
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const checkTourStatus = async () => {
    try {
      const hasSeenTour = await AsyncStorage.getItem("hasSeenHomeTour");
      if (hasSeenTour !== "true") setTimeout(() => setTourStepIndex(0), 1000);
    } catch (e) {
      console.log(e);
    }
  };

  const endTour = async () => {
    setTourStepIndex(-1);
    setActiveLayout(null);
    await AsyncStorage.setItem("hasSeenHomeTour", "true");
    setTimeout(() => {
      navigation.navigate("DndCheck");
    }, 500);
  };

  const handleResetTour = async () => {
    await AsyncStorage.removeItem("hasSeenHomeTour");
    setTourStepIndex(0);
  };

  const handleNextStep = () => {
    const nextIndex = tourStepIndex + 1;
    if (nextIndex >= TOUR_STEPS.length) {
      endTour();
      return;
    }
    const nextStepData = TOUR_STEPS[nextIndex];
    if (nextStepData.type === "highlight" && nextStepData.target) {
      const targetRef = refMap[nextStepData.target];
      if (targetRef?.current) {
        targetRef.current.measureInWindow((x, y, width, height) => {
          if (width === 0 && height === 0) endTour();
          else {
            setActiveLayout({ x, y, width, height });
            setTourStepIndex(nextIndex);
          }
        });
      } else endTour();
    } else {
      setActiveLayout(null);
      setTourStepIndex(nextIndex);
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar
          barStyle={theme.statusBarStyle}
          backgroundColor={theme.background}
        />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

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
        className="flex-row justify-between items-center px-6 py-5"
        style={{ backgroundColor: theme.background }}
      >
        <TouchableOpacity
          ref={menuRef}
          onPress={() => navigation.navigate("Menu")}
          style={{ padding: 4 }}
        >
          <MaterialIcons name="menu" size={28} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResetTour}>
          <Image
            source={require("../../../assets/GridWatch-logo.png")}
            className="w-8 h-8"
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          ref={notifRef}
          onPress={() => navigation.navigate("Notifications")}
          style={{ padding: 4 }}
        >
          <MaterialIcons
            name="notifications-none"
            size={28}
            color={theme.text}
          />
          <View
            className="absolute 0 0 bg-[#ff4d4d] rounded-[7px] w-3.5 h-3.5 justify-center items-center border-2"
            style={{ borderColor: theme.background, top: 4, right: 4 }}
          >
            <Text className="text-white text-[8px] font-bold">2</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerClassName="pb-24"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-2" />

        <Animated.View
          ref={budgetRef}
          style={{
            marginHorizontal: 24,
            marginBottom: 32,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View
            className="p-5 rounded-2xl border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
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
                    fontSize: theme.font.xs,
                  }}
                >
                  Total Spending
                </Text>
                <Text
                  className="font-extrabold"
                  style={{ color: theme.text, fontSize: theme.font["3xl"] }}
                >
                  ₱ 1,450.75
                </Text>
              </View>
              <View className="items-end">
                <Text
                  className="uppercase font-bold"
                  style={{ color: theme.textSecondary, fontSize: 10 }}
                >
                  Budget Limit
                </Text>
                <Text
                  className="font-semibold"
                  style={{
                    color: theme.textSecondary,
                    fontSize: theme.font.sm,
                  }}
                >
                  ₱ 3,000.00
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <View className="flex-row justify-between mb-1.5">
                <Text
                  className="font-medium"
                  style={{ color: theme.text, fontSize: theme.font.xs }}
                >
                  48% Used
                </Text>
                <Text
                  className="font-medium"
                  style={{
                    color: theme.textSecondary,
                    fontSize: theme.font.xs,
                  }}
                >
                  ₱ 1,549.25 Remaining
                </Text>
              </View>
              <View
                className="h-3 rounded-full w-full overflow-hidden"
                style={{ backgroundColor: isDarkMode ? "#333" : "#f0f0f0" }}
              >
                <View
                  className="h-full rounded-full w-[48%]"
                  style={{ backgroundColor: theme.buttonPrimary }}
                />
              </View>
            </View>

            <View
              className="flex-row border-t pt-4"
              style={{ borderColor: theme.cardBorder }}
            >
              <StatItem
                label="Daily Avg"
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
                value="Every 15th"
                icon="event-repeat"
                theme={theme}
                isDarkMode={isDarkMode}
              />
            </View>
          </View>
        </Animated.View>

        {HUBS_DATA.map((hub) => (
          <View key={hub.id} className="mb-5">
            <Text
              className="font-semibold uppercase tracking-wider mb-3 px-6"
              style={{ color: theme.textSecondary, fontSize: theme.font.sm }}
            >
              {hub.name} ({hub.active}/{hub.total})
            </Text>

            <View className="flex-row flex-wrap justify-between px-6">
              {hub.devices.map((device) => (
                <DeviceItem
                  key={device.id}
                  ref={
                    device.type === "critical"
                      ? errorDeviceRef
                      : device.tag === "LIMIT"
                      ? limitDeviceRef
                      : device.id === 4
                      ? deviceRef
                      : null
                  }
                  data={device}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  onPress={() => {
                    let target = "DeviceControl";
                    if (device.type === "critical") target = "FaultDetail";
                    else if (device.tag === "LIMIT") target = "LimitDetail";
                    navigation.navigate(target, {
                      deviceName: device.name,
                      status: device.cost,
                    });
                  }}
                />
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => navigation.navigate("SetupHub")}
          className="mx-6 mb-8 mt-2 py-4 rounded-xl border border-dashed flex-row justify-center items-center"
          style={{ borderColor: theme.textSecondary }}
        >
          <MaterialIcons name="add" size={20} color={theme.textSecondary} />
          <Text
            className="ml-2 font-bold uppercase tracking-wider"
            style={{ color: theme.textSecondary, fontSize: theme.font.xs }}
          >
            Add New Device
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {tourStepIndex >= 0 && (
        <TourOverlay
          step={TOUR_STEPS[tourStepIndex]}
          layout={activeLayout}
          theme={theme}
          isDarkMode={isDarkMode}
          onNext={handleNextStep}
          onSkip={endTour}
        />
      )}
    </SafeAreaView>
  );
}

function StatItem({ label, value, icon, color, theme, isDarkMode }) {
  const iconBg = isDarkMode
    ? "rgba(0, 179, 74, 0.15)"
    : "rgba(0, 179, 74, 0.1)";
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
          style={{ color: theme.textSecondary, fontSize: 10 }}
        >
          {label}
        </Text>
        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: theme.font.sm }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const TourOverlay = ({ step, layout, theme, isDarkMode, onNext, onSkip }) => {
  if (step.type === "modal") {
    return (
      <Modal
        transparent
        animationType="fade"
        visible={true}
        onRequestClose={onSkip}
      >
        <View className="flex-1 justify-center items-center bg-black/80">
          <View
            className="rounded-2xl p-5 w-[70%] max-w-[280px] items-center border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View
              className="p-3 rounded-full mb-3"
              style={{ backgroundColor: theme.buttonNeutral }}
            >
              <MaterialIcons name="explore" size={32} color={theme.primary} />
            </View>
            <Text
              className="font-bold text-center mb-2"
              style={{ color: theme.text, fontSize: theme.font.lg }}
            >
              {step.title}
            </Text>
            <Text
              className="text-center mb-5 leading-4"
              style={{ color: theme.textSecondary, fontSize: theme.font.xs }}
            >
              {step.description}
            </Text>
            <TouchableOpacity onPress={onNext} className="w-full">
              <View
                className="py-3 rounded-xl items-center"
                style={{ backgroundColor: theme.buttonPrimary }}
              >
                <Text
                  className="font-bold uppercase"
                  style={{
                    fontSize: theme.font.xs,
                    color: theme.buttonPrimaryText,
                  }}
                >
                  {step.buttonText || "Next"}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSkip} className="mt-3">
              <Text style={{ color: theme.textSecondary, fontSize: 10 }}>
                Skip tour
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (!layout) return null;

  const maskTop = layout.y;
  const maskLeft = layout.x;
  const maskRight = SCREEN_WIDTH - layout.x - layout.width;
  const maskBottom = SCREEN_HEIGHT - layout.y - layout.height;
  const showTooltipBelow = layout.y < SCREEN_HEIGHT / 2;
  const tooltipWidth = Math.min(SCREEN_WIDTH * 0.7, 280);
  const tooltipLeft = (SCREEN_WIDTH - tooltipWidth) / 2;
  const targetCenterX = layout.x + layout.width / 2;
  const arrowRelativeX = Math.min(
    Math.max(targetCenterX - tooltipLeft - 8, 10),
    tooltipWidth - 20
  );
  const highlightRadius =
    step.shape === "circle" ? 9999 : step.shape === "card" ? 24 : 16;
  const padding = step.shape === "circle" ? 8 : 4;

  return (
    <Modal
      transparent
      visible={true}
      animationType="fade"
      onRequestClose={onSkip}
    >
      <View className="flex-1 relative">
        <View
          className="absolute bg-black/80 top-0 left-0 right-0"
          style={{ height: maskTop }}
        />
        <View
          className="absolute bg-black/80 bottom-0 left-0 right-0"
          style={{ height: maskBottom }}
        />
        <View
          className="absolute bg-black/80 left-0"
          style={{ top: layout.y, height: layout.height, width: maskLeft }}
        />
        <View
          className="absolute bg-black/80 right-0"
          style={{ top: layout.y, height: layout.height, width: maskRight }}
        />
        <View
          className="absolute border-2"
          style={{
            top: layout.y - padding,
            left: layout.x - padding,
            width: layout.width + padding * 2,
            height: layout.height + padding * 2,
            borderColor: theme.primary,
            borderRadius: highlightRadius,
          }}
        />
        <View
          className="absolute p-4 rounded-xl border shadow-xl"
          style={{
            width: tooltipWidth,
            left: tooltipLeft,
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            top: showTooltipBelow
              ? layout.y + layout.height + 20
              : layout.y - 180,
          }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <MaterialIcons
                name="info-outline"
                size={14}
                color={theme.primary}
              />
              <Text
                className="font-bold ml-1 uppercase"
                style={{ color: theme.primary, fontSize: 10 }}
              >
                TIP
              </Text>
            </View>
            <TouchableOpacity onPress={onSkip}>
              <MaterialIcons
                name="close"
                size={16}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text
            className="font-bold mb-1"
            style={{ color: theme.text, fontSize: theme.font.base }}
          >
            {step.title}
          </Text>
          <Text
            className="mb-4 leading-4"
            style={{ color: theme.textSecondary, fontSize: theme.font.xs }}
          >
            {step.description}
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onSkip}
              className="flex-1 py-2.5 rounded-lg border"
              style={{ borderColor: theme.cardBorder }}
            >
              <Text
                className="text-center font-semibold"
                style={{
                  color: theme.textSecondary,
                  fontSize: theme.font.xs,
                }}
              >
                Dismiss
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} className="flex-1">
              <View
                className="py-2.5 rounded-lg items-center"
                style={{ backgroundColor: theme.buttonPrimary }}
              >
                <Text
                  className="font-bold"
                  style={{
                    fontSize: theme.font.xs,
                    color: theme.buttonPrimaryText,
                  }}
                >
                  Next
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <View
            className="absolute w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent"
            style={{
              borderBottomWidth: 8,
              borderBottomColor: theme.card,
              left: arrowRelativeX,
              top: -8,
              transform: showTooltipBelow ? [] : [{ rotate: "180deg" }],
              ...(!showTooltipBelow && { top: "auto", bottom: -8 }),
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const DeviceItem = forwardRef(({ data, theme, isDarkMode, onPress }, ref) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

  const yellow = isDarkMode ? "#ffaa00" : "#b37400";
  const red = isDarkMode ? "#ff4444" : "#c62828";

  let colors = {
    bg: `${theme.buttonPrimary}1A`,
    border: theme.buttonPrimary,
    icon: theme.buttonPrimary,
    iconBg: `${theme.buttonPrimary}33`,
    text: theme.text,
    cost: theme.text,
    watts: theme.textSecondary,
    tag: "#FFFFFF",
    tagBg: theme.buttonPrimary,
  };

  if (data.type === "warning") {
    colors = {
      bg: isDarkMode ? "rgba(255, 170, 0, 0.1)" : "rgba(179, 116, 0, 0.1)",
      border: yellow,
      icon: yellow,
      iconBg: isDarkMode ? "rgba(255, 170, 0, 0.2)" : "rgba(179, 116, 0, 0.2)",
      text: theme.text,
      cost: theme.text,
      watts: theme.textSecondary,

      tag: "#FFFFFF",
      tagBg: yellow,
    };
  } else if (data.type === "critical") {
    colors = {
      bg: isDarkMode ? "rgba(255, 68, 68, 0.1)" : "rgba(198, 40, 40, 0.1)",
      border: red,
      icon: red,
      iconBg: isDarkMode ? "rgba(255, 68, 68, 0.2)" : "rgba(198, 40, 40, 0.2)",
      text: theme.text,
      cost: theme.text,
      watts: theme.textSecondary,

      tag: "#FFFFFF",
      tagBg: red,
    };
  } else if (data.type === "off") {
    colors = {
      bg: theme.card,
      border: theme.cardBorder,
      icon: theme.textSecondary,
      iconBg: theme.buttonNeutral,
      text: theme.text,
      cost: theme.textSecondary,
      watts: theme.textSecondary,
      tag: theme.textSecondary,
      tagBg: theme.buttonNeutral,
    };
  }

  return (
    <TouchableOpacity
      ref={ref}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      activeOpacity={1}
      className="w-[48%] mb-4"
    >
      <Animated.View
        className="w-full rounded-[20px] p-4 h-[140px] justify-between border"
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          transform: [{ scale }],
          borderWidth: data.type === "normal" ? 1.5 : 1,
        }}
      >
        <View className="flex-row justify-between items-start">
          <View
            className="w-8 h-8 rounded-[10px] justify-center items-center"
            style={{ backgroundColor: colors.iconBg }}
          >
            <MaterialIcons name={data.icon} size={18} color={colors.icon} />
          </View>
          <View
            className="px-1.5 py-1 rounded-md"
            style={{ backgroundColor: colors.tagBg }}
          >
            <Text
              className="font-bold"
              style={{ color: colors.tag, fontSize: 9 }}
            >
              {data.tag}
            </Text>
          </View>
        </View>

        <View>
          <Text
            className="font-semibold mb-1"
            style={{ color: colors.text, fontSize: theme.font.sm }}
          >
            {data.name}
          </Text>
          <Text
            className="font-semibold mb-0.5"
            style={{ color: colors.cost, fontSize: theme.font.sm }}
          >
            {data.cost}
          </Text>
          <Text style={{ color: colors.watts, fontSize: 10 }}>
            {data.watts}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});
