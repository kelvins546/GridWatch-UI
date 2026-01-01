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
  ActivityIndicator,
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
  const [searchQuery, setSearchQuery] = useState("");

  const providers = [
    {
      id: "meralco",
      name: "Meralco",
      rate: "11.91",
      image: require("../../../assets/meralco.png"),
    },
    {
      id: "veco",
      name: "Visayan Electric (VECO)",
      rate: "11.28",
      image: require("../../../assets/visayan.png"),
    },
    {
      id: "davao",
      name: "Davao Light (DLPC)",
      rate: "10.24",
      image: require("../../../assets/davao.png"),
    },
    {
      id: "abreco",
      name: "ABRECO",
      rate: "11.50",
      image: require("../../../assets/abreco.png"),
    },
    {
      id: "aec",
      name: "AEC (Albay)",
      rate: "12.10",
      image: require("../../../assets/aec.png"),
    },
    {
      id: "akelco",
      name: "AKELCO",
      rate: "13.20",
      image: require("../../../assets/akelco.png"),
    },
    {
      id: "aleco",
      name: "ALECO",
      rate: "11.80",
      image: require("../../../assets/aleco.png"),
    },
    {
      id: "aneco",
      name: "ANECO",
      rate: "10.90",
      image: require("../../../assets/aneco.png"),
    },
    {
      id: "anteco",
      name: "ANTECO",
      rate: "12.05",
      image: require("../../../assets/anteco.png"),
    },
    {
      id: "aselco",
      name: "ASELCO",
      rate: "10.45",
      image: require("../../../assets/aselco.png"),
    },
    {
      id: "aurelco",
      name: "AURELCO",
      rate: "11.20",
      image: require("../../../assets/aurelco.png"),
    },
    {
      id: "balamban",
      name: "BALAMBAN",
      rate: "10.80",
      image: require("../../../assets/balamban.png"),
    },
    {
      id: "banelco",
      name: "BANELCO",
      rate: "12.50",
      image: require("../../../assets/banelco.png"),
    },
    {
      id: "baselco",
      name: "BASELCO",
      rate: "11.10",
      image: require("../../../assets/baselco.png"),
    },
    {
      id: "batanelco",
      name: "BATANELCO",
      rate: "11.75",
      image: require("../../../assets/batanelco.png"),
    },
    {
      id: "bateleci",
      name: "BATELEC I",
      rate: "11.56",
      image: require("../../../assets/bateleci.png"),
    },
    {
      id: "batelecii",
      name: "BATELEC II",
      rate: "12.10",
      image: require("../../../assets/batelecii.png"),
    },
    {
      id: "beneco",
      name: "BENECO",
      rate: "9.85",
      image: require("../../../assets/beneco.png"),
    },
    {
      id: "bileco",
      name: "BILECO",
      rate: "10.60",
      image: require("../../../assets/bileco.png"),
    },
    {
      id: "biselco",
      name: "BISELCO",
      rate: "11.30",
      image: require("../../../assets/biselco.png"),
    },
    {
      id: "bohecoi",
      name: "BOHECO I",
      rate: "10.95",
      image: require("../../../assets/bohecoi.png"),
    },
    {
      id: "bohecoii",
      name: "BOHECO II",
      rate: "11.05",
      image: require("../../../assets/bohecoii.png"),
    },
    {
      id: "buseco",
      name: "BUSECO",
      rate: "10.70",
      image: require("../../../assets/buseco.png"),
    },
    {
      id: "cagelcoi",
      name: "CAGELCO I",
      rate: "11.40",
      image: require("../../../assets/cagelcoi.png"),
    },
    {
      id: "cagelcoii",
      name: "CAGELCO II",
      rate: "11.55",
      image: require("../../../assets/cagelcoii.png"),
    },
    {
      id: "camelco",
      name: "CAMELCO",
      rate: "12.30",
      image: require("../../../assets/camelco.png"),
    },
    {
      id: "canoreco",
      name: "CANORECO",
      rate: "11.90",
      image: require("../../../assets/canoreco.png"),
    },
    {
      id: "capelco",
      name: "CAPELCO",
      rate: "11.15",
      image: require("../../../assets/capelco.png"),
    },
    {
      id: "casurecoi",
      name: "CASURECO I",
      rate: "11.85",
      image: require("../../../assets/casurecoi.png"),
    },
    {
      id: "casurecoii",
      name: "CASURECO II",
      rate: "11.95",
      image: require("../../../assets/casurecoii.png"),
    },
    {
      id: "casurecoiii",
      name: "CASURECO III",
      rate: "12.05",
      image: require("../../../assets/casurecoiii.png"),
    },
    {
      id: "casurecoiv",
      name: "CASURECO IV",
      rate: "12.15",
      image: require("../../../assets/casurecoiv.png"),
    },
    {
      id: "cebecoi",
      name: "CEBECO I",
      rate: "10.50",
      image: require("../../../assets/cebecoi.png"),
    },
    {
      id: "cebecoii",
      name: "CEBECO II",
      rate: "10.78",
      image: require("../../../assets/cebecoii.png"),
    },
    {
      id: "cebecoiii",
      name: "CEBECO III",
      rate: "10.90",
      image: require("../../../assets/cebecoiii.png"),
    },
    {
      id: "celcor",
      name: "CELCOR",
      rate: "9.90",
      image: require("../../../assets/celcor.png"),
    },
    {
      id: "cenpelco",
      name: "CENPELCO",
      rate: "10.95",
      image: require("../../../assets/cenpelco.png"),
    },
    {
      id: "cepalco",
      name: "CEPALCO",
      rate: "11.25",
      image: require("../../../assets/cepalco.png"),
    },
    {
      id: "clpc",
      name: "CLPC (Calamba)",
      rate: "11.45",
      image: require("../../../assets/clpc.png"),
    },
    {
      id: "cotelco",
      name: "COTELCO",
      rate: "10.35",
      image: require("../../../assets/cotelco.png"),
    },
    {
      id: "dasureco",
      name: "DASURECO",
      rate: "10.65",
      image: require("../../../assets/dasureco.png"),
    },
    {
      id: "decorp",
      name: "DECORP",
      rate: "11.10",
      image: require("../../../assets/decorp.png"),
    },
    {
      id: "dielco",
      name: "DIELCO",
      rate: "11.70",
      image: require("../../../assets/dielco.png"),
    },
    {
      id: "dorelco",
      name: "DORELCO",
      rate: "10.85",
      image: require("../../../assets/dorelco.png"),
    },
    {
      id: "esamelco",
      name: "ESAMELCO",
      rate: "11.50",
      image: require("../../../assets/esamelco.png"),
    },
    {
      id: "fleco",
      name: "FLECO",
      rate: "12.20",
      image: require("../../../assets/fleco.png"),
    },
    {
      id: "guimelco",
      name: "GUIMELCO",
      rate: "11.60",
      image: require("../../../assets/guimelco.png"),
    },
    {
      id: "ifelco",
      name: "IFELCO",
      rate: "10.40",
      image: require("../../../assets/ifelco.png"),
    },
    {
      id: "ilecoi",
      name: "ILECO I",
      rate: "11.00",
      image: require("../../../assets/ilecoi.png"),
    },
    {
      id: "ilecoii",
      name: "ILECO II",
      rate: "11.10",
      image: require("../../../assets/ilecoii.png"),
    },
    {
      id: "ilecoiii",
      name: "ILECO III",
      rate: "11.20",
      image: require("../../../assets/ilecoiii.png"),
    },
    {
      id: "ilpi",
      name: "ILPI (Iligan)",
      rate: "9.75",
      image: require("../../../assets/ilpi.png"),
    },
    {
      id: "inec",
      name: "INEC",
      rate: "10.45",
      image: require("../../../assets/inec.png"),
    },
    {
      id: "iseco",
      name: "ISECO",
      rate: "10.85",
      image: require("../../../assets/iseco.png"),
    },
    {
      id: "iselcoi",
      name: "ISELCO I",
      rate: "11.30",
      image: require("../../../assets/iselcoi.png"),
    },
    {
      id: "iselcoii",
      name: "ISELCO II",
      rate: "11.40",
      image: require("../../../assets/iselcoii.png"),
    },
    {
      id: "kaelco",
      name: "KAELCO",
      rate: "10.90",
      image: require("../../../assets/kaelco.png"),
    },
    {
      id: "laneco",
      name: "LANECO",
      rate: "10.55",
      image: require("../../../assets/laneco.png"),
    },
    {
      id: "leyecoii",
      name: "LEYECO II",
      rate: "10.20",
      image: require("../../../assets/leyecoii.png"),
    },
    {
      id: "leyecoiii",
      name: "LEYECO III",
      rate: "10.30",
      image: require("../../../assets/leyecoiii.png"),
    },
    {
      id: "leyecoiv",
      name: "LEYECO IV",
      rate: "10.40",
      image: require("../../../assets/leyecoiv.png"),
    },
    {
      id: "leyecov",
      name: "LEYECO V",
      rate: "10.50",
      image: require("../../../assets/leyecov.png"),
    },
    {
      id: "luelco",
      name: "LUELCO",
      rate: "11.10",
      image: require("../../../assets/luelco.png"),
    },
    {
      id: "magelco",
      name: "MAGELCO",
      rate: "12.40",
      image: require("../../../assets/magelco.png"),
    },
    {
      id: "marelco",
      name: "MARELCO",
      rate: "13.50",
      image: require("../../../assets/marelco.png"),
    },
    {
      id: "meco",
      name: "MECO (Mactan)",
      rate: "11.35",
      image: require("../../../assets/meco.png"),
    },
    {
      id: "mopreco",
      name: "MOPRECO",
      rate: "11.95",
      image: require("../../../assets/mopreco.png"),
    },
  ];

  const handleSelect = (id) => setSelectedId(id);

  const toggleShowAll = () => {
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

    navigation.navigate("MainApp", {
      screen: "Settings",
      params: { providerName: finalProviderName, rate: finalRate },
    });
  };

  const filteredProviders = providers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSearching = searchQuery.length > 0;
  const recommendedProviders = providers.slice(0, 3);
  const restOfProviders = providers.slice(3);
  const visibleRest = showAll ? restOfProviders : restOfProviders.slice(0, 3);

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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="px-6 py-4">
          <View
            className="flex-row items-center px-4 h-12 rounded-xl border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <MaterialIcons
              name="search"
              size={20}
              color={theme.textSecondary}
              style={{ marginRight: 10 }}
            />
            <TextInput
              className="flex-1 text-sm font-medium"
              style={{ color: theme.text }}
              placeholder="Search provider..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons
                  name="cancel"
                  size={18}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6">
            {!isSearching && (
              <Text
                className="text-center text-xs mb-6 leading-5 px-2.5"
                style={{ color: theme.textSecondary }}
              >
                Choose your local electricity distributor to sync rates
                automatically.
              </Text>
            )}

            {isSearching ? (
              <View>
                {filteredProviders.map((item) => (
                  <ProviderCard
                    key={`search-${item.id}`}
                    item={item}
                    isSelected={selectedId === item.id}
                    onPress={() => handleSelect(item.id)}
                    theme={theme}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </View>
            ) : (
              <View>
                <Text
                  className="text-xs font-bold uppercase tracking-widest mb-3 mt-2.5"
                  style={{ color: theme.textSecondary }}
                >
                  Major Providers
                </Text>
                {recommendedProviders.map((item) => (
                  <ProviderCard
                    key={`major-${item.id}`}
                    item={item}
                    isSelected={selectedId === item.id}
                    onPress={() => handleSelect(item.id)}
                    theme={theme}
                    isDarkMode={isDarkMode}
                  />
                ))}

                <Text
                  className="text-xs font-bold uppercase tracking-widest mb-3 mt-5"
                  style={{ color: theme.textSecondary }}
                >
                  Cooperatives
                </Text>
                {visibleRest.map((item) => (
                  <ProviderCard
                    key={`rest-${item.id}-${showAll}`}
                    item={item}
                    isSelected={selectedId === item.id}
                    onPress={() => handleSelect(item.id)}
                    theme={theme}
                    isDarkMode={isDarkMode}
                  />
                ))}

                <TouchableOpacity
                  onPress={toggleShowAll}
                  className="py-3 items-center"
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: theme.primary }}
                  >
                    {showAll
                      ? "Show Less"
                      : `Show All (${restOfProviders.length} items)`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text
              className="text-xs font-bold uppercase tracking-widest mb-3 mt-8"
              style={{ color: theme.textSecondary }}
            >
              Manual Configuration
            </Text>
            <TouchableOpacity
              className="rounded-2xl border overflow-hidden p-4"
              style={{
                backgroundColor: theme.card,
                borderColor:
                  selectedId === "manual" ? "#0055ff" : theme.cardBorder,
                borderWidth: selectedId === "manual" ? 2 : 1,
              }}
              onPress={() => handleSelect("manual")}
              activeOpacity={0.9}
            >
              <View className="flex-row items-center mb-1">
                <View className="w-11 h-11 rounded-lg justify-center items-center mr-4 bg-[#222]">
                  <MaterialIcons name="edit" size={20} color="#fff" />
                </View>
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
                    Enter your own value
                  </Text>
                </View>
                {selectedId === "manual" && (
                  <View className="bg-blue-600 w-6 h-6 rounded-full justify-center items-center">
                    <MaterialIcons name="check" size={16} color="#fff" />
                  </View>
                )}
              </View>
              {selectedId === "manual" && (
                <View
                  className="mt-4 pt-4 border-t"
                  style={{ borderTopColor: theme.cardBorder }}
                >
                  <Text
                    className="text-xs font-semibold mb-2"
                    style={{ color: theme.text }}
                  >
                    ₱ per kWh
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
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-8 h-12 rounded-2xl overflow-hidden"
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
  const [status, setStatus] = useState("loading");

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
      <View className="w-12 h-12 rounded-xl justify-center items-center mr-4 bg-white overflow-hidden p-1 border border-gray-100">
        {status === "loading" && (
          <ActivityIndicator
            size="small"
            color="#0055ff"
            style={{ position: "absolute" }}
          />
        )}

        <Image
          source={item.image}
          style={{
            width: "100%",
            height: "100%",
            opacity: status === "loaded" ? 1 : 0,
          }}
          resizeMode="contain"
          fadeDuration={300}
          onLoad={() => setStatus("loaded")}
          onError={(e) => {
            console.log(`Error loading: ${item.id}`, e.nativeEvent.error);
            setStatus("error");
          }}
        />

        {status === "error" && (
          <MaterialIcons
            name="bolt"
            size={24}
            color="#ccc"
            style={{ position: "absolute" }}
          />
        )}
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

      {isSelected && (
        <View className="bg-blue-600 w-6 h-6 rounded-full justify-center items-center ml-2">
          <MaterialIcons name="check" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}
