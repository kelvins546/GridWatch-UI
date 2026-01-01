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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import MaskedView from "@react-native-masked-view/masked-view";

import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  const handleLogin = async () => {
    setErrors({});

    let currentErrors = {};
    if (!email) currentErrors.email = "Email is required";
    if (!password) currentErrors.password = "Password is required";

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0f0f0f]">
      <StatusBar barStyle="light-content" />

      {isLoading && (
        <View className="absolute z-50 w-full h-full bg-black/70 justify-center items-center">
          <ActivityIndicator size="large" color="#00ff99" />
          <Text className="text-white mt-4 font-bold">Logging in...</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View className="p-[30px]">
          <View className="items-center mb-10">
            <Animated.View
              style={{ transform: [{ translateY: floatAnim }] }}
              className="w-[120px] h-[120px] rounded-full items-center justify-center mb-6 bg-[#1a1a1a] shadow-lg shadow-[#00ff99]/30 elevation-10"
            >
              <Image
                source={require("../../../assets/gridwatch-logo.png")}
                className="w-[110px] h-[110px]"
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

          <InputGroup
            label="Email Address"
            icon="email"
            placeholder="natasha@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            error={errors.email}
          />

          <View className="mb-5">
            <View className="flex-row justify-between">
              <Text
                className={`text-[11px] font-bold uppercase mb-2 ${
                  errors.password ? "text-red-500" : "text-[#888]"
                }`}
              >
                Password
              </Text>
              {errors.password && (
                <Text className="text-[10px] text-red-500 italic mr-1">
                  {errors.password}
                </Text>
              )}
            </View>

            <View
              className={`flex-row items-center bg-[#222] rounded-xl px-4 py-2.5 border ${
                errors.password ? "border-red-500" : "border-[#333]"
              }`}
            >
              <MaterialIcons
                name="lock"
                size={20}
                color={errors.password ? "#ef4444" : "#666"}
                style={{ marginRight: 12 }}
              />
              <TextInput
                className="flex-1 text-white text-sm"
                placeholder="••••••••"
                placeholderTextColor="#555"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <MaterialIcons
                  name={showPass ? "visibility" : "visibility-off"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text className="self-end text-[#0055ff] font-semibold text-xs mb-[25px]">
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin}>
            <LinearGradient
              colors={["#0055ff", "#00ff99"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4 rounded-2xl items-center shadow-sm shadow-[#00ff99]/20"
            >
              <Text className="font-bold text-[15px] text-black">LOG IN</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-[30px]">
            <Text className="text-[#888]">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text className="text-[#00ff99] font-bold">Sign Up</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-center text-xs text-[#00ff99] italic mt-10 opacity-80">
            "Don't wait for the bill. Control it."
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InputGroup({ label, icon, placeholder, value, onChangeText, error }) {
  return (
    <View className="mb-5">
      <View className="flex-row justify-between">
        <Text
          className={`text-[11px] font-bold uppercase mb-2 ${
            error ? "text-red-500" : "text-[#888]"
          }`}
        >
          {label}
        </Text>
        {error && (
          <Text className="text-[10px] text-red-500 italic mr-1">{error}</Text>
        )}
      </View>

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
          className="flex-1 text-white text-sm"
          placeholder={placeholder}
          placeholderTextColor="#555"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
    </View>
  );
}
