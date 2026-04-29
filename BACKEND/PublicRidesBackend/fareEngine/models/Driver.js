const mongoose = require('mongoose');

const liveStatsSchema = new mongoose.Schema({
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  currentLocation: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
});

const driverSchema = new mongoose.Schema({
  driverId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  tripCountToday: { type: Number, default: 0 },
  totalTripsAccepted: { type: Number, default: 0 },
  totalTripsRejected: { type: Number, default: 0 },
  totalTripsCompleted: { type: Number, default: 0 },
  isTrusted: { type: Boolean, default: false },
  // isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  vehicleId: { type: String },
  liveStats: liveStatsSchema,
  preferences: {
    preferredZones: [{ type: String }],
    maxDistance: { type: Number, default: 50 },
    minFare: { type: Number, default: 0 }
  },
  earnings: {
    totalEarnings: { type: Number, default: 0 },
    todayEarnings: { type: Number, default: 0 },
    weeklyEarnings: { type: Number, default: 0 },
    monthlyEarnings: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for fast lookup
driverSchema.index({ driverId: 1 });
// driverSchema.index({ isActive: 1 });
driverSchema.index({ rating: -1 });
driverSchema.index({ 'liveStats.isOnline': 1 });
driverSchema.index({ vehicleType: 1 });

// Pre-save middleware to update timestamp
driverSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find driver by ID
driverSchema.statics.findByDriverId = function(driverId) {
  // Convert string driverId to ObjectId if it's a valid ObjectId format
  let query = {  };
  
  if (mongoose.Types.ObjectId.isValid(driverId)) {
    // If it's a valid ObjectId, search by _id
    query._id = new mongoose.Types.ObjectId(driverId);
  } else {
    // Otherwise search by driverId field
    query.driverId = driverId;
  }
  
  return this.findOne(query);
};

// Static method to find online drivers
driverSchema.statics.findOnlineDrivers = function() {
  return this.find({ 
    'liveStats.isOnline': true 
  });
};

// Static method to find driver by ObjectId
driverSchema.statics.findByObjectId = function(objectId) {
  if (!mongoose.Types.ObjectId.isValid(objectId)) {
    throw new Error('Invalid ObjectId format');
  }
  return this.findOne({ 
    _id: new mongoose.Types.ObjectId(objectId)
  });
};

// Static method to find drivers by vehicle type
driverSchema.statics.findByVehicleType = function(vehicleType) {
  return this.find({ 
    vehicleType,
    // isActive: true 
  });
};

// Instance method to update live stats
driverSchema.methods.updateLiveStats = function(isOnline, location = null) {
  this.liveStats.isOnline = isOnline;
  this.liveStats.lastSeen = new Date();
  
  if (location) {
    this.liveStats.currentLocation = location;
  }
  
  return this.save();
};

// Instance method to increment trip count
driverSchema.methods.incrementTripCount = function(accepted = true) {
  if (accepted) {
    this.totalTripsAccepted += 1;
    this.tripCountToday += 1;
  } else {
    this.totalTripsRejected += 1;
  }
  
  return this.save();
};

// Instance method to update earnings
driverSchema.methods.updateEarnings = function(amount) {
  this.earnings.totalEarnings += amount;
  this.earnings.todayEarnings += amount;
  this.earnings.weeklyEarnings += amount;
  this.earnings.monthlyEarnings += amount;
  
  return this.save();
};

module.exports = mongoose.model('drivers', driverSchema); 