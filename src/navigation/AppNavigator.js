// src/navigation/AppNavigator.js
import React, { useRef, useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  View,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

// --- AUTH SCREENS ---
import LandingScreen from "../screens/auth/LandingScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";

// --- MAIN SCREENS ---
import HomeScreen from "../screens/home/HomeScreen";
import AnalyticsScreen from "../screens/analytics/AnalyticsScreen";
import BudgetManagerScreen from "../screens/budgets/BudgetManagerScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";

// --- SETTINGS SUB-SCREENS ---
import ProfileSettingsScreen from "../screens/settings/ProfileSettingsScreen";
import DeviceConfigScreen from "../screens/settings/DeviceConfigScreen";
import HelpSupportScreen from "../screens/settings/HelpSupportScreen";
import NotificationsScreen from "../screens/settings/NotificationsScreen";
import ProviderSetupScreen from "../screens/settings/ProviderSetupScreen";
import DndCheckScreen from "../screens/settings/DndCheckScreen";

// --- BUDGET SUB-SCREENS ---
import BudgetDeviceListScreen from "../screens/budgets/BudgetDeviceListScreen";
import BudgetDetailScreen from "../screens/budgets/BudgetDetailScreen";
import MonthlyBudgetScreen from "../screens/budgets/MonthlyBudgetScreen";
import LimitDetailScreen from "../screens/budgets/LimitDetailScreen";

// --- MENU / HUB SCREENS ---
import MenuScreen from "../screens/menu/MenuScreen";
import MyHubsScreen from "../screens/menu/MyHubsScreen";
import SetupHubScreen from "../screens/menu/SetupHubScreen";
import HubConfigScreen from "../screens/menu/HubConfigScreen";

// --- DEVICE SCREENS ---
import FaultDetailScreen from "../screens/devices/FaultDetailScreen";
import DeviceControlScreen from "../screens/devices/DeviceControlScreen";
import DisconnectedScreen from "../screens/settings/DisconnectedScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// --- BOUNCE BUTTON COMPONENT ---
const BounceTabButton = ({ children, onPress }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scaleValue, {
      toValue: 0.85,
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

// --- BOTTOM TABS ---
function BottomTabNavigator() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? "#161616" : "#ffffff",
          borderTopColor: isDarkMode ? "#222" : "#e0e0e0",
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          paddingBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarButton: (props) => <BounceTabButton {...props} />,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={AnalyticsScreen}
        options={{
          tabBarButton: (props) => <BounceTabButton {...props} />,
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="insert-chart-outlined"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetManagerScreen}
        options={{
          tabBarButton: (props) => <BounceTabButton {...props} />,
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="account-balance-wallet"
              size={24}
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
            <MaterialIcons name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// --- MAIN APP NAVIGATOR ---
export default function AppNavigator() {
  const { isDarkMode } = useTheme();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("MainApp"); // Default

  useEffect(() => {
    // 1. Check Initial Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserHubs(session);
    });

    // 2. Listen for Login/Logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUserHubs(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- LOGIC: Check if user has hubs to decide destination ---
  const checkUserHubs = async (currentSession) => {
    if (currentSession) {
      try {
        // Count how many hubs this user has
        const { count, error } = await supabase
          .from("hubs")
          .select("*", { count: "exact", head: true });

        // If 0 hubs, send to Setup. If > 0, send to Home.
        if (count === 0 && !error) {
          setInitialRoute("SetupHub");
        } else {
          setInitialRoute("MainApp");
        }
      } catch (err) {
        console.log("Error checking hubs:", err);
        setInitialRoute("MainApp"); // Fallback to home on error
      }
      setSession(currentSession);
    } else {
      setSession(null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff",
        }}
      >
        <ActivityIndicator size="large" color="#0055ff" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      // 🔴 THIS IS THE FIX: Dynamically set the start screen
      initialRouteName={session ? initialRoute : "Landing"}
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        presentation: "card",
        contentStyle: { backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff" },
      }}
    >
      {!session ? (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      ) : (
        <>
          {/* MainApp is the Tabs (Home, etc) */}
          <Stack.Screen name="MainApp" component={BottomTabNavigator} />

          <Stack.Screen
            name="ProfileSettings"
            component={ProfileSettingsScreen}
          />
          <Stack.Screen name="DeviceConfig" component={DeviceConfigScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="ProviderSetup" component={ProviderSetupScreen} />

          <Stack.Screen
            name="DndCheck"
            component={DndCheckScreen}
            options={{
              presentation: "transparentModal",
              animation: "fade",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="BudgetDeviceList"
            component={BudgetDeviceListScreen}
          />
          <Stack.Screen name="BudgetDetail" component={BudgetDetailScreen} />
          <Stack.Screen name="MonthlyBudget" component={MonthlyBudgetScreen} />
          <Stack.Screen name="LimitDetail" component={LimitDetailScreen} />

          <Stack.Screen
            name="Menu"
            component={MenuScreen}
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen name="MyHubs" component={MyHubsScreen} />
          <Stack.Screen name="SetupHub" component={SetupHubScreen} />
          <Stack.Screen name="HubConfig" component={HubConfigScreen} />
          <Stack.Screen name="Disconnected" component={DisconnectedScreen} />
          <Stack.Screen name="FaultDetail" component={FaultDetailScreen} />
          <Stack.Screen name="DeviceControl" component={DeviceControlScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
