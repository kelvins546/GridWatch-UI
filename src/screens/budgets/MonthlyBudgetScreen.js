import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function MonthlyBudgetScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const [budget, setBudget] = useState(2800);

  const handleSave = () => {
    navigation.goBack();
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
        className="flex-row justify-between items-center p-5 border-b"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: theme.text }}>
          Monthly Budget
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text
            className="text-base font-semibold"
            style={{ color: theme.primary }}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View className="p-6 items-center pt-[60px]">
          <Text
            className="text-xs font-bold mb-5 tracking-[1px]"
            style={{ color: theme.textSecondary }}
          >
            SET TOTAL LIMIT
          </Text>
          <View
            className="flex-row items-center justify-between w-full p-5 rounded-[20px] border mb-5"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <TouchableOpacity
              onPress={() => setBudget((b) => Math.max(0, b - 100))}
              className="p-2.5"
            >
              <MaterialIcons name="remove" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text
              className="text-[32px] font-bold"
              style={{ color: theme.text }}
            >
              ₱ {budget.toLocaleString()}
            </Text>
            <TouchableOpacity
              onPress={() => setBudget((b) => b + 100)}
              className="p-2.5"
            >
              <MaterialIcons name="add" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <Text
            className="text-center text-[13px] leading-5"
            style={{ color: theme.textSecondary }}
          >
            You will receive alerts when your total spending approaches this
            limit.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
