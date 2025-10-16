/**
 * Clear Firestore Collections Script
 * 
 * This script clears all users, shapes, and session data from Firestore
 * to reset the collaborative canvas document.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3aN6w8RtOANge7Ed7PsecPZfFET4v4ZQ",
  authDomain: "collab-canvas-25920.firebaseapp.com",
  projectId: "collab-canvas-25920",
  storageBucket: "collab-canvas-25920.firebasestorage.app",
  messagingSenderId: "545938371457",
  appId: "1:545938371457:web:5dbfea56b2751c28d6ae80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Clear all documents from a collection
 */
async function clearCollection(collectionName) {
  try {
    console.log(`Clearing ${collectionName} collection...`);
    
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log(`✅ ${collectionName} collection is already empty`);
      return;
    }
    
    console.log(`Found ${snapshot.size} documents in ${collectionName}`);
    
    // Delete all documents
    const deletePromises = [];
    snapshot.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(doc(db, collectionName, docSnapshot.id)));
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ Cleared ${snapshot.size} documents from ${collectionName}`);
    
  } catch (error) {
    console.error(`❌ Error clearing ${collectionName}:`, error);
  }
}

/**
 * Main cleanup function
 */
async function clearAllData() {
  console.log('🧹 Starting Firestore cleanup...');
  
  try {
    // Clear all collections
    await clearCollection('users');
    await clearCollection('shapes');
    await clearCollection('canvasSession');
    
    console.log('🎉 All Firestore data cleared successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Refresh your browser windows');
    console.log('   2. You should see fresh users created');
    console.log('   3. The canvas should be empty');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
clearAllData();
