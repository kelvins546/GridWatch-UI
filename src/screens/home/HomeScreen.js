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
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- TOUR STEPS CONFIGURATION ---
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
      "This card shows your real-time costs. Tap it to set monthly limits and view detailed logs.",
    target: "budgetRef",
    shape: "card", // Special shape for card
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
    shape: "circle", // Special shape for icons
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
        cost: "Standby",
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

  const [userName, setUserName] = useState("User");
  const [isLoading, setIsLoading] = useState(true);

  // --- TOUR STATE ---
  const [tourStepIndex, setTourStepIndex] = useState(-1);
  const [activeLayout, setActiveLayout] = useState(null);

  // --- REFS ---
  const notifRef = useRef(null);
  const budgetRef = useRef(null);
  const menuRef = useRef(null);

  // Device Refs
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
    fetchUserFullName();
  }, []);

  const checkTourStatus = async () => {
    try {
      const hasSeenTour = await AsyncStorage.getItem("hasSeenHomeTour");
      if (hasSeenTour !== "true") {
        setTimeout(() => setTourStepIndex(0), 1000);
      }
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
          if (width === 0 && height === 0) {
            endTour();
          } else {
            setActiveLayout({ x, y, width, height });
            setTourStepIndex(nextIndex);
          }
        });
      } else {
        endTour();
      }
    } else {
      setActiveLayout(null);
      setTourStepIndex(nextIndex);
    }
  };

  const fetchUserFullName = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (data && data.full_name) {
          const firstName = data.full_name.split(" ")[0];
          setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
        } else {
          const emailName = user.email.split("@")[0];
          setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
        }
      }
    } catch (err) {
      console.error("Home fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserFullName();
    }, [])
  );

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const animateButton = (toValue) => {
    Animated.spring(scaleAnim, {
      toValue,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
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

      {/* DEBUG BUTTON */}
      <TouchableOpacity
        onPress={() => {
          AsyncStorage.removeItem("hasSeenHomeTour");
          setTourStepIndex(0);
        }}
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          right: 0,
          zIndex: 9999,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "red",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 5,
            fontSize: 10,
          }}
        >
          RESET TOUR
        </Text>
      </TouchableOpacity>

      {/* HEADER */}
      <View
        className="flex-row justify-between items-center px-6 py-5"
        style={{ backgroundColor: theme.background }}
      >
        {/* MENU REF ATTACHED DIRECTLY TO TOUCHABLE */}
        <TouchableOpacity
          ref={menuRef}
          onPress={() => navigation.navigate("Menu")}
          style={{ padding: 4 }} // Padding ensures the highlight circle isn't too tight
        >
          <MaterialIcons name="menu" size={28} color={theme.textSecondary} />
        </TouchableOpacity>

        <Image
          source={require("../../../assets/GridWatch-logo.png")}
          className="w-8 h-8"
          resizeMode="contain"
        />

        {/* NOTIF REF ATTACHED DIRECTLY TO TOUCHABLE */}
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
        <View className="px-6 mb-5">
          <Text
            className="text-sm font-medium mb-1"
            style={{ color: theme.textSecondary }}
          >
            {getGreeting()}, {userName}
          </Text>
          <View className="flex-row items-center">
            <View
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: theme.primary }}
            />
            <Text
              className="text-xs font-semibold"
              style={{ color: theme.text }}
            >
              All Systems Normal
            </Text>
          </View>
        </View>

        {/* BUDGET CARD */}
        {/* We move margins to the Touchable so the Ref measures the exact card size */}
        <TouchableOpacity
          ref={budgetRef}
          activeOpacity={1}
          style={{ marginHorizontal: 24, marginBottom: 32 }} // Margins moved here!
          onPress={() => navigation.navigate("MonthlyBudget")}
          onPressIn={() => animateButton(0.96)}
          onPressOut={() => animateButton(1)}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <LinearGradient
              colors={
                isDarkMode ? ["#252525", "#1e1e1e"] : ["#ffffff", "#f2f2f7"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-3xl p-6 border" // Removed mx and mb from here
              style={{ borderColor: theme.cardBorder }}
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-[11px] text-[#888] uppercase font-semibold tracking-widest mb-2">
                  Current Spending (MTD)
                </Text>
                <MaterialIcons
                  name="edit"
                  size={16}
                  color={theme.textSecondary}
                />
              </View>
              <Text
                className="text-4xl font-bold mb-1"
                style={{ color: theme.text }}
              >
                ₱ 1,450.75
              </Text>
              <Text
                className="text-[13px] mb-5"
                style={{ color: theme.textSecondary }}
              >
                Total Load:{" "}
                <Text className="font-bold" style={{ color: theme.text }}>
                  1.46 kWh
                </Text>
              </Text>
              <View
                className="h-2 rounded-full w-full mb-2 overflow-hidden"
                style={{ backgroundColor: isDarkMode ? "#333" : "#e5e5ea" }}
              >
                <LinearGradient
                  colors={
                    isDarkMode ? ["#0055ff", "#00ff99"] : ["#0055ff", "#00995e"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-full rounded-full w-[52%]"
                />
              </View>
              <Text
                className="text-right text-[11px] font-semibold"
                style={{ color: theme.primary }}
              >
                52% of Budget
              </Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        {HUBS_DATA.map((hub) => (
          <View key={hub.id} className="mb-5">
            <Text
              className="text-[13px] font-semibold uppercase tracking-wider mb-3 px-6"
              style={{ color: theme.textSecondary }}
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

// --- TOUR OVERLAY ---
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
            <LinearGradient
              colors={["rgba(0,85,255,0.1)", "rgba(0,255,153,0.1)"]}
              className="p-3 rounded-full mb-3"
            >
              <MaterialIcons name="explore" size={32} color={theme.primary} />
            </LinearGradient>
            <Text
              className="text-lg font-bold text-center mb-2"
              style={{ color: theme.text }}
            >
              {step.title}
            </Text>
            <Text
              className="text-xs text-center mb-5 leading-4"
              style={{ color: theme.textSecondary }}
            >
              {step.description}
            </Text>
            <TouchableOpacity onPress={onNext} className="w-full">
              <LinearGradient
                colors={["#0055ff", "#00ff99"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-3 rounded-xl items-center"
              >
                <Text className="text-[#0f0f0f] font-bold text-xs uppercase">
                  {step.buttonText || "Next"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSkip} className="mt-3">
              <Text
                className="text-[10px]"
                style={{ color: theme.textSecondary }}
              >
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

  // Tooltip Calcs
  const tooltipWidth = Math.min(SCREEN_WIDTH * 0.7, 280);
  const tooltipLeft = (SCREEN_WIDTH - tooltipWidth) / 2;
  const targetCenterX = layout.x + layout.width / 2;
  const arrowRelativeX = Math.min(
    Math.max(targetCenterX - tooltipLeft - 8, 10),
    tooltipWidth - 20
  );

  // Border Radius Logic based on 'shape'
  const highlightRadius =
    step.shape === "circle" ? 9999 : step.shape === "card" ? 24 : 16;
  const padding = step.shape === "circle" ? 8 : 4; // Extra padding for icons

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

        {/* Highlight Border */}
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
                className="text-[10px] font-bold ml-1 uppercase"
                style={{ color: theme.primary }}
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
            className="text-base font-bold mb-1"
            style={{ color: theme.text }}
          >
            {step.title}
          </Text>
          <Text
            className="text-xs mb-4 leading-4"
            style={{ color: theme.textSecondary }}
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
                className="text-center font-semibold text-xs"
                style={{ color: theme.textSecondary }}
              >
                Dismiss
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} className="flex-1">
              <LinearGradient
                colors={["#0055ff", "#00ff99"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-2.5 rounded-lg items-center"
              >
                <Text className="text-[#0f0f0f] text-center font-bold text-xs">
                  Next
                </Text>
              </LinearGradient>
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

  let colors = {
    bg: theme.card,
    border: theme.cardBorder,
    icon: theme.primary,
    iconBg: isDarkMode ? "rgba(0, 255, 153, 0.1)" : "rgba(0, 153, 94, 0.1)",
    cost: theme.primary,
    tag: theme.textSecondary,
    tagBg: theme.background,
  };

  if (data.type === "warning") {
    const yellow = isDarkMode ? "#ffaa00" : "#b37400";
    colors = {
      ...colors,
      bg: isDarkMode ? "rgba(255, 170, 0, 0.05)" : "rgba(179, 116, 0, 0.05)",
      icon: yellow,
      iconBg: "rgba(255, 170, 0, 0.15)",
      cost: yellow,
      tag: yellow,
    };
  } else if (data.type === "critical") {
    const red = isDarkMode ? "#ff4444" : "#c62828";
    colors = {
      ...colors,
      bg: isDarkMode ? "rgba(255, 68, 68, 0.05)" : "rgba(198, 40, 40, 0.05)",
      icon: red,
      iconBg: "rgba(255, 68, 68, 0.15)",
      cost: red,
      tag: red,
    };
  } else if (data.type === "off") {
    colors = {
      ...colors,
      icon: theme.textSecondary,
      cost: theme.textSecondary,
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
              className="text-[9px] font-bold"
              style={{ color: colors.tag }}
            >
              {data.tag}
            </Text>
          </View>
        </View>
        <View>
          <Text
            className="text-[13px] font-semibold mb-1"
            style={{ color: theme.text }}
          >
            {data.name}
          </Text>
          <Text
            className="text-[13px] font-semibold mb-0.5"
            style={{ color: colors.cost }}
          >
            {data.cost}
          </Text>
          <Text className="text-[10px]" style={{ color: theme.textSecondary }}>
            {data.watts}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});
