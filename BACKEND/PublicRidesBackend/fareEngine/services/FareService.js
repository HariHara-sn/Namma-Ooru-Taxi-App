const FareCalculatorService = require("./FareCalculatorService");
const TripFareService = require("./TripFareService");
const CouponVerificationService = require("./CouponVerificationService");
const DynamicCouponService = require("./DynamicCouponService");
const FareConfig = require("../models/FareConfig");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const Trip = require("../models/Trip");
const PromoService = require("./PromoService");
const IncentiveService = require("./IncentiveService");
const SurgeService = require("./SurgeService");
const CancellationService = require("./CancellationService");
const Invoice = require("./Invoice");
const mongoose = require("mongoose");

class FareService {
  constructor() {
    this.fareCalculator = FareCalculatorService;
    this.tripFareService = TripFareService;
    this.couponVerificationService = CouponVerificationService;
    this.dynamicCouponService = DynamicCouponService;
    this.promoService = PromoService;
    this.incentiveService = IncentiveService;
    this.surgeService = SurgeService;
    this.cancellationService = CancellationService;
    this.invoice = Invoice;
  }

  /**
   * Get fare range for all vehicle types or specific vehicle type
   * @param {Object} params
   * @param {number} params.distance - Distance in km
   * @param {number} params.duration - Duration in minutes
   * @param {string} params.zone - Zone type
   * @param {string} params.vehicleType - Vehicle type or 'ALL'
   * @param {string} params.regionCode - Region code
   * @returns {Object} Fare range data
   */
  async getFareRange({
    distance,
    duration,
    zone = "all",
    vehicleType = "ALL",
    regionCode = "default",
    waitTime = 0,
  }) {
    try {
      vehicleType =
        typeof vehicleType === "string"
          ? vehicleType.toUpperCase()
          : vehicleType;
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      // If vehicleType is 'ALL', return ranges for all vehicle types
      if (vehicleType === "ALL") {
        const availableVehicleTypes =
          this.fareCalculator.getAvailableVehicleTypes(config);
        const fareRanges = {};

        // Calculate fare range for each vehicle type
        for (const type of availableVehicleTypes) {
          const fareRange = await this.fareCalculator.estimateFareRange({
            distance,
            duration,
            config,
            zone,
            vehicleType: type,
            waitTime,
          });
          fareRanges[type] = fareRange;
        }

        return {
          success: true,
          data: {
            distance,
            duration,
            zone,
            currency: config.currency,
            fareRanges,
            vehicleTypes: availableVehicleTypes,
          },
        };
      } else {
        // Validate that the specific vehicle type exists in database configuration
        const availableVehicleTypes =
          this.fareCalculator.getAvailableVehicleTypes(config);
        if (!availableVehicleTypes.includes(vehicleType)) {
          return {
            success: false,
            error: `Vehicle type '${vehicleType}' is not configured in the fare system. Available types: ${availableVehicleTypes.join(", ")}`,
          };
        }

        // Return fare range for specific vehicle type
        const fareRange = await this.fareCalculator.estimateFareRange({
          distance,
          duration,
          config,
          zone,
          vehicleType,
        });

        return {
          success: true,
          data: fareRange,
        };
      }
    } catch (error) {
      console.error("Fare range calculation error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Calculate pre-final fare (estimate before trip starts)
   * @param {Object} params
   * @param {number} params.distance - Distance in km
   * @param {number} params.duration - Duration in minutes
   * @param {string} params.zone - Zone type
   * @param {string} params.regionCode - Region code
   * @param {string} params.driverId - Driver ID
   * @param {Array} params.coupons - Array of coupon codes
   * @param {string} params.userId - User ID
   * @returns {Object} Pre-final fare result
   */
  async calculatePreFinalFare({
    distance,
    duration,
    zone = "all",
    regionCode = "default",
    driverId,
    coupons = [],
    userId = null,
    waitTime = 0,
  }) {
    try {
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      // Get driver metadata
      let driver;
      if (mongoose.Types.ObjectId.isValid(driverId)) {
        driver = await Driver.findByObjectId(driverId);
      } else {
        driver = await Driver.findByDriverId(driverId);
      }

      if (!driver) {
        return {
          success: false,
          error: "Driver not found",
        };
      }

      // Fetch vehicle information
      let vehicle = null;
      if (driver.vehicleId) {
        try {
          vehicle = await Vehicle.findByVehicleId(driver.vehicleId);
        } catch (error) {
          console.error("Error fetching vehicle data:", error);
        }
      }

      const driverMeta = {
        rating: driver.rating.toString(),
        tripCountToday: driver.tripCountToday,
        totalTripsAccepted: driver.totalTripsAccepted,
        totalTripsRejected: driver.totalTripsRejected,
        isTrusted: driver.isTrusted,
        liveStats: driver.liveStats,
        vehicleType: vehicle ? vehicle.type : "SEDAN",
      };

      // Validate vehicle type exists in database configuration
      const availableVehicleTypes =
        this.fareCalculator.getAvailableVehicleTypes(config);
      if (!availableVehicleTypes.includes(driverMeta.vehicleType)) {
        return {
          success: false,
          error: `Vehicle type '${driverMeta.vehicleType}' is not configured in the fare system. Available types: ${availableVehicleTypes.join(", ")}`,
        };
      }

      // Calculate pre-final fare (without wait time)
      const result = await this.fareCalculator.calculateFare({
        distance,
        duration,
        waitTime, // No wait time for pre-final estimate
        config,
        driverMeta,
        coupons,
        zone,
        userId,
        vehicleType: driverMeta.vehicleType,
      });

      if (!result.success) {
        return result;
      }

      return {
        success: true,
        data: {
          ...result,
          estimateType: "pre-final",
          note: "This is an estimate before trip starts. Final fare may vary based on actual wait time and conditions.",
        },
      };
    } catch (error) {
      console.error("Pre-final fare calculation error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Calculate final fare (after trip completion)
   * @param {Object} params
   * @param {number} params.distance - Distance in km
   * @param {number} params.duration - Duration in minutes
   * @param {number} params.waitTime - Wait time in minutes
   * @param {string} params.zone - Zone type
   * @param {string} params.regionCode - Region code
   * @param {string} params.driverId - Driver ID
   * @param {Array} params.coupons - Array of coupon codes
   * @param {string} params.userId - User ID
   * @returns {Object} Final fare result
   */
  async calculateFinalFare({
    distance,
    duration,
    waitTime = 0,
    zone = "all",
    regionCode = "default",
    driverId,
    coupons = [],
    userId = null,
  }) {
    try {
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      // Get driver metadata if driverId provided
      let driverMeta = null;
      if (driverId) {
        try {
          // Handle both ObjectId and string driverId formats
          let driver;
          if (mongoose.Types.ObjectId.isValid(driverId)) {
            driver = await Driver.findByObjectId(driverId);
          } else {
            driver = await Driver.findByDriverId(driverId);
          }

          if (!driver) {
            return {
              success: false,
              error: "Driver not found",
            };
          }

          // Fetch vehicle information
          let vehicle = null;
          if (driver.vehicleId) {
            try {
              vehicle = await Vehicle.findByVehicleId(driver.vehicleId);
            } catch (error) {
              console.error("Error fetching vehicle data:", error);
            }
          }

          driverMeta = {
            rating: driver.rating.toString(),
            tripCountToday: driver.tripCountToday,
            totalTripsAccepted: driver.totalTripsAccepted,
            totalTripsRejected: driver.totalTripsRejected,
            isTrusted: driver.isTrusted,
            liveStats: driver.liveStats,
            vehicleType: vehicle ? vehicle.type : "SEDAN",
          };

          // Validate vehicle type exists in database configuration
          const availableVehicleTypes =
            this.fareCalculator.getAvailableVehicleTypes(config);
          if (!availableVehicleTypes.includes(driverMeta.vehicleType)) {
            return {
              success: false,
              error: `Vehicle type '${driverMeta.vehicleType}' is not configured in the fare system. Available types: ${availableVehicleTypes.join(", ")}`,
            };
          }
        } catch (error) {
          console.error("Error fetching driver data:", error);
          return {
            success: false,
            error: "Failed to fetch driver data",
          };
        }
      }

      const result = await this.fareCalculator.calculateFare({
        distance,
        duration,
        waitTime,
        config,
        driverMeta,
        coupons,
        zone,
        userId,
        vehicleType: driverMeta ? driverMeta.vehicleType : "SEDAN",
      });

      if (!result.success) {
        return result;
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Final fare calculation error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Calculate final fare (after trip completion)
   * @param {Object} params
   * @param {number} params.distance - Distance in km
   * @param {number} params.duration - Duration in minutes
   * @param {number} params.waitTime - Wait time in minutes
   * @param {string} params.zone - Zone type
   * @param {string} params.regionCode - Region code
   * @param {string} params.TripId - Driver ID
   * @returns {Object} Final fare result
   */
  async calculateFinalFareFromTrip({
    distance,
    duration,
    waitTime = 0,
    zone = "all",
    tripId,
  }) {
    try {
      // Get fare configuration

      // Get driver metadata if driverId provided
      const trip = await Trip.findByTripId(tripId);
      if (!trip) {
        return {
          success: false,
          error: "Trip not found",
        };
      }
      const driverId = trip.driverId;
      const userId = trip.userId;
      const regionCode = trip.regionCode || "default";
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      let driverMeta = null;
      // let driverRole = null;
      if (driverId) {
        try {
          // Handle both ObjectId and string driverId formats
          let driver;
          if (mongoose.Types.ObjectId.isValid(driverId)) {
            driver = await Driver.findByObjectId(driverId);
          } else {
            driver = await Driver.findByDriverId(driverId);
          }

          if (!driver) {
            return {
              success: false,
              error: "Driver not found",
            };
          }

          // Fetch vehicle information
          let vehicle = null;
          if (driver.vehicleId) {
            try {
              vehicle = await Vehicle.findByVehicleId(driver.vehicleId);
            } catch (error) {
              console.error("Error fetching vehicle data:", error);
            }
          }
          // driverRole = driver.role;
          driverMeta = {
            rating: driver.rating.toString(),
            tripCountToday: driver.tripCountToday,
            totalTripsAccepted: driver.totalTripsAccepted,
            totalTripsRejected: driver.totalTripsRejected,
            isTrusted: driver.isTrusted,
            liveStats: driver.liveStats,
            vehicleType: vehicle ? vehicle.type : "SEDAN",
          };

          // Validate vehicle type exists in database configuration
          const availableVehicleTypes =
            this.fareCalculator.getAvailableVehicleTypes(config);
          if (!availableVehicleTypes.includes(driverMeta.vehicleType)) {
            return {
              success: false,
              error: `Vehicle type '${driverMeta.vehicleType}' is not configured in the fare system. Available types: ${availableVehicleTypes.join(", ")}`,
            };
          }
        } catch (error) {
          console.error("Error fetching driver data:", error);
          return {
            success: false,
            error: "Failed to fetch driver data",
          };
        }
      }
      let coupons = trip.coupons || [];
      let adjustment = trip.fareAdjustment || 0;
      const result = await this.fareCalculator.calculateFare({
        distance,
        duration,
        waitTime,
        config,
        driverMeta,
        coupons,
        zone,
        userId,
        vehicleType: driverMeta ? driverMeta.vehicleType : "SEDAN",
        adjustment,
      });

      if (!result.success) {
        return result;
      }
      const invoice = await this.invoice.generateInvoice(
        result,
        trip,
        driverId,
        userId,
      );
      // const invoice = await this.invoice.generateInvoice(result,trip,driverId,userId,driverRole);
      if (!invoice) {
        return {
          success: false,
          error: "Invoice generation failed",
        };
      }

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      console.error("Final fare calculation error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Apply coupon to fare
   * @param {Object} params
   * @param {number} params.fare - Base fare
   * @param {string} params.couponCode - Coupon code
   * @param {string} params.regionCode - Region code
   * @param {string} params.userId - User ID
   * @returns {Object} Coupon application result
   */
  async applyCoupon({ fare, couponCode, regionCode = "default", userId }) {
    try {
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      const result = await this.fareCalculator.calculateFareWithCoupon({
        fare,
        couponCode,
        config,
        userId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Coupon application error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Get available coupons for user
   * @param {Object} params
   * @param {number} params.fare - Base fare
   * @param {string} params.regionCode - Region code
   * @param {string} params.userId - User ID
   * @returns {Object} Available coupons result
   */
  async getAvailableCoupons({ fare, regionCode = "default", userId }) {
    try {
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      const coupons = await this.fareCalculator.getAvailableCoupons({
        fare,
        config,
        userId,
      });

      return {
        success: true,
        data: coupons,
      };
    } catch (error) {
      console.error("Available coupons error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Get driver incentives
   * @param {Object} params
   * @param {string} params.driverId - Driver ID
   * @param {string} params.regionCode - Region code
   * @returns {Object} Driver incentives result
   */
  async getDriverIncentives({ driverId, regionCode = "default" }) {
    try {
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      // Fetch driver data from MongoDB
      let driver;
      if (mongoose.Types.ObjectId.isValid(driverId)) {
        driver = await Driver.findByObjectId(driverId);
      } else {
        driver = await Driver.findByDriverId(driverId);
      }

      if (!driver) {
        return {
          success: false,
          error: "Driver not found",
        };
      }

      // Fetch vehicle information
      let vehicle = null;
      if (driver.vehicleId) {
        try {
          vehicle = await Vehicle.findByVehicleId(driver.vehicleId);
        } catch (error) {
          console.error("Error fetching vehicle data:", error);
        }
      }

      const driverMeta = {
        rating: driver.rating.toString(),
        tripCountToday: driver.tripCountToday,
        totalTripsAccepted: driver.totalTripsAccepted,
        totalTripsRejected: driver.totalTripsRejected,
        isTrusted: driver.isTrusted,
        liveStats: driver.liveStats,
        vehicleType: vehicle ? vehicle.type : "SEDAN",
      };

      const incentives = this.fareCalculator.getDriverIncentives({
        driverMeta,
        config,
      });

      return {
        success: true,
        data: incentives,
      };
    } catch (error) {
      console.error("Driver incentives error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Get surge multiplier
   * @param {Object} params
   * @param {string} params.zone - Zone type
   * @param {string} params.regionCode - Region code
   * @param {Date} params.time - Current time
   * @returns {Object} Surge multiplier result
   */
  async getSurgeMultiplier({
    zone,
    regionCode = "default",
    time = new Date(),
  }) {
    try {
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      const multiplier = this.fareCalculator.getSurgeMultiplier({
        time: new Date(time),
        zone,
        config,
      });

      return {
        success: true,
        data: {
          zone,
          multiplier,
          time: new Date(time),
        },
      };
    } catch (error) {
      console.error("Surge multiplier error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Get cancellation fee
   * @param {Object} params
   * @param {Date} params.requestedAt - When trip was requested
   * @param {Date} params.cancelledAt - When cancellation occurred
   * @param {string} params.regionCode - Region code
   * @param {string} params.userId - User ID
   * @returns {Object} Cancellation fee result
   */
  async getCancellationFee({
    requestedAt,
    cancelledAt,
    regionCode = "default",
    userId,
  }) {
    try {
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      const result = this.fareCalculator.getCancellationFee({
        requestedAt: new Date(requestedAt),
        cancelledAt: new Date(cancelledAt),
        config,
        userId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Cancellation fee calculation error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Get available vehicle types
   * @param {Object} params
   * @param {string} params.regionCode - Region code
   * @returns {Object} Available vehicle types result
   */
  async getAvailableVehicleTypes({ regionCode = "default" }) {
    try {
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      const vehicleTypes = this.fareCalculator.getAvailableVehicleTypes(config);

      // Generate dynamic descriptions based on vehicle type names
      const descriptions = {};
      vehicleTypes.forEach((type) => {
        // Convert vehicle type to a readable description
        const description = this._generateVehicleDescription(type);
        descriptions[type] = description;
      });

      return {
        success: true,
        data: {
          vehicleTypes,
          descriptions,
        },
      };
    } catch (error) {
      console.error("Get vehicle types error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Generate vehicle description based on vehicle type
   * @private
   */
  _generateVehicleDescription(vehicleType) {
    const descriptions = {
      SEDAN: "Standard sedan car - Comfortable for 4 passengers",
      SUV: "Sports Utility Vehicle - Spacious for 6-7 passengers",
      HATCHBACK: "Compact hatchback - Economical for 4 passengers",
      BIKE: "Motorcycle - Fast and economical for 1-2 passengers",
      AUTO: "Auto rickshaw - Traditional three-wheeler for 3 passengers",
      LUXURY: "Luxury vehicle - Premium comfort and service",
      VAN: "Van - Large capacity for groups",
      TRUCK: "Truck - Heavy cargo transport",
      ELECTRIC: "Electric vehicle - Environmentally friendly",
      HYBRID: "Hybrid vehicle - Fuel efficient",
      MINI: "Mini vehicle - Compact and economical",
      PREMIUM: "Premium vehicle - High-end service",
      SHARE: "Shared vehicle - Cost-effective option",
      EXECUTIVE: "Executive vehicle - Business class service",
    };

    // Return predefined description or generate a generic one
    return descriptions[vehicleType] || `${vehicleType} - Custom vehicle type`;
  }

  /**
   * Get fare configuration
   * @param {Object} params
   * @param {string} params.regionCode - Region code
   * @returns {Object} Fare configuration result
   */
  async getFareConfig({ regionCode = "default" }) {
    try {
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      return {
        success: true,
        data: config,
      };
    } catch (error) {
      console.error("Get fare config error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Health check
   * @returns {Object} Health check result
   */
  async healthCheck() {
    try {
      const config = await FareConfig.getActiveConfig("default");

      return {
        success: true,
        data: {
          status: "healthy",
          configAvailable: !!config,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Health check error:", error);
      return {
        success: false,
        error: "Service unhealthy",
      };
    }
  }

  /**
   * Calculate fare using tripId (modular approach)
   * @param {Object} params
   * @param {string} params.tripId - Trip ID
   * @param {number} params.distance - Distance in km
   * @param {number} params.duration - Duration in minutes
   * @param {number} params.waitTime - Wait time in minutes (optional)
   * @param {string} params.zone - Zone type
   * @param {string} params.regionCode - Region code
   * @returns {Object} Complete fare breakdown
   */
  async calculateFareFromTrip({
    tripId,
    distance,
    duration,
    waitTime = 0,
    zone = "all",
    regionCode = "default",
  }) {
    try {
      const result = await this.tripFareService.calculateFareFromTrip({
        tripId,
        distance,
        duration,
        waitTime,
        zone,
        regionCode,
      });

      return {
        success: result.success,
        data: result.success ? result : null,
        error: result.success ? null : result.error,
      };
    } catch (error) {
      console.error("Trip fare calculation error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Calculate pre-final fare using tripId (modular approach)
   * @param {Object} params
   * @param {string} params.tripId - Trip ID
   * @param {number} params.distance - Distance in km
   * @param {number} params.duration - Duration in minutes
   * @param {string} params.zone - Zone type
   * @param {string} params.regionCode - Region code
   * @returns {Object} Pre-final fare breakdown
   */
  async calculatePreFinalFareFromTrip({
    tripId,
    distance,
    duration,
    zone = "all",
    regionCode = "default",
    waitTime = 0,
    driverId = null,
    fareAdjustment = 0,
  }) {
    try {
      const result = await this.tripFareService.calculatePreFinalFareFromTrip({
        tripId,
        distance,
        duration,
        zone,
        regionCode,
        waitTime,
        driverId,
        fareAdjustment,
      });

      return {
        success: result.success,
        data: result.success
          ? {
              ...result,
              estimateType: "pre-final",
              note: "This is an estimate before trip starts. Final fare may vary based on actual wait time and conditions.",
            }
          : null,
        error: result.success ? null : result.error,
      };
    } catch (error) {
      console.error("Trip pre-final fare calculation error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Get all passenger IDs from trip
   * @param {string} tripId - Trip ID
   * @returns {Object} Passenger IDs result
   */
  async getTripPassengers({ tripId }) {
    try {
      const passengerIds =
        await this.tripFareService.getAllPassengerIds(tripId);

      return {
        success: true,
        data: {
          tripId,
          passengerIds,
          passengerCount: passengerIds.length,
        },
      };
    } catch (error) {
      console.error("Get trip passengers error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Verify and apply coupon to trip
   * @param {Object} params
   * @param {string} params.tripId - Trip ID
   * @param {string} params.couponCode - Coupon code to verify
   * @param {number} params.fare - Base fare for verification
   * @param {string} params.regionCode - Region code
   * @returns {Object} Verification and application result
   */
  async verifyAndApplyCoupon({
    tripId,
    couponCode,
    fare,
    regionCode = "default",
  }) {
    try {
      const result = await this.couponVerificationService.verifyAndApplyCoupon({
        tripId,
        couponCode,
        fare,
        regionCode,
      });

      return {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
      };
    } catch (error) {
      console.error("Coupon verification error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Get applied coupons for a trip
   * @param {string} tripId - Trip ID
   * @returns {Object} Applied coupons result
   */
  async getAppliedCoupons({ tripId }) {
    try {
      const result =
        await this.couponVerificationService.getAppliedCoupons(tripId);

      return {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
      };
    } catch (error) {
      console.error("Get applied coupons error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Remove coupon from trip
   * @param {Object} params
   * @param {string} params.tripId - Trip ID
   * @param {string} params.couponCode - Coupon code to remove
   * @returns {Object} Removal result
   */
  async removeCouponFromTrip({ tripId, couponCode }) {
    try {
      const result = await this.couponVerificationService.removeCouponFromTrip({
        tripId,
        couponCode,
      });

      return {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
      };
    } catch (error) {
      console.error("Remove coupon error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Get available coupons for trip
   * @param {Object} params
   * @param {string} params.tripId - Trip ID
   * @param {number} params.fare - Base fare
   * @param {string} params.regionCode - Region code
   * @returns {Object} Available coupons result
   */
  async getAvailableCouponsForTrip({ tripId, fare, regionCode = "default" }) {
    try {
      const result =
        await this.couponVerificationService.getAvailableCouponsForTrip({
          tripId,
          fare,
          regionCode,
        });

      return {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
      };
    } catch (error) {
      console.error("Get available coupons error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Get available dynamic coupons for passenger
   * @param {Object} params
   * @param {string} params.passengerId - Passenger ID
   * @param {number} params.fare - Current fare amount
   * @param {string} params.regionCode - Region code
   * @returns {Object} Available dynamic coupons result
   */
  async getAvailableDynamicCoupons({
    passengerId,
    fare,
    regionCode = "default",
  }) {
    try {
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      const result = await this.dynamicCouponService.getAvailableDynamicCoupons(
        {
          passengerId,
          fare,
          config,
        },
      );

      return {
        success: result.success,
        data: result.success ? result.data : null,
        error: result.success ? null : result.error,
      };
    } catch (error) {
      console.error("Get available dynamic coupons error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Get all available coupons for passenger (both static and dynamic)
   * @param {Object} params
   * @param {string} params.passengerId - Passenger ID
   * @param {number} params.fare - Current fare amount
   * @param {string} params.regionCode - Region code
   * @returns {Object} All available coupons result
   */
  async getAllAvailableCoupons({ passengerId, fare, regionCode = "default" }) {
    try {
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      // Get static coupons
      const staticCoupons = await this.promoService.getAvailableCoupons({
        userId: passengerId,
        fare,
        config,
      });

      // Get dynamic coupons
      const dynamicCouponsResult =
        await this.dynamicCouponService.getAvailableDynamicCoupons({
          passengerId,
          fare,
          config,
        });

      const dynamicCoupons = dynamicCouponsResult.success
        ? dynamicCouponsResult.data.dynamicCoupons
        : [];

      // Combine both types of coupons
      const allCoupons = {
        staticCoupons,
        dynamicCoupons,
        totalCoupons: staticCoupons.length + dynamicCoupons.length,
        passengerProfile: dynamicCouponsResult.success
          ? dynamicCouponsResult.data.passengerProfile
          : null,
      };

      return {
        success: true,
        data: allCoupons,
      };
    } catch (error) {
      console.error("Get all available coupons error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Get valid passenger fields for dynamic coupon rules
   * @param {Object} params
   * @param {string} params.regionCode - Region code
   * @returns {Object} Valid passenger fields result
   */
  async getValidPassengerFields({ regionCode = "default" }) {
    try {
      const validFields = this.dynamicCouponService.getValidPassengerFields();

      return {
        success: true,
        data: validFields,
      };
    } catch (error) {
      console.error("Get valid passenger fields error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Get dynamic coupon statistics for passenger
   * @param {Object} params
   * @param {string} params.passengerId - Passenger ID
   * @param {string} params.regionCode - Region code
   * @returns {Object} Dynamic coupon statistics result
   */
  async getDynamicCouponStats({ passengerId, regionCode = "default" }) {
    try {
      // Get fare configuration
      const config = await FareConfig.getActiveConfig(regionCode);
      if (!config) {
        return {
          success: false,
          error: "Fare configuration not found for region",
        };
      }

      // Get passenger data
      const Passenger = require("../models/Passenger");
      let passenger;
      if (mongoose.Types.ObjectId.isValid(passengerId)) {
        passenger = await Passenger.findByObjectId(passengerId);
      } else {
        passenger =
          (await Passenger.findByUsername(passengerId)) ||
          (await Passenger.findByPhone(passengerId)) ||
          (await Passenger.findByEmail(passengerId));
      }

      if (!passenger) {
        return {
          success: false,
          error: "Passenger not found",
        };
      }

      // Convert passenger to metadata format
      const passengerMeta = {
        username: passenger.username,
        phone: passenger.phone,
        email: passenger.email,
        name: passenger.name,
        isActive: passenger.isActive,
        isBlocked: passenger.isBlocked,
        stats: passenger.stats,
        membership: passenger.membership,
        preferences: passenger.preferences,
        profile: passenger.profile,
      };

      const profile =
        this.dynamicCouponService._getPassengerProfile(passengerMeta);
      const cacheStats = this.dynamicCouponService.getCacheStats();

      return {
        success: true,
        data: {
          passengerId,
          profile,
          cacheStats,
          eligibleRules: config.dynamicCouponRules
            ? config.dynamicCouponRules.length
            : 0,
        },
      };
    } catch (error) {
      console.error("Get dynamic coupon stats error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }
}

module.exports = new FareService();
