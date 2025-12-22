import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
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
  const [customRate, setCustomRate] = useState("");
  const [showAll, setShowAll] = useState(false);

  const providers = [
    {
      id: "meralco",
      name: "Meralco",
      rate: "12.50",
      image: require("../../../assets/meralco.png"),
      isRec: true,
    },
    {
      id: "veco",
      name: "Visayan Electric",
      rate: "11.85",
      image: require("../../../assets/visayan.png"),
    },
    {
      id: "davao",
      name: "Davao Light",
      rate: "10.42",
      image: require("../../../assets/davao.png"),
    },
    {
      id: "beneco",
      name: "BENECO",
      rate: "9.80",
      image: require("../../../assets/beneco.png"),
    },
    {
      id: "akelco",
      name: "AKELCO",
      rate: "13.20",
      image: require("../../../assets/akelco.png"),
    },
  ];

  const handleSelect = (id) => setSelectedId(id);

  const toggleShowAll = () => {
    // LayoutAnimation works automatically in the New Architecture
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAll(!showAll);
  };

  const handleConfirm = () => {
    let finalProviderName = "";
    let finalRate = "";

    if (selectedId === "manual") {
      finalProviderName = "Manual Config";
      finalRate = customRate || "0.00";
    } else {
      const selectedProvider = providers.find((p) => p.id === selectedId);
      finalProviderName = selectedProvider?.name || "Unknown";
      finalRate = selectedProvider?.rate || "0.00";
    }

    // Navigate to Settings inside MainApp
    navigation.navigate("MainApp", {
      screen: "Settings",
      params: {
        providerName: finalProviderName,
        rate: finalRate,
      },
    });
  };

  // Logic to filter providers
  const recommendedProvider = providers[0];
  const otherProviders = providers.slice(1);
  const visibleProviders = showAll
    ? otherProviders
    : otherProviders.slice(0, 2);

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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="p-6">
            <Text
              className="text-center text-xs mb-8 leading-5 px-2.5"
              style={{ color: theme.textSecondary }}
            >
              Choose your local electricity distributor to sync the latest kWh
              rates automatically.
            </Text>

            {/* RECOMMENDED */}
            <Text
              className="text-xs font-bold uppercase tracking-widest mb-3 mt-2.5"
              style={{ color: theme.textSecondary }}
            >
              Recommended
            </Text>
            <ProviderCard
              item={recommendedProvider}
              isSelected={selectedId === recommendedProvider.id}
              onPress={() => handleSelect(recommendedProvider.id)}
              theme={theme}
              isDarkMode={isDarkMode}
            />

            {/* OTHER PROVIDERS LIST */}
            <Text
              className="text-xs font-bold uppercase tracking-widest mb-3 mt-5"
              style={{ color: theme.textSecondary }}
            >
              Other Providers
            </Text>

            {visibleProviders.map((item) => (
              <ProviderCard
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onPress={() => handleSelect(item.id)}
                theme={theme}
                isDarkMode={isDarkMode}
              />
            ))}

            {/* SHOW MORE BUTTON */}
            {otherProviders.length > 2 && (
              <TouchableOpacity
                onPress={toggleShowAll}
                className="py-3 items-center"
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: theme.primary }}
                >
                  {showAll
                    ? "Show Less Providers"
                    : `Show More Providers (${otherProviders.length - 2})`}
                </Text>
              </TouchableOpacity>
            )}

            {/* MANUAL CONFIGURATION */}
            <Text
              className="text-xs font-bold uppercase tracking-widest mb-3 mt-5"
              style={{ color: theme.textSecondary }}
            >
              Manual Configuration
            </Text>

            <TouchableOpacity
              className="rounded-2xl border overflow-hidden transition-all"
              style={{
                backgroundColor: theme.card,
                borderColor:
                  selectedId === "manual" ? "#0055ff" : theme.cardBorder,
                borderWidth: selectedId === "manual" ? 2 : 1,
                padding: 16,
              }}
              onPress={() => handleSelect("manual")}
              activeOpacity={0.9}
            >
              <View className="flex-row items-center mb-1">
                {/* Icon Box */}
                <View className="w-11 h-11 rounded-lg justify-center items-center mr-4 bg-[#222]">
                  <MaterialIcons name="edit" size={20} color="#fff" />
                </View>

                {/* Text Info */}
                <View className="flex-1">
                  <Text
                    className="text-sm font-bold mb-0.5"
                    style={{ color: theme.text }}
                  >
                    Set Custom Rate
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: theme.textSecondary }}
                  >
                    Enter your own ₱/kWh value
                  </Text>
                </View>

                {/* Checkmark */}
                {selectedId === "manual" && (
                  <View className="bg-blue-600 w-6 h-6 rounded-full justify-center items-center">
                    <MaterialIcons name="check" size={16} color="#fff" />
                  </View>
                )}
              </View>

              {/* EXPANDED INPUT UI */}
              {selectedId === "manual" && (
                <View
                  className="mt-4 pt-4 border-t"
                  style={{ borderTopColor: theme.cardBorder }}
                >
                  <Text
                    className="text-xs font-semibold mb-2"
                    style={{ color: theme.text }}
                  >
                    Electricity Rate (₱ per kWh)
                  </Text>

                  <View
                    className="flex-row items-center rounded-xl px-4 py-3 border"
                    style={{
                      backgroundColor: isDarkMode ? "#0f0f0f" : "#f5f5f5",
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <Text
                      className="text-lg font-bold mr-2"
                      style={{ color: theme.textSecondary }}
                    >
                      ₱
                    </Text>
                    <TextInput
                      className="flex-1 text-lg font-bold"
                      style={{ color: theme.text }}
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="decimal-pad"
                      value={customRate}
                      onChangeText={setCustomRate}
                    />
                  </View>
                  <Text
                    className="text-[10px] mt-2 italic text-right"
                    style={{ color: theme.textSecondary }}
                  >
                    National Average: ~₱ 11.50
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* CONFIRM BUTTON */}
            <TouchableOpacity
              className="mt-8 h-12 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20"
              onPress={handleConfirm}
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
      </KeyboardAvoidingView>
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
        borderWidth: isSelected ? 2 : 1,
        ...(isSelected && {
          backgroundColor: isDarkMode
            ? "rgba(0, 85, 255, 0.15)"
            : "rgba(0, 85, 255, 0.05)",
        }),
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-11 h-11 rounded-lg justify-center items-center mr-4 bg-white overflow-hidden p-1">
        {/* IMAGE LOGO */}
        <Image
          source={item.image}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </View>

      <View className="flex-1">
        <Text className="text-sm font-bold mb-1" style={{ color: theme.text }}>
          {item.name}
        </Text>

        <Text className="text-xs" style={{ color: theme.textSecondary }}>
          Rate:{" "}
          <Text className="font-semibold" style={{ color: theme.primary }}>
            ₱ {item.rate} / kWh
          </Text>
        </Text>
      </View>

      {/* CHECKMARK INDICATOR */}
      {isSelected && (
        <View className="bg-blue-600 w-6 h-6 rounded-full justify-center items-center ml-2">
          <MaterialIcons name="check" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}
