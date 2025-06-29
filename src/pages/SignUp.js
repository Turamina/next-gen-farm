import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { accountService } from '../services/accountService';
import './SignUp.css';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    accountType: 'customer', // new field for account type
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
    farmName: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
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

    // Common validations for both account types
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{11}$/.test(formData.phoneNumber.replace(/[^0-9]/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid 11-digit phone number';
    }

    // Farmer-specific validations
    if (formData.accountType === 'farmer') {
      if (!formData.farmName.trim()) {
        newErrors.farmName = 'Farm name is required for farmer accounts';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      console.log('🔄 Starting account creation process...');
      
      // Create user account with Firebase
      console.log('📝 Step 1: Creating Firebase user account...');
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('✅ Step 1 completed: Firebase user created', userCredential.user.uid);
      
      // Update user profile with name
      console.log('📝 Step 2: Updating user profile with display name...');
      await updateProfile(userCredential.user, {
        displayName: `${formData.firstName} ${formData.lastName}`
      });
      console.log('✅ Step 2 completed: Display name updated');
      
      // Create user profile based on account type
      console.log('📝 Step 3: Creating user profile in database...');
      const profileData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        phoneNumber: formData.phoneNumber,
        farmName: formData.farmName,
        address: {
          street: formData.address,
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        accountType: formData.accountType
      };
      
      if (formData.accountType === 'farmer') {
        console.log('📝 Step 3a: Creating farmer profile in farmers collection...');
        await accountService.createFarmerProfile(userCredential.user.uid, profileData);
        console.log('✅ Step 3a completed: Farmer profile created in farmers collection');
        console.log('🎯 Redirecting farmer to dashboard...');
        navigate('/farmer/dashboard');
      } else {
        console.log('📝 Step 3b: Creating customer profile in customers collection...');
        await accountService.createCustomerProfile(userCredential.user.uid, profileData);
        console.log('✅ Step 3b completed: Customer profile created in customers collection');
        console.log('🎯 Redirecting customer to home...');
        navigate('/');
      }
      
    } catch (error) {
      console.error('Error creating user:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);
      
      let errorMessage = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Firebase configuration error. Please contact support.';
      } else if (error.code === 'auth/project-not-found') {
        errorMessage = 'Firebase project not found. Please contact support.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Database permission denied. Please contact support to fix Firestore rules.';
      } else if (error.message && error.message.includes('Missing or insufficient permissions')) {
        errorMessage = 'Database permissions not set up correctly. Please contact support to configure Firestore rules.';
      } else if (error.message && error.message.includes('PERMISSION_DENIED')) {
        errorMessage = 'Access denied. Please ensure Firestore database is properly configured.';
      } else {
        errorMessage = `Account creation failed: ${error.message}`;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-background">
        <div className="signup-card">
          <div className="signup-header">
            <div className="farm-icon">🐄</div>
            <h1>Join Next Gen Farm</h1>
            <p>
              {formData.accountType === 'farmer' 
                ? 'Create your farmer account to start selling products' 
                : 'Create your customer account to access fresh farm products'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            {/* Account Type Selection */}
            <div className="form-group account-type-group">
              <label>Account Type *</label>
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
                      <p>Buy fresh farm products</p>
                      <small>Required: Name, Email, Phone</small>
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
                      <p>Sell your farm products</p>
                      <small>Required: Name, Email, Phone, Farm Name</small>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Show requirements summary */}
            <div className="requirements-summary">
              <h4>Required Information:</h4>
              <ul>
                <li>✓ Full Name</li>
                <li>✓ Email Address</li>
                <li>✓ Phone Number</li>
                <li>✓ Password</li>
                {formData.accountType === 'farmer' && <li>✓ Farm Name</li>}
              </ul>
              <p className="optional-note">
                <strong>Optional:</strong> Address (can be added later from your profile)
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={errors.firstName ? 'error' : ''}
                  placeholder="Enter your first name"
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={errors.lastName ? 'error' : ''}
                  placeholder="Enter your last name"
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
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
              <label htmlFor="phoneNumber">Phone Number *</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={errors.phoneNumber ? 'error' : ''}
                placeholder="Enter your 11-digit phone number"
              />
              {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
            </div>

            {/* Show Farm Name field only for farmers */}
            {formData.accountType === 'farmer' && (
              <div className="form-group">
                <label htmlFor="farmName">Farm Name *</label>
                <input
                  type="text"
                  id="farmName"
                  name="farmName"
                  value={formData.farmName}
                  onChange={handleChange}
                  className={errors.farmName ? 'error' : ''}
                  placeholder="Enter your farm name"
                />
                {errors.farmName && <span className="error-message">{errors.farmName}</span>}
              </div>
            )}

            <div className="form-row">              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <div className="password-input-container">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? 'error' : ''}
                    placeholder="Create a password"
                  />
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
                <div className="password-requirements">
                  <p>Password must contain:</p>
                  <ul>
                    <li className={formData.password.length >= 8 ? 'met' : ''}>
                      At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(formData.password) ? 'met' : ''}>
                      One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(formData.password) ? 'met' : ''}>
                      One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(formData.password) ? 'met' : ''}>
                      One number
                    </li>
                    <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'met' : ''}>
                      One special character
                    </li>
                  </ul>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Address (Optional)</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your full address (you can update this later in your profile)"
                rows="3"
              />
              <small className="field-note">
                You can update your address later from your profile settings
              </small>
            </div>

            {errors.submit && (
              <div className="form-group">
                <span className="error-message submit-error">{errors.submit}</span>
              </div>
            )}

            <button type="submit" className="signup-btn" disabled={isLoading}>
              <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
              <div className="btn-icon">🌱</div>
            </button>
          </form>

          <div className="signup-footer">
            <p>Already have an account? <Link to="/signin" className="signin-link">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
