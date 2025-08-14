import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
    getFirestore,
    collection,
    onSnapshot,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    orderBy,
    limit,
    startAfter,
    getCountFromServer,
    serverTimestamp,
    deleteField
} from "firebase/firestore";

// Import Firebase config from .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exporting firestore functions to be used in other services,
// keeping a similar structure to the original main.js for easier migration.
const firestoreFunctions = {
    collection, onSnapshot, doc, setDoc, getDoc, deleteDoc, query, where, getDocs,
    addDoc, updateDoc, orderBy, limit, startAfter, getCountFromServer, serverTimestamp, deleteField
};

export { app, auth, db, firestoreFunctions };
