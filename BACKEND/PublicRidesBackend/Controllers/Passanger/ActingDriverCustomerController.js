const { ObjectId } = require('mongodb');
const Garage = require('../../Models/Garage');
const Passanger = require('../../Models/Passanger');
const Trip = require('../../Models/Trip');
const RideStatus = require('../../Core/PublicRides/RideStatus');
const OTP = require('../../Controllers/OTP');
const FareEngineInterface = require('../../fareEngine/FareEngineInterface');
const {
    garageVehicleSchema,
    garageVehicleUpdateSchema,
    actingDriverTripSchema
} = require('../../Schemas/ActingDriverSchema');

const TRIP_TYPES = {
    ONEWAY: 'ONEWAY',
    ROUNDTRIP: 'ROUNDTRIP',
    OUTSTATION: 'OUTSTATION'
};

function normalizeRegNo(regNo) {
    return String(regNo || '').trim().toUpperCase().replace(/\s+/g, '');
}

function createRideId(regionCode, tripType) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const currentDate = `${day}${month}${year}`;
    const random5digits = Math.floor(10000 + Math.random() * 90000);
    const prefix = tripType === TRIP_TYPES.OUTSTATION ? 'ADO' : 'AD';
    return `${prefix}${regionCode}${currentDate}${random5digits}`;
}

function buildVehicleSnapshot(vehicle) {
    return {
        garageVehicleId: vehicle._id,
        vehicleType: vehicle.vehicleType,
        make: vehicle.make,
        vehicleName: vehicle.vehicleName,
        vehicleSpecification: vehicle.vehicleSpecification || {},
        features: vehicle.features || [],
        transmission: vehicle.transmission || [],
        maxSpeed: vehicle.maxSpeed || 50,
        model: vehicle.model || '',
        year: vehicle.year || '',
        fuelType: vehicle.fuelType || '',
        color: vehicle.color || '',
        regNo: vehicle.regNo
    };
}

module.exports = function (CLASS) {
    CLASS.prototype.manageGarageCreate = async function (req, res) {
        try {
            const [payload, error] = await this.validate(req.body, garageVehicleSchema);
            if (!payload) return res.status(400).json(error);

            const passengerId = req.passanger.id;
            const passenger = await Passanger.getPassangerWithId(passengerId);
            if (!passenger) return res.status(400).json({ success: false, message: 'Passanger not found' });

            payload.regNo = normalizeRegNo(payload.regNo);
            const existingVehicle = await Garage.getVehicleByRegNo(payload.regNo);
            if (existingVehicle) {
                return res.status(409).json({ success: false, message: 'Vehicle registration number already exists' });
            }

            const vehicleDoc = {
                ...payload,
                passengerId: new ObjectId(passengerId),
                source: 'acting_driver_garage',
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await Garage.addVehicle(vehicleDoc);
            await Passanger.addPassangerVehicleId(passengerId, result.insertedId.toString());

            return res.json({
                success: true,
                message: 'Garage vehicle added successfully',
                vehicle: { ...vehicleDoc, _id: result.insertedId }
            });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.manageGarageList = async function (req, res) {
        try {
            const passengerId = req.passanger.id;
            const vehicles = await Garage.getPassengerVehicles(passengerId);
            return res.json({ success: true, vehicles: vehicles || [] });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.manageGarageUpdate = async function (req, res) {
        try {
            const vehicleId = req.params.vehicleId || req.body.vehicleId;
            if (!vehicleId) return res.status(400).json({ success: false, message: 'vehicleId is required' });

            const updateBody = req.body.vehicleInfo || { ...req.body };
            delete updateBody.vehicleId;

            const [payload, error] = await this.validate(updateBody, garageVehicleUpdateSchema);
            if (!payload) return res.status(400).json(error);
            delete payload.passengerId;

            if (payload.regNo) {
                payload.regNo = normalizeRegNo(payload.regNo);
                const existingVehicle = await Garage.getVehicleByRegNo(payload.regNo);
                if (existingVehicle && existingVehicle._id.toString() !== vehicleId) {
                    return res.status(409).json({ success: false, message: 'Vehicle registration number already exists' });
                }
            }

            const passengerId = req.passanger.id;
            payload.updatedAt = new Date();
            const result = await Garage.updateVehicle(passengerId, vehicleId, payload);
            if (result.matchedCount === 0) {
                return res.status(404).json({ success: false, message: 'Garage vehicle not found' });
            }

            const vehicle = await Garage.getPassengerVehicleById(passengerId, vehicleId);
            return res.json({ success: true, message: 'Garage vehicle updated successfully', vehicle });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.manageGarageDelete = async function (req, res) {
        try {
            const vehicleId = req.params.vehicleId || req.body.vehicleId;
            if (!vehicleId) return res.status(400).json({ success: false, message: 'vehicleId is required' });

            const passengerId = req.passanger.id;
            const result = await Garage.deleteVehicle(passengerId, vehicleId);
            if (result.matchedCount === 0) {
                return res.status(404).json({ success: false, message: 'Garage vehicle not found' });
            }

            await Passanger.removePassangerVehicleId(passengerId, vehicleId);
            return res.json({ success: true, message: 'Garage vehicle deleted successfully' });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.bookActingDriverOnewayTrip = async function (req, res) {
        return this.bookActingDriverTripByType(req, res, TRIP_TYPES.ONEWAY);
    }

    CLASS.prototype.bookActingDriverRoundTrip = async function (req, res) {
        return this.bookActingDriverTripByType(req, res, TRIP_TYPES.ROUNDTRIP);
    }

    CLASS.prototype.bookActingDriverOutstationTrip = async function (req, res) {
        return this.bookActingDriverTripByType(req, res, TRIP_TYPES.OUTSTATION);
    }

    CLASS.prototype.bookActingDriverTripByType = async function (req, res, tripType) {
        try {
            const [payload, error] = await this.validate(req.body, actingDriverTripSchema);
            if (!payload) return res.status(400).json(error);

            if (tripType === TRIP_TYPES.ROUNDTRIP && !payload.returnPickupTime) {
                return res.status(400).json({ success: false, message: 'returnPickupTime is required for roundtrip' });
            }

            const passengerId = req.passanger.id;
            const passenger = await Passanger.getPassangerWithId(passengerId);
            if (!passenger) return res.status(400).json({ success: false, message: 'Passanger does not exists' });

            const garageVehicleId = payload.garageVehicleId || payload.passangerVehicleId;
            const garageVehicle = await Garage.getPassengerVehicleById(passengerId, garageVehicleId);
            if (!garageVehicle) {
                return res.status(404).json({ success: false, message: 'Garage vehicle not found for this passenger' });
            }

            const regionalCode = payload?.regionCode === 'default' ? 'NOT' : (payload?.regionCode || 'NOT');
            const offerCoupon = payload.offerCoupon || null;
            const tripPayload = {
                ...payload,
                rideId: createRideId(regionalCode, tripType),
                bookingTime: new Date().getTime(),
                status: RideStatus.PENDING,
                publicRidesTrip: true,
                isActingDriverTrip: true,
                actingDriverTripType: tripType,
                passangerId: new ObjectId(passengerId),
                createdBy: passengerId,
                userId: passengerId,
                passangerVehicleId: new ObjectId(garageVehicleId),
                garageVehicleId: new ObjectId(garageVehicleId),
                passangerVehicleType: garageVehicle.vehicleType,
                vehicleType: garageVehicle.vehicleType,
                passengerVehicle: buildVehicleSnapshot(garageVehicle),
                otp: OTP.generateOTP(4)
            };

            delete tripPayload.offerCoupon;

            if (tripPayload.regionalOffice) {
                tripPayload.regionalOffice = new ObjectId(tripPayload.regionalOffice);
            }

            if (Array.isArray(passenger.notificationPreferences) && passenger.notificationPreferences.length > 0) {
                tripPayload.passengerNotificationPreferences = passenger.notificationPreferences;
            }

            const trip = await Trip.addTrip(tripPayload);
            const tripDetails = await Trip.getTripById(trip?.insertedId);

            if (trip?.insertedId) {
                await Passanger.updatePassangerLatestTripId(passengerId, trip.insertedId);
            }

            if (offerCoupon) {
                const { fareService } = FareEngineInterface.getServices();
                const coupon = await fareService.verifyAndApplyCoupon({
                    tripId: String(trip?.insertedId),
                    couponCode: offerCoupon,
                    fare: tripDetails?.minFare || 0,
                    regionCode: payload?.regionCode,
                });
                if (!coupon?.success) console.error('Acting driver coupon not applied');
            }

            return res.json({
                success: true,
                message: 'Acting driver trip booked successfully',
                tripId: trip?.insertedId,
                trip: tripDetails
            });
        } catch (err) {
            return this.handleError(err, res);
        }
    }
}
