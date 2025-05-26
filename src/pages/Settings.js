import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { userService } from '../services/userService';
import './Settings.css';

const Settings = () => {
  const { currentUser, logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password) {
      setError('Please enter your password to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      // Delete user data from Firestore first
      await userService.deleteUserAccount(currentUser.uid);
      
      // Reauthenticate user before deletion
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Delete the user account
      await deleteUser(currentUser);
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      let errorMessage = 'Failed to delete account. Please try again.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign out and sign back in to delete your account.';
      }
      
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportData = async () => {
    setIsExporting(true);
    try {
      // Get complete user data from Firestore
      const profile = await userService.getUserProfile(currentUser.uid);
      const orders = await userService.getUserOrders(currentUser.uid);
      const cart = await userService.getCart(currentUser.uid);
      const favorites = await userService.getFavorites(currentUser.uid);
      const reviews = await userService.getUserReviews(currentUser.uid);

      const userData = {
        profile: {
          email: currentUser.email,
          displayName: currentUser.displayName,
          createdAt: currentUser.metadata.creationTime,
          lastSignIn: currentUser.metadata.lastSignInTime,
          ...profile
        },
        orders: orders,
        cart: cart,
        favorites: favorites,
        reviews: reviews,
        exportDate: new Date().toISOString()
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `next-gen-farm-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (    <div className="settings-container">
      <div className="settings-header">
        <Link to="/profile" className="back-link">← Back to Profile</Link>
        <h1>Account Settings</h1>
        <p>Manage your account preferences and data</p>
      </div>

      <div className="settings-content">
        {/* Account Information */}
        <div className="settings-section">
          <h2>Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Email Address</label>
              <span>{currentUser.email}</span>
            </div>            <div className="info-item">
              <label>Full Name</label>
              <span>{userProfile?.fullName || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <label>Phone Number</label>
              <span>{userProfile?.phone || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <label>Farm Name</label>
              <span>{userProfile?.farmName || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <label>Account Created</label>
              <span>{new Date(currentUser.metadata.creationTime).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <label>Last Sign In</label>
              <span>{new Date(currentUser.metadata.lastSignInTime).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <label>Email Verified</label>
              <span className={currentUser.emailVerified ? 'verified' : 'unverified'}>
                {currentUser.emailVerified ? '✓ Verified' : '✗ Not Verified'}
              </span>
            </div>
          </div>
        </div>        {/* Privacy Settings */}
        <div className="settings-section">
          <h2>Privacy & Data</h2>
          <div className="privacy-options">
            <button 
              onClick={exportData} 
              className="export-btn"
              disabled={isExporting}
            >
              <span>📥</span>
              {isExporting ? 'Exporting...' : 'Export My Data'}
            </button>
            <p className="privacy-note">
              Download a complete copy of all your account data including profile, orders, cart, favorites, and reviews in JSON format
            </p>
          </div>
          
          {/* Data Usage Statistics */}
          <div className="data-stats">
            <h3>Data Usage</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Orders</span>
                <span className="stat-value">{userProfile?.totalOrders || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Account Age</span>
                <span className="stat-value">
                  {Math.floor((Date.now() - new Date(currentUser.metadata.creationTime).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Profile Updated</span>
                <span className="stat-value">
                  {userProfile?.updatedAt ? new Date(userProfile.updatedAt.seconds * 1000).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-section danger-zone">
          <h2>Danger Zone</h2>
          <div className="danger-content">
            <div className="danger-item">
              <div className="danger-info">
                <h3>Delete Account</h3>
                <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="delete-btn"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Account Deletion</h3>
            <p>
              Are you sure you want to delete your account? This action is permanent and cannot be undone.
              All your data will be permanently removed.
            </p>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Enter your password to confirm:</label>
              <input
                type="password"
                id="confirmPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={error ? 'error' : ''}
              />
              {error && <span className="error-message">{error}</span>}
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setPassword('');
                  setError('');
                }}
                className="cancel-btn"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="confirm-delete-btn"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
