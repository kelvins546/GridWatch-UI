import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  forwardRef,
  useCallback,
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
  RefreshControl,
  StyleSheet,
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
    id: "notifications",
    type: "highlight",
    title: "Notifications",
    description:
      "Stay updated with alerts about your energy usage, budget limits, and system status.",
    target: "notifRef",
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
    id: "hubs",
    type: "highlight",
    title: "Hub Selection",
    description:
      "Filter your dashboard by specific hubs or view all connected devices at once.",
    target: "hubsRef",
    shape: "rect",
  },
];

export default function HomeScreen() {
  const { theme, isDarkMode, fontScale } = useTheme();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const scaledSize = (size) => size * (fontScale || 1);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [tourStepIndex, setTourStepIndex] = useState(-1);
  const [activeLayout, setActiveLayout] = useState(null);

  const [activeTab, setActiveTab] = useState("personal");
  const [activeHubFilter, setActiveHubFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRate, setUserRate] = useState(12.0);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [billingDay, setBillingDay] = useState(1);
  const [deviceUsage, setDeviceUsage] = useState({});

  const [rawHubs, setRawHubs] = useState([]);
  const [rawSharedHubs, setRawSharedHubs] = useState([]);
  const [personalHubs, setPersonalHubs] = useState([]);
  const [sharedHubs, setSharedHubs] = useState([]);
  const [now, setNow] = useState(Date.now());

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedHubId, setSelectedHubId] = useState(null);

  const sourceData = activeTab === "personal" ? personalHubs : sharedHubs;
  const displayData =
    activeHubFilter === "all"
      ? sourceData
      : sourceData.filter((h) => h.id === activeHubFilter);

  const hasRedirected = useRef(false);

  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const budgetRef = useRef(null);
  const toggleRef = useRef(null);
  const hubsRef = useRef(null);

  const primaryColor = isDarkMode ? theme.buttonPrimary : "#00995e";
  const dangerColor = isDarkMode ? theme.buttonDangerText : "#cc0000";
  const warningColor = isDarkMode ? "#ffaa00" : "#ff9900";

  const fetchHubs = async (isRefetch = false) => {
    if (!isRefetch && rawHubs.length === 0 && rawSharedHubs.length === 0) setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userSettings } = await supabase
        .from("users")
        .select("monthly_budget, bill_cycle_day")
        .eq("id", user.id)
        .single();

      const { data: rateData } = await supabase
        .from("users")
        .select(`
          custom_rate,
          utility_rates ( rate_per_kwh )
        `)
        .eq("id", user.id)
        .single();

      let finalRate = 12.0;
      let budget = 0;
      let cycleDay = 1;

      if (userSettings) {
        budget = userSettings.monthly_budget || 0;
        cycleDay = userSettings.bill_cycle_day || 1;
      }

      if (rateData) {
        if (rateData.custom_rate) finalRate = rateData.custom_rate;
        else if (rateData.utility_rates?.rate_per_kwh)
          finalRate = rateData.utility_rates.rate_per_kwh;
      }
      setUserRate(finalRate);
      setMonthlyBudget(budget);
      setBillingDay(cycleDay);

      const dateNow = new Date();
      let startDate = new Date(dateNow.getFullYear(), dateNow.getMonth(), cycleDay);
      if (dateNow.getDate() < cycleDay) {
        startDate = new Date(dateNow.getFullYear(), dateNow.getMonth() - 1, cycleDay);
      }
      const startDateStr = startDate.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("hubs")
        .select(`*, devices (*)`)
        .eq("user_id", user.id);

      if (error) throw error;

      // Fetch Shared Hubs
      const { data: sharedData, error: sharedError } = await supabase
        .from("hub_access")
        .select(`
          role,
          hubs (
            *,
            devices (*),
            users ( email )
          )
        `)
        .eq("user_id", user.id);

      let validShared = [];
      if (!sharedError && sharedData) {
        validShared = sharedData
          .filter((item) => item.hubs)
          .map((item) => ({
            ...item.hubs,
            permission: item.role,
            owner_email: item.hubs.users?.email,
          }));
        setRawSharedHubs(validShared);
      }

      const allHubs = [...(data || []), ...validShared];
      const allDeviceIds = allHubs.flatMap((h) => h.devices?.map((d) => d.id) || []);

      let usageObj = {};
      if (allDeviceIds.length > 0) {
        const { data: usageData } = await supabase
          .from("usage_analytics")
          .select("device_id, cost_incurred")
          .in("device_id", allDeviceIds)
          .gte("date", startDateStr);

        usageData?.forEach((row) => {
          usageObj[row.device_id] = (usageObj[row.device_id] || 0) + (row.cost_incurred || 0);
        });
      }
      setDeviceUsage(usageObj);

      if ((!data || data.length === 0) && (!sharedData || sharedData.length === 0)) {
        setIsLoading(false);
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          navigation.navigate("SetupHub");
          return;
        }
      }

      setRawHubs(data || []);
    } catch (error) {
      console.log("Error fetching hubs:", error.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHubs(true);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const formatHubData = (hubList, isPersonal) => hubList.map((hub) => {
      let isHubOnline = false;
      if (hub.last_seen) {
        let timeStr = hub.last_seen.replace(" ", "T");
        if (!timeStr.endsWith("Z") && !timeStr.includes("+")) timeStr += "Z";
        const lastSeenMs = new Date(timeStr).getTime();

        if (!isNaN(lastSeenMs)) {
          const diffSeconds = (now - lastSeenMs) / 1000;
          isHubOnline = diffSeconds < 90;
        }
      }

      const deviceList = (hub.devices || []).sort(
        (a, b) => (a.outlet_number || 0) - (b.outlet_number || 0),
      );

      const activeCount = deviceList.filter(
        (d) => d.status && d.status.toLowerCase() === "on",
      ).length;

      const hubSpending = deviceList.reduce((sum, d) => sum + (deviceUsage[d.id] || 0), 0);
      const hubLimit = hub.hub_budget || 0;

      const rawVoltage = hub.current_voltage ? Number(hub.current_voltage) : 0;

      const hubVoltage = isHubOnline ? rawVoltage : 0;

      return {
        id: hub.id,
        serial: hub.serial_number,
        name: hub.name,
        owner: "Me",
        owner: isPersonal ? "Me" : (hub.owner_email || "Shared Hub"),
        permission: isPersonal ? "Owner" : (hub.permission || "View"),
        total: deviceList.length,
        active: isHubOnline ? activeCount : 0,
        icon: hub.icon || "router",
        totalSpending: hubSpending,
        budgetLimit: hubLimit,
        currentVoltage: hubVoltage,
        devices: deviceList.map((d) => {
          if (!isHubOnline) {
            return {
              id: d.id,
              name: d.name,
              statusText: "Offline",
              watts: "---",
              volts: "0 V",
              costPerHr: "---",
              icon: "wifi-off",
              type: "off",
              tag: d.outlet_number ? `Outlet ${d.outlet_number}` : "DEVICE",
              status: "offline",
              dbType: d.type,
            };
          }

          const isOn = d.status && d.status.toLowerCase() === "on";
          const isUnused = d.type === "Unused";
          const watts = d.current_power_watts || 0;
          const costPerHour = (watts / 1000) * userRate;

          return {
            id: d.id,
            name: d.name,
            statusText: isUnused
              ? "Not Configured"
              : isOn
                ? "Active"
                : "Standby",
            watts: isUnused ? "---" : `${watts.toFixed(1)} W`,
            volts: isUnused ? "0 V" : `${hubVoltage.toFixed(1)} V`,
            costPerHr: isUnused ? "---" : `₱ ${costPerHour.toFixed(2)} / hr`,
            icon: d.icon || "power",
            type: isUnused ? "off" : isOn ? "normal" : "off",
            tag: d.outlet_number ? `Outlet ${d.outlet_number}` : "DEVICE",
            status: d.status,
            dbType: d.type,
          };
        }),
      };
    });

    setPersonalHubs(formatHubData(rawHubs, true));
    setSharedHubs(formatHubData(rawSharedHubs, false));
  }, [rawHubs, rawSharedHubs, now, userRate, deviceUsage]);

  useEffect(() => {
    if (isFocused) fetchHubs();
    let channel;
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFocused) fetchHubs();

      channel = supabase
        .channel("home_combined_realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "hubs" },
          () => fetchHubs(true),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "devices" },
          () => fetchHubs(true),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "hub_access", filter: `user_id=eq.${user.id}` },
          () => fetchHubs(true),
        )
        .subscribe();
    };

    setupRealtime();
    const timer = setInterval(() => setNow(Date.now()), 2000);

    return () => {
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [isFocused]);

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

  const refMap = { menuRef, notifRef, budgetRef, toggleRef, hubsRef };

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
            {hub.active}/{hub.total} Devices Active •{" "}
            {hub.currentVoltage.toFixed(0)}V
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
        <View className="flex-row items-center gap-2">
          { }
          <View
            style={{
              backgroundColor: theme.buttonNeutral,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              {hub.currentVoltage.toFixed(1)} V
            </Text>
          </View>
        </View>
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
                if (device.dbType === "Unused") {
                  setSelectedHubId(hub.serial || hub.id);
                  setShowConfigModal(true);
                } else {
                  navigation.navigate("DeviceControl", {
                    deviceName: device.name,
                    status: device.status,
                    deviceId: device.id,
                  });
                }
              }}
            />
          ))
        )}
      </View>
    </View>
  );

  const summaryData = useMemo(() => {
    let spending = 0;
    let limit = 0;
    let title = "Total Spending";
    let indicator = "All Hubs";

    if (activeHubFilter === "all") {
      spending = sourceData.reduce(
        (acc, hub) => acc + Number(hub.totalSpending || 0),
        0
      );

      limit = Number(monthlyBudget || 0);

      indicator =
        activeTab === "personal"
          ? "All Personal Hubs"
          : "All Shared Hubs";
    } else {
      const hub = sourceData.find(
        (h) => String(h.id) === String(activeHubFilter)
      );

      if (hub) {
        spending = Number(hub.totalSpending || 0);

        // 🔥 CHECK YOUR ACTUAL FIELD NAME HERE
        limit = Number(
          hub.budgetLimit ||
          hub.hub_budget ||
          hub.budget ||
          0
        );

        title = hub.name;
        indicator = "Single Hub";
      }
    }

    return { spending, limit, title, indicator };
  }, [sourceData, monthlyBudget, activeHubFilter, activeTab]);

  const getOrdinalSuffix = (day) => {
    const d = parseInt(day);
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  const daysElapsed = useMemo(() => {
    const dateNow = new Date();
    let startDate = new Date(dateNow.getFullYear(), dateNow.getMonth(), billingDay);
    if (dateNow.getDate() < billingDay) {
      startDate = new Date(dateNow.getFullYear(), dateNow.getMonth() - 1, billingDay);
    }
    const diffTime = Math.abs(dateNow - startDate);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, days);
  }, [billingDay]);

  const rawPercentage =
    summaryData.limit > 0
      ? (summaryData.spending / summaryData.limit) * 100
      : 0;

  // Clamp between 0–100 for UI bar
  const percentage = Math.max(0, Math.min(rawPercentage, 100));


  let progressBarColor = primaryColor;
  if (rawPercentage >= 90) progressBarColor = dangerColor;
  else if (rawPercentage >= 75) progressBarColor = warningColor;

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

      { }
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

        { }
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.textSecondary}
            colors={[theme.buttonPrimary]}
          />
        }
      >
        <View className="mb-2" />

        { }
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

        { }
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
                    style={{ color: summaryData.limit > 0 ? progressBarColor : theme.textSecondary, fontSize: theme.font.xs }}
                  >
                    {summaryData.limit > 0 ? `${rawPercentage.toFixed(2)}% Used` : "No Limit Set"}
                  </Text>
                  {summaryData.limit > 0 && (
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
                  )}
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
                  value={`₱ ${(summaryData.spending / daysElapsed).toFixed(2)}`}
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
                  value={`Every ${billingDay}${getOrdinalSuffix(billingDay)}`}
                  icon="event-repeat"
                  theme={theme}
                  isDarkMode={isDarkMode}
                  scaledSize={scaledSize}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        { }
        <View ref={hubsRef} style={{ marginBottom: 20 }}>
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

        { }
        <View className="px-6 pb-6">
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
              {activeHubFilter === "all" ? (
                <View>
                  <Text
                    className="font-bold uppercase tracking-widest mb-4"
                    style={{
                      color: theme.textSecondary,
                      fontSize: theme.font.sm,
                    }}
                  >
                    {activeTab === "personal" ? "Your Hubs" : "Shared With You"}
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
                        {activeTab === "personal"
                          ? "No hubs connected."
                          : "No hubs shared with you."}
                      </Text>
                    </View>
                  ) : (
                    displayData.map((hub) => renderHubSummary(hub))
                  )}
                </View>
              ) : (
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

      { }
      <Modal transparent visible={showConfigModal} animationType="fade">
        <View style={homeStyles.modalOverlay}>
          <View
            style={[
              homeStyles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[homeStyles.modalTitle, { color: theme.text }]}>
              Outlet Not Configured
            </Text>
            <Text style={[homeStyles.modalMsg, { color: theme.textSecondary }]}>
              This outlet is currently marked as Unused. To monitor energy, you
              must assign an appliance type.
            </Text>
            <View style={homeStyles.modalBtnRow}>
              <TouchableOpacity
                style={[homeStyles.modalBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setShowConfigModal(false)}
              >
                <Text style={{ color: theme.text, fontWeight: "bold" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  homeStyles.modalBtn,
                  { backgroundColor: theme.buttonPrimary, borderWidth: 0 },
                ]}
                onPress={() => {
                  setShowConfigModal(false);
                  navigation.navigate("HubConfig", {
                    hubId: selectedHubId,
                    fromBudget: true,
                  });
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Configure
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
    };

    let statusColor = "#22c55e";
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
        onPress={onPress}
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
          { }
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
            style={{ backgroundColor: bgColor }}
          >
            <MaterialIcons name={data.icon} size={24} color={statusColor} />
          </View>

          { }
          <View className="flex-1 justify-center">
            { }
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

            { }
            <View className="flex-row items-center mb-1">
              <Text
                style={{
                  color:
                    data.type === "off" ? theme.textSecondary : statusColor,
                  fontWeight: "600",
                  fontSize: scaledSize(12),
                  marginRight: 8,
                }}
              >
                {data.statusText}
              </Text>

              {data.watts !== "---" && (
                <>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(12),
                    }}
                  >
                    • {data.watts}
                  </Text>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(12),
                      marginLeft: 8,
                    }}
                  >
                    • {data.volts}
                  </Text>
                </>
              )}
            </View>

            { }
            {data.costPerHr !== "---" && data.type !== "off" && (
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(11),
                  fontStyle: "italic",
                }}
              >
                Est. {data.costPerHr}
              </Text>
            )}
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

const TourOverlay = ({
  step,
  layout,
  theme,
  isDarkMode,
  onNext,
  onSkip,
  scaledSize,
}) => {
  if (step.type === "highlight" && !layout) return null;

  const yOffset = Platform.OS === "android" ? StatusBar.currentHeight : 0;

  const maskColor = "rgba(0, 0, 0, 0.85)";
  const pad = 4;

  let MaskLayer = null;
  let topPosition = 0;

  if (step.type === "modal") {
    MaskLayer = (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: maskColor,
        }}
      />
    );
  } else if (layout) {
    const targetY = layout.y + yOffset;
    const targetX = layout.x;
    const targetW = layout.width;
    const targetH = layout.height;

    if (targetY > SCREEN_HEIGHT / 2 || step.id === "hubs") {
      topPosition = targetY - 250;
    } else {
      topPosition = targetY + targetH + 20;
    }

    MaskLayer = (
      <>
        { }
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: Math.max(0, targetY - pad),
            backgroundColor: maskColor,
          }}
        />
        { }
        <View
          style={{
            position: "absolute",
            top: targetY + targetH + pad,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: maskColor,
          }}
        />
        { }
        <View
          style={{
            position: "absolute",
            top: targetY - pad,
            left: 0,
            width: Math.max(0, targetX - pad),
            height: targetH + pad * 2,
            backgroundColor: maskColor,
          }}
        />
        { }
        <View
          style={{
            position: "absolute",
            top: targetY - pad,
            left: targetX + targetW + pad,
            right: 0,
            height: targetH + pad * 2,
            backgroundColor: maskColor,
          }}
        />
      </>
    );
  }

  const modalWidth = 288;

  return (
    <Modal transparent visible={true} animationType="fade">
      { }
      <View style={{ flex: 1 }}>{MaskLayer}</View>

      { }
      {step.type === "highlight" && layout && (
        <View
          style={{
            position: "absolute",
            top: layout.y + yOffset - 4,
            left: layout.x - 4,
            width: layout.width + 8,
            height: layout.height + 8,
            borderColor: theme.buttonPrimary,
            borderWidth: 4,
            borderRadius: step.shape === "circle" ? (layout.width + 8) / 2 : 16,
          }}
        />
      )}

      { }
      <View
        style={
          step.type === "modal"
            ? {
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              justifyContent: "center",
              alignItems: "center",
            }
            : {
              position: "absolute",
              top: topPosition,
              left: 24,
              right: 24,
            }
        }
      >
        <View
          style={{
            width: step.type === "modal" ? modalWidth : "auto",
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: scaledSize ? scaledSize(18) : 18,
              color: theme.text,
              marginBottom: 8,
              textAlign: step.type === "modal" ? "center" : "left",
            }}
          >
            {step.title}
          </Text>

          <Text
            style={{
              color: theme.textSecondary,
              marginBottom: 24,
              fontSize: scaledSize ? scaledSize(13) : 13,
              lineHeight: 20,
              textAlign: step.type === "modal" ? "center" : "left",
            }}
          >
            {step.description}
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            <TouchableOpacity
              onPress={onSkip}
              style={{
                flex: step.type === "modal" ? 1 : 0,
                borderRadius: 12,
                height: 40,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: theme.textSecondary,
                paddingHorizontal: step.type === "modal" ? 0 : 16,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 12,
                  color: theme.text,
                }}
              >
                Skip
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNext}
              style={{
                flex: step.type === "modal" ? 1 : 0,
                borderRadius: 12,
                height: 40,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: theme.buttonPrimary,
                paddingHorizontal: step.type === "modal" ? 0 : 16,
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 12, color: "#fff" }}>
                {step.buttonText || "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const homeStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 288,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMsg: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalBtnRow: { flexDirection: "row", gap: 10, width: "100%" },
  modalBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
