const moment = require('moment');
const mongoose = require('mongoose');
const Passenger = require('../models/Passenger');

class DynamicCouponService {
  constructor() {
    this.passengerStats = new Map(); // Cache for passenger statistics
  }

  /**
   * Get dynamic coupons for passenger based on their profile
   * @param {Object} params
   * @param {Object} params.passengerMeta - Passenger metadata from database
   * @param {Object} params.config - Fare configuration
   * @param {number} params.fare - Current fare amount
   * @returns {Object} Dynamic coupons and eligibility
   */
  getDynamicCoupons({ passengerMeta, config, fare }) {
    const dynamicCoupons = this._calculateDynamicCoupons(passengerMeta, config, fare);
    
    return {
      dynamicCoupons,
      totalEligibleCoupons: dynamicCoupons.length,
      passengerProfile: this._getPassengerProfile(passengerMeta)
    };
  }

  /**
   * Calculate dynamic coupons based on passenger metadata
   * @private
   */
  _calculateDynamicCoupons(passengerMeta, config, fare) {
    const dynamicCoupons = [];

    // Check if dynamic coupon rules exist in config
    if (!config.dynamicCouponRules) {
      return dynamicCoupons;
    }

    const currentDate = new Date();

    for (const rule of config.dynamicCouponRules) {
      // Check validity period
      if (rule.validFrom || rule.validTo) {
        const validFrom = rule.validFrom ? new Date(rule.validFrom) : null;
        const validTo = rule.validTo ? new Date(rule.validTo) : null;
        
        if (validFrom && currentDate < validFrom) {
          continue; // Coupon not yet valid
        }
        
        if (validTo && currentDate > validTo) {
          continue; // Coupon expired
        }
      }

      const isEligible = this.evaluateCouponCondition(passengerMeta, rule.condition);
      
      if (isEligible) {
        const discount = this.calculateDynamicDiscount(rule, fare);
        if (discount > 0) {
          dynamicCoupons.push({
            code: rule.code,
            type: rule.type,
            value: rule.value,
            maxDiscount: rule.maxDiscount,
            minFare: rule.minFare || 0,
            discount,
            condition: rule.condition,
            description: this._getDynamicCouponDescription(rule, passengerMeta),
            passengerField: rule.passengerField,
            validFrom: rule.validFrom,
            validTo: rule.validTo
          });
        }
      }
    }

    return dynamicCoupons;
  }

  /**
   * Evaluate coupon condition based on passenger metadata
   * @public
   */
  evaluateCouponCondition(passengerMeta, condition) {
    if (!condition) return true;

    // Parse condition (e.g., "stats.totalTrips >= 10")
    const match = condition.match(/^(\w+(?:\.\w+)*)\s*([><=!]+)\s*(.+)$/);
    if (!match) {
      console.warn(`Invalid coupon condition format: ${condition}`);
      return false;
    }

    const [, fieldPath, operator, value] = match;
    const fieldValue = this._getPassengerMetric(passengerMeta, fieldPath);
    const compareValue = this._parseValue(value);

    return this._evaluateCondition(fieldValue, operator, compareValue);
  }

  /**
   * Get passenger metric value dynamically from passenger metadata
   * @private
   */
  _getPassengerMetric(passengerMeta, fieldPath) {
    // Validate if the field is a valid field in passenger collection
    const validFields = this._getValidPassengerFields();
    
    if (!validFields.includes(fieldPath)) {
      console.warn(`Invalid passenger field: ${fieldPath}. Valid fields are: ${validFields.join(', ')}`);
      return 0;
    }

    // Handle nested fields with dot notation
    if (fieldPath.includes('.')) {
      return this._getNestedFieldValue(passengerMeta, fieldPath);
    }

    // Handle direct field access
    const value = passengerMeta[fieldPath];
    
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
   * Get valid passenger fields for dynamic coupon rules
   * @private
   */
  _getValidPassengerFields() {
    return [
      // Basic fields
      'username',
      'phone',
      'email',
      'name',
      'isActive',
      'isBlocked',
      
      // Stats fields
      'stats.totalTrips',
      'stats.completedTrips',
      'stats.cancelledTrips',
      'stats.totalSpent',
      'stats.averageRating',
      'stats.totalRating',
      'stats.ratingCount',
      
      // Membership fields
      'membership.level',
      'membership.points',
      'membership.joinDate',
      'membership.lastTripDate',
      
      // Preferences fields
      'preferences.preferredPaymentMethod',
      'preferences.language',
      'preferences.notifications.push',
      'preferences.notifications.email',
      'preferences.notifications.sms',
      
      // Calculated fields
      'completion_rate',
      'total_spent',
      'days_since_last_trip',
      'membership_duration_days'
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
   * Parse value for comparison
   * @private
   */
  _parseValue(value) {
    // Try to parse as number first
    if (!isNaN(parseFloat(value))) {
      return parseFloat(value);
    }
    
    // Try to parse as date
    const date = moment(value, moment.ISO_8601, true);
    if (date.isValid()) {
      return date.toDate();
    }
    
    // Return as string
    return value;
  }

  /**
   * Evaluate condition
   * @private
   */
  _evaluateCondition(fieldValue, operator, compareValue) {
    switch (operator) {
      case '>=':
        return fieldValue >= compareValue;
      case '<=':
        return fieldValue <= compareValue;
      case '>':
        return fieldValue > compareValue;
      case '<':
        return fieldValue < compareValue;
      case '==':
        return fieldValue === compareValue;
      case '!=':
        return fieldValue !== compareValue;
      default:
        return false;
    }
  }

  /**
   * Calculate dynamic discount
   * @public
   */
  calculateDynamicDiscount(rule, fare) {
    let discount = 0;

    if (rule.type === 'percentage') {
      discount = (fare * rule.value) / 100;
    } else if (rule.type === 'fixed') {
      discount = rule.value;
    }

    // Apply maximum discount limit
    if (rule.maxDiscount) {
      discount = Math.min(discount, rule.maxDiscount);
    }

    // Check minimum fare requirement
    if (rule.minFare && fare < rule.minFare) {
      return 0;
    }

    return Math.round(discount);
  }

  /**
   * Get dynamic coupon description
   * @private
   */
  _getDynamicCouponDescription(rule, passengerMeta) {
    const fieldDescriptions = {
      'stats.totalTrips': 'Trip completion bonus',
      'stats.completedTrips': 'Completed trips reward',
      'stats.totalSpent': 'High spender reward',
      'stats.averageRating': 'High rating reward',
      'membership.level': 'Membership level reward',
      'membership.points': 'Loyalty points reward',
      'completion_rate': 'High completion rate reward',
      'total_spent': 'Total spending reward',
      'days_since_last_trip': 'Return customer reward'
    };
    
    const description = fieldDescriptions[rule.passengerField] || `Reward for ${rule.passengerField}`;
    return `${description}: ${rule.type === 'percentage' ? `${rule.value}% off` : `₹${rule.value} off`}`;
  }

  /**
   * Get passenger profile summary
   * @param {Object} passengerMeta - Passenger metadata
   * @returns {Object} Profile summary
   */
  _getPassengerProfile(passengerMeta) {
    const completionRate = passengerMeta.stats?.totalTrips > 0 
      ? Math.round((passengerMeta.stats.completedTrips / passengerMeta.stats.totalTrips) * 100)
      : 0;
    
    const daysSinceLastTrip = passengerMeta.membership?.lastTripDate 
      ? moment().diff(moment(passengerMeta.membership.lastTripDate), 'days')
      : null;
    
    const membershipDuration = passengerMeta.membership?.joinDate
      ? moment().diff(moment(passengerMeta.membership.joinDate), 'days')
      : 0;

    return {
      totalTrips: passengerMeta.stats?.totalTrips || 0,
      completedTrips: passengerMeta.stats?.completedTrips || 0,
      totalSpent: passengerMeta.stats?.totalSpent || 0,
      averageRating: passengerMeta.stats?.averageRating || 0,
      membershipLevel: passengerMeta.membership?.level || 'bronze',
      membershipPoints: passengerMeta.membership?.points || 0,
      completionRate,
      daysSinceLastTrip,
      membershipDuration,
      isActive: passengerMeta.isActive || false,
      isBlocked: passengerMeta.isBlocked || false
    };
  }

  /**
   * Get available dynamic coupons for passenger
   * @param {Object} params
   * @param {string} params.passengerId - Passenger ID
   * @param {number} params.fare - Current fare amount
   * @param {Object} params.config - Fare configuration
   * @returns {Object} Available dynamic coupons
   */
  async getAvailableDynamicCoupons({ passengerId, fare, config }) {
    try {
      // Get passenger data
      let passenger;
      if (mongoose.Types.ObjectId.isValid(passengerId)) {
        passenger = await Passenger.findByObjectId(passengerId);
      } else {
        passenger = await Passenger.findByUsername(passengerId) || 
                   await Passenger.findByPhone(passengerId) || 
                   await Passenger.findByEmail(passengerId);
      }

      if (!passenger) {
        return {
          success: false,
          error: 'Passenger not found'
        };
      }

      // Convert passenger to metadata format
      const passengerMeta = {
        username: passenger.username,
        phone: passenger.phone,
        email: passenger.email,
        name: passenger.name,
        isActive: passenger.isActive,
        isBlocked: passenger.isBlocked,
        stats: passenger.stats,
        membership: passenger.membership,
        preferences: passenger.preferences,
        profile: passenger.profile
      };

      const dynamicCoupons = this.getDynamicCoupons({
        passengerMeta,
        config,
        fare
      });

      return {
        success: true,
        data: {
          passengerId,
          fare,
          dynamicCoupons: dynamicCoupons.dynamicCoupons,
          passengerProfile: dynamicCoupons.passengerProfile,
          totalEligibleCoupons: dynamicCoupons.totalEligibleCoupons
        }
      };

    } catch (error) {
      console.error('Error getting dynamic coupons:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get all valid passenger fields for dynamic coupon rules
   * @returns {Object} Valid fields with descriptions
   */
  getValidPassengerFields() {
    const validFields = this._getValidPassengerFields();
    const fieldDescriptions = {};
    
    validFields.forEach(field => {
      fieldDescriptions[field] = {
        description: this._getFieldDescription(field),
        type: this._getFieldType(field),
        example: this._getFieldExample(field)
      };
    });
    
    return {
      validFields,
      fieldDescriptions,
      usage: 'Use these exact field names as passenger fields in dynamic coupon rules'
    };
  }

  /**
   * Get field description for documentation
   * @private
   */
  _getFieldDescription(field) {
    const descriptions = {
      'stats.totalTrips': 'Total number of trips',
      'stats.completedTrips': 'Number of completed trips',
      'stats.totalSpent': 'Total amount spent',
      'stats.averageRating': 'Average rating given by drivers',
      'membership.level': 'Membership level (bronze, silver, gold, platinum)',
      'membership.points': 'Loyalty points earned',
      'completion_rate': 'Percentage of completed trips',
      'total_spent': 'Total amount spent on rides',
      'days_since_last_trip': 'Days since last trip'
    };
    
    return descriptions[field] || `Passenger field: ${field}`;
  }

  /**
   * Get field type for documentation
   * @private
   */
  _getFieldType(field) {
    const typeMap = {
      'stats.totalTrips': 'number',
      'stats.completedTrips': 'number',
      'stats.totalSpent': 'number',
      'stats.averageRating': 'number',
      'membership.level': 'string',
      'membership.points': 'number',
      'completion_rate': 'number',
      'total_spent': 'number',
      'days_since_last_trip': 'number'
    };
    
    return typeMap[field] || 'unknown';
  }

  /**
   * Get field example for documentation
   * @private
   */
  _getFieldExample(field) {
    const exampleMap = {
      'stats.totalTrips': 25,
      'stats.completedTrips': 23,
      'stats.totalSpent': 1500,
      'stats.averageRating': 4.5,
      'membership.level': 'silver',
      'membership.points': 150,
      'completion_rate': 92,
      'total_spent': 1500,
      'days_since_last_trip': 3
    };
    
    return exampleMap[field] || 'varies';
  }

  /**
   * Update passenger statistics cache
   * @param {string} passengerId - Passenger ID
   * @param {Object} stats - Passenger statistics
   */
  updatePassengerStats(passengerId, stats) {
    this.passengerStats.set(passengerId, {
      ...stats,
      updatedAt: Date.now()
    });
  }

  /**
   * Get cached passenger statistics
   * @param {string} passengerId - Passenger ID
   * @returns {Object|null} Cached statistics
   */
  getCachedPassengerStats(passengerId) {
    const stats = this.passengerStats.get(passengerId);
    if (stats && Date.now() - stats.updatedAt < 5 * 60 * 1000) { // 5 minutes cache
      return stats;
    }
    return null;
  }

  /**
   * Clear passenger statistics cache
   */
  clearPassengerStatsCache() {
    this.passengerStats.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.passengerStats.size,
      entries: Array.from(this.passengerStats.entries()).map(([id, stats]) => ({
        passengerId: id,
        updatedAt: stats.updatedAt
      }))
    };
  }
}

module.exports = new DynamicCouponService(); 