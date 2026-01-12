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
  Animated,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.com$/;
const ZIP_REGEX = /^[0-9]{4}$/;

const MAX_ADDRESS_LENGTH = 150;

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

  const [currentStep, setCurrentStep] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [otpModalVisible, setOtpModalVisible] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState(null);

  // 3 Minute Timer (180s)
  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: "success",
    title: "",
    message: "",
    onPress: null,
  });

  const inputRefs = useRef([]);
  const passAnalysis = checkPasswordStrength(password);
  const isMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
    let interval;
    if (otpModalVisible && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpModalVisible, timer]);

  const showModal = (type, title, message, onPress = null) => {
    setModalConfig({ type, title, message, onPress });
    setModalVisible(true);
  };

  const validateField = (field, value) => {
    let error = null;
    switch (field) {
      case "firstName":
      case "lastName":
        if (!value) error = "Required";
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
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
    }

    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === "password" && touched.confirmPassword) {
      if (confirmPassword !== value)
        setErrors((p) => ({ ...p, confirmPassword: "Mismatch" }));
      else setErrors((p) => ({ ...p, confirmPassword: null }));
    }
    if (field === "confirmPassword") {
      if (value !== password)
        setErrors((p) => ({ ...p, confirmPassword: "Mismatch" }));
      else setErrors((p) => ({ ...p, confirmPassword: null }));
    } else {
      validateField(field, value);
    }
  };

  const handleNextToLocation = () => {
    const fields = ["firstName", "lastName"];
    const values = { firstName, lastName };
    let isAllValid = true;

    fields.forEach((key) => {
      const isValid = validateField(key, values[key]);
      if (!isValid) isAllValid = false;
      setTouched((prev) => ({ ...prev, [key]: true }));
    });

    if (isAllValid) {
      setCurrentStep(1);
    } else {
      showModal("error", "Missing Information", "Please enter your name.");
    }
  };

  const handleNextToCredentials = () => {
    const fields = ["region", "city", "zipCode", "fullAddress"];
    const values = { region, city, zipCode, fullAddress };
    let isAllValid = true;

    fields.forEach((key) => {
      const isValid = validateField(key, values[key]);
      if (!isValid) isAllValid = false;
      setTouched((prev) => ({ ...prev, [key]: true }));
    });

    if (isAllValid) {
      setCurrentStep(2);
    } else {
      showModal(
        "error",
        "Location Incomplete",
        "Please fill in all address details."
      );
    }
  };

  const handleBackStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
    else navigation.goBack();
  };

  const handleSignUpPress = async () => {
    const fields = ["email", "password", "confirmPassword"];
    const values = { email, password, confirmPassword };

    let isAllValid = true;
    fields.forEach((key) => {
      const isValid = validateField(key, values[key]);
      if (!isValid) isAllValid = false;
      setTouched((prev) => ({ ...prev, [key]: true }));
    });

    if (!isAllValid || !passAnalysis.isValid) {
      showModal(
        "error",
        "Credential Errors",
        "Please fix the highlighted errors."
      );
      return;
    }

    if (!termsAccepted) {
      showModal(
        "error",
        "Terms Required",
        "Please open the Terms & Conditions and accept them to proceed."
      );
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setGeneratedOtp("123456");
      setOtpModalVisible(true);
      setTimer(180);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
    }, 1500);
  };

  const handleVerifyOtp = () => {
    if (otp.join("") !== generatedOtp) {
      showModal("error", "Invalid Code", "The code you entered is incorrect.");
      return;
    }
    setOtpModalVisible(false);
    setTimeout(() => {
      showModal(
        "success",
        "Success!",
        "Email verified. Account created successfully.",
        handleFinalSignup
      );
    }, 500);
  };

  const handleFinalSignup = () => {
    setModalVisible(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // --- FIX IS HERE: Passing the flag ---
      navigation.navigate("SetupHub", { fromSignup: true });
    }, 1500);
  };

  const handleResend = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setTimer(180);
      setCanResend(false);
    }, 1000);
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text.length === 1 && index < 5) inputRefs.current[index + 1]?.focus();
    if (text.length === 0 && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const acceptTermsFromModal = () => {
    setTermsAccepted(!termsAccepted);
  };

  const closeTermsModal = () => {
    setTermsVisible(false);
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

  const getProgressWidth = () => {
    if (currentStep === 0) return "33%";
    if (currentStep === 1) return "66%";
    return "100%";
  };

  // --- STYLES ---
  const styles = StyleSheet.create({
    // Standard Design System Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      borderWidth: 1,
      padding: 20, // p-5
      borderRadius: 16, // rounded-2xl
      width: 288, // w-72 (Design System)
      alignItems: "center",
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
    },
    // OTP Modal Exception (Wider for inputs)
    otpModalContainer: {
      borderWidth: 1,
      padding: 24,
      borderRadius: 20,
      width: "85%",
      maxWidth: 340,
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
      marginBottom: 24, // mb-6 (Design System)
      lineHeight: 20,
      color: theme.textSecondary,
      fontSize: scaledSize(12),
    },
    // Standard Button Style (h-10, rounded-xl)
    modalButton: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.textSecondary,
    },
    modalButtonPrimary: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.buttonPrimary,
    },
    modalButtonDanger: {
      width: "100%",
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.buttonDangerText,
    },
    // OTP Specific Inputs
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

      {isLoading && (
        <View className="absolute z-50 w-full h-full bg-black/70 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="mt-4 font-bold" style={{ color: theme.text }}>
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
            {/* Header */}
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
                className="h-1 w-full mt-4 rounded-full overflow-hidden"
                style={{ backgroundColor: theme.buttonNeutral }}
              >
                <View
                  className="h-full"
                  style={{
                    backgroundColor: theme.buttonPrimary,
                    width: getProgressWidth(),
                  }}
                />
              </View>
            </View>

            {/* STEP 1 */}
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
                  label="Last Name"
                  icon="person-outline"
                  placeholder="Manalad"
                  value={lastName}
                  onChangeText={(t) => handleChange("lastName", t)}
                  error={touched.lastName && errors.lastName}
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

            {/* STEP 2 */}
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
                  maxLength={MAX_ADDRESS_LENGTH}
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

            {/* STEP 3 */}
            {currentStep === 2 && (
              <View>
                <InputGroup
                  label="Email Address"
                  icon="email"
                  placeholder="name@email.com"
                  value={email}
                  onChangeText={(t) => handleChange("email", t)}
                  error={touched.email && errors.email}
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

                {/* Terms Agreement Link */}
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
                  {/* Status Indicator */}
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

                {/* Final Buttons */}
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
                    disabled={!termsAccepted}
                    style={{ opacity: termsAccepted ? 1 : 0.5, flex: 1 }}
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

      {/* Terms Modal (UNCHANGED) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={termsVisible}
        onRequestClose={closeTermsModal}
      >
        <View className="flex-1 bg-black/90 justify-center items-center">
          <View
            className="w-[85%] h-[70%] border rounded-2xl overflow-hidden"
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

            {/* Terms Footer */}
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

      {/* OTP Modal (Exception Style) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={otpModalVisible}
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.otpModalContainer}>
            <Text style={styles.modalTitle}>Verify Email</Text>
            {/* UPDATED: Informational Text */}
            <Text style={styles.modalBody}>
              We have sent a verification code to your email address. Please
              enter the 6-digit code below to complete your registration.
            </Text>

            {/* UPDATED: Reduced Gap */}
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
                  onChangeText={(text) => handleOtpChange(text, index)}
                  placeholder="-"
                  placeholderTextColor={theme.textSecondary}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleVerifyOtp}
              style={{ width: "100%", marginBottom: 12 }}
            >
              <View
                style={{
                  height: 40,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: theme.buttonPrimary,
                }}
              >
                <Text
                  style={{
                    color: theme.buttonPrimaryText,
                    fontWeight: "bold",
                    fontSize: scaledSize(12),
                  }}
                >
                  VERIFY
                </Text>
              </View>
            </TouchableOpacity>

            <View style={{ width: "100%", alignItems: "center", gap: 12 }}>
              <TouchableOpacity disabled={!canResend} onPress={handleResend}>
                <Text
                  style={{
                    fontSize: scaledSize(12),
                    fontWeight: "bold",
                    color: canResend
                      ? theme.buttonPrimary
                      : theme.textSecondary,
                  }}
                >
                  {canResend ? "Resend Code" : `Resend in ${formatTime(timer)}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                    textDecorationLine: "underline",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Standard Error/Success Modal */}
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

            <TouchableOpacity
              style={{ width: "100%" }}
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
                  }}
                >
                  {modalConfig.type === "success" ? "CONTINUE" : "TRY AGAIN"}
                </Text>
              </View>
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
  isPassword,
  showPassword,
  togglePassword,
  value,
  onChangeText,
  error,
  maxLength,
  keyboardType,
  theme,
  scaledSize,
}) {
  return (
    <View className="mb-3">
      <Text
        className="text-[10px] font-bold uppercase mb-1.5 ml-1"
        style={{
          color: error ? theme.buttonDangerText : theme.textSecondary,
        }}
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
        <TextInput
          className="flex-1 text-sm h-full"
          style={{ color: theme.text }}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          value={value}
          onChangeText={onChangeText}
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
        style={{
          color: met ? theme.buttonPrimary : theme.textSecondary,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
