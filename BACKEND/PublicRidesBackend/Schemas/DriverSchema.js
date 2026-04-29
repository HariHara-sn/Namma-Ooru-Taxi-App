const Joi = require('joi')
const VehicleType = require('../Core/PublicRides/VehicleType');
const FuelTypes = require('../Core/PublicRides/FuelTypes');

const driverSchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
    email: Joi.string().email().required(),
    gender: Joi.string().valid("male", "female").required(),
    password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})')).required(),
    activeDeviceId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/),
    /* MAKE IT REQUIRED AFTER INTEGRATION */
    username: Joi.string().required(),
})

const driverPublicRidesSchema = (platform) => {
    const imeiRule = platform === 'ios'
        ? Joi.string().min(5).max(100).required()
        : Joi.string().min(15).max(20).required();

    return Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
        email: Joi.string().email().required(),
        password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})')).required(),
        fcmTokens: Joi.array().items(
            Joi.object({
                deviceImei: imeiRule,
                token: Joi.string().required()
            })
        ),
    });
}

const vehiclePublicRideSchema = Joi.object({
    regNo: Joi.string().required(),
    type: Joi.string().valid(VehicleType.SEDAN, VehicleType.SUV, VehicleType.AUTO, VehicleType.HATCHBACK, VehicleType.BIKE, VehicleType.ELECTRIC_BIKE, VehicleType.ELECTRIC_SEDAN, VehicleType.ELECTRIC_SUV, VehicleType.ELECTRIC_AUTO, VehicleType.ELECTRIC_HATCHBACK).required(),
    color: Joi.string().required(),
    make: Joi.string().required(),
    model: Joi.string().required(),
    year: Joi.string().required(),
    fuelType: Joi.string().valid(FuelTypes.PETROL, FuelTypes.DIESEL, FuelTypes.CNG, FuelTypes.EV, FuelTypes.LPG, FuelTypes.PETROLCNG, FuelTypes.HYDROGEN).required(),
    // doc expiry
    insuranceExpiry: Joi.string().optional(),
    roadTaxExpiry: Joi.string().optional(),
    fitnessExpiry: Joi.string().optional(),
    pucExpiry: Joi.string().optional(),
    permitNumber: Joi.string().optional().allow('', null),
})

const driverLoginSchema = (platform) => {
    const imeiRule = platform === 'ios'
        ? Joi.string().min(5).max(100).required()
        : Joi.string().min(15).max(20).required();

    return Joi.object({
        username: Joi.string().required(),
        // email: Joi.string().email(),
        // phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/),
        password: Joi.string().required(),
        socketId: Joi.string(),
        fcmToken: Joi.object({
            deviceImei: imeiRule,
            token: Joi.string().required()
        })
    })
}

const driverDetailsUploadSchema = Joi.object({
    name: Joi.string(),
    phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/),
    alternatePhone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).allow('', null),
    email: Joi.string().email(),
    gender: Joi.string().valid("male", "female"),
    aadharNo: Joi.string().allow('', null),
    panNo: Joi.string(),
    licenseNo: Joi.string().allow('', null),
    homeLocation: Joi.object({
        coordinates: Joi.array().items(
            Joi.number().min(-90).max(90).required(),
            Joi.number().min(-180).max(180).required()
        ).required(),
        addressName: Joi.string(),
        type: Joi.string().default("Point")
    }),
    location: Joi.array()
})

const driverPublicRidesLoginSchema = () => {
    return Joi.object({
        phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
    })
}

const driverPublicRidesVerifyOTPSchema = (platform) => {
    const imeiRule = platform === 'ios'
        ? Joi.string().min(5).max(100).required()
        : Joi.string().min(15).max(20).required();

    return Joi.object({
        otp: Joi.number().required(),
        phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
        fcmToken: Joi.object({
            deviceImei: imeiRule,
            token: Joi.string().required()
        }),
        deviceMeta: Joi.object().optional()
    })
}

const driverBankDetailsSchema = Joi.object({
    accountNumber: Joi.string().pattern(/^[0-9]{9,18}$/).required(),
    accountHolderName: Joi.string().min(2).max(100).required(),
    bankName: Joi.string().min(2).max(100).required(),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
    branch: Joi.string().min(2).max(100).required(),
    UPIID: Joi.string().required(),
    passbookImage: Joi.string(),
    email: Joi.string().email().required(),
    address: Joi.string().required(),
})

const driverFuelLogSchema = Joi.object({
    driverId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/),
    deviceId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/),
    fuelType: Joi.string().valid("petrol", "disel", "lpg").required(),
    fuelRatePerUnit: Joi.number().required(),
    noOfUnits: Joi.number().required(),
    unitName: Joi.string().required(),
    cost: Joi.number().required(),
    location: Joi.object({
        time: Joi.date().iso().required(),
        coordinates: Joi.array().items(
            Joi.number().min(-90).max(90).required(),
            Joi.number().min(-180).max(180).required()
        ).required(),
    }),
    paymentType: Joi.string().required()
})

const driverLogoutSchema = (platform) => {
    const imeiRule = platform === 'ios'
        ? Joi.string().min(5).max(100).required()
        : Joi.string().min(15).max(20).required();

    return Joi.object({
        fcmToken: Joi.object({
            deviceImei: imeiRule,
            token: Joi.string().required()
        })
    });
}


const fleetDriverInsertSchema = Joi.object({
    phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
    fcmToken: Joi.object({
        token: Joi.string().required(),
        deviceImei: Joi.string().required()
    }).optional(),

    aadharNo: Joi.string().pattern(/^\d{12}$/).required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    licenseNo: Joi.string().required(),
    name: Joi.string().required(),
    panNo: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
    homeLocation: Joi.object({
        coordinates: Joi.array().items(
            Joi.number().required(),
            Joi.number().required()
        ).length(2).required(),
        addressName: Joi.string().required(),
        type: Joi.string().valid('Point').required()
    }).required(),
    location: Joi.object({
        type: Joi.string().valid('Point').required(),
        coordinates: Joi.array().items(
            Joi.number().required(),
            Joi.number().required()
        ).length(2).required(),
        tripId: Joi.string().optional()
    }).required(),
    bankDetails: Joi.object({
        accountHolderName: Joi.string().required(),
        accountNumber: Joi.string().required(),
        bankName: Joi.string().required(),
        ifscCode: Joi.string().required(),
        branch: Joi.string().required(),
        UPIID: Joi.string().allow('').optional()
    }).allow(null),
    documents: Joi.object({
        aadhar: Joi.string().allow('').optional(),
        drivingLicense: Joi.string().allow('').optional(),
        panCard: Joi.string().allow('').optional(),
        driverPhoto: Joi.string().allow('').optional(),
        passbookImage: Joi.string().allow('').optional(),
        pvc: Joi.string().allow('').optional(),
    }).optional(),
    fleetSysId: Joi.string().required(),
    fleetSysDriverId: Joi.string().required(),
});

const makeFieldsAndNestedObjectsOptional = (fields) => {
    const result = {};
    for (const [key, schema] of Object.entries(fields)) {
        if (schema.type === 'object' && schema._ids && schema._ids._byKey) {
            const nestedFields = {};
            for (const nested of schema._ids._byKey.values()) {
                nestedFields[nested.key] = nested.schema.optional();
            }
            result[key] = Joi.object(nestedFields).optional();
        } else {
            result[key] = schema.optional();
        }
    }
    return result;
};


const fleetDriverInsertFields = {};
for (const [key, value] of fleetDriverInsertSchema._ids._byKey) {
    fleetDriverInsertFields[key] = value.schema;
}

const fleetDriverUpdateSchema = Joi.object({
    fleetSysId: Joi.string().required(),
    fleetSysDriverId: Joi.string().required(),
    ...makeFieldsAndNestedObjectsOptional(fleetDriverInsertFields)
});

const fleetDriverDeleteSchema = Joi.object({
    fleetSysId: Joi.string().required(),
    fleetSysDriverId: Joi.string().required(),
});

const fleetDriverGetSchema = Joi.object({
    fleetSysId: Joi.string().required(),
    fleetSysDriverId: Joi.string().required()
});

const driverDeleteAccountSchema = Joi.object({
    phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
    otp: Joi.number().required(),
    role: Joi.string().valid('dco', 'salaried').required(),
    vehicleId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
});

module.exports = {
    vehiclePublicRideSchema, driverPublicRidesSchema, driverPublicRidesLoginSchema, driverSchema, driverLoginSchema, driverFuelLogSchema, driverLogoutSchema, driverDetailsUploadSchema, driverPublicRidesVerifyOTPSchema,
    driverBankDetailsSchema, fleetDriverInsertSchema, fleetDriverUpdateSchema, fleetDriverDeleteSchema, fleetDriverGetSchema, driverDeleteAccountSchema
}
