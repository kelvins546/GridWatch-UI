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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import MaskedView from "@react-native-masked-view/masked-view";

export default function LoginScreen() {
  const navigation = useNavigation();
  const [showPass, setShowPass] = useState(false);

  // Animation Value
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Bouncing Animation Effect
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

  return (
    <SafeAreaView className="flex-1 bg-[#0f0f0f]">
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View className="p-[30px]">
          {/* HEADER SECTION */}
          <View className="items-center mb-10">
            {/* BOUNCING LOGO WRAPPER */}
            <Animated.View
              style={{ transform: [{ translateY: floatAnim }] }}
              className="w-[120px] h-[120px] rounded-full items-center justify-center mb-6 bg-[#1a1a1a] shadow-lg shadow-[#00ff99]/30 elevation-10"
            >
              <Image
                source={require("../../../assets/GridWatch-logo.png")}
                className="w-[110px] h-[110px]"
                resizeMode="contain"
              />
            </Animated.View>

            {/* Gradient Text */}
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

          {/* INPUTS */}
          <InputGroup
            label="Email Address"
            icon="email"
            placeholder="natasha@example.com"
          />

          <View className="mb-5">
            <Text className="text-[11px] text-[#888] font-bold uppercase mb-2">
              Password
            </Text>
            <View className="flex-row items-center bg-[#222] rounded-xl px-4 py-2.5 border border-[#333]">
              <MaterialIcons
                name="lock"
                size={20}
                color="#666"
                style={{ marginRight: 12 }}
              />
              <TextInput
                className="flex-1 text-white text-sm"
                placeholder="••••••••"
                placeholderTextColor="#555"
                secureTextEntry={!showPass}
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

          <TouchableOpacity onPress={() => navigation.replace("MainApp")}>
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

function InputGroup({ label, icon, placeholder }) {
  return (
    <View className="mb-5">
      <Text className="text-[11px] text-[#888] font-bold uppercase mb-2">
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
          className="flex-1 text-white text-sm"
          placeholder={placeholder}
          placeholderTextColor="#555"
        />
      </View>
    </View>
  );
}
