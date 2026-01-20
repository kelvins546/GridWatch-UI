import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Keys from your Web App configuration
const firebaseConfig = {
  apiKey: "AIzaSyAv7fq8Syu0fuChpWPzlnyqr0SUDC9glMc",
  authDomain: "gridwatch-9f80e.firebaseapp.com",
  projectId: "gridwatch-9f80e",
  storageBucket: "gridwatch-9f80e.firebasestorage.app",
  messagingSenderId: "559387586038",
  appId: "1:559387586038:web:f7cdf831df3ef0d6aeabd7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

export { auth, firebaseConfig };
