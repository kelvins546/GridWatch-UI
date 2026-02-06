import React, { useState, useEffect, useMemo } from "react";
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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

// --- STATIC IMAGE MAPPING ---
// Map the "DB Name" (lowercase) to your local assets
const PROVIDER_LOGOS = {
  meralco: require("../../../assets/meralco.png"),
  veco: require("../../../assets/visayan.png"),
  "visayan electric (veco)": require("../../../assets/visayan.png"),
  davao: require("../../../assets/davao.png"),
  "davao light (dlpc)": require("../../../assets/davao.png"),
  abreco: require("../../../assets/abreco.png"),
  aec: require("../../../assets/aec.png"),
  akelco: require("../../../assets/akelco.png"),
  aleco: require("../../../assets/aleco.png"),
  aneco: require("../../../assets/aneco.png"),
  anteco: require("../../../assets/anteco.png"),
  aselco: require("../../../assets/aselco.png"),
  aurelco: require("../../../assets/aurelco.png"),
  balamban: require("../../../assets/balamban.png"),
  banelco: require("../../../assets/banelco.png"),
  baselco: require("../../../assets/baselco.png"),
  batanelco: require("../../../assets/batanelco.png"),
  "batelec i": require("../../../assets/bateleci.png"),
  "batelec ii": require("../../../assets/batelecii.png"),
  beneco: require("../../../assets/beneco.png"),
  bileco: require("../../../assets/bileco.png"),
  biselco: require("../../../assets/biselco.png"),
  "boheco i": require("../../../assets/bohecoi.png"),
  "boheco ii": require("../../../assets/bohecoii.png"),
  buseco: require("../../../assets/buseco.png"),
  "cagelco i": require("../../../assets/cagelcoi.png"),
  "cagelco ii": require("../../../assets/cagelcoii.png"),
  camelco: require("../../../assets/camelco.png"),
  canoreco: require("../../../assets/canoreco.png"),
  capelco: require("../../../assets/capelco.png"),
  "casureco i": require("../../../assets/casurecoi.png"),
  "casureco ii": require("../../../assets/casurecoii.png"),
  "casureco iii": require("../../../assets/casurecoiii.png"),
  "casureco iv": require("../../../assets/casurecoiv.png"),
  "cebeco i": require("../../../assets/cebecoi.png"),
  "cebeco ii": require("../../../assets/cebecoii.png"),
  "cebeco iii": require("../../../assets/cebecoiii.png"),
  celcor: require("../../../assets/celcor.png"),
  cenpelco: require("../../../assets/cenpelco.png"),
  cepalco: require("../../../assets/cepalco.png"),
  clpc: require("../../../assets/clpc.png"),
  cotelco: require("../../../assets/cotelco.png"),
  dasureco: require("../../../assets/dasureco.png"),
  decorp: require("../../../assets/decorp.png"),
  dielco: require("../../../assets/dielco.png"),
  dorelco: require("../../../assets/dorelco.png"),
  esamelco: require("../../../assets/esamelco.png"),
  fleco: require("../../../assets/fleco.png"),
  guimelco: require("../../../assets/guimelco.png"),
  ifelco: require("../../../assets/ifelco.png"),
  "ileco i": require("../../../assets/ilecoi.png"),
  "ileco ii": require("../../../assets/ilecoii.png"),
  "ileco iii": require("../../../assets/ilecoiii.png"),
  ilpi: require("../../../assets/ilpi.png"),
  inec: require("../../../assets/inec.png"),
  iseco: require("../../../assets/iseco.png"),
  "iselco i": require("../../../assets/iselcoi.png"),
  "iselco ii": require("../../../assets/iselcoii.png"),
  kaelco: require("../../../assets/kaelco.png"),
  laneco: require("../../../assets/laneco.png"),
  "leyeco ii": require("../../../assets/leyecoii.png"),
  "leyeco iii": require("../../../assets/leyecoiii.png"),
  "leyeco iv": require("../../../assets/leyecoiv.png"),
  "leyeco v": require("../../../assets/leyecov.png"),
  luelco: require("../../../assets/luelco.png"),
  magelco: require("../../../assets/magelco.png"),
  marelco: require("../../../assets/marelco.png"),
  meco: require("../../../assets/meco.png"),
  mopreco: require("../../../assets/mopreco.png"),
  "moresco i": require("../../../assets/moresco i.png"),
  "moresco ii": require("../../../assets/moresco ii.png"),
  "neeco i": require("../../../assets/neeco i.png"),
  "neeco ii": require("../../../assets/neeco ii.png"),
  noceco: require("../../../assets/noceco.png"),
  noneco: require("../../../assets/noneco.png"),
  "noreco i": require("../../../assets/noreco i.png"),
  "noreco ii": require("../../../assets/noreco ii.png"),
  norsamelco: require("../../../assets/norsamelco.png"),
  nuvelco: require("../../../assets/nuvelco.png"),
  omeco: require("../../../assets/omeco.png"),
  ormeco: require("../../../assets/ormeco.png"),
  paleco: require("../../../assets/paleco.png"),
  "panelco i": require("../../../assets/panelco i.png"),
  "panelco iii": require("../../../assets/panelco iii.png"),
  "pelco i": require("../../../assets/pelco i.png"),
  "pelco ii": require("../../../assets/pelco ii.png"),
  "pelco iii": require("../../../assets/pelco iii.png"),
  penelco: require("../../../assets/penelco.png"),
  "quezelco i": require("../../../assets/quezelco i.png"),
  "quezelco ii": require("../../../assets/quezelco ii.png"),
  quirelco: require("../../../assets/quirelco.png"),
  romelco: require("../../../assets/romelco.png"),
  "samelco i": require("../../../assets/samelco i.png"),
  "samelco ii": require("../../../assets/samelco ii.png"),
  "socoteco i": require("../../../assets/socoteco i.png"),
  "socoteco ii": require("../../../assets/socoteco ii.png"),
  soleco: require("../../../assets/soleco.png"),
  sukelco: require("../../../assets/sukelco.png"),
  surneco: require("../../../assets/surneco.png"),
  surseco: require("../../../assets/surseco.png"),
  "tarelco i": require("../../../assets/tarelco i.png"),
  "tarelco ii": require("../../../assets/tarelco ii.png"),
  tawelco: require("../../../assets/tawelco.png"),
  zamcelco: require("../../../assets/zamcelco.png"),
  "zameco i": require("../../../assets/zameco i.png"),
  "zameco ii": require("../../../assets/zameco ii.png"),
  zamsureco: require("../../../assets/zamsureco.png"),
  zaneco: require("../../../assets/zaneco.png"),
};

const RATE_TYPES = ["Residential", "Commercial", "Industrial"];

export default function ProviderSetupScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  // Colors
  const activeColor = theme.buttonPrimary;
  const dangerColor = isDarkMode ? "#ff4444" : "#c62828";

  // State
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // DB ID
  const [selectedRateType, setSelectedRateType] = useState("Residential");

  // Manual State
  const [customRate, setCustomRate] = useState("");
  const [realtimeError, setRealtimeError] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- 1. FETCH RATES FROM DB ---
  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("utility_rates")
        .select("*")
        .eq("status", "active")
        .order("provider_name", { ascending: true });

      if (error) throw error;
      setProviders(data || []);
    } catch (err) {
      console.log("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. FILTER LOGIC ---
  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchesSearch = p.provider_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType = p.rate_type === selectedRateType;
      return matchesSearch && matchesType;
    });
  }, [providers, searchQuery, selectedRateType]);

  // --- HANDLERS ---
  const handleSelect = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedId(id);
  };

  const handleRateTypeChange = (type) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedRateType(type);
    setSelectedId(null); // Reset selection when type changes
  };

  const handleManualRateChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    if ((cleaned.match(/\./g) || []).length > 1) return;
    setCustomRate(cleaned);

    const val = parseFloat(cleaned);
    if (cleaned !== "" && !isNaN(val)) {
      if (val > 50) setRealtimeError("Max rate is ₱50.00");
      else setRealtimeError(null);
    } else {
      setRealtimeError(null);
    }
  };

  const handleConfirm = async () => {
    let finalProviderId = null;
    let finalCustomRate = null;

    // VALIDATION
    if (selectedId === "manual") {
      const rateValue = parseFloat(customRate);
      if (!customRate || isNaN(rateValue) || rateValue <= 0 || rateValue > 50) {
        setErrorMessage(
          "Please enter a valid rate between ₱ 0.01 and ₱ 50.00.",
        );
        setErrorModalVisible(true);
        return;
      }
      finalCustomRate = rateValue;
    } else if (selectedId) {
      finalProviderId = selectedId;
    } else {
      return;
    }

    setIsSaving(true);

    try {
      // 1. Get User
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // 2. Update User Profile in DB
      const updatePayload = {
        provider_id: finalProviderId,
        custom_rate: finalCustomRate,
        ...(finalProviderId ? { custom_rate: null } : { provider_id: null }),
      };

      const { error } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", user.id);

      if (error) throw error;

      // 3. Navigation (Onboarding Flow Logic)
      if (route.params?.fromOnboarding) {
        navigation.navigate("MainApp", {
          screen: "Budgets",
          params: { showSetupModal: true },
        });
      } else {
        navigation.navigate("MainApp", {
          screen: "Settings",
        });
      }
    } catch (err) {
      console.log("Save Error:", err);
      setErrorMessage("Failed to save selection. Please try again.");
      setErrorModalVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  const isButtonDisabled =
    (!selectedId && !customRate) ||
    (selectedId === "manual" && (!!realtimeError || !customRate)) ||
    isSaving;

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

      {/* ERROR MODAL */}
      <Modal transparent visible={errorModalVisible} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/80">
          <View
            className="w-[70%] max-w-[280px] p-5 rounded-2xl items-center border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View className="mb-3 bg-red-500/10 p-3 rounded-full">
              <MaterialIcons
                name="error-outline"
                size={scaledSize(32)}
                color={dangerColor}
              />
            </View>
            <Text
              className="text-lg font-bold mb-2 text-center"
              style={{ color: theme.text }}
            >
              Error
            </Text>
            <Text
              className="text-xs text-center mb-5 leading-4"
              style={{ color: theme.textSecondary }}
            >
              {errorMessage}
            </Text>
            <TouchableOpacity
              className="w-full"
              onPress={() => setErrorModalVisible(false)}
            >
              <View
                className="p-3 rounded-xl items-center"
                style={{ backgroundColor: dangerColor }}
              >
                <Text className="font-bold text-xs text-white uppercase tracking-wider">
                  OKAY
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HEADER */}
      <View
        className="flex-row items-center px-6 py-5 border-b"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(24)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        <Text
          className="flex-1 text-center text-base font-bold"
          style={{ color: theme.text }}
        >
          Utility Provider
        </Text>
        <View className="w-6" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="px-6 py-4 space-y-4">
          {/* SEARCH BAR */}
          <View
            className="flex-row items-center px-4 h-12 rounded-xl border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <MaterialIcons
              name="search"
              size={scaledSize(20)}
              color={theme.textSecondary}
              style={{ marginRight: 10 }}
            />
            <TextInput
              className="flex-1 text-sm font-medium"
              style={{ color: theme.text, fontSize: scaledSize(14) }}
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
                  size={scaledSize(18)}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* RATE TYPE SELECTOR */}
          <View className="flex-row gap-2">
            {RATE_TYPES.map((type) => {
              const isActive = selectedRateType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleRateTypeChange(type)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    backgroundColor: isActive
                      ? activeColor
                      : theme.buttonNeutral,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? "#fff" : theme.textSecondary,
                      fontWeight: "bold",
                      fontSize: scaledSize(10),
                      textTransform: "uppercase",
                    }}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6">
            {/* LOADING STATE */}
            {loading ? (
              <ActivityIndicator
                size="large"
                color={activeColor}
                style={{ marginTop: 40 }}
              />
            ) : (
              <>
                <Text
                  className="text-xs font-bold uppercase tracking-widest mb-3 mt-2.5"
                  style={{ color: theme.textSecondary }}
                >
                  {filteredProviders.length} Found for {selectedRateType}
                </Text>

                {filteredProviders.map((item) => (
                  <ProviderCard
                    key={item.id}
                    item={item}
                    isSelected={selectedId === item.id}
                    onPress={() => handleSelect(item.id)}
                    theme={theme}
                    isDarkMode={isDarkMode}
                    activeColor={activeColor}
                    scaledSize={scaledSize}
                  />
                ))}

                {filteredProviders.length === 0 && (
                  <Text className="text-center text-gray-500 py-8 italic">
                    No providers found for this category.
                  </Text>
                )}
              </>
            )}

            {/* MANUAL CONFIG */}
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
                  selectedId === "manual" ? activeColor : theme.cardBorder,
                borderWidth: selectedId === "manual" ? 2 : 1,
              }}
              onPress={() => handleSelect("manual")}
              activeOpacity={0.9}
            >
              <View className="flex-row items-center mb-1">
                <View className="w-11 h-11 rounded-lg justify-center items-center mr-4 bg-[#222]">
                  <MaterialIcons
                    name="edit"
                    size={scaledSize(20)}
                    color="#fff"
                  />
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
                  <View
                    className="w-6 h-6 rounded-full justify-center items-center"
                    style={{ backgroundColor: activeColor }}
                  >
                    <MaterialIcons
                      name="check"
                      size={scaledSize(16)}
                      color="#000"
                    />
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
                      backgroundColor: theme.buttonNeutral,
                      borderColor: realtimeError
                        ? dangerColor
                        : theme.cardBorder,
                    }}
                  >
                    <Text
                      className="text-lg font-bold mr-2"
                      style={{ color: theme.text }}
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
                      onChangeText={handleManualRateChange}
                    />
                  </View>
                  {realtimeError && (
                    <Text
                      className="text-xs mt-2 font-medium ml-1"
                      style={{ color: dangerColor }}
                    >
                      {realtimeError}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-8 h-12 rounded-2xl overflow-hidden"
              onPress={handleConfirm}
              disabled={isButtonDisabled}
              style={{ opacity: isButtonDisabled ? 0.5 : 1 }}
            >
              <View
                className="flex-1 justify-center items-center"
                style={{ backgroundColor: activeColor }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-sm uppercase tracking-wider">
                    Confirm Selection
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- HELPER COMPONENT ---
function ProviderCard({
  item,
  isSelected,
  onPress,
  theme,
  isDarkMode,
  activeColor,
  scaledSize,
}) {
  // Attempt to match provider name to local image
  // It handles "Meralco" -> "meralco" and "Visayan Electric (VECO)" -> "visayan" (via split)
  const normalizedName = item.provider_name.toLowerCase();

  // Try full name key first, then first word key
  let localImage = PROVIDER_LOGOS[normalizedName];
  if (!localImage) {
    // Split by space or '(' to get the first significant word (e.g. "Visayan" from "Visayan Electric")
    const firstWord = normalizedName.split(/[\s(]/)[0];
    localImage = PROVIDER_LOGOS[firstWord];
  }

  return (
    <TouchableOpacity
      className="flex-row items-center p-4 rounded-2xl border mb-3"
      style={{
        backgroundColor: theme.card,
        borderColor: isSelected ? activeColor : theme.cardBorder,
        borderWidth: isSelected ? 2 : 1,
        ...(isSelected && {
          backgroundColor: isDarkMode
            ? "rgba(0, 255, 153, 0.1)"
            : "rgba(0, 166, 81, 0.05)",
        }),
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 rounded-xl justify-center items-center mr-4 bg-white overflow-hidden p-1 border border-gray-100">
        {localImage ? (
          <Image
            source={localImage}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
        ) : (
          <MaterialIcons name="business" size={24} color="#888" />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-sm font-bold mb-1" style={{ color: theme.text }}>
          {item.provider_name}
        </Text>
        <Text className="text-xs" style={{ color: theme.textSecondary }}>
          Rate:{" "}
          <Text className="font-semibold" style={{ color: activeColor }}>
            ₱ {item.rate_per_kwh} / kWh
          </Text>
        </Text>
      </View>

      {isSelected && (
        <View
          className="w-6 h-6 rounded-full justify-center items-center ml-2"
          style={{ backgroundColor: activeColor }}
        >
          <MaterialIcons name="check" size={16} color="#000" />
        </View>
      )}
    </TouchableOpacity>
  );
}
