import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

export default function BudgetDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode, fontScale } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const { deviceName, deviceId } = route.params || {
    deviceName: "Air Conditioner",
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [period, setPeriod] = useState("Monthly");
  const [limit, setLimit] = useState("0");
  const [autoCutoff, setAutoCutoff] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  const [globalBudget, setGlobalBudget] = useState(0);
  const [otherDevicesLimit, setOtherDevicesLimit] = useState(0);
  const [usedAmount, setUsedAmount] = useState(0);
  const [currentDbDevice, setCurrentDbDevice] = useState(null);

  const [statusModal, setStatusModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchDeviceData();
  }, [deviceName]);

  const fetchDeviceData = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase.from("devices").select("*").eq("user_id", user.id);

      if (deviceId) {
        query = query.eq("id", deviceId);
      } else {
        query = query.eq("name", deviceName);
      }

      const { data: deviceData, error: deviceError } = await query.single();

      if (deviceError) throw deviceError;
      setCurrentDbDevice(deviceData);

      setLimit(
        deviceData.budget_limit ? deviceData.budget_limit.toString() : "0",
      );
      setAutoCutoff(deviceData.auto_cutoff || false);
      setPushNotifications(deviceData.is_monitored || false);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("monthly_budget")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;
      setGlobalBudget(userData.monthly_budget || 0);

      const { data: allDevices, error: allDevError } = await supabase
        .from("devices")
        .select("id, budget_limit")
        .eq("user_id", user.id)
        .neq("id", deviceData.id);

      if (allDevError) throw allDevError;

      const othersTotal = allDevices.reduce(
        (sum, d) => sum + (d.budget_limit || 0),
        0,
      );
      setOtherDevicesLimit(othersTotal);

      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();

      const { data: usageData, error: usageError } = await supabase
        .from("usage_analytics")
        .select("cost_incurred")
        .eq("device_id", deviceData.id)
        .gte("date", startOfMonth);

      if (usageError) throw usageError;

      const totalUsed = usageData.reduce(
        (sum, row) => sum + (row.cost_incurred || 0),
        0,
      );
      setUsedAmount(totalUsed);
    } catch (error) {
      console.log("Error fetching budget details:", error);
      setStatusModal({
        visible: true,
        title: "Error",
        message: "Failed to load device data.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setShowConfirmModal(true);
  };

  const executeSave = async () => {
    setShowConfirmModal(false);
    if (!currentDbDevice) return;
    setIsSaving(true);
    try {
      const numericLimit = parseFloat(limit) || 0;

      const { error } = await supabase
        .from("devices")
        .update({
          budget_limit: numericLimit,
          auto_cutoff: autoCutoff,
          is_monitored: pushNotifications,
        })
        .eq("id", currentDbDevice.id);

      if (error) throw error;

      setStatusModal({
        visible: true,
        title: "Success",
        message: "Device budget settings updated.",
        type: "success",
        onClose: () => navigation.goBack(),
      });
    } catch (error) {
      setStatusModal({
        visible: true,
        title: "Error",
        message: "Failed to save settings.",
        type: "error",
      });
      console.log(error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentDeviceLimit = parseFloat(limit) || 0;
  const totalAllocated = otherDevicesLimit + currentDeviceLimit;
  const isOverAllocated = totalAllocated > globalBudget;

  const primaryColor = isDarkMode ? theme.buttonPrimary : "#00995e";
  const dangerColor = isDarkMode ? theme.buttonDangerText : "#cc0000";

  const numericLimit = parseFloat(limit) || 0;
  const percentage =
    numericLimit > 0
      ? Math.min((usedAmount / numericLimit) * 100, 100).toFixed(0)
      : 100;

  const remaining = Math.max(numericLimit - usedAmount, 0).toFixed(2);

  const adjustLimit = (amount) => {
    const current = parseFloat(limit) || 0;
    const next = Math.max(0, current + amount);
    setLimit(next.toString());
  };

  const handleLimitChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    setLimit(cleaned);
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.buttonPrimary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 20,
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
          backgroundColor: theme.background,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 4 }}
        >
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(20)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <Text
          style={{
            color: theme.text,
            fontSize: scaledSize(18),
            fontWeight: "bold",
          }}
        >
          {deviceName}
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{ padding: 4 }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.buttonPrimary} />
          ) : (
            <Text
              style={{
                color: theme.buttonPrimary,
                fontSize: scaledSize(14),
                fontWeight: "bold",
              }}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
          >
            Budget Period
          </Text>
          <View
            className="flex-row p-1 rounded-xl mb-8"
            style={{ backgroundColor: theme.card }}
          >
            {["Daily", "Weekly", "Monthly"].map((item) => (
              <TouchableOpacity
                key={item}
                className="flex-1 py-2 rounded-lg items-center justify-center"
                style={
                  period === item && {
                    backgroundColor: isDarkMode ? "#333" : "#fff",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 1,
                    elevation: 1,
                  }
                }
                onPress={() => setPeriod(item)}
              >
                <Text
                  className="font-semibold"
                  style={{
                    color: period === item ? theme.text : theme.textSecondary,
                    fontSize: scaledSize(12),
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
          >
            Set Limit (Pesos)
          </Text>
          <View
            className="flex-row items-center justify-between p-5 rounded-[20px] border mb-4"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: isDarkMode ? "#333" : "#eee" }}
              onPress={() => adjustLimit(-100)}
            >
              <MaterialIcons
                name="remove"
                size={scaledSize(24)}
                color={theme.text}
              />
            </TouchableOpacity>

            <View className="flex-row items-center">
              <Text
                className="font-bold mr-1"
                style={{ color: theme.text, fontSize: scaledSize(28) }}
              >
                ₱
              </Text>
              <TextInput
                value={limit}
                onChangeText={handleLimitChange}
                keyboardType="numeric"
                className="font-bold text-center"
                style={{
                  color: theme.text,
                  fontSize: scaledSize(28),
                  minWidth: 80,
                }}
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: isDarkMode ? "#333" : "#eee" }}
              onPress={() => adjustLimit(100)}
            >
              <MaterialIcons
                name="add"
                size={scaledSize(24)}
                color={theme.text}
              />
            </TouchableOpacity>
          </View>

          {}
          <View
            className="p-3 rounded-xl border mb-8"
            style={{
              backgroundColor: isOverAllocated
                ? isDarkMode
                  ? "rgba(255,68,68,0.1)"
                  : "rgba(255,200,200,0.3)"
                : isDarkMode
                  ? "rgba(0,153,94,0.1)"
                  : "rgba(200,255,220,0.3)",
              borderColor: isOverAllocated ? dangerColor : primaryColor,
            }}
          >
            <View className="flex-row items-center">
              <MaterialIcons
                name={isOverAllocated ? "warning" : "check-circle"}
                size={16}
                color={isOverAllocated ? dangerColor : primaryColor}
              />
              <Text
                className="font-bold ml-2"
                style={{
                  color: isOverAllocated ? dangerColor : primaryColor,
                  fontSize: scaledSize(12),
                }}
              >
                {isOverAllocated ? "Exceeds Global Goal" : "Within Global Goal"}
              </Text>
            </View>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: scaledSize(11),
                marginTop: 4,
                lineHeight: 16,
              }}
            >
              {isOverAllocated
                ? `This limit (₱${currentDeviceLimit}) combined with others (₱${otherDevicesLimit}) exceeds your global goal of ₱${globalBudget}.`
                : "This limit fits safely within your overall budget goal."}
            </Text>
          </View>

          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
          >
            Current Usage Status
          </Text>
          <View className="mb-8">
            <View className="flex-row justify-between mb-2">
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(13),
                }}
              >
                Used: ₱{" "}
                {usedAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text
                className="font-bold"
                style={{
                  color: theme.buttonPrimary,
                  fontSize: scaledSize(13),
                }}
              >
                {percentage}%
              </Text>
            </View>

            <View
              className="h-3 rounded-full overflow-hidden mb-2"
              style={{ backgroundColor: isDarkMode ? "#333" : "#e0e0e0" }}
            >
              <View
                className="h-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: theme.buttonPrimary,
                }}
              />
            </View>

            <View className="flex-row justify-between">
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(11),
                }}
              >
                Remaining: ₱ {remaining}
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(11),
                }}
              >
                Resets in:{" "}
                {new Date(
                  new Date().getFullYear(),
                  new Date().getMonth() + 1,
                  0,
                ).getDate() - new Date().getDate()}{" "}
                Days
              </Text>
            </View>
          </View>

          <Text
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
          >
            Automation Rules
          </Text>

          <RuleItem
            title="Auto-Cutoff Power"
            desc="If limit is reached, automatically turn off the device to save cost."
            value={autoCutoff}
            onToggle={() => setAutoCutoff(!autoCutoff)}
            theme={theme}
            scaledSize={scaledSize}
          />

          <RuleItem
            title="Push Notifications"
            desc="Receive alerts when usage hits 80%, 90%, and 100% of limit."
            value={pushNotifications}
            onToggle={() => setPushNotifications(!pushNotifications)}
            disabled={false}
            theme={theme}
            scaledSize={scaledSize}
          />
        </View>
      </ScrollView>

      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Save Changes?</Text>
            <Text style={[styles.modalBody, { color: theme.textSecondary }]}>
              Are you sure you want to update the budget settings?
            </Text>
            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "bold" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={executeSave}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.buttonPrimary,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={statusModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{statusModal.title}</Text>
            <Text style={[styles.modalBody, { color: theme.textSecondary }]}>{statusModal.message}</Text>
            <TouchableOpacity
              onPress={() => {
                setStatusModal({ ...statusModal, visible: false });
                if (statusModal.onClose) statusModal.onClose();
              }}
              style={[
                styles.modalButton,
                {
                  backgroundColor:
                    statusModal.type === "error" ? dangerColor : primaryColor,
                },
              ]}
            >
              <Text style={styles.modalButtonText}>OKAY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RuleItem({
  title,
  desc,
  value,
  onToggle,
  disabled,
  theme,
  scaledSize,
}) {
  return (
    <View
      className="flex-row items-center justify-between p-4 rounded-2xl mb-3"
      style={{
        backgroundColor: theme.card,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <View className="flex-1 mr-4">
        <Text
          className="font-semibold mb-1"
          style={{ color: theme.text, fontSize: scaledSize(14) }}
        >
          {title}{" "}
          {disabled && (
            <Text
              className="font-bold"
              style={{
                color: theme.buttonPrimary,
                fontSize: scaledSize(10),
              }}
            >
              (Always On)
            </Text>
          )}
        </Text>
        <Text
          className="leading-4"
          style={{ color: theme.textSecondary, fontSize: scaledSize(11) }}
        >
          {desc}
        </Text>
      </View>

      {}
      <CustomSwitch
        value={value}
        onToggle={disabled ? null : onToggle}
        theme={theme}
      />
    </View>
  );
}

function CustomSwitch({ value, onToggle, theme }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      style={{
        width: 42,
        height: 26,
        borderRadius: 16,
        backgroundColor: value ? theme.buttonPrimary : theme.buttonNeutral,
        padding: 2,
        justifyContent: "center",
        alignItems: value ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 2.5,
          elevation: 2,
        }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: 288,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  modalTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalBody: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    width: "100%",
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
