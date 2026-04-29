const { ObjectId } = require('mongodb');
const Mongo = require('../Controllers/DB/Mongo');
const { DatabaseInsertFailed } = require('./Exeptions');
const SOSEvents = require('../Core/PublicRides/SOSEvents');
const COLLECTION_NAME = 'sosEvents';

class SOS {
    static addSOS = async (tripId, userId, role, regionOffice, regionCode) => {
        // Prevent duplicate SOS for same trip and creator in TRIGGERED state
        const existing = await Mongo.findOne(
            COLLECTION_NAME,
            { tripId: new ObjectId(tripId), createdBy: new ObjectId(userId), status: SOSEvents.TRIGGERED }
        )
        if (existing) {
            return { acknowledged: true, insertedId: existing._id, alreadyExists: true }
        }
        const data = {
            tripId: new ObjectId(tripId),
            role: role,
            createdOn: new Date().getTime(),
            trackingData: [],
            status: SOSEvents.TRIGGERED,
            createdBy: new ObjectId(userId),
            createdAt: new Date().getTime(),
            updatedOn: new Date().getTime(),
            regionOfficeId: new ObjectId(regionOffice),
            regionCode: regionCode,
        }
        const result = await Mongo.insertOne(COLLECTION_NAME, data)
        if (result.acknowledged) return result
        else throw new DatabaseInsertFailed('Failed to add SOS event to databse -- Insert Failed');
    }

    static addTrackingData = async (eventId, points, createdById) => {
        const cleanEventId = String(eventId).replace(/["']/g, '').trim()
        if (!ObjectId.isValid(cleanEventId)) return { acknowledged: false, invalidId: true }
        const filter = { _id: new ObjectId(cleanEventId) }
        if (createdById) {
            const cleanCreatedById = String(createdById).replace(/["']/g, '').trim()
            if (!ObjectId.isValid(cleanCreatedById)) return { acknowledged: false, invalidId: true }
            filter.createdBy = new ObjectId(cleanCreatedById)
        }

        const entries = Array.isArray(points) ? points : [points]
        const normalizedEntries = entries.map(p => ({
            latitude: p.latitude,
            longitude: p.longitude,
            time: p.time
        }))

        const update = {
            $push: { trackingData: { $each: normalizedEntries } },
            $set: { updatedOn: new Date().getTime() }
        }
        const result = await Mongo.updateOneRaw(COLLECTION_NAME, filter, update)
        return result
    }

    static getTrackingData = async (eventId) => {
        const cleanEventId = String(eventId).replace(/["']/g, '').trim()
        if (!ObjectId.isValid(cleanEventId)) return null
        const filter = { _id: new ObjectId(cleanEventId) }
        const result = await Mongo.findOneProjection(COLLECTION_NAME, filter, { _id: 0, trackingData: 1, status: 1 })
        return result
    }

    static getEventById = async (eventId) => {
        const cleanEventId = String(eventId).replace(/["']/g, '').trim()
        if (!ObjectId.isValid(cleanEventId)) return null
        const result = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(cleanEventId) })
        return result
    }

    static stopTracking = async (eventId, createdById, reason, status) => {
        const cleanEventId = String(eventId).replace(/["']/g, '').trim()
        if (!ObjectId.isValid(cleanEventId)) return { acknowledged: false, invalidId: true }
        const cleanCreatedById = String(createdById).replace(/["']/g, '').trim()
        if (!ObjectId.isValid(cleanCreatedById)) return { acknowledged: false, invalidId: true }

        const update = {
            $set: {
                status: status,
                stopReason: reason || '',
                stoppedAt: new Date().getTime(),
                updatedOn: new Date().getTime()
            }
        }
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(cleanEventId), createdBy: new ObjectId(cleanCreatedById) },
            update
        )
        return result
    }
}

module.exports = SOS