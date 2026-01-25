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
  StyleSheet,
  Dimensions,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BudgetManagerScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const primaryColor = isDarkMode ? theme.buttonPrimary : "#00995e";
  const dangerColor = isDarkMode ? theme.buttonDangerText : "#cc0000";
  const warningColor = isDarkMode ? "#ffaa00" : "#ff9900";

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("personal");
  const [activeHubFilter, setActiveHubFilter] = useState("all");

  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // --- BUDGET DATA ---
  const [monthlyBudget, setMonthlyBudget] = useState(2800);
  const [billingDate, setBillingDate] = useState("15");

  // --- HELPER: ORDINAL SUFFIX (st, nd, rd, th) ---
  const getOrdinalSuffix = (day) => {
    const d = parseInt(day);
    if (d > 3 && d < 21) return "th"; // Covers 11th, 12th, 13th
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

  // Generate calendar grid
  const calendarData = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // --- DATA SOURCES ---
  const PERSONAL_HUBS = [
    {
      id: "living",
      name: "Living Room Hub",
      status: "Online",
      devices: 3,
      icon: "weekend",
      totalSpending: 850.5,
      limit: 1200,
    },
    {
      id: "kitchen",
      name: "Kitchen Hub",
      status: "Online",
      devices: 2,
      icon: "kitchen",
      totalSpending: 600.25,
      limit: 800,
    },
  ];

  const SHARED_HUBS = [
    {
      id: "francis",
      name: "Francis' Garage",
      owner: "Francis Gian",
      status: "Online",
      devices: 3,
      icon: "handyman",
      totalSpending: 320.0,
      limit: 1000,
    },
    {
      id: "cielo",
      name: "Cielo's House",
      owner: "Cielo Cortado",
      status: "Online",
      devices: 6,
      icon: "home",
      totalSpending: 2100.0,
      limit: 4000,
    },
  ];

  // --- CALCULATIONS ---
  const sourceData = activeTab === "personal" ? PERSONAL_HUBS : SHARED_HUBS;

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
      hardLimitTotal = sourceData.reduce(
        (acc, hub) => acc + (hub.limit || 0),
        0,
      );
    } else {
      const hub = sourceData.find((h) => h.id === activeHubFilter);
      if (hub) {
        current = hub.totalSpending || 0;
        hardLimitTotal = hub.limit || 0;
      }
    }
    return { current, hardLimitTotal };
  }, [activeTab, activeHubFilter, sourceData]);

  const currentSpending = budgetStats.current;
  const activeLimit =
    activeHubFilter === "all" ? monthlyBudget : budgetStats.hardLimitTotal;
  const percentage = Math.min((currentSpending / activeLimit) * 100, 100);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- ACTIONS ---
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

  const handleManualReset = () => {
    setShowConfirmModal(false);
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 2000);
  };

  const handleSaveBudget = () => {
    setShowBudgetModal(false);
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 1000);
  };

  const handleDateSelect = (day) => {
    if (day) {
      setBillingDate(day.toString());
      setShowDatePicker(false);
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
      width: "90%",
      maxWidth: 300,
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
                onPress={() =>
                  navigation.navigate("BudgetDeviceList", { hubName: hub.name })
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

      {/* --- DATE PICKER MODAL (TRUE CALENDAR) --- */}
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
                // RENDER EMPTY SLOT
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
  const usagePercent = Math.min((data.totalSpending / data.limit) * 100, 100);
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
            ₱{data.totalSpending}
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
            Limit: ₱{data.limit}
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
