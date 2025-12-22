import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

export default function SignupScreen() {
  const navigation = useNavigation();

  // Form State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Modal & OTP State
  const [modalVisible, setModalVisible] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Logic
  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const isMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
    let interval;
    if (modalVisible && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [modalVisible, timer]);

  const handleSignUpPress = () => {
    setModalVisible(true);
    setTimer(120);
    setCanResend(false);
    setOtp(["", "", "", ""]);
  };

  const handleVerify = () => {
    setModalVisible(false);
    navigation.navigate("Login");
  };

  const handleResend = () => {
    setTimer(120);
    setCanResend(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setTimer(120);
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text.length === 1 && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    if (text.length === 0 && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0f0f0f]">
      <StatusBar barStyle="light-content" />

      <View className="p-6">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={18} color="#888" />
          <Text className="text-[#888] ml-[5px]">Back</Text>
        </TouchableOpacity>
      </View>

      {/* Increased paddingBottom to ensure the bottom text isn't cut off */}
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
            label="Full Name"
            icon="person"
            placeholder="Natasha Alonzo"
          />
          <InputGroup
            label="Unit / House Number"
            icon="home"
            placeholder="Unit 402"
          />
          <InputGroup
            label="Email Address"
            icon="email"
            placeholder="name@email.com"
          />

          <InputGroup
            label="Password"
            icon="lock"
            placeholder="Create a password"
            isPassword
            showPassword={showPassword}
            togglePassword={() => setShowPassword(!showPassword)}
            value={password}
            onChangeText={setPassword}
          />

          <InputGroup
            label="Confirm Password"
            icon="lock-outline"
            placeholder="Re-enter password"
            isPassword
            showPassword={showConfirm}
            togglePassword={() => setShowConfirm(!showConfirm)}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {password.length > 0 && (
            <View className="mb-2 bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
              <Text className="text-[11px] text-[#888] font-bold uppercase mb-3">
                Password Requirements
              </Text>
              <RequirementRow met={hasLength} text="At least 8 characters" />
              <RequirementRow
                met={hasNumber}
                text="Contains at least 1 number"
              />
              <RequirementRow met={isMatch} text="Passwords match" />
            </View>
          )}

          {/* Added 'mt-10' for more space between fields and button */}
          <TouchableOpacity onPress={handleSignUpPress} className="mt-5">
            <LinearGradient
              colors={["#0055ff", "#00ff99"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4 rounded-2xl items-center"
            >
              <Text className="font-bold text-[15px] text-[#0f0f0f]">
                SIGN UP
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-[25px] mb-[30px]">
            <Text className="text-[#888]">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text className="text-[#00ff99] font-bold">Log In</Text>
            </TouchableOpacity>
          </View>

          {/* This is the text you said vanished */}
          <Text className="text-center text-xs text-[#00ff99] italic opacity-80 mb-10">
            "Smart protection for the modern Filipino home."
          </Text>
        </View>
      </ScrollView>

      {/* VERIFICATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancel}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-8">
          <View className="w-full bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl items-center">
            <View className="w-12 h-12 rounded-full bg-[#00ff99]/10 items-center justify-center mb-4">
              <MaterialIcons name="mark-email-read" size={24} color="#00ff99" />
            </View>

            <Text className="text-xl font-bold text-white mb-2">
              Verify Email
            </Text>
            <Text className="text-sm text-[#888] text-center mb-6 leading-5">
              Enter the 4-digit code sent to your email.
            </Text>

            <View className="flex-row gap-3 mb-6">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  className="w-14 h-14 bg-[#222] border border-[#333] rounded-xl text-white text-center text-xl font-bold"
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  placeholder="0"
                  placeholderTextColor="#444"
                />
              ))}
            </View>

            <TouchableOpacity className="w-full mb-3" onPress={handleVerify}>
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

            <TouchableOpacity onPress={handleCancel}>
              <Text className="text-[#888] text-xs">Cancel</Text>
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
}) {
  return (
    <View className="mb-[15px]">
      <Text className="text-[10px] text-[#888] font-bold uppercase mb-2 ml-1">
        {label}
      </Text>
      <View className="flex-row items-center bg-[#222] rounded-xl px-4 py-2.5 border border-[#333]">
        <MaterialIcons
          name={icon}
          size={20}
          color="#666"
          style={{ marginRight: 12 }}
        />
        <TextInput
          className="flex-1 text-white text-base"
          placeholder={placeholder}
          placeholderTextColor="#666"
          secureTextEntry={isPassword && !showPassword}
          value={value}
          onChangeText={onChangeText}
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
