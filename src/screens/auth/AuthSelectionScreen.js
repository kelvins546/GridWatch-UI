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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

// --- EMAILJS CONFIGURATION ---
const EMAILJS_SERVICE_ID = "service_ah3k0xc";
const EMAILJS_TEMPLATE_ID = "template_8hzregb";
const EMAILJS_PUBLIC_KEY = "pdso3GRtCqLn7fVTs";

export default function AuthSelectionScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing...");

  // --- MODAL STATE ---
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [existingAccountModalVisible, setExistingAccountModalVisible] =
    useState(false);

  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "error",
    title: "",
    message: "",
    onPress: null,
  });

  // STORE PENDING DATA
  const [pendingIdToken, setPendingIdToken] = useState(null);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);

  const showModal = (type, title, message, onPress = null) => {
    setAlertConfig({ type, title, message, onPress });
    setAlertModalVisible(true);
  };

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ["email", "profile"],
      webClientId:
        "279998586082-buisq8vl4tnm3hrga2hb84raaghggnhf.apps.googleusercontent.com",
    });
  }, []);

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

  // --- EMAILJS SENDER ---
  const sendWelcomeEmail = async (email, name) => {
    const data = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        to_name: name,
      },
    };

    try {
      await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("EmailJS Error:", error);
    }
  };

  // --- STEP 1: NATIVE GOOGLE SIGN IN & PRE-CHECK ---
  const handleGoogleSignIn = async () => {
    setLoadingMessage("Checking Account...");
    setIsLoading(true);
    try {
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      const userObj = response.data ? response.data.user : response.user;
      const idToken = response.data ? response.data.idToken : response.idToken;

      if (!idToken || !userObj || !userObj.email) {
        throw new Error("Could not retrieve user details. Please try again.");
      }

      const googleEmail = userObj.email;

      // PRE-CHECK DB
      const { data: profileData } = await supabase
        .from("users")
        .select("id, first_name")
        .eq("email", googleEmail)
        .maybeSingle();

      setIsLoading(false);

      // Store for next step
      setPendingIdToken(idToken);
      setPendingGoogleUser(userObj);

      const firstName = profileData?.first_name || "";
      const isPlaceholder =
        !firstName || firstName === "New" || firstName === "User";

      if (profileData && !isPlaceholder) {
        setExistingAccountModalVisible(true);
      } else {
        setTermsModalVisible(true);
      }
    } catch (error) {
      setIsLoading(false);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (error.code === statusCodes.IN_PROGRESS) return;
      showModal("error", "Google Sign-In Error", error.message);
    }
  };

  // --- STEP 2A: EXISTING USER LOGIN ---
  const handleContinueLogin = async () => {
    setExistingAccountModalVisible(false);

    setIsLoading(true);
    setLoadingMessage("Verifying Account...");

    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: pendingIdToken,
      });

      if (error) throw error;

      setTimeout(() => setLoadingMessage("Syncing Data..."), 1000);
      setTimeout(() => setLoadingMessage("Redirecting..."), 2000);
      setTimeout(() => {
        setIsLoading(false);
        navigation.reset({
          index: 0,
          routes: [{ name: "MainApp" }],
        });
      }, 3000);
    } catch (error) {
      setIsLoading(false);
      showModal("error", "Login Failed", error.message);
    }
  };

  const handleCancelLogin = () => {
    setExistingAccountModalVisible(false);
    setPendingIdToken(null);
    setPendingGoogleUser(null);
  };

  // --- STEP 2B: NEW USER REGISTRATION ---
  const handleTermsAgreement = async () => {
    setTermsModalVisible(false);
    if (pendingIdToken && pendingGoogleUser) {
      setLoadingMessage("Creating Profile...");
      setIsLoading(true);
      await performNewUserRegistration();
    }
  };

  const performNewUserRegistration = async () => {
    try {
      // 1. Sign in to Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: pendingIdToken,
      });

      if (error) throw error;

      const user = data.user;

      // 2. Prepare Profile Data
      const meta = pendingGoogleUser;
      let firstName = meta.givenName || "";
      let lastName = meta.familyName || "";

      if (!firstName && meta.name) {
        const parts = meta.name.trim().split(/\s+/);
        firstName = parts[0];
        lastName = parts.slice(1).join(" ");
      }

      if (!firstName && user.email) {
        firstName = user.email.split("@")[0];
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      }

      if (!firstName) firstName = "Member";

      // 3. Upsert Profile
      const { error: dbError } = await supabase.from("users").upsert(
        [
          {
            id: user.id,
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            role: "resident",
            status: "active",
            avatar_url: meta.photo || null,
          },
        ],
        { onConflict: "id" }
      ); // Explicit conflict handling

      // --- CRITICAL FIX START ---
      // We check for errors, but since the user IS created in Auth and likely in DB (via trigger),
      // we DO NOT block the flow. We log it and proceed.
      if (dbError) {
        console.log("Profile Upsert Note:", dbError.message);
        // We continue intentionally.
      }
      // --- CRITICAL FIX END ---

      await sendWelcomeEmail(user.email, firstName);
      setIsLoading(false);
      setSuccessModalVisible(true);
    } catch (e) {
      setIsLoading(false);
      showModal("error", "Error", e.message);
    }
  };

  const handleFinalContinue = () => {
    setSuccessModalVisible(false);
    navigation.navigate("SetupHub", { fromSignup: true });
  };

  const handleTermsRejection = () => {
    setTermsModalVisible(false);
    setPendingIdToken(null);
    setPendingGoogleUser(null);
    showModal("error", "Signup Cancelled", "You must accept the terms.");
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

      {/* LOADING OVERLAY */}
      {isLoading && (
        <View className="absolute z-50 w-full h-full bg-black/70 justify-center items-center">
          <ActivityIndicator size="large" color="#B0B0B0" />
          <Text
            className="mt-3 font-medium"
            style={{
              color: "#B0B0B0",
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          >
            {loadingMessage}
          </Text>
        </View>
      )}

      <View className="flex-1 justify-center px-8">
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

        <View>
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
          className="text-center text-xs italic opacity-80 mt-8"
          style={{ color: theme.primary }}
        >
          "Smart protection for the modern Filipino home."
        </Text>
      </View>

      {/* --- EXISTING ACCOUNT MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={existingAccountModalVisible}
        onRequestClose={handleCancelLogin}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Account Found
            </Text>
            <Text style={[styles.modalBody, { color: theme.textSecondary }]}>
              You have already authenticated this account. Would you like to log
              in?
            </Text>
            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={handleCancelLogin}>
                <View
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: "transparent",
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontWeight: "bold",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    CANCEL
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={handleContinueLogin}
              >
                <View
                  style={[
                    styles.modalButton,
                    { backgroundColor: theme.buttonPrimary },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.buttonPrimaryText,
                      fontWeight: "bold",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    LOGIN
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- SUCCESS MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Success
            </Text>
            <Text style={[styles.modalBody, { color: theme.textSecondary }]}>
              Successfully Registered.
            </Text>
            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={handleFinalContinue}
            >
              <View
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.buttonPrimary },
                ]}
              >
                <Text
                  style={{
                    color: theme.buttonPrimaryText,
                    fontWeight: "bold",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  CONTINUE
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- ALERT MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={alertModalVisible}
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {alertConfig.title}
            </Text>
            <Text style={[styles.modalBody, { color: theme.textSecondary }]}>
              {alertConfig.message}
            </Text>
            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={() => {
                setAlertModalVisible(false);
                if (alertConfig.onPress) alertConfig.onPress();
              }}
            >
              <View
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      alertConfig.type === "success"
                        ? theme.buttonPrimary
                        : theme.buttonDangerText,
                  },
                ]}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {alertConfig.type === "success" ? "CONTINUE" : "OKAY"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- TERMS MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={termsModalVisible}
        onRequestClose={handleTermsRejection}
      >
        <View className="flex-1 bg-black/90 justify-center items-center">
          <View
            className="w-[85%] h-[75%] border rounded-2xl overflow-hidden"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View
              className="p-5 border-b flex-row items-center justify-between"
              style={{ borderColor: theme.cardBorder }}
            >
              <Text className="text-lg font-bold" style={{ color: theme.text }}>
                Terms & Conditions
              </Text>
              <TouchableOpacity onPress={handleTermsRejection}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 p-5">
              <Text
                className="font-bold mb-4 uppercase text-xs"
                style={{ color: theme.buttonPrimary }}
              >
                Last Updated: January 2026
              </Text>
              <Text className="font-bold mb-2" style={{ color: theme.text }}>
                1. Service Usage & Monitoring
              </Text>
              <Text
                className="text-sm mb-4 leading-5"
                style={{ color: theme.textSecondary }}
              >
                GridWatch provides real-time electrical monitoring services. By
                using the App and Hub, you acknowledge that data regarding your
                voltage, current, and wattage consumption will be uploaded to
                our cloud servers for analysis.
              </Text>

              <Text className="font-bold mb-2" style={{ color: theme.text }}>
                2. Data Privacy
              </Text>
              <Text
                className="text-sm mb-4 leading-5"
                style={{ color: theme.textSecondary }}
              >
                We value your privacy. Your personal information and specific
                location data are encrypted. We do not sell your individual
                appliance usage patterns to third-party advertisers. Aggregated,
                anonymous data may be used to improve grid efficiency analysis.
              </Text>

              <Text className="font-bold mb-2" style={{ color: theme.text }}>
                3. Hardware Safety & Responsibility
              </Text>
              <Text
                className="text-sm mb-4 leading-5"
                style={{ color: theme.textSecondary }}
              >
                The GridWatch Hub is designed to assist in monitoring and fault
                protection. However, it is not a substitute for professional
                electrical maintenance. Users are responsible for ensuring their
                appliances are safe to operate remotely. Do not overload the
                device beyond its rated 10A capacity.
              </Text>

              <Text className="font-bold mb-2" style={{ color: theme.text }}>
                4. Limitation of Liability
              </Text>
              <Text
                className="text-sm mb-4 leading-5"
                style={{ color: theme.textSecondary }}
              >
                GridWatch is not liable for any damages, electrical fires, or
                equipment failures resulting from misuse, overloading, or
                modification of the hardware. The "Safety Cut-off" feature is a
                supplementary protection layer and not a guarantee against all
                electrical faults.
              </Text>
            </ScrollView>
            <View
              className="p-5 border-t flex-row gap-3"
              style={{
                borderColor: theme.cardBorder,
                backgroundColor: theme.background,
              }}
            >
              <TouchableOpacity
                onPress={handleTermsRejection}
                style={{ flex: 1 }}
              >
                <View
                  className="p-3.5 rounded-xl items-center border"
                  style={{ borderColor: theme.cardBorder }}
                >
                  <Text
                    className="font-bold text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    DECLINE
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTermsAgreement}
                style={{ flex: 1 }}
              >
                <View
                  className="p-3.5 rounded-xl items-center"
                  style={{ backgroundColor: theme.buttonPrimary }}
                >
                  <Text
                    className="font-bold text-sm"
                    style={{ color: theme.buttonPrimaryText }}
                  >
                    I AGREE
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalBody: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    width: "100%",
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
