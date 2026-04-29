# 🚗 Modular Fare Engine - Collection-Agnostic Approach

This guide explains how to use the modular fare engine that works with any collection structure by providing field mappings during initialization.

## 🎯 Key Features

- ✅ **Collection-Agnostic** - Works with any MongoDB collection structure
- ✅ **Trip-Centric** - Use single tripId instead of separate driverId/userId
- ✅ **Runtime Mapping Updates** - Change field mappings without restart
- ✅ **Multi-Passenger Support** - Handle multiple passengers in one trip
- ✅ **Modular Design** - Easy to adapt to different schemas

## 📋 Quick Start

### 1. Define Your Collection Mappings

```javascript
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
  trip: {
    id: '_id',                         // Trip ObjectId
    driverId: 'driverId',              // Driver ID in trip
    vehicleId: 'vehicleId',            // Vehicle ID in trip
    userId: 'userId',                  // Primary user ID
    passengers: 'passangers'           // Array of passenger IDs
  }
};
```

### 2. Initialize with Custom Mappings

```javascript
const { initializeFareEngine, getServices } = require('fare-engine');

// Initialize with your custom mappings
await initializeFareEngine(mongoose.connection, customMappings);

// Get services
const { FareService } = getServices();
```

### 3. Use Trip-Based Functions

```javascript
// Calculate fare using tripId
const result = await FareService.calculateFareFromTrip({
  tripId: '6871eede67b53fde8ca254e7',
  distance: 10,
  duration: 20,
  waitTime: 5,
  zone: 'business',
  coupons: ['FIRST_RIDE']
});
```

## 🗄️ Collection Mapping Structure

### Driver Collection Mapping
```javascript
driver: {
  id: 'driverId',                    // Unique driver identifier
  rating: 'rating',                  // Driver rating (0-5)
  tripCountToday: 'tripCountToday', // Today's completed trips
  totalTripsAccepted: 'totalTripsAccepted', // Total accepted trips
  totalTripsRejected: 'totalTripsRejected', // Total rejected trips
  isTrusted: 'isTrusted',           // Trusted driver status
  liveStats: 'liveStats',           // Online status and location
  vehicleId: 'vehicleId'            // Reference to vehicle collection
}
```

### Vehicle Collection Mapping
```javascript
vehicle: {
  id: '_id',                         // Vehicle unique identifier
  type: 'type',                      // Vehicle type (SEDAN, SUV, etc.)
  driverId: 'driverId'               // Reference to driver
}
```

### Trip Collection Mapping
```javascript
trip: {
  id: '_id',                         // Trip unique identifier
  driverId: 'driverId',              // Assigned driver ID
  vehicleId: 'vehicleId',            // Assigned vehicle ID
  userId: 'userId',                  // Primary user ID
  passengers: 'passangers'           // Array of passenger IDs
}
```

## 🚀 API Endpoints

### Trip-Based Fare Calculation

#### Calculate Final Fare Using TripId
```bash
POST /api/fare/trip/final
{
  "tripId": "6871eede67b53fde8ca254e7",
  "distance": 10,
  "duration": 20,
  "waitTime": 5,
  "zone": "business",
  "coupons": ["FIRST_RIDE"],
  "regionCode": "default"
}
```

#### Calculate Pre-Final Fare Using TripId
```bash
POST /api/fare/trip/pre-final
{
  "tripId": "6871eede67b53fde8ca254e7",
  "distance": 10,
  "duration": 20,
  "zone": "business",
  "coupons": ["FIRST_RIDE"],
  "regionCode": "default"
}
```

#### Calculate Multi-Passenger Fare
```bash
POST /api/fare/trip/multi-passenger
{
  "tripId": "6871eede67b53fde8ca254e7",
  "distance": 10,
  "duration": 20,
  "waitTime": 5,
  "zone": "business",
  "coupons": ["FIRST_RIDE"],
  "regionCode": "default"
}
```

#### Get Trip Passengers
```bash
GET /api/fare/trip/passengers?tripId=6871eede67b53fde8ca254e7
```

## 🔧 Function Usage

### Direct Function Calls

```javascript
const { FareService } = getServices();

// Calculate fare from trip
const fareResult = await FareService.calculateFareFromTrip({
  tripId: '6871eede67b53fde8ca254e7',
  distance: 10,
  duration: 20,
  waitTime: 5,
  zone: 'business',
  coupons: ['FIRST_RIDE']
});

// Calculate pre-final fare
const preFinalResult = await FareService.calculatePreFinalFareFromTrip({
  tripId: '6871eede67b53fde8ca254e7',
  distance: 10,
  duration: 20,
  zone: 'business'
});

// Calculate multi-passenger fare
const multiPassengerResult = await FareService.calculateMultiPassengerFare({
  tripId: '6871eede67b53fde8ca254e7',
  distance: 10,
  duration: 20,
  waitTime: 5,
  zone: 'business'
});

// Get trip passengers
const passengersResult = await FareService.getTripPassengers({
  tripId: '6871eede67b53fde8ca254e7'
});
```

## 🔄 Runtime Mapping Updates

You can update collection mappings at runtime without restarting the service:

```javascript
const { updateCollectionMappings } = require('fare-engine');

// Update mappings for a different collection structure
const newMappings = {
  trip: {
    id: '_id',
    driverId: 'assigned_driver',      // Different field name
    vehicleId: 'vehicle_reference',   // Different field name
    userId: 'primary_user',           // Different field name
    passengers: 'trip_passengers'     // Different field name
  }
};

updateCollectionMappings(newMappings);
console.log('✅ Collection mappings updated');
```

## 📊 Example Responses

### Trip-Based Fare Calculation Response
```json
{
  "success": true,
  "data": {
    "success": true,
    "fare": 400,
    "breakdown": {
      "baseFare": 80,
      "distanceFare": 165,
      "timeCost": 60,
      "zoneMultiplier": "business",
      "surgeAdjustment": {
        "multiplier": 1,
        "fixedAdjustment": 0
      },
      "subtotal": 305,
      "fees": {
        "total": 55.325,
        "breakdown": {
          "platformFee": 33.55,
          "gst": 16.775,
          "convenienceFee": 5
        }
      },
      "incentives": 10,
      "couponDiscount": 0,
      "appliedCoupons": [],
      "finalFare": 400,
      "vehicleType": "SUV"
    },
    "tripId": "6871eede67b53fde8ca254e7",
    "driverId": "686ac2a8d451646b954a9746",
    "vehicleId": "678e20223e5d22e690d61dac",
    "primaryPassengerId": "6780bfd65418f3a88889adb2"
  }
}
```

### Multi-Passenger Fare Response
```json
{
  "success": true,
  "data": {
    "success": true,
    "tripId": "6871eede67b53fde8ca254e7",
    "passengerCount": 2,
    "results": {
      "6780bfd65418f3a88889adb2": {
        "success": true,
        "fare": 400,
        "breakdown": { ... }
      },
      "678e0b13aaa7f30c643155dd": {
        "success": true,
        "fare": 380,
        "breakdown": { ... }
      }
    }
  }
}
```

## 🎮 Different Collection Structures

### Example 1: Different Field Names
```javascript
const mappings1 = {
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
```

### Example 2: Different Trip Structure
```javascript
const mappings2 = {
  trip: {
    id: 'trip_id',
    driverId: 'assigned_driver',
    vehicleId: 'vehicle_reference',
    userId: 'primary_user',
    passengers: 'trip_passengers',
    stops: 'route_stops'
  }
};
```

### Example 3: Different Vehicle Structure
```javascript
const mappings3 = {
  vehicle: {
    id: 'vehicle_id',
    type: 'vehicle_category',
    driverId: 'owner_driver'
  }
};
```

## 🔧 Express.js Integration

```javascript
const express = require('express');
const { initializeFareEngine, getServices } = require('fare-engine');

const app = express();
app.use(express.json());

// Initialize with custom mappings
let FareService;

app.use(async (req, res, next) => {
  if (!FareService) {
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

// Trip-based fare calculation route
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

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## 🧪 Testing

### Test with Your Trip Data
```javascript
// Test with your actual trip ID
const testResult = await FareService.calculateFareFromTrip({
  tripId: '6871eede67b53fde8ca254e7', // Your trip ID
  distance: 10,
  duration: 20,
  waitTime: 5,
  zone: 'business'
});

console.log('Test Result:', JSON.stringify(testResult, null, 2));
```

### Validate Trip Parameters
```javascript
const { TripFareService } = getServices();

const validation = TripFareService.validateTripParameters({
  tripId: '6871eede67b53fde8ca254e7',
  distance: 10,
  duration: 20
});

if (validation.valid) {
  console.log('✅ Parameters are valid');
} else {
  console.log('❌ Validation errors:', validation.errors);
}
```

## 🔄 Migration from Traditional Approach

### Before (Traditional)
```javascript
const result = await FareService.calculateFinalFare({
  distance: 10,
  duration: 20,
  waitTime: 5,
  driverId: 'driver123',
  userId: 'user123',
  zone: 'business'
});
```

### After (Modular)
```javascript
const result = await FareService.calculateFareFromTrip({
  tripId: '6871eede67b53fde8ca254e7',
  distance: 10,
  duration: 20,
  waitTime: 5,
  zone: 'business'
});
```

## 🚀 Benefits

1. **Collection-Agnostic**: Works with any MongoDB collection structure
2. **Trip-Centric**: Single tripId instead of separate driverId/userId
3. **Modular**: Easy to adapt to different schemas
4. **Multi-Passenger**: Handle multiple passengers in one trip
5. **Runtime Updates**: Change mappings without restart
6. **Type Safety**: Better IDE support and error checking
7. **Performance**: Direct function calls, no HTTP overhead

## 📝 Best Practices

1. **Define Mappings Once**: Set up collection mappings at initialization
2. **Use Trip IDs**: Always use tripId for fare calculations
3. **Handle Errors**: Always check for success status in responses
4. **Update Mappings**: Use `updateCollectionMappings()` for schema changes
5. **Test Thoroughly**: Validate with your actual collection structure

This modular approach makes the fare engine completely flexible and adaptable to any collection structure! 