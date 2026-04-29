const FareService = require('../services/FareService');
const Joi = require('joi');
const FareConfig = require('../models/FareConfig');

class FareController {
  constructor() {
    this.fareService = FareService;
    
    // Bind all methods to preserve 'this' context
    this.getFareRange = this.getFareRange.bind(this);
    this.calculatePreFinalFare = this.calculatePreFinalFare.bind(this);
    this.calculateFinalFare = this.calculateFinalFare.bind(this);
    this.applyCoupon = this.applyCoupon.bind(this);
    this.getCancellationFee = this.getCancellationFee.bind(this);
    this.getAvailableCoupons = this.getAvailableCoupons.bind(this);
    this.getDriverIncentives = this.getDriverIncentives.bind(this);
    this.getSurgeMultiplier = this.getSurgeMultiplier.bind(this);
    this.getFareConfig = this.getFareConfig.bind(this);
    this.getAvailableVehicleTypes = this.getAvailableVehicleTypes.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
  }

  /**
   * Get fare range estimate
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFareRange(req, res) {
    try {
      const schema = Joi.object({
        distance: Joi.number().positive().required(),
        duration: Joi.number().positive().required(),
        zone: Joi.string().valid('business', 'airport', 'residential', 'all').default('all'),
        vehicleType: Joi.string().default('ALL'),
        regionCode: Joi.string().default('default')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      // Validate vehicle type against available types if not 'ALL'
      if (value.vehicleType !== 'ALL') {
        const config = await FareConfig.getActiveConfig(value.regionCode);
        if (config) {
          const availableVehicleTypes = this.fareService.fareCalculator.getAvailableVehicleTypes(config);
          if (!availableVehicleTypes.includes(value.vehicleType)) {
            return res.status(400).json({
              success: false,
              error: `Invalid vehicle type. Available types: ${availableVehicleTypes.join(', ')}`
            });
          }
        }
      }

      const result = await this.fareService.getFareRange(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Fare range calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Calculate pre-final fare (estimate before trip starts)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async calculatePreFinalFare(req, res) {
    try {
      const schema = Joi.object({
        distance: Joi.number().positive().required(),
        duration: Joi.number().positive().required(),
        zone: Joi.string().valid('business', 'airport', 'residential', 'all').default('all'),
        regionCode: Joi.string().default('default'),
        driverId: Joi.string().required(),
        coupons: Joi.array().items(Joi.string()).default([]),
        userId: Joi.string().optional(),
        createdBy: Joi.string().optional(),
        waitTime: Joi.number().min(0).default(0)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.calculatePreFinalFare(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Pre-final fare calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Calculate final fare
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async calculateFinalFare(req, res) {
    try {
      const schema = Joi.object({
        distance: Joi.number().positive().required(),
        duration: Joi.number().positive().required(),
        waitTime: Joi.number().min(0).default(0),
        zone: Joi.string().valid('business', 'airport', 'residential', 'all').default('all'),
        regionCode: Joi.string().default('default'),
        driverId: Joi.string().optional(),
        coupons: Joi.array().items(Joi.string()).default([]),
        userId: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.calculateFinalFare(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Final fare calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Apply coupon to fare
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async applyCoupon(req, res) {
    try {
      const schema = Joi.object({
        fare: Joi.number().positive().required(),
        couponCode: Joi.string().required(),
        regionCode: Joi.string().default('default'),
        userId: Joi.string().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.applyCoupon(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Coupon application error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get cancellation fee
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCancellationFee(req, res) {
    try {
      const schema = Joi.object({
        requestedAt: Joi.date().required(),
        cancelledAt: Joi.date().required(),
        regionCode: Joi.string().default('default'),
        userId: Joi.string().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.getCancellationFee(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Cancellation fee calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get available coupons
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAvailableCoupons(req, res) {
    try {
      const schema = Joi.object({
        fare: Joi.number().positive().required(),
        regionCode: Joi.string().default('default'),
        userId: Joi.string().required()
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.getAvailableCoupons(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Available coupons error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get driver incentives
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDriverIncentives(req, res) {
    try {
      const schema = Joi.object({
        driverId: Joi.string().required(),
        regionCode: Joi.string().default('default')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.getDriverIncentives(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Driver incentives error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get surge multiplier
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSurgeMultiplier(req, res) {
    try {
      const schema = Joi.object({
        zone: Joi.string().valid('business', 'airport', 'residential', 'all').required(),
        regionCode: Joi.string().default('default'),
        time: Joi.date().default(() => new Date())
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.getSurgeMultiplier(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Surge multiplier error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get available vehicle types
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAvailableVehicleTypes(req, res) {
    try {
      const { regionCode = 'default' } = req.query;

      const result = await this.fareService.getAvailableVehicleTypes({ regionCode });
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Get vehicle types error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get fare configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFareConfig(req, res) {
    try {
      const { regionCode = 'default' } = req.params;

      const result = await this.fareService.getFareConfig({ regionCode });
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Get fare config error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get valid incentive types
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getValidIncentiveTypes(req, res) {
    try {
      const incentiveTypes = this.fareCalculator.incentiveService.getValidIncentiveTypes();
      
      res.json({
        success: true,
        data: incentiveTypes
      });

    } catch (error) {
      console.error('Get incentive types error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get incentive types'
      });
    }
  }

  /**
   * Health check endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async healthCheck(req, res) {
    try {
      const result = await this.fareService.healthCheck();
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }

    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Service unhealthy'
      });
    }
  }
}

module.exports = new FareController(); 