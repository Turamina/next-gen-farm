import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { cartService } from '../services/userService';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load cart items when user logs in
  useEffect(() => {
    if (currentUser) {
      loadCartItems();
    } else {
      setCartItems([]);
    }
  }, [currentUser]);

  const loadCartItems = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const items = await cartService.getUserCart(currentUser.uid);
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productData) => {
    if (!currentUser) return;
    
    try {
      await cartService.addToCart(currentUser.uid, productData);
      await loadCartItems(); // Refresh cart items
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (!currentUser) return;
    
    try {
      await cartService.removeFromCart(cartItemId);
      await loadCartItems(); // Refresh cart items
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const updateCartItemQuantity = async (cartItemId, newQuantity) => {
    if (!currentUser) return;
    
    try {
      await cartService.updateCartItemQuantity(cartItemId, newQuantity);
      await loadCartItems(); // Refresh cart items
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!currentUser) return;
    
    try {
      await cartService.clearCart(currentUser.uid);
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    loadCartItems,
    getCartTotal,
    getCartItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
