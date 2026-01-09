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
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
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
  const { theme, isDarkMode } = useTheme();
  const [activeSlide, setActiveSlide] = useState(0);

  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
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
      style={[
        {
          flex: 1,
          paddingBottom: insets.bottom,
          backgroundColor: theme.background,
        },
      ]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      <View className="flex-1" style={{ backgroundColor: theme.background }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {}
          <View className="flex-1 justify-center items-center">
            <View className="w-full items-center p-10">
              {}
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
                className="w-[120px] h-[120px] items-center justify-center mb-10"
              >
                <Image
                  source={require("../../../assets/GridWatch-logo.png")}
                  className="w-[110px] h-[110px]"
                  resizeMode="contain"
                  style={{ borderRadius: 60, backgroundColor: "black" }}
                />
              </Animated.View>

              {}
              <View className="items-center mb-4 h-[45px] justify-center">
                <Text
                  className="text-[32px] font-black text-center tracking-[4px] uppercase"
                  style={{ color: theme.text }}
                >
                  GridWatch
                </Text>
              </View>

              {}
              <Animated.View
                style={{ opacity: fadeAnim }}
                className="h-[60px] items-center justify-center mb-6"
              >
                <Text
                  className="text-sm text-center leading-[22px] max-w-[280px]"
                  style={{ color: theme.textSecondary }}
                >
                  {SLIDES[activeSlide].text}
                </Text>
              </Animated.View>

              {}
              <View className="flex-row gap-2">
                {SLIDES.map((_, index) => (
                  <View
                    key={index}
                    className="h-2 rounded-full"
                    style={{
                      width: index === activeSlide ? 24 : 8,

                      backgroundColor:
                        index === activeSlide
                          ? theme.primary
                          : theme.buttonNeutral,
                    }}
                  />
                ))}
              </View>
            </View>
          </View>

          {}
          <View
            className="p-[30px] rounded-t-[30px] border-t"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            {}
            {}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("AuthSelection")}
              className="p-[18px] rounded-2xl items-center mb-5 w-full"
              style={{ backgroundColor: theme.buttonPrimary }}
            >
              <Text
                className="font-bold text-base tracking-widest"
                style={{ color: theme.buttonPrimaryText }}
              >
                GET STARTED
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text
                className="text-[13px]"
                style={{ color: theme.textSecondary }}
              >
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text
                  className="font-semibold underline"
                  style={{ color: theme.text }}
                >
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
