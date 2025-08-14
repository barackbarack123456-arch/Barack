import React, { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { AuthContext } from './AuthContextDef';

// Create the AuthProvider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register function
  async function register(email, password) {
    if (!email.endsWith('@barackmercosul.com')) {
      throw new Error("El correo debe ser del dominio @barackmercosul.com");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    await firebaseSignOut(auth);
    return userCredential;
  }

  // Login function
  async function login(email, password) {
    if (!email.endsWith('@barackmercosul.com')) {
      throw new Error("El correo debe ser del dominio @barackmercosul.com");
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user && !userCredential.user.emailVerified) {
      await sendEmailVerification(userCredential.user);
      // We sign out the user and let them know they need to verify
      await firebaseSignOut(auth);
      throw new Error("Por favor verifica tu correo electrónico. Se ha enviado un enlace de verificación a tu bandeja de entrada.");
    }
    return userCredential;
  }

  // Password reset function
  async function sendPasswordReset(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Logout function
  function logout() {
    return firebaseSignOut(auth);
  }

  // Function to send verification email
  function sendVerificationEmail() {
    if (auth.currentUser) {
      return sendEmailVerification(auth.currentUser);
    }
    throw new Error("No user is currently signed in.");
  }

  // Effect to listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const value = {
    currentUser,
    login,
    register,
    logout,
    sendPasswordReset,
    sendVerificationEmail,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
