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
  // Initialize products, including both the current product and cart items
  useEffect(() => {
    const productList = [];
    const quantityMap = {};
    const selectedMap = {};

    // First add cart items
    cartItems.forEach((cartItem) => {
      const cartItemProduct = {
        id: cartItem.productId,
        name: cartItem.productName,
        price: cartItem.price,
        image: cartItem.productImage,
        quantity: cartItem.quantity,
        cartItemId: cartItem.id, // Store the cart item ID for removal later
      };
      
      productList.push(cartItemProduct);
      quantityMap[cartItem.productId] = cartItem.quantity;
      selectedMap[cartItem.productId] = true; // Cart items selected by default
    });

    // Then add the current product if it's not already in cart
    if (product && !cartItems.some(item => item.productId === product.id)) {
      productList.push(product);
      quantityMap[product.id] = 1;
      selectedMap[product.id] = true; // Current product selected by default
    }

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
    }    const selectedItems = allProducts
      .filter((product) => selectedProducts[product.id])
      .map((product) => ({
        productId: product.id,
        productName: product.name || product.productName,
        productImage: product.image || product.productImage,
        price: product.price,
        quantity: quantities[product.id] || 1,
        cartItemId: product.cartItemId // Keep the cart item ID for later removal
      }));

    if (selectedItems.length === 0) {
      setErrorMessage('Please select at least one product.');
      return;
    }

    // Calculate order totals
    const subtotal = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05; // 5% tax
    const shipping = subtotal > 500 ? 0 : 60; // Free shipping over ৳500
    const totalAmount = subtotal + tax + shipping;
    
    // Check stock availability
    const stockErrors = await checkProductsStock(selectedItems);
    if (stockErrors.length > 0) {
      setErrorMessage(stockErrors.join('\n'));
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      const orderData = {
        items: selectedItems,
        totalAmount: totalAmount,
        subtotal: subtotal,
        tax: tax,
        shipping: shipping,
        discount: 0,
        deliveryAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India',
          phone: ''
        },
        paymentMethod: 'cash_on_delivery',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      };      // Place the order
      const result = await orderService.createOrder(currentUser.uid, orderData);
      
      // Remove all selected items that were in cart
      for (const item of selectedItems) {
        if (item.cartItemId) {
          // If item has a cartItemId, it was from the cart - remove it directly
          await removeFromCart(item.cartItemId);
        } else {
          // If no cartItemId, check if it's in the cart by productId
          const cartItem = cartItems.find(ci => ci.productId === item.productId);
          if (cartItem) {
            await removeFromCart(cartItem.id);
          }
        }
      }
      
      setSuccessMessage(`Order placed successfully! Your order ID is ${result.orderId}`);
      setIsProcessing(false);
      
      // Close popup after a delay and redirect to profile page
      setTimeout(() => {
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
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div 
        className="popup-content" 
        ref={contentRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleContentClick(e);
        }}
      >
        <h2>Buy Now</h2>        <button 
          className="close-btn" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }} 
          aria-label="Close"
        >
          ✖
        </button>

        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}        <div className="product-selection">
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
                    src={prod.image || prod.productImage || '/api/placeholder/60/60'}
                    alt={prod.name || prod.productName}
                    className="product-thumbnail"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/60/60';
                    }}
                  />
                  <div className="product-info">
                    <span className="product-name">{prod.name || prod.productName}</span>
                    <span className="product-price">৳{prod.price}</span>
                  </div>
                </label>
              </div><div className="quantity-controls">
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
                </button>                {cartItems.some(item => item.productId === prod.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Find the cart item by product ID
                      const cartItem = cartItems.find(item => item.productId === prod.id);
                      if (cartItem) {
                        if (window.confirm('Remove this item from cart?')) {
                          removeFromCart(cartItem.id);
                          // Also update the local state to remove it from the display
                          setAllProducts(prev => prev.filter(p => p.id !== prod.id));
                          const newQuantities = {...quantities};
                          delete newQuantities[prod.id];
                          setQuantities(newQuantities);
                          const newSelected = {...selectedProducts};
                          delete newSelected[prod.id];
                          setSelectedProducts(newSelected);
                        }
                      }
                    }}
                    className="cancel-item-btn"
                    title="Remove from cart"
                  >
                    Cancel
                  </button>
                )}
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
        </div>        <div className="popup-footer">
          <button 
            className="cancel-btn" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            className="confirm-btn"
            onClick={(e) => {
              e.preventDefault();
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
