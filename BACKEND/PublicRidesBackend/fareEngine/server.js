
const express = require('express');
const cors = require('cors');
const FareEngineInterface = require('./FareEngineInterface.js');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/locationtracking';
const app = express();
const PORT = process.env.PORT || 5002;

// Enable CORS for all origins
app.use(cors());

// Middleware to parse JSON
app.use(express.json());
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


app.get('/get-fare', async (req, res) => {
  const { fareService } = FareEngineInterface.getServices();
  let { distance, duration, zone, regionCode, tripId, waitTime,driverId,fareAdjustment } = req.query;
  if(!distance || !duration || !zone || !regionCode || !tripId || !waitTime || !driverId){
    return res.status(400).json({ error: 'Missing required parameters distance, duration, zone, regionCode, tripId, waitTime,driverId' });
  }
  console.log("get-fare",distance, duration, zone, regionCode, tripId, waitTime,driverId,fareAdjustment);
  waitTime = (waitTime == 'null' || isNaN(Number(waitTime))) ? 0 : waitTime;
  const result = await fareService.calculatePreFinalFareFromTrip({
    "distance": distance,
    "duration": duration,
    "zone": zone,
    "regionCode": regionCode,
    "tripId":tripId,
    "waitTime": waitTime,
    "driverId": driverId,
    "fareAdjustment": fareAdjustment
  });
  console.log(result);
  if(result && result.data && result.data.fare){
    res.status(200).json({ success: true, fare: result.data.fare });
  }else{
    res.status(400).json({ success: false, error: 'Failed to calculate fare' });
  }
});

app.get('/get-final-fare', async (req, res) => {
  const { fareService } = FareEngineInterface.getServices();
  let { distance, duration, zone, regionCode, tripId, waitTime,driverId } = req.query;
  if(!distance || !duration || !zone || !regionCode || !tripId || !waitTime || !driverId){
    return res.status(400).json({ error: 'Missing required parameters distance, duration, zone, regionCode, tripId, waitTime,driverId' });
  }
  console.log(distance, duration, zone, regionCode, tripId, waitTime,driverId);
  waitTime = (waitTime == 'null' || isNaN(Number(waitTime))) ? 0 : waitTime;
  const result = await fareService.calculateFareFromTrip({
    "distance": distance,
    "duration": duration,
    "zone": zone,
    "regionCode": regionCode,
    "tripId":tripId,
    "waitTime": waitTime,
    "driverId": driverId
  });
  console.log(result);
  if(result && result.data && result.data.fare){
    res.status(200).json({ success: true, fare: result.data.fare });
  }else{
    res.status(400).json({ success: false, error: 'Failed to calculate fare' });
  }
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  initFareEngine();
  console.log(`Server listening on port ${PORT}`);
});
