import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { accountService } from '../services/accountService';
import './SignIn.css';

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    accountType: 'customer' // new field for account type selection
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Sign in user with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('User signed in successfully:', userCredential.user.email);
      
      // Check the appropriate database based on account type
      let userProfile = null;
      
      if (formData.accountType === 'farmer') {
        console.log('🔍 Looking for farmer profile in farmers collection...');
        userProfile = await accountService.getFarmerProfile(userCredential.user.uid);
        if (userProfile) {
          console.log('✅ Farmer profile found, updating last login...');
          await accountService.updateLastLogin(userCredential.user.uid, 'farmer');
          console.log('🎯 Redirecting farmer to dashboard...');
          navigate('/farmer/dashboard');
        } else {
          throw new Error('Farmer profile not found in farmers collection. Please check your account type or contact support.');
        }
      } else {
        console.log('🔍 Looking for customer profile in customers collection...');
        userProfile = await accountService.getCustomerProfile(userCredential.user.uid);
        if (userProfile) {
          console.log('✅ Customer profile found, updating last login...');
          await accountService.updateLastLogin(userCredential.user.uid, 'customer');
          console.log('🎯 Redirecting customer to home...');
          navigate('/');
        } else {
          throw new Error('Customer profile not found in customers collection. Please check your account type or contact support.');
        }
      }
      
    } catch (error) {
      console.error('Error signing in:', error);
      
      let errorMessage = 'Failed to sign in. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-background">
        <div className="signin-card">
          <div className="signin-header">
            <div className="farm-icon">🐄</div>
            <h1>Welcome Back</h1>
            <p>Sign in to your Next Gen Farm account</p>
          </div>

          <form onSubmit={handleSignIn} className="signin-form">
            {/* Account Type Selection */}
            <div className="form-group account-type-group">
              <label>Sign in as *</label>
              <div className="account-type-options">
                <label className={`account-type-option ${formData.accountType === 'customer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="accountType"
                    value="customer"
                    checked={formData.accountType === 'customer'}
                    onChange={handleChange}
                  />
                  <div className="option-content">
                    <div className="option-icon">🛒</div>
                    <div className="option-text">
                      <h3>Customer</h3>
                    </div>
                  </div>
                </label>
                <label className={`account-type-option ${formData.accountType === 'farmer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="accountType"
                    value="farmer"
                    checked={formData.accountType === 'farmer'}
                    onChange={handleChange}
                  />
                  <div className="option-content">
                    <div className="option-icon">🌾</div>
                    <div className="option-text">
                      <h3>Farmer</h3>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="Enter your email address"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                placeholder="Enter your password"
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-options">
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot your password?
              </Link>
            </div>

            {errors.submit && (
              <div className="form-group">
                <span className="error-message submit-error">{errors.submit}</span>
              </div>
            )}

            <button type="submit" className="signin-btn" disabled={isLoading}>
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <div className="btn-icon">🔐</div>
            </button>
          </form>

          <div className="signin-footer">
            <p>Don't have an account? <Link to="/signup" className="signup-link">Create Account</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;