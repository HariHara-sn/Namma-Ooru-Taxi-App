const Mongo = require('../Controllers/DB/Mongo');

const COLLECTION_NAME = 'fareconfigs'

/**
 * Represents a Passanger entity with methods to interact with passanger data in the database.
 */
class FareConfigs {

    static getFareConfigById = async (id) => {
        const fareConfig = await Mongo.findOne(COLLECTION_NAME, { _id: id });
        return fareConfig;
    }

    static getVehicleType = async (regionCode="default") => {
        const fareConfig = await Mongo.findOne(COLLECTION_NAME, { regionCode });
        return fareConfig;
    }


    static getMaxDistanceLimit = async (regionCode="default", vehicleType) => {
        const fareConfig = await Mongo.findOne(COLLECTION_NAME, { regionCode });

        if (!fareConfig || !fareConfig.vehicleTypes) {
            return 20; // sensible default if config missing
        }

        // If vehicleType provided, try to fetch the specific vehicle's maxDistanceLimit
        if (vehicleType) {
            const key = String(vehicleType).toUpperCase();
            const vt = fareConfig.vehicleTypes[key];
            if (vt && typeof vt.maxDistanceLimit === 'number') {
                return vt.maxDistanceLimit;
            }
        }

        // No vehicleType provided or not found: try a reasonable fallback from any vehicle type
        const anyType = Object.values(fareConfig.vehicleTypes).find(v => typeof v?.maxDistanceLimit === 'number');
        return anyType?.maxDistanceLimit ?? 20;
    }
}

module.exports = FareConfigs;