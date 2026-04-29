const Joi = require('joi');

const vehicleSchema = Joi.object({
    driverId: Joi.string().optional(),
    fleetSysId: Joi.string().optional(),
    fleetSysVehicleId: Joi.string().optional(),
    fuel: Joi.string().required(),
    make: Joi.string().required(),
    model: Joi.string().required(),
    type: Joi.string().required(),
    year: Joi.string().pattern(/^\d{4}$/).required(),
    ownerId: Joi.string().allow(''),
    available: Joi.boolean().optional(),
    color: Joi.string().required(),
    regNo: Joi.string().required(),
    insuranceExpiry: Joi.number().required(),
    roadTaxExpiry: Joi.number().required(),
    fitnessExpiry: Joi.number().required(),
    pucExpiry: Joi.number().required(),
    permitExpiry: Joi.number().required(),
    permitNumber: Joi.string().allow('').required(),
    documents: Joi.object({
        roadTaxDoc: Joi.string().allow('').optional(),
        permitDoc: Joi.string().allow('').optional(),
        fitnessDoc: Joi.string().allow('').optional(),
        pucDoc: Joi.string().allow('').optional(),
        insurance: Joi.string().allow('').optional(),
        vehicleRcDoc: Joi.string().allow('').optional(),
        vehiclePhoto: Joi.string().allow('').optional()
    }).optional(),
    vendorId: Joi.string().optional()
});

const vehicleUpdateSchema = Joi.object({
    vehicleId: Joi.string().required(),
    fleetSysId: Joi.string().optional(),
    fleetSysVehicleId: Joi.string().optional(),
    driverId: Joi.string().optional(),
    fuel: Joi.string().optional(),
    make: Joi.string().optional(),
    model: Joi.string().optional(),
    type: Joi.string().optional(),
    year: Joi.string().pattern(/^\d{4}$/).optional(),
    ownerId: Joi.string().optional(),
    available: Joi.boolean().optional(),
    color: Joi.string().optional(),
    regNo: Joi.string().optional(),
    insuranceExpiry: Joi.number().optional(),
    roadTaxExpiry: Joi.number().optional(),
    fitnessExpiry: Joi.number().optional(),
    pucExpiry: Joi.number().optional(),
    permitExpiry: Joi.number().optional(),
    permitNumber: Joi.string().allow('').optional(),
    documents: Joi.object({
        roadTaxDoc: Joi.string().allow('').optional(),
        permitDoc: Joi.string().allow('').optional(),
        fitnessDoc: Joi.string().allow('').optional(),
        pucDoc: Joi.string().allow('').optional(),
        insurance: Joi.string().allow('').optional(),
        vehicleRcDoc: Joi.string().allow('').optional(),
        vehiclePhoto: Joi.string().allow('').optional()
    }).optional(),
    vendorId: Joi.string().optional()
});

const vehicleDeleteSchema = Joi.object({
    vehicleId: Joi.string().optional(),
    fleetSysId: Joi.string().optional(),
    fleetSysVehicleId: Joi.string().optional(),
    vendorId: Joi.string().optional()
});

const vehicleStatusSchema = Joi.object({
    fleetSysId: Joi.string().required(),
    fleetSysVehicleId: Joi.string().required(),
    vendorId: Joi.string().optional()
});

module.exports = {
    vehicleSchema, vehicleUpdateSchema, vehicleDeleteSchema, vehicleStatusSchema
};
