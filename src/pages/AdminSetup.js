import React, { useState } from 'react';
import { setupNewAdmin, verifyAdminSetup } from '../utils/adminReset';

const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [verification, setVerification] = useState(null);

  const handleSetupAdmin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const setupResult = await setupNewAdmin();
      setResult(setupResult);
    } catch (error) {
      console.error('Setup error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    try {
      const verifyResult = await verifyAdminSetup();
      setVerification(verifyResult);
    } catch (error) {
      console.error('Verification error:', error);
      setError(error.message);
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '50px auto',
      padding: '30px',
      border: '2px solid #4CAF50',
      borderRadius: '10px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f9f9f9'
    }}>
      <h1 style={{ color: '#2c5530', textAlign: 'center' }}>
        🔑 Admin Account Setup
      </h1>

      <div style={{
        backgroundColor: '#e8f5e8',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #4CAF50'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2c5530' }}>
          New Admin Details:
        </h3>
        <p style={{ margin: '5px 0' }}>
          <strong>Email:</strong> ranamaitra09@gmail.com
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Password:</strong> Turamina@9
        </p>
      </div>

      <div style={{
        backgroundColor: '#fff3cd',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px',
        border: '1px solid #ffc107'
      }}>
        <p style={{ margin: 0, color: '#856404' }}>
          ⚠️ <strong>Warning:</strong> This will remove ALL existing admin accounts 
          and create a new admin with the credentials above.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button
          onClick={handleSetupAdmin}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '16px',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? '🔄 Setting up...' : '🚀 Setup New Admin'}
        </button>

        <button
          onClick={handleVerifySetup}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '16px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🔍 Verify Setup
        </button>
      </div>

      {result && (
        <div style={{
          backgroundColor: '#d4edda',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>
            ✅ Setup Successful!
          </h3>
          <p style={{ margin: '5px 0', color: '#155724' }}>
            <strong>Admin Email:</strong> {result.adminEmail}
          </p>
          <p style={{ margin: '5px 0', color: '#155724' }}>
            <strong>Admin UID:</strong> {result.adminUid}
          </p>
          <p style={{ margin: '10px 0 0 0', color: '#155724' }}>
            You can now sign in to the admin panel with the new credentials.
          </p>
        </div>
      )}

      {verification && (
        <div style={{
          backgroundColor: '#d1ecf1',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #bee5eb'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>
            📊 Verification Results:
          </h3>
          <p style={{ margin: '5px 0', color: '#0c5460' }}>
            <strong>Admin Users:</strong> {verification.adminUsersCount}
          </p>
          <p style={{ margin: '5px 0', color: '#0c5460' }}>
            <strong>Admin Flagged Users:</strong> {verification.adminFlaggedUsers}
          </p>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#721c24' }}>
            ❌ Error:
          </h3>
          <p style={{ margin: 0, color: '#721c24' }}>
            {error}
          </p>
        </div>
      )}

      <div style={{
        backgroundColor: '#e2e3e5',
        padding: '15px',
        borderRadius: '5px',
        fontSize: '14px',
        color: '#383d41'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Instructions:</h4>
        <ol style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Click "Setup New Admin" to create the new admin account</li>
          <li>Wait for the success message</li>
          <li>Go to the sign-in page</li>
          <li>Sign in with the new admin credentials</li>
          <li>Access the admin panel</li>
        </ol>
      </div>
    </div>
  );
};

export default AdminSetup;
