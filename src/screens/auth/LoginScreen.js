import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";

const ALLOWED_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud)\.com$/;

export default function LoginScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const validateField = (field, value) => {
    let error = null;
    switch (field) {
      case "email":
        if (!value) error = "Email is required";
        else if (!ALLOWED_EMAIL_REGEX.test(value))
          error = "Use a valid provider (Gmail, Yahoo, etc)";
        break;
      case "password":
        if (!value) error = "Password is required";
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const handleLogin = async () => {
    const formValues = { email, password };
    let isValid = true;

    Object.keys(formValues).forEach((key) => {
      validateField(key, formValues[key]);
      if (!formValues[key] || errors[key]) isValid = false;
    });

    if (!isValid || !ALLOWED_EMAIL_REGEX.test(email)) {
      setErrorMessage("Please correct the errors before logging in.");
      setErrorModalVisible(true);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "MainApp" }],
      });
    }, 2000);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
      />

      {isLoading && (
        <View className="absolute z-50 w-full h-full bg-black/70 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="mt-4 font-bold" style={{ color: theme.text }}>
            Logging in...
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          <View className="p-[30px]">
            {}
            <View className="items-center mb-10">
              <Animated.View
                style={{
                  transform: [{ translateY: floatAnim }],
                  backgroundColor: "black",
                  borderRadius: 999,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isDarkMode ? 0.6 : 0.3,
                  shadowRadius: 30,
                  elevation: 20,
                }}
                className="w-[120px] h-[120px] items-center justify-center mb-6"
              >
                <Image
                  source={require("../../../assets/GridWatch-logo.png")}
                  className="w-[110px] h-[110px]"
                  resizeMode="contain"
                  style={{ borderRadius: 60, backgroundColor: "black" }}
                />
              </Animated.View>

              <View className="items-center justify-center mb-1">
                <Text
                  className="text-[28px] font-black text-center tracking-[4px] uppercase"
                  style={{ color: theme.text }}
                >
                  GridWatch
                </Text>
              </View>

              <Text
                className="text-[13px] tracking-[0.5px]"
                style={{ color: theme.textSecondary }}
              >
                Smart Energy Monitoring
              </Text>
            </View>

            {}
            <InputGroup
              label="Email Address"
              icon="email"
              placeholder="natasha@example.com"
              value={email}
              onChangeText={(text) => handleChange("email", text)}
              error={touched.email && errors.email}
              theme={theme}
            />

            <View className="mb-2">
              <View className="flex-row justify-between">
                <Text
                  className="text-[11px] font-bold uppercase mb-2"
                  style={{
                    color:
                      touched.password && errors.password
                        ? theme.buttonDangerText
                        : theme.textSecondary,
                  }}
                >
                  Password
                </Text>
                {touched.password && errors.password && (
                  <Text
                    className="text-[10px] italic mr-1"
                    style={{ color: theme.buttonDangerText }}
                  >
                    {errors.password}
                  </Text>
                )}
              </View>

              <View
                className="flex-row items-center rounded-xl px-4 py-2.5 border"
                style={{
                  backgroundColor: theme.buttonNeutral,
                  borderColor:
                    touched.password && errors.password
                      ? theme.buttonDangerText
                      : theme.cardBorder,
                }}
              >
                <MaterialIcons
                  name="lock"
                  size={20}
                  color={
                    touched.password && errors.password
                      ? theme.buttonDangerText
                      : theme.textSecondary
                  }
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  className="flex-1 text-sm"
                  style={{ color: theme.text }}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={(text) => handleChange("password", text)}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <MaterialIcons
                    name={showPass ? "visibility" : "visibility-off"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text
                className="self-end font-semibold text-sm mb-[25px]"
                style={{ color: theme.textSecondary }}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {}
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.8}>
              <View
                className="p-4 rounded-2xl items-center shadow-sm"
                style={{ backgroundColor: theme.buttonPrimary }}
              >
                <Text
                  className="font-bold text-[15px]"
                  style={{ color: theme.buttonPrimaryText }}
                >
                  LOG IN
                </Text>
              </View>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-[30px]">
              <Text style={{ color: theme.textSecondary }}>
                Don't have an account?{" "}
              </Text>
              {}
              <TouchableOpacity
                onPress={() => navigation.navigate("AuthSelection")}
              >
                <Text
                  className="font-bold"
                  style={{ color: theme.buttonPrimary }}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              className="text-center text-xs italic mt-10 opacity-80"
              style={{ color: theme.primary }}
            >
              "Don't wait for the bill. Control it."
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80">
          <View
            className="w-[80%] max-w-[320px] border p-8 rounded-2xl items-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
          >
            <View
              className="mb-4 p-4 rounded-full"
              style={{ backgroundColor: theme.buttonDanger }}
            >
              <MaterialIcons
                name="error-outline"
                size={40}
                color={theme.buttonDangerText}
              />
            </View>
            <Text
              className="text-xl font-bold mb-2 text-center"
              style={{ color: theme.text }}
            >
              Login Failed
            </Text>
            <Text
              className="text-xs text-center mb-6 leading-5"
              style={{ color: theme.textSecondary }}
            >
              {errorMessage}
            </Text>
            <TouchableOpacity
              className="w-full"
              onPress={() => setErrorModalVisible(false)}
            >
              <View
                className="p-3 rounded-xl items-center"
                style={{ backgroundColor: theme.buttonDangerText }}
              >
                <Text className="font-bold text-sm text-white uppercase tracking-wider">
                  TRY AGAIN
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InputGroup({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  theme,
}) {
  return (
    <View className="mb-5">
      <View className="flex-row justify-between">
        <Text
          className="text-[11px] font-bold uppercase mb-2"
          style={{
            color: error ? theme.buttonDangerText : theme.textSecondary,
          }}
        >
          {label}
        </Text>
        {error && (
          <Text
            className="text-[10px] italic mr-1"
            style={{ color: theme.buttonDangerText }}
          >
            {error}
          </Text>
        )}
      </View>
      <View
        className="flex-row items-center rounded-xl px-4 py-2.5 border"
        style={{
          backgroundColor: theme.buttonNeutral,
          borderColor: error ? theme.buttonDangerText : theme.cardBorder,
        }}
      >
        <MaterialIcons
          name={icon}
          size={20}
          color={error ? theme.buttonDangerText : theme.textSecondary}
          style={{ marginRight: 12 }}
        />
        <TextInput
          className="flex-1 text-sm"
          style={{ color: theme.text }}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
    </View>
  );
}
