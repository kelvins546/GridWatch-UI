import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";

import { ThemeProvider } from "./src/context/ThemeContext";
import { AuthProvider } from "./src/context/AuthContext"; // <--- IMPORT THIS

const linking = {
  prefixes: ["gridwatch://", "exp://"],
  config: {
    screens: {
      ResetPassword: "reset-password",
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {/* WRAP AUTH PROVIDER HERE */}
        <AuthProvider>
          <NavigationContainer linking={linking}>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
