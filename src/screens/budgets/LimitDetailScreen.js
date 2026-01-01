import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function LimitDetailScreen() {
  const navigation = useNavigation();

  const [amount, setAmount] = useState("");
  const [autoOff, setAutoOff] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    msg: "",
    icon: "check-circle",
    iconColor: "#00ff99",
    redirect: null,
  });

  const handleExtension = () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setModalContent({
        title: "Invalid Amount",
        msg: "Please enter a valid amount greater than 0.",
        icon: "error-outline",
        iconColor: "#ff4444",
        redirect: null,
      });
      setModalVisible(true);
      return;
    }

    setModalContent({
      title: "Limit Extended",
      msg: `Your daily budget has been increased by ₱${amount}.00.`,
      icon: "check-circle",
      iconColor: "#00ff99",
      redirect: "Home",
    });
    setModalVisible(true);
  };

  const handleTurnOff = () => {
    setModalContent({
      title: "Device OFF",
      msg: "Smart TV is shutting down safely.",
      icon: "check-circle",
      iconColor: "#00ff99",
      redirect: "Home",
    });
    setModalVisible(true);
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

  return (
    <View style={styles.phoneFrame}>
      <StatusBar barStyle="light-content" backgroundColor="#b37400" />

      <LinearGradient
        colors={["#b37400", "#1a1a1a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.iconBox}>
          <MaterialIcons name="timelapse" size={40} color="#ffcc00" />
        </View>
        <Text style={styles.title}>Usage Limit Hit</Text>
        <Text style={styles.sub}>Smart TV exceeded daily budget</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardLabelLeft}>Daily Consumption</Text>

          <View style={styles.limitDisplay}>
            <Text style={styles.currentVal}>₱ 45.50</Text>
            <Text style={styles.limitVal}>Limit: ₱ 40.00</Text>
          </View>

          <View style={styles.progressBg}>
            <LinearGradient
              colors={["#ffcc00", "#ff4444"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressFill}
            />
          </View>

          <Text style={styles.percentText}>113% Used</Text>

          <View style={styles.statRow}>
            <Text style={styles.statText}>Duration: 6h 30m</Text>
            <Text style={styles.statText}>Avg: 120 Watts</Text>
          </View>
        </View>

        <View style={[styles.card, styles.autoOffContainer]}>
          <MaterialIcons name="settings-power" size={32} color="#888" />
          <View style={{ flex: 1, marginLeft: 18 }}>
            <Text style={styles.autoOffTitle}>
              {autoOff ? "Auto-Off Enabled" : "Auto-Off Disabled"}
            </Text>
            <Text style={styles.autoOffSub}>
              {autoOff
                ? "Device will turn off in 5 mins."
                : "Manual control active."}
            </Text>
          </View>

          <TouchableOpacity onPress={() => setAutoOff(!autoOff)}>
            <MaterialIcons
              name={autoOff ? "toggle-on" : "toggle-off"}
              size={48}
              color={autoOff ? "#00ff99" : "#666"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabelGold}>Extend Budget (Pesos)</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.currencyInput}
              placeholder="Amount (e.g. 20)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <TouchableOpacity onPress={handleExtension} activeOpacity={0.8}>
              <LinearGradient
                colors={["#ffcc00", "#ffaa00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnAdd}
              >
                <Text style={styles.btnAddText}>ADD</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.btnOff} onPress={handleTurnOff}>
          <MaterialIcons name="power-settings-new" size={24} color="#fff" />
          <Text style={styles.btnOffText}>Turn Off Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ignoreLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.ignoreLinkText}>Ignore warning for today</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <View style={styles.customOverlay}>
          <View style={styles.customModal}>
            <MaterialIcons
              name={modalContent.icon}
              size={42}
              color={modalContent.iconColor}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.modalTitle}>{modalContent.title}</Text>
            <Text style={styles.modalMsg}>{modalContent.msg}</Text>

            <TouchableOpacity
              onPress={handleModalClose}
              style={{ width: "100%" }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#0055ff", "#00ff99"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtn}
              >
                <Text style={styles.modalBtnText}>Okay, Got it</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  phoneFrame: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    position: "absolute",
    top: 50,
    left: 24,
    width: "100%",
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    opacity: 0.8,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
  hero: {
    paddingTop: 100,
    paddingBottom: 30,
    alignItems: "center",
  },
  iconBox: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "rgba(255, 200, 0, 0.3)",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 5,
    color: "#ffcc00",
  },
  sub: {
    fontSize: 14,
    opacity: 0.9,
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    width: "100%",
  },
  cardLabelLeft: {
    textAlign: "left",
    fontSize: 11,
    color: "#888",
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  cardLabelGold: {
    textAlign: "left",
    fontSize: 11,
    color: "#ffcc00",
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  limitDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  currentVal: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  limitVal: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
    paddingBottom: 6,
  },
  progressBg: {
    height: 12,
    backgroundColor: "#333",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    width: "100%",
  },
  percentText: {
    textAlign: "right",
    fontSize: 12,
    color: "#ff4444",
    fontWeight: "700",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 15,
  },
  statText: {
    fontSize: 12,
    color: "#aaa",
  },
  inputWrapper: {
    flexDirection: "row",
    gap: 8,
    marginTop: 5,
    width: "100%",
  },
  currencyInput: {
    flex: 1,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 12,
    paddingVertical: 0,
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    height: 44,
  },
  btnAdd: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 18,
    height: 44,
  },
  btnAddText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 14,
    textTransform: "uppercase",
  },
  btnOff: {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  btnOffText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  autoOffContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 22,
  },
  autoOffTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  autoOffSub: {
    fontSize: 12,
    color: "#888",
  },
  ignoreLink: {
    marginTop: 20,
    alignItems: "center",
  },
  ignoreLinkText: {
    fontSize: 12,
    color: "#666",
    textDecorationLine: "underline",
  },
  customOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  customModal: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 18,
    width: 250,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  modalMsg: {
    fontSize: 12,
    color: "#bbb",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 18,
  },
  modalBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 13,
  },
});
