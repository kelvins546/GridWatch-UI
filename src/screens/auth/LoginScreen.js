import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
// 1. Import Supabase & createClient
import { supabase } from "../../lib/supabase";
import { createClient } from "@supabase/supabase-js";

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.com$/;

export default function LoginScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const [isLoading, setIsLoading] = useState(true);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [redirectOnClose, setRedirectOnClose] = useState(false);

  // --- 2FA & Reactivation STATE ---
  const [mfaVisible, setMfaVisible] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState(null);
  const [googleIdToken, setGoogleIdToken] = useState(null);

  // Reactivation Modal
  const [reactivateModalVisible, setReactivateModalVisible] = useState(false);
  const [pendingReactivation, setPendingReactivation] = useState(null);

  const floatAnim = useRef(new Animated.Value(0)).current;

  // --- 1. INITIAL SESSION CHECK ---
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const { data: mfaData } =
            await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (
            mfaData &&
            mfaData.nextLevel === "aal2" &&
            mfaData.currentLevel === "aal1"
          ) {
            await supabase.auth.signOut();
            setIsLoading(false);
          } else {
            navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
      }
    };
    checkUserSession();
  }, []);

  // --- CONFIG ---
  useEffect(() => {
    GoogleSignin.configure({
      scopes: ["email", "profile"],
      webClientId:
        "279998586082-buisq8vl4tnm3hrga2hb84raaghggnhf.apps.googleusercontent.com",
    });
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

  const validateField = (field, value) => {
    let error = null;
    if (field === "email") {
      if (!value) error = "Email is required";
      else if (!ALLOWED_EMAIL_REGEX.test(value))
        error = "Use a valid provider (Gmail, Yahoo, etc)";
    }
    if (field === "password" && !value) error = "Password is required";
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const logLoginSuccess = async (userId, method) => {
    try {
      await supabase.from("app_notifications").insert({
        user_id: userId,
        title: "Login Successful",
        body: `${method} Login • ${Platform.OS.toUpperCase()} • ${new Date().toLocaleTimeString()}`,
      });
    } catch (err) {
      console.log(err);
    }
  };

  // --- 2. HANDLE EMAIL LOGIN (SHADOW CLIENT) ---
  const handleLogin = async () => {
    const formValues = { email, password };
    let isValid = true;
    Object.keys(formValues).forEach((key) => {
      validateField(key, formValues[key]);
      if (!formValues[key] || errors[key]) isValid = false;
    });

    if (!isValid || !ALLOWED_EMAIL_REGEX.test(email)) {
      setErrorMessage("Please correct the errors before logging in.");
      setErrorModalVisible(true);
      return;
    }

    setIsLoading(true);
    setGoogleIdToken(null);

    try {
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

      const { data: tempData, error: tempError } =
        await tempClient.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (tempError) {
        setIsLoading(false);
        setErrorMessage(tempError.message);
        setErrorModalVisible(true);
        return;
      }

      // --- CHECK ARCHIVED STATUS ---
      const { data: profile } = await tempClient
        .from("users")
        .select("status")
        .eq("id", tempData.user.id)
        .single();

      if (profile && profile.status === "archived") {
        setPendingReactivation({ type: "email" });
        setIsLoading(false);
        setReactivateModalVisible(true);
        return; // HALT FLOW
      }

      // Check 2FA
      const { data: factors } = await tempClient.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find((f) => f.status === "verified");

      if (totpFactor) {
        console.log("2FA Detected (Email). Prompting...");
        setMfaFactorId(totpFactor.id);
        setIsLoading(false);
        setMfaVisible(true);
      } else {
        await performRealEmailLogin();
      }
    } catch (e) {
      console.log("Shadow Login Error", e);
      setIsLoading(false);
      setErrorMessage("An unexpected error occurred.");
      setErrorModalVisible(true);
    }
  };

  const performRealEmailLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (!error) {
      await logLoginSuccess(data.user.id, "Email");
      navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
    }
    setIsLoading(false);
  };

  // --- 3. HANDLE GOOGLE LOGIN (SHADOW CLIENT) ---
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setRedirectOnClose(false);
    setGoogleIdToken(null);

    try {
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken || userInfo.data?.idToken;

      if (idToken) {
        await processGoogleAuth(idToken);
      } else {
        throw new Error("No ID token present!");
      }
    } catch (error) {
      setIsLoading(false);
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        setErrorMessage(error.message);
        setErrorModalVisible(true);
      }
    }
  };

  // Split Google Auth Logic for reuse after reactivation
  const processGoogleAuth = async (idToken) => {
    try {
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

      const { data, error } = await tempClient.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) throw error;

      const user = data.user;
      const createdAt = new Date(user.created_at).getTime();
      const lastSignIn = new Date(user.last_sign_in_at).getTime();
      const isNewUser = lastSignIn - createdAt < 5000;

      if (isNewUser) {
        await tempClient.rpc("delete_own_account");
        setIsLoading(false);
        setErrorMessage(
          "No account found with this email. Please sign up first.",
        );
        setRedirectOnClose(true);
        setErrorModalVisible(true);
        return;
      }

      // --- CHECK ARCHIVED STATUS ---
      const { data: profile } = await tempClient
        .from("users")
        .select("status")
        .eq("id", user.id)
        .single();

      if (profile && profile.status === "archived") {
        setPendingReactivation({ type: "google", idToken: idToken });
        setIsLoading(false);
        setReactivateModalVisible(true);
        return; // HALT FLOW
      }

      // 2FA Check
      const { data: factors } = await tempClient.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find((f) => f.status === "verified");

      if (totpFactor) {
        console.log("2FA Detected (Google). Prompting...");
        setMfaFactorId(totpFactor.id);
        setGoogleIdToken(idToken);
        setIsLoading(false);
        setMfaVisible(true);
      } else {
        const { data: realData } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        await logLoginSuccess(realData.user.id, "Google");
        setIsLoading(false);
        navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(error.message);
      setErrorModalVisible(true);
    }
  };

  // --- 4. REACTIVATE ACCOUNT ---
  const handleConfirmReactivation = async () => {
    if (!pendingReactivation) return;
    setIsLoading(true);
    setReactivateModalVisible(false);

    try {
      // 1. Create a fresh temp client to update the user
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

      // 2. Sign in to temp client to get permission to update
      let signInError;
      if (pendingReactivation.type === "email") {
        const res = await tempClient.auth.signInWithPassword({
          email: email,
          password: password,
        });
        signInError = res.error;
      } else {
        const res = await tempClient.auth.signInWithIdToken({
          provider: "google",
          token: pendingReactivation.idToken,
        });
        signInError = res.error;
      }

      if (signInError) throw signInError;

      const {
        data: { user },
      } = await tempClient.auth.getUser();

      // 3. Update Status to Active
      const { error: updateError } = await tempClient
        .from("users")
        .update({ status: "active", archived_at: null })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // 4. Resume Login Flow
      if (pendingReactivation.type === "email") {
        handleLogin(); // Will now pass status check
      } else {
        processGoogleAuth(pendingReactivation.idToken); // Will now pass status check
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessage("Failed to reactivate account: " + error.message);
      setErrorModalVisible(true);
    }
  };

  // --- 5. VERIFY 2FA CODE & RE-LOGIN ---
  const verifyMfaAndLogin = async () => {
    if (mfaCode.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit code.");
      setErrorModalVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      // Shadow Verification Pattern
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

      let loginError;
      if (googleIdToken) {
        const res = await tempClient.auth.signInWithIdToken({
          provider: "google",
          token: googleIdToken,
        });
        loginError = res.error;
      } else {
        const res = await tempClient.auth.signInWithPassword({
          email: email,
          password: password,
        });
        loginError = res.error;
      }

      if (loginError) throw loginError;

      const challenge = await tempClient.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challenge.error) throw challenge.error;

      const verify = await tempClient.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: mfaCode,
      });
      if (verify.error) throw verify.error;

      // Success! Transfer session
      const {
        data: { session },
      } = await tempClient.auth.getSession();

      if (session) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        const method = googleIdToken ? "Google + 2FA" : "Email + 2FA";
        await logLoginSuccess(session.user.id, method);

        setMfaVisible(false);
        setIsLoading(false);
        setGoogleIdToken(null);

        navigation.reset({
          index: 0,
          routes: [{ name: "MainApp" }],
        });
      } else {
        throw new Error("Failed to retrieve verified session.");
      }
    } catch (error) {
      await supabase.auth.signOut();
      setIsLoading(false);
      setErrorMessage("Invalid Code. Please try again.");
      setErrorModalVisible(true);
    }
  };

  const handleModalClose = () => {
    setErrorModalVisible(false);
    if (redirectOnClose) {
      navigation.navigate("AuthSelection");
      setRedirectOnClose(false);
    }
  };

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
    modalButton: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.buttonDangerText,
    },
    modalButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: scaledSize(12),
      textTransform: "uppercase",
      letterSpacing: 1,
    },
  });

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
          <ActivityIndicator size="large" color="#B0B0B0" />
          <Text
            className="mt-3 font-medium"
            style={{
              color: "#B0B0B0",
              fontSize: 12,
              letterSpacing: 0.5,
            }}
          >
            {email ? "Processing..." : "Loading..."}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          <View className="p-[30px]">
            {/* Logo Section */}
            <View className="items-center mb-10">
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

            {/* Inputs */}
            <InputGroup
              label="Email Address"
              icon="email"
              placeholder="natasha@example.com"
              value={email}
              onChangeText={(text) => handleChange("email", text)}
              error={touched.email && errors.email}
              theme={theme}
            />

            <View className="mb-2">
              <View className="flex-row justify-between">
                <Text
                  className="text-[11px] font-bold uppercase mb-2"
                  style={{
                    color:
                      touched.password && errors.password
                        ? theme.buttonDangerText
                        : theme.textSecondary,
                  }}
                >
                  Password
                </Text>
                {touched.password && errors.password && (
                  <Text
                    className="text-[10px] italic mr-1"
                    style={{ color: theme.buttonDangerText }}
                  >
                    {errors.password}
                  </Text>
                )}
              </View>

              <View
                className="flex-row items-center rounded-xl px-4 py-2.5 border"
                style={{
                  backgroundColor: theme.buttonNeutral,
                  borderColor: theme.cardBorder,
                }}
              >
                <MaterialIcons
                  name="lock"
                  size={20}
                  color={
                    touched.password && errors.password
                      ? theme.buttonDangerText
                      : theme.textSecondary
                  }
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  className="flex-1 text-sm"
                  style={{ color: theme.text }}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={(text) => handleChange("password", text)}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <MaterialIcons
                    name={showPass ? "visibility" : "visibility-off"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text
                className="self-end font-semibold text-sm mb-[25px]"
                style={{ color: theme.textSecondary }}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.8}>
              <View
                className="p-4 rounded-2xl items-center shadow-sm"
                style={{ backgroundColor: theme.buttonPrimary }}
              >
                <Text
                  className="font-bold text-[15px]"
                  style={{ color: theme.buttonPrimaryText }}
                >
                  LOG IN
                </Text>
              </View>
            </TouchableOpacity>

            {/* --- GOOGLE SIGN IN BUTTON --- */}
            <View className="flex-row items-center my-6">
              <View
                className="flex-1 h-[1px]"
                style={{ backgroundColor: theme.cardBorder }}
              />
              <Text
                className="mx-3 text-xs font-bold uppercase"
                style={{ color: theme.textSecondary }}
              >
                Or Login with
              </Text>
              <View
                className="flex-1 h-[1px]"
                style={{ backgroundColor: theme.cardBorder }}
              />
            </View>

            <TouchableOpacity onPress={handleGoogleSignIn} activeOpacity={0.8}>
              <View
                className="flex-row items-center justify-center p-4 rounded-2xl border"
                style={{
                  backgroundColor: theme.buttonNeutral,
                  borderColor: theme.cardBorder,
                }}
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
              </View>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-[30px]">
              <Text style={{ color: theme.textSecondary }}>
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("AuthSelection")}
              >
                <Text
                  className="font-bold"
                  style={{ color: theme.buttonPrimary }}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              className="text-center text-xs italic mt-10 opacity-80"
              style={{ color: theme.primary }}
            >
              "Don't wait for the bill. Control it."
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ERROR MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {redirectOnClose ? "Account Not Found" : "Login Failed"}
            </Text>
            <Text style={styles.modalBody}>{errorMessage}</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleModalClose}
            >
              <Text style={styles.modalButtonText}>
                {redirectOnClose ? "GO TO SIGNUP" : "TRY AGAIN"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* REACTIVATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={reactivateModalVisible}
        onRequestClose={() => setReactivateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Account Deactivated</Text>
            <Text style={styles.modalBody}>
              Your account is currently archived. If you continue, it will be
              reactivated again.
            </Text>

            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => setReactivateModalVisible(false)}
              >
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
                    Cancel
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={handleConfirmReactivation}
              >
                <View
                  style={[
                    styles.modalButton,
                    { backgroundColor: theme.buttonPrimary },
                  ]}
                >
                  <Text style={styles.modalButtonText}>Continue</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MFA VERIFICATION MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={mfaVisible}
        onRequestClose={() => {
          if (!isLoading) {
            setMfaVisible(false);
            setGoogleIdToken(null);
            setMfaCode("");
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
                setGoogleIdToken(null);
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

function InputGroup({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  theme,
}) {
  return (
    <View className="mb-5">
      <View className="flex-row justify-between">
        <Text
          className="text-[11px] font-bold uppercase mb-2"
          style={{
            color: error ? theme.buttonDangerText : theme.textSecondary,
          }}
        >
          {label}
        </Text>
        {error && (
          <Text
            className="text-[10px] italic mr-1"
            style={{ color: theme.buttonDangerText }}
          >
            {error}
          </Text>
        )}
      </View>
      <View
        className="flex-row items-center rounded-xl px-4 py-2.5 border"
        style={{
          backgroundColor: theme.buttonNeutral,
          borderColor: theme.cardBorder,
        }}
      >
        <MaterialIcons
          name={icon}
          size={20}
          color={error ? theme.buttonDangerText : theme.textSecondary}
          style={{ marginRight: 12 }}
        />
        <TextInput
          className="flex-1 text-sm"
          style={{ color: theme.text }}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
    </View>
  );
}
