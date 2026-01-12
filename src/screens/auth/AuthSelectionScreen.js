import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export default function AuthSelectionScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGoogleSignIn = () => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setModalVisible(true);
    }, 1500);
  };

  const navigateToHubSetup = () => {
    setModalVisible(false);
    navigation.navigate("SetupHub");
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {isLoading && (
        <View className="absolute z-50 w-full h-full bg-black/70 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="mt-4 font-bold" style={{ color: theme.text }}>
            Connecting...
          </Text>
        </View>
      )}

      <View className="flex-1 justify-center px-8">
        {/* Logo Section */}
        <View className="items-center mb-12">
          <Animated.View
            style={{
              transform: [{ translateY: floatAnim }],
              backgroundColor: "black",
              borderRadius: 999,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isDarkMode ? 0.6 : 0.3,
              shadowRadius: 30,
              elevation: 20,
            }}
            className="w-[120px] h-[120px] items-center justify-center mb-6"
          >
            <Image
              source={require("../../../assets/GridWatch-logo.png")}
              className="w-[110px] h-[110px]"
              resizeMode="contain"
              style={{ borderRadius: 60, backgroundColor: "black" }}
            />
          </Animated.View>

          <View className="items-center justify-center mb-1">
            <Text
              className="text-[28px] font-black text-center tracking-[4px] uppercase"
              style={{ color: theme.text }}
            >
              GridWatch
            </Text>
          </View>

          <Text
            className="text-[13px] tracking-[0.5px]"
            style={{ color: theme.textSecondary }}
          >
            Smart Energy Monitoring
          </Text>
        </View>

        {/* Buttons Section */}
        <View>
          {/* Email Login */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Signup")}
            activeOpacity={0.8}
            className="mb-3"
          >
            <View
              className="p-4 rounded-2xl items-center shadow-sm"
              style={{ backgroundColor: theme.buttonPrimary }}
            >
              <Text
                className="font-bold text-[15px]"
                style={{ color: theme.buttonPrimaryText }}
              >
                Continue with Email
              </Text>
            </View>
          </TouchableOpacity>

          <View className="flex-row items-center my-3">
            <View
              className="flex-1 h-[1px]"
              style={{ backgroundColor: theme.cardBorder }}
            />
            <Text
              className="mx-3 text-xs font-bold uppercase"
              style={{ color: theme.textSecondary }}
            >
              Or
            </Text>
            <View
              className="flex-1 h-[1px]"
              style={{ backgroundColor: theme.cardBorder }}
            />
          </View>

          <TouchableOpacity
            onPress={handleGoogleSignIn}
            className="flex-row items-center justify-center p-4 rounded-2xl mb-6 border"
            style={{
              backgroundColor: theme.buttonNeutral,
              borderColor: theme.cardBorder,
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/300/300221.png",
              }}
              className="w-5 h-5 mr-3"
              resizeMode="contain"
            />
            <Text
              className="font-bold text-[15px]"
              style={{ color: theme.text }}
            >
              Continue with Google
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text style={{ color: theme.textSecondary }}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text
                className="font-bold"
                style={{ color: theme.buttonPrimary }}
              >
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text
          className="text-center text-xs italic opacity-80 mt-12"
          style={{ color: theme.primary }}
        >
          "Smart protection for the modern Filipino home."
        </Text>
      </View>

      {/* Success Modal (Updated to Match Specs) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            // FIXED: Width [70%], Max Width [260px], p-4, rounded-2xl
            className="w-[70%] max-w-[260px] p-4 rounded-2xl items-center border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            {/* ICON REMOVED */}

            {/* FIXED: mb-1 for Title */}
            <Text
              className="text-lg font-bold text-center mb-1"
              style={{ color: theme.text }}
            >
              Welcome!
            </Text>
            {/* FIXED: mb-4 for Description */}
            <Text
              className="text-xs text-center mb-4 leading-4"
              style={{ color: theme.textSecondary }}
            >
              Successfully authenticated with Google.
            </Text>

            {/* FIXED: Button centered and 50% width */}
            <TouchableOpacity
              className="w-[50%] self-center"
              onPress={navigateToHubSetup}
            >
              <View
                className="p-3 rounded-xl items-center"
                style={{ backgroundColor: theme.buttonPrimary }}
              >
                <Text
                  className="font-bold text-[13px]"
                  style={{ color: theme.buttonPrimaryText }}
                >
                  CONTINUE
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  modalCard: {
    width: "75%",
    maxWidth: 280,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
  },
  modalTitleSmall: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescSmall: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  modalBtnSmall: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  btnTextBlack: {
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
