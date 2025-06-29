import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './AddProduct.css';

const AddProduct = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [productData, setProductData] = useState({
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('specifications.')) {
      const specField = name.split('.')[1];
      setProductData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specField]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setProductData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageChange = (e) => {
    const url = e.target.value;
    setProductData(prev => ({
      ...prev,
      image: url
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate required fields
    if (!productData.name || !productData.description || !productData.price || !productData.stock) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(productData.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (parseInt(productData.stock) <= 0) {
      setError('Stock must be greater than 0');
      return;
    }

    if (!productData.image || !productData.image.trim()) {
      setError('Please enter a valid image URL');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚜 Starting product creation for farmer:', currentUser.uid);

      // Get farmer profile to include farm information
      const farmerRef = doc(db, 'farmers', currentUser.uid);
      const farmerSnap = await getDoc(farmerRef);
      
      if (!farmerSnap.exists()) {
        throw new Error('Farmer profile not found. Please complete your profile first.');
      }
      
      const farmerData = farmerSnap.data();
      console.log('✅ Farmer profile found:', farmerData.farmName);

      console.log('� Creating product with image URL:', productData.image);

      // Create product data
      const newProduct = {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        category: productData.category,
        stock: parseInt(productData.stock),
        unit: productData.unit,
        image: productData.image.trim(),
        featured: productData.featured,
        specifications: productData.specifications,
        
        // Farmer information
        farmerId: currentUser.uid,
        farmerEmail: currentUser.email,
        farmerName: farmerData.displayName || `${farmerData.firstName} ${farmerData.lastName}`,
        farmName: farmerData.farmName,
        farmAddress: farmerData.farmAddress || '',
        
        // Product status
        isActive: true,
        approved: true, // Auto-approve farmer products, you can change this
        status: 'active',
        sales: 0,
        views: 0,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('💾 Saving product to Firestore...');
      
      // Add product to Firestore products collection
      const docRef = await addDoc(collection(db, 'products'), newProduct);
      console.log('✅ Product saved with ID:', docRef.id);
      
      setMessage('🎉 Product added successfully! It will appear on the website shortly.');
      
      // Reset form
      setProductData({
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
      
      // Clear form input
      const imageInput = document.getElementById('image');
      if (imageInput) {
        imageInput.value = '';
      }
      
      // Redirect to farmer dashboard after success
      setTimeout(() => {
        navigate('/farmer/dashboard');
      }, 3000);

    } catch (error) {
      console.error('❌ Error adding product:', error);
      setError(`Failed to add product: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-product-page">
      <div className="add-product-container">
        <h1>Add New Product</h1>
        <p>List a new product to sell on the marketplace</p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="add-product-form">
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
                  value={productData.name}
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
                  value={productData.category}
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
                value={productData.description}
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
                  value={productData.price}
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
                  value={productData.unit}
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
                  value={productData.stock}
                  onChange={handleInputChange}
                  placeholder="Available quantity"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Product Image URL */}
          <div className="form-section">
            <h3>Product Image</h3>
            
            <div className="form-group">
              <label htmlFor="image">Image URL *</label>
              <input
                type="url"
                id="image"
                name="image"
                value={productData.image}
                onChange={handleImageChange}
                placeholder="https://example.com/image.jpg"
                className="form-input"
                required
              />
              <p className="help-text">Enter a valid image URL for your product</p>
              
              {productData.image && (
                <div className="image-preview">
                  <img 
                    src={productData.image} 
                    alt="Product preview"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div className="form-section">
            <h3>Product Specifications</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="specifications.origin">Origin/Source</label>
                <input
                  type="text"
                  id="specifications.origin"
                  name="specifications.origin"
                  value={productData.specifications.origin}
                  onChange={handleInputChange}
                  placeholder="e.g., Local Farm, Organic Garden"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="specifications.quality">Quality Grade</label>
                <select
                  id="specifications.quality"
                  name="specifications.quality"
                  value={productData.specifications.quality}
                  onChange={handleInputChange}
                >
                  <option value="premium">Premium</option>
                  <option value="standard">Standard</option>
                  <option value="economy">Economy</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="specifications.expiryDate">Expiry Date (if applicable)</label>
                <input
                  type="date"
                  id="specifications.expiryDate"
                  name="specifications.expiryDate"
                  value={productData.specifications.expiryDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="specifications.organic"
                  checked={productData.specifications.organic}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Organic Product
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="featured"
                  checked={productData.featured}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Feature this product
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate('/farmer/dashboard')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Adding Product...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
