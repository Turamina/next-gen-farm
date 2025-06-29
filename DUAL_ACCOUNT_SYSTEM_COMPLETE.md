# Dual Account System Implementation - Complete

## 🎉 System Overview

The Next Gen Farm application now supports **two separate account types** with **dedicated Firestore collections**:

### 📊 Collections Structure

```
Firestore Database:
├── customers/          ← Customer accounts
│   ├── {userId}/
│   │   ├── email
│   │   ├── firstName
│   │   ├── lastName
│   │   ├── phoneNumber
│   │   ├── address (optional)
│   │   ├── accountType: "customer"
│   │   └── ...
│
├── farmers/            ← Farmer accounts  
│   ├── {userId}/
│   │   ├── email
│   │   ├── firstName
│   │   ├── lastName
│   │   ├── phoneNumber
│   │   ├── farmName (required)
│   │   ├── address (optional)
│   │   ├── accountType: "farmer"
│   │   └── ...
│
└── other collections...
```

## 🔧 Implementation Details

### Account Creation Process

#### For Customers:
1. User selects "Customer" account type
2. Fills: Name, Email, Phone, Password, Address (optional)
3. System creates Firebase Auth user
4. System creates profile in `customers` collection
5. Redirects to home page

#### For Farmers:
1. User selects "Farmer" account type  
2. Fills: Farmer Name, Farm Name, Email, Phone, Password, Address (optional)
3. System creates Firebase Auth user
4. System creates profile in `farmers` collection
5. Redirects to farmer dashboard

### Sign-In Process

1. User enters email, password, and selects account type
2. System authenticates with Firebase Auth
3. **Based on account type selection**:
   - **Customer**: Looks up profile in `customers` collection
   - **Farmer**: Looks up profile in `farmers` collection
4. If profile found, redirects accordingly
5. Updates last login timestamp

### Profile Management

- **Customers**: Stored in `customers/{userId}` with customer-specific fields
- **Farmers**: Stored in `farmers/{userId}` with farm-specific fields
- **No cross-contamination**: Each account type has its own data structure

## 📁 Files Updated

### New Service
- `src/services/accountService.js` - **NEW** unified service for both account types

### Updated Components
- `src/pages/SignUp.js` - Uses new accountService for separate collections
- `src/pages/SignIn.js` - Fetches from correct collection based on account type
- `src/contexts/AuthContext.js` - Updated to work with new dual system

### Updated Configuration
- `FIRESTORE_SECURITY_RULES.md` - Added rules for `customers` and `farmers` collections

## 🛠️ Key Functions

### accountService.js Functions:

```javascript
// Create accounts
createCustomerProfile(uid, customerData)  // Creates in customers collection
createFarmerProfile(uid, farmerData)      // Creates in farmers collection

// Fetch profiles
getCustomerProfile(uid)                   // Gets from customers collection  
getFarmerProfile(uid)                     // Gets from farmers collection
getUserProfile(uid)                       // Searches both collections

// Update profiles
updateCustomerProfile(uid, updateData)    // Updates customers collection
updateFarmerProfile(uid, updateData)      // Updates farmers collection

// Utility
updateLastLogin(uid, accountType)         // Updates last login timestamp
```

## 🔒 Firestore Security Rules

### Production Rules (Recommended):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Customer accounts
    match /customers/{customerId} {
      allow read, write, create, update: if request.auth != null && request.auth.uid == customerId;
    }
    
    // Farmer accounts
    match /farmers/{farmerId} {
      allow read, write, create, update: if request.auth != null && request.auth.uid == farmerId;
    }
    
    // Other collections...
  }
}
```

### Development Rules (For Testing):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write, create, update, delete: if true;
    }
  }
}
```

## 🚀 Deployment Steps

### 1. Update Firestore Rules
1. Go to Firebase Console → Firestore Database → Rules
2. Copy the rules from `FIRESTORE_SECURITY_RULES.md`
3. Click "Publish"

### 2. Test Account Creation
1. Try creating a customer account
2. Verify it appears in `customers` collection  
3. Try creating a farmer account
4. Verify it appears in `farmers` collection

### 3. Test Sign-In
1. Sign in as customer - should go to home page
2. Sign in as farmer - should go to farmer dashboard
3. Verify profiles load correctly

## 🔍 Verification Checklist

- [ ] Customer accounts create in `customers` collection
- [ ] Farmer accounts create in `farmers` collection  
- [ ] Sign-in works for both account types
- [ ] Correct redirection after sign-in
- [ ] Profile data displays properly
- [ ] No permission errors in console
- [ ] Collections are properly separated

## 🛡️ Benefits

1. **Data Separation**: Customer and farmer data are completely separate
2. **Security**: Each account type only accesses its own data
3. **Scalability**: Easy to add account-type-specific features
4. **Clarity**: Clear distinction between user types in database
5. **Maintainability**: Easier to manage different user workflows

## 📝 Data Structures

### Customer Profile:
```javascript
{
  uid: "firebase-user-id",
  email: "customer@example.com", 
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+1234567890",
  accountType: "customer",
  address: { street: "", city: "", state: "", zipCode: "", country: "USA" },
  preferences: { newsletter: true, promotions: true },
  orders: [],
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLoginAt: timestamp
}
```

### Farmer Profile:
```javascript
{
  uid: "firebase-user-id",
  email: "farmer@example.com",
  firstName: "Jane", 
  lastName: "Smith",
  phoneNumber: "+1234567890",
  accountType: "farmer",
  farmName: "Green Valley Farm",
  farmAddress: "123 Farm Road",
  address: { street: "", city: "", state: "", zipCode: "", country: "USA" },
  cattle: { totalCount: 0, types: { dairy: 0, beef: 0, other: 0 } },
  products: [],
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLoginAt: timestamp
}
```

## ⚠️ Important Notes

1. **Account Type Selection**: Users MUST select correct account type during sign-in
2. **Collection Isolation**: Customers and farmers are stored in completely separate collections
3. **Migration**: Existing users in old `users` collection may need manual migration
4. **Consistency**: Both Firebase Auth and Firestore profile must exist for account to work

## 🎯 Next Steps

1. Test the new system thoroughly
2. Update Firestore rules in Firebase Console
3. Verify both account types work correctly
4. Consider migrating any existing users to appropriate collections
5. Add any additional account-type-specific features as needed
