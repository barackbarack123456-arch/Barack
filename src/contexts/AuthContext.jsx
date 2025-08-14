import React, { useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function register(email, password, name) {
    return createUserWithEmailAndPassword(auth, email, password).then(async (userCred) => {
        await updateProfile(userCred.user, { displayName: name });
        await sendEmailVerification(userCred.user);

        // Create user document in Firestore
        const userDocRef = doc(db, "usuarios", userCred.user.uid);
        await setDoc(userDocRef, {
            uid: userCred.user.uid,
            email: userCred.user.email,
            name: name,
            role: 'editor', // Default role
            createdAt: serverTimestamp()
        });

        return userCred;
    });
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      // Here you could fetch the user's role from Firestore to add it to the currentUser object
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const value = {
    currentUser,
    register,
    login,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
