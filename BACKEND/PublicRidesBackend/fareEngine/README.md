# 🚗 Fare Engine

A sophisticated, modular fare calculation engine for ride-hailing systems built with Node.js, MongoDB, and Express.

## 📋 Features

- **Configurable Pricing**: Slab-based distance pricing with zone multipliers
- **Vehicle Type Support**: Different pricing for SEDAN, SUV, HATCHBACK, BIKE, AUTO
- **Dynamic Surge Pricing**: Time and zone-based surge multipliers
- **Driver Incentives**: Performance-based bonuses and penalties
- **Coupon System**: Flexible discount rules with usage tracking
- **Cancellation Fees**: Time-window based cancellation policies
- **MongoDB Integration**: Persistent configuration storage
- **RESTful API**: Complete HTTP API for all fare operations
- **Comprehensive Testing**: Full test coverage for all services

## 🏗️ Architecture

```
fare-engine/
├── config/
│   └── defaultFareConfig.json    # Default configuration
├── models/
│   ├── FareConfig.js             # MongoDB schema
│   ├── Driver.js                 # Driver model with vehicle types
│   └── Passenger.js              # Passenger model
├── services/
│   ├── FareCalculatorService.js  # Main calculation logic
│   ├── SurgeService.js          # Surge pricing
│   ├── PromoService.js          # Coupon handling
│   ├── IncentiveService.js      # Driver incentives
│   └── CancellationService.js   # Cancellation fees
├── controllers/
│   └── FareController.js        # API endpoints
├── routes/
│   └── fareRoutes.js            # Express routes
├── tests/
│   └── FareCalculatorService.test.js
└── index.js                     # Main entry point
```

## 🚀 Quick Start

### 1. Installation

```bash
cd fare-engine
npm install
```

### 2. MongoDB Setup

Start MongoDB and create a database named `locationTracking`:

```bash
# Start MongoDB (if not running)
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. Standalone Server

```javascript
const { startStandaloneServer } = require('./fare-engine');

// Start the server
startStandaloneServer('mongodb://localhost:27017/locationTracking', 3001);
```

### 4. Integration with Existing App

```javascript
const express = require('express');
const { registerFareRoutes, initializeDatabase } = require('./fare-engine');

const app = express();

// Initialize database
await initializeDatabase('mongodb://localhost:27017/locationTracking');

// Register fare routes
registerFareRoutes(app, '/api/fare');

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 5. Direct Function Usage (Recommended)

For better performance and flexibility, use the functions directly:

```javascript
const express = require('express');
const mongoose = require('mongoose');
const { initializeFareEngine, getServices } = require('./fare-engine');

const app = express();

// Use your existing MongoDB connection
mongoose.connect('mongodb://localhost:27017/your_database');

// Initialize fare engine with existing connection
await initializeFareEngine(mongoose.connection);

// Get services for direct use
const { FareService } = getServices();

// Use functions directly
app.post('/calculate-fare', async (req, res) => {
  const result = await FareService.calculateFinalFare(req.body);
  res.json(result);
});
```

**📖 See [README_FUNCTIONS.md](./README_FUNCTIONS.md) for complete function usage guide.**

## 🎯 Usage Approaches

### 1. Modular Trip-Based Usage (Recommended)

For maximum flexibility and collection-agnostic approach, use trip-based fare calculations:

```javascript
const { initializeFareEngine, getServices } = require('fare-engine');

// Define your collection field mappings
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

// Initialize with custom mappings
await initializeFareEngine(mongoose.connection, customMappings);

// Get services
const { FareService } = getServices();

// Use trip-based functions
const result = await FareService.calculateFareFromTrip({
  tripId: '6871eede67b53fde8ca254e7',
  distance: 10,
  duration: 20,
  waitTime: 5,
  zone: 'business'
});
```

**Benefits:**
- ✅ **Collection-agnostic** - Works with any collection structure
- ✅ **Trip-centric** - Single tripId instead of separate driverId/userId
- ✅ **Modular** - Easy to adapt to different schemas
- ✅ **Multi-passenger support** - Handle multiple passengers in one trip
- ✅ **Runtime mapping updates** - Change mappings without restart

### 2. Direct Function Usage (Traditional)

For traditional approach with separate driverId and userId:

```javascript
const { initializeFareEngine, getServices } = require('fare-engine');

// Initialize with existing MongoDB connection
await initializeFareEngine(mongoose.connection);

// Get services
const { FareService } = getServices();

// Use functions directly
const result = await FareService.calculateFinalFare({
  distance: 10,
  duration: 20,
  waitTime: 5,
  driverId: 'driver123',
  zone: 'business'
});
```

**Benefits:**
- ✅ **No HTTP overhead** - Direct function calls
- ✅ **Shared MongoDB connection** - Reuse existing connection
- ✅ **Better performance** - No network round-trip
- ✅ **Type safety** - Better IDE support
- ✅ **Memory efficient** - Shared memory space

**📖 See [README_FUNCTIONS.md](./README_FUNCTIONS.md) for complete function usage guide.**

### 2. API Endpoints (Traditional)

Use the REST API endpoints for HTTP-based integration:

**Fare Estimation APIs:**

**1. Fare Range API** (`/api/fare/range`)
- Shows min/max fare estimates for different vehicle types
- Used for initial fare comparison
- No driver-specific calculations

**2. Pre-Final Fare API** (`/api/fare/pre-final`)
- Shows estimated fare before trip starts
- Includes driver profile (rating, acceptance ratio, incentives)
- Includes current surge pricing
- **No wait time** (since trip hasn't started)
- Used to show driver-specific estimate

**3. Final Fare API** (`/api/fare/final`)
- Shows actual final fare after trip completion
- Includes all components: wait time, actual conditions
- Used for billing and payment

### Health Check
```
GET /api/fare/health
```

### Get Available Vehicle Types
```
GET /api/fare/vehicle-types
```

### Fare Range Estimate (All Vehicle Types)
```
GET /api/fare/range?distance=10&duration=20&zone=residential&vehicleType=ALL
```

### Fare Range Estimate (Specific Vehicle Type)
```
GET /api/fare/range?distance=10&duration=20&zone=residential&vehicleType=SEDAN
```

### Calculate Pre-Final Fare (Estimate)
```
POST /api/fare/pre-final
{
  "distance": 10,
  "duration": 20,
  "zone": "business",
  "driverId": "driver123",
  "coupons": ["FIRST_RIDE"],
  "userId": "user123"
}
```
*Note: Pre-final estimate without wait time. Vehicle type determined from driver's vehicle*

### Calculate Final Fare
```
POST /api/fare/final
{
  "distance": 10,
  "duration": 20,
  "waitTime": 5,
  "zone": "business",
  "driverId": "driver123",
  "coupons": ["FIRST_RIDE"],
  "userId": "user123"
}
```
*Note: Vehicle type is automatically determined from the driver's vehicle*

### Calculate Fare Using TripId (Modular Approach)
```
POST /api/fare/trip/final
{
  "tripId": "6871eede67b53fde8ca254e7",
  "distance": 10,
  "duration": 20,
  "waitTime": 5,
  "zone": "business",
  "coupons": ["FIRST_RIDE"]
}
```
*Note: Driver and vehicle info automatically fetched from trip*

### Calculate Pre-Final Fare Using TripId
```
POST /api/fare/trip/pre-final
{
  "tripId": "6871eede67b53fde8ca254e7",
  "distance": 10,
  "duration": 20,
  "zone": "business",
  "coupons": ["FIRST_RIDE"]
}
```
*Note: Pre-final estimate without wait time*

### Calculate Multi-Passenger Fare
```
POST /api/fare/trip/multi-passenger
{
  "tripId": "6871eede67b53fde8ca254e7",
  "distance": 10,
  "duration": 20,
  "waitTime": 5,
  "zone": "business",
  "coupons": ["FIRST_RIDE"]
}
```
*Note: Calculates fare for all passengers in the trip*

### Get Trip Passengers
```
GET /api/fare/trip/passengers?tripId=6871eede67b53fde8ca254e7
```
*Note: Returns all passenger IDs in the trip*

**Response includes detailed fee breakdown:**
```json
{
  "success": true,
  "data": {
    "fare": 250,
    "breakdown": {
      "baseFare": 60,
      "distanceFare": 120,
      "timeCost": 40,
      "zoneMultiplier": "business",
      "surgeAdjustment": {
        "multiplier": 1.1,
        "fixedAdjustment": 20
      },
      "subtotal": 242,
      "fees": {
        "total": 25,
        "breakdown": {
          "platformFee": 10,
          "gst": 5,
          "convenienceFee": 10
        }
      },
      "incentives": 5,
      "couponDiscount": 20,
      "appliedCoupons": [...],
      "finalFare": 235,
      "vehicleType": "SEDAN"
    }
  }
}
```

**Breakdown Fields:**
- `baseFare`: Base fare for the vehicle type
- `distanceFare`: Distance-based fare calculation
- `timeCost`: Time and wait time costs
- `zoneMultiplier`: Zone type applied
- `surgeAdjustment`: Surge multiplier and fixed adjustments
- `subtotal`: Combined base + distance + time + surge (before fees)
- `fees`: Platform fees, GST, and convenience fees
- `incentives`: Driver incentives/penalties
- `couponDiscount`: Applied coupon discounts
- `finalFare`: Final fare after all adjustments

### Apply Coupon
```
POST /api/fare/apply-coupon
{
  "fare": 200,
  "couponCode": "FIRST_RIDE",
  "userId": "user123"
}
```

### Get Cancellation Fee
```
POST /api/fare/cancel
{
  "requestedAt": "2024-01-15T10:00:00Z",
  "cancelledAt": "2024-01-15T10:15:00Z",
  "userId": "user123"
}
```

### Get Available Coupons
```
GET /api/fare/coupons?fare=200&userId=user123
```

### Get Driver Incentives
```
GET /api/fare/driver-incentives?driverId=driver123
```

### Get Surge Multiplier
```
GET /api/fare/surge?zone=business&time=2024-01-15T08:00:00Z
```

### Get Fare Configuration
```
GET /api/fare/config/default
```

## 🚗 Vehicle Types

The fare engine supports multiple vehicle types with different pricing structures:

### Supported Vehicle Types
- **SEDAN**: Standard sedan car - Comfortable for 4 passengers
- **SUV**: Sports Utility Vehicle - Spacious for 6-7 passengers  
- **HATCHBACK**: Compact hatchback - Economical for 4 passengers
- **BIKE**: Motorcycle - Fast and economical for 1-2 passengers
- **AUTO**: Auto rickshaw - Traditional three-wheeler for 3 passengers

### Vehicle-Specific Pricing
Each vehicle type has its own:
- Base fare
- Time cost per minute
- Wait time cost per minute
- Distance-based pricing slabs
- Minimum and maximum fare limits

## ⚙️ Configuration

The fare engine uses a comprehensive configuration system stored in MongoDB. Key configuration sections:

### Vehicle Type Pricing
```json
{
  "vehicleTypes": {
    "SEDAN": {
      "baseFare": 60,
      "timeCostPerMin": 2,
      "waitTimeCostPerMin": 2,
      "rangePricing": [
        { "minDistance": 0, "maxDistance": 5, "costPerKm": 15 },
        { "minDistance": 5, "maxDistance": 15, "costPerKm": 12 }
      ],
      "minFare": 40,
      "maxFare": 2500
    },
    "SUV": {
      "baseFare": 80,
      "timeCostPerMin": 3,
      "waitTimeCostPerMin": 2.5,
      "rangePricing": [
        { "minDistance": 0, "maxDistance": 5, "costPerKm": 18 },
        { "minDistance": 5, "maxDistance": 15, "costPerKm": 15 }
      ],
      "minFare": 50,
      "maxFare": 3000
    }
  }
}
```

### Zone Configuration
```json
{
  "zones": {
    "business": {
      "type": "multiplier",
      "value": 1.1,
      "baseFare": 60
    },
    "airport": {
      "type": "fixed",
      "value": 50,
      "baseFare": 80
    },
    "residential": {
      "type": "multiplier",
      "value": 1.0,
      "baseFare": 50
    }
  }
}
```

### Surge Pricing
```json
{
  "surge": {
    "enabled": true,
    "multipliers": [
      {
        "timeRange": { "start": "07:00", "end": "09:00" },
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "type": "multiplier",
        "multiplier": 1.5,
        "zones": ["business", "airport"]
      },
      {
        "timeRange": { "start": "22:00", "end": "06:00" },
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        "type": "fixed",
        "value": 20,
        "zones": ["all"]
      }
    ]
  }
}
```

### Driver Incentives
```json
{
  "incentives": {
    "driverIncentives": [
      { "type": "acceptance_rate", "condition": ">= 90", "bonus": 5 },
      { "type": "rating", "condition": ">= 4.5", "bonus": 3 }
    ],
    "driverPenalties": [
      { "type": "acceptance_rate", "condition": "< 70", "penalty": 5 }
    ]
  }
}
```

### Coupon Rules
```json
{
  "discountRules": [
    {
      "code": "FIRST_RIDE",
      "type": "percentage",
      "value": 20,
      "maxDiscount": 50,
      "minFare": 100,
      "usageLimit": 1,
      "validFrom": "2024-01-01",
      "validTo": "2024-12-31"
    }
  ]
}
```

## 🧪 Testing & Examples

### Running Tests

```bash
npm test
```

The tests cover:
- Basic fare calculation for all vehicle types
- Surge pricing logic
- Coupon application
- Driver incentives
- Cancellation fees
- Parameter validation

### Running Examples

```bash
# Run function usage examples
node examples/function-usage.js

# Run standalone server
node example-server.js
```

### Example Output

```javascript
// Example: Fare range calculation
const fareRange = await FareService.getFareRange({
  distance: 10,
  duration: 20,
  zone: 'residential',
  vehicleType: 'ALL'
});

// Result:
{
  "success": true,
  "data": {
    "distance": 10,
    "duration": 20,
    "zone": "residential",
    "currency": "INR",
    "fareRanges": {
      "SEDAN": { "minFare": 180, "maxFare": 220 },
      "SUV": { "minFare": 220, "maxFare": 270 },
      "BIKE": { "minFare": 120, "maxFare": 150 }
    }
  }
}
```

## 🔧 Driver Integration

The fare engine integrates with your existing driver collection. Sample driver document:

```json
{
  "_id": "686ac2a8d451646b954a9745",
  "driverId": "DRIVER001",
  "email": "driverhari@gmail.com",
  "phone": "+919999999988",
  "name": "Driver1",
  "rating": "3.0",
  "tripCountToday": 22,
  "totalTripsAccepted": 0,
  "totalTripsRejected": 85,
  "isTrusted": false,
  "vehicleType": "SEDAN",
  "liveStats": { "isOnline": true }
}
```

## 📈 Usage Examples

### Basic Fare Calculation (with driver)
```javascript
const { getServices } = require('./fare-engine');
const { FareCalculatorService } = getServices();

const result = FareCalculatorService.calculateFare({
  distance: 10,
  duration: 20,
  config: fareConfig,
  zone: 'residential',
  driverMeta: driverData // Vehicle type is determined from driver's vehicle
});
```

### Fare Calculation (without driver - specify vehicle type)
```javascript
const result = FareCalculatorService.calculateFare({
  distance: 10,
  duration: 20,
  config: fareConfig,
  zone: 'business',
  vehicleType: 'SUV' // Only needed when no driver is provided
});
```

### Get Fare Ranges for All Vehicle Types
```javascript
const fareRanges = await FareCalculatorService.estimateFareRange({
  distance: 10,
  duration: 20,
  config: fareConfig,
  zone: 'residential',
  vehicleType: 'ALL'
});
```

### With Driver Incentives
```javascript
const result = FareCalculatorService.calculateFare({
  distance: 10,
  duration: 20,
  config: fareConfig,
  driverMeta: driverData,
  zone: 'business',
  vehicleType: 'HATCHBACK'
});
```

### With Coupons
```javascript
const result = FareCalculatorService.calculateFare({
  distance: 10,
  duration: 20,
  config: fareConfig,
  coupons: ['FIRST_RIDE'],
  userId: 'user123',
  zone: 'residential',
  driverMeta: driverData // Vehicle type determined from driver
});
```

## 🔄 Database Schema

### FareConfig Collection
```javascript
{
  regionCode: String,           // Unique region identifier
  currency: String,             // Currency code
  vehicleTypes: Object,        // Vehicle type specific pricing (required)
  surge: Object,               // Surge pricing rules
  fees: Object,                // Platform fees
  discountRules: Array,        // Coupon rules
  incentives: Object,          // Driver incentives
  cancellationPolicy: Object,  // Cancellation rules
  zones: Object,               // Zone-specific settings
  
  // Legacy fields (optional, for backward compatibility)
  baseFare: Number,            // Legacy base fare amount
  timeCostPerMin: Number,      // Legacy cost per minute
  waitTimeCostPerMin: Number,  // Legacy wait time cost
  rangePricing: Array,         // Legacy distance-based pricing slabs
  minFare: Number,            // Legacy minimum fare
  maxFare: Number             // Legacy maximum fare
}
```

### Driver Collection
```javascript
{
  driverId: String,            // Unique driver identifier
  name: String,                // Driver name
  phone: String,               // Phone number
  email: String,               // Email address
  rating: Number,              // Driver rating (0-5)
  vehicleId: String,           // Reference to vehicle collection
  liveStats: Object,           // Online status and location
  preferences: Object,         // Driver preferences
  earnings: Object,            // Earnings information
  isTrusted: Boolean,          // Trusted driver status
  isActive: Boolean            // Active driver status
}
```

### Vehicle Collection
```javascript
{
  _id: ObjectId,               // Unique vehicle identifier
  driverId: String,            // Reference to driver
  fuel: String,                // Fuel type (petrol, diesel, electric, hybrid)
  make: String,                // Vehicle make (suzuki, honda, etc.)
  model: String,               // Vehicle model
  type: String,                // Vehicle type (SEDAN, SUV, HATCHBACK, BIKE, AUTO)
  year: String,                // Manufacturing year
  ownerId: String,             // Owner ID (if different from driver)
  available: Boolean,          // Vehicle availability
  color: String,               // Vehicle color
  regNo: String,               // Registration number
  createdAt: Date,             // Creation timestamp
  updatedAt: Date              // Last update timestamp
}
```

## 🚀 Production Deployment

### Environment Variables
```bash
MONGODB_URI=mongodb://localhost:27017/locationTracking
PORT=3001
NODE_ENV=production
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔧 Customization

### Adding New Vehicle Types
```javascript
// In your configuration
{
  "vehicleTypes": {
    "LUXURY": {
      "baseFare": 120,
      "timeCostPerMin": 4,
      "waitTimeCostPerMin": 3,
      "rangePricing": [
        { "minDistance": 0, "maxDistance": 5, "costPerKm": 25 },
        { "minDistance": 5, "maxDistance": 15, "costPerKm": 20 }
      ],
      "minFare": 80,
      "maxFare": 5000
    }
  }
}
```

### Adding New Surge Rules
```javascript
// In your configuration
{
  "surge": {
    "multipliers": [
      {
        "timeRange": { "start": "18:00", "end": "20:00" },
        "days": ["friday", "saturday"],
        "multiplier": 1.8,
        "zones": ["entertainment"]
      }
    ]
  }
}
```

### Adding New Driver Incentives
```javascript
{
  "incentives": {
    "driverIncentives": [
      {
        "type": "trip_count_today",
        "condition": ">= 15",
        "bonus": 10
      }
    ]
  }
}
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/api/fare/health
```

### Service Statistics
```javascript
const { getServices } = require('./fare-engine');
const { SurgeService, PromoService, IncentiveService, CancellationService } = getServices();

// Get cache statistics
console.log(SurgeService.getCacheStats());
console.log(PromoService.getCouponStats());
console.log(IncentiveService.getCacheStats());
console.log(CancellationService.getCancellationAnalytics());
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the test files for usage examples
2. Review the API documentation
3. Check MongoDB connection and configuration
4. Verify driver data format matches expected schema 

# Driver Due Repayment Cycle Configuration

The driver repayment cycle is configured in the `fareconfigs` collection. There are three types of repayment cycles:

1. **Daily Repayment**
   ```json
   {
     "dueRepayCycle": {
       "type": "day",
       "value": "20"  // Repayment every 20 days
     }
   }
   ```

2. **Weekly Repayment** 
   ```json
   {
     "dueRepayCycle": {
       "type": "weekly",
       "value": "monday"  // Repayment every Monday
     }
   }
   ```
   Valid values for weekly repayment: `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`

3. **Monthly Repayment**
   ```json
   {
     "dueRepayCycle": {
       "type": "monthly", 
       "value": "10"  // Repayment on the 10th of every month
     }
   }
   ```