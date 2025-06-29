// Farmer Database Service for Next Gen Farm
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
  serverTimestamp,
  arrayUnion,
  increment
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Farmer Profile Database Operations
export const farmerService = {
  
  // Create initial farmer profile when farmer signs up
  createFarmerProfile: async (uid, farmerData) => {
    try {
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
        
        // Farm Information
        farmName: farmerData.farmName || '',
        farmAddress: farmerData.farmAddress || '',
        farmType: farmerData.farmType || '',
        farmSize: farmerData.farmSize || '',
        
        // Address Information
        address: farmerData.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        
        // Products for Sale
        products: [],
        totalProductsSold: 0,
        totalRevenue: 0,
        
        // Profile Settings
        profileVisibility: 'public',
        emailNotifications: true,
        smsNotifications: false,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };
      
      await setDoc(farmerRef, farmerProfile);
      console.log('Farmer profile created successfully');
      return farmerProfile;
    } catch (error) {
      console.error('Error creating farmer profile:', error);
      throw error;
    }
  },

  // Get farmer profile by UID
  getFarmerProfile: async (uid) => {
    try {
      const farmerRef = doc(db, 'farmers', uid);
      const farmerSnap = await getDoc(farmerRef);
      
      if (farmerSnap.exists()) {
        return farmerSnap.data();
      } else {
        console.log('No farmer profile found');
        return null;
      }
    } catch (error) {
      console.error('Error getting farmer profile:', error);
      throw error;
    }
  },

  // Update farmer profile
  updateFarmerProfile: async (uid, updateData) => {
    try {
      const farmerRef = doc(db, 'farmers', uid);
      const updatedData = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(farmerRef, updatedData);
      console.log('Farmer profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating farmer profile:', error);
      throw error;
    }
  },

  // Delete farmer profile
  deleteFarmerProfile: async (uid) => {
    try {
      const farmerRef = doc(db, 'farmers', uid);
      await deleteDoc(farmerRef);
      console.log('Farmer profile deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting farmer profile:', error);
      throw error;
    }
  },

  // Add product for sale
  addProduct: async (uid, productData) => {
    try {
      const farmerRef = doc(db, 'farmers', uid);
      const productWithId = {
        ...productData,
        id: Date.now().toString(),
        addedAt: serverTimestamp(),
        status: 'active'
      };
      
      await updateDoc(farmerRef, {
        products: arrayUnion(productWithId),
        updatedAt: serverTimestamp()
      });
      
      console.log('Product added successfully');
      return productWithId;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  // Update product
  updateProduct: async (uid, productId, updatedProductData) => {
    try {
      const farmerProfile = await this.getFarmerProfile(uid);
      if (!farmerProfile) throw new Error('Farmer profile not found');
      
      const productList = farmerProfile.products || [];
      const productIndex = productList.findIndex(product => product.id === productId);
      
      if (productIndex === -1) throw new Error('Product not found');
      
      const updatedProduct = { ...productList[productIndex], ...updatedProductData, updatedAt: serverTimestamp() };
      productList[productIndex] = updatedProduct;
      
      const farmerRef = doc(db, 'farmers', uid);
      await updateDoc(farmerRef, {
        products: productList,
        updatedAt: serverTimestamp()
      });
      
      console.log('Product updated successfully');
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete product
  deleteProduct: async (uid, productId) => {
    try {
      const farmerProfile = await this.getFarmerProfile(uid);
      if (!farmerProfile) throw new Error('Farmer profile not found');
      
      const productList = farmerProfile.products || [];
      const updatedProductList = productList.filter(product => product.id !== productId);
      
      const farmerRef = doc(db, 'farmers', uid);
      await updateDoc(farmerRef, {
        products: updatedProductList,
        updatedAt: serverTimestamp()
      });
      
      console.log('Product deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Get all farmers (for admin purposes)
  getAllFarmers: async () => {
    try {
      const farmersRef = collection(db, 'farmers');
      const farmersSnap = await getDocs(farmersRef);
      
      const farmers = [];
      farmersSnap.forEach((doc) => {
        farmers.push({ id: doc.id, ...doc.data() });
      });
      
      return farmers;
    } catch (error) {
      console.error('Error getting all farmers:', error);
      throw error;
    }
  },

  // Search farmers by farm name or location
  searchFarmers: async (searchTerm) => {
    try {
      const farmersRef = collection(db, 'farmers');
      const q = query(
        farmersRef,
        where('profileVisibility', '==', 'public'),
        orderBy('farmName')
      );
      
      const farmersSnap = await getDocs(q);
      const farmers = [];
      
      farmersSnap.forEach((doc) => {
        const farmerData = doc.data();
        if (farmerData.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            farmerData.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            farmerData.address?.state?.toLowerCase().includes(searchTerm.toLowerCase())) {
          farmers.push({ id: doc.id, ...farmerData });
        }
      });
      
      return farmers;
    } catch (error) {
      console.error('Error searching farmers:', error);
      throw error;
    }
  }
};
