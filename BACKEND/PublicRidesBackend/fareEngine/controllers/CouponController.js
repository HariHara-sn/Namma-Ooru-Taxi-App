const FareService = require('../services/FareService');
const Joi = require('joi');

class CouponController {
  constructor() {
    this.fareService = FareService;
    
    // Bind all methods to preserve 'this' context
    this.verifyAndApplyCoupon = this.verifyAndApplyCoupon.bind(this);
    this.getAppliedCoupons = this.getAppliedCoupons.bind(this);
    this.removeCouponFromTrip = this.removeCouponFromTrip.bind(this);
    this.getAvailableCouponsForTrip = this.getAvailableCouponsForTrip.bind(this);
  }

  /**
   * Verify and apply coupon to trip
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyAndApplyCoupon(req, res) {
    try {
      const schema = Joi.object({
        tripId: Joi.string().required(),
        couponCode: Joi.string().required(),
        fare: Joi.number().positive().required(),
        regionCode: Joi.string().default('default')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.verifyAndApplyCoupon(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Coupon verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get applied coupons for a trip
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAppliedCoupons(req, res) {
    try {
      const schema = Joi.object({
        tripId: Joi.string().required()
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.getAppliedCoupons(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Get applied coupons error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Remove coupon from trip
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async removeCouponFromTrip(req, res) {
    try {
      const schema = Joi.object({
        tripId: Joi.string().required(),
        couponCode: Joi.string().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.removeCouponFromTrip(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Remove coupon error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }



  /**
   * Get available coupons for trip
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAvailableCouponsForTrip(req, res) {
    try {
      const schema = Joi.object({
        tripId: Joi.string().required(),
        fare: Joi.number().positive().required(),
        regionCode: Joi.string().default('default')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.getAvailableCouponsForTrip(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Get available coupons error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new CouponController(); 