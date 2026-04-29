const Controller = require('../Controller');
const RegionalOffices = require('../../Models/RegionalOffices');
const Mongo = require('../DB/Mongo');



class PublicRideRegionalOffices extends Controller {

    constructor() {
        super()
    }

    static getRegionalOffices = async (location) => {
        try {
            const servingArea = await RegionalOffices.getRegionalOffice(location);

            if (!servingArea) {
                return null;
            }

            return {
                regionFareId: servingArea.fareConfig?.regionCode || 'default',
                regionOfficeId: servingArea.regionalOffice?._id || null
            };
        } catch (error) {
            console.error('Error in getRegionalOffices:', error);
            return null;
        }
    }

    static getRegionalOfficeById = async (id) => {
        const regionalOffice = await Mongo.findOne('regionaloffices', { _id: id });
        return regionalOffice;
    }
}

module.exports = PublicRideRegionalOffices;