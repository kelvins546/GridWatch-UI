import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking, // <--- 1. IMPORT LINKING
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Ticket State
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonIssues = [
    {
      id: 1,
      title: "How to reset the GridWatch Hub?",
      answer:
        "Locate the small physical button on the side of your Hub. Press and hold it for 10 seconds until the LED indicator flashes red. This will factory reset the device and you will need to pair it again.",
    },
    {
      id: 2,
      title: 'My device shows "Offline"',
      answer:
        "This usually means the Hub lost its Wi-Fi connection or power. \n\n1. Check if the Hub is plugged in.\n2. Ensure your home Wi-Fi is working.\n3. Try unplugging the Hub and plugging it back in to reboot it.",
    },
    {
      id: 3,
      title: "Change Wi-Fi configuration",
      answer:
        "To update Wi-Fi, go to the 'My Hubs' screen, select your Hub, and tap the 'Network Connection' setting. You will need to be near the Hub to reconnect it via Bluetooth/Hotspot mode.",
    },
    {
      id: 4,
      title: "Understanding Critical Faults",
      answer:
        "If you receive a 'Short Circuit' or 'Overload' alert, GridWatch has automatically cut power to prevent fire hazards. Please inspect your appliance for damage before attempting to turn the outlet back on.",
    },
    {
      id: 5,
      title: "Why is my cost calculation wrong?",
      answer:
        "Ensure you have selected the correct Utility Provider in Settings. If you chose 'Manual Configuration', double-check that the ₱/kWh rate matches your latest electricity bill.",
    },
  ];

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSubmitTicket = () => {
    if (!subject || !message) {
      Alert.alert(
        "Missing Info",
        "Please fill in both the subject and description."
      );
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setTicketModalVisible(false);
      setSubject("");
      setMessage("");
      Alert.alert(
        "Ticket Submitted",
        "Your support ticket #8821 has been created. We will contact you shortly."
      );
    }, 2000);
  };

  // 2. FUNCTION TO OPEN EMAIL APP
  const handleEmailSupport = () => {
    const email = "support@gridwatch.com"; // Replace with your support email
    const emailSubject = "GridWatch Support Request";
    const body = "Please describe your issue here...";

    // Create mailto link
    const url = `mailto:${email}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(body)}`;

    Linking.openURL(url).catch((err) => {
      console.error("Error opening email app:", err);
      Alert.alert("Error", "Could not open email client.");
    });
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <StatusBar barStyle={theme.statusBarStyle} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: theme.text }}>
          Help & Support
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView>
        <View className="px-6 py-6">
          {/* Search Bar */}
          <View
            className="flex-row items-center rounded-2xl px-4 py-3 mb-8"
            style={{ backgroundColor: theme.card }}
          >
            <MaterialIcons
              name="search"
              size={24}
              color={theme.textSecondary}
            />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: theme.text }}
              placeholder="Search for issues..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Contact Us Section */}
          <Text
            className="text-xs font-bold uppercase mb-4 tracking-widest"
            style={{ color: theme.textSecondary }}
          >
            Contact Us
          </Text>

          <View className="flex-row gap-4 mb-8">
            {/* Submit Ticket Button */}
            <TouchableOpacity
              className="flex-1 p-6 rounded-3xl items-center justify-center gap-3"
              style={{ backgroundColor: theme.card }}
              onPress={() => setTicketModalVisible(true)}
            >
              <MaterialIcons name="assignment" size={28} color="#00ff99" />
              <Text className="font-bold text-sm" style={{ color: theme.text }}>
                Submit Ticket
              </Text>
            </TouchableOpacity>

            {/* Email Us Button - UPDATED ONPRESS */}
            <TouchableOpacity
              className="flex-1 p-6 rounded-3xl items-center justify-center gap-3"
              style={{ backgroundColor: theme.card }}
              onPress={handleEmailSupport}
            >
              <MaterialIcons name="mail-outline" size={28} color="#00ff99" />
              <Text className="font-bold text-sm" style={{ color: theme.text }}>
                Email Us
              </Text>
            </TouchableOpacity>
          </View>

          {/* Common Issues Section */}
          <Text
            className="text-xs font-bold uppercase mb-4 tracking-widest"
            style={{ color: theme.textSecondary }}
          >
            Common Issues
          </Text>

          <View
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: theme.card }}
          >
            {commonIssues.map((issue, index) => {
              const isExpanded = expandedId === issue.id;
              return (
                <View
                  key={issue.id}
                  style={{
                    borderBottomWidth:
                      index !== commonIssues.length - 1 ? 1 : 0,
                    borderBottomColor: theme.cardBorder,
                  }}
                >
                  <TouchableOpacity
                    className="flex-row items-center justify-between p-5"
                    onPress={() => toggleExpand(issue.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className="font-semibold text-sm flex-1 mr-4"
                      style={{ color: theme.text }}
                    >
                      {issue.title}
                    </Text>
                    <MaterialIcons
                      name={isExpanded ? "keyboard-arrow-up" : "chevron-right"}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>

                  {/* Expanded Answer */}
                  {isExpanded && (
                    <View className="px-5 pb-5">
                      <Text
                        className="text-sm leading-6"
                        style={{ color: theme.textSecondary }}
                      >
                        {issue.answer}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <Text
            className="text-center text-xs mt-10 opacity-50 mb-10"
            style={{ color: theme.textSecondary }}
          >
            App Version 2.1.0 • Build 8821{"\n"}© 2025 GridWatch Inc.
          </Text>
        </View>
      </ScrollView>

      {/* SUBMIT TICKET MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={ticketModalVisible}
        onRequestClose={() => setTicketModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          {/* Overlay */}
          <TouchableOpacity
            className="absolute inset-0 bg-black/80"
            activeOpacity={1}
            onPress={() => setTicketModalVisible(false)}
          />

          {/* Modal Content */}
          <View
            className="rounded-t-3xl p-6 h-3/4"
            style={{ backgroundColor: theme.background }}
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1.5 rounded-full bg-gray-600 mb-4" />
              <Text className="text-xl font-bold" style={{ color: theme.text }}>
                New Support Ticket
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                className="text-sm font-bold mb-2"
                style={{ color: theme.textSecondary }}
              >
                Subject
              </Text>
              <TextInput
                className="p-4 rounded-xl mb-5"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }}
                placeholder="e.g. Connection Issue"
                placeholderTextColor={theme.textSecondary}
                value={subject}
                onChangeText={setSubject}
              />

              <Text
                className="text-sm font-bold mb-2"
                style={{ color: theme.textSecondary }}
              >
                Description
              </Text>
              <TextInput
                className="p-4 rounded-xl mb-8"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  height: 150,
                  textAlignVertical: "top",
                }}
                placeholder="Describe your issue in detail..."
                placeholderTextColor={theme.textSecondary}
                multiline
                value={message}
                onChangeText={setMessage}
              />

              <TouchableOpacity
                onPress={handleSubmitTicket}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={["#0055ff", "#00ff99"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="p-4 rounded-xl items-center"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text className="text-black font-bold text-base uppercase">
                      Submit Ticket
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-4 p-4 items-center"
                onPress={() => setTicketModalVisible(false)}
              >
                <Text style={{ color: theme.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
