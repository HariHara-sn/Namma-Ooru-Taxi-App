const mongoose = require('mongoose');

const rangePricingSchema = new mongoose.Schema({
  minDistance: { type: Number, required: true },
  maxDistance: { type: Number, default: null },
  type: { type: String, enum: ['km', 'fixed'], required: true },
  value: { type: Number, required: true }
});

// Fee with tax schema
const feeWithTaxSchema = new mongoose.Schema({
  type: { type: String, enum: ['percentage', 'fixed', 'multiplier'], required: true },
  value: { type: Number, required: true },
  tax: {
    type: Map,
    of: {
      type: { type: String, enum: ['percentage', 'fixed'], required: true },
      value: { type: Number, required: true }
    }
  }
});

const vehicleTypeSchema = new mongoose.Schema({
  baseFare: { type: Number, required: true },
  timeCostPerMin: { type: Number, required: true },
  waitTimeCostPerMin: { type: Number, required: true },
  rangePricing: [rangePricingSchema],
  minFare: { type: Number, required: true },
  maxFare: { type: Number, required: true },
  // Vehicle-specific fees
  fees: {
    type: Map,
    of: {
      type: { type: String, enum: ['percentage', 'fixed'], required: true },
      value: { type: Number, required: true }
    }
  },
  // Vehicle-specific taxes
  taxes: {
    type: Map,
    of: {
      type: { type: String, enum: ['percentage', 'fixed'], required: true },
      value: { type: Number, required: true }
    }
  },
  // Vehicle-specific fees with tax
  feeWithTax: {
    type: Map,
    of: feeWithTaxSchema
  }
});

const timeRangeSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, required: true }
});

const surgeMultiplierSchema = new mongoose.Schema({
  timeRange: timeRangeSchema,
  days: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
  type: { type: String, enum: ['multiplier', 'fixed'], default: 'multiplier' },
  multiplier: { type: Number, default: 1.0 }, // For multiplier type
  value: { type: Number, default: 0 }, // For fixed type
  zones: [{ type: String }]
});

const surgeSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  multipliers: [surgeMultiplierSchema]
});

// Legacy fee schema for backward compatibility
const feeSchema = new mongoose.Schema({
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true }
});

// Legacy fees schema for backward compatibility
const feesSchema = new mongoose.Schema({
  platformFee: feeSchema,
  gst: feeSchema,
  convenienceFee: feeSchema
});

// New dynamic fees schema that supports any field names
const dynamicFeesSchema = new mongoose.Schema({
  type: Map,
  of: {
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true }
  }
});

// New dynamic taxes schema that supports any field names
const dynamicTaxesSchema = new mongoose.Schema({
  type: Map,
  of: {
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true }
  }
});

// Dynamic fee with tax schema that supports any field names
const dynamicFeeWithTaxSchema = new mongoose.Schema({
  type: Map,
  of: feeWithTaxSchema
});

const discountRuleSchema = new mongoose.Schema({
  code: { type: String, required: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },
  maxDiscount: { type: Number, default: null },
  minFare: { type: Number, default: 0 },
  usageLimit: { type: Number, default: null },
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true }
});

const dynamicCouponRuleSchema = new mongoose.Schema({
  code: { type: String, required: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },
  maxDiscount: { type: Number, default: null },
  minFare: { type: Number, default: 0 },
  usageLimit: { type: Number, default: null },
  passengerField: { type: String, required: true },
  condition: { type: String, required: true },
  description: { type: String, required: true },
  validFrom: { type: Date, default: null },
  validTo: { type: Date, default: null }
});

const incentiveSchema = new mongoose.Schema({
  type: { type: String, required: true },
  condition: { type: String, required: true },
  bonus: { type: Number, default: 0 },
  penalty: { type: Number, default: 0 }
});

const incentivesSchema = new mongoose.Schema({
  driverIncentives: [incentiveSchema],
  driverPenalties: [incentiveSchema]
});

const cancellationFeeSchema = new mongoose.Schema({
  timeWindow: { type: Number, default: null },
  fee: { type: Number, required: true }
});

const cancellationPolicySchema = new mongoose.Schema({
  freeCancellationWindow: { type: Number, default: 2 },
  cancellationFees: [cancellationFeeSchema]
});

const roundingRulesSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  roundTo: { type: Number, default: 5 },
  // New rounding strategy options
  strategy: { 
    type: String, 
    enum: ['nearest', 'up', 'down', 'decimal', 'ceil'], 
    default: 'nearest' 
  },
  // For decimal rounding: number of decimal places
  decimalPlaces: { type: Number, default: 2, min: 0, max: 4 },
  // For nearest rounding: round to nearest value (e.g., 5, 10, 25, 50, 100)
  nearestValue: { type: Number, default: 5 },
  // Minimum fare threshold for rounding (optional)
  minFareThreshold: { type: Number, default: 0 }
});

const zoneSchema = new mongoose.Schema({
  type: { type: String, enum: ['multiplier', 'fixed'], default: 'multiplier' },
  value: { type: Number, required: true },
  multiplier: { type: Number, default: 1.0 }, // Legacy support
  baseFare: { type: Number, required: true }
});

const zonesSchema = new mongoose.Schema({
  business: zoneSchema,
  airport: zoneSchema,
  residential: zoneSchema,
  all: zoneSchema
});

const fareConfigSchema = new mongoose.Schema({
  regionCode: { type: String, required: true, unique: true },
  currency: { type: String, default: 'INR' },
  // Legacy fields for backward compatibility (optional now)
  // baseFare: { type: Number, default: 0 },
  // timeCostPerMin: { type: Number, default: 0 },
  // waitTimeCostPerMin: { type: Number, default: 0 },
  // rangePricing: [rangePricingSchema],
  // minFare: { type: Number, default: 0 },
  // maxFare: { type: Number, default: 0 },
  // New dynamic vehicle type specific pricing - can store any vehicle type
  vehicleTypes: {
    type: Map,
    of: vehicleTypeSchema
  },
  surge: surgeSchema,
  // Legacy fees for backward compatibility
  fees: feesSchema,
  // New dynamic fees that can have any field names
  dynamicFees: dynamicFeesSchema,
  // New dynamic taxes that can have any field names
  dynamicTaxes: dynamicTaxesSchema,
  // New dynamic fees with tax that can have any field names
  feeWithTax: dynamicFeeWithTaxSchema,
  discountRules: [discountRuleSchema], // Legacy support
  dynamicCouponRules: [dynamicCouponRuleSchema],
  incentives: incentivesSchema,
  cancellationPolicy: cancellationPolicySchema,
  roundingRules: roundingRulesSchema,
  zones: zonesSchema,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for fast lookup
fareConfigSchema.index({ regionCode: 1 });
fareConfigSchema.index({ isActive: 1 });

// Pre-save middleware to update timestamp
fareConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get active config by region
fareConfigSchema.statics.getActiveConfig = function(regionCode) {
  return this.findOne({ regionCode, isActive: true });
};

// Instance method to validate config
fareConfigSchema.methods.validateConfig = function() {
  const errors = [];
  
  // Validate vehicle types configuration
  if (!this.vehicleTypes || Object.keys(this.vehicleTypes).length === 0) {
    errors.push('At least one vehicle type must be configured');
  }
  
  // Validate each vehicle type
  if (this.vehicleTypes) {
    for (const [vehicleType, config] of Object.entries(this.vehicleTypes)) {
      if (!config) continue;
      
      if (config.minFare >= config.maxFare) {
        errors.push(`${vehicleType}: minFare must be less than maxFare`);
      }
      
      if (config.baseFare < 0) {
        errors.push(`${vehicleType}: baseFare must be positive`);
      }
      
      if (config.timeCostPerMin < 0) {
        errors.push(`${vehicleType}: timeCostPerMin must be positive`);
      }
      
      if (!config.rangePricing || config.rangePricing.length === 0) {
        errors.push(`${vehicleType}: rangePricing must be configured`);
      }
    }
  }
  
  return errors;
};

module.exports = mongoose.model('fareconfigs', fareConfigSchema); 