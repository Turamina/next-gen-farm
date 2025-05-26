import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import LoadingSpinner from '../components/LoadingSpinner';
import './Admin.css';

const Admin = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Product Management State
  const [products, setProducts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    image: '',
    price: '',
    stock: '',
    tagline: ''
  });
  const [productLoading, setProductLoading] = useState(false);

  // Order Management State
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);

  // Check admin access on component mount
  useEffect(() => {
    checkAdminAccess();
  }, [currentUser, userProfile]);  const checkAdminAccess = async () => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    // Check if user is admin - only use database verification
    const isAdmin = userProfile?.isAdmin === true;

    if (!isAdmin) {
      navigate('/');
      return;
    }

    setLoading(false);
    loadInitialData();
  };

  const loadInitialData = async () => {
    await Promise.all([
      loadProducts(),
      loadOrders()
    ]);
  };

  const loadProducts = async () => {
    try {
      const productsData = await adminService.getAllProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      showMessage('Failed to load products', 'error');
    }
  };

  const loadOrders = async () => {
    try {
      const ordersData = await adminService.getAllOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      showMessage('Failed to load orders', 'error');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!productForm.name || !productForm.image || !productForm.price || !productForm.stock || !productForm.tagline) {
      showMessage('Please fill all fields', 'error');
      return;
    }

    if (productForm.tagline.length > 35) {
      showMessage('Tagline must be 35 characters or less', 'error');
      return;
    }

    if (parseFloat(productForm.price) <= 0 || parseInt(productForm.stock) < 0) {
      showMessage('Please enter valid price and stock values', 'error');
      return;
    }

    setProductLoading(true);
    try {
      const newProduct = {
        name: productForm.name.trim(),
        image: productForm.image.trim(),
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        description: productForm.tagline.trim(),
        category: 'fresh-produce',
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString()
      };

      await adminService.addProduct(newProduct);
      
      // Reset form and reload products
      setProductForm({
        name: '',
        image: '',
        price: '',
        stock: '',
        tagline: ''
      });
      setShowAddProduct(false);
      await loadProducts();
      
      showMessage('Product added successfully!', 'success');
    } catch (error) {
      console.error('Error adding product:', error);
      showMessage('Failed to add product', 'error');
    } finally {
      setProductLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setOrderLoading(true);
    try {
      await adminService.cancelOrder(orderId);
      await loadOrders();
      showMessage('Order cancelled successfully!', 'success');
    } catch (error) {
      console.error('Error cancelling order:', error);
      showMessage('Failed to cancel order', 'error');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await adminService.deleteProduct(productId);
      await loadProducts();
      showMessage('Product deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      showMessage('Failed to delete product', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 4000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  const formatCurrency = (amount) => {
    return `৳${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage products and orders for Next Gen Farm</p>
      </div>

      {message && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Products ({products.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Orders ({orders.length})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'products' && (
          <div className="products-section">
            <div className="section-header">
              <h2>Product Management</h2>
              <button 
                className="add-product-btn"
                onClick={() => setShowAddProduct(!showAddProduct)}
              >
                {showAddProduct ? '❌ Cancel' : '➕ Add Product'}
              </button>
            </div>

            {showAddProduct && (
              <div className="add-product-form">
                <h3>Add New Product</h3>
                <form onSubmit={handleProductSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="productName">Product Name *</label>
                      <input
                        type="text"
                        id="productName"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        placeholder="e.g., Organic Tomatoes"
                        maxLength={50}
                        required
                      />
                    </div>                    <div className="form-group">
                      <label htmlFor="productPrice">Price (৳) *</label>
                      <input
                        type="number"
                        id="productPrice"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="productStock">Stock Quantity *</label>
                      <input
                        type="number"
                        id="productStock"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="productImage">Image URL *</label>
                      <input
                        type="url"
                        id="productImage"
                        value={productForm.image}
                        onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="productTagline">
                      Tagline ({productForm.tagline.length}/35) *
                    </label>
                    <input
                      type="text"
                      id="productTagline"
                      value={productForm.tagline}
                      onChange={(e) => setProductForm({...productForm, tagline: e.target.value})}
                      placeholder="Fresh, organic, and delicious"
                      maxLength={35}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={productLoading}
                  >
                    {productLoading ? 'Adding...' : 'Add Product'}
                  </button>
                </form>
              </div>
            )}

            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="admin-product-card">
                  <div className="product-image">
                    <img src={product.image} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-tagline">{product.description}</p>
                    <div className="product-details">
                      <span className="price">{formatCurrency(product.price)}</span>
                      <span className="stock">Stock: {product.stock}</span>
                    </div>
                    <div className="product-actions">
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="empty-state">
                <p>No products found. Add your first product!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="section-header">
              <h2>Order Management</h2>
              <button 
                className="refresh-btn"
                onClick={loadOrders}
                disabled={orderLoading}
              >
                {orderLoading ? '🔄 Loading...' : '🔄 Refresh'}
              </button>
            </div>

            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="admin-order-card">
                  <div className="order-header">
                    <div className="order-id">
                      <strong>Order #{order.orderId || order.id}</strong>
                    </div>
                    <div className={`order-status ${order.status}`}>
                      {order.status?.toUpperCase()}
                    </div>
                  </div>

                  <div className="order-details">
                    <div className="order-info">
                      <p><strong>Customer:</strong> {order.customerName || 'N/A'}</p>
                      <p><strong>Email:</strong> {order.customerEmail || 'N/A'}</p>
                      <p><strong>Total:</strong> {formatCurrency(order.totalAmount)}</p>
                      <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
                    </div>

                    <div className="order-items">
                      <h4>Items:</h4>
                      {order.items?.map((item, index) => (
                        <div key={index} className="order-item">
                          <span>{item.productName} x {item.quantity}</span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="order-actions">
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button 
                        className="cancel-order-btn"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={orderLoading}
                      >
                        ❌ Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {orders.length === 0 && (
              <div className="empty-state">
                <p>No orders found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
