import React, { useState } from "react";
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
} from "react-native";
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

export default function LimitDetailScreen() {
  const navigation = useNavigation();
  const { theme, fontScale, isDarkMode } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const [amount, setAmount] = useState("");
  const [autoOff, setAutoOff] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    msg: "",
    redirect: null,
  });

  const handleExtension = () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setModalContent({
        title: "Invalid Amount",
        msg: "Please enter a valid amount greater than 0.",
        redirect: null,
      });
      setModalVisible(true);
      return;
    }

    setModalContent({
      title: "Limit Extended",
      msg: `Your daily budget has been increased by ₱${amount}.00.`,
      redirect: "Home",
    });
    setModalVisible(true);
  };

  const handleTurnOff = () => {
    setModalContent({
      title: "Device OFF",
      msg: "Smart TV is shutting down safely.",
      redirect: "Home",
    });
    setModalVisible(true);
  };

  const handleToggleAutoOff = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAutoOff(!autoOff);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalContent.redirect) {
      setTimeout(() => {
        if (modalContent.redirect === "Home") {
          navigation.navigate("MainApp", { screen: "Home" });
        } else {
          navigation.navigate(modalContent.redirect);
        }
      }, 200);
    }
  };

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

      {}
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
          Smart TV exceeded daily budget
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {}
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
              ₱ 45.50
            </Text>
            <Text
              style={{
                fontSize: scaledSize(14),
                color: theme.textSecondary,
                fontWeight: "600",
                paddingBottom: 6,
              }}
            >
              Limit: ₱ 40.00
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
              style={{ height: "100%", width: "100%" }}
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
            113% Used
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
              style={{
                fontSize: scaledSize(13),
                color: theme.textSecondary,
              }}
            >
              Duration: 6h 30m
            </Text>
            <Text
              style={{
                fontSize: scaledSize(13),
                color: theme.textSecondary,
              }}
            >
              Avg: 120 Watts
            </Text>
          </View>
        </View>

        {}
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
              style={{
                fontSize: scaledSize(13),
                color: theme.textSecondary,
              }}
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

        {}
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

        {}
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
          onPress={() => navigation.goBack()}
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

      {}
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
