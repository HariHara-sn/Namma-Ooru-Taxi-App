const express = require('express');
const mongoose = require('mongoose');
const { initializeFareEngine, getServices, updateCollectionMappings } = require('../index');

// Example: Using Modular Fare Engine with Custom Collection Mappings
async function modularUsageExample() {
  try {
    // 1. Connect to MongoDB (your existing connection)
    await mongoose.connect('mongodb://localhost:27017/locationTracking');
    console.log('✅ Connected to MongoDB');

    // 2. Define custom collection mappings for your specific schema
    const customMappings = {
      driver: {
        id: 'driverId',                    // Your driver ID field
        rating: 'rating',                  // Driver rating field
        tripCountToday: 'tripCountToday', // Today's trip count
        totalTripsAccepted: 'totalTripsAccepted',
        totalTripsRejected: 'totalTripsRejected',
        isTrusted: 'isTrusted',
        liveStats: 'liveStats',
        vehicleId: 'vehicleId'             // Reference to vehicle collection
      },
      vehicle: {
        id: '_id',                         // Vehicle ObjectId
        type: 'type',                      // Vehicle type (SEDAN, SUV, etc.)
        driverId: 'driverId'               // Reference to driver
      },
      passenger: {
        id: '_id',                         // Passenger ObjectId
        userId: 'userId'                   // User ID field
      },
      trip: {
        id: '_id',                         // Trip ObjectId
        driverId: 'driverId',              // Driver ID in trip
        vehicleId: 'vehicleId',            // Vehicle ID in trip
        userId: 'userId',                  // Primary user ID
        passengers: 'passangers'           // Note: matches your schema (typo in original)
      }
    };

    // 3. Initialize fare engine with custom mappings
    await initializeFareEngine(mongoose.connection, customMappings);
    console.log('✅ Fare engine initialized with custom mappings');

    // 4. Get services
    const { FareService, TripFareService } = getServices();

    // 5. Example: Calculate fare using tripId (modular approach)
    console.log('\n🚗 Calculating fare using tripId...');
    const tripFareResult = await FareService.calculateFareFromTrip({
      tripId: '6871eede67b53fde8ca254e7', // Your trip ID
      distance: 10,
      duration: 20,
      waitTime: 5,
      zone: 'business',
      coupons: ['FIRST_RIDE'],
      regionCode: 'default'
    });
    console.log('Trip Fare Result:', JSON.stringify(tripFareResult, null, 2));

    // 6. Example: Calculate pre-final fare using tripId
    console.log('\n💰 Calculating pre-final fare using tripId...');
    const preFinalResult = await FareService.calculatePreFinalFareFromTrip({
      tripId: '6871eede67b53fde8ca254e7',
      distance: 10,
      duration: 20,
      zone: 'business',
      coupons: ['FIRST_RIDE'],
      regionCode: 'default'
    });
    console.log('Pre-Final Fare Result:', JSON.stringify(preFinalResult, null, 2));

    // 7. Example: Calculate multi-passenger fare
    console.log('\n👥 Calculating multi-passenger fare...');
    const multiPassengerResult = await FareService.calculateMultiPassengerFare({
      tripId: '6871eede67b53fde8ca254e7',
      distance: 10,
      duration: 20,
      waitTime: 5,
      zone: 'business',
      coupons: ['FIRST_RIDE'],
      regionCode: 'default'
    });
    console.log('Multi-Passenger Fare Result:', JSON.stringify(multiPassengerResult, null, 2));

    // 8. Example: Get trip passengers
    console.log('\n👤 Getting trip passengers...');
    const passengersResult = await FareService.getTripPassengers({
      tripId: '6871eede67b53fde8ca254e7'
    });
    console.log('Trip Passengers Result:', JSON.stringify(passengersResult, null, 2));

    // 9. Example: Update collection mappings at runtime
    console.log('\n🔄 Updating collection mappings...');
    const newMappings = {
      trip: {
        id: '_id',
        driverId: 'driverId',
        vehicleId: 'vehicleId',
        userId: 'userId',
        passengers: 'passangers', // Your specific field name
        stops: 'stops'           // Add new field mapping
      }
    };
    updateCollectionMappings(newMappings);
    console.log('✅ Collection mappings updated');

    console.log('\n✅ All modular examples completed successfully!');

  } catch (error) {
    console.error('❌ Error in modular example:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Express.js integration example with modular approach
function expressModularIntegration() {
  const app = express();
  app.use(express.json());

  // Initialize fare engine with custom mappings
  let FareService;
  
  app.use(async (req, res, next) => {
    if (!FareService) {
      // Define your custom mappings
      const customMappings = {
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
        trip: {
          id: '_id',
          driverId: 'driverId',
          vehicleId: 'vehicleId',
          userId: 'userId',
          passengers: 'passangers'
        }
      };

      await initializeFareEngine(mongoose.connection, customMappings);
      FareService = getServices().FareService;
    }
    next();
  });

  // Route for trip-based fare calculation
  app.post('/api/fare/trip/calculate', async (req, res) => {
    try {
      const result = await FareService.calculateFareFromTrip(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Route for trip-based pre-final fare
  app.post('/api/fare/trip/pre-final', async (req, res) => {
    try {
      const result = await FareService.calculatePreFinalFareFromTrip(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Route for multi-passenger fare
  app.post('/api/fare/trip/multi-passenger', async (req, res) => {
    try {
      const result = await FareService.calculateMultiPassengerFare(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return app;
}

// Example of how to use with different collection structures
function differentCollectionStructureExample() {
  // Example 1: Different driver collection structure
  const driverMappings1 = {
    driver: {
      id: 'driver_id',           // Different field name
      rating: 'driver_rating',   // Different field name
      tripCountToday: 'daily_trips',
      totalTripsAccepted: 'accepted_trips',
      totalTripsRejected: 'rejected_trips',
      isTrusted: 'trusted_status',
      liveStats: 'online_status',
      vehicleId: 'assigned_vehicle'
    }
  };

  // Example 2: Different trip collection structure
  const tripMappings2 = {
    trip: {
      id: 'trip_id',
      driverId: 'assigned_driver',
      vehicleId: 'vehicle_reference',
      userId: 'primary_user',
      passengers: 'trip_passengers',
      stops: 'route_stops'
    }
  };

  // Example 3: Different vehicle collection structure
  const vehicleMappings3 = {
    vehicle: {
      id: 'vehicle_id',
      type: 'vehicle_category',
      driverId: 'owner_driver'
    }
  };

  console.log('📋 Example collection mappings for different structures:');
  console.log('Driver mappings:', driverMappings1);
  console.log('Trip mappings:', tripMappings2);
  console.log('Vehicle mappings:', vehicleMappings3);
}

// Run the example if this file is executed directly
if (require.main === module) {
  modularUsageExample();
}

module.exports = {
  modularUsageExample,
  expressModularIntegration,
  differentCollectionStructureExample
}; 