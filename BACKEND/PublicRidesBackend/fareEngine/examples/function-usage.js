const express = require('express');
const mongoose = require('mongoose');
const { initializeFareEngine, getServices } = require('../index');

// Example: Using Fare Engine functions directly with latest features
async function exampleUsage() {
  try {
    // 1. Connect to MongoDB (your existing connection)
    await mongoose.connect('mongodb://localhost:27017/locationTracking');
    console.log('✅ Connected to MongoDB');

    // 2. Initialize fare engine with existing connection
    await initializeFareEngine(mongoose.connection);
    console.log('✅ Fare engine initialized');

    // 3. Get services
    const { FareService, TripFareService, CouponVerificationService } = getServices();

    // 4. Example: Get fare range for all vehicle types
    console.log('\n🚗 Getting fare range for all vehicle types...');
    const fareRange = await FareService.getFareRange({
      distance: 10,
      duration: 20,
      zone: 'residential',
      vehicleType: 'ALL'
    });
    console.log('Fare Range Result:', JSON.stringify(fareRange, null, 2));

    // 5. Example: Traditional fare calculation (legacy approach)
    console.log('\n💰 Traditional fare calculation...');
    const traditionalFare = await FareService.calculateFinalFare({
      distance: 10,
      duration: 20,
      waitTime: 5,
      zone: 'business',
      driverId: 'DRIVER001',
      coupons: ['FIRST_RIDE'],
      userId: 'user123'
    });
    console.log('Traditional Fare Result:', JSON.stringify(traditionalFare, null, 2));

    // 6. Example: Trip-based fare calculation (new modular approach)
    console.log('\n🎯 Trip-based fare calculation...');
    
    // First, create a sample trip
    const Trip = require('../models/Trip');
    const sampleTrip = new Trip({
      driverId: 'DRIVER001',
      vehicleId: 'VEHICLE001',
      userId: 'user123',
      passangers: ['user123', 'user456'],
      status: 'accepted',
      coupons: ['FIRST_RIDE'] // Applied coupons stored in trip
    });
    const savedTrip = await sampleTrip.save();
    console.log('✅ Sample trip created:', savedTrip._id.toString());

    // Calculate pre-final fare using tripId (no wait time, no coupon usage update)
    console.log('\n📊 Pre-final fare calculation...');
    const preFinalFare = await FareService.calculatePreFinalFareFromTrip({
      tripId: savedTrip._id.toString(),
      distance: 10,
      duration: 20,
      zone: 'business'
    });
    console.log('Pre-Final Fare Result:', JSON.stringify(preFinalFare, null, 2));

    // Calculate final fare using tripId (includes wait time, updates coupon usage)
    console.log('\n💳 Final fare calculation...');
    const finalFare = await FareService.calculateFareFromTrip({
      tripId: savedTrip._id.toString(),
      distance: 10,
      duration: 20,
      waitTime: 5,
      zone: 'business'
    });
    console.log('Final Fare Result:', JSON.stringify(finalFare, null, 2));

    // 7. Example: Enhanced coupon system workflow
    console.log('\n🎫 Enhanced coupon system workflow...');
    
    // Create another trip for coupon testing
    const couponTrip = new Trip({
      driverId: 'DRIVER002',
      vehicleId: 'VEHICLE002',
      userId: 'user789',
      passangers: ['user789'],
      status: 'accepted'
    });
    const savedCouponTrip = await couponTrip.save();

    // Step 1: Verify and apply coupon to trip
    console.log('\n🔍 Verifying and applying coupon...');
    const couponVerification = await FareService.verifyAndApplyCoupon({
      tripId: savedCouponTrip._id.toString(),
      couponCode: 'FIRST_RIDE',
      fare: 200,
      regionCode: 'default'
    });
    console.log('Coupon Verification Result:', JSON.stringify(couponVerification, null, 2));

    // Step 2: Get applied coupons for trip
    console.log('\n📋 Getting applied coupons...');
    const appliedCoupons = await FareService.getAppliedCoupons({
      tripId: savedCouponTrip._id.toString()
    });
    console.log('Applied Coupons Result:', JSON.stringify(appliedCoupons, null, 2));

    // Step 3: Calculate final fare (uses stored coupons automatically and updates passenger usage)
    console.log('\n💰 Final fare with stored coupons (automatically updates passenger coupon usage)...');
    const finalFareWithCoupons = await FareService.calculateFareFromTrip({
      tripId: savedCouponTrip._id.toString(),
      distance: 10,
      duration: 20,
      waitTime: 3,
      zone: 'business'
    });
    console.log('Final Fare with Coupons:', JSON.stringify(finalFareWithCoupons, null, 2));

    // Step 4: Remove coupon from trip
    console.log('\n🗑️ Removing coupon from trip...');
    const removeCoupon = await FareService.removeCouponFromTrip({
      tripId: savedCouponTrip._id.toString(),
      couponCode: 'FIRST_RIDE'
    });
    console.log('Remove Coupon Result:', JSON.stringify(removeCoupon, null, 2));

    // 8. Example: Get available coupons for trip
    console.log('\n📋 Getting available coupons for trip...');
    const availableCoupons = await FareService.getAvailableCouponsForTrip({
      tripId: savedCouponTrip._id.toString(),
      fare: 200,
      regionCode: 'default'
    });
    console.log('Available Coupons for Trip:', JSON.stringify(availableCoupons, null, 2));

    // 9. Example: Multi-passenger fare calculation
    console.log('\n👥 Multi-passenger fare calculation...');
    const multiPassengerFare = await FareService.calculateMultiPassengerFare({
      tripId: savedTrip._id.toString(),
      distance: 10,
      duration: 20,
      waitTime: 5,
      zone: 'business'
    });
    console.log('Multi-Passenger Fare Result:', JSON.stringify(multiPassengerFare, null, 2));

    // 10. Example: Get trip passengers
    console.log('\n👤 Getting trip passengers...');
    const tripPassengers = await FareService.getTripPassengers({
      tripId: savedTrip._id.toString()
    });
    console.log('Trip Passengers Result:', JSON.stringify(tripPassengers, null, 2));

    // 11. Example: Traditional coupon application (legacy)
    console.log('\n🎫 Traditional coupon application...');
    const traditionalCoupon = await FareService.applyCoupon({
      fare: 200,
      couponCode: 'FIRST_RIDE',
      userId: 'user123'
    });
    console.log('Traditional Coupon Result:', JSON.stringify(traditionalCoupon, null, 2));

    // 12. Example: Get available coupons (traditional)
    console.log('\n📋 Getting available coupons (traditional)...');
    const availableCouponsTraditional = await FareService.getAvailableCoupons({
      fare: 200,
      userId: 'user123'
    });
    console.log('Available Coupons (Traditional):', JSON.stringify(availableCouponsTraditional, null, 2));

    // 13. Example: Get driver incentives
    console.log('\n🏆 Getting driver incentives...');
    const driverIncentives = await FareService.getDriverIncentives({
      driverId: 'DRIVER001'
    });
    console.log('Driver Incentives:', JSON.stringify(driverIncentives, null, 2));

    // 14. Example: Get surge multiplier
    console.log('\n📈 Getting surge multiplier...');
    const surgeMultiplier = await FareService.getSurgeMultiplier({
      zone: 'business',
      time: new Date()
    });
    console.log('Surge Multiplier:', JSON.stringify(surgeMultiplier, null, 2));

    // 15. Example: Get available vehicle types
    console.log('\n🚙 Getting available vehicle types...');
    const vehicleTypes = await FareService.getAvailableVehicleTypes();
    console.log('Vehicle Types:', JSON.stringify(vehicleTypes, null, 2));

    // 16. Example: Get fare configuration
    console.log('\n⚙️ Getting fare configuration...');
    const fareConfig = await FareService.getFareConfig();
    console.log('Fare Config (partial):', {
      currency: fareConfig.data.currency,
      vehicleTypes: Object.keys(fareConfig.data.vehicleTypes)
    });

    // 17. Example: Health check
    console.log('\n🏥 Health check...');
    const health = await FareService.healthCheck();
    console.log('Health Check:', JSON.stringify(health, null, 2));

    console.log('\n✅ All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error in example:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Express.js integration example with latest features
function expressIntegrationExample() {
  const app = express();
  app.use(express.json());

  // Initialize fare engine
  let FareService;
  
  app.use(async (req, res, next) => {
    if (!FareService) {
      await initializeFareEngine(mongoose.connection);
      FareService = getServices().FareService;
    }
    next();
  });

  // Route for traditional fare calculation
  app.post('/api/fare/calculate', async (req, res) => {
    try {
      const result = await FareService.calculateFinalFare(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
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

  // Route for fare range
  app.get('/api/fare/range', async (req, res) => {
    try {
      const result = await FareService.getFareRange(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Route for coupon verification and application
  app.post('/api/fare/trip/coupon/verify', async (req, res) => {
    try {
      const result = await FareService.verifyAndApplyCoupon(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Route for getting applied coupons
  app.get('/api/fare/trip/coupon/applied', async (req, res) => {
    try {
      const result = await FareService.getAppliedCoupons(req.query);
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

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage();
}

module.exports = {
  exampleUsage,
  expressIntegrationExample
}; 