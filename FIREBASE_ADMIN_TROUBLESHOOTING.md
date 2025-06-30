# Firebase Admin Setup - Troubleshooting Guide

## Overview
This guide provides step-by-step troubleshooting for Firebase Admin setup issues, particularly the 400 error when creating admin accounts.

## Quick Setup Commands

### Option 1: Safe Admin Setup (Recommended)
```javascript
// Run in browser console at http://localhost:3000
safeAdminSetup()
```

### Option 2: Run Diagnostics First
```javascript
// Check Firebase configuration and connectivity
runFirebaseDiagnostics()

// Check if email exists in Firestore
checkEmailExists('ranamaitra09@gmail.com')

// Then run setup
safeAdminSetup()
```

### Option 3: Original Setup (if fixed)
```javascript
setupNewAdmin()
```

## Fixed Issues

### 1. Firebase Configuration
**Problem**: Placeholder values in `firebaseConfig.js` causing auth errors.

**Solution**: Updated configuration with proper values:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAKWkMVYl4v-RZOFaPmCjb1f0mdB9TKKWY",
  authDomain: "next-gen-farm.firebaseapp.com",
  projectId: "next-gen-farm",
  storageBucket: "next-gen-farm.appspot.com",
  messagingSenderId: "565479424733",
  appId: "1:565479424733:web:8a9b7c6d5e4f3a2b1c0d9e"
};
```

### 2. Enhanced Error Handling
**Problem**: Generic Firebase errors without specific handling.

**Solution**: Added comprehensive error handling for:
- `auth/email-already-in-use`
- `auth/weak-password`
- `auth/invalid-email`
- `auth/operation-not-allowed`
- `auth/wrong-password`
- `auth/invalid-credential`

### 3. Diagnostic Tools
**Added**: New diagnostic utilities:
- `runFirebaseDiagnostics()` - Check Firebase connectivity
- `checkEmailExists()` - Verify email in Firestore
- `safeAdminSetup()` - Alternative setup with better error handling

## Step-by-Step Troubleshooting

### Step 1: Check Firebase Configuration
1. Open browser console at `http://localhost:3000`
2. Run: `runFirebaseDiagnostics()`
3. Check for:
   - ✅ Auth configuration
   - ✅ Firestore connection
   - ⚠️ User access (optional)

### Step 2: Verify Email Status
```javascript
checkEmailExists('ranamaitra09@gmail.com')
```

### Step 3: Run Safe Admin Setup
```javascript
safeAdminSetup()
```

This function will:
1. Run diagnostics
2. Clean up existing admin accounts
3. Handle email-already-exists scenarios
4. Create/update admin profile
5. Verify setup

### Step 4: Test Sign In
1. Go to `/signin`
2. Use credentials:
   - Email: `ranamaitra09@gmail.com`
   - Password: `Turamina@9`

## Common Error Solutions

### Error: "Email already in use"
**Solution**: The safe setup function automatically handles this by signing in instead of creating.

### Error: "Wrong password"
**Solution**: Either:
1. Use the correct password for the existing account
2. Reset the password in Firebase Console
3. Delete the user in Firebase Console and recreate

### Error: "Operation not allowed"
**Solution**: Enable Email/Password authentication in Firebase Console:
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Email/Password"

### Error: "Network request failed"
**Solution**: Check:
1. Internet connection
2. Firebase project status
3. API key validity

## Verification Commands

### Verify Admin Account
```javascript
verifyAdminSetup('ranamaitra09@gmail.com')
```

### Check Current User
```javascript
console.log('Current user:', auth.currentUser?.email)
```

### List All Admin Users
```javascript
// Run diagnostics to see all admin users
runFirebaseDiagnostics()
```

## Success Indicators

When setup is successful, you should see:
```
🎉 Admin setup completed successfully!
=====================================
✅ Admin Email: ranamaitra09@gmail.com
✅ Admin UID: [user-uid]
✅ Permissions: canManageUsers, canManageProducts, canManageOrders, canAccessAnalytics, canManageSettings, canDeleteData
📱 You can now sign in at /signin
```

## Next Steps

1. **Test Sign In**: Go to `/signin` and use the admin credentials
2. **Access Admin Panel**: After signing in, go to `/admin`
3. **Test OTP**: Enable email verification in profile settings
4. **Test Payment**: Make a test purchase to verify payment flow

## File Locations

- Firebase Config: `src/firebaseConfig.js`
- Diagnostics: `src/utils/firebaseDiagnostics.js`
- Safe Setup: `src/utils/safeAdminSetup.js`
- Original Setup: `src/utils/adminReset.js`

## Support

If issues persist:
1. Check browser console for detailed error messages
2. Verify Firebase project settings in Firebase Console
3. Ensure all Firebase services are enabled
4. Check network connectivity

## Development vs Production

- **Development**: Console logging enabled for debugging
- **Production**: Remove console logs and use environment variables for sensitive data
