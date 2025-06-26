// SSL Commerz Implementation
const initiateSslCommerzPayment = async () => {
  if (cartItems.length === 0) {
    setError('Your cart is empty. Please add items to your cart before checkout.');
    return;
  }
  
  // Check if profile has required delivery information
  const hasRequiredInfo = 
    profileData.address?.street && 
    profileData.address?.city && 
    profileData.address?.state && 
    profileData.address?.zipCode && 
    profileData.phoneNumber;
  
  if (!hasRequiredInfo) {
    if (window.confirm('Your profile is missing some required delivery information. Would you like to update your profile first?')) {
      setActiveTab('profile');
      return;
    }
  }

  setIsLoading(true);
  setError('');
  setMessage('Preparing your checkout. Please wait...');
  
  try {
    // Create a unique transaction ID
    const transactionId = 'NGF-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    // Prepare order data for payment
    const orderData = {
      total_amount: getCartTotal(),
      currency: 'BDT',
      tran_id: transactionId,
      success_url: window.location.origin + '/payment-success',
      fail_url: window.location.origin + '/payment-failed',
      cancel_url: window.location.origin + '/payment-canceled',
      ipn_url: 'https://nextgenfarm.com/api/ipn', // You'll need to set up an IPN endpoint
      shipping_method: 'Courier',
      product_name: cartItems.map(item => item.productName).join(', ').substring(0, 255),
      product_category: 'Farm Products',
      product_profile: 'general',
      cus_name: profileData.displayName || currentUser.displayName || 'Customer',
      cus_email: profileData.email || currentUser.email,
      cus_add1: profileData.address?.street || 'Address Line 1',
      cus_add2: '',
      cus_city: profileData.address?.city || 'City',
      cus_state: profileData.address?.state || 'State',
      cus_postcode: profileData.address?.zipCode || '1000',
      cus_country: profileData.address?.country || 'Bangladesh',
      cus_phone: profileData.phoneNumber || '01XXXXXXXXX',
      ship_name: profileData.displayName || currentUser.displayName || 'Customer',
      ship_add1: profileData.address?.street || 'Address Line 1',
      ship_city: profileData.address?.city || 'City',
      ship_state: profileData.address?.state || 'State',
      ship_postcode: profileData.address?.zipCode || '1000',
      ship_country: profileData.address?.country || 'Bangladesh',
      multi_card_name: '',
      value_a: currentUser.uid,
      value_b: JSON.stringify(cartItems).substring(0, 255), // Limit size to prevent issues
      value_c: '',
      value_d: ''
    };
    
    // Store order data in localStorage for retrieval after payment completion
    localStorage.setItem('pendingOrder', JSON.stringify({
      orderData,
      cartItems,
      timestamp: Date.now()
    }));
    
    // SSL Commerz API endpoint (v4 for better compatibility)
    const sslCommerzUrl = 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';
    
    // SSL Commerz store credentials (using your sandbox credentials)
    const storeId = 'algor670ab401dbbcc';
    const storePassword = 'algor670ab401dbbcc@ssl';
    
    setMessage('Connecting to payment gateway...');
    
    // Instead of a direct fetch, use a form submission approach which avoids CORS issues
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = sslCommerzUrl;
    form.target = '_self';
    
    // Add store credentials and all fields to the form
    const addField = (name, value) => {
      const field = document.createElement('input');
      field.type = 'hidden';
      field.name = name;
      field.value = value;
      form.appendChild(field);
    };
    
    addField('store_id', storeId);
    addField('store_passwd', storePassword);
    
    // Add all order data fields
    Object.entries(orderData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        addField(key, value);
      }
    });
    
    // Append form to body and submit it
    document.body.appendChild(form);
    form.submit();
    
    // Set a timeout to handle cases where form submission doesn't redirect
    setTimeout(() => {
      setIsLoading(false);
      setError('Payment gateway connection timeout. Please try again later.');
    }, 30000);
    
  } catch (error) {
    console.error('Error initiating payment:', error);
    let errorMessage = 'Failed to initiate payment. Please try again.';
    
    // Display more detailed error information
    if (error.message) {
      errorMessage += ` Error details: ${error.message}`;
    }
    
    setError(errorMessage);
    setIsLoading(false);
  }
};
