import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function MonthlyBudgetScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const [budget, setBudget] = useState(2800); // Default budget

  const handleSave = () => {
    // Save logic here
    navigation.goBack();
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

      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          Monthly Budget
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: theme.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          SET TOTAL LIMIT
        </Text>
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <TouchableOpacity
            onPress={() => setBudget((b) => Math.max(0, b - 100))}
            style={styles.btn}
          >
            <MaterialIcons name="remove" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.value, { color: theme.text }]}>
            ₱ {budget.toLocaleString()}
          </Text>
          <TouchableOpacity
            onPress={() => setBudget((b) => b + 100)}
            style={styles.btn}
          >
            <MaterialIcons name="add" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.helper, { color: theme.textSecondary }]}>
          You will receive alerts when your total spending approaches this
          limit.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: "700" },
  saveBtn: { fontSize: 16, fontWeight: "600" },
  content: { padding: 24, alignItems: "center", paddingTop: 60 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 20,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  value: { fontSize: 32, fontWeight: "700" },
  btn: { padding: 10 },
  helper: { textAlign: "center", fontSize: 13, lineHeight: 20 },
});
