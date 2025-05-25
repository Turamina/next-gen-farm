import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import logo from './assets/logo.jpeg';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => setMenuOpen((open) => !open);
  const handleLinkClick = () => setMenuOpen(false);

  return (
    <nav className="header-nav">
      <div className="header-logo">
        <img src={logo} alt="Next Gen Farm Logo" className="logo-img" />
        Next Gen Farm
      </div>
      <button className="menu-toggle" onClick={handleMenuToggle} aria-label="Toggle menu">
        &#9776;
      </button>      <ul className={`header-links${menuOpen ? ' open' : ''}`}>
        <li><Link to="/" onClick={handleLinkClick}>Home</Link></li>
        <li><Link to="/products" onClick={handleLinkClick}>Product</Link></li>
        <li><Link to="/cattle" onClick={handleLinkClick}>Cattle</Link></li>
        <li><Link to="/about" onClick={handleLinkClick}>About</Link></li>
        <li><Link to="/contact" onClick={handleLinkClick}>Contact</Link></li>
        <li><Link to="/gallery" onClick={handleLinkClick}>Gallery</Link></li>      </ul>
      <div className={`auth-buttons${menuOpen ? ' open' : ''}`}>
        <Link to="/signin" className="auth-btn signin-btn" onClick={handleLinkClick}>Sign In</Link>
        <Link to="/signup" className="auth-btn signup-btn" onClick={handleLinkClick}>Create Account</Link>
      </div>
    </nav>
  );
}

export default Header;
