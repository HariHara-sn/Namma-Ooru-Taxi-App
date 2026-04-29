const Mongo = require('../Controllers/DB/Mongo');
const { DatabaseInsertFailed, DatabaseDeleteFailed, DatabaseUpdateFailed } = require('./Exeptions');
const COLLECTION_NAME = 'vehicles'

class Vehicles {
    static removeVehicleFromVendor = async (vendorId) => {
        const result = await Mongo.updateManyRaw(
            COLLECTION_NAME,
            { vendorId: vendorId },
            { $set: { isActive: false, isDeleted: true, driverId: "", deletedAt: new Date() } }
        );
        return result;
    }
   
    //SYNC with VMFleets Start
    static addVehicleToPublicRide = async (vehicle) => {
        const result = await Mongo.insertOne(COLLECTION_NAME, vehicle);
        if (result.acknowledged) return result
        else throw new DatabaseInsertFailed('Failed to add vehicle to databse -- Insert Failed');
    }

    static getVehicleStatusForVMFleets = async (vehicle) => {
        return Mongo.findOne(COLLECTION_NAME, { fleetSysVehicleId: vehicle.fleetSysVehicleId, fleetSysId: vehicle.fleetSysId });
    }
    static getVehicleByVehicleNumber = async (vehicleNumber) => {
        return Mongo.findOne(COLLECTION_NAME, { regNo: vehicleNumber });
    }

    static updateVehicleForVMFleets = async (vehicle) => {
        const updatePayload = { $set: { ...vehicle } };
        if (vehicle.removeDeletedAt) {
            updatePayload.$unset = { deletedAt: "" };
            delete updatePayload.$set.removeDeletedAt; // Remove the helper flag from update
        }
        const result = await Mongo.updateOneRaw(COLLECTION_NAME, { fleetSysVehicleId: vehicle.fleetSysVehicleId, fleetSysId: vehicle.fleetSysId }, updatePayload);
        if (result.acknowledged && result.modifiedCount > 0) return result
        else throw new DatabaseUpdateFailed('Failed to update vehicle in databse -- Update Failed');
    }

    static reactivateVehicle = async (vehicle) => {
        const baseUpdate = {
            isActive: true,
            isDeleted: false,
            driverId: ""
        };
    
        const updateSet = { ...baseUpdate, ...vehicle };

        if (updateSet.removeDeletedAt) {
            delete updateSet.removeDeletedAt;
        }
    
        const updatePayload = {
            $set: updateSet
        };
    
        if (vehicle.removeDeletedAt) {
            updatePayload.$unset = { deletedAt: "" };
        }
    
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            {
                $or: [
                    { fleetSysVehicleId: vehicle.fleetSysVehicleId },
                    { regNo: vehicle.regNo }
                ]
            },
            updatePayload
        );
    
        if (result.acknowledged && result.modifiedCount > 0) {
            return result;
        } else {
            throw new DatabaseUpdateFailed('Failed to reactivate vehicle in database -- Update Failed');
        }
    };
    

    static deleteVehicleForVMFleets = async (vehicle) => {
        const result = await Mongo.updateOneRaw(COLLECTION_NAME, { fleetSysVehicleId: vehicle.fleetSysVehicleId, fleetSysId: vehicle.fleetSysId }, { $set: { isActive: false, isDeleted: true, deletedAt: new Date(), driverId: "", isApproved: false } });
        if (result.acknowledged && result.modifiedCount > 0) return result
        else throw new DatabaseDeleteFailed('Failed to delete vehicle from databse -- Delete Failed');
    }
    //SYNC with VMFleets End

    static addPassangerVehicle = async (vehicleDoc) => {
        const result = await Mongo.insertOne(COLLECTION_NAME, vehicleDoc);
        if (result.acknowledged) return result;
        else throw new DatabaseInsertFailed('Failed to add passenger vehicle -- Insert Failed');
    }

    static getPassangerVehicles = async (passangerId) => {
        const { ObjectId } = require('mongodb');
        return Mongo.find(COLLECTION_NAME, { passangerId: new ObjectId(passangerId), isDeleted: { $ne: true } });
    }

    static updatePassangerVehicleById = async (vehicleId, updateDoc) => {
        const { ObjectId } = require('mongodb');
        return Mongo.updateOneRaw(COLLECTION_NAME, { _id: new ObjectId(vehicleId) }, { $set: updateDoc });
    }

    static deletePassangerVehicle = async (vehicleId) => {
        const { ObjectId } = require('mongodb');
        return Mongo.updateOneRaw(COLLECTION_NAME, { _id: new ObjectId(vehicleId) }, { $set: { isDeleted: true, deletedAt: new Date() } });
    }
}

module.exports = Vehicles;
