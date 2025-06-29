import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { accountService } from '../services/accountService';
import { adminUserService } from '../services/adminUserService';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userType, setUserType] = useState(null); // 'customer', 'farmer', or null
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
          
          // Get user profile from appropriate collection
          console.log('🔍 Looking for user profile in both collections...');
          let profile = await accountService.getUserProfile(user.uid);
          
          if (profile) {
            setUserProfile(profile);
            setUserType(profile.accountType);
            console.log('✅ User profile found:', profile.accountType);
            
            // Update last login time
            await accountService.updateLastLogin(user.uid, profile.accountType);
          } else {
            // No profile found in either collection
            console.log('❌ No profile found in either customers or farmers collection');
            setUserProfile(null);
            setUserType(null);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          // If profile doesn't exist, it might be a new user
          setUserProfile(null);
          setUserType(null);
        }
      } else {
        setUserProfile(null);
        setUserType(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      setUserType(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Function to refresh user profile
  const refreshUserProfile = async () => {
    if (currentUser) {
      try {
        console.log('🔄 Refreshing user profile...');
        
        // Use the new accountService to get user profile
        const profile = await accountService.getUserProfile(currentUser.uid);
        if (profile) {
          setUserProfile(profile);
          setUserType(profile.accountType);
          console.log('✅ Profile refreshed:', profile.accountType);
          return profile;
        }
        
        // No profile found
        console.log('❌ No profile found during refresh');
        setUserProfile(null);
        setUserType(null);
        return null;
      } catch (error) {
        console.error('Error refreshing user profile:', error);
        throw error;
      }
    }
  };

  const value = {
    currentUser,
    userProfile,
    userType, // Add userType to context value
    logout,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingSpinner message="Initializing..." /> : children}
    </AuthContext.Provider>
  );
}
