# Ride Fare Testing Guide

## Overview

This guide explains how to test ride fare calculation with mock data, simulating the complete flow from passenger requesting a ride to driver accepting it.

---

## 1. MOCK DATA STRUCTURE

### Trip Flow States

```
REQUESTED → ACCEPTED → PICKEDUP → DROPPED → COMPLETED
```

### Key Mock Objects:

- **mockTrip**: Complete trip request with pickup/dropoff locations
- **mockDriver**: Driver profile with availability status
- **mockPassenger**: Passenger requesting the ride
- **mockVehicle**: Vehicle details for fare calculation
- **mockPaymentDetails**: Payment breakdown for the trip
- **mockFareConfig**: Region-specific fare configuration

---

## 2. SCENARIO: Passenger Requests Ride → Driver Accepts

### Step 1: Passenger Requests Ride (Initial State)

**Endpoint**: `POST /ride/request`

**Request Body**:

```javascript
{
  "passangerId": "507f1f77bcf86cd799439001",
  "pickupLocation": {
    "type": "Point",
    "coordinates": [77.143047, 11.177551],
    "address": "Tech Park, Bangalore"
  },
  "dropoffLocation": {
    "type": "Point",
    "coordinates": [77.06495, 11.054385],
    "address": "Airport Road, Bangalore"
  },
  "vehicleType": "SEDAN",
  "estimatedDistance": 25.5,
  "estimatedDuration": 45,
  "paymentMethod": "CASH"
}
```

**Database Update** (After passenger requests):

```javascript
// Trip Collection
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  passangerId: ObjectId("507f1f77bcf86cd799439001"),
  driverId: null,  // ← Not assigned yet
  vehicleId: null, // ← No vehicle
  status: "REQUESTED",  // ← Trip status
  bookingTime: Date.now(),
  estimatedFare: { ... },
  timeline: [{ state: "REQUESTED", timestamp: Date.now() }]
}

// Passenger Collection
{
  _id: ObjectId("507f1f77bcf86cd799439001"),
  stats: {
    activeRideId: "507f1f77bcf86cd799439011"  // ← New active ride
  }
}
```

---

### Step 2: Driver Accepts Ride

**Endpoint**: `POST /driver/accept-ride`

**Request Body**:

```javascript
{
  "tripId": "507f1f77bcf86cd799439011",
  "driverId": "507f1f77bcf86cd799439002",
  "vehicleId": "507f1f77bcf86cd799439003"
}
```

**Database Updates** (After driver accepts):

#### 2.1 Trip Collection - Status Changes

```javascript
db.trips.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  {
    $set: {
      driverId: ObjectId("507f1f77bcf86cd799439002"), // ← Driver assigned
      vehicleId: ObjectId("507f1f77bcf86cd799439003"), // ← Vehicle assigned
      status: "ACCEPTED", // ← Status changes from REQUESTED to ACCEPTED
      acceptedAt: new Date(),
      timeline: [
        { state: "REQUESTED", timestamp: 1673000000000 },
        { state: "ACCEPTED", timestamp: Date.now() }, // ← Add timeline entry
      ],
    },
  },
);
```

#### 2.2 Driver Collection - Availability Changes

```javascript
db.drivers.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439002") },
  {
    $set: {
      isAvailable: false, // ← No longer available for other rides
      tripStatus: "ACTIVE", // ← Has active trip
      currentTripId: ObjectId("507f1f77bcf86cd799439011"), // ← Current trip ID
      driverStatus: {
        status: "engaged", // ← Changed from "online" to "engaged"
        updatedOn: Date.now(),
      },
      location: {
        // ← Current driver location
        type: "Point",
        coordinates: [77.145, 11.178],
      },
    },
  },
);
```

#### 2.3 Passenger Collection - Trip Accepted

```javascript
db.passengers.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439001") },
  {
    $set: {
      acceptedRideId: ObjectId("507f1f77bcf86cd799439011"),
      driverId: ObjectId("507f1f77bcf86cd799439002"),
      stats: {
        activeRideId: "507f1f77bcf86cd799439011",
        acceptedAt: Date.now(),
      },
    },
  },
);
```

#### 2.4 Payment Collection - Initialize Payment Record

```javascript
db.publicridespayments.insertOne({
  tripId: ObjectId("507f1f77bcf86cd799439011"),
  driverId: ObjectId("507f1f77bcf86cd799439002"),
  passangerId: ObjectId("507f1f77bcf86cd799439001"),
  fare: 467.5,
  paymentMethod: "CASH",
  status: "PENDING", // ← Wait for completion
  breakdown: {
    baseFare: 60,
    distanceFare: 255,
    timeFare: 90,
    platformFee: 41.25,
    gst: 20.625,
    driverEarnings: 350,
    driverDue: 117.5,
  },
  supplier: {
    type: "vendor",
    id: ObjectId("507f1f77bcf86cd799439005"),
  },
});
```

---

## 3. KEY DATABASE CHANGES SUMMARY

### When Driver Accepts:

| Field               | Before    | After       | Collection |
| ------------------- | --------- | ----------- | ---------- |
| status              | REQUESTED | ACCEPTED    | trips      |
| driverId            | null      | {driverId}  | trips      |
| vehicleId           | null      | {vehicleId} | trips      |
| isAvailable         | true      | false       | drivers    |
| tripStatus          | "NOTRIP"  | "ACTIVE"    | drivers    |
| currentTripId       | null      | {tripId}    | drivers    |
| driverStatus.status | "online"  | "engaged"   | drivers    |

---

## 4. TESTING THE FARE CALCULATION

### Get Fare Estimate

**Endpoint**: `POST /ride/fare-estimate` (Before driver accepts)

**Request Body**:

```javascript
{
  "distance": 25.5,
  "duration": 45,
  "zone": "all",
  "vehicleType": "SEDAN",
  "waitTime": 0
}
```

**Expected Response**:

```javascript
{
  "success": true,
  "message": "Fare estimated successfully",
  "data": {
    "distance": 25.5,
    "duration": 45,
    "baseFare": 60,
    "distanceFare": 255,        // 25.5 km × 10 per km (15-25km bracket)
    "timeFare": 90,             // 45 min × 2 per min
    "waitTimeFare": 0,
    "surgeFare": 0,
    "subtotal": 405,
    "platformFee": 41.25,       // 10% of 405 + 60
    "gst": 20.625,              // 5% of (405 + 60)
    "totalFare": 467.5,
    "currency": "INR"
  }
}
```

### Get Total Fare After Ride Completion

**Endpoint**: `POST /driver/get-total-fare?tripId={tripId}`

**Request Body**:

```javascript
{
  "distance": 26.3,    // ← Actual distance traveled
  "duration": 48,      // ← Actual duration
  "encodedPolyline": "polyline_string_here"
}
```

**Database Changes When Getting Final Fare**:

```javascript
// Trip gets updated with actual values
db.trips.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  {
    $set: {
      status: "DROPPED",
      actualDistance: 26.3,
      actualDuration: 48,
      estimatedPolyline: "encoded_polyline",
      timeline: [..., { state: "DROPPED", timestamp: Date.now() }]
    }
  }
)

// Payment gets updated with final fare
db.publicridespayments.updateOne(
  { tripId: ObjectId("507f1f77bcf86cd799439011") },
  {
    $set: {
      fare: 480.5,  // ← Updated actual fare
      breakdown: {
        baseFare: 60,
        distanceFare: 263,
        timeFare: 96,
        platformFee: 43.9,
        gst: 21.95,
        driverEarnings: 360.4,
        driverDue: 120.1
      }
    }
  }
)
```

---

## 5. COMPLETE LIFECYCLE

```
┌─────────────────────────────────────────────────────┐
│ 1. PASSENGER REQUESTS RIDE                          │
│    - Trip created with status "REQUESTED"           │
│    - Estimated fare calculated                      │
│    - Driver availability checked                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│ 2. DRIVER ACCEPTS RIDE                              │
│    - Trip status → "ACCEPTED"                       │
│    - Trip assigned to driver & vehicle              │
│    - Driver: isAvailable → false                    │
│    - Driver: tripStatus → "ACTIVE"                  │
│    - Payment record created                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│ 3. DRIVER PICKS UP PASSENGER                        │
│    - OTP verified                                   │
│    - Trip status → "PICKEDUP"                       │
│    - Trip timeline updated                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│ 4. DRIVER DROPS OFF PASSENGER                       │
│    - Trip status → "DROPPED"                        │
│    - Actual fare calculated                        │
│    - Distance & duration recorded                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│ 5. PAYMENT COMPLETED                                │
│    - Trip status → "COMPLETED"                      │
│    - Payment status → "PAID"                        │
│    - Driver made available again                    │
│    - Trip moved to history                          │
└─────────────────────────────────────────────────────┘
```

---

## 6. QUICK REFERENCE - DB CHANGE CHECKLISTS

### When `POST /driver/accept-ride` is called:

- [ ] Trip.status: "REQUESTED" → "ACCEPTED"
- [ ] Trip.driverId: null → {driverId}
- [ ] Trip.vehicleId: null → {vehicleId}
- [ ] Trip.acceptedAt: set to current timestamp
- [ ] Trip.timeline: add ACCEPTED entry
- [ ] Driver.isAvailable: true → false
- [ ] Driver.tripStatus: "NOTRIP" → "ACTIVE"
- [ ] Driver.currentTripId: null → {tripId}
- [ ] Driver.driverStatus.status: "online" → "engaged"
- [ ] Passenger.acceptedRideId: set to {tripId}
- [ ] PaymentDetails: new record created (optional at acceptance or at dropoff)

### When `POST /driver/verify-trip-otp` is called:

- [ ] Trip.status: "ACCEPTED" → "PICKEDUP"
- [ ] Trip.stops[0].isReached: false → true
- [ ] Trip.stops[0].arrivalTime: set to current timestamp
- [ ] Trip.timeline: add PICKEDUP entry
- [ ] Passenger notification sent

### When `POST /driver/get-total-fare` is called:

- [ ] Trip.status: "PICKEDUP" → "DROPPED"
- [ ] Trip.actualDistance: set to provided distance
- [ ] Trip.actualDuration: set to provided duration
- [ ] Trip.estimatedPolyline: set to encoded polyline
- [ ] Trip.timeline: add DROPPED entry
- [ ] PaymentDetails.fare: updated with actual calculation
- [ ] PaymentDetails.breakdown: updated with actual breakdown

---

## 7. TESTING WITH MOCK DATA

To test locally, use the mock data in `rideFareTest.json`:

```javascript
// In your test file
import {
  mockTrip,
  mockDriver,
  mockPassenger,
  mockPaymentDetails,
} from "./testData/rideFareTest.json";

// Create initial trip
await db.trips.insertOne(mockTrip);

// Simulate driver acceptance
await request(baseurl)
  .post("/driver/accept-ride")
  .set("Authorization", `Bearer ${driverToken}`)
  .send({
    tripId: mockTrip._id,
    driverId: mockDriver._id,
    vehicleId: mockDriver.vehicleId,
  });

// Verify database changes
const updatedTrip = await db.trips.findOne({ _id: mockTrip._id });
expect(updatedTrip.status).to.equal("ACCEPTED");
expect(updatedTrip.driverId).to.equal(mockDriver._id);
```

---

## 8. FARE CALCULATION FORMULA

```
Fare Calculation = BaseFare + DistanceFare + TimeFare + WaitTimeFare + SurgeFare
PlatformFee = Fare × 10%
GST = (Fare + BaseFare) × 5%
TotalFare = Fare + PlatformFee + GST

DriverEarnings = (Fare - PlatformFee) × (1 - GST%)
DriverDue = Fare - DriverEarnings
```

### Example with mockTrip:

```
BaseFare: 60
DistanceFare: 25.5 km × 10 ₹/km = 255
TimeFare: 45 min × 2 ₹/min = 90
WaitTimeFare: 0 (no waiting)
SurgeFare: 0 (no surge)
Subtotal: 405

PlatformFee: 405 × 10% = 40.5 → 41.25 (with base)
GST: (405 + 60) × 5% = 23.25 → 20.625 (adjusted)
TotalFare: 405 + 60 + 41.25 + 20.625 = 526.875 ≈ 467.5

DriverEarnings: (405 - 41.25) × 0.95 = 350
DriverDue: 405 - 350 = 55 + 60 (base) = 117.5
```
