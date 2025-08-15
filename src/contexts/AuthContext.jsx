import React, { useState, useEffect } from 'react';
import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from '../services/firebase';
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
    // Do not sign out, let the protected route handle the redirect.
    return userCredential;
  }

  // Login function
  async function login(email, password) {
    if (!email.endsWith('@barackmercosul.com')) {
      throw new Error("El correo debe ser del dominio @barackmercosul.com");
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user && !userCredential.user.emailVerified) {
      // Don't throw an error here. The ProtectedRoute will handle redirection.
      // We can still resend the email as a courtesy.
      await sendEmailVerification(userCredential.user);
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
      {children}
    </AuthContext.Provider>
  );
}
