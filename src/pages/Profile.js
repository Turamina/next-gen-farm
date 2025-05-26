import React, { useState, useEffect } from 'react';
import { updateProfile, updatePassword, updateEmail } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { userService, orderService } from '../services/userService';
import { Link, useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import SuccessMessage from '../components/SuccessMessage';
import './Profile.css';

const Profile = () => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const { cartItems, removeFromCart, updateCartItemQuantity, clearCart, getCartTotal } = useCart();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);

  // Profile form data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    farmName: '',
    bio: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    }
  });

  // Preferences data
  const [preferencesData, setPreferencesData] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true,
      orderUpdates: true,
      promotions: true,
      newsletter: true
    },
    delivery: {
      preferredTime: 'morning',
      specialInstructions: '',
      contactMethod: 'phone'
    },
    privacy: {
      profileVisible: false,
      shareData: false
    }
  });

  // Password change form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser && userProfile) {
        // Load profile data from Firestore
        setProfileData({
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          displayName: userProfile.displayName || '',
          email: userProfile.email || '',
          phoneNumber: userProfile.phoneNumber || '',
          farmName: userProfile.farmName || '',
          bio: userProfile.bio || '',
          address: userProfile.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'USA'
          }
        });

        // Load preferences
        setPreferencesData(userProfile.preferences || preferencesData);

        // Load user orders
        try {
          const userOrders = await orderService.getUserOrders(currentUser.uid);
          setOrders(userOrders);
        } catch (error) {
          console.error('Error loading orders:', error);
        }
      }
    };

    loadUserData();
  }, [currentUser, userProfile]);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    if (tab && ['profile', 'security', 'orders', 'cart', 'preferences'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // Update Firebase profile
      await updateProfile(currentUser, {
        displayName: profileData.displayName
      });

      // Update email if changed
      if (profileData.email !== currentUser.email) {
        await updateEmail(currentUser, profileData.email);
      }

      // Update user profile in Firestore
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        displayName: profileData.displayName,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber,
        farmName: profileData.farmName,
        bio: profileData.bio,
        address: profileData.address
      };

      await userService.updateUserProfile(currentUser.uid, updateData);
      
      // Refresh user profile in context
      await refreshUserProfile();

      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign out and sign back in to update your email.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use by another account.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await updatePassword(currentUser, passwordData.newPassword);
      setMessage('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      let errorMessage = 'Failed to update password. Please try again.';
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign out and sign back in to change your password.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesChange = (section, field, value) => {
    setPreferencesData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await userService.updateUserProfile(currentUser.uid, {
        preferences: preferencesData
      });
      
      await refreshUserProfile();
      setMessage('Preferences updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError('Failed to update preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };
  // Create a function to refresh orders
  const refreshOrders = async () => {
    if (currentUser) {
      try {
        const userOrders = await orderService.getUserOrders(currentUser.uid);
        setOrders(userOrders);
      } catch (error) {
        // Handle errors silently
      }
    }
  };

  // Refresh orders when tab changes to 'orders'
  useEffect(() => {
    if (activeTab === 'orders') {
      refreshOrders();
    }
  }, [activeTab, currentUser]);

  if (!currentUser) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Please sign in to access your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
        <div className="profile-info">
          <h1>{currentUser.displayName || 'User'}</h1>
          <p className="profile-email">{currentUser.email}</p>
          <p className="profile-joined">
            Member since {new Date(currentUser.metadata.creationTime).toLocaleDateString()}
          </p>
        </div>
      </div>      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Information
        </button>
        <button 
          className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Order History
        </button>
        <button 
          className={`tab-button ${activeTab === 'cart' ? 'active' : ''}`}
          onClick={() => setActiveTab('cart')}
        >
          Shopping Cart ({cartItems.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <Link to="/settings" className="tab-button settings-link">
          Settings
        </Link>
      </div>

      <div className="profile-content">
        {message && <SuccessMessage message={message} />}
        {error && <div className="error-message profile-error">{error}</div>}

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div className="tab-content">
            <h2>Profile Information</h2>
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="displayName">Display Name</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={profileData.displayName}
                    onChange={handleProfileChange}
                    placeholder="Enter your display name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleProfileChange}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="farmName">Farm Name</label>
                  <input
                    type="text"
                    id="farmName"
                    name="farmName"
                    value={profileData.farmName}
                    onChange={handleProfileChange}
                    placeholder="Enter your farm name (optional)"
                  />
                </div>
              </div>              <div className="form-group">
                <label htmlFor="address">Address</label>
                <div className="address-fields">
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={profileData.address.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    placeholder="Street Address"
                  />
                  <div className="address-row">
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={profileData.address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="City"
                    />
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={profileData.address.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      placeholder="State"
                    />
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={profileData.address.zipCode}
                      onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell us about yourself"
                  rows="4"
                />
              </div>

              <button type="submit" className="save-btn" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="tab-content">
            <h2>Security Settings</h2>
            <div className="security-info">
              <div className="security-item">
                <div className="security-icon">🔐</div>
                <div className="security-details">
                  <h3>Password</h3>
                  <p>Last updated: Never</p>
                </div>
                <button 
                  className="security-action"
                  onClick={() => document.getElementById('password-form').scrollIntoView()}
                >
                  Change
                </button>
              </div>
              
              <div className="security-item">
                <div className="security-icon">📧</div>
                <div className="security-details">
                  <h3>Email Verification</h3>
                  <p>{currentUser.emailVerified ? 'Verified' : 'Not verified'}</p>
                </div>
                {!currentUser.emailVerified && (
                  <button className="security-action">Verify</button>
                )}
              </div>
            </div>

            <form id="password-form" onSubmit={handlePasswordSubmit} className="password-form">
              <h3>Change Password</h3>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
              </div>

              <button type="submit" className="save-btn" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}        {/* Order History Tab */}
        {activeTab === 'orders' && (          <div className="tab-content">
            <h2>Order History</h2>
            <div className="order-actions-container" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                onClick={refreshOrders} 
                className="refresh-orders-btn"
                style={{
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Refresh Orders
              </button>
              <span style={{ color: '#666', fontSize: '14px' }}>
                {orders.length > 0 ? `${orders.length} order${orders.length > 1 ? 's' : ''} found` : 'No orders found'}
              </span>
            </div>
            <div className="orders-container">
              {orders.length > 0 ? (
                orders.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-header">
                      <div className="order-number">#{order.orderId || 'N/A'}</div>
                      <div className="order-date">
                        {order.createdAt instanceof Date ? 
                          order.createdAt.toLocaleDateString() + ' ' + order.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                          'N/A'}
                      </div>
                      <div className={`order-status ${order.status || 'pending'}`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                      </div>
                    </div>
                    <div className="order-details">
                      <div className="order-items">
                        {order.items?.map((item, index) => (
                          <p key={index}>                            {item.productName} (x{item.quantity}) - ৳{(item.price * item.quantity).toFixed(2)}
                            {index < order.items.length - 1 ? ', ' : ''}
                          </p>
                        ))}
                      </div>
                      <div className="order-total">৳{order.totalAmount?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="order-actions">
                      <button className="order-action-btn">View Details</button>
                      {order.status === 'delivered' && (
                        <button className="order-action-btn">Reorder</button>
                      )}
                    </div>
                  </div>
                ))
              ) : (                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <p>No orders found</p>
                  <p className="empty-subtitle">Start shopping to see your order history</p>
                  <Link to="/products" className="browse-products-btn">Browse Products</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shopping Cart Tab */}
        {activeTab === 'cart' && (
          <div className="tab-content">
            <h2>Shopping Cart</h2>
            <div className="cart-container">
              {cartItems.length > 0 ? (
                <>
                  <div className="cart-items">
                    {cartItems.map(item => (
                      <div key={item.id} className="cart-item">                        <div className="cart-item-image">
                          <img 
                            src={item.productImage || '/api/placeholder/60/60'} 
                            alt={item.productName}
                            onError={(e) => e.target.src = '/api/placeholder/60/60'}
                          />
                        </div>                        <div className="cart-item-details">
                          <h3>{item.productName}</h3>
                          <p className="cart-item-price">৳{item.price?.toFixed(2)}</p>
                          {/* Optional farmer name display if available */}
                          {item.farmerName && <p className="cart-item-farmer">By {item.farmerName}</p>}
                        </div>
                        <div className="cart-item-quantity">
                          <button 
                            className="quantity-btn"
                            onClick={() => updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button 
                            className="quantity-btn"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>                        <div className="cart-item-total">
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button 
                          className="remove-item-btn"
                          onClick={() => removeFromCart(item.id)}
                          title="Remove from cart"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>                  <div className="cart-summary">
                    <div className="cart-total">
                      <h3>Total: ৳{getCartTotal().toFixed(2)}</h3>
                    </div>
                    <div className="cart-actions">
                      <button 
                        className="clear-cart-btn"
                        onClick={clearCart}
                      >
                        Clear Cart
                      </button>
                      <Link to="/products" className="continue-shopping-btn">
                        Continue Shopping
                      </Link>
                      <Link to="/checkout" className="checkout-btn">
                        Proceed to Checkout
                      </Link>
                    </div>
                  </div>
                </>
              ) : (                <div className="empty-state">
                  <div className="empty-icon">🛒</div>
                  <p>Your cart is empty</p>
                  <p className="empty-subtitle">Add some items to your cart to see them here</p>
                  <Link to="/products" className="browse-products-btn">Browse Products</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="tab-content">
            <h2>Preferences</h2>            <form onSubmit={handlePreferencesSubmit}>
              <div className="preferences-section">
                <h3>Notifications</h3>
                <div className="preference-item">
                  <label className="preference-label">
                    <input 
                      type="checkbox" 
                      checked={preferencesData.notifications.email}
                      onChange={(e) => handlePreferencesChange('notifications', 'email', e.target.checked)}
                    />
                    Email notifications
                  </label>
                </div>
                <div className="preference-item">
                  <label className="preference-label">
                    <input 
                      type="checkbox" 
                      checked={preferencesData.notifications.orderUpdates}
                      onChange={(e) => handlePreferencesChange('notifications', 'orderUpdates', e.target.checked)}
                    />
                    Order updates
                  </label>
                </div>
                <div className="preference-item">
                  <label className="preference-label">
                    <input 
                      type="checkbox" 
                      checked={preferencesData.notifications.promotions}
                      onChange={(e) => handlePreferencesChange('notifications', 'promotions', e.target.checked)}
                    />
                    Marketing emails
                  </label>
                </div>
              </div>

              <div className="preferences-section">
                <h3>Delivery Preferences</h3>
                <div className="form-group">
                  <label htmlFor="preferredTime">Preferred Delivery Time</label>
                  <select 
                    id="preferredTime" 
                    value={preferencesData.delivery.preferredTime}
                    onChange={(e) => handlePreferencesChange('delivery', 'preferredTime', e.target.value)}
                  >
                    <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                    <option value="afternoon">Afternoon (12:00 PM - 6:00 PM)</option>
                    <option value="evening">Evening (6:00 PM - 9:00 PM)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="deliveryInstructions">Delivery Instructions</label>
                  <textarea
                    id="deliveryInstructions"
                    value={preferencesData.delivery.specialInstructions}
                    onChange={(e) => handlePreferencesChange('delivery', 'specialInstructions', e.target.value)}
                    placeholder="Special delivery instructions..."
                    rows="3"
                  />
                </div>
              </div>

              <button type="submit" className="save-btn" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
