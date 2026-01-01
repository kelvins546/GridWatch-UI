import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  StatusBar,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [modalVisible, setModalVisible] = useState(false);
  const { isDarkMode, toggleTheme, theme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    fullName: "User",
    unitLocation: "Not Set",
    initial: "US",
    avatarUrl: null,
  });

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("users")
          .select("full_name, unit_location, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          const name = data.full_name || "User";
          const initials = name.substring(0, 2).toUpperCase();

          setUserData({
            fullName: name,
            unitLocation: data.unit_location || "Location not set",
            initial: initials,
            avatarUrl: data.avatar_url,
          });
        } else {
          const emailName = user.email.split("@")[0];
          setUserData({
            fullName: emailName.charAt(0).toUpperCase() + emailName.slice(1),
            unitLocation: "Profile incomplete",
            initial: emailName.substring(0, 2).toUpperCase(),
            avatarUrl: null,
          });
        }
      }
    } catch (err) {
      console.error("Settings fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const { providerName, rate } = route.params || {};
  const displayProvider = providerName || "Meralco";
  const displayRate = rate || "12.50";

  const providerLogos = {
    Meralco: require("../../../assets/meralco.png"),
    "Visayan Electric": require("../../../assets/visayan.png"),
    "Davao Light": require("../../../assets/davao.png"),
    BENECO: require("../../../assets/beneco.png"),
    AKELCO: require("../../../assets/akelco.png"),
  };
  const logoSource = providerLogos[displayProvider];

  const handleLogout = async () => {
    setModalVisible(false);
    await supabase.auth.signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: "Landing" }],
    });
  };

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

      <View
        className="flex-row items-center justify-center px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <Text className="text-base font-bold" style={{ color: theme.text }}>
          Settings
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6 pb-10">
          <TouchableOpacity
            className="flex-row items-center mb-8"
            onPress={() => navigation.navigate("ProfileSettings")}
            activeOpacity={0.8}
          >
            <View className="w-14 h-14 mr-4">
              {userData.avatarUrl ? (
                <Image
                  source={{ uri: userData.avatarUrl }}
                  className="w-full h-full rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={
                    isDarkMode ? ["#0055ff", "#00ff99"] : ["#0055ff", "#00995e"]
                  }
                  className="w-full h-full rounded-full justify-center items-center"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text className="text-xl font-bold text-gray-900">
                    {userData.initial}
                  </Text>
                </LinearGradient>
              )}
            </View>

            <View className="flex-1">
              <Text
                className="text-base font-bold"
                style={{ color: theme.text }}
              >
                {userData.fullName}
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{ color: theme.textSecondary }}
              >
                {userData.unitLocation}
              </Text>
            </View>
            <MaterialIcons name="edit" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <Text
            className="text-xs font-bold uppercase tracking-widest mb-3 mt-2"
            style={{ color: theme.textSecondary }}
          >
            Utility & Rates
          </Text>

          <SettingsRow
            icon="business"
            title={displayProvider}
            subtitle="Current Provider"
            onPress={() => navigation.navigate("ProviderSetup")}
            theme={theme}
            customIcon={
              <View className="w-9 h-9 bg-white rounded-lg justify-center items-center overflow-hidden border border-gray-200">
                {logoSource ? (
                  <Image
                    source={logoSource}
                    style={{ width: "80%", height: "80%" }}
                    resizeMode="contain"
                  />
                ) : (
                  <Text className="text-black font-black text-sm">
                    {displayProvider.charAt(0)}
                  </Text>
                )}
              </View>
            }
          />

          <View
            className="p-4 rounded-xl mb-3 flex-row justify-between items-center border h-[72px]"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="bolt" size={22} color={theme.icon} />
              <View>
                <Text
                  className="text-sm font-medium ml-3"
                  style={{ color: theme.text }}
                >
                  Electricity Rate
                </Text>
                <Text
                  className="text-xs mt-0.5 ml-3"
                  style={{ color: theme.textSecondary }}
                >
                  Last updated: Today, 8:00 AM
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-sm font-bold" style={{ color: theme.text }}>
                ₱ {displayRate}
              </Text>
              <Text
                className="text-xs font-semibold"
                style={{ color: theme.primary }}
              >
                Auto-Sync ON
              </Text>
            </View>
          </View>

          <Text
            className="text-xs font-bold uppercase tracking-widest mb-3 mt-2"
            style={{ color: theme.textSecondary }}
          >
            Device Configuration
          </Text>

          <SettingsRow
            icon="router"
            title="My Hubs"
            subtitle="Manage devices"
            onPress={() => navigation.navigate("MyHubs")}
            theme={theme}
          />

          <Text
            className="text-xs font-bold uppercase tracking-widest mb-3 mt-2"
            style={{ color: theme.textSecondary }}
          >
            Preferences
          </Text>
          <SettingsRow
            icon="notifications"
            title="Notifications"
            onPress={() => navigation.navigate("Notifications")}
            theme={theme}
          />
          <SettingsRow
            icon="help-outline"
            title="Help & Support"
            onPress={() => navigation.navigate("HelpSupport")}
            theme={theme}
          />

          <View
            className="p-4 rounded-xl mb-3 flex-row justify-between items-center border h-[72px]"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="dark-mode" size={22} color={theme.icon} />
              <Text
                className="text-sm font-medium ml-3"
                style={{ color: theme.text }}
              >
                Dark Mode
              </Text>
            </View>
            <Switch
              trackColor={{
                false: "#d1d1d1",
                true: isDarkMode
                  ? "rgba(0, 255, 153, 0.2)"
                  : "rgba(0, 153, 94, 0.2)",
              }}
              thumbColor={isDarkMode ? theme.primary : "#f4f3f4"}
              onValueChange={toggleTheme}
              value={isDarkMode}
            />
          </View>

          <TouchableOpacity
            className="mt-8 p-4 rounded-xl border items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            onPress={() => setModalVisible(true)}
          >
            <Text className="text-red-500 font-semibold text-sm">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80">
          <View
            className="border p-6 rounded-2xl w-72 items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <MaterialIcons
              name="logout"
              size={40}
              color="#ff4444"
              style={{ marginBottom: 15 }}
            />
            <Text
              className="text-lg font-bold mb-2"
              style={{ color: theme.text }}
            >
              Log Out?
            </Text>
            <Text
              className="text-center text-xs mb-6 leading-5"
              style={{ color: theme.textSecondary }}
            >
              Are you sure you want to sign out?
            </Text>
            <View className="flex-row gap-2.5 w-full">
              <TouchableOpacity
                className="flex-1 rounded-xl h-10 justify-center items-center border"
                style={{ borderColor: theme.textSecondary }}
                onPress={() => setModalVisible(false)}
              >
                <Text
                  className="font-bold text-xs"
                  style={{ color: theme.text }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-xl h-10 justify-center items-center overflow-hidden"
                onPress={handleLogout}
              >
                <LinearGradient
                  colors={["#ff4444", "#ff8800"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full h-full justify-center items-center"
                >
                  <Text className="text-white font-bold text-xs">Log Out</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, title, subtitle, onPress, theme, customIcon }) {
  return (
    <TouchableOpacity
      className="p-4 rounded-xl mb-3 flex-row justify-between items-center border h-[72px]"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
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
