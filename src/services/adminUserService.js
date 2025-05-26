import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Admin User Service - Manages admin users in dedicated Firestore collection
 */

class AdminUserService {
  constructor() {
    this.adminUsersCollection = 'adminUsers';
  }

  /**
   * Initialize admin users collection with default admin
   */
  async initializeAdminUsers() {
    try {
      // Check if admin users collection exists and has the default admin
      const adminQuery = query(
        collection(db, this.adminUsersCollection),
        where('email', '==', 'admin@next-gen-farm.com')
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      
      if (adminSnapshot.empty) {
        // Create default admin user
        await this.createAdminUser({
          email: 'admin@next-gen-farm.com',
          name: 'System Administrator',
          role: 'super_admin',
          permissions: [
            'manage_products',
            'manage_orders',
            'manage_users',
            'view_analytics',
            'system_settings'
          ],
          isActive: true,
          createdAt: serverTimestamp(),
          lastLogin: null
        });
        
        console.log('Default admin user created successfully');
      }
    } catch (error) {
      console.error('Error initializing admin users:', error);
    }
  }

  /**
   * Create a new admin user
   * @param {Object} adminData - Admin user data
   */
  async createAdminUser(adminData) {
    try {
      const adminUser = {
        ...adminData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, this.adminUsersCollection), adminUser);
      console.log('Admin user created:', adminData.email);
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw new Error('Failed to create admin user');
    }
  }

  /**
   * Check if a user is admin by email
   * @param {string} email - User email to check
   * @returns {Promise<Object|null>} Admin user data or null
   */
  async isAdminUser(email) {
    try {
      if (!email) return null;

      const adminQuery = query(
        collection(db, this.adminUsersCollection),
        where('email', '==', email),
        where('isActive', '==', true)
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      
      if (!adminSnapshot.empty) {
        const adminDoc = adminSnapshot.docs[0];
        return {
          id: adminDoc.id,
          ...adminDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error checking admin user:', error);
      return null;
    }
  }

  /**
   * Update admin user's last login time
   * @param {string} email - Admin email
   */
  async updateAdminLastLogin(email) {
    try {
      const adminQuery = query(
        collection(db, this.adminUsersCollection),
        where('email', '==', email)
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      
      if (!adminSnapshot.empty) {
        const adminDoc = adminSnapshot.docs[0];
        await setDoc(doc(db, this.adminUsersCollection, adminDoc.id), {
          ...adminDoc.data(),
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating admin last login:', error);
    }
  }

  /**
   * Get all admin users
   * @returns {Promise<Array>} Array of admin users
   */
  async getAllAdminUsers() {
    try {
      const adminSnapshot = await getDocs(collection(db, this.adminUsersCollection));
      const adminUsers = [];
      
      adminSnapshot.forEach((doc) => {
        adminUsers.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return adminUsers;
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }

  /**
   * Set user as admin in regular users collection
   * @param {string} userId - User ID
   * @param {string} email - User email
   */
  async setUserAsAdmin(userId, email) {
    try {
      // Check if user is in admin users table
      const adminData = await this.isAdminUser(email);
      
      if (adminData) {
        // Update user profile to mark as admin
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          isAdmin: true,
          adminRole: adminData.role,
          adminPermissions: adminData.permissions,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Update admin last login
        await this.updateAdminLastLogin(email);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error setting user as admin:', error);
      return false;
    }
  }

  /**
   * Remove admin privileges from user
   * @param {string} userId - User ID
   */
  async removeAdminPrivileges(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        isAdmin: false,
        adminRole: null,
        adminPermissions: null,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error removing admin privileges:', error);
    }
  }

  /**
   * Initialize the service (call this when app starts)
   */
  async initialize() {
    await this.initializeAdminUsers();
  }
}

// Create and export a singleton instance
export const adminUserService = new AdminUserService();
export default adminUserService;
