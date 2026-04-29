const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  driverId: { type: String, required: false },
  vehicleId: { type: String, required: false },
  userId: { type: String, required: true },
  passangers: [{ type: String }], // Array of passenger IDs
  coupons: [{ type: String }], // Array of applied coupon codes
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'started', 'completed', 'cancelled','PENDING','ACCEPTED','STARTED','COMPLETED','CANCELLED'],
    default: 'pending'
  },
  pickup: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  destination: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  distance: { type: Number },
  duration: { type: Number },
  waitTime: { type: Number, default: 0 },
  fare: { type: Number },
  zone: { type: String, default: 'all' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  fareAdjustment: { type: Number, default: 0 },
  regionalOffice: { type: String, default: null },
  vendorId: { type: String, default: null },
  regionCode: { type: String, default: null }
});

// Indexes for fast lookup
tripSchema.index({ driverId: 1 });
tripSchema.index({ userId: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ createdAt: -1 });

// Pre-save middleware to update timestamp
tripSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find trip by ID
tripSchema.statics.findByTripId = function(tripId) {
  return this.findById(tripId);
};

// Static method to find trips by driver
tripSchema.statics.findByDriverId = function(driverId) {
  return this.find({ driverId });
};

// Static method to find trips by user
tripSchema.statics.findByUserId = function(userId) {
  return this.find({ userId });
};

// Static method to find active trips
tripSchema.statics.findActiveTrips = function() {
  return this.find({ 
    status: { $in: ['pending', 'accepted', 'started','PENDING','ACCEPTED','STARTED'] }
  });
};

// Instance method to update trip status
tripSchema.methods.updateStatus = function(status) {
  this.status = status;
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to update trip details
tripSchema.methods.updateTripDetails = function(details) {
  Object.assign(this, details);
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to add coupon to trip
tripSchema.methods.addCoupon = function(couponCode) {
  if (!this.coupons.includes(couponCode)) {
    this.coupons.push(couponCode);
  }
  return this.save();
};

// Instance method to remove coupon from trip
tripSchema.methods.removeCoupon = function(couponCode) {
  this.coupons = this.coupons.filter(code => code !== couponCode);
  return this.save();
};

// Instance method to get applied coupons
tripSchema.methods.getAppliedCoupons = function() {
  return this.coupons;
};

module.exports = mongoose.model('trips', tripSchema); 