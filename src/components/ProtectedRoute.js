import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requireFarmer = false }) => {
  const { currentUser, userType, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  // If this route requires farmer access but user is not a farmer
  if (requireFarmer && userType !== 'farmer') {
    // If user is a customer trying to access farmer routes, redirect to home
    if (userType === 'customer') {
      return <Navigate to="/" replace />;
    }
    // If userType is null (no profile found), redirect to signin
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;
