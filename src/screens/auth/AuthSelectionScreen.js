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
  Alert,
  TextInput, // Added for 2FA Input
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
// 1. Import createClient for Shadow Check
import { supabase } from "../../lib/supabase";
import { createClient } from "@supabase/supabase-js";

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

  // --- 2FA STATE (NEW) ---
  const [mfaVisible, setMfaVisible] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState(null);
  // Re-using pendingIdToken for 2FA google auth as well

  const showModal = (type, title, message, onPress = null) => {
    setAlertConfig({ type, title, message, onPress });
    setAlertModalVisible(true);
  };

  // --- CONFIGURE GOOGLE SIGN IN ---
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
      ]),
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

  // --- LOG HELPER ---
  const logLoginSuccess = async (userId, method) => {
    try {
      await supabase.from("app_notifications").insert({
        user_id: userId,
        title: "Login Successful",
        body: `${method} Login • ${Platform.OS.toUpperCase()} • ${new Date().toLocaleTimeString()}`,
      });
    } catch (err) {
      console.log("Log error", err);
    }
  };

  // --- STEP 1: NATIVE GOOGLE SIGN IN & PRE-CHECK ---
  const handleGoogleSignIn = async () => {
    setLoadingMessage("Checking Account...");
    setIsLoading(true);
    setPendingIdToken(null);
    setPendingGoogleUser(null);

    try {
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      const userObj = response.data ? response.data.user : response.user;
      const idToken = response.data ? response.data.idToken : response.idToken;

      if (!idToken || !userObj || !userObj.email) {
        throw new Error("Could not retrieve user details. Please try again.");
      }

      // --- SHADOW CHECK (Does not persist session) ---
      // We check Supabase status without logging the user into the app yet
      const tempClient = createClient(
        supabase.supabaseUrl,
        supabase.supabaseKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        },
      );

      const { data: authData, error: authError } =
        await tempClient.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });

      if (authError) throw authError;

      const user = authData.user;
      const createdAt = new Date(user.created_at).getTime();
      const lastSignIn = new Date(user.last_sign_in_at).getTime();
      const isNewUser = lastSignIn - createdAt < 5000;

      if (isNewUser) {
        // --- NEW USER FLOW ---
        // Clean up the shadow user from auth (we will recreate properly in registration step)
        await tempClient.rpc("delete_own_account");

        setIsLoading(false);
        setPendingIdToken(idToken);
        setPendingGoogleUser(userObj);
        setTermsModalVisible(true); // Proceed to Terms -> Registration
      } else {
        // --- EXISTING USER FLOW ---

        // Check 2FA using Shadow Client
        const { data: factors } = await tempClient.auth.mfa.listFactors();
        const totpFactor = factors?.totp?.find((f) => f.status === "verified");

        if (totpFactor) {
          // --- 2FA ENABLED: SHOW MODAL ---
          setMfaFactorId(totpFactor.id);
          setPendingIdToken(idToken); // Save token for verification
          setIsLoading(false);
          setMfaVisible(true);
        } else {
          // --- 2FA DISABLED: LOGIN IMMEDIATELY ---
          // Now perform REAL login on main client
          const { data: realData } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: idToken,
          });

          await logLoginSuccess(realData.user.id, "Google");

          setIsLoading(false);
          // Check if profile exists (double check) then redirect
          const { data: profile } = await supabase
            .from("users")
            .select("id")
            .eq("id", realData.user.id)
            .maybeSingle();

          if (profile) {
            navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
          } else {
            // Rare edge case: Auth exists but no profile. Treat as new.
            setPendingIdToken(idToken);
            setPendingGoogleUser(userObj);
            setTermsModalVisible(true);
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (error.code === statusCodes.IN_PROGRESS) return;
      showModal("error", "Google Sign-In Error", error.message);
    }
  };

  // --- STEP 1.5: VERIFY 2FA ---
  const verifyMfaAndLogin = async () => {
    if (mfaCode.length !== 6) {
      showModal("error", "Invalid Code", "Please enter 6 digits.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Verifying 2FA...");

    try {
      // 1. Real Login with Google Token
      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithIdToken({
          provider: "google",
          token: pendingIdToken,
        });

      if (loginError) throw loginError;

      // 2. Challenge & Verify
      const challenge = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: mfaCode,
      });
      if (verify.error) throw verify.error;

      // 3. Success
      await logLoginSuccess(loginData.user.id, "Google + 2FA");

      setMfaVisible(false);
      setPendingIdToken(null);
      setIsLoading(false);

      navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
    } catch (error) {
      setIsLoading(false);
      // Ensure clean state
      await supabase.auth.signOut();
      showModal(
        "error",
        "Verification Failed",
        "Invalid code or token expired.",
      );
    }
  };

  // --- STEP 2A: EXISTING USER LOGIN (Fallback for Email/Legacy flow) ---
  const handleContinueLogin = async () => {
    setExistingAccountModalVisible(false);
    // ... existing logic for email fallback if needed, but Google flow above handles it now.
    // Keeping this function if your UI still calls it for non-Google cases.
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
      // 1. Sign in to Supabase (Real Client)
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
        { onConflict: "id" },
      );

      if (dbError) {
        console.log("Profile Upsert Note:", dbError.message);
      }

      await sendWelcomeEmail(user.email, firstName);
      await logLoginSuccess(user.id, "Google Signup"); // Log signup event

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

      {/* --- NEW: 2FA VERIFICATION MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={mfaVisible}
        onRequestClose={() => {
          if (!isLoading) {
            setMfaVisible(false);
            setPendingIdToken(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Security Check
            </Text>
            <Text style={[styles.modalBody, { color: theme.textSecondary }]}>
              Enter the 2FA code from your authenticator app to continue with
              Google.
            </Text>

            <TextInput
              style={{
                backgroundColor: theme.buttonNeutral,
                color: theme.text,
                borderRadius: 12,
                padding: 14,
                textAlign: "center",
                fontSize: 20,
                letterSpacing: 6,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                marginBottom: 20,
                width: "100%",
              }}
              placeholder="000 000"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              value={mfaCode}
              onChangeText={setMfaCode}
            />

            <TouchableOpacity
              onPress={verifyMfaAndLogin}
              disabled={isLoading}
              style={{ width: "100%" }}
            >
              <View
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.buttonPrimary },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    VERIFY
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMfaVisible(false);
                setPendingIdToken(null);
                setMfaCode("");
              }}
              disabled={isLoading}
              style={{ marginTop: 16 }}
            >
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                Cancel
              </Text>
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
