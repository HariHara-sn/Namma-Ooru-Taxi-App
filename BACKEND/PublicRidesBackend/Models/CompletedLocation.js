const Database = require('../Controllers/DB/PostGres');


class CompletedLocation {
    static getLocationsFromDevice = async (deviceId, startTime, endTime) => {
        const query = 'SELECT * FROM "completedLocations" WHERE "id" = $1 AND "time" BETWEEN to_timestamp($2) AND to_timestamp($3) ORDER BY "time" ASC';
        const values = [deviceId, startTime / 1000, endTime / 1000];
        const result = await Database.query(query, values);
        return result.rows;
    }
}

module.exports = CompletedLocation;