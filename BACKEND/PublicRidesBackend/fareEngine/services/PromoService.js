const moment = require('moment');
const mongoose = require('mongoose');
const Passenger = require('../models/Passenger');

class PromoService {
  constructor() {
    // No longer using in-memory tracking
  }

  /**
   * Apply coupon to fare
   * @param {Object} params
   * @param {string} params.code - Coupon code
   * @param {number} params.fare - Base fare
   * @param {Object} params.config - Fare configuration
   * @param {string} params.userId - User ID for tracking usage
   * @param {boolean} params.trackUsage - Whether to track usage immediately (default: false)
   * @returns {Object} Result with updated fare and discount details
   */
  async applyCoupon({ code, fare, config, userId, trackUsage = false }) {
    const discountRule = this._findDiscountRule(code, config);
    
    if (!discountRule) {
      return {
        success: false,
        error: 'Invalid coupon code',
        fare,
        discount: 0
      };
    }

    // Validate coupon
    console.log('discountRule', discountRule);
    const validation = await this._validateCoupon(discountRule, fare, userId);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        fare,
        discount: 0
      };
    }

    // Calculate discount
    const discount = this._calculateDiscount(discountRule, fare);
    
    // Apply discount
    const finalFare = Math.max(fare - discount, config.minFare);

    // Track usage in database only if requested
    if (trackUsage) {
      await this._trackCouponUsage(code, userId, fare, discount);
    }

    return {
      success: true,
      fare: finalFare,
      discount,
      discountRule: {
        code: discountRule.code,
        type: discountRule.type,
        value: discountRule.value
      }
    };
  }

  /**
   * Find discount rule by code
   * @private
   */
  _findDiscountRule(code, config) {
    // Check dynamic coupon rules
    if (config.dynamicCouponRules) {
      const dynamicRule = config.dynamicCouponRules.find(rule => 
        rule.code.toUpperCase() === code.toUpperCase()
      );
      if (dynamicRule) {
        return dynamicRule;
      }
    }
    
    // No fallback to legacy discountRules - they have been completely replaced
    return null;
  }

  /**
   * Validate coupon
   * @private
   */
  async _validateCoupon(rule, fare, userId) {
    const now = moment();

    // Check validity period
    if (rule.validFrom || rule.validTo) {
      const validFrom = rule.validFrom ? moment(rule.validFrom) : null;
      const validTo = rule.validTo ? moment(rule.validTo) : null;
      
      if (validFrom && now.isBefore(validFrom)) {
        return {
          valid: false,
          error: 'Coupon not yet valid'
        };
      }
      
      if (validTo && now.isAfter(validTo)) {
        return {
          valid: false,
          error: 'Coupon has expired'
        };
      }
    }

    // Check minimum fare requirement
    if (fare < (rule.minFare || 0)) {
      return {
        valid: false,
        error: `Minimum fare of ${rule.minFare || 0} required for this coupon`
      };
    }

    // Check usage limit
    if (rule.usageLimit) {
      const usageCount = await this._getCouponUsageCount(rule.code, userId);
      if (usageCount >= rule.usageLimit) {
        return {
          valid: false,
          error: 'Coupon usage limit exceeded'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Calculate discount amount
   * @private
   */
  _calculateDiscount(rule, fare) {
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

    return Math.round(discount);
  }

  /**
   * Track coupon usage in database
   * @private
   */
  async _trackCouponUsage(code, userId, fareAmount, discountAmount) {
    try {
      // Find passenger by userId (could be ObjectId or username)
      let passenger;
      
      if (mongoose.Types.ObjectId.isValid(userId)) {
        console.log('userId is a valid ObjectId');
        passenger = await Passenger.findByObjectId(userId);
      } else {
        // Try to find by username first, then by other fields
        passenger = await Passenger.findByUsername(userId) || 
                   await Passenger.findByPhone(userId) || 
                   await Passenger.findByEmail(userId);
      }
      
      if (!passenger) {
        console.warn(`Passenger not found for userId: ${userId}`);
        return;
      }
      
      // Add coupon usage to passenger record
      await passenger.addCouponUsage({
        couponCode: code,
        fareAmount,
        discountAmount,
        usedAt: new Date()
      });
      
    } catch (error) {
      console.error('Error tracking coupon usage:', error);
    }
  }

  /**
   * Get coupon usage count from database
   * @private
   */
  async _getCouponUsageCount(code, userId) {
    try {
      // Find passenger by userId (could be ObjectId or username)
      let passenger;
      
      if (mongoose.Types.ObjectId.isValid(userId)) {
        passenger = await Passenger.findByObjectId(userId);
      } else {
        // Try to find by username first, then by other fields
        passenger = await Passenger.findByUsername(userId) || 
                   await Passenger.findByPhone(userId) || 
                   await Passenger.findByEmail(userId);
      }
      
      if (!passenger) {
        return 0;
      }
      
      return passenger.getCouponUsageCount(code);
      
    } catch (error) {
      console.error('Error getting coupon usage count:', error);
      return 0;
    }
  }

  /**
   * Get available coupons for a user
   * @param {Object} params
   * @param {string} params.userId - User ID
   * @param {number} params.fare - Base fare
   * @param {Object} params.config - Fare configuration
   * @returns {Array} Available coupons
   */
  async getAvailableCoupons({ userId, fare, config }) {
    const now = moment();
    const availableCoupons = [];

    // Check dynamic coupon rules first
    if (config.dynamicCouponRules) {
      for (const rule of config.dynamicCouponRules) {
        // Check validity period
        if (rule.validFrom || rule.validTo) {
          const validFrom = rule.validFrom ? moment(rule.validFrom) : null;
          const validTo = rule.validTo ? moment(rule.validTo) : null;
          
          if (validFrom && now.isBefore(validFrom)) {
            continue; // Coupon not yet valid
          }
          
          if (validTo && now.isAfter(validTo)) {
            continue; // Coupon expired
          }
        }

        // Check minimum fare
        if (fare < (rule.minFare || 0)) {
          continue;
        }

        // Check usage limit
        if (rule.usageLimit) {
          const usageCount = await this._getCouponUsageCount(rule.code, userId);
          if (usageCount >= rule.usageLimit) {
            continue;
          }
        }

        // Calculate potential discount
        const discount = this._calculateDiscount(rule, fare);

        availableCoupons.push({
          code: rule.code,
          type: rule.type,
          value: rule.value,
          maxDiscount: rule.maxDiscount,
          minFare: rule.minFare || 0,
          discount,
          description: this._getCouponDescription(rule),
          passengerField: rule.passengerField,
          condition: rule.condition,
          validFrom: rule.validFrom,
          validTo: rule.validTo
        });
      }
    }

    // Legacy discountRules have been completely replaced by dynamicCouponRules
    // No fallback needed

    return availableCoupons;
  }

  /**
   * Get coupon description
   * @private
   */
  _getCouponDescription(rule) {
    if (rule.type === 'percentage') {
      return `${rule.value}% off`;
    } else if (rule.type === 'fixed') {
      return `₹${rule.value} off`;
    }
    return 'Discount available';
  }

  /**
   * Reset coupon usage for testing
   */
  async resetCouponUsage(userId) {
    try {
      let passenger;
      
      if (mongoose.Types.ObjectId.isValid(userId)) {
        passenger = await Passenger.findByObjectId(userId);
      } else {
        passenger = await Passenger.findByUsername(userId) || 
                   await Passenger.findByPhone(userId) || 
                   await Passenger.findByEmail(userId);
      }
      
      if (passenger) {
        passenger.couponUsage = [];
        await passenger.save();
      }
    } catch (error) {
      console.error('Error resetting coupon usage:', error);
    }
  }

  /**
   * Get coupon usage statistics
   */
  async getCouponStats(userId) {
    try {
      let passenger;
      
      if (mongoose.Types.ObjectId.isValid(userId)) {
        passenger = await Passenger.findByObjectId(userId);
      } else {
        passenger = await Passenger.findByUsername(userId) || 
                   await Passenger.findByPhone(userId) || 
                   await Passenger.findByEmail(userId);
      }
      
      if (!passenger) {
        return {
          totalUsage: 0,
          uniqueCoupons: 0,
          totalDiscount: 0
        };
      }
      
      const uniqueCoupons = new Set(passenger.couponUsage.map(usage => usage.couponCode));
      const totalDiscount = passenger.couponUsage.reduce((sum, usage) => sum + usage.discountAmount, 0);
      
      return {
        totalUsage: passenger.couponUsage.length,
        uniqueCoupons: uniqueCoupons.size,
        totalDiscount
      };
    } catch (error) {
      console.error('Error getting coupon stats:', error);
      return {
        totalUsage: 0,
        uniqueCoupons: 0,
        totalDiscount: 0
      };
    }
  }
}

module.exports = new PromoService(); 