import React, { useState, useEffect } from 'react';
import './SuccessMessage.css';

const SuccessMessage = ({ message, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="success-message">
      <div className="success-content">
        <span className="success-icon">✅</span>
        <span className="success-text">{message}</span>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default SuccessMessage;
