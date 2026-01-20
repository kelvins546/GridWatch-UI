import React, { useState, useCallback } from "react";
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
// 1. Import Supabase
import { supabase } from "../../lib/supabase";

export default function MenuScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale, isAdvancedMode } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    fullName: "GridWatch User",
    role: "Resident",
    initial: "G",
    avatarUrl: null,
  });

  // --- FETCH PROFILE LOGIC ---
  const fetchMenuProfile = async () => {
    try {
      // 1. Get Auth User
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (user) {
        // 2. Get Public Profile
        const { data: profile } = await supabase
          .from("users")
          .select("first_name, last_name, avatar_url, role")
          .eq("id", user.id)
          .single();

        let fullName = "GridWatch User";
        let avatarUrl = user.user_metadata?.avatar_url;
        let role = "Resident"; // Default

        if (profile) {
          // Construct Name
          const first = profile.first_name || "";
          const last = profile.last_name || "";
          if (first) {
            fullName = last ? `${first} ${last}` : first;
          } else {
            fullName = user.user_metadata?.full_name || fullName;
          }

          // Avatar
          if (profile.avatar_url) avatarUrl = profile.avatar_url;

          // Role (Capitalize first letter if exists)
          if (profile.role) {
            role = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
          }
        } else {
          // Fallback to metadata if no profile row
          fullName = user.user_metadata?.full_name || fullName;
        }

        const initial = fullName ? fullName.charAt(0).toUpperCase() : "G";

        setUserData({
          fullName,
          role,
          initial,
          avatarUrl,
        });
      }
    } catch (error) {
      console.log("Error fetching menu profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMenuProfile();
    }, []),
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
        <ActivityIndicator size="large" color="#B0B0B0" />
        <Text
          style={{
            marginTop: 12,
            color: "#B0B0B0",
            fontSize: scaledSize(12),
            fontWeight: "500",
            letterSpacing: 0.5,
          }}
        >
          Loading...
        </Text>
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

      {/* Close Button */}
      <View className="px-6 pt-5 pb-2.5 items-end">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="close"
            size={scaledSize(28)}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>

      {/* Profile Header */}
      <View
        className="flex-row items-center px-6 pb-8 border-b gap-4 mb-4"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <View style={{ width: scaledSize(60), height: scaledSize(60) }}>
          {userData.avatarUrl ? (
            <Image
              source={{ uri: userData.avatarUrl }}
              className="w-full h-full rounded-full"
            />
          ) : (
            <View
              className="w-full h-full rounded-full justify-center items-center shadow-md"
              style={{ backgroundColor: theme.buttonPrimary }}
            >
              <Text
                className="font-bold"
                style={{ color: "#fff", fontSize: scaledSize(24) }}
              >
                {userData.initial}
              </Text>
            </View>
          )}
        </View>

        <View className="justify-center">
          <Text
            className="font-bold"
            style={{ color: theme.text, fontSize: scaledSize(18) }}
          >
            {userData.fullName}
          </Text>
          <Text
            className="mt-1"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Role: {userData.role}
          </Text>
          <Text
            className="mt-1 font-[monospace]"
            style={{ color: theme.buttonPrimary, fontSize: scaledSize(11) }}
          >
            ID: GW-2025-CAL
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-10">
          <Text
            className="font-bold uppercase tracking-widest mb-3 mt-2"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Device Management
          </Text>

          {/* My Hubs - Always Visible */}
          <SettingsRow
            icon="router"
            title="My Hubs"
            subtitle="Manage devices"
            onPress={() => navigation.navigate("MyHubs")}
            theme={theme}
            scaledSize={scaledSize}
          />

          {/* Family Access - Hidden in Simple Mode */}
          {isAdvancedMode && (
            <SettingsRow
              icon="people"
              title="Family Access"
              subtitle="Manage shared users"
              onPress={() => navigation.navigate("FamilyAccess")}
              theme={theme}
              scaledSize={scaledSize}
            />
          )}

          {/* Invitations - Hidden in Simple Mode */}
          {isAdvancedMode && (
            <SettingsRow
              icon="mail-outline"
              title="Invitations"
              subtitle="Review recieved invites"
              onPress={() => navigation.navigate("Invitations")}
              theme={theme}
              scaledSize={scaledSize}
            />
          )}

          {/* Add New Device - Always Visible */}
          <SettingsRow
            icon="add-circle-outline"
            title="Add New Device"
            subtitle="Setup new hardware"
            onPress={() => navigation.navigate("SetupHub")}
            theme={theme}
            scaledSize={scaledSize}
            customIcon={
              <MaterialIcons
                name="add-circle-outline"
                size={scaledSize(22)}
                color={theme.buttonPrimary}
              />
            }
          />

          <Text
            className="font-bold uppercase tracking-widest mb-3 mt-6"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            App Settings
          </Text>

          {/* Account Settings */}
          <SettingsRow
            icon="settings"
            title="Account Settings"
            subtitle="Profile & Security"
            onPress={() => navigation.navigate("ProfileSettings")}
            theme={theme}
            scaledSize={scaledSize}
          />

          {/* Notifications */}
          <SettingsRow
            icon="notifications-none"
            title="Notifications"
            subtitle="Alert preferences"
            onPress={() => navigation.navigate("Notifications")}
            theme={theme}
            scaledSize={scaledSize}
          />

          {/* Version Info */}
          <View
            className="mt-8 border-t pt-6 items-center"
            style={{ borderTopColor: theme.cardBorder }}
          >
            <Text
              className=""
              style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
            >
              GridWatch v1.0.4
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  theme,
  customIcon,
  scaledSize,
}) {
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
          <MaterialIcons name={icon} size={scaledSize(22)} color={theme.icon} />
        )}
        <View>
          <Text
            className="font-medium ml-3"
            style={{ color: theme.text, fontSize: scaledSize(14) }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className="mt-0.5 ml-3"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={scaledSize(20)}
        color={theme.textSecondary}
      />
    </TouchableOpacity>
  );
}
