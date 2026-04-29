const { ObjectId } = require('mongodb');
const MatchingGeoFenceFromDeviceGroups = require('../Controllers/DB/Aggregations/MatchingGeoFenceFromDeviceGroups');
const Mongo = require('../Controllers/DB/Mongo');
const { DatabaseInsertFailed, DatabaseDeleteFailed } = require('./Exeptions');

const COLLECTION_NAME = 'devices'
class Device {

    constructor() {

    }

    static addSharedDevice = async () => {
        // const result = await Mongo.updateOneAddToSet(COLLECTION_NAME, { _id: new ObjectId(deviceId) }, { sharedDevices: { $each: [userId] } });
        // return result;
    }

    static getDeviceFromId = async (deviceId) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(deviceId) });
        return result;
    }

    static getDeviceFromIds = async (deviceIds) => {
        const Ids = deviceIds.map(id => new ObjectId(id));
        const result = await Mongo.find(COLLECTION_NAME, { _id: { $in: Ids } });
        return result;
    }

    static getUserDevicesByIds = async (userId, deviceIds) => {
        const ids = deviceIds.map(id => new ObjectId(id));
        const result = await Mongo.find(COLLECTION_NAME, { _id: { $in: ids }, userId });
        return result;
    }

    static getDeviceFromImei = async (imei) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { imei: imei });
        return result;
    }

    /* For secure server call, dont pass sensitive info */
    static getDeviceFromIMEIs = async (imeis) => {
        const result = await Mongo.findProjection(COLLECTION_NAME, { imei: { $in: imeis } }, { _id: 1, imei: 1, location: 1, liveStats: 1 });
        return result;
    }

    static getAllDeviceIdsUsersHasAccess = async (userId) => {
        try {
            const deviceQuery = [
                { $match: { userId: userId } }, // Convert userId to ObjectId and match
                { $group: { _id: null, deviceIds: { $push: "$_id" } } }, // Group all results into a single document and collect all _id values into an array named deviceIds
                { $project: { _id: 0, deviceIds: 1 } } // Exclude the _id field and include the deviceIds array
            ];

            const groupQuery = [
                { $match: { "users": { $elemMatch: { "userId": userId, "accepted": true } } } }, // Replace userId with the actual user ID
                { $project: { _id: 0, deviceIds: "$devices.deviceId" } }, // Do not include the group's _id and adjusted to access deviceId within the devices objects
                { $unwind: "$deviceIds" },
                { $group: { _id: null, allDeviceIds: { $addToSet: { $toObjectId: "$deviceIds" } } } }, // Convert deviceIds to ObjectId
                { $project: { _id: 0, deviceIds: "$allDeviceIds" } }
            ];

            const deviceIds = await Mongo.aggregate("devices", deviceQuery)
            const groupDeviceIds = await Mongo.aggregate("groups", groupQuery)

            if (deviceIds[0] || groupDeviceIds[0]) {
                const combinedDeviceIds = [...new Set([...(deviceIds[0] ? deviceIds[0].deviceIds : []), ...(groupDeviceIds[0] ? groupDeviceIds[0].deviceIds : [])])];
                return combinedDeviceIds;
            }
            return [];

            // return allDeviceIds.length > 0 ? allDeviceIds[0].deviceIds : [];
        } catch (error) {
            console.error('Failed to get all device IDs user has access to:', error);
            throw error;
        }
    }

    static getAllDeviceImeisUsersHasAccess = async (userId) => {
        try {
            const deviceQuery = [
                { $match: { userId: userId } }, // Convert userId to ObjectId and match
                { $group: { _id: null, deviceIds: { $push: "$imei" } } }, // Group all results into a single document and collect all _id values into an array named deviceIds
                { $project: { _id: 0, deviceIds: 1 } } // Exclude the _id field and include the deviceIds array
            ];
            const deviceIds = await Mongo.aggregate("devices", deviceQuery)
            if (deviceIds[0]) {
                const combinedDeviceIds = [...new Set([...(deviceIds[0] ? deviceIds[0].deviceIds : [])])];
                return combinedDeviceIds;
            }
            return [];

            // return allDeviceIds.length > 0 ? allDeviceIds[0].deviceIds : [];
        } catch (error) {
            console.error('Failed to get all device IDs user has access to:', error);
            throw error;
        }
    }

    static getUserDevicesPaginated = async (userId, skip = 0, limit = 20, projection = { _id: 1, imei: 1, name: 1, location: 1, liveStats: 1 }) => {
        const query = { userId };
        const [items, total] = await Promise.all([
            Mongo.findPaginationWithProject(COLLECTION_NAME, query, projection, skip, limit, { createdAt: -1 }),
            Mongo.countDocuments(COLLECTION_NAME, query)
        ]);
        return { items, total };
    }

    // Get device token based on userId and deviceId
    static getDeviceToken = async (userId, deviceId) => {
        const result = await this.getDevice(userId, deviceId);
        if (!result) return false
        return result;
    }

    // Add a new device to the database
    static addDevice = async (device) => {
        const result = await Mongo.insertOne(COLLECTION_NAME, device);
        if (result.acknowledged) return result
        else throw new DatabaseInsertFailed('Failed to add device to databse -- Insert Failed');
    }

    // Delete a device from the database based on userId and deviceId
    static deleteDevice = async (userId, deviceId) => {
        const result = await Mongo.deleteOne(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId: userId });
        if (result.deletedCount === 0) throw new DatabaseDeleteFailed('Device not found')
        return result;
    }

    // Update device details based on userId, deviceId, and new deviceDetails
    static updateDevice = async (userId, deviceId, deviceDetails) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId: userId }, deviceDetails);
        return result;
    }

    static async getDeviceImage(deviceId) {
        const result = await Mongo.findOneProjection(COLLECTION_NAME, { _id: new ObjectId(deviceId) }, { image: 1 });
        return result;
    }

    // Get device details based on userId and deviceId
    static getDevice = async (userId, deviceId) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId: userId });
        return result;
    }

    // Get vehicle details based on userId and deviceId
    static getVehicle = async (userId, deviceId) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId: userId, type: "vehicle" });
        return result;
    }

    // Get device details based on userId and deviceName
    static getDeviceBasedName = async (userId, deviceName, imei) => {
        const query = imei ? { $or: [{ imei: imei }, { userId: userId, name: deviceName }] } : { userId: userId, name: deviceName };
        const result = await Mongo.findOne(COLLECTION_NAME, query);
        return result;
    }

    static addGroupToDevice = async (userId, deviceId, groupId) => {
        const result = await Mongo.updateOneAddToSet(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId: userId }, { groups: { $each: [groupId] } });
        return result;
    }

    static addGroupToDevices = async (userId, deviceIds, groupId) => {
        const objectIdDeviceIds = deviceIds.map(id => new ObjectId(id));
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, { _id: { $in: objectIdDeviceIds }, userId: userId }, { $addToSet: { groups: { $each: [groupId] } } });
        return result;
    }

    static removeGroupFromDevice = async (userId, deviceId, groupId) => {
        const result = await Mongo.updateOnePull(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId: userId }, { groups: groupId });
        return result;
    }

    static removeGroupFromDevices = async (userId, deviceIds, groupId) => {
        const objectIdDeviceIds = deviceIds.map(id => new ObjectId(id));
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, { _id: { $in: objectIdDeviceIds }, userId: userId }, { $pull: { groups: groupId } });
        return result;
    }

    static removeGroupGeoFence = async (userId, deviceId, groupId, geoFenceId) => {
        const result = await Mongo.updateOnePull(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId: userId, groups: groupId }, { groupGeofences: geoFenceId });
        return result;
    }

    static addGroupGeoFenceToDevices = async (userId, devices, geoFenceId) => {
        const deviceObjectIds = devices.map(id => new ObjectId(id));
        const query = {
            _id: {
                $in: deviceObjectIds
            }
        }
        const updateQuery = {
            $addToSet: {
                groupGeofences: geoFenceId
            }
        }
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, query, updateQuery);
        return result;
    }

    static addExistingGroupGeoFencesAndGroupToDevices = async (userId, groupId, devices, geoFenceIds) => {
        const deviceObjectIds = devices.map(id => new ObjectId(id));
        const query = {
            _id: {
                $in: deviceObjectIds
            },
            userId: userId
        }
        const updateQuery = {
            $addToSet: {
                groupGeofences: {
                    $each: geoFenceIds
                },
                groups: groupId
            }
        }
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, query, updateQuery);
        return result;
    }

    static deleteGroupGeoFenceFromDevices = async (userId, devices, geoFenceId) => {
        const deviceObjectIds = devices.map(id => new ObjectId(id));
        const query = {
            _id: {
                $in: deviceObjectIds
            }
        }
        const updateQuery = {
            $pull: {
                groupGeofences: geoFenceId
            }
        }
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, query, updateQuery);
        return result;
    }

    // Get all devices associated with a specific userId
    static getUserDevices = async (userId, sharedGroups = [], sharedDevices = [], onlyIds = false) => {
        let result;
        if (onlyIds) {
            const projection = [{ $project: { _id: 1 } }];
            const pipeline = [
                {
                    $match: {
                        $or: [
                            { userId: userId },
                            { groups: { $in: sharedGroups } },
                            { _id: { $in: sharedDevices.map(id => new ObjectId(id)) } }
                        ]
                    }
                },
                ...projection
            ];
            const idsResult = await Mongo.aggregate(COLLECTION_NAME, pipeline);
            result = idsResult.map(doc => doc._id.toString());
        } else {
            const query = [
                {
                    $match: {
                        $or: [
                            { userId: userId },
                            { groups: { $in: sharedGroups } },
                            { _id: { $in: sharedDevices.map(id => new ObjectId(id)) } }
                        ]
                    }
                },
                {
                    $addFields: {
                        sharedDevice: {
                            $cond: {
                                if: { $in: ["$_id", sharedDevices.map(id => new ObjectId(id))] },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $project: {
                        image: 0 // Exclude the image field from the result
                    }
                }
            ];
            result = await Mongo.aggregate(COLLECTION_NAME, query);
        }
        return result;
    }

    // Get all devices associated with a specific userId and GeoFence
    static getDevicesBasedGeofence = async (userId, geofenceId) => {
        const result = await Mongo.find(COLLECTION_NAME, { userId: userId, geofences: geofenceId });
        return result;
    }

    // Check if a specific geoFenceId is already associated with a device based on userId, deviceId, and geoFenceId
    static checkGeoFenceAlreadyInDevice = async (userId, deviceId, geoFenceId) => {
        const device = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId: userId, geofences: geoFenceId });
        if (device) return device;
        return false;
    }

    // Add geoFenceId(s) to a device based on userId, deviceId, geoFenceIds
    static addDeviceGeofenceId = async (userId, deviceId, geoFenceIds) => {
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId: userId }, { $addToSet: { geofences: { $each: geoFenceIds } }, $set: { updatedOn: new Date().getTime() } });
        if (result.modifiedCount === 0) throw new DatabaseInsertFailed('Geofence Id/Ids Already Connect With Device');
        return result;
    }

    // Delete a geoFenceId from a device based on userId, deviceId, geoFenceId, and updateOn timestamp
    static deleteDeviceGeofenceId = async (userId, deviceId, geoFenceId, updateOn) => {
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId: userId }, { $set: { updatedOn: updateOn }, $pull: { geofences: geoFenceId } });
        if (result) return true;
        return false;
    }

    // // Delete a groupGeofenceId from a device based on userId, deviceId, geoFenceId, and updateOn timestamp
    // static deleteDeviceGroupGeofence = async (userId, deviceIds, geoFenceIds) => {
    //     const objectIdDeviceIds = deviceIds.map(id => new ObjectId(id));
    //     const resultTwo = await Mongo.updateOnePull(COLLECTION_NAME, { _id: {$in : objectIdDeviceIds}, userId: userId }, { groupGeofences: {$in: geoFenceIds} });
    //     const resultOne = await Mongo.updateOne(COLLECTION_NAME, { _id: {$in : objectIdDeviceIds}, userId: userId }, { updatedOn: new Date().getTime() });
    //     if (resultOne || resultTwo) return true;
    //     return false;
    // }

    // Delete a groupGeofenceId and group from a device
    static deleteDeviceGroupGeofenceAndGroup = async (userId, deviceIds, groupId, geoFenceIds) => {
        const objectIdDeviceIds = deviceIds.map(id => new ObjectId(id));
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, { _id: { $in: objectIdDeviceIds }, userId: userId }, { $pull: { groups: groupId, groupGeofences: { $in: geoFenceIds } }, $set: { updatedOn: new Date().getTime() } });
        if (result) return true;
        return false;
    }

    // Delete a groupGeofenceId from a device
    static deleteDeviceGeofencesAndGroupGeofences = async (geoFenceId) => {
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, {}, { $pull: { geofences: geoFenceId, groupGeofences: geoFenceId } });
        if (result) return true;
        return false;
    }

    static addGeofenceToDevices = async (userId, deviceIds, geofenceId) => {
        const objectIdDeviceIds = deviceIds.map(id => new ObjectId(id));
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, { _id: { $in: objectIdDeviceIds }, userId: userId }, { $addToSet: { geofences: { $each: [geofenceId] } } });
        return result;
    }

    static removeGeofenceFromDevices = async (userId, deviceIds, geofenceId) => {
        // Ownership is already verified upstream via checkDevicesOwnerShip.
        // To avoid mismatches where userId is stored as ObjectId vs string,
        // update by device _id only.
        const objectIdDeviceIds = deviceIds.map(id => new ObjectId(id));
        const result = await Mongo.updateManyRaw(
            COLLECTION_NAME,
            { _id: { $in: objectIdDeviceIds } },
            { $pull: { geofences: geofenceId } }
        );
        return result;
    }

    static getGeoFenceofMatchedDevice = async (deviceId) => {
        const query = MatchingGeoFenceFromDeviceGroups(deviceId)
        const geofences = await Mongo.aggregate(COLLECTION_NAME, query);
        return geofences
    }

    // Get GroupIds array based on userId and deviceId
    static getGroupIds = async (userId, deviceId) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId: userId });
        return result.groups;
    }

    // Update device LAST Coordinate details based on userId and deviceId
    static updateLocation = async (userId, deviceId, deviceCoordinateDetail) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId: userId }, deviceCoordinateDetail);
        return result;
    }

    static updateLiveStatsAndLocation = async (deviceId, location, liveStats) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(deviceId) }, { location, liveStats });
        return result;
    }

    static updateLiveStats = async (deviceId, liveStats) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(deviceId) }, { liveStats });
        return result;
    }

    // Search devices Using Search String
    static searchDevices = async (query) => {
        const result = await Mongo.find(COLLECTION_NAME, query);
        return result;
    }

    // checking devices ownership
    static checkDevicesOwnerShip = async (userId, deviceIds) => {
        if (!Array.isArray(deviceIds) || deviceIds.length === 0) return [];
        const validIds = deviceIds.filter(id => /^[a-fA-F0-9]{24}$/.test(id));
        const objectIdDeviceIds = validIds.map(id => new ObjectId(id));

        // Build OR filters to handle userId stored either as string or ObjectId
        const orFilters = [];
        if (/^[a-fA-F0-9]{24}$/.test(userId)) {
            try { orFilters.push({ _id: { $in: objectIdDeviceIds }, userId: new ObjectId(userId) }); } catch (_e) { /* ignore */ }
        }
        orFilters.push({ _id: { $in: objectIdDeviceIds }, userId: userId });

        const query = { $or: orFilters };
        let ownedDevices = [];
        try { ownedDevices = await Mongo.find(COLLECTION_NAME, query); } catch (_e) { /* noop */ }
        const ownedDevicesIds = ownedDevices.map(d => d._id.toString());
        return ownedDevicesIds;
    }

    static addTrackingInactivityNotifiedAt = async (id) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: id }, { trackingInactivityNotifiedAt: Date.now() });
        return result;
    }

    static getTrackingStoppedDevices = async (lastLocationCheckTime, trackingInactivityCheckTime, limit) => {
        const query = {
            'type': 'mobile',
            $or: [
                {
                    $and: [
                        { 'liveStats.lastLocationUpdatedOn': { $exists: false } },
                        { 'trackingInactivityNotifiedAt': { $exists: false } }
                    ]
                },
                {
                    $and: [
                        { 'liveStats.lastLocationUpdatedOn': { $exists: false } },
                        { 'trackingInactivityNotifiedAt': { $lt: trackingInactivityCheckTime } }
                    ]
                },
                {
                    $and: [
                        { 'liveStats.lastLocationUpdatedOn': { $lt: lastLocationCheckTime } },
                        { 'trackingInactivityNotifiedAt': { $lt: trackingInactivityCheckTime } }
                    ]
                }
            ]
        };

        const trackingStoppedDevices = await Mongo.findPagination(COLLECTION_NAME, query, 0, limit);
        return trackingStoppedDevices;
    }

    static getInactiveGpsDevices = async (lastLocationCutoff, notifiedCutoff, limit = 100) => {
        const inactivityQuery = {
            type: { $in: ['vehicle', 'gps'] },
            $and: [
                {
                    $or: [
                        { 'liveStats.lastLocationUpdatedOn': { $exists: false } },
                        { 'liveStats.lastLocationUpdatedOn': { $lte: lastLocationCutoff } }
                    ]
                },
                {
                    $or: [
                        { gpsInactivityAdminNotifiedAt: { $exists: false } },
                        { gpsInactivityAdminNotifiedAt: { $lte: notifiedCutoff } }
                    ]
                }
            ]
        };

        const docs = await Mongo.findPagination(COLLECTION_NAME, inactivityQuery, 0, limit, { 'liveStats.lastLocationUpdatedOn': 1 });
        return docs;
    }

    static markGpsInactivityAdminNotified = async (deviceIds, timestamp) => {
        if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
            return { matchedCount: 0, modifiedCount: 0 };
        }

        const toObjectId = (value) => {
            if (!value) return null;
            if (value instanceof ObjectId) return value;
            if (typeof value === 'string') {
                try {
                    if (/^[a-fA-F0-9]{24}$/.test(value)) return new ObjectId(value);
                } catch (_e) {
                    return null;
                }
            }
            if (typeof value.toString === 'function') {
                const str = value.toString();
                if (/^[a-fA-F0-9]{24}$/.test(str)) {
                    try { return new ObjectId(str); } catch (_e) { return null; }
                }
            }
            return null;
        };

        const objectIds = deviceIds
            .map(toObjectId)
            .filter(Boolean);

        if (!objectIds.length) {
            return { matchedCount: 0, modifiedCount: 0 };
        }

        const result = await Mongo.updateManyRaw(COLLECTION_NAME, { _id: { $in: objectIds } }, { $set: { gpsInactivityAdminNotifiedAt: timestamp } });
        return result;
    }

    static setDriver = async (deviceId, driverData) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(deviceId) }, { activeDriver: driverData });
        return result;
    }

    static getActiveDriver = async (userId, deviceId) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(deviceId), userId });
        return result?.activeDriver?.id || null;
    }

    static getActiveDriverWithoutUser = async (deviceId) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(deviceId) });
        return result?.activeDriver?.id || null;
    }

    static removeDriver = async (deviceId) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(deviceId) }, { activeDriver: null });
        return result;
    }

    static doesUserHaveAccessToThisDevice = async (userId, deviceId) => {
        try {
            const deviceQuery = [
                { $match: { userId: userId } },
                { $group: { _id: null, deviceIds: { $push: "$_id" } } },
                { $project: { _id: 0, deviceIds: 1 } }
            ];

            const sharedDeviceQuery = [
                { $match: { _id: new ObjectId(userId) } },
                { $project: { _id: 0, deviceIds: "$sharedDevices" } }
            ];

            const groupQuery = [
                { $match: { "users": { $elemMatch: { "userId": userId, "accepted": true } } } },
                { $project: { _id: 0, deviceIds: "$devices.deviceId" } },
                { $unwind: "$deviceIds" },
                { $group: { _id: null, allDeviceIds: { $addToSet: { $toObjectId: "$deviceIds" } } } },
                { $project: { _id: 0, deviceIds: "$allDeviceIds" } }
            ];

            const deviceIds = await Mongo.aggregate("devices", deviceQuery)
            const sharedDeviceIds = await Mongo.aggregate("users", sharedDeviceQuery)
            const groupDeviceIds = await Mongo.aggregate("groups", groupQuery)

            if (deviceIds[0] || groupDeviceIds[0] || sharedDeviceIds[0]) {
                const combinedDeviceIds = [
                    ...new Set([
                        ...(deviceIds[0]?.deviceIds || []),
                        ...(groupDeviceIds[0]?.deviceIds || []),
                        ...(sharedDeviceIds[0]?.deviceIds || [])
                    ])
                ].map(id => id.toString());

                return combinedDeviceIds.includes(deviceId.toString());
            }
            return false;

        } catch (error) {
            console.error('Failed to Identify user has access to this device ID:', error);
            throw error;
        }
    }

    static userAccessibleDeviceIds = async (userId) => {
        try {
            const deviceQuery = [
                { $match: { userId: userId } },
                { $group: { _id: null, deviceIds: { $push: "$_id" } } },
                { $project: { _id: 0, deviceIds: 1 } }
            ];

            const sharedDeviceQuery = [
                { $match: { _id: new ObjectId(userId) } },
                { $project: { _id: 0, deviceIds: "$sharedDevices" } }
            ];

            const groupQuery = [
                { $match: { "users": { $elemMatch: { "userId": userId, "accepted": true, "role": "owner" } } } },
                { $project: { _id: 0, deviceIds: "$devices.deviceId" } },
                { $unwind: "$deviceIds" },
                { $group: { _id: null, allDeviceIds: { $addToSet: { $toObjectId: "$deviceIds" } } } },
                { $project: { _id: 0, deviceIds: "$allDeviceIds" } }
            ];

            const deviceIds = await Mongo.aggregate("devices", deviceQuery)
            const sharedDeviceIds = await Mongo.aggregate("users", sharedDeviceQuery)
            const groupDeviceIds = await Mongo.aggregate("groups", groupQuery)

            const combinedDeviceIds = [
                ...new Set([
                    ...(deviceIds[0]?.deviceIds || []),
                    ...(groupDeviceIds[0]?.deviceIds || []),
                    ...(sharedDeviceIds[0]?.deviceIds || [])
                ])
            ].map(id => id.toString());

            return combinedDeviceIds;

        } catch (error) {
            console.error('Failed to Identify user has access to this device ID:', error);
            throw error;
        }
    }

    static userAccessibleDeviceIdsWithoutSharedDevices = async (userId) => {
        try {
            const deviceQuery = [
                { $match: { userId: userId } },
                { $group: { _id: null, deviceIds: { $push: "$_id" } } },
                { $project: { _id: 0, deviceIds: 1 } }
            ];

            const groupQuery = [
                { $match: { "users": { $elemMatch: { "userId": userId, "accepted": true, "role": { $in: ["owner", "admin"] } } } } },
                { $project: { _id: 0, deviceIds: "$devices.deviceId" } },
                { $unwind: "$deviceIds" },
                { $group: { _id: null, allDeviceIds: { $addToSet: { $toObjectId: "$deviceIds" } } } },
                { $project: { _id: 0, deviceIds: "$allDeviceIds" } }
            ];

            const deviceIds = await Mongo.aggregate("devices", deviceQuery)
            const groupDeviceIds = await Mongo.aggregate("groups", groupQuery)

            const combinedDeviceIds = [
                ...new Set([
                    ...(deviceIds[0]?.deviceIds || []),
                    ...(groupDeviceIds[0]?.deviceIds || [])
                ])
            ].map(id => id.toString());

            return combinedDeviceIds;

        } catch (error) {
            console.error('Failed to Identify user has access to this device ID:', error);
            throw error;
        }
    }

    //Device Usage Collection

    static getDeviceUsageInfo = async (filter) => {
        const result = await Mongo.findOne('deviceUsageInfos', filter);
        return result;
    }

    static getDeviceUsageInfoForAlerts = async (filter, projection) => {
        const result = await Mongo.aggregate('deviceUsageInfos', [
            { $match: filter },
            { $project: projection }
        ]);
        return result;
    }

    static createDeviceUsageInfo = async (payload) => {
        const result = await Mongo.insertOne('deviceUsageInfos', payload);
        return result;
    }

    static updateDeviceUsageInfo = async (filter, payload) => {
        const result = await Mongo.updateOne('deviceUsageInfos', filter, payload);
        return result;
    }

    static enableOrDisableDeviceUsageAlerts = async (getAlertDeviceIds, action, deviceImei) => {
        const objectIdDeviceIds = getAlertDeviceIds.map(id => new ObjectId(id));
        let result;
        if (action) {
            result = await Mongo.updateManyRaw(
                'deviceUsageInfos',
                { deviceId: { $in: objectIdDeviceIds } },
                { $addToSet: { alertSendto: deviceImei } }
            );
        } else {
            result = await Mongo.updateManyRaw(
                'deviceUsageInfos',
                { deviceId: { $in: objectIdDeviceIds } },
                { $pull: { alertSendto: deviceImei } }
            );
        }

        return result;
    }

    static setDeviceUsageAlertToDevices = async (setDeviceIds, action, data) => {
        const objectIdDeviceIds = setDeviceIds.map(id => new ObjectId(id));
        let result;
        if (action) {
            result = await Mongo.updateManyRaw(
                COLLECTION_NAME,
                { _id: { $in: objectIdDeviceIds } },
                { $addToSet: { deviceUsageAlertSentTo: data } }
            );
        } else {
            result = await Mongo.updateManyRaw(
                COLLECTION_NAME,
                { _id: { $in: objectIdDeviceIds } },
                { $pull: { deviceUsageAlertSentTo: { deviceImei: data.deviceImei } } }
            );
        }

        return result;
    }

    /* Admin Func for get all devices*/
    static getAllDevicesByAdmin = async (filter, skip = 0, limit = 10, sort = null) => {
        const query = {};
        if (filter.type && filter.type !== 'all') {
            if (filter.type === "mobile" || filter.type === "vehicle") {
                query.type = filter.type;
            } else if (filter.type === 'AAOS') {
                query["deviceInfo.attributes.platform"] = filter.type
            }
            else {
                query["deviceInfo.attributes.vehicleType"] = filter.type;
            }
        }

        if (filter.startDate || filter.endDate) {
            query.addedOn = {}

            if (filter.startDate) {
                query.addedOn.$gte = filter.startDate
            }

            if (filter.endDate) {
                query.addedOn.$lte = filter.endDate
            }
        }

        if (filter.userId) {
            query.userId = filter.userId
        }

        if (filter.searchString) {
            const searchRegex = new RegExp(filter.searchString, 'i');
            query.$and = [
                {
                    $or: [
                        { name: { $regex: searchRegex } },
                        { imei: { $regex: searchRegex } },
                        { "deviceInfo.attributes.registrationNo": { $regex: searchRegex } }
                    ]
                }
            ]
        }

        if (filter.sharedDevicesIds && filter.sharedDevicesIds.length > 0) {
            const sharedDevicesObjectIds = filter.sharedDevicesIds.map(id => new ObjectId(id));
            query._id = { $in: sharedDevicesObjectIds };
        }

        const result = await Mongo.findPaginationWithProject(COLLECTION_NAME, query, { image: 0 }, skip, limit, sort)
        const count = await Mongo.database.collection(COLLECTION_NAME).countDocuments(query)
        return { result, count }
    }

    static updateExpirationDate = async (payload) => {
        const operations = payload.map(doc => ({
            updateOne: {
                filter: { _id: doc.deviceId },
                update: {
                    $set: {
                        simExpirationDateInMs: doc.expirationDateInMs,
                        simExpirationDateString: doc.expirationDateString,
                        simExpiryDate: doc.simExpiryDate,
                        simDaysRemaining: typeof doc.simDaysRemaining === 'number' ? doc.simDaysRemaining : null
                    }
                },
                upsert: false
            }
        }));

        const result = await Mongo.bulkWrite(COLLECTION_NAME, operations);
        return result;
    }

    static getGPSDevicesExpirationUnderUser = async (userId) => {
        const result = await Mongo.findProjection(
            COLLECTION_NAME,
            { type: "vehicle", userId: userId.toString() },
            { _id: 1, simExpirationDateInMs: 1, name: 1 }
        )
        return result
    }

    static sumbitSimExpirationNotifyCount = async (deviceIds) => {
        const result = await Mongo.updateOneIncreament(
            COLLECTION_NAME,
            { _id: { $in: deviceIds } },
            { simExpirationNotifyCount: 1 }
        )

        return result
    }

    static resetSimExpirationNotifyCountMonthly = async () => {
        const result = await Mongo.updateMany(
            COLLECTION_NAME,
            {},
            { simExpirationNotifyCount: 0 }
        );

        return result;
    }

    static updateBlockedApps = async (deviceId, blockedAppsArray) => {
        const filter = { _id: new ObjectId(deviceId) };
        const update = {
            'deviceInfo.attributes.blockedApps': blockedAppsArray
        };
        return await Mongo.updateOne(COLLECTION_NAME, filter, update);
    };

    static getUpdatedBlockedAppsArray = async (deviceId, appName, packageName, action) => {
        const filter = { _id: new ObjectId(deviceId) };
        const device = await Mongo.findOne(COLLECTION_NAME, filter);

        if (!device) throw new Error('Device not found');

        // Safe structure initialization
        if (!device.deviceInfo) device.deviceInfo = {};
        if (!device.deviceInfo.attributes) device.deviceInfo.attributes = {};
        if (!Array.isArray(device.deviceInfo.attributes.blockedApps)) {
            device.deviceInfo.attributes.blockedApps = [];
        }

        const blockedApps = device.deviceInfo.attributes.blockedApps;

        if (action === 'block') {
            const exists = blockedApps.some(app => app.packageName === packageName);
            if (!exists) blockedApps.push({ appName, packageName });
        } else if (action === 'unblock') {
            device.deviceInfo.attributes.blockedApps = blockedApps.filter(
                app => app.packageName !== packageName
            );
        } else {
            throw new Error('Invalid action');
        }

        return device.deviceInfo.attributes.blockedApps;
    };

    static getStepsByDevice = async (deviceImei) => {
        return await Mongo.findOne('stepsWalked', { deviceImei });
    }

    static createStepsWalked = async (payload) => {
        return await Mongo.insertOne('stepsWalked', payload);
    }

    static updateStepsByDevice = async (deviceImei, stepWalked) => {
        return await Mongo.updateOne('stepsWalked', { deviceImei }, { stepWalked: stepWalked });
    }
}

module.exports = Device