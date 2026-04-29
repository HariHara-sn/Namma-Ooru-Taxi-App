const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  driverId: { type: String, required: true },
  fuel: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid'], default: 'petrol' },
  make: { type: String, required: true },
  model: { type: String, required: true },
  type: { 
    type: String, 
    required: true 
  },
  year: { type: String },
  ownerId: { type: String, default: '' },
  available: { type: Boolean, default: true },
  color: { type: String },
  regNo: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for fast lookup
vehicleSchema.index({ driverId: 1 });
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ available: 1 });
vehicleSchema.index({ regNo: 1 });

// Pre-save middleware to update timestamp
vehicleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find vehicle by ID
vehicleSchema.statics.findByVehicleId = function(vehicleId) {
  if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
    throw new Error('Invalid ObjectId format');
  }
  return this.findOne({ _id: new mongoose.Types.ObjectId(vehicleId) });
};

// Static method to find vehicles by driver ID
vehicleSchema.statics.findByDriverId = function(driverId) {
  return this.find({ driverId });
};

// Static method to find available vehicles by type
vehicleSchema.statics.findAvailableByType = function(vehicleType) {
  return this.find({ 
    type: vehicleType,
    available: true 
  });
};

// Instance method to update availability
vehicleSchema.methods.updateAvailability = function(available) {
  this.available = available;
  return this.save();
};

module.exports = mongoose.model('vehicles', vehicleSchema); 