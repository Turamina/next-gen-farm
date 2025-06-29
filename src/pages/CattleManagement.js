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
      setError('');
      
      console.log('Current user:', currentUser);
      console.log('User ID:', currentUser?.uid);
      
      if (!currentUser?.uid) {
        setError('User not authenticated');
        return;
      }

      console.log('Loading cattle data...');
      
      // Try to load cattle first
      const cattleData = await cattleService.getFarmerCattle(currentUser.uid);
      console.log('Cattle data loaded:', cattleData);
      setCattle(cattleData);
      
      // Then try to load stats
      try {
        const stats = await cattleService.getCattleStats(currentUser.uid);
        console.log('Stats loaded:', stats);
        setCattleStats(stats);
        
        // Make sure feeding suggestions are properly set
        if (stats.feedingRequirements) {
          console.log('Feeding requirements:', stats.feedingRequirements);
          setFeedingSuggestions(stats.feedingRequirements);
        } else {
          // If no feeding requirements, calculate them manually
          console.log('Calculating feeding requirements manually...');
          const manualSuggestions = cattleService.calculateFeedingRequirements(cattleData);
          console.log('Manual feeding suggestions:', manualSuggestions);
          setFeedingSuggestions(manualSuggestions);
        }
      } catch (statsError) {
        console.error('Error loading stats:', statsError);
        
        // Calculate feeding suggestions manually if stats fail
        if (cattleData.length > 0) {
          console.log('Calculating feeding suggestions from cattle data...');
          const feedingSuggestions = cattleService.calculateFeedingRequirements(cattleData);
          console.log('Manual feeding suggestions:', feedingSuggestions);
          setFeedingSuggestions(feedingSuggestions);
        }
        
        // Don't fail the whole operation if stats fail
        setCattleStats({
          totalCattle: cattleData.length,
          byType: { dairy: 0, beef: 0, 'dual-purpose': 0 },
          byGender: { male: 0, female: 0 },
          byAge: { calves: 0, young: 0, adult: 0 },
          totalProduction: { dailyMilk: 0, dailyEggs: 0 },
          feedingRequirements: feedingSuggestions || { totalDailyFeed: 0, totalDailyCost: 0, individualSuggestions: [] }
        });
      }
      
      setError('');
    } catch (err) {
      console.error('Error loading cattle data:', err);
      console.error('Error details:', err.message, err.code);
      setError(`Failed to load cattle data: ${err.message || 'Unknown error'}`);
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
      
      // Debug: Log the form data before sending
      console.log('=== FORM DATA DEBUG ===');
      console.log('Full cattle form:', cattleForm);
      console.log('Production data:', cattleForm.production);
      console.log('Daily output value:', cattleForm.production.dailyOutput);
      console.log('Daily output type:', typeof cattleForm.production.dailyOutput);
      console.log('=== END FORM DEBUG ===');
      
      // Add the cattle
      const newCattle = await cattleService.addCattle(currentUser.uid, cattleForm);
      console.log('New cattle added:', newCattle);
      
      setSuccess('Cattle added successfully!');
      setShowAddForm(false);
      
      // Reset form
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
      
      // Reload all data to get updated AI suggestions
      await loadCattleData();
      
    } catch (err) {
      console.error('Error adding cattle:', err);
      setError(`Failed to add cattle: ${err.message || 'Unknown error'}`);
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

  // Manual refresh for debugging
  const refreshData = async () => {
    console.log('Manual refresh triggered');
    await loadCattleData();
  };

  // Debug function - can be called from browser console
  window.debugCattleData = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser.uid) {
        console.log('No user found');
        return;
      }
      
      const cattleData = await cattleService.getFarmerCattle(currentUser.uid);
      console.log('=== MANUAL CATTLE DEBUG ===');
      console.log('Raw cattle data from database:', cattleData);
      cattleData.forEach((cattle, index) => {
        console.log(`Cattle ${index + 1}:`, {
          name: cattle.name,
          production: cattle.production,
          dailyOutput: cattle.production?.dailyOutput,
          type: typeof cattle.production?.dailyOutput
        });
      });
      console.log('=== END MANUAL DEBUG ===');
    } catch (error) {
      console.error('Debug error:', error);
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
      {activeTab === 'overview' && (
        <div className="overview-tab">
          {cattleStats ? (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Cattle</h3>
                  <div className="stat-number">{cattleStats.totalCattle}</div>
                </div>
                <div className="stat-card">
                  <h3>Daily Milk Production</h3>
                  <div className="stat-number">{cattleStats.totalProduction?.dailyMilk || 0} L</div>
                  <small style={{color: '#666', fontSize: '11px'}}>
                    From {cattle.filter(c => c.production?.type === 'milk' && c.production?.dailyOutput > 0).length} milk-producing cattle
                  </small>
                  <div style={{marginTop: '5px'}}>
                    <button onClick={refreshData} style={{fontSize: '10px', padding: '2px 6px'}}>
                      🔄 Debug Refresh
                    </button>
                  </div>
                </div>
                {cattleStats.totalProduction?.dailyEggs > 0 && (
                  <div className="stat-card">
                    <h3>Daily Egg Production</h3>
                    <div className="stat-number">{cattleStats.totalProduction?.dailyEggs || 0} pieces</div>
                    <small style={{color: '#666', fontSize: '11px'}}>
                      From {cattle.filter(c => c.production?.type === 'eggs' && c.production?.dailyOutput > 0).length} egg-producing animals
                    </small>
                  </div>
                )}
                <div className="stat-card">
                  <h3>Daily Feed Required</h3>
                  <div className="stat-number">{feedingSuggestions?.totalDailyFeed || 0} kg</div>
                </div>
                <div className="stat-card">
                  <h3>Daily Feed Cost</h3>
                  <div className="stat-number">৳{feedingSuggestions?.totalDailyCost || 0}</div>
                </div>
              </div>

              <div className="cattle-breakdown">
                <div className="breakdown-section">
                  <h3>By Type</h3>
                  <div className="breakdown-items">
                    <div className="breakdown-item">
                      <span>Dairy: {cattleStats.byType?.dairy || 0}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Beef: {cattleStats.byType?.beef || 0}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Dual-Purpose: {cattleStats.byType?.['dual-purpose'] || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="breakdown-section">
                  <h3>By Age Group</h3>
                  <div className="breakdown-items">
                    <div className="breakdown-item">
                      <span>Calves (0-12 months): {cattleStats.byAge?.calves || 0}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Young (12-24 months): {cattleStats.byAge?.young || 0}</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Adult (24+ months): {cattleStats.byAge?.adult || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-data">
              <h3>📊 Loading Statistics...</h3>
              <p>Add some cattle to see detailed analytics and feeding recommendations.</p>
            </div>
          )}
        </div>
      )}

      {/* Cattle List Tab */}
      {activeTab === 'cattle-list' && (
        <div className="cattle-list-tab">
          {cattle.length > 0 ? (
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
                    {animal.production?.type !== 'none' && animal.production?.dailyOutput > 0 && (
                      <p><strong>Daily {animal.production.type}:</strong> {animal.production.dailyOutput} {animal.production.unit}</p>
                    )}
                    {animal.production?.type === 'milk' && (!animal.production?.dailyOutput || animal.production?.dailyOutput <= 0) && (
                      <p style={{color: '#ff6b6b'}}><strong>Production:</strong> Not set or 0</p>
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
          ) : (
            <div className="no-data">
              <h3>🐄 No Cattle Added Yet</h3>
              <p>Start building your herd by adding your first cattle.</p>
              <button 
                className="btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                + Add Your First Cattle
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Feeding Guide Tab */}
      {activeTab === 'feeding' && (
        <div className="feeding-tab">
          {cattle.length > 0 ? (
            <>
              {/* Manual recalculate button for debugging */}
              <div style={{ marginBottom: '20px' }}>
                <button 
                  className="btn-secondary"
                  onClick={async () => {
                    console.log('Manually recalculating feeding suggestions...');
                    console.log('Current cattle:', cattle);
                    const newSuggestions = cattleService.calculateFeedingRequirements(cattle);
                    console.log('New suggestions:', newSuggestions);
                    setFeedingSuggestions(newSuggestions);
                    setSuccess('AI feeding recommendations updated!');
                  }}
                >
                  🔄 Refresh AI Calculations
                </button>
              </div>

              {feedingSuggestions && feedingSuggestions.individualSuggestions && feedingSuggestions.individualSuggestions.length > 0 ? (
                <>
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
                </>
              ) : (
                <div className="no-data">
                  <h3>🤖 Calculating AI Recommendations...</h3>
                  <p>You have {cattle.length} cattle. AI is processing feeding requirements...</p>
                  <button 
                    className="btn-primary"
                    onClick={async () => {
                      console.log('Calculating feeding suggestions for cattle:', cattle);
                      const suggestions = cattleService.calculateFeedingRequirements(cattle);
                      console.log('Calculated suggestions:', suggestions);
                      setFeedingSuggestions(suggestions);
                    }}
                  >
                    🤖 Generate AI Feeding Plan
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-data">
              <h3>🤖 AI Feeding Guide</h3>
              <p>Add cattle to your farm to get personalized AI-powered feeding recommendations.</p>
              <div className="feeding-info">
                <h4>What you'll get:</h4>
                <ul>
                  <li>📊 Daily feed requirements for each animal</li>
                  <li>💰 Cost calculations and budget planning</li>
                  <li>⏰ Optimal feeding schedule (3 times daily)</li>
                  <li>🥗 Nutritional tips based on your herd</li>
                  <li>🎯 Special requirements for pregnant, young, or sick animals</li>
                </ul>
              </div>
              <button 
                className="btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                + Add Cattle to Get AI Recommendations
              </button>
            </div>
          )}
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
                    onChange={(e) => {
                      const newType = e.target.value;
                      setCattleForm({
                        ...cattleForm, 
                        type: newType,
                        // Auto-set production type based on cattle type
                        production: {
                          ...cattleForm.production,
                          type: newType === 'dairy' ? 'milk' : cattleForm.production.type
                        }
                      });
                    }}
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
                    step="0.1"
                    placeholder={`Daily ${cattleForm.production.type === 'milk' ? 'Milk (Liters)' : cattleForm.production.type === 'eggs' ? 'Eggs (Pieces)' : 'Output'}`}
                    value={cattleForm.production.dailyOutput}
                    onChange={(e) => setCattleForm({
                      ...cattleForm, 
                      production: {...cattleForm.production, dailyOutput: e.target.value}
                    })}
                  />
                </div>
                {cattleForm.production.type === 'milk' && (
                  <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                    💡 Enter the average daily milk production in liters (e.g., 15.5)
                  </small>
                )}
                {cattleForm.production.type === 'eggs' && (
                  <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                    💡 Enter the average daily egg production in pieces (e.g., 12)
                  </small>
                )}
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
