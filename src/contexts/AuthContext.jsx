import React, { useState, useEffect } from 'react';
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
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
    const user = userCredential.user;

    // Create a document for the new user in the 'usuarios' collection
    const userDocRef = doc(db, 'usuarios', user.uid);
    await setDoc(userDocRef, {
      email: user.email,
      role: 'lector',
    });

    await sendEmailVerification(user);
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

  // Change password function
  async function changePassword(currentPassword, newPassword) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user is currently signed in.");
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (error) {
        if (error.code === 'auth/wrong-password') {
            throw new Error('La contraseña actual es incorrecta.');
        } else if (error.code === 'auth/too-many-requests') {
            throw new Error('Demasiados intentos fallidos. Inténtalo de nuevo más tarde.');
        } else {
            throw new Error('Ocurrió un error al cambiar la contraseña.');
        }
    }
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
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUser({ ...user, ...userDoc.data() });
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
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
    changePassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
