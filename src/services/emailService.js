/**
 * Email Service for OTP Verification
 * Uses Gmail SMTP with app password for sending OTP emails
 */

// Generate a 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP temporarily (in production, use Redis or database)
const otpStore = new Map();

// Email configuration
const EMAIL_CONFIG = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'rana18@cse.pstu.ac.bd',
    pass: 'mhkk tuwz chwn xnnx' // App password
  }
};

/**
 * Send OTP via email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} type - 'signin' or 'signup'
 * @param {string} userType - 'farmer' or 'customer'
 */
export const sendOTPEmail = async (email, otp, type = 'signin', userType = 'customer') => {
  try {
    console.log(`Sending OTP ${otp} to ${email} for ${type} as ${userType}`);
    
    // In development, we'll simulate email sending
    // In production, you would use nodemailer or email service
    
    // Store OTP with expiration (5 minutes)
    const otpData = {
      otp,
      email,
      type,
      userType,
      timestamp: Date.now(),
      expires: Date.now() + (5 * 60 * 1000) // 5 minutes
    };
    
    otpStore.set(email, otpData);
    
    // Simulate email sending to backend
    const response = await fetch('http://localhost:3030/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        otp,
        type,
        userType,
        emailConfig: EMAIL_CONFIG
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Email sent successfully:', result);
    
    return {
      success: true,
      message: 'OTP sent successfully',
      otpId: email // Using email as ID for simplicity
    };
    
  } catch (error) {
    console.error('Error sending OTP email:', error);
    
    // Fallback: still store OTP for development testing
    const otpData = {
      otp,
      email,
      type,
      userType,
      timestamp: Date.now(),
      expires: Date.now() + (5 * 60 * 1000)
    };
    
    otpStore.set(email, otpData);
    
    // Show OTP in console for development
    console.log(`🔐 Development OTP for ${email}: ${otp}`);
    
    return {
      success: true,
      message: 'OTP sent (development mode)',
      otpId: email,
      developmentOTP: otp // Only for development
    };
  }
};

/**
 * Verify OTP
 * @param {string} email - User email
 * @param {string} otp - OTP to verify
 */
export const verifyOTP = (email, otp) => {
  try {
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return {
        success: false,
        message: 'OTP not found or expired'
      };
    }
    
    // Check if OTP is expired
    if (Date.now() > storedData.expires) {
      otpStore.delete(email);
      return {
        success: false,
        message: 'OTP has expired'
      };
    }
    
    // Check if OTP matches
    if (storedData.otp !== otp) {
      return {
        success: false,
        message: 'Invalid OTP'
      };
    }
    
    // OTP is valid, remove from store
    otpStore.delete(email);
    
    return {
      success: true,
      message: 'OTP verified successfully',
      data: {
        email: storedData.email,
        type: storedData.type,
        userType: storedData.userType
      }
    };
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Error verifying OTP'
    };
  }
};

/**
 * Resend OTP
 * @param {string} email - User email
 */
export const resendOTP = async (email) => {
  try {
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return {
        success: false,
        message: 'No active OTP session found'
      };
    }
    
    // Generate new OTP
    const newOTP = generateOTP();
    
    // Send new OTP
    return await sendOTPEmail(email, newOTP, storedData.type, storedData.userType);
    
  } catch (error) {
    console.error('Error resending OTP:', error);
    return {
      success: false,
      message: 'Error resending OTP'
    };
  }
};

/**
 * Clean expired OTPs (call this periodically)
 */
export const cleanExpiredOTPs = () => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expires) {
      otpStore.delete(email);
    }
  }
};

// Clean expired OTPs every 5 minutes
setInterval(cleanExpiredOTPs, 5 * 60 * 1000);

export default {
  generateOTP,
  sendOTPEmail,
  verifyOTP,
  resendOTP,
  cleanExpiredOTPs
};
