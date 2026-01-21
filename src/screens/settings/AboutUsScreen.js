import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TEAM_MEMBERS = [
  {
    name: "Kelvin Arnold E. Manalad",
    role: "Project Manager / Full Stack Dev",
    image: require("../../../assets/kelvin.png"),
  },
  {
    name: "Natasha Pearl Alonzo",
    role: "Hardware Specialist/ Documentation",
    image: require("../../../assets/natasha.png"),
  },
  {
    name: "Leo Carlo C. Atay",
    role: "Frontend Dev/ Hardware Specialist",
    image: null, // require('../../../assets/leo.png')
  },
  {
    name: "Cielo P. Cortado",
    role: "UI/UX Designer/Documentation",
    image: require("../../../assets/cielo.png"),
  },
  {
    name: "Francis Gian N. Felipe",
    role: "UI/UX Designer/Documentation",
    image: require("../../../assets/francis.png"),
  },
];

export default function AboutUsScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();

  // Helper for font scaling
  const scaledSize = (size) => size * fontScale;

  // Track which card is expanded (by index)
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred", err),
    );
  };

  const toggleExpand = (index) => {
    // Configure smooth animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    // Toggle: if clicking same index, close it. Else, open new index.
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-6 py-4 border-b"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(24)}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(18) }}
        >
          About Us
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6 pb-12">
          {/* App Info Card */}
          <View className="items-center mb-8">
            <View
              className="w-24 h-24 rounded-3xl overflow-hidden mb-4 shadow-sm"
              style={{
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <Image
                source={require("../../../assets/GridWatch-logo.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
            <Text
              className="font-bold mb-1"
              style={{ color: theme.text, fontSize: scaledSize(20) }}
            >
              GridWatch
            </Text>
            <Text
              className="font-medium"
              style={{ color: theme.textSecondary, fontSize: scaledSize(14) }}
            >
              Version 1.0.0 (Beta)
            </Text>
          </View>

          {/* Description */}
          <Text
            className="text-center leading-6 mb-8"
            style={{ color: theme.text, fontSize: scaledSize(14) }}
          >
            GridWatch is a smart energy monitoring solution designed to help
            homeowners track electricity usage in real-time, set budget limits,
            and prevent electrical faults through intelligent IoT integration.
          </Text>

          {/* Team Section */}
          <Text
            className="font-bold uppercase tracking-widest mb-4"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Meet the Team
          </Text>

          <View className="gap-3 mb-8">
            {TEAM_MEMBERS.map((member, index) => {
              const isExpanded = expandedIndex === index;

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleExpand(index)}
                  activeOpacity={0.9}
                  className="rounded-xl border overflow-hidden"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: isExpanded
                      ? theme.buttonPrimary
                      : theme.cardBorder,
                    padding: isExpanded ? 20 : 16,
                  }}
                >
                  {isExpanded ? (
                    // --- EXPANDED VIEW ---
                    <View className="items-center">
                      <View
                        className="w-32 h-32 rounded-full overflow-hidden mb-4 shadow-md"
                        style={{
                          backgroundColor: `${theme.buttonPrimary}15`,
                          borderWidth: 2,
                          borderColor: theme.cardBorder,
                        }}
                      >
                        {member.image ? (
                          <Image
                            source={member.image}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="flex-1 items-center justify-center">
                            <Text
                              className="font-bold"
                              style={{
                                color: theme.buttonPrimary,
                                fontSize: scaledSize(40),
                              }}
                            >
                              {member.name.charAt(0)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className="font-bold text-center mb-1"
                        style={{ color: theme.text, fontSize: scaledSize(18) }}
                      >
                        {member.name}
                      </Text>
                      <Text
                        className="text-center font-medium"
                        style={{
                          color: theme.buttonPrimary,
                          fontSize: scaledSize(14),
                        }}
                      >
                        {member.role}
                      </Text>
                    </View>
                  ) : (
                    // --- COMPACT VIEW (Original) ---
                    <View className="flex-row items-center">
                      <View
                        className="w-12 h-12 rounded-full overflow-hidden mr-4"
                        style={{
                          backgroundColor: `${theme.buttonPrimary}15`,
                          borderWidth: 1,
                          borderColor: theme.cardBorder,
                        }}
                      >
                        {member.image ? (
                          <Image
                            source={member.image}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="flex-1 items-center justify-center">
                            <Text
                              className="font-bold"
                              style={{
                                color: theme.buttonPrimary,
                                fontSize: scaledSize(16),
                              }}
                            >
                              {member.name.charAt(0)}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-1">
                        <Text
                          className="font-bold"
                          style={{
                            color: theme.text,
                            fontSize: scaledSize(14),
                          }}
                        >
                          {member.name}
                        </Text>
                        <Text
                          style={{
                            color: theme.textSecondary,
                            fontSize: scaledSize(12),
                          }}
                        >
                          {member.role}
                        </Text>
                      </View>
                      <MaterialIcons
                        name="keyboard-arrow-down"
                        size={scaledSize(20)}
                        color={theme.textSecondary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legal Links */}
          <Text
            className="font-bold uppercase tracking-widest mb-4"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Legal
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-between p-4 rounded-xl border mb-3"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            onPress={() => handleLinkPress("https://gridwatch.com/privacy")}
          >
            <Text
              className="font-medium"
              style={{ color: theme.text, fontSize: scaledSize(14) }}
            >
              Privacy Policy
            </Text>
            <MaterialIcons
              name="open-in-new"
              size={scaledSize(18)}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between p-4 rounded-xl border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            onPress={() => handleLinkPress("https://gridwatch.com/terms")}
          >
            <Text
              className="font-medium"
              style={{ color: theme.text, fontSize: scaledSize(14) }}
            >
              Terms of Service
            </Text>
            <MaterialIcons
              name="open-in-new"
              size={scaledSize(18)}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {/* Copyright */}
          <Text
            className="text-center mt-10 opacity-40"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            © 2025 GridWatch Inc.{"\n"}All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
