import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const commonIssues = [
    { id: 1, title: "How to reset the GridWatch Hub?" },
    { id: 2, title: 'My device shows "Offline"' },
    { id: 3, title: "Change Wi-Fi configuration" },
    { id: 4, title: "Understanding Critical Faults" },
  ];

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <StatusBar barStyle={theme.statusBarStyle} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: theme.text }}>
          Help & Support
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView>
        {/* WRAPPER VIEW: This guarantees the padding works */}
        <View className="px-6 py-6">
          {/* Search Bar */}
          <View
            className="flex-row items-center rounded-2xl px-4 py-3 mb-8"
            style={{ backgroundColor: theme.card }}
          >
            <MaterialIcons
              name="search"
              size={24}
              color={theme.textSecondary}
            />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: theme.text }}
              placeholder="Search for issues..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Contact Us Section */}
          <Text
            className="text-xs font-bold uppercase mb-4 tracking-widest"
            style={{ color: theme.textSecondary }}
          >
            Contact Us
          </Text>

          <View className="flex-row gap-4 mb-8">
            {/* Live Chat Button */}
            <TouchableOpacity
              className="flex-1 p-6 rounded-3xl items-center justify-center gap-3"
              style={{ backgroundColor: theme.card }}
            >
              <MaterialIcons
                name="chat-bubble-outline"
                size={28}
                color="#00ff99"
              />
              <Text className="font-bold text-sm" style={{ color: theme.text }}>
                Live Chat
              </Text>
            </TouchableOpacity>

            {/* Email Us Button */}
            <TouchableOpacity
              className="flex-1 p-6 rounded-3xl items-center justify-center gap-3"
              style={{ backgroundColor: theme.card }}
            >
              <MaterialIcons name="mail-outline" size={28} color="#00ff99" />
              <Text className="font-bold text-sm" style={{ color: theme.text }}>
                Email Us
              </Text>
            </TouchableOpacity>
          </View>

          {/* Common Issues Section */}
          <Text
            className="text-xs font-bold uppercase mb-4 tracking-widest"
            style={{ color: theme.textSecondary }}
          >
            Common Issues
          </Text>

          <View
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: theme.card }}
          >
            {commonIssues.map((issue, index) => (
              <TouchableOpacity
                key={issue.id}
                className={`flex-row items-center justify-between p-5 ${
                  index !== commonIssues.length - 1 ? "border-b" : ""
                }`}
                style={{ borderColor: theme.cardBorder }}
              >
                <Text
                  className="font-semibold text-sm"
                  style={{ color: theme.text }}
                >
                  {issue.title}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer Version */}
          <Text
            className="text-center text-xs mt-10 opacity-50 mb-10"
            style={{ color: theme.textSecondary }}
          >
            App Version 2.1.0 • Build 8821{"\n"}© 2025 GridWatch Inc.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
