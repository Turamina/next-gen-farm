// Authentication utilities for handling different account types
import { accountService } from '../services/accountService';

export const authUtils = {
  // Check what type of account a user has
  getUserAccountType: async (uid) => {
    try {
      // Use the new accountService to get user profile
      const profile = await accountService.getUserProfile(uid);
      if (profile) {
        return { type: profile.accountType, profile: profile };
      }
      
      // No profile found
      return { type: null, profile: null };
    } catch (error) {
      console.error('Error determining user account type:', error);
      throw error;
    }
  },

  // Create account based on type
  createAccountByType: async (uid, userData, accountType) => {
    try {
      const profileData = {
        ...userData,
        accountType
      };

      if (accountType === 'farmer') {
        return await accountService.createFarmerProfile(uid, profileData);
      } else {
        return await accountService.createCustomerProfile(uid, profileData);
      }
    } catch (error) {
      console.error('Error creating account by type:', error);
      throw error;
    }
  },

  // Update profile based on account type
  updateProfileByType: async (uid, updateData, accountType) => {
    try {
      if (accountType === 'farmer') {
        return await accountService.updateFarmerProfile(uid, updateData);
      } else {
        return await accountService.updateCustomerProfile(uid, updateData);
      }
    } catch (error) {
      console.error('Error updating profile by type:', error);
      throw error;
    }
  },

  // Get the appropriate redirect path after login
  getPostLoginRedirect: (accountType) => {
    switch (accountType) {
      case 'farmer':
        return '/farmer/dashboard';
      case 'customer':
      default:
        return '/';
    }
  },

  // Check if user can access farmer routes
  canAccessFarmerRoutes: (userType) => {
    return userType === 'farmer';
  },

  // Check if user can access customer routes
  canAccessCustomerRoutes: (userType) => {
    return userType === 'customer';
  }
};
