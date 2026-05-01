const Joi = require('joi');

const locationSchema = Joi.array().items(
    Joi.number().min(-180).max(180),
    Joi.number().min(-90).max(90)
).length(2);

const stopSchema = Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    location: locationSchema.required(),
    waitingTime: Joi.number().default(0),
    isReached: Joi.boolean().default(false)
});

const garageVehicleSchema = Joi.object({
    userName: Joi.string().trim().required(),
    phoneNumber: Joi.string().trim().required(),
    userGender: Joi.string().required(),
    userEmail: Joi.string().email().allow('').optional(),
    passengerId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).allow(null).optional(),
    vehicleType: Joi.string().valid('hatchback', 'sedan', 'suv', 'muv', 'bike', '').default(''),
    make: Joi.string().trim().allow('').default(''),
    vehicleName: Joi.string().trim().required(),
    vehicleSpecification: Joi.object().default({}),
    features: Joi.array().items(Joi.string()).default([]),
    transmission: Joi.array().items(Joi.string()).default([]),
    maxSpeed: Joi.number().default(50),
    model: Joi.string().allow('').default(''),
    year: Joi.string().allow('').default(''),
    fuelType: Joi.string().valid('petrol', 'diesel', 'electric', 'hybrid', 'cng', '').default(''),
    color: Joi.string().allow('').default(''),
    regNo: Joi.string().trim().required()
});

const garageVehicleUpdateSchema = garageVehicleSchema.fork(
    ['userName', 'phoneNumber', 'userGender', 'vehicleName', 'regNo'],
    field => field.optional()
).min(1);

const actingDriverTripSchema = Joi.object({
    startLocation: locationSchema.required(),
    endLocation: locationSchema.required(),
    stops: Joi.array().items(stopSchema).min(2).required(),
    garageVehicleId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    passangerVehicleId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    pickupTime: Joi.number().optional(),
    returnPickupTime: Joi.number().optional(),
    passangerCount: Joi.number().required(),
    estimatedDistance: Joi.number().required(),
    estimatedDuration: Joi.number().required(),
    actingDriverHours: Joi.number().allow(null).optional(),
    bookingFor: Joi.string().valid('MYSELF', 'OTHERS').required(),
    bookingForName: Joi.string().allow('').optional(),
    bookingForPhone: Joi.string().allow('').optional(),
    paymentMethod: Joi.string().required(),
    nightRide: Joi.boolean().required(),
    femaleOnly: Joi.boolean().required(),
    minFare: Joi.number().optional(),
    maxFare: Joi.number().optional(),
    offerCoupon: Joi.string().optional(),
    regionCode: Joi.string().optional(),
    regionalOffice: Joi.string().allow(null).optional(),
    isScheduledTrip: Joi.boolean().optional(),
    scheduleDateTime: Joi.number().optional(),
    appVersion: Joi.string().optional(),
    buildNumber: Joi.string().optional(),
    estimatedWaitTime: Joi.number().optional(),
    rideMatchVersion: Joi.string().optional(),
}).or('garageVehicleId', 'passangerVehicleId');

module.exports = {
    garageVehicleSchema,
    garageVehicleUpdateSchema,
    actingDriverTripSchema
};
