import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './BuyNowPopup.css';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { orderService } from '../services/userService';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from './LoadingSpinner';

// Create a portal for the popup to render outside the normal DOM hierarchy
function BuyNowPopup({ product, onClose }) {
  const { currentUser } = useAuth();
  const { cartItems, removeFromCart } = useCart();
  const [allProducts, setAllProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedProducts, setSelectedProducts] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Create refs for the popup container and content
  const popupRef = useRef(null);
  const contentRef = useRef(null);

  // Handle clicks outside the popup content to close it
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (contentRef.current && !contentRef.current.contains(e.target)) {
        e.stopPropagation();
        onClose();
      }
    };

    // Add event listener to document body
    document.addEventListener('mousedown', handleOutsideClick);
    
    // Prevent body from scrolling when popup is open
    document.body.style.overflow = 'hidden';
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  // Prevent the popup from closing when clicking inside it
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // Combine the current product with cart products, avoiding duplicates
  useEffect(() => {
    const productList = [];
    const quantityMap = {};
    const selectedMap = {};

    // Add the current product first (the one user clicked 'Buy Now' on)
    if (product) {
      const productId = product.id;
      productList.push(product);
      quantityMap[productId] = 1;
      selectedMap[productId] = true;
    }

    // Add cart items, avoiding duplicates
    cartItems.forEach((cartItem) => {
      if (!productList.some((p) => p.id === cartItem.productId)) {
        // Create a product object from cart item
        productList.push({
          id: cartItem.productId,
          name: cartItem.productName,
          price: cartItem.price,
          image: cartItem.productImage,
          quantity: cartItem.quantity,
        });
        quantityMap[cartItem.productId] = cartItem.quantity;
        selectedMap[cartItem.productId] = false; // Default unselected for cart items
      }
    });

    setAllProducts(productList);
    setQuantities(quantityMap);
    setSelectedProducts(selectedMap);
  }, [product, cartItems]);

  const handleQuantityChange = (productId, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta),
    }));
  };

  const handleProductToggle = (productId) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const calculateTotal = () => {
    return allProducts
      .filter((product) => selectedProducts[product.id])
      .reduce((total, product) => {
        return total + product.price * quantities[product.id];
      }, 0);
  };

  // Function to check if products are in stock
  const checkProductsStock = async (items) => {
    const stockErrors = [];
    
    for (const item of items) {
      try {
        const productRef = doc(db, 'products', item.productId);
        const productDoc = await getDoc(productRef);
        
        if (!productDoc.exists()) {
          stockErrors.push(`Product "${item.productName}" is no longer available.`);
          continue;
        }
        
        const productData = productDoc.data();
        if (!productData.stock || productData.stock < item.quantity) {
          stockErrors.push(
            `Insufficient stock for "${item.productName}". Available: ${productData.stock || 0}, Requested: ${item.quantity}`
          );
        }
      } catch (error) {
        stockErrors.push(`Could not verify stock for "${item.productName}".`);
      }
    }
    
    return stockErrors;
  };

  const handleConfirm = async () => {
    if (!currentUser) {
      setErrorMessage('You must be logged in to place an order.');
      return;
    }

    const selectedItems = allProducts
      .filter((product) => selectedProducts[product.id])
      .map((product) => ({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        quantity: quantities[product.id],
      }));

    if (selectedItems.length === 0) {
      setErrorMessage('Please select at least one product.');
      return;
    }
    
    // Check stock availability for the selected items
    const stockErrors = await checkProductsStock(selectedItems);
    if (stockErrors.length > 0) {
      setErrorMessage(stockErrors.join('\n'));
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      // Create order data
      const orderData = {
        items: selectedItems,
        totalAmount: calculateTotal(),
        subtotal: calculateTotal(),
        tax: 0,
        shipping: 0,
        discount: 0,
        deliveryAddress: {
          street: 'Default Address',
          city: 'Default City',
          state: 'Default State',
          zipCode: '000000',
          country: 'India',
          phone: '0000000000'
        },
        deliveryDate: null,
        deliveryTimeSlot: null,
        deliveryInstructions: '',
        paymentMethod: 'cash_on_delivery',
        paymentId: null,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      };

      // Place the order
      const result = await orderService.createOrder(currentUser.uid, orderData);
      
      // Remove purchased items from cart
      const cartProductIds = cartItems.map(item => item.productId);
      for (const item of selectedItems) {
        if (cartProductIds.includes(item.productId)) {
          // Find the cart item with this productId
          const cartItem = cartItems.find(ci => ci.productId === item.productId);
          if (cartItem && cartItem.id) {
            removeFromCart(cartItem.id);
          }
        }
      }
      
      // Show success message
      setSuccessMessage(`Order placed successfully! Your order ID is ${result.orderId}`);
      
      // Hide processing UI
      setIsProcessing(false);
      
      // Close popup after a short delay and redirect to profile page
      setTimeout(() => {
        // The onClose function should handle navigation to the profile page with orders tab active
        onClose(`Order #${result.orderId} placed successfully!`, '/profile?tab=orders');
      }, 2000);
    } catch (error) {
      let errorMsg = 'Failed to place order: ';
      if (error.message.includes('permission-denied')) {
        errorMsg += 'You do not have permission to perform this action.';
      } else if (error.message.includes('not-found')) {
        errorMsg += 'One or more products are no longer available.';
      } else if (error.message.includes('unavailable')) {
        errorMsg += 'Service is temporarily unavailable. Please try again later.';
      } else {
        errorMsg += error.message;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Create portal to render popup outside component hierarchy
  return ReactDOM.createPortal(
    <div 
      className="buy-now-popup" 
      ref={popupRef}
    >
      <div 
        className="popup-content" 
        ref={contentRef}
        onClick={handleContentClick}
      >
        <h2>Buy Now</h2>
        <button 
          className="close-btn" 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }} 
          aria-label="Close"
        >
          ✖
        </button>

        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="product-selection">
          {allProducts.map((prod) => (
            <div key={prod.id} className="product-item">
              <div className="product-checkbox">
                <input
                  type="checkbox"
                  id={`product-${prod.id}`}
                  checked={selectedProducts[prod.id] || false}
                  onChange={() => handleProductToggle(prod.id)}
                />
                <label htmlFor={`product-${prod.id}`}>
                  <img
                    src={prod.image || '/api/placeholder/60/60'}
                    alt={prod.name}
                    className="product-thumbnail"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/60/60';
                    }}
                  />
                  <div className="product-info">
                    <span className="product-name">{prod.name}</span>
                    <span className="product-price">৳{prod.price}</span>
                  </div>
                </label>
              </div>

              <div className="quantity-controls">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(prod.id, -1);
                  }}
                  disabled={!selectedProducts[prod.id] || quantities[prod.id] <= 1}
                  className="qty-btn"
                >
                  -
                </button>
                <span className="quantity">{quantities[prod.id] || 1}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(prod.id, 1);
                  }}
                  disabled={!selectedProducts[prod.id]}
                  className="qty-btn"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {allProducts.length === 0 && (
          <div className="empty-products">
            <p>No products available to purchase.</p>
          </div>
        )}

        <div className="order-summary">
          <div className="total-amount">
            <span>Total:</span>
            <span>৳{calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="popup-footer">
          <button 
            className="cancel-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            className="confirm-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleConfirm();
            }}
            disabled={isProcessing || allProducts.length === 0}
          >
            {isProcessing ? 'Processing...' : 'Confirm Purchase'}
          </button>
        </div>

        {isProcessing && (
          <div className="loading-overlay">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>,
    document.body // Render directly to body
  );
}

export default BuyNowPopup;
