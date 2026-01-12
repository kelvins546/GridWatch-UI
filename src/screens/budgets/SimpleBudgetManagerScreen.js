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

  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // --- BUDGET DATA ---
  const [monthlyBudget, setMonthlyBudget] = useState(1900);
  const [billingDate, setBillingDate] = useState("15"); // Storing just the day number
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    new Date().getMonth()
  );

  // --- DATE LOGIC (New) ---
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  // Calculate specific days in the current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = today.toLocaleString("default", { month: "long" });
  // Generate array [1, 2, 3... daysInMonth]
  const billingDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // --- DATA SOURCES ---
  const HUBS = [
    {
      id: "living",
      name: "Living Room",
      status: "Online",
      devices: 4,
      icon: "weekend",
      totalSpending: 850.5,
      limit: 1200,
    },
    {
      id: "kitchen",
      name: "Kitchen",
      status: "Online",
      devices: 2,
      icon: "kitchen",
      totalSpending: 600.25,
      limit: 800,
    },
  ];

  // --- FILTER LOGIC ---
  const displayHubs =
    activeHubFilter === "all"
      ? HUBS
      : HUBS.filter((h) => h.id === activeHubFilter);

  const budgetStats = useMemo(() => {
    let current = 0;
    let hardLimitTotal = 0;

    if (activeHubFilter === "all") {
      current = HUBS.reduce((acc, hub) => acc + (hub.totalSpending || 0), 0);
      hardLimitTotal = HUBS.reduce((acc, hub) => acc + (hub.limit || 0), 0);
    } else {
      const hub = HUBS.find((h) => h.id === activeHubFilter);
      if (hub) {
        current = hub.totalSpending || 0;
        hardLimitTotal = hub.limit || 0;
      }
    }

    return { current, hardLimitTotal };
  }, [activeHubFilter, HUBS]);

  const currentSpending = budgetStats.current;
  const totalDeviceLimits = budgetStats.hardLimitTotal;
  const isOverAllocated = totalDeviceLimits > monthlyBudget;

  const percentage = Math.min((currentSpending / monthlyBudget) * 100, 100);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- ACTIONS ---
  const handleHubSelect = (id) => {
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
    setBillingDate(day.toString());
    setShowDatePicker(false);
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
      fontSize: scaledSize(16),
    },
    scrollContent: {
      paddingBottom: 100,
    },
    section: {
      padding: 24,
    },
    filterWrapper: {
      backgroundColor: theme.background,
      paddingTop: 6,
      paddingHorizontal: 24,
      paddingBottom: 10,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    chipText: {
      fontWeight: "bold",
      fontSize: scaledSize(11),
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    warningCard: {
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 24,
    },
  });

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
          <View
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              backgroundColor: "#ff4d4d",
              width: 14,
              height: 14,
              borderRadius: 7,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: theme.background,
            }}
          >
            <Text style={{ color: "white", fontSize: 8, fontWeight: "bold" }}>
              2
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* --- HUB SELECTION TABS --- */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            <TouchableOpacity
              onPress={() => handleHubSelect("all")}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    activeHubFilter === "all" ? primaryColor : theme.card,
                  borderColor:
                    activeHubFilter === "all" ? primaryColor : theme.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      activeHubFilter === "all" ? "#fff" : theme.textSecondary,
                  },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {HUBS.map((hub) => {
              const isActive = activeHubFilter === hub.id;
              return (
                <TouchableOpacity
                  key={hub.id}
                  onPress={() => handleHubSelect(hub.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isActive ? primaryColor : theme.card,
                      borderColor: isActive ? primaryColor : theme.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isActive ? "#fff" : theme.textSecondary },
                    ]}
                  >
                    {hub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          {/* --- MAIN GOAL CARD --- */}
          <TouchableOpacity
            activeOpacity={1}
            style={{ marginBottom: 20 }}
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
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    {activeHubFilter === "all" ? "Total Bill" : "Hub Bill"}
                  </Text>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: scaledSize(42),
                      fontWeight: "900",
                      marginTop: 4,
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
                      fontSize: scaledSize(14),
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
                    Goal: ₱ {monthlyBudget.toLocaleString()}
                  </Text>
                </View>
                <View
                  style={{
                    height: 16,
                    backgroundColor: isDarkMode ? "#333" : "#f0f0f0",
                    borderRadius: 8,
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
                  value="₱ 120.50"
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
                  value={`Every ${billingDate}th`}
                  icon="event-repeat"
                  theme={theme}
                  scaledSize={scaledSize}
                />
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* --- BUDGET HEALTH WARNING --- */}
          {isOverAllocated && (
            <View
              style={[
                styles.warningCard,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(255,68,68,0.1)"
                    : "rgba(255,200,200,0.3)",
                  borderColor: dangerColor,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <MaterialIcons name="warning" size={20} color={dangerColor} />
                <Text
                  style={{
                    fontWeight: "bold",
                    marginLeft: 8,
                    color: dangerColor,
                    fontSize: scaledSize(14),
                  }}
                >
                  Conflict Detected
                </Text>
              </View>
              <Text
                style={{
                  color: theme.text,
                  fontSize: scaledSize(13),
                  marginBottom: 8,
                  lineHeight: 20,
                }}
              >
                {`Your device limits (₱${totalDeviceLimits.toLocaleString()}) exceed your monthly goal.`}
              </Text>
            </View>
          )}

          {/* --- BILLING DATE SELECTION --- */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              marginBottom: 16,
            }}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={theme.textSecondary}
              />
              <View style={{ marginLeft: 12 }}>
                <Text
                  style={{
                    fontWeight: "bold",
                    color: theme.text,
                    fontSize: scaledSize(14),
                  }}
                >
                  Billing Cycle Date
                </Text>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(11),
                  }}
                >
                  App resets automatically
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  fontWeight: "bold",
                  marginRight: 4,
                  color: theme.text,
                  fontSize: scaledSize(12),
                }}
              >
                {billingDate}th
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={18}
                color={theme.textSecondary}
              />
            </View>
          </TouchableOpacity>

          {/* --- MANUAL RESET --- */}
          <TouchableOpacity
            onPress={() => setShowConfirmModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: dangerColor,
              backgroundColor: isDarkMode
                ? "rgba(255, 68, 68, 0.05)"
                : "rgba(204, 0, 0, 0.05)",
              marginBottom: 30,
            }}
          >
            <MaterialIcons name="restart-alt" size={20} color={dangerColor} />
            <Text
              style={{
                marginLeft: 8,
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: 1,
                color: dangerColor,
                fontSize: scaledSize(12),
              }}
            >
              Manual Reset
            </Text>
          </TouchableOpacity>

          {/* Hub List Header */}
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: scaledSize(11),
              fontWeight: "bold",
              textTransform: "uppercase",
              marginBottom: 12,
              letterSpacing: 1,
            }}
          >
            Select Room to Manage
          </Text>

          {/* Hub List */}
          <View style={{ gap: 12 }}>
            {displayHubs.map((hub) => (
              <HubCard
                key={hub.id}
                data={hub}
                theme={theme}
                isDarkMode={isDarkMode}
                primaryColor={primaryColor}
                scaledSize={scaledSize}
                onPress={() =>
                  navigation.navigate("BudgetDeviceList", { hubName: hub.name })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ... MODALS ... */}
      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 280,
              padding: 20,
              borderRadius: 16,
              alignItems: "center",
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              borderWidth: 1,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 12,
                backgroundColor: `${dangerColor}22`,
              }}
            >
              <MaterialIcons name="warning" size={28} color={dangerColor} />
            </View>
            <Text
              style={{
                fontWeight: "bold",
                marginBottom: 8,
                textAlign: "center",
                color: theme.text,
                fontSize: scaledSize(16),
              }}
            >
              Reset Spending?
            </Text>
            <Text
              style={{
                textAlign: "center",
                marginBottom: 20,
                lineHeight: 20,
                color: theme.textSecondary,
                fontSize: scaledSize(11),
              }}
            >
              This will clear your current spending.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  alignItems: "center",
                  borderColor: theme.cardBorder,
                }}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    color: theme.text,
                    fontSize: scaledSize(12),
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleManualReset}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: dangerColor,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: scaledSize(12),
                  }}
                >
                  Reset
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <TouchableOpacity
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            onPress={() => setShowDatePicker(false)}
          />
          <View
            style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              height: "50%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{ color: theme.text, fontSize: 18, fontWeight: "bold" }}
              >
                Select Day in {monthName}
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
              data={billingDays}
              keyExtractor={(i) => i.toString()}
              numColumns={5}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleDateSelect(item)}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    margin: 4,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    borderRadius: 8,
                    backgroundColor:
                      item === parseInt(billingDate)
                        ? primaryColor
                        : "transparent",
                    // FIX: Prevent large items by limiting width or using flex basis
                    maxWidth: "18%",
                  }}
                >
                  <Text
                    style={{
                      color:
                        item === parseInt(billingDate) ? "#fff" : theme.text,
                      fontWeight: "bold",
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

      {/* Budget Set Modal */}
      <Modal visible={showBudgetModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <TouchableOpacity
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            onPress={() => setShowBudgetModal(false)}
          />
          <View
            style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{ color: theme.text, fontSize: 18, fontWeight: "bold" }}
              >
                Set Monthly Goal
              </Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: 20,
                  borderRadius: 20,
                  borderWidth: 1,
                  backgroundColor: theme.background,
                  borderColor: theme.cardBorder,
                }}
              >
                <TouchableOpacity
                  onPress={() => setMonthlyBudget((b) => Math.max(0, b - 100))}
                  style={{
                    padding: 10,
                    backgroundColor: theme.buttonNeutral,
                    borderRadius: 20,
                  }}
                >
                  <MaterialIcons name="remove" size={24} color={theme.text} />
                </TouchableOpacity>
                <TextInput
                  value={monthlyBudget.toString()}
                  onChangeText={handleBudgetChange}
                  keyboardType="numeric"
                  style={{
                    color: theme.text,
                    fontSize: 32,
                    fontWeight: "bold",
                    textAlign: "center",
                    minWidth: 80,
                  }}
                  maxLength={7}
                />
                <TouchableOpacity
                  onPress={() => setMonthlyBudget((b) => b + 100)}
                  style={{
                    padding: 10,
                    backgroundColor: theme.buttonNeutral,
                    borderRadius: 20,
                  }}
                >
                  <MaterialIcons name="add" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* DETAILS WHEN TYPING */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 12,
                }}
              >
                <MaterialIcons
                  name="info-outline"
                  size={16}
                  color={theme.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  ≈ ₱ {(monthlyBudget / daysInMonth).toFixed(2)} / day
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSaveBudget}
              style={{
                backgroundColor: primaryColor,
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                Save Goal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isResetting && (
        <View
          style={{
            position: "absolute",
            zIndex: 100,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={{ color: "#fff", marginTop: 16, fontWeight: "bold" }}>
            Updating Settings...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

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

function HubCard({
  data,
  theme,
  isDarkMode,
  primaryColor,
  scaledSize,
  onPress,
}) {
  const isOffline = data.status === "Offline";
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={!isOffline ? onPress : null}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          opacity: isOffline ? 0.6 : 1,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: isOffline
                ? `${theme.textSecondary}20`
                : `${primaryColor}20`,
              marginRight: 16,
            }}
          >
            <MaterialIcons
              name={data.icon}
              size={22}
              color={isOffline ? theme.textSecondary : primaryColor}
            />
          </View>
          <View>
            <Text
              style={{
                color: theme.text,
                fontWeight: "bold",
                fontSize: scaledSize(14),
                marginBottom: 2,
              }}
            >
              {data.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isOffline
                    ? theme.textSecondary
                    : primaryColor,
                  marginRight: 6,
                }}
              />
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(11),
                }}
              >
                {data.status}
              </Text>
            </View>
          </View>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={theme.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}
