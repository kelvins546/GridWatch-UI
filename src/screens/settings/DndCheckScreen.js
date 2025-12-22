import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function DndCheckScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [step, setStep] = useState("detect");
  const z1Anim = useRef(new Animated.Value(0)).current;
  const z2Anim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

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

  const handleResolve = () => {
    setStep("resolve");
    setTimeout(() => {
      navigation.goBack();
    }, 2000);
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
            outputRange: [startY, startY - 20],
          }),
        },
        {
          translateX: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [startX, startX + 15],
          }),
        },
        {
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1.2],
          }),
        },
      ],
    };
  };

  return (
    <View className="flex-1 bg-black/85 justify-center items-center p-6">
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.85)" />

      <Animated.View
        className="w-full max-w-xs bg-neutral-900 rounded-3xl p-8 items-center border border-neutral-800 shadow-2xl"
        style={{ transform: [{ translateY: slideAnim }] }}
      >
        {step === "detect" ? (
          <>
            <View className="relative w-[70px] h-[70px] rounded-full justify-center items-center mb-5 border border-purple-500/30 bg-purple-600/10">
              <MaterialIcons name="nights-stay" size={32} color="#a855f7" />
              <Animated.Text
                className="absolute text-purple-500 font-bold text-sm"
                style={getZStyle(z1Anim, 10, -10)}
              >
                Z
              </Animated.Text>
              <Animated.Text
                className="absolute text-purple-500 font-bold text-sm"
                style={getZStyle(z2Anim, 20, -25)}
              >
                Z
              </Animated.Text>
            </View>

            <Text className="text-lg font-bold text-white mb-2.5 text-center">
              "Do Not Disturb" is On
            </Text>

            <Text className="text-sm text-neutral-400 text-center leading-5 mb-6">
              GridWatch detected that your notifications are silenced. You might
              miss{" "}
              <Text className="text-red-500 font-bold">
                Critical Safety Alerts
              </Text>{" "}
              (Short Circuits).
            </Text>

            <View className="w-full gap-3">
              <TouchableOpacity
                className="w-full rounded-2xl overflow-hidden"
                onPress={handleResolve}
              >
                <LinearGradient
                  colors={["#0055ff", "#00ff99"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-3.5 items-center justify-center"
                >
                  <Text className="text-black font-bold text-sm">
                    Turn Off DND
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-2.5 items-center"
                onPress={handleIgnore}
              >
                <Text className="text-neutral-500 text-xs font-semibold">
                  I accept the risk
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View className="w-[70px] h-[70px] rounded-full justify-center items-center mb-5 bg-green-500/10 border border-green-400">
              <MaterialIcons
                name="notifications-active"
                size={32}
                color="#00ff99"
              />
            </View>
            <Text className="text-lg font-bold text-white mb-2.5 text-center">
              Great!
            </Text>
            <Text className="text-sm text-neutral-400 text-center leading-5 mb-6">
              You will now receive safety alerts instantly.
            </Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}
