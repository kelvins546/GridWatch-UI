import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

const SUMMARY_DATA = {
  currentBill: 1450.75,
  budgetLimit: 1900,
  status: "Good",
  activeDevicesCount: 6,
};

const HUBS_SUMMARY = [
  {
    id: "hub1",
    name: "Living Room",
    status: "ONLINE",
    active: 4,
    totalCost: "₱ 19.70 / hr",
    icon: "weekend",
  },
  {
    id: "hub2",
    name: "Kitchen",
    status: "OFFLINE",
    active: 0,
    totalCost: "₱ 0.00 / hr",
    icon: "kitchen",
  },
];

export default function SimpleHomeScreen() {
  const { theme, isDarkMode, fontScale } = useTheme();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);

  // Helper for scaling
  const scaledSize = (size) => size * (fontScale || 1);

  const percentage = Math.min(
    (SUMMARY_DATA.currentBill / SUMMARY_DATA.budgetLimit) * 100,
    100
  );

  let statusColor = isDarkMode ? theme.buttonPrimary : "#00995e";
  let statusText = "You are on track.";

  if (percentage >= 90) {
    statusColor = theme.buttonDangerText;
    statusText = "Budget limit reached!";
  } else if (percentage >= 75) {
    statusColor = isDarkMode ? "#ffaa00" : "#ff9900";
    statusText = "Approaching budget limit.";
  }

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  // --- UPDATED LOADING STATE ---
  if (isLoading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: theme.background }} // Reverted to theme background
      >
        <ActivityIndicator size="large" color="#B0B0B0" />
        <Text
          style={{
            marginTop: 20,
            color: "#B0B0B0",
            fontSize: 12, // Hardcoded 12
            textAlign: "center",
            width: "100%",
            fontFamily: theme.fontRegular,
          }}
        >
          Loading...
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

      {/* --- HEADER (Fixed Alignment) --- */}
      <View
        className="flex-row justify-between items-center px-6 py-5"
        style={{ backgroundColor: theme.background }}
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

        <Image
          source={require("../../../assets/GridWatch-logo.png")}
          style={{ width: 40, height: 40 }}
          resizeMode="contain"
        />

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
            className="absolute bg-[#ff4d4d] rounded-[7px] w-3.5 h-3.5 justify-center items-center border-2"
            style={{
              borderColor: theme.background,
              top: 4,
              right: 4,
            }}
          >
            <Text className="text-white text-[8px] font-bold">2</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6">
          {/* --- MAIN BILL CARD --- */}
          <View
            className="w-full rounded-3xl p-6 mb-8 shadow-sm border mt-4"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: statusColor }}
                />
                <Text
                  className="font-medium"
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  Current Bill
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={scaledSize(20)}
                color={theme.textSecondary}
              />
            </View>

            <Text
              className="font-extrabold text-center mb-1"
              style={{ color: theme.text, fontSize: scaledSize(42) }}
            >
              ₱ {SUMMARY_DATA.currentBill.toLocaleString()}
            </Text>

            <Text
              className="text-center font-medium mb-6"
              style={{ color: statusColor, fontSize: scaledSize(14) }}
            >
              {statusText}
            </Text>

            <View className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
              <LinearGradient
                colors={[statusColor, statusColor]}
                style={{ width: `${percentage}%`, height: "100%" }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <View className="flex-row justify-between">
              <Text style={{ color: theme.textSecondary, fontSize: 10 }}>
                0%
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 10 }}>
                Limit: ₱ {SUMMARY_DATA.budgetLimit.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* --- ROOM SUMMARY --- */}
          <Text
            className="font-bold uppercase tracking-widest mb-4"
            style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
          >
            My Rooms & Usage
          </Text>

          <View className="gap-3">
            {HUBS_SUMMARY.map((hub) => {
              const isOnline = hub.status === "ONLINE";
              const badgeBg = isOnline
                ? theme.buttonPrimary
                : theme.buttonNeutral;
              const badgeText = isOnline ? "#FFFFFF" : theme.textSecondary;

              return (
                <TouchableOpacity
                  key={hub.id}
                  onPress={() =>
                    navigation.navigate("BudgetDeviceList", {
                      hubName: hub.name,
                    })
                  }
                  activeOpacity={0.8}
                  className="flex-row items-center p-4 rounded-2xl border"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <View
                    className="w-12 h-12 rounded-xl justify-center items-center mr-4"
                    style={{ backgroundColor: theme.buttonNeutral }}
                  >
                    <MaterialIcons
                      name={hub.icon}
                      size={scaledSize(24)}
                      color={
                        isOnline ? theme.buttonPrimary : theme.textSecondary
                      }
                    />
                  </View>

                  <View className="flex-1">
                    <Text
                      className="font-bold mb-1.5"
                      style={{ color: theme.text, fontSize: scaledSize(16) }}
                    >
                      {hub.name}
                    </Text>

                    {/* --- NEW BADGE POSITION (Under Name, perfectly aligned) --- */}
                    <View className="flex-row items-center">
                      <View
                        className="rounded justify-center items-center"
                        style={{
                          backgroundColor: badgeBg,
                          paddingHorizontal: scaledSize(6),
                          paddingVertical: scaledSize(2),
                          marginRight: 8,
                        }}
                      >
                        <Text
                          className="font-bold"
                          style={{ color: badgeText, fontSize: scaledSize(9) }}
                        >
                          {hub.status}
                        </Text>
                      </View>

                      <Text
                        style={{
                          color: theme.textSecondary,
                          fontSize: scaledSize(11),
                        }}
                      >
                        {hub.active} devices
                      </Text>
                    </View>
                  </View>

                  <View className="items-end mr-2">
                    <Text
                      className="font-bold"
                      style={{ color: theme.text, fontSize: scaledSize(14) }}
                    >
                      {hub.totalCost}
                    </Text>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: scaledSize(10),
                      }}
                    >
                      Current Load
                    </Text>
                  </View>

                  <MaterialIcons
                    name="chevron-right"
                    size={scaledSize(24)}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => navigation.navigate("SetupHub")}
              className="flex-row items-center justify-center p-4 rounded-2xl border border-dashed mt-2"
              style={{ borderColor: theme.textSecondary }}
            >
              <MaterialIcons
                name="add"
                size={scaledSize(20)}
                color={theme.textSecondary}
              />
              <Text
                className="ml-2 font-bold"
                style={{ color: theme.textSecondary, fontSize: scaledSize(14) }}
              >
                Add Room
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
