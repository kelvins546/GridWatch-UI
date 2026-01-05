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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";

const EMAILJS_SERVICE_ID = "service_ah3k0xc";
const EMAILJS_TEMPLATE_ID = "template_xz7agxi";
const EMAILJS_PUBLIC_KEY = "pdso3GRtCqLn7fVTs";

// Strict Email Regex: Only allows specific providers
const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.com$/;

// --- CHARACTER LIMITS ---
const MAX_NAME_LENGTH = 50;
const MAX_UNIT_LENGTH = 60;

export default function SignupScreen() {
  const navigation = useNavigation();

  const [fullName, setFullName] = useState("");
  const [unitLocation, setUnitLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validation State
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
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const inputRefs = useRef([]);

  // --- PASSWORD LOGIC ---
  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isPasswordValid =
    hasLength && hasNumber && hasUpper && hasLower && hasSpecial;
  const isMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
    let interval;
    if (otpModalVisible && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpModalVisible, timer]);

  // --- REAL-TIME VALIDATION HANDLER ---
  const validateField = (field, value) => {
    let error = null;

    switch (field) {
      case "fullName":
        if (!value) error = "Full Name is required";
        else if (!/^[a-zA-Z\s]*$/.test(value))
          error = "Name must contain only letters";
        break;
      case "unitLocation":
        if (!value) error = "Unit/House No. is required";
        break;
      case "email":
        if (!value) error = "Email is required";
        else if (!ALLOWED_EMAIL_REGEX.test(value))
          error = "Use a valid provider (Gmail, Yahoo, Outlook)";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (!isPasswordValid)
          error = "Password does not meet requirements";
        break;
      case "confirmPassword":
        if (!value) error = "Confirm Password is required";
        else if (value !== password) error = "Passwords do not match";
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    // 1. Update Value
    if (field === "fullName") setFullName(value);
    if (field === "unitLocation") setUnitLocation(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);

    // 2. Mark as touched so validation shows
    setTouched((prev) => ({ ...prev, [field]: true }));

    // 3. Trigger Real-time Validation
    validateField(field, value);

    if (field === "password" && touched.confirmPassword) {
      if (confirmPassword !== value) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: null }));
      }
    }
  };

  const handleSignUpPress = async () => {
    const formValues = {
      fullName,
      unitLocation,
      email,
      password,
      confirmPassword,
    };
    let isValid = true;

    Object.keys(formValues).forEach((key) => {
      validateField(key, formValues[key]);
      if (!formValues[key] || errors[key]) isValid = false;
    });

    if (!isPasswordValid || !isMatch || !ALLOWED_EMAIL_REGEX.test(email)) {
      Alert.alert(
        "Validation Error",
        "Please fix the red fields before continuing."
      );
      return;
    }

    if (!termsAccepted) {
      Alert.alert("Required", "Please accept the Terms & Conditions.");
      return;
    }

    setIsLoading(true);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    const emailData = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_name: fullName,
        to_email: email,
        d1: code[0],
        d2: code[1],
        d3: code[2],
        d4: code[3],
        d5: code[4],
        d6: code[5],
      },
    };

    try {
      const response = await fetch(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailData),
        }
      );

      if (response.ok) {
        setIsLoading(false);
        setOtpModalVisible(true);
        setTimer(120);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
      } else {
        throw new Error("Failed to send email.");
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error", "Could not send verification code.");
    }
  };

  const handleVerifyOtp = () => {
    const enteredCode = otp.join("");
    if (enteredCode !== generatedOtp) {
      Alert.alert("Error", "Invalid Code. Please try again.");
      return;
    }
    setOtpModalVisible(false);
    setTimeout(() => {
      setSuccessModalVisible(true);
    }, 500);
  };

  const handleFinalSignup = async () => {
    setSuccessModalVisible(false);
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        const { error: dbError } = await supabase.from("users").insert([
          {
            id: authData.user.id,
            email: email,
            full_name: fullName,
            unit_location: unitLocation,
            role: "resident",
            status: "active",
          },
        ]);

        if (dbError) throw dbError;
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Signup Failed", error.message);
    }
  };

  // ... (handleGoogleSignIn, handleResend, handleOtpChange, etc. remain the same)
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Google Sign-In Error", error.message);
    }
  };

  const handleResend = () => handleSignUpPress();

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

      <View className="p-6">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={18} color="#888" />
          <Text className="text-[#888] ml-[5px]">Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-[30px]">
          <View className="mb-[25px]">
            <Text className="text-[26px] font-extrabold text-white mb-1.5">
              Create Account
            </Text>
            <Text className="text-sm text-[#888]">
              Join GridWatch to monitor your energy.
            </Text>
          </View>

          <InputGroup
            label="Name"
            icon="person"
            placeholder="Kelvin Manalad"
            value={fullName}
            onChangeText={(text) => handleChange("fullName", text)}
            error={touched.fullName && errors.fullName}
            maxLength={MAX_NAME_LENGTH} // ADDED MAX LENGTH
          />
          <InputGroup
            label="Unit / Address"
            icon="home"
            placeholder="Unit 402"
            value={unitLocation}
            onChangeText={(text) => handleChange("unitLocation", text)}
            error={touched.unitLocation && errors.unitLocation}
            maxLength={MAX_UNIT_LENGTH} // ADDED MAX LENGTH
          />
          <InputGroup
            label="Email Address"
            icon="email"
            placeholder="name@email.com"
            value={email}
            onChangeText={(text) => handleChange("email", text)}
            error={touched.email && errors.email}
          />
          <InputGroup
            label="Password"
            icon="lock"
            placeholder="Create a password"
            isPassword
            showPassword={showPassword}
            togglePassword={() => setShowPassword(!showPassword)}
            value={password}
            onChangeText={(text) => handleChange("password", text)}
            error={touched.password && errors.password}
          />
          <InputGroup
            label="Confirm Password"
            icon="lock-outline"
            placeholder="Re-enter password"
            isPassword
            showPassword={showConfirm}
            togglePassword={() => setShowConfirm(!showConfirm)}
            value={confirmPassword}
            onChangeText={(text) => handleChange("confirmPassword", text)}
            error={touched.confirmPassword && errors.confirmPassword}
          />

          {/* DYNAMIC PASSWORD REQUIREMENTS */}
          {password.length > 0 && (
            <View
              className={`mb-5 bg-[#1a1a1a] p-4 rounded-xl border ${
                !isPasswordValid || (confirmPassword.length > 0 && !isMatch)
                  ? "border-red-500"
                  : "border-[#333]"
              }`}
            >
              <Text className="text-[11px] text-[#888] font-bold uppercase mb-3">
                Password Requirements
              </Text>
              <RequirementRow met={hasLength} text="At least 8 characters" />
              <RequirementRow met={hasNumber} text="At least 1 number" />
              <RequirementRow
                met={hasUpper}
                text="At least 1 uppercase letter"
              />
              <RequirementRow
                met={hasLower}
                text="At least 1 lowercase letter"
              />
              <RequirementRow
                met={hasSpecial}
                text="At least 1 special char (!@#$)"
              />
              <View className="h-[1px] bg-[#333] my-2" />
              <RequirementRow met={isMatch} text="Passwords match" />
            </View>
          )}

          {/* ... (Checkbox, Sign Up Button, Google Button, Login Link - Same as before) ... */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)}>
              <MaterialIcons
                name={termsAccepted ? "check-box" : "check-box-outline-blank"}
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
          >
            <LinearGradient
              colors={termsAccepted ? ["#0055ff", "#00ff99"] : ["#333", "#444"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4 rounded-2xl items-center"
            >
              <Text
                className={`font-bold text-[15px] ${
                  termsAccepted ? "text-[#0f0f0f]" : "text-[#888]"
                }`}
              >
                SIGN UP
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View className="flex-row items-center mt-6 mb-4">
            <View className="flex-1 h-[1px] bg-[#333]" />
            <Text className="mx-4 text-[#666] text-xs">Or continue with</Text>
            <View className="flex-1 h-[1px] bg-[#333]" />
          </View>

          <TouchableOpacity
            onPress={handleGoogleSignIn}
            className="flex-row items-center justify-center bg-[#222] border border-[#333] p-4 rounded-2xl mb-6"
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

          <View className="flex-row justify-center mb-[30px]">
            <Text className="text-[#888]">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text className="text-[#00ff99] font-bold">Log In</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-center text-xs text-[#00ff99] italic opacity-80 mb-10">
            "Smart protection for the modern Filipino home."
          </Text>
        </View>
      </ScrollView>

      {/* ... (Terms Modal, OTP Modal, Success Modal - SAME AS BEFORE) ... */}

      {/* Terms Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={termsVisible}
        onRequestClose={() => setTermsVisible(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center">
          <View className="w-[90%] h-[80%] bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
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
              <Text className="text-[#888] text-sm mb-4 leading-5">
                By creating an account, you consent to GridWatch collecting and
                processing real-time energy usage data.
              </Text>
              {/* ... more terms */}
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

      {/* OTP Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={otpModalVisible}
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80">
          <View className="w-[85%] max-w-[340px] bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl items-center">
            <View className="w-12 h-12 rounded-full bg-[#00ff99]/10 items-center justify-center mb-4">
              <MaterialIcons name="mark-email-read" size={24} color="#00ff99" />
            </View>
            <Text className="text-xl font-bold text-white mb-2">
              Verify Email
            </Text>
            <Text className="text-sm text-[#888] text-center mb-6 leading-5">
              Enter the 6-digit code sent to your email.
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
                className="p-3.5 rounded-xl items-center"
              >
                <Text className="font-bold text-sm text-[#0f0f0f]">VERIFY</Text>
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

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => {}}
      >
        <View className="flex-1 justify-center items-center bg-black/80">
          <View className="w-[80%] max-w-[320px] bg-[#1a1a1a] border border-[#333] p-10 rounded-2xl items-center">
            <View className="mb-4">
              <MaterialIcons name="check-circle" size={60} color="#00ff99" />
            </View>
            <Text className="text-lg font-bold text-white mb-2 text-center">
              Verification Success!
            </Text>
            <Text className="text-xs text-[#888] text-center mb-6 leading-5">
              Email verified. Click continue to create your account and setup
              your Hub.
            </Text>
            <TouchableOpacity className="w-full" onPress={handleFinalSignup}>
              <LinearGradient
                colors={["#0055ff", "#00ff99"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="p-3 rounded-xl items-center"
              >
                <Text className="font-bold text-xs text-black uppercase tracking-wider">
                  CONTINUE TO SETUP
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- UPDATED INPUT GROUP WITH CHARACTER LIMIT ---
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
  maxLength, // NEW PROP
}) {
  return (
    <View className="mb-[15px]">
      <View className="flex-row justify-between items-end mb-2 ml-1">
        <Text
          className={`text-[10px] font-bold uppercase ${
            error ? "text-red-500" : "text-[#888]"
          }`}
        >
          {label}
        </Text>
        {/* CHARACTER COUNTER */}
        {maxLength && (
          <Text className="text-[10px] text-[#555] font-semibold">
            {value.length} / {maxLength}
          </Text>
        )}
        {!maxLength && error && (
          <Text className="text-[10px] text-red-500 italic mr-1">{error}</Text>
        )}
      </View>

      {/* Show error inside if no maxLength, or below if space allows. 
          To keep it clean, I put error in border color and possibly text below if needed.
      */}

      <View
        className={`flex-row items-center bg-[#222] rounded-xl px-4 py-2.5 border ${
          error ? "border-red-500" : "border-[#333]"
        }`}
      >
        <MaterialIcons
          name={icon}
          size={20}
          color={error ? "#ef4444" : "#666"}
          style={{ marginRight: 12 }}
        />
        <TextInput
          className="flex-1 text-white text-base"
          placeholder={placeholder}
          placeholderTextColor="#666"
          secureTextEntry={isPassword && !showPassword}
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength} // ENFORCE LIMIT
        />
        {isPassword && (
          <TouchableOpacity onPress={togglePassword}>
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        )}
      </View>
      {/* Explicit error message below input for clarity */}
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
    <View className="flex-row items-center mb-1.5">
      <MaterialIcons
        name={met ? "check-circle" : "radio-button-unchecked"}
        size={14}
        color={met ? "#00ff99" : "#555"}
        style={{ marginRight: 8 }}
      />
      <Text className={`text-xs ${met ? "text-[#00ff99]" : "text-[#555]"}`}>
        {text}
      </Text>
    </View>
  );
}
