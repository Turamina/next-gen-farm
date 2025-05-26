import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './Header.css';
import logo from './assets/logo.jpeg';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();

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
      </div>

      <div className={`auth-buttons${menuOpen ? ' open' : ''}`}>
        {currentUser ? (
          <>
            <Link 
              to="/profile" 
              className="user-welcome" 
              onClick={handleLinkClick}
            >
              Welcome, {currentUser.displayName || currentUser.email}
            </Link>
            <button 
              onClick={handleLogout} 
              className="auth-btn logout-btn"
              type="button"
            >
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
        )}
      </div>
    </nav>
  );
}

export default Header;
