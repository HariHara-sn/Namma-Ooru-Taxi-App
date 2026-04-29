const dotenv = require('dotenv');
dotenv.config({
    path: '../.env'
});
const Mongo = require('../Controllers/DB/Mongo');
const deviceTable = "devices";

const chennaiBoundingBox = {
    northEast: {
        latitude: 13.2306,
        longitude: 80.3213
    },
    southWest: {
        latitude: 12.9815,
        longitude: 80.1636
    }
};

async function insertFakeLocations() {
    const devices = await Mongo.find(deviceTable, {});
    devices.forEach(async (device, index) => {
        const randomLocation = {
            type: "Point",
            coordinates: [
                Math.random() * (chennaiBoundingBox.northEast.longitude - chennaiBoundingBox.southWest.longitude) + chennaiBoundingBox.southWest.longitude,
                Math.random() * (chennaiBoundingBox.northEast.latitude - chennaiBoundingBox.southWest.latitude) + chennaiBoundingBox.southWest.latitude
            ],
            speed: Math.floor(Math.random() * 101), // Random speed between 0 and 100
            battery: Math.floor(Math.random() * 101) // Random battery level between 0 and 100
        };
        await Mongo.updateOne(deviceTable, { _id: device._id }, { location: randomLocation, lastLocationUpdatedOn: new Date().getTime() });
        if (index === devices.length - 1) {
            Mongo.disconnect();
        }
    });
}

setTimeout(insertFakeLocations, 1000);
