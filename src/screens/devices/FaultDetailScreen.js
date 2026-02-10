import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Platform,
  StyleSheet,
  UIManager,
  LayoutAnimation,
  ActivityIndicator,
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

export default function FaultDetailScreen() {
  const navigation = useNavigation();
  const { theme, fontScale, isDarkMode } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const [checks, setChecks] = useState([false, false, false]);
  const [showModal, setShowModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const toggleCheck = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newChecks = [...checks];
    newChecks[index] = !newChecks[index];
    setChecks(newChecks);
  };

  const allChecked = checks.every(Boolean);

  const handleReset = () => {
    if (!allChecked) return;
    setIsResetting(true);

    setTimeout(() => {
      setIsResetting(false);
      setShowModal(true);
    }, 2000);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    headerOverlay: {
      position: "absolute",
      top: Platform.OS === "android" ? 60 : 60,
      left: 24,
      right: 24,
      zIndex: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    detailValue: {
      fontSize: scaledSize(15),
      fontWeight: "600",
      color: theme.text,
    },
    sectionTitle: {
      fontSize: scaledSize(12),
      fontWeight: "bold",
      color: theme.textSecondary,
      marginBottom: 12,
      marginTop: 8,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      marginRight: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    resetBtn: {
      width: "100%",
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      flexDirection: "row",
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
    loaderOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 50,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {}
      <View style={styles.headerOverlay}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            padding: 4,
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: 20,
          }}
        >
          <MaterialIcons name="arrow-back" size={scaledSize(24)} color="#fff" />
        </TouchableOpacity>

        {}
        <TouchableOpacity
          style={{
            padding: 4,
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: 20,
            opacity: 0,
          }}
          disabled={true}
        >
          <MaterialIcons name="settings" size={scaledSize(24)} color="#fff" />
        </TouchableOpacity>
      </View>

      {}
      <LinearGradient
        colors={["#ff4444", theme.background]}
        style={{ paddingTop: 110, paddingBottom: 25, alignItems: "center" }}
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
            marginBottom: 10,
          }}
        >
          <MaterialIcons name="flash-off" size={40} color="#fff" />
        </View>
        <Text
          style={{
            fontSize: scaledSize(24),
            fontWeight: "900",
            color: "#fff",
            marginBottom: 2,
          }}
        >
          Power Cutoff Active
        </Text>
        <Text
          style={{
            fontSize: scaledSize(14),
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Safety Protection Triggered
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {}
        <View style={styles.card}>
          <Text style={[styles.detailLabel, { marginBottom: 12 }]}>
            Incident Report
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View>
              <Text style={styles.detailLabel}>Affected Device</Text>
              <Text style={styles.detailValue}>Outlet 3</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, { color: "#ff4444" }]}>
                TRIPPED
              </Text>
            </View>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: theme.cardBorder,
              marginVertical: 12,
            }}
          />
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text style={styles.detailLabel}>Peak Current</Text>
              <Text style={styles.detailValue}>45.2 A</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.detailLabel}>Time of Fault</Text>
              <Text style={styles.detailValue}>10:42 AM</Text>
            </View>
          </View>
        </View>

        {}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <View
            style={[
              styles.card,
              { flex: 1, marginBottom: 0, alignItems: "center" },
            ]}
          >
            <MaterialIcons
              name="bolt"
              size={20}
              color={theme.textSecondary}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.detailLabel}>Fault Type</Text>
            <Text style={[styles.detailValue, { fontSize: scaledSize(13) }]}>
              Short Circuit
            </Text>
          </View>
          <View
            style={[
              styles.card,
              { flex: 1, marginBottom: 0, alignItems: "center" },
            ]}
          >
            <MaterialIcons
              name="history"
              size={20}
              color={theme.textSecondary}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.detailLabel}>Last Active</Text>
            <Text style={styles.detailValue}>10:41 AM</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Required Safety Checks</Text>

        <CheckItem
          text="I have unplugged the faulty appliance connected to Outlet 3."
          checked={checks[0]}
          onPress={() => toggleCheck(0)}
          theme={theme}
          styles={styles}
          scaledSize={scaledSize}
        />
        <CheckItem
          text="I have inspected the outlet for any visible burn marks or smoke."
          checked={checks[1]}
          onPress={() => toggleCheck(1)}
          theme={theme}
          styles={styles}
          scaledSize={scaledSize}
        />
        <CheckItem
          text="I understand that resetting power to a faulty circuit can be dangerous."
          checked={checks[2]}
          onPress={() => toggleCheck(2)}
          theme={theme}
          styles={styles}
          scaledSize={scaledSize}
        />

        <View style={{ marginTop: 16 }}>
          <TouchableOpacity
            style={[
              styles.resetBtn,
              {
                backgroundColor: allChecked ? "#ff4444" : theme.cardBorder,
                opacity: allChecked ? 1 : 0.5,
              },
            ]}
            disabled={!allChecked || isResetting}
            onPress={handleReset}
          >
            <MaterialIcons
              name="power-settings-new"
              size={scaledSize(22)}
              color="#fff"
            />
            <Text
              style={[
                styles.resetBtnText,
                {
                  marginLeft: 10,
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: scaledSize(14),
                },
              ]}
            >
              {isResetting ? "RESTORING..." : "RESET OUTLET POWER"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={{
            fontSize: scaledSize(10),
            color: theme.textSecondary,
            textAlign: "center",
            marginTop: 24,
          }}
        >
          GridWatch System ID: GW-SAFE-9921
        </Text>
      </ScrollView>

      {isResetting && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text
            style={{
              color: "#fff",
              marginTop: 16,
              fontSize: scaledSize(14),
              fontWeight: "600",
            }}
          >
            Restoring Power...
          </Text>
        </View>
      )}

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text
              style={{
                fontWeight: "bold",
                marginBottom: 8,
                textAlign: "center",
                color: theme.text,
                fontSize: scaledSize(18),
              }}
            >
              Power Restored
            </Text>
            <Text
              style={{
                textAlign: "center",
                marginBottom: 24,
                lineHeight: 20,
                color: theme.textSecondary,
                fontSize: scaledSize(12),
              }}
            >
              Safety protocols verified. Power has been safely restored to
              Outlet 3.
            </Text>
            <TouchableOpacity
              style={{
                width: "100%",
                height: 40,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.buttonPrimary,
              }}
              onPress={() => navigation.navigate("MainApp", { screen: "Home" })}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: scaledSize(12),
                  color: "#fff",
                }}
              >
                Return to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function CheckItem({ text, checked, onPress, theme, styles, scaledSize }) {
  return (
    <TouchableOpacity
      style={{ flexDirection: "row", marginBottom: 16, paddingRight: 10 }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? "#00ff99" : theme.textSecondary,
            backgroundColor: checked ? "#00ff99" : "transparent",
          },
        ]}
      >
        {checked && <MaterialIcons name="check" size={16} color="#000" />}
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: scaledSize(13),
          color: theme.text,
          lineHeight: 20,
        }}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}
