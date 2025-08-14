import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // You can add a spinner here if you want
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    // User not logged in, redirect to login page
    return <Navigate to="/login" />;
  }

  if (!currentUser.emailVerified) {
    // User's email is not verified, redirect to verification page
    return <Navigate to="/verify-email" />;
  }

  // User is logged in and email is verified, render the child components
  return children;
}

export default ProtectedRoute;
