class IncentiveService {
  constructor() {
    this.driverStats = new Map(); // Cache for driver statistics
  }

  /**
   * Get incentives/penalties for driver
   * @param {Object} params
   * @param {Object} params.driverMeta - Driver metadata from database
   * @param {Object} params.config - Fare configuration
   * @returns {Object} Incentives and penalties
   */
  getIncentives({ driverMeta, config }) {
    const incentives = this._calculateIncentives(driverMeta, config);
    const penalties = this._calculatePenalties(driverMeta, config);
    
    return {
      incentives,
      penalties,
      totalAdjustment: incentives.total - penalties.total
    };
  }

  /**
   * Calculate driver incentives
   * @private
   */
  _calculateIncentives(driverMeta, config) {
    const incentives = [];
    let total = 0;

    for (const incentive of config.incentives.driverIncentives) {
      const amount = this._evaluateIncentive(driverMeta, incentive);
      
      if (amount > 0) {
        incentives.push({
          type: incentive.type,
          condition: incentive.condition,
          amount,
          description: this._getIncentiveDescription(incentive, amount)
        });
        total += amount;
      }
    }
    return { incentives, total };
  }

  /**
   * Calculate driver penalties
   * @private
   */
  _calculatePenalties(driverMeta, config) {
    const penalties = [];
    let total = 0;

    for (const penalty of config.incentives.driverPenalties) {
      const amount = this._evaluatePenalty(driverMeta, penalty);
      if (amount > 0) {
        penalties.push({
          type: penalty.type,
          condition: penalty.condition,
          amount,
          description: this._getPenaltyDescription(penalty, amount)
        });
        total += amount;
      }
    }

    return { penalties, total };
  }

  /**
   * Evaluate incentive based on driver metadata
   * @private
   */
  _evaluateIncentive(driverMeta, incentive) {
    const value = this._getDriverMetric(driverMeta, incentive.type);
    const condition = incentive.condition;
    
    if (this._evaluateCondition(value, condition)) {
      return incentive.bonus || 0;
    }
    
    return 0;
  }

  /**
   * Evaluate penalty based on driver metadata
   * @private
   */
  _evaluatePenalty(driverMeta, penalty) {
    const value = this._getDriverMetric(driverMeta, penalty.type);
    const condition = penalty.condition;
    
    if (this._evaluateCondition(value, condition)) {
      return penalty.penalty || 0;
    }
    
    return 0;
  }

  /**
   * Get driver metric value dynamically from driver metadata
   * @private
   */
  _getDriverMetric(driverMeta, type) {
    // Validate if the type is a valid field in driver collection
    const validFields = this._getValidDriverFields();
    
    if (!validFields.includes(type)) {
      console.warn(`Invalid incentive type: ${type}. Valid fields are: ${validFields.join(', ')}`);
      return 0;
    }

    // Handle special calculated fields
    if (type === 'acceptance_rate') {
      return this._calculateAcceptanceRate(driverMeta);
    }

    // Handle nested fields with dot notation
    if (type.includes('.')) {
      return this._getNestedFieldValue(driverMeta, type);
    }

    // Handle direct field access
    const value = driverMeta[type];
    
    // Convert boolean to number for comparison
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    
    // Convert string numbers to float
    if (typeof value === 'string' && !isNaN(parseFloat(value))) {
      return parseFloat(value);
    }
    
    return value || 0;
  }

  /**
   * Get valid driver fields for incentive types
   * @private
   */
  _getValidDriverFields() {
    return [
      // Basic fields
      'rating',
      'tripCountToday',
      'totalTripsAccepted',
      'totalTripsRejected',
      'totalTripsCompleted',
      'isTrusted',
      'isActive',
      'isVerified',
      
      // Nested fields
      'liveStats.isOnline',
      'liveStats.lastSeen',
      'preferences.maxDistance',
      'preferences.minFare',
      'earnings.totalEarnings',
      'earnings.todayEarnings',
      'earnings.weeklyEarnings',
      'earnings.monthlyEarnings',
      
      // Calculated fields
      'acceptance_rate',
      'total_trips',
      'rejection_rate'
    ];
  }

  /**
   * Get nested field value using dot notation
   * @private
   */
  _getNestedFieldValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Get dynamic field description
   * @private
   */
  _getFieldDescription(field, type) {
    const fieldDescriptions = {
      // Basic fields
      'rating': type === 'incentive' ? 'High rating bonus' : 'Low rating penalty',
      'tripCountToday': type === 'incentive' ? 'Daily trip count bonus' : 'Low daily trip count penalty',
      'totalTripsAccepted': type === 'incentive' ? 'High acceptance bonus' : 'Low acceptance penalty',
      'totalTripsRejected': type === 'incentive' ? 'Low rejection bonus' : 'High rejection penalty',
      'totalTripsCompleted': type === 'incentive' ? 'Completion bonus' : 'Low completion penalty',
      'isTrusted': type === 'incentive' ? 'Trusted driver bonus' : 'Non-trusted driver penalty',
      'isActive': type === 'incentive' ? 'Active driver bonus' : 'Inactive driver penalty',
      'isVerified': type === 'incentive' ? 'Verified driver bonus' : 'Unverified driver penalty',
      
      // Nested fields
      'liveStats.isOnline': type === 'incentive' ? 'Online status bonus' : 'Offline status penalty',
      'earnings.totalEarnings': type === 'incentive' ? 'High earnings bonus' : 'Low earnings penalty',
      'earnings.todayEarnings': type === 'incentive' ? 'Today earnings bonus' : 'Low today earnings penalty',
      'earnings.weeklyEarnings': type === 'incentive' ? 'Weekly earnings bonus' : 'Low weekly earnings penalty',
      'earnings.monthlyEarnings': type === 'incentive' ? 'Monthly earnings bonus' : 'Low monthly earnings penalty',
      'preferences.maxDistance': type === 'incentive' ? 'High distance preference bonus' : 'Low distance preference penalty',
      'preferences.minFare': type === 'incentive' ? 'Low fare preference bonus' : 'High fare preference penalty',
      
      // Calculated fields
      'acceptance_rate': type === 'incentive' ? 'High acceptance rate bonus' : 'Low acceptance rate penalty',
      'total_trips': type === 'incentive' ? 'Experience bonus' : 'Low experience penalty',
      'rejection_rate': type === 'incentive' ? 'Low rejection rate bonus' : 'High rejection rate penalty'
    };
    
    return fieldDescriptions[field] || `${type === 'incentive' ? 'Bonus' : 'Penalty'} for ${field}`;
  }

  /**
   * Calculate acceptance rate
   * @private
   */
  _calculateAcceptanceRate(driverMeta) {
    const accepted = driverMeta.totalTripsAccepted || 0;
    const rejected = driverMeta.totalTripsRejected || 0;
    const total = accepted + rejected;
    
    if (total === 0) {
      return driverMeta.acceptanceRate || -1; // Use stored rate if available
    }
    
    return Math.round((accepted / total) * 100);
  }

  /**
   * Evaluate condition
   * @private
   */
  _evaluateCondition(value, condition) {
    if (condition.startsWith('>=')) {
      const threshold = parseFloat(condition.substring(2));
      return value >= threshold;
    } else if (condition.startsWith('<=')) {
      const threshold = parseFloat(condition.substring(2));
      return value <= threshold;
    } else if (condition.startsWith('>')) {
      const threshold = parseFloat(condition.substring(1));
      return value > threshold;
    } else if (condition.startsWith('<')) {
      const threshold = parseFloat(condition.substring(1));
      return value < threshold;
    } else if (condition.startsWith('==')) {
      const threshold = parseFloat(condition.substring(2));
      return value === threshold;
    } else if (condition.startsWith('!=')) {
      const threshold = parseFloat(condition.substring(2));
      return value !== threshold;
    }
    
    return false;
  }

  /**
   * Get incentive description
   * @private
   */
  _getIncentiveDescription(incentive, amount) {
    const description = this._getFieldDescription(incentive.type, 'incentive');
    return `${description}: ₹${amount}`;
  }

  /**
   * Get penalty description
   * @private
   */
  _getPenaltyDescription(penalty, amount) {
    const description = this._getFieldDescription(penalty.type, 'penalty');
    return `${description}: ₹${amount}`;
  }

  /**
   * Get driver performance summary
   * @param {Object} driverMeta - Driver metadata
   * @returns {Object} Performance summary
   */
  getDriverPerformanceSummary(driverMeta) {
    const acceptanceRate = this._calculateAcceptanceRate(driverMeta);
    const rating = parseFloat(driverMeta.rating) || 0;
    const tripCountToday = driverMeta.tripCountToday || 0;
    const totalTrips = (driverMeta.totalTripsAccepted || 0) + (driverMeta.totalTripsRejected || 0);
    
    return {
      acceptanceRate,
      rating,
      tripCountToday,
      totalTrips,
      isTrusted: driverMeta.isTrusted || false,
      isOnline: driverMeta.liveStats?.isOnline || false,
      lastTripTime: driverMeta.lastTripTime,
      lastAssignedAt: driverMeta.lastAssignedAt
    };
  }

  /**
   * Update driver statistics cache
   * @param {string} driverId - Driver ID
   * @param {Object} stats - Driver statistics
   */
  updateDriverStats(driverId, stats) {
    this.driverStats.set(driverId, {
      ...stats,
      updatedAt: Date.now()
    });
  }

  /**
   * Get cached driver statistics
   * @param {string} driverId - Driver ID
   * @returns {Object|null} Cached statistics
   */
  getCachedDriverStats(driverId) {
    const stats = this.driverStats.get(driverId);
    if (stats && Date.now() - stats.updatedAt < 5 * 60 * 1000) { // 5 minutes cache
      return stats;
    }
    return null;
  }

  /**
   * Clear driver statistics cache
   */
  clearDriverStatsCache() {
    this.driverStats.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.driverStats.size,
      entries: Array.from(this.driverStats.entries()).map(([id, stats]) => ({
        driverId: id,
        updatedAt: stats.updatedAt
      }))
    };
  }

  /**
   * Get all valid incentive types for API documentation
   * @returns {Object} Valid fields with descriptions
   */
  getValidIncentiveTypes() {
    const validFields = this._getValidDriverFields();
    const fieldDescriptions = {};
    
    validFields.forEach(field => {
      fieldDescriptions[field] = {
        description: this._getFieldDescription(field, 'incentive').replace(' bonus', ''),
        type: this._getFieldType(field),
        example: this._getFieldExample(field)
      };
    });
    
    return {
      validFields,
      fieldDescriptions,
      usage: 'Use these exact field names as incentive types in your fare configuration'
    };
  }

  /**
   * Get field type for documentation
   * @private
   */
  _getFieldType(field) {
    const typeMap = {
      'rating': 'number',
      'tripCountToday': 'number',
      'totalTripsAccepted': 'number',
      'totalTripsRejected': 'number',
      'totalTripsCompleted': 'number',
      'isTrusted': 'boolean',
      'isActive': 'boolean',
      'isVerified': 'boolean',
      'liveStats.isOnline': 'boolean',
      'earnings.totalEarnings': 'number',
      'earnings.todayEarnings': 'number',
      'earnings.weeklyEarnings': 'number',
      'earnings.monthlyEarnings': 'number',
      'preferences.maxDistance': 'number',
      'preferences.minFare': 'number',
      'acceptance_rate': 'number',
      'total_trips': 'number',
      'rejection_rate': 'number'
    };
    
    return typeMap[field] || 'unknown';
  }

  /**
   * Get field example for documentation
   * @private
   */
  _getFieldExample(field) {
    const exampleMap = {
      'rating': 4.5,
      'tripCountToday': 8,
      'totalTripsAccepted': 150,
      'totalTripsRejected': 12,
      'totalTripsCompleted': 145,
      'isTrusted': true,
      'isActive': true,
      'isVerified': true,
      'liveStats.isOnline': true,
      'earnings.totalEarnings': 45000,
      'earnings.todayEarnings': 1200,
      'earnings.weeklyEarnings': 8500,
      'earnings.monthlyEarnings': 32000,
      'preferences.maxDistance': 50,
      'preferences.minFare': 50,
      'acceptance_rate': 92,
      'total_trips': 162,
      'rejection_rate': 8
    };
    
    return exampleMap[field] || 'varies';
  }
}

module.exports = new IncentiveService(); 