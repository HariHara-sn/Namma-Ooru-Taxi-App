# 🚀 Fare Engine - Function Usage Guide

This guide demonstrates how to use the Fare Engine functions directly in your Node.js application.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Core Functions](#core-functions)
- [🚦 Trip-Based Fare Calculation & Coupon Workflow](#-trip-based-fare-calculation--coupon-workflow)
- [Traditional Fare Calculation](#traditional-fare-calculation)
- [Enhanced Coupon System](#enhanced-coupon-system)
- [Utility Functions](#utility-functions)
- [Collection Mapping](#collection-mapping)
- [Error Handling](#error-handling)

## 🚀 Quick Start

```javascript
const mongoose = require('mongoose');
const { initializeFareEngine, getServices } = require('./fare-engine');

async function quickStart() {
  // 1. Connect to MongoDB
  await mongoose.connect('mongodb://localhost:27017/yourDatabase');
  
  // 2. Initialize fare engine
  await initializeFareEngine(mongoose.connection);
  
  // 3. Get services
  const { FareService } = getServices();
  
  // 4. Use the service
  const result = await FareService.calculateFareFromTrip({
    tripId: 'your-trip-id',
    distance: 10,
    duration: 20,
    waitTime: 5,
    zone: 'business'
  });
  
  console.log(result);
}
```

## 🔧 Core Functions

### Initialize Fare Engine
```javascript
await initializeFareEngine(mongooseConnection, customMappings);
```

### Get Services
```javascript
const { 
  FareService, 
  TripFareService, 
  CouponVerificationService,
  SurgeService,
  PromoService,
  IncentiveService,
  CancellationService 
} = getServices();
```

## 🚦 Trip-Based Fare Calculation & Coupon Workflow

### How It Works

- **Coupon verification and application**: Use `verifyAndApplyCoupon` to check and apply a coupon to a trip. This only verifies and stores the coupon in the trip; it does not consume the coupon yet.
- **Coupon storage**: Coupons are stored in the trip document. You do not pass coupons to fare calculation functions for trips.
- **Automatic coupon usage update**: When you calculate the final fare for a trip (with wait time > 0), passenger coupon usage is automatically updated.
- **No separate update call needed**: The system handles coupon usage tracking automatically during final fare calculation.

### Workflow Steps

1. **Create Trip**: Store trip with driver, vehicle, and passenger info
2. **Apply Coupons**: Use `verifyAndApplyCoupon` to store coupons in trip
3. **Calculate Pre-Final**: Use `calculatePreFinalFareFromTrip` for estimates
4. **Calculate Final**: Use `calculateFareFromTrip` for final fare (updates coupon usage)

### Direct Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `calculateFareFromTrip()` | Calculate final fare using tripId | `{tripId, distance, duration, waitTime, zone, regionCode}` |
| `calculatePreFinalFareFromTrip()` | Calculate pre-final fare using tripId | `{tripId, distance, duration, zone, regionCode}` |
| `calculateMultiPassengerFare()` | Calculate fare for all passengers in trip | `{tripId, distance, duration, waitTime, zone, regionCode}` |
| `getTripPassengers()` | Get all passenger IDs from trip | `{tripId}` |
| `verifyAndApplyCoupon()` | Verify and apply coupon to trip | `{tripId, couponCode, fare, regionCode}` |
| `getAppliedCoupons()` | Get applied coupons for trip | `{tripId}` |
| `removeCouponFromTrip()` | Remove coupon from trip | `{tripId, couponCode}` |
| `getAvailableCouponsForTrip()` | Get available coupons for trip | `{tripId, fare, regionCode}` |

### Example Usage

```javascript
const { FareService } = getServices();

// 1. Create a trip (in your application)
const trip = new Trip({
  driverId: 'DRIVER001',
  vehicleId: 'VEHICLE001',
  userId: 'user123',
  passangers: ['user123', 'user456'],
  status: 'accepted'
});
const savedTrip = await trip.save();

// 2. Apply coupon to trip
const couponResult = await FareService.verifyAndApplyCoupon({
  tripId: savedTrip._id.toString(),
  couponCode: 'FIRST_RIDE',
  fare: 200,
  regionCode: 'default'
});

// 3. Calculate pre-final fare (estimate)
const preFinalFare = await FareService.calculatePreFinalFareFromTrip({
  tripId: savedTrip._id.toString(),
  distance: 10,
  duration: 20,
  zone: 'business'
});

// 4. Calculate final fare (updates coupon usage automatically)
const finalFare = await FareService.calculateFareFromTrip({
  tripId: savedTrip._id.toString(),
  distance: 10,
  duration: 20,
  waitTime: 5,
  zone: 'business'
});
```

## 💰 Traditional Fare Calculation

### Direct Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `getFareRange()` | Get fare range for vehicle types | `{distance, duration, zone, vehicleType, regionCode}` |
| `calculatePreFinalFare()` | Calculate pre-final fare (traditional) | `{distance, duration, zone, regionCode, driverId, coupons, userId}` |
| `calculateFinalFare()` | Calculate final fare (traditional) | `{distance, duration, waitTime, zone, regionCode, driverId, coupons, userId}` |
| `applyCoupon()` | Apply coupon to fare (traditional) | `{fare, couponCode, regionCode, userId}` |
| `getAvailableCoupons()` | Get available coupons (traditional) | `{fare, regionCode, userId}` |

### Example Usage

```javascript
const { FareService } = getServices();

// Get fare range
const fareRange = await FareService.getFareRange({
  distance: 10,
  duration: 20,
  zone: 'residential',
  vehicleType: 'ALL'
});

// Calculate traditional fare
const traditionalFare = await FareService.calculateFinalFare({
  distance: 10,
  duration: 20,
  waitTime: 5,
  zone: 'business',
  driverId: 'DRIVER001',
  coupons: ['FIRST_RIDE'],
  userId: 'user123'
});

// Apply coupon (traditional)
const couponResult = await FareService.applyCoupon({
  fare: 200,
  couponCode: 'FIRST_RIDE',
  userId: 'user123'
});
```

## 🎫 Enhanced Coupon System

### Key Features

- **Verification Only**: Coupons are verified and stored in trips, not consumed immediately
- **Automatic Usage**: Coupon usage is updated only after successful trip completion
- **Trip Storage**: Coupons are stored in the trip collection
- **No Manual Updates**: No need for separate update usage API calls

### Direct Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `verifyAndApplyCoupon()` | Verify and apply coupon to trip | `{tripId, couponCode, fare, regionCode}` |
| `getAppliedCoupons()` | Get applied coupons for trip | `{tripId}` |
| `removeCouponFromTrip()` | Remove coupon from trip | `{tripId, couponCode}` |
| `getAvailableCouponsForTrip()` | Get available coupons for trip | `{tripId, fare, regionCode}` |

### Example Usage

```javascript
const { FareService } = getServices();

// 1. Verify and apply coupon
const verification = await FareService.verifyAndApplyCoupon({
  tripId: 'trip-id-123',
  couponCode: 'FIRST_RIDE',
  fare: 200,
  regionCode: 'default'
});

// 2. Get applied coupons
const appliedCoupons = await FareService.getAppliedCoupons({
  tripId: 'trip-id-123'
});

// 3. Remove coupon if needed
const removeResult = await FareService.removeCouponFromTrip({
  tripId: 'trip-id-123',
  couponCode: 'FIRST_RIDE'
});

// 4. Get available coupons for trip
const availableCoupons = await FareService.getAvailableCouponsForTrip({
  tripId: 'trip-id-123',
  fare: 200,
  regionCode: 'default'
});
```

## 🛠️ Utility Functions

### Direct Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `getDriverIncentives()` | Get driver incentives/penalties | `{driverId, regionCode}` |
| `getSurgeMultiplier()` | Get surge multiplier for zone/time | `{zone, regionCode, time}` |
| `getAvailableVehicleTypes()` | Get available vehicle types | `{regionCode}` |
| `getFareConfig()` | Get fare configuration | `{regionCode}` |
| `healthCheck()` | Check service health | `{}` |

### Example Usage

```javascript
const { FareService } = getServices();

// Get driver incentives
const incentives = await FareService.getDriverIncentives({
  driverId: 'DRIVER001'
});

// Get surge multiplier
const surge = await FareService.getSurgeMultiplier({
  zone: 'business',
  time: new Date()
});

// Get available vehicle types
const vehicleTypes = await FareService.getAvailableVehicleTypes();

// Get fare configuration
const config = await FareService.getFareConfig({
  regionCode: 'default'
});

// Health check
const health = await FareService.healthCheck();
```

## 🔄 Collection Mapping

### Default Mappings

```javascript
const defaultMappings = {
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
```

### Custom Mappings

```javascript
const customMappings = {
  driver: {
    id: 'driver_id',           // Instead of 'driverId'
    rating: 'driver_rating',   // Instead of 'rating'
    tripCountToday: 'today_trips',
    totalTripsAccepted: 'accepted_trips',
    totalTripsRejected: 'rejected_trips',
    isTrusted: 'trusted_status',
    liveStats: 'online_status',
    vehicleId: 'vehicle_id'
  },
  vehicle: {
    id: 'vehicle_id',          // Instead of '_id'
    type: 'vehicle_type',      // Instead of 'type'
    driverId: 'driver_id'
  },
  passenger: {
    id: 'passenger_id',        // Instead of '_id'
    userId: 'user_id'          // Instead of 'userId'
  },
  trip: {
    id: 'trip_id',             // Instead of '_id'
    driverId: 'driver_id',     // Instead of 'driverId'
    vehicleId: 'vehicle_id',   // Instead of 'vehicleId'
    userId: 'user_id',         // Instead of 'userId'
    passengers: 'passenger_list' // Instead of 'passangers'
  }
};

// Initialize with custom mappings
await initializeFareEngine(mongoose.connection, customMappings);
```

### Runtime Mapping Updates

```javascript
const { updateCollectionMappings } = require('./fare-engine');

// Update mappings at runtime
updateCollectionMappings({
  driver: {
    id: 'new_driver_id_field'
  }
});
```

## ⚠️ Error Handling

### Response Format

All functions return a consistent response format:

```javascript
// Success Response
{
  success: true,
  data: {
    // Function-specific data
  }
}

// Error Response
{
  success: false,
  error: 'Error message'
}
```

### Example Error Handling

```javascript
const { FareService } = getServices();

try {
  const result = await FareService.calculateFareFromTrip({
    tripId: 'invalid-trip-id',
    distance: 10,
    duration: 20,
    zone: 'business'
  });
  
  if (result.success) {
    console.log('Fare calculated:', result.data);
  } else {
    console.error('Calculation failed:', result.error);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## 📊 Complete Integration Example

```javascript
const express = require('express');
const mongoose = require('mongoose');
const { initializeFareEngine, getServices } = require('./fare-engine');

async function setupFareEngine() {
  // 1. Connect to MongoDB
  await mongoose.connect('mongodb://localhost:27017/yourDatabase');
  
  // 2. Initialize fare engine
  await initializeFareEngine(mongoose.connection);
  
  // 3. Get services
  const { FareService } = getServices();
  
  // 4. Setup Express app
  const app = express();
  app.use(express.json());
  
  // 5. Add routes
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
  
  // 6. Start server
  app.listen(3001, () => {
    console.log('Fare Engine API running on port 3001');
  });
}

setupFareEngine().catch(console.error);
```

## 🎯 Key Benefits

1. **Modular Design**: Trip-based approach separates concerns
2. **Flexible Mappings**: Works with any database schema
3. **Enhanced Coupons**: Prevents coupon waste, better user experience
4. **Automatic Updates**: No manual coupon usage tracking needed
5. **Backward Compatible**: Traditional methods still available
6. **Runtime Configurable**: Update mappings without restart

This comprehensive function guide covers all the latest features and provides clear examples for integration into your existing projects. 