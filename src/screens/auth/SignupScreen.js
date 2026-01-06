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
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import MaskedView from "@react-native-masked-view/masked-view";

const { height } = Dimensions.get("window");

const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.com$/;
const NAME_REGEX = /^[a-zA-Z\s]+$/;
const ZIP_REGEX = /^[0-9]{4}$/;

const MAX_NAME_LENGTH = 20;
const MAX_ADDRESS_LENGTH = 40;

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
  const floatAnim = useRef(new Animated.Value(0)).current;

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

  const [currentStep, setCurrentStep] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState("");
  const [subdivision, setSubdivision] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");

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
  const [timer, setTimer] = useState(120);
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
        else if (!NAME_REGEX.test(value)) error = "Letters only";
        break;
      case "houseNo":
      case "street":
      case "barangay":
      case "city":
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
    if (
      (field === "firstName" || field === "lastName") &&
      !/^[a-zA-Z\s]*$/.test(value)
    )
      return;
    if (field === "zipCode" && !/^[0-9]*$/.test(value)) return;

    switch (field) {
      case "firstName":
        setFirstName(value);
        break;
      case "lastName":
        setLastName(value);
        break;
      case "houseNo":
        setHouseNo(value);
        break;
      case "street":
        setStreet(value);
        break;
      case "subdivision":
        setSubdivision(value);
        break;
      case "barangay":
        setBarangay(value);
        break;
      case "city":
        setCity(value);
        break;
      case "zipCode":
        setZipCode(value);
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

  const handleStartEmailSignup = () => setCurrentStep(1);

  const handleNextToCredentials = () => {
    const fields = [
      "firstName",
      "lastName",
      "houseNo",
      "street",
      "barangay",
      "city",
      "zipCode",
    ];
    const values = {
      firstName,
      lastName,
      houseNo,
      street,
      barangay,
      city,
      zipCode,
    };

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
        "Address Incomplete",
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
        "You must accept the Terms & Conditions."
      );
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setGeneratedOtp("123456");
      setOtpModalVisible(true);
      setTimer(120);
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
      navigation.navigate("SetupHub");
    }, 1500);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showModal(
        "success",
        "Welcome!",
        "Successfully authenticated with Google.",
        () => navigation.navigate("SetupHub")
      );
    }, 1500);
  };

  const handleResend = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setTimer(120);
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
    setTermsAccepted(true);
    setTermsVisible(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0f0f0f]">
      <StatusBar barStyle="light-content" />

      {isLoading && (
        <View className="absolute z-50 w-full h-full bg-black/70 justify-center items-center">
          <ActivityIndicator size="large" color="#00ff99" />
          <Text className="text-white mt-4 font-bold">Processing...</Text>
        </View>
      )}

      {}
      <View className="px-6 py-4 absolute top-12 w-full z-10">
        {currentStep > 0 && (
          <TouchableOpacity
            className="flex-row items-center"
            onPress={handleBackStep}
          >
            <MaterialIcons name="arrow-back" size={20} color="#888" />
            <Text className="text-[#888] ml-2 font-medium">Back</Text>
          </TouchableOpacity>
        )}
      </View>

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
          {}
          <View className="mt-12">
            {}
            {currentStep === 0 && (
              <View className="items-center mb-10">
                <Animated.View
                  style={{ transform: [{ translateY: floatAnim }] }}
                  className="w-[110px] h-[110px] rounded-full items-center justify-center mb-6 bg-[#1a1a1a] shadow-lg shadow-[#00ff99]/30 elevation-10"
                >
                  <Image
                    source={require("../../../assets/GridWatch-logo.png")}
                    className="w-[100px] h-[100px]"
                    resizeMode="contain"
                  />
                </Animated.View>

                <View className="h-[40px] justify-center mb-1">
                  <MaskedView
                    style={{ width: 220, height: 40 }}
                    maskElement={
                      <View className="items-center justify-center flex-1">
                        <Text className="text-[28px] font-black text-center tracking-[4px] uppercase">
                          GridWatch
                        </Text>
                      </View>
                    }
                  >
                    <LinearGradient
                      colors={["#0055ff", "#00ff99"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1 }}
                    />
                  </MaskedView>
                </View>

                <Text className="text-[13px] text-[#888] tracking-[0.5px]">
                  Smart Energy Monitoring
                </Text>
              </View>
            )}

            {}
            {currentStep > 0 && (
              <View className="mb-6 mt-6">
                <Text className="text-[28px] font-extrabold text-white mb-1">
                  Create Account
                </Text>
                <Text className="text-sm text-[#888]">
                  {currentStep === 1
                    ? "Step 1: Profile & Address"
                    : "Step 2: Credentials"}
                </Text>

                <View className="h-1 bg-[#333] w-full mt-4 rounded-full overflow-hidden">
                  <View
                    className={`h-full bg-[#00ff99] ${
                      currentStep === 1 ? "w-1/2" : "w-full"
                    }`}
                  />
                </View>
              </View>
            )}

            {}
            {currentStep === 0 && (
              <View>
                <TouchableOpacity
                  onPress={handleStartEmailSignup}
                  activeOpacity={0.8}
                  className="mb-3"
                >
                  <LinearGradient
                    colors={["#0055ff", "#00ff99"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="p-4 rounded-2xl items-center"
                  >
                    <Text className="font-bold text-[15px] text-[#0f0f0f]">
                      Continue with Email
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View className="flex-row items-center my-3">
                  <View className="flex-1 h-[1px] bg-[#333]" />
                  <Text className="mx-3 text-[#666] text-xs font-bold uppercase">
                    Or
                  </Text>
                  <View className="flex-1 h-[1px] bg-[#333]" />
                </View>

                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  className="flex-row items-center justify-center bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl mb-6"
                  activeOpacity={0.8}
                >
                  <Image
                    source={{
                      uri: "https://cdn-icons-png.flaticon.com/512/300/300221.png",
                    }}
                    className="w-5 h-5 mr-3"
                    resizeMode="contain"
                  />
                  <Text className="font-bold text-[15px] text-white">
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center">
                  <Text className="text-[#888]">Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Login")}
                  >
                    <Text className="text-[#00ff99] font-bold">Log In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {}
            {currentStep === 1 && (
              <View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <InputGroup
                      label="First Name"
                      icon="person"
                      placeholder="Kelvin"
                      value={firstName}
                      onChangeText={(t) => handleChange("firstName", t)}
                      error={touched.firstName && errors.firstName}
                      maxLength={MAX_NAME_LENGTH}
                    />
                  </View>
                  <View className="flex-1">
                    <InputGroup
                      label="Last Name"
                      icon="person-outline"
                      placeholder="Manalad"
                      value={lastName}
                      onChangeText={(t) => handleChange("lastName", t)}
                      error={touched.lastName && errors.lastName}
                      maxLength={MAX_NAME_LENGTH}
                    />
                  </View>
                </View>

                <Text className="text-[#00ff99] text-xs font-bold uppercase tracking-widest mt-2 mb-4">
                  Address
                </Text>

                <View className="flex-row gap-3">
                  <View className="flex-[0.6]">
                    <InputGroup
                      label="House No."
                      icon="home"
                      placeholder="173"
                      value={houseNo}
                      onChangeText={(t) => handleChange("houseNo", t)}
                      error={touched.houseNo && errors.houseNo}
                      maxLength={10}
                    />
                  </View>
                  <View className="flex-1">
                    <InputGroup
                      label="Street"
                      icon="add-road"
                      placeholder="Congressional Rd"
                      value={street}
                      onChangeText={(t) => handleChange("street", t)}
                      error={touched.street && errors.street}
                      maxLength={MAX_ADDRESS_LENGTH}
                    />
                  </View>
                </View>

                <InputGroup
                  label="Subdivision / Village"
                  icon="holiday-village"
                  placeholder="Rainbow Village 5"
                  value={subdivision}
                  onChangeText={(t) => handleChange("subdivision", t)}
                  maxLength={MAX_ADDRESS_LENGTH}
                />

                <InputGroup
                  label="Barangay"
                  icon="location-city"
                  placeholder="Barangay 173"
                  value={barangay}
                  onChangeText={(t) => handleChange("barangay", t)}
                  error={touched.barangay && errors.barangay}
                  maxLength={MAX_ADDRESS_LENGTH}
                />

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <InputGroup
                      label="City"
                      icon="location-on"
                      placeholder="Caloocan"
                      value={city}
                      onChangeText={(t) => handleChange("city", t)}
                      error={touched.city && errors.city}
                      maxLength={MAX_ADDRESS_LENGTH}
                    />
                  </View>
                  <View className="flex-[0.6]">
                    <InputGroup
                      label="Zip"
                      icon="map"
                      placeholder="1421"
                      value={zipCode}
                      onChangeText={(t) => handleChange("zipCode", t)}
                      error={touched.zipCode && errors.zipCode}
                      maxLength={4}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleNextToCredentials}
                  className="mt-4"
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#0055ff", "#00ff99"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="p-4 rounded-2xl items-center"
                  >
                    <Text className="font-bold text-[15px] text-[#0f0f0f]">
                      NEXT STEP
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {}
            {currentStep === 2 && (
              <View>
                <InputGroup
                  label="Email Address"
                  icon="email"
                  placeholder="name@email.com"
                  value={email}
                  onChangeText={(t) => handleChange("email", t)}
                  error={touched.email && errors.email}
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
                />

                {password.length > 0 && (
                  <View
                    className={`mb-5 bg-[#1a1a1a] p-4 rounded-xl border ${
                      !passAnalysis.isValid ||
                      (confirmPassword.length > 0 && !isMatch)
                        ? "border-red-500"
                        : "border-[#333]"
                    }`}
                  >
                    <Text className="text-[10px] text-[#888] font-bold uppercase mb-2">
                      Password Strength
                    </Text>
                    <RequirementRow
                      met={passAnalysis.hasLength}
                      text="8+ characters"
                    />
                    <RequirementRow
                      met={passAnalysis.hasNumber}
                      text="At least 1 number"
                    />
                    <RequirementRow
                      met={passAnalysis.hasUpper}
                      text="Uppercase letter"
                    />
                    <RequirementRow
                      met={passAnalysis.hasLower}
                      text="Lowercase letter"
                    />
                    <RequirementRow
                      met={passAnalysis.hasSpecial}
                      text="Special char (!@#$)"
                    />
                    <View className="h-[1px] bg-[#333] my-2" />
                    <RequirementRow met={isMatch} text="Passwords match" />
                  </View>
                )}

                <View className="flex-row items-center mb-6">
                  <TouchableOpacity
                    onPress={() => setTermsAccepted(!termsAccepted)}
                  >
                    <MaterialIcons
                      name={
                        termsAccepted ? "check-box" : "check-box-outline-blank"
                      }
                      size={24}
                      color={termsAccepted ? "#00ff99" : "#666"}
                      style={{ marginRight: 10 }}
                    />
                  </TouchableOpacity>
                  <View className="flex-1 flex-row flex-wrap">
                    <Text className="text-[#888] text-xs">I agree to the </Text>
                    <TouchableOpacity onPress={() => setTermsVisible(true)}>
                      <Text className="text-[#00ff99] text-xs font-bold underline">
                        Terms & Conditions
                      </Text>
                    </TouchableOpacity>
                    <Text className="text-[#888] text-xs"> and </Text>
                    <TouchableOpacity onPress={() => setTermsVisible(true)}>
                      <Text className="text-[#00ff99] text-xs font-bold underline">
                        Privacy Policy
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSignUpPress}
                  disabled={!termsAccepted}
                  style={{ opacity: termsAccepted ? 1 : 0.5 }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      termsAccepted ? ["#0055ff", "#00ff99"] : ["#333", "#444"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="p-4 rounded-2xl items-center"
                  >
                    <Text
                      className={`font-bold text-[15px] ${
                        termsAccepted ? "text-[#0f0f0f]" : "text-[#888]"
                      }`}
                    >
                      COMPLETE SIGNUP
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {}
            <Text className="text-center text-xs text-[#00ff99] italic opacity-80 mt-12">
              "Smart protection for the modern Filipino home."
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {}
      <Modal
        animationType="slide"
        transparent={true}
        visible={termsVisible}
        onRequestClose={() => setTermsVisible(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center">
          <View className="w-[85%] h-[60%] bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
            <View className="p-5 border-b border-[#333] flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">
                Terms & Consent
              </Text>
              <TouchableOpacity onPress={() => setTermsVisible(false)}>
                <MaterialIcons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 p-5">
              <Text className="text-[#00ff99] font-bold mb-4 uppercase text-xs">
                GridWatch Data Privacy Agreement
              </Text>

              <Text className="text-white font-bold mb-2">
                1. Data Collection
              </Text>
              <Text className="text-[#888] text-sm mb-4 leading-5">
                By creating an account, you consent to GridWatch collecting and
                processing real-time energy usage data, appliance status, and
                cost estimates. This data is used solely to provide analytics
                and alerting services.
              </Text>

              <Text className="text-white font-bold mb-2">2. User Privacy</Text>
              <Text className="text-[#888] text-sm mb-4 leading-5">
                Your personal information (Name, Email, Address) is encrypted.
                We do not sell your data to third-party advertisers. Location
                data is only used to determine local energy rates.
              </Text>

              <Text className="text-white font-bold mb-2">
                3. Hardware Liability
              </Text>
              <Text className="text-[#888] text-sm mb-4 leading-5">
                GridWatch provides monitoring and control capabilities. However,
                users are responsible for ensuring their appliances are safe to
                operate remotely. GridWatch is not liable for damages caused by
                misuse of remote switching features.
              </Text>

              <Text className="text-white font-bold mb-2">
                4. Account Security
              </Text>
              <Text className="text-[#888] text-sm mb-4 leading-5">
                You are responsible for maintaining the confidentiality of your
                account credentials. GridWatch recommends enabling two-factor
                authentication where available.
              </Text>
            </ScrollView>
            <View className="p-5 border-t border-[#333] bg-[#111]">
              <TouchableOpacity onPress={acceptTermsFromModal}>
                <LinearGradient
                  colors={["#0055ff", "#00ff99"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="p-3.5 rounded-xl items-center"
                >
                  <Text className="font-bold text-sm text-[#0f0f0f]">
                    I AGREE & CLOSE
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <Modal
        animationType="fade"
        transparent={true}
        visible={otpModalVisible}
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { width: "85%", maxWidth: 300, paddingVertical: 20 },
            ]}
          >
            <View className="w-12 h-12 rounded-full bg-[#00ff99]/10 items-center justify-center mb-4">
              <MaterialIcons name="mark-email-read" size={24} color="#00ff99" />
            </View>
            <Text style={styles.modalTitleSmall}>Verify Email</Text>
            <Text style={styles.modalDescSmall}>
              Enter the code sent to your email.
            </Text>

            <View className="flex-row gap-2 mb-6">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  className="w-10 h-12 bg-[#222] border border-[#333] rounded-lg text-white text-center text-lg font-bold"
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  placeholder="-"
                  placeholderTextColor="#444"
                />
              ))}
            </View>
            <TouchableOpacity className="w-full mb-3" onPress={handleVerifyOtp}>
              <LinearGradient
                colors={["#0055ff", "#00ff99"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtnSmall}
              >
                <Text style={styles.btnTextBlack}>VERIFY</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View className="flex-row items-center mb-4">
              <Text className="text-[#666] text-xs">Didn't receive code? </Text>
              <TouchableOpacity disabled={!canResend} onPress={handleResend}>
                <Text
                  className={`text-xs font-bold ${
                    canResend ? "text-[#00ff99]" : "text-[#444]"
                  }`}
                >
                  {canResend ? "Resend" : `Resend in ${formatTime(timer)}`}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
              <Text className="text-[#888] text-xs">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (modalConfig.type === "error") setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <MaterialIcons
              name={
                modalConfig.type === "success"
                  ? "check-circle"
                  : "error-outline"
              }
              size={40}
              color={modalConfig.type === "success" ? "#00ff99" : "#ff4444"}
              style={{ marginBottom: 15 }}
            />
            <Text style={styles.modalTitleSmall}>{modalConfig.title}</Text>
            <Text style={styles.modalDescSmall}>{modalConfig.message}</Text>
            <TouchableOpacity
              style={{ width: "100%" }}
              onPress={() => {
                setModalVisible(false);
                if (modalConfig.onPress) modalConfig.onPress();
              }}
            >
              <LinearGradient
                colors={
                  modalConfig.type === "success"
                    ? ["#0055ff", "#00ff99"]
                    : ["#ff4444", "#ff8800"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtnSmall}
              >
                <Text style={styles.btnTextBlack}>
                  {modalConfig.type === "success" ? "CONTINUE" : "TRY AGAIN"}
                </Text>
              </LinearGradient>
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
}) {
  return (
    <View className="mb-3">
      <Text
        className={`text-[10px] font-bold uppercase mb-1.5 ml-1 ${
          error ? "text-red-500" : "text-[#888]"
        }`}
      >
        {label}
      </Text>
      <View
        className={`flex-row items-center bg-[#222] rounded-xl px-4 h-12 border ${
          error ? "border-red-500" : "border-[#333]"
        }`}
      >
        <MaterialIcons
          name={icon}
          size={18}
          color={error ? "#ef4444" : "#666"}
          style={{ marginRight: 10 }}
        />
        <TextInput
          className="flex-1 text-white text-sm h-full"
          placeholder={placeholder}
          placeholderTextColor="#555"
          secureTextEntry={isPassword && !showPassword}
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
          keyboardType={keyboardType}
        />

        {}
        {maxLength && !isPassword && (
          <Text className="text-[10px] text-[#444] ml-2 font-bold">
            {value.length}/{maxLength}
          </Text>
        )}

        {isPassword && (
          <TouchableOpacity onPress={togglePassword}>
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={18}
              color="#666"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-[10px] text-red-500 italic mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}

function RequirementRow({ met, text }) {
  return (
    <View className="flex-row items-center mb-1">
      <MaterialIcons
        name={met ? "check-circle" : "radio-button-unchecked"}
        size={12}
        color={met ? "#00ff99" : "#555"}
        style={{ marginRight: 6 }}
      />
      <Text className={`text-[10px] ${met ? "text-[#00ff99]" : "text-[#555]"}`}>
        {text}
      </Text>
    </View>
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
    backgroundColor: "#1a1a1a",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  modalTitleSmall: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescSmall: {
    fontSize: 13,
    color: "#999",
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
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
