const Joi = require('joi')

const singleLocationSchema = Joi.object({
    time: Joi.date().iso().required(),
    location: Joi.array().items(Joi.number().min(-90).max(90).required(), Joi.number().min(-180).max(180).required()),
    speed: Joi.number(),
    accuracy: Joi.number(),
    altitude: Joi.number(),
    altitudeAccuracy: Joi.number(),
    bearing: Joi.number(),
    heading: Joi.number(),
    battery: Joi.number(),
    engineOn: Joi.boolean(),
    activity: Joi.string().allow(null),
    duration: Joi.number()
});

const locationSchema = Joi.object({
    // imei: Joi.string().required(),
    // deviceName: Joi.string().required(),
    id: Joi.string().required(), //deviceId,userId
    sessionId: Joi.string(), //sessionId,TripId
    sessionName: Joi.string(), //sessionName,TripName
    deviceType: Joi.string().required(), //mobile,gpsdevice
    locations: Joi.array().items(singleLocationSchema).required(),
    completed: Joi.boolean(),
    duration: Joi.number()
})

const externalGpsLocationSchema = Joi.object({
    sessionId: Joi.string(), //sessionId,TripId
    sessionName: Joi.string(), //sessionName,TripName
    deviceType: Joi.string().required(), //externalGpsDevice
    completed: Joi.boolean(),
    externalGpsDevices: Joi.object({
        authkey: Joi.string(),
        vendor: Joi.string(),
        data: Joi.array().required(),
    }).required()
});


module.exports = { locationSchema, externalGpsLocationSchema };
