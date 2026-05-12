const Joi = require("joi");
const {
  SEDAN,
  SUV,
  AUTO,
  HATCHBACK,
  BIKE,
  ELECTRIC_SEDAN,
  ELECTRIC_SUV,
  ELECTRIC_AUTO,
  ELECTRIC_HATCHBACK,
  ELECTRIC_BIKE,
} = require("../Core/PublicRides/VehicleType");

const passangerSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required(),
  email: Joi.string().email().required(),
  gender: Joi.string().valid("male", "female").required(),
  password: Joi.string()
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"),
    )
    .required(),
  location: Joi.array()
    .items(
      Joi.number().min(-180).max(180), // longitude
      Joi.number().min(-90).max(90), // latitude
    )
    .length(2),
  /* MAKE IT REQUIRED AFTER INTEGRATION */
  username: Joi.string().required(),
});

const passangerSchemaPublicrides = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required(),
  email: Joi.string().email().required(),
  gender: Joi.string().valid("male", "female").required(),
  password: Joi.string()
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"),
    )
    .required(),
  location: Joi.array()
    .items(
      Joi.number().min(-180).max(180), // longitude
      Joi.number().min(-90).max(90), // latitude
    )
    .length(2)
    .optional(),
  fcmToken: Joi.object({
    deviceImei: Joi.string().min(15).max(20).required(),
    token: Joi.string().required(),
  }).optional(),
});

const bulkPassangersSchema = Joi.array().items(
  Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    gender: Joi.string().valid("male", "female").required(),
    password: Joi.string()
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})",
        ),
      )
      .required(),
    /* MAKE IT REQUIRED AFTER INTEGRATION */
    username: Joi.string().required(),
  }),
);

const passangerUpdateSchema = Joi.object({
  passangerId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required(),
  name: Joi.string(),
  phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/),
  gender: Joi.string().valid("male", "female"),
  location: Joi.array()
    .items(
      Joi.number().min(-180).max(180), // longitude
      Joi.number().min(-90).max(90), // latitude
    )
    .length(2),
});

const passangerLoginSchema = (platform) => {
  const imeiRule =
    platform === "ios"
      ? Joi.string().min(5).max(100).required()
      : Joi.string().min(15).max(20).required();

  return Joi.object({
    username: Joi.string().required(),
    // email: Joi.string().email(),
    // phone: Joi.string(),
    password: Joi.string().required(),
    socketId: Joi.string(),
    fcmToken: Joi.object({
      deviceImei: imeiRule,
      token: Joi.string().required(),
    }),
  });
};

const passangerLoginSchemaPublicrides = Joi.object({
  email: Joi.string().email(),
  // password: Joi.string().required(),
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required(),
}).custom((value, helpers) => {
  if (!value.email && !value.phone) {
    return helpers.error("any.required");
  }
  return value;
});

const passangerVerifyOTPSchemaPublicrides = (platform) => {
  const imeiRule =
    platform === "ios"
      ? Joi.string().min(5).max(100).required()
      : Joi.string().min(15).max(20).required();

  return Joi.object({
    phone: Joi.string()
      .pattern(/^\+[1-9]\d{1,14}$/)
      .required(),
    otp: Joi.number().required(),
    fcmToken: Joi.object({
      deviceImei: imeiRule,
      token: Joi.string().optional(),
    }),
    deviceMeta: Joi.object().optional(),
  });
};

const passangerLogoutSchema = (platform) => {
  const imeiRule =
    platform === "ios"
      ? Joi.string().min(5).max(100).required()
      : Joi.string().min(15).max(20).required();

  return Joi.object({
    fcmToken: Joi.object({
      deviceImei: imeiRule,
      token: Joi.string().required(),
    }),
  });
};

const passangerEmergencyContactSchema = Joi.object({
  contactsData: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(2).max(30).required(),
        phone: Joi.string().required(),
      }),
    )
    .min(1)
    .max(5)
    .required(),
});

const tripDataSchemaPublicrides = Joi.object({
  startLocation: Joi.array()
    .items(Joi.number().min(-180).max(180), Joi.number().min(-90).max(90))
    .length(2)
    .required(),
  endLocation: Joi.array()
    .items(Joi.number().min(-180).max(180), Joi.number().min(-90).max(90))
    .length(2)
    .required(),
  stops: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        address: Joi.string().required(),
        location: Joi.array()
          .items(Joi.number().min(-180).max(180), Joi.number().min(-90).max(90))
          .length(2)
          .required(),
        waitingTime: Joi.number().required(),
        isReached: Joi.boolean().required(),
      }),
    )
    .min(2)
    .required(),
  vehicleType: Joi.string()
    .valid(
      SEDAN,
      SUV,
      AUTO,
      HATCHBACK,
      BIKE,
      ELECTRIC_SEDAN,
      ELECTRIC_SUV,
      ELECTRIC_AUTO,
      ELECTRIC_HATCHBACK,
      ELECTRIC_BIKE,
    )
    .required(),
  pickupTime: Joi.number(),
  passangerCount: Joi.number().required(),
  minFare: Joi.number().required(),
  maxFare: Joi.number().required(),
  estimatedDistance: Joi.number().required(),
  estimatedDuration: Joi.number().required(),
  bookingFor: Joi.string().valid("MYSELF", "OTHERS").required(),
  bookingForName: Joi.string().required(),
  bookingForPhone: Joi.string().required(),
  paymentMethod: Joi.string().required(),
  nightRide: Joi.boolean().required(),
  femaleOnly: Joi.boolean().required(),
  offerCoupon: Joi.string(),
  regionCode: Joi.string(),
  regionalOffice: Joi.string().allow(null),
  isScheduledTrip: Joi.boolean().optional(),
  scheduleDateTime: Joi.number().optional(),
  appVersion: Joi.string().optional(),
  buildNumber: Joi.string().optional(),
  estimatedWaitTime: Joi.number().optional(),
  rideMatchVersion: Joi.string().optional(),
});

const rideEstimationSchemaPublicrides = Joi.object({
  distance: Joi.number().required(),
  duration: Joi.number().required(),
  zone: Joi.string(),
  vehicleType: Joi.string(),
  regionCode: Joi.string(),
  coordinates: Joi.array()
    .items(Joi.number().min(-180).max(180), Joi.number().min(-90).max(90))
    .length(2)
    .required(),
});

const actingDriverTripSchemaPublicrides = Joi.object({
  startLocation: Joi.array()
    .items(Joi.number().min(-180).max(180), Joi.number().min(-90).max(90))
    .length(2)
    .required(),
  endLocation: Joi.array()
    .items(Joi.number().min(-180).max(180), Joi.number().min(-90).max(90))
    .length(2)
    .required(),
  stops: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        address: Joi.string().required(),
        location: Joi.array()
          .items(Joi.number().min(-180).max(180), Joi.number().min(-90).max(90))
          .length(2)
          .required(),
        waitingTime: Joi.number().required(),
        isReached: Joi.boolean().required(),
      }),
    )
    .min(2)
    .required(),
  vehicleType: Joi.string().optional(),
  passangerCount: Joi.number().required(),
  estimatedDistance: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  estimatedDuration: Joi.number().required(),
  // Acting driver specifics
  isActingDriverTrip: Joi.boolean().valid(true).required(),
  actingDriverHours: Joi.number().allow(null).optional(),
  passangerVehicleId: Joi.string().required(),
  passangerVehicleType: Joi.string().required(),
  // Duration fields
  duration: Joi.number().optional(),
  durationLabel: Joi.string().optional(),
  durationStart: Joi.number().optional(),
  durationEnd: Joi.number().optional(),
  startDate: Joi.number().optional(),
  endDate: Joi.number().optional(),
  // Car specification
  carSpecification: Joi.object({
    type: Joi.string().optional(),
    make: Joi.string().optional(),
    model: Joi.string().optional(),
    year: Joi.string().optional(),
    regNo: Joi.string().optional(),
    color: Joi.string().allow('').optional(),
  }).optional(),
  // Customer details
  customerName: Joi.string().optional(),
  customerPhone: Joi.string().optional(),
  // Booking details
  bookingFor: Joi.string().valid("MYSELF", "OTHERS").required(),
  bookingForName: Joi.string().allow("").optional(),
  bookingForPhone: Joi.string().allow("").optional(),
  paymentMethod: Joi.string().required(),
  nightRide: Joi.boolean().required(),
  femaleOnly: Joi.boolean().required(),
  offerCoupon: Joi.string().optional(),
  regionCode: Joi.string().optional(),
  regionalOffice: Joi.string().allow(null).optional(),
  appVersion: Joi.string().optional(),
  buildNumber: Joi.string().optional(),
  estimatedWaitTime: Joi.number().optional(),
  rideMatchVersion: Joi.string().optional(),
});

module.exports = {
  passangerSchema,
  bulkPassangersSchema,
  passangerUpdateSchema,
  passangerLoginSchema,
  passangerLogoutSchema,
  passangerSchemaPublicrides,
  tripDataSchemaPublicrides,
  passangerLoginSchemaPublicrides,
  rideEstimationSchemaPublicrides,
  passangerVerifyOTPSchemaPublicrides,
  passangerEmergencyContactSchema,
  actingDriverTripSchemaPublicrides,
};
