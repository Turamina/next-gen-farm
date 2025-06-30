import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';

/**
 * Firebase Diagnostics Utility
 * Run diagnostics to check Firebase connectivity and configuration
 */
export const runFirebaseDiagnostics = async () => {
  console.log('🔍 Running Firebase Diagnostics...');
  console.log('=====================================');
  
  const results = {
    auth: false,
    firestore: false,
    userAccess: false,
    errors: []
  };
  
  try {
    // Test 1: Check Auth Configuration
    console.log('🔧 Testing Auth Configuration...');
    console.log('Auth Domain:', auth.config?.authDomain || 'Not configured');
    console.log('Project ID:', auth.config?.projectId || 'Not configured');
    
    if (auth.config?.authDomain && auth.config?.projectId) {
      results.auth = true;
      console.log('✅ Auth configuration looks good');
    } else {
      results.errors.push('Auth configuration incomplete');
      console.log('❌ Auth configuration incomplete');
    }
    
    // Test 2: Check Current Auth State
    console.log('\n👤 Checking Current Auth State...');
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('✅ User is signed in:', currentUser.email);
      console.log('UID:', currentUser.uid);
      results.userAccess = true;
    } else {
      console.log('⚠️ No user currently signed in');
    }
    
    // Test 3: Check Firestore Connection
    console.log('\n🗄️ Testing Firestore Connection...');
    try {
      const testQuery = query(collection(db, 'users'), limit(1));
      const snapshot = await getDocs(testQuery);
      console.log('✅ Firestore connection successful');
      console.log('Users collection exists:', !snapshot.empty);
      results.firestore = true;
    } catch (firestoreError) {
      console.log('❌ Firestore connection failed:', firestoreError.message);
      results.errors.push(`Firestore error: ${firestoreError.message}`);
    }
    
    // Test 4: Check Admin Users
    console.log('\n👑 Checking Admin Users...');
    try {
      const adminQuery = query(collection(db, 'users'));
      const adminSnapshot = await getDocs(adminQuery);
      const adminUsers = [];
      
      adminSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.isAdmin) {
          adminUsers.push({
            id: doc.id,
            email: userData.email,
            role: userData.adminRole || 'admin'
          });
        }
      });
      
      console.log(`Found ${adminUsers.length} admin users:`);
      adminUsers.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.role})`);
      });
      
    } catch (adminError) {
      console.log('❌ Admin check failed:', adminError.message);
      results.errors.push(`Admin check error: ${adminError.message}`);
    }
    
  } catch (error) {
    console.log('❌ Diagnostics failed:', error.message);
    results.errors.push(`General error: ${error.message}`);
  }
  
  console.log('\n📊 Diagnostics Summary:');
  console.log('=====================================');
  console.log('Auth Configuration:', results.auth ? '✅' : '❌');
  console.log('Firestore Connection:', results.firestore ? '✅' : '❌');
  console.log('User Access:', results.userAccess ? '✅' : '⚠️');
  console.log('Errors:', results.errors.length);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 Errors Found:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  return results;
};

/**
 * Check if a specific email exists in Firebase Auth
 */
export const checkEmailExists = async (email) => {
  console.log(`🔍 Checking if email exists: ${email}`);
  
  try {
    // We can't directly check if an email exists in Firebase Auth from the client
    // But we can check if it exists in our Firestore users collection
    const usersQuery = query(collection(db, 'users'));
    const snapshot = await getDocs(usersQuery);
    
    let userFound = false;
    snapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.email === email) {
        userFound = true;
        console.log('✅ Email found in Firestore users collection');
        console.log('User data:', {
          id: doc.id,
          email: userData.email,
          isAdmin: userData.isAdmin || false,
          adminRole: userData.adminRole || null
        });
      }
    });
    
    if (!userFound) {
      console.log('❌ Email not found in Firestore users collection');
    }
    
    return userFound;
    
  } catch (error) {
    console.log('❌ Error checking email:', error.message);
    return false;
  }
};

// Make functions available globally for console use
window.runFirebaseDiagnostics = runFirebaseDiagnostics;
window.checkEmailExists = checkEmailExists;

export default { runFirebaseDiagnostics, checkEmailExists };
