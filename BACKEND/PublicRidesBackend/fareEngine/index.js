const express = require('express');
const mongoose = require('mongoose');
const fareRoutes = require('./routes/fareRoutes');
const FareConfig = require('./models/FareConfig');
const defaultConfig = require('./config/defaultFareConfig.json');

// Global collection mappings
let collectionMappings = {
  driver: {
    id: 'driverId',
    rating: 'rating',
    tripCountToday: 'tripCountToday',
    totalTripsAccepted: 'totalTripsAccepted',
    totalTripsRejected: 'totalTripsRejected',
    isTrusted: 'isTrusted',
    liveStats: 'liveStats',
    vehicleId: 'vehicleId'
  },
  vehicle: {
    id: '_id',
    type: 'type',
    driverId: 'driverId'
  },
  passenger: {
    id: '_id',
    userId: 'userId'
  },
  trip: {
    id: '_id',
    driverId: 'driverId',
    vehicleId: 'vehicleId',
    userId: 'userId',
    passengers: 'passangers'
  }
};

/**
 * Initialize fare engine with custom collection field mappings
 * @param {Object} connection - Existing mongoose connection
 * @param {Object} mappings - Collection field mappings
 */
async function initializeFareEngine(connection, mappings = null) {
  try {
    // Use existing connection
    if (connection && connection.readyState === 1) {
      console.log('✅ Fare engine initialized with existing MongoDB connection');
    } else {
      throw new Error('Invalid or disconnected MongoDB connection');
    }
    
    // Update collection mappings if provided
    if (mappings) {
      collectionMappings = { ...collectionMappings, ...mappings };
      console.log('✅ Collection mappings updated:', Object.keys(mappings));
    }
    
    // Initialize default config if not exists
    await initializeDefaultConfig();
    
  } catch (error) {
    console.error('❌ Fare engine initialization failed:', error);
    throw error;
  }
}

/**
 * Initialize MongoDB connection (legacy method)
 * @param {string} mongoUri - MongoDB connection string
 */
async function initializeDatabase(mongoUri) {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully');
    
    // Initialize default config if not exists
    await initializeDefaultConfig();
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

/**
 * Initialize default fare configuration
 */
async function initializeDefaultConfig() {
  try {
    const existingConfig = await FareConfig.getActiveConfig('default');
    
    if (!existingConfig) {
      const config = new FareConfig(defaultConfig);
      await config.save();
      console.log('✅ Default fare configuration initialized');
    } else {
      console.log('✅ Default fare configuration already exists');
    }
  } catch (error) {
    console.error('❌ Failed to initialize default config:', error);
  }
}

/**
 * Register fare routes with Express app
 * @param {Object} app - Express app instance
 * @param {string} basePath - Base path for routes (default: '/api/fare')
 */
function registerFareRoutes(app, basePath = '/api/fare') {
  app.use(basePath, fareRoutes);
  console.log(`✅ Fare routes registered at ${basePath}`);
}

/**
 * Create standalone Express app for fare engine
 * @param {string} mongoUri - MongoDB connection string
 * @param {number} port - Port to run server on
 */
async function createStandaloneApp(mongoUri, port = 3001) {
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  // Initialize database
  await initializeDatabase(mongoUri);
  
  // Register routes
  registerFareRoutes(app);
  
  // Error handling middleware
  app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });
  
  return app;
}

/**
 * Start standalone server
 * @param {string} mongoUri - MongoDB connection string
 * @param {number} port - Port to run server on
 */
async function startStandaloneServer(mongoUri, port = 3001) {
  try {
    const app = await createStandaloneApp(mongoUri, port);
    
    app.listen(port, () => {
      console.log(`🚀 Fare Engine server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/api/fare/health`);
      console.log(`📋 API Documentation: http://localhost:${port}/api/fare/config/default`);
    });
    
    return app;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    throw error;
  }
}

/**
 * Get fare engine services for direct use
 */
function getServices() {
  return {
    FareCalculatorService: require('./services/FareCalculatorService'),
    FareService: require('./services/FareService'),
    TripFareService: require('./services/TripFareService'),
    CouponVerificationService: require('./services/CouponVerificationService'),
    DynamicCouponService: require('./services/DynamicCouponService'),
    SurgeService: require('./services/SurgeService'),
    PromoService: require('./services/PromoService'),
    IncentiveService: require('./services/IncentiveService'),
    CancellationService: require('./services/CancellationService')
  };
}

/**
 * Get fare configuration model
 */
function getFareConfigModel() {
  return FareConfig;
}

/**
 * Get driver model
 */
function getDriverModel() {
  return require('./models/Driver');
}

/**
 * Get vehicle model
 */
function getVehicleModel() {
  return require('./models/Vehicle');
}

/**
 * Get passenger model
 */
function getPassengerModel() {
  return require('./models/Passenger');
}

/**
 * Get current collection mappings
 */
function getCollectionMappings() {
  return collectionMappings;
}

/**
 * Update collection mappings
 * @param {Object} mappings - New collection field mappings
 */
function updateCollectionMappings(mappings) {
  collectionMappings = { ...collectionMappings, ...mappings };
  
  // Update TripFareService mappings if it exists
  try {
    const TripFareService = require('./services/TripFareService');
    TripFareService.updateMappings(mappings);
  } catch (error) {
    // TripFareService might not be loaded yet
  }
  
  console.log('✅ Collection mappings updated:', Object.keys(mappings));
}

module.exports = {
  registerFareRoutes,
  createStandaloneApp,
  startStandaloneServer,
  initializeDatabase,
  initializeFareEngine,
  getServices,
  getFareConfigModel,
  getDriverModel,
  getVehicleModel,
  getPassengerModel,
  getCollectionMappings,
  updateCollectionMappings
}; 