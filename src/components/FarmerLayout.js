import React from 'react';
import FarmerHeader from '../components/FarmerHeader';
import Footer from '../components/Footer';
import './FarmerLayout.css';

const FarmerLayout = ({ children }) => {
  return (
    <div className="farmer-layout">
      <FarmerHeader />
      <main className="farmer-main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default FarmerLayout;
