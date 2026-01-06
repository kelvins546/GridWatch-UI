import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function MenuScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    fullName: "User",
    role: "Resident",
    initial: "US",
    avatarUrl: null,
  });

  const fetchMenuProfile = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setUserData({
        fullName: "Kelvin Manalad",
        role: "Resident",
        initial: "KM",
        avatarUrl: null,
      });
      setIsLoading(false);
    }, 500);
  };

  useFocusEffect(
    useCallback(() => {
      fetchMenuProfile();
    }, [])
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar
          barStyle={theme.statusBarStyle}
          backgroundColor={theme.background}
        />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

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

      <View className="px-6 pt-5 pb-2.5 items-end">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View
        className="flex-row items-center px-6 pb-8 border-b gap-4 mb-4"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <View style={{ width: 60, height: 60 }}>
          {userData.avatarUrl ? (
            <Image
              source={{ uri: userData.avatarUrl }}
              className="w-full h-full rounded-full"
            />
          ) : (
            <LinearGradient
              colors={
                isDarkMode ? ["#0055ff", "#00ff99"] : ["#0055ff", "#00995e"]
              }
              className="w-full h-full rounded-full justify-center items-center shadow-md"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text className="text-2xl font-bold text-[#1a1a1a]">
                {userData.initial}
              </Text>
            </LinearGradient>
          )}
        </View>

        <View className="justify-center">
          <Text className="text-lg font-bold" style={{ color: theme.text }}>
            {userData.fullName}
          </Text>
          <Text className="text-xs mt-1" style={{ color: theme.textSecondary }}>
            Role: {userData.role}
          </Text>
          <Text
            className="text-[11px] mt-1 font-[monospace]"
            style={{ color: isDarkMode ? "#00ff99" : "#00995e" }}
          >
            ID: GW-2025-CAL
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-10">
          <Text
            className="text-xs font-bold uppercase tracking-widest mb-3 mt-2"
            style={{ color: theme.textSecondary }}
          >
            Device Management
          </Text>

          <SettingsRow
            icon="router"
            title="My Hubs"
            subtitle="Manage devices"
            onPress={() => navigation.navigate("MyHubs")}
            theme={theme}
          />

          <SettingsRow
            icon="add-circle-outline"
            title="Add New Device"
            subtitle="Setup new hardware"
            onPress={() => navigation.navigate("SetupHub")}
            theme={theme}
            customIcon={
              <MaterialIcons
                name="add-circle-outline"
                size={22}
                color={isDarkMode ? "#00ff99" : "#00995e"}
              />
            }
          />

          <Text
            className="text-xs font-bold uppercase tracking-widest mb-3 mt-6"
            style={{ color: theme.textSecondary }}
          >
            App Settings
          </Text>

          <SettingsRow
            icon="settings"
            title="Account Settings"
            subtitle="Profile & Security"
            onPress={() => navigation.navigate("ProfileSettings")}
            theme={theme}
          />

          {}

          <SettingsRow
            icon="notifications-none"
            title="Notifications"
            subtitle="Alert preferences"
            onPress={() => navigation.navigate("Notifications")}
            theme={theme}
          />

          <View
            className="mt-8 border-t pt-6 items-center"
            style={{ borderTopColor: theme.cardBorder }}
          >
            <Text
              className="text-[11px]"
              style={{ color: theme.textSecondary }}
            >
              GridWatch v1.0.4
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, title, subtitle, onPress, theme, customIcon }) {
  return (
    <TouchableOpacity
      className="p-4 rounded-xl mb-3 flex-row justify-between items-center border h-[72px]"
      style={{
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        {customIcon ? (
          customIcon
        ) : (
          <MaterialIcons name={icon} size={22} color={theme.icon} />
        )}
        <View>
          <Text
            className="text-sm font-medium ml-3"
            style={{ color: theme.text }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className="text-xs mt-0.5 ml-3"
              style={{ color: theme.textSecondary }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={20}
        color={theme.textSecondary}
      />
    </TouchableOpacity>
  );
}
