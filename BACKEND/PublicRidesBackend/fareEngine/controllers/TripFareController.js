const FareService = require('../services/FareService');
const Joi = require('joi');

class TripFareController {
  constructor() {
    this.fareService = FareService;
    
    // Bind all methods to preserve 'this' context
    this.calculateFareFromTrip = this.calculateFareFromTrip.bind(this);
    this.calculatePreFinalFareFromTrip = this.calculatePreFinalFareFromTrip.bind(this);
    this.calculateMultiPassengerFare = this.calculateMultiPassengerFare.bind(this);
    this.getTripPassengers = this.getTripPassengers.bind(this);
  }

  /**
   * Calculate fare using tripId
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async calculateFareFromTrip(req, res) {
    try {
      const schema = Joi.object({
        tripId: Joi.string().required(),
        distance: Joi.number().positive().required(),
        duration: Joi.number().positive().required(),
        waitTime: Joi.number().min(0).default(0),
        zone: Joi.string().valid('business', 'airport', 'residential', 'all').default('all'),
        regionCode: Joi.string().default('default')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.calculateFareFromTrip(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Trip fare calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Calculate pre-final fare using tripId
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async calculatePreFinalFareFromTrip(req, res) {
    try {
      const schema = Joi.object({
        tripId: Joi.string().required(),
        distance: Joi.number().positive().required(),
        duration: Joi.number().positive().required(),
        zone: Joi.string().valid('business', 'airport', 'residential', 'all').default('all'),
        regionCode: Joi.string().default('default'),
        waitTime: Joi.number().min(0).default(0)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.calculatePreFinalFareFromTrip(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Trip pre-final fare calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Calculate multi-passenger fare using tripId
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async calculateMultiPassengerFare(req, res) {
    try {
      const schema = Joi.object({
        tripId: Joi.string().required(),
        distance: Joi.number().positive().required(),
        duration: Joi.number().positive().required(),
        waitTime: Joi.number().min(0).default(0),
        zone: Joi.string().valid('business', 'airport', 'residential', 'all').default('all'),
        regionCode: Joi.string().default('default')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await this.fareService.calculateMultiPassengerFare(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Multi-passenger fare calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get trip passengers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTripPassengers(req, res) {
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

      const result = await this.fareService.getTripPassengers(value);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Get trip passengers error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new TripFareController(); 