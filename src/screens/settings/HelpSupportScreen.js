import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function HelpSupportScreen() {
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

      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={18}
            color={theme.textSecondary}
          />
          <Text style={[styles.backText, { color: theme.textSecondary }]}>
            Settings
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Help & Support
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <MaterialIcons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            placeholder="Search for issues..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Contact Us
        </Text>
        <View style={styles.contactGrid}>
          <ContactCard
            icon="chat-bubble-outline"
            label="Live Chat"
            theme={theme}
          />
          <ContactCard icon="email" label="Email Us" theme={theme} />
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Common Issues
        </Text>
        <View style={styles.faqList}>
          <FAQItem text="How to reset the GridWatch Hub?" theme={theme} first />
          <FAQItem text='My device shows "Offline"' theme={theme} />
          <FAQItem text="Change Wi-Fi configuration" theme={theme} />
          <FAQItem text="Understanding Critical Faults" theme={theme} last />
        </View>

        <Text
          style={{
            textAlign: "center",
            marginTop: 40,
            fontSize: 11,
            color: theme.textSecondary,
          }}
        >
          App Version 2.1.0 • Build 8821{"\n"}© 2025 GridWatch Inc.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactCard({ icon, label, theme }) {
  return (
    <TouchableOpacity
      style={[
        styles.contactCard,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
    >
      <MaterialIcons
        name={icon}
        size={28}
        color={theme.primary}
        style={{ marginBottom: 10 }}
      />
      <Text style={[styles.contactLabel, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function FAQItem({ text, theme, first, last }) {
  return (
    <TouchableOpacity
      style={[
        styles.faqItem,
        { backgroundColor: theme.card, borderBottomColor: theme.cardBorder },
        first && styles.firstItem,
        last && styles.lastItem,
      ]}
    >
      <Text style={[styles.faqText, { color: theme.text }]}>{text}</Text>
      <MaterialIcons
        name="chevron-right"
        size={20}
        color={theme.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { fontSize: 14, fontWeight: "500", marginLeft: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  content: { padding: 24 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 30,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#666",
    marginBottom: 15,
    letterSpacing: 1,
  },
  contactGrid: { flexDirection: "row", gap: 15, marginBottom: 30 },
  contactCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: { fontSize: 13, fontWeight: "600" },

  faqItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  firstItem: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  lastItem: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: 0,
  },
  faqText: { fontSize: 14, fontWeight: "500" },
});
