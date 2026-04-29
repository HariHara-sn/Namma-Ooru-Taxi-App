const Mongo = require('../Controllers/DB/Mongo');

const COLLECTION_NAME = 'driverSessions'

class DriverSession {


    static createDriverSession = async ( deviceDetail, driverDetail, userId, time ) => {
        const driverId = driverDetail?.insertedId?.toString() || driverDetail?._id?.toString() || null;
        await DriverSession. endDriverSession( driverId, time )
        const data = {
            deviceId: deviceDetail._id.toString(),
            vehicleType: deviceDetail?.deviceInfo?.attributes?.vehicleType,
            vehicleName: deviceDetail.name,
            driverId,
            driverName: driverDetail.name,
            allocatedBy: userId,
            allocatedOn: time, 
            startTime: time,
            status: 'active'
        }
        const driverSession = await Mongo.insertOne( COLLECTION_NAME, data );
        return driverSession
    }

    static endDriverSession = async ( driverId, time ) => {
        const endDriverSession = await Mongo.updateOne( 
            COLLECTION_NAME, 
            { driverId: driverId.toString(), endTime: { $exists: false } }, 
            { endTime: time, updatedOn: time, status: 'completed' }
        );
        return endDriverSession
    }

    static getDriverSessions = async ( driverId, startTime, endTime ) => {
        const result= await Mongo.findProjection( 
            COLLECTION_NAME, 
            { driverId, startTime: { $gte: startTime }, endTime: { $lte: endTime } },
            { _id: 0, driverId: 0, driverName: 0 }
        );
        return result
    }

    static getVehicleSessions = async ( deviceId, startTime, endTime ) => {
        const result= await Mongo.findProjection( 
            COLLECTION_NAME, 
            { deviceId, startTime: { $gte: startTime }, endTime: { $lte: endTime } },
            { _id: 0, deviceId: 0, vehicleName: 0, vehicleType: 0}
        );
        return result
    }
}

module.exports = DriverSession;