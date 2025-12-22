import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const { isDarkMode, toggleTheme, theme } = useTheme();

  const handleLogout = () => {
    setModalVisible(false);

    // Use 'Landing' because that is the 'name' prop in your AppNavigator.js
    navigation.reset({
      index: 0,
      routes: [{ name: "Landing" }],
    });
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

      <View
        className="flex-row items-center justify-between px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={18}
            color={theme.textSecondary}
          />
          <Text
            className="text-sm font-medium ml-1"
            style={{ color: theme.textSecondary }}
          >
            Back
          </Text>
        </TouchableOpacity>
        <Text className="text-base font-bold" style={{ color: theme.text }}>
          Settings
        </Text>
        <View className="w-14" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6 pb-10">
          <TouchableOpacity
            className="flex-row items-center mb-8"
            onPress={() => navigation.navigate("ProfileSettings")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                isDarkMode ? ["#0055ff", "#00ff99"] : ["#0055ff", "#00995e"]
              }
              className="w-14 h-14 rounded-full justify-center items-center mr-4"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text className="text-xl font-bold text-gray-900">N</Text>
            </LinearGradient>
            <View className="flex-1">
              <Text
                className="text-base font-bold"
                style={{ color: theme.text }}
              >
                Natasha Alonzo
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{ color: theme.textSecondary }}
              >
                Unit 402, Congress Ville
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
            title="Meralco"
            subtitle="Current Provider"
            onPress={() => navigation.navigate("ProviderSetup")}
            theme={theme}
            customIcon={
              <View className="w-7 h-7 bg-white rounded justify-center items-center">
                <Text className="text-black font-black text-sm">M</Text>
              </View>
            }
          />

          <View
            className="p-4 rounded-xl mb-3 flex-row justify-between items-center border"
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
                ₱ 12.50
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
            title="GridWatch Hub"
            subtitle="Online • 192.168.1.15"
            onPress={() => navigation.navigate("DeviceConfig")}
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
            className="p-4 rounded-xl mb-3 flex-row justify-between items-center border"
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
                className="flex-1 rounded-xl h-10 justify-center items-center border bg-transparent"
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
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      className="p-4 rounded-xl mb-3 flex-row justify-between items-center border"
      style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          {customIcon ? (
            customIcon
          ) : (
            <MaterialIcons name={icon} size={22} color={theme.icon} />
          )}
        </Animated.View>

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
