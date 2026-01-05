import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import MaskedView from "@react-native-masked-view/masked-view";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const SLIDES = [
  {
    id: 1,
    text: "Smart energy monitoring and automated fault protection for your home.",
  },
  {
    id: 2,
    text: "Track your daily consumption in real-time and save on electricity bills.",
  },
  {
    id: 3,
    text: "Receive instant alerts and control your devices from anywhere.",
  },
];

export default function LandingScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [activeSlide, setActiveSlide] = useState(0);

  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const insets = useSafeAreaInsets();

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

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setActiveSlide((prev) => (prev + 1) % SLIDES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView
      style={[{ flex: 1, paddingBottom: insets.bottom }]}
      edges={["top", "left", "right"]}
    >
      <View className="flex-1 bg-[#0f0f0f]">
        <StatusBar barStyle="light-content" />

        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <LinearGradient
            colors={["#1a1a1a", "#1a1a1a"]}
            className="flex-1 justify-center items-center"
          >
            <View className="w-full items-center p-10">
              <Animated.View
                style={{ transform: [{ translateY: floatAnim }] }}
                className="w-[120px] h-[120px] rounded-full items-center justify-center mb-8 bg-[#1a1a1a] shadow-lg shadow-[#00ff99]/30 elevation-10"
              >
                <Image
                  source={require("../../../assets/GridWatch-logo.png")}
                  className="w-[120px] h-[120px]"
                  resizeMode="contain"
                />
              </Animated.View>

              <View className="items-center mb-4 h-[45px] justify-center">
                <MaskedView
                  style={{ width: 280, height: 45 }}
                  maskElement={
                    <View className="items-center justify-center flex-1">
                      <Text className="text-[32px] font-black text-center tracking-[4px] uppercase">
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

              <Animated.View
                style={{ opacity: fadeAnim }}
                className="h-[60px] items-center justify-center mb-6"
              >
                <Text className="text-sm text-[#888] text-center leading-[22px] max-w-[280px]">
                  {SLIDES[activeSlide].text}
                </Text>
              </Animated.View>

              <View className="flex-row gap-2">
                {SLIDES.map((_, index) => (
                  <View
                    key={index}
                    className={`h-2 rounded-full ${
                      index === activeSlide
                        ? "w-6 bg-[#00ff99]"
                        : "w-2 bg-[#444]"
                    }`}
                  />
                ))}
              </View>
            </View>
          </LinearGradient>

          <View className="bg-[#222] p-[30px] rounded-t-[30px] border-t border-[#333]">
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <LinearGradient
                colors={["#0055ff", "#00ff99"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="p-[18px] rounded-2xl items-center mb-5"
              >
                <Text className="font-bold text-base text-black tracking-widest">
                  GET STARTED
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="text-[#666] text-[13px]">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text className="text-white font-semibold underline">
                  Log In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
