const { ObjectId } = require('mongodb');
const Mongo = require('../Controllers/DB/Mongo');
const { DatabaseInsertFailed, DatabaseDeleteFailed, DatabaseUpdateFailed } = require('./Exeptions');

const COLLECTION_NAME = 'passangers'

/**
 * Represents a Passanger entity with methods to interact with passanger data in the database.
 */
class Passanger {

    static checkPassangerExistWithPhoneOrEmailOrUsername = async ( payload ) => {
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

    static checkPassangerExistWithPhoneOrEmail = async ( payload ) => {
        let query = {};
        if ( payload.email && payload.phone ) {
            query = { $or: [{ email: payload.email }, { phone: payload.phone }] };
        }
        const passanger = await Mongo.findOne( COLLECTION_NAME, query );
        return passanger
    }


    static checkPassangerExistWithPhone = async ( phone ) => {
        const passanger = await Mongo.findOne( COLLECTION_NAME, { phone: phone } );
        return passanger
    }
    

    static checkBulkPassangersExistWithPhoneOrEmailOrUsername = async ( emails, phones, usernames) => {
        const existingPassangers = await Mongo.findProjection(
            COLLECTION_NAME,
            {
                $or: [
                    { email: { $in: emails } },
                    { phone: { $in: phones } },
                    { username: { $in: usernames } }
                ],
            },
            { password: 0 }
        );
        return existingPassangers
    }

    static getAllPassangers = async (userId) => {
        const result = await Mongo.find(COLLECTION_NAME, { createdBy: userId });
        return result
    }

    static getPassangerWithEmail = async (email) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { email });
        return result
    }

    static getPassangerWithId = async (passangerId) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(passangerId) });
     
        return result
    }

    static getPassangerWithPhone = async (phoneNumber) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { phone: phoneNumber });
        return result
    }

    static getPassangersDetails = async (userId, passangerIds) => {
        const results = await Mongo.findProjection(COLLECTION_NAME, { _id: { $in: passangerIds.map(id => new ObjectId(id)), }, createdBy: userId }, {password: 0} );
        return results
    }

    static getPassanger = async (userId, passangerId) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(passangerId), createdBy: userId });
        return result
    }

    static addPassanger = async (passanger) => {
        const result = await Mongo.insertOne(COLLECTION_NAME, passanger);
        if (result.acknowledged) return result
        else throw new DatabaseInsertFailed('Failed to add passanger to databse -- Insert Failed');
    }

    static addBulkPassangers = async (passangers) => {
        const result = await Mongo.insertMany(COLLECTION_NAME, passangers);
        if (result.acknowledged) {
            return result
        }
        throw DatabaseInsertFailed("Failed to insert alerts")
    }

    static updatePassanger = async (passangerId, passanger) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(passangerId) }, passanger);
        if (result.acknowledged) return result
        else throw new DatabaseUpdateFailed('Failed to update passanger in databse -- Update Failed');
    }

    static deletePassanger = async (passangerId) => {
        const result = await Mongo.deleteOne(COLLECTION_NAME, { _id: new ObjectId(passangerId) });
        if (result.acknowledged) return result
        else throw new DatabaseDeleteFailed('Failed to delete passanger from databse -- Delete Failed');
    }

    static checkPassangersExist = async (passangers, userId) => {
        const result = await Mongo.find(COLLECTION_NAME, { _id: { $in: passangers.map(passanger => new ObjectId(passanger)) }, createdBy: userId });
        return result.length === passangers.length;
    }

    static getPassangers = async (passangers) => {
        const result = await Mongo.findProjection(COLLECTION_NAME, { _id: { $in: passangers.map(passanger => new ObjectId(passanger)) } }, { password: 0 });
        return result;
    }

    static getUserWithPhoneorEmail(payload) {
        if (payload.email) return Mongo.findOne(COLLECTION_NAME, { email: payload.email });
        return Mongo.findOne(COLLECTION_NAME, { phone: payload.phone });
    }

    static updatePassangerFcmToken = async ( passangerId, fcmToken ) => {
        // update the device imei into the current login passangers's data
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(passangerId) }, { fcmToken: fcmToken });
        return result;
    }

    static getPassangerWithUsername(payload) {
        if (payload.username) return Mongo.findOne(COLLECTION_NAME, { username: payload.username });
    }

    static updateUserFcmToken = async (id, fcmToken) => {
        /* remove existing device Imei from other passangers's data */
        await Mongo.updateManyRaw(COLLECTION_NAME, { "fcmTokens.deviceImei": fcmToken.deviceImei }, { $pull: { fcmTokens: { deviceImei: fcmToken.deviceImei } } });

        // update the device imei into the current login passangers's data
        const result = await Mongo.updateOneAddToSet(COLLECTION_NAME, { _id: new ObjectId(id) }, { fcmTokens: fcmToken });
        return result;
    }

    static removeUserFcmTokenDeviceImei = async (id, fcmToken) => {
        const result = await Mongo.updateOnePull(COLLECTION_NAME, { _id: new ObjectId(id) }, { fcmTokens: { deviceImei: fcmToken.deviceImei } });
        return result;
    }

    static getUserFcmToken = async (ids, excludeImeis = []) => {
        const objectIdUserIds = ids.map(id => new ObjectId(id));
        const results = await Mongo.findProjection(COLLECTION_NAME, { _id: { $in: objectIdUserIds } }, { "fcmTokens.token": 1, _id: 0 });

        const fcmTokens = results.flatMap(tokens => tokens.fcmTokens)
            .filter(fcmToken => !excludeImeis.includes(fcmToken.deviceImei))
            .map(fcmToken => fcmToken?.token);
        return fcmTokens;
    }

    static removeFcmTokens = async (fcmTokens) => {
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, { "fcmTokens.token": { $in: fcmTokens } }, { $pull: { fcmTokens: { token: { $in: fcmTokens } } } });
        return result;
    }

    static getPassangerRideGroups = async (passangerId) => {
        const groupQuery = [
            { $match: { "passangers": new ObjectId(passangerId)} },
            {$lookup: {from: "ridegrouproutes", localField: "routes", foreignField: "_id", as: "routes"},},
        ];
        const rideGroups = await Mongo.aggregate("ridegroups", groupQuery)
        return rideGroups
    }
    static updatePassangerRating = async (passangerId, rating) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(passangerId) }, { ratingData: rating });
        return result;
    }
    static updateFavPlaces = async (passangerId, favPlaces) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(passangerId) }, { favPlaces: favPlaces });
        return result;
    }
    static updatePassangerAccountDeletion = async (passangerId, deletionReason="") => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(passangerId) }, { deleteReason: deletionReason, isDeleted: true, deletedAt: new Date() });
        return result;
    }
    static updatePassangerTotalRides = async (passangerId) => {
        const result = await Mongo.updateOneIncreament(COLLECTION_NAME, { _id: new ObjectId(passangerId) }, { 'stats.totalTrips': 1 });
        return result;
    }
    static updatePassangerLatestTripId = async (passangerId, latestTripId) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(passangerId) }, { latestTripId: latestTripId });
        return result;
    }
    static updatePassangerCompletedTripsandTspends = async (passangerId, tripFare, status) => {
        console.log({ passangerId, tripFare, status }, "Updating passanger completed trips and total spends")
        // Update completedTrips if status is 'completed', else update divergedTrips
        let updateQuery = { $inc: { 'stats.totalSpends': tripFare }, $set: { 'stats.cancelTripOccurance': 0 } };
        if (status === 'COMPLETED') {
            updateQuery.$inc['stats.completedTrips'] = 1;
        } else {
            updateQuery.$inc['stats.divergedTrips'] = 1;
        }
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(passangerId) },
            updateQuery
        );
        return result;
    }
    static updatePassangerUpdateCancelledTrips = async (passangerId) => {
        const result = await Mongo.updateOneIncreament(
            COLLECTION_NAME,
            { _id: new ObjectId(passangerId) },
            { 'stats.cancelledTrips': 1, 'stats.cancelTripOccurance': 1 }
        );
        return result;
    }
    static updatePassangerDeviceInfo = async (passangerId, deviceMeta={}) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(passangerId) }, { deviceMeta: deviceMeta });
        return result;
    }
    static updatePassangerFCMToken = async (passangerId, fcmToken) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(passangerId) }, { fcmToken: fcmToken });
        return result;
    }

    static addPassangerVehicleId = async (passangerId, vehicleId) => {
        const result = await Mongo.updateOneAddToSet(COLLECTION_NAME, { _id: new ObjectId(passangerId) }, { vehicles: vehicleId });
        return result;
    }

    static removePassangerVehicleId = async (passangerId, vehicleId) => {
        const result = await Mongo.updateOnePull(COLLECTION_NAME, { _id: new ObjectId(passangerId) }, { vehicles: vehicleId });
        return result;
    }

    static updateNotificationPreferences = async (passangerId, notificationPreferences) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(passangerId) }, { notificationPreferences });
        return result;
    }
}

module.exports = Passanger;