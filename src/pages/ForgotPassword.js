import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import './SignIn.css'; // Reuse SignIn styles

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox for instructions.');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      
      let errorMessage = 'Failed to send password reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-background">
        <div className="signin-card">
          <div className="signin-header">
            <div className="farm-icon">🔐</div>
            <h1>Reset Password</h1>
            <p>Enter your email address and we'll send you a link to reset your password</p>
          </div>

          <form onSubmit={handleSubmit} className="signin-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={error ? 'error' : ''}
                placeholder="Enter your email address"
              />
              {error && <span className="error-message">{error}</span>}
            </div>

            {message && (
              <div className="form-group">
                <div className="success-message-inline">{message}</div>
              </div>
            )}

            <button type="submit" className="signin-btn" disabled={isLoading}>
              <span>{isLoading ? 'Sending...' : 'Send Reset Email'}</span>
              <div className="btn-icon">📧</div>
            </button>
          </form>

          <div className="signin-footer">
            <p>Remember your password? <Link to="/signin" className="signup-link">Sign In</Link></p>
            <p>Don't have an account? <Link to="/signup" className="signup-link">Create Account</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
