// Account Service for Next Gen Farm - Handles both Customer and Farmer accounts
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Account Management Service
export const accountService = {
  
  // Create Customer Profile in 'customers' collection
  createCustomerProfile: async (uid, customerData) => {
    try {
      console.log('🛍️ Creating customer profile for UID:', uid);
      const customerRef = doc(db, 'customers', uid);
      const customerProfile = {
        // Basic Info
        uid,
        email: customerData.email,
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        displayName: customerData.displayName || `${customerData.firstName} ${customerData.lastName}`,
        phoneNumber: customerData.phoneNumber || '',
        accountType: 'customer',
        
        // Address Information (optional for customers)
        address: customerData.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        
        // Customer-specific data
        preferences: {
          newsletter: true,
          promotions: true,
          productUpdates: true
        },
        
        // Order history
        orders: [],
        
        // Profile settings
        profileCompleted: false,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };
      
      await setDoc(customerRef, customerProfile);
      console.log('✅ Customer profile created successfully');
      return customerProfile;
      
    } catch (error) {
      console.error('❌ Error creating customer profile:', error);
      throw error;
    }
  },

  // Create Farmer Profile in 'farmers' collection
  createFarmerProfile: async (uid, farmerData) => {
    try {
      console.log('🚜 Creating farmer profile for UID:', uid);
      const farmerRef = doc(db, 'farmers', uid);
      const farmerProfile = {
        // Basic Info
        uid,
        email: farmerData.email,
        firstName: farmerData.firstName || '',
        lastName: farmerData.lastName || '',
        displayName: farmerData.displayName || `${farmerData.firstName} ${farmerData.lastName}`,
        phoneNumber: farmerData.phoneNumber || '',
        accountType: 'farmer',
        
        // Farm Information (required for farmers)
        farmName: farmerData.farmName || '',
        farmAddress: farmerData.farmAddress || '',
        farmType: farmerData.farmType || '',
        farmSize: farmerData.farmSize || '',
        
        // Personal Address Information (optional)
        address: farmerData.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        
        // Farmer-specific data
        cattle: {
          totalCount: 0,
          types: {
            dairy: 0,
            beef: 0,
            other: 0
          }
        },
        
        // Business information
        businessLicense: '',
        certifications: [],
        
        // Products they offer
        products: [],
        
        // Profile settings
        profileCompleted: false,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };
      
      await setDoc(farmerRef, farmerProfile);
      console.log('✅ Farmer profile created successfully');
      return farmerProfile;
      
    } catch (error) {
      console.error('❌ Error creating farmer profile:', error);
      throw error;
    }
  },

  // Get Customer Profile from 'customers' collection
  getCustomerProfile: async (uid) => {
    try {
      console.log('🔍 Fetching customer profile for UID:', uid);
      const customerRef = doc(db, 'customers', uid);
      const customerSnap = await getDoc(customerRef);
      
      if (customerSnap.exists()) {
        console.log('✅ Customer profile found');
        return { id: customerSnap.id, ...customerSnap.data() };
      } else {
        console.log('❌ Customer profile not found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching customer profile:', error);
      throw error;
    }
  },

  // Get Farmer Profile from 'farmers' collection
  getFarmerProfile: async (uid) => {
    try {
      console.log('🔍 Fetching farmer profile for UID:', uid);
      const farmerRef = doc(db, 'farmers', uid);
      const farmerSnap = await getDoc(farmerRef);
      
      if (farmerSnap.exists()) {
        console.log('✅ Farmer profile found');
        return { id: farmerSnap.id, ...farmerSnap.data() };
      } else {
        console.log('❌ Farmer profile not found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching farmer profile:', error);
      throw error;
    }
  },

  // Get Admin Profile from 'adminUsers' collection
  getAdminProfile: async (uid) => {
    try {
      console.log('🔍 Fetching admin profile for UID:', uid);
      const adminRef = doc(db, 'adminUsers', uid);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        console.log('✅ Admin profile found');
        return { id: adminSnap.id, ...adminSnap.data() };
      } else {
        console.log('❌ Admin profile not found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching admin profile:', error);
      throw error;
    }
  },

  // Get User Profile - Checks both collections to determine account type
  getUserProfile: async (uid) => {
    try {
      console.log('🔍 Searching for user profile in all collections for UID:', uid);

      // First check adminUsers collection
      const adminProfile = await accountService.getAdminProfile(uid);
      if (adminProfile) {
        console.log('✅ Found admin profile');
        return { ...adminProfile, accountType: 'admin' };
      }

      // Then check farmers collection
      const farmerProfile = await accountService.getFarmerProfile(uid);
      if (farmerProfile) {
        console.log('✅ Found farmer profile');
        return { ...farmerProfile, accountType: 'farmer' };
      }

      // Then check customers collection
      const customerProfile = await accountService.getCustomerProfile(uid);
      if (customerProfile) {
        console.log('✅ Found customer profile');
        return { ...customerProfile, accountType: 'customer' };
      }

      console.log('❌ No profile found in any collection');
      return null;

    } catch (error) {
      console.error('❌ Error searching for user profile:', error);
      throw error;
    }
  },

  // Update Customer Profile
  updateCustomerProfile: async (uid, updateData) => {
    try {
      console.log('📝 Updating customer profile for UID:', uid);
      const customerRef = doc(db, 'customers', uid);
      await updateDoc(customerRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Customer profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating customer profile:', error);
      throw error;
    }
  },

  // Update Farmer Profile
  updateFarmerProfile: async (uid, updateData) => {
    try {
      console.log('📝 Updating farmer profile for UID:', uid);
      const farmerRef = doc(db, 'farmers', uid);
      await updateDoc(farmerRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Farmer profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating farmer profile:', error);
      throw error;
    }
  },

  // Delete Customer Profile
  deleteCustomerProfile: async (uid) => {
    try {
      console.log('🗑️ Deleting customer profile for UID:', uid);
      const customerRef = doc(db, 'customers', uid);
      await deleteDoc(customerRef);
      console.log('✅ Customer profile deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting customer profile:', error);
      throw error;
    }
  },

  // Delete Farmer Profile
  deleteFarmerProfile: async (uid) => {
    try {
      console.log('🗑️ Deleting farmer profile for UID:', uid);
      const farmerRef = doc(db, 'farmers', uid);
      await deleteDoc(farmerRef);
      console.log('✅ Farmer profile deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting farmer profile:', error);
      throw error;
    }
  },

  // Update last login time
  updateLastLogin: async (uid, accountType) => {
    try {
      console.log('⏰ Updating last login for UID:', uid, 'Type:', accountType);

      let collection;
      if (accountType === 'admin') {
        collection = 'adminUsers';
      } else if (accountType === 'farmer') {
        collection = 'farmers';
      } else {
        collection = 'customers';
      }
      const userRef = doc(db, collection, uid);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp()
      });
      console.log('✅ Last login updated successfully');
    } catch (error) {
      console.error('❌ Error updating last login:', error);
      // Don't throw error for login time update failure
    }
  },

  // ===== FARMER PRODUCT MANAGEMENT =====

  // Get products created by a specific farmer
  getFarmerProducts: async (farmerId) => {
    try {
      console.log('🔍 Fetching products for farmer UID:', farmerId);
      const productsRef = collection(db, 'products');
      
      // Simplified query to avoid index issues
      const q = query(
        productsRef, 
        where('farmerId', '==', farmerId)
      );
      const querySnapshot = await getDocs(q);
      
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Client-side sorting by createdAt
      products.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log(`✅ Found ${products.length} products for farmer`);
      return products;
    } catch (error) {
      console.error('❌ Error fetching farmer products:', error);
      // Return empty array instead of throwing to prevent dashboard crash
      return [];
    }
  },

  // Get farmer product statistics
  getFarmerProductStats: async (farmerId) => {
    try {
      console.log('📊 Fetching product statistics for farmer UID:', farmerId);
      const products = await accountService.getFarmerProducts(farmerId);
      
      const stats = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.isActive && p.status === 'active').length,
        totalSales: products.reduce((sum, p) => sum + (p.sales || 0), 0),
        totalRevenue: products.reduce((sum, p) => sum + ((p.sales || 0) * p.price), 0),
        topProduct: products.length > 0 ? products.sort((a, b) => (b.sales || 0) - (a.sales || 0))[0] : null
      };
      
      console.log('✅ Farmer product statistics calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error calculating farmer product stats:', error);
      // Return default stats instead of throwing
      return {
        totalProducts: 0,
        activeProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        topProduct: null
      };
    }
  },

  // Update farmer product
  updateFarmerProduct: async (productId, updateData, farmerId) => {
    try {
      console.log('📝 Updating product:', productId, 'for farmer:', farmerId);
      
      // First verify the product belongs to this farmer
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        throw new Error('Product not found');
      }
      
      const productData = productSnap.data();
      if (productData.farmerId !== farmerId) {
        throw new Error('You can only update your own products');
      }
      
      // Update the product
      await updateDoc(productRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Product updated successfully');
    } catch (error) {
      console.error('❌ Error updating farmer product:', error);
      throw error;
    }
  },

  // Delete farmer product (soft delete - set inactive)
  deleteFarmerProduct: async (productId, farmerId) => {
    try {
      console.log('🗑️ Deleting product:', productId, 'for farmer:', farmerId);
      
      // First verify the product belongs to this farmer
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        throw new Error('Product not found');
      }
      
      const productData = productSnap.data();
      if (productData.farmerId !== farmerId) {
        throw new Error('You can only delete your own products');
      }
      
      // Soft delete by setting inactive
      await updateDoc(productRef, {
        isActive: false,
        status: 'deleted',
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Product deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting farmer product:', error);
      throw error;
    }
  }
};

export default accountService;
