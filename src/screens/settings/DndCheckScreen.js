import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Linking,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import * as IntentLauncher from "expo-intent-launcher";

export default function DndCheckScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [step, setStep] = useState("manual");

  const z1Anim = useRef(new Animated.Value(0)).current;
  const z2Anim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();

    const floatZ = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    floatZ(z1Anim, 0);
    floatZ(z2Anim, 800);
  }, []);

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === "android") {
        await IntentLauncher.startActivityAsync(
          "android.settings.ZEN_MODE_PRIORITY_SETTINGS"
        );
      } else {
        Linking.openSettings();
      }
    } catch (error) {
      console.log("Could not open settings", error);
      Linking.openSettings();
    }
  };

  const handleConfirm = () => {
    setStep("success");
    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  };

  const handleIgnore = () => {
    navigation.goBack();
  };

  const getZStyle = (anim, startX, startY) => {
    return {
      opacity: anim.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [0, 1, 1, 0],
      }),
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [startY, startY - 15],
          }),
        },
        {
          translateX: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [startX, startX + 10],
          }),
        },
        {
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
        },
      ],
    };
  };

  return (
    <View className="flex-1 bg-black/85 justify-center items-center px-8">
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.85)" />

      <Animated.View
        className="w-full max-w-[280px] bg-neutral-900 rounded-3xl p-6 items-center border border-neutral-800 shadow-2xl"
        style={{ transform: [{ translateY: slideAnim }] }}
      >
        {step === "manual" ? (
          <>
            <View className="relative w-14 h-14 rounded-full justify-center items-center mb-4 border border-purple-500/30 bg-purple-600/10">
              <MaterialIcons name="nights-stay" size={24} color="#a855f7" />
              <Animated.Text
                className="absolute text-purple-500 font-bold text-xs"
                style={getZStyle(z1Anim, 8, -8)}
              >
                Z
              </Animated.Text>
              <Animated.Text
                className="absolute text-purple-500 font-bold text-xs"
                style={getZStyle(z2Anim, 16, -18)}
              >
                Z
              </Animated.Text>
            </View>

            <Text className="text-base font-bold text-white mb-2 text-center">
              Check "Do Not Disturb"
            </Text>

            <Text className="text-xs text-neutral-400 text-center leading-5 mb-5 px-1">
              Please ensure your phone is not silencing alerts. You might miss{" "}
              <Text className="text-red-500 font-bold">
                Critical Safety Alerts
              </Text>
              .
            </Text>

            <View className="w-full gap-2">
              <TouchableOpacity
                className="w-full rounded-xl overflow-hidden border border-neutral-700"
                onPress={handleOpenSettings}
              >
                <View className="py-3 items-center justify-center bg-neutral-800">
                  <Text className="text-white font-semibold text-xs">
                    Open Settings
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-2 items-center"
                onPress={handleIgnore}
              >
                <Text className="text-neutral-500 text-[10px] font-semibold">
                  Skip for now
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View className="w-14 h-14 rounded-full justify-center items-center mb-4 bg-green-500/10 border border-green-400">
              <MaterialIcons
                name="notifications-active"
                size={24}
                color="#00ff99"
              />
            </View>
            <Text className="text-base font-bold text-white mb-2 text-center">
              Great!
            </Text>
            <Text className="text-xs text-neutral-400 text-center leading-5 mb-4">
              You will now receive safety alerts instantly.
            </Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}
