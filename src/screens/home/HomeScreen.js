import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useMemo,
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
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../context/ThemeContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
    id: "menu",
    type: "highlight",
    title: "Main Menu",
    description:
      "Access settings, hub configuration, and account management here.",
    target: "menuRef",
    shape: "circle",
  },
  {
    id: "toggle",
    type: "highlight",
    title: "Shared Access",
    description:
      "Switch between your Personal Hubs and Hubs shared with you by family or friends.",
    target: "toggleRef",
    shape: "rect",
  },
  {
    id: "budget",
    type: "highlight",
    title: "Budget Overview",
    description:
      "Track your monthly spending, remaining budget, and daily usage average.",
    target: "budgetRef",
    shape: "card",
  },
  {
    id: "aircon",
    type: "highlight",
    title: "Active Devices",
    description:
      "Monitor high-consumption devices like your Air Conditioner in real-time.",
    target: "deviceRef1",
    shape: "rect",
  },
  {
    id: "smarttv",
    type: "highlight",
    title: "Usage Limits",
    description:
      "Devices with 'LIMIT' tags warn you if they exceed their set budget.",
    target: "limitDeviceRef",
    shape: "rect",
  },
  {
    id: "outlet",
    type: "highlight",
    title: "Fault Detection",
    description:
      "Critical errors (Red) like short circuits are flagged immediately for safety.",
    target: "errorDeviceRef",
    shape: "rect",
  },
  {
    id: "fan",
    type: "highlight",
    title: "Offline Devices",
    description:
      "Inactive devices appear in gray. Tap to troubleshoot connection issues.",
    target: "offlineDeviceRef",
    shape: "rect",
  },
];

// --- PERSONAL HUBS ---
const PERSONAL_HUBS = [
  {
    id: "hub1",
    name: "Living Room Hub",
    owner: "Me",
    active: 4,
    total: 4,
    icon: "weekend",
    totalSpending: 850.5,
    budgetLimit: 1200.0,
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
    owner: "Me",
    active: 2,
    total: 2,
    icon: "kitchen",
    totalSpending: 600.25,
    budgetLimit: 700.0,
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

// --- SHARED HUBS ---
const SHARED_HUBS = [
  {
    id: "hub3",
    name: "Francis' Garage",
    owner: "Francis Gian",
    permission: "Admin",
    active: 1,
    total: 3,
    icon: "garage",
    totalSpending: 320.0,
    budgetLimit: 5000.0,
    devices: [
      {
        id: 7,
        name: "Power Tools",
        cost: "₱ 5.50 / hr",
        watts: "800 W",
        icon: "handyman",
        type: "normal",
        tag: "SHARED",
      },
      {
        id: 8,
        name: "Garage Light",
        cost: "Offline",
        watts: "0 W",
        icon: "lightbulb",
        type: "off",
        tag: "SHARED",
      },
    ],
  },
  {
    id: "hub4",
    name: "Cielo's House",
    owner: "Cielo Cortado",
    permission: "Guest",
    active: 4,
    total: 6,
    icon: "home",
    totalSpending: 2100.0,
    budgetLimit: 4000.0,
    devices: [
      {
        id: 9,
        name: "Main AC",
        cost: "₱ 12.00 / hr",
        watts: "1100 W",
        icon: "ac-unit",
        type: "normal",
        tag: "SHARED",
      },
    ],
  },
];

export default function HomeScreen() {
  const { theme, isDarkMode, fontScale } = useTheme();
  const navigation = useNavigation();
  const scaledSize = (size) => size * (fontScale || 1);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [tourStepIndex, setTourStepIndex] = useState(-1);
  const [activeLayout, setActiveLayout] = useState(null);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("personal"); // 'personal' or 'shared'
  const [activeHubFilter, setActiveHubFilter] = useState("all"); // 'all' or specific hub ID

  // --- REFS ---
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const budgetRef = useRef(null);
  const toggleRef = useRef(null);

  const deviceRef1 = useRef(null); // Aircon
  const limitDeviceRef = useRef(null); // Smart TV
  const errorDeviceRef = useRef(null); // Outlet
  const offlineDeviceRef = useRef(null); // Fan

  // Colors
  const primaryColor = isDarkMode ? theme.buttonPrimary : "#00995e";
  const dangerColor = isDarkMode ? theme.buttonDangerText : "#cc0000";
  const warningColor = isDarkMode ? "#ffaa00" : "#ff9900";

  // --- FILTER LOGIC ---
  useEffect(() => {
    // UPDATED: Default to 'all' for BOTH tabs now
    setActiveHubFilter("all");
  }, [activeTab]);

  const sourceData = activeTab === "personal" ? PERSONAL_HUBS : SHARED_HUBS;
  const displayData =
    activeHubFilter === "all"
      ? sourceData
      : sourceData.filter((h) => h.id === activeHubFilter);

  // Dynamic Budget Calculation
  const summaryData = useMemo(() => {
    if (activeHubFilter === "all") {
      const totalSpending = sourceData.reduce(
        (acc, hub) => acc + (hub.totalSpending || 0),
        0
      );
      const totalLimit = sourceData.reduce(
        (acc, hub) => acc + (hub.budgetLimit || 0),
        0
      );
      return {
        spending: totalSpending,
        limit: totalLimit,
        title: "Total Spending",
        indicator: "All Hubs",
      };
    } else {
      const hub = sourceData.find((h) => h.id === activeHubFilter);
      return {
        spending: hub?.totalSpending || 0,
        limit: hub?.budgetLimit || 0,
        title: activeTab === "personal" ? "Room Spending" : "Hub Spending",
        indicator: hub?.name || "Selected Hub",
      };
    }
  }, [activeHubFilter, activeTab, sourceData]);

  const percentage = Math.min(
    summaryData.limit > 0
      ? (summaryData.spending / summaryData.limit) * 100
      : 0,
    100
  );

  let progressBarColor = primaryColor;
  if (percentage >= 90) progressBarColor = dangerColor;
  else if (percentage >= 75) progressBarColor = warningColor;

  const textColor = progressBarColor;

  const refMap = {
    menuRef,
    notifRef,
    budgetRef,
    toggleRef,
    deviceRef1,
    limitDeviceRef,
    errorDeviceRef,
    offlineDeviceRef,
  };

  useEffect(() => {
    checkTourStatus();
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const checkTourStatus = async () => {
    try {
      const hasSeenTour = await AsyncStorage.getItem("hasSeenHomeTour");
      if (hasSeenTour !== "true") {
        setTimeout(() => setTourStepIndex(0), 1500);
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

  const handleResetTour = async () => {
    setActiveTab("personal");
    setActiveHubFilter("all");
    await AsyncStorage.removeItem("hasSeenHomeTour");
    setTourStepIndex(0);
  };

  const measureRef = (targetRef, retries = 3) => {
    if (targetRef?.current) {
      targetRef.current.measureInWindow((x, y, width, height) => {
        if ((width === 0 || height === 0) && retries > 0) {
          setTimeout(() => measureRef(targetRef, retries - 1), 100);
        } else if (width > 0 && height > 0) {
          setActiveLayout({ x, y, width, height });
        } else {
          endTour();
        }
      });
    } else {
      endTour();
    }
  };

  useEffect(() => {
    if (tourStepIndex >= 0 && tourStepIndex < TOUR_STEPS.length) {
      const currentStep = TOUR_STEPS[tourStepIndex];

      // --- AUTO-NAVIGATE FOR TOUR ---
      if (currentStep.id === "aircon") {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveHubFilter("hub1"); // Force open Hub 1
      }
      if (currentStep.id === "welcome") {
        setActiveTab("personal");
        setActiveHubFilter("all");
      }
      // -----------------------------

      if (currentStep.type === "highlight" && currentStep.target) {
        const targetRef = refMap[currentStep.target];
        const delay = currentStep.id === "aircon" ? 500 : 200;
        setTimeout(() => measureRef(targetRef), delay);
      } else {
        setActiveLayout(null);
      }
    }
  }, [tourStepIndex]);

  const handleNextStep = () => {
    if (tourStepIndex + 1 >= TOUR_STEPS.length) {
      endTour();
    } else {
      setActiveLayout(null);
      setTourStepIndex((prev) => prev + 1);
    }
  };

  const handleHubSelect = (hubId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveHubFilter(hubId);
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

  // --- RENDER HELPERS ---

  // 1. Summary Card (For "My Hubs" -> "All" view)
  const renderHubSummary = (hub) => (
    <TouchableOpacity
      key={hub.id}
      activeOpacity={0.7}
      onPress={() => handleHubSelect(hub.id)}
      className="mb-4"
    >
      <View
        className="p-4 rounded-2xl border flex-row items-center"
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        }}
      >
        <View
          className="w-12 h-12 rounded-xl justify-center items-center mr-4"
          style={{ backgroundColor: theme.buttonNeutral }}
        >
          <MaterialIcons
            name={hub.icon}
            size={24}
            color={theme.buttonPrimary}
          />
        </View>
        <View className="flex-1">
          <Text
            className="font-bold text-lg"
            style={{ color: theme.text, fontSize: scaledSize(16) }}
          >
            {hub.name}
          </Text>
          <Text
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            {hub.active}/{hub.total} Devices Active • ₱
            {hub.totalSpending.toLocaleString()}
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={theme.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  // 2. Detail Card (For "Shared" or "My Hubs -> Specific Hub" view)
  const renderHubDetail = (hub) => (
    <View key={hub.id} className="mb-5">
      <View className="flex-row justify-between items-center mb-3">
        <Text
          className="font-semibold uppercase tracking-wider"
          style={{
            color: theme.textSecondary,
            fontSize: theme.font.sm,
          }}
        >
          {hub.name} Devices
        </Text>

        {activeTab === "shared" && (
          <View
            className="px-2 py-1 rounded-md flex-row items-center"
            style={{ backgroundColor: theme.buttonNeutral }}
          >
            <MaterialIcons
              name="person"
              size={12}
              color={theme.text}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                color: theme.text,
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              {hub.owner} • {hub.permission}
            </Text>
          </View>
        )}
      </View>

      <View>
        {hub.devices.map((device) => {
          let currentRef = null;
          // Attach tour refs ONLY if this hub is visible
          if (
            activeHubFilter === hub.id ||
            (activeTab === "personal" && activeHubFilter === "all" && false)
          ) {
            if (device.id === 1) currentRef = deviceRef1;
            else if (device.id === 2) currentRef = limitDeviceRef;
            else if (device.id === 3) currentRef = errorDeviceRef;
            else if (device.id === 4) currentRef = offlineDeviceRef;
          }

          return (
            <DeviceItem
              key={device.id}
              ref={currentRef}
              data={device}
              theme={theme}
              isDarkMode={isDarkMode}
              scaledSize={scaledSize}
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
          );
        })}
      </View>
    </View>
  );

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
          collapsable={false}
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
          collapsable={false}
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
        stickyHeaderIndices={[1]}
      >
        <View className="mb-2" />

        {/* --- VIEW TOGGLE --- */}
        <View
          ref={toggleRef}
          collapsable={false}
          style={{
            backgroundColor: theme.background,
            paddingHorizontal: 24,
            paddingBottom: 4,
          }}
        >
          <View className="mb-4">
            <View
              className="flex-row rounded-xl p-1"
              style={{ backgroundColor: theme.buttonNeutral }}
            >
              <TouchableOpacity
                onPress={() => setActiveTab("personal")}
                className="flex-1 py-2 rounded-lg items-center justify-center"
                style={{
                  backgroundColor:
                    activeTab === "personal" ? theme.card : "transparent",
                  shadowColor:
                    activeTab === "personal" ? "#000" : "transparent",
                  shadowOpacity: activeTab === "personal" ? 0.1 : 0,
                  shadowRadius: 2,
                  elevation: activeTab === "personal" ? 2 : 0,
                }}
              >
                <Text
                  className="font-bold"
                  style={{
                    color:
                      activeTab === "personal"
                        ? theme.text
                        : theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  My Hubs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("shared")}
                className="flex-1 py-2 rounded-lg items-center justify-center"
                style={{
                  backgroundColor:
                    activeTab === "shared" ? theme.card : "transparent",
                  shadowColor: activeTab === "shared" ? "#000" : "transparent",
                  shadowOpacity: activeTab === "shared" ? 0.1 : 0,
                  shadowRadius: 2,
                  elevation: activeTab === "shared" ? 2 : 0,
                }}
              >
                <Text
                  className="font-bold"
                  style={{
                    color:
                      activeTab === "shared" ? theme.text : theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  Shared
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* HUB FILTER BAR (NOW VISIBLE FOR BOTH) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
          >
            {/* 'All' Chip */}
            <TouchableOpacity
              onPress={() => handleHubSelect("all")}
              className="mr-3 px-4 py-2 rounded-full border"
              style={{
                backgroundColor:
                  activeHubFilter === "all" ? theme.buttonPrimary : theme.card,
                borderColor:
                  activeHubFilter === "all"
                    ? theme.buttonPrimary
                    : theme.cardBorder,
              }}
            >
              <Text
                className="font-bold"
                style={{
                  color:
                    activeHubFilter === "all"
                      ? theme.buttonPrimaryText
                      : theme.textSecondary,
                  fontSize: scaledSize(11),
                }}
              >
                All
              </Text>
            </TouchableOpacity>

            {/* Hub Chips (Iterates sourceData: Personal or Shared) */}
            {sourceData.map((hub) => {
              const isActive = activeHubFilter === hub.id;
              return (
                <TouchableOpacity
                  key={hub.id}
                  onPress={() => handleHubSelect(hub.id)}
                  className="mr-3 px-4 py-2 rounded-full border flex-row items-center"
                  style={{
                    backgroundColor: isActive
                      ? theme.buttonPrimary
                      : theme.card,
                    borderColor: isActive
                      ? theme.buttonPrimary
                      : theme.cardBorder,
                  }}
                >
                  <Text
                    className="font-bold"
                    style={{
                      color: isActive
                        ? theme.buttonPrimaryText
                        : theme.textSecondary,
                      fontSize: scaledSize(11),
                    }}
                  >
                    {hub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Animated.View
          ref={budgetRef}
          collapsable={false}
          style={{
            marginHorizontal: 24, // Maintained
            marginBottom: 20,
            marginTop: 10,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("Budgets")}
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
                    {summaryData.title}
                  </Text>
                  <Text
                    className="font-extrabold"
                    style={{ color: theme.text, fontSize: theme.font["3xl"] }}
                  >
                    ₱{" "}
                    {summaryData.spending.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>

                  {/* INDICATOR BADGE */}
                  <View
                    className="flex-row items-center mt-1 px-2 py-0.5 rounded-md self-start"
                    style={{ backgroundColor: theme.buttonNeutral }}
                  >
                    <MaterialIcons
                      name={activeHubFilter === "all" ? "grid-view" : "room"}
                      size={10}
                      color={theme.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        color: theme.textSecondary,
                        fontWeight: "600",
                      }}
                    >
                      Viewing: {summaryData.indicator}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text
                    className="uppercase font-bold"
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(10),
                    }}
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
                    ₱{" "}
                    {summaryData.limit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>

              <View className="mb-4 mt-3">
                <View className="flex-row justify-between mb-1.5">
                  <Text
                    className="font-medium"
                    style={{ color: textColor, fontSize: theme.font.xs }}
                  >
                    {percentage.toFixed(0)}% Used
                  </Text>
                  <Text
                    className="font-medium"
                    style={{
                      color: theme.textSecondary,
                      fontSize: theme.font.xs,
                    }}
                  >
                    ₱{" "}
                    {(summaryData.limit - summaryData.spending).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}{" "}
                    Remaining
                  </Text>
                </View>
                <View
                  className="h-3 rounded-full w-full overflow-hidden"
                  style={{ backgroundColor: isDarkMode ? "#333" : "#f0f0f0" }}
                >
                  <View
                    style={{
                      width: `${percentage}%`,
                      height: "100%",
                      borderRadius: 99,
                      backgroundColor: progressBarColor,
                    }}
                  />
                </View>
              </View>

              <View
                className="flex-row border-t pt-4"
                style={{ borderColor: theme.cardBorder }}
              >
                <StatItem
                  label="Daily Avg"
                  value={activeHubFilter === "all" ? "₱ 120.50" : "₱ 45.20"}
                  icon="trending-up"
                  theme={theme}
                  isDarkMode={isDarkMode}
                  scaledSize={scaledSize}
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
                  scaledSize={scaledSize}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* --- DYNAMIC HUB LIST OR SUMMARY LIST --- */}
        <View className="px-6 pb-6">
          {/* PERSONAL TAB + ALL FILTER: Show Summary Cards Only */}
          {activeTab === "personal" && activeHubFilter === "all" ? (
            <View>
              <Text
                className="font-bold uppercase tracking-widest mb-4"
                style={{ color: theme.textSecondary, fontSize: theme.font.sm }}
              >
                Your Hubs
              </Text>
              {displayData.map((hub) => renderHubSummary(hub))}
            </View>
          ) : // SHARED OR SPECIFIC HUB: Show Details (Devices)
          displayData.length > 0 ? (
            displayData.map((hub) => renderHubDetail(hub))
          ) : (
            <Text style={{ color: theme.textSecondary, textAlign: "center" }}>
              No hub selected.
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("SetupHub")}
          className="mx-6 mb-8 py-4 rounded-xl border border-dashed flex-row justify-center items-center"
          style={{ borderColor: theme.textSecondary }}
        >
          <MaterialIcons name="add" size={20} color={theme.textSecondary} />
          <Text
            className="ml-2 font-bold uppercase tracking-wider"
            style={{ color: theme.textSecondary, fontSize: theme.font.xs }}
          >
            {activeTab === "personal" ? "Add New Device" : "Join Shared Hub"}
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
          scaledSize={scaledSize}
        />
      )}
    </SafeAreaView>
  );
}

// ... (StatItem, TourOverlay, DeviceItem) code remains exactly the same as previous
function StatItem({ label, value, icon, theme, isDarkMode, scaledSize }) {
  return (
    <View className="flex-1 flex-row items-center gap-3">
      <View
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: "transparent" }}
      >
        <MaterialIcons name={icon} size={20} color={theme.textSecondary} />
      </View>
      <View>
        <Text
          className="font-medium uppercase"
          style={{
            color: theme.textSecondary,
            fontSize: scaledSize ? scaledSize(10) : 10,
          }}
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

const TourOverlay = ({
  step,
  layout,
  theme,
  isDarkMode,
  onNext,
  onSkip,
  scaledSize,
}) => {
  const tourColor = isDarkMode ? theme.buttonPrimary : "#00995e";

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
              <MaterialIcons name="explore" size={32} color={tourColor} />
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
                style={{ backgroundColor: tourColor }}
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
            borderColor: tourColor,
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
            top: showTooltipBelow ? layout.y + layout.height + 20 : undefined,
            bottom: !showTooltipBelow
              ? SCREEN_HEIGHT - layout.y + 20
              : undefined,
          }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <MaterialIcons name="info-outline" size={14} color={tourColor} />
              <Text
                className="font-bold ml-1 uppercase"
                style={{
                  color: tourColor,
                  fontSize: scaledSize ? scaledSize(10) : 10,
                }}
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
                style={{ backgroundColor: tourColor }}
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
              top: showTooltipBelow ? -8 : undefined,
              bottom: !showTooltipBelow ? -8 : undefined,
              transform: showTooltipBelow ? [] : [{ rotate: "180deg" }],
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const DeviceItem = forwardRef(
  ({ data, theme, isDarkMode, onPress, scaledSize }, ref) => {
    const scale = useRef(new Animated.Value(1)).current;

    const pressIn = () =>
      Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
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
      bg: theme.card,
      border: theme.cardBorder,
      icon: theme.buttonPrimary,
      iconBg: theme.buttonNeutral,
      text: theme.text,
      cost: theme.text,
      watts: theme.textSecondary,
    };

    if (data.type === "warning") {
      colors = {
        bg: isDarkMode ? "rgba(255, 170, 0, 0.1)" : "rgba(179, 116, 0, 0.1)",
        border: yellow,
        icon: yellow,
        iconBg: isDarkMode
          ? "rgba(255, 170, 0, 0.2)"
          : "rgba(179, 116, 0, 0.2)",
        text: theme.text,
        cost: theme.text,
        watts: theme.textSecondary,
      };
    } else if (data.type === "critical") {
      colors = {
        bg: isDarkMode ? "rgba(255, 68, 68, 0.1)" : "rgba(198, 40, 40, 0.1)",
        border: red,
        icon: red,
        iconBg: isDarkMode
          ? "rgba(255, 68, 68, 0.2)"
          : "rgba(198, 40, 40, 0.2)",
        text: theme.text,
        cost: theme.text,
        watts: theme.textSecondary,
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
      };
    }

    let badgeText = "ONLINE";
    let badgeBg = theme.buttonPrimary;
    let badgeTextColor = "#FFFFFF";

    if (data.type === "off") {
      badgeText = "OFFLINE";
      badgeBg = theme.buttonNeutral;
      badgeTextColor = theme.textSecondary;
    } else if (data.type === "warning") {
      badgeText = "LIMIT";
      badgeBg = yellow;
      badgeTextColor = "#FFFFFF";
    } else if (data.type === "critical") {
      badgeText = "ERROR";
      badgeBg = red;
      badgeTextColor = "#FFFFFF";
    }

    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        className="w-full mb-3"
        collapsable={false}
      >
        <Animated.View
          className="w-full rounded-[20px] p-4 flex-row items-center border"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.border,
            transform: [{ scale }],
            borderWidth: data.type === "normal" ? 1.5 : 1,
          }}
        >
          <View
            className="w-12 h-12 rounded-[14px] justify-center items-center mr-4"
            style={{ backgroundColor: colors.iconBg }}
          >
            <MaterialIcons name={data.icon} size={24} color={colors.icon} />
          </View>

          <View className="flex-1">
            <Text
              className="font-bold mb-0.5"
              style={{ color: colors.text, fontSize: theme.font.base }}
            >
              {data.name}
            </Text>
            <Text
              className="font-medium"
              style={{ color: colors.cost, fontSize: theme.font.sm }}
            >
              {data.type === "off" ? "No Active Load" : data.cost}
            </Text>
            <Text
              style={{
                color: colors.watts,
                fontSize: scaledSize ? scaledSize(10) : 10,
              }}
            >
              {data.watts}
            </Text>
          </View>

          <View
            className="py-1 rounded-md justify-center items-center"
            style={{
              backgroundColor: badgeBg,
              minWidth: 60,
              paddingHorizontal: 8,
            }}
          >
            <Text
              className="font-bold"
              style={{
                color: badgeTextColor,
                fontSize: scaledSize ? scaledSize(10) : 10,
              }}
            >
              {badgeText}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }
);
