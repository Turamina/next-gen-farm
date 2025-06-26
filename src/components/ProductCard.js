import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

// Add a style tag for custom animation
const slideInRightAnimation = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

function ProductCard({ product }) {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showMessage, setShowMessage] = useState('');

  const handleAddToCart = async () => {
    if (!currentUser) {
      setShowMessage('Please sign in to add items to cart');
      setTimeout(() => setShowMessage(''), 3000);
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        quantity: quantity
      });
      
      setShowMessage('Added to cart successfully!');
      setTimeout(() => setShowMessage(''), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setShowMessage('Failed to add to cart');
      setTimeout(() => setShowMessage(''), 3000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!currentUser) {
      setShowMessage('Please sign in to purchase');
      setTimeout(() => setShowMessage(''), 3000);
      return;
    }

    // Add the product to cart first
    setIsAddingToCart(true);
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        quantity: quantity
      });
      
      // Redirect to the cart page (Profile page with cart tab)
      navigate('/profile?tab=cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      setShowMessage('Failed to add to cart');
      setTimeout(() => setShowMessage(''), 3000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="product-card" onClick={(e) => e.stopPropagation()}>
      <style>{slideInRightAnimation}</style>
      <div className="product-image">
        <img 
          src={product.image || '/api/placeholder/300/200'} 
          alt={product.name}
          onError={(e) => {
            e.target.src = '/api/placeholder/300/200';
            e.target.onerror = null; // Prevent infinite loop
          }}
        />
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">৳{product.price}</span>
        </div>
        {product.stock !== undefined && (
          <span className="stock-info">In Stock: {product.stock}</span>
        )}
        <div className="product-actions">
          <div className="quantity-selector">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="quantity">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              disabled={product.stock && quantity >= product.stock}
            >
              +
            </button>
          </div>
          
          <button 
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={isAddingToCart || (product.stock && product.stock === 0)}
          >
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
          <button 
            className="buy-now-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBuyNow(e);
            }}
            disabled={(product.stock && product.stock === 0) || isAddingToCart}
            type="button"
          >
            {isAddingToCart ? 'Processing...' : 'Buy Now'}
          </button>
        </div>
        
        {showMessage && (
          <div 
            className={`message ${showMessage.includes('success') || showMessage.includes('placed') ? 'success' : 'error'}`}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              padding: '12px 20px',
              borderRadius: '4px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 9999,
              maxWidth: '300px',
              fontSize: '14px',
              fontWeight: '500',
              borderLeft: '4px solid',
              backgroundColor: showMessage.includes('success') || showMessage.includes('placed') ? '#e8f5e9' : '#ffebee',
              color: showMessage.includes('success') || showMessage.includes('placed') ? '#2e7d32' : '#c62828',
              borderColor: showMessage.includes('success') || showMessage.includes('placed') ? '#4caf50' : '#f44336',
              animation: 'slideInRight 0.5s ease forwards'
            }}
          >
            {showMessage}
          </div>
        )}
      </div>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    image: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    stock: PropTypes.number,
  }).isRequired,
};

export default ProductCard;
