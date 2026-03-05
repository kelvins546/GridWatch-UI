import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

export default function AboutUsScreen() {
  const navigation = useNavigation();
  const { theme, fontScale } = useTheme();

  const scaledSize = (size) => size * fontScale;

  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

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
        className="flex-row items-center justify-between px-6 py-4 border-b"
        style={{ borderBottomColor: theme.cardBorder }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(24)}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(18) }}
        >
          About Us
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6 pb-12">
          {/* Logo & Version */}
          <View className="items-center mb-8">
            <View
              className="w-24 h-24 rounded-3xl overflow-hidden mb-4 shadow-sm"
              style={{
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <Image
                source={require("../../../assets/GridWatch-logo.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
            <Text
              className="font-bold mb-1"
              style={{ color: theme.text, fontSize: scaledSize(20) }}
            >
              GridWatch
            </Text>
            <Text
              className="font-medium"
              style={{ color: theme.textSecondary, fontSize: scaledSize(14) }}
            >
              Version 1.0.0 (Beta)
            </Text>
          </View>

          {/* Intro - Aligned with "Proposed Solution" */}
          <Text
            className="text-center leading-6 mb-8"
            style={{ color: theme.text, fontSize: scaledSize(14) }}
          >
            GridWatch is a hybrid IoT system combining a Smart Outlet Hub with a
            mobile app, transforming a standard power source into an intelligent
            energy manager by converting real-time electrical usage into
            Philippine Pesos.
          </Text>

          {/* Company Identity Sections */}
          <Text
            className="font-bold uppercase tracking-widest mb-4"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Our Identity
          </Text>

          <View className="gap-3 mb-8">
            {/* Mission Card - Aligned with "General Objectives" */}
            <View
              className="rounded-xl border p-5"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
            >
              <View className="flex-row items-center mb-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${theme.buttonPrimary}15` }}
                >
                  <MaterialIcons
                    name="track-changes"
                    size={scaledSize(20)}
                    color={theme.buttonPrimary}
                  />
                </View>
                <Text
                  className="font-bold"
                  style={{ color: theme.text, fontSize: scaledSize(16) }}
                >
                  Our Mission
                </Text>
              </View>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(13),
                  lineHeight: 22,
                }}
              >
                To develop an IoT-based energy management system that addresses
                household "Bill Shock" by converting electrical usage into
                real-time monetary value and enforcing user-defined financial
                budgets through automated appliance control.
              </Text>
            </View>

            {/* Vision Card - Aligned with "Introduction" */}
            <View
              className="rounded-xl border p-5"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
            >
              <View className="flex-row items-center mb-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${theme.buttonPrimary}15` }}
                >
                  <MaterialIcons
                    name="visibility"
                    size={scaledSize(20)}
                    color={theme.buttonPrimary}
                  />
                </View>
                <Text
                  className="font-bold"
                  style={{ color: theme.text, fontSize: scaledSize(16) }}
                >
                  Our Vision
                </Text>
              </View>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(13),
                  lineHeight: 22,
                }}
              >
                To eliminate the disconnection between using electricity and
                paying for it, creating modern households that are no longer
                financially blind to their accumulating appliance costs.
              </Text>
            </View>

            {/* Values Card - Aligned with "Statement of the Problem" */}
            <View
              className="rounded-xl border p-5"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
            >
              <View className="flex-row items-center mb-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${theme.buttonPrimary}15` }}
                >
                  <MaterialIcons
                    name="verified-user"
                    size={scaledSize(20)}
                    color={theme.buttonPrimary}
                  />
                </View>
                <Text
                  className="font-bold"
                  style={{ color: theme.text, fontSize: scaledSize(16) }}
                >
                  Core Pillars
                </Text>
              </View>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(13),
                  lineHeight: 22,
                }}
              >
                •{" "}
                <Text style={{ fontWeight: "bold", color: theme.text }}>
                  Financial Clarity:
                </Text>{" "}
                Replacing abstract kWh with real-time Pesos to cure financial
                blindness.{"\n"}•{" "}
                <Text style={{ fontWeight: "bold", color: theme.text }}>
                  Automated Budgeting:
                </Text>{" "}
                Mechanisms to automatically cut power and notify users when
                financial limits are reached.{"\n"}•{" "}
                <Text style={{ fontWeight: "bold", color: theme.text }}>
                  Active Safety:
                </Text>{" "}
                Intelligent appliance-level protection to instantly detect and
                alert users of short circuits or overcurrents.
              </Text>
            </View>
          </View>

          {/* Legal */}
          <Text
            className="font-bold uppercase tracking-widest mb-4"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            Legal
          </Text>

          {/* Privacy Policy Trigger */}
          <TouchableOpacity
            className="flex-row items-center justify-between p-4 rounded-xl border mb-3"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            onPress={() => setPrivacyModalVisible(true)}
          >
            <Text
              className="font-medium"
              style={{ color: theme.text, fontSize: scaledSize(14) }}
            >
              Privacy Policy
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={scaledSize(20)}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {/* Terms of Service Trigger */}
          <TouchableOpacity
            className="flex-row items-center justify-between p-4 rounded-xl border"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            onPress={() => setTermsModalVisible(true)}
          >
            <Text
              className="font-medium"
              style={{ color: theme.text, fontSize: scaledSize(14) }}
            >
              Terms of Service
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={scaledSize(20)}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {/* Footer */}
          <Text
            className="text-center mt-10 opacity-40"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            © 2026 GridWatch Inc.{"\n"}All rights reserved.
          </Text>
        </View>
      </ScrollView>

      {/* ========================================= */}
      {/* TERMS OF SERVICE MODAL                    */}
      {/* ========================================= */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={termsModalVisible}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center">
          <View
            className="w-[85%] h-[75%] border rounded-2xl overflow-hidden"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View
              className="p-5 border-b flex-row items-center justify-between"
              style={{ borderColor: theme.cardBorder }}
            >
              <Text className="text-lg font-bold" style={{ color: theme.text }}>
                Terms & Conditions
              </Text>
              <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              className="flex-1 p-5"
              showsVerticalScrollIndicator={false}
            >
              <Text
                className="font-bold mb-4 uppercase text-xs"
                style={{ color: theme.buttonPrimary }}
              >
                Last Updated: January 2026
              </Text>

              <Text className="font-bold mb-2" style={{ color: theme.text }}>
                1. Service Usage & Monitoring
              </Text>
              <Text
                className="text-sm mb-4 leading-5"
                style={{ color: theme.textSecondary }}
              >
                GridWatch provides real-time electrical monitoring services. By
                using the App and Hub, you acknowledge that data regarding your
                voltage, current, and wattage consumption will be uploaded to
                our cloud servers for analysis.
              </Text>

              <Text className="font-bold mb-2" style={{ color: theme.text }}>
                2. Data Privacy
              </Text>
              <Text
                className="text-sm mb-4 leading-5"
                style={{ color: theme.textSecondary }}
              >
                We value your privacy. Your personal information and specific
                location data are encrypted. We do not sell your individual
                appliance usage patterns to third-party advertisers. Aggregated,
                anonymous data may be used to improve grid efficiency analysis.
              </Text>

              <Text className="font-bold mb-2" style={{ color: theme.text }}>
                3. Hardware Safety & Responsibility
              </Text>
              <Text
                className="text-sm mb-4 leading-5"
                style={{ color: theme.textSecondary }}
              >
                The GridWatch Hub is designed to assist in monitoring and fault
                protection. However, it is not a substitute for professional
                electrical maintenance. Users are responsible for ensuring their
                appliances are safe to operate remotely. Do not overload the
                device beyond its rated 10A capacity.
              </Text>

              <Text className="font-bold mb-2" style={{ color: theme.text }}>
                4. Limitation of Liability
              </Text>
              <Text
                className="text-sm mb-8 leading-5"
                style={{ color: theme.textSecondary }}
              >
                GridWatch is not liable for any damages, electrical fires, or
                equipment failures resulting from misuse, overloading, or
                modification of the hardware. The "Safety Cut-off" feature is a
                supplementary protection layer and not a guarantee against all
                electrical faults.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================= */}
      {/* PRIVACY POLICY MODAL                      */}
      {/* ========================================= */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={privacyModalVisible}
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center">
          <View
            className="w-[85%] h-[75%] border rounded-2xl overflow-hidden"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View
              className="p-5 border-b flex-row items-center justify-between"
              style={{ borderColor: theme.cardBorder }}
            >
              <Text className="text-lg font-bold" style={{ color: theme.text }}>
                Privacy Policy
              </Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              className="flex-1 p-5"
              showsVerticalScrollIndicator={false}
            >
              <Text
                className="font-bold mb-4 uppercase text-xs"
                style={{ color: theme.buttonPrimary }}
              >
                Last Updated: January 2026
              </Text>

              <Text className="font-bold mb-2" style={{ color: theme.text }}>
                1. Information We Collect
              </Text>
              <Text
                className="text-sm mb-4 leading-5"
                style={{ color: theme.textSecondary }}
              >
                We collect your email address for account creation. Our hardware
                collects real-time electrical data (Voltage, Current, Wattage)
                from the devices plugged into the GridWatch Hub to provide you
                with energy monitoring services.
              </Text>

              <Text className="font-bold mb-2" style={{ color: theme.text }}>
                2. How We Use Your Data
              </Text>
              <Text
                className="text-sm mb-4 leading-5"
                style={{ color: theme.textSecondary }}
              >
                Your electrical data is used strictly to provide you with
                real-time analytics, bill estimation (converted to Philippine
                Pesos), and automated budget enforcement. We do not use this
                data for targeted advertising.
              </Text>

              <Text className="font-bold mb-2" style={{ color: theme.text }}>
                3. Data Security
              </Text>
              <Text
                className="text-sm mb-4 leading-5"
                style={{ color: theme.textSecondary }}
              >
                We implement industry-standard encryption protocols via our
                cloud provider (Supabase) to secure your personal information
                and electrical usage logs.
              </Text>

              <Text className="font-bold mb-2" style={{ color: theme.text }}>
                4. Family Access Sharing
              </Text>
              <Text
                className="text-sm mb-8 leading-5"
                style={{ color: theme.textSecondary }}
              >
                If you use the "Family Access" feature, you consent to sharing
                your hub's electrical data and control capabilities with the
                specific email addresses you invite.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
