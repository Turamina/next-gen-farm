// User Database Service for Next Gen Farm
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

// User Profile Database Operations
export const userService = {
  
  // Create initial user profile when user signs up
  createUserProfile: async (uid, userData) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userProfile = {
        // Basic Info
        uid,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`,
        phoneNumber: userData.phoneNumber || '',
        
        // Farm Information
        farmName: userData.farmName || '',
        farmAddress: userData.farmAddress || '',
        farmType: userData.farmType || '',
        farmSize: userData.farmSize || '',
        
        // Cattle Information
        cattle: {
          totalCount: 0,
          types: {
            dairy: 0,
            beef: 0,
            other: 0
          },
          totalDailyFoodRequirement: 0,
          lastUpdated: null
        },
        
        // Profile Details
        bio: userData.bio || '',
        profilePicture: userData.profilePicture || '',
        dateOfBirth: userData.dateOfBirth || null,
        
        // Address Information
        address: {
          street: userData.address?.street || '',
          city: userData.address?.city || '',
          state: userData.address?.state || '',
          zipCode: userData.address?.zipCode || '',
          country: userData.address?.country || 'USA'
        },
        
        // Preferences
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true,
            orderUpdates: true,
            promotions: true,
            newsletter: true
          },
          delivery: {
            preferredTime: 'morning',
            specialInstructions: '',
            contactMethod: 'phone'
          },
          privacy: {
            profileVisible: false,
            shareData: false
          }
        },
        
        // Account Statistics
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          loyaltyPoints: 0,
          lastOrderDate: null,
          favoriteProducts: []
        },
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };
      
      await setDoc(userRef, userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // Get user profile
  getUserProfile: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateUserProfile: async (uid, updates) => {
    try {
      const userRef = doc(db, 'users', uid);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, updateData);
      return updateData;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Update last login time
  updateLastLogin: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  },

  // Delete user account and all associated data
  deleteUserAccount: async (uid) => {
    try {
      // Delete user profile
      const userRef = doc(db, 'users', uid);
      await deleteDoc(userRef);
      
      // Delete all user orders
      const ordersQuery = query(collection(db, 'orders'), where('userId', '==', uid));
      const ordersSnapshot = await getDocs(ordersQuery);
      const orderDeletions = ordersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(orderDeletions);
      
      // Delete user cart
      const cartRef = doc(db, 'carts', uid);
      await deleteDoc(cartRef);
      
      // Delete user favorites
      const favoritesRef = doc(db, 'favorites', uid);
      await deleteDoc(favoritesRef);
      
      // Delete user reviews
      const reviewsQuery = query(collection(db, 'reviews'), where('userId', '==', uid));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewDeletions = reviewsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(reviewDeletions);
      
      console.log('User account and all data deleted successfully');
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  },

  // Export cattle management service
  cattleService: {
    // Update cattle statistics in user profile
    updateCattleStats: async (uid) => {
      try {
        const { adminService } = await import('./adminService');
        
        // Get all cattle for the user
        const cattle = await adminService.getUserCattle(uid);
        
        // Calculate totals
        const stats = {
          totalCount: cattle.length,
          types: {
            dairy: cattle.filter(c => c.type?.toLowerCase() === 'dairy').length,
            beef: cattle.filter(c => c.type?.toLowerCase() === 'beef').length,
            other: cattle.filter(c => !['dairy', 'beef'].includes(c.type?.toLowerCase())).length
          },
          totalDailyFoodRequirement: await adminService.getTotalFoodRequirement(uid),
          lastUpdated: serverTimestamp()
        };

        // Update user profile
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          'cattle': stats,
          updatedAt: serverTimestamp()
        });

        return stats;
      } catch (error) {
        console.error('Error updating cattle statistics:', error);
        throw error;
      }
    }
  }
};

// Order Management Service
export const orderService = {
    // Create a new order
  createOrder: async (uid, orderData) => {
    try {
      console.log('Creating order for user:', uid);
      console.log('Order data:', JSON.stringify(orderData));
      
      // Validate required fields
      if (!uid) throw new Error('User ID is required');
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new Error('Order must contain at least one item');
      }
      
      const ordersRef = collection(db, 'orders');
      const orderId = generateOrderId();
      console.log('Generated order ID:', orderId);
      
      const order = {
        uid,
        orderId: orderId,
        
        // Order Details
        items: orderData.items || [], // Array of products with quantities
        totalAmount: orderData.totalAmount || 0,
        subtotal: orderData.subtotal || 0,
        tax: orderData.tax || 0,
        shipping: orderData.shipping || 0,
        discount: orderData.discount || 0,
          // Order Status
        status: orderData.status || 'pending', // pending, confirmed, processing, shipped, delivered, cancelled
        paymentStatus: orderData.paymentStatus || 'pending', // pending, paid, failed, refunded
        
        // Delivery Information
        deliveryAddress: orderData.deliveryAddress || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Bangladesh',
          phone: ''
        },
        deliveryDate: orderData.deliveryDate || null,
        deliveryTimeSlot: orderData.deliveryTimeSlot || null,
        deliveryInstructions: orderData.deliveryInstructions || '',
        
        // Payment Information
        paymentMethod: orderData.paymentMethod || 'cash_on_delivery',
        paymentId: orderData.paymentId || null,
        paymentDetails: orderData.paymentDetails || null,
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
        estimatedDelivery: orderData.estimatedDelivery || null
      };
      
      console.log('Adding order to Firestore...');
      const docRef = await addDoc(ordersRef, order);
      console.log('Order created with ID:', docRef.id);
      
      // Update inventory for each product
      console.log('Updating product inventory...');
      for (const item of orderData.items) {
        try {
          const productRef = doc(db, 'products', item.productId);
          
          // First check if product exists
          const productDoc = await getDoc(productRef);
          if (!productDoc.exists()) {
            console.warn(`Product ${item.productId} does not exist, skipping inventory update`);
            continue;
          }
          
          await updateDoc(productRef, {
            stock: increment(-item.quantity),
          });
          console.log(`Updated inventory for product ${item.productId}, reduced by ${item.quantity}`);
        } catch (err) {
          console.error(`Error updating inventory for product ${item.productId}:`, err);
          // Continue with other products even if one fails
        }
      }
      
      // Update user stats
      console.log('Updating user stats...');
      try {
        await updateDoc(doc(db, 'users', uid), {
          'stats.totalOrders': increment(1),
          'stats.totalSpent': increment(orderData.totalAmount),
          'stats.lastOrderDate': serverTimestamp()
        });
        console.log('User stats updated successfully');      } catch (err) {
        console.error('Error updating user stats:', err);
        // Continue even if user stats update fails
      }
      
      return { id: docRef.id, ...order };
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  },  // Get user orders
  getUserOrders: async (uid, limit = 100) => {
    try {
      console.log('Fetching orders for user:', uid);
      const ordersRef = collection(db, 'orders');
      
      // Create a query with just the uid filter initially
      // We'll sort the results client-side to avoid Firestore index requirements
      const q = query(
        ordersRef,
        where('uid', '==', uid)
      );
      
      console.log('Executing query...');
      const querySnapshot = await getDocs(q);
      const orders = [];
      console.log(`Found ${querySnapshot.size} orders for user ${uid}`);
      
      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        
        // Convert Firestore timestamps or date strings to JavaScript Date objects
        let createdAtDate;
        let updatedAtDate;
        
        // Handle createdAt conversion with robust error checking
        try {
          if (orderData.createdAt) {
            if (orderData.createdAt instanceof Date) {
              createdAtDate = orderData.createdAt;
            } else if (orderData.createdAt.seconds) {
              // Firestore Timestamp object
              createdAtDate = new Date(orderData.createdAt.seconds * 1000);
            } else if (typeof orderData.createdAt === 'string') {
              // ISO string or other date string
              createdAtDate = new Date(orderData.createdAt);
            } else if (typeof orderData.createdAt === 'number') {
              // Unix timestamp in milliseconds
              createdAtDate = new Date(orderData.createdAt);
            } else {
              console.warn('Unknown createdAt format:', orderData.createdAt);
              createdAtDate = new Date();
            }
          } else {
            console.warn('Order missing createdAt, using current date');
            createdAtDate = new Date();
          }
        } catch (err) {
          console.error('Error converting createdAt:', err);
          createdAtDate = new Date();
        }
        
        // Similar handling for updatedAt
        try {
          if (orderData.updatedAt) {
            if (orderData.updatedAt instanceof Date) {
              updatedAtDate = orderData.updatedAt;
            } else if (orderData.updatedAt.seconds) {
              updatedAtDate = new Date(orderData.updatedAt.seconds * 1000);
            } else if (typeof orderData.updatedAt === 'string') {
              updatedAtDate = new Date(orderData.updatedAt);
            } else if (typeof orderData.updatedAt === 'number') {
              updatedAtDate = new Date(orderData.updatedAt);
            } else {
              updatedAtDate = new Date();
            }
          } else {
            updatedAtDate = createdAtDate; // Default to createdAt if missing
          }
        } catch (err) {
          console.error('Error converting updatedAt:', err);
          updatedAtDate = createdAtDate;
        }
        
        // Create processed order with validated dates
        const processedOrder = {
          id: doc.id,
          ...orderData,
          createdAt: createdAtDate,
          updatedAt: updatedAtDate
        };
        
        orders.push(processedOrder);
      });
      
      // Sort orders by createdAt date (newest first)
      orders.sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      console.log('Processed and sorted orders:', orders.map(o => ({
        id: o.id,
        orderId: o.orderId,
        createdAt: o.createdAt.toISOString(),
        items: o.items?.length || 0
      })));
      
      return orders;
    } catch (error) {
      console.error('Error getting user orders:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status, additionalData = {}) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        ...additionalData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
};

// Cart Management Service
export const cartService = {
  
  // Add item to cart
  addToCart: async (uid, productData) => {
    try {
      const cartRef = collection(db, 'carts');
      const cartItem = {
        uid,
        productId: productData.productId,
        productName: productData.productName,
        productImage: productData.productImage,
        price: productData.price,
        quantity: productData.quantity,
        addedAt: serverTimestamp()
      };
      
      await addDoc(cartRef, cartItem);
      return cartItem;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },
  // Get user cart
  getUserCart: async (uid) => {
    try {
      const cartRef = collection(db, 'carts');
      const q = query(cartRef, where('uid', '==', uid));
      
      const querySnapshot = await getDocs(q);
      const cartItems = [];
      
      querySnapshot.forEach((doc) => {
        cartItems.push({ id: doc.id, ...doc.data() });
      });
      
      return cartItems;
    } catch (error) {
      console.error('Error getting user cart:', error);
      throw error;
    }
  },

  // Remove item from cart
  removeFromCart: async (cartItemId) => {
    try {
      const cartItemRef = doc(db, 'carts', cartItemId);
      await deleteDoc(cartItemRef);
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  // Update cart item quantity
  updateCartItemQuantity: async (cartItemId, newQuantity) => {
    try {
      const cartItemRef = doc(db, 'carts', cartItemId);
      await updateDoc(cartItemRef, {
        quantity: newQuantity,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw error;
    }
  },

  // Clear entire cart
  clearCart: async (uid) => {
    try {
      const cartRef = collection(db, 'carts');
      const q = query(cartRef, where('uid', '==', uid));
      
      const querySnapshot = await getDocs(q);
      const deletePromises = [];
      
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
};

// Favorites/Wishlist Service
export const favoritesService = {
  
  // Add product to favorites
  addToFavorites: async (uid, productId) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        'stats.favoriteProducts': arrayUnion(productId),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  },

  // Remove from favorites
  removeFromFavorites: async (uid, productId) => {
    try {
      const userProfile = await userService.getUserProfile(uid);
      const updatedFavorites = userProfile.stats.favoriteProducts.filter(id => id !== productId);
      
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        'stats.favoriteProducts': updatedFavorites,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }
};

// Reviews Service
export const reviewService = {
  
  // Add product review
  addReview: async (uid, reviewData) => {
    try {
      const reviewsRef = collection(db, 'reviews');
      const review = {
        uid,
        productId: reviewData.productId,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        helpful: 0,
        verified: true, // If user has purchased the product
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(reviewsRef, review);
      return { id: docRef.id, ...review };
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }
};

// Helper function to generate order ID
function generateOrderId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `NGF-${timestamp}-${randomStr}`.toUpperCase();
}

// Export all services
export default {
  userService,
  orderService,
  cartService,
  favoritesService,
  reviewService
};
