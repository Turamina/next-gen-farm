import React, { useState, useEffect } from 'react';
import { verifyOTP, resendOTP } from '../services/emailService';
import './OTPVerification.css';

const OTPVerification = ({ 
  email, 
  type = 'signin', 
  userType = 'customer',
  onVerified, 
  onCancel,
  isVisible = false
}) => {
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (timeLeft > 0 && isVisible) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isVisible]);

  const handleOTPChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOTP = [...otp];
      newOTP[index] = value;
      setOTP(newOTP);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
      
      // Auto-verify when all fields are filled
      if (newOTP.every(digit => digit !== '') && newOTP.join('').length === 6) {
        handleVerifyOTP(newOTP.join(''));
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOTP = async (otpCode = null) => {
    const codeToVerify = otpCode || otp.join('');
    
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyOTP(email, codeToVerify);
      
      if (result.success) {
        setSuccess('Verification successful!');
        setTimeout(() => {
          onVerified(result.data);
        }, 1000);
      } else {
        setError(result.message);
        // Clear OTP fields on error
        setOTP(['', '', '', '', '', '']);
        const firstInput = document.getElementById('otp-0');
        if (firstInput) firstInput.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await resendOTP(email);
      
      if (result.success) {
        setSuccess('New OTP sent to your email');
        setResendCooldown(60); // 60 seconds cooldown
        setTimeLeft(300); // Reset timer
        setOTP(['', '', '', '', '', '']);
        
        // Show development OTP in console if available
        if (result.developmentOTP) {
          console.log(`🔐 Development OTP for ${email}: ${result.developmentOTP}`);
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="otp-overlay">
      <div className="otp-container">
        <div className="otp-header">
          <h2>Email Verification</h2>
          <p>
            We've sent a verification code to<br />
            <strong>{email}</strong>
          </p>
          <p className="otp-subtitle">
            Enter the 6-digit code to {type === 'signin' ? 'sign in' : 'complete registration'}
          </p>
        </div>

        <div className="otp-input-group">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              value={digit}
              onChange={(e) => handleOTPChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`otp-input ${error ? 'error' : ''} ${success ? 'success' : ''}`}
              maxLength="1"
              autoComplete="off"
              disabled={loading}
            />
          ))}
        </div>

        {error && <div className="otp-error">{error}</div>}
        {success && <div className="otp-success">{success}</div>}

        <div className="otp-timer">
          {timeLeft > 0 ? (
            <p>Code expires in: <strong>{formatTime(timeLeft)}</strong></p>
          ) : (
            <p className="expired">Verification code has expired</p>
          )}
        </div>

        <div className="otp-actions">
          <button
            type="button"
            onClick={handleVerifyOTP}
            className="btn-verify"
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <button
            type="button"
            onClick={handleResendOTP}
            className="btn-resend"
            disabled={loading || resendCooldown > 0}
          >
            {resendCooldown > 0 
              ? `Resend in ${resendCooldown}s` 
              : 'Resend Code'
            }
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="btn-cancel"
            disabled={loading}
          >
            Cancel
          </button>
        </div>

        <div className="otp-info">
          <p>
            <strong>Note:</strong> Check your spam folder if you don't see the email.
          </p>
          <p>
            For security, this code will expire in 5 minutes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
