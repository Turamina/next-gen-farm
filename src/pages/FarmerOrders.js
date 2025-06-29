import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query,
  getDocs,
  orderBy,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './FarmerOrders.css';

const FarmerOrders = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, processing, completed, cancelled

  useEffect(() => {
    loadFarmerOrders();
  }, [currentUser, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFarmerOrders = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Query orders that contain products from this farmer
      let q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const allOrders = [];
      
      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        // Check if this order contains products from the current farmer
        const farmerProducts = orderData.items?.filter(item => 
          item.farmerId === currentUser.uid
        );
        
        if (farmerProducts && farmerProducts.length > 0) {
          allOrders.push({
            id: doc.id,
            ...orderData,
            farmerItems: farmerProducts,
            farmerTotal: farmerProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          });
        }
      });

      // Apply filter
      let filteredOrders = allOrders;
      if (filter !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === filter);
      }

      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error loading farmer orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      showMessage(`Order status updated to ${newStatus}`, 'success');
      await loadFarmerOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      showMessage('Failed to update order status', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 4000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'processing': return '#17a2b8';
      case 'completed': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="farmer-orders">
        <div className="loading-spinner">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="farmer-orders">
      <div className="orders-header">
        <h1>Order Management</h1>
        <p>Track and manage orders for your products</p>
        
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Orders ({orders.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-tab ${filter === 'processing' ? 'active' : ''}`}
            onClick={() => setFilter('processing')}
          >
            Processing
          </button>
          <button 
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button 
            className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="orders-container">
        {orders.length === 0 ? (
          <div className="no-orders">
            <h3>No orders found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't received any orders yet. Start selling your products!" 
                : `No ${filter} orders found.`
              }
            </p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order.id.slice(-8)}</h3>
                    <div className="order-meta">
                      <span className="order-date">{formatDate(order.createdAt)}</span>
                      <span 
                        className="order-status"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="order-total">
                    <strong>Your Share: ৳{order.farmerTotal?.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="customer-info">
                  <h4>Customer Details</h4>
                  <p><strong>Name:</strong> {order.customerInfo?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {order.customerInfo?.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {order.customerInfo?.phone || 'N/A'}</p>
                  <p><strong>Address:</strong> {order.customerInfo?.address || 'N/A'}</p>
                </div>

                <div className="order-items">
                  <h4>Your Products in this Order</h4>
                  {order.farmerItems?.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-image">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="item-details">
                        <h5>{item.name}</h5>
                        <p>Quantity: {item.quantity} {item.unit}</p>
                        <p>Unit Price: ৳{item.price}</p>
                        <p className="item-total">Total: ৳{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-actions">
                  {order.status === 'pending' && (
                    <>
                      <button 
                        className="btn btn-primary"
                        onClick={() => updateOrderStatus(order.id, 'processing')}
                      >
                        Accept Order
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      >
                        Decline Order
                      </button>
                    </>
                  )}
                  {order.status === 'processing' && (
                    <button 
                      className="btn btn-success"
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                    >
                      Mark as Completed
                    </button>
                  )}
                  {(order.status === 'completed' || order.status === 'cancelled') && (
                    <span className="order-final-status">
                      Order {order.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerOrders;
