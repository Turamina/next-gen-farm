# 🧪 Email Verification Testing Guide

## Quick Test Instructions

### 1. Start the Application
```bash
# Terminal 1 - Backend Server
cd "d:\next_gen_farm\next-gen-farm"
node server.js

# Terminal 2 - Frontend Server  
npm start
```

### 2. Test Sign Up with OTP
1. Go to Sign Up page
2. Fill out the form with your email
3. Submit the form
4. **Look for OTP in browser console** (Development mode)
5. Enter the 6-digit OTP in the verification modal
6. Account should be created successfully

### 3. Test Sign In with OTP
1. Go to Sign In page
2. Enter credentials for an account with email verification enabled
3. **Look for OTP in browser console** (Development mode)
4. Enter the 6-digit OTP
5. Sign in should complete successfully

### 4. Test Settings Toggle
**For Customers:**
1. Sign in as customer
2. Go to Profile → Preferences → Security
3. Toggle "Email verification" on/off
4. Setting should save automatically

**For Farmers:**
1. Sign in as farmer
2. Go to Dashboard → Account Settings (click "Show Settings")
3. Toggle "Email Verification for Sign In" on/off
4. Setting should save with success message

### 5. Test Email Delivery (if configured)
1. Use a real email address during sign up/sign in
2. Check email inbox for verification code
3. Check spam folder if not in inbox
4. Email should have professional Next Gen Farm template

## Expected Behavior

### ✅ Success Indicators
- OTP codes appear in browser console (development)
- OTP verification modal appears and functions
- Settings toggle works without errors
- Account creation/sign in completes after OTP verification
- Professional emails delivered (if email configured)

### ❌ Common Issues & Solutions

**Issue**: "Failed to send verification email"
**Solution**: Backend server not running or nodemailer not installed

**Issue**: OTP verification fails
**Solution**: Check browser console for the correct OTP code

**Issue**: Settings don't save
**Solution**: Check Firestore permissions and user authentication

**Issue**: Modal doesn't appear
**Solution**: Check for JavaScript errors in console

## Development Notes

### Console Output to Watch For:
```
🔐 Development OTP for user@example.com: 123456
📧 Email sent successfully for signin verification
✅ OTP verified successfully, completing signin...
Email verification enabled successfully!
```

### Network Requests:
- `POST /api/send-otp` - Should return success
- Firestore updates for user preferences
- No 404 or 500 errors

### Browser Console:
- No React errors or warnings
- OTP codes displayed for testing
- Verification success/failure messages

## Production Deployment Checklist

### Before Going Live:
- [ ] Remove console.log OTP display
- [ ] Configure proper email SMTP settings
- [ ] Test email delivery to multiple providers
- [ ] Set up email monitoring/logging
- [ ] Configure rate limiting for OTP requests
- [ ] Test with real email addresses
- [ ] Verify all error handling paths

---

**Quick Start**: Run both servers, try sign up with any email, use the OTP from browser console to verify, then test the settings toggle in your profile.
