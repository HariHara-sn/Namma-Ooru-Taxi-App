const {
  passangerSchemaPublicrides,
  passangerLoginSchemaPublicrides,
  tripDataSchemaPublicrides,
  rideEstimationSchemaPublicrides,
  passangerVerifyOTPSchemaPublicrides,
  actingDriverTripSchemaPublicrides,
} = require("../../Schemas/PassangerSchema");
const { publicridesFeedbackSchema } = require("../../Schemas/FeedbackSchema");
const Feedback = require("../../Models/Feedback");
const Passanger = require("../../Models/Passanger");
const Password = require("../Users/Password");
const Trip = require("../../Models/Trip");
const { ObjectId } = require("mongodb");
const Driver = require("../../Models/Driver");
const RideStatus = require("../../Core/PublicRides/RideStatus");
const SendSMS = require("../../Core/SMSService/SendSMS");
const Redis = require("../DB/Redis");
const FareEngineInterface = require("../../fareEngine/FareEngineInterface");
const GeneratePresignedUrl = require("../../Controllers/GeneratePresignedUrl");
const PublicRidesPayment = require("../../Models/PublicRidesPayments");
const FareConfigs = require("../../Models/FareConfigs");
const PublicRideRegionalOffices = require("../RegionalOffices/publicRideRegionalOffices");
const PublicRidesTicket = require("../../Models/PublicRidesTicket");
const Vendor = require("../../Models/Vendor");
const AdminOffice = require("../../Models/adminOffice");
const fs = require("fs");
const path = require("path");
const { getUserSocketIds } = require("../../Services/WebsocketUtilities");
const PushNotifiationService = require("../../Services/PushNotification/PushNotifiationService");
const NOTPushNotifiationService = require("../../Services/PushNotification/NOTPushNotifiationService");
const {
  sendBillRejectedDriverMessage,
  sendBillPaidDriverMessage,
} = require("../../Services/PushNotification/Messages");
const multer = require("multer");
const { e2eS3File } = require("../../Models/e2eS3File");
const AppConfig = require("../../Models/AppConfig");
const EmergencyContacts = require("../../Models/EmergencyContacts");
const {
  passangerEmergencyContactSchema,
} = require("../../Schemas/PassangerSchema");
const OTP = require("../../Controllers/OTP");
const VehicleVerifierMParivahan = require("../Mparivahan/VerifyVehicle");
const Vehicle = require("../../Models/Vehicle");

function mapParivahanVehicleClass(vehicleClassDesc = "") {
  const desc = vehicleClassDesc.toLowerCase();
  if (
    desc.includes("motor cycle") ||
    desc.includes("motorcycle") ||
    desc.includes("two wheeler")
  )
    return "bike";
  if (desc.includes("auto") || desc.includes("three")) return "auto";
  if (desc.includes("suv") || desc.includes("sport utility")) return "suv";
  if (desc.includes("muv") || desc.includes("multi utility")) return "muv";
  if (desc.includes("luxury") || desc.includes("premium")) return "luxury";
  if (desc.includes("sedan")) return "sedan";
  if (desc.includes("hatchback") || desc.includes("hatch")) return "hatchback";
  return "sedan";
}

module.exports = function (CLASS) {
  /**
   * @api {post} /publicrides/signup Customer Signup
   * @apiName SignupCustomer
   * @apiGroup PublicRides
   *
   * @apiParam {String} name Name of the passenger.
   * @apiParam {String} email Email of the passenger.
   * @apiParam {String} phone Phone number of the passenger.
   * @apiParam {String} password Password for the passenger account.
   *
   * @apiSuccess {Boolean} success Indicates if the signup was successful.
   * @apiSuccess {String} passangerId ID of the newly created passenger.
   * @apiSuccess {String} message Success message.
   *
   * @apiError {Boolean} success Indicates if the signup failed.
   * @apiError {String} message Error message.
   *
   * @apiSampleRequest /publicrides/signup
   * @apiParamExample {json} Request-Example:
   * {
   *     "name": "John Doe",
   *     "email": "john.doe@example.com",
   *     "phone": "+1234567890",
   *     "password": "securePassword@123"
   * }
   */
  // we wont use this signup route
  CLASS.prototype.publicridesSignupCustomer = async function (req, res) {
    const [payload, errRes] = await this.validate(
      req.body,
      passangerSchemaPublicrides,
    );
    if (!payload) return res.status(400).json(errRes);

    try {
      const existingPassanger = await Passanger.checkPassangerExistWithPhone(
        payload.phone,
      );
      console.log(existingPassanger, "existing passanger");
      if (existingPassanger)
        return res.status(400).json({
          success: false,
          message:
            "Passanger with same email / phone / username already exists",
        });

      payload.createdBy = "publicrides";
      payload.createdOn = new Date().getTime();
      payload.publicRidesPassanger = true;
      /* hash the password */
      const password = new Password(payload.password);
      payload.password = password.encrypt();

      const result = await Passanger.addPassanger(payload);
      const passanger = result.insertedId
        ? await Passanger.getPassanger("publicrides", result.insertedId)
        : null; // Fetch the inserted document using the insertedId
      if (!passanger)
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve the created passanger",
        });

      const token = await this.createJWT(
        { passanger: { id: passanger._id, publicRides: true } },
        process.env.JWT_SECRET_PASSANGER,
        this.accessTokenValidity,
        "HS256",
      );

      return res.json({
        success: true,
        message: "Passanger Signed Up",
        user: {
          name: passanger.name,
          _id: passanger._id,
          phone: passanger.phone,
          token,
        },
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };
  /**
   * @api {post} /publicrides/login Customer Login
   * @apiName LoginCustomer
   * @apiGroup PublicRides
   *
   * @apiParam {String} email Email of the passenger or phone number.
   * @apiParam {String} password Password for the passenger account.
   *
   * @apiSuccess {Boolean} success Indicates if the login was successful.
   * @apiSuccess {String} message Success message.
   * @apiSuccess {Object} user User information.
   * @apiSuccess {String} user.name Name of the passenger.
   * @apiSuccess {String} user._id ID of the passenger.
   * @apiSuccess {String} user.token JWT token for the session.
   *
   * @apiError {Boolean} success Indicates if the login failed.
   * @apiError {String} message Error message.
   *
   * @apiSampleRequest /publicrides/login
   * @apiParamExample {json} Request-Example:
   * {
   *     "email": "john.doe@example.com",
   *     "password": "securePassword@123"
   * }
   */
  CLASS.prototype.publicridesLoginCustomer = async function (req, res) {
    const isDEV = req?.query?.isdev;
    const [payload, error] = await this.validate(
      req.body,
      passangerLoginSchemaPublicrides,
    );
    if (!payload)
      return res.status(400).json({ success: false, message: error });
    if (!payload?.phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }
    try {
      const testPhone = process.env.PUBLIC_CUSTOMER_TEST_NUMBER;
      const testOtp = process.env.PUBLIC_CUSTOMER_TEST_OTP || "112233";
      let otpResponse;
      if (!isDEV && payload.phone !== testPhone) {
        otpResponse = await SendSMS.sendOTP(payload.phone, "CUSTOMER", "OTP");
      } else {
        otpResponse = {
          otp: testOtp,
          expiry: Date.now() + 2 * 60 * 1000,
          status: 200,
        };
      }
      if (otpResponse.status === 200) {
        await Redis.storeDataWithExpiry(
          payload.phone,
          otpResponse.otp,
          otpResponse.expiry,
        );
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Failed to send OTP" });
      }
      return res.json({
        success: true,
        message: "Otp sent successfully",
        otp: otpResponse.otp,
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.passengerPaymentIssues = async function (req, res) {
    try {
      const { tripId, passengerIssues } = req.body;

      // Basic presence validation
      if (
        !tripId ||
        passengerIssues === undefined ||
        passengerIssues === null
      ) {
        return res.status(400).json({
          success: false,
          message: "tripId and passengerIssues are required",
        });
      }

      // Enforce string type for passengerIssues
      if (typeof passengerIssues !== "string") {
        return res.status(422).json({
          success: false,
          message: "passengerIssues must be a string",
        });
      }

      const issueText = passengerIssues.trim();
      if (!issueText) {
        return res
          .status(422)
          .json({ success: false, message: "passengerIssues cannot be empty" });
      }

      const existingTrip = await Trip.getTripById(tripId);
      if (!existingTrip) {
        return res
          .status(404)
          .json({ success: false, message: "Trip not found" });
      }

      // Map terminal statuses to proper payment closure states
      const currentStatus = existingTrip.status;
      const status =
        currentStatus === "DROPPED"
          ? "COMPLETED"
          : currentStatus === "CANCELLED"
            ? "DIVERGED"
            : currentStatus;

      const updated = await Trip.addPaymentIssues(tripId, status, issueText);

      // Handle different persistence return shapes
      const isUpdated =
        typeof updated === "object"
          ? !!(
              updated &&
              updated.acknowledged &&
              (updated.modifiedCount === undefined || updated.modifiedCount > 0)
            )
          : !!updated;

      if (!isUpdated) {
        console.warn("passengerPaymentIssues: update failed", {
          tripId,
          status,
        });
        return res
          .status(400)
          .json({ success: false, message: "Failed to update payment status" });
      }
      return res.json({
        success: true,
        message: "Payment status updated successfully",
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.confirmTripStatusByPassanger = async function (req, res) {
    try {
      // const { tripId, tripStatus } = req.body;
      const { tripId } = req.body;
      if (!tripId) {
        return res
          .status(400)
          .json({ success: false, message: "tripId is required" });
      }

      const finalStatus = "CANCELLED";

      const allowed = ["CANCELLED", "DURATION_EXCEEDED"];
      if (!allowed.includes(finalStatus)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid tripStatus" });
      }

      const existingTrip = await Trip.getTripById(tripId);
      if (!existingTrip) {
        return res
          .status(404)
          .json({ success: false, message: "Trip not found" });
      }

      const reasonCode = 102; // Default to 'trip_duration_exceeded' check Constants/CancelReasons.js for more info

      const updated = await Trip.updateDurationExceededTripStatusByPassanger(
        tripId,
        finalStatus,
        reasonCode,
      );
      if (!updated)
        return res
          .status(400)
          .json({ success: false, message: "Failed to update trip status" });
      return res.json({
        success: true,
        message: "Trip status updated successfully",
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };
  // Initially user signup with this route, after that in profile page they update the profile details
  CLASS.prototype.publicridesUpdatePassangerProfile = async function (
    req,
    res,
  ) {
    try {
      const passenger = await Passanger.updatePassanger(
        req.passanger.id,
        req.body,
      );
      if (!passenger)
        return res
          .status(400)
          .json({ success: false, message: "Failed to update profile" });
      const updatedPassenger = await Passanger.getPassangerWithId(
        req.passanger.id,
      );
      if (!updatedPassenger)
        return res.status(400).json({
          success: false,
          message: "Failed to retrieve updated profile",
        });

      return res.json({
        success: true,
        message: "Profile updated successfully",
        user: updatedPassenger,
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.publicridesVerifyOTP = async function (req, res) {
    try {
      const platform = req?.query?.platform;
      const body = req.body;
      const schema = passangerVerifyOTPSchemaPublicrides(platform);
      const [payload, error] = await this.validate(body, schema);
      if (!payload)
        return res.status(400).json({ success: false, message: error });
      console.log(payload, "payload");
      if (!payload?.phone) {
        return res
          .status(400)
          .json({ success: false, message: "Phone number is required" });
      }

      const passanger = await Passanger.checkPassangerExistWithPhone(
        payload.phone,
      );
      const otp = await Redis.getData(payload.phone);
      if (!otp)
        return res.status(400).json({ success: false, message: "OTP expired" });
      if (Number(otp) !== payload.otp)
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      await Redis.removeKey(payload.phone);
      // if exisiting user

      if (passanger) {
        const passangerDetails = await Passanger.getPassangerWithId(
          passanger._id,
        );
        const token = await this.createJWT(
          { passanger: { id: passanger._id, publicRides: true } },
          process.env.JWT_SECRET_PASSANGER,
          this.accessTokenValidity,
          "HS256",
        );
        if (payload && payload?.deviceMeta) {
          await Passanger.updatePassangerDeviceInfo(
            passanger._id,
            payload.deviceMeta,
          );
        }
        passangerDetails.token = token;

        if (
          payload?.fcmToken?.deviceImei !==
          passangerDetails?.fcmToken?.deviceImei
        ) {
          try {
            const passangerSocketIds = await getUserSocketIds(
              passangerDetails._id,
            );
            if (passangerSocketIds && passangerSocketIds.length > 0) {
              req.socketService.customerRideAssignHandler.emitPassangerAccount(
                passangerSocketIds,
                {
                  type: "LOG_OUT",
                  message: "Logged in from a new device",
                  oldDeviceImei: passangerDetails?.fcmToken?.deviceImei || null,
                },
              );
            } else {
              console.log("No socket ids found for passanger");
            }
          } catch (err) {
            console.log(err, "err: passangerAccount emit");
          }
        }
        if (payload.fcmToken) {
          await Passanger.updatePassangerFcmToken(
            passangerDetails._id,
            payload.fcmToken,
          );
        }

        passangerDetails.fcmToken = payload.fcmToken;
        return res.json({
          success: true,
          message: "OTP verified successfully",
          user: passangerDetails,
          isNewUser: false,
        });
      }
      // if new user
      delete payload.otp;
      payload.createdBy = "publicrides";
      payload.createdOn = new Date().getTime();
      payload.publicRidesPassanger = true;
      const result = await Passanger.addPassanger(payload);
      const passangerDetails = await Passanger.getPassangerWithId(
        result.insertedId,
      );
      const token = await this.createJWT(
        { passanger: { id: passangerDetails._id, publicRides: true } },
        process.env.JWT_SECRET_PASSANGER,
        this.accessTokenValidity,
        "HS256",
      );
      passangerDetails.token = token;
      if (payload.fcmToken) {
        await Passanger.updatePassangerFcmToken(
          passangerDetails._id,
          payload.fcmToken,
        );
      }
      return res.json({
        success: true,
        message: "OTP verified successfully",
        user: passangerDetails,
        isNewUser: true,
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.publicridesResendOTP = async function (req, res) {
    try {
      const payload = req.body;
      const passanger = await Passanger.getUserWithPhoneorEmail(payload);
      if (!passanger)
        return res
          .status(400)
          .json({ success: false, message: "Passanger does not exists" });
      const otpResponse = await SendSMS.sendOTP(
        payload.phone,
        "CUSTOMER",
        "OTP",
      );
      if (otpResponse.status === 200) {
        await Redis.storeDataWithExpiry(
          payload.phone,
          otpResponse.otp,
          otpResponse.expiry,
        );
        return res.json({
          success: true,
          message: "OTP sent successfully",
          otp: otpResponse.otp,
        });
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Failed to send OTP" });
      }
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  /**
   * @api {post} /publicrides/book Trip Booking
   * @apiName BookTrip
   * @apiGroup PublicRides
   *
   * @apiParam {Array} startLocation Array containing longitude and latitude of the starting location.
   * @apiParam {Array} endLocation Array containing longitude and latitude of the ending location.
   * @apiParam {Array} stops Array of stop objects, each containing name, address, and location.
   * @apiParam {String} vehicleType Type of vehicle for the trip (e.g., SEDAN, SUV).
   * @apiParam {String} rideType Type of ride (e.g., ONESIDE, ROUNDTRIP).
   * @apiParam {Date} pickupTime Desired pickup time for the trip.
   * @apiParam {Number} passangerCount Number of passengers for the trip.
   *
   * @apiSuccess {Boolean} success Indicates if the booking was successful.
   * @apiSuccess {String} message Success message.
   * @apiSuccess {Object} trip Trip information.
   * @apiSuccess {String} trip._id ID of the trip.
   * @apiSuccess {String} trip.status Status of the trip.
   * @apiSuccess {Number} trip.bookingTime Time when the trip was booked.
   *
   * @apiError {Boolean} success Indicates if the booking failed.
   * @apiError {String} message Error message.
   *
   * @apiSampleRequest /publicrides/book
   * @apiParamExample {json} Request-Example:
   * {
   *     "startLocation": [34.0522, -118.2437],
   *     "endLocation": [34.0522, -118.2437],
   *     "stops": [
   *         {
   *             "name": "Pickup Point",
   *             "address": "123 Main St",
   *             "location": [34.0522, -118.2437]
   *         }
   *         {
   *             "name": "Drop Point",
   *             "address": "123 Main St",
   *             "location": [34.0522, -118.2437]
   *         }
   *     ],
   *     "vehicleType": "SEDAN",
   *     "rideType": "ONESIDE",
   *     "pickupTime": "234243242342",
   *     "passangerCount": 1
   * }
   */
  CLASS.prototype.publicridesBookTrip = async function (req, res) {
    const [payload, error] = await this.validate(
      req.body,
      tripDataSchemaPublicrides,
    );
    if (!payload)
      return res.status(400).json({ success: false, message: error });

    try {
      const passangerId = req.passanger.id;
      const regionalCode =
        payload?.regionCode === "default" ? "NOT" : payload?.regionCode;
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = String(now.getFullYear()).slice(-2);
      const currentdate = `${day}${month}${year}`;
      const random5digits = Math.floor(10000 + Math.random() * 90000);
      const TripId = `${regionalCode}${currentdate}${random5digits}`;
      payload.rideId = TripId;
      const OfferCoupon = payload?.offerCoupon || null;

      payload.bookingTime = new Date().getTime();
      payload.status = RideStatus.PENDING;
      if (payload.isScheduledTrip) {
        payload.status = RideStatus.SCHEDULED;
      }
      payload.publicRidesTrip = true;
      payload.passangerId = new ObjectId(passangerId);
      payload.createdBy = passangerId;
      payload.userId = passangerId;
      delete payload.offerCoupon;

      const otp = OTP.generateOTP(4);
      payload.otp = otp;

      if (payload.regionalOffice) {
        payload.regionalOffice = new ObjectId(payload.regionalOffice);
      }

      const passanger = await Passanger.getPassangerWithId(passangerId);
      if (!passanger)
        return res
          .status(400)
          .json({ success: false, message: "Passanger does not exists" });

      const trip = await Trip.addTrip(payload);

      const TripDetails = await Trip.getTripById(trip?.insertedId);
      if (trip?.insertedId) {
        await Passanger.updatePassangerLatestTripId(
          passangerId,
          trip?.insertedId,
        );
      }

      if (OfferCoupon) {
        const { fareService } = FareEngineInterface.getServices();
        const coupon = await fareService.verifyAndApplyCoupon({
          tripId: String(trip?.insertedId),
          couponCode: OfferCoupon,
          fare: TripDetails.minFare,
          regionCode: payload?.regionCode,
        });
        console.log(coupon, "coupon");
        if (!coupon.success) {
          console.error("coupon Not applied");
        }
      }

      const getMaxDistanceLimit = await FareConfigs.getMaxDistanceLimit(
        TripDetails?.regionCode || "default",
        TripDetails?.vehicleType,
      );
      TripDetails.maxDistanceLimit = getMaxDistanceLimit || null;
      return res.json({
        success: true,
        message: "Trip booked successfully",
        tripId: trip?.insertedId,
        trip: TripDetails,
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.publicridesBookActingDriverTrip = async function (req, res) {
    const [payload, error] = await this.validate(
      req.body,
      actingDriverTripSchemaPublicrides,
    );
    if (!payload)
      return res.status(400).json({ success: false, message: error });

    try {
      const passangerId = req.passanger.id;
      const regionalCode =
        payload?.regionCode === "default" ? "NOT" : payload?.regionCode;
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = String(now.getFullYear()).slice(-2);
      const currentdate = `${day}${month}${year}`;
      const random5digits = Math.floor(10000 + Math.random() * 90000);
      const TripId = `AD${regionalCode}${currentdate}${random5digits}`;
      payload.rideId = TripId;

      const OfferCoupon = payload?.offerCoupon || null;
      payload.bookingTime = new Date().getTime();
      payload.status = RideStatus.PENDING;
      payload.publicRidesTrip = true;
      payload.passangerId = new ObjectId(passangerId);
      payload.createdBy = passangerId;
      payload.userId = passangerId;
      delete payload.offerCoupon;

      if (payload.regionalOffice) {
        payload.regionalOffice = new ObjectId(payload.regionalOffice);
      }

      const passanger = await Passanger.getPassangerWithId(passangerId);
      if (!passanger)
        return res
          .status(400)
          .json({ success: false, message: "Passanger does not exists" });

      if (
        Array.isArray(passanger.notificationPreferences) &&
        passanger.notificationPreferences.length > 0
      ) {
        payload.passengerNotificationPreferences =
          passanger.notificationPreferences;
      }

      const otp = OTP.generateOTP(4);
      payload.otp = otp;

      const trip = await Trip.addTrip(payload);
      const TripDetails = await Trip.getTripById(trip?.insertedId);

      if (trip?.insertedId) {
        await Passanger.updatePassangerLatestTripId(
          passangerId,
          trip?.insertedId,
        );
      }

      if (OfferCoupon) {
        const { fareService } = FareEngineInterface.getServices();
        const coupon = await fareService.verifyAndApplyCoupon({
          tripId: String(trip?.insertedId),
          couponCode: OfferCoupon,
          fare: TripDetails?.minFare || 0,
          regionCode: payload?.regionCode,
        });
        if (!coupon?.success) console.error("Acting driver coupon not applied");
      }

      return res.json({
        success: true,
        message: "Acting driver trip booked successfully",
        tripId: trip?.insertedId,
        trip: TripDetails,
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.publicridesGetTrip = async function (req, res) {
    const passangerId = req.passanger.id;
    try {
      const PassengerDetails = await Passanger.getPassangerWithId(passangerId);
      let trip = null;
      if (PassengerDetails?.latestTripId) {
        trip = await Trip.getTripById(PassengerDetails?.latestTripId);

        if (!trip)
          return res.json({
            success: true,
            trip: null,
            message: "No ongoing trip found",
          });

        if (trip.status === RideStatus.PENDING) {
          return res.json({ success: true, trip, assignDriver: null });
        }

        if (
          trip.status === RideStatus.ACCEPTED ||
          trip.status === RideStatus.PICKEDUP ||
          trip.status === RideStatus.COMPLETED ||
          trip.status === RideStatus.DROPPED ||
          trip.status === RideStatus.DIVERGED ||
          trip.status === RideStatus.CANCELLED
        ) {
          const driver = await Driver.getDriverWithId(trip.driverId);
          if (!driver)
            return res.json({ success: true, trip, assignDriver: null });
          const driverInfo = {
            driverName: driver.name,
            driverPhone: driver.phone,
            driverRating: null,
            vehicleType: driver.ownVehicleInfo.type,
            vehicleModel: driver.ownVehicleInfo.model,
            vehicleBrand: driver.ownVehicleInfo.make,
            vehicleColor: driver.ownVehicleInfo.color,
            vehicleNumber: driver.ownVehicleInfo.regNo,
            upiid: driver.bankDetails.UPIID,
            driverLocation: driver.location,
          };

          if (driver?.documents?.driverPhoto) {
            driverInfo.driverPhoto = driver?.documents?.driverPhoto;
          }

          const paymentdetails =
            await PublicRidesPayment.getPaymentDetailsByTrip(trip._id);

          if (paymentdetails?.fareDetails) {
            trip.fareDetails = paymentdetails.fareDetails;
            trip.passengerPaymentStatus = paymentdetails.passengerPaymentStatus;
          }
          if (paymentdetails?.customerInvoice) {
            trip.customerInvoice = paymentdetails.customerInvoice;
          }

          const getMaxDistanceLimit = await FareConfigs.getMaxDistanceLimit(
            trip?.regionCode || "default",
            trip?.vehicleType,
          );
          trip.maxDistanceLimit = getMaxDistanceLimit || null;

          return res.json({ success: true, trip, assignDriver: driverInfo });
        }
      }
      return res.json({
        success: true,
        trip: null,
        message: "No ongoing trip found",
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };
  /**
   * @api {get} /getTrips Get Trips for Passanger
   * @apiName GetTrips
   * @apiGroup PublicRides
   *
   * @apiParam {Number} [startTime] Optional start time for filtering trips.
   * @apiParam {Number} [endTime] Optional end time for filtering trips.
   * @apiParam {String} [tripStatus] Optional status of the trip to filter.
   * @apiParam {Number} [page=1] Page number for pagination.
   * @apiParam {Number} [limit=10] Number of trips to return per page.
   *
   * @apiSuccess {Boolean} success Indicates if the request was successful.
   * @apiSuccess {Object[]} trips List of trips for the passanger.
   *
   * @apiError {Boolean} success Indicates if the request failed.
   * @apiError {String} message Error message.
   *
   * @apiExample {curl} Example usage:
   *     curl -i http://localhost:3000/getTrips?startTime=1633036800000&endTime=1633123200000&tripStatus=PENDING&page=1&limit=10
   *
   * @apiSampleRequest /getTrips
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true,
   *       "trips": [
   *         {
   *           "tripId": "60d5ec49f1a2c8b1f8e4b0a1",
   *           "passangerId": "60d5ec49f1a2c8b1f8e4b0a2",
   *           "status": "PENDING",
   *           "startTime": 1633036800000,
   *           "endTime": 1633123200000
   *         }
   *       ]
   *     }
   */

  CLASS.prototype.publicridesGetTrips = async function (req, res) {
    let { startTime, endTime, status, page, limit } = req.query;
    const passangerId = req.passanger.id;

    // Fix: Convert pagination parameters to integers with defaults
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    console.log(
      startTime,
      endTime,
      status,
      page,
      limit,
      "startTime, endTime, status, page, limit",
    );

    try {
      if (startTime) {
        startTime = parseInt(startTime, 10);
      }

      if (endTime) {
        endTime = parseInt(endTime, 10);
      }

      // Fix: Convert passangerId to ObjectId
      const filter = { passangerId: new ObjectId(passangerId) };

      // Only add bookingTime filter if startTime or endTime is provided
      if (startTime || endTime) {
        filter.bookingTime = {};
        if (startTime && !Number.isNaN(startTime)) {
          filter.bookingTime.$gte = startTime;
        }
        if (endTime && !Number.isNaN(endTime)) {
          filter.bookingTime.$lte = endTime;
        }
      }

      if (status) {
        filter.status = status;
      }

      const { trips, totalCount } = await Trip.getTripsForPassanger(
        filter,
        page,
        limit,
      );

      // Fix: Use Promise.all with map instead of forEach for async operations
      const tripsWithDriverInfo = await Promise.all(
        trips.map(async (trip) => {
          let supplierInfo = null;
          if (trip.driverId) {
            const driver = await Driver.getDriverWithId(trip.driverId);
            if (driver) {
              const driverInfo = {
                driverName: driver.name,
                driverPhone: driver.phone,
                driverRating: driver.rating || null,
                vehicleType: driver.ownVehicleInfo?.type,
                vehicleModel: driver.ownVehicleInfo?.model,
                vehicleBrand: driver.ownVehicleInfo?.make,
                vehicleColor: driver.ownVehicleInfo?.color,
                vehicleNumber: driver.ownVehicleInfo?.regNo,
                upiid: driver.bankDetails?.UPIID,
                driverLocation: driver.location,
              };

              if (driver?.documents?.driverPhoto) {
                driverInfo.driverPhoto = driver.documents.driverPhoto;
              }

              trip.driverInfo = driverInfo;
              supplierInfo = {
                name: driver.name,
                phone: driver.phone,
                email: driver.email,
                state: driver.state,
                address: driver.homeLocation?.addressName,
              };
            }
          }

          const paymentdetails =
            await PublicRidesPayment.getPaymentDetailsByTrip(trip._id);

          if (paymentdetails?.fareDetails) {
            trip.fareDetails = paymentdetails?.fareDetails;
            if (paymentdetails?.invoiceId) {
              trip.fareDetails.invoiceId = paymentdetails?.invoiceId;
              trip.fareDetails.invoicedAt = paymentdetails?.createdAt;
            }
          }

          if (paymentdetails?.supplier?.type === "vendor") {
            const vendor = await Vendor.getVendorWithId(
              paymentdetails?.supplier?.id,
            );

            if (vendor) {
              supplierInfo = {
                name: vendor.VendorName,
                phone: vendor.ownerPhone,
                email: vendor.ownerEmail,
                state: vendor.state,
                address: vendor.fullAddress,
                gstNumber: vendor.gst,
                panNumber: vendor.companyPANNumber,
              };
              if (vendor?.digitalSignature) {
                const ImagePath = vendor.digitalSignature.replace(
                  /^https:\/\/[^/]+\/?/,
                  "",
                );
                const rjvw = new GeneratePresignedUrl();
                supplierInfo.digitalSignature =
                  await rjvw.generatePresignedImg(ImagePath);
                supplierInfo.digitalSignatureImg = ImagePath;
              }
            }
          }
          trip.supplier = supplierInfo;
          const adminOffice = await AdminOffice.getAdminOffice();
          if (adminOffice) {
            const adminInfo = {
              name: adminOffice.CompanyName,
              phone: adminOffice.ownerPhone,
              email: adminOffice.ownerEmail,
              state: adminOffice.state,
              address: adminOffice.area,
              gstNumber: adminOffice.gst,
              panNumber: adminOffice.companyPANNumber,
            };
            if (adminOffice?.digitalSignature) {
              const ImagePath = adminOffice.digitalSignature.replace(
                /^https:\/\/[^/]+\/?/,
                "",
              );
              const rjvw = new GeneratePresignedUrl();
              adminInfo.digitalSignature =
                await rjvw.generatePresignedImg(ImagePath);
              adminInfo.digitalSignatureImg = ImagePath;
            }
            trip.adminInfo = adminInfo;
          }
          const passengerDetails = await Passanger.getPassangerWithId(
            trip.passangerId,
          );
          if (passengerDetails) {
            trip.recipient = {
              name: passengerDetails.name,
              phone: passengerDetails.phone,
              email: passengerDetails.email,
            };
          }

          return trip;
        }),
      );

      return res.json({
        success: true,
        trips: tripsWithDriverInfo,
        pagination: { totalPages: Math.ceil(totalCount / limit), page, limit },
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.publicridesGetRideEstimations = async function (req, res) {
    const [payload, error] = await this.validate(
      req.body,
      rideEstimationSchemaPublicrides,
    );
    if (!payload)
      return res.status(400).json({ success: false, message: error });
    const { coordinates } = payload;
    let RegionCode = "default";
    let RegionOfficeId = null;

    const regionalOfficeData =
      await PublicRideRegionalOffices.getRegionalOffices(coordinates);
    if (regionalOfficeData) {
      RegionCode = regionalOfficeData.regionFareId;
      RegionOfficeId = regionalOfficeData.regionOfficeId;
    }

    const { fareService } = FareEngineInterface.getServices();

    const {
      distance,
      duration,
      zone = "residential",
      vehicleType = "ALL",
    } = payload;

    const result = await fareService.getFareRange({
      distance,
      duration,
      zone,
      vehicleType,
      regionCode: RegionCode,
    });

    return res.json({
      result,
      regionCode: RegionCode,
      regionOfficeId: RegionOfficeId,
    });
  };

  CLASS.prototype.publicridesGetUserStats = async function (req, res) {
    const passangerId = req.passanger.id;
    const currentTripId = req.query.currentTripId;
    const appConfig = await AppConfig.getPublicRidesCustomerAppConfig();

    console.log(req.useNotPushNotification, "api version");

    if (!appConfig) {
      return res.json({ success: true, message: "No App Config" });
    }

    const PassengerDetails = await Passanger.getPassangerWithId(passangerId);

    if (!PassengerDetails) {
      return res.status(200).json({
        success: true,
        message: "Passanger does not exists",
        userStats: null,
      });
    }

    const userStats = {
      name: PassengerDetails?.name || "",
      phone: PassengerDetails?.phone || "",
      email: PassengerDetails?.email || "",
      rating: PassengerDetails?.ratingData || null,
      totalRides: PassengerDetails?.stats?.totalTrips || 0,
      favPlaces: PassengerDetails?.favPlaces || [],
      fcmToken: PassengerDetails?.fcmToken || null,
      deviceMeta: PassengerDetails?.deviceMeta || null,
      dev: PassengerDetails?.dev || false,
    };

    const userStatsFromTrip = await Trip.getPassengerStats(passangerId);
    const stat = userStatsFromTrip || {};
    stat["cancelTripOccurance"] =
      PassengerDetails?.stats?.cancelTripOccurance || 0;

    userStats.stats = stat;

    let trip = null;

    if (currentTripId) {
      trip = await Trip.getTripById(currentTripId);
    } else {
      if (PassengerDetails?.latestTripId) {
        trip = await Trip.getTripById(PassengerDetails?.latestTripId);
      }
    }
    const scheduleTrips = (await Trip.getScheduleTrips()) || [];
    if (scheduleTrips.length > 0) {
      for (const scheduleTrip of scheduleTrips) {
        const driverData = scheduleTrip.driverData;

        if (driverData && driverData.documents?.driverPhoto) {
          driverData.driverPhoto = driverData.documents.driverPhoto;
          delete driverData.documents;
        }
      }
    }

    if (!trip)
      return res.json({
        success: true,
        userStats,
        appConfig,
        trip: null,
        message: "No ongoing trip found",
        scheduleTrips,
      });

    if (trip.status === RideStatus.PENDING) {
      return res.json({
        success: true,
        userStats,
        appConfig,
        trip,
        assignDriver: null,
        scheduleTrips,
      });
    }

    if (
      trip.status === RideStatus.ACCEPTED ||
      trip.status === RideStatus.PICKEDUP ||
      trip.status === RideStatus.COMPLETED ||
      trip.status === RideStatus.DROPPED ||
      trip.status === RideStatus.DIVERGED ||
      trip.status === RideStatus.CANCELLED
    ) {
      const driver = await Driver.getDriverWithId(trip.driverId);
      if (!driver)
        return res.json({
          success: true,
          userStats,
          appConfig,
          trip,
          assignDriver: null,
          scheduleTrips,
        });
      const driverInfo = {
        driverName: driver.name,
        driverPhone: driver.phone,
        driverRating: null,
        vehicleType: driver.ownVehicleInfo.type,
        vehicleModel: driver.ownVehicleInfo.model,
        vehicleBrand: driver.ownVehicleInfo.make,
        vehicleColor: driver.ownVehicleInfo.color,
        vehicleNumber: driver.ownVehicleInfo.regNo,
        upiid: driver.bankDetails.UPIID,
        driverLocation: driver.location,
      };

      if (driver?.documents?.driverPhoto) {
        driverInfo.driverPhoto = driver?.documents?.driverPhoto;
      }

      const paymentdetails = await PublicRidesPayment.getPaymentDetailsByTrip(
        trip._id,
      );

      if (paymentdetails?.fareDetails) {
        trip.fareDetails = paymentdetails.fareDetails;
        trip.passengerPaymentStatus = paymentdetails.passengerPaymentStatus;
      }
      if (paymentdetails?.customerInvoice) {
        trip.customerInvoice = paymentdetails.customerInvoice;
      }

      const getMaxDistanceLimit = await FareConfigs.getMaxDistanceLimit(
        trip?.regionCode || "default",
        trip?.vehicleType,
      );
      trip.maxDistanceLimit = getMaxDistanceLimit || null;

      return res.json({
        success: true,
        userStats,
        appConfig,
        trip,
        assignDriver: driverInfo,
        scheduleTrips,
      });
    }

    return res.json({
      success: true,
      userStats,
      appConfig,
      trip: null,
      message: "No ongoing trip found",
      scheduleTrips,
    });
  };

  CLASS.prototype.publicridesAvaliableVehicleInfo = async function (req, res) {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    let RegionCode = "default";
    // let RegionOfficeId = null;

    const coordinates = [longitude, latitude];
    const regionalOfficeData =
      await PublicRideRegionalOffices.getRegionalOffices(coordinates);
    if (regionalOfficeData) {
      RegionCode = regionalOfficeData.regionFareId;
      // RegionOfficeId = regionalOfficeData.regionOfficeId;
    }
    const FareConfig = await FareConfigs.getVehicleType(RegionCode);
    if (!FareConfig) {
      return res.status(400).json({ message: "Fare config not found" });
    }
    const vehicleType = FareConfig.vehicleTypes
      ? Object.keys(FareConfig.vehicleTypes)
      : [];
    if (!vehicleType) {
      return res.status(400).json({ message: "Vehicle type not found" });
    }

    return res.json({
      success: true,
      vehicleType,
      regionCode: RegionCode,
      regionOfficeId: regionalOfficeData?.regionOfficeId,
    });
  };

  CLASS.prototype.publicridesGetPassengerAvaliableCoupons = async function (
    req,
    res,
  ) {
    const { fareService } = FareEngineInterface.getServices();
    const { fare, regionCode = "default" } = req.body;

    const coupons = await fareService.getAvailableDynamicCoupons({
      passengerId: req.passanger.id,
      fare: fare,
      regionCode: regionCode,
      config: {},
    });

    return res.json({ success: true, coupons });
  };

  CLASS.prototype.publicridesGetNearByDrivers = async function (req, res) {
    const { latitude, longitude, radius, vehicleTypes } = req.query;

    console.log(
      latitude,
      longitude,
      radius,
      vehicleTypes,
      "latitude, longitude, radius",
    );

    const pickupGeometry = {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)],
    };
    const radiusNumber = Number(radius);
    const drivers = await Driver.getDriverNearbyLocation(
      pickupGeometry,
      radiusNumber,
      20,
      vehicleTypes ? vehicleTypes.split(",") : [],
    );
    return res.json({ success: true, drivers });
  };

  CLASS.prototype.passangerPaymentStatusUpdate = async function (req, res) {
    const { transactionId, tripId } = req.body;

    if (!transactionId || !tripId)
      return res.json({
        success: false,
        message: "Transaction ID and Trip ID are required",
      });

    const trip = await Trip.getTripById(tripId);
    if (!trip) return res.json({ success: false, message: "Trip not found" });
    if (!trip?.paymentId) {
      return res.json({ success: false, message: "Fare Not yet generated" });
    }

    const paymentdetails = await PublicRidesPayment.updatePaymentStatus(
      trip?.paymentId,
      transactionId,
    );
    if (!paymentdetails)
      return res.json({ success: false, message: "Payment details not found" });

    const tripdetails = await Trip.updateTripStatus(
      tripId,
      "PAYMENT_COMPLETED",
    );
    if (!tripdetails)
      return res.json({ success: false, message: "Trip details not found" });

    return res.json({
      success: true,
      message: "Payment status updated successfully",
    });
  };

  CLASS.prototype.publicridesPassengerDriverRating = async function (req, res) {
    const { tripId, rating, comment } = req.body;

    console.log(req.body, "req.body");

    // const passangerId = req.passanger.id;

    const trip = await Trip.getTripById(tripId);

    if (!trip) return res.json({ success: false, message: "Trip not found" });

    // if(trip.passangerId !== passangerId) return res.json({ success: false, message: "You are not authorized to rate this driver" });

    const ratingdata = {
      rating: rating,
      comment: comment,
    };
    let driverratingdata = {};
    const driver = await Driver.getDriverWithId(trip.driverId);

    if (!driver)
      return res.json({ success: false, message: "Driver not found" });

    if (driver?.ratingData) {
      const updatedCount = driver.ratingData.count + 1;
      const updatedTotal = driver.ratingData.total + rating;
      const updatedAverage = updatedTotal / updatedCount;
      driverratingdata = {
        currentrating: updatedAverage,
        count: updatedCount,
        total: updatedTotal,
      };
    } else {
      driverratingdata = {
        currentrating: rating,
        count: 1,
        total: rating,
      };
    }
    const updateratinginTrip = await Trip.updateTripDriverRating(
      tripId,
      ratingdata,
    );
    const updateratinginDriver = await Driver.updateDriverRating(
      trip.driverId,
      driverratingdata,
    );
    if (
      updateratinginTrip?.acknowledged &&
      updateratinginDriver?.acknowledged
    ) {
      return res.json({
        success: true,
        message: "Rating updated successfully",
      });
    }

    return res.json({ success: false, message: "Failed to update rating" });
  };

  CLASS.prototype.getPreFinalFare = async function (req, res) {
    const { tripId, distance, duration, waitingTime } = req.body;
    const { tripFareService } = FareEngineInterface.getServices();

    console.log(tripId, "tripId");

    const trip = await Trip.getTripById(tripId);

    if (!trip) return res.json({ success: false, message: "Trip not found" });

    if (!trip.driverId) {
      return res.json({ success: false, message: "Driver not assigned" });
    }

    const payload = {
      distance: distance,
      duration: duration,
      waitTime: waitingTime || 0,
      zone: "all",
      regionCode: trip.regionCode,
      coupons: [],
      driverId: trip.driverId,
      tripId: tripId,
    };
    if (trip?.fareAdjustment) {
      payload.fareAdjustment = Number(trip.fareAdjustment);
    }

    console.log(payload, "payload: getPreFinalFare");

    const getfinalFare =
      await tripFareService.calculatePreFinalFareFromTrip(payload);

    console.log(getfinalFare, "getfinalFare: getPreFinalFare");

    if (!getfinalFare.success) {
      return res.json({ success: false, message: getfinalFare.message });
    }
    return res.json({ success: true, fare: getfinalFare, tripId: tripId });
  };

  CLASS.prototype.publicridesAddFavPlaces = async function (req, res) {
    const { locationData, label, favPlaceId } = req.body;
    const passangerId = req.passanger.id;
    const passenger = await Passanger.getPassangerWithId(passangerId);

    if (!passenger)
      return res.json({ success: false, message: "Passenger not found" });

    if (favPlaceId) {
      if (!passenger.favPlaces || passenger.favPlaces.length === 0) {
        return res.json({
          success: false,
          message: "No favorite places found to update",
        });
      }

      const favPlaces = passenger.favPlaces;
      const existingPlaceIndex = favPlaces.findIndex(
        (place) => place.favPlaceId.toString() === favPlaceId,
      );

      if (existingPlaceIndex !== -1) {
        // Update existing place location and label
        favPlaces[existingPlaceIndex].locationData = locationData;
        favPlaces[existingPlaceIndex].label = label;
        const updateFavPlaces = await Passanger.updateFavPlaces(
          passangerId,
          favPlaces,
        );
        if (!updateFavPlaces)
          return res.json({
            success: false,
            message: "Failed to update favorite place",
          });
        return res.json({
          success: true,
          message: "Favorite place updated successfully",
          favPlaces: favPlaces,
        });
      } else {
        return res.json({
          success: false,
          message: "Favorite place not found",
        });
      }
    } else {
      // Adding new favorite place
      if (!passenger.favPlaces || passenger.favPlaces.length === 0) {
        const favPlaces = [
          {
            favPlaceId: new ObjectId(),
            locationData: locationData,
            label: label,
          },
        ];
        const updateFavPlaces = await Passanger.updateFavPlaces(
          passangerId,
          favPlaces,
        );
        if (!updateFavPlaces)
          return res.json({
            success: false,
            message: "Failed to add favorite place",
          });
        return res.json({
          success: true,
          message: "Favorite place added successfully",
          favPlaces: favPlaces,
        });
      } else {
        const favPlaces = passenger.favPlaces;

        // Check if label already exists for new additions
        const existingPlaceIndex = favPlaces.findIndex(
          (place) => place.label === label,
        );

        if (existingPlaceIndex !== -1) {
          // Update existing place location
          favPlaces[existingPlaceIndex].locationData = locationData;
          const updateFavPlaces = await Passanger.updateFavPlaces(
            passangerId,
            favPlaces,
          );
          if (!updateFavPlaces)
            return res.json({
              success: false,
              message: "Failed to update favorite place",
            });
          return res.json({
            success: true,
            message: "Favorite place location updated successfully",
            favPlaces: favPlaces,
          });
        } else {
          // Add new favorite place
          favPlaces.push({
            favPlaceId: new ObjectId(),
            locationData: locationData,
            label: label,
          });
          const updateFavPlaces = await Passanger.updateFavPlaces(
            passangerId,
            favPlaces,
          );
          if (!updateFavPlaces)
            return res.json({
              success: false,
              message: "Failed to add favorite place",
            });
          return res.json({
            success: true,
            message: "Favorite place added successfully",
            favPlaces: favPlaces,
          });
        }
      }
    }
  };

  CLASS.prototype.publicridesDeleteFavPlaces = async function (req, res) {
    const { favPlaceId } = req.body;
    const passangerId = req.passanger.id;
    const passenger = await Passanger.getPassangerWithId(passangerId);

    if (!passenger)
      return res.json({ success: false, message: "Passenger not found" });

    if (!favPlaceId)
      return res.json({
        success: false,
        message: "Favorite place ID is required",
      });

    if (!passenger.favPlaces || passenger.favPlaces.length === 0) {
      return res.json({ success: false, message: "No favorite places found" });
    }

    const favPlaces = passenger.favPlaces;
    const existingPlaceIndex = favPlaces.findIndex(
      (place) => place.favPlaceId.toString() === favPlaceId,
    );

    if (existingPlaceIndex === -1) {
      return res.json({ success: false, message: "Favorite place not found" });
    }

    // Remove the place from the array
    favPlaces.splice(existingPlaceIndex, 1);

    const updateFavPlaces = await Passanger.updateFavPlaces(
      passangerId,
      favPlaces,
    );
    if (!updateFavPlaces)
      return res.json({
        success: false,
        message: "Failed to delete favorite place",
      });

    return res.json({
      success: true,
      message: "Favorite place deleted successfully",
      favPlaces: favPlaces,
    });
  };
  CLASS.prototype.getPublicRidesTicketCategories = async function (req, res) {
    const categories = await PublicRidesTicket.getPublicRidesTickets();
    return res.json({ success: true, categories });
  };

  CLASS.prototype.getPublicRidesPassaengerAccountDeletion = async function (
    req,
    res,
  ) {
    const { deletionReason } = req.body;
    const passangerId = req.passanger.id;
    const passanger = await Passanger.getPassangerWithId(passangerId);
    if (!passanger)
      return res.json({ success: false, message: "Passanger not found" });
    const passangerAccountDeletion =
      await Passanger.updatePassangerAccountDeletion(
        passangerId,
        deletionReason,
      );
    if (!passangerAccountDeletion)
      return res.json({
        success: false,
        message: "Failed to update passanger account deletion",
      });
    return res.json({
      success: true,
      message: "Passanger account deletion updated successfully",
    });
  };

  // There is a minor lint issue: a space is missing after the comma in the destructuring assignment.
  // Otherwise, the logic is generally correct:
  // - It checks if the passenger exists for the given phone number.
  // - It sends an OTP and stores both the OTP and deletion reason in Redis with expiry.
  // - On confirmation, it checks the OTP and updates the account deletion status.
  // The only improvement is to add a space after the comma in the destructuring assignment for better readability.

  CLASS.prototype.publicridesAccountDeletionRequest = async function (
    req,
    res,
  ) {
    const { phoneNumber, deletionReason } = req.body;

    if (!phoneNumber)
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    const passenger = await Passanger.getPassangerWithPhone(phoneNumber);
    if (!passenger) {
      return res
        .status(200)
        .json({ success: false, message: "Passanger does not exists" });
    }

    // Check if deletion already requested
    if (passenger.isDeleted === true && passenger.deletedAt) {
      return res.status(200).json({
        success: false,
        message:
          "Account deletion already requested for this phone number. Your account will be deleted soon.",
      });
    }

    const otpResponse = await SendSMS.sendOTP(phoneNumber, "CUSTOMER", "OTP");
    if (otpResponse.status === 200) {
      await Redis.storeDataWithExpiry(
        phoneNumber,
        JSON.stringify({
          deletionReason: deletionReason,
          otp: otpResponse.otp,
        }),
        otpResponse.expiry,
      );
      return res.json({
        success: true,
        message: "OTP sent successfully",
        otp: otpResponse.otp,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Failed to send OTP" });
    }
  };

  CLASS.prototype.publicridesAccountDeletionRequestConfirm = async function (
    req,
    res,
  ) {
    const { phoneNumber, otp } = req.body; // Added space after comma
    const passenger = await Passanger.getPassangerWithPhone(phoneNumber);
    if (!passenger)
      return res.json({ success: false, message: "Passanger not found" });
    console.log(phoneNumber, "phoneNumber");
    const redisData = await Redis.getData(phoneNumber);
    if (!redisData) return res.json({ success: false, message: "OTP expired" });
    const redisDataObj = JSON.parse(redisData);
    if (redisDataObj.otp !== otp)
      return res.json({ success: false, message: "Invalid OTP" });

    const passengerAccountDeletion =
      await Passanger.updatePassangerAccountDeletion(
        passenger._id,
        redisDataObj.deletionReason,
      );
    if (!passengerAccountDeletion)
      return res.json({
        success: false,
        message: "Failed to update passenger account deletion",
      });
    return res.json({
      success: true,
      message: "Passenger account will be deleted within 15 days.",
    });
  };

  CLASS.prototype.publicridesGetTripPaymentDetails = async function (req, res) {
    const tripId = req.query.tripId;
    const trip = await Trip.getTripById(tripId);
    if (!trip) return res.json({ success: false, message: "Trip not found" });
    let supplierInfo = null;

    if (trip.driverId) {
      const driver = await Driver.getDriverWithId(trip.driverId);
      if (driver) {
        const driverInfo = {
          driverName: driver.name,
          driverPhone: driver.phone,
          driverRating: driver.rating || null,
          vehicleType: driver.ownVehicleInfo?.type,
          vehicleModel: driver.ownVehicleInfo?.model,
          vehicleBrand: driver.ownVehicleInfo?.make,
          vehicleColor: driver.ownVehicleInfo?.color,
          vehicleNumber: driver.ownVehicleInfo?.regNo,
          upiid: driver.bankDetails?.UPIID,

          driverLocation: driver.location,
        };
        // if(driver?.razorpayLinkedAccountDetails?.linkedAccountId && driver.razorpayLinkedAccountDetails.accountDetails?.activation_status === "activated"){
        //     driverInfo.razorPayId = driver.razorpayLinkedAccountDetails.linkedAccountId;
        // }else{
        //     driverInfo.razorPayId = null;
        // }
        if (driver?.razorpayLinkedAccountDetails?.linkedAccountId) {
          driverInfo.razorPayId =
            driver?.razorpayLinkedAccountDetails?.linkedAccountId;
          driverInfo.activationStatus =
            driver?.razorpayLinkedAccountDetails?.accountDetails?.activation_status;
          driverInfo.status = driver?.razorpayLinkedAccountDetails?.status;
        }

        if (driver?.documents?.driverPhoto) {
          driverInfo.driverPhoto = driver?.documents?.driverPhoto;
        }

        trip.driverInfo = driverInfo;
        supplierInfo = {
          name: driver.name,
          phone: driver.phone,
          email: driver.email,
          state: driver.state,
          address: driver.homeLocation?.addressName,
        };
      }
    }

    const paymentdetails = await PublicRidesPayment.getPaymentDetailsByTrip(
      trip._id,
    );

    if (paymentdetails?.fareDetails) {
      trip.fareDetails = paymentdetails?.fareDetails;
      if (paymentdetails?.invoiceId) {
        trip.fareDetails.invoiceId = paymentdetails?.invoiceId;
        trip.fareDetails.invoicedAt = paymentdetails?.createdAt;
      }
    }

    if (paymentdetails?.supplier?.type === "vendor") {
      const vendor = await Vendor.getVendorWithId(paymentdetails?.supplier?.id);

      if (vendor) {
        supplierInfo = {
          name: vendor.VendorName,
          phone: vendor.ownerPhone,
          email: vendor.ownerEmail,
          state: vendor.state,
          address: vendor.fullAddress,
          gstNumber: vendor.gst,
          panNumber: vendor.companyPANNumber,
        };
        if (vendor?.digitalSignature) {
          const ImagePath = vendor.digitalSignature.replace(
            /^https:\/\/[^/]+\/?/,
            "",
          );
          const rjvw = new GeneratePresignedUrl();
          supplierInfo.digitalSignature =
            await rjvw.generatePresignedImg(ImagePath);
          supplierInfo.digitalSignatureImg = ImagePath;
        }
      }
    }
    trip.supplier = supplierInfo;
    const adminOffice = await AdminOffice.getAdminOffice();
    if (adminOffice) {
      const adminInfo = {
        name: adminOffice.CompanyName,
        phone: adminOffice.ownerPhone,
        email: adminOffice.ownerEmail,
        state: adminOffice.state,
        address: adminOffice.area,
        gstNumber: adminOffice.gst,
        panNumber: adminOffice.companyPANNumber,
      };
      if (adminOffice?.digitalSignature) {
        const ImagePath = adminOffice.digitalSignature.replace(
          /^https:\/\/[^/]+\/?/,
          "",
        );
        const rjvw = new GeneratePresignedUrl();
        adminInfo.digitalSignature = await rjvw.generatePresignedImg(ImagePath);
        adminInfo.digitalSignatureImg = ImagePath;
      }
      trip.adminInfo = adminInfo;
    }
    const passengerDetails = await Passanger.getPassangerWithId(
      trip.passangerId,
    );
    if (passengerDetails) {
      trip.recipient = {
        name: passengerDetails.name,
        phone: passengerDetails.phone,
        email: passengerDetails.email,
      };
    }
    return res.json({ success: true, trip });
  };

  CLASS.prototype.publicridesTestSimulateDriver = async function (req, res) {
    try {
      const { passangerId } = req.body;

      if (!passangerId) {
        return res.status(400).json({
          success: false,
          message: "Trip ID and Passenger ID are required",
        });
      }

      // Read driver sample data
      const driverSamplePath = path.join(
        __dirname,
        "../../testData/driverSample.json",
      );
      const driverSampleData = JSON.parse(
        fs.readFileSync(driverSamplePath, "utf8"),
      );

      // Get passenger socket IDs
      const passangerSocketIds = await getUserSocketIds(passangerId);

      if (!passangerSocketIds || passangerSocketIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No active socket connections found for passenger",
        });
      }

      let currentIndex = 0;
      const interval = setInterval(async () => {
        if (currentIndex >= driverSampleData.length) {
          clearInterval(interval);
          console.log("Driver location simulation completed");
          return;
        }

        const location = driverSampleData[currentIndex];
        const locationData = {
          tripId: "88",
          data: {
            location: {
              coordinates: location,
              type: "Point",
            },
            liveStats: {
              speed: Math.random() * 60, // Random speed between 0-60 km/h
              battery: Math.random() * 100, // Random battery between 0-100%
              lastLocationUpdatedOn: Date.now(),
            },
          },
        };

        // Emit driver location update to passenger
        req.socketService.driverLocationHandler.emitDriverLocationUpdate(
          passangerSocketIds,
          locationData,
        );

        console.log(
          `Sent location update ${currentIndex + 1}/${driverSampleData.length}:`,
          location,
        );
        currentIndex++;
      }, 5000); // 5 seconds interval

      return res.json({
        success: true,
        message: "Driver location simulation started",
        totalLocations: driverSampleData.length,
        interval: "5 seconds",
      });
    } catch (err) {
      console.error("Error in driver simulation:", err);
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.sendPassangerTestPushNotification = async function (
    req,
    res,
  ) {
    // const { fcmToken} = req.body;
    const passangerId = req.passanger.id;
    const passanger = await Passanger.getPassangerWithId(passangerId);
    if (!passanger)
      return res.json({ success: false, message: "Passanger not found" });
    const fcmToken = passanger.fcmToken;
    if (!fcmToken)
      return res.json({
        success: false,
        message: "FCM Token not found for this passanger",
      });
    const message = {
      title: "Test Push Notification",
      body: "This is a test notification",
    };
    console.log(req.useNotPushNotification, "api version");
    console.log(fcmToken, "fcmToken");
    if (req.useNotPushNotification) {
      await NOTPushNotifiationService.sendPushNotification(
        fcmToken?.token,
        message,
      ).catch((err) => console.log(err));
    } else {
      await PushNotifiationService.sendPushNotification(
        fcmToken,
        message,
      ).catch((err) => console.log(err));
    }

    return res.json({
      success: true,
      message: "Test Push Notification sent successfully",
    });
  };
  CLASS.prototype.addEmergencyContact = async function (req, res) {
    const [payload, errRes] = await this.validate(
      req.body,
      passangerEmergencyContactSchema,
    );
    if (!payload) return res.status(400).json(errRes);
    const passangerId = req.passanger.id;
    const passanger = await Passanger.getPassangerWithId(passangerId);
    if (!passanger)
      return res.json({ success: false, message: "Passanger not found" });
    const isExistContact = await EmergencyContacts.getForPassenger(
      passangerId,
      "pr_passanger",
    );
    if (isExistContact) {
      const emergencyContact =
        await EmergencyContacts.updateContactForPassenger(
          passangerId,
          "pr_passanger",
          payload.contactsData,
        );
      if (!emergencyContact)
        return res.json({
          success: false,
          message: "Failed to update emergency contact",
        });
      return res.json({
        success: true,
        message: "Emergency contact updated successfully",
      });
    }
    const emergencyContact = await EmergencyContacts.addContactForPassenger(
      passangerId,
      "pr_passanger",
      payload.contactsData,
    );
    if (!emergencyContact)
      return res.json({
        success: false,
        message: "Failed to add emergency contact",
      });
    return res.json({
      success: true,
      message: "Emergency contact added successfully",
    });
  };

  CLASS.prototype.updatePassangerFCMToken = async function (req, res) {
    try {
      const fcmToken = req.body;
      const passangerId = req.passanger.id;
      if (!fcmToken)
        return res
          .status(400)
          .json({ success: false, message: "FCM Token is required" });
      if (!fcmToken?.token) {
        return res.json({ success: true, message: "FCM Token is not found" });
      }
      const passanger = await Passanger.getPassangerWithId(passangerId);
      if (!passanger)
        return res.json({ success: false, message: "Passanger not found" });
      fcmToken.isUpdated = true;
      const updatedPassanger = await Passanger.updatePassangerFCMToken(
        passangerId,
        fcmToken,
      );
      if (!updatedPassanger)
        return res.json({
          success: false,
          message: "Failed to update FCM Token",
        });
      return res.json({
        success: true,
        message: "FCM Token updated successfully",
      });
    } catch (err) {
      console.error("Error updating FCM Token:", err);
      return this.handleError(err, res);
    }
  };
  CLASS.prototype.removeEmergencyContact = async function (req, res) {
    try {
      const { contactId, phone } = req.body;
      const passangerId = req.passanger.id;
      if (!contactId && !phone)
        return res
          .status(400)
          .json({ success: false, message: "Contact ID or Phone is required" });
      const passanger = await Passanger.getPassangerWithId(passangerId);
      if (!passanger)
        return res.json({ success: false, message: "Passanger not found" });
      const existing = await EmergencyContacts.getForPassenger(
        passangerId,
        "pr_passanger",
      );
      if (!existing || !Array.isArray(existing.contacts)) {
        return res
          .status(400)
          .json({ success: false, message: "No emergency contacts found" });
      }
      if (phone) {
        const foundByPhone = existing.contacts.some((c) => c.phone === phone);
        if (!foundByPhone)
          return res
            .status(400)
            .json({ success: false, message: "Emergency Contact Not Found" });
        await EmergencyContacts.removeContactByPhoneForPassenger(
          passangerId,
          "pr_passanger",
          phone,
        );
      } else {
        const found = existing.contacts.some(
          (c) => String(c.contactId) === String(contactId),
        );
        if (!found)
          return res
            .status(400)
            .json({ success: false, message: "Emergency Contact Not Found" });
        await EmergencyContacts.removeContactForPassenger(
          passangerId,
          "pr_passanger",
          contactId,
        );
      }
      return res.json({
        success: true,
        message: "Contact removed successfully",
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };
  CLASS.prototype.getEmergencyContacts = async function (req, res) {
    try {
      const passangerId = req.passanger.id;
      if (!passangerId)
        return res
          .status(400)
          .json({ success: false, message: "Passanger ID is required" });
      const passanger = await Passanger.getPassangerWithId(passangerId);
      if (!passanger)
        return res
          .status(400)
          .json({ success: false, message: "Passanger not found" });
      const contactsDoc = await EmergencyContacts.getForPassenger(
        passangerId,
        "pr_passanger",
      );
      const contacts = contactsDoc?.contacts || [];
      return res.json({
        success: true,
        message: "Emergency Contacts",
        emergencyContacts: contacts,
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.publicridesSubmitFeedback = async function (req, res) {
    try {
      const [payload, error] = await this.validate(
        req.body,
        publicridesFeedbackSchema,
      );
      if (!payload)
        return res.status(400).json({ success: false, message: error });
      const passangerId = req.passanger.id;
      const passanger = await Passanger.getPassangerWithId(passangerId);
      console.log(passangerId, "passangerId");
      if (!passanger)
        return res
          .status(400)
          .json({ success: false, message: "Passanger not found" });
      const feedbackDoc = {
        screen: payload.screen,
        passangerId: passanger._id,
        createdAt: Date.now(),
      };

      const optionalFields = [
        "searchIssue",
        "pickLocationIssue",
        "pickLocationCoords",
        "tripIssue",
        "tripStart",
        "tripEnd",
        "tripDistanceKm",
        "pickupCoords",
        "dropCoords",
        "goodThings",
        "badThings",
        "improvements",
        "issueMessage",
        "email",
      ];

      for (const key of optionalFields) {
        const value = payload[key];
        if (
          value !== undefined &&
          value !== null &&
          !(typeof value === "string" && value.trim() === "")
        ) {
          feedbackDoc[key] = value;
        }
      }

      if (payload.tripId) {
        feedbackDoc.tripId = new ObjectId(payload.tripId);
      }

      if (payload.stops) {
        feedbackDoc.stops = payload.stops;
      }

      await Feedback.addFeedback(feedbackDoc);
      return res.json({ success: true, message: "Feedback submitted" });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.getPassengerTripStats = async function (req, res) {
    try {
      const passengerId = req.passanger.id;
      const stats = await Trip.getPassengerStats(passengerId);
      return res.json({ success: true, ...stats });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.updatePassangerVehicle = async function (req, res) {
    try {
      const { vehicleInfo } = req.body;
      if (!vehicleInfo || !vehicleInfo.regNo) {
        return res
          .status(400)
          .json({ success: false, message: "Registration number is required" });
      }

      const passangerId = req.passanger.id;
      const passanger = await Passanger.getPassangerWithId(passangerId);
      if (!passanger)
        return res
          .status(400)
          .json({ success: false, message: "Passanger not found" });

      const normalizedRegNo = vehicleInfo.regNo
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

      // Detect if this is a manual re-submission after parivahan failure
      const isManualSubmit = !!(
        vehicleInfo.type ||
        vehicleInfo.make ||
        vehicleInfo.model
      );

      let vehicleDoc = {
        regNo: normalizedRegNo,
        passangerId: new ObjectId(passangerId),
        source: "passenger_app",
        addedAt: new Date(),
      };

      if (!isManualSubmit) {
        // Step 1: attempt Parivahan verification
        let isParivahanFailed = false;
        try {
          const parivahanResult =
            await VehicleVerifierMParivahan.verfiyRC(normalizedRegNo);
          if (parivahanResult.valid && parivahanResult.data) {
            const d = parivahanResult.data;
            // Map MParivahan response fields to vehicle document
            vehicleDoc.make = d.brand_name || d.maker_desc || d.maker || "";
            vehicleDoc.model =
              d.brand_model || d.model || d.vehicle_class_desc || "";
            vehicleDoc.type =
              d.class || mapParivahanVehicleClass(d.vehicle_class_desc || "");
            vehicleDoc.year = d.registration_date
              ? new Date(d.registration_date).getFullYear()
              : d.manufacturing_yr || d.reg_yr || "";
            vehicleDoc.fuelType = d.fuel_type || d.fuel_desc || "";
            vehicleDoc.color = d.color || "";
            vehicleDoc.ownerName = d.owner_name || "";
            // Store additional verified details
            vehicleDoc.seatingCapacity = d.seating_capacity || "";
            vehicleDoc.cubicCapacity = d.cubic_capacity || "";
            vehicleDoc.chassisNumber = d.chassis_number || "";
            vehicleDoc.engineNumber = d.engine_number || "";
            vehicleDoc.rcStatus = d.rc_status || "";
            vehicleDoc.verified = true;
            vehicleDoc.parivahanData = d;
          } else {
            isParivahanFailed = true;
          }
        } catch (parivahanErr) {
          console.error(
            "Parivahan verification error:",
            parivahanErr?.message || parivahanErr,
          );
          isParivahanFailed = true;
        }

        if (isParivahanFailed) {
          return res.json({
            success: true,
            isParivahanFailed: true,
            message: "parivahan_verification_failed",
            regNo: normalizedRegNo,
          });
        }
      } else {
        // Manual fields provided after parivahan failure
        vehicleDoc.type = vehicleInfo.type || "";
        vehicleDoc.make = vehicleInfo.make || "";
        vehicleDoc.model = vehicleInfo.model || "";
        vehicleDoc.year = vehicleInfo.year || "";
        vehicleDoc.fuelType = vehicleInfo.fuelType || "";
        vehicleDoc.color = vehicleInfo.color || "";
        vehicleDoc.transmission = Array.isArray(vehicleInfo.transmission)
          ? vehicleInfo.transmission
          : vehicleInfo.transmission
          ? [vehicleInfo.transmission]
          : [];
        vehicleDoc.features = Array.isArray(vehicleInfo.features)
          ? vehicleInfo.features
          : [];
        vehicleDoc.additionalInfo = vehicleInfo.additionalInfo || "";
        if (
          vehicleInfo.maxSpeed !== undefined &&
          vehicleInfo.maxSpeed !== null
        ) {
          vehicleDoc.maxSpeed = Number(vehicleInfo.maxSpeed);
        }
        vehicleDoc.verified = false;
      }

      // Save to vehicles collection (upsert by regNo + passangerId)
      const existingVehicle =
        await Vehicle.getPassangerVehicleByVehicleNumber(
          passangerId,
          normalizedRegNo,
        );
      let vehicleId;

      if (existingVehicle) {
        vehicleId = existingVehicle._id.toString();
        await Vehicle.updatePassangerVehicleById(vehicleId, vehicleDoc);
      } else {
        const insertResult = await Vehicle.addPassangerVehicle(vehicleDoc);
        vehicleId = insertResult.insertedId.toString();
      }

      // Link vehicleId to passenger (set-based, no duplicates)
      await Passanger.addPassangerVehicleId(passangerId, vehicleId);

      return res.json({
        success: true,
        isParivahanFailed: false,
        message: "Vehicle added successfully",
        vehicle: { ...vehicleDoc, _id: vehicleId },
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.getPassangerVehicles = async function (req, res) {
    try {
      const passangerId = req.passanger.id;
      const vehicles = await Vehicle.getPassangerVehicles(passangerId);
      return res.json({ success: true, vehicles: vehicles || [] });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.editPassangerVehicle = async function (req, res) {
    try {
      const { vehicleId, vehicleInfo } = req.body;
      if (!vehicleId)
        return res
          .status(400)
          .json({ success: false, message: "vehicleId is required" });
      if (!vehicleInfo || Object.keys(vehicleInfo).length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "vehicleInfo is required" });
      }
      const passangerId = req.passanger.id;
      // Ensure the vehicle belongs to this passenger
      const vehicles = await Vehicle.getPassangerVehicles(passangerId);
      const owned = vehicles.some((v) => v._id.toString() === vehicleId);
      if (!owned)
        return res.status(403).json({
          success: false,
          message: "Vehicle not found for this passenger",
        });

      const allowedFields = [
        "type",
        "make",
        "model",
        "year",
        "fuelType",
        "transmission",
        "features",
        "additionalInfo",
        "maxSpeed",
      ];
      const updateDoc = {};
      for (const key of allowedFields) {
        if (vehicleInfo[key] !== undefined) updateDoc[key] = vehicleInfo[key];
      }
      await Vehicle.updatePassangerVehicleById(vehicleId, updateDoc);
      return res.json({
        success: true,
        message: "Vehicle updated successfully",
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.getOnboardingConfig = async function (req, res) {
    try {
      const config = await AppConfig.getOnboardingConfig();
      if (!config)
        return res
          .status(404)
          .json({ success: false, message: "Onboarding config not found" });
      const {
        VEHICLE_TYPE_OPTIONS,
        FUEL_TYPE_OPTIONS,
        MAKES_IN_INDIA,
        MODELS_BY_MAKE,
        ADVANCED_FEATURES,
        TRANSMISSION_OPTIONS,
      } = config;
      return res.json({
        success: true,
        data: {
          VEHICLE_TYPE_OPTIONS,
          FUEL_TYPE_OPTIONS,
          MAKES_IN_INDIA,
          MODELS_BY_MAKE,
          ADVANCED_FEATURES,
          TRANSMISSION_OPTIONS,
        },
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.approveBill = async function (req, res) {
    try {
      const { tripId, billIndex, approval } = req.body;
      const passangerId = req.passanger.id;

      if (!tripId || billIndex === undefined || billIndex === null) {
        return res.status(400).json({
          success: false,
          message: "tripId and billIndex are required",
        });
      }
      if (!["approved", "rejected"].includes(approval)) {
        return res.status(400).json({
          success: false,
          message: "approval must be 'approved' or 'rejected'",
        });
      }

      const trip = await Trip.getTripById(tripId);
      if (!trip)
        return res
          .status(404)
          .json({ success: false, message: "Trip not found" });
      if (trip.passangerId?.toString() !== passangerId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorised to approve bills for this trip",
        });
      }

      const bills = trip.bills?.bills || [];
      const idx = parseInt(billIndex, 10);
      if (isNaN(idx) || idx < 0 || idx >= bills.length) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid billIndex" });
      }

      await Trip.updateBillApproval(tripId, idx, approval);

      if (approval === "rejected" && trip.driverId) {
        getUserSocketIds(String(trip.driverId))
          .then((driverSocketIds) => {
            if (driverSocketIds && driverSocketIds.length > 0) {
              req.socketService.publicRideDriverHandler.emitBillApprovalStatus(
                driverSocketIds,
                {
                  _id: tripId,
                  billIndex: idx,
                  bill: bills[idx],
                  approval: "rejected",
                },
              );
            }
          })
          .catch((err) =>
            console.error("Error emitting billApprovalStatus to driver:", err),
          );

        // Send push notification to driver
        Driver.getDriverWithId(trip.driverId)
          .then((driver) => {
            if (!driver?.fcmToken?.token) return;
            const bill = bills[idx];
            const msg = sendBillRejectedDriverMessage(
              bill?.description,
              parseFloat(bill?.amount || 0).toFixed(2),
            );
            const service = req.useNotPushNotification
              ? NOTPushNotifiationService
              : PushNotifiationService;
            service.sendPushNotification(
              driver.fcmToken.token,
              msg,
              null,
              "high",
              { tripId: String(tripId) },
            );
          })
          .catch((err) =>
            console.error("Error sending bill rejection push to driver:", err),
          );
      }

      return res.json({
        success: true,
        message: `Bill ${approval} successfully`,
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.markBillAsPaid = async function (req, res) {
    try {
      const { tripId, billIndex } = req.body;
      const passangerId = req.passanger.id;

      if (!tripId || billIndex === undefined || billIndex === null) {
        return res.status(400).json({
          success: false,
          message: "tripId and billIndex are required",
        });
      }

      const trip = await Trip.getTripById(tripId);
      if (!trip)
        return res
          .status(404)
          .json({ success: false, message: "Trip not found" });
      if (trip.passangerId?.toString() !== passangerId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorised to update bills for this trip",
        });
      }

      const bills = trip.bills?.bills || [];
      const idx = parseInt(billIndex, 10);
      if (isNaN(idx) || idx < 0 || idx >= bills.length) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid billIndex" });
      }

      await Trip.updateBillByIndex(tripId, idx, {
        approval: "approved",
        paidAt: new Date().getTime(),
      });

      if (trip.driverId) {
        getUserSocketIds(String(trip.driverId))
          .then((driverSocketIds) => {
            if (driverSocketIds && driverSocketIds.length > 0) {
              req.socketService.publicRideDriverHandler.emitBillApprovalStatus(
                driverSocketIds,
                {
                  _id: tripId,
                  billIndex: idx,
                  bill: bills[idx],
                  approval: "approved",
                },
              );
            }
          })
          .catch((err) =>
            console.error("Error emitting billApprovalStatus to driver:", err),
          );

        Driver.getDriverWithId(trip.driverId)
          .then((driver) => {
            if (!driver?.fcmToken?.token) return;
            const bill = bills[idx];
            const msg = sendBillPaidDriverMessage(
              bill?.description,
              parseFloat(bill?.amount || 0).toFixed(2),
            );
            const service = req.useNotPushNotification
              ? NOTPushNotifiationService
              : PushNotifiationService;
            service.sendPushNotification(
              driver.fcmToken.token,
              msg,
              null,
              "high",
              { tripId: String(tripId) },
            );
          })
          .catch((err) =>
            console.error("Error sending bill paid push to driver:", err),
          );
      }

      return res.json({ success: true, message: "Bill marked as paid" });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.uploadPaymentReceipt = async function (req, res) {
    const storage = multer.memoryStorage();
    const fileFilter = (_, file, cb) => {
      if (/^image\/(jpeg|jpg|png|webp|heic)$/i.test(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only image files (JPEG, PNG, WEBP, HEIC) are allowed"));
      }
    };
    const upload = multer({ storage, fileFilter }).single("paymentReceipt");

    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: "File parse error",
          error: err.message,
        });
      }
      try {
        const { tripId, billIndex } = req.body || {};
        const passangerId = req.passanger.id;

        if (!tripId || billIndex === undefined || billIndex === null) {
          return res.status(400).json({
            success: false,
            message: "tripId and billIndex are required",
          });
        }
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "paymentReceipt file is required",
          });
        }

        const trip = await Trip.getTripById(tripId);
        if (!trip)
          return res
            .status(404)
            .json({ success: false, message: "Trip not found" });
        if (trip.passangerId?.toString() !== passangerId.toString()) {
          return res.status(403).json({
            success: false,
            message: "Not authorised to update bills for this trip",
          });
        }

        const bills = (trip.bills?.bills || []).filter(Boolean);
        const idx = parseInt(billIndex, 10);
        if (isNaN(idx) || idx < 0 || idx >= bills.length) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid billIndex" });
        }

        const s3Key = `${tripId}_payment_receipt_${idx}_${Date.now()}`;
        const result = await e2eS3File(
          "upload",
          req.file,
          s3Key,
          `trips/${tripId}/paymentReceipts/`,
        );
        if (!result?.completed) {
          return res
            .status(500)
            .json({ success: false, message: "File upload failed" });
        }

        await Trip.updateBillByIndex(tripId, idx, {
          paymentReceiptPhoto: result.url,
        });

        // Notify driver in real-time
        if (trip.driverId) {
          getUserSocketIds(String(trip.driverId))
            .then((driverSocketIds) => {
              if (driverSocketIds && driverSocketIds.length > 0) {
                req.socketService.publicRideDriverHandler.emitPassengerReceiptUploaded(
                  driverSocketIds,
                  {
                    tripId,
                    billIndex: idx,
                    receiptUrl: result.url,
                  },
                );
              }
            })
            .catch((err) =>
              console.error(
                "Error emitting passengerReceiptUploaded to driver:",
                err,
              ),
            );
        }

        return res.json({
          success: true,
          message: "Payment receipt uploaded",
          url: result.url,
        });
      } catch (err) {
        return this.handleError(err, res);
      }
    });
  };

  CLASS.prototype.updateNotificationPreferences = async function (req, res) {
    try {
      const passangerId = req.passanger.id;
      const { notificationPreferences, tripId } = req.body;
      if (!Array.isArray(notificationPreferences)) {
        return res.status(400).json({
          success: false,
          message: "notificationPreferences must be an array",
        });
      }
      const updatePromises = [
        Passanger.updateNotificationPreferences(
          passangerId,
          notificationPreferences,
        ),
      ];
      if (tripId) {
        updatePromises.push(
          Trip.updatePassengerNotificationPreferences(
            tripId,
            notificationPreferences,
          ),
        );
      }
      await Promise.all(updatePromises);
      const updatedPassanger = await Passanger.getPassangerWithId(passangerId);
      return res.json({
        success: true,
        message: "Notification preferences updated",
        user: updatedPassanger,
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  CLASS.prototype.deletePassangerVehicle = async function (req, res) {
    try {
      const { vehicleId } = req.body;
      if (!vehicleId)
        return res
          .status(400)
          .json({ success: false, message: "vehicleId is required" });
      const passangerId = req.passanger.id;
      // Ensure the vehicle belongs to this passenger
      const vehicles = await Vehicle.getPassangerVehicles(passangerId);
      const owned = vehicles.some((v) => v._id.toString() === vehicleId);
      if (!owned)
        return res.status(403).json({
          success: false,
          message: "Vehicle not found for this passenger",
        });

      await Vehicle.deletePassangerVehicle(vehicleId);
      await Passanger.removePassangerVehicleId(passangerId, vehicleId);
      return res.json({
        success: true,
        message: "Vehicle deleted successfully",
      });
    } catch (err) {
      return this.handleError(err, res);
    }
  };
};
