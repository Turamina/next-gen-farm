// SSL Commerz Error Suppression
// This file only handles console error/warning suppression
// Network request blocking is handled by sslcommerzEMIBlocker.js

// Store original methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Enhanced console error suppression
console.error = function(...args) {
  // Filter out SSL Commerz EMI-related errors
  const message = args.join(' ');
  if ((message.includes('get_emi') && message.includes('sslcommerz')) || 
      message.includes('appdata.service.ts') ||
      message.includes('SessionService.ts') ||
      message.includes('transaction.component.ts') ||
      (message.includes('500 (Internal Server Error)') && message.includes('sslcommerz') && message.includes('get_emi'))) {
    // Log a single suppressed message instead of the full error
    console.log('ℹ️  SSL Commerz EMI error suppressed (expected behavior)');
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = function(...args) {
  // Filter out SSL Commerz EMI-related warnings
  const message = args.join(' ');
  if ((message.includes('get_emi') && message.includes('sslcommerz')) || 
      message.includes('appdata.service') ||
      message.includes('SessionService') ||
      (message.includes('sslcommerz') && message.includes('installment'))) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

export default {};
