const { ObjectId } = require('mongodb');
const Mongo = require('../Controllers/DB/Mongo');
const { DatabaseInsertFailed, DatabaseUpdateFailed } = require('./Exeptions');

const COLLECTION_NAME = 'passengerGarageVehicles';

class Garage {
    static addVehicle = async (vehicle) => {
        const result = await Mongo.insertOne(COLLECTION_NAME, vehicle);
        if (result.acknowledged) return result;
        throw new DatabaseInsertFailed('Failed to add garage vehicle -- Insert Failed');
    }

    static getVehicleById = async (vehicleId) => {
        return Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(vehicleId), isDeleted: { $ne: true } });
    }

    static getPassengerVehicleById = async (passengerId, vehicleId) => {
        return Mongo.findOne(COLLECTION_NAME, {
            _id: new ObjectId(vehicleId),
            passengerId: new ObjectId(passengerId),
            isDeleted: { $ne: true }
        });
    }

    static getPassengerVehicles = async (passengerId) => {
        return Mongo.find(COLLECTION_NAME, {
            passengerId: new ObjectId(passengerId),
            isDeleted: { $ne: true }
        });
    }

    static getVehicleByRegNo = async (regNo) => {
        return Mongo.findOne(COLLECTION_NAME, {
            regNo,
            isDeleted: { $ne: true }
        });
    }

    static updateVehicle = async (passengerId, vehicleId, updateDoc) => {
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            {
                _id: new ObjectId(vehicleId),
                passengerId: new ObjectId(passengerId),
                isDeleted: { $ne: true }
            },
            { $set: updateDoc }
        );
        if (result.acknowledged) return result;
        throw new DatabaseUpdateFailed('Failed to update garage vehicle -- Update Failed');
    }

    static deleteVehicle = async (passengerId, vehicleId) => {
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            {
                _id: new ObjectId(vehicleId),
                passengerId: new ObjectId(passengerId),
                isDeleted: { $ne: true }
            },
            { $set: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() } }
        );
        if (result.acknowledged) return result;
        throw new DatabaseUpdateFailed('Failed to delete garage vehicle -- Update Failed');
    }
}

module.exports = Garage;
