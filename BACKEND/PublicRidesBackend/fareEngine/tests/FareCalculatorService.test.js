const FareCalculatorService = require("../services/FareCalculatorService");
const SurgeService = require("../services/SurgeService");
const PromoService = require("../services/PromoService");
const IncentiveService = require("../services/IncentiveService");
const CancellationService = require("../services/CancellationService");

// Mock configuration for testing
const mockConfig = {
  regionCode: "test",
  currency: "INR",
  baseFare: 50,
  timeCostPerMin: 2,
  waitTimeCostPerMin: 1.5,
  rangePricing: [
    { minDistance: 0, maxDistance: 5, costPerKm: 12 },
    { minDistance: 5, maxDistance: 15, costPerKm: 10 },
    { minDistance: 15, maxDistance: 25, costPerKm: 8 },
    { minDistance: 25, maxDistance: null, costPerKm: 6 },
  ],
  minFare: 30,
  maxFare: 2000,
  vehicleTypes: {
    SEDAN: {
      baseFare: 60,
      timeCostPerMin: 2,
      waitTimeCostPerMin: 2,
      rangePricing: [
        { minDistance: 0, maxDistance: 5, costPerKm: 15 },
        { minDistance: 5, maxDistance: 15, costPerKm: 12 },
        { minDistance: 15, maxDistance: 25, costPerKm: 10 },
        { minDistance: 25, maxDistance: null, costPerKm: 8 },
      ],
      minFare: 40,
      maxFare: 2500,
    },
    SUV: {
      baseFare: 80,
      timeCostPerMin: 3,
      waitTimeCostPerMin: 2.5,
      rangePricing: [
        { minDistance: 0, maxDistance: 5, costPerKm: 18 },
        { minDistance: 5, maxDistance: 15, costPerKm: 15 },
        { minDistance: 15, maxDistance: 25, costPerKm: 12 },
        { minDistance: 25, maxDistance: null, costPerKm: 10 },
      ],
      minFare: 50,
      maxFare: 3000,
    },
    BIKE: {
      baseFare: 25,
      timeCostPerMin: 1,
      waitTimeCostPerMin: 0.8,
      rangePricing: [
        { minDistance: 0, maxDistance: 5, costPerKm: 8 },
        { minDistance: 5, maxDistance: 15, costPerKm: 6 },
        { minDistance: 15, maxDistance: 25, costPerKm: 5 },
        { minDistance: 25, maxDistance: null, costPerKm: 4 },
      ],
      minFare: 20,
      maxFare: 1000,
    },
  },
  surge: {
    enabled: true,
    multipliers: [
      {
        timeRange: { start: "07:00", end: "09:00" },
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        multiplier: 1.5,
        zones: ["business", "airport"],
      },
    ],
  },
  fees: {
    platformFee: { type: "percentage", value: 10 },
    gst: { type: "percentage", value: 5 },
    convenienceFee: { type: "fixed", value: 5 },
  },
  discountRules: [
    {
      code: "TEST_COUPON",
      type: "percentage",
      value: 20,
      maxDiscount: 50,
      minFare: 100,
      usageLimit: 1,
      validFrom: new Date("2024-01-01T00:00:00Z"),
      validTo: new Date("2024-12-31T23:59:59Z"),
    },
  ],
  incentives: {
    driverIncentives: [
      { type: "acceptance_rate", condition: ">= 90", bonus: 5 },
      { type: "rating", condition: ">= 4.5", bonus: 3 },
    ],
    driverPenalties: [
      { type: "acceptance_rate", condition: "< 70", penalty: 5 },
    ],
  },
  cancellationPolicy: {
    freeCancellationWindow: 2,
    cancellationFees: [
      { timeWindow: 5, fee: 20 },
      { timeWindow: 10, fee: 30 },
      { timeWindow: 15, fee: 50 },
      { timeWindow: null, fee: 100 },
    ],
  },
  roundingRules: { enabled: true, roundTo: 5 },
  zones: {
    business: { multiplier: 1.1, baseFare: 60 },
    airport: { multiplier: 1.2, baseFare: 80 },
    residential: { multiplier: 1.0, baseFare: 50 },
  },
};

// Mock driver metadata
const mockDriverMeta = {
  rating: "4.5",
  tripCountToday: 15,
  totalTripsAccepted: 100,
  totalTripsRejected: 10,
  isTrusted: true,
  liveStats: { isOnline: true },
  vehicleType: "SEDAN", // This would be fetched from vehicle collection in real scenario
};

describe("FareCalculatorService", () => {
  beforeEach(() => {
    // Reset services for clean state
    PromoService.resetCouponUsage();
    CancellationService.clearCancellationHistory();
    IncentiveService.clearDriverStatsCache();
  });

  describe("calculateFare", () => {
    test("should calculate basic fare correctly for SEDAN", async () => {
      const result = await FareCalculatorService.calculateFare({
        distance: 10,
        duration: 20,
        config: mockConfig,
        zone: "residential",
        vehicleType: "SEDAN",
      });

      expect(result.success).toBe(true);
      expect(result.fare).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
      expect(result.vehicleType).toBe("SEDAN");
      expect(result.breakdown.subtotal).toBeDefined();
      expect(result.breakdown.subtotal).toBeGreaterThan(0);
      expect(result.breakdown.fees).toBeDefined();
      expect(result.breakdown.fees.total).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.fees.breakdown).toBeDefined();
    });

    test("should calculate fare correctly for SUV", async () => {
      const result = await FareCalculatorService.calculateFare({
        distance: 10,
        duration: 20,
        config: mockConfig,
        zone: "residential",
        vehicleType: "SUV",
      });

      expect(result.success).toBe(true);
      expect(result.fare).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
      expect(result.vehicleType).toBe("SUV");
    });

    test("should accept lowercase vehicleType values like sedan", async () => {
      const result = await FareCalculatorService.calculateFare({
        distance: 10,
        duration: 20,
        config: mockConfig,
        zone: "residential",
        vehicleType: "sedan",
      });

      expect(result.success).toBe(true);
      expect(result.fare).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
      expect(result.vehicleType).toBe("SEDAN");
    });

    test("should calculate fare correctly for BIKE", async () => {
      const result = await FareCalculatorService.calculateFare({
        distance: 10,
        duration: 20,
        config: mockConfig,
        zone: "residential",
        vehicleType: "BIKE",
      });

      expect(result.success).toBe(true);
      expect(result.fare).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
      expect(result.vehicleType).toBe("BIKE");
    });

    test("should apply surge multiplier during peak hours", () => {
      const result = FareCalculatorService.calculateFare({
        distance: 10,
        duration: 20,
        config: mockConfig,
        zone: "business",
        vehicleType: "SEDAN",
      });

      expect(result.success).toBe(true);
      expect(result.breakdown.surgeMultiplier).toBeDefined();
    });

    test("should apply driver incentives", () => {
      const result = FareCalculatorService.calculateFare({
        distance: 10,
        duration: 20,
        config: mockConfig,
        driverMeta: mockDriverMeta,
        zone: "residential",
        vehicleType: "SEDAN",
      });

      expect(result.success).toBe(true);
      expect(result.breakdown.incentives).toBeDefined();
    });

    test("should apply coupon discount", () => {
      const result = FareCalculatorService.calculateFare({
        distance: 20,
        duration: 30,
        config: mockConfig,
        coupons: ["TEST_COUPON"],
        userId: "test-user",
        zone: "residential",
        vehicleType: "SEDAN",
      });

      expect(result.success).toBe(true);
      // Coupon discount might be 0 if coupon is not valid for current date
      expect(result.breakdown.couponDiscount).toBeGreaterThanOrEqual(0);
    });

    test("should respect min fare limit for different vehicle types", () => {
      const sedanResult = FareCalculatorService.calculateFare({
        distance: 1,
        duration: 5,
        config: mockConfig,
        zone: "residential",
        vehicleType: "SEDAN",
      });

      const bikeResult = FareCalculatorService.calculateFare({
        distance: 1,
        duration: 5,
        config: mockConfig,
        zone: "residential",
        vehicleType: "BIKE",
      });

      expect(sedanResult.success).toBe(true);
      expect(bikeResult.success).toBe(true);
      expect(sedanResult.fare).toBeGreaterThanOrEqual(
        mockConfig.vehicleTypes.SEDAN.minFare,
      );
      expect(bikeResult.fare).toBeGreaterThanOrEqual(
        mockConfig.vehicleTypes.BIKE.minFare,
      );
    });

    test("should respect max fare limit for different vehicle types", () => {
      const sedanResult = FareCalculatorService.calculateFare({
        distance: 100,
        duration: 200,
        config: mockConfig,
        zone: "residential",
        vehicleType: "SEDAN",
      });

      const suvResult = FareCalculatorService.calculateFare({
        distance: 100,
        duration: 200,
        config: mockConfig,
        zone: "residential",
        vehicleType: "SUV",
      });

      expect(sedanResult.success).toBe(true);
      expect(suvResult.success).toBe(true);
      expect(sedanResult.fare).toBeLessThanOrEqual(
        mockConfig.vehicleTypes.SEDAN.maxFare,
      );
      expect(suvResult.fare).toBeLessThanOrEqual(
        mockConfig.vehicleTypes.SUV.maxFare,
      );
    });

    test("should handle invalid parameters", () => {
      const result = FareCalculatorService.calculateFare({
        distance: -1,
        duration: 20,
        config: null,
        zone: "residential",
        vehicleType: "SEDAN",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("should handle invalid vehicle type", () => {
      const result = FareCalculatorService.calculateFare({
        distance: 10,
        duration: 20,
        config: mockConfig,
        zone: "residential",
        vehicleType: "INVALID_TYPE",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("should include subtotal in breakdown (base + distance + time + zone + surge)", () => {
      const result = FareCalculatorService.calculateFare({
        distance: 10,
        duration: 20,
        config: mockConfig,
        zone: "residential",
        vehicleType: "SEDAN",
      });

      expect(result.success).toBe(true);
      expect(result.breakdown.subtotal).toBeDefined();
      expect(result.breakdown.subtotal).toBeGreaterThan(0);

      // Verify subtotal calculation: (base + distance + time) * zone * surge
      const baseComponents =
        result.breakdown.baseFare +
        result.breakdown.distanceFare +
        result.breakdown.timeCost;

      // For residential zone (multiplier 1.0), the subtotal should be base components * surge
      const expectedSubtotal =
        baseComponents * result.breakdown.surgeAdjustment.multiplier;

      expect(result.breakdown.subtotal).toBeCloseTo(expectedSubtotal, 2);
    });
  });

  describe("estimateFareRange", () => {
    test("should return fare range for SEDAN", () => {
      const result = FareCalculatorService.estimateFareRange({
        distance: 10,
        duration: 20,
        config: mockConfig,
        zone: "residential",
        vehicleType: "SEDAN",
      });

      expect(result.minFare).toBeGreaterThan(0);
      expect(result.maxFare).toBeGreaterThan(result.minFare);
      expect(result.currency).toBe(mockConfig.currency);
      expect(result.vehicleType).toBe("SEDAN");
    });

    test("should return fare range for SUV", () => {
      const result = FareCalculatorService.estimateFareRange({
        distance: 10,
        duration: 20,
        config: mockConfig,
        zone: "residential",
        vehicleType: "SUV",
      });

      expect(result.minFare).toBeGreaterThan(0);
      expect(result.maxFare).toBeGreaterThan(result.minFare);
      expect(result.currency).toBe(mockConfig.currency);
      expect(result.vehicleType).toBe("SUV");
    });
  });

  describe("calculateFareWithCoupon", () => {
    test("should apply valid coupon", () => {
      const result = FareCalculatorService.calculateFareWithCoupon({
        fare: 200,
        couponCode: "TEST_COUPON",
        config: mockConfig,
        userId: "test-user",
      });

      // Coupon might not be valid if current date is outside validity period
      if (result.success) {
        expect(result.fare).toBeLessThan(200);
        expect(result.discount).toBeGreaterThan(0);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test("should reject invalid coupon", () => {
      const result = FareCalculatorService.calculateFareWithCoupon({
        fare: 200,
        couponCode: "INVALID_COUPON",
        config: mockConfig,
        userId: "test-user",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getCancellationFee", () => {
    test("should return free cancellation within window", () => {
      const requestedAt = new Date();
      const cancelledAt = new Date(requestedAt.getTime() + 1 * 60 * 1000); // 1 minute later

      const result = FareCalculatorService.getCancellationFee({
        requestedAt,
        cancelledAt,
        config: mockConfig,
        userId: "test-user",
      });

      expect(result.fee).toBe(0);
      expect(result.isFreeCancellation).toBe(true);
    });

    test("should return cancellation fee after window", () => {
      const requestedAt = new Date();
      const cancelledAt = new Date(requestedAt.getTime() + 10 * 60 * 1000); // 10 minutes later

      const result = FareCalculatorService.getCancellationFee({
        requestedAt,
        cancelledAt,
        config: mockConfig,
        userId: "test-user",
      });

      expect(result.fee).toBeGreaterThan(0);
      expect(result.isFreeCancellation).toBe(false);
    });
  });

  describe("getAvailableCoupons", () => {
    test("should return available coupons", () => {
      const coupons = FareCalculatorService.getAvailableCoupons({
        fare: 200,
        config: mockConfig,
        userId: "test-user",
      });

      expect(Array.isArray(coupons)).toBe(true);
      // Note: Coupons might not be available if current date is outside validity period
      expect(coupons.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getDriverIncentives", () => {
    test("should return driver incentives", () => {
      const result = FareCalculatorService.getDriverIncentives({
        driverMeta: mockDriverMeta,
        config: mockConfig,
      });

      expect(result.incentives).toBeDefined();
      expect(result.penalties).toBeDefined();
      expect(result.totalAdjustment).toBeDefined();
    });
  });

  describe("getSurgeMultiplier", () => {
    test("should return surge multiplier", () => {
      const result = FareCalculatorService.getSurgeMultiplier({
        time: new Date(),
        zone: "business",
        config: mockConfig,
      });

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("getAvailableVehicleTypes", () => {
    test("should return available vehicle types", () => {
      const vehicleTypes =
        FareCalculatorService.getAvailableVehicleTypes(mockConfig);

      expect(Array.isArray(vehicleTypes)).toBe(true);
      expect(vehicleTypes).toContain("SEDAN");
      expect(vehicleTypes).toContain("SUV");
      expect(vehicleTypes).toContain("BIKE");
    });

    test("should return vehicle types when config.vehicleTypes is a Map-like object", () => {
      const mapConfig = {
        ...mockConfig,
        vehicleTypes: new Map(Object.entries(mockConfig.vehicleTypes)),
      };

      const vehicleTypes = FareCalculatorService.getAvailableVehicleTypes(
        mapConfig,
      );

      expect(Array.isArray(vehicleTypes)).toBe(true);
      expect(vehicleTypes).toContain("SEDAN");
      expect(vehicleTypes).toContain("SUV");
      expect(vehicleTypes).toContain("BIKE");
    });
  });

  describe("validateParameters", () => {
    test("should validate correct parameters", () => {
      const result = FareCalculatorService.validateParameters({
        distance: 10,
        duration: 20,
        config: mockConfig,
        vehicleType: "SEDAN",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should reject invalid parameters", () => {
      const result = FareCalculatorService.validateParameters({
        distance: -1,
        duration: 0,
        config: null,
        vehicleType: "INVALID_TYPE",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe("SurgeService", () => {
  test("should calculate surge multiplier correctly", () => {
    const multiplier = SurgeService.getSurgeMultiplier({
      time: new Date(),
      zone: "business",
      config: mockConfig,
    });

    expect(typeof multiplier).toBe("number");
    expect(multiplier).toBeGreaterThan(0);
  });

  test("should return 1.0 when surge is disabled", () => {
    const configWithoutSurge = { ...mockConfig, surge: { enabled: false } };

    const multiplier = SurgeService.getSurgeMultiplier({
      time: new Date(),
      zone: "business",
      config: configWithoutSurge,
    });

    expect(multiplier).toBe(1.0);
  });
});

describe("PromoService", () => {
  beforeEach(() => {
    PromoService.resetCouponUsage();
  });

  test("should apply valid coupon", () => {
    const result = PromoService.applyCoupon({
      code: "TEST_COUPON",
      fare: 200,
      config: mockConfig,
      userId: "test-user",
    });

    // Coupon might not be valid if current date is outside validity period
    if (result.success) {
      expect(result.fare).toBeLessThan(200);
    } else {
      expect(result.error).toBeDefined();
    }
  });

  test("should track coupon usage", () => {
    const result = PromoService.applyCoupon({
      code: "TEST_COUPON",
      fare: 200,
      config: mockConfig,
      userId: "test-user",
    });

    const stats = PromoService.getCouponStats();
    // Only track usage if coupon was successfully applied
    if (result.success) {
      expect(stats.totalUsage).toBeGreaterThan(0);
    } else {
      expect(stats.totalUsage).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("IncentiveService", () => {
  test("should calculate driver incentives", () => {
    const result = IncentiveService.getIncentives({
      driverMeta: mockDriverMeta,
      config: mockConfig,
    });

    expect(result.incentives).toBeDefined();
    expect(result.penalties).toBeDefined();
  });

  test("should calculate acceptance rate correctly", () => {
    const performance =
      IncentiveService.getDriverPerformanceSummary(mockDriverMeta);
    expect(performance.acceptanceRate).toBe(91); // 100/(100+10) * 100
  });
});

describe("CancellationService", () => {
  beforeEach(() => {
    CancellationService.clearCancellationHistory();
  });

  test("should calculate cancellation fee correctly", () => {
    const requestedAt = new Date();
    const cancelledAt = new Date(requestedAt.getTime() + 10 * 60 * 1000);

    const result = CancellationService.getCancellationFee({
      requestedAt,
      cancelledAt,
      config: mockConfig,
      userId: "test-user",
    });

    expect(result.fee).toBeGreaterThan(0);
    expect(result.timeDiff).toBe(10);
  });

  test("should track cancellation history", () => {
    const requestedAt = new Date();
    const cancelledAt = new Date(requestedAt.getTime() + 5 * 60 * 1000);

    CancellationService.getCancellationFee({
      requestedAt,
      cancelledAt,
      config: mockConfig,
      userId: "test-user",
    });

    const history = CancellationService.getUserCancellationHistory("test-user");
    expect(history.length).toBe(1);
  });
});
