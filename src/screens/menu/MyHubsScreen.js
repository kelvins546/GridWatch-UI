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
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function MyHubsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

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
        className="flex-row items-center px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity
          className="flex-row items-center gap-1.5"
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={18}
            color={theme.textSecondary}
          />
          <Text
            className="text-sm font-medium"
            style={{ color: theme.textSecondary }}
          >
            Back
          </Text>
        </TouchableOpacity>
        <Text
          className="flex-1 text-center text-base font-bold mr-0"
          style={{ color: theme.text }}
        >
          My Hubs
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SetupHub")}>
          <MaterialIcons name="add" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View className="p-6">
          <TouchableOpacity
            className="rounded-2xl p-4 mb-4 border relative"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            activeOpacity={0.8}
          >
            <View className="flex-row justify-between items-start mb-3">
              <View
                className="w-10 h-10 rounded-xl justify-center items-center"
                style={{ backgroundColor: "rgba(0, 255, 153, 0.1)" }}
              >
                <MaterialIcons name="router" size={24} color="#00ff99" />
              </View>
              <View
                className="px-2 py-1 rounded-md border"
                style={{
                  backgroundColor: "rgba(0, 255, 153, 0.15)",
                  borderColor: "rgba(0, 255, 153, 0.3)",
                }}
              >
                <Text className="text-[#00ff99] text-[10px] font-bold uppercase">
                  Online
                </Text>
              </View>
            </View>

            <Text
              className="text-[15px] font-bold mb-1"
              style={{ color: theme.text }}
            >
              Living Room Hub
            </Text>
            <Text
              className="text-[11px] mb-3"
              style={{ color: theme.textSecondary }}
            >
              Unit 402 • ID: GW-A101
            </Text>

            <View
              className="flex-row border-t pt-3 mt-1"
              style={{ borderTopColor: theme.cardBorder }}
            >
              <StatCol label="Load" value="1.2 kW" theme={theme} />
              <StatCol
                label="Signal"
                value="Strong"
                color="#00ff99"
                theme={theme}
              />
              <StatCol label="Devices" value="4 Active" theme={theme} />
            </View>

            <View className="absolute bottom-4 right-4">
              <MaterialIcons
                name="settings"
                size={20}
                color={theme.textSecondary}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-2xl p-4 mb-4 border relative"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            activeOpacity={0.8}
          >
            <View className="flex-row justify-between items-start mb-3">
              <View
                className="w-10 h-10 rounded-xl justify-center items-center"
                style={{ backgroundColor: "rgba(255, 68, 68, 0.1)" }}
              >
                <MaterialIcons name="wifi-off" size={24} color="#ff4444" />
              </View>
              <View
                className="px-2 py-1 rounded-md border"
                style={{
                  backgroundColor: "rgba(255, 68, 68, 0.15)",
                  borderColor: "rgba(255, 68, 68, 0.3)",
                }}
              >
                <Text className="text-[#ff4444] text-[10px] font-bold uppercase">
                  Offline
                </Text>
              </View>
            </View>

            <Text
              className="text-[15px] font-bold mb-1"
              style={{ color: theme.text }}
            >
              Bedroom Hub
            </Text>
            <Text
              className="text-[11px] mb-3"
              style={{ color: theme.textSecondary }}
            >
              Unit 402 • ID: GW-B205
            </Text>

            <View
              className="flex-row border-t pt-3 mt-1"
              style={{ borderTopColor: theme.cardBorder }}
            >
              <StatCol label="Last Seen" value="2h ago" theme={theme} />
              <StatCol
                label="Reason"
                value="No Power"
                color="#ff4444"
                theme={theme}
              />
              <View className="flex-1" />
            </View>

            <View className="absolute bottom-4 right-4">
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={theme.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCol({ label, value, color, theme }) {
  return (
    <View className="flex-1 gap-1">
      <Text
        className="text-[10px] uppercase font-semibold"
        style={{ color: theme.textSecondary }}
      >
        {label}
      </Text>
      <Text
        className="text-xs font-medium"
        style={{ color: color || theme.text }}
      >
        {value}
      </Text>
    </View>
  );
}
