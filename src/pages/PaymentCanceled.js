import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './PaymentResult.css';

const PaymentCanceled = () => {
  useEffect(() => {
    // Clean up SSL Commerz session data but keep the order data
    // so the user can try again if they want
    localStorage.removeItem('pendingTransactionId');
    localStorage.removeItem('paymentSessionKey');
    localStorage.removeItem('sslCommerzGatewayURL');
  }, []);

  return (
    <div className="payment-result-container">
      <div className="payment-result-card canceled">
        <div className="result-icon canceled">🚫</div>
        <h2>Payment Canceled</h2>
        <p>Your payment has been canceled. No charges have been made.</p>
        <p>Your cart items are still saved if you'd like to try again.</p>
        <div className="action-buttons">
          <Link to="/profile?tab=cart" className="action-button secondary">Return to Cart</Link>
          <Link to="/checkout" className="action-button secondary">Try Again</Link>
          <Link to="/products" className="action-button primary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCanceled;
