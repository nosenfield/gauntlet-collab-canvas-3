/**
 * Firebase Configuration Template
 * 
 * This file shows the structure of Firebase configuration.
 * DO NOT use this file directly.
 * 
 * Instead:
 * 1. Create a .env.local file in the project root
 * 2. Add environment variables (see ENV_TEMPLATE.md)
 * 3. The actual config is loaded from environment variables in firebase.ts
 */

export const firebaseConfigExample = {
  apiKey: "AIzaSy...",                              // Your API key
  authDomain: "your-project-id.firebaseapp.com",   // Auth domain
  projectId: "your-project-id",                     // Project ID
  storageBucket: "your-project-id.appspot.com",    // Storage bucket
  messagingSenderId: "123456789",                   // Messaging sender ID
  appId: "1:123456789:web:abcdef",                 // App ID
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com", // Realtime Database URL
};

/**
 * Get these values from:
 * Firebase Console > Project Settings > General > Your apps > Web app
 * 
 * The databaseURL is CRITICAL for Realtime Database (cursor sync).
 * Find it in: Firebase Console > Realtime Database > Data tab URL
 */

export default firebaseConfigExample;

