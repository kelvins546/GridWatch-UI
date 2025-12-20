import React from "react";
import {
  View,
  Text,
  StyleSheet,
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
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View
        style={[styles.profileSection, { borderBottomColor: theme.cardBorder }]}
      >
        <LinearGradient
          colors={["#0055ff", "#00ff99"]}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.avatarText}>NA</Text>
        </LinearGradient>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>
            Natasha Alonzo
          </Text>
          <Text style={[styles.userRole, { color: theme.textSecondary }]}>
            Role: Home Admin
          </Text>
          <Text style={styles.userId}>ID: GW-2025-CAL</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.menuContent}>
        <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>
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

        <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>
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

        <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>
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
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
        <Text style={[styles.versionText, { color: theme.textSecondary }]}>
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
      style={[styles.menuItem, { borderBottomColor: theme.cardBorder }]}
      onPress={onPress}
    >
      <MaterialIcons
        name={icon}
        size={22}
        color={iconColor || theme.textSecondary}
        style={styles.menuIcon}
      />
      <Text style={[styles.menuText, { color: textColor || theme.text }]}>
        {text}
      </Text>

      {badge && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text
            style={[
              styles.badgeText,
              { color: badgeColor === "#ffaa00" ? "#1a1a1a" : "#fff" },
            ]}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: "flex-end",
    paddingBottom: 10,
  },

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomWidth: 1,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00ff99",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: "#1a1a1a" },
  userInfo: { justifyContent: "center" },
  userName: { fontSize: 18, fontWeight: "700" },
  userRole: { fontSize: 12, marginTop: 4 },
  userId: {
    fontFamily: "monospace",
    color: "#00ff99",
    fontSize: 11,
    marginTop: 4,
  },

  menuContent: { paddingHorizontal: 24, paddingVertical: 10 },
  groupTitle: {
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 25,
    marginBottom: 10,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuIcon: { marginRight: 16 },
  menuText: { flex: 1, fontSize: 15, fontWeight: "500" },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 5,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },

  footer: { padding: 24, borderTopWidth: 1, alignItems: "center" },
  versionText: { fontSize: 11 },
});
