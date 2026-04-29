// const { ObjectId } = require('mongodb');
const Mongo = require('../Controllers/DB/Mongo');
// const { DatabaseUpdateFailed } = require('./Exeptions');

const COLLECTION_NAME = 'tolls'

class Toll {

    static getTollsWithInPolygon = async ( polygon ) => {
        const result = await Mongo.find( COLLECTION_NAME, {
            location: {
                $geoWithin: {
                    $geometry: {
                        type: "Polygon",
                        coordinates: [polygon]
                    }
                }
            }
        } );
        return result;
    }

}

module.exports = Toll;