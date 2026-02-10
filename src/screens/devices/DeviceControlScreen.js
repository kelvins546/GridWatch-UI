import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Platform,
  StyleSheet,
  UIManager,
  LayoutAnimation,
  ActivityIndicator,
  Animated,
  Easing,
  RefreshControl,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- STATIC IMAGE MAPPING ---
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

// --- HELPER: FORMAT TIME 24h -> 12h ---
const formatTime12h = (time24) => {
  if (!time24) return "--:--";
  const [h, m] = time24.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
};

export default function DeviceControlScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, fontScale, isDarkMode } = useTheme();
  const scaledSize = (size) => size * fontScale;

  // 1. GET THE ID FROM PARAMS
  const {
    deviceName,
    status: initialStatus,
    deviceId: paramDeviceId,
  } = route.params || {
    deviceName: "Smart Socket",
    status: "off",
    deviceId: null,
  };

  const checkIsOn = (status) => {
    if (!status) return false;
    return status.toString().toLowerCase() === "on";
  };

  // --- STATE ---
  const [isPowered, setIsPowered] = useState(checkIsOn(initialStatus));
  const [currentWatts, setCurrentWatts] = useState(0);
  const [currentVoltage, setCurrentVoltage] = useState(220);
  const [electricityRate, setElectricityRate] = useState(12);
  const [providerName, setProviderName] = useState(null);

  // Runtime & Historical Data State
  const [dbRuntimeMinutes, setDbRuntimeMinutes] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(0); // Live counter
  const [todayCost, setTodayCost] = useState(0);

  const [deviceId, setDeviceId] = useState(paramDeviceId);
  const [hubId, setHubId] = useState(null);
  const [hubLastSeen, setHubLastSeen] = useState(null);
  const [now, setNow] = useState(Date.now());

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  // --- SCHEDULE STATE ---
  const [schedules, setSchedules] = useState([
    {
      id: "1",
      time: "22:00",
      days: [true, true, true, true, true, true, true],
      action: false,
      active: true,
    },
  ]);

  const [schedHour, setSchedHour] = useState("07");
  const [schedMinute, setSchedMinute] = useState("00");
  const [schedAmPm, setSchedAmPm] = useState("AM");

  const [selectedDays, setSelectedDays] = useState(Array(7).fill(true));
  const [isActionOn, setIsActionOn] = useState(true);

  // --- DERIVED VALUES ---
  // Online/Offline Check
  const checkHubOnline = () => {
    if (!hubLastSeen) return false;
    let timeStr = hubLastSeen.replace(" ", "T");
    if (!timeStr.endsWith("Z") && !timeStr.includes("+")) timeStr += "Z";
    const lastSeenMs = new Date(timeStr).getTime();
    if (isNaN(lastSeenMs)) return false;
    const diffInSeconds = (now - lastSeenMs) / 1000;
    return diffInSeconds < 15;
  };

  const isHubOnline = checkHubOnline();
  const displayWatts = isHubOnline ? currentWatts : 0;
  const displayVolts = isHubOnline ? `${currentVoltage.toFixed(1)} V` : "0 V";

  // Calculate cost per hour based on current watts and rate
  const estCostPerHour = (displayWatts / 1000) * electricityRate;

  // --- LIVE RUNTIME TIMER ---
  // Updates local session duration
  useEffect(() => {
    let interval;
    if (isPowered) {
      interval = setInterval(() => {
        setSessionMinutes((prev) => prev + 1 / 60);
      }, 1000);
    } else {
      setSessionMinutes(0);
    }
    return () => clearInterval(interval);
  }, [isPowered]);

  // --- ANIMATION REFS ---
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // --- PULSE ANIMATION ---
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  // --- FETCH DATA ---
  const fetchDeviceData = async (isRefetch = false) => {
    if (isRefetch) setRefreshing(true);
    else setIsLoading(true);

    try {
      let targetId = deviceId;

      const selectQuery = `
        *,
        hubs(id, last_seen, current_voltage),
        users (
            id,
            custom_rate,
            utility_rates!users_provider_id_fkey ( 
                rate_per_kwh,
                provider_name 
            )
        )
      `;

      let data, error;

      if (!targetId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const response = await supabase
          .from("devices")
          .select(selectQuery)
          .eq("user_id", user.id)
          .eq("name", deviceName)
          .single();

        data = response.data;
        error = response.error;
      } else {
        const response = await supabase
          .from("devices")
          .select(selectQuery)
          .eq("id", targetId)
          .single();

        data = response.data;
        error = response.error;
      }

      if (error) throw error;

      if (data) {
        if (!targetId) setDeviceId(data.id);

        setIsPowered(checkIsOn(data.status));
        setCurrentWatts(data.current_power_watts || 0);
        setHubId(data.hub_id);
        setHubLastSeen(data.hubs?.last_seen);
        if (data.hubs?.current_voltage) {
          setCurrentVoltage(data.hubs.current_voltage);
        }

        let finalRate = 12;
        let finalProviderName = null;
        const owner = data.users;

        if (owner) {
          if (owner.custom_rate !== null && owner.custom_rate > 0) {
            finalRate = owner.custom_rate;
            finalProviderName = "Manual";
          } else if (owner.utility_rates?.rate_per_kwh) {
            finalRate = owner.utility_rates.rate_per_kwh;
            finalProviderName = owner.utility_rates.provider_name;
          }
        }
        setElectricityRate(finalRate);
        setProviderName(finalProviderName);

        // --- FETCH HISTORICAL DATA ---
        const dateNow = new Date();
        const year = dateNow.getFullYear();
        const month = String(dateNow.getMonth() + 1).padStart(2, "0");
        const day = String(dateNow.getDate()).padStart(2, "0");
        const todayStr = `${year}-${month}-${day}`;

        const { data: usageData, error: usageError } = await supabase
          .from("usage_analytics")
          .select("duration_minutes, cost_incurred")
          .eq("device_id", data.id)
          .eq("date", todayStr);

        if (!usageError && usageData) {
          const totalMins = usageData.reduce(
            (sum, item) => sum + (item.duration_minutes || 0),
            0,
          );
          const totalCostVal = usageData.reduce(
            (sum, item) => sum + (item.cost_incurred || 0),
            0,
          );

          setDbRuntimeMinutes(totalMins);
          setTodayCost(totalCostVal);
        }
      }

      setNow(Date.now());
    } catch (error) {
      console.log("Error fetching device:", error.message);
    } finally {
      if (isRefetch) setRefreshing(false);
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDeviceData();
    }, [deviceId]),
  );

  const getProviderLogo = (name) => {
    if (!name) return null;
    const normalizedName = name.toLowerCase();
    let localImage = PROVIDER_LOGOS[normalizedName];
    if (!localImage) {
      const firstWord = normalizedName.split(/[\s(]/)[0];
      localImage = PROVIDER_LOGOS[firstWord];
    }
    return localImage;
  };

  const providerLogoSource = getProviderLogo(providerName);

  const getRuntimeString = () => {
    if (!isHubOnline) return "---";
    const totalMinutes = dbRuntimeMinutes + sessionMinutes;
    if (totalMinutes < 1 && isPowered) return "< 1m Today";
    if (totalMinutes < 1) return "0m Today";
    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    if (h > 0) return `${h}h ${m}m Today`;
    return `${m}m Today`;
  };

  // --- REALTIME SUBSCRIPTIONS ---
  useEffect(() => {
    let deviceSub;
    let hubSub;
    let usageSub; // <--- NEW LISTENER FOR COST
    let mounted = true;

    if (deviceId) {
      // 1. Device Status Changes
      deviceSub = supabase
        .channel(`device_control_${deviceId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "devices",
            filter: `id=eq.${deviceId}`,
          },
          (payload) => {
            if (mounted && payload.new) {
              if (
                payload.new.status &&
                payload.new.status !== payload.old.status
              ) {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setIsPowered(checkIsOn(payload.new.status));
              } else if (payload.new.status) {
                setIsPowered(checkIsOn(payload.new.status));
              }

              if (payload.new.current_power_watts !== undefined) {
                setCurrentWatts(payload.new.current_power_watts);
              }
            }
          },
        )
        .subscribe();

      // 2. Usage/Cost Updates (From ESP32)
      usageSub = supabase
        .channel(`usage_tracking_${deviceId}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Listen for INSERT and UPDATE
            schema: "public",
            table: "usage_analytics",
            filter: `device_id=eq.${deviceId}`,
          },
          (payload) => {
            // When DB updates, fetch the fresh total cost
            if (mounted) fetchDeviceData();
          },
        )
        .subscribe();
    }

    if (hubId) {
      hubSub = supabase
        .channel(`hub_heartbeat_${hubId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "hubs",
            filter: `id=eq.${hubId}`,
          },
          (payload) => {
            if (mounted && payload.new) {
              if (payload.new.last_seen) setHubLastSeen(payload.new.last_seen);
              if (payload.new.current_voltage !== undefined) {
                setCurrentVoltage(payload.new.current_voltage);
              }
              setNow(Date.now());
            }
          },
        )
        .subscribe();
    }

    const timer = setInterval(() => {
      if (mounted) setNow(Date.now());
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(timer);
      if (deviceSub) supabase.removeChannel(deviceSub);
      if (hubSub) supabase.removeChannel(hubSub);
      if (usageSub) supabase.removeChannel(usageSub);
    };
  }, [deviceId, hubId]);

  const confirmToggle = async () => {
    if (!deviceId) return;
    if (!isHubOnline) {
      alert("Hub is offline. Cannot control device.");
      return;
    }
    setShowConfirm(false);
    setIsToggling(true);
    const newStatus = isPowered ? "off" : "on";
    try {
      const { error } = await supabase
        .from("devices")
        .update({ status: newStatus })
        .eq("id", deviceId);
      if (error) throw error;
      setIsPowered(!isPowered);
      if (newStatus === "off") setCurrentWatts(0);
    } catch (error) {
      console.error("Error toggling device:", error);
      alert("Failed to toggle device");
    } finally {
      setIsToggling(false);
    }
  };

  const statusIcon = isHubOnline
    ? isPowered
      ? "power"
      : "power-off"
    : "wifi-off";
  const statusTitle = isHubOnline
    ? isPowered
      ? "Power ON"
      : "Standby"
    : "Hub Offline";
  const statusSubtitle = isHubOnline
    ? `${deviceName} is ${isPowered ? "running" : "idle"}`
    : "Device unreachable";

  const gradientColors = !isHubOnline
    ? ["#666666", theme.background]
    : isPowered
      ? [theme.buttonPrimary, theme.background]
      : isDarkMode
        ? ["#2c3e50", theme.background]
        : ["#94a3b8", theme.background];

  const activeColor = !isHubOnline ? "#666" : theme.buttonPrimary;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    headerOverlay: {
      position: "absolute",
      top: Platform.OS === "android" ? 40 : 60,
      left: 24,
      right: 24,
      zIndex: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    heroContainer: {
      paddingTop: 110,
      paddingBottom: 25,
      alignItems: "center",
    },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
    },
    detailLabel: { color: theme.textSecondary, fontSize: scaledSize(13) },
    detailValue: {
      color: theme.text,
      fontSize: scaledSize(15),
      fontWeight: "600",
    },
    powerBtn: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 4,
      borderColor:
        isPowered && isHubOnline ? `${activeColor}40` : theme.cardBorder,
      backgroundColor: isPowered && isHubOnline ? activeColor : theme.card,
      shadowColor: isPowered && isHubOnline ? activeColor : "#000",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isPowered && isHubOnline ? 0.6 : 0.1,
      shadowRadius: 20,
      elevation: 10,
      opacity: isHubOnline ? 1 : 0.5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      borderWidth: 1,
      padding: 20,
      borderRadius: 16,
      width: 288,
      alignItems: "center",
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
    },
    modalTitle: {
      fontWeight: "bold",
      marginBottom: 8,
      textAlign: "center",
      color: theme.text,
      fontSize: scaledSize(18),
    },
    modalBody: {
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 20,
      color: theme.textSecondary,
      fontSize: scaledSize(12),
    },
    modalBtnRow: { flexDirection: "row", gap: 10, width: "100%" },
    modalBtnCancel: {
      flex: 1,
      borderRadius: 12,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.textSecondary,
    },
    modalBtnConfirm: {
      flex: 1,
      borderRadius: 12,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    modalBtnText: { fontWeight: "bold", fontSize: scaledSize(12) },
    loaderOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 50,
    },
    loaderText: {
      color: "#fff",
      marginTop: 16,
      fontSize: scaledSize(14),
      fontWeight: "600",
    },
  });

  const toggleDay = (index) => {
    const newDays = [...selectedDays];
    newDays[index] = !newDays[index];
    setSelectedDays(newDays);
  };

  const saveSchedule = () => {
    let h = parseInt(schedHour, 10);
    const m = schedMinute;
    if (schedAmPm === "PM" && h < 12) h += 12;
    if (schedAmPm === "AM" && h === 12) h = 0;
    const hStr = h.toString().padStart(2, "0");
    const mStr = m.toString().padStart(2, "0");
    const time24 = `${hStr}:${mStr}`;
    const newSchedule = {
      id: Date.now().toString(),
      time: time24,
      days: selectedDays,
      action: isActionOn,
      active: true,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSchedules([...schedules, newSchedule]);
    setShowSchedule(false);
  };

  const toggleScheduleActive = (id) => {
    setSchedules((current) =>
      current.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="gray" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <View style={styles.headerOverlay}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("MainApp");
            }
          }}
          style={{
            padding: 4,
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: 20,
          }}
        >
          <MaterialIcons name="arrow-back" size={scaledSize(24)} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            padding: 4,
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: 20,
          }}
        >
          <MaterialIcons name="settings" size={scaledSize(24)} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDeviceData(true)}
            tintColor={theme.textSecondary}
            colors={[theme.buttonPrimary]}
          />
        }
      >
        <LinearGradient colors={gradientColors} style={styles.heroContainer}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "rgba(0,0,0,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            {isHubOnline && (
              <Animated.View
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.5)",
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                }}
              />
            )}
            <MaterialIcons name={statusIcon} size={40} color="#fff" />
          </View>
          <Text
            style={{
              fontSize: scaledSize(28),
              fontWeight: "bold",
              color: isDarkMode
                ? "#fff"
                : isPowered || !isHubOnline
                  ? "#fff"
                  : theme.text,
              marginBottom: 2,
            }}
          >
            {statusTitle}
          </Text>
          <Text
            style={{
              fontSize: scaledSize(14),
              color: isDarkMode
                ? "rgba(255,255,255,0.7)"
                : isPowered || !isHubOnline
                  ? "rgba(255,255,255,0.9)"
                  : theme.textSecondary,
            }}
          >
            {statusSubtitle}
          </Text>
        </LinearGradient>

        <View style={{ padding: 24 }}>
          <View style={styles.card}>
            <Text
              style={[
                styles.detailLabel,
                {
                  marginBottom: 12,
                  fontWeight: "bold",
                  textTransform: "uppercase",
                },
              ]}
            >
              Real-time Metrics
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View>
                <Text style={styles.detailLabel}>Current Load</Text>
                <Text style={styles.detailValue}>
                  {displayWatts.toFixed(1)} W
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.detailLabel}>Voltage</Text>
                <Text style={styles.detailValue}>{displayVolts}</Text>
              </View>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: theme.cardBorder,
                marginVertical: 12,
              }}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View>
                <Text style={styles.detailLabel}>Est. Cost/Hr</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color: isHubOnline
                        ? theme.buttonPrimary
                        : theme.textSecondary,
                    },
                  ]}
                >
                  ₱ {estCostPerHour.toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("ProviderSetup")}
                style={{ alignItems: "flex-end" }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  {providerLogoSource && (
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: "#fff",
                        borderRadius: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: "#eee",
                      }}
                    >
                      <Image
                        source={providerLogoSource}
                        style={{ width: "80%", height: "80%" }}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  <Text style={styles.detailLabel}>Rate</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={14}
                    color={theme.textSecondary}
                  />
                </View>
                <Text style={styles.detailValue}>
                  ₱ {electricityRate.toFixed(2)}/kWh
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 30 }}>
            <View
              style={[
                styles.card,
                { flex: 1, marginBottom: 0, alignItems: "center" },
              ]}
            >
              <MaterialIcons
                name="timer"
                size={20}
                color={theme.textSecondary}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.detailLabel}>Runtime</Text>
              <Text style={styles.detailValue}>{getRuntimeString()}</Text>
            </View>
            <View
              style={[
                styles.card,
                { flex: 1, marginBottom: 0, alignItems: "center" },
              ]}
            >
              <MaterialIcons
                name="attach-money"
                size={20}
                color={theme.textSecondary}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.detailLabel}>Today's Cost</Text>
              <Text style={styles.detailValue}>₱ {todayCost.toFixed(4)}</Text>
            </View>
          </View>

          <View style={{ alignItems: "center", marginBottom: 30 }}>
            <TouchableOpacity
              style={styles.powerBtn}
              onPress={() => setShowConfirm(true)}
              activeOpacity={0.9}
              disabled={!isHubOnline}
            >
              <MaterialIcons
                name="power-settings-new"
                size={40}
                color={isPowered && isHubOnline ? "#fff" : theme.textSecondary}
              />
            </TouchableOpacity>
            <Text
              style={{
                marginTop: 12,
                fontSize: scaledSize(12),
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: theme.textSecondary,
              }}
            >
              {!isHubOnline
                ? "Controls Unavailable"
                : isPowered
                  ? "Tap to Cut Power"
                  : "Tap to Restore Power"}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: scaledSize(12),
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: 1,
                color: theme.textSecondary,
              }}
            >
              Upcoming Schedules
            </Text>
            <TouchableOpacity onPress={() => setShowSchedule(true)}>
              <Text
                style={{
                  color: theme.buttonPrimary,
                  fontWeight: "bold",
                  fontSize: scaledSize(12),
                }}
              >
                + Add New
              </Text>
            </TouchableOpacity>
          </View>

          {schedules.map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  marginBottom: 10,
                  padding: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              ]}
            >
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <MaterialIcons
                    name="schedule"
                    size={16}
                    color={theme.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: scaledSize(18),
                      fontWeight: "bold",
                      color: theme.text,
                    }}
                  >
                    {formatTime12h(item.time)}
                  </Text>
                </View>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  {item.action ? "Auto-ON" : "Auto-OFF"} •{" "}
                  {item.days.every((d) => d) ? "Everyday" : "Custom"}
                </Text>
              </View>
              <CustomSwitch
                value={item.active}
                onToggle={() => toggleScheduleActive(item.id)}
                theme={theme}
              />
            </View>
          ))}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* MODAL: POWER CONFIRM */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {isPowered ? "Turn Off Device?" : "Restore Power?"}
            </Text>
            <Text style={styles.modalBody}>
              {isPowered
                ? "This will physically cut power to the outlet immediately."
                : "This will reactivate the outlet relay and resume power flow."}
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnConfirm,
                  {
                    backgroundColor: isPowered
                      ? theme.buttonDangerText
                      : theme.buttonPrimary,
                  },
                ]}
                onPress={confirmToggle}
              >
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                    Confirm
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: SCHEDULE */}
      <Modal
        visible={showSchedule}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Schedule</Text>

            <View
              style={{
                marginBottom: 20,
                width: "100%",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TextInput
                style={{
                  fontSize: scaledSize(32),
                  fontWeight: "bold",
                  color: theme.text,
                  textAlign: "center",
                  borderBottomWidth: 1,
                  borderBottomColor: theme.cardBorder,
                  paddingBottom: 8,
                  minWidth: 50,
                }}
                value={schedHour}
                onChangeText={(t) => {
                  const clean = t.replace(/[^0-9]/g, "");
                  if (parseInt(clean) > 12) return;
                  setSchedHour(clean);
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="07"
                placeholderTextColor={theme.textSecondary}
              />

              <Text
                style={{
                  fontSize: scaledSize(32),
                  fontWeight: "bold",
                  color: theme.text,
                  marginHorizontal: 5,
                  paddingBottom: 8,
                }}
              >
                :
              </Text>

              <TextInput
                style={{
                  fontSize: scaledSize(32),
                  fontWeight: "bold",
                  color: theme.text,
                  textAlign: "center",
                  borderBottomWidth: 1,
                  borderBottomColor: theme.cardBorder,
                  paddingBottom: 8,
                  minWidth: 50,
                }}
                value={schedMinute}
                onChangeText={(t) => {
                  const clean = t.replace(/[^0-9]/g, "");
                  if (parseInt(clean) > 59) return;
                  setSchedMinute(clean);
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="00"
                placeholderTextColor={theme.textSecondary}
              />

              <TouchableOpacity
                onPress={() => setSchedAmPm((p) => (p === "AM" ? "PM" : "AM"))}
                style={{
                  marginLeft: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: theme.buttonNeutral,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: scaledSize(16),
                    fontWeight: "bold",
                    color: theme.buttonPrimary,
                  }}
                >
                  {schedAmPm}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                marginBottom: 24,
              }}
            >
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleDay(index)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: selectedDays[index]
                      ? theme.buttonPrimary
                      : theme.background,
                    borderWidth: selectedDays[index] ? 0 : 1,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "bold",
                      color: selectedDays[index] ? "#fff" : theme.textSecondary,
                    }}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: 12,
                borderRadius: 12,
                backgroundColor: theme.background,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                marginBottom: 24,
              }}
              onPress={() => setIsActionOn(!isActionOn)}
            >
              <Text
                style={{
                  color: theme.text,
                  fontWeight: "500",
                  fontSize: scaledSize(12),
                }}
              >
                Action:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {isActionOn ? "Turn ON" : "Turn OFF"}
                </Text>
              </Text>
              <CustomSwitch
                value={isActionOn}
                onToggle={() => setIsActionOn(!isActionOn)}
                theme={theme}
              />
            </TouchableOpacity>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowSchedule(false)}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnConfirm,
                  { backgroundColor: theme.buttonPrimary },
                ]}
                onPress={saveSchedule}
              >
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                    Save
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isToggling && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="gray" />
          <Text style={styles.loaderText}>
            {isPowered ? "Turning Off..." : "Turning On..."}
          </Text>
        </View>
      )}
    </View>
  );
}

function CustomSwitch({ value, onToggle, theme }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      style={{
        width: 42,
        height: 26,
        borderRadius: 16,
        backgroundColor: value ? theme.buttonPrimary : theme.buttonNeutral,
        padding: 2,
        justifyContent: "center",
        alignItems: value ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 2.5,
          elevation: 2,
        }}
      />
    </TouchableOpacity>
  );
}
