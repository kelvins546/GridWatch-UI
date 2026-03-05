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
  StyleSheet,
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

  const [activeTab, setActiveTab] = useState("pending");
  const [joinedHubs, setJoinedHubs] = useState([]);

  const [invitations, setInvitations] = useState([]);
  const [selectedInvite, setSelectedInvite] = useState(null);

  const [hubToLeave, setHubToLeave] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "success",
    title: "",
    message: "",
  });

  const showAlert = (type, title, message) => {
    setAlertConfig({ type, title, message });
    setAlertModalVisible(true);
  };

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
            fetchData();
          },
        )
        .subscribe();
    };

    setupRealtimeListener();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. FETCH PENDING INVITES
      const { data: invites, error: inviteError } = await supabase
        .from("hub_invites")
        .select("*")
        .eq("email", user.email)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (inviteError) throw inviteError;

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

      // 2. FETCH JOINED HUBS
      const { data: accessData, error: accessError } = await supabase
        .from("hub_access")
        .select("hub_id, role, hubs(name, user_id)")
        .eq("user_id", user.id)
        .eq("role", "guest");

      if (accessError) throw accessError;

      const enrichedJoinedHubs = await Promise.all(
        (accessData || []).map(async (acc) => {
          const { data: owner } = await supabase
            .from("users")
            .select("first_name, last_name")
            .eq("id", acc.hubs.user_id)
            .single();

          const ownerName = owner
            ? `${owner.first_name} ${owner.last_name}`
            : "Unknown User";

          return {
            hub_id: acc.hub_id,
            hubName: acc.hubs.name,
            ownerName: ownerName,
            ownerId: acc.hubs.user_id, // FIX: Save the owner's ID so we can notify them later
            initial: ownerName.charAt(0).toUpperCase(),
            role: acc.role,
          };
        }),
      );

      setJoinedHubs(enrichedJoinedHubs);
    } catch (err) {
      console.log("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
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

  const onPressLeave = (hub) => {
    setHubToLeave(hub);
    setShowLeaveModal(true);
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
        title: "Invitation Accepted",
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

      fetchData();

      showAlert("success", "Success", "You have joined the hub!");
    } catch (err) {
      showAlert("error", "Error", err.message);
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
      showAlert("error", "Error", err.message);
    } finally {
      setProcessing(false);
    }
  };

  const confirmLeave = async () => {
    if (!hubToLeave) return;
    setProcessing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // FIX: Send a notification to the owner BEFORE deleting the access
      await supabase.from("app_notifications").insert({
        user_id: hubToLeave.ownerId,
        title: "Member Left Hub",
        body: `${user.email} has left ${hubToLeave.hubName}.`,
      });

      const { error } = await supabase
        .from("hub_access")
        .delete()
        .match({ hub_id: hubToLeave.hub_id, user_id: user.id });

      if (error) throw error;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setJoinedHubs((prev) =>
        prev.filter((h) => h.hub_id !== hubToLeave.hub_id),
      );
      setShowLeaveModal(false);
      setHubToLeave(null);
      showAlert(
        "success",
        "Left Hub",
        `You have successfully left ${hubToLeave.hubName}.`,
      );
    } catch (err) {
      showAlert("error", "Error", "Failed to leave hub. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const styles = StyleSheet.create({
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
    buttonRow: { flexDirection: "row", gap: 10, width: "100%" },
    modalCancelBtn: {
      flex: 1,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    modalConfirmBtn: {
      flex: 1,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    modalButtonText: {
      fontWeight: "bold",
      fontSize: scaledSize(12),
      textTransform: "uppercase",
    },
  });

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

      {/* Header */}
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
            onRefresh={fetchData}
            tintColor={theme.primary}
          />
        }
      >
        <View className="p-6">
          {/* TABS UI */}
          <View
            className="flex-row mb-6 border-b"
            style={{ borderColor: theme.cardBorder }}
          >
            <TouchableOpacity
              onPress={() => setActiveTab("pending")}
              className="mr-6 pb-2"
              style={{
                borderBottomWidth: activeTab === "pending" ? 2 : 0,
                borderBottomColor: theme.buttonPrimary,
              }}
            >
              <Text
                className="font-bold uppercase tracking-widest"
                style={{
                  color:
                    activeTab === "pending"
                      ? theme.buttonPrimary
                      : theme.textSecondary,
                  fontSize: scaledSize(12),
                }}
              >
                Pending ({invitations.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("joined")}
              className="pb-2"
              style={{
                borderBottomWidth: activeTab === "joined" ? 2 : 0,
                borderBottomColor: theme.buttonPrimary,
              }}
            >
              <Text
                className="font-bold uppercase tracking-widest"
                style={{
                  color:
                    activeTab === "joined"
                      ? theme.buttonPrimary
                      : theme.textSecondary,
                  fontSize: scaledSize(12),
                }}
              >
                Joined ({joinedHubs.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* LOADING STATE */}
          {loading && invitations.length === 0 && joinedHubs.length === 0 ? (
            <ActivityIndicator
              size="large"
              color={theme.buttonPrimary}
              style={{ marginTop: 20 }}
            />
          ) : activeTab === "pending" ? (
            /* --- PENDING TAB CONTENT --- */
            invitations.length === 0 ? (
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
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center flex-1">
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
                      <View className="flex-1 pr-2">
                        <Text
                          className="font-bold"
                          style={{
                            color: theme.text,
                            fontSize: scaledSize(14),
                          }}
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
            )
          ) : /* --- JOINED HUBS TAB CONTENT --- */
          joinedHubs.length === 0 ? (
            <View className="items-center justify-center py-10 opacity-50">
              <MaterialIcons
                name="group"
                size={scaledSize(48)}
                color={theme.textSecondary}
              />
              <Text
                className="mt-3 font-medium text-center px-4"
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(14),
                }}
              >
                You haven't joined any family hubs yet.
              </Text>
            </View>
          ) : (
            joinedHubs.map((hub) => (
              <View
                key={hub.hub_id}
                className="p-5 rounded-2xl border mb-4"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                }}
              >
                <View className="flex-row items-center mb-4">
                  <View
                    className="w-10 h-10 rounded-full justify-center items-center mr-3"
                    style={{ backgroundColor: `${theme.buttonPrimary}22` }}
                  >
                    <Text
                      className="font-bold"
                      style={{
                        color: theme.buttonPrimary,
                        fontSize: scaledSize(14),
                      }}
                    >
                      {hub.initial}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-bold"
                      style={{ color: theme.text, fontSize: scaledSize(14) }}
                    >
                      {hub.hubName}
                    </Text>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: scaledSize(12),
                      }}
                    >
                      Owner: {hub.ownerName}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => onPressLeave(hub)}
                  className="w-full py-3 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${theme.buttonDangerText}15` }}
                >
                  <Text
                    className="font-bold"
                    style={{
                      color: theme.buttonDangerText,
                      fontSize: scaledSize(13),
                    }}
                  >
                    Leave Hub
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ACCEPT MODAL */}
      <Modal visible={showAcceptModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Join Hub?</Text>
            <Text style={styles.modalBody}>
              You will gain {selectedInvite?.role} access to{" "}
              <Text style={{ fontWeight: "bold", color: theme.text }}>
                {selectedInvite?.hubName}
              </Text>
              .
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setShowAcceptModal(false)}
                disabled={processing}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmAccept}
                disabled={processing}
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: theme.buttonPrimary },
                ]}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                    Join
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DECLINE MODAL */}
      <Modal visible={showDeclineModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Decline Invitation?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to decline the invitation from{" "}
              <Text style={{ fontWeight: "bold", color: theme.text }}>
                {selectedInvite?.inviterName}
              </Text>
              ? This action cannot be undone.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setShowDeclineModal(false)}
                disabled={processing}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDecline}
                disabled={processing}
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: isDarkMode ? "#ff4444" : "#cc0000" },
                ]}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                    Decline
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* LEAVE MODAL */}
      <Modal visible={showLeaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Leave Hub?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to remove your access to{" "}
              <Text style={{ fontWeight: "bold", color: theme.text }}>
                {hubToLeave?.hubName}
              </Text>
              ? You will need a new invitation to rejoin.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => setShowLeaveModal(false)}
                disabled={processing}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmLeave}
                disabled={processing}
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: isDarkMode ? "#ff4444" : "#cc0000" },
                ]}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                    Leave
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ALERT MODAL */}
      <Modal visible={alertModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{alertConfig.title}</Text>
            <Text style={styles.modalBody}>{alertConfig.message}</Text>
            <TouchableOpacity
              onPress={() => setAlertModalVisible(false)}
              style={[
                styles.modalConfirmBtn,
                {
                  backgroundColor:
                    alertConfig.type === "success"
                      ? theme.buttonPrimary
                      : isDarkMode
                        ? "#ff4444"
                        : "#cc0000",
                  width: "100%",
                  flex: 0,
                },
              ]}
            >
              <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                Okay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
