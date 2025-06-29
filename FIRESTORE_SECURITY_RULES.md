# Firestore Security Rules for Next Gen Farm

## Copy these rules to your Firestore Database

Go to Firebase Console → Firestore Database → Rules tab and replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Customer users collection - separate from farmers
    match /customers/{customerId} {
      allow read, write: if request.auth != null && request.auth.uid == customerId;
      allow create: if request.auth != null && request.auth.uid == customerId;
    }
    
    // Farmers collection - separate from customers
    match /farmers/{farmerId} {
      allow read, write: if request.auth != null && request.auth.uid == farmerId;
      allow create: if request.auth != null && request.auth.uid == farmerId;
    }
    
    // Legacy users collection (for backward compatibility)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products collection - allow read for everyone, write for authenticated users
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Carts collection
    match /carts/{cartId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Admin collection (for admin users)
    match /admins/{adminId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Allow all authenticated users to create documents in any collection for now
    // This is a temporary rule for development - tighten in production
    match /{document=**} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## Quick Fix Rules (For Development Only)

If you're getting "Missing or insufficient permissions" error, use these permissive rules for immediate testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Completely open rules for development and testing
    match /{document=**} {
      allow read, write, create, update, delete: if true;
    }
  }
}
```

## 🚨 IMMEDIATE FIX for "Missing or insufficient permissions"

### Step 1: Update Firestore Rules Right Now
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Firestore Database" 
4. Click "Rules" tab
5. **Replace ALL existing rules** with this simple rule:

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

6. Click **"Publish"**
7. Wait for rules to deploy (30 seconds)
8. **Try creating farmer account again**

### Step 2: If Still Failing
Check that your Firestore database exists:
1. In Firebase Console → Firestore Database
2. If you see "Get started", click it and create database in **test mode**
3. Choose any location
4. Database will be created with open rules

### Step 3: Verify Authentication is Enabled
1. Go to Authentication → Sign-in method
2. Make sure "Email/Password" is **Enabled**
3. Save if not enabled

---

## Production Rules (Use After Testing)

For production, use these more secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Customer users collection
    match /customers/{customerId} {
      allow read, write, create, update: if request.auth != null && request.auth.uid == customerId;
    }
    
    // Farmers collection
    match /farmers/{farmerId} {
      allow read, write, create, update: if request.auth != null && request.auth.uid == farmerId;
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true;
      allow write, create, update, delete: if request.auth != null;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read, write, create, update: if request.auth != null;
    }
    
    // Carts collection
    match /carts/{cartId} {
      allow read, write, create, update, delete: if request.auth != null;
    }
    
    // Admin collection
    match /admins/{adminId} {
      allow read, write, create, update: if request.auth != null;
    }
  }
}
```

## Steps to Update Rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Firestore Database"
4. Click on "Rules" tab
5. Replace existing rules with the rules above
6. Click "Publish"

## Alternative: Create Database in Test Mode

If you haven't created the Firestore database yet:
1. Go to Firestore Database
2. Click "Create database"
3. Select "Start in test mode" (this allows all reads/writes for 30 days)
4. Choose a location
5. Click "Done"
