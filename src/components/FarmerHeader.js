import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './FarmerHeader.css';

const FarmerHeader = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <header className="farmer-header">
      <div className="farmer-header-container">
        {/* Logo */}
        <Link to="/farmer/dashboard" className="farmer-logo">
          <img src="/logo192.png" alt="Next Gen Farm" />
          <span>Farmer Portal</span>
        </Link>

        {/* Navigation */}
        <nav className="farmer-nav">
          <Link to="/farmer/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/farmer/products" className="nav-link">
            My Products
          </Link>
          <Link to="/farmer/add-product" className="nav-link">
            Add Product
          </Link>
          <Link to="/farmer/orders" className="nav-link">
            Orders
          </Link>
        </nav>

        {/* User Menu */}
        <div className="farmer-user-menu">
          <div 
            className="user-profile-dropdown"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <div className="user-profile-trigger">
              <div className="user-avatar">
                {userProfile?.firstName ? userProfile.firstName.charAt(0).toUpperCase() : 
                 currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 
                 currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="user-name">
                {userProfile?.firstName || currentUser?.displayName || 'Farmer'}
              </span>
              <span className="dropdown-arrow">▼</span>
            </div>

            {showDropdown && (
              <div className="dropdown-menu">
                <Link to="/farmer/profile" className="dropdown-item">
                  <span className="dropdown-icon">👤</span>
                  My Profile
                </Link>
                <Link to="/farmer/settings" className="dropdown-item">
                  <span className="dropdown-icon">⚙️</span>
                  Settings
                </Link>
                <Link to="/farmer/analytics" className="dropdown-item">
                  <span className="dropdown-icon">📊</span>
                  Analytics
                </Link>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item logout-btn">
                  <span className="dropdown-icon">🚪</span>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default FarmerHeader;
