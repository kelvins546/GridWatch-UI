import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

export default function SimpleHomeScreen() {
  const { theme, isDarkMode, fontScale } = useTheme();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [billData, setBillData] = useState({
    currentBill: 0,
    budgetLimit: 0,
    status: "Good",
    activeDevicesCount: 0,
  });
  const [realHubs, setRealHubs] = useState([]);
  const [userRate, setUserRate] = useState(12.0);

  const scaledSize = (size) => size * (fontScale || 1);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();

      const { data: userData } = await supabase
        .from("users")
        .select("monthly_budget, custom_rate, utility_rates(rate_per_kwh)")
        .eq("id", user.id)
        .single();

      let rate = 12.0;
      let budget = 2000;

      if (userData) {
        budget = userData.monthly_budget || 2000;
        if (userData.custom_rate) rate = userData.custom_rate;
        else if (userData.utility_rates?.rate_per_kwh)
          rate = userData.utility_rates.rate_per_kwh;
      }
      setUserRate(rate);

      const { data: usageData } = await supabase
        .from("usage_analytics")
        .select("cost_incurred")
        .eq("user_id", user.id)
        .gte("date", startOfMonth);

      const totalBill =
        usageData?.reduce((sum, row) => sum + (row.cost_incurred || 0), 0) || 0;

      const { data: hubsData } = await supabase
        .from("hubs")
        .select("*, devices(*)")
        .eq("user_id", user.id);

      let totalActiveDevices = 0;
      const processedHubs = (hubsData || []).map((hub) => {
        let isOnline = false;
        if (hub.last_seen) {
          const lastSeenDate = new Date(hub.last_seen);
          const diffSeconds = (Date.now() - lastSeenDate.getTime()) / 1000;
          isOnline = diffSeconds < 90;
        }

        const activeDevs = (hub.devices || []).filter((d) => d.status === "on");
        const activeCount = activeDevs.length;
        if (isOnline) totalActiveDevices += activeCount;

        const totalWatts = activeDevs.reduce(
          (sum, d) => sum + (d.current_power_watts || 0),
          0,
        );
        const costPerHour = (totalWatts / 1000) * rate;

        return {
          id: hub.id,
          name: hub.name,
          status: isOnline ? "ONLINE" : "OFFLINE",
          active: isOnline ? activeCount : 0,
          totalCost: isOnline
            ? `₱ ${costPerHour.toFixed(2)} / hr`
            : "₱ 0.00 / hr",
          icon: "router",
        };
      });

      setRealHubs(processedHubs);
      setBillData({
        currentBill: totalBill,
        budgetLimit: budget,
        activeDevicesCount: totalActiveDevices,
      });
    } catch (error) {
      console.error("Error fetching simple home:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const percentage =
    billData.budgetLimit > 0
      ? Math.min((billData.currentBill / billData.budgetLimit) * 100, 100)
      : 0;

  let statusColor = isDarkMode ? theme.buttonPrimary : "#00995e";
  let statusText = "You are on track.";

  if (percentage >= 90) {
    statusColor = theme.buttonDangerText;
    statusText = "Budget limit reached!";
  } else if (percentage >= 75) {
    statusColor = isDarkMode ? "#ffaa00" : "#ff9900";
    statusText = "Approaching budget limit.";
  }

  if (isLoading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: theme.background }}
      >
        <ActivityIndicator size="large" color="#B0B0B0" />
        <Text
          style={{
            marginTop: 20,
            color: "#B0B0B0",
            fontSize: 12,
            textAlign: "center",
            width: "100%",
            fontFamily: theme.fontRegular,
          }}
        >
          Syncing GridWatch...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingVertical: 20,
          backgroundColor: theme.background,
        }}
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
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.textSecondary}
            colors={[theme.buttonPrimary]}
          />
        }
      >
        <View style={{ paddingHorizontal: 24 }}>
          {}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("SimpleBudgetManager")}
          >
            <View
              style={{
                width: "100%",
                borderRadius: 24,
                padding: 24,
                marginBottom: 32,
                borderWidth: 1,
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                marginTop: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginRight: 8,
                      backgroundColor: statusColor,
                    }}
                  />
                  <Text
                    style={{
                      fontWeight: "500",
                      color: theme.textSecondary,
                      fontSize: scaledSize(12),
                    }}
                  >
                    Current Bill (This Month)
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={scaledSize(20)}
                  color={theme.textSecondary}
                />
              </View>

              <Text
                style={{
                  fontWeight: "900",
                  textAlign: "center",
                  marginBottom: 4,
                  color: theme.text,
                  fontSize: scaledSize(42),
                }}
              >
                ₱{" "}
                {billData.currentBill.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>

              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "500",
                  marginBottom: 24,
                  color: statusColor,
                  fontSize: scaledSize(14),
                }}
              >
                {statusText}
              </Text>

              <View
                style={{
                  width: "100%",
                  height: 16,
                  backgroundColor: isDarkMode ? "#27272a" : "#f4f4f5",
                  borderRadius: 9999,
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <LinearGradient
                  colors={[statusColor, statusColor]}
                  style={{ width: `${percentage}%`, height: "100%" }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 10 }}>
                  {billData.activeDevicesCount} Active Devices
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 10 }}>
                  Limit: ₱ {billData.budgetLimit.toLocaleString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {}
          <Text
            style={{
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 16,
              color: theme.textSecondary,
              fontSize: scaledSize(11),
            }}
          >
            My Rooms & Usage
          </Text>

          <View style={{ gap: 12 }}>
            {realHubs.length > 0 ? (
              realHubs.map((hub) => {
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
                        hubId: hub.id,
                      })
                    }
                    activeOpacity={0.8}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 1,
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 16,
                        backgroundColor: theme.buttonNeutral,
                      }}
                    >
                      <MaterialIcons
                        name={hub.icon}
                        size={scaledSize(24)}
                        color={
                          isOnline ? theme.buttonPrimary : theme.textSecondary
                        }
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontWeight: "bold",
                          marginBottom: 6,
                          color: theme.text,
                          fontSize: scaledSize(16),
                        }}
                      >
                        {hub.name}
                      </Text>

                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <View
                          style={{
                            borderRadius: 4,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: badgeBg,
                            paddingHorizontal: scaledSize(6),
                            paddingVertical: scaledSize(2),
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "bold",
                              color: badgeText,
                              fontSize: scaledSize(9),
                            }}
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

                    <View style={{ alignItems: "flex-end", marginRight: 8 }}>
                      <Text
                        style={{
                          fontWeight: "bold",
                          color: theme.text,
                          fontSize: scaledSize(14),
                        }}
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
              })
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Text style={{ color: theme.textSecondary }}>
                  No hubs found. Add one to see usage here.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => navigation.navigate("SetupHub")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.textSecondary,
                borderStyle: "dashed",
                marginTop: 8,
              }}
            >
              <MaterialIcons
                name="add"
                size={scaledSize(20)}
                color={theme.textSecondary}
              />
              <Text
                style={{
                  marginLeft: 8,
                  fontWeight: "bold",
                  color: theme.textSecondary,
                  fontSize: scaledSize(14),
                }}
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
