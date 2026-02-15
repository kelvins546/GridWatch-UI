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
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import { createClient } from "@supabase/supabase-js";

import FirebaseRecaptcha from "../../components/FirebaseRecaptcha";

import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth, firebaseConfig } from "../../lib/firebaseConfig";

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.com$/;

const EMAILJS_SERVICE_ID = "service_ah3k0xc";
const EMAILJS_TEMPLATE_ID = "template_xz7agxi";
const EMAILJS_PUBLIC_KEY = "pdso3GRtCqLn7fVTs";

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error) {
    console.log("Error getting push token:", error);
    return null;
  }
}

export default function LoginScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const recaptchaVerifier = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const [isLoading, setIsLoading] = useState(true);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [redirectOnClose, setRedirectOnClose] = useState(false);

  const [mfaVisible, setMfaVisible] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState(null);
  const [googleIdToken, setGoogleIdToken] = useState(null);

  const [reactivateModalVisible, setReactivateModalVisible] = useState(false);
  const [pendingReactivation, setPendingReactivation] = useState(null);

  const [adminArchivedModalVisible, setAdminArchivedModalVisible] = useState(false);
  const [adminArchivedReason, setAdminArchivedReason] = useState("");
  const [restorationAgreementModalVisible, setRestorationAgreementModalVisible] = useState(false);

  const [reverifyPhoneVisible, setReverifyPhoneVisible] = useState(false);
  const [reverifyEmailVisible, setReverifyEmailVisible] = useState(false);
  const [reverifySuccessVisible, setReverifySuccessVisible] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", "", "", ""]);
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState(null);
  const phoneInputRefs = useRef([]);
  const emailInputRefs = useRef([]);

  const [pendingLoginMethod, setPendingLoginMethod] = useState(null); // 'email' or 'google'
  const floatAnim = useRef(new Animated.Value(0)).current;

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

      const { data: profile, error: profileError } = await tempClient
        .from("users")
        .select("status, phone_number, role, archived_reason, restore_reason")
        .eq("id", tempData.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile && (profile.role === "admin" || profile.role === "super_admin")) {
        await tempClient.auth.signOut();
        setIsLoading(false);
        setErrorMessage("Admin accounts cannot login here.");
        setErrorModalVisible(true);
        return;
      }

      if (profile && profile.status === "archived") {
        if (profile.archived_reason === "Deactivated by user") {
          setPendingReactivation({
            type: "email",
            userId: tempData.user.id,
            phone: profile.phone_number,
          });
          setIsLoading(false);
          setReactivateModalVisible(true);
          return;
        } else {
          await tempClient.auth.signOut();
          setIsLoading(false);
          setAdminArchivedReason(profile.archived_reason || "No reason provided.");
          setAdminArchivedModalVisible(true);
          return;
        }
      }

      if (profile && profile.status === 'active') {
        const rReason = profile.restore_reason;
        if (rReason !== 'Restored by user' && rReason !== 'Restored by user-association agreement') {
           await tempClient.auth.signOut();
           setIsLoading(false);
           setPendingLoginMethod('email');
           setRestorationAgreementModalVisible(true);
           return;
        }
      }

      const { data: factors } = await tempClient.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find((f) => f.status === "verified");

      if (totpFactor) {
        setMfaFactorId(totpFactor.id);
        setIsLoading(false);
        setMfaVisible(true);
      } else {
        await performRealEmailLogin();
      }
    } catch (e) {
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
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken && data?.user?.id) {
        await supabase
          .from("users")
          .update({ expo_push_token: pushToken })
          .eq("id", data.user.id);
      }
      await logLoginSuccess(data.user.id, "Email");
      navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
    }
    setIsLoading(false);
  };

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

      const { data: profile, error: profileError } = await tempClient
        .from("users")
        .select("status, phone_number, role, archived_reason, restore_reason")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile && (profile.role === "admin" || profile.role === "super_admin")) {
        await tempClient.auth.signOut();
        setIsLoading(false);
        setErrorMessage("Admin accounts cannot login here.");
        setErrorModalVisible(true);
        return;
      }

      if (!profile) {
        setIsLoading(false);
        setErrorMessage("User profile not found.");
        setErrorModalVisible(true);
        return;
      }

      if (profile.status === "archived") {
        if (profile.archived_reason === "Deactivated by user") {
          setPendingReactivation({
            type: "google",
            idToken: idToken,
            userId: user.id,
            phone: profile?.phone_number || "",
          });
          setIsLoading(false);
          setReactivateModalVisible(true);
          return;
        } else {
          await tempClient.auth.signOut();
          setIsLoading(false);
          setAdminArchivedReason(profile.archived_reason || "No reason provided.");
          setAdminArchivedModalVisible(true);
          return;
        }
      }

      if (profile && profile.status === 'active') {
        const rReason = profile.restore_reason;
        if (rReason !== 'Restored by user' && rReason !== 'Restored by user-association agreement') {
           await tempClient.auth.signOut();
           setIsLoading(false);
           setPendingLoginMethod('google');
           setGoogleIdToken(idToken);
           setRestorationAgreementModalVisible(true);
           return;
        }
      }

      const { data: factors } = await tempClient.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find((f) => f.status === "verified");

      if (totpFactor) {
        setMfaFactorId(totpFactor.id);
        setGoogleIdToken(idToken);
        setIsLoading(false);
        setMfaVisible(true);
      } else {
        const { data: realData } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });

        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken && realData?.user?.id) {
          await supabase
            .from("users")
            .update({ expo_push_token: pushToken })
            .eq("id", realData.user.id);
        }

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

  const handleConfirmReactivation = async () => {
    if (!pendingReactivation) return;
    setIsLoading(true);
    setReactivateModalVisible(false);

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

      const { error: updateError } = await tempClient
        .from("users")
        .update({
          status: "active",
          archived_at: null,
          archived_reason: null,
          restore_reason: "Restored by user",
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      if (pendingReactivation.type === "google") {
        setReverifySuccessVisible(true);
      } else {
        if (pendingReactivation.phone) {
          startPhoneVerification(pendingReactivation.phone);
        } else {
          startEmailVerification();
        }
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessage("Failed to reactivate account: " + error.message);
      setErrorModalVisible(true);
    }
  };

  const handleAgreeRestoration = async () => {
    setIsLoading(true);
    setRestorationAgreementModalVisible(false);
    
    try {
        const tempClient = createClient(supabase.supabaseUrl, supabase.supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });

        let userId;

        if (pendingLoginMethod === 'email') {
            const { data, error } = await tempClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            userId = data.user.id;
        } else {
            const { data, error } = await tempClient.auth.signInWithIdToken({ provider: 'google', token: googleIdToken });
            if (error) throw error;
            userId = data.user.id;
        }

        const { error: updateError } = await tempClient
            .from('users')
            .update({ restore_reason: 'Restored by user-association agreement' })
            .eq('id', userId);
        
        if (updateError) throw updateError;

        if (pendingLoginMethod === 'email') {
            handleLogin();
        } else {
            processGoogleAuth(googleIdToken);
        }
    } catch (error) {
        setIsLoading(false);
        setErrorMessage("Failed to update agreement: " + error.message);
        setErrorModalVisible(true);
    }
  };

  const startPhoneVerification = async (phone) => {
    try {
      if (!phone) throw new Error("Phone number required for verification.");
      const phoneProvider = new PhoneAuthProvider(auth);
      const vid = await phoneProvider.verifyPhoneNumber(
        phone,
        recaptchaVerifier.current,
      );
      setVerificationId(vid);
      setIsLoading(false);
      setReverifyPhoneVisible(true);
    } catch (err) {
      setIsLoading(false);
      console.log(err);
      if (!err.message.includes("cancelled")) {
        setErrorMessage("SMS Failed: " + err.message);
        setErrorModalVisible(true);
      }
    }
  };

  const verifyPhoneOtp = async () => {
    const code = phoneOtp.join("");
    if (code.length !== 6) return;
    setIsLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      setReverifyPhoneVisible(false);
      startEmailVerification();
    } catch (e) {
      setIsLoading(false);
      setErrorMessage("Invalid SMS Code");
      setErrorModalVisible(true);
    }
  };

  const startEmailVerification = async () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedEmailOtp(newOtp);

    const data = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email || "User",
        to_name: "Reactivating User",
        d1: newOtp[0],
        d2: newOtp[1],
        d3: newOtp[2],
        d4: newOtp[3],
        d5: newOtp[4],
        d6: newOtp[5],
      },
    };

    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setIsLoading(false);
    setReverifyEmailVisible(true);
  };

  const verifyEmailOtp = async () => {
    if (emailOtp.join("") !== generatedEmailOtp) {
      setErrorMessage("Invalid Email Code");
      setErrorModalVisible(true);
      return;
    }
    setReverifyEmailVisible(false);
    setReverifySuccessVisible(true);
  };

  const finishReactivation = () => {
    setReverifySuccessVisible(false);

    if (pendingReactivation.type === "email") {
      performRealEmailLogin();
    } else {
      processGoogleAuth(pendingReactivation.idToken);
    }
  };

  const handleOtpChange = (text, index, setFn, state, refs) => {
    const newOtp = [...state];
    newOtp[index] = text;
    setFn(newOtp);
    if (text.length === 1 && index < 5) refs.current[index + 1]?.focus();
    if (text.length === 0 && index > 0) refs.current[index - 1]?.focus();
  };

  const verifyMfaAndLogin = async () => {
    if (mfaCode.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit code.");
      setErrorModalVisible(true);
      return;
    }

    setIsLoading(true);
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

      const {
        data: { session },
      } = await tempClient.auth.getSession();

      if (session) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken && session?.user?.id) {
          await supabase
            .from("users")
            .update({ expo_push_token: pushToken })
            .eq("id", session.user.id);
        }

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
    otpInput: {
      width: 40,
      height: 50,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: theme.buttonNeutral,
      textAlign: "center",
      fontSize: 20,
      color: theme.text,
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

      {}
      <FirebaseRecaptcha
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
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
            {}
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

            {}
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

            {}
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

            {}
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

      {}
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={adminArchivedModalVisible}
        onRequestClose={() => setAdminArchivedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Account Archived</Text>
            <Text style={styles.modalBody}>
              Your account was deactivated by the admins.{"\n\n"}
              <Text style={{ fontWeight: "bold" }}>Reason:</Text> {adminArchivedReason}{"\n\n"}
              Contact us by email to activate your account.
            </Text>
            <TouchableOpacity
              style={{ width: "100%", marginBottom: 10 }}
              onPress={() => Linking.openURL("mailto:support@gridwatch.com")}
            >
              <View style={[styles.modalButton, { backgroundColor: theme.buttonPrimary }]}>
                <Text style={styles.modalButtonText}>CONTACT SUPPORT</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={() => setAdminArchivedModalVisible(false)}
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
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>CLOSE</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={restorationAgreementModalVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Account Restored</Text>
            <Text style={styles.modalBody}>
              Your account was restored by an administrator.{"\n\n"}
              By continuing, you agree to adhere to the community guidelines and not repeat the actions that led to deactivation.
            </Text>
            <TouchableOpacity
              style={{ width: "100%", marginBottom: 10 }}
              onPress={handleAgreeRestoration}
            >
              <View style={[styles.modalButton, { backgroundColor: theme.buttonPrimary }]}>
                <Text style={styles.modalButtonText}>I AGREE</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={() => {
                setRestorationAgreementModalVisible(false);
                setIsLoading(false);
              }}
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
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>CANCEL</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {}
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

      {}
      <Modal transparent visible={reverifyPhoneVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Re-Verify Phone</Text>
            <Text style={styles.modalBody}>
              Enter the 6-digit code sent to {pendingReactivation?.phone}.
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 4,
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              {phoneOtp.map((d, i) => (
                <TextInput
                  key={i}
                  style={styles.otpInput}
                  value={d}
                  maxLength={1}
                  keyboardType="number-pad"
                  ref={(ref) => (phoneInputRefs.current[i] = ref)}
                  onChangeText={(t) =>
                    handleOtpChange(t, i, setPhoneOtp, phoneOtp, phoneInputRefs)
                  }
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={verifyPhoneOtp}
              style={[
                styles.modalButton,
                { backgroundColor: theme.buttonPrimary },
              ]}
            >
              <Text style={styles.modalButtonText}>VERIFY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {}
      <Modal transparent visible={reverifyEmailVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Re-Verify Email</Text>
            <Text style={styles.modalBody}>
              Enter the code sent to {email || "your email"}.
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 4,
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              {emailOtp.map((d, i) => (
                <TextInput
                  key={i}
                  style={styles.otpInput}
                  value={d}
                  maxLength={1}
                  keyboardType="number-pad"
                  ref={(ref) => (emailInputRefs.current[i] = ref)}
                  onChangeText={(t) =>
                    handleOtpChange(t, i, setEmailOtp, emailOtp, emailInputRefs)
                  }
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={verifyEmailOtp}
              style={[
                styles.modalButton,
                { backgroundColor: theme.buttonPrimary },
              ]}
            >
              <Text style={styles.modalButtonText}>VERIFY EMAIL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {}
      <Modal transparent visible={reverifySuccessVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Welcome Back!</Text>
            <Text style={styles.modalBody}>
              Your account has been fully reactivated.
            </Text>
            <TouchableOpacity
              onPress={finishReactivation}
              style={[
                styles.modalButton,
                { backgroundColor: theme.buttonPrimary },
              ]}
            >
              <Text style={styles.modalButtonText}>ENTER APP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {}
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
