import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import ProductCard from '../components/ProductCard';
import { productService } from '../services/productService';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        console.log('Home: Fetching featured products...');
        const products = await productService.getFeaturedProducts(3);
        console.log('Home: Featured products received:', products);
        setFeaturedProducts(products);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Fresh Farm Products Delivered to Your Door</h1>
          <p>Experience the taste of nature with our premium farm-fresh dairy products</p>
          <div className="hero-buttons">
            <Link to="/products" className="cta-button primary">View All Products</Link>
            <Link to="/about" className="cta-button secondary">Learn More</Link>
          </div>
        </div>
      </section>

      <section className="products-container">
        <div className="section-header">
          <h2>Featured Products</h2>
          <p>Discover our most popular farm-fresh items</p>
        </div>
        {loading ? (
          <div className="loading-featured">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="no-featured">
            <p>No products available at the moment.</p>
            <p>Please check back later!</p>
          </div>
        )}
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
