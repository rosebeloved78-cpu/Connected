
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// You can get this from the Firebase Console > Project Settings > General > Your Apps
const firebaseConfig = {
  apiKey: "AIzaSyB7mAxhfjuIphcep2g9OoTqW7UyQ4C7PDg",
  authDomain: "lifestyle-fb7b8.firebaseapp.com",
  projectId: "lifestyle-fb7b8",
  storageBucket: "lifestyle-fb7b8.firebasestorage.app",
  messagingSenderId: "731261323239",
  appId: "1:731261323239:web:8871da773b91b2a37c9f42"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with settings to avoid timeout errors in restricted network environments
// experimentalForceLongPolling ensures connection stability when WebSockets are unavailable
// ignoreUndefinedProperties allows saving objects with undefined fields (Firestore will ignore them instead of throwing)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
});
