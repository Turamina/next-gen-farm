# Firestore Database Setup Guide

## Step 1: Enable Firestore Database

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your "Next Gen Farm" project

2. **Navigate to Firestore Database**
   - In the left sidebar, click on **"Firestore Database"**
   - Click **"Create database"**

3. **Choose Security Rules**
   - Select **"Start in test mode"** for development
   - Choose your preferred location (select closest to your users)
   - Click **"Done"**

## Step 2: Configure Security Rules

Replace the default rules with these production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Orders can only be accessed by the user who created them
    match /orders/{orderId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    
    // Cart items can only be accessed by the user who created them
    match /carts/{cartId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    
    // Reviews can be read by anyone, but only created/updated by authenticated users
    match /reviews/{reviewId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    
    // Favorites can only be accessed through user document updates
    match /favorites/{favoriteId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
  }
}
```

## Step 3: Enable Storage (Optional)

If you plan to upload profile pictures or product images:

1. Go to **"Storage"** in the Firebase Console
2. Click **"Get started"**
3. Choose the same security rules setup as Firestore
4. Select the same location as your Firestore database

## Step 4: Test the Database

1. Start your development server:
   ```bash
   npm start
   ```

2. **Test User Registration:**
   - Go to the signup page
   - Create a new account
   - Check Firebase Console > Firestore Database
   - You should see a new document in the `users` collection

3. **Test Profile Updates:**
   - Log in and go to Profile page
   - Update your profile information
   - Verify the changes appear in Firestore

4. **Test Product Interactions:**
   - Go to Products page
   - Add items to cart and favorites
   - Check for `carts` collection in Firestore

## Database Collections Structure

### Users Collection (`users/{userId}`)
```javascript
{
  uid: "user_id",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  displayName: "John Doe",
  phoneNumber: "+1234567890",
  farmName: "Green Valley Farm",
  bio: "Passionate about organic farming",
  address: {
    street: "123 Farm Road",
    city: "Springfield",
    state: "CA",
    zipCode: "90210",
    country: "USA"
  },
  preferences: {
    notifications: { email: true, sms: false },
    delivery: { preferredTime: "morning" },
    privacy: { profileVisible: false }
  },
  stats: {
    totalOrders: 5,
    totalSpent: 250.00,
    loyaltyPoints: 125,
    favoriteProducts: ["prod1", "prod2"]
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Orders Collection (`orders/{orderId}`)
```javascript
{
  uid: "user_id",
  orderId: "NGF-ABC123",
  items: [
    {
      productId: "prod1",
      productName: "Organic Tomatoes",
      quantity: 2,
      price: 15.99
    }
  ],
  totalAmount: 31.98,
  status: "pending",
  paymentStatus: "paid",
  deliveryAddress: {...},
  createdAt: timestamp
}
```

### Carts Collection (`carts/{cartItemId}`)
```javascript
{
  uid: "user_id",
  productId: "prod1",
  productName: "Organic Tomatoes",
  productImage: "image_url",
  price: 15.99,
  quantity: 2,
  addedAt: timestamp
}
```

### Reviews Collection (`reviews/{reviewId}`)
```javascript
{
  uid: "user_id",
  productId: "prod1",
  rating: 5,
  title: "Excellent quality!",
  comment: "Fresh and delicious tomatoes",
  helpful: 3,
  verified: true,
  createdAt: timestamp
}
```

## Troubleshooting

### Common Issues:

1. **Permission Denied Errors:**
   - Ensure security rules are configured correctly
   - Check that user is authenticated before database operations

2. **Import Errors:**
   - Verify all Firebase SDK imports are correct
   - Ensure `firebaseConfig.js` exports `db` and `storage`
   - Check for duplicate imports in service files

3. **Connection Issues:**
   - Check internet connection
   - Verify Firebase project configuration
   - Ensure API keys are correct

4. **Build Errors:**
   - Run `npm install` to ensure all dependencies are installed
   - Check for syntax errors in JavaScript files
   - Verify all imports are correctly formatted

### Testing Commands:

```bash
# Start development server
npm start

# Check for any build errors
npm run build

# Run tests (if available)
npm test
```

## Next Steps

1. **Enable Analytics** (Optional)
2. **Set up Cloud Functions** for advanced features
3. **Configure App Check** for production security
4. **Set up Backup and Monitoring**

---

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Review Firebase Console logs
3. Ensure all dependencies are installed: `npm install`
4. Verify your Firebase project configuration

The comprehensive user database system is now ready for production use!
