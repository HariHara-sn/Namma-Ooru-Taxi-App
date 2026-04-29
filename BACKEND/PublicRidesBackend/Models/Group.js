const { ObjectId } = require('mongodb');
const Mongo = require('../Controllers/DB/Mongo');
const { DatabaseInsertFailed, DatabaseDeleteFailed } = require('./Exeptions');

const COLLECTION_NAME = 'groups'

/**
 * Represents a Group entity with methods to interact with group data in the database.
 */
class Group {

    // Add a new group to the collection
    static addGroup = async (group) => {
        const result = await Mongo.insertOne(COLLECTION_NAME, group);
        if (result.acknowledged) return result
        else throw new DatabaseInsertFailed('Failed to add group to databse -- Insert Failed');
    }

    static getUserOwnedSharedGroup = async (userId) => {
        const query = {
            $or: [
                { groupAdmin: userId },
                { 'users': { $elemMatch: { userId: userId, accepted: true } } }
            ]
        }
        const result = await Mongo.find(COLLECTION_NAME, query);
        return result;
    }

    static checGroupNameAlreadyExistsUnderUser = async (userId, groupName) => {
        const group = await Mongo.findOne(COLLECTION_NAME, { groupAdmin: userId, name: groupName });
        if (group) return group;
        return false;
    }
    // Delete a group by its ID
    static deleteGroup = async (id) => {
        const result = await Mongo.deleteOne(COLLECTION_NAME, { _id: new ObjectId(id) });
        if (result.deletedCount === 0) throw new DatabaseDeleteFailed('Group not found')
        return result;
    }

    static getGroupFromId = async (id) => {
        const group = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(id) });
        if (group) return group;
        return false;
    }

    static checkGroupExists = async (id, userId) => {
        const group = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(id), groupAdmin: userId });
        if (group) return group;
        return false;
    }

    //check group exist by groupid only
    static checkGroupExistsByGroupId = async (id) => {
        const group = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(id) });
        if (group) return group;
        return false;
    }

    static getGroupDeviceImeis = async (groupId) => {
        const query = {
            _id: new ObjectId(groupId)
        }
        const group = await Mongo.findOne(COLLECTION_NAME, query);
        if (!group) return [];
        const deviceIds = group.devices.map(device => new ObjectId(device.deviceId));
        const query2 = {
            _id: { $in: deviceIds }
        }
        let imeis = await Mongo.findProjection("devices", query2, { imei: 1 });
        imeis = imeis.map(device => device.imei)
        return imeis;
    }

    static getFullGroupData = async (id) => {
        const query = [
            {
                "$match": {
                    "_id": new ObjectId(id) // Replace this with the actual group _id
                }
            },
            {
                "$unwind": "$devices"
            },
            {
                "$addFields": {
                    "convertedDeviceId": {
                        "$toObjectId": "$devices.deviceId"
                    }
                }
            },
            {
                "$lookup": {
                    "from": "devices",
                    "localField": "convertedDeviceId",
                    "foreignField": "_id",
                    "as": "deviceDetails"
                }
            },
            {
                "$unwind": "$deviceDetails"
            },
            {
                "$group": {
                    "_id": "$_id",
                    "name": { "$first": "$name" },
                    "devices": { "$push": "$deviceDetails" }
                }
            }
        ]


        const result = await Mongo.aggregate(COLLECTION_NAME, query);
        return result;
    }

    // Update a group by its ID
    static updateGroup = async (id, group) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(id) }, group);
        return result;
    }

    // Add a user to a group by group ID
    static addUser = async (id, user) => {
        const result = await Mongo.updateOnePush(COLLECTION_NAME, { _id: new ObjectId(id) }, { users: user });
        if (result.modifiedCount === 1) return result
        else throw new DatabaseInsertFailed('Failed to add user to group -- Insert Failed');
    }

    static acceptUserToGroup = async (groupId, userId) => {
        const result = await Mongo.updateOneRaw(COLLECTION_NAME, { _id: new ObjectId(groupId), "users.userId": userId }, { $set: { "users.$.accepted": true } });
        if (result.modifiedCount === 0) throw new DatabaseInsertFailed('Failed to update user acceptance in group -- Update Failed');
        return result;
    }

    static rejectUserToGroup = async (groupId, userId) => {
        const result = await Mongo.updateOneRaw(COLLECTION_NAME, { _id: new ObjectId(groupId), "users.userId": userId, "users.accepted": false }, { $pull: { users: { userId: userId } } });
        if (result.modifiedCount === 0) throw new DatabaseInsertFailed('Failed to update user acceptance in group -- Update Failed');
        return result;
    }

    static checkUserAlreadyInGroup = async (id, userId) => {
        const group = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(id), "users.userId": userId });
        if (group) return group;
        return false;
    }

    // Delete a user from a group by group ID and user object
    static deleteUser = async (id, user) => {
        const result = await Mongo.updateOnePull(COLLECTION_NAME, { _id: new ObjectId(id) }, { users: user });
        if (result.modifiedCount === 0) throw new DatabaseDeleteFailed('User not found in group')
        return result;
    }

    // Update a user in a group by group ID and user object
    static updateUser = async (id, user) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, 
            { _id: new ObjectId(id), "users.userId": user.userId }, 
            {
                'users.$.email': user.email,
                'users.$.role': user.role
            }
        );
        if (result.modifiedCount === 0) throw new DatabaseInsertFailed('Failed to update user in group -- Update Failed');
        return result;
    }

    // Add a device to a group by group ID
    static addDevice = async (id, device) => {
        const result = await Mongo.updateOnePush(COLLECTION_NAME, { _id: new ObjectId(id) }, { devices: device });
        if (result.modifiedCount === 0) throw new DatabaseInsertFailed('Failed to add device to group -- Insert Failed');
        return result;
    }

    static addDevices = async (id, devices) => {

        const result = await Mongo.updateOnePush(COLLECTION_NAME, { _id: new ObjectId(id) }, { devices: { $each: devices } });
        if (result.modifiedCount === 0) throw new DatabaseInsertFailed('Failed to add devices to group -- Insert Failed');
        return result;
    }

    // Delete a device from a group by group ID and device ID
    static deleteDevice = async (id, device) => {
        const result = await Mongo.updateOnePull(COLLECTION_NAME, { _id: new ObjectId(id) }, { devices: device });
        if (result.modifiedCount === 0) throw new DatabaseDeleteFailed('Device not found in group')
        return result;
    }

    // Delete a device from a groups by group IDs and device ID
    static deleteDeviceMany = async (groupIds, deviceId) => {
        const groupIdsObjectIds = groupIds.map(hexString => new ObjectId(hexString));
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, { _id: { $in: groupIdsObjectIds } }, { $pull: { devices: { deviceId: deviceId } } });
        if (result.modifiedCount === 0) throw new DatabaseDeleteFailed('Device not found in group')
        return result;
    }

    // Update a device in a group by group ID, device ID, and updated device object
    static updateDevice = async (id, deviceId, updatedDevice) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(id), "devices.deviceId": deviceId }, { $set: { "devices.$": updatedDevice } });
        return result;
    }

    static checkUserHasDeleteGroupAccess = async (userId, id) => {
        const group = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(id) });
        if (!group) return false;
        if (group.groupAdmin === userId) return group;
        return false;
    }

    static checkUserHasAdminAccess = async (userId, id) => {
        const query = {
            _id: new ObjectId(id),
            "users": {
                "$elemMatch": {
                    "userId": userId,
                    "role": { "$in": ["owner"] }
                }
            }
        }

        const group = await Mongo.findOne(COLLECTION_NAME, query);
        if (group) return group;
        return false;
    }

    static checkDeviceExistsInGroup = async (id, deviceId) => {
        const group = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(id), "devices.deviceId": deviceId });
        if (group) return group;
        return false;
    }

    static addGeoFenceToGroup = async (userId, id, geoFence) => {
        const result = await Mongo.updateOnePush(COLLECTION_NAME, { _id: new ObjectId(id), groupAdmin: userId, "geofences.geofenceId": { "$ne": geoFence["geofenceId"] } }, { geofences: geoFence });
        if (result.modifiedCount === 0) throw new DatabaseInsertFailed('Failed to add geofence to group -- Duplicate Insert Failed');
        return result;
    }

    static deleteGeoFenceFromGroup = async (userId, id, geoFence) => {
        const result = await Mongo.updateOnePull(COLLECTION_NAME, { _id: new ObjectId(id), groupAdmin: userId }, { geofences: geoFence });
        if (result.modifiedCount === 0) throw new DatabaseDeleteFailed('Geofence not found in group')
        return result;
    }

    // delete geofence from groups based on id
    static deleteGeoFenceFromGroups = async (geofenceId) => {
        const result = await Mongo.updateOnePull(COLLECTION_NAME, {}, { geofences: { geofenceId: geofenceId } });
        // if (result.modifiedCount === 0) throw new DatabaseDeleteFailed('Geofence not found in any group')
        return result;
    }

    static addGeofenceToGroups = async (geofence, groupIds) => {
        const groupIdsObjectIds = groupIds.map(hexString => new ObjectId(hexString));
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, { _id: { $in: groupIdsObjectIds }, "geofences.geofenceId": { $ne: geofence.geofenceId } }, { $addToSet: { geofences: geofence } });
        if (result.modifiedCount === 0) throw new DatabaseInsertFailed('Failed to add geofence to groups -- Insert Failed or Geofence already exists in all specified groups');
        return result;
    }

    static removeGeofenceFromGroups = async (geofence, groupIds) => {
        const groupIdsObjectIds = groupIds.map(hexString => new ObjectId(hexString));
        const result = await Mongo.updateManyRaw(COLLECTION_NAME, { _id: { $in: groupIdsObjectIds }, "geofences.geofenceId": geofence.geofenceId }, { $pull: { geofences: { geofenceId: geofence.geofenceId } } });
        if (result.modifiedCount === 0) throw new DatabaseDeleteFailed('Geofence not found in group')
        return result;
    }

    static getGroups = async (userId) => {
        const groups = await Mongo.find(COLLECTION_NAME, { $or: [{ groupAdmin: userId }, { "users.userId": userId }] });
        return groups;
    }

    static getAllGroupsBasedGeofenceId = async (userId, geofenceId) => {
        const result = await Mongo.find(COLLECTION_NAME, { groupAdmin: userId, geofences: geofenceId });
        return result;
    }

    static getDevicesUnderGroup = async (id) => {
        const group = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(id) });
        return group.devices;
    }

    static getGeofencesUnderGroup = async (id) => {
        const group = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(id) });
        return group.geofences;
    }

    // Search Groups Using Search String
    static searchGroups = async (query) => {
        const result = await Mongo.find(COLLECTION_NAME, query);
        return result;
    }

    static getDevicesFromGroups = async (groupIds) => {
        const groupIdsObjectIds = groupIds.map(hexString => new ObjectId(hexString));
        const result = await Mongo.find(COLLECTION_NAME, { _id: { $in: groupIdsObjectIds } }, { devices: 1 });
        return result;
    }

    // checking groups ownership
    static checkGroupsOwnerShip = async (userId, groupIds) => {
        const objectIdGroupIds = groupIds.map(id => new ObjectId(id));
        const ownedGroups = await Mongo.find(COLLECTION_NAME, { _id: { $in: objectIdGroupIds }, groupAdmin: userId });
        const ownedGroupIds = ownedGroups.map(group => group._id.toString());
        return ownedGroupIds;
    }

    // Aggregation to get users.userId
    static getUsersUserId = async (pipeline) => {
        const result = await Mongo.aggregate(COLLECTION_NAME, pipeline);
        return result;
    }

    static getUsersFromGroups = async (groupIds) => {
        const groupIdsObjectIds = groupIds.map(hexString => new ObjectId(hexString));
        const result = await Mongo.find(COLLECTION_NAME, { _id: { $in: groupIdsObjectIds } }, { 'users.userId': 1 });
        return result.flatMap(group => group.users.map(user => user.userId));
    }

    static getUsersFromGroup = async (groupId) => {
        const result = await Mongo.findProjection(COLLECTION_NAME, { _id: new ObjectId(groupId) }, { 'users.userId': 1 });
        return result.flatMap(group => group.users.map(user => user.userId));
    }

    static checkUserGroupRole = async (group, userId) => {
        if (!group || !userId) return false;

        const isGroupAccessible = group.users?.find(
            user => user.userId === userId && (user.role === 'owner' || user.role === 'admin')
        );
        
        return isGroupAccessible
    }

    //admin tools
    static getGroupsByAdmin = async (filter, skip = 0, limit = 10) => {
        const query = {};

        if (filter.startDate || filter.endDate) {
            query.addedOn = {}
    
            if (filter.startDate) {
                query.addedOn.$gte = filter.startDate
            }
    
            if (filter.endDate) {
                query.addedOn.$lte = filter.endDate
            }
        }

        if(filter.userId){
            query.groupAdmin = filter.userId
        }

        if (filter.searchString) {
            const searchRegex = new RegExp(filter.searchString, 'i');
            query.$and = [
                {
                    $or: [
                        { name: { $regex: searchRegex } },
                        { description: { $regex: searchRegex } },
                        { adminEmail: {$regex: searchRegex } }
                    ]
                }
            ]
        }

        if (filter.groupIds && filter.groupIds.length > 0) {
            const groupObjectIds = filter.groupIds.map(id => new ObjectId(id));
            query._id = { $in: groupObjectIds };
        }
        
        const result = await Mongo.findPaginationWithProject(COLLECTION_NAME, query, { image: 0 }, skip, limit)
        const count = await Mongo.database.collection(COLLECTION_NAME).countDocuments(query)
        return { result, count }
    }

}

module.exports = Group;