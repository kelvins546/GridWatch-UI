import React, {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import {
  Modal,
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "../context/ThemeContext";

const FirebaseRecaptcha = forwardRef(
  ({ firebaseConfig, onVerify, onCancel }, ref) => {
    const { theme } = useTheme();
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    const [promiseControls, setPromiseControls] = useState(null);

    // --- SAFETY TIMER REF ---
    const timeoutRef = useRef(null);

    // Helper to clear timeout
    const clearTimeoutSafe = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    useImperativeHandle(ref, () => ({
      open: () => {
        setVisible(true);
        setLoading(true);
      },
      close: () => {
        clearTimeoutSafe(); // Safety check
        setVisible(false);
        if (promiseControls) {
          promiseControls.reject(new Error("cancelled"));
          setPromiseControls(null);
        }
      },
      verify: () => {
        return new Promise((resolve, reject) => {
          setVisible(true);
          setLoading(true);
          setPromiseControls({ resolve, reject });

          // --- SAFETY TIMEOUT (15 Seconds) ---
          // If Google hangs or network dies, we kill the process so user isn't stuck.
          timeoutRef.current = setTimeout(() => {
            if (visible) {
              // Only if still showing
              console.log("Recaptcha Timed Out");
              setVisible(false);
              reject(new Error("Verification timed out. Please try again."));
              setPromiseControls(null);
            }
          }, 15000); // 15000ms = 15 seconds
        });
      },
      type: "recaptcha",
      _reset: () => {
        setLoading(false);
      },
    }));

    const handleMessage = (event) => {
      clearTimeoutSafe(); // Stop the safety timer! We got a response.

      const data = event.nativeEvent.data;
      if (!data) return;

      if (data.startsWith("error:")) {
        console.log("Recaptcha Error:", data);
        setVisible(false);
        if (promiseControls) {
          promiseControls.reject(new Error(data));
          setPromiseControls(null);
        }
        return;
      }

      if (promiseControls) {
        promiseControls.resolve(data);
        setPromiseControls(null);
      }

      if (onVerify) onVerify(data);
      setVisible(false);
    };

    const handleCancel = () => {
      clearTimeoutSafe(); // Stop timer on user cancel
      setVisible(false);
      if (promiseControls) {
        promiseControls.reject(new Error("cancelled"));
        setPromiseControls(null);
      }
      if (onCancel) onCancel();
    };

    // --- HTML CONFIGURATION ---
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js"></script>
        <script>
          const config = ${JSON.stringify(firebaseConfig)};
          firebase.initializeApp(config);
          
          window.onload = function() {
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
              'size': 'invisible', 
              'callback': function(response) {
                window.ReactNativeWebView.postMessage(response);
              },
              'expired-callback': function() {
                window.ReactNativeWebView.postMessage('error:expired');
              }
            });

            // Trigger verify immediately
            window.recaptchaVerifier.render().then(function(widgetId) {
                window.recaptchaVerifier.verify(); 
            });
          };
        </script>
        <style>
          body, html { 
            height: 100%; 
            width: 100%;
            display: flex; 
            justify-content: center; 
            align-items: center; 
            margin: 0; 
            background-color: ${theme.card}; 
          }
          /* Ensure container is centered but doesn't block the view if empty */
          #recaptcha-container {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          /* Hide the 'Protected by reCAPTCHA' badge if desired */
          .grecaptcha-badge { 
            visibility: hidden; 
            opacity: 0;
          }
        </style>
      </head>
      <body>
        <div id="recaptcha-container"></div>
      </body>
    </html>
  `;

    return (
      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            {/* HEADER */}
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: theme.cardBorder,
                  backgroundColor: theme.card,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Security Check
              </Text>
            </View>

            <View style={{ flex: 1, width: "100%", position: "relative" }}>
              {/* LOADER: Only shows while the HTML/JS is initializing */}
              {loading && (
                <View
                  style={[
                    styles.loaderOverlay,
                    { backgroundColor: theme.card },
                  ]}
                >
                  <ActivityIndicator size="large" color="#B0B0B0" />
                  <Text
                    style={[styles.loadingText, { color: theme.textSecondary }]}
                  >
                    Analyzing...
                  </Text>
                </View>
              )}

              {/* WEBVIEW: Visible so user can solve puzzle if it appears */}
              <WebView
                originWhitelist={["*"]}
                source={{
                  html,
                  baseUrl: "https://gridwatch-9f80e.firebaseapp.com",
                }}
                javaScriptEnabled={true}
                onMessage={handleMessage}
                // When the page loads, hide the loader so the user can interact
                onLoadEnd={() => setLoading(false)}
                style={{
                  flex: 1,
                  backgroundColor: "transparent",
                }}
                automaticallyAdjustContentInsets={false}
              />
            </View>

            {/* CANCEL BUTTON */}
            <TouchableOpacity
              onPress={handleCancel}
              style={{
                width: "100%",
                paddingVertical: 15,
                alignItems: "center",
                borderTopWidth: 1,
                borderTopColor: theme.cardBorder,
              }}
            >
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%", // Responsive width
    maxWidth: 360, // Slightly wider to fit challenge comfortably
    height: 600, // Taller to ensure NO SCROLLING for standard image challenges
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
  },
  header: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  // Loader sits on top of WebView until loaded
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: "500",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default FirebaseRecaptcha;
