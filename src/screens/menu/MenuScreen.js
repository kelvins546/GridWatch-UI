import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function MenuScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

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

      {/* Header */}
      <View className="px-6 pt-5 pb-2.5 items-end">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View
        className="flex-row items-center px-6 pb-8 border-b gap-4"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <LinearGradient
          colors={["#0055ff", "#00ff99"]}
          className="justify-center items-center shadow-md"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 60, height: 60, borderRadius: 30 }}
        >
          <Text className="text-2xl font-bold text-[#1a1a1a]">NA</Text>
        </LinearGradient>

        <View className="justify-center">
          <Text className="text-lg font-bold" style={{ color: theme.text }}>
            Natasha Alonzo
          </Text>
          <Text className="text-xs mt-1" style={{ color: theme.textSecondary }}>
            Role: Home Admin
          </Text>
          <Text className="text-[11px] mt-1 text-[#00ff99] font-[monospace]">
            ID: GW-2025-CAL
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* WRAPPER VIEW: Forces padding to apply correctly */}
        <View className="px-6 py-2.5">
          {/* GROUP 1 */}
          <Text
            className="text-[11px] uppercase font-bold tracking-widest mt-6 mb-2.5"
            style={{ color: theme.textSecondary }}
          >
            Device Management
          </Text>

          <MenuItem
            icon="router"
            text="My Hubs (1 Active)"
            theme={theme}
            hasArrow
            onPress={() => navigation.navigate("MyHubs")}
          />
          <MenuItem
            icon="add-circle-outline"
            text="Add New Device"
            theme={theme}
            iconColor="#00ff99"
            textColor={theme.text}
            onPress={() => navigation.navigate("SetupHub")}
          />

          {/* GROUP 2 */}
          <Text
            className="text-[11px] uppercase font-bold tracking-widest mt-6 mb-2.5"
            style={{ color: theme.textSecondary }}
          >
            System Tools
          </Text>

          <MenuItem
            icon="tune"
            text="Bill Calibration"
            theme={theme}
            badge="!"
            badgeColor="#ffaa00"
            onPress={() => console.log("Nav to Calibration")}
          />
          <MenuItem
            icon="security"
            text="Safety & Fault Logs"
            theme={theme}
            badge="2"
            badgeColor="#ff4d4d"
            onPress={() => console.log("Nav to Logs")}
          />

          {/* GROUP 3 */}
          <Text
            className="text-[11px] uppercase font-bold tracking-widest mt-6 mb-2.5"
            style={{ color: theme.textSecondary }}
          >
            App Settings
          </Text>

          <MenuItem
            icon="bolt"
            text="Utility Rates (₱/kWh)"
            theme={theme}
            onPress={() => navigation.navigate("ProviderSetup")}
          />
          <MenuItem
            icon="notifications-none"
            text="Notifications"
            theme={theme}
            onPress={() => navigation.navigate("Notifications")}
          />

          {/* Bottom spacer for scrolling */}
          <View className="h-5" />
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        className="p-6 border-t items-center"
        style={{ borderTopColor: theme.cardBorder }}
      >
        <Text className="text-[11px]" style={{ color: theme.textSecondary }}>
          GridWatch v1.0.4
        </Text>
      </View>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  text,
  theme,
  hasArrow,
  iconColor,
  textColor,
  badge,
  badgeColor,
  onPress,
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-3.5 border-b"
      style={{ borderBottomColor: theme.cardBorder }}
      onPress={onPress}
    >
      <MaterialIcons
        name={icon}
        size={22}
        color={iconColor || theme.textSecondary}
        style={{ marginRight: 16 }}
      />
      <Text
        className="flex-1 text-[15px] font-medium"
        style={{ color: textColor || theme.text }}
      >
        {text}
      </Text>

      {badge && (
        <View
          className="px-2 py-0.5 rounded-[10px] mr-1.5"
          style={{ backgroundColor: badgeColor }}
        >
          <Text
            className="text-[10px] font-bold"
            style={{ color: badgeColor === "#ffaa00" ? "#1a1a1a" : "#fff" }}
          >
            {badge}
          </Text>
        </View>
      )}

      {hasArrow && (
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={theme.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
}
