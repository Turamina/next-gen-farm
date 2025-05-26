# ADMIN TESTING GUIDE

## Quick Setup for Testing Admin Functionality

### 1. **Enable Admin Access**

#### Option A: Use Admin Email
1. Create an account with email: `admin@nextgenfarm.com`
2. Sign in with this email
3. Admin button will appear automatically

#### Option B: Modify User Profile (Temporary)
1. Sign in with any account
2. Go to Profile page
3. Open browser developer tools (F12)
4. In console, run:
   ```javascript
   // This is for testing only
   localStorage.setItem('isAdmin', 'true');
   ```
5. Refresh the page
6. Admin button should appear

#### Option C: Modify AuthContext (Development)
Temporarily add admin check in `src/contexts/AuthContext.js`:
```javascript
// Add this to the AuthContext for testing
const isAdmin = currentUser?.email?.includes('test') || 
                currentUser?.email === 'admin@nextgenfarm.com';
```

### 2. **Test Admin Features**

#### Test Product Management:
1. Click "Admin" button in header
2. Go to "Products" tab
3. Click "Add New Product"
4. Fill out form:
   - **Name**: "Test Product"
   - **Image**: "https://via.placeholder.com/300x200"
   - **Price**: "25.99"
   - **Stock**: "50"
   - **Tagline**: "Fresh test product for admin"
5. Submit and verify success message

#### Test Order Management:
1. Go to "Orders" tab
2. View existing orders (if any)
3. Test cancellation if orders exist
4. Verify status updates

### 3. **Verify Integration**

#### Check Product appears in main catalog:
1. Navigate to Products page
2. Look for your test product
3. Verify it appears with other products

#### Test Admin Button Visibility:
1. Sign out
2. Sign in with non-admin account
3. Verify admin button doesn't appear
4. Sign in with admin account
5. Verify admin button appears

### 4. **Firebase Console Setup** (Required)

#### Enable Firestore:
1. Go to Firebase Console
2. Select your project
3. Navigate to "Firestore Database"
4. Click "Create database"
5. Choose "Start in test mode"
6. Select location closest to your users

#### Verify Collections:
After testing, check these collections exist:
- `products` - Admin-added products
- `orders` - User orders for management
- `adminLogs` - Admin action audit trail

### 5. **Troubleshooting**

#### Admin Button Not Showing:
1. Check browser console for errors
2. Verify user is signed in
3. Check admin detection logic
4. Try refreshing the page

#### Can't Access Admin Page:
1. Ensure Firebase is properly configured
2. Check if user meets admin criteria
3. Verify route is properly set up

#### Product Addition Fails:
1. Check Firestore rules allow writes
2. Verify Firebase config is correct
3. Check browser console for errors

#### Orders Not Loading:
1. Ensure orders collection exists
2. Check if any orders have been created
3. Verify Firestore permissions

### 6. **Production Considerations**

#### Security:
- Remove test admin flags
- Implement proper role-based access
- Set up Firestore security rules
- Use environment variables for admin emails

#### Data:
- Set up proper admin user roles in database
- Create admin user management system
- Implement proper authentication flow

### 7. **Success Indicators**

✅ **Admin button appears for authorized users**
✅ **Admin dashboard loads without errors**
✅ **Can add products successfully**
✅ **Products appear in main catalog**
✅ **Can view and manage orders**
✅ **Admin actions are logged**
✅ **Non-admin users cannot access admin features**

## Ready to Test!

The admin system is fully functional and ready for testing. Follow the steps above to verify all features work correctly with your Firebase setup.
