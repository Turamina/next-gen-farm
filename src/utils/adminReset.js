import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  deleteUser
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { userService } from '../services/userService';

/**
 * Admin Reset Utility
 * Sets up ranamaitra09@gmail.com as the sole admin and removes all other admins
 */

export const setupNewAdmin = async () => {
  const newAdminEmail = 'ranamaitra09@gmail.com';
  const newAdminPassword = 'Turamina@9';
  
  try {
    console.log('🔄 Starting admin reset process...');
    
    // Step 1: Delete all existing admin users from Firestore
    console.log('📝 Step 1: Removing all existing admin users...');
    
    // Remove from adminUsers collection
    const adminUsersRef = collection(db, 'adminUsers');
    const adminUsersSnapshot = await getDocs(adminUsersRef);
    
    const batch = writeBatch(db);
    adminUsersSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Remove admin flags from users collection
    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('isAdmin', '==', true));
    const adminSnapshot = await getDocs(adminQuery);
    
    adminSnapshot.docs.forEach((userDoc) => {
      batch.update(userDoc.ref, { 
        isAdmin: false,
        adminRole: null,
        adminPermissions: null
      });
    });
    
    await batch.commit();
    console.log('✅ Step 1 completed: Existing admin users removed');
    
    // Step 2: Create new admin account
    console.log('📝 Step 2: Creating new admin account...');
    console.log('Email:', newAdminEmail);
    console.log('Firebase Auth Domain:', auth.config.authDomain);
    
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, newAdminEmail, newAdminPassword);
      console.log('✅ New admin account created successfully');
    } catch (error) {
      console.log('❌ Error creating admin account:', error.code, error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        console.log('🔄 Account already exists, attempting to sign in...');
        try {
          userCredential = await signInWithEmailAndPassword(auth, newAdminEmail, newAdminPassword);
          console.log('✅ Successfully signed in to existing account');
        } catch (signInError) {
          console.log('❌ Sign in failed:', signInError.code, signInError.message);
          throw new Error(`Failed to sign in to existing account: ${signInError.message}`);
        }
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email format.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password authentication is not enabled in Firebase console.');
      } else {
        throw new Error(`Firebase Auth error: ${error.message}`);
      }
    }
    
    const user = userCredential.user;
    
    // Step 3: Create admin profile in users collection
    console.log('📝 Step 3: Setting up admin profile...');
    
    const adminProfile = {
      uid: user.uid,
      email: newAdminEmail,
      firstName: 'Rana',
      lastName: 'Maitra',
      displayName: 'Rana Maitra',
      phoneNumber: '+91-9999999999',
      
      // Admin specific fields
      isAdmin: true,
      adminRole: 'super_admin',
      adminPermissions: [
        'manage_products',
        'manage_orders', 
        'manage_users',
        'manage_farmers',
        'manage_customers',
        'view_analytics',
        'system_settings',
        'manage_payments',
        'manage_admins'
      ],
      
      // Profile details
      bio: 'System Administrator',
      profilePicture: '',
      dateOfBirth: null,
      
      // Address information
      address: {
        street: 'Admin Office',
        city: 'Dhaka',
        state: 'Dhaka',
        zipCode: '1000',
        country: 'Bangladesh'
      },
      
      // Preferences
      preferences: {
        notifications: {
          email: true,
          sms: false,
          push: true,
          orderUpdates: true,
          promotions: false,
          newsletter: false
        },
        delivery: {
          preferredTime: 'morning',
          specialInstructions: '',
          contactMethod: 'email'
        },
        privacy: {
          profileVisible: false,
          shareData: false
        },
        security: {
          emailVerificationEnabled: true,
          twoFactorEnabled: false,
          loginNotifications: true
        }
      },
      
      // Account statistics
      stats: {
        totalOrders: 0,
        totalSpent: 0,
        favoriteProducts: [],
        lastLoginDate: serverTimestamp(),
        accountCreatedDate: serverTimestamp()
      },
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', user.uid), adminProfile);
    console.log('✅ Step 3 completed: Admin profile created in users collection');
    
    // Step 4: Create admin entry in adminUsers collection
    console.log('📝 Step 4: Creating admin entry in adminUsers collection...');
    
    const adminUserData = {
      uid: user.uid,
      email: newAdminEmail,
      name: 'Rana Maitra',
      role: 'super_admin',
      permissions: [
        'manage_products',
        'manage_orders',
        'manage_users', 
        'manage_farmers',
        'manage_customers',
        'view_analytics',
        'system_settings',
        'manage_payments',
        'manage_admins'
      ],
      isActive: true,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      createdBy: 'system',
      notes: 'Primary system administrator'
    };
    
    await setDoc(doc(db, 'adminUsers', user.uid), adminUserData);
    console.log('✅ Step 4 completed: Admin entry created in adminUsers collection');
    
    // Step 5: Sign out for security
    console.log('📝 Step 5: Signing out for security...');
    await auth.signOut();
    console.log('✅ Step 5 completed: Signed out');
    
    console.log('🎉 Admin reset completed successfully!');
    console.log('📧 New admin email: ranamaitra09@gmail.com');
    console.log('🔑 New admin password: Turamina@9');
    console.log('🚀 You can now sign in to the admin panel');
    
    return {
      success: true,
      message: 'Admin reset completed successfully',
      adminEmail: newAdminEmail,
      adminUid: user.uid
    };
    
  } catch (error) {
    console.error('❌ Error during admin reset:', error);
    throw error;
  }
};

/**
 * Quick admin check function
 * Verifies the new admin setup
 */
export const verifyAdminSetup = async () => {
  try {
    console.log('🔍 Verifying admin setup...');
    
    // Check adminUsers collection
    const adminUsersSnapshot = await getDocs(collection(db, 'adminUsers'));
    console.log(`Found ${adminUsersSnapshot.docs.length} admin user(s)`);
    
    // Check users collection for admin flags
    const usersQuery = query(collection(db, 'users'), where('isAdmin', '==', true));
    const adminSnapshot = await getDocs(usersQuery);
    console.log(`Found ${adminSnapshot.docs.length} user(s) with admin flag`);
    
    // List admin details
    adminSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`Admin: ${data.email} (${data.firstName} ${data.lastName})`);
    });
    
    return {
      adminUsersCount: adminUsersSnapshot.docs.length,
      adminFlaggedUsers: adminSnapshot.docs.length
    };
    
  } catch (error) {
    console.error('Error verifying admin setup:', error);
    throw error;
  }
};

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  window.setupNewAdmin = setupNewAdmin;
  window.verifyAdminSetup = verifyAdminSetup;
}

export default {
  setupNewAdmin,
  verifyAdminSetup
};
