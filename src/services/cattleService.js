import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const cattleService = {
  // Add new cattle to farmer's collection
  addCattle: async (farmerId, cattleData) => {
    try {
      console.log('Adding cattle for farmer:', farmerId);
      
      const cattleCollection = collection(db, 'cattle');
      const cattle = {
        farmerId,
        tagNumber: cattleData.tagNumber,
        name: cattleData.name || '',
        breed: cattleData.breed,
        type: cattleData.type, // dairy, beef, dual-purpose
        gender: cattleData.gender, // male, female
        age: cattleData.age, // in months
        weight: cattleData.weight, // in kg
        healthStatus: cattleData.healthStatus || 'healthy',
        vaccinations: cattleData.vaccinations || [],
        
        // Production data
        production: {
          type: cattleData.production?.type || 'none', // milk, eggs, meat, none
          dailyOutput: cattleData.production?.dailyOutput && cattleData.production.dailyOutput !== '' 
            ? parseFloat(cattleData.production.dailyOutput) 
            : 0,
          unit: cattleData.production?.unit || 'liters', // liters, pieces, kg
          lastRecorded: cattleData.production?.lastRecorded || null
        },
        
        // Feeding data
        feeding: {
          dailyFeedAmount: cattleData.feeding?.dailyFeedAmount || 0,
          feedType: cattleData.feeding?.feedType || 'mixed',
          specialRequirements: cattleData.feeding?.specialRequirements || '',
          lastFed: cattleData.feeding?.lastFed || null
        },
        
        // Location and housing
        location: {
          barn: cattleData.location?.barn || '',
          pen: cattleData.location?.pen || '',
          pastureAccess: cattleData.location?.pastureAccess || false
        },
        
        // Purchase/birth info
        acquisition: {
          date: cattleData.acquisition?.date || null,
          type: cattleData.acquisition?.type || 'born', // bought, born, inherited
          cost: cattleData.acquisition?.cost || 0,
          source: cattleData.acquisition?.source || ''
        },
        
        // Health records
        health: {
          lastCheckup: cattleData.health?.lastCheckup || null,
          veterinarian: cattleData.health?.veterinarian || '',
          medications: cattleData.health?.medications || [],
          notes: cattleData.health?.notes || ''
        },
        
        // Status
        status: 'active', // active, sold, deceased, transferred
        notes: cattleData.notes || '',
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(cattleCollection, cattle);
      console.log('Cattle added with ID:', docRef.id);
      
      return { id: docRef.id, ...cattle };
    } catch (error) {
      console.error('Error adding cattle:', error);
      throw error;
    }
  },

  // Get all cattle for a farmer
  getFarmerCattle: async (farmerId) => {
    try {
      console.log('Fetching cattle for farmer:', farmerId);
      
      const cattleCollection = collection(db, 'cattle');
      
      // Use a simple query first to test connectivity
      const q = query(
        cattleCollection,
        where('farmerId', '==', farmerId)
      );
      
      const querySnapshot = await getDocs(q);
      const cattle = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include active cattle
        if (data.status === 'active' || !data.status) {
          cattle.push({ id: doc.id, ...data });
        }
      });
      
      // Sort manually by creation date
      cattle.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });
      
      console.log('Found cattle:', cattle.length);
      return cattle;
    } catch (error) {
      console.error('Error fetching cattle:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  },

  // Update cattle information
  updateCattle: async (cattleId, updates) => {
    try {
      console.log('Updating cattle:', cattleId);
      
      const cattleRef = doc(db, 'cattle', cattleId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(cattleRef, updateData);
      console.log('Cattle updated successfully');
      
      return updateData;
    } catch (error) {
      console.error('Error updating cattle:', error);
      throw error;
    }
  },

  // Record daily production (milk, eggs, etc.)
  recordProduction: async (cattleId, productionData) => {
    try {
      console.log('Recording production for cattle:', cattleId);
      
      // Add to production records collection
      const productionCollection = collection(db, 'production_records');
      const record = {
        cattleId,
        date: productionData.date || new Date().toISOString().split('T')[0],
        type: productionData.type, // milk, eggs, etc.
        amount: parseFloat(productionData.amount) || 0,
        unit: productionData.unit,
        quality: productionData.quality || 'good',
        notes: productionData.notes || '',
        recordedBy: productionData.recordedBy || '',
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(productionCollection, record);
      
      // Update cattle's last production data
      await cattleService.updateCattle(cattleId, {
        'production.lastRecorded': serverTimestamp(),
        'production.dailyOutput': parseFloat(productionData.amount) || 0
      });
      
      console.log('Production recorded with ID:', docRef.id);
      return { id: docRef.id, ...record };
    } catch (error) {
      console.error('Error recording production:', error);
      throw error;
    }
  },

  // Get production records for cattle
  getProductionRecords: async (cattleId, days = 30) => {
    try {
      const productionCollection = collection(db, 'production_records');
      const q = query(
        productionCollection,
        where('cattleId', '==', cattleId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const records = [];
      
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      
      return records;
    } catch (error) {
      console.error('Error fetching production records:', error);
      throw error;
    }
  },

  // Delete cattle (mark as inactive)
  deleteCattle: async (cattleId) => {
    try {
      console.log('Deleting cattle:', cattleId);
      
      const cattleRef = doc(db, 'cattle', cattleId);
      await updateDoc(cattleRef, {
        status: 'removed',
        updatedAt: serverTimestamp()
      });
      
      console.log('Cattle marked as removed');
      return true;
    } catch (error) {
      console.error('Error deleting cattle:', error);
      throw error;
    }
  },

  // AI-powered feeding suggestions
  calculateFeedingRequirements: (cattle) => {
    const suggestions = [];
    let totalDailyFeed = 0;
    let totalCost = 0;
    
    // Helper function for generating feeding notes
    const generateFeedingNotes = (animal) => {
      const notes = [];
      
      if (animal.age < 6) {
        notes.push('Young animal - provide high-quality starter feed');
      }
      
      if (animal.type === 'dairy' && animal.production?.dailyOutput > 15) {
        notes.push('High milk producer - increase protein and energy in feed');
      }
      
      if (animal.healthStatus === 'pregnant') {
        notes.push('Pregnant - increase calcium and folic acid supplements');
      }
      
      if (animal.weight < 300) {
        notes.push('Below average weight - consider increasing feed portions');
      }
      
      return notes.join('; ');
    };

    // Helper function for recommended feed types
    const getRecommendedFeedTypes = (cattle) => {
      const feedTypes = new Set();
      
      cattle.forEach(animal => {
        if (animal.type === 'dairy') {
          feedTypes.add('High-protein dairy concentrate');
          feedTypes.add('Alfalfa hay');
        } else if (animal.type === 'beef') {
          feedTypes.add('Corn silage');
          feedTypes.add('Grass hay');
        }
        
        if (animal.age < 12) {
          feedTypes.add('Calf starter feed');
        }
      });
      
      return Array.from(feedTypes);
    };

    // Helper function for feeding schedule
    const generateFeedingSchedule = () => {
      return {
        morning: {
          time: '6:00 AM',
          percentage: 40,
          notes: 'Main feeding with concentrates'
        },
        midday: {
          time: '12:00 PM',
          percentage: 20,
          notes: 'Light feeding, mostly roughage'
        },
        evening: {
          time: '6:00 PM',
          percentage: 40,
          notes: 'Second main feeding'
        }
      };
    };

    // Helper function for nutritional tips
    const getNutritionalTips = (cattle) => {
      const tips = [
        'Ensure fresh water is available at all times',
        'Provide mineral supplements twice a week',
        'Monitor body condition score monthly',
        'Rotate pastures to prevent overgrazing'
      ];
      
      const hasYoungAnimals = cattle.some(animal => animal.age < 12);
      const hasDairyCows = cattle.some(animal => animal.type === 'dairy');
      const hasPregnantAnimals = cattle.some(animal => animal.healthStatus === 'pregnant');
      
      if (hasYoungAnimals) {
        tips.push('Young animals need 18-20% protein in their diet');
      }
      
      if (hasDairyCows) {
        tips.push('Dairy cows need 16-18% protein for optimal milk production');
      }
      
      if (hasPregnantAnimals) {
        tips.push('Pregnant animals need extra calcium and phosphorus');
      }
      
      return tips;
    };
    
    cattle.forEach(animal => {
      let dailyFeedKg = 0;
      let feedCostPerKg = 0.5; // Base cost per kg of feed
      
      // Calculate based on animal type, weight, and age
      switch(animal.type.toLowerCase()) {
        case 'dairy':
          // Dairy cows need more feed for milk production
          dailyFeedKg = (animal.weight * 0.025) + (animal.production?.dailyOutput || 0) * 0.5;
          feedCostPerKg = 0.6;
          break;
        case 'beef':
          // Beef cattle need feed for growth
          dailyFeedKg = animal.weight * 0.02;
          feedCostPerKg = 0.4;
          break;
        case 'dual-purpose':
          // Dual purpose cattle
          dailyFeedKg = animal.weight * 0.022;
          feedCostPerKg = 0.5;
          break;
        default:
          dailyFeedKg = animal.weight * 0.02;
      }
      
      // Adjust for age (younger animals need more feed per kg body weight)
      if (animal.age < 12) {
        dailyFeedKg *= 1.3;
      } else if (animal.age < 24) {
        dailyFeedKg *= 1.1;
      }
      
      // Adjust for health status
      if (animal.healthStatus === 'sick') {
        dailyFeedKg *= 0.8;
      } else if (animal.healthStatus === 'pregnant') {
        dailyFeedKg *= 1.2;
      }
      
      const dailyCost = dailyFeedKg * feedCostPerKg;
      totalDailyFeed += dailyFeedKg;
      totalCost += dailyCost;
      
      suggestions.push({
        cattleId: animal.id,
        cattleName: animal.name || `${animal.breed} #${animal.tagNumber}`,
        dailyFeedKg: Math.round(dailyFeedKg * 100) / 100,
        dailyCost: Math.round(dailyCost * 100) / 100,
        feedType: animal.type === 'dairy' ? 'High-protein dairy feed' : 'Standard cattle feed',
        specialNotes: generateFeedingNotes(animal)
      });
    });
    
    return {
      individualSuggestions: suggestions,
      totalDailyFeed: Math.round(totalDailyFeed * 100) / 100,
      totalDailyCost: Math.round(totalCost * 100) / 100,
      totalMonthlyCost: Math.round(totalCost * 30 * 100) / 100,
      recommendedFeedTypes: getRecommendedFeedTypes(cattle),
      feedingSchedule: generateFeedingSchedule(),
      nutritionalTips: getNutritionalTips(cattle)
    };
  },

  // Get cattle statistics for dashboard
  getCattleStats: async (farmerId) => {
    try {
      const cattle = await cattleService.getFarmerCattle(farmerId);
      
      // Debug: Log all cattle data
      console.log('=== DEBUGGING CATTLE STATS ===');
      console.log('Total cattle found:', cattle.length);
      
      cattle.forEach((c, index) => {
        console.log(`Cattle ${index + 1}:`, {
          name: c.name,
          tagNumber: c.tagNumber,
          type: c.type,
          production: c.production,
          productionType: c.production?.type,
          dailyOutput: c.production?.dailyOutput,
          dailyOutputType: typeof c.production?.dailyOutput
        });
      });
      
      const milkCattle = cattle.filter(c => {
        const hasProduction = c.production && c.production.type === 'milk';
        const hasOutput = c.production && c.production.dailyOutput && c.production.dailyOutput > 0;
        console.log(`Cattle ${c.tagNumber}: hasProduction=${hasProduction}, hasOutput=${hasOutput}, dailyOutput=${c.production?.dailyOutput}`);
        return hasProduction && hasOutput;
      });
      
      console.log('Milk-producing cattle count:', milkCattle.length);
      
      const totalMilk = milkCattle.reduce((sum, c) => {
        const output = parseFloat(c.production.dailyOutput) || 0;
        console.log(`Adding milk from ${c.name || c.tagNumber}: ${output} (type: ${typeof output})`);
        return sum + output;
      }, 0);
      
      console.log('Total milk calculated:', totalMilk);
      console.log('=== END DEBUGGING ===');
      
      const stats = {
        totalCattle: cattle.length,
        byType: {
          dairy: cattle.filter(c => c.type === 'dairy').length,
          beef: cattle.filter(c => c.type === 'beef').length,
          'dual-purpose': cattle.filter(c => c.type === 'dual-purpose').length
        },
        byGender: {
          male: cattle.filter(c => c.gender === 'male').length,
          female: cattle.filter(c => c.gender === 'female').length
        },
        byAge: {
          calves: cattle.filter(c => c.age <= 12).length,
          young: cattle.filter(c => c.age > 12 && c.age <= 24).length,
          adult: cattle.filter(c => c.age > 24).length
        },
        totalProduction: {
          dailyMilk: totalMilk,
          dailyEggs: cattle
            .filter(c => c.production && c.production.type === 'eggs' && c.production.dailyOutput > 0)
            .reduce((sum, c) => sum + (parseFloat(c.production.dailyOutput) || 0), 0)
        },
        feedingRequirements: cattleService.calculateFeedingRequirements(cattle)
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting cattle stats:', error);
      throw error;
    }
  }
};

export default cattleService;
