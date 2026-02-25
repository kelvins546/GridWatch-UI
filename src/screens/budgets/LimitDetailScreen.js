import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  StyleSheet,
  UIManager,
  LayoutAnimation,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase"; // Make sure path is correct

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

export default function LimitDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, fontScale, isDarkMode } = useTheme();

  const scaledSize = (size) => size * fontScale;

  // Accept params so real devices can use this screen
  const { deviceId = "tv", deviceName = "Smart TV" } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [deviceData, setDeviceData] = useState(null);
  const [usedAmount, setUsedAmount] = useState(0);
  const [dbLimit, setDbLimit] = useState(0);

  const [amount, setAmount] = useState("");
  const [autoOff, setAutoOff] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    msg: "",
    redirect: null,
  });

  // --- FETCH REAL DEVICE USAGE ---
  useEffect(() => {
    if (deviceId === "tv") {
      // Mock data for presentation
      setDeviceData({ name: "Smart TV", auto_cutoff: true });
      setDbLimit(400);
      setUsedAmount(452);
      setAutoOff(true);
      setIsLoading(false);
    } else {
      fetchRealDevice();
    }
  }, [deviceId]);

  const fetchRealDevice = async () => {
    try {
      const { data: dev } = await supabase
        .from("devices")
        .select("*")
        .eq("id", deviceId)
        .single();

      if (dev) {
        setDeviceData(dev);
        setDbLimit(dev.budget_limit || 0);
        setAutoOff(dev.auto_cutoff || false);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("bill_cycle_day")
          .eq("id", user.id)
          .single();

        const billDay = userData?.bill_cycle_day || 1;
        const now = new Date();
        let startDate = new Date(now.getFullYear(), now.getMonth(), billDay);
        if (now.getDate() < billDay) {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, billDay);
        }

        const { data: usageData } = await supabase
          .from("usage_analytics")
          .select("cost_incurred")
          .eq("device_id", deviceId)
          .gte("date", startDate.toISOString());

        const totalUsed =
          usageData?.reduce(
            (sum, row) => sum + (parseFloat(row.cost_incurred) || 0),
            0,
          ) || 0;
        setUsedAmount(totalUsed);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtension = async () => {
    const addedAmount = parseFloat(amount);
    if (!addedAmount || isNaN(addedAmount) || addedAmount <= 0) {
      setModalContent({
        title: "Invalid Amount",
        msg: "Please enter a valid amount greater than 0.",
        redirect: null,
      });
      setModalVisible(true);
      return;
    }

    // Update real database if not a mock device
    if (deviceId !== "tv") {
      const newLimit = dbLimit + addedAmount;
      await supabase
        .from("devices")
        // NEW: Clear the alert date so it can trigger again if the NEW limit is hit!
        .update({ budget_limit: newLimit, last_budget_alert_date: null })
        .eq("id", deviceId);
      setDbLimit(newLimit); // Update UI
    } else {
      setDbLimit(dbLimit + addedAmount);
    }

    setAmount("");
    setModalContent({
      title: "Limit Extended",
      msg: `Your budget has been safely increased by ₱${addedAmount.toFixed(2)}.`,
      redirect: "GoBack",
    });
    setModalVisible(true);
  };

  const handleTurnOff = async () => {
    // Update real database if not a mock device
    if (deviceId !== "tv") {
      await supabase
        .from("devices")
        .update({ status: "off" })
        .eq("id", deviceId);
    }

    setModalContent({
      title: "Device OFF",
      msg: `${deviceData?.name || deviceName} is shutting down safely.`,
      redirect: "GoBack",
    });
    setModalVisible(true);
  };

  const handleToggleAutoOff = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newVal = !autoOff;
    setAutoOff(newVal);

    if (deviceId !== "tv") {
      await supabase
        .from("devices")
        .update({ auto_cutoff: newVal })
        .eq("id", deviceId);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalContent.redirect) {
      setTimeout(() => {
        if (modalContent.redirect === "Home") {
          navigation.navigate("MainApp", { screen: "Home" });
        } else if (modalContent.redirect === "GoBack") {
          navigation.goBack();
        } else {
          navigation.navigate(modalContent.redirect);
        }
      }, 200);
    }
  };

  const percentage =
    dbLimit > 0 ? ((usedAmount / dbLimit) * 100).toFixed(0) : 0;
  const progressWidth = Math.min(percentage, 100);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    backButton: {
      position: "absolute",
      top: 60,
      left: 24,
      zIndex: 10,
      padding: 4,
      backgroundColor: "rgba(0,0,0,0.2)",
      borderRadius: 20,
    },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
    },
    detailLabel: {
      color: theme.textSecondary,
      fontSize: scaledSize(12),
      fontWeight: "700",
      textTransform: "uppercase",
      marginBottom: 10,
      letterSpacing: 1,
    },
    inputContainer: {
      flexDirection: "row",
      gap: 8,
      marginTop: 5,
      width: "100%",
    },
    input: {
      flex: 1,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 12,
      paddingVertical: 0,
      paddingHorizontal: 12,
      color: theme.text,
      fontSize: scaledSize(16),
      fontWeight: "600",
      height: 44,
    },
    addButton: {
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 12,
      paddingHorizontal: 18,
      height: 44,
      backgroundColor: "#ffaa00",
    },
    addButtonText: {
      color: "#000",
      fontWeight: "800",
      fontSize: scaledSize(14),
      textTransform: "uppercase",
    },
    turnOffButton: {
      width: "100%",
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: theme.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
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
      width: 288,
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
      lineHeight: 22,
      color: theme.textSecondary,
      fontSize: scaledSize(14),
    },
    modalButtonPrimary: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.buttonPrimary,
    },
  });

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#ffaa00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={scaledSize(24)} color="#fff" />
      </TouchableOpacity>

      <LinearGradient
        colors={["#ffaa00", theme.background]}
        style={{ paddingTop: 120, paddingBottom: 40, alignItems: "center" }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "rgba(0,0,0,0.2)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.2)",
            marginBottom: 16,
          }}
        >
          <MaterialIcons name="timelapse" size={40} color="#fff" />
        </View>
        <Text
          style={{
            fontSize: scaledSize(24),
            fontWeight: "900",
            color: "#fff",
            marginBottom: 6,
          }}
        >
          Usage Limit Hit
        </Text>
        <Text
          style={{
            fontSize: scaledSize(14),
            color: "rgba(255,255,255,0.9)",
          }}
        >
          {deviceData?.name || deviceName} exceeded allocated budget
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={styles.card}>
          <Text style={styles.detailLabel}>Daily Consumption</Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontSize: scaledSize(32),
                fontWeight: "800",
                color: theme.text,
              }}
            >
              ₱ {usedAmount.toFixed(2)}
            </Text>
            <Text
              style={{
                fontSize: scaledSize(14),
                color: theme.textSecondary,
                fontWeight: "600",
                paddingBottom: 6,
              }}
            >
              Limit: ₱ {dbLimit.toFixed(2)}
            </Text>
          </View>

          <View
            style={{
              height: 12,
              backgroundColor: isDarkMode ? "#333" : "#e0e0e0",
              borderRadius: 6,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            <LinearGradient
              colors={["#ffcc00", "#ff4444"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: "100%", width: `${progressWidth}%` }}
            />
          </View>

          <Text
            style={{
              textAlign: "right",
              fontSize: scaledSize(14),
              color: "#ff4444",
              fontWeight: "700",
            }}
          >
            {percentage}% Used
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 15,
              borderTopWidth: 1,
              borderTopColor: theme.cardBorder,
              paddingTop: 15,
            }}
          >
            <Text
              style={{ fontSize: scaledSize(13), color: theme.textSecondary }}
            >
              {deviceId === "tv"
                ? "Duration: 6h 30m"
                : "Realtime Monitor Active"}
            </Text>
            <Text
              style={{ fontSize: scaledSize(13), color: theme.textSecondary }}
            >
              {deviceId === "tv" ? "Avg: 120 Watts" : ""}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
            { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
          ]}
        >
          <MaterialIcons
            name="settings-power"
            size={scaledSize(32)}
            color={theme.icon}
          />
          <View style={{ flex: 1, marginLeft: 18 }}>
            <Text
              style={{
                fontSize: scaledSize(16),
                fontWeight: "700",
                color: theme.text,
                marginBottom: 4,
              }}
            >
              {autoOff ? "Auto-Off Enabled" : "Auto-Off Disabled"}
            </Text>
            <Text
              style={{ fontSize: scaledSize(13), color: theme.textSecondary }}
            >
              {autoOff
                ? "Device will turn off in 5 mins."
                : "Manual control active."}
            </Text>
          </View>

          <CustomSwitch
            value={autoOff}
            onToggle={handleToggleAutoOff}
            theme={theme}
          />
        </View>

        <View style={styles.card}>
          <Text style={[styles.detailLabel, { color: "#ffaa00" }]}>
            Extend Budget (Pesos)
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Amount (e.g. 20)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TouchableOpacity onPress={handleExtension} activeOpacity={0.8}>
              <View style={styles.addButton}>
                <Text style={styles.addButtonText}>ADD</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.turnOffButton} onPress={handleTurnOff}>
          <MaterialIcons
            name="power-settings-new"
            size={scaledSize(24)}
            color={theme.text}
          />
          <Text
            style={{
              color: theme.text,
              fontWeight: "600",
              fontSize: scaledSize(16),
              marginLeft: 8,
            }}
          >
            Turn Off Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 24, alignItems: "center" }}
          onPress={async () => {
            // NEW: Set the ignore flag for today in Supabase
            if (deviceId !== "tv") {
              const todayStr = new Date().toISOString().split("T")[0];
              await supabase
                .from("devices")
                .update({ last_budget_alert_date: todayStr + "_ignored" })
                .eq("id", deviceId);
            }
            navigation.goBack();
          }}
        >
          <Text
            style={{
              fontSize: scaledSize(14),
              color: theme.textSecondary,
              textDecorationLine: "underline",
            }}
          >
            Ignore warning for today
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalContent.title}</Text>
            <Text style={styles.modalBody}>{modalContent.msg}</Text>

            <TouchableOpacity
              onPress={handleModalClose}
              style={styles.modalButtonPrimary}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: scaledSize(12),
                }}
              >
                Okay, Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function CustomSwitch({ value, onToggle, theme }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      style={{
        width: 42,
        height: 26,
        borderRadius: 16,
        backgroundColor: value ? theme.buttonPrimary : theme.buttonNeutral,
        padding: 2,
        justifyContent: "center",
        alignItems: value ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 2.5,
          elevation: 2,
        }}
      />
    </TouchableOpacity>
  );
}
