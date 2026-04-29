const moment = require('moment');

class SurgeService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get surge adjustment based on time, zone, and config
   * @param {Object} params
   * @param {Date} params.time - Current time
   * @param {string} params.zone - Zone type (business, airport, residential, etc.)
   * @param {Object} params.config - Fare configuration
   * @returns {Object} Surge adjustment with multiplier and fixed adjustment
   */
  getSurgeMultiplier({ time, zone, config, fare }) {
    if (!config.surge || !config.surge.enabled) {
      return {
        multiplier: 1.0,
        fixedAdjustment: 0
      };
    }

    // const cacheKey = `${zone}_${moment(time).format('YYYY-MM-DD_HH:mm')}`;
    // const cached = this.cache.get(cacheKey);
    
    // if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
    //   return cached.adjustment;
    // }

    const adjustment = this._calculateSurgeMultiplier(time, zone, config, fare);
    
    // this.cache.set(cacheKey, {
    //   adjustment,
    //   timestamp: Date.now()
    // });

    return adjustment;
  }

  /**
   * Calculate surge adjustment based on time and zone
   * @private
   */
  _calculateSurgeMultiplier(time, zone, config, fare) {
    const currentTime = moment(time);
    const currentDay = currentTime.format('dddd').toLowerCase();
    const currentTimeStr = currentTime.format('HH:mm');
  
    let surgeAmount = 0;
  
    for (const surgeRule of config.surge.multipliers) {
      if (this._isSurgeRuleApplicable(surgeRule, currentDay, currentTimeStr, zone)) {
        console.log('surgeRule', surgeRule);
  
        if (surgeRule.type === 'multiplier') {
          surgeAmount = fare * (surgeRule.value - 1); // Add only the *extra*
        } else if (surgeRule.type === 'fixed') {
          surgeAmount = surgeRule.value;
        }
  
        break; // If only one rule should apply, break here
      }
    }
  
    return surgeAmount;
  }
  

  /**
   * Check if surge rule is applicable
   * @private
   */
  _isSurgeRuleApplicable(rule, currentDay, currentTime, zone) {
    // Check if current day is in rule days
    if (!rule.days.includes(currentDay)) {
      return false;
    }

    // Check if current time is within time range
    if (!this._isTimeInRange(currentTime, rule.timeRange)) {
      return false;
    }

    // Check if zone is applicable
    if (!rule.zones.includes('all') && !rule.zones.includes(zone)) {
      return false;
    }

    return true;
  }

  /**
   * Check if time is within range
   * @private
   */
  _isTimeInRange(currentTime, timeRange) {
    const start = moment(timeRange.start, 'HH:mm');
    const end = moment(timeRange.end, 'HH:mm');
    const current = moment(currentTime, 'HH:mm');

    // Handle overnight ranges (e.g., 22:00 to 06:00)
    if (end.isBefore(start)) {
      return current.isSameOrAfter(start) || current.isBefore(end);
    }

    return current.isBetween(start, end, null, '[]');
  }

  /**
   * Get surge multiplier for multiple zones
   * @param {Object} params
   * @param {Date} params.time - Current time
   * @param {Array} params.zones - Array of zones
   * @param {Object} params.config - Fare configuration
   * @returns {Object} Object with zone as key and multiplier as value
   */
  getSurgeMultipliersForZones({ time, zones, config }) {
    const multipliers = {};
    
    for (const zone of zones) {
      multipliers[zone] = this.getSurgeMultiplier({ time, zone, config });
    }

    return multipliers;
  }

  /**
   * Clear surge cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout
    };
  }
}

module.exports = new SurgeService(); 