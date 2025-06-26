import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './PaymentResult.css';

const PaymentFailed = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const errorMessage = searchParams.get('error_message') || 'We were unable to process your payment.';
  const failureReason = searchParams.get('failed_reason') || '';
  
  useEffect(() => {
    // Clear any payment-related data from localStorage
    localStorage.removeItem('pendingTransactionId');
    localStorage.removeItem('paymentSessionKey');
    localStorage.removeItem('sslCommerzGatewayURL');
    
    // Keep pendingOrder in localStorage so user can try again
  }, []);
  
  return (
    <div className="payment-result-container">
      <div className="payment-result-card failed">
        <div className="result-icon failed">❌</div>
        <h2>Payment Failed</h2>
        <p>{errorMessage}</p>
        {failureReason && <p className="failure-reason">Reason: {failureReason}</p>}
        <p>Please try again or contact customer support if the problem persists.</p>
        <div className="action-buttons">
          <Link to="/profile?tab=cart" className="action-button secondary">Return to Cart</Link>
          <Link to="/support" className="action-button secondary">Contact Support</Link>
          <Link to="/products" className="action-button primary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
