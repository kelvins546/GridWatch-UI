import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import * as Notifications from "expo-notifications";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function InvitationsScreen() {
  const navigation = useNavigation();
  const { theme, fontScale, isDarkMode } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const [invitations, setInvitations] = useState([]);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  useEffect(() => {
    let subscription;

    const setupRealtimeListener = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      subscription = supabase
        .channel("public:hub_invites")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "hub_invites",
            filter: `email=eq.${user.email}`,
          },
          async (payload) => {
            console.log("New Invite Received:", payload);
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "New Invitation",
                body: "You have been invited to join a new Hub.",
                sound: true,
              },
              trigger: null,
            });
            fetchInvitations();
          },
        )
        .subscribe();
    };

    setupRealtimeListener();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: invites, error } = await supabase
        .from("hub_invites")
        .select("*")
        .eq("email", user.email)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enrichedInvites = await Promise.all(
        invites.map(async (invite) => {
          const { data: sender } = await supabase
            .from("users")
            .select("first_name, last_name")
            .eq("id", invite.sender_id)
            .single();

          let hubDisplay = "Unknown Hub";
          if (invite.hub_ids && invite.hub_ids.length > 0) {
            const { data: hubs } = await supabase
              .from("hubs")
              .select("name")
              .in("id", invite.hub_ids);

            if (hubs && hubs.length > 0) {
              const names = hubs.map((h) => h.name);
              hubDisplay =
                names.length > 2
                  ? `${names[0]}, ${names[1]} +${names.length - 2} more`
                  : names.join(", ");
            }
          }

          const dateObj = new Date(invite.created_at);
          const dateString =
            dateObj.toLocaleDateString() === new Date().toLocaleDateString()
              ? `Today, ${dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : dateObj.toLocaleDateString();

          const senderName = sender
            ? `${sender.first_name} ${sender.last_name}`
            : "Unknown User";

          return {
            ...invite,
            inviterName: senderName,
            initial: senderName.charAt(0).toUpperCase(),
            hubName: hubDisplay,
            date: dateString,
            role: "Guest",
          };
        }),
      );

      setInvitations(enrichedInvites);
    } catch (err) {
      console.log("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInvitations();
    }, []),
  );

  const onPressAccept = (invite) => {
    setSelectedInvite(invite);
    setShowAcceptModal(true);
  };

  const onPressDecline = (invite) => {
    setSelectedInvite(invite);
    setShowDeclineModal(true);
  };

  const confirmAccept = async () => {
    if (!selectedInvite) return;
    setProcessing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const accessInserts = selectedInvite.hub_ids.map((hubId) => ({
        hub_id: hubId,
        user_id: user.id,
        role: "guest",
      }));

      const { error: accessError } = await supabase
        .from("hub_access")
        .insert(accessInserts);

      if (accessError && !accessError.message.includes("unique constraint")) {
        throw accessError;
      }

      await supabase.from("app_notifications").insert({
        user_id: selectedInvite.sender_id,
        title: "Invitation Accepted ✅",
        body: `${user.email} has accepted your invitation to ${selectedInvite.hubName}.`,
      });

      const { error: deleteError } = await supabase
        .from("hub_invites")
        .delete()
        .eq("id", selectedInvite.id);

      if (deleteError) throw deleteError;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setInvitations((prev) => prev.filter((i) => i.id !== selectedInvite.id));
      setShowAcceptModal(false);
      setSelectedInvite(null);
      Alert.alert("Success", "You have joined the hub!");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setProcessing(false);
    }
  };

  const confirmDecline = async () => {
    if (!selectedInvite) return;
    setProcessing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("app_notifications").insert({
        user_id: selectedInvite.sender_id,
        title: "Invitation Declined",
        body: `${user.email} declined your invitation to ${selectedInvite.hubName}.`,
      });

      const { error } = await supabase
        .from("hub_invites")
        .delete()
        .eq("id", selectedInvite.id);

      if (error) throw error;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setInvitations((prev) => prev.filter((i) => i.id !== selectedInvite.id));
      setShowDeclineModal(false);
      setSelectedInvite(null);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setProcessing(false);
    }
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

      {}
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
          className="flex-1 text-center font-bold"
          style={{ color: theme.text, fontSize: scaledSize(18) }}
        >
          Invitations
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchInvitations}
            tintColor={theme.primary}
          />
        }
      >
        <View className="p-6">
          <Text
            className="font-bold uppercase tracking-widest mb-4"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Incoming Requests
          </Text>

          {loading && invitations.length === 0 ? (
            <ActivityIndicator
              size="large"
              color={theme.buttonPrimary}
              style={{ marginTop: 20 }}
            />
          ) : invitations.length === 0 ? (
            <View className="items-center justify-center py-10 opacity-50">
              <MaterialIcons
                name="mail-outline"
                size={scaledSize(48)}
                color={theme.textSecondary}
              />
              <Text
                className="mt-3 font-medium"
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(14),
                }}
              >
                No pending invitations
              </Text>
            </View>
          ) : (
            invitations.map((invite) => (
              <View
                key={invite.id}
                className="p-5 rounded-2xl border mb-4"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center mb-4">
                  <View
                    className="w-10 h-10 rounded-full justify-center items-center mr-3"
                    style={{ backgroundColor: theme.buttonPrimary }}
                  >
                    <Text
                      className="font-bold"
                      style={{ color: "#fff", fontSize: scaledSize(14) }}
                    >
                      {invite.initial}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-bold"
                      style={{ color: theme.text, fontSize: scaledSize(14) }}
                    >
                      {invite.inviterName}
                    </Text>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: scaledSize(12),
                      }}
                    >
                      invited you to join
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(10),
                    }}
                  >
                    {invite.date}
                  </Text>
                </View>

                <View
                  className="p-3 rounded-xl mb-5 flex-row items-center"
                  style={{ backgroundColor: theme.background }}
                >
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                    style={{ backgroundColor: `${theme.buttonPrimary}15` }}
                  >
                    <MaterialIcons
                      name="router"
                      size={scaledSize(18)}
                      color={theme.buttonPrimary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      className="font-bold"
                      numberOfLines={1}
                      style={{ color: theme.text, fontSize: scaledSize(13) }}
                    >
                      {invite.hubName}
                    </Text>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: scaledSize(11),
                      }}
                    >
                      Access Level: {invite.role}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => onPressDecline(invite)}
                    className="flex-1 py-3 rounded-xl border items-center justify-center"
                    style={{ borderColor: theme.cardBorder }}
                  >
                    <Text
                      className="font-bold"
                      style={{ color: theme.text, fontSize: scaledSize(13) }}
                    >
                      Decline
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onPressAccept(invite)}
                    className="flex-1 py-3 rounded-xl items-center justify-center"
                    style={{ backgroundColor: theme.buttonPrimary }}
                  >
                    <Text
                      className="font-bold"
                      style={{ color: "#fff", fontSize: scaledSize(13) }}
                    >
                      Accept
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {}
      <Modal visible={showAcceptModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View
            className="w-[85%] max-w-[320px] p-5 rounded-2xl border items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <Text
              className="font-bold mb-2 text-center"
              style={{ color: theme.text, fontSize: scaledSize(18) }}
            >
              Join Hub?
            </Text>
            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              You will gain {selectedInvite?.role} access to{" "}
              <Text style={{ fontWeight: "bold", color: theme.text }}>
                {selectedInvite?.hubName}
              </Text>
              .
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => setShowAcceptModal(false)}
                disabled={processing}
                className="flex-1 py-3 rounded-xl border items-center"
                style={{ borderColor: theme.cardBorder }}
              >
                <Text
                  className="font-bold"
                  style={{ color: theme.text, fontSize: scaledSize(13) }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmAccept}
                disabled={processing}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: theme.buttonPrimary }}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    className="font-bold"
                    style={{ color: "#fff", fontSize: scaledSize(13) }}
                  >
                    Join
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <Modal visible={showDeclineModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View
            className="w-[85%] max-w-[320px] p-5 rounded-2xl border items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <Text
              className="font-bold mb-2 text-center"
              style={{ color: theme.text, fontSize: scaledSize(18) }}
            >
              Decline Invitation?
            </Text>
            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              Are you sure you want to decline the invitation from{" "}
              <Text style={{ fontWeight: "bold", color: theme.text }}>
                {selectedInvite?.inviterName}
              </Text>
              ? This action cannot be undone.
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => setShowDeclineModal(false)}
                disabled={processing}
                className="flex-1 py-3 rounded-xl border items-center"
                style={{ borderColor: theme.cardBorder }}
              >
                <Text
                  className="font-bold"
                  style={{ color: theme.text, fontSize: scaledSize(13) }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDecline}
                disabled={processing}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor: isDarkMode ? "#ff4444" : "#cc0000",
                }}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    className="font-bold"
                    style={{ color: "#fff", fontSize: scaledSize(13) }}
                  >
                    Decline
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
