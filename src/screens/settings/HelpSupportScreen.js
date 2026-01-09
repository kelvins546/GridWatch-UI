import React, { useState, useRef, useEffect } from "react";
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
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      text: "Hello! I am the GridWatch AI Assistant. How can I help you today?",
      sender: "agent",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const flatListRef = useRef(null);

  const commonIssues = [
    {
      id: 1,
      title: "How to reset the GridWatch Hub?",
      answer:
        "Press and hold the side button for 10 seconds until the LED flashes red.",
    },
    {
      id: 2,
      title: "My device shows 'Offline'",
      answer: "Check if the Hub is plugged in and your Wi-Fi is working.",
    },
  ];

  const filteredIssues = commonIssues.filter((issue) =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg = {
      id: Date.now(),
      text: chatMessage,
      sender: "user",
      time: currentTime,
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatMessage("");

    setTimeout(() => {
      const replyTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const agentMsg = {
        id: Date.now() + 1,
        text: "I understand. I have automatically generated Support Ticket #9921 for this issue. A human agent will review it shortly.",
        sender: "agent",
        time: replyTime,
      };
      setChatHistory((prev) => [...prev, agentMsg]);
    }, 1500);
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
        className="flex-row items-center justify-between px-6 py-4 border-b"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(24)}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(18) }}
        >
          Help & Support
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <View
            className="flex-row items-center rounded-2xl px-4 py-3 mb-8 border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <MaterialIcons
              name="search"
              size={scaledSize(24)}
              color={theme.textSecondary}
            />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: theme.text, fontSize: scaledSize(16) }}
              placeholder="Search for issues..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <Text
            className="font-bold uppercase mb-4 tracking-widest"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Contact Us
          </Text>

          {}
          <TouchableOpacity
            style={{
              padding: 24,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              marginBottom: 32,
              flexDirection: "row",
              gap: 16,
            }}
            onPress={() => setChatModalVisible(true)}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: `${theme.buttonPrimary}20`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons
                name="chat"
                size={scaledSize(28)}
                color={theme.buttonPrimary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: scaledSize(16),
                  color: theme.text,
                  marginBottom: 4,
                }}
              >
                Start Live Chat
              </Text>
              <Text
                style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
              >
                Chat with our AI assistant. We'll create a ticket for you if
                needed.
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={scaledSize(24)}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <Text
            className="font-bold uppercase mb-4 tracking-widest"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Common Issues
          </Text>

          <View
            className="rounded-2xl overflow-hidden border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            {filteredIssues.map((issue, index) => (
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
                >
                  <Text
                    className="font-semibold flex-1 mr-4"
                    style={{ color: theme.text, fontSize: scaledSize(14) }}
                  >
                    {issue.title}
                  </Text>
                  <MaterialIcons
                    name={
                      expandedId === issue.id
                        ? "keyboard-arrow-up"
                        : "chevron-right"
                    }
                    size={scaledSize(20)}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                {expandedId === issue.id && (
                  <View className="px-5 pb-5">
                    <Text
                      className="leading-6"
                      style={{
                        color: theme.textSecondary,
                        fontSize: scaledSize(14),
                      }}
                    >
                      {issue.answer}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {}
      <Modal
        animationType="slide"
        visible={chatModalVisible}
        onRequestClose={() => setChatModalVisible(false)}
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.background }}
          edges={["top", "bottom"]}
        >
          <View
            className="flex-row items-center justify-between px-6 py-4 border-b"
            style={{ borderBottomColor: theme.cardBorder }}
          >
            <TouchableOpacity onPress={() => setChatModalVisible(false)}>
              <MaterialIcons
                name="close"
                size={scaledSize(24)}
                color={theme.text}
              />
            </TouchableOpacity>
            <View className="items-center">
              <Text
                className="font-bold"
                style={{ color: theme.text, fontSize: scaledSize(16) }}
              >
                Support Chat
              </Text>
              <Text
                style={{ color: theme.buttonPrimary, fontSize: scaledSize(12) }}
              >
                ● Agent Online
              </Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <FlatList
              ref={flatListRef}
              data={chatHistory}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              renderItem={({ item }) => {
                const isUser = item.sender === "user";
                return (
                  <View
                    style={{
                      flexDirection: isUser ? "row-reverse" : "row",
                      alignItems: "flex-end",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: isUser
                          ? theme.buttonPrimary
                          : theme.cardBorder,
                        justifyContent: "center",
                        alignItems: "center",
                        marginLeft: isUser ? 8 : 0,
                        marginRight: isUser ? 0 : 8,
                      }}
                    >
                      {isUser ? (
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: 10,
                          }}
                        >
                          Me
                        </Text>
                      ) : (
                        <MaterialIcons
                          name="support-agent"
                          size={20}
                          color={theme.textSecondary}
                        />
                      )}
                    </View>

                    <View style={{ maxWidth: "75%" }}>
                      <View
                        style={{
                          backgroundColor: isUser
                            ? theme.buttonPrimary
                            : theme.card,
                          padding: 12,
                          borderRadius: 20,
                          borderBottomRightRadius: isUser ? 4 : 20,
                          borderBottomLeftRadius: isUser ? 20 : 4,
                          borderWidth: isUser ? 0 : 1,
                          borderColor: theme.cardBorder,
                        }}
                      >
                        <Text
                          style={{
                            color: isUser ? "#fff" : theme.text,
                            fontSize: scaledSize(14),
                          }}
                        >
                          {item.text}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: theme.textSecondary,
                          fontSize: 10,
                          marginTop: 4,
                          textAlign: isUser ? "right" : "left",
                        }}
                      >
                        {item.time}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />

            <View
              className="p-4 border-t flex-row items-center gap-3"
              style={{
                backgroundColor: theme.background,
                borderColor: theme.cardBorder,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderRadius: 24,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  fontSize: scaledSize(14),
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }}
                placeholder="Type a message..."
                placeholderTextColor={theme.textSecondary}
                value={chatMessage}
                onChangeText={setChatMessage}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                style={{
                  backgroundColor: theme.buttonPrimary,
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
