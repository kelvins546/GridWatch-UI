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
  Alert, // Added Alert just in case
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
// 1. Import Supabase
import { supabase } from "../../lib/supabase";

// --- COMMENTED OUT FOR EXPO GO TESTING ---
// 2. Import Google Sign In
// import {
//   GoogleSignin,
//   statusCodes,
// } from "@react-native-google-signin/google-signin";

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

  // UPDATED: Default to TRUE to check for session before showing form
  const [isLoading, setIsLoading] = useState(true);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [redirectOnClose, setRedirectOnClose] = useState(false);

  const floatAnim = useRef(new Animated.Value(0)).current;

  // --- NEW: CHECK FOR EXISTING SESSION ON MOUNT ---
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // User is already logged in, redirect immediately
          navigation.reset({
            index: 0,
            routes: [{ name: "MainApp" }],
          });
        } else {
          // No user found, stop loading and show login form
          setIsLoading(false);
        }
      } catch (error) {
        // Error checking session, show login form
        setIsLoading(false);
      }
    };

    checkUserSession();
  }, []);

  // --- CONFIGURE GOOGLE SIGN IN (COMMENTED OUT) ---
  // useEffect(() => {
  //   GoogleSignin.configure({
  //     scopes: ["email", "profile"],
  //     webClientId:
  //       "279998586082-buisq8vl4tnm3hrga2hb84raaghggnhf.apps.googleusercontent.com",
  //   });
  // }, []);

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

  const validateField = (field, value) => {
    let error = null;
    switch (field) {
      case "email":
        if (!value) error = "Email is required";
        else if (!ALLOWED_EMAIL_REGEX.test(value))
          error = "Use a valid provider (Gmail, Yahoo, etc)";
        break;
      case "password":
        if (!value) error = "Password is required";
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  // --- HELPER: LOG LOGIN EVENT ---
  const logLoginSuccess = async (userId, method) => {
    try {
      await supabase.from("app_notifications").insert({
        user_id: userId,
        title: "Login Successful",
        body: `${method} Login • ${Platform.OS.toUpperCase()} • ${new Date().toLocaleTimeString()}`,
      });
    } catch (err) {
      console.log("Failed to log login event:", err);
    }
  };

  // --- GOOGLE SIGN IN LOGIC (COMMENTED OUT) ---
  const handleGoogleSignIn = async () => {
    // TEMPORARY ALERT FOR EXPO GO TESTING
    Alert.alert(
      "Notice",
      "Google Sign-In is disabled in Expo Go. Please use Email/Password.",
    );

    /* setIsLoading(true);
    setRedirectOnClose(false);

    try {
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken || userInfo.data?.idToken;

      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });

        if (error) throw error;

        const user = data.user;
        const createdAt = new Date(user.created_at).getTime();
        const lastSignIn = new Date(user.last_sign_in_at).getTime();
        // Check if created < 5 seconds ago
        const isNewUser = lastSignIn - createdAt < 5000;

        if (isNewUser) {
          // --- BUG FIX: Reject New Users ---
          const { error: deleteError } =
            await supabase.rpc("delete_own_account");

          await supabase.auth.signOut();

          setIsLoading(false);
          setErrorMessage(
            "No account found with this email. Please sign up first.",
          );
          setRedirectOnClose(true);
          setErrorModalVisible(true);
        } else {
          // --- EXISTING USER: SUCCESS ---
          await logLoginSuccess(user.id, "Google");

          setIsLoading(false);
          navigation.reset({
            index: 0,
            routes: [{ name: "MainApp" }],
          });
        }
      } else {
        throw new Error("No ID token present!");
      }
    } catch (error) {
      setIsLoading(false);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      } else {
        setErrorMessage(error.message);
        setErrorModalVisible(true);
      }
    }
    */
  };

  // --- EMAIL LOGIN LOGIC ---
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setIsLoading(false);
      setErrorMessage(error.message);
      setErrorModalVisible(true);
    } else {
      // --- SUCCESSFUL LOGIN ---
      if (data.user) {
        await logLoginSuccess(data.user.id, "Email");
      }

      setIsLoading(false);

      navigation.reset({
        index: 0,
        routes: [{ name: "MainApp" }],
      });
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

      {/* Loading Overlay (Visible on Mount while checking session) */}
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
            {/* Conditional text so it doesn't say "Logging in" on startup */}
            {email ? "Logging in..." : "Loading..."}
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
            {/* ------------------------------------- */}

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
