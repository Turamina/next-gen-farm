import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './FarmerProducts.css';

const FarmerProducts = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productLoading, setProductLoading] = useState(false);

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
    loadFarmerProducts();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFarmerProducts = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, 'products'),
        where('farmerId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const farmerProducts = [];
      
      querySnapshot.forEach((doc) => {
        farmerProducts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setProducts(farmerProducts);
    } catch (error) {
      console.error('Error loading farmer products:', error);
      showMessage('Failed to load products', 'error');
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
    
    // Validation
    if (!productForm.name || !productForm.description || !productForm.price || !productForm.stock) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }

    if (parseFloat(productForm.price) <= 0) {
      showMessage('Please enter a valid price greater than 0', 'error');
      return;
    }
    
    if (!productForm.stock || parseInt(productForm.stock) <= 0) {
      showMessage('Please enter a valid stock quantity greater than 0', 'error');
      return;
    }
    
    if (!productForm.image || !productForm.image.trim()) {
      showMessage('Please enter a valid image URL', 'error');
      return;
    }

    setProductLoading(true);
    
    try {
      // Get farmer profile
      const farmerRef = doc(db, 'farmers', currentUser.uid);
      const farmerSnap = await getDoc(farmerRef);
      if (!farmerSnap.exists()) {
        throw new Error('Farmer profile not found.');
      }
      const farmerData = farmerSnap.data();

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

      await addDoc(collection(db, 'products'), newProduct);
      
      showMessage('Product added successfully!', 'success');
      
      setShowAddProduct(false);
      setProductForm({
        name: '', description: '', price: '', category: 'dairy', stock: '',
        unit: 'kg', image: '', featured: false,
        specifications: { origin: '', quality: 'premium', organic: false, expiryDate: '' }
      });
      
      await loadFarmerProducts();

    } catch (error) {
      console.error('Error adding product:', error);
      showMessage(`Failed to add product: ${error.message}`, 'error');
    } finally {
      setProductLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', productId));
      showMessage('Product deleted successfully!', 'success');
      await loadFarmerProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showMessage('Failed to delete product', 'error');
    }
  };

  const handleToggleActive = async (productId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        isActive: !currentStatus,
        updatedAt: serverTimestamp()
      });
      showMessage(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
      await loadFarmerProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      showMessage('Failed to update product status', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 4000);
  };

  if (loading) {
    return (
      <div className="farmer-products">
        <div className="loading-spinner">Loading your products...</div>
      </div>
    );
  }

  return (
    <div className="farmer-products">
      <div className="products-header">
        <h1>My Products</h1>
        <p>Manage your product listings</p>
        <button 
          className={`btn ${showAddProduct ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setShowAddProduct(!showAddProduct)}
        >
          {showAddProduct ? '❌ Cancel' : '➕ Add Product'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {showAddProduct && (
        <div className="add-product-form-container">
          <h2>Add New Product</h2>
          <form onSubmit={handleProductSubmit} className="add-product-form">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Product Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={productForm.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={productForm.category}
                    onChange={handleInputChange}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={productForm.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product in detail"
                  rows="4"
                  required
                />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="form-section">
              <h3>Pricing & Stock</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Price (৳) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={productForm.price}
                    onChange={handleInputChange}
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="unit">Unit</label>
                  <select
                    id="unit"
                    name="unit"
                    value={productForm.unit}
                    onChange={handleInputChange}
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="stock">Stock Quantity *</label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={productForm.stock}
                    onChange={handleInputChange}
                    placeholder="Available quantity"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Image URL */}
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="image">Product Image URL *</label>
                <input 
                  type="url" 
                  id="image" 
                  name="image" 
                  value={productForm.image}
                  onChange={handleImageChange} 
                  placeholder="https://example.com/image.jpg"
                  className="form-input" 
                  required
                />
                {productForm.image && (
                  <div className="image-preview">
                    <img src={productForm.image} alt="Product preview" onError={(e) => e.target.style.display = 'none'} />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowAddProduct(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={productLoading}
              >
                {productLoading ? 'Adding Product...' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      <div className="products-grid">
        {products.length === 0 ? (
          <div className="no-products">
            <h3>No products yet</h3>
            <p>Add your first product to start selling!</p>
            {!showAddProduct && (
              <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}>
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className={`product-card ${!product.isActive ? 'inactive' : ''}`}>
              <div className="product-image">
                <img src={product.image} alt={product.name} />
                <div className="product-status">
                  {product.isActive ? (
                    <span className="status-active">Active</span>
                  ) : (
                    <span className="status-inactive">Inactive</span>
                  )}
                </div>
              </div>
              
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-details">
                  <span className="product-price">৳{product.price}/{product.unit}</span>
                  <span className="product-stock">Stock: {product.stock}</span>
                </div>
                <div className="product-meta">
                  <span className="product-category">{product.category}</span>
                  <span className="product-sales">Sales: {product.sales || 0}</span>
                </div>
              </div>
              
              <div className="product-actions">
                <button 
                  className={`btn ${product.isActive ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => handleToggleActive(product.id, product.isActive)}
                >
                  {product.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FarmerProducts;
