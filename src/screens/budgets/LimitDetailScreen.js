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
  Switch,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function LimitDetailScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();

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
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <StatusBar barStyle="light-content" backgroundColor="#b37400" />

      <LinearGradient
        colors={["#b37400", "#1a1a1a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingTop: 100,
          paddingBottom: 30,
          alignItems: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 50,
            left: 24,
            width: "100%",
            zIndex: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", opacity: 0.8 }}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons
              name="arrow-back"
              size={scaledSize(18)}
              color="#fff"
            />
            <Text
              style={{
                color: "#fff",
                fontSize: scaledSize(14),
                fontWeight: "500",
                marginLeft: 5,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderRadius: 40,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 15,
            borderWidth: 2,
            borderColor: "rgba(255, 200, 0, 0.3)",
          }}
        >
          <MaterialIcons
            name="timelapse"
            size={scaledSize(40)}
            color="#ffcc00"
          />
        </View>
        <Text
          style={{
            fontSize: scaledSize(24),
            fontWeight: "800",
            marginBottom: 5,
            color: "#ffcc00",
          }}
        >
          Usage Limit Hit
        </Text>
        <Text
          style={{
            fontSize: scaledSize(14),
            opacity: 0.9,
            color: "#fff",
          }}
        >
          Smart TV exceeded daily budget
        </Text>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: "#222",
            borderWidth: 1,
            borderColor: "#333",
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            width: "100%",
          }}
        >
          <Text
            style={{
              textAlign: "left",
              fontSize: scaledSize(11),
              color: "#888",
              fontWeight: "700",
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            Daily Consumption
          </Text>

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
                color: "#fff",
              }}
            >
              ₱ 45.50
            </Text>
            <Text
              style={{
                fontSize: scaledSize(14),
                color: "#888",
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
              backgroundColor: "#333",
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
              fontSize: scaledSize(12),
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
              borderTopColor: "#333",
              paddingTop: 15,
            }}
          >
            <Text style={{ fontSize: scaledSize(12), color: "#aaa" }}>
              Duration: 6h 30m
            </Text>
            <Text style={{ fontSize: scaledSize(12), color: "#aaa" }}>
              Avg: 120 Watts
            </Text>
          </View>
        </View>

        {}
        <View
          style={{
            backgroundColor: "#222",
            borderWidth: 1,
            borderColor: "#333",
            borderRadius: 20,
            padding: 22,
            marginBottom: 16,
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <MaterialIcons
            name="settings-power"
            size={scaledSize(32)}
            color="#888"
          />
          <View style={{ flex: 1, marginLeft: 18 }}>
            <Text
              style={{
                fontSize: scaledSize(16),
                fontWeight: "700",
                color: "#fff",
                marginBottom: 4,
              }}
            >
              {autoOff ? "Auto-Off Enabled" : "Auto-Off Disabled"}
            </Text>
            <Text style={{ fontSize: scaledSize(12), color: "#888" }}>
              {autoOff
                ? "Device will turn off in 5 mins."
                : "Manual control active."}
            </Text>
          </View>

          <Switch
            trackColor={{ false: "#666", true: theme.buttonPrimary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#3e3e3e"
            onValueChange={() => setAutoOff(!autoOff)}
            value={autoOff}
            style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
          />
        </View>

        <View
          style={{
            backgroundColor: "#222",
            borderWidth: 1,
            borderColor: "#333",
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            width: "100%",
          }}
        >
          <Text
            style={{
              textAlign: "left",
              fontSize: scaledSize(11),
              color: "#ffcc00",
              fontWeight: "700",
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            Extend Budget (Pesos)
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 5,
              width: "100%",
            }}
          >
            <TextInput
              style={{
                flex: 1,
                backgroundColor: "#111",
                borderWidth: 1,
                borderColor: "#444",
                borderRadius: 12,
                paddingVertical: 0,
                paddingHorizontal: 12,
                color: "#fff",
                fontSize: scaledSize(14),
                fontWeight: "600",
                height: 44,
              }}
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
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 12,
                  paddingHorizontal: 18,
                  height: 44,
                }}
              >
                <Text
                  style={{
                    color: "#000",
                    fontWeight: "800",
                    fontSize: scaledSize(14),
                    textTransform: "uppercase",
                  }}
                >
                  ADD
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={{
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
          }}
          onPress={handleTurnOff}
        >
          <MaterialIcons
            name="power-settings-new"
            size={scaledSize(24)}
            color="#fff"
          />
          <Text
            style={{
              color: "#fff",
              fontWeight: "600",
              fontSize: scaledSize(16),
              marginLeft: 8,
            }}
          >
            Turn Off Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 20, alignItems: "center" }}
          onPress={() => navigation.goBack()}
        >
          <Text
            style={{
              fontSize: scaledSize(12),
              color: "#666",
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
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderWidth: 1,
              borderColor: "#333",
              paddingVertical: 24,
              paddingHorizontal: 20,
              borderRadius: 18,
              width: 250,
              alignItems: "center",
              elevation: 5,
            }}
          >
            {}
            <Text
              style={{
                fontSize: scaledSize(17),
                fontWeight: "700",
                color: "#fff",
                marginBottom: 8,
              }}
            >
              {modalContent.title}
            </Text>
            <Text
              style={{
                fontSize: scaledSize(12),
                color: "#bbb",
                marginBottom: 20,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              {modalContent.msg}
            </Text>

            <TouchableOpacity
              onPress={handleModalClose}
              style={{ width: "100%" }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#0055ff", "#00ff99"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: "100%",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#000",
                    fontWeight: "700",
                    fontSize: scaledSize(13),
                  }}
                >
                  Okay, Got it
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
