import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  where,
  getDoc,
  writeBatch,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Admin Service - Handles all admin-related database operations
 * This service provides functionality for product management, order management,
 * user management, and administrative tasks.
 */

class AdminService {
  constructor() {
    this.productsCollection = 'products';
    this.ordersCollection = 'orders';
    this.usersCollection = 'users';
    this.adminLogsCollection = 'adminLogs';
    this.cattleCollection = 'cattle';
  }

  // ==================== PRODUCT MANAGEMENT ====================

  /**
   * Add a new product to the database
   * @param {Object} productData - Product information
   * @returns {Promise<string>} Product ID
   */
  async addProduct(productData) {
    try {
      const product = {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        sales: 0,
        rating: 0,
        reviews: []
      };

      const docRef = await addDoc(collection(db, this.productsCollection), product);
      
      // Log admin action
      await this.logAdminAction('add_product', {
        productId: docRef.id,
        productName: productData.name
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding product:', error);
      throw new Error('Failed to add product');
    }
  }

  /**
   * Get all products from the database
   * @returns {Promise<Array>} Array of products
   */
  async getAllProducts() {
    try {
      const q = query(
        collection(db, this.productsCollection),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const products = [];
      
      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  /**
   * Delete a product from the database
   * @param {string} productId - Product ID to delete
   */
  async deleteProduct(productId) {
    try {
      // Get product details before deletion for logging
      const productDoc = await getDoc(doc(db, this.productsCollection, productId));
      const productData = productDoc.data();

      await deleteDoc(doc(db, this.productsCollection, productId));
      
      // Log admin action
      await this.logAdminAction('delete_product', {
        productId,
        productName: productData?.name || 'Unknown'
      });

    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }

  /**
   * Update product information
   * @param {string} productId - Product ID to update
   * @param {Object} updateData - Data to update
   */
  async updateProduct(productId, updateData) {
    try {
      const productRef = doc(db, this.productsCollection, productId);
      await updateDoc(productRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      // Log admin action
      await this.logAdminAction('update_product', {
        productId,
        updateFields: Object.keys(updateData)
      });

    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Failed to update product');
    }
  }

  /**
   * Update product stock
   * @param {string} productId - Product ID
   * @param {number} newStock - New stock quantity
   */
  async updateProductStock(productId, newStock) {
    try {
      const productRef = doc(db, this.productsCollection, productId);
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: serverTimestamp()
      });

      await this.logAdminAction('update_stock', {
        productId,
        newStock
      });

    } catch (error) {
      console.error('Error updating product stock:', error);
      throw new Error('Failed to update product stock');
    }
  }

  // ==================== ORDER MANAGEMENT ====================

  /**
   * Get all orders from the database
   * @returns {Promise<Array>} Array of orders
   */
  async getAllOrders() {
    try {
      const ordersRef = collection(db, this.ordersCollection);
      const ordersSnapshot = await getDocs(ordersRef);
      
      const orders = [];
      for (const doc of ordersSnapshot.docs) {
        const orderData = doc.data();
        
        // Calculate totals if not present
        if (!orderData.subtotal || !orderData.totalAmount) {
          let subtotal = 0;
          orderData.items?.forEach(item => {
            subtotal += (item.price * item.quantity);
          });
          
          orderData.subtotal = subtotal;
          orderData.tax = subtotal * 0.05; // 5% tax
          orderData.shipping = subtotal > 500 ? 0 : 60; // Free shipping over ৳500
          orderData.totalAmount = subtotal + orderData.tax + orderData.shipping;
        }

        orders.push({
          id: doc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate() || new Date(),
          updatedAt: orderData.updatedAt?.toDate() || new Date()
        });
      }

      // Sort orders by creation date, newest first
      orders.sort((a, b) => b.createdAt - a.createdAt);
      
      return orders;
    } catch (error) {
      console.error('Error getting all orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  /**
   * Get orders by status
   * @param {string} status - Order status (pending, confirmed, shipped, delivered, cancelled)
   * @returns {Promise<Array} Array of orders
   */
  async getOrdersByStatus(status) {
    try {
      const q = query(
        collection(db, this.ordersCollection),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return orders;
    } catch (error) {
      console.error('Error getting orders by status:', error);
      throw new Error('Failed to fetch orders by status');
    }
  }

  /**
   * Cancel an order
   * @param {string} orderId - Order ID to cancel
   */
  async cancelOrder(orderId) {
    try {
      // Get order details before cancellation
      const orderDoc = await getDoc(doc(db, this.ordersCollection, orderId));
      const orderData = orderDoc.data();

      if (!orderData) {
        throw new Error('Order not found');
      }

      if (orderData.status === 'cancelled') {
        throw new Error('Order is already cancelled');
      }

      if (orderData.status === 'delivered') {
        throw new Error('Cannot cancel delivered order');
      }

      // Update order status
      const orderRef = doc(db, this.ordersCollection, orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'admin',
        updatedAt: serverTimestamp()
      });

      // If order was confirmed, restore product stock
      if (orderData.status === 'confirmed' || orderData.status === 'shipped') {
        await this.restoreProductStock(orderData.items);
      }

      // Log admin action
      await this.logAdminAction('cancel_order', {
        orderId,
        customerId: orderData.userId,
        orderTotal: orderData.total
      });

    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error('Failed to cancel order');
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   */
  async updateOrderStatus(orderId, newStatus) {
    try {
      const orderRef = doc(db, this.ordersCollection, orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      await this.logAdminAction('update_order_status', {
        orderId,
        newStatus
      });

    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Restore product stock when order is cancelled
   * @param {Array} orderItems - Items from cancelled order
   */
  async restoreProductStock(orderItems) {
    try {
      const batch = writeBatch(db);

      for (const item of orderItems) {
        const productRef = doc(db, this.productsCollection, item.productId);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          const currentStock = productDoc.data().stock || 0;
          batch.update(productRef, {
            stock: currentStock + item.quantity,
            updatedAt: serverTimestamp()
          });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error restoring product stock:', error);
    }
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Get all users (for admin dashboard)
   * @returns {Promise<Array>} Array of users
   */
  async getAllUsers() {
    try {
      const q = query(
        collection(db, this.usersCollection),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // Remove sensitive information
        delete userData.paymentMethods;
        delete userData.addresses;
        
        users.push({
          id: doc.id,
          ...userData
        });
      });

      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStatistics() {
    try {
      const usersSnapshot = await getDocs(collection(db, this.usersCollection));
      const ordersSnapshot = await getDocs(collection(db, this.ordersCollection));
      const productsSnapshot = await getDocs(collection(db, this.productsCollection));

      let totalRevenue = 0;
      let completedOrders = 0;
      let pendingOrders = 0;

      ordersSnapshot.forEach((doc) => {
        const order = doc.data();
        if (order.status === 'delivered') {
          totalRevenue += order.total || 0;
          completedOrders++;
        } else if (order.status === 'pending' || order.status === 'confirmed') {
          pendingOrders++;
        }
      });

      return {
        totalUsers: usersSnapshot.size,
        totalProducts: productsSnapshot.size,
        totalOrders: ordersSnapshot.size,
        completedOrders,
        pendingOrders,
        totalRevenue,
        averageOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw new Error('Failed to fetch statistics');
    }
  }

  // ==================== ADMIN LOGGING ====================

  /**
   * Log admin actions for audit trail
   * @param {string} action - Action performed
   * @param {Object} details - Action details
   * @param {string} adminId - Admin user ID
   */
  async logAdminAction(action, details, adminId = 'system') {
    try {
      await addDoc(collection(db, this.adminLogsCollection), {
        action,
        details,
        adminId,
        timestamp: serverTimestamp(),
        ip: 'unknown' // You can implement IP tracking if needed
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get admin action logs
   * @param {number} limitCount - Number of logs to fetch
   * @returns {Promise<Array>} Array of admin logs
   */
  async getAdminLogs(limitCount = 50) {
    try {
      const q = query(
        collection(db, this.adminLogsCollection),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const logs = [];
      
      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return logs;
    } catch (error) {
      console.error('Error getting admin logs:', error);
      throw new Error('Failed to fetch admin logs');
    }
  }

  // ==================== DASHBOARD DATA ====================

  /**
   * Get dashboard data for admin overview
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData() {
    try {
      const [statistics, recentOrders, recentLogs] = await Promise.all([
        this.getUserStatistics(),
        this.getOrdersByStatus('pending'),
        this.getAdminLogs(10)
      ]);

      return {
        statistics,
        recentOrders: recentOrders.slice(0, 5),
        recentLogs,
        lowStockProducts: await this.getLowStockProducts()
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Failed to fetch dashboard data');
    }
  }

  /**
   * Get products with low stock
   * @param {number} threshold - Stock threshold (default: 10)
   * @returns {Promise<Array>} Array of low stock products
   */
  async getLowStockProducts(threshold = 10) {
    try {
      const q = query(
        collection(db, this.productsCollection),
        where('stock', '<=', threshold),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const lowStockProducts = [];
      
      querySnapshot.forEach((doc) => {
        lowStockProducts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return lowStockProducts;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      return [];
    }
  }

  // ==================== CATTLE MANAGEMENT ====================

  /**
   * Add cattle to user's farm
   * @param {string} userId - User ID
   * @param {Object} cattleData - Cattle information
   * @returns {Promise<string>} Cattle ID
   */
  async addCattle(userId, cattleData) {
    try {
      const cattle = {
        userId,
        ...cattleData,
        dailyFoodRequirement: cattleData.dailyFoodRequirement || this.calculateFoodRequirement(cattleData),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.cattleCollection), cattle);
      
      // Update user's cattle statistics
      const { cattleService } = await import('./userService');
      await cattleService.updateCattleStats(userId);
      
      await this.logAdminAction('add_cattle', {
        userId,
        cattleId: docRef.id,
        cattleData: cattle
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding cattle:', error);
      throw new Error('Failed to add cattle');
    }
  }

  /**
   * Get all cattle for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of cattle
   */
  async getUserCattle(userId) {
    try {
      const q = query(
        collection(db, this.cattleCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const cattle = [];
      
      querySnapshot.forEach((doc) => {
        cattle.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return cattle;
    } catch (error) {
      console.error('Error getting user cattle:', error);
      throw new Error('Failed to fetch cattle');
    }
  }

  /**
   * Update cattle information
   * @param {string} cattleId - Cattle ID
   * @param {Object} updateData - Data to update
   */
  async updateCattle(cattleId, updateData) {
    try {
      const cattleRef = doc(db, this.cattleCollection, cattleId);
      const cattleDoc = await getDoc(cattleRef);
      
      if (!cattleDoc.exists()) {
        throw new Error('Cattle not found');
      }

      const cattleData = cattleDoc.data();
      const userId = cattleData.userId;

      await updateDoc(cattleRef, {
        ...updateData,
        dailyFoodRequirement: updateData.weight ? this.calculateFoodRequirement({...cattleData, ...updateData}) : cattleData.dailyFoodRequirement,
        updatedAt: serverTimestamp()
      });

      // Update user's cattle statistics
      const { cattleService } = await import('./userService');
      await cattleService.updateCattleStats(userId);

      await this.logAdminAction('update_cattle', {
        cattleId,
        userId,
        updateData
      });
    } catch (error) {
      console.error('Error updating cattle:', error);
      throw new Error('Failed to update cattle');
    }
  }

  /**
   * Delete cattle from database
   * @param {string} cattleId - Cattle ID to delete
   */
  async deleteCattle(cattleId) {
    try {
      const cattleRef = doc(db, this.cattleCollection, cattleId);
      const cattleDoc = await getDoc(cattleRef);
      
      if (!cattleDoc.exists()) {
        throw new Error('Cattle not found');
      }

      const userId = cattleDoc.data().userId;
      
      await deleteDoc(cattleRef);

      // Update user's cattle statistics
      const { cattleService } = await import('./userService');
      await cattleService.updateCattleStats(userId);

      await this.logAdminAction('delete_cattle', {
        cattleId,
        userId
      });
    } catch (error) {
      console.error('Error deleting cattle:', error);
      throw new Error('Failed to delete cattle');
    }
  }

  /**
   * Calculate daily food requirement for cattle
   * @param {Object} cattleData - Cattle information including weight, age, type
   * @returns {number} Daily food requirement in kg
   */
  calculateFoodRequirement(cattleData) {
    // Base calculation on cattle weight (approximately 2-3% of body weight per day)
    const baseRequirement = cattleData.weight * 0.025; // 2.5% of body weight

    // Adjust based on age
    let ageMultiplier = 1;
    if (cattleData.age < 1) { // Calves need more food per body weight
      ageMultiplier = 1.2;
    } else if (cattleData.age > 10) { // Older cattle may need less
      ageMultiplier = 0.9;
    }

    // Adjust based on type/purpose
    let typeMultiplier = 1;
    switch(cattleData.type?.toLowerCase()) {
      case 'dairy':
        typeMultiplier = 1.3; // Dairy cows need more food
        break;
      case 'beef':
        typeMultiplier = 1.1;
        break;
      default:
        typeMultiplier = 1;
    }

    return Math.round(baseRequirement * ageMultiplier * typeMultiplier * 10) / 10; // Round to 1 decimal
  }

  /**
   * Get total daily food requirement for all cattle
   * @param {string} userId - User ID
   * @returns {Promise<number>} Total daily food requirement in kg
   */
  async getTotalFoodRequirement(userId) {
    try {
      const cattle = await this.getUserCattle(userId);
      const totalRequirement = cattle.reduce((total, animal) => {
        return total + (animal.dailyFoodRequirement || 0);
      }, 0);
      
      return Math.round(totalRequirement * 10) / 10; // Round to 1 decimal
    } catch (error) {
      console.error('Error calculating total food requirement:', error);
      throw new Error('Failed to calculate total food requirement');
    }
  }
}

// Create and export a singleton instance
export const adminService = new AdminService();
export default adminService;
