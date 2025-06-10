// IMPORTANT: Replace with your app's Firebase project configuration
// Obtain this from your Firebase project settings:
// Project settings > General > Your apps > Firebase SDK snippet > Config
// See: https://firebase.google.com/docs/web/setup#available-libraries

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getAuth } from "firebase/auth"; // Uncomment if you plan to use Firebase Authentication

const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with your actual API key
  authDomain: "YOUR_AUTH_DOMAIN", // Replace with your actual authDomain
  projectId: "YOUR_PROJECT_ID", // Replace with your actual projectId
  storageBucket: "YOUR_STORAGE_BUCKET", // Replace with your actual storageBucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your actual messagingSenderId
  appId: "YOUR_APP_ID", // Replace with your actual appId
  // measurementId: "YOUR_MEASUREMENT_ID" // Optional: Replace if you use Google Analytics
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let db: Firestore | null = null;

// Check if projectId is set (i.e., user has likely configured Firebase)
// This is a basic check. In a real app, you might have a more robust way
// to handle unconfigured Firebase, e.g. disabling sync features or showing a persistent warning.
if (firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID" && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  try {
    db = getFirestore(app);
  } catch (e) {
    console.error("Error initializing Firestore. Ensure Firestore is enabled in your Firebase project console (Build > Firestore Database).", e);
    // db remains null, sync features relying on it will be disabled.
  }
} else {
  console.warn(
    "Firebase is not configured with your project's details in src/lib/firebase.ts. " +
    "Real-time synchronization will be disabled. " +
    "Please update the file with your Firebase project configuration to enable sync."
  );
}

// export const auth = getAuth(app); // Uncomment if you use Firebase Authentication
export { db }; // db will be null if not configured correctly or if Firestore initialization fails
