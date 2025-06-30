import { auth, db } from '../firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  deleteUser,
  signOut
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  deleteDoc
} from 'firebase/firestore';

/**
 * Safe Admin Setup - Alternative approach with better error handling
 */
export const safeAdminSetup = async (adminEmail = 'ranamaitra09@gmail.com', adminPassword = 'Turamina@9') => {
  console.log('🔧 Starting Safe Admin Setup...');
  console.log('=====================================');
  
  try {
    // Step 1: Run diagnostics first
    console.log('🔍 Running pre-setup diagnostics...');
    const diagnostics = await window.runFirebaseDiagnostics?.() || {};
    
    if (!diagnostics.auth || !diagnostics.firestore) {
      throw new Error('Firebase configuration issues detected. Please check diagnostics.');
    }
    
    // Step 2: Clean up existing admin accounts in Firestore only
    console.log('🧹 Cleaning up existing admin accounts...');
    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('isAdmin', '==', true));
    const adminSnapshot = await getDocs(adminQuery);
    
    const batch = writeBatch(db);
    let removedCount = 0;
    
    adminSnapshot.forEach((doc) => {
      batch.update(doc.ref, { 
        isAdmin: false,
        adminRole: null,
        adminPermissions: null
      });
      removedCount++;
    });
    
    if (removedCount > 0) {
      await batch.commit();
      console.log(`✅ Removed admin privileges from ${removedCount} users`);
    } else {
      console.log('✅ No existing admin accounts found');
    }
    
    // Step 3: Check if user exists in Firestore
    console.log('🔍 Checking if target admin user exists...');
    const userExists = await window.checkEmailExists?.(adminEmail);
    
    // Step 4: Handle user creation/authentication
    let userCredential;
    let currentUser = auth.currentUser;
    
    if (currentUser && currentUser.email === adminEmail) {
      console.log('✅ Target admin is already signed in');
      userCredential = { user: currentUser };
    } else {
      // Sign out current user if any
      if (currentUser) {
        await signOut(auth);
        console.log('🔄 Signed out current user');
      }
      
      try {
        console.log('📝 Attempting to create new admin account...');
        userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('✅ New admin account created successfully');
      } catch (createError) {
        console.log('⚠️ Create failed:', createError.code);
        
        if (createError.code === 'auth/email-already-in-use') {
          console.log('🔄 Email exists, attempting to sign in...');
          try {
            userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
            console.log('✅ Successfully signed in to existing account');
          } catch (signInError) {
            console.log('❌ Sign in failed:', signInError.code, signInError.message);
            
            if (signInError.code === 'auth/wrong-password' || signInError.code === 'auth/invalid-credential') {
              throw new Error(`Wrong password for existing account. Please use the correct password for ${adminEmail}`);
            } else {
              throw new Error(`Sign in failed: ${signInError.message}`);
            }
          }
        } else {
          throw new Error(`Account creation failed: ${createError.message}`);
        }
      }
    }
    
    const user = userCredential.user;
    console.log('👤 Working with user:', user.email, 'UID:', user.uid);
    
    // Step 5: Create/Update admin profile in Firestore
    console.log('📝 Setting up admin profile in Firestore...');
    
    const adminProfile = {
      uid: user.uid,
      email: user.email,
      isAdmin: true,
      adminRole: 'super_admin',
      adminPermissions: {
        canManageUsers: true,
        canManageProducts: true,
        canManageOrders: true,
        canAccessAnalytics: true,
        canManageSettings: true,
        canDeleteData: true
      },
      emailVerified: user.emailVerified || false,
      emailVerificationEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, adminProfile, { merge: true });
    
    console.log('✅ Admin profile created/updated successfully');
    
    // Step 6: Verify the setup
    console.log('🔍 Verifying admin setup...');
    const verificationResult = await verifyAdminSetup(adminEmail);
    
    if (verificationResult.success) {
      console.log('🎉 Admin setup completed successfully!');
      console.log('=====================================');
      console.log('✅ Admin Email:', adminEmail);
      console.log('✅ Admin UID:', user.uid);
      console.log('✅ Permissions:', Object.keys(adminProfile.adminPermissions).filter(p => adminProfile.adminPermissions[p]).join(', '));
      console.log('📱 You can now sign in at /signin');
      return { success: true, user, profile: adminProfile };
    } else {
      throw new Error('Setup verification failed');
    }
    
  } catch (error) {
    console.log('❌ Safe Admin Setup Failed:', error.message);
    console.log('🔧 Troubleshooting suggestions:');
    console.log('1. Check Firebase configuration in firebaseConfig.js');
    console.log('2. Ensure Firebase Auth is enabled in Firebase Console');
    console.log('3. Check internet connection');
    console.log('4. Try running: runFirebaseDiagnostics()');
    
    return { success: false, error: error.message };
  }
};

/**
 * Verify admin setup
 */
export const verifyAdminSetup = async (adminEmail = 'ranamaitra09@gmail.com') => {
  console.log('🔍 Verifying admin setup...');
  
  try {
    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('email', '==', adminEmail), where('isAdmin', '==', true));
    const adminSnapshot = await getDocs(adminQuery);
    
    if (adminSnapshot.empty) {
      console.log('❌ Admin user not found or not set as admin');
      return { success: false, error: 'Admin not found' };
    }
    
    const adminDoc = adminSnapshot.docs[0];
    const adminData = adminDoc.data();
    
    console.log('✅ Admin verification successful');
    console.log('Admin details:', {
      email: adminData.email,
      role: adminData.adminRole,
      permissions: adminData.adminPermissions
    });
    
    return { success: true, admin: adminData };
    
  } catch (error) {
    console.log('❌ Admin verification failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Make functions available globally
window.safeAdminSetup = safeAdminSetup;
window.verifyAdminSetup = verifyAdminSetup;

export default { safeAdminSetup, verifyAdminSetup };
