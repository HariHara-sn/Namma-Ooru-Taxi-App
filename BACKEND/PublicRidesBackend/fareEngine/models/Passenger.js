const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
  couponCode: { type: String, required: true },
  usedAt: { type: Date, default: Date.now },
  fareAmount: { type: Number, required: true },
  discountAmount: { type: Number, required: true },
  tripId: { type: String },
  regionCode: { type: String, default: 'default' }
});

const rideGroupSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  name: { type: String },
  members: [{ type: String }], // Array of passenger IDs
  createdAt: { type: Date, default: Date.now }
});

const fcmTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  deviceId: { type: String },
  platform: { type: String, enum: ['android', 'ios', 'web'] },
  isActive: { type: Boolean, default: true },
  lastUsed: { type: Date, default: Date.now }
});

const passengerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdOn: { type: Date, default: Date.now },
  
  // Profile information
  profile: {
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    profilePicture: { type: String },
    isVerified: { type: Boolean, default: false }
  },
  
  // Trip statistics
  stats: {
    totalTrips: { type: Number, default: 0 },
    completedTrips: { type: Number, default: 0 },
    cancelledTrips: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  
  // Membership and loyalty
  membership: {
    level: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
    points: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    lastTripDate: { type: Date }
  },
  
  // Coupon usage tracking
  couponUsage: [couponUsageSchema],
  
  // Ride groups
  rideGroups: [rideGroupSchema],
  
  // FCM tokens for push notifications
  fcmTokens: [fcmTokenSchema],
  
  // Preferences
  preferences: {
    preferredPaymentMethod: { type: String, default: 'cash' },
    language: { type: String, default: 'en' },
    notifications: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  
  // Account status
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  blockReason: { type: String },
  
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for fast lookup
passengerSchema.index({ username: 1 });
passengerSchema.index({ phone: 1 });
passengerSchema.index({ email: 1 });
passengerSchema.index({ 'membership.level': 1 });
passengerSchema.index({ 'stats.totalTrips': -1 });
passengerSchema.index({ isActive: 1 });

// Pre-save middleware to update timestamp
passengerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find passenger by username
passengerSchema.statics.findByUsername = function(username) {
  return this.findOne({ username, isActive: true });
};

// Static method to find passenger by phone
passengerSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone, isActive: true });
};

// Static method to find passenger by email
passengerSchema.statics.findByEmail = function(email) {
  return this.findOne({ email, isActive: true });
};

// Static method to find passenger by ObjectId
passengerSchema.statics.findByObjectId = function(objectId) {
  if (!mongoose.Types.ObjectId.isValid(objectId)) {
    throw new Error('Invalid ObjectId format');
  }
  return this.findOne({ 
    _id: new mongoose.Types.ObjectId(objectId)
  });
};

// Instance method to add coupon usage
passengerSchema.methods.addCouponUsage = function(couponData) {
  this.couponUsage.push(couponData);
  return this.save();
};

// Instance method to check if coupon was used
passengerSchema.methods.hasUsedCoupon = function(couponCode) {
  return this.couponUsage.some(usage => usage.couponCode === couponCode);
};

// Instance method to get coupon usage count
passengerSchema.methods.getCouponUsageCount = function(couponCode) {
  return this.couponUsage.filter(usage => usage.couponCode === couponCode).length;
};

// Instance method to increment trip stats
passengerSchema.methods.incrementTripStats = function(completed = true, fareAmount = 0) {
  this.stats.totalTrips += 1;
  
  if (completed) {
    this.stats.completedTrips += 1;
    this.stats.totalSpent += fareAmount;
    this.membership.lastTripDate = new Date();
  } else {
    this.stats.cancelledTrips += 1;
  }
  
  return this.save();
};

// Instance method to update rating
passengerSchema.methods.updateRating = function(newRating) {
  this.stats.totalRating += newRating;
  this.stats.ratingCount += 1;
  this.stats.averageRating = this.stats.totalRating / this.stats.ratingCount;
  return this.save();
};

// Instance method to add FCM token
passengerSchema.methods.addFcmToken = function(token, deviceId = null, platform = 'android') {
  // Remove existing token if same device
  if (deviceId) {
    this.fcmTokens = this.fcmTokens.filter(t => t.deviceId !== deviceId);
  }
  
  this.fcmTokens.push({
    token,
    deviceId,
    platform,
    lastUsed: new Date()
  });
  
  return this.save();
};

// Instance method to remove FCM token
passengerSchema.methods.removeFcmToken = function(token) {
  this.fcmTokens = this.fcmTokens.filter(t => t.token !== token);
  return this.save();
};

module.exports = mongoose.model('passangers', passengerSchema); 