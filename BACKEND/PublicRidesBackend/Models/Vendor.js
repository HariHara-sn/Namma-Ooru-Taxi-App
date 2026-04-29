const Mongo = require('../Controllers/DB/Mongo');
const { DatabaseInsertFailed, DatabaseDeleteFailed, DatabaseUpdateFailed } = require('./Exeptions');

const COLLECTION_NAME = 'vendors'

class Vendors {

    

    static checkVendorExist = async ( payload ) => {
        let query = {};
        if ( payload.ownerEmail && payload.ownerPhone && payload.fleetSysId ) {
            query = { $or: [{ ownerEmail: payload.ownerEmail }, { ownerPhone: payload.ownerPhone }, { fleetSysId: payload.fleetSysId }] };
        } else if ( payload.ownerEmail ) {
            query = { ownerEmail: payload.ownerEmail };
        } else if ( payload.fleetSysId ) {
            query = { fleetSysId: payload.fleetSysId };
        }
        return Mongo.findOne(COLLECTION_NAME, query);
    }
    static addVendor = async (vendor) => {
        const result = await Mongo.insertOne(COLLECTION_NAME, vendor);
        if (result.acknowledged) return result
        else throw new DatabaseInsertFailed('Failed to add vendor to databse -- Insert Failed');
    }

    static updateVendor = async (fleetSysId, vendor) => {
        const updatePayload = { $set: { ...vendor } };

        // If vendor.removeDeletedAt is true, remove the deletedAt field
        if (vendor.removeDeletedAt) {
            updatePayload.$unset = { deletedAt: "" };
            delete updatePayload.$set.removeDeletedAt; // Remove the helper flag from update
        }

        const result = await Mongo.updateOneRaw(COLLECTION_NAME, { fleetSysId: fleetSysId }, updatePayload);
        if (result.acknowledged) return result
        else throw new DatabaseUpdateFailed('Failed to update vendor in databse -- Update Failed');
    }

    static deleteVendor = async (fleetSysId) => {
        const result = await Mongo.updateOneRaw(COLLECTION_NAME, { fleetSysId: fleetSysId }, { $set: { isActive: false, isDeleted: true, deletedAt: new Date() } });
        if (result.acknowledged) return result
        else throw new DatabaseDeleteFailed('Failed to delete vendor from databse -- Delete Failed');
    }

    static getVendor = async (fleetSysId) => {
        return Mongo.findOne(COLLECTION_NAME, { fleetSysId: fleetSysId });
    }

    static getVendorWithId = async (id) => {
        return Mongo.findOne(COLLECTION_NAME, { _id: id });
    }
}
module.exports = Vendors;
