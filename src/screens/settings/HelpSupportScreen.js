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
  KeyboardAvoidingView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    const isNewArch = global?.nativeFabricUIManager != null;

    if (!isNewArch) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }
}

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "error",
  });

  const showAlert = (title, message, type = "error") => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

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
    {
      id: 6,
      title: "How do I update my electricity rate?",
      answer:
        "Go to Settings > Utility & Rates. You can select your provider from the list for auto-updates or choose 'Manual Configuration' to input the specific rate from your bill.",
    },
    {
      id: 7,
      title: "The app keeps crashing",
      answer:
        "Please ensure you are using the latest version of the app from the App Store/Play Store. Try clearing the app cache or reinstalling. If the issue persists, submit a ticket with your phone model details.",
    },
    {
      id: 8,
      title: "Can I control the hub from multiple phones?",
      answer:
        "Yes. Simply log in with the same GridWatch account on multiple devices. All settings and controls are synchronized in the cloud.",
    },
    {
      id: 9,
      title: "I am not receiving notifications",
      answer:
        "1. Check if 'Push Notifications' are enabled in the App Settings.\n2. Verify that your phone's system settings allow notifications for GridWatch.\n3. Ensure 'Do Not Disturb' mode is off.",
    },
    {
      id: 10,
      title: "How to check for firmware updates?",
      answer:
        "The Hub automatically checks for updates every 24 hours. You can manually check by going to Device Configuration > System Information. The LED will blink blue during an update.",
    },
  ];

  const filteredIssues = commonIssues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSubmitTicket = () => {
    if (!subject.trim() || !message.trim()) {
      showAlert(
        "Missing Info",
        "Please fill in both the subject and description.",
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setTicketModalVisible(false);
      setSubject("");
      setMessage("");

      showAlert(
        "Ticket Submitted",
        "Your support ticket #8821 has been created. We will contact you shortly.",
        "success"
      );
    }, 2000);
  };

  const handleEmailSupport = () => {
    const email = "support@gridwatch.com";
    const emailSubject = "GridWatch Support Request";
    const body = "Please describe your issue here...";

    const url = `mailto:${email}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(body)}`;

    Linking.openURL(url).catch((err) => {
      console.error("Error opening email app:", err);
      showAlert(
        "Error",
        "Could not open email client. Please check if you have a mail app installed.",
        "error"
      );
    });
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <StatusBar barStyle={theme.statusBarStyle} />

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
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons
                  name="close"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text
            className="text-xs font-bold uppercase mb-4 tracking-widest"
            style={{ color: theme.textSecondary }}
          >
            Contact Us
          </Text>

          <View className="flex-row gap-4 mb-8">
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

          <Text
            className="text-xs font-bold uppercase mb-4 tracking-widest"
            style={{ color: theme.textSecondary }}
          >
            Common Issues
          </Text>

          {filteredIssues.length === 0 ? (
            <View className="py-10 items-center">
              <MaterialIcons
                name="search-off"
                size={48}
                color={theme.textSecondary}
                style={{ opacity: 0.5 }}
              />
              <Text
                className="mt-4 text-sm"
                style={{ color: theme.textSecondary }}
              >
                No matching issues found.
              </Text>
            </View>
          ) : (
            <View
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: theme.card }}
            >
              {filteredIssues.map((issue, index) => {
                const isExpanded = expandedId === issue.id;
                return (
                  <View
                    key={issue.id}
                    style={{
                      borderBottomWidth:
                        index !== filteredIssues.length - 1 ? 1 : 0,
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
                        name={
                          isExpanded ? "keyboard-arrow-up" : "chevron-right"
                        }
                        size={20}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>

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
          )}

          <Text
            className="text-center text-xs mt-10 opacity-50 mb-10"
            style={{ color: theme.textSecondary }}
          >
            App Version 2.1.0 • Build 8821{"\n"}© 2025 GridWatch Inc.
          </Text>
        </View>
      </ScrollView>

      {}
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
          <TouchableOpacity
            className="absolute inset-0 bg-black/80"
            activeOpacity={1}
            onPress={() => setTicketModalVisible(false)}
          />

          <View
            className="rounded-t-3xl p-5 h-[60%]"
            style={{ backgroundColor: theme.background }}
          >
            <View className="items-center mb-4">
              <View className="w-10 h-1 rounded-full bg-gray-600 mb-3" />
              <Text className="text-lg font-bold" style={{ color: theme.text }}>
                New Support Ticket
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                className="text-xs font-bold mb-1.5"
                style={{ color: theme.textSecondary }}
              >
                Subject
              </Text>
              <TextInput
                className="p-3 rounded-xl mb-4 text-sm"
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
                className="text-xs font-bold mb-1.5"
                style={{ color: theme.textSecondary }}
              >
                Description
              </Text>
              <TextInput
                className="p-3 rounded-xl mb-6 text-sm"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  height: 100,
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
                  className="p-3.5 rounded-xl items-center"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text className="text-black font-bold text-sm uppercase">
                      Submit Ticket
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-3 p-3 items-center"
                onPress={() => setTicketModalVisible(false)}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {}
      <Modal
        animationType="fade"
        transparent={true}
        visible={alertVisible}
        onRequestClose={() => setAlertVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80">
          <View
            className="w-[70%] max-w-[280px] p-5 rounded-2xl items-center border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View
              className="w-10 h-10 rounded-full justify-center items-center mb-3"
              style={{
                backgroundColor:
                  alertConfig.type === "success"
                    ? "rgba(0, 255, 153, 0.1)"
                    : "rgba(255, 68, 68, 0.1)",
              }}
            >
              <MaterialIcons
                name={
                  alertConfig.type === "success" ? "check" : "priority-high"
                }
                size={22}
                color={alertConfig.type === "success" ? "#00ff99" : "#ff4444"}
              />
            </View>

            <Text
              className="text-base font-bold mb-1.5 text-center"
              style={{ color: theme.text }}
            >
              {alertConfig.title}
            </Text>

            <Text
              className="text-xs text-center mb-5 leading-4"
              style={{ color: theme.textSecondary }}
            >
              {alertConfig.message}
            </Text>

            <TouchableOpacity
              className="w-full"
              onPress={() => setAlertVisible(false)}
            >
              <LinearGradient
                colors={
                  alertConfig.type === "success"
                    ? ["#0055ff", "#00ff99"]
                    : ["#ff4444", "#ff8800"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="p-2.5 rounded-xl items-center"
              >
                <Text
                  className="font-bold text-xs uppercase tracking-wider"
                  style={{
                    color: alertConfig.type === "success" ? "black" : "white",
                  }}
                >
                  {alertConfig.type === "success" ? "Okay" : "Try Again"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
