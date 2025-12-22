import React, { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

export default function ProviderSetupScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  const [selectedId, setSelectedId] = useState("meralco");

  const providers = [
    {
      id: "meralco",
      name: "Meralco",
      sub: "Rate: ₱ 12.50 / kWh",
      logo: "M",
      color: "#ff6600",
      isRec: true,
    },
    {
      id: "veco",
      name: "VECO",
      sub: "Visayan Electric",
      logo: "V",
      color: "#0055ff",
    },
    {
      id: "davao",
      name: "Davao Light",
      sub: "Davao Light & Power Co.",
      logo: "D",
      color: "#ffcc00",
    },
  ];

  const handleSelect = (id) => setSelectedId(id);

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
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text
          className="flex-1 text-center text-base font-bold"
          style={{ color: theme.text }}
        >
          Select Utility Provider
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView>
        <View className="p-6">
          <Text
            className="text-center text-xs mb-8 leading-5 px-2.5"
            style={{ color: theme.textSecondary }}
          >
            Choose your local electricity distributor to sync the latest kWh
            rates automatically.
          </Text>

          <Text
            className="text-xs font-bold uppercase tracking-widest mb-3 mt-2.5"
            style={{ color: theme.textSecondary }}
          >
            Recommended (Caloocan)
          </Text>
          <ProviderCard
            item={providers[0]}
            isSelected={selectedId === "meralco"}
            onPress={() => handleSelect("meralco")}
            theme={theme}
            isDarkMode={isDarkMode}
          />

          <Text
            className="text-xs font-bold uppercase tracking-widest mb-3 mt-2.5"
            style={{ color: theme.textSecondary }}
          >
            Other Providers
          </Text>
          {providers.slice(1).map((item) => (
            <ProviderCard
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onPress={() => handleSelect(item.id)}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          ))}

          <Text
            className="text-xs font-bold uppercase tracking-widest mb-3 mt-2.5"
            style={{ color: theme.textSecondary }}
          >
            Manual Configuration
          </Text>
          <TouchableOpacity
            className="flex-row items-center p-4 rounded-2xl border mb-3"
            style={{
              backgroundColor: theme.card,
              borderColor:
                selectedId === "manual" ? "#0055ff" : theme.cardBorder,
              ...(selectedId === "manual" && {
                backgroundColor: isDarkMode
                  ? "rgba(0, 85, 255, 0.1)"
                  : "rgba(0, 85, 255, 0.05)",
              }),
            }}
            onPress={() => handleSelect("manual")}
            activeOpacity={0.7}
          >
            {selectedId === "manual" && (
              <View className="absolute -top-1.5 -right-1.5 bg-blue-600 w-5 h-5 rounded-full justify-center items-center border-2 border-white z-10">
                <MaterialIcons name="check" size={12} color="#fff" />
              </View>
            )}

            <View className="w-11 h-11 rounded-lg justify-center items-center mr-4 bg-gray-800">
              <MaterialIcons name="edit" size={20} color="#fff" />
            </View>

            <View>
              <Text
                className="text-sm font-bold mb-1"
                style={{ color: theme.text }}
              >
                Set Custom Rate
              </Text>
              <Text className="text-xs" style={{ color: theme.textSecondary }}>
                Enter your own ₱/kWh value
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-5 h-12 rounded-2xl overflow-hidden"
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={["#0055ff", "#00ff99"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-1 justify-center items-center"
            >
              <Text className="text-black font-bold text-sm uppercase tracking-wider">
                Confirm Selection
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProviderCard({ item, isSelected, onPress, theme, isDarkMode }) {
  return (
    <TouchableOpacity
      className="flex-row items-center p-4 rounded-2xl border mb-3"
      style={{
        backgroundColor: theme.card,
        borderColor: isSelected ? "#0055ff" : theme.cardBorder,
        ...(isSelected && {
          backgroundColor: isDarkMode
            ? "rgba(0, 85, 255, 0.15)"
            : "rgba(0, 85, 255, 0.05)",
        }),
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isSelected && (
        <View
          className="absolute -top-1.5 -right-1.5 bg-blue-600 w-5 h-5 rounded-full justify-center items-center border-2 z-10"
          style={{ borderColor: theme.card }}
        >
          <MaterialIcons name="check" size={12} color="#fff" />
        </View>
      )}

      <View className="w-11 h-11 rounded-lg justify-center items-center mr-4 bg-white">
        <Text className="text-lg font-black" style={{ color: item.color }}>
          {item.logo}
        </Text>
      </View>

      <View>
        <Text className="text-sm font-bold mb-1" style={{ color: theme.text }}>
          {item.name}
        </Text>
        <Text className="text-xs" style={{ color: theme.textSecondary }}>
          {item.id === "meralco" ? (
            <Text>
              Rate:{" "}
              <Text className="font-semibold" style={{ color: theme.primary }}>
                ₱ 12.50 / kWh
              </Text>
            </Text>
          ) : (
            item.sub
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
