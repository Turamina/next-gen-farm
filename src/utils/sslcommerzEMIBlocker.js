// Advanced SSL Commerz EMI Request Blocker
// This script provides comprehensive blocking of SSL Commerz EMI-related requests

(function() {
  'use strict';
  
  console.log('SSL Commerz EMI Blocker initialized');

  // List of EMI-specific patterns to block
  const blockedPatterns = [
    'get_emi',
    'securepay/api.php/get_emi',
    'api.php/get_emi'
  ];

  // Check if URL should be blocked - must be both EMI-related AND from sslcommerz
  function shouldBlockRequest(url) {
    if (typeof url !== 'string') return false;
    return url.includes('sslcommerz') && 
           blockedPatterns.some(pattern => 
             url.toLowerCase().includes(pattern.toLowerCase())
           );
  }

  // Store original methods
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  const originalFetch = window.fetch;

  // Mock successful response
  function createMockResponse() {
    return {
      status: 200,
      statusText: 'OK',
      responseText: '{"status":"disabled","message":"EMI service disabled"}',
      response: '{"status":"disabled","message":"EMI service disabled"}',
      readyState: 4
    };
  }

  // Enhanced XMLHttpRequest blocking - more precise
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    this._url = url;
    this._method = method;
    
    // Only block if it's specifically an EMI request to sslcommerz
    if (shouldBlockRequest(url) && url.includes('sslcommerz')) {
      console.log('🚫 Blocked SSL Commerz EMI XMLHttpRequest:', method, url);
      
      // Set up mock response
      Object.assign(this, createMockResponse());
      
      // Schedule callback execution
      setTimeout(() => {
        if (this.onreadystatechange) {
          this.onreadystatechange.call(this);
        }
        if (this.onload) {
          this.onload.call(this);
        }
      }, 1);
      
      // Override send to do nothing
      this.send = function() {
        console.log('🚫 Blocked send for EMI request');
      };
      
      return;
    }
    
    return originalXHROpen.call(this, method, url, async, user, password);
  };

  // Enhanced Fetch API blocking - more precise
  if (window.fetch) {
    window.fetch = function(resource, options = {}) {
      const url = typeof resource === 'string' ? resource : resource.url;
      
      // Only block if it's specifically an EMI request
      if (shouldBlockRequest(url) && url.includes('sslcommerz')) {
        console.log('🚫 Blocked SSL Commerz EMI fetch request:', url);
        
        // Return a successful mock response
        return Promise.resolve(new Response(
          '{"status":"disabled","message":"EMI service disabled"}', 
          {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        ));
      }
      
      return originalFetch.call(this, resource, options);
    };
  }

  // Block dynamic script loading of EMI-related scripts
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && shouldBlockRequest(value)) {
          console.log('🚫 Blocked SSL Commerz EMI script loading:', value);
          return; // Don't set the src attribute
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  };

  // Enhanced error suppression for remaining console messages
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  console.error = function(...args) {
    const message = args.join(' ');
    if (shouldBlockRequest(message) || 
        message.includes('appdata.service.ts') ||
        message.includes('SessionService.ts') ||
        message.includes('transaction.component.ts')) {
      console.log('ℹ️  SSL Commerz EMI error suppressed (expected)');
      return;
    }
    return originalConsoleError.apply(this, args);
  };

  console.warn = function(...args) {
    const message = args.join(' ');
    if (shouldBlockRequest(message)) {
      return;
    }
    return originalConsoleWarn.apply(this, args);
  };

  // Monitor and report blocked requests
  let blockedCount = 0;
  window.SSLCommerzEMIBlocker = {
    getBlockedCount: () => blockedCount,
    reset: () => { blockedCount = 0; },
    isActive: true
  };

})();
