import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Quick admin verification utility
 */
export const quickAdminCheck = async (email = 'ranamaitra09@gmail.com') => {
  console.log('🔍 Quick Admin Check for:', email);
  console.log('====================================');
  
  try {
    // Check current auth user
    const currentUser = auth.currentUser;
    console.log('Current Auth User:', currentUser?.email || 'None');
    console.log('Current Auth UID:', currentUser?.uid || 'None');
    
    if (currentUser && currentUser.email === email) {
      console.log('✅ Target admin is currently signed in');
      
      // Check if admin profile exists in users collection
      const adminDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        console.log('✅ Admin profile found in users collection');
        console.log('Admin data:', {
          email: adminData.email,
          isAdmin: adminData.isAdmin,
          adminRole: adminData.adminRole,
          permissions: adminData.adminPermissions ? Object.keys(adminData.adminPermissions) : 'None'
        });
        
        if (adminData.isAdmin) {
          console.log('🎉 Admin account is properly configured!');
          console.log('📍 Admin should be able to sign in and access /admin');
          return { success: true, admin: adminData };
        } else {
          console.log('⚠️ User found but isAdmin flag is false');
          return { success: false, error: 'User is not marked as admin' };
        }
      } else {
        console.log('❌ No admin profile found in users collection');
        return { success: false, error: 'Admin profile not found' };
      }
    } else {
      console.log('ℹ️ Target admin is not currently signed in');
      console.log('🔧 Recommendation: Run safeAdminSetup() to create/verify admin account');
      return { success: false, error: 'Admin not signed in' };
    }
    
  } catch (error) {
    console.log('❌ Admin check failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Test admin sign-in flow
 */
export const testAdminSignIn = async () => {
  console.log('🧪 Testing Admin Sign-In Flow...');
  console.log('====================================');
  
  try {
    // Import account service
    const { accountService } = await import('../services/accountService');
    
    // Simulate the sign-in flow for admin check
    console.log('1. Checking if admin profile exists in users collection...');
    
    // We can't test actual sign-in without credentials, but we can test the profile lookup
    const currentUser = auth.currentUser;
    if (currentUser) {
      const profile = await accountService.getUserProfile(currentUser.uid);
      
      if (profile) {
        console.log('✅ Profile found:', profile.accountType);
        console.log('Profile data:', {
          email: profile.email,
          accountType: profile.accountType,
          isAdmin: profile.isAdmin || false
        });
        
        if (profile.accountType === 'admin') {
          console.log('🎉 Admin profile lookup works correctly!');
          return { success: true, profile };
        } else {
          console.log('❌ Profile found but not admin type');
          return { success: false, error: 'Not an admin account' };
        }
      } else {
        console.log('❌ No profile found for current user');
        return { success: false, error: 'No profile found' };
      }
    } else {
      console.log('ℹ️ No user currently signed in');
      console.log('🔧 To test: Sign in with admin credentials first');
      return { success: false, error: 'No user signed in' };
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Make functions available globally
window.quickAdminCheck = quickAdminCheck;
window.testAdminSignIn = testAdminSignIn;

export default { quickAdminCheck, testAdminSignIn };
