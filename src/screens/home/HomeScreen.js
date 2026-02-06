import React, { useRef, useEffect, useState, useMemo, forwardRef } from "react";
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
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ... (Static Data remains the same)
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
    devices: [],
  },
];

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
];

export default function HomeScreen() {
  const { theme, isDarkMode, fontScale } = useTheme();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const scaledSize = (size) => size * (fontScale || 1);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [tourStepIndex, setTourStepIndex] = useState(-1);
  const [activeLayout, setActiveLayout] = useState(null);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("personal");
  const [activeHubFilter, setActiveHubFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [personalHubs, setPersonalHubs] = useState([]); // Real Hubs Data

  // --- NEW REF: PREVENT INFINITE REDIRECT LOOP ---
  const hasRedirected = useRef(false);

  // --- REFS ---
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const budgetRef = useRef(null);
  const toggleRef = useRef(null);

  // Colors
  const primaryColor = isDarkMode ? theme.buttonPrimary : "#00995e";
  const dangerColor = isDarkMode ? theme.buttonDangerText : "#cc0000";
  const warningColor = isDarkMode ? "#ffaa00" : "#ff9900";

  // --- 1. FETCH REAL HUBS & DEVICES ---
  const fetchHubs = async () => {
    console.log("--- HOME SCREEN FETCHING ---");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // QUERY: Select Hubs AND join Devices
      const { data, error } = await supabase
        .from("hubs")
        .select(
          `
          *,
          devices (*)
        `,
        )
        .eq("user_id", user.id);

      if (error) throw error;

      // ============================================================
      // --- LOGIC: REDIRECT ONLY ONCE PER SESSION ---
      // ============================================================
      if (!data || data.length === 0) {
        setIsLoading(false);

        if (!hasRedirected.current) {
          console.log("First load with 0 hubs. Redirecting to SetupHub...");
          hasRedirected.current = true;
          navigation.navigate("SetupHub");
          return;
        }
      }
      // ============================================================

      // Transform Data
      const formattedHubs = (data || []).map((hub) => {
        const deviceList = hub.devices || [];

        const activeCount = deviceList.filter(
          (d) => d.status && d.status.toLowerCase() === "on",
        ).length;

        return {
          id: hub.id,
          name: hub.name,
          owner: "Me",
          total: deviceList.length,
          active: activeCount,
          icon: hub.icon || "router",
          totalSpending: 0,
          budgetLimit: 0,
          devices: deviceList.map((d) => {
            const isOn = d.status && d.status.toLowerCase() === "on";

            return {
              id: d.id,
              name: d.name,
              cost: isOn ? "Active" : "Standby",
              watts: d.current_power_watts
                ? `${d.current_power_watts} W`
                : "0 W",
              icon: d.icon || "power",
              type: isOn ? "normal" : "off",
              tag: d.outlet_number ? `Outlet ${d.outlet_number}` : "DEVICE",
              status: d.status,
            };
          }),
        };
      });

      setPersonalHubs(formattedHubs);
    } catch (error) {
      console.log("Error fetching hubs:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on focus
  useEffect(() => {
    if (isFocused) {
      fetchHubs();
    }
  }, [isFocused]);

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel("home_combined_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hubs" },
        () => fetchHubs(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "devices" },
        () => fetchHubs(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- 2. NOTIFICATION LISTENER ---
  useEffect(() => {
    let subscription;
    const fetchUnreadCount = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { count, error } = await supabase
          .from("app_notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (!error) setUnreadCount(count || 0);

        subscription = supabase
          .channel("home_notif_count")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "app_notifications",
              filter: `user_id=eq.${user.id}`,
            },
            () => fetchUnreadCount(),
          )
          .subscribe();
      } catch (e) {
        console.log("Notif Count Error:", e);
      }
    };

    if (isFocused) fetchUnreadCount();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [isFocused]);

  // --- FILTER LOGIC ---
  useEffect(() => {
    setActiveHubFilter("all");
  }, [activeTab]);

  const sourceData = activeTab === "personal" ? personalHubs : SHARED_HUBS;
  const displayData =
    activeHubFilter === "all"
      ? sourceData
      : sourceData.filter((h) => h.id === activeHubFilter);

  // --- STATIC BUDGET DATA ---
  const summaryData = useMemo(() => {
    return {
      spending: 850.5,
      limit: 1200.0,
      title: "Total Spending",
      indicator: "All Hubs",
    };
  }, []);

  const percentage = Math.min(
    summaryData.limit > 0
      ? (summaryData.spending / summaryData.limit) * 100
      : 0,
    100,
  );
  let progressBarColor = primaryColor;
  if (percentage >= 90) progressBarColor = dangerColor;
  else if (percentage >= 75) progressBarColor = warningColor;

  const textColor = progressBarColor;

  // --- TOUR LOGIC ---
  const refMap = {
    menuRef,
    notifRef,
    budgetRef,
    toggleRef,
  };

  useEffect(() => {
    checkTourStatus();
  }, []);

  const checkTourStatus = async () => {
    try {
      const hasSeenTour = await AsyncStorage.getItem("hasSeenHomeTour");
      if (hasSeenTour !== "true") setTimeout(() => setTourStepIndex(0), 1500);
    } catch (e) {
      console.log(e);
    }
  };

  const endTour = async () => {
    setTourStepIndex(-1);
    setActiveLayout(null);
    await AsyncStorage.setItem("hasSeenHomeTour", "true");
    setTimeout(() => navigation.navigate("DndCheck"), 500);
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
        if ((width === 0 || height === 0) && retries > 0)
          setTimeout(() => measureRef(targetRef, retries - 1), 100);
        else if (width > 0 && height > 0)
          setActiveLayout({ x, y, width, height });
        else endTour();
      });
    } else endTour();
  };

  useEffect(() => {
    if (tourStepIndex >= 0 && tourStepIndex < TOUR_STEPS.length) {
      const currentStep = TOUR_STEPS[tourStepIndex];
      if (currentStep.id === "welcome") {
        setActiveTab("personal");
        setActiveHubFilter("all");
      }
      if (currentStep.type === "highlight" && currentStep.target) {
        const targetRef = refMap[currentStep.target];
        setTimeout(() => measureRef(targetRef), 200);
      } else setActiveLayout(null);
    }
  }, [tourStepIndex]);

  const handleNextStep = () => {
    if (tourStepIndex + 1 >= TOUR_STEPS.length) endTour();
    else {
      setActiveLayout(null);
      setTourStepIndex((prev) => prev + 1);
    }
  };

  const handleHubSelect = (hubId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveHubFilter(hubId);
  };

  const handleScopeChange = (scope) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(scope);
    setActiveHubFilter("all");
  };

  // --- FULL SCREEN LOADER REMOVED FOR "INSTANT FEEL" ---

  // --- RENDER HELPERS ---
  const renderHubSummary = (hub) => (
    <TouchableOpacity
      key={hub.id}
      activeOpacity={0.7}
      onPress={() => handleHubSelect(hub.id)}
      className="mb-4"
    >
      <View
        className="p-4 rounded-2xl border flex-row items-center"
        style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      >
        <View
          className="w-12 h-12 rounded-xl justify-center items-center mr-4"
          style={{ backgroundColor: theme.buttonNeutral }}
        >
          <MaterialIcons
            name={hub.icon || "router"}
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
            {hub.active}/{hub.total} Devices Active
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

  const renderHubDetail = (hub) => (
    <View key={hub.id} className="mb-5">
      <View className="flex-row justify-between items-center mb-3">
        <Text
          className="font-semibold uppercase tracking-wider"
          style={{ color: theme.textSecondary, fontSize: theme.font.sm }}
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
              style={{ color: theme.text, fontSize: 10, fontWeight: "bold" }}
            >
              {hub.owner} • {hub.permission}
            </Text>
          </View>
        )}
      </View>
      <View>
        {hub.devices.length === 0 ? (
          <Text style={{ color: theme.textSecondary, fontStyle: "italic" }}>
            No devices configured yet.
          </Text>
        ) : (
          hub.devices.map((device) => (
            <DeviceItem
              key={device.id}
              data={device}
              theme={theme}
              isDarkMode={isDarkMode}
              scaledSize={scaledSize}
              onPress={() => {
                navigation.navigate("DeviceControl", {
                  deviceName: device.name,
                  status: device.status,
                  deviceId: device.id,
                });
              }}
            />
          ))
        )}
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

      {/* --- HEADER (ALWAYS VISIBLE) --- */}
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
          {unreadCount > 0 && (
            <View
              className="absolute 0 0 bg-[#ff4d4d] rounded-[7px] w-3.5 h-3.5 justify-center items-center border-2"
              style={{ borderColor: theme.background, top: 4, right: 4 }}
            >
              <Text className="text-white text-[8px] font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerClassName="pb-24"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        <View className="mb-2" />

        {/* --- 1. PILL SWITCHER --- */}
        <View
          ref={toggleRef}
          style={{
            backgroundColor: theme.background,
            alignItems: "center",
            paddingBottom: 4,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              backgroundColor: theme.buttonNeutral,
              borderRadius: 20,
              padding: 4,
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              onPress={() => handleScopeChange("personal")}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor:
                  activeTab === "personal" ? theme.card : "transparent",
                shadowColor: activeTab === "personal" ? "#000" : "transparent",
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: activeTab === "personal" ? 2 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: scaledSize(12),
                  fontWeight: "600",
                  color:
                    activeTab === "personal" ? theme.text : theme.textSecondary,
                }}
              >
                Personal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleScopeChange("shared")}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor:
                  activeTab === "shared" ? theme.card : "transparent",
                shadowColor: activeTab === "shared" ? "#000" : "transparent",
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: activeTab === "shared" ? 2 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: scaledSize(12),
                  fontWeight: "600",
                  color:
                    activeTab === "shared" ? theme.text : theme.textSecondary,
                }}
              >
                Shared
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- 2. BUDGET CARD --- */}
        <Animated.View
          ref={budgetRef}
          collapsable={false}
          style={{
            marginHorizontal: 24,
            marginBottom: 24,
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
                    style={{
                      color: theme.text,
                      fontSize: theme.font["3xl"],
                    }}
                  >
                    ₱{" "}
                    {summaryData.spending.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>

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
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}{" "}
                    Remaining
                  </Text>
                </View>
                <View
                  className="h-3 rounded-full w-full overflow-hidden"
                  style={{
                    backgroundColor: isDarkMode ? "#333" : "#f0f0f0",
                  }}
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
                  value="₱ 120.50"
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

        {/* --- 3. HUB FILTER --- */}
        <View style={{ marginBottom: 20 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => handleHubSelect("all")}
              className="mr-2 px-4 py-2 rounded-xl border"
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

            {sourceData.map((hub) => {
              const isActive = activeHubFilter === hub.id;
              return (
                <TouchableOpacity
                  key={hub.id}
                  onPress={() => handleHubSelect(hub.id)}
                  className="mr-2 px-4 py-2 rounded-xl border flex-row items-center"
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

        {/* --- 4. CONTENT LIST (WITH LOADING SPINNER INSIDE) --- */}
        <View className="px-6 pb-6">
          {/* LOADING STATE - Only affects the list part */}
          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="small" color={theme.textSecondary} />
              <Text
                style={{
                  color: theme.textSecondary,
                  marginTop: 12,
                  fontSize: 12,
                }}
              >
                Syncing Hubs...
              </Text>
            </View>
          ) : (
            <>
              {activeTab === "personal" && activeHubFilter === "all" ? (
                <View>
                  <Text
                    className="font-bold uppercase tracking-widest mb-4"
                    style={{
                      color: theme.textSecondary,
                      fontSize: theme.font.sm,
                    }}
                  >
                    Your Hubs
                  </Text>
                  {displayData.length === 0 ? (
                    <View className="items-center py-4">
                      <MaterialIcons
                        name="router"
                        size={40}
                        color={theme.cardBorder}
                      />
                      <Text
                        style={{ color: theme.textSecondary, marginTop: 8 }}
                      >
                        No hubs connected.
                      </Text>
                    </View>
                  ) : (
                    displayData.map((hub) => renderHubSummary(hub))
                  )}
                </View>
              ) : (
                // Detail View (Devices)
                <View>
                  {displayData.length > 0 ? (
                    displayData.map((hub) => renderHubDetail(hub))
                  ) : (
                    <Text
                      style={{
                        color: theme.textSecondary,
                        textAlign: "center",
                      }}
                    >
                      Select a hub to view devices.
                    </Text>
                  )}
                </View>
              )}
            </>
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

// ... StatItem
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

// ... DeviceItem
const DeviceItem = forwardRef(
  ({ data, theme, isDarkMode, onPress, scaledSize }, ref) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scale, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
      if (onPress) onPress();
    };

    let statusColor = "#22c55e"; // Green
    let bgColor = isDarkMode
      ? "rgba(34, 197, 94, 0.15)"
      : "rgba(0, 153, 94, 0.15)";
    let borderColor = "transparent";

    if (data.type === "warning") {
      statusColor = "#ffaa00";
      bgColor = isDarkMode
        ? "rgba(255, 170, 0, 0.15)"
        : "rgba(179, 116, 0, 0.1)";
    } else if (data.type === "critical") {
      statusColor = isDarkMode ? "#ff4444" : "#cc0000";
      bgColor = isDarkMode ? "rgba(255, 68, 68, 0.15)" : "rgba(204, 0, 0, 0.1)";
      borderColor = statusColor;
    } else if (data.type === "off") {
      statusColor = theme.textSecondary;
      bgColor = theme.buttonNeutral;
    }

    return (
      <TouchableOpacity
        ref={ref}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        className="w-full mb-3"
      >
        <Animated.View
          className="w-full rounded-[20px] p-4 flex-row items-center border"
          style={{
            backgroundColor: theme.card,
            borderColor:
              data.type === "critical" ? borderColor : theme.cardBorder,
            transform: [{ scale }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
            style={{ backgroundColor: bgColor }}
          >
            <MaterialIcons name={data.icon} size={24} color={statusColor} />
          </View>

          <View className="flex-1 justify-center">
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className="font-bold"
                style={{ color: theme.text, fontSize: scaledSize(15) }}
              >
                {data.name}
              </Text>
              {data.tag && (
                <View
                  className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{
                    backgroundColor: theme.buttonNeutral,
                  }}
                >
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 9,
                      fontWeight: "700",
                    }}
                  >
                    {data.tag}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center">
              <Text
                style={{
                  color:
                    data.type === "off" ? theme.textSecondary : statusColor,
                  fontWeight: "600",
                  fontSize: scaledSize(12),
                  marginRight: 8,
                }}
              >
                {data.cost}
              </Text>
              {data.watts !== "0 W" && (
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  • {data.watts}
                </Text>
              )}
            </View>
          </View>

          <MaterialIcons
            name="chevron-right"
            size={24}
            color={theme.textSecondary}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  },
);

// ... TourOverlay
const TourOverlay = ({
  step,
  layout,
  theme,
  isDarkMode,
  onNext,
  onSkip,
  scaledSize,
}) => {
  if (!layout) return null;
  return (
    <Modal transparent visible={true} animationType="fade">
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
          }}
          onPress={onNext}
        />
        <View
          style={{
            position: "absolute",
            top: layout.y,
            left: layout.x,
            width: layout.width,
            height: layout.height,
            borderColor: "white",
            borderWidth: 2,
            borderRadius: step.shape === "circle" ? layout.width / 2 : 12,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: layout.y + layout.height + 20,
            left: 20,
            right: 20,
            backgroundColor: theme.card,
            padding: 20,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              color: theme.text,
              marginBottom: 8,
            }}
          >
            {step.title}
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            {step.description}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <TouchableOpacity onPress={onSkip} style={{ marginRight: 20 }}>
              <Text style={{ color: theme.textSecondary, fontWeight: "bold" }}>
                Skip
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext}>
              <Text style={{ color: theme.buttonPrimary, fontWeight: "bold" }}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
