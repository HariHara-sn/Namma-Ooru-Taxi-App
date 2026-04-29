const moment = require('moment');

class CancellationService {
  constructor() {
    this.cancellationHistory = new Map(); // Track cancellation history
  }

  /**
   * Get cancellation fee
   * @param {Object} params
   * @param {Date} params.cancelledAt - When cancellation occurred
   * @param {Date} params.requestedAt - When trip was requested
   * @param {Object} params.config - Fare configuration
   * @param {string} params.userId - User ID for tracking
   * @returns {Object} Cancellation fee details
   */
  getCancellationFee({ cancelledAt, requestedAt, config, userId }) {
    const timeDiff = this._calculateTimeDifference(requestedAt, cancelledAt);
    const fee = this._calculateFee(timeDiff, config);
    
    // Track cancellation
    this._trackCancellation(userId, {
      requestedAt,
      cancelledAt,
      timeDiff,
      fee
    });

    return {
      fee,
      timeDiff,
      isFreeCancellation: fee === 0,
      description: this._getCancellationDescription(timeDiff, fee, config)
    };
  }

  /**
   * Calculate time difference in minutes
   * @private
   */
  _calculateTimeDifference(requestedAt, cancelledAt) {
    const requested = moment(requestedAt);
    const cancelled = moment(cancelledAt);
    return cancelled.diff(requested, 'minutes');
  }

  /**
   * Calculate cancellation fee based on time difference
   * @private
   */
  _calculateFee(timeDiff, config) {
    const { cancellationPolicy } = config;
    
    // Check if within free cancellation window
    if (timeDiff <= cancellationPolicy.freeCancellationWindow) {
      return 0;
    }

    // Find applicable fee based on time windows
    for (const feeRule of cancellationPolicy.cancellationFees) {
      if (feeRule.timeWindow === null || timeDiff <= feeRule.timeWindow) {
        return feeRule.fee;
      }
    }

    // Return maximum fee if no specific rule applies
    const maxFee = Math.max(...cancellationPolicy.cancellationFees.map(f => f.fee));
    return maxFee;
  }

  /**
   * Get cancellation description
   * @private
   */
  _getCancellationDescription(timeDiff, fee, config) {
    const { cancellationPolicy } = config;
    
    if (fee === 0) {
      return `Free cancellation within ${cancellationPolicy.freeCancellationWindow} minutes`;
    }
    
    if (timeDiff <= cancellationPolicy.freeCancellationWindow) {
      return 'Free cancellation';
    }
    
    return `Cancellation fee: ₹${fee} (${timeDiff} minutes after booking)`;
  }

  /**
   * Track cancellation for analytics
   * @private
   */
  _trackCancellation(userId, data) {
    const userCancellations = this.cancellationHistory.get(userId) || [];
    userCancellations.push({
      ...data,
      timestamp: Date.now()
    });
    
    // Keep only last 10 cancellations per user
    if (userCancellations.length > 10) {
      userCancellations.splice(0, userCancellations.length - 10);
    }
    
    this.cancellationHistory.set(userId, userCancellations);
  }

  /**
   * Get user cancellation history
   * @param {string} userId - User ID
   * @returns {Array} Cancellation history
   */
  getUserCancellationHistory(userId) {
    return this.cancellationHistory.get(userId) || [];
  }

  /**
   * Get cancellation statistics for a user
   * @param {string} userId - User ID
   * @returns {Object} Cancellation statistics
   */
  getUserCancellationStats(userId) {
    const history = this.getUserCancellationHistory(userId);
    
    if (history.length === 0) {
      return {
        totalCancellations: 0,
        totalFees: 0,
        averageTimeToCancel: 0,
        freeCancellations: 0,
        paidCancellations: 0
      };
    }

    const totalFees = history.reduce((sum, record) => sum + record.fee, 0);
    const averageTimeToCancel = history.reduce((sum, record) => sum + record.timeDiff, 0) / history.length;
    const freeCancellations = history.filter(record => record.fee === 0).length;
    const paidCancellations = history.filter(record => record.fee > 0).length;

    return {
      totalCancellations: history.length,
      totalFees,
      averageTimeToCancel: Math.round(averageTimeToCancel),
      freeCancellations,
      paidCancellations
    };
  }

  /**
   * Get cancellation policy details
   * @param {Object} config - Fare configuration
   * @returns {Object} Policy details
   */
  getCancellationPolicyDetails(config) {
    const { cancellationPolicy } = config;
    
    return {
      freeCancellationWindow: cancellationPolicy.freeCancellationWindow,
      feeStructure: cancellationPolicy.cancellationFees.map(fee => ({
        timeWindow: fee.timeWindow === null ? 'No limit' : `${fee.timeWindow} minutes`,
        fee: `₹${fee.fee}`
      })),
      description: `Free cancellation within ${cancellationPolicy.freeCancellationWindow} minutes of booking`
    };
  }

  /**
   * Validate cancellation request
   * @param {Object} params
   * @param {Date} params.requestedAt - When trip was requested
   * @param {Date} params.cancelledAt - When cancellation is requested
   * @returns {Object} Validation result
   */
  validateCancellationRequest({ requestedAt, cancelledAt }) {
    const requested = moment(requestedAt);
    const cancelled = moment(cancelledAt);
    
    if (cancelled.isBefore(requested)) {
      return {
        valid: false,
        error: 'Cancellation time cannot be before request time'
      };
    }
    
    if (cancelled.isAfter(moment().add(1, 'hour'))) {
      return {
        valid: false,
        error: 'Cancellation time cannot be in the future'
      };
    }
    
    return { valid: true };
  }

  /**
   * Get cancellation analytics
   * @returns {Object} Analytics data
   */
  getCancellationAnalytics() {
    const allCancellations = Array.from(this.cancellationHistory.values()).flat();
    
    if (allCancellations.length === 0) {
      return {
        totalCancellations: 0,
        totalFees: 0,
        averageTimeToCancel: 0,
        freeCancellations: 0,
        paidCancellations: 0,
        uniqueUsers: 0
      };
    }

    const totalFees = allCancellations.reduce((sum, record) => sum + record.fee, 0);
    const averageTimeToCancel = allCancellations.reduce((sum, record) => sum + record.timeDiff, 0) / allCancellations.length;
    const freeCancellations = allCancellations.filter(record => record.fee === 0).length;
    const paidCancellations = allCancellations.filter(record => record.fee > 0).length;
    const uniqueUsers = this.cancellationHistory.size;

    return {
      totalCancellations: allCancellations.length,
      totalFees,
      averageTimeToCancel: Math.round(averageTimeToCancel),
      freeCancellations,
      paidCancellations,
      uniqueUsers
    };
  }

  /**
   * Clear cancellation history (for testing)
   */
  clearCancellationHistory() {
    this.cancellationHistory.clear();
  }

  /**
   * Get cancellation history size
   */
  getHistorySize() {
    return this.cancellationHistory.size;
  }
}

module.exports = new CancellationService(); 