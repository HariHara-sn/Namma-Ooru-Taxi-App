const PromoService = require('./PromoService');
const DynamicCouponService = require('./DynamicCouponService');
const FareConfig = require('../models/FareConfig');
const Trip = require('../models/Trip');
const Passenger = require('../models/Passenger');
const mongoose = require('mongoose');

class CouponVerificationService {
  constructor() {
    this.promoService = PromoService;
    this.dynamicCouponService = DynamicCouponService;
  }

  /**
   * Verify and apply coupon to trip
   * @param {Object} params
   * @param {string} params.tripId - Trip ID
   * @param {string} params.couponCode - Coupon code to verify
   * @param {number} params.fare - Base fare for verification
   * @param {string} params.regionCode - Region code
   * @returns {Object} Verification and application result
   */
  async verifyAndApplyCoupon({ tripId, couponCode, fare, regionCode = 'default' }) {
    try {
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: 'Fare configuration not found for region'
        };
      }

      // Get trip data
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return {
          success: false,
          error: 'Trip not found'
        };
      }

      // Get primary passenger
      let passengerId = trip.userId;
      if(!passengerId){
        passengerId = trip.createdBy;
      }
      const primaryPassengerId = passengerId;
      let passenger;
      
      if (mongoose.Types.ObjectId.isValid(primaryPassengerId)) {
        passenger = await Passenger.findByObjectId(primaryPassengerId);
      } else {
        passenger = await Passenger.findByUsername(primaryPassengerId) || 
                   await Passenger.findByPhone(primaryPassengerId) || 
                   await Passenger.findByEmail(primaryPassengerId);
      }

      if (!passenger) {
        return {
          success: false,
          error: 'Passenger not found'
        };
      }

      // Convert passenger to metadata format for dynamic coupon validation
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

      // First, check if this is a dynamic coupon by looking for it in dynamicCouponRules
      const dynamicCoupon = config.dynamicCouponRules?.find(rule => 
        rule.code.toUpperCase() === couponCode.toUpperCase()
      );

      if (dynamicCoupon) {
        // Comprehensive validation for dynamic coupon
        const validationResult = await this._validateDynamicCoupon(dynamicCoupon, passengerMeta, fare, primaryPassengerId);
        
        if (!validationResult.valid) {
          return {
            success: false,
            error: validationResult.error,
            couponCode
          };
        }

        // Add coupon to trip (but don't track usage yet)
        await trip.addCoupon(couponCode);

        return {
          success: true,
          data: {
            tripId,
            couponCode,
            discount: validationResult.discount,
            finalFare: fare - validationResult.discount,
            discountRule: {
              code: dynamicCoupon.code,
              type: dynamicCoupon.type,
              value: dynamicCoupon.value,
              maxDiscount: dynamicCoupon.maxDiscount,
              minFare: dynamicCoupon.minFare,
              usageLimit: dynamicCoupon.usageLimit,
              passengerField: dynamicCoupon.passengerField,
              condition: dynamicCoupon.condition,
              validFrom: dynamicCoupon.validFrom,
              validTo: dynamicCoupon.validTo
            },
            message: 'Dynamic coupon verified and applied to trip'
          }
        };
      } else {
        // Fallback to legacy PromoService for static coupons
        const couponResult = await this.promoService.applyCoupon({
          code: couponCode,
          fare,
          config,
          userId: primaryPassengerId
        });

        if (!couponResult.success) {
          return {
            success: false,
            error: couponResult.error,
            couponCode
          };
        }

        // Add coupon to trip (but don't track usage yet)
        await trip.addCoupon(couponCode);

        return {
          success: true,
          data: {
            tripId,
            couponCode,
            discount: couponResult.discount,
            finalFare: couponResult.fare,
            discountRule: couponResult.discountRule,
            message: 'Static coupon verified and applied to trip'
          }
        };
      }

    } catch (error) {
      console.error('Coupon verification error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get applied coupons for a trip
   * @param {string} tripId - Trip ID
   * @returns {Object} Applied coupons result
   */
  async getAppliedCoupons(tripId) {
    try {
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return {
          success: false,
          error: 'Trip not found'
        };
      }

      return {
        success: true,
        data: {
          tripId,
          coupons: trip.getAppliedCoupons()
        }
      };

    } catch (error) {
      console.error('Get applied coupons error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Remove coupon from trip
   * @param {Object} params
   * @param {string} params.tripId - Trip ID
   * @param {string} params.couponCode - Coupon code to remove
   * @returns {Object} Removal result
   */
  async removeCouponFromTrip({ tripId, couponCode }) {
    try {
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return {
          success: false,
          error: 'Trip not found'
        };
      }

      await trip.removeCoupon(couponCode);

      return {
        success: true,
        data: {
          tripId,
          couponCode,
          message: 'Coupon removed from trip'
        }
      };

    } catch (error) {
      console.error('Remove coupon error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }



  /**
   * Validate dynamic coupon with all rules
   * @private
   */
  async _validateDynamicCoupon(dynamicCoupon, passengerMeta, fare, passengerId) {
    try {
      // 1. Check validity period
      const currentDate = new Date();
      if (dynamicCoupon.validFrom || dynamicCoupon.validTo) {
        const validFrom = dynamicCoupon.validFrom ? new Date(dynamicCoupon.validFrom) : null;
        const validTo = dynamicCoupon.validTo ? new Date(dynamicCoupon.validTo) : null;
        
        if (validFrom && currentDate < validFrom) {
          return {
            valid: false,
            error: 'Coupon not yet valid',
            discount: 0
          };
        }
        
        if (validTo && currentDate > validTo) {
          return {
            valid: false,
            error: 'Coupon has expired',
            discount: 0
          };
        }
      }

      // 2. Check minimum fare requirement
      if (dynamicCoupon.minFare && fare < dynamicCoupon.minFare) {
        return {
          valid: false,
          error: `Minimum fare of ₹${dynamicCoupon.minFare} required for this coupon`,
          discount: 0
        };
      }

      // 3. Check passenger condition
      const isEligible = this.dynamicCouponService.evaluateCouponCondition(passengerMeta, dynamicCoupon.condition);
      if (!isEligible) {
        return {
          valid: false,
          error: `Coupon not available for this passenger (condition: ${dynamicCoupon.condition})`,
          discount: 0
        };
      }

      // 4. Check usage limit
      if (dynamicCoupon.usageLimit) {
        const usageCount = await this._getCouponUsageCount(dynamicCoupon.code, passengerId);
        if (usageCount >= dynamicCoupon.usageLimit) {
          return {
            valid: false,
            error: `Coupon usage limit exceeded (${usageCount}/${dynamicCoupon.usageLimit})`,
            discount: 0
          };
        }
      }

      // 5. Calculate discount
      const discount = this.dynamicCouponService.calculateDynamicDiscount(dynamicCoupon, fare);
      if (discount <= 0) {
        return {
          valid: false,
          error: 'Coupon discount calculation failed',
          discount: 0
        };
      }

      return {
        valid: true,
        discount,
        error: null
      };

    } catch (error) {
      console.error('Dynamic coupon validation error:', error);
      return {
        valid: false,
        error: 'Coupon validation failed',
        discount: 0
      };
    }
  }

  /**
   * Get coupon usage count from database
   * @private
   */
  async _getCouponUsageCount(couponCode, passengerId) {
    try {
      const Passenger = require('../models/Passenger');
      
      // Find passenger by ID (could be ObjectId or username)
      let passenger;
      if (mongoose.Types.ObjectId.isValid(passengerId)) {
        passenger = await Passenger.findByObjectId(passengerId);
      } else {
        passenger = await Passenger.findByUsername(passengerId) || 
                   await Passenger.findByPhone(passengerId) || 
                   await Passenger.findByEmail(passengerId);
      }
      
      if (!passenger) {
        return 0;
      }
      
      return passenger.getCouponUsageCount(couponCode);
      
    } catch (error) {
      console.error('Error getting coupon usage count:', error);
      return 0;
    }
  }

  /**
   * Get available coupons for trip
   * @param {Object} params
   * @param {string} params.tripId - Trip ID
   * @param {number} params.fare - Base fare
   * @param {string} params.regionCode - Region code
   * @returns {Object} Available coupons result
   */
  async getAvailableCouponsForTrip({ tripId, fare, regionCode = 'default' }) {
    try {
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return {
          success: false,
          error: 'Trip not found'
        };
      }

      const primaryPassengerId = trip.userId;
      let passenger;
      
      if (mongoose.Types.ObjectId.isValid(primaryPassengerId)) {
        passenger = await Passenger.findByObjectId(primaryPassengerId);
      } else {
        passenger = await Passenger.findByUsername(primaryPassengerId) || 
                   await Passenger.findByPhone(primaryPassengerId) || 
                   await Passenger.findByEmail(primaryPassengerId);
      }

      if (!passenger) {
        return {
          success: false,
          error: 'Passenger not found'
        };
      }

      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: 'Fare configuration not found'
        };
      }

      // Convert passenger to metadata format for dynamic coupon validation
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

      // Get dynamic coupons
      const dynamicCoupons = this.dynamicCouponService.getDynamicCoupons({
        passengerMeta,
        config,
        fare
      });

      // Get static coupons (legacy)
      const staticCoupons = await this.promoService.getAvailableCoupons({
        userId: primaryPassengerId,
        fare,
        config
      });

      // Combine both types of coupons
      const allAvailableCoupons = [
        ...dynamicCoupons.dynamicCoupons,
        ...staticCoupons
      ];

      return {
        success: true,
        data: {
          tripId,
          availableCoupons: allAvailableCoupons,
          dynamicCoupons: dynamicCoupons.dynamicCoupons,
          staticCoupons,
          appliedCoupons: trip.getAppliedCoupons(),
          passengerProfile: dynamicCoupons.passengerProfile
        }
      };

    } catch (error) {
      console.error('Get available coupons error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }
}

module.exports = new CouponVerificationService(); 