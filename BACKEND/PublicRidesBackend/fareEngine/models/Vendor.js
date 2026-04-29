const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  // Basic vendor information
  fleetSysId: { type: String, required: false },
  VendorName: { type: String, required: false },
  OwnerName: { type: String, required: false },
  
  // Documents
  documents: {
    aadhar: { type: String, required: false },
    ownerPAN: { type: String, required: false },
    companyPAN: { type: String, required: false },
    cin: { type: String, required: false },
    gst: { type: String, required: false },
    ownerPic: { type: String, required: false },
    ownerProof: { type: String, required: false },
    pan: { type: String, required: false },
    tan: { type: String, required: false }
  },
  
  // Payment information
  UPIId: { type: String, required: false },
  
  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number],
      required: false
    }
  },
  
  // Bank details
  bankDetails: {
    bankName: { type: String, required: false },
    ifsc: { type: String, required: false },
    branch: { type: String, required: false },
    accountHolderName: { type: String, required: false },
    accountNumber: { type: String, required: false }
  },
  
  // Status flags
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  
  // Contact information
  ownerPhone: { type: Number, required: false },
  ownerEmail: { type: String, required: false },
  
  // Address information
  city: { type: String, required: false },
  country: { type: String, required: false },
  fullAddress: { type: String, required: false },
  state: { type: String, required: false },
  
  // Additional fields
  ownerProof: { type: String, required: false },
  gst: { type: String, required: false },
  companyPANNumber: { type: String, required: false },
  
  // Reference to regional office
  regionalOffice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'regionaloffices',
    required: false
  },
  
  // Deletion tracking
  deletedAt: { type: Date, required: false },
  isDeleted: { type: Boolean, default: false },
  
  // Blocking information
  blockExpiry: { type: Date, required: false },
  blockReason: { type: String, required: false },
  blockType: { type: String, required: false },
  
  // Timestamps
  updatedAt: { type: Number, required: false }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'vendors' // Specify collection name
});

// Indexes for better query performance
vendorSchema.index({ fleetSysId: 1 });
vendorSchema.index({ VendorName: 1 });
vendorSchema.index({ isActive: 1 });
vendorSchema.index({ isApproved: 1 });
vendorSchema.index({ isBlocked: 1 });
vendorSchema.index({ isDeleted: 1 });
vendorSchema.index({ location: '2dsphere' }); // For geospatial queries
vendorSchema.index({ regionalOffice: 1 });

// Pre-save middleware to update timestamp
vendorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get active vendors
vendorSchema.statics.getActiveVendors = function() {
  return this.find({ 
    isActive: true, 
    isApproved: true, 
    isBlocked: false, 
    isDeleted: false 
  });
};

// Static method to get vendors by region
vendorSchema.statics.getVendorsByRegion = function(regionalOfficeId) {
  return this.find({ 
    regionalOffice: regionalOfficeId,
    isActive: true, 
    isApproved: true, 
    isBlocked: false, 
    isDeleted: false 
  });
};

// Instance method to soft delete vendor
vendorSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Instance method to block vendor
vendorSchema.methods.blockVendor = function(reason, blockType, expiryDate = null) {
  this.isBlocked = true;
  this.blockReason = reason;
  this.blockType = blockType;
  this.blockExpiry = expiryDate;
  return this.save();
};

// Instance method to unblock vendor
vendorSchema.methods.unblockVendor = function() {
  this.isBlocked = false;
  this.blockReason = null;
  this.blockType = null;
  this.blockExpiry = null;
  return this.save();
};

// Instance method to approve vendor
vendorSchema.methods.approveVendor = function() {
  this.isApproved = true;
  return this.save();
};

// Instance method to get vendor status
vendorSchema.methods.getStatus = function() {
  if (this.isDeleted) return 'deleted';
  if (this.isBlocked) return 'blocked';
  if (!this.isApproved) return 'pending_approval';
  if (!this.isActive) return 'inactive';
  return 'active';
};

module.exports = mongoose.model('vendors', vendorSchema);
