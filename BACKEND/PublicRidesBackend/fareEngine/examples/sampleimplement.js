const express = require("express");
const mongoose = require("mongoose");
const {
  initializeFareEngine,
  getServices,
  updateCollectionMappings,
} = require("../index");

/**
 * 🚀 Fare Engine Integration Example
 *
 * This example demonstrates how to integrate the fare engine into your existing Node.js project.
 * It includes both default collection mappings and custom collection mappings.
 */

class FareEngineService {
  constructor() {
    this.app = express();
    this.fareService = null;
    this.tripFareService = null;
    this.couponVerificationService = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the fare engine service
   * @param {string} mongoUri - MongoDB connection string
   * @param {Object} customMappings - Optional custom collection mappings
   */
  async initialize(mongoUri, customMappings = null) {
    try {
      console.log("🚀 Initializing Fare Engine Service...");

      // 1. Connect to MongoDB
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB connected");

      // 2. Register models (important for trip-based calculations)
      require("../models/Trip");
      require("../models/Driver");
      require("../models/Vehicle");
      require("../models/Passenger");
      console.log("✅ Models registered");

      //example for existing connneciton
      // 3. Initialize fare engine
      await initializeFareEngine(mongoose.connection, customMappings);
      console.log("✅ Fare engine initialized");

      // 4. Get services
      const services = getServices();
      this.fareService = services.FareService;
      this.tripFareService = services.TripFareService;
      this.couponVerificationService = services.CouponVerificationService;

      // 5. Setup Express middleware
      this.setupMiddleware();

      // 6. Setup routes
      this.setupRoutes();

      this.isInitialized = true;
      console.log("✅ Fare Engine Service ready!");
    } catch (error) {
      console.error("❌ Failed to initialize Fare Engine Service:", error);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization",
      );

      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Service availability middleware
    this.app.use((req, res, next) => {
      if (!this.isInitialized) {
        return res.status(503).json({
          success: false,
          error: "Fare engine service is initializing",
        });
      }
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get("/health", async (req, res) => {
      try {
        const health = await this.fareService.healthCheck();
        res.json(health);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Get fare range estimate
    //for customer app
    this.app.get("/api/fare/range", async (req, res) => {
      try {
        const result = await this.fareService.getFareRange(req.query);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Calculate pre-final fare (traditional)
    this.app.post("/api/fare/pre-final", async (req, res) => {
      try {
        const result = await this.fareService.calculatePreFinalFare(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // ===== TRIP-BASED FARE CALCULATION (New Modular Approach) =====

    // Calculate pre-final fare using tripId
    this.app.post("/api/fare/trip/pre-final", async (req, res) => {
      try {
        const result = await this.fareService.calculatePreFinalFareFromTrip(
          req.body,
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Calculate final fare using tripId
    //for driver app
    this.app.post("/api/fare/trip/final", async (req, res) => {
      try {
        const result = await this.fareService.calculateFareFromTrip(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Get trip passengers
    this.app.get("/api/fare/trip/passengers", async (req, res) => {
      try {
        const result = await this.fareService.getTripPassengers(req.query);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // ===== ENHANCED COUPON SYSTEM =====

    // Verify and apply coupon to trip
    //for customer app
    this.app.post("/api/fare/trip/coupon/verify", async (req, res) => {
      try {
        const result = await this.fareService.verifyAndApplyCoupon(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Get applied coupons for trip
    this.app.get("/api/fare/trip/coupon/applied", async (req, res) => {
      try {
        const result = await this.fareService.getAppliedCoupons(req.query);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Remove coupon from trip
    this.app.delete("/api/fare/trip/coupon/remove", async (req, res) => {
      try {
        const result = await this.fareService.removeCouponFromTrip(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Get available coupons for trip
    this.app.get("/api/fare/trip/coupon/available", async (req, res) => {
      try {
        const result = await this.fareService.getAvailableCouponsForTrip(
          req.query,
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // ===== DYNAMIC COUPON SYSTEM =====

    // Get available dynamic coupons for passenger
    //for customer app
    this.app.get("/api/fare/dynamic-coupons/available", async (req, res) => {
      try {
        const result = await this.fareService.getAvailableDynamicCoupons(
          req.query,
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Get all available coupons (static + dynamic) for passenger
    this.app.get("/api/fare/dynamic-coupons/all", async (req, res) => {
      try {
        const result = await this.fareService.getAllAvailableCoupons(req.query);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Get valid passenger fields for dynamic coupon rules
    this.app.get(
      "/api/fare/dynamic-coupons/passenger-fields",
      async (req, res) => {
        try {
          const result = await this.fareService.getValidPassengerFields(
            req.query,
          );
          res.json(result);
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
          });
        }
      },
    );

    // Get dynamic coupon statistics for passenger
    this.app.get("/api/fare/dynamic-coupons/stats", async (req, res) => {
      try {
        const result = await this.fareService.getDynamicCouponStats(req.query);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // ===== UTILITY ENDPOINTS =====

    // // Get driver incentives
    // this.app.get('/api/fare/driver-incentives', async (req, res) => {
    //   try {
    //     const result = await this.fareService.getDriverIncentives(req.query);
    //     res.json(result);
    //   } catch (error) {
    //     res.status(500).json({
    //       success: false,
    //       error: error.message
    //     });
    //   }
    // });

    // // Get surge multiplier
    // this.app.get('/api/fare/surge', async (req, res) => {
    //   try {
    //     const result = await this.fareService.getSurgeMultiplier(req.query);
    //     res.json(result);
    //   } catch (error) {
    //     res.status(500).json({
    //       success: false,
    //       error: error.message
    //     });
    //   }
    // });

    // // Get available vehicle types
    // this.app.get('/api/fare/vehicle-types', async (req, res) => {
    //   try {
    //     const result = await this.fareService.getAvailableVehicleTypes(req.query);
    //     res.json(result);
    //   } catch (error) {
    //     res.status(500).json({
    //       success: false,
    //       error: error.message
    //     });
    //   }
    // });

    // // Get fare configuration
    // this.app.get('/api/fare/config/:regionCode?', async (req, res) => {
    //   try {
    //     const result = await this.fareService.getFareConfig({
    //       regionCode: req.params.regionCode || 'default'
    //     });
    //     res.json(result);
    //   } catch (error) {
    //     res.status(500).json({
    //       success: false,
    //       error: error.message
    //     });
    //   }
    // });

    // Update collection mappings (runtime)
    this.app.post("/api/fare/update-mappings", async (req, res) => {
      try {
        updateCollectionMappings(req.body);
        res.json({
          success: true,
          message: "Collection mappings updated successfully",
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      console.error("Error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    });
  }

  /**
   * Start the server
   * @param {number} port - Port to run server on
   */
  start(port = 3001) {
    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(port, "0.0.0.0", () => {
          console.log(`🚀 Fare Engine Service running on port ${port}`);
          console.log(`📊 Health check: http://localhost:${port}/health`);
          console.log(
            `📋 API Documentation: http://localhost:${port}/api/fare/config/default`,
          );
          resolve(server);
        });

        server.on("error", (error) => {
          console.error("❌ Server error:", error);
          reject(error);
        });
      } catch (error) {
        console.error("❌ Failed to start server:", error);
        reject(error);
      }
    });
  }

  /**
   * Get the Express app instance
   */
  getApp() {
    return this.app;
  }
}

// Example usage functions
async function exampleWithDefaultMappings() {
  console.log("\n=== Example 1: Using Default Collection Mappings ===");

  const service = new FareEngineService();

  try {
    // Initialize with default mappings
    await service.initialize("mongodb://localhost:27017/locationTracking");

    // Start server
    await service.start(3001);

    console.log("✅ Service started with default mappings");
    console.log("📋 Test endpoints:");
    console.log("   - http://localhost:3001/health");
    console.log(
      "   - http://localhost:3001/api/fare/range?distance=10&duration=20&zone=residential&vehicleType=ALL&regionCode=default",
    );
    console.log("   - http://localhost:3001/api/fare/config/default");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function exampleWithCustomMappings() {
  console.log("\n=== Example 2: Using Custom Collection Mappings ===");

  const service = new FareEngineService();

  try {
    // Custom collection mappings for different database schema
    const customMappings = {
      driver: {
        id: "driver_id", // Instead of 'driverId'
        rating: "driver_rating", // Instead of 'rating'
        tripCountToday: "today_trips",
        totalTripsAccepted: "accepted_trips",
        totalTripsRejected: "rejected_trips",
        isTrusted: "trusted_status",
        liveStats: "online_status",
        vehicleId: "vehicle_id",
      },
      vehicle: {
        id: "vehicle_id", // Instead of '_id'
        type: "vehicle_type", // Instead of 'type'
        driverId: "driver_id",
      },
      passenger: {
        id: "passenger_id", // Instead of '_id'
        userId: "user_id", // Instead of 'userId'
      },
      trip: {
        id: "trip_id", // Instead of '_id'
        driverId: "driver_id", // Instead of 'driverId'
        vehicleId: "vehicle_id", // Instead of 'vehicleId'
        userId: "user_id", // Instead of 'userId'
        passengers: "passenger_list", // Instead of 'passangers'
      },
    };

    // Initialize with custom mappings
    await service.initialize(
      "mongodb://localhost:27017/locationTracking",
      customMappings,
    );

    // Start server
    const server = await service.start(3001);

    console.log("✅ Service started with custom mappings");
    console.log("📋 Test endpoints:");
    console.log("   - http://localhost:3002/health");
    console.log(
      "   - http://localhost:3002/api/fare/range?distance=10&duration=20&zone=residential&vehicleType=ALL&regionCode=default",
    );
    console.log("   - http://localhost:3002/api/fare/config/default");

    // Keep the server running
    console.log("\n🔄 Server is running. Press Ctrl+C to stop.");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down server...");
      server.close();
      await mongoose.connection.close();
      console.log("🔌 Database connection closed");
      process.exit(0);
    });

    // Keep the process alive
    return new Promise(() => {
      // This promise never resolves, keeping the process alive
    });
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Direct function usage examples
async function directFunctionExamples() {
  console.log("\n=== Example 3: Direct Function Usage ===");

  try {
    // Initialize fare engine
    await initializeFareEngine(mongoose.connection);
    const { FareService } = getServices();

    // Example 1: Traditional fare calculation
    console.log("\n💰 Traditional fare calculation...");
    const traditionalFare = await FareService.calculateFinalFare({
      distance: 10,
      duration: 20,
      waitTime: 5,
      zone: "business",
      driverId: "DRIVER001",
      coupons: ["FIRST_RIDE"],
      userId: "user123",
    });
    console.log(
      "Traditional Fare:",
      traditionalFare.success ? "Success" : "Failed",
    );

    // Example 2: Trip-based fare calculation
    console.log("\n🎯 Trip-based fare calculation...");
    const Trip = require("../models/Trip");
    const sampleTrip = new Trip({
      driverId: "DRIVER001",
      vehicleId: "VEHICLE001",
      userId: "user123",
      passangers: ["user123"],
      status: "accepted",
      coupons: ["FIRST_RIDE"],
    });
    const savedTrip = await sampleTrip.save();

    const tripFare = await FareService.calculateFareFromTrip({
      tripId: savedTrip._id.toString(),
      distance: 10,
      duration: 20,
      waitTime: 5,
      zone: "business",
    });
    console.log("Trip Fare:", tripFare.success ? "Success" : "Failed");

    // Example 3: Enhanced coupon system
    console.log("\n🎫 Enhanced coupon system...");
    const couponVerification = await FareService.verifyAndApplyCoupon({
      tripId: savedTrip._id.toString(),
      couponCode: "FIRST_RIDE",
      fare: 200,
      regionCode: "default",
    });
    console.log(
      "Coupon Verification:",
      couponVerification.success ? "Success" : "Failed",
    );

    console.log("✅ All direct function examples completed");
  } catch (error) {
    console.error("❌ Error in direct function examples:", error);
  }
}

// Dynamic coupon system examples
async function dynamicCouponExamples() {
  console.log("\n=== Example 4: Dynamic Coupon System ===");

  try {
    // Initialize fare engine
    await initializeFareEngine(mongoose.connection);
    const { FareService, DynamicCouponService } = getServices();

    // Create a sample passenger with good stats for dynamic coupons
    const Passenger = require("../models/Passenger");
    const samplePassenger = new Passenger({
      username: "dynamicuser",
      phone: "+919876543210",
      email: "dynamic@example.com",
      password: "password123",
      name: "Dynamic User",
      stats: {
        totalTrips: 25,
        completedTrips: 23,
        cancelledTrips: 2,
        totalSpent: 1500,
        averageRating: 4.5,
        totalRating: 90,
        ratingCount: 20,
      },
      membership: {
        level: "gold",
        points: 150,
        joinDate: new Date("2024-01-01"),
        lastTripDate: new Date("2024-12-20"),
      },
      preferences: {
        preferredPaymentMethod: "card",
        language: "en",
        notifications: {
          push: true,
          email: true,
          sms: false,
        },
      },
      isActive: true,
      isBlocked: false,
    });

    const savedPassenger = await samplePassenger.save();
    console.log("✅ Sample passenger created:", savedPassenger._id.toString());

    // Example 1: Get available dynamic coupons
    console.log("\n🎫 Getting available dynamic coupons...");
    const dynamicCoupons = await FareService.getAvailableDynamicCoupons({
      passengerId: savedPassenger._id.toString(),
      fare: 300,
      regionCode: "default",
    });
    console.log(
      "Dynamic Coupons Result:",
      dynamicCoupons.success ? "Success" : "Failed",
    );
    if (dynamicCoupons.success) {
      console.log(
        "Available Dynamic Coupons:",
        dynamicCoupons.data.dynamicCoupons.length,
      );
      dynamicCoupons.data.dynamicCoupons.forEach((coupon) => {
        console.log(
          `  - ${coupon.code}: ${coupon.description} (₹${coupon.discount} off)`,
        );
      });
    }

    // Example 2: Get all available coupons (static + dynamic)
    console.log("\n🎫 Getting all available coupons...");
    const allCoupons = await FareService.getAllAvailableCoupons({
      passengerId: savedPassenger._id.toString(),
      fare: 300,
      regionCode: "default",
    });
    console.log(
      "All Coupons Result:",
      allCoupons.success ? "Success" : "Failed",
    );
    if (allCoupons.success) {
      console.log("Static Coupons:", allCoupons.data.staticCoupons.length);
      console.log("Dynamic Coupons:", allCoupons.data.dynamicCoupons.length);
      console.log("Total Coupons:", allCoupons.data.totalCoupons);
      console.log("Passenger Profile:", allCoupons.data.passengerProfile);
    }

    // Example 3: Get valid passenger fields
    console.log("\n📋 Getting valid passenger fields...");
    const validFields = await FareService.getValidPassengerFields({
      regionCode: "default",
    });
    console.log(
      "Valid Fields Result:",
      validFields.success ? "Success" : "Failed",
    );
    if (validFields.success) {
      console.log(
        "Valid Passenger Fields:",
        validFields.data.validFields.length,
      );
      console.log("Sample Fields:", validFields.data.validFields.slice(0, 5));
    }

    // Example 4: Get dynamic coupon statistics
    console.log("\n📊 Getting dynamic coupon statistics...");
    const stats = await FareService.getDynamicCouponStats({
      passengerId: savedPassenger._id.toString(),
      regionCode: "default",
    });
    console.log("Stats Result:", stats.success ? "Success" : "Failed");
    if (stats.success) {
      console.log("Passenger Profile:", stats.data.profile);
      console.log("Cache Stats:", stats.data.cacheStats);
      console.log("Eligible Rules:", stats.data.eligibleRules);
    }

    // Example 5: Direct dynamic coupon service usage
    console.log("\n🔧 Direct DynamicCouponService usage...");
    const FareConfig = require("../models/FareConfig");
    const config = await FareConfig.getActiveConfig("default");

    const passengerMeta = {
      username: savedPassenger.username,
      phone: savedPassenger.phone,
      email: savedPassenger.email,
      name: savedPassenger.name,
      isActive: savedPassenger.isActive,
      isBlocked: savedPassenger.isBlocked,
      stats: savedPassenger.stats,
      membership: savedPassenger.membership,
      preferences: savedPassenger.preferences,
      profile: savedPassenger.profile,
    };

    const directDynamicCoupons = DynamicCouponService.getDynamicCoupons({
      passengerMeta,
      config,
      fare: 300,
    });

    console.log(
      "Direct Dynamic Coupons:",
      directDynamicCoupons.dynamicCoupons.length,
    );
    directDynamicCoupons.dynamicCoupons.forEach((coupon) => {
      console.log(`  - ${coupon.code}: ${coupon.description}`);
    });

    console.log("✅ All dynamic coupon examples completed");
  } catch (error) {
    console.error("❌ Error in dynamic coupon examples:", error);
  }
}

// Export for use in other files
module.exports = {
  FareEngineService,
  exampleWithDefaultMappings,
  exampleWithCustomMappings,
  directFunctionExamples,
  dynamicCouponExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      // Connect to MongoDB first
      await mongoose.connect("mongodb://localhost:27017/locationTracking");
      console.log("✅ Connected to MongoDB");

      // Run examples
      // await exampleWithDefaultMappings();
      await exampleWithCustomMappings();
      // await directFunctionExamples();
      // await dynamicCouponExamples();

      // Only reach here if the server is stopped
      console.log("\n✅ All examples completed successfully!");
    } catch (error) {
      console.error("❌ Error running examples:", error);
    } finally {
      // Only close connection if we're not running a persistent server
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log("🔌 Database connection closed");
      }
    }
  })();
}
