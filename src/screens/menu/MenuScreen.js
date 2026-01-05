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
import { supabase } from "../../lib/supabase";

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
    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("users")
          .select("full_name, role, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          const name = data.full_name || "User";
          setUserData({
            fullName: name,
            role: data.role
              ? data.role.charAt(0).toUpperCase() + data.role.slice(1)
              : "Resident",
            initial: name.substring(0, 2).toUpperCase(),
            avatarUrl: data.avatar_url,
          });
        } else {
          const emailName = user.email ? user.email.split("@")[0] : "User";
          const formattedName =
            emailName.charAt(0).toUpperCase() + emailName.slice(1);
          setUserData({
            fullName: formattedName,
            role: "Resident",
            initial: formattedName.substring(0, 2).toUpperCase(),
            avatarUrl: null,
          });
        }
      }
    } catch (err) {
      console.error("Menu fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMenuProfile();
    }, [])
  );

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: theme.background }}
      >
        <StatusBar
          barStyle={theme.statusBarStyle}
          backgroundColor={theme.background}
        />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text
          style={{ color: theme.textSecondary, marginTop: 10, fontSize: 12 }}
        >
          Loading...
        </Text>
      </SafeAreaView>
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
        className="flex-row items-center px-6 pb-8 border-b gap-4"
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

      <ScrollView className="flex-1">
        <View className="px-6 py-2.5">
          <Text
            className="text-[11px] uppercase font-bold tracking-widest mt-6 mb-2.5"
            style={{ color: theme.textSecondary }}
          >
            Device Management
          </Text>

          <MenuItem
            icon="router"
            text="My Hubs"
            theme={theme}
            hasArrow
            onPress={() => navigation.navigate("MyHubs")}
          />
          <MenuItem
            icon="add-circle-outline"
            text="Add New Device"
            theme={theme}
            iconColor={isDarkMode ? "#00ff99" : "#00995e"}
            textColor={theme.text}
            onPress={() => navigation.navigate("SetupHub")}
          />

          <Text
            className="text-[11px] uppercase font-bold tracking-widest mt-6 mb-2.5"
            style={{ color: theme.textSecondary }}
          >
            App Settings
          </Text>

          <MenuItem
            icon="settings"
            text="Account Settings"
            theme={theme}
            onPress={() => navigation.navigate("ProfileSettings")}
          />
          <MenuItem
            icon="bolt"
            text="Utility Rates (₱/kWh)"
            theme={theme}
            onPress={() => navigation.navigate("ProviderSetup")}
          />
          <MenuItem
            icon="notifications-none"
            text="Notifications"
            theme={theme}
            onPress={() => navigation.navigate("Notifications")}
          />

          <View className="h-5" />
        </View>
      </ScrollView>

      <View
        className="p-6 border-t items-center"
        style={{ borderTopColor: theme.cardBorder }}
      >
        <Text className="text-[11px]" style={{ color: theme.textSecondary }}>
          GridWatch v1.0.4
        </Text>
      </View>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  text,
  theme,
  hasArrow,
  iconColor,
  textColor,
  badge,
  badgeColor,
  onPress,
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-3.5 border-b"
      style={{ borderBottomColor: theme.cardBorder }}
      onPress={onPress}
    >
      <MaterialIcons
        name={icon}
        size={22}
        color={iconColor || theme.textSecondary}
        style={{ marginRight: 16 }}
      />
      <Text
        className="flex-1 text-[15px] font-medium"
        style={{ color: textColor || theme.text }}
      >
        {text}
      </Text>
      {badge && (
        <View
          className="px-2 py-0.5 rounded-[10px] mr-1.5"
          style={{ backgroundColor: badgeColor }}
        >
          <Text
            className="text-[10px] font-bold"
            style={{ color: badgeColor === "#ffaa00" ? "#1a1a1a" : "#fff" }}
          >
            {badge}
          </Text>
        </View>
      )}
      {hasArrow && (
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={theme.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
}
