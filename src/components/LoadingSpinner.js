import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
        {/* Static wrapper to ensure text doesn't rotate */}
        <div className="static-text-wrapper">
          <p className="loading-message">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
