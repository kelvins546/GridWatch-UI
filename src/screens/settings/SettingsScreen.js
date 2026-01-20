import React, { useState, useCallback, useEffect } from "react";
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
  Alert,
  ToastAndroid,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import { requestWidgetUpdate } from "react-native-android-widget";
import { BudgetWidget } from "../../widgets/BudgetWidget";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    isDarkMode,
    toggleTheme,
    theme,
    fontScale,
    isAdvancedMode,
    toggleAdvancedMode,
  } = useTheme();

  const scaledSize = (size) => size * (fontScale || 1);

  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [advancedModeModalVisible, setAdvancedModeModalVisible] =
    useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [userData, setUserData] = useState({
    fullName: "Guest User",
    unitLocation: "Not Logged In",
    initial: "G",
    avatarUrl: null,
  });

  const [widgetsEnabled, setWidgetsEnabled] = useState(false);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [widgetInstalled, setWidgetInstalled] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedEnabled = await AsyncStorage.getItem("widgetsEnabled");
        if (storedEnabled !== null)
          setWidgetsEnabled(JSON.parse(storedEnabled));
        const storedInstalled = await AsyncStorage.getItem("widgetInstalled");
        if (storedInstalled !== null)
          setWidgetInstalled(JSON.parse(storedInstalled));
      } catch (e) {
        console.log("Failed to load widget settings");
      }
    };
    loadSettings();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("first_name, last_name, avatar_url, city, region")
          .eq("id", user.id)
          .single();

        let fullName = "GridWatch User";
        let avatarUrl = user.user_metadata?.avatar_url;
        let location = user.email;

        if (profile) {
          const first = profile.first_name || "";
          const last = profile.last_name || "";
          if (first) {
            fullName = last ? `${first} ${last}` : first;
          } else {
            fullName = user.user_metadata?.full_name || fullName;
          }
          if (profile.avatar_url) avatarUrl = profile.avatar_url;
        } else {
          fullName = user.user_metadata?.full_name || fullName;
        }

        const initial = fullName ? fullName.charAt(0).toUpperCase() : "U";

        setUserData({
          fullName: fullName,
          unitLocation: location,
          initial: initial,
          avatarUrl: avatarUrl,
        });
      }
    } catch (error) {
      console.log("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, []),
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
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setModalVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "Landing" }],
      });
    } catch (error) {
      Alert.alert("Error", error.message);
      setIsLoggingOut(false);
    }
  };

  const handleAddWidget = async () => {
    setIsAddingWidget(true);
    try {
      await requestWidgetUpdate({
        widgetName: "BudgetWidget",
        renderWidget: () => (
          <BudgetWidget
            cost="1,450.75"
            percentage={48}
            budget={3000}
            usage={1450}
          />
        ),
        widgetNotFound: () => {
          console.log("Widget not pinned yet");
        },
      });

      if (widgetInstalled) {
        if (Platform.OS === "android") {
          ToastAndroid.show("Widget Updated!", ToastAndroid.SHORT);
        }
      } else {
        setSuccessModalVisible(true);
      }

      setWidgetInstalled(true);
      await AsyncStorage.setItem("widgetInstalled", "true");
    } catch (error) {
      console.log("Widget Error:", error);
    } finally {
      setIsAddingWidget(false);
    }
  };

  const handleToggleWidgets = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newValue = !widgetsEnabled;
    setWidgetsEnabled(newValue);
    await AsyncStorage.setItem("widgetsEnabled", JSON.stringify(newValue));
  };

  const handleToggleTheme = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleTheme();
  };

  const requestToggleAdvancedMode = () => {
    setAdvancedModeModalVisible(true);
  };

  const confirmToggleAdvancedMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleAdvancedMode();
    setAdvancedModeModalVisible(false);
    navigation.navigate("Home");
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

      {/* HEADER */}
      {!isAdvancedMode ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            paddingVertical: 20,
            backgroundColor: theme.background,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("Menu")}
            style={{ padding: 4 }}
          >
            <MaterialIcons
              name="menu"
              size={scaledSize(28)}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
          <View
            style={{
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                color: theme.text,
                fontSize: scaledSize(18),
              }}
            >
              Settings
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("Notifications")}
            style={{ padding: 4 }}
          >
            <MaterialIcons
              name="notifications-none"
              size={scaledSize(28)}
              color={theme.text}
            />
            <View
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                backgroundColor: "#ff4d4d",
                width: 14,
                height: 14,
                borderRadius: 7,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: theme.background,
              }}
            >
              <Text style={{ color: "white", fontSize: 8, fontWeight: "bold" }}>
                2
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
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
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6 pb-10">
          {/* PROFILE HEADER */}
          <TouchableOpacity
            className="flex-row items-center mb-6"
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
                  style={{ backgroundColor: theme.buttonNeutral }}
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

          {/* --- ADDED SECURITY LABEL HERE --- */}
          <Text
            className="font-bold uppercase tracking-widest mb-3 mt-4"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Security
          </Text>

          {/* ACCOUNT SETTINGS BUTTON */}
          <SettingsRow
            icon="admin-panel-settings"
            title="Account Settings"
            subtitle="Security, 2FA, Deactivation"
            onPress={() => navigation.navigate("AccountSettings")}
            theme={theme}
            scaledSize={scaledSize}
          />

          {/* Utility Section */}
          <Text
            className="font-bold uppercase tracking-widest mb-3 mt-4"
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

          {/* Preferences Section */}
          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Preferences
          </Text>

          <View
            className="p-4 rounded-xl mb-3 flex-row justify-between items-center border h-[72px]"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="flex-row items-center">
              <MaterialIcons
                name="tune"
                size={scaledSize(22)}
                color={theme.icon}
              />
              <View>
                <Text
                  className="font-medium ml-3"
                  style={{ color: theme.text, fontSize: scaledSize(14) }}
                >
                  Advanced Mode
                </Text>
                <Text
                  className="mt-0.5 ml-3"
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(11),
                  }}
                >
                  {isAdvancedMode
                    ? "Full detailed dashboard"
                    : "Simplified view"}
                </Text>
              </View>
            </View>
            <CustomSwitch
              value={isAdvancedMode}
              onToggle={requestToggleAdvancedMode}
              theme={theme}
            />
          </View>

          <SettingsRow
            icon="notifications"
            title="Notifications & Text"
            onPress={() => navigation.navigate("NotificationSettings")}
            theme={theme}
            scaledSize={scaledSize}
          />

          {/* --- WIDGETS SECTION --- */}
          {isAdvancedMode && (
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
                    disabled={isAddingWidget}
                    style={{
                      backgroundColor: widgetInstalled
                        ? theme.buttonPrimary
                        : theme.buttonPrimary,
                    }}
                  >
                    <View className="py-3 items-center justify-center flex-row">
                      {isAddingWidget ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text
                          className="font-bold ml-2"
                          style={{ color: "#fff", fontSize: scaledSize(12) }}
                        >
                          {widgetInstalled ? "UPDATE WIDGET" : "INSTALL WIDGET"}
                        </Text>
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
          )}

          {/* Dark Mode Config */}
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
            <CustomSwitch
              value={isDarkMode}
              onToggle={handleToggleTheme}
              theme={theme}
            />
          </View>

          {/* Support Section */}
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

          {/* LOGOUT */}
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

      {/* Advanced Mode Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={advancedModeModalVisible}
        onRequestClose={() => setAdvancedModeModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80">
          <View
            className="border p-5 rounded-2xl w-72 items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <Text
              className="font-bold mb-2 text-center"
              style={{ color: theme.text, fontSize: scaledSize(18) }}
            >
              {isAdvancedMode
                ? "Disable Advanced Mode?"
                : "Enable Advanced Mode?"}
            </Text>
            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              {isAdvancedMode
                ? "Switching to Simple Mode will simplify the dashboard and hide detailed analytics."
                : "Advanced Mode enables detailed charts, per-device analytics, and complex automation tools."}
            </Text>
            <View className="flex-row gap-2.5 w-full">
              <TouchableOpacity
                className="flex-1 rounded-xl h-10 justify-center items-center border"
                style={{ borderColor: theme.textSecondary }}
                onPress={() => setAdvancedModeModalVisible(false)}
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
                style={{ backgroundColor: theme.buttonPrimary }}
                onPress={confirmToggleAdvancedMode}
              >
                <View className="w-full h-full justify-center items-center">
                  <Text
                    className="font-bold"
                    style={{ color: "white", fontSize: scaledSize(12) }}
                  >
                    {isAdvancedMode ? "Disable" : "Enable"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Modal */}
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
                disabled={isLoggingOut}
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
                disabled={isLoggingOut}
              >
                <View className="w-full h-full justify-center items-center">
                  {isLoggingOut ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      className="font-bold"
                      style={{ color: "white", fontSize: scaledSize(12) }}
                    >
                      Log Out
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
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
            <View className="mb-3 bg-green-500/20 p-3 rounded-full">
              <MaterialIcons name="check" size={24} color="#22c55e" />
            </View>
            <Text
              className="font-bold mb-2 text-center"
              style={{ color: theme.text, fontSize: scaledSize(18) }}
            >
              Widget Added!
            </Text>
            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              The GridWatch widget has been added to your home screen.
            </Text>
            <TouchableOpacity
              className="w-full h-10 rounded-xl justify-center items-center"
              style={{ backgroundColor: theme.buttonPrimary }}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text
                className="font-bold"
                style={{ color: "white", fontSize: scaledSize(12) }}
              >
                Done
              </Text>
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
