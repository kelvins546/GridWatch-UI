import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

const DEMO_HUBS = [
  {
    id: 1,
    name: "Living Room Hub",
    serial_number: "HUB-8821-X9",
    wifi_ssid: "PLDT_Home_FIBR",
    last_seen: new Date().toISOString(),
    devices: [{ count: 4 }],
  },
  {
    id: 2,
    name: "Kitchen Hub",
    serial_number: "HUB-4412-Z2",
    wifi_ssid: "PLDT_Home_FIBR",
    last_seen: "2024-01-01T10:00:00Z",
    devices: [{ count: 2 }],
  },
];

export default function MyHubsScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();

  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scaledSize = (baseSize) => baseSize * (fontScale || 1);

  const fetchHubs = async () => {
    setLoading(true);
    setTimeout(() => {
      setHubs(DEMO_HUBS);
      setLoading(false);
      setRefreshing(false);
    }, 500);
  };

  useFocusEffect(
    useCallback(() => {
      fetchHubs();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHubs();
  };

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(20)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        <Text
          className="flex-1 text-center font-bold"
          style={{ color: theme.text, fontSize: scaledSize(18) }}
        >
          My Hubs
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SetupHub")}>
          <MaterialIcons name="add" size={scaledSize(28)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <View className="p-6">
          {loading ? (
            <ActivityIndicator
              size="large"
              color={theme.primary}
              style={{ marginTop: 20 }}
            />
          ) : hubs.length === 0 ? (
            <View className="items-center py-20">
              <MaterialIcons name="router" size={60} color={theme.cardBorder} />
              <Text
                className="mt-4 text-center"
                style={{ color: theme.textSecondary, fontSize: scaledSize(14) }}
              >
                No hubs connected.
              </Text>
            </View>
          ) : (
            hubs.map((hub) => (
              <HubCard
                key={hub.id}
                hub={hub}
                theme={theme}
                scaledSize={scaledSize}
                navigation={navigation}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HubCard({ hub, theme, scaledSize, navigation }) {
  let isOnline = hub.id === 1;

  const statusColor = isOnline ? theme.buttonPrimary : theme.textSecondary;
  const cardBgColor = isOnline ? `${theme.buttonPrimary}1A` : theme.card;
  const iconContainerBg = isOnline
    ? `${theme.buttonPrimary}33`
    : `${theme.textSecondary}1A`;

  return (
    <TouchableOpacity
      className="rounded-2xl p-4 mb-4 border relative"
      style={{
        backgroundColor: cardBgColor,
        borderColor: isOnline ? theme.buttonPrimary : theme.cardBorder,
        borderWidth: isOnline ? 1.5 : 1,
      }}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate("DeviceConfig", {
          hubName: hub.name,
          hubId: hub.id,
          status: isOnline ? "Online" : "Offline",
        })
      }
    >
      <View className="flex-row justify-between items-start mb-3">
        <View
          className="w-10 h-10 rounded-xl justify-center items-center"
          style={{ backgroundColor: iconContainerBg }}
        >
          <MaterialIcons
            name={isOnline ? "router" : "wifi-off"}
            size={scaledSize(24)}
            color={statusColor}
          />
        </View>

        <View className="items-end">
          <View
            className="px-2 py-1 rounded-md border mb-1"
            style={{
              backgroundColor: isOnline ? theme.buttonPrimary : "transparent",
              borderColor: statusColor,
            }}
          >
            <Text
              className="font-bold uppercase"
              style={{
                color: isOnline ? "#ffffff" : statusColor,
                fontSize: scaledSize(10),
              }}
            >
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>

          {!isOnline && (
            <Text
              className="font-medium"
              style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
            >
              Seen 2h ago
            </Text>
          )}
        </View>
      </View>

      <Text
        className="font-bold mb-1"
        style={{ color: theme.text, fontSize: scaledSize(16) }}
      >
        {hub.name}
      </Text>
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: scaledSize(11),
          marginBottom: 12,
        }}
      >
        SN: {hub.serial_number}
      </Text>

      <View
        className="flex-row border-t pt-3 mt-1"
        style={{
          borderTopColor: isOnline
            ? `${theme.buttonPrimary}33`
            : theme.cardBorder,
        }}
      >
        <StatCol
          label="SSID"
          value={hub.wifi_ssid || "---"}
          theme={theme}
          scaledSize={scaledSize}
        />
        <StatCol
          label="Signal"
          value={isOnline ? "Strong" : "None"}
          color={theme.text}
          theme={theme}
          scaledSize={scaledSize}
        />
        <StatCol
          label="Devices"
          value={`${hub.devices?.[0]?.count || 0} Linked`}
          theme={theme}
          scaledSize={scaledSize}
        />
      </View>

      <View className="absolute bottom-4 right-4">
        <MaterialIcons
          name="settings"
          size={scaledSize(20)}
          color={theme.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

function StatCol({ label, value, color, theme, scaledSize }) {
  return (
    <View className="flex-1 gap-1">
      <Text
        className="uppercase font-semibold"
        style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
      >
        {label}
      </Text>
      <Text
        className="font-medium"
        style={{ color: color || theme.text, fontSize: scaledSize(12) }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
