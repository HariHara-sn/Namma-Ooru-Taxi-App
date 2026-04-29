const Joi = require('joi');

const vendorSchema = Joi.object({
    fleetSysId: Joi.string().required(),
    VendorName: Joi.string().required(),
    OwnerName: Joi.string().required(),
    documents: Joi.object({
        aadhar: Joi.string().allow(''),
        ownerPAN: Joi.string().allow(''),
        companyPAN: Joi.string().allow(''),
        cin: Joi.string().allow(''),
        gst: Joi.string().allow(''),
        ownerPic: Joi.string().allow(''),
        ownerProof: Joi.string().allow(''),
        pan: Joi.string().allow(''),
        tan: Joi.string().allow('')
    }).required(),
    UPIId: Joi.string().required(),
    location: Joi.object({
        type: Joi.string().valid('Point').required(),
        coordinates: Joi.array().items(
            Joi.number().required(), // longitude, latitude
            Joi.number().required()
        ).length(2).required()
    }).required(),
    bankDetails: Joi.object({
        bankName: Joi.string().required(),
        ifsc: Joi.string().required(),
        branch: Joi.string().required(),
        accountHolderName: Joi.string().required(),
        accountNumber: Joi.string().required()
    }).required(),
    isApproved: Joi.boolean().default(false),
    isActive: Joi.boolean().default(false),
    isBlocked: Joi.boolean().default(false),
    ownerPhone: Joi.number().required(),
    ownerEmail: Joi.string().email().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    fullAddress: Joi.string().required(),
    state: Joi.string().required(),
    ownerProof: Joi.string().required(),
    gst: Joi.string().required(),
    companyPANNumber: Joi.string().allow(''),
    regionalOffice: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional()
});

const vendorApproveStatusSchema = Joi.object({
    fleetSysId: Joi.string().required()
})

const removeVendorSchema = Joi.object({
    fleetSysId: Joi.string().required()
})

module.exports = {
    vendorSchema,
    vendorApproveStatusSchema,
    removeVendorSchema
};
