
// IMPORTANT: Replace with your app's Firebase project configuration
// Obtain this from your Firebase project settings:
// Project settings > General > Your apps > Firebase SDK snippet > Config
// See: https://firebase.google.com/docs/web/setup#available-libraries

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getAuth } from "firebase/auth"; // Uncomment if you plan to use Firebase Authentication

const firebaseConfig = {
  apiKey: "AIzaSyBi6-fIDVkqmWt8FZsVAZTZNUmuwTA0o8g",
  authDomain: "bandsync-20c7f.firebaseapp.com",
  databaseURL: "https://bandsync-20c7f-default-rtdb.firebaseio.com",
  projectId: "bandsync-20c7f",
  storageBucket: "bandsync-20c7f.firebasestorage.app",
  messagingSenderId: "931569766178",
  appId: "1:931569766178:web:a044fb78504cfb3d9f9f7b",
  measurementId: "G-50KMNBXE34"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let db: Firestore | null = null;

// Check if projectId AND apiKey are set (i.e., user has likely configured Firebase)
// This is a basic check. In a real app, you might have a more robust way
// to handle unconfigured Firebase, e.g. disabling sync features or showing a persistent warning.
if (firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
    firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
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
