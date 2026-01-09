import React, { useState } from "react";
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

const INCOMING_INVITES = [
  {
    id: "1",
    inviterName: "Natasha Pearl",
    inviterEmail: "natasha@gmail.com",
    hubName: "Living Room Hub",
    role: "Guest",
    date: "2 hours ago",
    initial: "NP",
  },
  {
    id: "2",
    inviterName: "Francis Gian",
    inviterEmail: "francis@yahoo.com",
    hubName: "Garage Hub",
    role: "Admin",
    date: "Yesterday",
    initial: "FG",
  },
];

export default function InvitationsScreen() {
  const navigation = useNavigation();
  const { theme, fontScale, isDarkMode } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const [invitations, setInvitations] = useState(INCOMING_INVITES);
  const [selectedInvite, setSelectedInvite] = useState(null);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const onPressAccept = (invite) => {
    setSelectedInvite(invite);
    setShowAcceptModal(true);
  };

  const onPressDecline = (invite) => {
    setSelectedInvite(invite);
    setShowDeclineModal(true);
  };

  const confirmAccept = () => {
    if (selectedInvite) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setInvitations((prev) => prev.filter((i) => i.id !== selectedInvite.id));
      setShowAcceptModal(false);
      setSelectedInvite(null);
    }
  };

  const confirmDecline = () => {
    if (selectedInvite) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setInvitations((prev) => prev.filter((i) => i.id !== selectedInvite.id));
      setShowDeclineModal(false);
      setSelectedInvite(null);
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

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <Text
            className="font-bold uppercase tracking-widest mb-4"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Incoming Requests
          </Text>

          {invitations.length === 0 ? (
            <View className="items-center justify-center py-10 opacity-50">
              <MaterialIcons
                name="mail-outline"
                size={scaledSize(48)}
                color={theme.textSecondary}
              />
              <Text
                className="mt-3 font-medium"
                style={{ color: theme.textSecondary, fontSize: scaledSize(14) }}
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
                {}
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

                {}
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
                  <View>
                    <Text
                      className="font-bold"
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

                {}
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
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: theme.buttonPrimary }}
              >
                <Text
                  className="font-bold"
                  style={{ color: "#fff", fontSize: scaledSize(13) }}
                >
                  Join
                </Text>
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
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor: isDarkMode ? "#ff4444" : "#cc0000",
                }}
              >
                <Text
                  className="font-bold"
                  style={{ color: "#fff", fontSize: scaledSize(13) }}
                >
                  Decline
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
