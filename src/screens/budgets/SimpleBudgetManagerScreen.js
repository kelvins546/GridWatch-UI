import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Modal,
  ActivityIndicator,
  FlatList, // <--- ADDED THIS IMPORT
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
  LayoutAnimation,
  UIManager,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

export default function SimpleBudgetManagerScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const primaryColor = isDarkMode ? theme.buttonPrimary : "#00995e";
  const dangerColor = isDarkMode ? theme.buttonDangerText : "#cc0000";
  const warningColor = isDarkMode ? "#ffaa00" : "#ff9900";

  // --- STATE ---
  const [activeHubFilter, setActiveHubFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // --- REAL DATA STATE ---
  const [hubs, setHubs] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(2000);
  const [billingDate, setBillingDate] = useState("1");

  // --- FETCH DATA ---
  const loadData = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get User Settings
      const { data: userData } = await supabase
        .from("users")
        .select("monthly_budget, bill_cycle_day")
        .eq("id", user.id)
        .single();

      if (userData) {
        setMonthlyBudget(userData.monthly_budget || 2000);
        setBillingDate(String(userData.bill_cycle_day || 1));
      }

      // 2. Calculate Date Range for Current Month
      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();

      // 3. Fetch Hubs & Usage
      const { data: hubsData } = await supabase
        .from("hubs")
        .select("id, name, status, devices(id)");

      if (hubsData) {
        // Fetch usage for all devices in bulk
        const allDeviceIds = hubsData.flatMap((h) =>
          h.devices.map((d) => d.id),
        );

        const { data: usageLogs } = await supabase
          .from("usage_analytics")
          .select("device_id, cost_incurred")
          .in("device_id", allDeviceIds)
          .gte("date", startOfMonth);

        // Map usage back to hubs
        const processedHubs = hubsData.map((hub) => {
          const hubDeviceIds = hub.devices.map((d) => d.id);
          const totalSpent = (usageLogs || [])
            .filter((log) => hubDeviceIds.includes(log.device_id))
            .reduce((sum, log) => sum + (log.cost_incurred || 0), 0);

          return {
            id: hub.id,
            name: hub.name,
            status: hub.status === "online" ? "Online" : "Offline",
            devices: hub.devices.length,
            icon: "router",
            totalSpending: totalSpent,
            limit: hub.budget_limit || 0,
          };
        });

        setHubs(processedHubs);
      }
    } catch (error) {
      console.error("Budget load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- HELPER: ORDINAL SUFFIX ---
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

  // --- CALENDAR LOGIC ---
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

  // --- FILTER LOGIC ---
  const displayList =
    activeHubFilter === "all"
      ? hubs
      : hubs.filter((h) => h.id === activeHubFilter);

  const budgetStats = useMemo(() => {
    let current = 0;
    let hardLimitTotal = 0;

    if (activeHubFilter === "all") {
      current = hubs.reduce((acc, hub) => acc + (hub.totalSpending || 0), 0);
      hardLimitTotal = monthlyBudget;
    } else {
      const hub = hubs.find((h) => h.id === activeHubFilter);
      if (hub) {
        current = hub.totalSpending || 0;
        hardLimitTotal = hub.limit || monthlyBudget;
      }
    }
    return { current, hardLimitTotal };
  }, [activeHubFilter, hubs, monthlyBudget]);

  const currentSpending = budgetStats.current;
  const activeLimit = budgetStats.hardLimitTotal;

  const percentage =
    activeLimit > 0 ? Math.min((currentSpending / activeLimit) * 100, 100) : 0;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- ACTIONS ---
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

  const handleManualReset = () => {
    setShowConfirmModal(false);
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 2000);
  };

  const handleSaveBudget = async () => {
    // 1. VALIDATION
    const totalHubLimits = hubs.reduce((acc, h) => acc + (h.limit || 0), 0);

    if (totalHubLimits > 0 && monthlyBudget < totalHubLimits) {
      Alert.alert(
        "Allocation Conflict",
        `Your Total Budget (₱${monthlyBudget}) is lower than the sum of your specific Hub/Outlet limits (₱${totalHubLimits}).\n\nPlease increase the total budget or lower individual hub limits.`,
      );
      return;
    }

    // 2. PROCEED SAVE
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

      await loadData();
    } catch (e) {
      console.log("Error saving budget", e);
      Alert.alert("Error", "Failed to save budget.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDateSelect = async (day) => {
    if (day) {
      setBillingDate(day.toString());
      setShowDatePicker(false);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await supabase
          .from("users")
          .update({ bill_cycle_day: day })
          .eq("id", user.id);
      } catch (e) {
        console.log("Error saving date", e);
      }
    }
  };

  const handleBudgetChange = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, "");
    const number = parseInt(cleanedText);
    if (!isNaN(number)) setMonthlyBudget(number);
    else if (cleanedText === "") setMonthlyBudget(0);
  };

  // --- STYLES ---
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingVertical: 20,
      backgroundColor: theme.background,
    },
    headerTitleWrapper: {
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    headerText: {
      fontWeight: "bold",
      color: theme.text,
      fontSize: scaledSize(18),
    },
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
    warningCard: {
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 24,
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
      width: "90%",
      maxWidth: 400,
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
        <ActivityIndicator size="large" color="#B0B0B0" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Menu")}
          style={{ padding: 4 }}
        >
          <MaterialIcons
            name="menu"
            size={scaledSize(28)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerText}>My Budget</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications")}
          style={{ padding: 4 }}
        >
          <MaterialIcons
            name="notifications-none"
            size={scaledSize(28)}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
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
                    ₱ {currentSpending.toLocaleString()}
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
                  label="Daily Avg"
                  value={`₱ ${(currentSpending / 30).toFixed(2)}`}
                  icon="trending-up"
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

        {/* --- HUB FILTER CHIPS --- */}
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

            {hubs.map((hub) => (
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

      {/* --- MODALS --- */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reset Spending?</Text>
            <Text style={styles.modalBody}>
              This will clear your current spending tracking.
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
                  Cancel
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

            {/* DAY HEADERS */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              {weekDays.map((day) => (
                <View
                  key={day}
                  style={{
                    flex: 1,
                    alignItems: "center",
                  }}
                >
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

            {/* CALENDAR GRID */}
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

      {/* LOADING OVERLAY */}
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
          <ActivityIndicator size="large" color={primaryColor} />
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

function HubListItem({ data, theme, primaryColor, scaledSize, onPress }) {
  const usagePercent =
    data.limit > 0 ? Math.min((data.totalSpending / data.limit) * 100, 100) : 0;
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
          backgroundColor: `${primaryColor}15`,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <MaterialIcons name={data.icon} size={22} color={primaryColor} />
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
            style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
          >
            Limit: ₱{data.limit || "Unset"}
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
