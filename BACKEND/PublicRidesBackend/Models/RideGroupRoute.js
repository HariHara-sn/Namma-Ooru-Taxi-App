const { ObjectId } = require('mongodb');
const Mongo = require('../Controllers/DB/Mongo');
const { DatabaseInsertFailed } = require('./Exeptions');

const COLLECTION_NAME = 'ridegrouproutes'

/**
 * Represents a RideGroup entity with methods to interact with ride group data in the database.
 */
class RideGroupRoute {

    static getRouteWithId = async (routeId) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(routeId) });
        return result;
    }

    static getRoute = async (userID, routeId) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(routeId), createdBy: userID });
        return result;
    }

    static getRouteWithName = async (rideGroupId, name) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { rideGroupId: new ObjectId(rideGroupId), name });
        return result;
    }

    static addRouteToRideGroup = async (route) => {
        const result = await Mongo.insertOne(COLLECTION_NAME, route);
        if (result.acknowledged) return result
        else throw new DatabaseInsertFailed('Failed to add route to ride group -- Insert Failed');
    }

    static getRoutes = async (rideGroupId) => {
        const result = await Mongo.find(COLLECTION_NAME, { rideGroupId: new ObjectId(rideGroupId) });
        return result;
    }

    static getRoutesOfUserUsingDay = async (day, timezone) => {
        const result = await Mongo.find(COLLECTION_NAME, { timezone, [`days.${day}`]: 1 })
        return result;
    }

    static getDistinctTimezone = async (field) => {
        const result = await Mongo.distinct(COLLECTION_NAME, field)
        return result;
    }

}

module.exports = RideGroupRoute;