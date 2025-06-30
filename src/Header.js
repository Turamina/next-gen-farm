import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useCart } from './contexts/CartContext';
import './Header.css';
import logo from './assets/logo.jpeg';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const { getCartItemCount } = useCart();
  
  const cartItemCount = getCartItemCount();
  const handleMenuToggle = () => setMenuOpen(!menuOpen);
  const handleLinkClick = () => setMenuOpen(false);
  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Check if current user is admin
  const isAdmin = userProfile?.isAdmin === true;

  return (
    <nav className="header-nav">
      <div className="header-logo">
        <img src={logo} alt="Next Gen Farm Logo" className="logo-img" />
        <span className="logo-text">Next Gen Farm</span>
      </div>

      <button 
        className="menu-toggle" 
        onClick={handleMenuToggle} 
        aria-label="Toggle menu"
        type="button"
      >
        &#9776;
      </button>

      <div className="nav-center">
        <ul className={`header-links${menuOpen ? ' open' : ''}`}>
          <li>
            <Link to="/" onClick={handleLinkClick} className="nav-link">
              Home
            </Link>
          </li>
          <li>
            <Link to="/products" onClick={handleLinkClick} className="nav-link">
              Product
            </Link>
          </li>
          <li>
            <Link to="/cattle" onClick={handleLinkClick} className="nav-link">
              Cattle
            </Link>
          </li>
          <li>
            <Link to="/about" onClick={handleLinkClick} className="nav-link">
              About
            </Link>
          </li>
          <li>
            <Link to="/contact" onClick={handleLinkClick} className="nav-link">
              Contact
            </Link>
          </li>
          <li>
            <Link to="/gallery" onClick={handleLinkClick} className="nav-link">
              Gallery
            </Link>
          </li>
        </ul>
      </div>      <div className={`auth-buttons${menuOpen ? ' open' : ''}`}>
        {currentUser ? (
          <>            <Link 
              to="/profile?tab=cart" 
              className="cart-link orange-cart" 
              onClick={handleLinkClick}
              title="View Cart"
            >
              <span className="cart-icon">🛒</span>
              {cartItemCount > 0 && (
                <span className="cart-count">{cartItemCount}</span>
              )}
            </Link>
            <Link 
              to="/profile" 
              className="user-welcome" 
              onClick={handleLinkClick}
            >
              Welcome, {currentUser.displayName || currentUser.email}
            </Link>
            {isAdmin && (
              <Link 
                to="/admin" 
                className="auth-btn admin-btn" 
                onClick={handleLinkClick}
              >
                Admin
              </Link>
            )}
            <button 
              onClick={handleLogout} 
              className="auth-btn logout-btn enhanced-logout"
              type="button"
            >
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/signin" 
              className="auth-btn signin-btn" 
              onClick={handleLinkClick}
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="auth-btn signup-btn" 
              onClick={handleLinkClick}
            >
              Create Account
            </Link>
          </>
        )}      </div>

    </nav>
  );
}

export default Header;
