const { ObjectId } = require('mongodb');
const Mongo = require('../Controllers/DB/Mongo');
const { DatabaseUpdateFailed, DatabaseInsertFailed } = require('./Exeptions');
const DriverDueDate = require('../Controllers/DriverDueDate/DriverDueDate');

const COLLECTION_NAME = 'drivers'
const WRK_HISTORY_COLLECTION = 'driverWorkHistory'

/**
 * Represents a drivers entity with methods to interact with driver data in the database.
 */
class Driver {
    static updateVehicleInformation = async (driverId, vehicle ) => {
        const existingVehicle = await Mongo.findOne('vehicles', { driverId: driverId} );
        if (existingVehicle) {
            await Mongo.updateOneRaw(
                'vehicles',
                { _id: new ObjectId(existingVehicle._id) },
                { $set: vehicle }
            );
            const updateResult = await Mongo.updateOne(
                'drivers',
                { _id: new ObjectId(driverId) },
                { vehicleId: existingVehicle._id.toString() } 
            );
            return updateResult;
        } else {
            const insertResult = await Mongo.insertOne('vehicles', vehicle );
            if (!insertResult?.insertedId) {
                throw new Error('Failed to insert vehicle');
            }
            const vehicleId = insertResult.insertedId.toString();
            const updateResult = await Mongo.updateOne(
                'drivers',
                { _id: new ObjectId(driverId) },
                { vehicleId: vehicleId }
            );
            return updateResult;
        }
    }


    static updateDriverInformation = async (driverId, payload) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(driverId) }, payload);
        // if (payload?.homeLocation) {
        //     await Mongo.createIndex(COLLECTION_NAME, { homeLocation: "2dsphere" });
        // }
        // if(payload?.location){
        //     await Mongo.createIndex(COLLECTION_NAME, { location: "2dsphere" });
        // }
        return result;
    }

    static getPublicRidesDriverNearbyLocation = async (location, maxDistance, limit = 5, vehicleType = null) => {
        const query = {
            homeLocation: {
                $near: {
                    $geometry: location,
                    $maxDistance: maxDistance
                }
            },
            publicRidesDriver: true,
            tripStatus: "NOTRIP"
        };
        
        if (vehicleType) {
            query["ownVehicleInfo.vehicleType"] = vehicleType;
        }
        
        const result = await Mongo.findPagination(
            COLLECTION_NAME,
            query,
            0,
            limit
        );
        
        
        return result;
    }

    // Rewritten to avoid $near/$geoNear as per MongoDB error, using $geoWithin instead

    static getDriverNearbyLocation = async (location, maxDistance, limit = 10, vehicleTypes = '') => {
        if (!location || typeof location !== 'object' || !location.type || !location.coordinates) {
            throw new Error('Invalid location object');
        }
        if (!maxDistance || typeof maxDistance !== 'number') {
            throw new Error('Invalid maxDistance');
        }

        // Calculate a bounding sphere for $geoWithin
        // maxDistance is in meters, Earth's radius is ~6378137 meters
        // Convert maxDistance to radians for $centerSphere
        const earthRadiusInMeters = 6378137;
        const radiusInRadians = maxDistance / earthRadiusInMeters;

        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);

        const query = {
            location: {
                $geoWithin: {
                    $centerSphere: [location.coordinates, radiusInRadians]
                }
            },
            'location.updatedAt': { $gte: tenMinutesAgo },
            publicRidesDriver: true,
            isAvailable: true,
        };

        

        console.log('Query for nearby drivers:', JSON.stringify(query));

        // Normalize vehicleTypes to an array of strings if provided
        let vehicleTypesArray = [];
        if (Array.isArray(vehicleTypes)) {
            vehicleTypesArray = vehicleTypes.filter(v => typeof v === 'string' && v.trim().length > 0).map(v => v.trim());
        } else if (typeof vehicleTypes === 'string' && vehicleTypes.trim().length > 0) {
            vehicleTypesArray = vehicleTypes.split(',').map(v => v.trim()).filter(v => v.length > 0);
        }

        let result;
        try {
            // Use aggregation to join vehicles collection and get vehicleType
            const pipeline = [
                { $match: query },
                {
                    $addFields: {
                        vehicleObjectId: {
                            $cond: [
                                { $and: [
                                    { $ne: ["$vehicleId", null] },
                                    { $ne: ["$vehicleId", ""] }
                                ] },
                                { $toObjectId: "$vehicleId" },
                                null
                            ]
                        }
                    }
                },
                {
                    $lookup: {
                        from: "vehicles",
                        localField: "vehicleObjectId",
                        foreignField: "_id",
                        as: "vehicleInfo"
                    }
                },
                {
                    $addFields: {
                        vehicleType: {
                            $cond: [
                                { $gt: [ { $size: "$vehicleInfo" }, 0 ] },
                                {
                                    $ifNull: [
                                        { $arrayElemAt: [ "$vehicleInfo.vehicleType", 0 ] },
                                        { $arrayElemAt: [ "$vehicleInfo.type", 0 ] }
                                    ]
                                },
                                null
                            ]
                        }
                    }
                },
                // If vehicleTypes filter provided, apply it against resolved vehicleType
                ...(vehicleTypesArray.length > 0 ? [
                    { $match: { vehicleType: { $in: vehicleTypesArray } } }
                ] : []),
                {
                    $project: {
                        _id: 1,
                        location: 1,
                        vehicleType: 1,
                        gender: 1,
                        isTrusted: { $ifNull: [ "$isTrusted", false ] }
                    }
                },
                { $limit: limit }
            ];

            result = await Mongo.aggregate(COLLECTION_NAME, pipeline);
            console.log('Nearby drivers found:', JSON.stringify(result));
        } catch (err) {
            throw new Error('Error fetching nearby drivers: ' + err.message);
        }

        return result;
    }
    static checkDriverExistWithPhoneOrEmailOrUsername = async ( payload ) => {
        let query = {};
        if ( payload.email && payload.phone && payload.username ) {
            query = { $or: [{ email: payload.email }, { phone: payload.phone }, { username: payload.username }] };
        } else if ( payload.email ) {
            query = { email: payload.email };
        } else if ( payload.phone ) {
            query = { phone: payload.phone };
        } else if ( payload.username ) {
            query = { username: payload.username };
        }

        const passanger = await Mongo.findOne( COLLECTION_NAME, query );
        return passanger
    }

    static checkDriverExistWithPhoneOrEmail = async ( payload ) => {
        let query = {};
        if ( payload.email && payload.phone ) {
            query = { $or: [{ email: payload.email }, { phone: payload.phone }] };
        } else if ( payload.email ) {
            query = { email: payload.email };
        } else if ( payload.phone ) {
            query = { phone: payload.phone };
        }
        const driver = await Mongo.findOne( COLLECTION_NAME, query );
        return driver
    }

    static getDriverWithUsername(payload) {
        if (payload.username) return Mongo.findOne(COLLECTION_NAME, { username: payload.username });
    }

    static addDriver = async ( user ) => {
        const result = await Mongo.insertOne( COLLECTION_NAME, user );
        return result;
    }
    
    static getDriverWithId = async (driverId) => {
        const pipeline = [
            {
                $match: {
                    _id: new ObjectId(driverId)
                }
            },
            {
                $addFields: {
                    vehicleObjectId: { $toObjectId: "$vehicleId" }
                }
            },
            {
                $lookup: {
                    from: 'vehicles',
                    localField: 'vehicleObjectId',
                    foreignField: '_id',
                    as: 'ownVehicleInfo'
                }
            },
            {
                $unwind: {
                    path: '$ownVehicleInfo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    password: 0,
                    vehicleObjectId: 0
                }
            }
        ];
          
        const results = await Mongo.aggregate(COLLECTION_NAME, pipeline);
        return results[0] || null;
    }

    static getDriverWithIds = async ( driverIds ) => {
        const Ids = driverIds.map(id => new ObjectId(id));
        const result = await Mongo.find(COLLECTION_NAME, { _id: { $in: Ids } });
        return result;
    }

    static getDriverWithUser = async ( userId, driverId ) => {
        const result = await Mongo.findOneProjection( COLLECTION_NAME, { _id: new ObjectId( driverId ), createdBy: userId }, { password: 0 } );
        return result
    }

    static getAllDrivers = async ( userId ) => {
        const result = await Mongo.findProjection(COLLECTION_NAME, { createdBy: userId }, { password: 0 });
        return result
    }

    static updateDriver = async (driverId, data) => {
        const result = await Mongo.updateOne( COLLECTION_NAME, { _id: new ObjectId(driverId) }, data );
        if ( result.acknowledged ) return result
        else throw new DatabaseUpdateFailed( 'Failed to update driver in databse -- Update Failed' );
    }

    static updateDriverDueDate = async (driverId, driverDueDate) => {
        const nextDueDate = DriverDueDate.calculateNextDueDate(driverDueDate);
        const result = await Mongo.updateOne( COLLECTION_NAME, { _id: new ObjectId(driverId) }, { nextDueDate: nextDueDate, dueCycle: driverDueDate, isBlocked: false } );
        if ( result.acknowledged ) return {result, nextDueDate}
        else throw new DatabaseUpdateFailed( 'Failed to update driver in databse -- Update Failed' );
    }

    static updateDriverFcmToken = async ( driverId, fcmToken, deviceMeta ) => {
        /* remove existing device Imei from other drivers's data */
        // await Mongo.updateManyRaw(COLLECTION_NAME, { "fcmTokens.deviceImei": fcmToken.deviceImei }, { $pull: { fcmTokens: { deviceImei: fcmToken.deviceImei } } });

        // update the device imei into the current login drivers's data
        // await Mongo.updateOneAddToSet(COLLECTION_NAME, { _id: new ObjectId(driverId) }, { fcmTokens: fcmToken });
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(driverId) }, { fcmToken: fcmToken, deviceMeta: deviceMeta });
        return result;
    }

    static setVehicle = async ( driverId, deviceData ) => {
        const result = await Mongo.updateOne( COLLECTION_NAME, { _id: new ObjectId(driverId) }, { activeDevice: deviceData } );
        return result;
    }

    static removeVehicle = async ( driverId, deviceId ) => {
        const result = await Mongo.updateOne( COLLECTION_NAME, { _id: new ObjectId(driverId), 'activeDevice.id': deviceId }, { activeDevice: null } );
        return result;
    }

    static removeUserFcmTokenDeviceImei = async (id, fcmToken) => {
        const result = await Mongo.updateOnePull(COLLECTION_NAME, { _id: new ObjectId(id) }, { fcmTokens: { deviceImei: fcmToken.deviceImei } });
        return result;
    }

    static updateLiveStatsAndLocation = async (driverId, location, liveStats) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(driverId) }, { location, liveStats });
        return result;
    }
    static uploadDriverDocs = async (driverId, files) => {
        const vehicleDocuments = {};
        const driverDocuments = {};
        
        // Define vehicle-related document fields
        const vehicleDocFields = [
            "roadTaxDoc", "permitDoc", "fitnessDoc", "pucDoc", 
            "insurance", "vehicleRcDoc", "vehiclePhoto", "vehicleRcDocBackSide"
        ];
        
        for (const [key, value] of Object.entries(files)) {
            if (vehicleDocFields.includes(key)) {
                vehicleDocuments[`documents.${key}`] = value;
            } else {
                driverDocuments[`documents.${key}`] = value;
            }
        }
        
        const results = {};
        
        // Update vehicle documents if any
        if (Object.keys(vehicleDocuments).length > 0) {
            const driver = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(driverId) });
            if (driver?.vehicleId) {
                const vehicleResult = await Mongo.updateOne(
                    'vehicles',
                    { _id: new ObjectId(driver.vehicleId) },
                    vehicleDocuments
                );
                results.vehicleUpdate = vehicleResult;
            }
        }
        
        // Update driver documents if any
        if (Object.keys(driverDocuments).length > 0) {
            const driverResult = await Mongo.updateOne(
                COLLECTION_NAME,
                { _id: new ObjectId(driverId) },
                driverDocuments
            );
            results.driverUpdate = driverResult;
        }
        
        return results;
    };

    static uploadDriverBankDetails = async (driverId, bankDetails, fileUrl) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, 
            { _id: new ObjectId(driverId) }, 
            { 
                bankDetails: bankDetails,
                'documents.passbookImage': fileUrl
            }
        );
        return result;
    }

    static getVehiclesWithRegNum = async (vehicleNum) => {
        const result = await Mongo.findOne('vehicles', { regNo: vehicleNum});
        return result;
    }
    static updateDriverRating = async (driverId, rating) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(driverId) }, { ratingData: rating });
        return result;
    }
    static removeDriverFromVendor = async (vendorId) => {
        // Use updateManyRaw to allow $unset and $set operators in the update document
        const result = await Mongo.updateManyRaw(
            COLLECTION_NAME,
            { vendorId: vendorId },
            {
                $unset: { vendorId: "", vehicleId: "" },
                $set: { role: "doc", bankDetails: null }
            }
        );
        return result;
    }

    static updateDriverPayment = async (driverDetails, earnings, tripId, driverDueDate) => {
        let nextDueDate = null;
    
        // Only calculate new due date if not already set
        if (!driverDetails?.nextDueDate && driverDueDate) {
            nextDueDate = DriverDueDate.calculateNextDueDate(driverDueDate);
        }
    
        // Initialize driver first if fields don't exist
        await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: driverDetails._id },
            {
                $setOnInsert: {
                    driverEarnings: 0,
                    driverDue: 0,
                },
            },
            { upsert: true }
        );
    
        const updatePayload = {
            $set: {
                currentTripId: tripId,
                updatedAt: new Date().getTime(),
                isAvailable: true,
            },
            $inc: {
                driverEarnings: earnings.driverEarnings || 0,
                driverDue: earnings.driverDue || 0,
            },
        };
    
        // Only set nextDueDate if newly calculated
        if (nextDueDate) {
            updatePayload.$set.nextDueDate = nextDueDate;
            updatePayload.$set.dueCycle = driverDueDate;
        }
    
        await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: driverDetails._id },
            updatePayload
        );
    
        return nextDueDate;
    };
    
    static removePublicRidesDriverVehicle = async (driverId) => {
        const vehicleUpdate = await Mongo.updateOne('vehicles', { driverId: driverId }, { driverId: null });
        const driverUpdate = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(driverId) }, { vehicleId: null });
        return vehicleUpdate.acknowledged && driverUpdate.acknowledged;
    }

    static updatePublicRidesDriverVehicle = async (driverId, vehicleId) => {
        const vehicleUpdate = await Mongo.updateOne('vehicles', 
            { 
                _id: new ObjectId(vehicleId),
                driverId: null // Only update if not assigned
            }, 
            { driverId: driverId }
        );

        if (!vehicleUpdate.acknowledged || vehicleUpdate.modifiedCount === 0) {
            return false;
        }

        const driverUpdate = await Mongo.updateOne(COLLECTION_NAME, 
            { _id: new ObjectId(driverId) },
            { vehicleId: new ObjectId(vehicleId) }
        );

        return vehicleUpdate.acknowledged && driverUpdate.acknowledged;
    }

    static getAvailabelVendorVehicle = async (vendorId) => {
        const query = {
            vendorId: new ObjectId(vendorId),
            $or: [
                { deleted: false },
                { deleted: { $exists: false } },
                { isDeleted: false },
                { isDeleted: { $exists: false } },
                { isblocked: false },
                { isblocked: { $exists: false } }
            ]
        };
        const result = await Mongo.find('vehicles', query);
        return result;
    }
    static updateLastOrderId = async (driverId, orderId) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(driverId) }, {lastPaymentOrderId: orderId, lastPaymentInitTime: new Date().getTime() });
        return result;
    }
    static updateDriverDue = async (driverId, dueAmount) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(driverId) }, { driverDue: dueAmount, dueClearedAt: new Date().getTime() });
        return result;
    }

    static updateDriverDueOne = async (driverId, dueAmount) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(driverId) }, { $inc: { driverDue: -dueAmount } });
        return result;
    }

    // static incrementTotalTrips = async (driverId) => {
    //     const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(driverId) }, { $inc: { totalTrips: 1 } });
    //     return result;
    // }

    static addFleetDriver = async (driver) => {
        const result = await Mongo.insertOne(COLLECTION_NAME, driver);
        if (result.acknowledged) return result
        else throw new DatabaseInsertFailed('Failed to add driver to databse -- Insert Failed');
    }

    static getFleetDriver = async (driver) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { fleetSysDriverId: driver.fleetSysDriverId, fleetSysId: driver.fleetSysId });
        return result;
    }

    static getFleetDriverByPhone = async (driver) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { phone: driver.phone });
        return result;
    }

    static updateFleetDriver = async (driver) => {
        const updatePayload = { $set: { ...driver } };
        if (driver.removeDeletedAt) {
            updatePayload.$unset = { deletedAt: "" };
            delete updatePayload.$set.removeDeletedAt; // Remove the helper flag from update
        }
        const result = await Mongo.updateOneRaw(COLLECTION_NAME, { fleetSysDriverId: driver.fleetSysDriverId, fleetSysId: driver.fleetSysId }, updatePayload);
        if (result.acknowledged && result.modifiedCount > 0) return result
        else throw new DatabaseUpdateFailed('Failed to update driver in databse -- Update Failed');
    }

    static reactivateFleetDriver = async (driver) => {
        const baseUpdate = {
            isActive: true,
            isDeleted: false,
            vehicleId: ""
        };
    
        const updateSet = { ...baseUpdate, ...driver };

        if (updateSet.removeDeletedAt) {
            delete updateSet.removeDeletedAt;
        }
    
        const updatePayload = {
            $set: updateSet
        };
    
        if (driver.removeDeletedAt) {
            updatePayload.$unset = { deletedAt: "" };
        }
    
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { $or: [{ fleetSysDriverId: driver.fleetSysDriverId }, { phone: driver.phone }] },
            updatePayload
        );
    
        if (result.acknowledged && result.modifiedCount > 0) return result;
        else throw new DatabaseUpdateFailed('Failed to reactivate driver in databse -- Update Failed');
    }
    

    static deleteFleetDriver = async (driver) => {
        const result = await Mongo.updateOneRaw(COLLECTION_NAME, { fleetSysDriverId: driver.fleetSysDriverId, fleetSysId: driver.fleetSysId }, { $set: { isActive: false, isDeleted: true, deletedAt: new Date(), vehicleId: "", bankDetails: null, isApproved: false } });
        if (result.acknowledged && result.modifiedCount > 0) return result
        else throw new DatabaseUpdateFailed('Failed to delete driver in databse -- Update Failed');
    }

    static removeDriver = async (driverId) => {
        const result = await Mongo.deleteOne(COLLECTION_NAME, { _id: new ObjectId(driverId) });
        return result;   
    }

    static getPublicDriverWrkHistory = async (driverId) => {
        const result = await Mongo.find(WRK_HISTORY_COLLECTION, { driverId: new ObjectId(driverId) });
        return result;
    }

    static deleteDriver = async (driverId, role, vehicleId) => {
        // Handle vehicle updates based on role
        if (role === 'dco' && vehicleId) {
            // For DCO drivers, mark vehicle as deleted
            await Mongo.updateOne('vehicles', 
                { _id: new ObjectId(vehicleId) },
                { isDeleted: true, isApproved: false }
            );
        } else if (role === 'salaried') {
            // For salaried drivers, remove driverId from vehicle
            await Mongo.updateOne('vehicles',
                { driverId: new ObjectId(driverId) },
                { $unset: { driverId: "" } }
            );
        }

        // Update driver status
        const result = await Mongo.updateOne(COLLECTION_NAME, 
            { _id: new ObjectId(driverId) }, 
            { driverStatus: 'deleted', isDeleted: true, deletedAt: new Date().getTime(), isAvailable: false, isApproved: false }
        );
        
        return result;
    }

    static updateLiveDriverMovements = async (driverId, location) => {
        // Extract coordinates from the nested location structure
        let coordinates;
        if (location.location && location.location.coordinates) {
            // If coordinates are nested under location.location.coordinates
            coordinates = location.location.coordinates;
        } else if (location.location && Array.isArray(location.location)) {
            // If coordinates are directly in location.location array
            coordinates = location.location;
        } else if (location.coordinates) {
            // If coordinates are directly in location.coordinates
            coordinates = location.coordinates;
        } else {
            throw new Error('Invalid location format: coordinates not found');
        }

        // Ensure we have valid coordinates
        if (!Array.isArray(coordinates) || coordinates.length < 2) {
            throw new Error('Invalid coordinates format: expected array with at least 2 elements');
        }

        const obj = {
            type: "Point",
            coordinates: [coordinates?.[0], coordinates?.[1]],
            updatedAt: new Date().getTime(),
            accuracy: location?.accuracy,
            heading: location?.heading,
            battery: location?.battery,
            altitudeAccuracy: location?.altitudeAccuracy,
            altitude: location?.altitude,
        }

        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(driverId) }, { location: obj });
        return result;
    }

    static getDriverWithAccOrPrdId = async (accountId, prdID) => {
        const query = {
            $or: [
                { 'razorpayLinkedAccountDetails.productId': prdID },
                { 'razorpayLinkedAccountDetails.linkedAccountId': accountId }
            ]
        };
        const result = await Mongo.findOne(COLLECTION_NAME, query);
        return result;
    }

    static updateVehicleId = async (vehicleId) => {
        const result = await Mongo.updateOne('vehicles', { _id: new ObjectId(vehicleId) }, { isDeleted: false, isApproved: false });
        return result;
    }

    static getActiveTrip = async (tripId) => {
        const result = await Mongo.findOne('trips', { _id: new ObjectId(tripId)});
        return result;
    }

    static getDriverConfiguration = async () => {
        const result = await Mongo.findOne('publicRidesAppConfig', { APP: "PUBLICRIDE_DRIVER_APP"});
        return result;
    }

    static getNOTDriverConfiguration = async () => {
        const result = await Mongo.findOne('publicRidesAppConfig', { APP: "NOT_PUBLICRIDE_DRIVER_APP"});
        return result;
    }

    static updatePaymentID = async (driverId, paymentId) => {
        const updated = await Mongo.findOneAndUpdateRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(driverId) },
            {
                $set: {
                    lastPaymentID: paymentId
                }
            },
            {
                returnDocument: "after"
            }
        );
        return updated;
    }

    static updateLastOrderID = async (driverId, orderId) => {
        const updated = await Mongo.updateOne(
            COLLECTION_NAME,
            { _id: new ObjectId(driverId) },
            {
                lastPaymentOrderId: orderId
            }
        );
        return updated;
    }

    static updateDriverDueRefund = async (driverId, refundAmount) => {
        const updated = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: driverId },
            {
                $inc: { driverDue: refundAmount }
            }
        );
        return updated;
    }

    static updateComingTripToDriver = async (driverId, tripID) => {
        const updated = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(driverId) },
            { $addToSet: { upComingTrips: tripID } }
        );
        return updated;
    }

    static updatedriverDueAfterTripCompletion = async (driverId, dueAmount, type) => {
        const amount = Number(dueAmount) || 0;
        const action = String(type || '').toUpperCase();
        const delta = action === 'REMOVE_DUE' ? -Math.abs(amount) : Math.abs(amount);

        const updated = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(driverId) },
            { $inc: { driverDue: delta } }
        );
        return updated;
    }

    static updateCurrentTripId = async (driverId, tripID) => {
        const updated = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(driverId) },
        {
                $set: { currentTripId: tripID },
                $pull: { upComingTrips: tripID }
            }
        );
        return updated;
    }

    static getDriversByDate = async (start, end) => {
        const query = {
            createdOn: {
                $gte: start,
                $lte: end
            }
        };
        const result = await Mongo.find('drivers', query);
        return result;
    }

    static getBlockedDrivers = async () => {
        const result = await Mongo.find('drivers', { isBlocked: true });
        return result;
    }
    static getDriverLocation = async (driverId) => {
        const result = await Mongo.findOneProjection(
            COLLECTION_NAME,
            { _id: new ObjectId(driverId) },
            { location: 1 }
        );
        return result?.location || null;
    }

    static getDriverWorkLog = async (driverId, from, to) => {
        const fromTs = Number(from);
        const toTs = Number(to);

        const conditions = [{ driverId: new ObjectId(driverId) }];

        // Return logs that overlap the requested range.
        if (Number.isFinite(fromTs) && Number.isFinite(toTs)) {
            conditions.push({ from: { $lte: toTs } });
            conditions.push({ to: { $gte: fromTs } });
        } else if (Number.isFinite(fromTs)) {
            conditions.push({ to: { $gte: fromTs } });
        } else if (Number.isFinite(toTs)) {
            conditions.push({ from: { $lte: toTs } });
        }

        const query = { $and: conditions };

        const result = await Mongo.find(WRK_HISTORY_COLLECTION, query);
        return result;
    }
}

module.exports = Driver;