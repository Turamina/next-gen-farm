# Firebase Configuration Setup Guide

## Issue: Account Creation Failed

The account creation is failing because the Firebase configuration in `firebaseConfig.js` contains placeholder values instead of actual Firebase project credentials.

## 🔧 Steps to Fix:

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or use existing project
3. Enable Authentication and Firestore Database

### 2. Get Firebase Configuration
1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Web app" icon or create new web app
4. Copy the configuration object

### 3. Update firebaseConfig.js
Replace the placeholder values with your actual Firebase configuration:

```javascript
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// REPLACE THESE WITH YOUR ACTUAL FIREBASE PROJECT VALUES
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
```

### 4. Enable Authentication Methods
In Firebase Console:
1. Go to Authentication > Sign-in method
2. Enable "Email/Password" authentication
3. Save changes

### 5. Set up Firestore Database
In Firebase Console:
1. Go to Firestore Database
2. Create database
3. Start in test mode (or production mode with proper rules)
4. Choose location closest to your users

### 6. Firestore Security Rules
Add these rules to Firestore for the dual user system:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection (customers)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Farmers collection
    match /farmers/{farmerId} {
      allow read, write: if request.auth != null && request.auth.uid == farmerId;
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true; // Anyone can read products
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.uid || request.auth.uid == resource.data.farmerId);
    }
    
    // Carts collection
    match /carts/{cartId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
    }
  }
}
```

## 🚨 Current Issue Analysis

The current configuration has these problems:
- `messagingSenderId: "123456789012"` - This is a placeholder
- `appId: "1:123456789012:web:abcdef123456789012345678"` - This is fake
- The project ID might not match an actual Firebase project

## 🔍 Debug Information Added

I've enhanced the error handling in SignUp.js to provide more detailed error information:
- More specific error codes and messages
- Console logging of full error details
- Firebase-specific error handling

## ✅ After Fixing Firebase Config

Once you update the Firebase configuration with real values:
1. The account creation should work
2. Users will be stored in separate collections (`users` for customers, `farmers` for farmers)
3. Authentication and redirection will function properly

## 🧪 Testing After Fix

1. Try creating a customer account
2. Try creating a farmer account  
3. Check Firebase Console to see users being created
4. Test sign-in with both account types

The enhanced error messages will now show exactly what's wrong if there are still issues.
