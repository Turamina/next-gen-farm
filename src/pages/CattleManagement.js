import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { cattleService } from '../services/cattleService';
import LoadingSpinner from '../components/LoadingSpinner';
import './CattleManagement_new.css';

const CattleManagement = () => {
  const { currentUser } = useAuth();
  const [cattle, setCattle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCattle, setSelectedCattle] = useState(null);
  const [cattleStats, setCattleStats] = useState(null);
  const [feedingSuggestions, setFeedingSuggestions] = useState(null);
  const [productionRecords, setProductionRecords] = useState([]);

  // Form states
  const [cattleForm, setCattleForm] = useState({
    tagNumber: '',
    name: '',
    breed: '',
    type: 'dairy',
    gender: 'female',
    age: '',
    weight: '',
    healthStatus: 'healthy',
    production: {
      type: 'milk',
      dailyOutput: '',
      unit: 'liters'
    },
    feeding: {
      dailyFeedAmount: '',
      feedType: 'mixed',
      specialRequirements: ''
    },
    location: {
      barn: '',
      pen: '',
      pastureAccess: false
    },
    acquisition: {
      date: '',
      type: 'born',
      cost: '',
      source: ''
    },
    notes: ''
  });

  const [productionForm, setProductionForm] = useState({
    type: 'milk',
    amount: '',
    unit: 'liters',
    quality: 'good',
    notes: ''
  });

  // Load cattle data
  useEffect(() => {
    if (currentUser) {
      loadCattleData();
    }
  }, [currentUser]);

  const loadCattleData = async () => {
    try {
      setLoading(true);
      const [cattleData, stats] = await Promise.all([
        cattleService.getFarmerCattle(currentUser.uid),
        cattleService.getCattleStats(currentUser.uid)
      ]);
      
      setCattle(cattleData);
      setCattleStats(stats);
      setFeedingSuggestions(stats.feedingRequirements);
      setError('');
    } catch (err) {
      console.error('Error loading cattle data:', err);
      setError('Failed to load cattle data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCattle = async (e) => {
    e.preventDefault();
    
    if (!cattleForm.tagNumber || !cattleForm.breed || !cattleForm.age || !cattleForm.weight) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await cattleService.addCattle(currentUser.uid, cattleForm);
      setSuccess('Cattle added successfully!');
      setShowAddForm(false);
      setCattleForm({
        tagNumber: '',
        name: '',
        breed: '',
        type: 'dairy',
        gender: 'female',
        age: '',
        weight: '',
        healthStatus: 'healthy',
        production: {
          type: 'milk',
          dailyOutput: '',
          unit: 'liters'
        },
        feeding: {
          dailyFeedAmount: '',
          feedType: 'mixed',
          specialRequirements: ''
        },
        location: {
          barn: '',
          pen: '',
          pastureAccess: false
        },
        acquisition: {
          date: '',
          type: 'born',
          cost: '',
          source: ''
        },
        notes: ''
      });
      await loadCattleData();
    } catch (err) {
      console.error('Error adding cattle:', err);
      setError('Failed to add cattle');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCattle = async (cattleId, updates) => {
    try {
      await cattleService.updateCattle(cattleId, updates);
      setSuccess('Cattle updated successfully!');
      await loadCattleData();
    } catch (err) {
      console.error('Error updating cattle:', err);
      setError('Failed to update cattle');
    }
  };

  const handleDeleteCattle = async (cattleId) => {
    if (window.confirm('Are you sure you want to remove this cattle?')) {
      try {
        await cattleService.deleteCattle(cattleId);
        setSuccess('Cattle removed successfully!');
        await loadCattleData();
      } catch (err) {
        console.error('Error deleting cattle:', err);
        setError('Failed to remove cattle');
      }
    }
  };

  const handleRecordProduction = async (cattleId) => {
    if (!productionForm.amount) {
      setError('Please enter production amount');
      return;
    }

    try {
      await cattleService.recordProduction(cattleId, {
        ...productionForm,
        recordedBy: currentUser.uid
      });
      setSuccess('Production recorded successfully!');
      setProductionForm({
        type: 'milk',
        amount: '',
        unit: 'liters',
        quality: 'good',
        notes: ''
      });
      await loadCattleData();
    } catch (err) {
      console.error('Error recording production:', err);
      setError('Failed to record production');
    }
  };

  const loadProductionRecords = async (cattleId) => {
    try {
      const records = await cattleService.getProductionRecords(cattleId);
      setProductionRecords(records);
    } catch (err) {
      console.error('Error loading production records:', err);
    }
  };

  if (loading && cattle.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="cattle-management">
      <div className="cattle-header">
        <h1>🐄 Cattle Management</h1>
        <button 
          className="btn-primary add-cattle-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add New Cattle
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'cattle-list' ? 'active' : ''}`}
          onClick={() => setActiveTab('cattle-list')}
        >
          Cattle List
        </button>
        <button 
          className={`tab-btn ${activeTab === 'feeding' ? 'active' : ''}`}
          onClick={() => setActiveTab('feeding')}
        >
          AI Feeding Guide
        </button>
        <button 
          className={`tab-btn ${activeTab === 'production' ? 'active' : ''}`}
          onClick={() => setActiveTab('production')}
        >
          Production Records
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && cattleStats && (
        <div className="overview-tab">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Cattle</h3>
              <div className="stat-number">{cattleStats.totalCattle}</div>
            </div>
            <div className="stat-card">
              <h3>Daily Milk Production</h3>
              <div className="stat-number">{cattleStats.totalProduction.dailyMilk} L</div>
            </div>
            <div className="stat-card">
              <h3>Daily Feed Required</h3>
              <div className="stat-number">{feedingSuggestions?.totalDailyFeed} kg</div>
            </div>
            <div className="stat-card">
              <h3>Daily Feed Cost</h3>
              <div className="stat-number">৳{feedingSuggestions?.totalDailyCost}</div>
            </div>
          </div>

          <div className="cattle-breakdown">
            <div className="breakdown-section">
              <h3>By Type</h3>
              <div className="breakdown-items">
                <div className="breakdown-item">
                  <span>Dairy: {cattleStats.byType.dairy}</span>
                </div>
                <div className="breakdown-item">
                  <span>Beef: {cattleStats.byType.beef}</span>
                </div>
                <div className="breakdown-item">
                  <span>Dual-Purpose: {cattleStats.byType['dual-purpose']}</span>
                </div>
              </div>
            </div>

            <div className="breakdown-section">
              <h3>By Age Group</h3>
              <div className="breakdown-items">
                <div className="breakdown-item">
                  <span>Calves (0-12 months): {cattleStats.byAge.calves}</span>
                </div>
                <div className="breakdown-item">
                  <span>Young (12-24 months): {cattleStats.byAge.young}</span>
                </div>
                <div className="breakdown-item">
                  <span>Adult (24+ months): {cattleStats.byAge.adult}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cattle List Tab */}
      {activeTab === 'cattle-list' && (
        <div className="cattle-list-tab">
          <div className="cattle-grid">
            {cattle.map((animal) => (
              <div key={animal.id} className="cattle-card">
                <div className="cattle-card-header">
                  <h3>{animal.name || `${animal.breed} #${animal.tagNumber}`}</h3>
                  <span className={`status-badge ${animal.healthStatus}`}>
                    {animal.healthStatus}
                  </span>
                </div>
                
                <div className="cattle-info">
                  <p><strong>Tag:</strong> {animal.tagNumber}</p>
                  <p><strong>Breed:</strong> {animal.breed}</p>
                  <p><strong>Type:</strong> {animal.type}</p>
                  <p><strong>Age:</strong> {animal.age} months</p>
                  <p><strong>Weight:</strong> {animal.weight} kg</p>
                  {animal.production?.dailyOutput > 0 && (
                    <p><strong>Daily {animal.production.type}:</strong> {animal.production.dailyOutput} {animal.production.unit}</p>
                  )}
                </div>

                <div className="cattle-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedCattle(animal);
                      loadProductionRecords(animal.id);
                    }}
                  >
                    View Details
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleDeleteCattle(animal.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Feeding Guide Tab */}
      {activeTab === 'feeding' && feedingSuggestions && (
        <div className="feeding-tab">
          <div className="feeding-overview">
            <h2>🤖 AI-Powered Feeding Recommendations</h2>
            <div className="feeding-summary">
              <div className="summary-item">
                <strong>Total Daily Feed:</strong> {feedingSuggestions.totalDailyFeed} kg
              </div>
              <div className="summary-item">
                <strong>Daily Cost:</strong> ৳{feedingSuggestions.totalDailyCost}
              </div>
              <div className="summary-item">
                <strong>Monthly Cost:</strong> ৳{feedingSuggestions.totalMonthlyCost}
              </div>
            </div>
          </div>

          <div className="feeding-schedule">
            <h3>Recommended Feeding Schedule</h3>
            <div className="schedule-grid">
              {Object.entries(feedingSuggestions.feedingSchedule).map(([time, schedule]) => (
                <div key={time} className="schedule-item">
                  <h4>{schedule.time}</h4>
                  <p>{schedule.percentage}% of daily feed</p>
                  <small>{schedule.notes}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="individual-suggestions">
            <h3>Individual Cattle Feeding</h3>
            <div className="suggestions-list">
              {feedingSuggestions.individualSuggestions.map((suggestion) => (
                <div key={suggestion.cattleId} className="suggestion-card">
                  <h4>{suggestion.cattleName}</h4>
                  <p><strong>Daily Feed:</strong> {suggestion.dailyFeedKg} kg</p>
                  <p><strong>Daily Cost:</strong> ৳{suggestion.dailyCost}</p>
                  <p><strong>Feed Type:</strong> {suggestion.feedType}</p>
                  {suggestion.specialNotes && (
                    <p><strong>Notes:</strong> {suggestion.specialNotes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="nutritional-tips">
            <h3>💡 Nutritional Tips</h3>
            <ul>
              {feedingSuggestions.nutritionalTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Production Records Tab */}
      {activeTab === 'production' && (
        <div className="production-tab">
          <h2>📊 Production Records</h2>
          
          {selectedCattle && (
            <div className="production-form">
              <h3>Record Production for {selectedCattle.name || `#${selectedCattle.tagNumber}`}</h3>
              <div className="form-row">
                <select
                  value={productionForm.type}
                  onChange={(e) => setProductionForm({...productionForm, type: e.target.value})}
                >
                  <option value="milk">Milk</option>
                  <option value="eggs">Eggs</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={productionForm.amount}
                  onChange={(e) => setProductionForm({...productionForm, amount: e.target.value})}
                />
                <select
                  value={productionForm.unit}
                  onChange={(e) => setProductionForm({...productionForm, unit: e.target.value})}
                >
                  <option value="liters">Liters</option>
                  <option value="pieces">Pieces</option>
                  <option value="kg">Kg</option>
                </select>
                <button 
                  className="btn-primary"
                  onClick={() => handleRecordProduction(selectedCattle.id)}
                >
                  Record
                </button>
              </div>
            </div>
          )}

          {productionRecords.length > 0 && (
            <div className="production-records">
              <h3>Recent Records</h3>
              <div className="records-list">
                {productionRecords.slice(0, 10).map((record) => (
                  <div key={record.id} className="record-item">
                    <span>{record.date}</span>
                    <span>{record.amount} {record.unit} of {record.type}</span>
                    <span className={`quality-badge ${record.quality}`}>{record.quality}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Cattle Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content cattle-form">
            <div className="modal-header">
              <h2>Add New Cattle</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddCattle}>
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Tag Number *"
                    value={cattleForm.tagNumber}
                    onChange={(e) => setCattleForm({...cattleForm, tagNumber: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={cattleForm.name}
                    onChange={(e) => setCattleForm({...cattleForm, name: e.target.value})}
                  />
                </div>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Breed *"
                    value={cattleForm.breed}
                    onChange={(e) => setCattleForm({...cattleForm, breed: e.target.value})}
                    required
                  />
                  <select
                    value={cattleForm.type}
                    onChange={(e) => setCattleForm({...cattleForm, type: e.target.value})}
                  >
                    <option value="dairy">Dairy</option>
                    <option value="beef">Beef</option>
                    <option value="dual-purpose">Dual Purpose</option>
                  </select>
                </div>
                <div className="form-row">
                  <select
                    value={cattleForm.gender}
                    onChange={(e) => setCattleForm({...cattleForm, gender: e.target.value})}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Age (months) *"
                    value={cattleForm.age}
                    onChange={(e) => setCattleForm({...cattleForm, age: e.target.value})}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Weight (kg) *"
                    value={cattleForm.weight}
                    onChange={(e) => setCattleForm({...cattleForm, weight: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Production Information</h3>
                <div className="form-row">
                  <select
                    value={cattleForm.production.type}
                    onChange={(e) => setCattleForm({
                      ...cattleForm, 
                      production: {...cattleForm.production, type: e.target.value}
                    })}
                  >
                    <option value="milk">Milk</option>
                    <option value="eggs">Eggs</option>
                    <option value="none">None</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Daily Output"
                    value={cattleForm.production.dailyOutput}
                    onChange={(e) => setCattleForm({
                      ...cattleForm, 
                      production: {...cattleForm.production, dailyOutput: e.target.value}
                    })}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Location</h3>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Barn"
                    value={cattleForm.location.barn}
                    onChange={(e) => setCattleForm({
                      ...cattleForm, 
                      location: {...cattleForm.location, barn: e.target.value}
                    })}
                  />
                  <input
                    type="text"
                    placeholder="Pen"
                    value={cattleForm.location.pen}
                    onChange={(e) => setCattleForm({
                      ...cattleForm, 
                      location: {...cattleForm.location, pen: e.target.value}
                    })}
                  />
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={cattleForm.location.pastureAccess}
                    onChange={(e) => setCattleForm({
                      ...cattleForm, 
                      location: {...cattleForm.location, pastureAccess: e.target.checked}
                    })}
                  />
                  Has Pasture Access
                </label>
              </div>

              <div className="form-section">
                <h3>Notes</h3>
                <textarea
                  placeholder="Additional notes..."
                  value={cattleForm.notes}
                  onChange={(e) => setCattleForm({...cattleForm, notes: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Cattle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CattleManagement;
