# 🔑 Admin Account Setup - Console Commands

## Quick Setup Instructions

### 1. Open Browser Console
1. Start your application (`npm start`)
2. Open browser and go to your app: `http://localhost:3000`
3. Press `F12` to open Developer Tools
4. Go to the **Console** tab

### 2. Run Admin Setup Command

#### Option A: Safe Setup (Recommended)
```javascript
safeAdminSetup()
```

#### Option B: Check Configuration First
```javascript
runFirebaseDiagnostics()
```
Then run:
```javascript
safeAdminSetup()
```

#### Option C: Original Setup (if working)
```javascript
setupNewAdmin()
```

### 3. Verify Setup
```javascript
verifyAdminSetup()
```

### 4. Test Admin Login
1. Go to `/signin` page
2. Sign in with:
   - **Email**: `ranamaitra09@gmail.com`
   - **Password**: `Turamina@9`
3. You should be able to access the admin panel

## Diagnostic Commands

### Check Firebase Status
```javascript
runFirebaseDiagnostics()
```

### Check if Email Exists
```javascript
checkEmailExists('ranamaitra09@gmail.com')
```

### Check Current User
```javascript
console.log('Current user:', auth.currentUser?.email || 'Not signed in')
```

## Admin Permissions
The new admin account will have these permissions:
- ✅ Manage Products
- ✅ Manage Orders
- ✅ Manage Users
- ✅ Manage Farmers  
- ✅ Manage Customers
- ✅ View Analytics
- ✅ System Settings
- ✅ Manage Payments
- ✅ Manage Admins

## What Gets Deleted
The setup process will remove:
- All entries from `adminUsers` Firestore collection
- Admin flags from all users in `users` collection
- All existing admin permissions

## Troubleshooting

### Issue: "setupNewAdmin is not defined"
**Solution**: Refresh the page and try again. The function needs to load first.

### Issue: Permission denied errors
**Solution**: Check your Firestore security rules allow admin operations.

### Issue: Email already in use error
**Solution**: The command will handle this automatically and sign in instead.

### Issue: Can't access admin panel after setup
**Solution**: 
1. Clear browser cache/localStorage
2. Sign out and sign in again
3. Check browser console for errors

## Console Commands Reference

```javascript
// Setup new admin (removes all existing admins)
setupNewAdmin()

// Verify admin setup
verifyAdminSetup()

// Check current admin count
verifyAdminSetup().then(result => {
  console.log('Admin Users:', result.adminUsersCount);
  console.log('Flagged Users:', result.adminFlaggedUsers);
})
```

---

**⚠️ Important**: This process is irreversible. All existing admin accounts will be removed and replaced with the new admin account.
