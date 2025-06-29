import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import advanced SSL Commerz EMI blocker first
import './utils/sslcommerzEMIBlocker';
// Import general error suppression
import './utils/errorSuppression';

// Enable production mode if not in development
if (process.env.NODE_ENV === 'production') {
  // React automatically optimizes in production builds
  console.log('Application running in production mode');
} else {
  console.log('Application running in development mode');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
