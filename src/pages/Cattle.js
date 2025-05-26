import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/adminService';
import './Cattle.css';

function Cattle() {
  const { currentUser, userProfile } = useAuth();
  const [cattle, setCattle] = useState([]);
  const [cattleLoading, setCattleLoading] = useState(false);
  const [totalFood, setTotalFood] = useState(0);
  const [cattleForm, setCattleForm] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [addingCattle, setAddingCattle] = useState(false);

  // Load cattle data on component mount
  useEffect(() => {
    if (currentUser) {
      loadCattleData();
    }
  }, [currentUser]);

  // Load user cattle data
  const loadCattleData = async () => {
    try {
      setCattleLoading(true);
      const userCattle = await adminService.getUserCattle(currentUser.uid);
      setCattle(userCattle);

      // Calculate total food requirement
      const total = await adminService.getTotalFoodRequirement(currentUser.uid);
      setTotalFood(total);
    } catch (error) {
      console.error('Error loading cattle:', error);
    } finally {
      setCattleLoading(false);
    }
  };

  // Handle form input changes
  const handleCattleFormChange = (e) => {
    const { name, value } = e.target;
    setCattleForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new cattle
  const handleAddCattle = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!cattleForm.name || !cattleForm.breed || !cattleForm.weight) {
      setFormError('Please fill in all required fields (Name, Breed, Weight)');
      return;
    }

    try {
      setAddingCattle(true);
      await adminService.addCattle({
        uid: currentUser.uid,
        ...cattleForm,
        age: Number(cattleForm.age) || 0,
        weight: Number(cattleForm.weight) || 0,
        createdAt: new Date()
      });

      // Reset form and refresh data
      setCattleForm({
        name: '',
        breed: '',
        age: '',
        weight: '',
        notes: ''
      });
      
      await loadCattleData();
    } catch (error) {
      console.error('Error adding cattle:', error);
      setFormError('Failed to add cattle. Please try again.');
    } finally {
      setAddingCattle(false);
    }
  };

  // Delete cattle
  const handleDeleteCattle = async (cattleId) => {
    if (window.confirm('Are you sure you want to delete this cattle?')) {
      try {
        await adminService.deleteCattle(cattleId);
        await loadCattleData();
      } catch (error) {
        console.error('Error deleting cattle:', error);
      }
    }
  };

  // Calculate food requirement for a single cattle
  const calculateFoodRequirement = (weight) => {
    return adminService.calculateFoodRequirement(weight);
  };

  return (
    <div className="cattle-page">
      <h1>Cattle Management</h1>
      
      <div className="cattle-stats">
        <div className="stat-card">
          <div className="stat-icon">🐄</div>
          <div className="stat-info">
            <h3>Total Cattle</h3>
            <p>{cattle.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌾</div>
          <div className="stat-info">
            <h3>Daily Food Requirement</h3>
            <p>{totalFood.toFixed(2)} kg</p>
          </div>
        </div>
      </div>

      <div className="cattle-content">
        <div className="cattle-form-section">
          <h2>Add New Cattle</h2>
          <form onSubmit={handleAddCattle} className="cattle-form">
            {formError && <div className="form-error">{formError}</div>}
            
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={cattleForm.name}
                onChange={handleCattleFormChange}
                placeholder="Enter name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="breed">Breed *</label>
              <input
                type="text"
                id="breed"
                name="breed"
                value={cattleForm.breed}
                onChange={handleCattleFormChange}
                placeholder="Enter breed"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="age">Age (years)</label>
              <input
                type="number"
                id="age"
                name="age"
                value={cattleForm.age}
                onChange={handleCattleFormChange}
                placeholder="Enter age"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="weight">Weight (kg) *</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={cattleForm.weight}
                onChange={handleCattleFormChange}
                placeholder="Enter weight in kg"
                min="0"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={cattleForm.notes}
                onChange={handleCattleFormChange}
                placeholder="Additional notes..."
                rows="3"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={addingCattle}
            >
              {addingCattle ? 'Adding...' : 'Add Cattle'}
            </button>
          </form>
        </div>

        <div className="cattle-list-section">
          <h2>Your Cattle</h2>
          {cattleLoading ? (
            <div className="loading">Loading cattle data...</div>
          ) : cattle.length === 0 ? (
            <div className="no-cattle">
              <p>You don't have any cattle yet. Add your first one!</p>
            </div>
          ) : (
            <div className="cattle-grid">
              {cattle.map(item => (
                <div key={item.id} className="cattle-card">
                  <div className="cattle-header">
                    <h3>{item.name}</h3>
                    <button 
                      onClick={() => handleDeleteCattle(item.id)} 
                      className="delete-btn"
                      aria-label="Delete cattle"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="cattle-daily-food">
                    {calculateFoodRequirement(item.weight).toFixed(2)} kg/day
                  </div>
                  
                  <div className="cattle-details">
                    <div className="cattle-detail">
                      <span className="detail-label">Breed:</span>
                      <span className="detail-value">{item.breed}</span>
                    </div>
                    
                    {item.age && (
                      <div className="cattle-detail">
                        <span className="detail-label">Age:</span>
                        <span className="detail-value">{item.age} years</span>
                      </div>
                    )}
                    
                    <div className="cattle-detail">
                      <span className="detail-label">Weight:</span>
                      <span className="detail-value">{item.weight} kg</span>
                    </div>
                  </div>
                  
                  {item.notes && (
                    <div className="cattle-notes">
                      <p>{item.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Cattle;
