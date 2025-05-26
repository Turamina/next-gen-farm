import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { userService } from '../services/userService';
import { adminUserService } from '../services/adminUserService';

/**
 * Utility function to create the default admin account
 * This should be run once to set up the admin account
 */

export const createDefaultAdminAccount = async () => {
  const adminEmail = 'admin@next-gen-farm.com';
  const adminPassword = 'Admin@1234';
  
  try {
    console.log('Creating default admin account...');
    
    // Try to create the admin account
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('Admin account created successfully');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Admin account already exists, signing in...');
        userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      } else {
        throw error;
      }
    }

    const user = userCredential.user;
    
    // Initialize admin users service
    await adminUserService.initialize();
    
    // Create user profile in Firestore
    const adminProfile = {
      firstName: 'System',
      lastName: 'Administrator',
      email: adminEmail,
      phone: '+91-9999999999',
      farmName: 'Next Gen Farm Admin',
      farmType: 'Administrative',
      farmSize: '0',
      location: {
        address: 'Admin Office',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      preferences: {
        newsletter: true,
        smsUpdates: true,
        emailPromotions: false
      },
      isAdmin: true,
      adminRole: 'super_admin',
      adminPermissions: [
        'manage_products',
        'manage_orders',
        'manage_users',
        'view_analytics',
        'system_settings'
      ]
    };

    // Create or update user profile
    await userService.createUserProfile(user.uid, adminProfile);
    
    // Set admin privileges
    await adminUserService.setUserAsAdmin(user.uid, adminEmail);
    
    console.log('✅ Admin account setup completed!');
    console.log('📧 Email: admin@next-gen-farm.com');
    console.log('🔑 Password: Admin@1234');
    
    return {
      success: true,
      message: 'Admin account created successfully',
      email: adminEmail
    };
    
  } catch (error) {
    console.error('Error creating admin account:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

/**
 * Function to verify admin account exists and is properly configured
 */
export const verifyAdminAccount = async () => {
  try {
    const adminEmail = 'admin@next-gen-farm.com';
    
    // Check if admin exists in admin users table
    const adminData = await adminUserService.isAdminUser(adminEmail);
    
    if (adminData) {
      console.log('✅ Admin account verified in admin users table');
      return {
        success: true,
        message: 'Admin account is properly configured',
        adminData: adminData
      };
    } else {
      console.log('❌ Admin account not found in admin users table');
      return {
        success: false,
        message: 'Admin account not properly configured'
      };
    }
  } catch (error) {
    console.error('Error verifying admin account:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

// For manual execution in browser console
window.createAdminAccount = createDefaultAdminAccount;
window.verifyAdminAccount = verifyAdminAccount;
