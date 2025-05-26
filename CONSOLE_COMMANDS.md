# 🔧 CONSOLE COMMANDS FOR TESTING

## Primary Debug Command

**Correct function name:**
```javascript
debugProducts()
```

**(NOT `debugproduct` - note the "s" at the end!)**

---

## Alternative Simple Test

If `debugProducts()` doesn't work, try this simpler test:

```javascript
// Test 1: Simple Firestore access
import('./services/productService').then(async ({ productService }) => {
  try {
    const products = await productService.getAllProducts();
    console.log('Products found:', products.length);
    console.log('Products:', products);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('permission') || error.message.includes('denied')) {
      console.log('❌ FIRESTORE RULES ISSUE - Apply rules from FIRESTORE_RULES_FIX.md');
    }
  }
});
```

---

## Manual Firestore Test

```javascript
// Test 2: Direct Firestore check
import('./firebaseConfig').then(async ({ db }) => {
  const { collection, getDocs } = await import('firebase/firestore');
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    console.log('Direct query returned:', snapshot.size, 'documents');
  } catch (error) {
    console.error('Direct query error:', error);
  }
});
```

---

## What to Look For

### ✅ Success Indicators:
- "Products found: X" (where X > 0)
- No error messages
- Actual product data displayed

### ❌ Problem Indicators:
- "permission denied" errors
- "insufficient permissions" errors
- "Products found: 0" with errors

### 🔧 Next Steps:
If you see permission errors, apply the Firestore rules from `FIRESTORE_RULES_FIX.md` immediately!

---

## Quick Commands Summary

1. **Main debug:** `debugProducts()`
2. **If that fails:** Copy/paste the alternative tests above
3. **Apply Firestore rules** if you see permission errors
4. **Clear cache** (`Ctrl+F5`) after applying rules
