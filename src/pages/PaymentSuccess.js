import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { orderService } from '../services/userService';
import { verifyPayment } from '../services/paymentService';
import LoadingSpinner from '../components/LoadingSpinner';
import './PaymentResult.css';

const PaymentSuccess = () => {
  const { currentUser } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('pending');

  useEffect(() => {
    const processPendingOrder = async () => {
      console.log('=== PAYMENT SUCCESS PROCESSING ===');
      console.log('Current user:', currentUser?.uid);
      console.log('Location search:', location.search);
      
      if (!currentUser) {
        console.log('No current user, redirecting to signin');
        navigate('/signin');
        return;
      }

      try {
        setLoading(true);
        
        // Get URL search params from the redirect
        const searchParams = new URLSearchParams(location.search);
        const transactionId = searchParams.get('val_id') || localStorage.getItem('pendingTransactionId');
        const status = searchParams.get('status');
        
        console.log('Transaction ID:', transactionId);
        console.log('Payment Status:', status);
        
        // First check if we have transaction data from URL
        if (status && status.toUpperCase() !== 'VALID' && status.toUpperCase() !== 'SUCCESS') {
          console.log('Payment status not valid:', status);
          setError('Payment was not successful. Status: ' + status);
          setLoading(false);
          return;
        }
        
        // Retrieve pending order from localStorage
        const pendingOrderJson = localStorage.getItem('pendingOrder');
        console.log('Pending order from localStorage:', pendingOrderJson ? 'Found' : 'Not found');
        
        // If no pending order but we have URL params indicating success, show a basic success message
        if (!pendingOrderJson && (status === 'VALID' || status === 'SUCCESS') && transactionId) {
          console.log('No pending order but payment seems successful, showing basic success message');
          setOrderDetails({
            orderId: transactionId,
            totalAmount: 'Unknown',
            items: 'Unknown',
            date: new Date().toLocaleDateString(),
            verificationStatus: 'pending'
          });
          setLoading(false);
          return;
        }
        
        if (!pendingOrderJson) {
          setError('No pending order found');
          setLoading(false);
          return;
        }
        
        const pendingOrder = JSON.parse(pendingOrderJson);
        console.log('Parsed pending order:', pendingOrder);
        
        // Check if the order belongs to the current user
        if (pendingOrder.orderData.value_a !== currentUser.uid) {
          console.log('Order user mismatch:', pendingOrder.orderData.value_a, 'vs', currentUser.uid);
          setError('Order user mismatch');
          setLoading(false);
          return;
        }
        
        // Verify payment status with SSL Commerz
        const sessionKey = localStorage.getItem('paymentSessionKey');
        let currentVerificationStatus = 'pending';
        
        if (transactionId && sessionKey) {
          try {
            setVerificationStatus('verifying');
            currentVerificationStatus = 'verifying';
            const verificationResult = await verifyPayment(transactionId, sessionKey);
            
            if (!verificationResult.success) {
              console.warn('Payment verification warning:', verificationResult.error);
              setVerificationStatus('warning');
              currentVerificationStatus = 'warning';
              // Continue with order processing even if verification has issues
            } else {
              setVerificationStatus('verified');
              currentVerificationStatus = 'verified';
            }
          } catch (verificationError) {
            console.error('Payment verification error:', verificationError);
            setVerificationStatus('error');
            currentVerificationStatus = 'error';
            // Continue with order processing even if verification fails
          }
        }
        
        // Extract cart items from the pending order
        const cartItems = pendingOrder.cartItems;
        
        // Create order data structure
        const orderData = {
          items: cartItems,
          totalAmount: pendingOrder.orderData.total_amount,
          subtotal: pendingOrder.orderData.total_amount * 0.95, // 5% tax
          tax: pendingOrder.orderData.total_amount * 0.05,
          shipping: 60, // Fixed shipping cost
          discount: 0,
          deliveryAddress: {
            street: pendingOrder.orderData.ship_add1,
            city: pendingOrder.orderData.ship_city,
            state: pendingOrder.orderData.ship_state,
            zipCode: pendingOrder.orderData.ship_postcode,
            country: pendingOrder.orderData.ship_country,
            phone: pendingOrder.orderData.cus_phone
          },
          paymentMethod: 'ssl_commerz',
          paymentId: transactionId || pendingOrder.orderData.tran_id,
          paymentStatus: 'completed',
          status: 'processing',
          paymentDetails: {
            transactionId: transactionId || pendingOrder.orderData.tran_id,
            paymentMethod: 'ssl_commerz',
            currency: pendingOrder.orderData.currency,
            verificationStatus: currentVerificationStatus,
            customerInfo: {
              name: pendingOrder.orderData.cus_name,
              email: pendingOrder.orderData.cus_email,
              phone: pendingOrder.orderData.cus_phone
            },
            paymentDate: new Date().toISOString()
          },
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
        };
        
        // Create the order in the database
        console.log('Creating order in database...');
        const result = await orderService.createOrder(currentUser.uid, orderData);
        console.log('Order created successfully:', result);
        
        // Update order details for display
        setOrderDetails({
          orderId: result.orderId,
          totalAmount: orderData.totalAmount,
          items: cartItems.length,
          date: new Date().toLocaleDateString(),
          verificationStatus: currentVerificationStatus
        });
        
        console.log('Order details set:', {
          orderId: result.orderId,
          totalAmount: orderData.totalAmount,
          items: cartItems.length,
          verificationStatus: currentVerificationStatus
        });
        
        // Clear the pending order from localStorage
        localStorage.removeItem('pendingOrder');
        localStorage.removeItem('pendingTransactionId');
        localStorage.removeItem('paymentSessionKey');
        localStorage.removeItem('sslCommerzGatewayURL');
        
        // Clear the cart
        await clearCart();
        console.log('Cart cleared and localStorage cleaned up');
        
      } catch (error) {
        console.error('Error processing order:', error);
        console.error('Error stack:', error.stack);
        setError(`Failed to process your order: ${error.message}. Please contact customer support.`);
      } finally {
        setLoading(false);
        console.log('Payment processing completed');
      }
    };

    processPendingOrder();
  }, [currentUser, navigate, location, clearCart]);

  if (loading) {
    return (
      <div className="payment-result-container">
        <div className="payment-result-card loading">
          <LoadingSpinner />
          <h2>Processing your payment...</h2>
          <p>Please wait while we confirm your order.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-result-container">
        <div className="payment-result-card error">
          <div className="result-icon error">❌</div>
          <h2>Error Processing Payment</h2>
          <p>{error}</p>
          <div className="action-buttons">
            <Link to="/profile?tab=cart" className="action-button secondary">Return to Cart</Link>
            <Link to="/products" className="action-button primary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-container">
      <div className="payment-result-card success">
        <div className="result-icon success">✅</div>
        <h2>Payment Successful!</h2>
        <p>Thank you for your purchase. Your order has been successfully placed.</p>
        
        {orderDetails && (
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="order-info">
              <p><strong>Order ID:</strong> {orderDetails.orderId}</p>
              <p><strong>Date:</strong> {orderDetails.date}</p>
              <p><strong>Items:</strong> {orderDetails.items}</p>
              <p><strong>Total:</strong> ৳{orderDetails.totalAmount}</p>
              {orderDetails.verificationStatus !== 'pending' && (
                <p><strong>Verification:</strong> {orderDetails.verificationStatus === 'verified' 
                  ? 'Payment Verified ✓' 
                  : orderDetails.verificationStatus === 'warning'
                  ? 'Verification Pending (will be confirmed soon)'
                  : 'Pending Verification'}</p>
              )}
            </div>
          </div>
        )}
        
        <div className="action-buttons">
          <Link to="/profile?tab=orders" className="action-button secondary">View Orders</Link>
          <Link to="/products" className="action-button primary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
