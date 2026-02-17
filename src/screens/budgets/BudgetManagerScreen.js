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
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- HELPERS ---
const getCycleDates = (billDay) => {
  const safeDay = billDay || 1;
  const now = new Date();
  const currentDay = now.getDate();
  let start = new Date(now.getFullYear(), now.getMonth(), safeDay);

  if (currentDay < safeDay) {
    start = new Date(now.getFullYear(), now.getMonth() - 1, safeDay);
  }

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const toLocalISO = (d) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split("T")[0];
  };

  return {
    startStr: toLocalISO(start),
    endStr: toLocalISO(end),
    objEnd: end,
  };
};

const getOrdinalSuffix = (day) => {
  if (!day) return "th";
  const d = parseInt(day);
  if (isNaN(d)) return "th";
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

const parseTimestamp = (timeStr) => {
  if (!timeStr) return 0;
  let cleanStr = timeStr.replace(" ", "T");
  if (!cleanStr.endsWith("Z") && !cleanStr.includes("+")) cleanStr += "Z";
  return new Date(cleanStr).getTime();
};

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

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const [statusModal, setStatusModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [userBillDay, setUserBillDay] = useState(1);
  const [personalHubs, setPersonalHubs] = useState([]);
  const [sharedHubs, setSharedHubs] = useState([]);
  const [now, setNow] = useState(Date.now());

  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- ONBOARDING RESTORED ---
  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.removeItem("hasSeenHomeTour");
      navigation.navigate("Home");
    } catch (e) {
      console.log("Error triggering tour:", e);
      navigation.navigate("Home");
    }
  };

  useEffect(() => {
    if (route.params?.showSetupModal) {
      const timer = setTimeout(() => {
        setShowBudgetModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [route.params]);

  // --- TIMER ---
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async (isRefetch = false) => {
    if (isRefetch) setRefreshing(true);
    else setIsLoading(true);

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

      // If NULL in DB, default to 0 for App State
      const budget = userSettings?.monthly_budget || 0;
      const billDay = userSettings?.bill_cycle_day || 1;

      setMonthlyBudget(budget);
      setUserBillDay(billDay);

      await fetchPersonalData(user.id, billDay);
      await fetchSharedData(user.id);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      if (isRefetch) setRefreshing(false);
      setIsLoading(false);
    }
  };

  const fetchPersonalData = async (userId, billDay) => {
    const { startStr, endStr } = getCycleDates(billDay);

    const { data: hubs } = await supabase
      .from("hubs")
      .select("id, name, status, last_seen, devices(id)")
      .eq("user_id", userId);

    if (!hubs) {
      setPersonalHubs([]);
      return;
    }

    const deviceIds = hubs.flatMap((h) => h.devices?.map((d) => d.id) || []);
    let logs = [];

    if (deviceIds.length > 0) {
      const { data: logData } = await supabase
        .from("usage_analytics")
        .select("cost_incurred, device_id")
        .in("device_id", deviceIds)
        .gte("date", startStr)
        .lt("date", endStr);
      logs = logData || [];
    }

    const processed = hubs.map((hub) => {
      const hubDevIds = hub.devices?.map((d) => d.id) || [];
      const total = logs
        .filter((l) => hubDevIds.includes(l.device_id))
        .reduce((sum, l) => sum + (l.cost_incurred || 0), 0);

      return {
        id: hub.id,
        name: hub.name,
        last_seen: hub.last_seen,
        devices: hub.devices?.length || 0,
        totalSpending: total,
        billingDay: billDay,
        limit: 0,
        ownerId: userId, // Self
      };
    });

    setPersonalHubs(processed);
  };

  const fetchSharedData = async (userId) => {
    const { data: sharedAccess } = await supabase
      .from("hub_access")
      .select(
        `
        hub_id, role,
        hubs (
          id, name, status, last_seen, devices(id),
          users ( id, email, bill_cycle_day )
        )
      `,
      )
      .eq("user_id", userId);

    if (!sharedAccess) {
      setSharedHubs([]);
      return;
    }

    const processed = await Promise.all(
      sharedAccess.map(async (item) => {
        const hub = item.hubs;
        if (!hub) return null;

        const ownerBillDay = hub.users?.bill_cycle_day || 1;
        const ownerId = hub.users?.id;

        const { startStr, endStr } = getCycleDates(ownerBillDay);

        const devIds = hub.devices?.map((d) => d.id) || [];
        let hubTotal = 0;

        if (devIds.length > 0) {
          const { data: logs } = await supabase
            .from("usage_analytics")
            .select("cost_incurred")
            .in("device_id", devIds)
            .gte("date", startStr)
            .lt("date", endStr);

          hubTotal =
            logs?.reduce((sum, l) => sum + (l.cost_incurred || 0), 0) || 0;
        }

        return {
          id: hub.id,
          name: hub.name,
          last_seen: hub.last_seen,
          devices: devIds.length,
          totalSpending: hubTotal,
          billingDay: ownerBillDay,
          ownerId: ownerId,
          limit: 0,
        };
      }),
    );

    setSharedHubs(processed.filter(Boolean));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, []);

  // --- HELPERS ---
  const sourceData = activeTab === "personal" ? personalHubs : sharedHubs;
  const displayList =
    activeHubFilter === "all"
      ? sourceData
      : sourceData.filter((h) => h.id === activeHubFilter);

  const displayBillingDay = useMemo(() => {
    if (activeTab === "personal") return userBillDay;
    if (activeHubFilter !== "all") {
      const hub = sourceData.find((h) => h.id === activeHubFilter);
      return hub ? hub.billingDay : 1;
    }
    return null; // Varies
  }, [activeTab, activeHubFilter, userBillDay, sourceData]);

  const budgetStats = useMemo(() => {
    let current = 0;
    let limit = activeTab === "personal" ? monthlyBudget : 0;

    if (activeHubFilter === "all") {
      current = sourceData.reduce(
        (acc, hub) => acc + (hub.totalSpending || 0),
        0,
      );
    } else {
      const hub = sourceData.find((h) => h.id === activeHubFilter);
      if (hub) current = hub.totalSpending || 0;
    }
    return { current, limit };
  }, [activeTab, activeHubFilter, sourceData, monthlyBudget]);

  const currentSpending = budgetStats.current;
  const percentage =
    budgetStats.limit > 0
      ? Math.min((currentSpending / budgetStats.limit) * 100, 100)
      : 0;

  const daysRemaining = useMemo(() => {
    if (!displayBillingDay) return 0;
    const { objEnd } = getCycleDates(displayBillingDay);
    const todayObj = new Date();
    const diff = objEnd - todayObj;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [displayBillingDay]);

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

  // --- MANUAL RESET ---
  const handleManualReset = async () => {
    setShowConfirmModal(false);
    setIsResetting(true);

    try {
      const todayDay = new Date().getDate();

      if (activeTab === "personal") {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        await supabase
          .from("users")
          .update({ bill_cycle_day: todayDay })
          .eq("id", user.id);

        const { startStr } = getCycleDates(userBillDay);
        const { data: myHubs } = await supabase
          .from("hubs")
          .select("devices(id)")
          .eq("user_id", user.id);
        const myDeviceIds =
          myHubs?.flatMap((h) => h.devices.map((d) => d.id)) || [];

        if (myDeviceIds.length > 0) {
          await supabase
            .from("usage_analytics")
            .delete()
            .in("device_id", myDeviceIds)
            .gte("date", startStr);
        }
        setStatusModal({
          visible: true,
          title: "Cycle Reset",
          message: `Personal cycle reset to ${todayDay}${getOrdinalSuffix(todayDay)}.`,
          type: "success",
        });
      } else {
        if (activeHubFilter === "all")
          throw new Error("Select a specific Shared Hub to reset.");

        const hub = sharedHubs.find((h) => h.id === activeHubFilter);
        if (hub && hub.ownerId) {
          const { error } = await supabase
            .from("users")
            .update({ bill_cycle_day: todayDay })
            .eq("id", hub.ownerId);
          if (error) throw error;

          const { data: hubData } = await supabase
            .from("hubs")
            .select("devices(id)")
            .eq("id", hub.id)
            .single();
          const devIds = hubData?.devices?.map((d) => d.id) || [];
          const { startStr } = getCycleDates(hub.billingDay);

          if (devIds.length > 0) {
            await supabase
              .from("usage_analytics")
              .delete()
              .in("device_id", devIds)
              .gte("date", startStr);
          }
          setStatusModal({
            visible: true,
            title: "Hub Reset",
            message: `Owner's cycle updated to ${todayDay}${getOrdinalSuffix(todayDay)} and logs cleared.`,
            type: "success",
          });
        }
      }
      await fetchData(true);
    } catch (err) {
      setStatusModal({
        visible: true,
        title: "Failed",
        message: err.message,
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

      // FIX: If 0, send NULL to Database
      const budgetToSave = monthlyBudget === 0 ? null : monthlyBudget;

      await supabase
        .from("users")
        .update({ monthly_budget: budgetToSave })
        .eq("id", user.id);

      await fetchData(true);

      if (route.params?.showSetupModal) {
        handleOnboardingComplete();
      } else {
        setStatusModal({
          visible: true,
          title: "Success",
          message: "Budget updated.",
          type: "success",
        });
      }
    } catch (error) {
      setStatusModal({
        visible: true,
        title: "Error",
        message: "Failed to save.",
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
      if (activeTab === "personal") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await supabase
          .from("users")
          .update({ bill_cycle_day: day })
          .eq("id", user.id);
        setStatusModal({
          visible: true,
          title: "Date Updated",
          message: `Cycle start set to day ${day}.`,
          type: "success",
        });
      } else {
        if (activeHubFilter === "all") {
          throw new Error("Select a specific Shared Hub to configure.");
        }

        const hub = sharedHubs.find((h) => h.id === activeHubFilter);
        if (hub && hub.ownerId) {
          const { error } = await supabase
            .from("users")
            .update({ bill_cycle_day: day })
            .eq("id", hub.ownerId);
          if (error) throw error;
          setStatusModal({
            visible: true,
            title: "Owner Updated",
            message: `Hub Owner's cycle set to day ${day}.`,
            type: "success",
          });
        }
      }
      await fetchData(true);
    } catch (error) {
      setStatusModal({
        visible: true,
        title: "Error",
        message: error.message || "Failed to update.",
        type: "error",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // --- Handle Budget Input Change (Limit 999,999) ---
  const handleBudgetInputChange = (text) => {
    const cleanValue = text.replace(/[^0-9]/g, "");
    const numericValue = parseInt(cleanValue, 10);

    if (isNaN(numericValue) || numericValue === 0) {
      setMonthlyBudget(0);
      return;
    }

    if (numericValue > 999999) {
      setMonthlyBudget(999999);
    } else {
      setMonthlyBudget(numericValue);
    }
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
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      borderWidth: 1,
      padding: 20,
      borderRadius: 16,
      width: "85%",
      maxWidth: 320,
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
      letterSpacing: 1,
    },
  });

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
                    {`₱ ${currentSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                    {`${percentage.toFixed(0)}% Used`}
                  </Text>
                  {/* --- FIX: Display "No Limit Set" if 0 --- */}
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(12),
                    }}
                  >
                    {budgetStats.limit > 0
                      ? `Limit: ₱ ${budgetStats.limit.toLocaleString()}`
                      : "No Limit Set"}
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
                  value={displayBillingDay ? `${daysRemaining} Days` : "---"}
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
                  value={
                    displayBillingDay
                      ? `Every ${displayBillingDay}${getOrdinalSuffix(displayBillingDay)}`
                      : "Varies"
                  }
                  icon="event-repeat"
                  theme={theme}
                  scaledSize={scaledSize}
                />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

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
                {displayBillingDay
                  ? `${displayBillingDay}${getOrdinalSuffix(displayBillingDay)}`
                  : "Varies"}
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
                now={now}
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

      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reset Spending?</Text>
            <Text style={styles.modalBody}>
              {activeTab === "personal"
                ? "This will clear your spending history and reset the cycle to today."
                : activeHubFilter === "all"
                  ? "Select a specific Shared Hub to reset."
                  : "This will reset the owner's billing cycle to today and clear logs."}
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
                  {
                    backgroundColor: dangerColor,
                    opacity:
                      activeTab === "shared" && activeHubFilter === "all"
                        ? 0.5
                        : 1,
                  },
                ]}
                disabled={activeTab === "shared" && activeHubFilter === "all"}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Reset
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

              {/* --- FIX: UPDATED TEXT INPUT FOR COMMA FORMAT & LIMIT --- */}
              <TextInput
                value={
                  monthlyBudget === 0 ? "" : monthlyBudget.toLocaleString()
                }
                onChangeText={handleBudgetInputChange}
                keyboardType="numeric"
                placeholder="No Limit"
                placeholderTextColor={theme.textSecondary}
                style={{
                  fontSize: scaledSize(28),
                  fontWeight: "bold",
                  color: theme.text,
                  minWidth: 80,
                  textAlign: "center",
                }}
              />

              <TouchableOpacity
                onPress={() =>
                  setMonthlyBudget((b) => Math.min(b + 100, 999999))
                }
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
                onPress={() => {
                  setShowBudgetModal(false);
                  if (route.params?.showSetupModal) handleOnboardingComplete();
                }}
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

      <Modal visible={statusModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{statusModal.title}</Text>
            <Text style={styles.modalBody}>{statusModal.message}</Text>
            <TouchableOpacity
              onPress={() => setStatusModal({ ...statusModal, visible: false })}
              style={[
                styles.modalConfirmBtn,
                {
                  backgroundColor:
                    statusModal.type === "error" ? dangerColor : primaryColor,
                  width: "100%",
                  flex: 0,
                },
              ]}
            >
              <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                OKAY
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                Select Start Date
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={Array.from({ length: 31 }, (_, i) => i + 1)}
              numColumns={7}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleDateSelect(item)}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    margin: 2,
                    borderRadius: 8,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor:
                      item ===
                      (activeTab === "shared" && displayBillingDay
                        ? displayBillingDay
                        : userBillDay)
                        ? primaryColor
                        : theme.buttonNeutral,
                  }}
                >
                  <Text
                    style={{
                      color:
                        item ===
                        (activeTab === "shared" && displayBillingDay
                          ? displayBillingDay
                          : userBillDay)
                          ? "#fff"
                          : theme.text,
                      fontWeight: "bold",
                      fontSize: scaledSize(14),
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

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

  let isOnline = false;
  if (data.last_seen) {
    const lastSeenMs = new Date(data.last_seen).getTime();
    if (!isNaN(lastSeenMs)) isOnline = (now - lastSeenMs) / 1000 < 120;
  }
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
        borderColor: isOnline ? primaryColor : theme.cardBorder,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          marginRight: 12,
          backgroundColor: theme.buttonNeutral,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <MaterialIcons
          name={isOnline ? "router" : "wifi-off"}
          size={22}
          color={iconColor}
        />
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
          >{`₱${data.totalSpending.toFixed(2)}`}</Text>
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
          >{`${usagePercent.toFixed(0)}%`}</Text>
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
