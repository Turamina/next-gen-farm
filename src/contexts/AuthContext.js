import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { userService } from '../services/userService';
import { adminUserService } from '../services/adminUserService';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Initialize admin users service
    adminUserService.initialize();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Check if user is admin and set admin privileges
          await adminUserService.setUserAsAdmin(user.uid, user.email);
          
          // Update last login time
          await userService.updateLastLogin(user.uid);
          
          // Get user profile from Firestore
          const profile = await userService.getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // If profile doesn't exist, it might be a new user
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Function to refresh user profile
  const refreshUserProfile = async () => {
    if (currentUser) {
      try {
        const profile = await userService.getUserProfile(currentUser.uid);
        setUserProfile(profile);
        return profile;
      } catch (error) {
        console.error('Error refreshing user profile:', error);
        throw error;
      }
    }
  };

  const value = {
    currentUser,
    userProfile,
    logout,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingSpinner message="Initializing..." /> : children}
    </AuthContext.Provider>
  );
}
