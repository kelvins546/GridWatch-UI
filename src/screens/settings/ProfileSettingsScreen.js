import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StatusBar,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  UIManager,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import { decode } from "base64-arraybuffer";

// --- FIREBASE IMPORTS ---
import FirebaseRecaptcha from "../../components/FirebaseRecaptcha";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth, firebaseConfig } from "../../lib/firebaseConfig";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatPhoneNumber = (text) => {
  if (!text) return "+63 ";
  let cleaned = text.replace(/\D/g, "");
  if (cleaned.startsWith("63")) cleaned = cleaned.substring(2);
  else if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
  const trimmed = cleaned.slice(0, 10);
  let formatted = "+63";
  if (trimmed.length > 0) formatted += " " + trimmed.substring(0, 3);
  if (trimmed.length > 3) formatted += " " + trimmed.substring(3, 6);
  if (trimmed.length > 6) formatted += " " + trimmed.substring(6, 10);
  return formatted;
};

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode, fontScale } = useTheme();
  const scaledSize = (size) => size * (fontScale || 1);

  // --- RECAPTCHA REF ---
  const recaptchaVerifier = useRef(null);

  // --- STATE ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+63 ");

  const [isPhoneEditable, setIsPhoneEditable] = useState(false);

  // Location State
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [initialData, setInitialData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "+63 ",
    region: "",
    city: "",
    zipCode: "",
    streetAddress: "",
    avatarUrl: null,
  });

  // Phone OTP
  const [phoneOtpVisible, setPhoneOtpVisible] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [verificationId, setVerificationId] = useState(null);

  // Modals
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
    confirmText: "Okay",
    cancelText: "Cancel",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (user) {
        setEmail(user.email);
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        const dbData = profile || {};
        const meta = user.user_metadata || {};

        const googleName = meta.full_name || meta.name || "";
        const googleParts = googleName.split(" ");
        const firstNameVal = dbData.first_name || googleParts[0] || "";
        const lastNameVal =
          dbData.last_name || googleParts.slice(1).join(" ") || "";

        const rawPhone = dbData.phone_number;
        const formattedPhone = rawPhone ? formatPhoneNumber(rawPhone) : "+63 ";

        const hasExistingPhone = rawPhone && rawPhone.length > 5;
        setIsPhoneEditable(!hasExistingPhone);

        setFirstName(firstNameVal);
        setLastName(lastNameVal);
        setPhoneNumber(formattedPhone);
        setRegion(dbData.region || "");
        setCity(dbData.city || "");
        setZipCode(dbData.zip_code || "");
        setStreetAddress(dbData.street_address || "");

        const currentAvatar =
          dbData.avatar_url || meta.avatar_url || meta.picture || null;
        setAvatarUrl(currentAvatar);

        setInitialData({
          firstName: firstNameVal,
          lastName: lastNameVal,
          phoneNumber: formattedPhone,
          region: dbData.region || "",
          city: dbData.city || "",
          zipCode: dbData.zip_code || "",
          streetAddress: dbData.street_address || "",
          avatarUrl: currentAvatar,
        });
      }
    } catch (error) {
      console.log("Error loading profile:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenImagePicker = () => {
    setShowGuidelinesModal(true);
  };

  const handleCamera = async () => {
    setShowGuidelinesModal(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera access is needed.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    processPickedImage(result);
  };

  const handleGallery = async () => {
    setShowGuidelinesModal(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    processPickedImage(result);
  };

  const processPickedImage = (result) => {
    if (!result.canceled) {
      const asset = result.assets[0];
      const sizeInBytes = asset.base64.length * (3 / 4);
      const sizeInMB = sizeInBytes / (1024 * 1024);

      if (sizeInMB > 5) {
        showModal("error", "File Too Large", "Image must be under 5MB.");
        return;
      }
      setSelectedImage(asset);
    }
  };

  const uploadImage = async (userId, imageAsset) => {
    try {
      const fileName = `${userId}/${Date.now()}.jpg`;
      const fileData = decode(imageAsset.base64);
      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, fileData, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      return null;
    }
  };

  // --- SAVE BUTTON HANDLER ---
  const handleSave = async () => {
    if (!firstName.trim()) {
      showModal("error", "Missing Info", "First Name is required.");
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const cleanPhone = phoneNumber.replace(/\s/g, "");
      const initialCleanPhone = initialData.phoneNumber.replace(/\s/g, "");

      // --- CHECK IF PHONE CHANGED & NEEDS VERIFICATION ---
      if (
        isPhoneEditable &&
        cleanPhone !== initialCleanPhone &&
        cleanPhone.length > 9
      ) {
        // Wait a small tick to ensure UI updates aren't blocking
        await new Promise((resolve) => setTimeout(resolve, 100));
        await startPhoneVerification(cleanPhone);
        return; // Stop here, wait for OTP
      }

      // If phone didn't change, just save profile
      await finalizeProfileUpdate(user.id);
    } catch (error) {
      setIsLoading(false);
      showModal("error", "Update Failed", error.message);
    }
  };

  // --- 1. START FIREBASE SMS ---
  const startPhoneVerification = async (phone) => {
    try {
      let formatted = phone.replace(/\s/g, "");
      if (!formatted.startsWith("+")) formatted = `+${formatted}`;

      console.log("Attempting SMS to:", formatted);

      if (!recaptchaVerifier.current) {
        throw new Error(
          "Recaptcha is not ready. Please wait a moment or restart the app.",
        );
      }

      const phoneProvider = new PhoneAuthProvider(auth);
      const vid = await phoneProvider.verifyPhoneNumber(
        formatted,
        recaptchaVerifier.current,
      );

      console.log("SMS Sent, Verification ID:", vid);
      setVerificationId(vid);
      setIsLoading(false);
      setPhoneOtpVisible(true);
      setPhoneOtpCode("");
    } catch (err) {
      setIsLoading(false);
      console.log("SMS Error Details:", err);
      if (err.message && err.message.includes("cancelled")) return;

      let msg = err.message;
      if (err.code === "auth/argument-error") {
        msg =
          "Internal Error: Recaptcha or Phone Number issue. Please try again.";
      }
      showModal("error", "SMS Failed", msg);
    }
  };

  // --- 2. VERIFY FIREBASE OTP ---
  const verifyPhoneOtp = async () => {
    if (phoneOtpCode.length !== 6) {
      showModal("error", "Invalid Code", "Please enter 6 digits.");
      return;
    }
    setIsLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        phoneOtpCode,
      );
      await signInWithCredential(auth, credential);

      setPhoneOtpVisible(false);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await finalizeProfileUpdate(user.id);
    } catch (error) {
      setIsLoading(false);
      console.log("OTP Error:", error);
      showModal("error", "Verification Failed", "Invalid code or expired.");
    }
  };

  // --- 3. UPDATE SUPABASE DATABASE ---
  const finalizeProfileUpdate = async (userId) => {
    try {
      let uploadedAvatarUrl = avatarUrl;
      if (selectedImage) {
        const publicUrl = await uploadImage(userId, selectedImage);
        if (publicUrl) uploadedAvatarUrl = publicUrl;
      }

      const cleanPhone = phoneNumber.replace(/\s/g, "");

      const updates = {
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName || "",
        phone_number: isPhoneEditable
          ? cleanPhone
          : initialData.phoneNumber.replace(/\s/g, ""),
        region: region || "",
        city: city || "",
        zip_code: zipCode || "",
        street_address: streetAddress || "",
        avatar_url: uploadedAvatarUrl,
        role: "resident",
        status: "active",
      };

      const { error: dbError } = await supabase.from("users").upsert(updates);
      if (dbError) throw dbError;

      setInitialData({
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        region: region,
        city: city,
        zipCode: zipCode,
        streetAddress: streetAddress,
        avatar_url: uploadedAvatarUrl,
      });

      setAvatarUrl(uploadedAvatarUrl);
      setSelectedImage(null);

      if (cleanPhone.length > 5) setIsPhoneEditable(false);

      showModal("success", "Saved", "Profile details updated successfully.");
    } catch (error) {
      showModal("error", "Save Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const hasUnsavedChanges = () => {
    return (
      firstName !== initialData.firstName ||
      lastName !== initialData.lastName ||
      phoneNumber !== initialData.phoneNumber ||
      region !== initialData.region ||
      city !== initialData.city ||
      zipCode !== initialData.zipCode ||
      streetAddress !== initialData.streetAddress ||
      selectedImage !== null
    );
  };

  const handleBackPress = () => {
    if (hasUnsavedChanges()) {
      showModal(
        "confirm",
        "Unsaved Changes",
        "Discard changes?",
        () => navigation.goBack(),
        null,
        "Discard",
        "Keep Editing",
      );
    } else {
      navigation.goBack();
    }
  };

  const showModal = (
    type,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText,
    cancelText,
  ) =>
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      onConfirm:
        onConfirm || (() => setModalConfig((p) => ({ ...p, visible: false }))),
      onCancel:
        onCancel || (() => setModalConfig((p) => ({ ...p, visible: false }))),
      confirmText: confirmText || "Okay",
      cancelText: cancelText || "Cancel",
    });

  const displayImageUri = selectedImage ? selectedImage.uri : avatarUrl;
  const initials = firstName ? firstName.charAt(0) : "?";

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top", "left", "right", "bottom"]}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {/* --- ALWAYS RENDERED RECAPTCHA --- */}
      <FirebaseRecaptcha
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />

      {/* --- LOADING OVERLAY --- */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#B0B0B0" />
        </View>
      )}

      <View
        className="flex-row items-center justify-center px-6 py-5 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.cardBorder,
        }}
      >
        <TouchableOpacity
          onPress={handleBackPress}
          style={{ position: "absolute", left: 24, padding: 4, zIndex: 10 }}
        >
          <MaterialIcons
            name="arrow-back"
            size={scaledSize(20)}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        <Text
          className="font-bold"
          style={{ color: theme.text, fontSize: scaledSize(18) }}
        >
          Edit Profile
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={{ position: "absolute", right: 24, padding: 4, zIndex: 10 }}
        >
          <Text
            className="font-bold"
            style={{ color: theme.buttonPrimary, fontSize: scaledSize(14) }}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="p-6 pb-10">
            {/* AVATAR */}
            <View className="items-center mb-8">
              <TouchableOpacity
                onPress={() => displayImageUri && setIsPreviewVisible(true)}
                activeOpacity={displayImageUri ? 0.8 : 1}
                className="relative w-24 h-24 mb-4"
              >
                {displayImageUri ? (
                  <Image
                    source={{ uri: displayImageUri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 50,
                    }}
                  />
                ) : (
                  <View
                    className="w-full h-full rounded-full justify-center items-center"
                    style={{ backgroundColor: theme.buttonNeutral }}
                  >
                    <Text
                      className="font-bold"
                      style={{
                        fontSize: scaledSize(36),
                        color: theme.textSecondary,
                      }}
                    >
                      {initials}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleOpenImagePicker}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full justify-center items-center border-[3px]"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.background,
                  }}
                >
                  <MaterialIcons
                    name="camera-alt"
                    size={scaledSize(14)}
                    color={theme.text}
                  />
                </TouchableOpacity>
              </TouchableOpacity>

              <View
                className="px-3 py-1 rounded-xl border"
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(0, 255, 153, 0.1)"
                    : "rgba(0, 153, 94, 0.1)",
                  borderColor: isDarkMode
                    ? "rgba(0, 255, 153, 0.2)"
                    : "rgba(0, 153, 94, 0.2)",
                }}
              >
                <Text
                  className="font-semibold tracking-wider"
                  style={{
                    color: theme.buttonPrimary,
                    fontSize: scaledSize(10),
                  }}
                >
                  HOME RESIDENT
                </Text>
              </View>
            </View>

            {/* PERSONAL INFO */}
            <Text
              className="font-bold uppercase tracking-widest mb-3"
              style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
            >
              Personal Information
            </Text>
            <InputGroup
              label="First Name"
              icon="person"
              placeholder="First name"
              value={firstName}
              onChangeText={setFirstName}
              theme={theme}
              scaledSize={scaledSize}
            />
            <InputGroup
              label="Last Name (OPTIONAL)"
              icon="person-outline"
              placeholder="Last name"
              value={lastName}
              onChangeText={setLastName}
              theme={theme}
              scaledSize={scaledSize}
            />
            <InputGroup
              label={
                isPhoneEditable
                  ? "Phone Number (Unverified)"
                  : "Phone Number (Verified)"
              }
              icon="phone"
              placeholder="09XX XXX XXXX"
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
              keyboardType="phone-pad"
              theme={theme}
              scaledSize={scaledSize}
              disabled={!isPhoneEditable}
            />
            <InputGroup
              label="Email Address"
              icon="email"
              value={email}
              theme={theme}
              scaledSize={scaledSize}
              disabled
            />

            {/* LOCATION */}
            <Text
              className="font-bold uppercase tracking-widest mb-3 mt-5"
              style={{ color: theme.textSecondary, fontSize: scaledSize(10) }}
            >
              Location
            </Text>

            <InputGroup
              label="Region"
              icon="map"
              placeholder="Region"
              value={region}
              onChangeText={setRegion}
              theme={theme}
              scaledSize={scaledSize}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <InputGroup
                  label="City"
                  icon="location-city"
                  placeholder="City"
                  value={city}
                  onChangeText={setCity}
                  theme={theme}
                  scaledSize={scaledSize}
                />
              </View>
              <View className="flex-[0.7]">
                <InputGroup
                  label="Zip"
                  icon="markunread-mailbox"
                  placeholder="0000"
                  value={zipCode}
                  onChangeText={(t) => /^\d*$/.test(t) && setZipCode(t)}
                  maxLength={4}
                  keyboardType="number-pad"
                  theme={theme}
                  scaledSize={scaledSize}
                />
              </View>
            </View>
            <InputGroup
              label="Address"
              icon="home"
              placeholder="Full address"
              value={streetAddress}
              onChangeText={setStreetAddress}
              theme={theme}
              scaledSize={scaledSize}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- REVERTED GUIDELINES MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showGuidelinesModal}
        onRequestClose={() => setShowGuidelinesModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: 300,
              backgroundColor: theme.card,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <Text
              style={{
                fontSize: scaledSize(18),
                fontWeight: "bold",
                color: theme.text,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Photo Guidelines
            </Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <Text
                style={{
                  fontWeight: "bold",
                  color: theme.text,
                  marginTop: 8,
                  marginBottom: 4,
                  fontSize: scaledSize(13),
                }}
              >
                1. Technical Requirements
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(12),
                  lineHeight: 18,
                  marginBottom: 4,
                }}
              >
                • Format: JPEG or PNG
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(12),
                  lineHeight: 18,
                  marginBottom: 4,
                }}
              >
                • Size: Max 5 MB
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(12),
                  lineHeight: 18,
                  marginBottom: 4,
                }}
              >
                • Dimension: Min 200x200 pixels
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(12),
                  lineHeight: 18,
                  marginBottom: 8,
                }}
              >
                • Aspect Ratio: 1:1 (Square)
              </Text>
            </ScrollView>

            <View style={{ gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={handleCamera}
                style={{
                  backgroundColor: theme.buttonPrimary,
                  height: 44,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MaterialIcons name="camera-alt" size={18} color="white" />
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: scaledSize(14),
                    }}
                  >
                    Take Photo
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleGallery}
                style={{
                  backgroundColor: theme.buttonNeutral,
                  height: 44,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MaterialIcons
                    name="photo-library"
                    size={18}
                    color={theme.text}
                  />
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: "bold",
                      fontSize: scaledSize(14),
                    }}
                  >
                    Upload from Gallery
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowGuidelinesModal(false)}
                style={{
                  height: 44,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontWeight: "600",
                    fontSize: scaledSize(14),
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- PHONE OTP MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={phoneOtpVisible}
        onRequestClose={() => setPhoneOtpVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.9)",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 350,
              backgroundColor: theme.card,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <Text
              className="text-center font-bold mb-4"
              style={{ color: theme.text, fontSize: scaledSize(18) }}
            >
              Verify Mobile Number
            </Text>
            <Text
              className="text-center mb-6"
              style={{ color: theme.textSecondary, fontSize: scaledSize(13) }}
            >
              We sent a code to the number you provided.
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.buttonNeutral,
                color: theme.text,
                borderRadius: 12,
                padding: 12,
                textAlign: "center",
                fontSize: scaledSize(18),
                letterSpacing: 4,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                marginBottom: 20,
              }}
              placeholder="000 000"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              value={phoneOtpCode}
              onChangeText={setPhoneOtpCode}
            />
            <TouchableOpacity
              onPress={verifyPhoneOtp}
              disabled={isLoading}
              style={{
                backgroundColor: theme.buttonPrimary,
                borderRadius: 12,
                height: 48,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: scaledSize(14),
                  }}
                >
                  Verify & Save
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPhoneOtpVisible(false)}
              disabled={isLoading}
              style={{ marginTop: 16, alignItems: "center" }}
            >
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: scaledSize(14),
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- IMAGE PREVIEW MODAL --- */}
      <Modal
        visible={isPreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPreviewVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => setIsPreviewVisible(false)}
            style={{ position: "absolute", top: 50, right: 24, zIndex: 20 }}
          >
            <MaterialIcons name="close" size={32} color="white" />
          </TouchableOpacity>

          {displayImageUri && (
            <Image
              source={{ uri: displayImageUri }}
              style={{ width: "90%", height: "80%" }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <CustomModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        msg={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        theme={theme}
        isDarkMode={isDarkMode}
        scaledSize={scaledSize}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
});

// ... Helper Components ...
function InputGroup({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  maxLength,
  keyboardType,
  disabled,
  theme,
  scaledSize,
  placeholderTextColor,
}) {
  return (
    <View className="mb-3">
      <Text
        className="font-bold uppercase mb-1.5 ml-1"
        style={{
          color: error ? theme.buttonDangerText : theme.textSecondary,
          fontSize: scaledSize(10),
        }}
      >
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-xl px-4 h-14 border"
        style={{
          backgroundColor: theme.buttonNeutral,
          borderColor: error ? theme.buttonDangerText : theme.cardBorder,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <MaterialIcons
          name={icon}
          size={scaledSize(20)}
          color={theme.textSecondary}
          style={{ marginRight: 10 }}
        />
        <TextInput
          className="flex-1 h-full"
          style={{ color: theme.text, fontSize: scaledSize(14) }}
          placeholder={placeholder}
          placeholderTextColor={
            placeholderTextColor || `${theme.textSecondary}80`
          }
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
          keyboardType={keyboardType}
          editable={!disabled}
        />
      </View>
      {error && (
        <Text
          className="italic mt-1 ml-1"
          style={{ color: theme.buttonDangerText, fontSize: scaledSize(10) }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

function CustomModal({
  visible,
  type,
  title,
  msg,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  theme,
  isDarkMode,
  scaledSize,
}) {
  let buttonBg = theme.buttonPrimary;
  if (type === "error" || type === "delete") buttonBg = "#ff4444";
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel || onConfirm}
    >
      <View className="flex-1 bg-black/80 justify-center items-center z-50">
        <View
          className="border p-5 rounded-2xl w-72 items-center"
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
        >
          <Text
            className="font-bold mb-2 text-center"
            style={{ color: theme.text, fontSize: scaledSize(18) }}
          >
            {title}
          </Text>
          <Text
            className="text-center mb-6 leading-5"
            style={{ color: theme.textSecondary, fontSize: scaledSize(12) }}
          >
            {msg}
          </Text>
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            {onCancel && (
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: theme.textSecondary,
                  height: 40,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 12,
                }}
                onPress={onCancel}
              >
                <Text
                  className="font-bold"
                  style={{ color: theme.text, fontSize: scaledSize(12) }}
                >
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: buttonBg,
                height: 40,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 12,
                overflow: "hidden",
              }}
              onPress={onConfirm}
            >
              <Text
                className="font-bold"
                style={{ color: "#fff", fontSize: scaledSize(12) }}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
