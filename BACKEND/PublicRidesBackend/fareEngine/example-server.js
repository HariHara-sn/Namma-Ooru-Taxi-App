const express = require('express');
const { startStandaloneServer } = require('./index');

// Example: Start standalone fare engine server
async function startExampleServer() {
  try {
    const mongoUri = 'mongodb://localhost:27017/locationTracking';
    const port = 3001;
    
    console.log('🚀 Starting Fare Engine Example Server...');
    console.log(`📊 MongoDB: ${mongoUri}`);
    console.log(`🌐 Server: http://localhost:${port}`);
    
    // Register Trip model before starting server
    require('./models/Trip');
    console.log('✅ Trip model registered');
    
    const app = await startStandaloneServer(mongoUri, port);
    
    // Add some example routes for testing
    app.get('/api/example/test-fare', async (req, res) => {
      try {
        const FareCalculatorService = require('./services/FareCalculatorService');
        const FareConfig = require('./models/FareConfig');
        
        const config = await FareConfig.getActiveConfig('default');
        
        const result = await FareCalculatorService.calculateFare({
          distance: 10,
          duration: 20,
          waitTime: 5,
          config,
          zone: 'residential',
          userId: 'test-user'
        });
        
        res.json({
          success: true,
          message: 'Example fare calculation',
          data: result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    app.get('/api/example/test-driver-incentives', async (req, res) => {
      try {
        const IncentiveService = require('./services/IncentiveService');
        const FareConfig = require('./models/FareConfig');
        
        const config = await FareConfig.getActiveConfig('default');
        
        // Mock driver data based on your sample
        const driverMeta = {
          rating: "3.0",
          tripCountToday: 22,
          totalTripsAccepted: 0,
          totalTripsRejected: 85,
          isTrusted: false,
          liveStats: { isOnline: true },
          vehicleType: 'SEDAN' // This would be fetched from vehicle collection in real scenario
        };
        
        const incentives = IncentiveService.getIncentives({
          driverMeta,
          config
        });
        
        res.json({
          success: true,
          message: 'Example driver incentives',
          data: incentives
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    app.get('/api/example/test-surge', async (req, res) => {
      try {
        const SurgeService = require('./services/SurgeService');
        const FareConfig = require('./models/FareConfig');
        
        const config = await FareConfig.getActiveConfig('default');
        
        const multiplier = SurgeService.getSurgeMultiplier({
          time: new Date(),
          zone: 'business',
          config
        });
        
        res.json({
          success: true,
          message: 'Example surge calculation',
          data: {
            zone: 'business',
            multiplier,
            time: new Date().toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    app.get('/api/example/test-trip-fare', async (req, res) => {
      try {
        const { FareService } = require('./index').getServices();
        
        // Create a sample trip first
        const Trip = require('./models/Trip');
        const sampleTrip = new Trip({
          driverId: 'DRIVER001',
          vehicleId: 'VEHICLE001',
          userId: 'user123',
          passangers: ['user123', 'user456'],
          status: 'accepted',
          distance: 10,
          duration: 20,
          waitTime: 5,
          zone: 'business'
        });
        
        const savedTrip = await sampleTrip.save();
        
        // Calculate fare using tripId
        const result = await FareService.calculateFareFromTrip({
          tripId: savedTrip._id.toString(),
          distance: 10,
          duration: 20,
          waitTime: 5,
          zone: 'business',
          coupons: ['FIRST_RIDE']
        });
        
        res.json({
          success: true,
          message: 'Example trip-based fare calculation',
          data: {
            tripId: savedTrip._id.toString(),
            result
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    console.log('✅ Example server started successfully!');
    console.log('📋 Test endpoints:');
    console.log(`   - http://localhost:${port}/api/example/test-fare`);
    console.log(`   - http://localhost:${port}/api/example/test-driver-incentives`);
    console.log(`   - http://localhost:${port}/api/example/test-surge`);
    console.log(`   - http://localhost:${port}/api/example/test-trip-fare`);
    console.log(`   - http://localhost:${port}/api/fare/health`);
    
  } catch (error) {
    console.error('❌ Failed to start example server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startExampleServer();
}

module.exports = { startExampleServer }; 