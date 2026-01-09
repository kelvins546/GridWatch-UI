import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function CustomModal({
  visible,
  type = "success",
  title,
  message,
  onClose,
  onAction,
  actionLabel = "CONTINUE",
  children,
}) {
  const { theme } = useTheme();

  let iconName = "check-circle";
  let mainColor = theme.buttonPrimary;
  let btnTextColor = theme.buttonPrimaryText;

  if (type === "error") {
    iconName = "error-outline";
    mainColor = theme.buttonDangerText;
    btnTextColor = "#ffffff";
  } else if (type === "otp") {
    iconName = "mark-email-read";
    mainColor = theme.buttonPrimary;
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,

              width: "75%",
              maxWidth: 280,
            },
          ]}
        >
          {}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.buttonNeutral, marginBottom: 12 },
            ]}
          >
            <MaterialIcons name={iconName} size={28} color={mainColor} />
          </View>

          {}
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {title}
          </Text>
          {message && (
            <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
              {message}
            </Text>
          )}

          {}
          {children && (
            <View style={{ width: "100%", marginBottom: 15 }}>{children}</View>
          )}

          {}
          {onAction && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: mainColor }]}
              onPress={onAction}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: btnTextColor }]}>
                {actionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  modalCard: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "center",
    minWidth: 100,
  },
  btnText: {
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
