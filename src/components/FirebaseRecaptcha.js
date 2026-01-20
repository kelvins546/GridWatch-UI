import React, {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
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

const { width, height } = Dimensions.get("window");

const FirebaseRecaptcha = forwardRef(
  ({ firebaseConfig, onVerify, onCancel }, ref) => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    // We need to store both resolve (success) and reject (cancel/fail)
    const [promiseControls, setPromiseControls] = useState(null);

    // --- METHODS ---
    useImperativeHandle(ref, () => ({
      open: () => {
        setVisible(true);
        setLoading(true);
      },
      close: () => {
        setVisible(false);
        // If closed programmatically without resolving, reject it to stop loading
        if (promiseControls) {
          promiseControls.reject(new Error("cancelled"));
          setPromiseControls(null);
        }
      },
      verify: () => {
        return new Promise((resolve, reject) => {
          setVisible(true);
          setLoading(true);
          // Store both control functions so we can access them later
          setPromiseControls({ resolve, reject });
        });
      },
      type: "recaptcha",
      _reset: () => {
        setLoading(false);
      },
    }));

    const handleMessage = (event) => {
      const data = event.nativeEvent.data;
      if (!data) return;

      if (data.startsWith("error:")) {
        console.log("Recaptcha Error:", data);
        setVisible(false);
        // If there is an error, reject the promise
        if (promiseControls) {
          promiseControls.reject(new Error(data));
          setPromiseControls(null);
        }
        return;
      }

      // Success! Resolve the promise.
      if (promiseControls) {
        promiseControls.resolve(data);
        setPromiseControls(null);
      }

      if (onVerify) onVerify(data);
      setVisible(false);
    };

    const handleCancel = () => {
      setVisible(false);
      // CRITICAL FIX: Reject the promise so SignupScreen knows to stop loading
      if (promiseControls) {
        promiseControls.reject(new Error("cancelled"));
        setPromiseControls(null);
      }
      if (onCancel) onCancel();
    };

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
              'size': 'normal', 
              'callback': function(response) {
                window.ReactNativeWebView.postMessage(response);
              },
              'expired-callback': function() {
                window.ReactNativeWebView.postMessage('error:expired');
              }
            });
            window.recaptchaVerifier.render();
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
            background-color: white; 
          }
          #recaptcha-container {
            transform: scale(1.0); 
            transform-origin: 0 0;
          }
        </style>
      </head>
      <body>
        <div id="recaptcha-container"></div>
      </body>
    </html>
  `;

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.container}>
          <View style={styles.modalContent}>
            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.title}>Security Check</Text>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* LOADER */}
            {loading && (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Loading Challenge...</Text>
              </View>
            )}

            {/* WEBVIEW */}
            <WebView
              originWhitelist={["*"]}
              source={{
                html,
                baseUrl: "https://gridwatch-auth.firebaseapp.com",
              }}
              javaScriptEnabled={true}
              onMessage={handleMessage}
              onLoadEnd={() => setLoading(false)}
              style={{ flex: 1, backgroundColor: "white" }}
              automaticallyAdjustContentInsets={false}
            />
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  modalContent: {
    width: "95%",
    height: "80%",
    maxHeight: 600,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    zIndex: 2,
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#333",
  },
  cancel: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
});

export default FirebaseRecaptcha;
