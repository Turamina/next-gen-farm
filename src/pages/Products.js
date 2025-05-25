import React from 'react';
import './Products.css';
import ProductCard from '../components/ProductCard';
import dummyProducts from '../data/products';

function Products() {
  return (
    <div className="products-container">
      <h1>Our Products</h1>
      <div className="products-grid">
        {dummyProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default Products;
