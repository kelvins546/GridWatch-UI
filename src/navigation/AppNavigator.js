import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  TouchableOpacity,
  View,
  Platform,
  ActivityIndicator,
  Text,
  StatusBar,
  Vibration,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  useNavigation,
  createNavigationContainerRef,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import LandingScreen from "../screens/auth/LandingScreen";
import AuthSelectionScreen from "../screens/auth/AuthSelectionScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import HomeScreen from "../screens/home/HomeScreen";
import SimpleHomeScreen from "../screens/home/SimpleHomeScreen";
import AnalyticsScreen from "../screens/analytics/AnalyticsScreen";
import SimpleAnalyticsScreen from "../screens/analytics/SimpleAnalyticsScreen";
import BudgetManagerScreen from "../screens/budgets/BudgetManagerScreen";
import SimpleBudgetManagerScreen from "../screens/budgets/SimpleBudgetManagerScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import ProfileSettingsScreen from "../screens/settings/ProfileSettingsScreen";
import AccountSettingsScreen from "../screens/settings/AccountSettingsScreen";
import DeviceConfigScreen from "../screens/settings/DeviceConfigScreen";
import HelpSupportScreen from "../screens/settings/HelpSupportScreen";
import AboutUsScreen from "../screens/settings/AboutUsScreen";
import NotificationsScreen from "../screens/settings/NotificationsScreen";
import NotificationSettingsScreen, {
  NOTIF_SETTINGS_KEY,
} from "../screens/settings/NotificationSettingsScreen";
import ProviderSetupScreen from "../screens/settings/ProviderSetupScreen";
import DndCheckScreen from "../screens/settings/DndCheckScreen";
import BudgetDeviceListScreen from "../screens/budgets/BudgetDeviceListScreen";
import BudgetDetailScreen from "../screens/budgets/BudgetDetailScreen";
import MonthlyBudgetScreen from "../screens/budgets/MonthlyBudgetScreen";
import LimitDetailScreen from "../screens/budgets/LimitDetailScreen";
import MenuScreen from "../screens/menu/MenuScreen";
import FaultScannerScreen from "../screens/menu/FaultScannerScreen";
import EcoStoreScreen from "../screens/menu/EcoStoreScreen"; // adjust path if needed
import EcoMissionsScreen from "../screens/menu/EcoMissionsScreen";
import MyHubsScreen from "../screens/menu/MyHubsScreen";
import SetupHubScreen from "../screens/menu/SetupHubScreen";
import HubConfigScreen from "../screens/menu/HubConfigScreen";
import FamilyAccessScreen from "../screens/menu/FamilyAccessScreen";
import InvitationsScreen from "../screens/menu/InvitationsScreen";
import FaultDetailScreen from "../screens/devices/FaultDetailScreen";
import DeviceControlScreen from "../screens/devices/DeviceControlScreen";
import DisconnectedScreen from "../screens/settings/DisconnectedScreen";

export const navigationRef = createNavigationContainerRef();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const getRefinedSecurityMessage = (title, body) => {
  const t = title ? title.toLowerCase() : "";
  const b = body ? body.toLowerCase() : "";

  if (
    t.includes("login successful") ||
    t.includes("other device") ||
    t.includes("new device")
  ) {
    return {
      title: "Security Alert",
      body: "New Login Detected: Did you just log in on another device? If not, please change your password immediately.",
    };
  }
  if (t.includes("accepted")) return { title: "Invite Accepted", body: body };
  if (t.includes("declined")) return { title: "Invite Declined", body: body };
  return { title, body };
};

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00A651",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e) {}

  return token;
}

const BounceTabButton = ({ children, onPress }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scaleValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
    onPress();
  };
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleValue }],
          width: "100%",
          alignItems: "center",
        }}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

const HomeRoute = () => {
  const { isAdvancedMode } = useTheme();
  return isAdvancedMode ? <HomeScreen /> : <SimpleHomeScreen />;
};
const AnalyticsRoute = () => {
  const { isAdvancedMode } = useTheme();
  return isAdvancedMode ? <AnalyticsScreen /> : <SimpleAnalyticsScreen />;
};
const BudgetRoute = () => {
  const { isAdvancedMode } = useTheme();
  return isAdvancedMode ? (
    <BudgetManagerScreen />
  ) : (
    <SimpleBudgetManagerScreen />
  );
};

function BottomTabNavigator() {
  const { theme, fontScale } = useTheme();
  const navigation = useNavigation();
  const scaledSize = (size) => size * fontScale;

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.screen === "Invitations") navigation.navigate("Invitations");
        else if (data?.screen === "LimitDetail" && data?.deviceId) {
          navigation.navigate("LimitDetail", {
            deviceId: data.deviceId,
            deviceName: data.deviceName || "Device",
          });
        } else if (data?.screen === "FaultDetail" && data?.deviceId) {
          navigation.navigate("FaultDetail", {
            deviceId: data.deviceId,
            deviceName: data.deviceName || "Device",
          });
        } else if (data?.screen === "MyHubs") {
          navigation.navigate("MyHubs");
        } else {
          navigation.navigate("Notifications");
        }
      },
    );
    return () => subscription.remove();
  }, [navigation]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 95 : 75,
          paddingBottom: Platform.OS === "ios" ? 30 : 15,
          paddingTop: 10,
          elevation: 0,
        },
        tabBarActiveTintColor: theme.buttonPrimary,
        tabBarLabelStyle: { fontSize: 10, marginBottom: 0 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeRoute}
        options={{
          tabBarButton: (props) => <BounceTabButton {...props} />,
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="dashboard"
              size={scaledSize(24)}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={AnalyticsRoute}
        options={{
          tabBarButton: (props) => <BounceTabButton {...props} />,
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="insert-chart"
              size={scaledSize(24)}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetRoute}
        options={{
          tabBarButton: (props) => <BounceTabButton {...props} />,
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="account-balance-wallet"
              size={scaledSize(24)}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarButton: (props) => <BounceTabButton {...props} />,
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="settings"
              size={scaledSize(24)}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isDarkMode, theme } = useTheme();
  const { user: authUser, isLoading } = useAuth();
  const rootNavigation = useNavigation();
  const notifiedIds = useRef(new Set());
  const isJustLoggedIn = useRef(true);

  // Restored refs for the 5-second loop
  const alertedDevices = useRef(new Set());
  const alertedFaults = useRef(new Set());

  const [initialRoute, setInitialRoute] = useState(null);
  const [immediateFault, setImmediateFault] = useState(null);
  const [immediateLimit, setImmediateLimit] = useState(null);

  useEffect(() => {
    const determineInitialRoute = async () => {
      if (!authUser) {
        setInitialRoute(null);
        return;
      }
      try {
        const { count, error } = await supabase
          .from("hubs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", authUser.id);

        if (!error && count === 0) setInitialRoute("SetupHub");
        else setInitialRoute("MainApp");
      } catch (e) {
        setInitialRoute("MainApp");
      }
    };
    if (!isLoading) determineInitialRoute();
  }, [authUser, isLoading]);

  useEffect(() => {
    registerForPushNotificationsAsync().then(async (token) => {
      if (token && authUser) {
        await supabase
          .from("users")
          .update({ expo_push_token: token })
          .eq("id", authUser.id);
      }
    });

    const loadHistory = async () => {
      try {
        const history = await AsyncStorage.getItem("gridwatch_pushed_ids");
        if (history)
          JSON.parse(history).forEach((id) => notifiedIds.current.add(id));
      } catch (error) {}
    };
    loadHistory();

    if (authUser) isJustLoggedIn.current = true;
    const timer = setTimeout(() => {
      isJustLoggedIn.current = false;
    }, 15000);
    return () => clearTimeout(timer);
  }, [authUser]);

  // =================================================================
  // UI THREAD HIJACKER (Safely forces screen changes when app is open)
  // =================================================================
  useEffect(() => {
    if (immediateFault) {
      Vibration.vibrate([0, 500, 200, 500, 200, 1000]);
      try {
        if (navigationRef.isReady()) {
          navigationRef.navigate("FaultDetail", {
            deviceId: immediateFault.id,
            deviceName: immediateFault.name,
          });
        } else if (rootNavigation) {
          rootNavigation.navigate("FaultDetail", {
            deviceId: immediateFault.id,
            deviceName: immediateFault.name,
          });
        }
      } catch (e) {}

      setTimeout(() => setImmediateFault(null), 2000);
    }
  }, [immediateFault, rootNavigation]);

  useEffect(() => {
    if (immediateLimit) {
      try {
        if (navigationRef.isReady()) {
          navigationRef.navigate("LimitDetail", {
            deviceId: immediateLimit.id,
            deviceName: immediateLimit.name,
          });
        } else if (rootNavigation) {
          rootNavigation.navigate("LimitDetail", {
            deviceId: immediateLimit.id,
            deviceName: immediateLimit.name,
          });
        }
      } catch (e) {}
      setTimeout(() => setImmediateLimit(null), 2000);
    }
  }, [immediateLimit, rootNavigation]);

  const sendUniqueNotification = async (
    id,
    title,
    body,
    screen = "Notifications",
    silent = false,
    extraData = {},
  ) => {
    if (notifiedIds.current.has(id)) return false;
    notifiedIds.current.add(id);
    try {
      await AsyncStorage.setItem(
        "gridwatch_pushed_ids",
        JSON.stringify(Array.from(notifiedIds.current)),
      );
    } catch (e) {}

    if (silent) return true;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, data: { screen, ...extraData } },
      trigger: null,
    });
    return true;
  };

  // Restored Local 5-Second Checker
  const checkDeviceBudgets = async () => {
    if (!authUser) return;

    try {
      const { data: userData } = await supabase
        .from("users")
        .select("bill_cycle_day")
        .eq("id", authUser.id)
        .single();
      const billDay = userData?.bill_cycle_day || 1;
      const now = new Date();
      let startDate = new Date(now.getFullYear(), now.getMonth(), billDay);
      if (now.getDate() < billDay)
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, billDay);

      const { data: ownedHubs } = await supabase
        .from("hubs")
        .select("id")
        .eq("user_id", authUser.id);
      const { data: sharedHubs } = await supabase
        .from("hub_access")
        .select("hub_id")
        .eq("user_id", authUser.id);

      let hubIds = [];
      if (ownedHubs) ownedHubs.forEach((h) => hubIds.push(h.id));
      if (sharedHubs) sharedHubs.forEach((h) => hubIds.push(h.hub_id));

      if (hubIds.length === 0) return;

      const { data: devices, error: devError } = await supabase
        .from("devices")
        .select(
          "id, name, budget_limit, is_monitored, auto_popup, auto_cutoff, last_budget_alert_date, status",
        )
        .in("hub_id", hubIds);

      if (devError || !devices) return;

      for (const device of devices) {
        if (device.status === "fault") {
          if (!alertedFaults.current.has(device.id)) {
            alertedFaults.current.add(device.id);
            setImmediateFault({ id: device.id, name: device.name });
          }
          continue;
        } else {
          alertedFaults.current.delete(device.id);
        }

        if (!device.budget_limit || device.budget_limit <= 0) {
          alertedDevices.current.delete(device.id);
          continue;
        }

        const { data: usageData } = await supabase
          .from("usage_analytics")
          .select("cost_incurred")
          .eq("device_id", device.id)
          .gte("date", startDate.toISOString());

        const totalUsed =
          usageData?.reduce(
            (sum, row) => sum + (parseFloat(row.cost_incurred) || 0),
            0,
          ) || 0;

        if (totalUsed >= device.budget_limit) {
          const todayStr = new Date().toISOString().split("T")[0];
          if (device.last_budget_alert_date === todayStr + "_ignored") continue;

          if (!alertedDevices.current.has(device.id)) {
            alertedDevices.current.add(device.id);

            const triggerTime = new Date().toISOString();
            const dbUpdates = { last_budget_alert_date: triggerTime };

            if (device.auto_cutoff === true) dbUpdates.status = "off";

            await supabase
              .from("devices")
              .update(dbUpdates)
              .eq("id", device.id);

            if (device.auto_popup === true) {
              setImmediateLimit({ id: device.id, name: device.name });
            } else if (device.is_monitored === true) {
              // Notification is now handled by the database webhook/cron, so we only need the UI popup/hijack part locally if needed.
            }
          }
        } else {
          alertedDevices.current.delete(device.id);
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (!authUser || !authUser.email) return;

    const myEmail = authUser.email.trim().toLowerCase();
    const myId = authUser.id;

    // Fetch existing unread notifications on boot
    const fetchUnreadNotifications = async () => {
      try {
        const { data: appNotifs } = await supabase
          .from("app_notifications")
          .select("*")
          .eq("user_id", myId)
          .eq("is_read", false);

        if (appNotifs) {
          appNotifs.forEach(async (notif) => {
            const { title, body } = getRefinedSecurityMessage(
              notif.title,
              notif.body,
            );
            const isSelfLogin =
              title === "Security Alert" && isJustLoggedIn.current;
            await sendUniqueNotification(
              `notif_${notif.id}`,
              title,
              body,
              "Notifications",
              isSelfLogin,
            );
          });
        }
      } catch (err) {}
    };

    fetchUnreadNotifications();
    checkDeviceBudgets();

    // Restored the 5-second interval loop
    const faultScannerInterval = setInterval(() => {
      checkDeviceBudgets();
    }, 5000);

    const channel = supabase
      .channel("global_alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "app_notifications" },
        async (payload) => {
          if (payload.new.user_id === myId) {
            const { title, body } = getRefinedSecurityMessage(
              payload.new.title,
              payload.new.body,
            );
            const isSelfLogin =
              title === "Security Alert" && isJustLoggedIn.current;

            let targetScreen = "Notifications";
            if (title.includes("Firmware Update")) targetScreen = "MyHubs";
            if (title.includes("Invitation")) targetScreen = "Invitations";
            if (title.includes("Budget")) targetScreen = "LimitDetail";

            await sendUniqueNotification(
              `notif_${payload.new.id}`,
              title,
              body,
              targetScreen,
              isSelfLogin,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "devices" },
        (payload) => {
          if (payload.new && payload.new.status === "fault") {
            setImmediateFault({ id: payload.new.id, name: payload.new.name });
          }
        },
      )
      .subscribe();

    return () => {
      clearInterval(faultScannerInterval);
      supabase.removeChannel(channel);
    };
  }, [authUser]);

  if (isLoading || (authUser && initialRoute === null)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={isDarkMode ? "#0f0f0f" : "#ffffff"}
        />
        <ActivityIndicator size="large" color="#B0B0B0" />
        <Text
          style={{
            color: "#B0B0B0",
            marginTop: 15,
            fontWeight: "500",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          Loading GridWatch...
        </Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute || "Landing"}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff" },
      }}
    >
      {authUser ? (
        <Stack.Group>
          {initialRoute === "SetupHub" ? (
            <>
              <Stack.Screen name="SetupHub" component={SetupHubScreen} />
              <Stack.Screen name="MainApp" component={BottomTabNavigator} />
            </>
          ) : (
            <>
              <Stack.Screen name="MainApp" component={BottomTabNavigator} />
              <Stack.Screen name="SetupHub" component={SetupHubScreen} />
            </>
          )}
          <Stack.Screen
            name="ProfileSettings"
            component={ProfileSettingsScreen}
          />
          <Stack.Screen
            name="AccountSettings"
            component={AccountSettingsScreen}
          />
          <Stack.Screen name="DeviceConfig" component={DeviceConfigScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
          />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="AboutUs" component={AboutUsScreen} />
          <Stack.Screen name="ProviderSetup" component={ProviderSetupScreen} />
          <Stack.Screen
            name="BudgetDeviceList"
            component={BudgetDeviceListScreen}
          />
          <Stack.Screen name="BudgetDetail" component={BudgetDetailScreen} />
          <Stack.Screen name="MonthlyBudget" component={MonthlyBudgetScreen} />
          <Stack.Screen name="LimitDetail" component={LimitDetailScreen} />
          <Stack.Screen
            name="SimpleBudgetManager"
            component={SimpleBudgetManagerScreen}
          />
          <Stack.Screen name="MyHubs" component={MyHubsScreen} />
          <Stack.Screen name="HubConfig" component={HubConfigScreen} />
          <Stack.Screen name="FamilyAccess" component={FamilyAccessScreen} />
          <Stack.Screen name="Invitations" component={InvitationsScreen} />
          <Stack.Screen name="Disconnected" component={DisconnectedScreen} />
          <Stack.Screen name="FaultDetail" component={FaultDetailScreen} />
          <Stack.Screen name="DeviceControl" component={DeviceControlScreen} />
          <Stack.Screen name="EcoStore" component={EcoStoreScreen} />
          <Stack.Screen name="EcoMissions" component={EcoMissionsScreen} />
          {/* ADDED THIS SCREEN */}
          <Stack.Screen name="FaultScanner" component={FaultScannerScreen} />
          <Stack.Screen
            name="Menu"
            component={MenuScreen}
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="DndCheck"
            component={DndCheckScreen}
            options={{
              presentation: "transparentModal",
              animation: "fade",
              headerShown: false,
            }}
          />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="AuthSelection" component={AuthSelectionScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
