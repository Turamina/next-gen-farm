import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import LoadingSpinner from '../components/LoadingSpinner';
import './Admin.css';

const Admin = () => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
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

  // Cattle Management State
  const [cattle, setCattle] = useState([]);
  const [showAddCattle, setShowAddCattle] = useState(false);
  const [cattleForm, setCattleForm] = useState({
    type: 'dairy',
    weight: '',
    age: '',
    description: ''
  });
  const [cattleLoading, setCattleLoading] = useState(false);

  // Check admin access on component mount
  useEffect(() => {
    checkAdminAccess();
  }, [currentUser, userProfile, authLoading]);  const checkAdminAccess = async () => {
    console.log('🔍 Checking admin access for user:', currentUser?.uid);
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
      loadOrders(),
      loadCattle()
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
  const loadCattle = async () => {
    try {
      setCattleLoading(true);
      const cattleData = await adminService.getUserCattle(currentUser.uid);
      setCattle(cattleData);
    } catch (error) {
      console.error('Error loading cattle:', error);
      showMessage('Failed to load cattle', 'error');
    } finally {
      setCattleLoading(false);
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

  const handleCattleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!cattleForm.type || !cattleForm.weight || !cattleForm.age) {
      showMessage('Please fill all required fields', 'error');
      return;
    }

    if (parseFloat(cattleForm.weight) <= 0 || parseFloat(cattleForm.age) < 0) {
      showMessage('Please enter valid weight and age values', 'error');
      return;
    }

    setCattleLoading(true);
    try {
      const newCattle = {
        type: cattleForm.type.trim(),
        weight: parseFloat(cattleForm.weight),
        age: parseFloat(cattleForm.age),
        description: cattleForm.description.trim() || '',
        createdAt: new Date().toISOString()
      };

      await adminService.addCattle(currentUser.uid, newCattle);
      
      // Reset form and reload cattle
      setCattleForm({
        type: 'dairy',
        weight: '',
        age: '',
        description: ''
      });
      setShowAddCattle(false);
      await loadCattle();
      
      showMessage('Cattle added successfully!', 'success');
    } catch (error) {
      console.error('Error adding cattle:', error);
      showMessage('Failed to add cattle', 'error');
    } finally {
      setCattleLoading(false);
    }
  };

  const handleDeleteCattle = async (cattleId) => {
    if (!window.confirm('Are you sure you want to delete this cattle record?')) {
      return;
    }

    try {
      await adminService.deleteCattle(cattleId);
      await loadCattle();
      showMessage('Cattle record deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting cattle:', error);
      showMessage('Failed to delete cattle record', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 4000);
  };
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    try {
      if (timestamp.toDate) {
        // Firebase Timestamp
        date = timestamp.toDate();
      } else if (typeof timestamp === 'string') {
        // ISO string
        date = new Date(timestamp);
      } else if (typeof timestamp === 'object') {
        // JavaScript Date object
        date = new Date(timestamp);
      } else {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error formatting date';
    }
  };
  const formatCurrency = (amount) => {
    return `৳${parseFloat(amount).toFixed(2)}`;
  };

  if (loading || authLoading) {
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
        <button 
          className={`tab-button ${activeTab === 'cattle' ? 'active' : ''}`}
          onClick={() => setActiveTab('cattle')}
        >
          🐄 Cattle ({cattle.length})
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
                      <p><strong>Customer:</strong> {order.deliveryAddress?.name || 'N/A'}</p>
                      <p><strong>Contact:</strong> {order.deliveryAddress?.phone || 'N/A'}</p>
                      <p><strong>Address:</strong> {order.deliveryAddress?.street}, {order.deliveryAddress?.city}</p>
                      <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
                    </div>

                    <div className="order-items">
                      <h4>Order Items:</h4>
                      {order.items?.map((item, index) => (
                        <div key={index} className="order-item">
                          <span>{item.productName} x {item.quantity}</span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="order-summary">
                        <div className="summary-item">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(order.subtotal || 0)}</span>
                        </div>
                        {order.shipping > 0 && (
                          <div className="summary-item">
                            <span>Shipping:</span>
                            <span>{formatCurrency(order.shipping)}</span>
                          </div>
                        )}
                        {order.tax > 0 && (
                          <div className="summary-item">
                            <span>Tax:</span>
                            <span>{formatCurrency(order.tax)}</span>
                          </div>
                        )}
                        <div className="summary-item total">
                          <strong>Total:</strong>
                          <strong>{formatCurrency(order.totalAmount)}</strong>
                        </div>
                      </div>
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

        {activeTab === 'cattle' && (
          <>
            <div className="section-header">
              <h2>Cattle Management</h2>
              <button 
                className="add-product-btn"
                onClick={() => setShowAddCattle(!showAddCattle)}
              >
                {showAddCattle ? '✖ Cancel' : '➕ Add Cattle'}
              </button>
            </div>

            {showAddCattle && (
              <div className="add-product-form">
                <h3>Add New Cattle</h3>
                <form onSubmit={handleCattleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="type">Cattle Type *</label>
                      <select
                        id="type"
                        name="type"
                        value={cattleForm.type}
                        onChange={(e) => setCattleForm({...cattleForm, type: e.target.value})}
                      >
                        <option value="dairy">Dairy</option>
                        <option value="beef">Beef</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="weight">Weight (kg) *</label>
                      <input
                        type="number"
                        id="weight"
                        name="weight"
                        value={cattleForm.weight}
                        onChange={(e) => setCattleForm({...cattleForm, weight: e.target.value})}
                        placeholder="Enter weight in kg"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="age">Age (years) *</label>
                      <input
                        type="number"
                        id="age"
                        name="age"
                        value={cattleForm.age}
                        onChange={(e) => setCattleForm({...cattleForm, age: e.target.value})}
                        placeholder="Enter age in years"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="description">Description</label>
                      <input
                        type="text"
                        id="description"
                        name="description"
                        value={cattleForm.description}
                        onChange={(e) => setCattleForm({...cattleForm, description: e.target.value})}
                        placeholder="Enter description (optional)"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={cattleLoading}
                  >
                    {cattleLoading ? 'Adding...' : 'Add Cattle'}
                  </button>
                </form>
              </div>
            )}

            {cattle.length === 0 ? (
              <div className="empty-state">
                <h3>No cattle records found</h3>
                <p>Add your first cattle record to get started with cattle management.</p>
              </div>
            ) : (
              <div className="cattle-grid">
                {cattle.map((animal) => (
                  <div key={animal.id} className="admin-cattle-card">
                    <div className="cattle-info">
                      <div className="cattle-header">
                        <h3>{animal.type.charAt(0).toUpperCase() + animal.type.slice(1)} Cattle</h3>
                        <span className="cattle-daily-food">
                          {animal.dailyFoodRequirement} kg/day
                        </span>
                      </div>
                      <div className="cattle-details">
                        <div className="cattle-detail">
                          <span className="detail-label">Weight:</span>
                          <span className="detail-value">{animal.weight} kg</span>
                        </div>
                        <div className="cattle-detail">
                          <span className="detail-label">Age:</span>
                          <span className="detail-value">{animal.age} years</span>
                        </div>
                        {animal.description && (
                          <div className="cattle-description">
                            {animal.description}
                          </div>
                        )}
                        <div className="cattle-detail">
                          <span className="detail-label">Added:</span>
                          <span className="detail-value">
                            {formatDate(animal.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="product-actions">
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteCattle(animal.id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
