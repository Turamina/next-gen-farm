# Firestore Setup for Cattle Management

## Required Firestore Security Rules

Add these rules to your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Cattle collection - farmers can only access their own cattle
    match /cattle/{cattleId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.farmerId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.farmerId;
    }
    
    // Production records - farmers can only access records for their cattle
    match /production_records/{recordId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Existing user collections (keep your current rules)
    match /customers/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /farmers/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Required Firestore Indexes

Create these composite indexes in the Firebase Console:

### Index 1: cattle collection
- Collection ID: `cattle`
- Fields:
  - `farmerId` (Ascending)
  - `status` (Ascending) 
  - `createdAt` (Descending)

### Index 2: production_records collection
- Collection ID: `production_records`
- Fields:
  - `cattleId` (Ascending)
  - `date` (Descending)

## How to Set Up:

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: next-gen-farm
3. **Go to Firestore Database**
4. **Click on "Rules" tab**
5. **Replace the rules with the code above**
6. **Click on "Indexes" tab**
7. **Create the composite indexes listed above**

## Test Connection:

Use the "Test Firebase" button in the Cattle Management page to verify:
- Firebase configuration is correct
- Authentication is working
- Firestore rules allow access
- Network connectivity is good

## Troubleshooting:

**Error: "Missing or insufficient permissions"**
- Check Firestore security rules
- Ensure user is authenticated
- Verify user has farmer role

**Error: "The query requires an index"**
- Create the composite indexes listed above
- Or use the auto-generated index links in the console

**Error: "Firebase: No Firebase App"**
- Check firebaseConfig.js has correct API keys
- Ensure Firebase is properly initialized

**Error: "Network request failed"**
- Check internet connection
- Verify Firebase project is active
- Check API quotas in Firebase console
