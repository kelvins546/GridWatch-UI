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
  Alert,
  Image,
  Animated,
  StyleSheet,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";

import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "../../lib/supabase"; // Make sure Supabase is imported!

// API Key and URL are completely removed from the frontend!

const SYSTEM_PROMPT = `
You are the GridWatch AI Support Assistant.
Your ONLY goal is to help users manage their home energy, smart devices, budgets, and understand app policies within the GridWatch app.

OFFICIAL KNOWLEDGE BASE (Use this as your source of truth):

1. **Hardware & Connectivity (Technical Limits):**
   - **Capacity:** Each GridWatch Hub supports a maximum load of **10 Amps** (approx. 2,200 Watts) per outlet. Do not overload.
   - **Outlets:** Each Hub controls exactly **4 independent outlets**.
   - **Requirements:** Remote control, real-time cost tracking, and syncing require an active internet connection.

2. **Billing & Costs:**
   - **Estimates Only:** GridWatch provides **cost estimates** for personal budgeting. The official bill remains the exclusive domain of your utility provider (e.g., Meralco).
   - **Rates:** Users can select a specific provider or manually input their own custom electricity rate (PHP/kWh).

3. **Terms of Service & Privacy:**
   - **Data Monitoring:** By using the service, users acknowledge that voltage, current, and wattage data are uploaded to the cloud for analysis.
   - **Privacy Policy:** Personal data and specific location data are encrypted. We **DO NOT** sell individual appliance usage patterns to third-party advertisers.
   - **Safety Responsibility:** The "Safety Cut-off" feature is a supplementary protection layer, not a guarantee. GridWatch is not liable for damages, electrical fires, or equipment failures resulting from misuse, overloading, or modification of the hardware.

STRICT GUIDELINES:
1. **Scope Restriction:** You must ONLY answer questions related to:
   - GridWatch app features (Budgeting, Hub Setup, Device Config)
   - Home energy management & electricity bills
   - Smart device troubleshooting (Offline hubs, incorrect readings, connection issues)
   - Safety warnings (Overloading the 10A limit)
2. **Refusal Protocol:** If a user asks about ANY topic outside of the above scope, POLITELY REFUSE.
   - Standard refusal message: "I am the GridWatch Assistant. I can only help you with energy management and app support."
3. **Format:** Keep answers concise (under 3 sentences).
4. **Profanity & Abuse Moderation:**
   - NEVER use profanity, curse words, or inappropriate language.
   - If a user prompt contains profanity or abusive language, DO NOT answer the core question. Instead, reply strictly with: "Please keep the conversation professional. How can I help you with GridWatch today?"
`;

if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const getDayLabel = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
};

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const scaledSize = (size) => size;

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const recordingRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [currentSound, setCurrentSound] = useState(null);
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(null);

  const [voiceDraft, setVoiceDraft] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  const [chatHistory, setChatHistory] = useState([
    {
      id: Date.now(),
      createdAt: Date.now(),
      text: "Hello! I am the GridWatch AI Assistant. I am here to help you manage your smart home and electricity usage.\n\nWhat I can help you with:\n• 𝗔𝗽𝗽 𝗙𝗲𝗮𝘁𝘂𝗿𝗲𝘀: Budgeting, Hub setup, and device configuration.\n• 𝗘𝗻𝗲𝗿𝗴𝘆 𝗠𝗮𝗻𝗮𝗴𝗲𝗺𝗲𝗻𝘁: Understanding your electricity estimates and rates.\n• 𝗧𝗿𝗼𝘂𝗯𝗹𝗲𝘀𝗵𝗼𝗼𝘁𝗶𝗻𝗴: Fixing offline hubs, connection issues, or reading errors.\n• 𝗛𝗮𝗿𝗱𝘄𝗮𝗿𝗲 & 𝗦𝗮𝗳𝗲𝘁𝘆: Guidelines on our 4-outlet hubs and 10A load limits.\n\nPlease note: I am a specialized assistant, so I can strictly only answer questions related to GridWatch and home energy management.\n\nHow can I assist you today?",
      sender: "agent",
      type: "text",
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
      title: "How to reset the Hub?",
      answer: "Hold the side button for 10s until the LED flashes red.",
    },
    {
      id: 2,
      title: "Device Offline?",
      answer: "Check if the Hub is plugged in and your Wi-Fi is working.",
    },
    {
      id: 3,
      title: "Bill Prediction Error",
      answer: "Ensure your consumption data is synced in the 'Insights' tab.",
    },
  ];

  const filteredIssues = commonIssues.filter((issue) =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    let animation;
    let timerInterval;

    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();

      setRecordingDuration(0);
      timerInterval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      fadeAnim.setValue(1);
      if (timerInterval) clearInterval(timerInterval);
    }

    return () => {
      if (animation) animation.stop();
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, [currentSound]);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDuration = (seconds) => {
    if (seconds < 0) seconds = 0;
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? `0${sec}` : sec}`;
  };

  const handleEmailSupport = () => {
    Linking.openURL(
      "mailto:support@gridwatch.com?subject=GridWatch Support Request",
    );
  };

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Please allow access to your photos.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const userMsg = {
        id: Date.now(),
        createdAt: Date.now(),
        text: "Sent an image",
        uri: asset.uri,
        base64: asset.base64,
        sender: "user",
        type: "image",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setChatHistory((prev) => [...prev, userMsg]);
      processAIResponse(userMsg, "Please analyze this image.");
    }
  };

  const startRecording = async () => {
    try {
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {}
        recordingRef.current = null;
      }

      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permission required", "Please allow microphone access.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Microphone Error", "Please restart the app completely.");
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    const recording = recordingRef.current;

    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      if (uri) {
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });

        setVoiceDraft({
          uri,
          base64: base64Audio,
          duration: formatDuration(recordingDuration),
        });
      }
    } catch (error) {
      console.log("Error stopping recording", error);
    }
  };

  const togglePlayback = async (item) => {
    try {
      if (currentSound && playingMsgId === item.id) {
        if (isPlaying) {
          await currentSound.pauseAsync();
          setIsPlaying(false);
        } else {
          await currentSound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      if (currentSound) {
        await currentSound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: item.uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.isPlaying) {
            const remainingMillis =
              status.durationMillis - status.positionMillis;
            setPlaybackTime(formatDuration(remainingMillis / 1000));
          }

          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlayingMsgId(null);
            setPlaybackTime(null);
          }
        },
      );

      setCurrentSound(newSound);
      setPlayingMsgId(item.id);
      setIsPlaying(true);
    } catch (error) {
      console.log("Error toggling playback", error);
    }
  };

  const handleSendMessage = () => {
    if (voiceDraft) {
      const userMsg = {
        id: Date.now(),
        createdAt: Date.now(),
        text: `Voice Message (${voiceDraft.duration})`,
        uri: voiceDraft.uri,
        base64: voiceDraft.base64,
        sender: "user",
        type: "voice",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setChatHistory((prev) => [...prev, userMsg]);
      setVoiceDraft(null);
      processAIResponse(userMsg, "Please listen to this audio and answer.");
      return;
    }
    if (!chatMessage.trim()) return;
    const userMsg = {
      id: Date.now(),
      createdAt: Date.now(),
      text: chatMessage,
      sender: "user",
      type: "text",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatMessage("");
    processAIResponse(userMsg, chatMessage);
  };

  const processAIResponse = async (currentUserMsg, promptText) => {
    setIsTyping(true);
    try {
      const currentParts = [{ text: promptText }];
      if (currentUserMsg.type === "image" && currentUserMsg.base64) {
        currentParts.push({
          inlineData: { mimeType: "image/jpeg", data: currentUserMsg.base64 },
        });
      } else if (currentUserMsg.type === "voice" && currentUserMsg.base64) {
        currentParts.push({
          inlineData: { mimeType: "audio/mp4", data: currentUserMsg.base64 },
        });
      }

      // --- NEW SECURE EDGE FUNCTION CALL ---
      const { data, error } = await supabase.functions.invoke("chat-support", {
        body: {
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: currentParts }],
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_LOW_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_LOW_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_LOW_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_LOW_AND_ABOVE",
            },
          ],
        },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error.message);
      // -------------------------------------

      // 1. Check if Gemini's strict safety API blocked it
      const isApiBlocked =
        (data.promptFeedback && data.promptFeedback.blockReason) ||
        (data.candidates && data.candidates[0].finishReason === "SAFETY");

      const aiText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I couldn't process that.";

      // 2. Check if our System Prompt blocked it (useful for Tagalog slang)
      const isPromptBlocked = aiText.includes(
        "Please keep the conversation professional",
      );

      if (isApiBlocked || isPromptBlocked) {
        // MARK THE MESSAGE AS BLOCKED INSTEAD OF DELETING IT
        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === currentUserMsg.id ? { ...msg, isBlocked: true } : msg,
          ),
        );
        setIsTyping(false);
        return; // Exit the function early so NO bot reply is sent
      }

      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          createdAt: Date.now(),
          text: aiText.trim(),
          sender: "agent",
          type: "text",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          createdAt: Date.now(),
          text: `Error: ${error.message}`,
          sender: "agent",
          type: "text",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const WaveformVisual = ({ color = "#fff", animate = false }) => (
    <View style={styles.waveformContainer}>
      {[8, 14, 10, 18, 12, 20, 12, 16, 10].map((h, i) => (
        <View
          key={i}
          style={[
            styles.waveformBar,
            {
              height: h,
              backgroundColor: color,
              opacity: animate ? 0.8 : 0.5,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderBubbleContent = (item, isUser) => {
    // If the user's message is blocked, text turns to theme.text instead of white
    const bubbleTextColor = isUser
      ? item.isBlocked
        ? theme.text
        : "#fff"
      : theme.text;

    if (item.type === "image") {
      return (
        <TouchableOpacity
          onPress={() => {
            setSelectedImageUri(item.uri);
            setFullImageVisible(true);
          }}
        >
          <Image
            source={{ uri: item.uri }}
            style={[styles.chatImage, item.isBlocked && { opacity: 0.5 }]}
            resizeMode="cover"
          />
          <Text
            style={[
              styles.bubbleText,
              {
                color: bubbleTextColor,
                fontSize: 12,
                fontStyle: "italic",
              },
            ]}
          >
            Tap to view
          </Text>
        </TouchableOpacity>
      );
    }

    if (item.type === "voice") {
      const isThisPlaying = playingMsgId === item.id && isPlaying;
      const originalDuration = item.text.includes("(")
        ? item.text.split("(")[1].replace(")", "")
        : "0:00";

      return (
        <View style={styles.voiceBubbleContainer}>
          <TouchableOpacity
            onPress={() => togglePlayback(item)}
            style={[
              styles.playButtonSmall,
              {
                backgroundColor: isUser
                  ? item.isBlocked
                    ? `${theme.text}20`
                    : "rgba(255,255,255,0.2)"
                  : theme.buttonPrimary,
              },
            ]}
          >
            <MaterialIcons
              name={isThisPlaying ? "pause" : "play-arrow"}
              size={24}
              color={isUser && item.isBlocked ? theme.text : "#fff"}
            />
          </TouchableOpacity>

          <View>
            <Text
              style={{
                color: bubbleTextColor,
                fontWeight: "bold",
              }}
            >
              {isThisPlaying ? "Playing..." : "Voice Message"}
            </Text>
            <Text
              style={{
                color: isUser
                  ? item.isBlocked
                    ? theme.textSecondary
                    : "#eee"
                  : theme.textSecondary,
                fontSize: 10,
                fontVariant: ["tabular-nums"],
              }}
            >
              {isThisPlaying && playbackTime ? playbackTime : originalDuration}
            </Text>
          </View>
        </View>
      );
    }
    return (
      <Text style={[styles.bubbleText, { color: bubbleTextColor }]}>
        {item.text}
      </Text>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Help & Support
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <MaterialIcons name="search" size={24} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search issues..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {}
        <TouchableOpacity
          style={[
            styles.chatCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              marginBottom: 16,
            },
          ]}
          onPress={() => setChatModalVisible(true)}
        >
          <View
            style={[
              styles.chatIconCircle,
              { backgroundColor: `${theme.buttonPrimary}20` },
            ]}
          >
            <MaterialIcons name="chat" size={28} color={theme.buttonPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.chatCardTitle, { color: theme.text }]}>
              Start Live Chat
            </Text>
            <Text style={{ color: theme.textSecondary }}>
              Chat with our AI assistant.
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        {}
        <TouchableOpacity
          style={[
            styles.chatCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              marginBottom: 32,
            },
          ]}
          onPress={handleEmailSupport}
        >
          <View
            style={[
              styles.chatIconCircle,
              { backgroundColor: `${theme.text}10` },
            ]}
          >
            <MaterialIcons name="email" size={26} color={theme.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.chatCardTitle, { color: theme.text }]}>
              Email Support
            </Text>
            <Text style={{ color: theme.textSecondary }}>
              Send us a detailed message.
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        {}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "bold",
            color: theme.textSecondary,
            textTransform: "uppercase",
            marginBottom: 12,
            letterSpacing: 1,
          }}
        >
          Common Issues
        </Text>
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 16,
            borderColor: theme.cardBorder,
            borderWidth: 1,
            overflow: "hidden",
          }}
        >
          {filteredIssues.map((issue, index) => (
            <View
              key={issue.id}
              style={{
                borderBottomWidth: index !== filteredIssues.length - 1 ? 1 : 0,
                borderBottomColor: theme.cardBorder,
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 20,
                }}
                onPress={() => toggleExpand(issue.id)}
              >
                <Text
                  style={{
                    flex: 1,
                    fontWeight: "600",
                    fontSize: 14,
                    color: theme.text,
                    marginRight: 16,
                  }}
                >
                  {issue.title}
                </Text>
                <MaterialIcons
                  name={
                    expandedId === issue.id
                      ? "keyboard-arrow-up"
                      : "chevron-right"
                  }
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
              {expandedId === issue.id && (
                <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                  <Text style={{ color: theme.textSecondary, lineHeight: 22 }}>
                    {issue.answer}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {}
      <Modal
        animationType="slide"
        visible={chatModalVisible}
        onRequestClose={() => setChatModalVisible(false)}
      >
        <SafeAreaView
          style={[styles.container, { backgroundColor: theme.background }]}
          edges={["top", "bottom"]}
        >
          <View
            style={[styles.header, { borderBottomColor: theme.cardBorder }]}
          >
            <TouchableOpacity onPress={() => setChatModalVisible(false)}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={{ alignItems: "center" }}>
              <Text
                style={[
                  styles.headerTitle,
                  { fontSize: 16, color: theme.text },
                ]}
              >
                Support Chat
              </Text>
              <Text style={{ fontSize: 12, color: theme.buttonPrimary }}>
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
              contentContainerStyle={{ padding: 20 }}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              ListFooterComponent={
                isTyping ? (
                  <Text
                    style={{
                      fontStyle: "italic",
                      color: theme.textSecondary,
                      marginLeft: 40,
                      marginBottom: 10,
                    }}
                  >
                    Agent is typing...
                  </Text>
                ) : null
              }
              renderItem={({ item, index }) => {
                const isUser = item.sender === "user";
                const currentLabel = getDayLabel(item.createdAt || item.id);
                const prevLabel =
                  index > 0
                    ? getDayLabel(
                        chatHistory[index - 1].createdAt ||
                          chatHistory[index - 1].id,
                      )
                    : null;
                const showDateHeader = currentLabel !== prevLabel;

                return (
                  <View>
                    {showDateHeader && (
                      <View style={styles.dateHeader}>
                        <Text
                          style={[
                            styles.dateHeaderText,
                            {
                              color: theme.textSecondary,
                              backgroundColor: theme.card,
                            },
                          ]}
                        >
                          {currentLabel}
                        </Text>
                      </View>
                    )}

                    <View
                      style={[
                        styles.messageRow,
                        isUser ? styles.messageRowUser : styles.messageRowAgent,
                      ]}
                    >
                      {!isUser && (
                        <View
                          style={[
                            styles.avatar,
                            { backgroundColor: theme.cardBorder },
                          ]}
                        >
                          <MaterialIcons
                            name="support-agent"
                            size={20}
                            color={theme.textSecondary}
                          />
                        </View>
                      )}
                      <View style={{ maxWidth: "75%" }}>
                        <View
                          style={[
                            styles.bubble,
                            isUser
                              ? {
                                  // Turns transparent with red border if blocked
                                  backgroundColor: item.isBlocked
                                    ? "transparent"
                                    : theme.buttonPrimary,
                                  borderColor: item.isBlocked
                                    ? "#ff4444"
                                    : "transparent",
                                  borderWidth: item.isBlocked ? 1 : 0,
                                  borderBottomRightRadius: 4,
                                }
                              : {
                                  backgroundColor: theme.card,
                                  borderColor: theme.cardBorder,
                                  borderWidth: 1,
                                  borderBottomLeftRadius: 4,
                                },
                          ]}
                        >
                          {renderBubbleContent(item, isUser)}
                        </View>

                        {/* Status / Timestamp Row */}
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: isUser ? "flex-end" : "flex-start",
                            alignItems: "center",
                            marginTop: 4,
                          }}
                        >
                          {item.isBlocked && (
                            <MaterialIcons
                              name="error-outline"
                              size={12}
                              color="#ff4444"
                              style={{ marginRight: 4 }}
                            />
                          )}
                          <Text
                            style={[
                              styles.timeText,
                              {
                                color: item.isBlocked
                                  ? "#ff4444"
                                  : theme.textSecondary,
                                textAlign: isUser ? "right" : "left",
                                marginTop: 0,
                              },
                            ]}
                          >
                            {item.isBlocked
                              ? "Not sent - Inappropriate content"
                              : item.time}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              }}
            />

            {}
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              {voiceDraft ? (
                <View style={styles.reviewContainer}>
                  <TouchableOpacity
                    onPress={() => setVoiceDraft(null)}
                    style={styles.iconButton}
                  >
                    <MaterialIcons name="delete" size={26} color="#ff4444" />
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.draftPill,
                      { backgroundColor: theme.buttonPrimary },
                    ]}
                  >
                    <View style={styles.micIconCircle}>
                      <MaterialIcons name="mic" size={20} color="#fff" />
                    </View>
                    <WaveformVisual color="rgba(255,255,255,0.8)" />
                    <Text
                      style={{
                        color: "#fff",
                        marginLeft: 8,
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {voiceDraft.duration}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleSendMessage}
                    style={[
                      styles.sendButton,
                      { backgroundColor: theme.buttonPrimary },
                    ]}
                  >
                    <MaterialIcons name="send" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : isRecording ? (
                <View style={styles.recordingContainer}>
                  <Animated.View
                    style={[styles.recordingDot, { opacity: fadeAnim }]}
                  />
                  <Text style={[styles.recordingText, { color: theme.text }]}>
                    Recording... {formatDuration(recordingDuration)}
                  </Text>
                  <TouchableOpacity
                    onPress={stopRecording}
                    style={styles.stopButton}
                  >
                    <MaterialIcons name="stop" size={24} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.normalInputContainer}>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.cardBorder,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="camera-alt"
                      size={22}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>

                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.card,
                        color: theme.text,
                        borderColor: theme.cardBorder,
                      },
                    ]}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.textSecondary}
                    value={chatMessage}
                    onChangeText={setChatMessage}
                    multiline
                  />

                  <TouchableOpacity
                    onPress={
                      chatMessage.trim() ? handleSendMessage : startRecording
                    }
                    style={[
                      styles.sendButton,
                      { backgroundColor: theme.buttonPrimary },
                    ]}
                  >
                    <MaterialIcons
                      name={chatMessage.trim() ? "send" : "mic"}
                      size={22}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={fullImageVisible}
        transparent={true}
        onRequestClose={() => setFullImageVisible(false)}
      >
        <View style={styles.fullImageContainer}>
          <TouchableOpacity
            style={styles.closeImageButton}
            onPress={() => setFullImageVisible(false)}
          >
            <MaterialIcons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedImageUri && (
            <Image
              source={{ uri: selectedImageUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontWeight: "bold", fontSize: 18 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  chatIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  chatCardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  dateHeader: { alignItems: "center", marginVertical: 16 },
  dateHeaderText: {
    fontSize: 11,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  messageRowUser: { flexDirection: "row-reverse" },
  messageRowAgent: { flexDirection: "row" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  bubble: { padding: 12, borderRadius: 20 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  timeText: { fontSize: 10, marginTop: 4 },
  chatImage: { width: 200, height: 150, borderRadius: 12, marginBottom: 4 },
  voiceBubbleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 120,
  },
  playButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  waveformContainer: { flexDirection: "row", alignItems: "center", gap: 3 },
  waveformBar: { width: 3, borderRadius: 2 },
  inputContainer: { padding: 12, borderTopWidth: 1 },
  normalInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    maxHeight: 100,
  },
  iconButton: {
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    height: 50,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ff4444",
    marginRight: 10,
  },
  recordingText: { flex: 1, fontSize: 16, fontWeight: "600" },
  stopButton: { padding: 8 },
  reviewContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  draftPill: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  micIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  fullImageContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
  },
  closeImageButton: { position: "absolute", top: 40, right: 20, zIndex: 10 },
  fullImage: { width: "100%", height: "80%" },
});
