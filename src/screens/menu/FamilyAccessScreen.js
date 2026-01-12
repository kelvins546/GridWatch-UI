import React, { useState } from "react";
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
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AVAILABLE_HUBS = [
  { id: "living", name: "Living Room Hub" },
  { id: "kitchen", name: "Kitchen Hub" },
  { id: "bedroom", name: "Bedroom Hub" },
  { id: "garage", name: "Garage Hub" },
];

const INITIAL_MEMBERS = [
  {
    id: "1",
    name: "Natasha Pearl",
    email: "natasha@example.com",
    role: "Admin",
    access: "All Hubs",
    initial: "NP",
  },
  {
    id: "2",
    name: "Leo Carlo",
    email: "leo@example.com",
    role: "Guest",
    access: "Living Room Hub, Kitchen Hub",
    initial: "LC",
  },
];

const INITIAL_PENDING = [
  {
    id: "p1",
    email: "cousin_ben@example.com",
    access: "Garage Hub",
    status: "Pending",
    date: "Sent 2 days ago",
  },
];

export default function FamilyAccessScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const [email, setEmail] = useState("");
  const [familyMembers, setFamilyMembers] = useState(INITIAL_MEMBERS);
  const [pendingInvites, setPendingInvites] = useState(INITIAL_PENDING);
  const [isInviting, setIsInviting] = useState(false);

  const [activeTab, setActiveTab] = useState("members");

  const [showHubModal, setShowHubModal] = useState(false);
  const [selectedHubs, setSelectedHubs] = useState([]);
  const [grantAllAccess, setGrantAllAccess] = useState(true);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);

  const [showMemberOptions, setShowMemberOptions] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [itemToRevoke, setItemToRevoke] = useState(null);

  const handlePreInvite = () => {
    if (!email.includes("@")) {
      setShowErrorModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmInvite = () => {
    setShowConfirmModal(false);
    setIsInviting(true);

    setTimeout(() => {
      const newPending = {
        id: Date.now().toString(),
        email: email,
        access: grantAllAccess
          ? "All Hubs"
          : selectedHubs
              .map((id) => AVAILABLE_HUBS.find((h) => h.id === id)?.name)
              .join(", "),
        status: "Pending",
        date: "Sent just now",
      };

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPendingInvites([newPending, ...pendingInvites]);
      setEmail("");
      setGrantAllAccess(true);
      setSelectedHubs([]);
      setIsInviting(false);
      setActiveTab("pending");
    }, 1500);
  };

  const handleRevokePress = (id) => {
    setItemToRevoke(id);
    setShowRevokeModal(true);
  };

  const confirmRevoke = () => {
    if (itemToRevoke) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPendingInvites(pendingInvites.filter((i) => i.id !== itemToRevoke));
      setItemToRevoke(null);
      setShowRevokeModal(false);
    }
  };

  const openMemberOptions = (member) => {
    setSelectedMember(member);
    setShowMemberOptions(true);
  };

  const handleEditAccess = () => {
    setShowMemberOptions(false);
    setGrantAllAccess(false);
    setSelectedHubs([]);
    setTimeout(() => {
      setShowHubModal(true);
    }, 200);
  };

  const handleRemoveMemberPress = () => {
    setShowMemberOptions(false);
    setTimeout(() => {
      setShowRemoveMemberModal(true);
    }, 200);
  };

  const confirmRemoveMember = () => {
    if (selectedMember) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setFamilyMembers(familyMembers.filter((m) => m.id !== selectedMember.id));
      setSelectedMember(null);
      setShowRemoveMemberModal(false);
    }
  };

  const toggleHubSelection = (hubId) => {
    if (selectedHubs.includes(hubId)) {
      setSelectedHubs(selectedHubs.filter((id) => id !== hubId));
    } else {
      setSelectedHubs([...selectedHubs, hubId]);
    }
  };

  const saveHubSelection = () => {
    const newAccessString = grantAllAccess
      ? "All Hubs"
      : selectedHubs.length > 0
      ? selectedHubs
          .map((id) => AVAILABLE_HUBS.find((h) => h.id === id)?.name)
          .join(", ")
      : "No Access";

    if (selectedMember && !showConfirmModal) {
      const updatedMembers = familyMembers.map((m) =>
        m.id === selectedMember.id ? { ...m, access: newAccessString } : m
      );
      setFamilyMembers(updatedMembers);
      setSelectedMember(null);
    }
    setShowHubModal(false);
  };

  const getAccessSummary = () => {
    if (grantAllAccess) return "Full Access (All Hubs)";
    if (selectedHubs.length === 0) return "No Access Selected";
    if (selectedHubs.length === AVAILABLE_HUBS.length)
      return "Full Access (All Hubs)";
    return `${selectedHubs.length} Hub(s) Selected`;
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
          Family Access
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Invite Section */}
          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Invite New User
          </Text>

          <View
            className="p-5 rounded-2xl border mb-8"
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
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text
              className="font-medium mb-2"
              style={{ color: theme.text, fontSize: scaledSize(14) }}
            >
              Access Rights
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedMember(null);
                setShowHubModal(true);
              }}
              className="flex-row items-center justify-between border rounded-xl px-4 mb-6"
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
                  {getAccessSummary()}
                </Text>
              </View>
              <MaterialIcons
                name="expand-more"
                size={scaledSize(20)}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePreInvite}
              disabled={isInviting}
              style={{
                backgroundColor: theme.buttonPrimary,
                borderRadius: 12,
                // FIXED: Returned to standard height and full width
                height: scaledSize(48),
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                opacity: isInviting ? 0.7 : 1,
              }}
            >
              {isInviting ? (
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

          {/* Members / Pending Tabs */}
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

          {/* List Content */}
          {activeTab === "members" ? (
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

      {/* Hub Selection Modal (Bottom Sheet) */}
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
              height: "60%",
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

            {/* Grant All Toggle */}
            <TouchableOpacity
              onPress={() => setGrantAllAccess(!grantAllAccess)}
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
                <FlatList
                  data={AVAILABLE_HUBS}
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
              </View>
            )}

            <TouchableOpacity
              onPress={saveHubSelection}
              className="mt-4 w-full rounded-xl h-12 justify-center items-center"
              style={{ backgroundColor: theme.buttonPrimary }}
            >
              <Text
                className="font-bold"
                style={{ color: "#fff", fontSize: scaledSize(14) }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Member Options Modal (Bottom Sheet) */}
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

      {/* Confirm Invite Modal - MATCHING INVITATION SCREEN */}
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

      {/* Revoke Modal - MATCHING INVITATION SCREEN */}
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
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: theme.buttonDangerText }}
              >
                <Text
                  className="font-bold"
                  style={{ color: "#fff", fontSize: scaledSize(13) }}
                >
                  Revoke
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Remove Member Modal - MATCHING INVITATION SCREEN */}
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
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: theme.buttonDangerText }}
              >
                <Text
                  className="font-bold"
                  style={{ color: "#fff", fontSize: scaledSize(13) }}
                >
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal - MATCHING INVITATION SCREEN */}
      <Modal visible={showErrorModal} transparent animationType="fade">
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
              Invalid Email
            </Text>
            <Text
              className="text-center mb-6 leading-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
            >
              Please enter a valid email address.
            </Text>
            <TouchableOpacity
              onPress={() => setShowErrorModal(false)}
              className="w-[50%] self-center py-3 rounded-xl items-center"
              style={{ backgroundColor: theme.buttonPrimary }}
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
