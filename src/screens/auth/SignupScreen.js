import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

// --- CHANGED: USE LOCAL COMPONENT INSTEAD OF BROKEN LIBRARY ---
import FirebaseRecaptcha from "../../components/FirebaseRecaptcha";

// --- FIREBASE IMPORTS ---
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth, firebaseConfig } from "../../lib/firebaseConfig";

const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.com$/;
const ZIP_REGEX = /^[0-9]{4}$/;
const PHONE_REGEX = /^[9]\d{9}$/; // Starts with 9

// EmailJS Config
const EMAILJS_SERVICE_ID = "service_ah3k0xc";
const EMAILJS_TEMPLATE_ID = "template_xz7agxi";
const EMAILJS_PUBLIC_KEY = "pdso3GRtCqLn7fVTs";

const checkPasswordStrength = (str) => {
  const hasLength = str.length >= 8;
  const hasNumber = /\d/.test(str);
  const hasUpper = /[A-Z]/.test(str);
  const hasLower = /[a-z]/.test(str);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(str);
  const isValid = hasLength && hasNumber && hasUpper && hasLower && hasSpecial;
  return { hasLength, hasNumber, hasUpper, hasLower, hasSpecial, isValid };
};

export default function SignupScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const recaptchaVerifier = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validation
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  // --- PHONE OTP STATE ---
  const [phoneOtpModalVisible, setPhoneOtpModalVisible] = useState(false);
  const [phoneSuccessModalVisible, setPhoneSuccessModalVisible] =
    useState(false);
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", "", "", ""]);
  const [verificationId, setVerificationId] = useState(null);
  const [phoneTimer, setPhoneTimer] = useState(60);
  const [canResendPhone, setCanResendPhone] = useState(false);
  const phoneInputRefs = useRef([]);

  // --- EMAIL OTP STATE ---
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  const [isLoading, setIsLoading] = useState(false);

  // General Alert Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: "success",
    title: "",
    message: "",
    onPress: null,
    secondaryText: null,
    onSecondaryPress: null,
  });

  // --- CLEAN GHOST SESSIONS ---
  useEffect(() => {
    const cleanGhostSession = async () => {
      await supabase.auth.signOut();
    };
    cleanGhostSession();
  }, []);

  const passAnalysis = checkPasswordStrength(password);
  const isMatch = password === confirmPassword && password.length > 0;

  // --- TIMERS ---
  useEffect(() => {
    let interval;
    if (otpModalVisible && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpModalVisible, timer]);

  useEffect(() => {
    let interval;
    if (phoneOtpModalVisible && phoneTimer > 0) {
      interval = setInterval(() => setPhoneTimer((prev) => prev - 1), 1000);
    } else if (phoneTimer === 0) {
      setCanResendPhone(true);
    }
    return () => clearInterval(interval);
  }, [phoneOtpModalVisible, phoneTimer]);

  const showModal = (
    type,
    title,
    message,
    onPress = null,
    secondaryText = null,
    onSecondaryPress = null,
  ) => {
    setModalConfig({
      type,
      title,
      message,
      onPress,
      secondaryText,
      onSecondaryPress,
    });
    setModalVisible(true);
  };

  // --- PHONE FORMATTER ---
  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, "");
    const truncated = cleaned.slice(0, 10);
    let formatted = truncated;
    if (truncated.length > 3)
      formatted = `${truncated.slice(0, 3)} ${truncated.slice(3)}`;
    if (truncated.length > 6)
      formatted = `${formatted.slice(0, 7)} ${truncated.slice(6)}`;
    return formatted;
  };

  const validateField = (field, value) => {
    let error = null;
    switch (field) {
      case "firstName":
        if (!value) error = "Required";
        break;
      case "phoneNumber":
        const rawPhone = value.replace(/\s/g, "");
        if (!rawPhone) error = "Required";
        else if (!PHONE_REGEX.test(rawPhone))
          error = "Invalid (Must start with 9)";
        break;
      case "region":
      case "city":
      case "fullAddress":
        if (!value) error = "Required";
        break;
      case "zipCode":
        if (!value) error = "Required";
        else if (!ZIP_REGEX.test(value)) error = "4 digits req.";
        break;
      case "email":
        if (!value) error = "Required";
        else if (!ALLOWED_EMAIL_REGEX.test(value)) error = "Invalid provider";
        break;
      case "password":
        const strength = checkPasswordStrength(value);
        if (!value) error = "Required";
        else if (!strength.isValid) error = "Weak password";
        break;
      case "confirmPassword":
        if (!value) error = "Required";
        else if (value !== password) error = "Mismatch";
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
    return error === null;
  };

  const handleChange = (field, value) => {
    if (field === "zipCode" && !/^[0-9]*$/.test(value)) return;
    if (field === "phoneNumber") {
      const formatted = formatPhoneNumber(value);
      setPhoneNumber(formatted);
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field, formatted.replace(/\s/g, ""));
      return;
    }
    // Standard fields
    switch (field) {
      case "firstName":
        setFirstName(value);
        break;
      case "lastName":
        setLastName(value);
        break;
      case "region":
        setRegion(value);
        break;
      case "city":
        setCity(value);
        break;
      case "zipCode":
        setZipCode(value);
        break;
      case "fullAddress":
        setFullAddress(value);
        break;
      case "email":
        setEmail(value);
        setErrors((prev) => ({ ...prev, email: null }));
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
    }
    setTouched((prev) => ({ ...prev, [field]: true }));
    // Passwords match check
    if (field === "password" && touched.confirmPassword) {
      setErrors((p) => ({
        ...p,
        confirmPassword: confirmPassword !== value ? "Mismatch" : null,
      }));
    }
    if (field === "confirmPassword") {
      setErrors((p) => ({
        ...p,
        confirmPassword: value !== password ? "Mismatch" : null,
      }));
    } else {
      validateField(field, value);
    }
  };

  const handleNextToLocation = () => {
    if (validateField("firstName", firstName)) setCurrentStep(1);
    else
      showModal(
        "error",
        "Missing Information",
        "Please enter your first name.",
      );
    setTouched((prev) => ({ ...prev, firstName: true }));
  };

  const handleNextToCredentials = () => {
    const fields = ["region", "city", "zipCode", "fullAddress"];
    const values = { region, city, zipCode, fullAddress };
    let isAllValid = true;
    fields.forEach((key) => {
      if (!validateField(key, values[key])) isAllValid = false;
      setTouched((prev) => ({ ...prev, [key]: true }));
    });
    if (isAllValid) setCurrentStep(2);
    else
      showModal(
        "error",
        "Location Incomplete",
        "Please fill in all address details.",
      );
  };

  const handleBackStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
    else navigation.goBack();
  };

  const checkUserExists = async (checkEmail) => {
    try {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("email", checkEmail)
        .maybeSingle();
      return !!data;
    } catch (e) {
      return false;
    }
  };

  // --- REAL-TIME EMAIL CHECK ---
  const handleEmailBlur = async () => {
    if (!email) return;
    if (!ALLOWED_EMAIL_REGEX.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Invalid provider" }));
      return;
    }
    setEmailChecking(true);
    const exists = await checkUserExists(email.trim().toLowerCase());
    setEmailChecking(false);
    if (exists) {
      setErrors((prev) => ({ ...prev, email: "Email already registered" }));
    } else {
      setErrors((prev) => ({ ...prev, email: null }));
    }
  };

  const handleSignUpPress = async () => {
    if (isLoading || emailChecking) return;
    // Validate Step 3
    const fields = ["email", "password", "confirmPassword", "phoneNumber"];
    const values = {
      email,
      password,
      confirmPassword,
      phoneNumber: phoneNumber.replace(/\s/g, ""),
    };
    let isAllValid = true;
    fields.forEach((key) => {
      if (!validateField(key, values[key])) isAllValid = false;
      setTouched((prev) => ({ ...prev, [key]: true }));
    });

    if (!isAllValid || !passAnalysis.isValid) {
      showModal(
        "error",
        "Credential Errors",
        "Please fix the highlighted errors.",
      );
      return;
    }
    if (errors.email) {
      showModal("error", "Invalid Email", errors.email);
      return;
    }
    if (!termsAccepted) {
      showModal(
        "error",
        "Terms Required",
        "Please accept the Terms & Conditions.",
      );
      return;
    }

    setIsLoading(true);
    const formattedEmail = email.trim().toLowerCase();
    const userAlreadyExists = await checkUserExists(formattedEmail);

    if (userAlreadyExists) {
      setIsLoading(false);
      setErrors((prev) => ({ ...prev, email: "Email already registered" }));
      showModal(
        "error",
        "Account Exists",
        "An account with this email already exists.",
      );
      return;
    }

    startPhoneVerification();
  };

  // --- 1. FIREBASE REAL SMS SEND (USING LOCAL COMPONENT) ---
  // --- 1. FIREBASE REAL SMS SEND (USING LOCAL COMPONENT) ---
  const startPhoneVerification = async () => {
    try {
      const rawPhone = phoneNumber.replace(/\s/g, "");
      const fullPhoneNumber = `+63${rawPhone}`;

      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        fullPhoneNumber,
        recaptchaVerifier.current,
      );

      setVerificationId(verificationId);
      setIsLoading(false);
      setPhoneOtpModalVisible(true);
      setPhoneTimer(60);
      setCanResendPhone(false);
      setPhoneOtp(["", "", "", "", "", ""]);
    } catch (err) {
      // ALWAYS TURN OFF LOADING
      setIsLoading(false);

      // LOGIC: If user cancelled, just return. Don't show alert.
      if (err.message && err.message.includes("cancelled")) {
        console.log("User cancelled recaptcha");
        return;
      }

      console.log("SMS Error:", err);
      Alert.alert("SMS Failed", `${err.message}`);
    }
  };

  // --- 2. VERIFY SMS CODE & SHOW SUCCESS MODAL ---
  const handleVerifyPhoneOtp = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const code = phoneOtp.join("");

    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);

      // SUCCESS
      setIsLoading(false);
      setPhoneOtpModalVisible(false);

      // --- PHONE SUCCESS MODAL ---
      setTimeout(() => {
        setPhoneSuccessModalVisible(true);
      }, 500);
    } catch (err) {
      setIsLoading(false);
      showModal("error", "Invalid Code", "The SMS code is incorrect.");
    }
  };

  // --- HANDLER: CONTINUE TO EMAIL FROM PHONE SUCCESS ---
  const handlePhoneSuccessContinue = () => {
    setPhoneSuccessModalVisible(false);
    setTimeout(() => {
      startEmailVerification();
    }, 500);
  };

  const handleResendPhone = () => {
    setIsLoading(true);
    startPhoneVerification();
  };

  // --- 3. EMAIL VERIFICATION ---
  const startEmailVerification = async () => {
    setIsLoading(true);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const emailSent = await sendEmailOtp(newOtp);

    setIsLoading(false);
    if (emailSent) {
      setGeneratedOtp(newOtp);
      setOtpModalVisible(true);
      setTimer(180);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
    } else {
      showModal("error", "Email Failed", "Could not send verification code.");
    }
  };

  const sendEmailOtp = async (otpCode) => {
    const data = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        to_name: firstName,
        d1: otpCode[0],
        d2: otpCode[1],
        d3: otpCode[2],
        d4: otpCode[3],
        d5: otpCode[4],
        d6: otpCode[5],
      },
    };
    try {
      const response = await fetch(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (isLoading) return;
    if (otp.join("") !== generatedOtp) {
      showModal("error", "Invalid Code", "The email code is incorrect.");
      return;
    }
    await createSupabaseAccount();
  };

  // --- 4. CREATE ACCOUNT ---
  const createSupabaseAccount = async () => {
    setIsLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      setIsLoading(false);
      showModal("error", "Signup Failed", authError.message);
      return;
    }

    const userId = authData.user?.id;
    if (userId) {
      const fullPhoneNumber = `+63${phoneNumber.replace(/\s/g, "")}`;
      const { error: dbError } = await supabase.from("users").upsert([
        {
          id: userId,
          email: email,
          first_name: firstName,
          last_name: lastName || "",
          phone_number: fullPhoneNumber,
          region: region,
          city: city,
          zip_code: zipCode,
          street_address: fullAddress,
          role: "resident",
          status: "active",
        },
      ]);

      setIsLoading(false);
      if (dbError) {
        showModal(
          "error",
          "Profile Error",
          "Account created but profile failed to save.",
        );
      } else {
        setOtpModalVisible(false);

        // --- FINAL SUCCESS MODAL (UPDATED TEXT) ---
        setTimeout(() => {
          showModal(
            "success",
            "Success",
            "Account has been verified and created.", // <--- EXACT TEXT REQUESTED
            handleFinalSignup,
          );
        }, 400);
      }
    } else {
      setIsLoading(false);
      showModal(
        "error",
        "Verification Pending",
        "Check your email to confirm.",
      );
    }
  };

  const handleResendEmail = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setCanResend(false);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const sent = await sendEmailOtp(newOtp);
    setIsLoading(false);
    if (sent) {
      setGeneratedOtp(newOtp);
      setTimer(180);
      showModal(
        "success",
        "Code Resent",
        "A new code has been sent to your email.",
      );
    } else {
      showModal("error", "Resend Failed", "Could not resend OTP.");
      setCanResend(true);
    }
  };

  const handleOtpChange = (text, index, setFn, state, refs) => {
    const newOtp = [...state];
    newOtp[index] = text;
    setFn(newOtp);
    if (text.length === 1 && index < 5) refs.current[index + 1]?.focus();
    if (text.length === 0 && index > 0) refs.current[index - 1]?.focus();
  };

  const handleFinalSignup = () => {
    setModalVisible(false);
    navigation.navigate("SetupHub", { fromSignup: true });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getStepTitle = () => {
    if (currentStep === 0) return "Step 1: Profile";
    if (currentStep === 1) return "Step 2: Location";
    return "Step 3: Credentials";
  };

  const acceptTermsFromModal = () => setTermsAccepted(!termsAccepted);
  const closeTermsModal = () => setTermsVisible(false);

  // --- STYLES ---
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
    otpModalContainer: {
      borderWidth: 1,
      padding: 24,
      borderRadius: 20,
      width: "85%",
      maxWidth: 300,
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
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    otpInput: {
      width: 42,
      height: 50,
      borderRadius: 10,
      textAlign: "center",
      fontSize: scaledSize(20),
      fontWeight: "bold",
      borderWidth: 1,
      backgroundColor: theme.buttonNeutral,
      borderColor: theme.cardBorder,
      color: theme.text,
      marginHorizontal: 1,
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

      {/* --- CHANGED: USING THE LOCAL COMPONENT HERE --- */}
      <FirebaseRecaptcha
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />

      {isLoading && (
        <View className="absolute z-50 w-full h-full bg-black/70 justify-center items-center">
          <ActivityIndicator size="large" color="#B0B0B0" />
          <Text
            className="mt-3 font-medium"
            style={{ color: "#B0B0B0", fontSize: 12 }}
          >
            Processing...
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 32,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-8">
            <View className="mb-6">
              <Text
                className="text-[28px] font-extrabold mb-1"
                style={{ color: theme.text }}
              >
                Create Account
              </Text>
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                {getStepTitle()}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 16,
                  width: "100%",
                  height: 4,
                  gap: 8,
                }}
              >
                {[0, 1, 2].map((step) => (
                  <View
                    key={step}
                    style={{
                      flex: 1,
                      borderRadius: 2,
                      backgroundColor:
                        currentStep >= step
                          ? theme.buttonPrimary
                          : theme.buttonNeutral,
                    }}
                  />
                ))}
              </View>
            </View>

            {/* STEP 1: PROFILE */}
            {currentStep === 0 && (
              <View>
                <InputGroup
                  label="First Name"
                  icon="person"
                  placeholder="Kelvin"
                  value={firstName}
                  onChangeText={(t) => handleChange("firstName", t)}
                  error={touched.firstName && errors.firstName}
                  theme={theme}
                  scaledSize={scaledSize}
                />
                <InputGroup
                  label="Last Name (Optional)"
                  icon="person-outline"
                  placeholder="Manalad"
                  value={lastName}
                  onChangeText={(t) => handleChange("lastName", t)}
                  theme={theme}
                  scaledSize={scaledSize}
                />
                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={handleBackStep}
                    activeOpacity={0.8}
                    className="flex-1"
                  >
                    <View
                      className="p-3 rounded-xl items-center border"
                      style={{
                        backgroundColor: theme.background,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <Text
                        className="font-bold text-[15px]"
                        style={{ color: theme.textSecondary }}
                      >
                        BACK
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleNextToLocation}
                    activeOpacity={0.8}
                    className="flex-1"
                  >
                    <View
                      className="p-3 rounded-xl items-center"
                      style={{ backgroundColor: theme.buttonPrimary }}
                    >
                      <Text
                        className="font-bold text-[15px]"
                        style={{ color: theme.buttonPrimaryText }}
                      >
                        NEXT
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 2: LOCATION */}
            {currentStep === 1 && (
              <View>
                <InputGroup
                  label="State / Province / Region"
                  icon="map"
                  placeholder="Metro Manila"
                  value={region}
                  onChangeText={(t) => handleChange("region", t)}
                  error={touched.region && errors.region}
                  theme={theme}
                  scaledSize={scaledSize}
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <InputGroup
                      label="City / Municipality"
                      icon="location-city"
                      placeholder="Caloocan City"
                      value={city}
                      onChangeText={(t) => handleChange("city", t)}
                      error={touched.city && errors.city}
                      theme={theme}
                      scaledSize={scaledSize}
                    />
                  </View>
                  <View className="flex-[0.6]">
                    <InputGroup
                      label="Zip Code"
                      icon="markunread-mailbox"
                      placeholder="1400"
                      value={zipCode}
                      onChangeText={(t) => handleChange("zipCode", t)}
                      error={touched.zipCode && errors.zipCode}
                      maxLength={4}
                      keyboardType="number-pad"
                      theme={theme}
                      scaledSize={scaledSize}
                    />
                  </View>
                </View>
                <InputGroup
                  label="Full Address"
                  icon="home"
                  placeholder="#173 Rainbow Village, Brgy 173"
                  value={fullAddress}
                  onChangeText={(t) => handleChange("fullAddress", t)}
                  error={touched.fullAddress && errors.fullAddress}
                  theme={theme}
                  scaledSize={scaledSize}
                />
                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={handleBackStep}
                    activeOpacity={0.8}
                    className="flex-1"
                  >
                    <View
                      className="p-3 rounded-xl items-center border"
                      style={{
                        backgroundColor: theme.background,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <Text
                        className="font-bold text-[15px]"
                        style={{ color: theme.textSecondary }}
                      >
                        BACK
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleNextToCredentials}
                    activeOpacity={0.8}
                    className="flex-1"
                  >
                    <View
                      className="p-3 rounded-xl items-center"
                      style={{ backgroundColor: theme.buttonPrimary }}
                    >
                      <Text
                        className="font-bold text-[15px]"
                        style={{ color: theme.buttonPrimaryText }}
                      >
                        NEXT
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 3: CREDENTIALS */}
            {currentStep === 2 && (
              <View>
                {/* --- UPDATED EMAIL INPUT WITH ONBLUR --- */}
                <InputGroup
                  label="Email Address"
                  icon="email"
                  placeholder="name@email.com"
                  value={email}
                  onChangeText={(t) => handleChange("email", t)}
                  onBlur={handleEmailBlur} // <--- TRIGGERS CHECK HERE
                  error={touched.email && errors.email}
                  theme={theme}
                  scaledSize={scaledSize}
                />

                <InputGroup
                  label="Mobile Number"
                  icon="phone"
                  placeholder="902 123 456"
                  value={phoneNumber}
                  onChangeText={(t) => handleChange("phoneNumber", t)}
                  error={touched.phoneNumber && errors.phoneNumber}
                  keyboardType="phone-pad"
                  maxLength={12}
                  prefix="+(63)"
                  theme={theme}
                  scaledSize={scaledSize}
                />
                <InputGroup
                  label="Password"
                  icon="lock"
                  placeholder="Create password"
                  isPassword
                  showPassword={showPassword}
                  togglePassword={() => setShowPassword(!showPassword)}
                  value={password}
                  onChangeText={(t) => handleChange("password", t)}
                  error={touched.password && errors.password}
                  theme={theme}
                  scaledSize={scaledSize}
                />
                <InputGroup
                  label="Confirm Password"
                  icon="lock-outline"
                  placeholder="Confirm password"
                  isPassword
                  showPassword={showConfirm}
                  togglePassword={() => setShowConfirm(!showConfirm)}
                  value={confirmPassword}
                  onChangeText={(t) => handleChange("confirmPassword", t)}
                  error={touched.confirmPassword && errors.confirmPassword}
                  theme={theme}
                  scaledSize={scaledSize}
                />

                {password.length > 0 && (
                  <View
                    className="mb-5 p-4 rounded-xl border"
                    style={{
                      backgroundColor: theme.buttonNeutral,
                      borderColor:
                        !passAnalysis.isValid ||
                        (confirmPassword.length > 0 && !isMatch)
                          ? theme.buttonDangerText
                          : theme.cardBorder,
                    }}
                  >
                    <Text
                      className="text-[10px] font-bold uppercase mb-2"
                      style={{ color: theme.textSecondary }}
                    >
                      Password Strength
                    </Text>
                    <RequirementRow
                      met={passAnalysis.hasLength}
                      text="8+ characters"
                      theme={theme}
                    />
                    <RequirementRow
                      met={passAnalysis.hasNumber}
                      text="At least 1 number"
                      theme={theme}
                    />
                    <RequirementRow
                      met={passAnalysis.hasUpper}
                      text="Uppercase letter"
                      theme={theme}
                    />
                    <RequirementRow
                      met={passAnalysis.hasLower}
                      text="Lowercase letter"
                      theme={theme}
                    />
                    <RequirementRow
                      met={passAnalysis.hasSpecial}
                      text="Special char (!@#$)"
                      theme={theme}
                    />
                    <View
                      className="h-[1px] my-2"
                      style={{ backgroundColor: theme.cardBorder }}
                    />
                    <RequirementRow
                      met={isMatch}
                      text="Passwords match"
                      theme={theme}
                    />
                  </View>
                )}

                <View className="mb-6 mt-2">
                  <View className="flex-row flex-wrap items-center justify-center">
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      By continuing, you agree to our{" "}
                    </Text>
                    <TouchableOpacity onPress={() => setTermsVisible(true)}>
                      <Text
                        style={{
                          color: theme.buttonPrimary,
                          fontSize: 13,
                          fontWeight: "bold",
                          textDecorationLine: "underline",
                        }}
                      >
                        Terms & Conditions
                      </Text>
                    </TouchableOpacity>
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      .
                    </Text>
                  </View>
                  <View className="flex-row justify-center items-center mt-2">
                    <MaterialIcons
                      name={
                        termsAccepted
                          ? "check-circle"
                          : "radio-button-unchecked"
                      }
                      size={16}
                      color={
                        termsAccepted
                          ? theme.buttonPrimary
                          : theme.textSecondary
                      }
                    />
                    <Text
                      style={{
                        color: termsAccepted
                          ? theme.buttonPrimary
                          : theme.textSecondary,
                        fontSize: 11,
                        marginLeft: 6,
                      }}
                    >
                      {termsAccepted ? "Terms Accepted" : "Pending Acceptance"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={handleBackStep}
                    activeOpacity={0.8}
                    className="flex-1"
                  >
                    <View
                      className="p-3 rounded-xl items-center border"
                      style={{
                        backgroundColor: theme.background,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <Text
                        className="font-bold text-[15px]"
                        style={{ color: theme.textSecondary }}
                      >
                        BACK
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSignUpPress}
                    disabled={
                      !termsAccepted ||
                      isLoading ||
                      emailChecking ||
                      !!errors.email
                    }
                    style={{
                      opacity:
                        termsAccepted &&
                        !isLoading &&
                        !emailChecking &&
                        !errors.email
                          ? 1
                          : 0.5,
                      flex: 1,
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      className="p-3 rounded-xl items-center"
                      style={{
                        backgroundColor: termsAccepted
                          ? theme.buttonPrimary
                          : theme.buttonNeutral,
                      }}
                    >
                      {emailChecking ? (
                        <ActivityIndicator
                          size="small"
                          color={theme.buttonPrimaryText}
                        />
                      ) : (
                        <Text
                          className="font-bold text-[15px]"
                          style={{
                            color: termsAccepted
                              ? theme.buttonPrimaryText
                              : theme.textSecondary,
                          }}
                        >
                          COMPLETE
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <Text
              className="text-center text-xs italic opacity-80 mt-12"
              style={{ color: theme.primary }}
            >
              "Smart protection for the modern Filipino home."
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- PHONE OTP MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={phoneOtpModalVisible}
        onRequestClose={() => {
          if (!isLoading) setPhoneOtpModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.otpModalContainer}>
            <Text style={styles.modalTitle}>Verify Mobile Number</Text>
            <Text style={styles.modalBody}>
              Enter the 6-digit code sent to +63 {phoneNumber}.
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 1,
                marginBottom: 20,
                justifyContent: "center",
              }}
            >
              {phoneOtp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (phoneInputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) =>
                    handleOtpChange(
                      text,
                      index,
                      setPhoneOtp,
                      phoneOtp,
                      phoneInputRefs,
                    )
                  }
                  placeholder="-"
                  placeholderTextColor={theme.textSecondary}
                  editable={!isLoading}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={handleVerifyPhoneOtp}
              style={{ width: "100%", marginBottom: 12 }}
              disabled={isLoading}
            >
              <View
                style={{
                  height: 40,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: isLoading
                    ? theme.buttonNeutral
                    : theme.buttonPrimary,
                }}
              >
                <Text
                  style={{
                    color: theme.buttonPrimaryText,
                    fontWeight: "bold",
                    fontSize: scaledSize(12),
                  }}
                >
                  VERIFY PHONE
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!canResendPhone || isLoading}
              onPress={handleResendPhone}
            >
              <Text
                style={{
                  fontSize: scaledSize(12),
                  fontWeight: "bold",
                  color:
                    canResendPhone && !isLoading
                      ? theme.buttonPrimary
                      : theme.textSecondary,
                }}
              >
                {canResendPhone
                  ? "Resend Code"
                  : `Resend in ${formatTime(phoneTimer)}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- PHONE SUCCESS MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={phoneSuccessModalVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Phone Verified</Text>
            <Text style={styles.modalBody}>
              Your phone number has been successfully verified. Now let's verify
              your email address.
            </Text>
            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={handlePhoneSuccessContinue}
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
                    fontSize: scaledSize(12),
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

      {/* --- EMAIL OTP MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={otpModalVisible}
        onRequestClose={() => {
          if (!isLoading) setOtpModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.otpModalContainer}>
            <Text style={styles.modalTitle}>Verify Email</Text>
            <Text style={styles.modalBody}>We sent a code to {email}.</Text>
            <View
              style={{
                flexDirection: "row",
                gap: 1,
                marginBottom: 20,
                justifyContent: "center",
              }}
            >
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) =>
                    handleOtpChange(text, index, setOtp, otp, inputRefs)
                  }
                  placeholder="-"
                  placeholderTextColor={theme.textSecondary}
                  editable={!isLoading}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={handleVerifyEmailOtp}
              style={{ width: "100%", marginBottom: 12 }}
              disabled={isLoading}
            >
              <View
                style={{
                  height: 40,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: isLoading
                    ? theme.buttonNeutral
                    : theme.buttonPrimary,
                }}
              >
                <Text
                  style={{
                    color: theme.buttonPrimaryText,
                    fontWeight: "bold",
                    fontSize: scaledSize(12),
                  }}
                >
                  VERIFY EMAIL
                </Text>
              </View>
            </TouchableOpacity>
            <View style={{ width: "100%", alignItems: "center", gap: 12 }}>
              <TouchableOpacity
                disabled={!canResend || isLoading}
                onPress={handleResendEmail}
              >
                <Text
                  style={{
                    fontSize: scaledSize(12),
                    fontWeight: "bold",
                    color:
                      canResend && !isLoading
                        ? theme.buttonPrimary
                        : theme.textSecondary,
                  }}
                >
                  {canResend ? "Resend Code" : `Resend in ${formatTime(timer)}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setOtpModalVisible(false)}
                disabled={isLoading}
              >
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                    textDecorationLine: "underline",
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TERMS MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={termsVisible}
        onRequestClose={closeTermsModal}
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
              <TouchableOpacity onPress={closeTermsModal}>
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
              className="p-5 border-t"
              style={{
                borderColor: theme.cardBorder,
                backgroundColor: theme.background,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={acceptTermsFromModal}
                className="flex-row items-center mb-4"
              >
                <MaterialIcons
                  name={termsAccepted ? "check-box" : "check-box-outline-blank"}
                  size={24}
                  color={
                    termsAccepted ? theme.buttonPrimary : theme.textSecondary
                  }
                  style={{ marginRight: 10 }}
                />
                <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>
                  I have read and agree to the Terms & Conditions and Privacy
                  Policy.
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeTermsModal}
                disabled={!termsAccepted}
                style={{ opacity: termsAccepted ? 1 : 0.5 }}
              >
                <View
                  className="p-3.5 rounded-xl items-center"
                  style={{ backgroundColor: theme.buttonPrimary }}
                >
                  <Text
                    className="font-bold text-sm"
                    style={{ color: theme.buttonPrimaryText }}
                  >
                    CONTINUE
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ALERT MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (modalConfig.type === "error") setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalBody}>{modalConfig.message}</Text>
            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              {modalConfig.secondaryText && (
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (modalConfig.onSecondaryPress)
                      modalConfig.onSecondaryPress();
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
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontWeight: "bold",
                        fontSize: scaledSize(12),
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        textAlign: "center",
                      }}
                    >
                      {modalConfig.secondaryText}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  setModalVisible(false);
                  if (modalConfig.onPress) modalConfig.onPress();
                }}
              >
                <View
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor:
                        modalConfig.type === "success"
                          ? theme.buttonPrimary
                          : theme.buttonDangerText,
                      borderWidth: 1,
                      borderColor:
                        modalConfig.type === "success"
                          ? theme.buttonPrimary
                          : theme.buttonDangerText,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: scaledSize(12),
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      textAlign: "center",
                    }}
                  >
                    {modalConfig.type === "success" ? "CONTINUE" : "TRY AGAIN"}
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

// --- UPDATED INPUT GROUP WITH ONBLUR SUPPORT ---
function InputGroup({
  label,
  icon,
  placeholder,
  isPassword,
  showPassword,
  togglePassword,
  value,
  onChangeText,
  onBlur,
  error,
  maxLength,
  keyboardType,
  theme,
  scaledSize,
  prefix,
}) {
  return (
    <View className="mb-3">
      <Text
        className="text-[10px] font-bold uppercase mb-1.5 ml-1"
        style={{ color: error ? theme.buttonDangerText : theme.textSecondary }}
      >
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-xl px-4 h-14 border"
        style={{
          backgroundColor: theme.buttonNeutral,
          borderColor: theme.cardBorder,
        }}
      >
        <MaterialIcons
          name={icon}
          size={20}
          color={error ? theme.buttonDangerText : theme.textSecondary}
          style={{ marginRight: 10 }}
        />
        {prefix && (
          <Text
            style={{
              color: theme.text,
              fontSize: scaledSize(14),
              marginRight: 4,
              textAlignVertical: "center",
              includeFontPadding: false,
              transform: [{ translateY: -0.5 }],
            }}
          >
            {prefix}
          </Text>
        )}
        <TextInput
          className="flex-1 h-full"
          style={{
            color: theme.text,
            fontSize: scaledSize(14),
            paddingVertical: 0,
            textAlignVertical: "center",
            includeFontPadding: false,
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur} // <--- KEY CHANGE: Pass onBlur to TextInput
          maxLength={maxLength}
          keyboardType={keyboardType}
        />
        {maxLength && !isPassword && (
          <Text
            className="text-[10px] font-bold ml-2"
            style={{ color: theme.textSecondary }}
          >
            {value.length}/{maxLength}
          </Text>
        )}
        {isPassword && (
          <TouchableOpacity onPress={togglePassword}>
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text
          className="text-[10px] italic mt-1 ml-1"
          style={{ color: theme.buttonDangerText }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

function RequirementRow({ met, text, theme }) {
  return (
    <View className="flex-row items-center mb-1">
      <MaterialIcons
        name={met ? "check-circle" : "radio-button-unchecked"}
        size={12}
        color={met ? theme.buttonPrimary : theme.textSecondary}
        style={{ marginRight: 6 }}
      />
      <Text
        className="text-[10px]"
        style={{ color: met ? theme.buttonPrimary : theme.textSecondary }}
      >
        {text}
      </Text>
    </View>
  );
}
