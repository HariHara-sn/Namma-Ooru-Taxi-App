const FareService = require('../services/FareService');
const Joi = require('joi');

class DynamicCouponController {
  constructor() {
    this.fareService = FareService;
    
    // Bind all methods to preserve 'this' context
    this.getAvailableDynamicCoupons = this.getAvailableDynamicCoupons.bind(this);
    this.getAllAvailableCoupons = this.getAllAvailableCoupons.bind(this);
    this.getValidPassengerFields = this.getValidPassengerFields.bind(this);
    this.getDynamicCouponStats = this.getDynamicCouponStats.bind(this);
  }

  /**
   * Get available dynamic coupons for passenger
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAvailableDynamicCoupons(req, res) {
    try {
      const schema = Joi.object({
        passengerId: Joi.string().required(),
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

      const result = await this.fareService.getAvailableDynamicCoupons(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Get available dynamic coupons error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get all available coupons for passenger (both static and dynamic)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllAvailableCoupons(req, res) {
    try {
      const schema = Joi.object({
        passengerId: Joi.string().required(),
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

      const result = await this.fareService.getAllAvailableCoupons(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Get all available coupons error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get valid passenger fields for dynamic coupon rules
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getValidPassengerFields(req, res) {
    try {
      const schema = Joi.object({
        regionCode: Joi.string().default('default')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.getValidPassengerFields(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Get valid passenger fields error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get dynamic coupon statistics for passenger
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDynamicCouponStats(req, res) {
    try {
      const schema = Joi.object({
        passengerId: Joi.string().required(),
        regionCode: Joi.string().default('default')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.getDynamicCouponStats(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Get dynamic coupon stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new DynamicCouponController(); 