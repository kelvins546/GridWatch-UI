import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  Image,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode, toggleTheme, theme, fontScale } = useTheme();

  const scaledSize = (size) => size * (fontScale || 1);

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

  const handleToggleWidgets = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setWidgetsEnabled(!widgetsEnabled);
  };

  const handleToggleTheme = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleTheme();
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
        <Text
          style={{
            marginTop: 12,
            color: theme.textSecondary,
            fontSize: scaledSize(14),
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
        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(16) }}
        >
          Settings
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6 pb-10">
          {}
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
                <View
                  className="w-full h-full rounded-full justify-center items-center"
                  style={{ backgroundColor: theme.buttonPrimary }}
                >
                  <Text
                    className="font-bold"
                    style={{ color: "#fff", fontSize: scaledSize(20) }}
                  >
                    {userData.initial}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-1">
              <Text
                className="font-bold"
                style={{ color: theme.text, fontSize: scaledSize(16) }}
              >
                {userData.fullName}
              </Text>
              <Text
                className="mt-0.5"
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(12),
                }}
              >
                {userData.unitLocation}
              </Text>
            </View>
            <MaterialIcons
              name="edit"
              size={scaledSize(20)}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {}
          <Text
            className="font-bold uppercase tracking-widest mb-3 mt-2"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Utility & Rates
          </Text>

          <SettingsRow
            icon="business"
            title={displayProvider}
            subtitle="Current Provider"
            onPress={() => navigation.navigate("ProviderSetup")}
            theme={theme}
            scaledSize={scaledSize}
            customIcon={
              <View className="w-9 h-9 bg-white rounded-lg justify-center items-center overflow-hidden border border-gray-200">
                {logoSource ? (
                  <Image
                    source={logoSource}
                    style={{ width: "80%", height: "80%" }}
                    resizeMode="contain"
                  />
                ) : (
                  <Text
                    className="font-black"
                    style={{ color: "#000", fontSize: scaledSize(14) }}
                  >
                    {displayProvider.charAt(0)}
                  </Text>
                )}
              </View>
            }
          />

          <View
            className="p-4 rounded-xl mb-6 flex-row justify-between items-center border h-[72px]"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="flex-row items-center">
              <MaterialIcons
                name="bolt"
                size={scaledSize(22)}
                color={theme.icon}
              />
              <View>
                <Text
                  className="font-medium ml-3"
                  style={{ color: theme.text, fontSize: scaledSize(14) }}
                >
                  Electricity Rate
                </Text>
                <Text
                  className="mt-0.5 ml-3"
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  Last updated: Today, 8:00 AM
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text
                className="font-bold"
                style={{ color: theme.text, fontSize: scaledSize(14) }}
              >
                ₱ {displayRate}
              </Text>
              <Text
                className="font-semibold"
                style={{
                  color: theme.buttonPrimary,
                  fontSize: scaledSize(12),
                }}
              >
                Auto-Sync ON
              </Text>
            </View>
          </View>

          {}
          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Preferences
          </Text>

          <SettingsRow
            icon="notifications"
            title="Notifications"
            onPress={() => navigation.navigate("NotificationSettings")}
            theme={theme}
            scaledSize={scaledSize}
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
                <MaterialIcons
                  name="widgets"
                  size={scaledSize(22)}
                  color={theme.icon}
                />
                <Text
                  className="font-medium ml-3"
                  style={{ color: theme.text, fontSize: scaledSize(14) }}
                >
                  Home Screen Widgets
                </Text>
              </View>
              {}
              <CustomSwitch
                value={widgetsEnabled}
                onToggle={handleToggleWidgets}
                theme={theme}
              />
            </View>

            {widgetsEnabled && (
              <View
                className="border-t p-4 bg-black/5 dark:bg-white/5"
                style={{ borderColor: theme.cardBorder }}
              >
                <Text
                  className="uppercase font-bold mb-3"
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(10),
                  }}
                >
                  Preview: Monthly Budget Card
                </Text>

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
                      <Text
                        className="font-bold uppercase tracking-widest mb-1 text-zinc-500"
                        style={{ fontSize: scaledSize(10) }}
                      >
                        Total Spending
                      </Text>
                      <Text
                        className="font-extrabold text-white"
                        style={{ fontSize: scaledSize(30) }}
                      >
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
                      <View
                        className="h-full w-[48%]"
                        style={{ backgroundColor: theme.buttonPrimary }}
                      />
                    </View>
                    <Text
                      className="font-bold"
                      style={{
                        color: theme.buttonPrimary,
                        fontSize: scaledSize(9),
                      }}
                    >
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
                      scaledSize={scaledSize}
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
                      scaledSize={scaledSize}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  className="mt-4 rounded-xl overflow-hidden"
                  onPress={handleAddWidget}
                  disabled={widgetInstalled || isAddingWidget}
                  style={{
                    backgroundColor: widgetInstalled
                      ? isDarkMode
                        ? "#333"
                        : "#ccc"
                      : theme.buttonPrimary,
                  }}
                >
                  <View className="py-3 items-center justify-center flex-row">
                    {isAddingWidget ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons
                          name={
                            widgetInstalled
                              ? "check-circle"
                              : "add-to-home-screen"
                          }
                          size={scaledSize(18)}
                          color="#fff"
                        />
                        <Text
                          className="font-bold ml-2"
                          style={{ color: "#fff", fontSize: scaledSize(12) }}
                        >
                          {widgetInstalled
                            ? "WIDGET INSTALLED"
                            : "INSTALL WIDGET"}
                        </Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                <Text
                  className="text-center mt-3"
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(10),
                  }}
                >
                  This widget will be added to your phone's home screen.
                </Text>
              </View>
            )}
          </View>

          {}
          <View
            className="p-4 rounded-xl mb-6 flex-row justify-between items-center border h-[72px]"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="flex-row items-center">
              <MaterialIcons
                name="dark-mode"
                size={scaledSize(22)}
                color={theme.icon}
              />
              <Text
                className="font-medium ml-3"
                style={{ color: theme.text, fontSize: scaledSize(14) }}
              >
                Dark Mode
              </Text>
            </View>
            {}
            <CustomSwitch
              value={isDarkMode}
              onToggle={handleToggleTheme}
              theme={theme}
            />
          </View>

          {}
          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Support
          </Text>

          <SettingsRow
            icon="help-outline"
            title="Help & Support"
            onPress={() => navigation.navigate("HelpSupport")}
            theme={theme}
            scaledSize={scaledSize}
          />

          <SettingsRow
            icon="info-outline"
            title="About Us"
            onPress={() => navigation.navigate("AboutUs")}
            theme={theme}
            scaledSize={scaledSize}
          />

          {}
          <TouchableOpacity
            className="mt-8 p-4 rounded-xl border items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            onPress={() => setModalVisible(true)}
          >
            <Text
              className="font-semibold"
              style={{ color: theme.textSecondary, fontSize: scaledSize(14) }}
            >
              Log Out
            </Text>
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
            className="border p-5 rounded-2xl w-72 items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            {}
            <Text
              className="font-bold mb-2"
              style={{ color: theme.text, fontSize: scaledSize(18) }}
            >
              Log Out?
            </Text>
            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
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
                  className="font-bold"
                  style={{ color: theme.text, fontSize: scaledSize(12) }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-xl h-10 justify-center items-center overflow-hidden"
                style={{ backgroundColor: theme.buttonDangerText }}
                onPress={handleLogout}
              >
                <View className="w-full h-full justify-center items-center">
                  <Text
                    className="font-bold"
                    style={{ color: "white", fontSize: scaledSize(12) }}
                  >
                    Log Out
                  </Text>
                </View>
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
            className="border p-5 rounded-2xl w-72 items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            {}
            <Text
              className="font-bold mb-2"
              style={{ color: theme.text, fontSize: scaledSize(18) }}
            >
              Widget Added
            </Text>
            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              The GridWatch Budget Tracker has been successfully added to your
              Home Screen.
            </Text>
            <TouchableOpacity
              className="w-full rounded-xl h-10 justify-center items-center overflow-hidden"
              onPress={() => setSuccessModalVisible(false)}
              style={{ backgroundColor: theme.buttonPrimary }}
            >
              <View className="w-full h-full justify-center items-center">
                <Text
                  className="font-bold uppercase tracking-wide"
                  style={{ color: "white", fontSize: scaledSize(12) }}
                >
                  Great
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

function CustomSwitch({ value, onToggle, theme }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      style={{
        width: 42,
        height: 26,
        borderRadius: 16,
        backgroundColor: value ? theme.buttonPrimary : theme.buttonNeutral,
        padding: 2,
        justifyContent: "center",
        alignItems: value ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 2.5,
          elevation: 2,
        }}
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
  scaledSize,
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
          className="font-medium uppercase"
          style={{ color: labelColor, fontSize: scaledSize(10) }}
        >
          {label}
        </Text>
        <Text
          className="font-bold"
          style={{ color: textColor, fontSize: scaledSize(14) }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
