const mongoose = require('mongoose');
const { initializeFareEngine, getServices } = require('./index');

/**
 * 🚀 Fare Engine Interface - Singleton Class
 * 
 * This class provides a clean interface for integrating the fare engine
 * into other projects as a submodule. It reuses existing MongoDB connections
 * instead of creating new ones.
 * 
 * Supports both Mongoose and native MongoDB client connections.
 */
class FareEngineInterface {
  constructor() {
    // Singleton pattern
    if (FareEngineInterface.instance) {
      return FareEngineInterface.instance;
    }
    
    this.isInitialized = false;
    this.fareService = null;
    this.tripFareService = null;
    this.couponVerificationService = null;
    this.dynamicCouponService = null;
    this.surgeService = null;
    this.promoService = null;
    this.incentiveService = null;
    this.cancellationService = null;
    this.fareCalculatorService = null;
    
    // Store the singleton instance
    FareEngineInterface.instance = this;
  }

  /**
   * Initialize fare engine with existing MongoDB connection
   * @param {Object} connection - Existing MongoDB connection (Mongoose or native client)
   * @param {Object} options - Configuration options
   * @param {string} options.databaseName - Database name (required for native client)
   * @param {Object} options.customMappings - Custom collection field mappings
   * @param {boolean} options.autoRegisterModels - Whether to auto-register models (default: true)
   * @returns {Promise<boolean>} Initialization success
   */
  async init(uri, options = {}) {
    try {
      if (this.isInitialized) {
        console.log('✅ Fare Engine already initialized');
        return true;
      }

      console.log('🚀 Initializing Fare Engine Interface...');

      let mongooseConnection;

      // Handle different connection types
      
      mongooseConnection = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ MongoDB connected');
      // Auto-register models if enabled (default: true)
      if (options.autoRegisterModels !== false) {
        this._registerModels();
      }

      // Initialize fare engine with the connection
      // await initializeFareEngine(mongooseConnection, options.customMappings);
      // console.log('✅ Fare engine core initialized');

      // Get all services
      const services = getServices();
      this.fareService = services.FareService;
      this.tripFareService = services.TripFareService;
      this.couponVerificationService = services.CouponVerificationService;
      this.dynamicCouponService = services.DynamicCouponService;
      this.surgeService = services.SurgeService;
      this.promoService = services.PromoService;
      this.incentiveService = services.IncentiveService;
      this.cancellationService = services.CancellationService;
      this.fareCalculatorService = services.FareCalculatorService;

      this.isInitialized = true;
      console.log('✅ Fare Engine Interface ready!');

      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Fare Engine Interface:', error);
      throw error;
    }
  }

  /**
   * Create Mongoose connection from native MongoDB client
   * @private
   *
   * Best practice: Always create a new Mongoose connection using the same URI and db name as the native client.
   * Mongoose cannot fully adopt a native client for model operations.
   */
  async _createMongooseFromNativeClient(mongoClient, databaseName, mongoUri) {
    try {
      // Always use the provided URI
      let uri = mongoUri;
      if (!uri) throw new Error('mongoUri is required for Mongoose connection');
      // Ensure the URI includes the database name
      if (!uri.endsWith(`/${databaseName}`)) {
        uri = uri.replace(/\/$/, '');
        uri = `${uri}/${databaseName}`;
      }
      const mongooseConnection = await mongoose.createConnection(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }).asPromise();
      return mongooseConnection;
    } catch (error) {
      console.error('Error creating Mongoose connection from native client:', error);
      throw error;
    }
  }

  /**
   * Register all required models
   * @private
   */
  _registerModels() {
    try {
      require('./models/Trip');
      require('./models/Driver');
      require('./models/Vehicle');
      require('./models/Passenger');
      require('./models/FareConfig');
      console.log('✅ Models registered');
    } catch (error) {
      console.error('❌ Failed to register models:', error);
      throw error;
    }
  }

  /**
   * Check if fare engine is initialized
   * @returns {boolean} Initialization status
   */
  isReady() {
    return this.isInitialized && this.fareService !== null;
  }

  /**
   * Get initialization status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isReady: this.isReady(),
      services: {
        fareService: !!this.fareService,
        tripFareService: !!this.tripFareService,
        couponVerificationService: !!this.couponVerificationService,
        dynamicCouponService: !!this.dynamicCouponService,
        surgeService: !!this.surgeService,
        promoService: !!this.promoService,
        incentiveService: !!this.incentiveService,
        cancellationService: !!this.cancellationService,
        fareCalculatorService: !!this.fareCalculatorService
      }
    };
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'Fare engine not initialized'
      };
    }

    try {
      return await this.fareService.healthCheck();
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all available services
   * @returns {Object} All services
   */
  getServices() {
    if (!this.isReady()) {
      throw new Error('Fare engine not initialized. Call init() first.');
    }

    return {
      fareService: this.fareService,
      tripFareService: this.tripFareService,
      couponVerificationService: this.couponVerificationService,
      dynamicCouponService: this.dynamicCouponService,
      surgeService: this.surgeService,
      promoService: this.promoService,
      incentiveService: this.incentiveService,
      cancellationService: this.cancellationService,
      fareCalculatorService: this.fareCalculatorService
    };
  }

  /**
   * Get specific service
   * @param {string} serviceName - Name of the service
   * @returns {Object} Service instance
   */
  getService(serviceName) {
    if (!this.isReady()) {
      throw new Error('Fare engine not initialized. Call init() first.');
    }

    const service = this[serviceName];
    if (!service) {
      throw new Error(`Service '${serviceName}' not found`);
    }

    return service;
  }

  /**
   * Reset the singleton instance (for testing)
   * @private
   */
  static reset() {
    FareEngineInterface.instance = null;
  }
}

// Export singleton instance
module.exports = new FareEngineInterface(); 