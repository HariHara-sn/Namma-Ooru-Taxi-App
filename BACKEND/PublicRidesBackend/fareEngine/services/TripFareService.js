const FareCalculatorService = require('./FareCalculatorService');
const mongoose = require('mongoose');

// Default collection mappings
let collectionMappings = {
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
  passenger: {
    id: '_id',
    userId: 'userId'
  },
  trip: {
    id: '_id',
    driverId: 'driverId',
    vehicleId: 'vehicleId',
    userId: 'userId',
    passengers: 'passangers',
    fareAdjustment: 'fareAdjustment'
  }
};

class TripFareService {
  constructor() {
    this.fareCalculator = FareCalculatorService;
    this.collectionMappings = collectionMappings;
  }

  /**
   * Update collection mappings
   * @param {Object} mappings - New collection mappings
   */
  updateMappings(mappings) {
    collectionMappings = { ...collectionMappings, ...mappings };
    this.collectionMappings = collectionMappings;
  }

  /**
   * Calculate fare using tripId
   * @param {Object} params
   * @param {string} params.tripId - Trip ID
   * @param {number} params.distance - Distance in km
   * @param {number} params.duration - Duration in minutes
   * @param {number} params.waitTime - Wait time in minutes (optional)
   * @param {string} params.zone - Zone type
   * @param {string} params.regionCode - Region code
   * @param {boolean} params.updateCouponUsage - Whether to update passenger coupon usage (default: true for final fare)
   * @returns {Object} Complete fare breakdown
   */
  async calculateFareFromTrip({ tripId, distance, duration, waitTime = 0, zone = 'all', regionCode = 'default', updateCouponUsage = true,finalFare = true,cusdriverId = null,fareAdjustment=0 }) {
    try {
      // Get trip data
      const trip = await this._getTripData(tripId);
      if (!trip) {
        return {
          success: false,
          error: 'Trip not found',
          tripId
        };
      }
      let driverId;
      console.log('finalFare ', finalFare, cusdriverId);
      if(finalFare == false && cusdriverId != null){
        driverId = cusdriverId;
      }else{
        driverId = trip[this.collectionMappings.trip.driverId];
      } 
      if(driverId == null){
        return {
          success: false,
          error: 'Driver ID is required',
          tripId
        };
      }
      // Get driver data
      const driver = await this._getDriverData(driverId);
      if (!driver) {
        return {
          success: false,
          error: 'Driver not found',
          driverId: driverId
        };
      }

      console.log('trip[this.collectionMappings.trip.vehicleId] ', trip[this.collectionMappings.trip.vehicleId]);
      console.log('driver[this.collectionMappings.driver.vehicleId] ', driver[this.collectionMappings.driver.vehicleId]);
      // Get vehicle data
      const vehicle = await this._getVehicleData(driver[this.collectionMappings.driver.vehicleId] ? driver[this.collectionMappings.driver.vehicleId] : trip[this.collectionMappings.trip.vehicleId]);
      if (!vehicle) {
        return {
          success: false,
          error: 'Vehicle not found',
          vehicleId: trip[this.collectionMappings.trip.vehicleId]
        };
      }

      // Get fare configuration
      const FareConfig = require('../models/FareConfig');
      const config = await FareConfig.getActiveConfig(regionCode);

      // Prepare driver metadata
      const driverMeta = this._prepareDriverMeta(driver, vehicle);

      // Get primary passenger (first passenger in the trip)
      const primaryPassengerId = this._getPrimaryPassengerId(trip);

      // Get applied coupons from trip
      const appliedCoupons = trip.getAppliedCoupons();

      let adjustment = 0
      if(finalFare == true){
        adjustment = parseFloat(trip[this.collectionMappings.trip.fareAdjustment]) || 0;
      }else{
        adjustment = parseFloat(fareAdjustment);
      }
      console.log(adjustment,"fareAdjustment1");
      // Calculate fare
      const result = await this.fareCalculator.calculateFare({
        distance,
        duration,
        waitTime,
        config,
        driverMeta,
        coupons: appliedCoupons,
        zone,
        userId: primaryPassengerId,
        vehicleType: vehicle[this.collectionMappings.vehicle.type],
        adjustment: adjustment
      });

      // Update passenger coupon usage if this is a final fare calculation and coupons were applied
      if (updateCouponUsage && appliedCoupons.length > 0 && result.success) {
        await this._updatePassengerCouponUsage(primaryPassengerId, appliedCoupons, result.fare, regionCode);
      }

      // Add trip context to result
      return {
        ...result,
        tripId,
        driverId: driverId,
        vehicleId: trip[this.collectionMappings.trip.vehicleId],
        primaryPassengerId
      };

    } catch (error) {
      console.error('Error calculating fare from trip:', error);
      return {
        success: false,
        error: error.message,
        tripId
      };
    }
  }

  /**
   * Calculate pre-final fare using tripId
   * @param {Object} params
   * @param {string} params.tripId - Trip ID
   * @param {number} params.distance - Distance in km
   * @param {number} params.duration - Duration in minutes
   * @param {string} params.zone - Zone type
   * @param {string} params.regionCode - Region code
   * @returns {Object} Pre-final fare breakdown
   */
  async calculatePreFinalFareFromTrip({ tripId, distance, duration, zone = 'all', regionCode = 'default', waitTime = 0,driverId = null,fareAdjustment = 0 }) {
    console.log('calculatePreFinalFareFromTrip', tripId, distance, duration, zone, regionCode, waitTime,driverId);
    return this.calculateFareFromTrip({
      tripId,
      distance,
      duration,
      waitTime, // No wait time for pre-final estimate
      zone,
      regionCode,
      updateCouponUsage: false, // Don't update coupon usage for pre-final estimates
      finalFare: false,
      cusdriverId: driverId,
      fareAdjustment: fareAdjustment
    });
  }

  /**
   * Get trip data from database
   * @private
   */
  async _getTripData(tripId) {
    try {
      // Dynamically get trip collection based on mappings
      const Trip =  mongoose.model('trips');
      let queryId = tripId;
      // If tripId is a string and is a valid ObjectId, convert to ObjectId
      if (typeof tripId === 'string' && /^[a-fA-F0-9]{24}$/.test(tripId)) {
        queryId = new mongoose.Types.ObjectId(tripId);
      }
      return await Trip.findById(queryId);
    } catch (error) {
      console.error('Error getting trip data:', error);
      return null;
    }
  }

  /**
   * Get driver data from database
   * @private
   */
  async _getDriverData(driverId) {
    try {
      const Driver = require('../models/Driver');
      return await Driver.findByDriverId(driverId);
    } catch (error) {
      console.error('Error getting driver data:', error);
      return null;
    }
  }

  /**
   * Get vehicle data from database
   * @private
   */
  async _getVehicleData(vehicleId) {
    try {
      const Vehicle = require('../models/Vehicle');
      return await Vehicle.findByVehicleId(vehicleId);
    } catch (error) {
      console.error('Error getting vehicle data:', error);
      return null;
    }
  }

  /**
   * Prepare driver metadata using collection mappings
   * @private
   */
  _prepareDriverMeta(driver, vehicle) {
    const mappings = this.collectionMappings.driver;
    
    return {
      rating: driver[mappings.rating]?.toString() || "0",
      tripCountToday: driver[mappings.tripCountToday] || 0,
      totalTripsAccepted: driver[mappings.totalTripsAccepted] || 0,
      totalTripsRejected: driver[mappings.totalTripsRejected] || 0,
      isTrusted: driver[mappings.isTrusted] || false,
      liveStats: driver[mappings.liveStats] || { isOnline: false },
      vehicleType: vehicle[this.collectionMappings.vehicle.type] || 'SEDAN'
    };
  }

  /**
   * Get primary passenger ID from trip
   * @private
   */
  _getPrimaryPassengerId(trip) {
    const mappings = this.collectionMappings.trip;
    
    // Try to get from userId field first
    if (trip[mappings.userId]) {
      return trip[mappings.userId];
    }
    
    // Try to get from passengers array
    if (trip[mappings.passengers] && trip[mappings.passengers].length > 0) {
      const firstPassenger = trip[mappings.passengers][0];
      return typeof firstPassenger === 'object' ? firstPassenger._id : firstPassenger;
    }
    
    return null;
  }

  /**
   * Get all passenger IDs from trip
   * @param {string} tripId - Trip ID
   * @returns {Array} Array of passenger IDs
   */
  async getAllPassengerIds(tripId) {
    try {
      const trip = await this._getTripData(tripId);
      if (!trip) return [];

      const mappings = this.collectionMappings.trip;
      const passengers = [];

      // Add primary user
      if (trip[mappings.userId]) {
        passengers.push(trip[mappings.userId]);
      }

      // Add additional passengers
      if (trip[mappings.passengers]) {
        trip[mappings.passengers].forEach(passenger => {
          const passengerId = typeof passenger === 'object' ? passenger._id : passenger;
          if (passengerId && !passengers.includes(passengerId)) {
            passengers.push(passengerId);
          }
        });
      }

      return passengers;
    } catch (error) {
      console.error('Error getting passenger IDs:', error);
      return [];
    }
  }

  /**
   * Calculate fare for multiple passengers in a trip
   * @param {Object} params
   * @param {string} params.tripId - Trip ID
   * @param {number} params.distance - Distance in km
   * @param {number} params.duration - Duration in minutes
   * @param {number} params.waitTime - Wait time in minutes
   * @param {string} params.zone - Zone type
   * @param {string} params.regionCode - Region code
   * @returns {Object} Fare breakdown for all passengers
   */
  async calculateMultiPassengerFare({ tripId, distance, duration, waitTime = 0, zone = 'all', regionCode = 'default' }) {
    try {
      const passengerIds = await this.getAllPassengerIds(tripId);
      const results = {};

      // Calculate fare for each passenger
      for (const passengerId of passengerIds) {
        const result = await this.calculateFareFromTrip({
          tripId,
          distance,
          duration,
          waitTime,
          zone,
          regionCode
        });

        results[passengerId] = result;
      }

      return {
        success: true,
        tripId,
        passengerCount: passengerIds.length,
        results
      };

    } catch (error) {
      console.error('Error calculating multi-passenger fare:', error);
      return {
        success: false,
        error: error.message,
        tripId
      };
    }
  }

  /**
   * Update passenger coupon usage after successful trip completion
   * @private
   */
  async _updatePassengerCouponUsage(passengerId, appliedCoupons, finalFare, regionCode) {
    try {
      const Passenger = require('../models/Passenger');
      const PromoService = require('./PromoService');
      const FareConfig = require('../models/FareConfig');
      
      // Get fare configuration to calculate individual coupon discounts
      const config = await FareConfig.getActiveConfig(regionCode);
      
      // Find passenger
      let passenger;
      if (mongoose.Types.ObjectId.isValid(passengerId)) {
        passenger = await Passenger.findByObjectId(passengerId);
      } else {
        passenger = await Passenger.findByUsername(passengerId) || 
                   await Passenger.findByPhone(passengerId) || 
                   await Passenger.findByEmail(passengerId);
      }
      
      if (!passenger) {
        console.warn(`Passenger not found for ID: ${passengerId}`);
        return;
      }
      
      // Update usage for each applied coupon
      for (const couponCode of appliedCoupons) {
        // Calculate the discount for this specific coupon
        const couponResult = await PromoService.applyCoupon({
          code: couponCode,
          fare: finalFare,
          config,
          userId: passengerId,
          trackUsage: true // This will update the passenger's coupon usage
        });
        
        if (couponResult.success) {
          console.log(`Updated coupon usage for ${couponCode} for passenger ${passengerId}`);
        }
      }
      
    } catch (error) {
      console.error('Error updating passenger coupon usage:', error);
    }
  }

  /**
   * Validate trip-based fare calculation parameters
   * @param {Object} params - Calculation parameters
   * @returns {Object} Validation result
   */
  validateTripParameters(params) {
    const errors = [];

    if (!params.tripId) {
      errors.push('Trip ID is required');
    }

    if (!params.distance || params.distance <= 0) {
      errors.push('Distance must be positive');
    }

    if (!params.duration || params.duration <= 0) {
      errors.push('Duration must be positive');
    }

    if (params.waitTime && params.waitTime < 0) {
      errors.push('Wait time cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new TripFareService(); 