import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
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
  StyleSheet,
  Platform,
  LayoutAnimation,
  UIManager,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BudgetManagerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const primaryColor = isDarkMode ? theme.buttonPrimary : "#00995e";
  const dangerColor = isDarkMode ? theme.buttonDangerText : "#cc0000";
  const warningColor = isDarkMode ? "#ffaa00" : "#ff9900";

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("personal");
  const [activeHubFilter, setActiveHubFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Status Modal (Fixed)
  const [statusModal, setStatusModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  // --- REAL DATA STATE ---
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [billingDate, setBillingDate] = useState("1");
  const [personalHubs, setPersonalHubs] = useState([]);
  const [sharedHubs, setSharedHubs] = useState([]);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [now, setNow] = useState(Date.now());

  // --- ANIMATION REF ---
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- TIMER FOR ONLINE CHECK ---
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  // --- FETCH FUNCTION ---
  const fetchData = async (isRefetch = false) => {
    if (isRefetch) setRefreshing(true);
    else setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // A. Get User Settings
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_current_cycle_usage",
        { target_user_id: user.id },
      );

      if (rpcError) throw rpcError;

      if (rpcData) {
        setMonthlyBudget(rpcData.budget_limit);
        setDaysRemaining(rpcData.days_remaining);
        const startDay = new Date(rpcData.cycle_start).getDate();
        setBillingDate(startDay.toString());

        // B. Fetch Hub Breakdown
        await fetchHubsBreakdown(
          user.id,
          rpcData.cycle_start,
          rpcData.cycle_end,
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      if (isRefetch) setRefreshing(false);
      setIsLoading(false);
    }
  };

  const fetchHubsBreakdown = async (userId, startDate, endDate) => {
    try {
      // 1. Fetch Personal Hubs
      const { data: ownedHubs, error: ownedError } = await supabase
        .from("hubs")
        .select("id, name, status, last_seen, devices(id)")
        .eq("user_id", userId);

      if (ownedError) throw ownedError;

      // 2. Fetch Shared Hubs
      const { data: sharedAccess, error: accessError } = await supabase
        .from("hub_access")
        .select("hub_id, role")
        .eq("user_id", userId);

      if (accessError) throw accessError;

      let sharedHubsList = [];
      if (sharedAccess && sharedAccess.length > 0) {
        const sharedIds = sharedAccess.map((row) => row.hub_id);
        const { data: sharedHubData, error: sharedError } = await supabase
          .from("hubs")
          .select("id, name, status, last_seen, devices(id)")
          .in("id", sharedIds);

        if (sharedError) throw sharedError;
        sharedHubsList = sharedHubData;
      }

      // 3. Combine Device IDs for usage logs
      const allHubs = [...(ownedHubs || []), ...(sharedHubsList || [])];
      const allDeviceIds = allHubs.flatMap(
        (h) => h.devices?.map((d) => d.id) || [],
      );

      let logs = [];
      if (allDeviceIds.length > 0) {
        const { data: usageData, error: logError } = await supabase
          .from("usage_analytics")
          .select("cost_incurred, device_id")
          .in("device_id", allDeviceIds)
          .gte("date", startDate)
          .lte("date", endDate);

        if (logError) console.error("Log error:", logError);
        else logs = usageData;
      }

      const processHubs = (hubList) => {
        return hubList.map((hub) => {
          const hubDeviceIds = hub.devices?.map((d) => d.id) || [];
          const totalSpent = logs
            .filter((log) => hubDeviceIds.includes(log.device_id))
            .reduce((sum, log) => sum + (log.cost_incurred || 0), 0);

          return {
            id: hub.id,
            name: hub.name,
            last_seen: hub.last_seen,
            devices: hub.devices?.length || 0,
            icon: "router",
            totalSpending: totalSpent,
            limit: 0,
          };
        });
      };

      setPersonalHubs(processHubs(ownedHubs || []));
      setSharedHubs(processHubs(sharedHubsList || []));
    } catch (error) {
      console.error("Hub fetch error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    const channel = supabase
      .channel("budget_hubs_realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "hubs",
        },
        (payload) => {
          setPersonalHubs((current) =>
            current.map((h) =>
              h.id === payload.new.id
                ? { ...h, last_seen: payload.new.last_seen }
                : h,
            ),
          );
          setSharedHubs((current) =>
            current.map((h) =>
              h.id === payload.new.id
                ? { ...h, last_seen: payload.new.last_seen }
                : h,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    if (route.params?.showSetupModal) {
      const timer = setTimeout(() => {
        setShowBudgetModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [route.params]);

  // --- HELPERS ---
  const sourceData = activeTab === "personal" ? personalHubs : sharedHubs;
  const displayList =
    activeHubFilter === "all"
      ? sourceData
      : sourceData.filter((h) => h.id === activeHubFilter);

  const budgetStats = useMemo(() => {
    let current = 0;
    let hardLimitTotal = 0;

    if (activeHubFilter === "all") {
      current = sourceData.reduce(
        (acc, hub) => acc + (hub.totalSpending || 0),
        0,
      );
      hardLimitTotal = monthlyBudget;
    } else {
      const hub = sourceData.find((h) => h.id === activeHubFilter);
      if (hub) {
        current = hub.totalSpending || 0;
        hardLimitTotal = hub.limit || monthlyBudget;
      }
    }
    return { current, hardLimitTotal };
  }, [activeTab, activeHubFilter, sourceData, monthlyBudget]);

  const currentSpending = budgetStats.current;
  const activeLimit = budgetStats.hardLimitTotal;
  const percentage =
    activeLimit > 0 ? Math.min((currentSpending / activeLimit) * 100, 100) : 0;

  const getOrdinalSuffix = (day) => {
    const d = parseInt(day);
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
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

  const today = new Date();
  const currentMonthName = today.toLocaleString("default", { month: "long" });
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, today.getMonth(), 1).getDay();
  const calendarData = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // --- HANDLERS ---
  const handleScopeChange = (scope) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(scope);
    setActiveHubFilter("all");
  };

  const handleFilterChange = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveHubFilter(id);
  };

  const animateButton = (toValue) => {
    Animated.spring(scaleAnim, {
      toValue,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // --- SOFT RESET (Update Cycle to Today) ---
  const handleManualReset = async () => {
    setShowConfirmModal(false);
    setIsResetting(true);

    // 1. Clear current view immediately to give visual feedback of "Reset"
    setPersonalHubs([]);
    setSharedHubs([]);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const todayDay = new Date().getDate();

      // Update bill cycle to TODAY
      const { error } = await supabase
        .from("users")
        .update({ bill_cycle_day: todayDay })
        .eq("id", user.id);

      if (error) throw error;

      setBillingDate(todayDay.toString());

      // Fetch fresh data (which will be from Today 00:00 onwards)
      await fetchData(true);

      setStatusModal({
        visible: true,
        title: "Reset Successful",
        message:
          "Cycle has been reset to start from today. Previous data is preserved for analytics.",
        type: "success",
      });
    } catch (err) {
      setStatusModal({
        visible: true,
        title: "Error",
        message: "Failed to reset spending.",
        type: "error",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveBudget = async () => {
    setShowBudgetModal(false);
    setIsResetting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("users")
        .update({ monthly_budget: monthlyBudget })
        .eq("id", user.id);

      if (error) throw error;
      await fetchData(true);
      setStatusModal({
        visible: true,
        title: "Success",
        message: "Monthly budget limit updated.",
        type: "success",
      });
    } catch (error) {
      setStatusModal({
        visible: true,
        title: "Error",
        message: "Failed to save budget.",
        type: "error",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleDateSelect = async (day) => {
    if (!day) return;
    setShowDatePicker(false);
    setIsResetting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("users")
        .update({ bill_cycle_day: day })
        .eq("id", user.id);

      if (error) throw error;
      setBillingDate(day.toString());
      await fetchData(true);
      setStatusModal({
        visible: true,
        title: "Date Updated",
        message: `Billing cycle start set to day ${day}.`,
        type: "success",
      });
    } catch (error) {
      setStatusModal({
        visible: true,
        title: "Error",
        message: "Failed to update date.",
        type: "error",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleBudgetChange = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, "");
    const number = parseInt(cleanedText);
    if (!isNaN(number)) setMonthlyBudget(number);
    else if (cleanedText === "") setMonthlyBudget(0);
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: 20,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      borderWidth: 1,
      padding: 20,
      borderRadius: 16,

      maxWidth: 288,
      alignItems: "center",
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
    },
    modalTitle: {
      fontWeight: "bold",
      marginBottom: 8,
      textAlign: "center",
      color: theme.text,
      fontSize: scaledSize(18),
    },
    modalBody: {
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 20,
      color: theme.textSecondary,
      fontSize: scaledSize(12),
    },
    buttonRow: { flexDirection: "row", gap: 10, width: "100%" },
    modalCancelBtn: {
      flex: 1,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.textSecondary,
    },
    modalConfirmBtn: {
      flex: 1,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    modalButtonText: {
      fontWeight: "bold",
      fontSize: scaledSize(12),
      textTransform: "uppercase",
    },
  });

  // --- RENDER ---
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
        <ActivityIndicator size="large" color="#B0B0B0" />
        <Text
          style={{
            marginTop: 12,
            color: "#B0B0B0",
            fontSize: scaledSize(12),
            fontWeight: "500",
            letterSpacing: 0.5,
          }}
        >
          Loading Budget...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* --- HEADER --- */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 16,
        }}
      >
        <Text
          style={{
            fontSize: scaledSize(20),
            fontWeight: "bold",
            color: theme.text,
          }}
        >
          Budget
        </Text>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.buttonNeutral,
            borderRadius: 20,
            padding: 4,
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
              shadowOpacity: activeTab === "personal" ? 0.1 : 0,
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
              shadowOpacity: activeTab === "shared" ? 0.1 : 0,
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

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.textSecondary}
            colors={[theme.buttonPrimary]}
          />
        }
      >
        {/* --- HERO CARD --- */}
        <View style={{ paddingHorizontal: 24 }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowBudgetModal(true)}
            onPressIn={() => animateButton(0.98)}
            onPressOut={() => animateButton(1)}
          >
            <Animated.View
              style={[styles.card, { transform: [{ scale: scaleAnim }] }]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(12),
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {activeHubFilter === "all"
                      ? "Total Spending"
                      : "Hub Spending"}
                  </Text>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: scaledSize(30),
                      fontWeight: "900",
                    }}
                  >
                    ₱{" "}
                    {currentSpending.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={theme.textSecondary}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{
                      color: percentage >= 90 ? dangerColor : primaryColor,
                      fontWeight: "600",
                      fontSize: scaledSize(12),
                    }}
                  >
                    {percentage.toFixed(0)}% Used
                  </Text>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(12),
                    }}
                  >
                    Limit: ₱ {activeLimit.toLocaleString()}
                  </Text>
                </View>
                <View
                  style={{
                    height: 12,
                    backgroundColor: isDarkMode ? "#333" : "#f0f0f0",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={
                      percentage >= 90
                        ? [warningColor, dangerColor]
                        : [primaryColor, isDarkMode ? "#00cc7a" : "#34d399"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${percentage}%`, height: "100%" }}
                  />
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  borderTopWidth: 1,
                  borderTopColor: theme.cardBorder,
                  paddingTop: 16,
                }}
              >
                <StatItem
                  label="Days Left"
                  value={`${daysRemaining} Days`}
                  icon="hourglass-empty"
                  theme={theme}
                  scaledSize={scaledSize}
                />
                <View
                  style={{
                    width: 1,
                    height: 30,
                    backgroundColor: theme.cardBorder,
                    marginHorizontal: 16,
                  }}
                />
                <StatItem
                  label="Reset Date"
                  value={`Every ${billingDate}${getOrdinalSuffix(billingDate)}`}
                  icon="event-repeat"
                  theme={theme}
                  scaledSize={scaledSize}
                />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* --- HUB FILTER --- */}
        <View style={{ paddingLeft: 24, marginBottom: 20 }}>
          <Text
            style={{
              fontSize: scaledSize(13),
              fontWeight: "600",
              color: theme.text,
              marginBottom: 10,
            }}
          >
            Filter by Hub
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 24 }}
          >
            <TouchableOpacity
              onPress={() => handleFilterChange("all")}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor:
                  activeHubFilter === "all" ? theme.text : theme.buttonNeutral,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  fontSize: scaledSize(12),
                  fontWeight: "600",
                  color:
                    activeHubFilter === "all"
                      ? theme.background
                      : theme.textSecondary,
                }}
              >
                All
              </Text>
            </TouchableOpacity>

            {sourceData.map((hub) => (
              <TouchableOpacity
                key={hub.id}
                onPress={() => handleFilterChange(hub.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor:
                    activeHubFilter === hub.id
                      ? theme.text
                      : theme.buttonNeutral,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: scaledSize(12),
                    fontWeight: "600",
                    color:
                      activeHubFilter === hub.id
                        ? theme.background
                        : theme.textSecondary,
                  }}
                >
                  {hub.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* --- ACTIONS ROW --- */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 24,
            gap: 12,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              backgroundColor: theme.card,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 10,
                backgroundColor: `${theme.buttonPrimary}15`,
              }}
            >
              <MaterialIcons
                name="calendar-today"
                size={18}
                color={primaryColor}
              />
            </View>
            <View>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(10),
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                Cycle Date
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: scaledSize(13),
                  fontWeight: "bold",
                }}
              >
                {billingDate}
                {getOrdinalSuffix(billingDate)}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowConfirmModal(true)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              backgroundColor: theme.card,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 10,
                backgroundColor: `${dangerColor}15`,
              }}
            >
              <MaterialIcons name="restart-alt" size={18} color={dangerColor} />
            </View>
            <View>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(10),
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                Manual
              </Text>
              <Text
                style={{
                  color: dangerColor,
                  fontSize: scaledSize(13),
                  fontWeight: "bold",
                }}
              >
                Reset Now
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* --- HUB LIST --- */}
        <View style={{ paddingHorizontal: 24 }}>
          <Text
            style={{
              fontSize: scaledSize(13),
              fontWeight: "600",
              color: theme.text,
              marginBottom: 12,
            }}
          >
            Hub Allocation
          </Text>

          {displayList.length > 0 ? (
            displayList.map((hub) => (
              <HubListItem
                key={hub.id}
                data={hub}
                theme={theme}
                primaryColor={primaryColor}
                scaledSize={scaledSize}
                now={now} // Pass 'now' for online check
                onPress={() =>
                  navigation.navigate("BudgetDeviceList", {
                    hubName: hub.name,
                    hubId: hub.id,
                  })
                }
              />
            ))
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Text style={{ color: theme.textSecondary }}>No hubs found.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* --- CONFIRM RESET MODAL --- */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reset Spending?</Text>
            <Text style={styles.modalBody}>
              This will clear your current spending tracking to 0.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleManualReset}
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: dangerColor },
                ]}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Reset
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- BUDGET MODAL --- */}
      <Modal visible={showBudgetModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Monthly Limit</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                marginVertical: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => setMonthlyBudget((b) => Math.max(0, b - 100))}
                style={{
                  padding: 10,
                  backgroundColor: theme.buttonNeutral,
                  borderRadius: 10,
                }}
              >
                <MaterialIcons name="remove" size={24} color={theme.text} />
              </TouchableOpacity>
              <TextInput
                value={monthlyBudget.toString()}
                onChangeText={handleBudgetChange}
                keyboardType="numeric"
                style={{
                  fontSize: scaledSize(28),
                  fontWeight: "bold",
                  color: theme.text,
                  minWidth: 80,
                  textAlign: "center",
                }}
              />
              <TouchableOpacity
                onPress={() => setMonthlyBudget((b) => b + 100)}
                style={{
                  padding: 10,
                  backgroundColor: theme.buttonNeutral,
                  borderRadius: 10,
                }}
              >
                <MaterialIcons name="add" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setShowBudgetModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  {route.params?.showSetupModal ? "Not Now" : "Cancel"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveBudget}
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: primaryColor },
                ]}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- STATUS MODAL (Unified) --- */}
      <Modal visible={statusModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{statusModal.title}</Text>
            <Text style={styles.modalBody}>{statusModal.message}</Text>
            <TouchableOpacity
              onPress={() => setStatusModal({ ...statusModal, visible: false })}
              style={{
                backgroundColor:
                  statusModal.type === "error" ? dangerColor : primaryColor,
                width: "100%",
                height: 44,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                OKAY
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- DATE PICKER MODAL --- */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              maxHeight: "70%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: scaledSize(18),
                  fontWeight: "bold",
                  color: theme.text,
                }}
              >
                Start Date ({currentMonthName})
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              {weekDays.map((day) => (
                <View key={day} style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontWeight: "bold",
                      fontSize: scaledSize(12),
                    }}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            <FlatList
              data={calendarData}
              numColumns={7}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => {
                if (item === null) {
                  return (
                    <View style={{ flex: 1, aspectRatio: 1, margin: 2 }} />
                  );
                }
                const isSelected = item.toString() === billingDate;
                return (
                  <TouchableOpacity
                    onPress={() => handleDateSelect(item)}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      margin: 2,
                      borderRadius: 8,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: isSelected
                        ? primaryColor
                        : theme.buttonNeutral,
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#fff" : theme.text,
                        fontWeight: "bold",
                        fontSize: scaledSize(14),
                      }}
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

      {/* LOADING OVERLAY - GRAY */}
      {isResetting && (
        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#B0B0B0" />
        </View>
      )}
    </SafeAreaView>
  );
}

// --- SUB-COMPONENTS ---

function StatItem({ label, value, icon, theme, scaledSize }) {
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
      <View
        style={{
          width: 32,
          height: 32,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <MaterialIcons name={icon} size={20} color={theme.textSecondary} />
      </View>
      <View style={{ marginLeft: 8 }}>
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: scaledSize(10),
            textTransform: "uppercase",
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: scaledSize(12),
            fontWeight: "bold",
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function HubListItem({ data, theme, primaryColor, scaledSize, onPress, now }) {
  const usagePercent =
    data.limit > 0 ? Math.min((data.totalSpending / data.limit) * 100, 100) : 0;

  // --- ONLINE DETECTION LOGIC ---
  let isOnline = false;
  if (data.last_seen) {
    let timeStr = data.last_seen.replace(" ", "T");
    if (!timeStr.endsWith("Z") && !timeStr.includes("+")) {
      timeStr += "Z";
    }
    const lastSeenMs = new Date(timeStr).getTime();
    if (!isNaN(lastSeenMs)) {
      const diffSeconds = (now - lastSeenMs) / 1000;
      // Allow 8s lag, 5s clock skew
      isOnline = diffSeconds < 8 && diffSeconds > -5;
    }
  }

  // Refined Icon Background (Subtle instead of green circle)
  const iconBg = theme.buttonNeutral;
  const iconColor = isOnline ? primaryColor : theme.textSecondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          marginRight: 12,
          backgroundColor: iconBg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <MaterialIcons
          name={isOnline ? "router" : "wifi-off"}
          size={22}
          color={iconColor}
        />
        {/* Status Dot */}
        {isOnline && (
          <View
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: primaryColor,
              borderWidth: 1,
              borderColor: theme.card,
            }}
          />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontWeight: "bold",
              fontSize: scaledSize(14),
            }}
          >
            {data.name}
          </Text>
          <Text
            style={{
              color: theme.text,
              fontWeight: "bold",
              fontSize: scaledSize(14),
            }}
          >
            ₱{data.totalSpending.toFixed(2)}
          </Text>
        </View>
        <View
          style={{
            height: 6,
            backgroundColor: theme.buttonNeutral,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${usagePercent}%`,
              height: "100%",
              backgroundColor: primaryColor,
            }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <Text
            style={{
              color: iconColor,
              fontSize: scaledSize(11),
              fontWeight: "600",
            }}
          >
            {isOnline ? "Online" : "Offline"}
          </Text>
          <Text
            style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
          >
            {usagePercent.toFixed(0)}%
          </Text>
        </View>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={20}
        color={theme.textSecondary}
        style={{ marginLeft: 8 }}
      />
    </TouchableOpacity>
  );
}
