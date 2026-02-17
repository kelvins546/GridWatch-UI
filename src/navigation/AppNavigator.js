import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  TouchableOpacity,
  View,
  Platform,
  ActivityIndicator,
  Text,
  StatusBar,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
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
import MyHubsScreen from "../screens/menu/MyHubsScreen";
import SetupHubScreen from "../screens/menu/SetupHubScreen";
import HubConfigScreen from "../screens/menu/HubConfigScreen";
import FamilyAccessScreen from "../screens/menu/FamilyAccessScreen";
import InvitationsScreen from "../screens/menu/InvitationsScreen";
import FaultDetailScreen from "../screens/devices/FaultDetailScreen";
import DeviceControlScreen from "../screens/devices/DeviceControlScreen";
import DisconnectedScreen from "../screens/settings/DisconnectedScreen";

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

  if (t.includes("login successful")) {
    return {
      title: "Security Alert",
      body: "New Login Detected: Did you just log in on another device? If not, please change your password immediately.",
    };
  }

  if (
    t.includes("other device") ||
    b.includes("other device") ||
    t.includes("new device") ||
    b.includes("new device") ||
    t.includes("someone login") ||
    t.includes("security")
  ) {
    return {
      title: "Security Alert",
      body: "New Login Detected: Did you just log in on another device? If not, please change your password immediately.",
    };
  }

  if (t.includes("accepted")) {
    return { title: "Invite Accepted", body: body };
  }

  if (t.includes("declined")) {
    return { title: "Invite Declined", body: body };
  }

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

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })
    ).data;
    console.log("Expo Push Token:", token);
  } catch (e) {
    console.log("Error fetching token:", e);
  }

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
        if (data?.screen === "Invitations") {
          navigation.navigate("Invitations");
        } else if (data?.screen === "Notifications") {
          navigation.navigate("Notifications");
        } else {
          navigation.navigate("Notifications");
        }
      },
    );
    return () => subscription.remove();
  }, []);

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
        tabBarLabelStyle: {
          fontSize: 10,
          marginBottom: 0,
        },
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
  const notifiedIds = useRef(new Set());
  const isJustLoggedIn = useRef(true);

  const [initialRoute, setInitialRoute] = useState(null);

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

        if (!error && count === 0) {
          console.log("No hubs found -> Starting at SetupHub");
          setInitialRoute("SetupHub");
        } else {
          setInitialRoute("MainApp");
        }
      } catch (e) {
        console.log("Error checking hubs, defaulting to MainApp", e);
        setInitialRoute("MainApp");
      }
    };

    if (!isLoading) {
      determineInitialRoute();
    }
  }, [authUser, isLoading]);

  useEffect(() => {
    registerForPushNotificationsAsync().then(async (token) => {
      if (token && authUser) {
        console.log("Push Token ready:", token);
      }
    });

    const loadHistory = async () => {
      try {
        const history = await AsyncStorage.getItem("gridwatch_pushed_ids");
        if (history) {
          const parsedIds = JSON.parse(history);
          parsedIds.forEach((id) => notifiedIds.current.add(id));
        }
      } catch (error) {
        console.log("Failed to load notification history", error);
      }
    };
    loadHistory();

    if (authUser) {
      isJustLoggedIn.current = true;
    }

    const timer = setTimeout(() => {
      isJustLoggedIn.current = false;
    }, 15000);

    return () => clearTimeout(timer);
  }, [authUser]);

  const shouldSuppressNotification = async (title, body) => {
    try {
      const savedSettings = await AsyncStorage.getItem(NOTIF_SETTINGS_KEY);
      if (!savedSettings) return false;

      const settings = JSON.parse(savedSettings);
      if (!settings.pushEnabled) return true;

      const text = (title + " " + body).toLowerCase();

      if (
        (text.includes("budget") ||
          text.includes("cost") ||
          text.includes("limit") ||
          text.includes("bill") ||
          text.includes("exceeded")) &&
        !settings.budgetAlerts
      ) {
        return true;
      }

      if (
        (text.includes("offline") ||
          text.includes("online") ||
          text.includes("connected") ||
          text.includes("hub") ||
          text.includes("device")) &&
        !settings.deviceStatus
      ) {
        return true;
      }

      if (
        (text.includes("tip") ||
          text.includes("news") ||
          text.includes("update") ||
          text.includes("smart")) &&
        !settings.tipsNews
      ) {
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  };

  const sendUniqueNotification = async (
    id,
    title,
    body,
    screen = "Notifications",
    silent = false,
  ) => {
    if (notifiedIds.current.has(id)) {
      return false;
    }

    const suppressed = await shouldSuppressNotification(title, body);
    if (suppressed && !silent) {
      silent = true;
      console.log(`Suppressed notification by user settings: ${title}`);
    }

    notifiedIds.current.add(id);
    try {
      await AsyncStorage.setItem(
        "gridwatch_pushed_ids",
        JSON.stringify(Array.from(notifiedIds.current)),
      );
    } catch (e) {
      console.log("Failed to save history", e);
    }

    if (silent) {
      return true;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: true,
        data: { screen: screen },
      },
      trigger: null,
    });
    return true;
  };

  useEffect(() => {
    if (!authUser || !authUser.email) return;

    const myEmail = authUser.email.trim().toLowerCase();
    const myId = authUser.id;

    const checkDatabase = async () => {
      try {
        const { data: invites } = await supabase
          .from("hub_invites")
          .select("id, email, status")
          .eq("status", "pending");

        if (invites && invites.length > 0) {
          invites.forEach(async (invite) => {
            if (invite.email.trim().toLowerCase() === myEmail) {
              await sendUniqueNotification(
                invite.id,
                "New Invitation",
                "You have a pending GridWatch invitation!",
                "Invitations",
              );
            }
          });
        }

        const { data: appNotifs } = await supabase
          .from("app_notifications")
          .select("*")
          .eq("user_id", myId)
          .eq("is_read", false);

        if (appNotifs && appNotifs.length > 0) {
          appNotifs.forEach(async (notif) => {
            const { title, body } = getRefinedSecurityMessage(
              notif.title,
              notif.body,
            );

            const isSelfLogin =
              title === "Security Alert" && isJustLoggedIn.current;

            await sendUniqueNotification(
              notif.id,
              title,
              body,
              "Notifications",
              isSelfLogin,
            );
          });
        }
      } catch (err) {
        console.log("Polling Exception:", err);
      }
    };

    checkDatabase();
    const intervalId = setInterval(checkDatabase, 15000);

    const channel = supabase
      .channel("global_alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hub_invites" },
        async (payload) => {
          if (!payload.new || !payload.new.email) return;
          if (payload.new.email.trim().toLowerCase() === myEmail) {
            await sendUniqueNotification(
              payload.new.id,
              "New Invitation",
              "You have been invited to join a Hub!",
              "Invitations",
            );
          }
        },
      )
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

            await sendUniqueNotification(
              payload.new.id,
              title,
              body,
              "Notifications",
              isSelfLogin,
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
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
            letterSpacing: 0.5,
            textAlign: "center",
            width: "100%",
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
          {/* CRITICAL: 
             If initialRoute is 'SetupHub', we MUST list SetupHub first.
             If 'MainApp', list MainApp first.
             This guarantees correct loading order.
          */}
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

          {}
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
