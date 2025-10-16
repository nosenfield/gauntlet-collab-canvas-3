/**
 * Authentication Service
 * 
 * Handles anonymous user authentication and user document creation
 * in Firestore. Generates random colors for new users.
 */

import { 
  signInAnonymously, 
  User as FirebaseUser,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  onDisconnect,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, CreateUserData } from '@/types';

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
 * Create user document in Firestore
 */
const createUserDocument = async (firebaseUser: FirebaseUser): Promise<User> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  
  // Check if user document already exists
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const userData = userDoc.data() as User;
    return userData;
  }

  // Create new user document
  const userData: CreateUserData = {
    color: generateRandomColor(),
    displayName: `user_${firebaseUser.uid.slice(-6)}`,
    cursorPosition: { x: 0, y: 0 }
  };

  await setDoc(userRef, {
    ...userData,
    id: firebaseUser.uid,
    lastActive: serverTimestamp()
  });

  // Set up disconnect handler to clean up user data
  onDisconnect(userRef).delete();

  return {
    id: firebaseUser.uid,
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
