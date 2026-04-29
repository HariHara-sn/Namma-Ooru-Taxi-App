/* eslint-disable camelcase */
/* eslint-disable no-useless-escape */
const { driverPublicRidesVerifyOTPSchema, driverDetailsUploadSchema } = require("../../Schemas/DriverSchema")
const Driver = require("../../Models/Driver");
const Redis = require("../DB/Redis");
const { ObjectId } = require('mongodb');
const PublicRideRegionalOffices = require("../RegionalOffices/publicRideRegionalOffices");

module.exports = function (CLASS) {
     CLASS.prototype.verifyPublicRidesADOTP = async function (req, res) {
        try {
            const platform = req?.query?.platform;
            const schema = driverPublicRidesVerifyOTPSchema(platform);
            const [payload, errRes] = await this.validate(req.body, schema);
            if (!payload) return res.status(400).json(errRes);
            const driverCheck = await Driver.checkDriverExistWithPhoneOrEmail(payload);
            const otp = await Redis.getData(payload.phone);
            if (!otp) return res.status(400).json({ success: false, message: 'OTP expired' });
            if (Number(otp) !== payload.otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
            await Redis.removeKey(payload.phone);
            console.log('OTP verified successfully for phone:', driverCheck);
            if (driverCheck) {
                const driverDetails = await Driver.getDriverWithId(driverCheck._id);
                if (!driverDetails?.publicRidesDriver) return res.status(400).json({ success: false, message: 'Your Account Has Not Registered For Public Rides' });
                const token = await this.createDriverJWT({ driver: { id: driverCheck._id } }, process.env.JWT_SECRET_DRIVER, 'HS256');
                driverDetails.token = token;
                driverDetails.driverStatus= {status: 'online', updatedOn: new Date().getTime()} 
                driverDetails.isAvailable = true
                if (driverDetails.role !== 'acting_driver') {
                    await Driver.updateDriver(driverCheck._id, { role: 'acting_driver' });
                }
                // Set role based on vendor ID
                driverDetails.role = 'acting_driver';
                if (payload.fcmToken) {
                    // const driverDeviceImeiSet = new Set(driverDetails.fcmTokens?.map(fcmToken => fcmToken.deviceImei) || []);
                    // const driverFcmTokensSet = new Set(driverDetails.fcmTokens?.map(fcmToken => fcmToken.token) || []);
                    // if (!driverDeviceImeiSet.has(payload.fcmToken.deviceImei) || !driverFcmTokensSet.has(payload.fcmToken.token)) {
                    await Driver.updateDriverFcmToken(driverDetails._id, payload.fcmToken, payload.deviceMeta);
                    // }
                }
                return res.json({ success: true, message: 'OTP verified successfully', user: driverDetails });
            }
            delete payload.otp;
            payload.createdBy = "publicrides";
            payload.createdOn = new Date().getTime();
            payload.publicRidesDriver = true;
            payload.tripStatus = "NOTRIP"
            payload.role = "acting_driver"; // Set role as acting_driver for new driver
            const result = await Driver.addDriver(payload);
            const driverDetails = await Driver.getDriverWithId(result.insertedId);
            const token = await this.createDriverJWT({ driver: { id: driverDetails._id, publicRides: true } }, process.env.JWT_SECRET_DRIVER, 'HS256');
            driverDetails.token = token;
            if (payload.fcmToken) {
                // const driverDeviceImeiSet = new Set(driverDetails.fcmTokens?.map(fcmToken => fcmToken.deviceImei) || []);
                // const driverFcmTokensSet = new Set(driverDetails.fcmTokens?.map(fcmToken => fcmToken.token) || []);
                // if (!driverDeviceImeiSet.has(payload.fcmToken.deviceImei) || !driverFcmTokensSet.has(payload.fcmToken.token)) {
                await Driver.updateDriverFcmToken(driverDetails._id, payload.fcmToken, payload.deviceMeta);
                // }
            }
            return res.json({ success: true, message: 'OTP verified successfully', user: driverDetails });
        }catch (error) {
            return this.handleError(error, res);
        }
    }

     CLASS.prototype.updateDrivingExperience = async function (req, res) {
        try {
            const driverId = req.driver.id;
            console.log('Updating driving experience for driver ID:', driverId);
            if (!driverId) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const {
                drivingExperience,
                vehicleHandling,
            } = req.body;

            const update = {};

            if (drivingExperience && typeof drivingExperience === 'object') {
                const {
                    totalExperience,
                    commercialExperience,
                    hasPlatformExperience,
                    platforms,
                    approxTrips,
                    driverRating,
                } = drivingExperience;

                if (!totalExperience) {
                    return res.status(400).json({ success: false, message: 'totalExperience is required' });
                }

                update['experience.totalExperience'] = totalExperience;
                update['experience.commercialExperience'] = commercialExperience ?? '';
                update['experience.hasPlatformExperience'] = Boolean(hasPlatformExperience);
                update['experience.platforms'] = hasPlatformExperience && Array.isArray(platforms) ? platforms : [];
                update['experience.approxTrips'] = hasPlatformExperience ? (approxTrips ?? '') : '';
                update['experience.driverRating'] = hasPlatformExperience ? (driverRating ?? '') : '';
            }

            if (vehicleHandling && typeof vehicleHandling === 'object') {
                const {
                    vehicleTypes,
                    transmission,
                    fuelTypes,
                    nightDriving,
                    longDistance,
                } = vehicleHandling;

                if (!transmission) {
                    return res.status(400).json({ success: false, message: 'transmission is required' });
                }

                update['experience.vehicleTypes'] = Array.isArray(vehicleTypes) ? vehicleTypes : [];
                update['experience.transmission'] = transmission;
                update['experience.fuelTypes'] = Array.isArray(fuelTypes) ? fuelTypes : [];
                update['experience.nightDriving'] = Boolean(nightDriving);
                update['experience.longDistance'] = Boolean(longDistance);
            }

            if (Object.keys(update).length === 0) {
                return res.status(400).json({ success: false, message: 'No valid fields provided' });
            }

            await Driver.updateDriver(driverId, update);

            return res.json({ success: true, message: 'Experience updated successfully' });
        }
        catch (error) {
            return this.handleError(error, res);
        }
    }

    CLASS.prototype.updateActingDriverPreferredWorkLocation = async function (req, res) {
        try {
            const driverId = req.driver.id;
            const [payload, errRes] = await this.validate(req.body, driverDetailsUploadSchema);
            if (!payload) return res.status(400).json(errRes);
            const driver = await Driver.getDriverWithId(driverId);
            if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });
            if (!driver.publicRidesDriver) return res.status(400).json({ success: false, message: 'Driver is not a public rides driver' });
            payload.location = { type: "Point", coordinates: [Number(payload?.location[0]), Number(payload?.location[1])] };
            const regionalOfficeData = await PublicRideRegionalOffices.getRegionalOffices(payload.homeLocation.coordinates);
            if (regionalOfficeData) {
                payload.regionalOffice = new ObjectId(regionalOfficeData.regionOfficeId);
            } else {
                payload.regionalOffice = null;
            }
            // Acting drivers retain their approval status when updating location
            const updatedDriver = await Driver.updateDriverInformation(driverId, payload);
            return res.json({ success: true, message: 'Preferred work location updated successfully', driver: updatedDriver });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.updateDriverMode = async function (req, res) { 
        try {
            const driverId = req.driver.id;
            const { mode } = req.body;
            if (!mode || !['driver', 'acting_driver'].includes(mode)) {
                return res.status(400).json({ success: false, message: 'Invalid mode. Must be either "driver" or "acting_driver".' });
            }
            const driver = await Driver.getDriverWithId(driverId);
            if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });

            // 'driver' maps to ['dco'], 'acting_driver' maps to ['dco', 'acting_driver']
            const targetModes = mode === 'acting_driver' ? ['dco', 'acting_driver'] : ['dco'];
            const primaryMode = mode === 'acting_driver' ? 'acting_driver' : 'dco';

            const currentModes = Array.isArray(driver.mode) ? driver.mode : [];
            let updatedModes;
            if (currentModes.includes(primaryMode)) {
                // Toggle off: remove all target modes
                updatedModes = currentModes.filter(m => !targetModes.includes(m));
            } else {
                // Toggle on: add target modes (deduplicated)
                updatedModes = [...new Set([...currentModes, ...targetModes])];
            }

            await Driver.updateDriver(driverId, { mode: updatedModes });
            return res.json({ success: true, message: `Driver modes updated successfully`, modes: updatedModes });
        } catch (err) {
            return this.handleError(err, res);
        }
    }
}