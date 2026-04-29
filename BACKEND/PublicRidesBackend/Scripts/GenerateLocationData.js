const Chance = require('chance');
const chance = new Chance();
const moment = require('moment');
const fs = require('fs');


const chennaiBoundingBox = {
    northEast: {
        latitude: 13.2306,
        longitude: 80.3213
    },
    southWest: {
        latitude: 12.9815,
        longitude: 80.1636
    }
}

function generateLocationData(startTime, endTime, numberOfLocations) {
    const startTimeMoment = moment(startTime);
    const endTimeMoment = moment(endTime);
    const totalDurationSeconds = endTimeMoment.diff(startTimeMoment, 'seconds');
    const intervalSeconds = totalDurationSeconds / numberOfLocations;
    let currentTime = moment(startTime);
    const locations = [];

    for (let i = 0; i < numberOfLocations; i++) {
        const time = currentTime.toISOString();
        const location = [
            chance.floating({ min: chennaiBoundingBox.southWest.longitude, max: chennaiBoundingBox.northEast.longitude }),
            chance.floating({ min: chennaiBoundingBox.southWest.latitude, max: chennaiBoundingBox.northEast.latitude })
        ];
        const speed = chance.floating({ min: 0, max: 150 });
        const accuracy = chance.integer({ min: 1, max: 100 });
        const altitude = chance.floating({ min: 0, max: 8000 });
        const altitudeAccuracy = chance.integer({ min: 5, max: 100 });
        const bearing = chance.integer({ min: 0, max: 360 });
        const battery = chance.floating({ min: 0, max: 100 });

        locations.push({
            time,
            location,
            speed,
            accuracy,
            altitude,
            altitudeAccuracy,
            bearing,
            battery
        });

        currentTime = currentTime.add(intervalSeconds, 'seconds');
    }

    return locations;
}


const staticParams = {
    "imei": "123456789012345",
    "deviceName": "My Android Device",
    "id": "65ee8be8ee452df3d2bc6ddb", // This acts as a unique identifier for the device or user
    "deviceType": "mobile", // Specifies the type of device
    "sessionId": "Sessdfsdfssion-2",
    "completed": false,
}


function writeLocationsToFile(locations) {
    const filePath = './generatedLocations.json';
    const output = {
        ...staticParams, locations
    }
    fs.writeFile(filePath, JSON.stringify(output, null, 2), (err) => {
        if (err) {
            console.error('Failed to write locations to file:', err);
        } else {
            console.log(`Locations data successfully written to ${filePath}`);
        }
    });
}

// Example usage with callback to ensure data is written before logging success
const startTime = '2024-03-01T10:00:00.000Z';
const endTime = '2024-03-28T11:00:00.000Z';
writeLocationsToFile(generateLocationData(startTime, endTime, 100));