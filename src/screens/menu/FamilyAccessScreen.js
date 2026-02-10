import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FamilyAccessScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();
  const scaledSize = (size) => size * fontScale;

  const [email, setEmail] = useState("");

  const [myHubs, setMyHubs] = useState([]);

  const [familyMembers, setFamilyMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimer, setSearchTimer] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [activeTab, setActiveTab] = useState("members");

  const [showHubModal, setShowHubModal] = useState(false);
  const [selectedHubs, setSelectedHubs] = useState([]);
  const [grantAllAccess, setGrantAllAccess] = useState(true);

  const [isHubDropdownOpen, setIsHubDropdownOpen] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);

  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "success",
    title: "",
    message: "",
  });

  const [showMemberOptions, setShowMemberOptions] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [itemToRevoke, setItemToRevoke] = useState(null);

  const showAlert = (type, title, message) => {
    setAlertConfig({ type, title, message });
    setAlertModalVisible(true);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: realHubs, error: hubsError } = await supabase
        .from("hubs")
        .select("id, name")
        .eq("user_id", user.id);

      if (hubsError) throw hubsError;

      const hubsList = realHubs || [];
      setMyHubs(hubsList);

      const realHubIds = hubsList.map((h) => h.id);

      const { data: invites, error: inviteError } = await supabase
        .from("hub_invites")
        .select("*")
        .eq("sender_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (inviteError) throw inviteError;

      const formattedInvites = invites.map((invite) => {
        const hubCount = invite.hub_ids ? invite.hub_ids.length : 0;
        const totalHubs = hubsList.length;
        const accessText =
          hubCount >= totalHubs ? "All Hubs" : `${hubCount} Hubs`;

        return {
          id: invite.id,
          email: invite.email,
          access: accessText,
          status: "Pending",
          date: new Date(invite.created_at).toLocaleDateString(),
        };
      });
      setPendingInvites(formattedInvites);

      if (realHubIds.length > 0) {
        const { data: accessRecords, error: accessError } = await supabase
          .from("hub_access")
          .select("user_id, hub_id, role, users(first_name, last_name, email)")
          .in("hub_id", realHubIds);

        if (!accessError && accessRecords) {
          const memberMap = {};
          accessRecords.forEach((record) => {
            if (!record.users) return;
            const uid = record.user_id;
            if (!memberMap[uid]) {
              memberMap[uid] = {
                id: uid,
                name:
                  `${record.users.first_name} ${record.users.last_name}`.trim() ||
                  "Unknown",
                email: record.users.email,
                role: record.role,
                hubIds: [],
                initial: (
                  record.users.first_name?.[0] ||
                  record.users.email?.[0] ||
                  "?"
                ).toUpperCase(),
              };
            }
            memberMap[uid].hubIds.push(record.hub_id);
          });

          const formattedMembers = Object.values(memberMap).map((m) => {
            const hubCount = m.hubIds.length;
            const accessStr =
              hubCount >= hubsList.length
                ? "All Hubs"
                : `${hubCount} Hubs Selected`;
            return { ...m, access: accessStr };
          });
          setFamilyMembers(formattedMembers);
        }
      } else {
        setFamilyMembers([]);
      }
    } catch (err) {
      console.log("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const handleTextChange = (text) => {
    setEmail(text);

    if (searchTimer) clearTimeout(searchTimer);

    if (text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, email, first_name, last_name, avatar_url")
          .ilike("email", `%${text}%`)
          .limit(5);

        if (!error && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.log("Search error:", err);
      }
    }, 300);

    setSearchTimer(timer);
  };

  const selectSuggestion = (user) => {
    setEmail(user.email);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handlePreInvite = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes("@")) {
      showAlert(
        "error",
        "Invalid Email",
        "Please enter a valid email address.",
      );
      return;
    }

    if (myHubs.length === 0) {
      showAlert(
        "error",
        "No Hubs",
        "You need to add a Hub to your account before inviting others.",
      );
      return;
    }

    setIsCheckingEmail(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user.email === trimmedEmail)
        throw new Error("You cannot invite yourself.");

      const { data: recipient } = await supabase
        .from("users")
        .select("id")
        .eq("email", trimmedEmail)
        .maybeSingle();

      if (!recipient)
        throw new Error("This email is not registered with GridWatch.");

      setShowConfirmModal(true);
    } catch (err) {
      showAlert("error", "Invitation Error", err.message);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const confirmInvite = async () => {
    setShowConfirmModal(false);
    setIsInviting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let hubIdsToGrant = selectedHubs;

      if (grantAllAccess) {
        hubIdsToGrant = myHubs.map((h) => h.id);
      }

      if (hubIdsToGrant.length === 0)
        throw new Error("Select at least one hub.");

      const { error } = await supabase.from("hub_invites").insert({
        sender_id: user.id,
        email: email.trim().toLowerCase(),
        hub_ids: hubIdsToGrant,
        status: "pending",
      });

      if (error) throw error;

      showAlert("success", "Invitation Sent", `Invitation sent to ${email}`);

      setEmail("");
      setGrantAllAccess(true);
      setSelectedHubs([]);
      fetchData();
      setActiveTab("pending");
    } catch (err) {
      showAlert("error", "Failed to Send", err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokePress = (id) => {
    setItemToRevoke(id);
    setShowRevokeModal(true);
  };

  const confirmRevoke = async () => {
    if (!itemToRevoke) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("hub_invites")
        .delete()
        .eq("id", itemToRevoke);

      if (error) throw error;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPendingInvites((prev) => prev.filter((i) => i.id !== itemToRevoke));
      setShowRevokeModal(false);
      setItemToRevoke(null);
    } catch (err) {
      showAlert("error", "Error", "Failed to revoke invitation.");
    } finally {
      setProcessing(false);
    }
  };

  const confirmRemoveMember = async () => {
    if (!selectedMember) return;
    setProcessing(true);
    try {
      const realHubIds = myHubs.map((h) => h.id);

      const { error } = await supabase
        .from("hub_access")
        .delete()
        .eq("user_id", selectedMember.id)
        .in("hub_id", realHubIds);

      if (error) throw error;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setFamilyMembers((prev) =>
        prev.filter((m) => m.id !== selectedMember.id),
      );
      setShowRemoveMemberModal(false);
      setSelectedMember(null);
    } catch (err) {
      showAlert("error", "Error", "Failed to remove user.");
    } finally {
      setProcessing(false);
    }
  };

  const toggleHubSelection = (hubId) => {
    if (selectedHubs.includes(hubId)) {
      setSelectedHubs(selectedHubs.filter((id) => id !== hubId));
      setGrantAllAccess(false);
    } else {
      const newSelection = [...selectedHubs, hubId];
      setSelectedHubs(newSelection);

      if (newSelection.length === myHubs.length) {
        setGrantAllAccess(true);
      }
    }
  };

  const getAccessSummary = () => {
    if (grantAllAccess) return "Full Access (All Hubs)";
    if (selectedHubs.length === 0) return "No Access Selected";

    if (selectedHubs.length === myHubs.length) return "Full Access (All Hubs)";
    return `${selectedHubs.length} Hub(s) Selected`;
  };

  const openMemberOptions = (member) => {
    setSelectedMember(member);
    setShowMemberOptions(true);
  };

  const handleEditAccess = () => {
    if (!selectedMember) return;
    const currentHubIds = selectedMember.hubIds || [];
    setSelectedHubs(currentHubIds);

    setGrantAllAccess(currentHubIds.length === myHubs.length);
    setShowMemberOptions(false);
    setTimeout(() => setShowHubModal(true), 200);
  };

  const handleRemoveMemberPress = () => {
    setShowMemberOptions(false);
    setTimeout(() => setShowRemoveMemberModal(true), 200);
  };

  const saveHubSelection = async () => {
    if (!selectedMember) {
      setShowHubModal(false);
      return;
    }

    setShowHubModal(false);
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
          Family Access
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-6">
          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Invite New User
          </Text>

          {}
          <View
            className="p-5 rounded-2xl border mb-8 z-50"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <Text
              className="font-medium mb-2"
              style={{ color: theme.text, fontSize: scaledSize(14) }}
            >
              Email Address
            </Text>

            {}
            <View className="relative z-50">
              <View
                className="flex-row items-center border rounded-xl px-3 mb-4"
                style={{
                  borderColor: theme.cardBorder,
                  backgroundColor: theme.background,
                  height: scaledSize(48),
                }}
              >
                <MaterialIcons
                  name="email"
                  size={scaledSize(20)}
                  color={theme.textSecondary}
                />
                <TextInput
                  className="flex-1 ml-3 font-medium"
                  style={{ color: theme.text, fontSize: scaledSize(14) }}
                  placeholder="user@example.com"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={handleTextChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {}
              {showSuggestions && suggestions.length > 0 && (
                <View
                  className="absolute top-[50px] left-0 right-0 rounded-xl border shadow-lg overflow-hidden"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                    elevation: 5,
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 4,
                    zIndex: 100,
                  }}
                >
                  {suggestions.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      onPress={() => selectSuggestion(user)}
                      className="flex-row items-center p-3 border-b last:border-b-0"
                      style={{ borderBottomColor: theme.cardBorder }}
                    >
                      {user.avatar_url ? (
                        <Image
                          source={{ uri: user.avatar_url }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            marginRight: 10,
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            marginRight: 10,
                            backgroundColor: theme.buttonPrimary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ color: "#fff", fontWeight: "bold" }}>
                            {(
                              user.first_name?.[0] || user.email[0]
                            ).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      <View>
                        <Text
                          style={{
                            color: theme.text,
                            fontWeight: "bold",
                            fontSize: scaledSize(13),
                          }}
                        >
                          {user.first_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.email.split("@")[0]}
                        </Text>
                        <Text
                          style={{
                            color: theme.textSecondary,
                            fontSize: scaledSize(11),
                          }}
                        >
                          {user.email}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Text
              className="font-medium mb-2"
              style={{ color: theme.text, fontSize: scaledSize(14) }}
            >
              Access Rights
            </Text>

            {}
            <TouchableOpacity
              onPress={() => {
                setGrantAllAccess(!grantAllAccess);
                if (!grantAllAccess) {
                  setSelectedHubs(myHubs.map((h) => h.id));
                } else {
                  setSelectedHubs([]);
                }
              }}
              className="flex-row items-center justify-between border rounded-xl px-4 mb-4"
              style={{
                borderColor: theme.cardBorder,
                backgroundColor: theme.background,
                height: scaledSize(48),
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name={grantAllAccess ? "vpn-key" : "lock"}
                  size={scaledSize(20)}
                  color={theme.buttonPrimary}
                />
                <Text
                  className="ml-3 font-medium"
                  style={{ color: theme.text, fontSize: scaledSize(14) }}
                >
                  Full Access (All Hubs)
                </Text>
              </View>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: grantAllAccess
                    ? theme.buttonPrimary
                    : theme.textSecondary,
                  backgroundColor: grantAllAccess
                    ? theme.buttonPrimary
                    : "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {grantAllAccess && (
                  <MaterialIcons name="check" size={14} color="#fff" />
                )}
              </View>
            </TouchableOpacity>

            {}
            <View>
              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setIsHubDropdownOpen(!isHubDropdownOpen);
                }}
                className="flex-row items-center justify-between border rounded-xl px-4 mb-4"
                style={{
                  borderColor: theme.cardBorder,
                  backgroundColor: theme.background,
                  height: scaledSize(48),
                }}
              >
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="grid-view"
                    size={scaledSize(20)}
                    color={theme.textSecondary}
                  />
                  <Text
                    className="ml-3 font-medium"
                    style={{ color: theme.text, fontSize: scaledSize(14) }}
                  >
                    {grantAllAccess
                      ? "All Hubs Selected"
                      : selectedHubs.length > 0
                        ? `${selectedHubs.length} Hubs Selected`
                        : "Select Hubs"}
                  </Text>
                </View>
                <MaterialIcons
                  name={isHubDropdownOpen ? "expand-less" : "expand-more"}
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>

              {}
              {isHubDropdownOpen && (
                <View className="mb-4 pl-2">
                  {myHubs.length === 0 ? (
                    <Text style={{ color: theme.textSecondary, padding: 8 }}>
                      No Hubs Found
                    </Text>
                  ) : (
                    myHubs.map((hub) => {
                      const isSelected =
                        selectedHubs.includes(hub.id) || grantAllAccess;
                      return (
                        <TouchableOpacity
                          key={hub.id}
                          onPress={() => {
                            if (grantAllAccess) {
                              setGrantAllAccess(false);
                              const allIds = myHubs
                                .map((h) => h.id)
                                .filter((id) => id !== hub.id);
                              setSelectedHubs(allIds);
                            } else {
                              toggleHubSelection(hub.id);
                            }
                          }}
                          className="flex-row items-center py-2"
                        >
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              borderWidth: 1,
                              borderColor: isSelected
                                ? theme.buttonPrimary
                                : theme.textSecondary,
                              backgroundColor: isSelected
                                ? theme.buttonPrimary
                                : "transparent",
                              justifyContent: "center",
                              alignItems: "center",
                              marginRight: 12,
                            }}
                          >
                            {isSelected && (
                              <MaterialIcons
                                name="check"
                                size={14}
                                color="#fff"
                              />
                            )}
                          </View>
                          <Text
                            style={{
                              color: theme.text,
                              fontSize: scaledSize(14),
                            }}
                          >
                            {hub.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={handlePreInvite}
              disabled={isInviting || isCheckingEmail}
              style={{
                backgroundColor: theme.buttonPrimary,
                borderRadius: 12,
                height: scaledSize(48),
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                opacity: isInviting || isCheckingEmail ? 0.7 : 1,
              }}
            >
              {isInviting || isCheckingEmail ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  className="font-bold"
                  style={{ color: "#fff", fontSize: scaledSize(14) }}
                >
                  Send Invite
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View
            className="flex-row mb-4 border-b"
            style={{ borderColor: theme.cardBorder }}
          >
            <TouchableOpacity
              onPress={() => setActiveTab("members")}
              className="mr-6 pb-2"
              style={{
                borderBottomWidth: activeTab === "members" ? 2 : 0,
                borderBottomColor: theme.buttonPrimary,
              }}
            >
              <Text
                className="font-bold"
                style={{
                  color:
                    activeTab === "members"
                      ? theme.buttonPrimary
                      : theme.textSecondary,
                  fontSize: scaledSize(14),
                }}
              >
                Members ({familyMembers.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("pending")}
              className="pb-2"
              style={{
                borderBottomWidth: activeTab === "pending" ? 2 : 0,
                borderBottomColor: theme.buttonPrimary,
              }}
            >
              <Text
                className="font-bold"
                style={{
                  color:
                    activeTab === "pending"
                      ? theme.buttonPrimary
                      : theme.textSecondary,
                  fontSize: scaledSize(14),
                }}
              >
                Pending ({pendingInvites.length})
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={theme.buttonPrimary}
              style={{ marginTop: 20 }}
            />
          ) : activeTab === "members" ? (
            familyMembers.length === 0 ? (
              <Text
                style={{
                  color: theme.textSecondary,
                  textAlign: "center",
                  marginTop: 20,
                  fontStyle: "italic",
                }}
              >
                No family members yet.
              </Text>
            ) : (
              familyMembers.map((member) => (
                <View
                  key={member.id}
                  className="flex-row items-center p-4 rounded-xl border mb-3"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  }}
                >
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
                      {member.initial}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-bold"
                      style={{ color: theme.text, fontSize: scaledSize(14) }}
                    >
                      {member.name}
                    </Text>
                    <Text
                      className="mt-0.5"
                      style={{
                        color: theme.textSecondary,
                        fontSize: scaledSize(12),
                      }}
                    >
                      {member.access}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openMemberOptions(member)}
                    style={{
                      padding: 8,
                      backgroundColor: theme.buttonNeutral,
                      borderRadius: 8,
                    }}
                  >
                    <MaterialIcons
                      name="more-horiz"
                      size={scaledSize(20)}
                      color={theme.text}
                    />
                  </TouchableOpacity>
                </View>
              ))
            )
          ) : pendingInvites.length === 0 ? (
            <Text
              style={{
                color: theme.textSecondary,
                textAlign: "center",
                marginTop: 20,
                fontStyle: "italic",
              }}
            >
              No pending invitations.
            </Text>
          ) : (
            pendingInvites.map((invite) => (
              <View
                key={invite.id}
                className="p-4 rounded-xl border mb-3"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text
                      className="font-bold"
                      style={{ color: theme.text, fontSize: scaledSize(14) }}
                    >
                      {invite.email}
                    </Text>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: scaledSize(12),
                      }}
                    >
                      Access: {invite.access}
                    </Text>
                  </View>
                  <View className="bg-yellow-500/10 px-2 py-1 rounded">
                    <Text
                      style={{
                        color: "#EAB308",
                        fontSize: scaledSize(10),
                        fontWeight: "600",
                      }}
                    >
                      {invite.status}
                    </Text>
                  </View>
                </View>
                <View
                  className="flex-row justify-between items-center mt-2 border-t pt-2"
                  style={{ borderColor: theme.cardBorder }}
                >
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(11),
                    }}
                  >
                    {invite.date}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRevokePress(invite.id)}
                  >
                    <Text
                      style={{
                        color: theme.buttonDangerText,
                        fontWeight: "bold",
                        fontSize: scaledSize(12),
                      }}
                    >
                      Revoke
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {}
      <Modal visible={showHubModal} transparent animationType="slide">
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View
            className="rounded-t-3xl border-t p-6"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              maxHeight: "70%",
            }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text
                className="font-bold"
                style={{ color: theme.text, fontSize: scaledSize(18) }}
              >
                {selectedMember
                  ? `Edit Access: ${selectedMember.name}`
                  : "Select Access"}
              </Text>
              <TouchableOpacity onPress={() => setShowHubModal(false)}>
                <MaterialIcons
                  name="close"
                  size={scaledSize(24)}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                const newState = !grantAllAccess;
                setGrantAllAccess(newState);
                if (newState) setSelectedHubs(myHubs.map((h) => h.id));
                else setSelectedHubs([]);
              }}
              className="flex-row items-center justify-between p-4 rounded-xl border mb-4"
              style={{
                backgroundColor: theme.background,
                borderColor: grantAllAccess
                  ? theme.buttonPrimary
                  : theme.cardBorder,
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full justify-center items-center mr-3"
                  style={{
                    backgroundColor: grantAllAccess
                      ? theme.buttonPrimary
                      : theme.buttonNeutral,
                  }}
                >
                  <MaterialIcons
                    name="home"
                    size={scaledSize(20)}
                    color={grantAllAccess ? "#fff" : theme.textSecondary}
                  />
                </View>
                <View>
                  <Text
                    className="font-bold"
                    style={{ color: theme.text, fontSize: scaledSize(14) }}
                  >
                    Full Access
                  </Text>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: scaledSize(12),
                    }}
                  >
                    Can control all hubs
                  </Text>
                </View>
              </View>
              {grantAllAccess && (
                <MaterialIcons
                  name="check-circle"
                  size={scaledSize(24)}
                  color={theme.buttonPrimary}
                />
              )}
            </TouchableOpacity>

            {!grantAllAccess && (
              <View className="flex-1">
                <Text
                  className="mb-3 font-medium"
                  style={{
                    color: theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  Or select specific hubs:
                </Text>
                {myHubs.length === 0 ? (
                  <Text style={{ color: theme.textSecondary }}>
                    No Hubs Available
                  </Text>
                ) : (
                  <FlatList
                    data={myHubs}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => {
                      const isSelected = selectedHubs.includes(item.id);
                      return (
                        <TouchableOpacity
                          onPress={() => toggleHubSelection(item.id)}
                          className="flex-row items-center justify-between p-4 rounded-xl border mb-3"
                          style={{
                            borderColor: isSelected
                              ? theme.buttonPrimary
                              : theme.cardBorder,
                            backgroundColor: isSelected
                              ? `${theme.buttonPrimary}10`
                              : "transparent",
                          }}
                        >
                          <Text
                            className="font-medium"
                            style={{
                              color: theme.text,
                              fontSize: scaledSize(14),
                            }}
                          >
                            {item.name}
                          </Text>
                          <View
                            className="w-5 h-5 rounded border justify-center items-center"
                            style={{
                              borderColor: isSelected
                                ? theme.buttonPrimary
                                : theme.textSecondary,
                              backgroundColor: isSelected
                                ? theme.buttonPrimary
                                : "transparent",
                            }}
                          >
                            {isSelected && (
                              <MaterialIcons
                                name="check"
                                size={scaledSize(14)}
                                color="#fff"
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </View>
            )}

            <TouchableOpacity
              onPress={saveHubSelection}
              disabled={processing}
              className="mt-4 w-full rounded-xl h-12 justify-center items-center"
              style={{ backgroundColor: theme.buttonPrimary }}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  className="font-bold"
                  style={{ color: "#fff", fontSize: scaledSize(14) }}
                >
                  Done
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {}
      <Modal visible={showMemberOptions} transparent animationType="slide">
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <TouchableOpacity
            className="flex-1"
            onPress={() => setShowMemberOptions(false)}
          />
          <View
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: theme.card }}
          >
            <View className="items-center mb-6">
              <View
                className="w-12 h-1 rounded-full mb-4"
                style={{ backgroundColor: theme.cardBorder }}
              />
              <Text
                className="font-bold text-center"
                style={{ color: theme.text, fontSize: scaledSize(16) }}
              >
                Manage {selectedMember?.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleEditAccess}
              className="flex-row items-center p-4 rounded-xl mb-3"
              style={{ backgroundColor: theme.buttonNeutral }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: theme.background }}
              >
                <MaterialIcons
                  name="edit"
                  size={scaledSize(20)}
                  color={theme.text}
                />
              </View>
              <Text
                className="font-bold"
                style={{ color: theme.text, fontSize: scaledSize(14) }}
              >
                Edit Access Rights
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRemoveMemberPress}
              className="flex-row items-center p-4 rounded-xl mb-6"
              style={{ backgroundColor: `${theme.buttonDangerText}15` }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: theme.background }}
              >
                <MaterialIcons
                  name="delete"
                  size={scaledSize(20)}
                  color={theme.buttonDangerText}
                />
              </View>
              <Text
                className="font-bold"
                style={{
                  color: theme.buttonDangerText,
                  fontSize: scaledSize(14),
                }}
              >
                Remove User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowMemberOptions(false)}
              className="w-full h-12 rounded-xl items-center justify-center border"
              style={{ borderColor: theme.cardBorder }}
            >
              <Text
                className="font-bold"
                style={{ color: theme.text, fontSize: scaledSize(14) }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View
          className="flex-1 justify-center items-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        >
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
              Confirm Invite?
            </Text>
            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              Send invitation to{" "}
              <Text style={{ fontWeight: "bold", color: theme.text }}>
                {email}
              </Text>{" "}
              with{" "}
              <Text style={{ fontWeight: "bold", color: theme.text }}>
                {getAccessSummary()}
              </Text>
              ?
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
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
                onPress={confirmInvite}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: theme.buttonPrimary }}
              >
                <Text
                  className="font-bold"
                  style={{ color: "#fff", fontSize: scaledSize(13) }}
                >
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <Modal visible={showRevokeModal} transparent animationType="fade">
        <View
          className="flex-1 justify-center items-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        >
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
              Revoke Invite?
            </Text>
            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              Are you sure you want to cancel this pending invitation?
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => setShowRevokeModal(false)}
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
                onPress={confirmRevoke}
                disabled={processing}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: theme.buttonDangerText }}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    className="font-bold"
                    style={{ color: "#fff", fontSize: scaledSize(13) }}
                  >
                    Revoke
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <Modal visible={showRemoveMemberModal} transparent animationType="fade">
        <View
          className="flex-1 justify-center items-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        >
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
              Remove User?
            </Text>
            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              Remove{" "}
              <Text style={{ fontWeight: "bold", color: theme.text }}>
                {selectedMember?.name}
              </Text>
              ? They will lose access immediately.
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => setShowRemoveMemberModal(false)}
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
                onPress={confirmRemoveMember}
                disabled={processing}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: theme.buttonDangerText }}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    className="font-bold"
                    style={{ color: "#fff", fontSize: scaledSize(13) }}
                  >
                    Remove
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <Modal visible={alertModalVisible} transparent animationType="fade">
        <View
          className="flex-1 justify-center items-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        >
          <View
            className="w-[85%] max-w-[320px] p-5 rounded-2xl border items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            {}
            <Text
              className="font-bold mb-2 text-center"
              style={{ color: theme.text, fontSize: scaledSize(18) }}
            >
              {alertConfig.title}
            </Text>
            {}
            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              {alertConfig.message}
            </Text>
            {}
            <TouchableOpacity
              onPress={() => setAlertModalVisible(false)}
              className="w-[50%] self-center py-3 rounded-xl items-center"
              style={{
                backgroundColor:
                  alertConfig.type === "success"
                    ? theme.buttonPrimary
                    : theme.buttonDangerText,
              }}
            >
              <Text
                className="font-bold"
                style={{ color: "#fff", fontSize: scaledSize(13) }}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
