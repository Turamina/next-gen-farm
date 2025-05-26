// Debug script to test product fetching
import { productService } from './services/productService.js';

// Add this function to test product fetching
window.testProductFetch = async function() {
  console.log('🔍 Testing product fetch...');
  
  try {
    console.log('📡 Attempting to fetch products...');
    const products = await productService.getAllProducts();
    
    console.log('✅ Products fetched successfully:');
    console.log(`📦 Total products: ${products.length}`);
    console.log('🔍 Product details:', products);
    
    if (products.length === 0) {
      console.log('⚠️ No products found in database');
      console.log('🔧 Check if:');
      console.log('  - Products were added through admin');
      console.log('  - Products have isActive: true');
      console.log('  - Firestore rules allow read access');
    }
    
    return products;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    console.log('🔧 Possible issues:');
    console.log('  - Firestore security rules deny access');
    console.log('  - Network connectivity issues');
    console.log('  - Firebase configuration problems');
    console.log('  - Collection name mismatch');
    
    return null;
  }
};

// Add function to check Firestore connection
window.testFirestoreConnection = async function() {
  console.log('🔍 Testing Firestore connection...');
  
  try {
    const { db } = await import('./firebaseConfig.js');
    const { collection, getDocs } = await import('firebase/firestore');
    
    console.log('📡 Testing basic Firestore access...');
    const testQuery = await getDocs(collection(db, 'products'));
    
    console.log('✅ Firestore connection successful');
    console.log(`📊 Raw query size: ${testQuery.size}`);
    
    testQuery.forEach((doc) => {
      console.log(`📄 Document ID: ${doc.id}`);
      console.log(`📄 Document data:`, doc.data());
    });
    
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    console.log('🔧 Check:');
    console.log('  - Firebase configuration');
    console.log('  - Internet connection');
    console.log('  - Firestore security rules');
    
    return false;
  }
};

console.log('🔧 Debug functions available:');
console.log('  - testProductFetch()');
console.log('  - testFirestoreConnection()');
