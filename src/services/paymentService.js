/**
 * Payment Service for SSL Commerz Integration
 * This file contains the improved SSL Commerz payment integration
 */

/**
 * Initiates a payment session with SSL Commerz
 * @param {Object} orderData - The order data to process payment for
 * @returns {Promise<Object>} - The payment session response
 */
export const initiateSslCommerzPayment = async (orderData) => {
  try {
    // Ensure EMI is disabled and required fields are present
    const sanitizedOrderData = {
      ...orderData,
      // Disable EMI to prevent API errors
      emi_option: 0,
      emi_max_inst_option: 0,
      emi_selected_inst: 0,
      // Ensure required fields are present
      shipping_method: orderData.shipping_method || 'Courier',
      product_name: orderData.product_name || 'Online Order',
      product_category: orderData.product_category || 'General',
      product_profile: orderData.product_profile || 'general'
    };
    
    console.log('Sending payment data to backend:', sanitizedOrderData);
    
    // Call your backend API instead of SSLCommerz directly
    const response = await fetch('http://localhost:3030/api/initiate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedOrderData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend response error:', response.status, errorText);
      throw new Error(`Failed to initiate payment: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Backend response:', data);
    
    if (data.success && data.GatewayPageURL) {
      window.location.href = data.GatewayPageURL;
      return { success: true, gatewayPageURL: data.GatewayPageURL };
    } else if (data.failedreason) {
      throw new Error(`SSLCommerz Error: ${data.failedreason}`);
    } else {
      throw new Error(data.error || 'No GatewayPageURL');
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Redirects directly to the gateway URL using the provided credentials
 * This is used as a fallback when the API call method fails
 * @param {Object} orderData - The order data 
 * @returns {Boolean} - Success status
 */
const directGatewayRedirect = (orderData) => {
  try {
    // Use the sandbox store ID and password as provided
    const storeId = orderData.store_id || 'algor685c511224e18';
    const storePassword = orderData.store_passwd || 'algor685c511224e18@ssl';

    // First, try to use any previously stored gateway URL from the API response
    const storedGatewayURL = localStorage.getItem('sslCommerzGatewayURL');
    if (storedGatewayURL) {
      window.location.href = storedGatewayURL;
      return true;
    }

    // Use the SANDBOX session API endpoint
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://sandbox.sslcommerz.com/gwprocess/v3/api.php';
    form.target = '_self';

    // Add store credentials
    const addField = (name, value) => {
      const field = document.createElement('input');
      field.type = 'hidden';
      field.name = name;
      field.value = value;
      form.appendChild(field);
    };

    addField('store_id', storeId);
    addField('store_passwd', storePassword);
    
    // Disable EMI to prevent API errors
    addField('emi_option', '0');
    addField('emi_max_inst_option', '0');
    addField('emi_selected_inst', '0');

    // Add all order data fields
    Object.entries(orderData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'store_id' && key !== 'store_passwd') {
        addField(key, value);
      }
    });
    
    // Ensure required fields are present
    if (!orderData.shipping_method) addField('shipping_method', 'Courier');
    if (!orderData.product_name) addField('product_name', 'Online Order');
    if (!orderData.product_category) addField('product_category', 'General');
    if (!orderData.product_profile) addField('product_profile', 'general');

    // Store transaction ID for verification after payment
    localStorage.setItem('pendingTransactionId', orderData.tran_id);

    // Append form to body and submit it
    document.body.appendChild(form);
    form.submit();

    return true;
  } catch (error) {
    console.error('Error in direct gateway redirect:', error);
    return false;
  }
};

/**
 * Verifies a payment using transaction ID and session key
 * @param {String} transactionId - The transaction ID
 * @param {String} sessionKey - The session key
 * @returns {Promise<Object>} - The verification result
 */
export const verifyPayment = async (transactionId, sessionKey) => {
  try {
    // Use the sandbox store ID and password as provided
    const storeId = 'algor685c511224e18';
    const storePassword = 'algor685c511224e18@ssl';

    // SSL Commerz validation API endpoint (SANDBOX)
    const validationUrl = 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';

    // Prepare validation request
    const validationData = {
      val_id: transactionId,
      store_id: storeId,
      store_passwd: storePassword
    };

    // Make validation request
    const response = await fetch(validationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(validationData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: data.status === 'VALID' || data.status === 'VALIDATED',
      data
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify payment'
    };
  }
};

// Default export for the payment service
export default directGatewayRedirect;
