// Product Service for fetching products from Firestore
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query,
  orderBy,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Product Service - Handles product-related database operations for the frontend
 */

class ProductService {
  constructor() {
    this.productsCollection = 'products';
  }
  /**
   * Get all active products from the database
   * @returns {Promise<Array>} Array of products
   */  async getAllProducts() {
    try {
      console.log('🔍 ProductService: Fetching products from Firestore...');
      
      // TEMPORARY: Simplified query to avoid index requirement
      // TODO: Create Firestore index for isActive + createdAt, then use full query
      const q = query(
        collection(db, this.productsCollection),
        where('isActive', '==', true)
        // orderBy('createdAt', 'desc') - Commented out until index is created
      );
      
      console.log('📡 ProductService: Executing query...');
      const querySnapshot = await getDocs(q);
      console.log(`📊 ProductService: Query returned ${querySnapshot.size} documents`);
      
      const products = [];
      
      querySnapshot.forEach((doc) => {
        const productData = {
          id: doc.id,
          ...doc.data()
        };
        console.log(`📦 ProductService: Processing product - ${productData.name}`);
        products.push(productData);      });

      // TEMPORARY: Client-side sorting until Firestore index is created
      products.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return dateB - dateA; // Descending order (newest first)
      });

      console.log(`✅ ProductService: Successfully fetched ${products.length} products`);
      return products;
    } catch (error) {
      console.error('❌ ProductService: Error getting products:', error);
      console.error('🔧 ProductService: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Check if it's a permissions error
      if (error.code === 'permission-denied') {
        console.error('🚨 ProductService: PERMISSION DENIED - Check Firestore security rules');
        console.error('💡 ProductService: Products collection needs read permissions');
      }
      
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  /**
   * Get a single product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object|null>} Product object or null if not found
   */
  async getProductById(productId) {
    try {
      const productDoc = await getDoc(doc(db, this.productsCollection, productId));
      
      if (productDoc.exists()) {
        return {
          id: productDoc.id,
          ...productDoc.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting product by ID:', error);
      return null;
    }
  }
  /**
   * Get featured products (limit to specified number)
   * @param {number} limitCount - Number of products to fetch
   * @returns {Promise<Array>} Array of featured products
   */
  async getFeaturedProducts(limitCount = 6) {
    try {
      console.log('🔍 ProductService: Fetching featured products...');
      
      // TEMPORARY: Simplified query to avoid index requirement
      // Similar to getAllProducts, we avoid using orderBy to prevent index issues
      const q = query(
        collection(db, this.productsCollection),
        where('isActive', '==', true)
        // orderBy('sales', 'desc') - Removed to avoid index requirement
      );
      
      console.log('📡 ProductService: Executing featured products query...');
      const querySnapshot = await getDocs(q);
      console.log(`📊 ProductService: Featured query returned ${querySnapshot.size} documents`);
      
      let products = [];
      
      querySnapshot.forEach((doc) => {
        const productData = {
          id: doc.id,
          ...doc.data()
        };
        // Only include products that have a sales field (featured products)
        if (productData.sales !== undefined) {
          products.push(productData);
        }
      });
      
      // TEMPORARY: Client-side sorting by sales (descending)
      products.sort((a, b) => {
        // Default to 0 if sales is undefined
        const salesA = a.sales || 0;
        const salesB = b.sales || 0;
        return salesB - salesA; // Descending order (highest sales first)
      });
      
      // Limit to the requested number of products
      products = products.slice(0, limitCount);
      
      console.log(`✅ ProductService: Successfully fetched ${products.length} featured products`);
      return products;
    } catch (error) {
      console.error('❌ ProductService: Error getting featured products:', error);
      console.error('🔧 Error details:', error);
      
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Get products by category
   * @param {string} category - Product category
   * @returns {Promise<Array>} Array of products in the category
   */
  async getProductsByCategory(category) {
    try {
      const q = query(
        collection(db, this.productsCollection),
        where('isActive', '==', true),
        where('category', '==', category),
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
      console.error('Error getting products by category:', error);
      return [];
    }
  }

  /**
   * Search products by name or description
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching products
   */
  async searchProducts(searchTerm) {
    try {
      // Note: This is a basic implementation. For better search,
      // consider using Algolia or Elasticsearch
      const querySnapshot = await getDocs(collection(db, this.productsCollection));
      const products = [];
      
      querySnapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() };
        
        // Check if product is active and matches search term
        if (product.isActive && 
            (product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             product.description?.toLowerCase().includes(searchTerm.toLowerCase()))) {
          products.push(product);
        }
      });

      return products;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
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
        where('isActive', '==', true),
        where('stock', '<=', threshold)
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
      console.error('Error getting low stock products:', error);
      return [];
    }
  }
}

// Create and export a singleton instance
export const productService = new ProductService();
export default productService;
