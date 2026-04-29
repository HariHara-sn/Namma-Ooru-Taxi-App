require("dotenv").config({
    path: "../.env"
});

const Postgres = require('../Controllers/DB/PostGres')
const fs = require('fs');


const insertLocationData = async (filePath) => {
    try {
        const data = fs.readFileSync(filePath);
        const locations = JSON.parse(data);

        const query = `
      INSERT INTO "liveLocations" (
        "id", "sessionId", "time", "latitude", "longitude", 
        "speed", "accuracy", "altitude", "altitudeAccuracy", 
        "bearing", "battery", "engineOn"
      ) VALUES ($1, $2, to_timestamp($3 / 1000.0), $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

        const sessionQuery = `
      INSERT INTO "sessions" (
        "id", "sessionId", "sessionType", "sessionName", "startTime", 
        "endTime", "deviceType", "deviceName", "processed", "status"
      ) VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0), to_timestamp($6 / 1000.0), $7, $8, $9, $10)
    `;

        // Assuming we have these details for session insertion
        const sessionDetails = {
            id: locations[0].id, // Using the id of the first location as the device id
            sessionId: "server-session", // This should be generated or passed in a better way
            sessionType: "REAL", // Assuming the session type
            sessionName: "Sample Session", // Example session name
            startTime: locations[0].time, // Using the time of the first location as start time
            endTime: locations[locations.length - 1].time, // Using the time of the last location as end time
            deviceType: "GPS", // Assuming the device type
            deviceName: "Sample Device", // Example device name
            processed: false, // Default value
            status: "completed" // Default value
        };

        const sessionValues = [
            sessionDetails.id,
            sessionDetails.sessionId,
            sessionDetails.sessionType,
            sessionDetails.sessionName,
            sessionDetails.startTime,
            sessionDetails.endTime,
            sessionDetails.deviceType,
            sessionDetails.deviceName,
            sessionDetails.processed,
            sessionDetails.status
        ];

        await Postgres.query(sessionQuery, sessionValues);

        for (const location of locations) {
            const values = [
                location.id,
                "server-session", // Assuming sessionId is not provided in the JSON
                location.time,
                location.latitude,
                location.longitude,
                location.speed,
                location.accuracy,
                location.altitude,
                location.altitudeAccuracy,
                location.bearing,
                location.battery,
                location.engineOn,
            ];

            await Postgres.query(query, values)

        }
        console.log("completed")
        console.log('All locations inserted successfully.');
    } catch (err) {
        console.error('Error inserting locations:', err);
    }
};

// Example usage
setTimeout(() => {
    insertLocationData('./serverdata.json');
}, 2000);
