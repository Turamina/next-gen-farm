import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import ProductCard from '../components/ProductCard';
import dummyProducts from '../data/products';

function Home() {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          
          <div className="hero-buttons">
            <Link to="/products" className="cta-button primary">View All Products</Link>
            <Link to="/about" className="cta-button secondary">Learn More</Link>
          </div>
        </div>
      </section>

      <section className="featured-products">
        <div className="section-header">
          <h2>Featured Products</h2>
          <p>Discover our most popular farm-fresh products</p>
        </div>
        <div className="products-preview">
          {dummyProducts.slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <Link to="/products" className="view-all-link">View All Products →</Link>
      </section>

      <section className="farm-features">
        <div className="section-header">
          <h2>Why Choose Us?</h2>
          <p>Our commitment to quality and sustainability</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🌿</div>
            <h3>Fresh & Natural</h3>
            <p>All products are fresh from our farm, with no artificial preservatives</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✓</div>
            <h3>Quality Assured</h3>
            <p>Strict quality control and hygienic processing at every step</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚜</div>
            <h3>Direct from Farm</h3>
            <p>Eliminating middlemen to bring you the best prices</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
