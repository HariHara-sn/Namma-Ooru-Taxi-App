const { ObjectId } = require("mongodb")
const Mongo = require("../Controllers/DB/Mongo")

const COLLECTION_NAME = "alerts"
class Alerts {

    static async addAlert(alert) {
        alert.deviceId = new ObjectId(alert.deviceId)
        const result = await Mongo.insertOne(COLLECTION_NAME, alert)
        return result
    }

    static async getGeofenceAlerts(devices, skip = 0, limit = 10) {
        devices = devices.map(device => new ObjectId(device))
        const query = {
            deviceId: { $in: devices },
            type: { $in: ["geofenceIn", "geofenceOut"] }
        }
        const result = await Mongo.findPagination(COLLECTION_NAME, query, skip, limit, { time: -1 })
        const count = await Mongo.database.collection(COLLECTION_NAME).countDocuments(query)
        return { result, count }
    }

    static async getAllAlerts(devices, skip = 0, limit = 10) {
        devices = devices.map(device => new ObjectId(device))
        const query = {
            deviceId: { $in: devices }
        }
        const result = await Mongo.findPagination(COLLECTION_NAME, query, skip, limit, { time: -1 })
        const count = await Mongo.database.collection(COLLECTION_NAME).countDocuments(query)
        return { result, count }
    }

    static async getAlerts(devices, type, startTime, endTime) {
        devices = devices.map(device => new ObjectId(device))
        const query = {
            deviceId: { $in: devices }
        };
        if (type && type !== "All") {
            if (type === "Geofence") {
                query.type = { $in: ["geofenceIn", "geofenceOut"] };
            } else if (type === "overSpeed") {
                query.type = "overSpeed";
            } else if (type === "sosPress") {
                query.type = "sosPress";
            } else {
                query.type = type;
            }
        }
        if (startTime && endTime) {
            query.time = { $gte: parseInt(startTime), $lte: parseInt(endTime) };
        }
        const result = await Mongo.find(COLLECTION_NAME, query)
        return { result }
    }

    static async deleteGeofenceAlerts(geofenceId) {
        const result = await Mongo.deleteMany(COLLECTION_NAME, { geofenceId: new ObjectId(geofenceId) });
        return result;
    }
}

module.exports = Alerts