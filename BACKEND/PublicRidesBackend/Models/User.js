const Mongo = require('../Controllers/DB/Mongo')
const { ObjectId } = require('mongodb');

class User {
    constructor() {

    }
    static DataDeleteRequest = async (data) => {
        const result = await Mongo.insertOne('data_delete_requests', data);
        return result;
    }

    static addSharedDevice = async (userId, deviceId) => {
        const result = await Mongo.updateOneAddToSet('users', { _id: new ObjectId(userId) }, { sharedDevices: { $each: [new ObjectId(deviceId)] } });
        return result;
    }

    static getUsersWhoHasAccessToDevice = async (deviceId) => {
        const result = await Mongo.findProjection('users', { sharedDevices: { $in: [new ObjectId(deviceId)] } }, { _id: 1, name: 1, email: 1 })
        return result
    }

    static addDevice = async (userId, deviceId) => {
        const result = await Mongo.updateOneAddToSet('users', { _id: new ObjectId(userId) }, { devices: { $each: [new ObjectId(deviceId)] } });
        return result;
    }
    static addGroup = async (userId, groupId) => {
        const result = await Mongo.updateOneAddToSet('users', { _id: new ObjectId(userId) }, { groups: { $each: [new ObjectId(groupId)] } });
        return result;
    }

    static addSharedGroup = async (userId, groupId) => {
        const result = await Mongo.updateOneAddToSet('users', { _id: new ObjectId(userId) }, { sharedGroups: { $each: [new ObjectId(groupId)] } });
        return result;
    }

    static addSharedGroupToUsers = async (groupId, userIds) => {
        userIds = userIds.map(userId => new ObjectId(userId))
        const result = await Mongo.updateManyRaw('users', { _id: { $in: userIds } }, { $addToSet: { sharedGroups: new ObjectId(groupId) } });
        return result;
    }

    static addEmergencyContactsToUsers = async (userId, contactData) => {
        const result = await Mongo.updateOnePush('users', { _id: new ObjectId(userId) }, { emergencyContacts: contactData });
        return result;
    }

    static removeSharedDevice = async (userId, deviceId) => {
        const result = await Mongo.updateOnePull('users', { _id: new ObjectId(userId) }, { sharedDevices: new ObjectId(deviceId) });
        return result;
    }

    static removeDevice = async (userId, deviceId) => {
        const result = await Mongo.updateOnePull('users', { _id: new ObjectId(userId) }, { devices: new ObjectId(deviceId) });
        return result;
    }

    static removeGroup = async (userId, groupId) => {
        const result = await Mongo.updateOnePull('users', { _id: new ObjectId(userId) }, { groups: new ObjectId(groupId) });
        return result;
    }

    static removeSharedGroup = async (userIds, groupId) => {
        userIds = userIds.map(hexString => new ObjectId(hexString));
        const result = await Mongo.updateOnePull('users', { _id: { $in: userIds } }, { sharedGroups: new ObjectId(groupId) });
        return result;
    }

    static removeGroupAndSharedGroup = async (userIds, groupId) => {
        userIds = userIds.map(hexString => new ObjectId(hexString));
        const result = await Mongo.updateOnePull('users', { _id: { $in: userIds } }, { sharedGroups: new ObjectId(groupId), groups: new ObjectId(groupId) });
        return result;
    }

    static removeEmergencyContacts = async (userId, contactId) => {
        const result = await Mongo.updateOnePull('users', { _id: new ObjectId(userId) }, { emergencyContacts: { contactId } });
        return result;
    }

    // static checkUserExists = async ({ email, phone }) => {
    //     const query = {}
    //     if (email) {
    //         query.email = email
    //     }
    //     if (phone) {
    //         query.phone = phone
    //     }
    //     const user = await Mongo.findOne('users', query);
    //     return user;
    // }


    static checkUserExists = async ({ email, phone }) => {
        let query = {};
        if (email && phone) {
            query = { $or: [{ email: email }, { phone: phone }] };
        } else if (email) {
            query = { email: email };
        } else if (phone) {
            query = { phone: phone };
        }
        const user = await Mongo.findOne('users', query);
        return user;
    }
    static checkUserExistsById = async (id) => {
        const user = await Mongo.findOne('users', { _id: new ObjectId(id) });
        return user;
    }

    static addUser = async (user) => {
        const result = await Mongo.insertOne('users', user);
        return result;
    }

    static getUserFromId = async (id) => {
        const user = await Mongo.findOne('users', { _id: new ObjectId(id) });
        return user;
    }

    static deleteUser() {

    }

    static updatePassword = async (id, password) => {
        id = new ObjectId(id);
        const result = await Mongo.updateOne('users', { _id: id }, { password: password });
        return result;
    }

    static getUserDetail = async (id) => {
        const result = await Mongo.findOne("users", { _id: new ObjectId(id) });
        return result;
    }

    static getUserImage = async (id) => {
        const result = await Mongo.findOneProjection("users", { _id: new ObjectId(id) }, { image: 1 });
        return result;
    }

    static updateUserDetail = async (id, data) => {
        id = new ObjectId(id);
        const result = await Mongo.updateOne('users', { _id: id }, data);
        return result;
    }


    static getUserWithPhoneorEmail(payload) {
        if (payload.email) return Mongo.findOne('users', { email: payload.email });
        return Mongo.findOne('users', { phone: payload.phone });
    }

    static getUsers() {
        return [];
    }

    static createJWT = async () => {
        return 'token';
    }

    static login = async (id) => {
        const query = {
            _id: new ObjectId(id)
        }

        const updateQuery = {
            lastLogin: new Date().getTime()
        }
        await Mongo.updateOne('users', query, updateQuery);
        const token = await this.createJWT(id);
        return token;
    }

    // Search users Using Search String
    static searchUsers = async (query, projection) => {
        const result = await Mongo.findProjection('users', query, projection);
        return result;
    }

    static updateUserFcmToken = async (id, fcmToken) => {
        /* remove existing device Imei from other user's data */
        await Mongo.updateManyRaw('users', { "fcmTokens.deviceImei": fcmToken.deviceImei }, { $pull: { fcmTokens: { deviceImei: fcmToken.deviceImei } } });

        // update the device imei into the current login user's data
        const result = await Mongo.updateOneAddToSet('users', { _id: new ObjectId(id) }, { fcmTokens: fcmToken });
        return result;
    }

    static removeUserFcmTokenDeviceImei = async (id, fcmToken) => {
        const result = await Mongo.updateOnePull('users', { _id: new ObjectId(id) }, { fcmTokens: { deviceImei: fcmToken.deviceImei } });
        return result;
    }

    static getUserFcmToken = async (ids, excludeImeis = []) => {
        const objectIdUserIds = ids.map(id => new ObjectId(id));
        const results = await Mongo.findProjection('users', { _id: { $in: objectIdUserIds } }, { "fcmTokens.token": 1, _id: 0 });

        const fcmTokens = results.flatMap(tokens => tokens.fcmTokens)
            .filter(fcmToken => !excludeImeis.includes(fcmToken?.deviceImei))
            .map(fcmToken => fcmToken?.token);
        return fcmTokens;
    }

    static removeFcmTokens = async (fcmTokens) => {
        const result = await Mongo.updateManyRaw('users', { "fcmTokens.token": { $in: fcmTokens } }, { $pull: { fcmTokens: { token: { $in: fcmTokens } } } });
        return result;
    }

    static getSharedDeviceUsers = async (deviceId) => {
        const results = await Mongo.findProjection('users', { sharedDevices: new ObjectId(deviceId) }, { _id: 1 });
        const sharedDeviceUserIds = results.map(result => result._id.toString());
        return sharedDeviceUserIds;
    }

    static addLastPasswordResetRequestedOn = async (userId, lastPasswordResetRequestedOn) => {
        const result = await Mongo.updateOne('users', { _id: new ObjectId(userId) }, { lastPasswordResetRequestedOn });
        return result;
    }

    /* SET USER SUBSCRIPTION */
    static setUserSubscription = async (userId, subscription) => {
        const result = await Mongo.updateOne('users', { _id: new ObjectId(userId) }, { subscription });
        return result;
    }

    static getUserFromPurchaseToken = async (purchaseToken) => {
        const result = await Mongo.findOne('users', { 'subscription.subscription.token': purchaseToken });
        return result;
    }

    static updateUserSubscriptionRenewal = async (userId, gResponse, expiry) => {
        const result = await Mongo.updateOne('users', { _id: new ObjectId(userId) }, {
            'subscription.subscription.expiry': expiry,
            'subscription.gRes': gResponse,
            'subscription.subscribedOn': new Date().getTime()
        });
        return result;
    }

    /* Admin Func */
    static async getAdminWithPhoneorEmail(payload) {
        try {
            if (payload.email) return await Mongo.findOne('users', { email: payload.email, isAdmin: true });
            return await Mongo.findOne('users', { phone: payload.phone, isAdmin: true });
        } catch (err) {
            console.error('getAdminWithPhoneorEmail failed:', err?.message || err);
            return null;
        }
    }

    static checkAdminExistsById = async (id) => {
        const admin = await Mongo.findOne('users', { _id: new ObjectId(id), isAdmin: true });
        return admin;
    }

    static getAllUsersByAdmin = async (filter, skip = 0, limit = 10) => {
        const query = { isAdmin: { $exists: false } }; // get only users not the admins

        if (filter.startDate || filter.endDate) {
            const dateRangeQuery = {};
            if (filter.startDate) {
                const startDateObjectId = new ObjectId(Math.floor(filter.startDate).toString(16).padStart(8, '0') + '0000000000000000');
                dateRangeQuery.$gte = startDateObjectId
            }

            if (filter.endDate) {
                const endDateObjectId = new ObjectId(Math.floor(filter.endDate).toString(16).padStart(8, '0') + '0000000000000000');
                dateRangeQuery.$lte = endDateObjectId
            }

            query._id = dateRangeQuery;
        }

        if (filter.minDevices || filter.maxDevices) {
            const deviceQuery = [];
            if (filter.minDevices) {
                deviceQuery.push({ $gte: [{ $size: { $ifNull: ["$devices", []] } }, filter.minDevices] });
            }
            if (filter.maxDevices) {
                deviceQuery.push({ $lte: [{ $size: { $ifNull: ["$devices", []] } }, filter.maxDevices] });
            }

            if (deviceQuery.length > 0) {
                query.$expr = { $and: deviceQuery };
            }
        }

        if (filter.userSubscription !== "All users") {
            if (filter.userSubscription === "Subscribed users") {
                query["subscription.subscription.expiry"] = { $gt: new Date().getTime() }
            } else if (filter.userSubscription === "Not subscribed users") {
                query.subscription = { $exists: false }
            } else if (filter.userSubscription === "Subscription expired users") {
                query["subscription.subscription.expiry"] = { $lt: new Date().getTime() }
            }
        }

        if (filter.searchString) {
            const searchRegex = new RegExp(filter.searchString, 'i');
            query.$and = [
                {
                    $or: [
                        { name: { $regex: searchRegex } },
                        { email: { $regex: searchRegex } },
                        { phone: { $regex: searchRegex } },
                        // { authMethod: { $regex: searchRegex } },
                        // { "subscription.subscription.subscriptionId": { $regex: searchRegex } }
                    ]
                }
            ]
        }

        const result = await Mongo.findPaginationWithProject('users', query, { password: 0, fcmTokens: 0 }, skip, limit)
        const count = await Mongo.database.collection('users').countDocuments(query)

        return { result, count }
    }

    static getAllUsers = async () => {
        const result = await Mongo.findProjection('users', {}, { password: 0, fcmTokens: 0 })
        return result
    }

    static deleteUserDetails = async (userDevices, groupGeofenceIds, _userGroupsIds, userId) => {
        if (userDevices.length > 0) {
            await Mongo.deleteMany('devices', { _id: { $in: userDevices } });
        }

        if (groupGeofenceIds.length > 0) {
            await Mongo.deleteMany('geofences', { _id: { $in: groupGeofenceIds } });
        }

        if (_userGroupsIds.length > 0) {
            await Mongo.deleteMany('groups', { _id: { $in: _userGroupsIds } });
        }

        if (_userGroupsIds.length > 0) {
            await Mongo.updateMany('groups',
                { _id: { $in: _userGroupsIds } },
                {
                    $pull: {
                        users: { userId: userId },
                        devices: { devices: { $in: userDevices.map(id => id.toString()) } },
                        geofences: { geofences: { $in: groupGeofenceIds.map(id => id.toString()) } }
                    }
                }
            );
        }

        await Mongo.deleteOne('users', { _id: new ObjectId(userId) });
    }

    static updateNotificationPreferences = async (userId, preferences) => {
        const result = await Mongo.updateOne('users', { _id: new ObjectId(userId) }, { disabledNotification: preferences });
        return result;
    }

    static storeUserApiKey = async (userId, apiKey) => {
        const result = await Mongo.updateOne('users', { _id: new ObjectId(userId) }, { apiKey: apiKey });
        return result;
    }
}


module.exports = User;