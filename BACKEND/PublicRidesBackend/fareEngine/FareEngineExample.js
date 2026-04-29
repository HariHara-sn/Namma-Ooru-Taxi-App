const express = require('express');

const { MongoClient } = require('mongodb');
const FareEngineInterface = require('./FareEngineInterface');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/locationTracking';

async function initFareEngine() {
  try {
    // Initialize fare engine interface with the native client
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
        id: '_id',          // Instead of '_id'
        type: 'vehicle_type',      // Instead of 'type'
        driverId: 'driver_id'
      },
      passenger: {
        id: '_id',        // Instead of '_id'
        userId: 'user_id'          // Instead of 'userId'
      },
      trip: {
        id: 'trip_id',             // Instead of '_id'
        driverId: 'driverId',     // Instead of 'driverId'
        vehicleId: 'vehicleId',   // Instead of 'vehicleId'
        userId: 'userId',         // Instead of 'userId'
        passengers: 'passangers' // Instead of 'passangers'
      }
    };
    await FareEngineInterface.init(MONGO_URI, { customMappings });
    console.log('✅ Fare engine interface initialized with native MongoClient');

    return;

  } catch (err) {
    console.error('❌ Failed to connect or initialize fare engine:', err);
  }
};

async function main() {
  await initFareEngine();

  // await getFareRange();
  // await calculateFare();
  await calculatePreFinalFare();

}

async function getFareRange(){
  const { fareService } = FareEngineInterface.getServices();
  let result = await fareService.getFareRange({
    distance: 20,
    duration: 10,
    zone: 'all',
    vehicleType: 'ALL',
    regionCode: 'default'
  });
}
async function couponVerification() {
  const { fareService } = FareEngineInterface.getServices();
  const result = await fareService.verifyAndApplyCoupon({
    "tripId": "6871eede67b53fde8ca254e7",
    "couponCode": "LOYALTY_BONUS",
    "fare": 200,
    "regionCode": "default"
  });
  console.log('result', result);

}

async function calculateFare(){
  const { fareService } = FareEngineInterface.getServices();
  const result = await fareService.calculateFareFromTrip({
    "distance": 10,
    "duration": 20,
    "zone": "all",
    "regionCode": "default",
    "tripId":"6871eede67b53fde8ca254e7",
    "waitTime": 5
  
  });
  console.log('result', JSON.stringify(result, null, 2));
}

async function calculatePreFinalFare(){
  const { fareService } = FareEngineInterface.getServices();
  const result = await fareService.calculatePreFinalFareFromTrip({
    "distance": 10,
    "duration": 20,
    "zone": "all",
    "regionCode": "default",
    "tripId":"68870e49ddba87f79046396b",
    "waitTime": 5
  
  });
  console.log('result', JSON.stringify(result, null, 2));
}
main();
// Test completed
console.log('✅ Fare engine interface test completed');
