import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator, { navigationRef } from "./src/navigation/AppNavigator"; // <-- IMPORTED navigationRef HERE

import { ThemeProvider } from "./src/context/ThemeContext";
import { AuthProvider } from "./src/context/AuthContext";

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
        {}
        <AuthProvider>
          {/* --> ADDED ref={navigationRef} BELOW <-- */}
          <NavigationContainer ref={navigationRef} linking={linking}>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
