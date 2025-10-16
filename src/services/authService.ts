/**
 * Authentication Service
 * 
 * Handles anonymous user authentication and user document creation
 * in Firestore. Generates random colors for new users.
 */

import { 
  signInAnonymously, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User, CreateUserData } from '@/types';

/**
 * Predefined color palette for user assignment
 */
const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Lavender
  '#85C1E9', // Sky Blue
];

/**
 * Generate a random color from the predefined palette
 */
const generateRandomColor = (): string => {
  const randomIndex = Math.floor(Math.random() * USER_COLORS.length);
  return USER_COLORS[randomIndex];
};

/**
 * Generate a unique tab ID for this browser tab
 */
const getTabId = (): string => {
  // Use sessionStorage to persist tab ID across refreshes but not across tabs
  let tabId = sessionStorage.getItem('collabCanvasTabId');
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('collabCanvasTabId', tabId);
  }
  return tabId;
};

/**
 * Create user document in Firestore
 */
export const createUserDocument = async (firebaseUser: FirebaseUser): Promise<User> => {
  const tabId = getTabId();
  const userRef = doc(db, 'users', `${firebaseUser.uid}_${tabId}`);
  
  // Check if user document already exists for this tab
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const userData = userDoc.data() as User;
    return userData;
  }

  // Create new user document for this tab
  const userData: CreateUserData = {
    color: generateRandomColor(),
    displayName: `user_${tabId.slice(-6)}`,
    cursorPosition: { x: 0, y: 0 }
  };

  await setDoc(userRef, {
    ...userData,
    id: `${firebaseUser.uid}_${tabId}`,
    lastActive: serverTimestamp()
  });

  console.log('Created user document:', {
    id: `${firebaseUser.uid}_${tabId}`,
    ...userData
  });

  // Set up disconnect handler to clean up user data
  // Note: onDisconnect is not available in client SDK
  // This would typically be handled by Cloud Functions
  console.log('User disconnect cleanup would be handled by Cloud Functions');

  return {
    id: `${firebaseUser.uid}_${tabId}`,
    ...userData,
    lastActive: new Date() as any // Will be replaced by server timestamp
  };
};

/**
 * Sign in anonymously and create user document
 */
export const signInAnonymouslyAndCreateUser = async (): Promise<User> => {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = await createUserDocument(userCredential.user);
    return user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw new Error('Failed to sign in anonymously');
  }
};

/**
 * Sign out current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error('Failed to sign out');
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Listen to authentication state changes
 */
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Update user's last active timestamp
 */
export const updateUserLastActive = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { lastActive: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error('Error updating user last active:', error);
  }
};

/**
 * Update user's cursor position
 */
export const updateUserCursorPosition = async (
  userId: string, 
  position: { x: number; y: number }
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { cursorPosition: position }, { merge: true });
  } catch (error) {
    console.error('Error updating cursor position:', error);
  }
};
