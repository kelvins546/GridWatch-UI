import React, { useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Animated, TouchableOpacity, View, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

import LandingScreen from "../screens/auth/LandingScreen";
import AuthSelectionScreen from "../screens/auth/AuthSelectionScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";

import HomeScreen from "../screens/home/HomeScreen";
import AnalyticsScreen from "../screens/analytics/AnalyticsScreen";
import BudgetManagerScreen from "../screens/budgets/BudgetManagerScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";

import ProfileSettingsScreen from "../screens/settings/ProfileSettingsScreen";
import DeviceConfigScreen from "../screens/settings/DeviceConfigScreen";
import HelpSupportScreen from "../screens/settings/HelpSupportScreen";
import AboutUsScreen from "../screens/settings/AboutUsScreen";
import NotificationsScreen from "../screens/settings/NotificationsScreen";
import NotificationSettingsScreen from "../screens/settings/NotificationSettingsScreen";
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

function BottomTabNavigator() {
  const { theme, isDarkMode, fontScale } = useTheme();
  const insets = useSafeAreaInsets();

  const scaledSize = (size) => size * fontScale;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.cardBorder,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: theme.buttonPrimary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: scaledSize(10),
          fontWeight: "600",
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
        component={AnalyticsScreen}
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
        component={BudgetManagerScreen}
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
  const { isDarkMode } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Landing"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        presentation: "card",
        contentStyle: { backgroundColor: isDarkMode ? "#0f0f0f" : "#ffffff" },
      }}
    >
      {}
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="AuthSelection" component={AuthSelectionScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

      {}
      <Stack.Screen name="MainApp" component={BottomTabNavigator} />

      {}
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
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

      {}
      <Stack.Screen name="MyHubs" component={MyHubsScreen} />
      <Stack.Screen name="SetupHub" component={SetupHubScreen} />
      <Stack.Screen name="HubConfig" component={HubConfigScreen} />
      <Stack.Screen name="FamilyAccess" component={FamilyAccessScreen} />
      <Stack.Screen name="Invitations" component={InvitationsScreen} />

      <Stack.Screen name="Disconnected" component={DisconnectedScreen} />
      <Stack.Screen name="FaultDetail" component={FaultDetailScreen} />
      <Stack.Screen name="DeviceControl" component={DeviceControlScreen} />

      {}
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
    </Stack.Navigator>
  );
}
