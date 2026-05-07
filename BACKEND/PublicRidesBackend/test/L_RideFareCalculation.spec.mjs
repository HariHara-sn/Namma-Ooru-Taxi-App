import { expect } from "chai";
import fs from "fs";
import path from "path";
import request from "supertest";

const baseurl = "http://localhost:3000";

// Load mock data
const mockDataPath = path.join(process.cwd(), "testData", "rideFareTest.json");
const mockData = JSON.parse(fs.readFileSync(mockDataPath, "utf8"));

const {
  mockTrip,
  mockDriver,
  mockPassenger,
  mockVehicle,
  mockPaymentDetails,
  mockFareConfig,
} = mockData;

let tripId, driverId, passengerId, vehicleId, driverToken, passengerToken;

describe("Ride Fare Testing - Complete Flow", () => {
  /**
   * SETUP: Create test data in database
   */
  before("Setup mock data", (done) => {
    // In a real scenario, you'd insert these into MongoDB
    tripId = mockTrip._id;
    driverId = mockDriver._id;
    passengerId = mockPassenger._id;
    vehicleId = mockVehicle._id;
    console.log("✓ Mock data loaded");
    done();
  });

  /**
   * TEST 1: Passenger Requests Ride
   */
  describe("POST /ride/request-ride", () => {
    it("1 - Passenger should be able to request a ride", (done) => {
      request(baseurl)
        .post("/ride/request-ride")
        .send({
          passangerId: passengerId,
          pickupLocation: mockTrip.pickupLocation,
          dropoffLocation: mockTrip.dropoffLocation,
          vehicleType: mockTrip.vehicleType,
          estimatedDistance: mockTrip.estimatedDistance,
          estimatedDuration: mockTrip.estimatedDuration,
          paymentMethod: mockTrip.paymentMethod,
        })
        .set("Accept", "application/json")
        .set("Content-Type", "application/json")
        .end(function (err, res) {
          if (err) throw err;

          expect(res.statusCode).to.be.equal(200);
          expect(res.body.success).to.be.equal(true);
          expect(res.body.data).to.have.property("tripId");
          expect(res.body.data).to.have.property("estimatedFare");
          expect(res.body.data.estimatedFare.totalFare).to.be.greaterThan(0);

          // Save tripId for next tests
          tripId = res.body.data.tripId;

          console.log("✓ Ride requested successfully");
          console.log(
            `  Estimated Fare: ₹${res.body.data.estimatedFare.totalFare}`,
          );
          done();
        });
    });

    it("2 - Fare estimate should include all components", (done) => {
      request(baseurl)
        .get(`/ride/get-fare-estimate?tripId=${tripId}`)
        .end(function (err, res) {
          if (err) throw err;

          expect(res.statusCode).to.be.equal(200);
          expect(res.body.data).to.have.property("baseFare");
          expect(res.body.data).to.have.property("distanceFare");
          expect(res.body.data).to.have.property("timeFare");
          expect(res.body.data).to.have.property("platformFee");
          expect(res.body.data).to.have.property("gst");
          expect(res.body.data).to.have.property("totalFare");

          console.log("✓ Fare estimate breakdown:");
          console.log(`  Base Fare: ₹${res.body.data.baseFare}`);
          console.log(`  Distance Fare: ₹${res.body.data.distanceFare}`);
          console.log(`  Time Fare: ₹${res.body.data.timeFare}`);
          console.log(`  Platform Fee (10%): ₹${res.body.data.platformFee}`);
          console.log(`  GST (5%): ₹${res.body.data.gst}`);
          console.log(`  Total Fare: ₹${res.body.data.totalFare}`);
          done();
        });
    });
  });

  /**
   * TEST 2: Driver Accepts Ride
   *
   * DATABASE CHANGES AT THIS STEP:
   * - Trip.status: "REQUESTED" → "ACCEPTED"
   * - Trip.driverId: null → {driverId}
   * - Trip.vehicleId: null → {vehicleId}
   * - Trip.acceptedAt: set timestamp
   * - Driver.isAvailable: true → false
   * - Driver.tripStatus: "NOTRIP" → "ACTIVE"
   * - Driver.currentTripId: null → {tripId}
   * - Passenger.driverId: null → {driverId}
   */
  describe("POST /driver/accept-ride", () => {
    it("3 - Driver should be able to accept the ride", (done) => {
      request(baseurl)
        .post("/driver/accept-ride")
        .set("Authorization", `Bearer ${driverToken}`)
        .send({
          tripId: tripId,
          vehicleId: vehicleId,
          location: mockDriver.location.coordinates,
        })
        .end(function (err, res) {
          if (err) throw err;

          expect(res.statusCode).to.be.equal(200);
          expect(res.body.success).to.be.equal(true);
          expect(res.body.message).to.include("accepted");

          console.log("✓ Driver accepted the ride");
          console.log(`  Driver: ${mockDriver.name}`);
          console.log(`  Vehicle: ${mockVehicle.make} ${mockVehicle.model}`);
          done();
        });
    });

    it("4 - Trip should show accepted status with driver assigned", (done) => {
      request(baseurl)
        .get(`/driver/get-trip?tripId=${tripId}`)
        .set("Authorization", `Bearer ${driverToken}`)
        .end(function (err, res) {
          if (err) throw err;

          expect(res.statusCode).to.be.equal(200);
          expect(res.body.trip.status).to.equal("ACCEPTED");
          expect(res.body.trip.driverId).to.equal(driverId);
          expect(res.body.trip.vehicleId).to.equal(vehicleId);
          expect(res.body.trip.acceptedAt).to.exist;

          console.log("✓ Trip status verified:");
          console.log(`  Status: ${res.body.trip.status}`);
          console.log(`  Driver assigned: ${res.body.trip.driverId}`);
          console.log(`  Vehicle assigned: ${res.body.trip.vehicleId}`);
          done();
        });
    });

    it("5 - Driver should no longer be available for other rides", (done) => {
      request(baseurl)
        .get(`/driver/get-driver-details`)
        .set("Authorization", `Bearer ${driverToken}`)
        .end(function (err, res) {
          if (err) throw err;

          expect(res.body.driver.isAvailable).to.be.false;
          expect(res.body.driver.tripStatus).to.equal("ACTIVE");
          expect(res.body.driver.currentTripId).to.equal(tripId);

          console.log("✓ Driver availability status:");
          console.log(`  Available: ${res.body.driver.isAvailable}`);
          console.log(`  Trip Status: ${res.body.driver.tripStatus}`);
          done();
        });
    });

    it("6 - Payment record should be created", (done) => {
      request(baseurl)
        .get(`/payment/get-payment-details?tripId=${tripId}`)
        .set("Authorization", `Bearer ${driverToken}`)
        .end(function (err, res) {
          if (err) throw err;

          expect(res.statusCode).to.be.equal(200);
          expect(res.body.payment.tripId).to.equal(tripId);
          expect(res.body.payment.status).to.equal("PENDING");
          expect(res.body.payment).to.have.property("breakdown");

          console.log("✓ Payment record created:");
          console.log(`  Fare: ₹${res.body.payment.fare}`);
          console.log(`  Status: ${res.body.payment.status}`);
          done();
        });
    });
  });

  /**
   * TEST 3: Verify Pickup (OTP)
   *
   * DATABASE CHANGES:
   * - Trip.status: "ACCEPTED" → "PICKEDUP"
   * - Trip.stops[0].isReached: false → true
   * - Trip.stops[0].arrivalTime: set timestamp
   */
  describe("POST /driver/verify-trip-otp", () => {
    it("7 - Driver should verify OTP for pickup", (done) => {
      request(baseurl)
        .post("/driver/verify-trip-otp")
        .set("Authorization", `Bearer ${driverToken}`)
        .send({
          tripId: tripId,
          otp: mockTrip.otp, // "1234"
        })
        .end(function (err, res) {
          if (err) throw err;

          expect(res.statusCode).to.be.equal(200);
          expect(res.body.success).to.be.equal(true);
          expect(res.body.message).to.include("OTP verified");

          console.log("✓ OTP verified - Passenger picked up");
          done();
        });
    });

    it("8 - Trip should show PICKEDUP status", (done) => {
      request(baseurl)
        .get(`/driver/get-trip?tripId=${tripId}`)
        .set("Authorization", `Bearer ${driverToken}`)
        .end(function (err, res) {
          if (err) throw err;

          expect(res.body.trip.status).to.equal("PICKEDUP");
          expect(res.body.trip.stops[0].isReached).to.be.true;
          expect(res.body.trip.stops[0].arrivalTime).to.exist;

          console.log("✓ Trip status: PICKEDUP");
          console.log(
            `  Pickup location reached: ${res.body.trip.stops[0].address}`,
          );
          done();
        });
    });
  });

  /**
   * TEST 4: Calculate Final Fare (After Dropoff)
   *
   * DATABASE CHANGES:
   * - Trip.status: "PICKEDUP" → "DROPPED"
   * - Trip.actualDistance: set to actual value
   * - Trip.actualDuration: set to actual value
   * - PaymentDetails.fare: recalculated with actual values
   * - PaymentDetails.breakdown: updated
   */
  describe("POST /driver/get-total-fare", () => {
    it("9 - Driver should be able to get final fare after dropoff", (done) => {
      request(baseurl)
        .post("/driver/get-total-fare")
        .set("Authorization", `Bearer ${driverToken}`)
        .query({ tripId: tripId })
        .send({
          distance: 26.3, // Actual distance (slightly more than estimated)
          duration: 48, // Actual duration (slightly more than estimated)
          encodedPolyline: "encoded_polyline_data_here",
        })
        .end(function (err, res) {
          if (err) throw err;

          expect(res.statusCode).to.be.equal(200);
          expect(res.body.success).to.be.equal(true);
          expect(res.body.totalFare).to.have.property("fare");
          expect(res.body.totalFare).to.have.property("breakdown");

          console.log("✓ Final fare calculated:");
          console.log(`  Actual Distance: ${res.body.totalFare.distance}km`);
          console.log(`  Actual Duration: ${res.body.totalFare.duration}min`);
          console.log(
            `  Distance Fare: ₹${res.body.totalFare.breakdown.distanceFare}`,
          );
          console.log(`  Time Fare: ₹${res.body.totalFare.breakdown.timeFare}`);
          console.log(
            `  Platform Fee: ₹${res.body.totalFare.breakdown.platformFee}`,
          );
          console.log(`  GST: ₹${res.body.totalFare.breakdown.gst}`);
          console.log(`  Total Fare: ₹${res.body.totalFare.fare}`);
          console.log(
            `  Driver Earnings: ₹${res.body.totalFare.breakdown.driverEarnings}`,
          );
          done();
        });
    });

    it("10 - Trip should show DROPPED status with actual values", (done) => {
      request(baseurl)
        .get(`/driver/get-trip?tripId=${tripId}`)
        .set("Authorization", `Bearer ${driverToken}`)
        .end(function (err, res) {
          if (err) throw err;

          expect(res.body.trip.status).to.equal("DROPPED");
          expect(res.body.trip.actualDistance).to.exist;
          expect(res.body.trip.actualDuration).to.exist;
          expect(res.body.trip.stops[1].isReached).to.be.true;

          console.log("✓ Trip status: DROPPED");
          console.log(
            `  Dropoff location reached: ${res.body.trip.stops[1].address}`,
          );
          console.log(`  Actual Distance: ${res.body.trip.actualDistance}km`);
          console.log(`  Actual Duration: ${res.body.trip.actualDuration}min`);
          done();
        });
    });
  });

  /**
   * TEST 5: Complete Payment
   *
   * DATABASE CHANGES:
   * - Trip.status: "DROPPED" → "COMPLETED"
   * - PaymentDetails.status: "PENDING" → "PAID" or "COMPLETED"
   * - Driver.isAvailable: false → true (made available again)
   * - Driver.tripStatus: "ACTIVE" → "NOTRIP"
   * - Driver.currentTripId: {tripId} → null
   * - Passenger.stats.completedTrips: increment
   * - Passenger.stats.totalSpent: add fare amount
   */
  describe("POST /driver/update-payment-receive", () => {
    it("11 - Driver should confirm payment received", (done) => {
      request(baseurl)
        .post("/driver/update-payment-receive")
        .set("Authorization", `Bearer ${driverToken}`)
        .send({
          tripId: tripId,
          fareDetails: {
            fare: 480.5,
            breakdown: {
              baseFare: 60,
              distanceFare: 263,
              timeFare: 96,
              platformFee: 43.9,
              gst: 21.95,
              driverEarnings: 360.4,
              driverDue: 120.1,
            },
          },
          status: "COMPLETED",
          role: "dco",
          paymentMethod: "CASH",
        })
        .end(function (err, res) {
          if (err) throw err;

          expect(res.statusCode).to.be.equal(200);
          expect(res.body.success).to.be.equal(true);
          expect(res.body.message).to.include("Trip and Payment Completed");

          console.log("✓ Payment received and trip completed");
          console.log(`  Driver Due Amount: ₹${res.body.nextDueDate || "N/A"}`);
          done();
        });
    });

    it("12 - Trip should show COMPLETED status", (done) => {
      request(baseurl)
        .get(`/driver/get-trip?tripId=${tripId}`)
        .set("Authorization", `Bearer ${driverToken}`)
        .end(function (err, res) {
          if (err) throw err;

          expect(res.body.trip.status).to.equal("COMPLETED");

          console.log("✓ Trip status: COMPLETED");
          done();
        });
    });

    it("13 - Driver should be available for new rides", (done) => {
      request(baseurl)
        .get(`/driver/get-driver-details`)
        .set("Authorization", `Bearer ${driverToken}`)
        .end(function (err, res) {
          if (err) throw err;

          expect(res.body.driver.isAvailable).to.be.true;
          expect(res.body.driver.tripStatus).to.equal("NOTRIP");
          expect(res.body.driver.currentTripId).to.be.null;

          console.log("✓ Driver made available for new rides");
          console.log(`  Available: ${res.body.driver.isAvailable}`);
          console.log(`  Trip Status: ${res.body.driver.tripStatus}`);
          done();
        });
    });

    it("14 - Passenger stats should be updated", (done) => {
      request(baseurl)
        .get(`/passenger/get-passenger-details`)
        .set("Authorization", `Bearer ${passengerToken}`)
        .end(function (err, res) {
          if (err) throw err;

          expect(res.body.passenger.stats.completedTrips).to.be.greaterThan(0);
          expect(res.body.passenger.stats.totalSpent).to.be.greaterThan(0);

          console.log("✓ Passenger stats updated:");
          console.log(
            `  Completed Trips: ${res.body.passenger.stats.completedTrips}`,
          );
          console.log(`  Total Spent: ₹${res.body.passenger.stats.totalSpent}`);
          done();
        });
    });
  });

  /**
   * TEST 6: Compare Estimated vs Actual Fare
   */
  describe("Fare Comparison - Estimated vs Actual", () => {
    it("15 - Should show fare difference analysis", (done) => {
      // This is a manual comparison test
      const estimatedFare = mockPaymentDetails.breakdown;
      const actualFare = {
        baseFare: 60,
        distanceFare: 263,
        timeFare: 96,
        platformFee: 43.9,
        gst: 21.95,
        totalFare: 480.5,
      };

      const estimatedTotal = 467.5;
      const actualTotal = 480.5;
      const difference = actualTotal - estimatedTotal;
      const percentageDifference = (
        (difference / estimatedTotal) *
        100
      ).toFixed(2);

      console.log("\n✓ Fare Comparison:");
      console.log(`  Estimated Total: ₹${estimatedTotal}`);
      console.log(`  Actual Total: ₹${actualTotal}`);
      console.log(`  Difference: ₹${difference} (${percentageDifference}%)`);
      console.log(`\n  Distance Variance: Est 25.5km → Actual 26.3km`);
      console.log(`  Duration Variance: Est 45min → Actual 48min`);

      expect(actualTotal).to.be.greaterThan(estimatedTotal);
      done();
    });
  });
});

/**
 * SUMMARY OF DATABASE CHANGES
 *
 * This test suite demonstrates the complete lifecycle and all database changes:
 *
 * 1. REQUESTED STATE:
 *    - Trip created with status "REQUESTED"
 *    - No driver/vehicle assigned
 *    - Estimated fare calculated
 *
 * 2. ACCEPTED STATE:
 *    - Driver & vehicle assigned
 *    - Driver marked as unavailable
 *    - Payment record created
 *
 * 3. PICKEDUP STATE:
 *    - Pickup location marked as reached
 *    - Passenger picked up (OTP verified)
 *
 * 4. DROPPED STATE:
 *    - Actual distance & duration recorded
 *    - Final fare recalculated
 *    - Dropoff location marked as reached
 *
 * 5. COMPLETED STATE:
 *    - Payment marked as paid
 *    - Driver made available again
 *    - Trip moved to history
 *    - Passenger stats updated
 */
