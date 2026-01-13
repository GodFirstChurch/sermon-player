import { Sermon } from '../types';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

// --- CONFIGURATION REQUIRED ---
// 1. Go to console.firebase.google.com
// 2. Create a new project
// 3. Add a Web App </ >
// 4. Copy the config object below
const firebaseConfig = {
  apiKey: "AIzaSyBkW7LXDmlxBvH-XbUkzBKglYMr0O1b7Ck",

  authDomain: "godfirst-church-barry-audio.firebaseapp.com",

  projectId: "godfirst-church-barry-audio",

  storageBucket: "godfirst-church-barry-audio.firebasestorage.app",

  messagingSenderId: "653187269547",

  appId: "1:653187269547:web:a4222782afe30d2b1a88ee",

  measurementId: "G-8JV95QE8EQ"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const COLLECTION_NAME = 'sermons';

// Check if config is still default
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

export const subscribeToSermons = (callback: (sermons: Sermon[]) => void): () => void => {
  if (!isConfigured) {
    console.warn("Firebase not configured. Returning empty list.");
    callback([]);
    return () => {};
  }

  // Subscribe to real-time updates, ordered by date desc
  const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const sermons: Sermon[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Sermon));
    callback(sermons);
  }, (error) => {
    console.error("Error fetching sermons:", error);
    // Fallback or error handling could go here
  });

  return unsubscribe;
};

export const saveSermon = async (sermon: Sermon): Promise<void> => {
  if (!isConfigured) {
    alert("Database not connected. Please update firebaseConfig in services/storage.ts");
    return;
  }

  try {
    const dataToSave = {
      ...sermon,
      updatedAt: serverTimestamp()
    };
    
    // Remove ID from the data payload as it's the doc key
    const { id, ...data } = dataToSave;

    if (id && id.length > 20) { 
      // Existing document (Firestore IDs are usually long strings)
      const sermonRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(sermonRef, data);
    } else {
      // New document
      await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        createdAt: serverTimestamp()
      });
    }
  } catch (e) {
    console.error("Error saving sermon: ", e);
    throw e;
  }
};

export const deleteSermon = async (id: string): Promise<void> => {
  if (!isConfigured) return;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {
    console.error("Error deleting sermon: ", e);
    throw e;
  }
};
