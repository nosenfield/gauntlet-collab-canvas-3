/**
 * Authentication Service
 * 
 * Handles Firebase authentication and user profile management:
 * - Anonymous sign-in
 * - Google OAuth sign-in
 * - User profile creation in Firestore
 * - User color assignment
 */

import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, firestore } from '@/api/firebase';
import type { User } from '@/types/firebase';
import { USER_COLOR_PALETTE } from '@/types/firebase';

/**
 * Assign a color to a user based on their user ID
 * Uses deterministic hash to ensure same user gets same color
 */
function assignUserColor(userId: string): string {
  // Simple hash function to convert userId to index
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % USER_COLOR_PALETTE.length;
  return USER_COLOR_PALETTE[index];
}

/**
 * Generate display name for anonymous users
 * Format: "Anonymous User [first 4 chars of UUID]"
 */
function generateAnonymousDisplayName(userId: string): string {
  const prefix = userId.substring(0, 4).toUpperCase();
  return `Anonymous User ${prefix}`;
}

/**
 * Create or update user profile in Firestore
 */
async function createOrUpdateUserProfile(firebaseUser: FirebaseUser): Promise<User> {
  const userDocRef = doc(firestore, 'users', firebaseUser.uid);
  
  // Check if user already exists
  const userDoc = await getDoc(userDocRef);
  
  if (userDoc.exists()) {
    // Update last active timestamp
    await updateDoc(userDocRef, {
      lastActive: serverTimestamp(),
    });
    
    return userDoc.data() as User;
  } else {
    // Create new user profile
    const displayName = firebaseUser.displayName 
      || generateAnonymousDisplayName(firebaseUser.uid);
    const color = assignUserColor(firebaseUser.uid);
    
    const newUser: Omit<User, 'createdAt' | 'lastActive'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      lastActive: ReturnType<typeof serverTimestamp>;
    } = {
      userId: firebaseUser.uid,
      displayName,
      color,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    };
    
    await setDoc(userDocRef, newUser);
    
    // Return user with temporary timestamps (will be replaced by server)
    return {
      userId: firebaseUser.uid,
      displayName,
      color,
      createdAt: new Date() as any, // Placeholder until server updates
      lastActive: new Date() as any,
    };
  }
}

/**
 * Sign in anonymously
 * Creates anonymous Firebase Auth user and user profile
 */
export async function signInAnonymous(): Promise<User> {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = await createOrUpdateUserProfile(userCredential.user);
    console.log('Anonymous sign-in successful:', user);
    return user;
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    throw new Error('Failed to sign in anonymously');
  }
}

/**
 * Sign in with Google OAuth
 * Opens Google sign-in popup and creates user profile
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = await createOrUpdateUserProfile(userCredential.user);
    console.log('Google sign-in successful:', user);
    return user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw new Error('Failed to sign in with Google');
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    console.log('Sign-out successful');
  } catch (error) {
    console.error('Sign-out error:', error);
    throw new Error('Failed to sign out');
  }
}

/**
 * Listen to authentication state changes
 * Returns unsubscribe function
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const user = await createOrUpdateUserProfile(firebaseUser);
        callback(user);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const firebaseUser = auth.currentUser;
  
  if (!firebaseUser) {
    return null;
  }
  
  try {
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as User;
    } else {
      // Create profile if it doesn't exist
      return await createOrUpdateUserProfile(firebaseUser);
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

