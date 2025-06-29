import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { accountService } from '../services/accountService';
import { Link, useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './FarmerDashboard.css';

const FarmerDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    topProduct: null
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add Product State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'dairy',
    stock: '',
    unit: 'kg',
    image: '',
    featured: false,
    specifications: {
      origin: '',
      quality: 'premium',
      organic: false,
      expiryDate: ''
    }
  });

  const categories = [
    { value: 'dairy', label: 'Dairy Products' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'grains', label: 'Grains & Cereals' },
    { value: 'meat', label: 'Meat & Poultry' },
    { value: 'eggs', label: 'Eggs' },
    { value: 'other', label: 'Other' }
  ];

  const units = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'liter', label: 'Liter (L)' },
    { value: 'piece', label: 'Piece' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'pack', label: 'Pack' }
  ];

  useEffect(() => {
    loadFarmerData();
  }, [currentUser]);

  const loadFarmerData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Loading farmer dashboard data...');
      
      const farmerStats = await accountService.getFarmerProductStats(currentUser.uid);
      setStats(farmerStats);
      
      const allProducts = await accountService.getFarmerProducts(currentUser.uid);
      setProducts(allProducts);
      
      console.log('✅ Farmer dashboard data loaded');
      
    } catch (error) {
      console.error('❌ Error loading farmer data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('specifications.')) {
      const specField = name.split('.')[1];
      setProductForm(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specField]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setProductForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageChange = (e) => {
    const url = e.target.value;
    setProductForm(prev => ({ ...prev, image: url }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    console.log('🔥 Form submitted! Current form data:', productForm);
    
    // More detailed validation
    if (!productForm.name || !productForm.name.trim()) {
      console.log('❌ Validation failed: No product name');
      showMessage('Please enter a product name', 'error');
      return;
    }
    
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      console.log('❌ Validation failed: Invalid price');
      showMessage('Please enter a valid price greater than 0', 'error');
      return;
    }
    
    if (!productForm.stock || parseInt(productForm.stock) <= 0) {
      console.log('❌ Validation failed: Invalid stock');
      showMessage('Please enter a valid stock quantity greater than 0', 'error');
      return;
    }
    
    if (!productForm.image || !productForm.image.trim()) {
      console.log('❌ Validation failed: No image URL provided');
      showMessage('Please enter a valid image URL', 'error');
      return;
    }

    console.log('✅ All validations passed, proceeding with submission');
    console.log('🚜 Starting product submission with data:', productForm);
    setProductLoading(true);
    
    try {
      console.log('🔍 Fetching farmer profile...');
      const farmerRef = doc(db, 'farmers', currentUser.uid);
      const farmerSnap = await getDoc(farmerRef);
      if (!farmerSnap.exists()) {
        throw new Error('Farmer profile not found.');
      }
      const farmerData = farmerSnap.data();
      console.log('✅ Farmer profile found:', farmerData.farmName);

      console.log('� Creating product with image URL:', productForm.image);

      const newProduct = {
        name: productForm.name.trim(),
        description: productForm.description?.trim() || '',
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock: parseInt(productForm.stock),
        unit: productForm.unit,
        image: productForm.image.trim(),
        featured: productForm.featured,
        specifications: productForm.specifications,
        farmerId: currentUser.uid,
        farmerEmail: currentUser.email,
        farmerName: farmerData.displayName || `${farmerData.firstName} ${farmerData.lastName}`,
        farmName: farmerData.farmName,
        farmAddress: farmerData.farmAddress || '',
        isActive: true,
        approved: true,
        status: 'active',
        sales: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('💾 Saving product to Firestore:', newProduct);
      const docRef = await addDoc(collection(db, 'products'), newProduct);
      console.log('✅ Product saved successfully with ID:', docRef.id);
      
      showMessage('Product added successfully!', 'success');
      
      setShowAddProduct(false);
      setProductForm({
        name: '', description: '', price: '', category: 'dairy', stock: '',
        unit: 'kg', image: '', featured: false,
        specifications: { origin: '', quality: 'premium', organic: false, expiryDate: '' }
      });
      
      await loadFarmerData();

    } catch (error) {
      console.error('❌ Error adding product:', error);
      showMessage(`Failed to add product: ${error.message}`, 'error');
    } finally {
      setProductLoading(false);
    }
  };
  
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div className="farmer-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {userProfile?.firstName || currentUser?.displayName || 'Farmer'}!</h1>
          <p>Manage your farm products and track your sales from your dashboard.</p>
          {userProfile?.farmName && (
            <div className="farm-info">
              <strong>🚜 {userProfile.farmName}</strong>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="loading-stats">Loading statistics...</div>
        ) : error ? (
          <div className="error-stats">{error}</div>
        ) : (
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-number">{stats.totalProducts}</div>
              <div className="stat-label">Total Products</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.activeProducts}</div>
              <div className="stat-label">Active Products</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalSales}</div>
              <div className="stat-label">Total Sales</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">৳{stats.totalRevenue.toLocaleString()}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="product-management">
        <div className="section-header">
          <h2>Your Products</h2>
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
              {/* Basic Information */}
              <div className="form-section">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="farmer-name">Product Name *</label>
                    <input 
                      type="text" 
                      id="farmer-name" 
                      name="name" 
                      value={productForm.name} 
                      onChange={handleInputChange} 
                      placeholder="Enter product name" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="farmer-category">Category *</label>
                    <select 
                      id="farmer-category" 
                      name="category" 
                      value={productForm.category} 
                      onChange={handleInputChange} 
                      required
                    >
                      {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="farmer-description">Description</label>
                  <textarea 
                    id="farmer-description" 
                    name="description" 
                    value={productForm.description} 
                    onChange={handleInputChange} 
                    placeholder="Describe your product" 
                    rows="3" 
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="form-section">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="farmer-price">Price (৳) *</label>
                    <input 
                      type="number" 
                      id="farmer-price" 
                      name="price" 
                      value={productForm.price} 
                      onChange={handleInputChange} 
                      placeholder="0.00" 
                      min="0" 
                      step="0.01" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="farmer-unit">Unit</label>
                    <select 
                      id="farmer-unit" 
                      name="unit" 
                      value={productForm.unit} 
                      onChange={handleInputChange}
                    >
                      {units.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="farmer-stock">Stock Quantity *</label>
                    <input 
                      type="number" 
                      id="farmer-stock" 
                      name="stock" 
                      value={productForm.stock} 
                      onChange={handleInputChange} 
                      placeholder="0" 
                      min="0" 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Image URL */}
              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="farmer-image">Product Image URL *</label>
                  <input 
                    type="url" 
                    id="farmer-image" 
                    name="image" 
                    value={productForm.image}
                    onChange={handleImageChange} 
                    placeholder="https://example.com/image.jpg"
                    className="form-input" 
                  />
                  {productForm.image && (
                    <div className="image-preview">
                      <img src={productForm.image} alt="Product preview" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Specifications */}
              <div className="form-section">
                 <h3>Optional Specifications</h3>
                 <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="farmer-origin">Origin/Source</label>
                        <input 
                          type="text" 
                          id="farmer-origin" 
                          name="specifications.origin" 
                          value={productForm.specifications.origin} 
                          onChange={handleInputChange} 
                          placeholder="e.g., Local Farm" 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="farmer-quality">Quality Grade</label>
                        <select 
                          id="farmer-quality" 
                          name="specifications.quality" 
                          value={productForm.specifications.quality} 
                          onChange={handleInputChange}
                        >
                            <option value="premium">Premium</option>
                            <option value="standard">Standard</option>
                            <option value="economy">Economy</option>
                        </select>
                    </div>
                 </div>
                 <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          name="specifications.organic" 
                          checked={productForm.specifications.organic} 
                          onChange={handleInputChange} 
                        />
                        <span className="checkmark"></span>
                        Organic
                    </label>
                    <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          name="featured" 
                          checked={productForm.featured} 
                          onChange={handleInputChange} 
                        />
                        <span className="checkmark"></span>
                        Feature this product
                    </label>
                 </div>
              </div>

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={productLoading}
                onClick={() => console.log('🔥 Button clicked! Form data:', productForm)}
              >
                {productLoading ? 'Adding...' : 'Add Product'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-message">Loading products...</div>
        ) : products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                  <div className="product-status">
                    <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="product-price">৳{product.price} per {product.unit}</p>
                  <p className="product-stock">Stock: {product.stock} {product.unit}</p>
                  <p className="product-sales">Sales: {product.sales || 0}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-products">
            {!showAddProduct && (
              <>
                <div className="no-products-icon">📦</div>
                <h3>No Products Yet</h3>
                <p>Start by adding your first product to the marketplace!</p>
                <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}>Add Your First Product</button>
              </>
            )}
          </div>
        )}
      </div>

      {stats.topProduct && (
        <div className="top-product-section">
          <h2>🏆 Your Best Selling Product</h2>
          <div className="top-product-card">
            <img src={stats.topProduct.image} alt={stats.topProduct.name} />
            <div className="top-product-info">
              <h3>{stats.topProduct.name}</h3>
              <p>Sales: {stats.topProduct.sales} units</p>
              <p>Revenue: ৳{(stats.topProduct.sales * stats.topProduct.price).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
