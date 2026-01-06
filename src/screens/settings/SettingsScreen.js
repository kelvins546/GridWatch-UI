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

export default function SettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode, toggleTheme, theme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const [userData, setUserData] = useState({
    fullName: "User",
    unitLocation: "Not Set",
    initial: "US",
    avatarUrl: null,
  });

  const [widgetsEnabled, setWidgetsEnabled] = useState(false);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [widgetInstalled, setWidgetInstalled] = useState(false);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setUserData({
        fullName: "Kelvin Manalad",
        unitLocation: "Unit 402, Tower 1",
        initial: "KM",
        avatarUrl: null,
      });
      setIsLoading(false);
    }, 500);
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
    navigation.reset({
      index: 0,
      routes: [{ name: "Landing" }],
    });
  };

  const handleAddWidget = () => {
    setIsAddingWidget(true);
    setTimeout(() => {
      setIsAddingWidget(false);
      setWidgetInstalled(true);
      setSuccessModalVisible(true);
    }, 2000);
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
        {}
        <Text
          style={{
            marginTop: 12,
            color: theme.textSecondary,
            fontSize: 14,
            fontWeight: "500",
          }}
        >
          Loading Settings...
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

          {}

          <Text
            className="text-xs font-bold uppercase tracking-widest mb-3 mt-2"
            style={{ color: theme.textSecondary }}
          >
            Preferences
          </Text>

          <SettingsRow
            icon="notifications"
            title="Notifications"
            onPress={() => navigation.navigate("NotificationSettings")}
            theme={theme}
          />

          <SettingsRow
            icon="help-outline"
            title="Help & Support"
            onPress={() => navigation.navigate("HelpSupport")}
            theme={theme}
          />

          {}
          <View
            className="rounded-xl border mb-3 overflow-hidden"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="p-4 flex-row justify-between items-center h-[72px]">
              <View className="flex-row items-center">
                <MaterialIcons name="widgets" size={22} color={theme.icon} />
                <Text
                  className="text-sm font-medium ml-3"
                  style={{ color: theme.text }}
                >
                  Home Screen Widgets
                </Text>
              </View>
              <Switch
                trackColor={{
                  false: "#d1d1d1",
                  true: isDarkMode
                    ? "rgba(0, 255, 153, 0.2)"
                    : "rgba(0, 153, 94, 0.2)",
                }}
                thumbColor={widgetsEnabled ? theme.primary : "#f4f3f4"}
                onValueChange={setWidgetsEnabled}
                value={widgetsEnabled}
              />
            </View>

            {widgetsEnabled && (
              <View
                className="border-t p-4 bg-black/5 dark:bg-white/5"
                style={{ borderColor: theme.cardBorder }}
              >
                <Text
                  className="text-[10px] uppercase font-bold mb-3"
                  style={{ color: theme.textSecondary }}
                >
                  Preview: Monthly Budget Card
                </Text>

                {}
                <View
                  className="p-5 rounded-2xl border"
                  style={{
                    backgroundColor: "#18181b",
                    borderColor: isDarkMode ? "#333" : "#eee",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 5,
                  }}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <Text className="text-[10px] font-bold uppercase tracking-widest mb-1 text-zinc-500">
                        Total Spending
                      </Text>
                      <Text className="text-3xl font-extrabold text-white">
                        ₱ 1,450.75
                      </Text>
                    </View>
                    <Image
                      source={require("../../../assets/GridWatch-logo.png")}
                      style={{ width: 22, height: 22, opacity: 0.8 }}
                    />
                  </View>

                  <View className="mb-4">
                    <View className="h-1.5 w-full bg-zinc-800 rounded-full mb-2 overflow-hidden">
                      <View className="h-full bg-[#00ff99] w-[48%]" />
                    </View>
                    <Text className="text-[#00ff99] text-[9px] font-bold">
                      48% of Budget Used
                    </Text>
                  </View>

                  <View className="flex-row border-t border-zinc-800 pt-4">
                    <StatItem
                      label="Daily Avg"
                      value="₱ 120.50"
                      icon="trending-up"
                      theme={theme}
                      isDarkMode={true}
                      forceWhiteText={true}
                    />
                    <View className="w-[1px] h-8 mx-4 bg-zinc-800" />
                    <StatItem
                      label="Forecast"
                      value="₱ 3,615.00"
                      icon="insights"
                      color="#ffaa00"
                      theme={theme}
                      isDarkMode={true}
                      forceWhiteText={true}
                    />
                  </View>
                </View>

                {}
                <TouchableOpacity
                  className="mt-4 rounded-xl overflow-hidden"
                  onPress={handleAddWidget}
                  disabled={widgetInstalled || isAddingWidget}
                >
                  <LinearGradient
                    colors={
                      widgetInstalled
                        ? ["#333", "#222"]
                        : ["#0055ff", "#00ff99"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-3 items-center justify-center flex-row"
                  >
                    {isAddingWidget ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <MaterialIcons
                          name={
                            widgetInstalled
                              ? "check-circle"
                              : "add-to-home-screen"
                          }
                          size={18}
                          color={widgetInstalled ? "#00ff99" : "#000"}
                        />
                        <Text
                          className="font-bold text-xs ml-2"
                          style={{ color: widgetInstalled ? "#fff" : "#000" }}
                        >
                          {widgetInstalled
                            ? "WIDGET INSTALLED"
                            : "INSTALL WIDGET"}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <Text
                  className="text-[10px] text-center mt-3"
                  style={{ color: theme.textSecondary }}
                >
                  This widget will be added to your phone's home screen.
                </Text>
              </View>
            )}
          </View>

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

      {}
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

      {}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80">
          <View
            className="border p-6 rounded-2xl w-72 items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="w-12 h-12 rounded-full bg-[#00ff99]/10 items-center justify-center mb-4">
              <MaterialIcons name="check-circle" size={40} color="#00ff99" />
            </View>
            <Text
              className="text-lg font-bold mb-2"
              style={{ color: theme.text }}
            >
              Widget Added
            </Text>
            <Text
              className="text-center text-xs mb-6 leading-5"
              style={{ color: theme.textSecondary }}
            >
              The GridWatch Budget Tracker has been successfully added to your
              Home Screen.
            </Text>
            <TouchableOpacity
              className="w-full rounded-xl h-10 justify-center items-center overflow-hidden"
              onPress={() => setSuccessModalVisible(false)}
            >
              <LinearGradient
                colors={["#0055ff", "#00ff99"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full h-full justify-center items-center"
              >
                <Text className="text-black font-bold text-xs uppercase tracking-wide">
                  Great
                </Text>
              </LinearGradient>
            </TouchableOpacity>
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

function StatItem({
  label,
  value,
  icon,
  color,
  theme,
  isDarkMode,
  forceWhiteText,
}) {
  const iconBg = isDarkMode
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.05)";

  const textColor = forceWhiteText ? "#fff" : theme.text;
  const labelColor = forceWhiteText ? "#a1a1aa" : theme.textSecondary;

  return (
    <View className="flex-1 flex-row items-center gap-3">
      <View
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <MaterialIcons name={icon} size={16} color={color || textColor} />
      </View>
      <View>
        <Text
          className="text-[10px] font-medium uppercase"
          style={{ color: labelColor }}
        >
          {label}
        </Text>
        <Text className="text-sm font-bold" style={{ color: textColor }}>
          {value}
        </Text>
      </View>
    </View>
  );
}
