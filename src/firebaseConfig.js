// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// NOTE: These are placeholder values - replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKWkMVYl4v-RZOFaPmCjb1f0mdB9TKKWY", // This needs to be your real API key
  authDomain: "next-gen-farm.firebaseapp.com", // This should match your project ID
  projectId: "next-gen-farm", // This should be your actual project ID
  storageBucket: "next-gen-farm.appspot.com", // This should match your project ID
  messagingSenderId: "123456789012", // REPLACE: This needs to be your real sender ID
  appId: "1:123456789012:web:abcdef123456789012345678" // REPLACE: This needs to be your real app ID
};

// Log configuration for debugging
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? 'SET' : 'NOT SET',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId
});

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize Firebase services
export { auth, db, storage };
export default app;