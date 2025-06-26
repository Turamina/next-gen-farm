import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Header from './Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import About from './pages/About';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import PaymentCanceled from './pages/PaymentCanceled';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Import admin account utilities for console access
import './utils/createAdminAccount';

// Add debug functions for console testing
window.debugProducts = async function() {
  console.log('🔍 Starting product diagnostics...');
  
  try {
    // Test 1: Check ProductService
    console.log('\n📡 Test 1: ProductService fetch');
    const { productService } = await import('./services/productService');
    const products = await productService.getAllProducts();
    console.log(`📦 ProductService returned: ${products.length} products`);
    
    // Test 2: Direct Firestore access
    console.log('\n📡 Test 2: Direct Firestore access');
    const { db } = await import('./firebaseConfig');
    const { collection, getDocs } = await import('firebase/firestore');
    
    const directQuery = await getDocs(collection(db, 'products'));
    console.log(`📊 Direct query returned: ${directQuery.size} documents`);
    
    directQuery.forEach((doc) => {
      console.log(`📄 ${doc.id}:`, doc.data());
    });
    
    // Test 3: Check current user
    console.log('\n👤 Test 3: Current user status');
    const { auth } = await import('./firebaseConfig');
    console.log('Current user:', auth.currentUser);
    
    return {
      productServiceCount: products.length,
      directQueryCount: directQuery.size,
      currentUser: auth.currentUser?.email || 'Not signed in'
    };
  } catch (error) {
    console.error('❌ Debug error:', error);
    return { error: error.message };
  }
};

// Add debug function for orders
window.debugOrders = async function(userId) {
  console.log('🔍 Starting orders diagnostics...');
  
  try {
    const uid = userId || (await import('./firebaseConfig')).auth.currentUser?.uid;
    
    if (!uid) {
      console.error('❌ No user ID provided and no user logged in');
      return { error: 'No user ID provided and no user logged in' };
    }
    
    console.log(`👤 Testing orders for user: ${uid}`);
    
    // Test 1: Use order service to fetch orders
    console.log('\n📡 Test 1: OrderService fetch');
    const { orderService } = await import('./services/userService');
    const orders = await orderService.getUserOrders(uid);
    console.log(`📦 OrderService returned: ${orders.length} orders`);
    console.log('Orders:', orders);
    
    // Test 2: Direct Firestore access
    console.log('\n📡 Test 2: Direct Firestore access');
    const { db } = await import('./firebaseConfig');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('uid', '==', uid));
    const directQuery = await getDocs(q);
    
    console.log(`📊 Direct query returned: ${directQuery.size} documents`);
    
    const orderData = [];
    directQuery.forEach((doc) => {
      const data = doc.data();
      orderData.push({
        id: doc.id,
        orderId: data.orderId,
        createdAt: data.createdAt,
        items: data.items?.length || 0,
        totalAmount: data.totalAmount
      });
    });
    
    console.log('Order data:', orderData);
    
    return {
      orderServiceCount: orders.length,
      directQueryCount: directQuery.size,
      orders: orderData
    };
  } catch (error) {
    console.error('❌ Debug error:', error);
    return { error: error.message };
  }
};

// Add debug function for featured products
window.debugFeaturedProducts = async function() {
  console.log('🔍 Starting featured products diagnostics...');
  
  try {
    // Test 1: Check ProductService getFeaturedProducts
    console.log('\n📡 Test 1: ProductService featured products');
    const { productService } = await import('./services/productService');
    const featuredProducts = await productService.getFeaturedProducts(3);
    console.log(`📦 ProductService returned: ${featuredProducts.length} featured products`);
    console.log('Featured products:', featuredProducts);
    
    // Test 2: Check which products have sales data
    console.log('\n📡 Test 2: Checking products with sales data');
    const allProducts = await productService.getAllProducts();
    const productsWithSales = allProducts.filter(p => p.sales !== undefined);
    console.log(`📊 Found ${productsWithSales.length} products with sales data out of ${allProducts.length} total`);
    
    // Test 3: Direct Firestore access for featured products
    console.log('\n📡 Test 3: Direct Firestore access for products with sales data');
    const { db } = await import('./firebaseConfig');
    const { collection, getDocs } = await import('firebase/firestore');
    
    const productsRef = collection(db, 'products');
    const querySnapshot = await getDocs(productsRef);
    
    const salesProducts = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.sales !== undefined && data.isActive === true) {
        salesProducts.push({
          id: doc.id,
          name: data.name,
          sales: data.sales,
          isActive: data.isActive
        });
      }
    });
    
    console.log(`📊 Found ${salesProducts.length} active products with sales data in Firestore`);
    console.log('Products with sales data:', salesProducts);
    
    return {
      featuredCount: featuredProducts.length,
      featuredProducts: featuredProducts,
      productsWithSalesCount: productsWithSales.length,
      salesProductsFromFirestore: salesProducts.length
    };
  } catch (error) {
    console.error('❌ Debug error:', error);
    return { error: error.message };
  }
};

// Add debug function for cart
window.debugCart = async function(userId) {
  console.log('🔍 Starting cart diagnostics...');
  
  try {
    const uid = userId || (await import('./firebaseConfig')).auth.currentUser?.uid;
    
    if (!uid) {
      console.error('❌ No user ID provided and no user logged in');
      return { error: 'No user ID provided and no user logged in' };
    }
    
    console.log(`👤 Testing cart for user: ${uid}`);
    
    // Test 1: Use cart service to fetch cart items
    console.log('\n📡 Test 1: CartService fetch');
    const { cartService } = await import('./services/userService');
    const cartItems = await cartService.getUserCart(uid);
    console.log(`📦 CartService returned: ${cartItems.length} cart items`);
    console.log('Cart items:', cartItems);
    
    // Test 2: Direct Firestore access for cart items
    console.log('\n📡 Test 2: Direct Firestore access');
    const { db } = await import('./firebaseConfig');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    const cartsRef = collection(db, 'carts');
    const q = query(cartsRef, where('uid', '==', uid));
    const directQuery = await getDocs(q);
    
    console.log(`📊 Direct query returned: ${directQuery.size} documents`);
    
    const cartData = [];
    directQuery.forEach((doc) => {
      const data = doc.data();
      cartData.push({
        id: doc.id,
        productId: data.productId,
        productName: data.productName,
        productImage: data.productImage,
        price: data.price,
        quantity: data.quantity
      });
    });
    
    console.log('Cart data from Firestore:', cartData);
    
    return {
      cartServiceCount: cartItems.length,
      directQueryCount: directQuery.size,
      cartItems: cartData
    };
  } catch (error) {
    console.error('❌ Debug error:', error);
    return { error: error.message };
  }
};

// Add debug function for currency check
window.debugCurrency = function() {
  console.log('🔍 Checking currency symbols in the app...');
  
  try {
    // Test 1: Check all the price elements in the DOM
    const priceElements = document.querySelectorAll('.product-price, .cart-item-price, .order-total, .cart-total, .total-amount');
    console.log(`📊 Found ${priceElements.length} price elements in the current view`);
    
    // Count currency symbols
    let takaCount = 0;
    let rupeeCount = 0;
    let dollarCount = 0;
    let otherCount = 0;
    
    priceElements.forEach((element, index) => {
      const text = element.textContent;
      console.log(`Element ${index}: ${text}`);
      
      if (text.includes('৳')) takaCount++;
      if (text.includes('₹')) rupeeCount++;
      if (text.includes('$')) dollarCount++;
      if (!text.includes('৳') && !text.includes('₹') && !text.includes('$')) otherCount++;
    });
    
    console.log('💰 Currency symbol count:', {
      'Taka (৳)': takaCount,
      'Rupee (₹)': rupeeCount,
      'Dollar ($)': dollarCount,
      'Other/None': otherCount
    });
    
    return {
      elementsChecked: priceElements.length,
      currencyCount: {
        taka: takaCount,
        rupee: rupeeCount,
        dollar: dollarCount,
        other: otherCount
      }
    };
  } catch (error) {
    console.error('❌ Debug error:', error);
    return { error: error.message };
  }
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="app-main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-failed" element={<PaymentFailed />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
            </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
