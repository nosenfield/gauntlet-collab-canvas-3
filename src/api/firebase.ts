/**
 * Firebase Client Initialization
 * 
 * Initializes Firebase with:
 * - Firestore: Persistent data (shapes, user profiles)
 * - Realtime Database: High-frequency data (cursors, presence)
 * - Authentication: Anonymous + Google OAuth
 */

import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import type { Database } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

/**
 * Firebase Configuration
 * Loaded from environment variables for security
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL, // Required for Realtime Database
};

/**
 * Validate Firebase Configuration
 * Ensures all required environment variables are present
 */
function validateConfig(): void {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_DATABASE_URL',
  ];

  const missing = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missing.length > 0) {
    console.error(
      'Missing required Firebase environment variables:',
      missing.join(', ')
    );
    console.error(
      'Please create a .env.local file with your Firebase configuration.'
    );
    console.error('See .env.local.example for reference.');
  }
}

// Validate configuration in development
if (import.meta.env.DEV) {
  validateConfig();
}

/**
 * Initialize Firebase App
 */
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

/**
 * Firestore Instance
 * For persistent, structured data:
 * - User profiles (/users/{userId})
 * - Shape objects (/documents/main/shapes/{shapeId})
 * - Document metadata
 * 
 * Latency: ~100-300ms
 * Best for: Complex queries, transactions, persistent data
 */
export const firestore: Firestore = getFirestore(app);

/**
 * Realtime Database Instance
 * For high-frequency, ephemeral data:
 * - User presence (/presence/main/{userId})
 * - Cursor positions (updated every 50ms)
 * - Connection heartbeats (every 5s)
 * 
 * Latency: <50ms
 * Best for: Real-time sync, ephemeral data, high update frequency
 */
export const database: Database = getDatabase(app);

/**
 * Firebase Authentication Instance
 * Supports:
 * - Anonymous authentication
 * - Google OAuth
 */
export const auth: Auth = getAuth(app);

/**
 * Firebase App Instance
 * Exported for advanced use cases
 */
export { app };

/**
 * Document ID Constants
 * MVP uses single "main" document
 */
export const DOCUMENT_ID = 'main';

// Log database initialization in development
if (import.meta.env.DEV) {
  console.log('Firestore initialized:', firestore.app.name);
  console.log('Realtime Database initialized:', database.app.name);
  console.log('Auth initialized:', auth.app.name);
}

