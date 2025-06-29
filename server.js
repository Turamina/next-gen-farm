// Moved from project root. Backend for SSLCommerz payment gateway integration.
const express = require('express');
const SSLCommerzPayment = require('sslcommerz-lts');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const store_id = 'algor685c511224e18';
const store_passwd = 'algor685c511224e18@ssl';
const is_live = false; // false for sandbox, true for live

// Initiate payment session
app.post('/api/initiate-payment', async (req, res) => {
    const frontendBaseUrl = req.headers.origin || 'http://localhost:3000';
    const orderData = {
        ...req.body,
        store_id,
        store_passwd,
        success_url: `${frontendBaseUrl}/payment-success`,
        fail_url: `${frontendBaseUrl}/payment-failed`,
        cancel_url: `${frontendBaseUrl}/payment-canceled`,
        ipn_url: 'http://localhost:3030/ipn',
        // Disable EMI to prevent API errors
        emi_option: 0,
        emi_max_inst_option: 0,
        emi_selected_inst: 0,
        // Add required fields to prevent API errors
        shipping_method: req.body.shipping_method || 'Courier',
        product_name: req.body.product_name || 'Online Order',
        product_category: req.body.product_category || 'General',
        product_profile: req.body.product_profile || 'general'
    };
    
    console.log('Initiating payment with data:', JSON.stringify(orderData, null, 2));
    
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    try {
        const apiResponse = await sslcz.init(orderData);
        console.log('SSL Commerz response:', apiResponse);
        
        if (apiResponse.GatewayPageURL) {
            res.json({ success: true, GatewayPageURL: apiResponse.GatewayPageURL });
        } else {
            console.error('No GatewayPageURL in response:', apiResponse);
            res.status(400).json({ success: false, error: apiResponse.failedreason || 'No GatewayPageURL returned' });
        }
    } catch (err) {
        console.error('SSL Commerz error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Validate payment (for IPN or after redirect)
app.post('/api/validate-payment', async (req, res) => {
    const { val_id } = req.body;
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    try {
        const data = await sslcz.validate({ val_id });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check route for backend
app.get('/', (req, res) => {
    res.send('SSLCommerz backend is running.');
});

// Serve React build for production (commented out to avoid conflicts in development)
// app.use(express.static(path.join(__dirname, 'build')));
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

// --- SSLCommerz DEMO/TEST ROUTE for direct gateway testing ---
app.get('/test-ssl-gateway', (req, res) => {
    const SSLCommerzPayment = require('sslcommerz-lts');
    const store_id = 'algor685c511224e18';
    const store_passwd = 'algor685c511224e18@ssl';
    const is_live = false;
    const data = {
        total_amount: 100,
        currency: 'BDT',
        tran_id: 'REF' + Date.now(),
        success_url: 'http://localhost:3030/success',
        fail_url: 'http://localhost:3030/fail',
        cancel_url: 'http://localhost:3030/cancel',
        ipn_url: 'http://localhost:3030/ipn',
        shipping_method: 'Courier',
        product_name: 'Test Product',
        product_category: 'Test',
        product_profile: 'general',
        cus_name: 'Test User',
        cus_email: 'test@example.com',
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Test User',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    sslcz.init(data).then(apiResponse => {
        let GatewayPageURL = apiResponse.GatewayPageURL;
        if (GatewayPageURL) {
            res.redirect(GatewayPageURL);
            console.log('Redirecting to: ', GatewayPageURL);
        } else {
            res.send('Failed to get GatewayPageURL: ' + JSON.stringify(apiResponse));
        }
    });
});

const port = 3030;
app.listen(port, () => {
    console.log(`SSLCommerz backend running at http://localhost:${port}`);
});
