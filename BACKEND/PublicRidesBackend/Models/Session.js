const Database = require('../Controllers/DB/PostGres');


/*
CREATE TABLE sessions(
    key SERIAL PRIMARY KEY,
    id TEXT NOT NULL,
    sessionId TEXT NOT NULL,
    sessionName TEXT,
    startTime TIMESTAMPTZ,
    endTime TIMESTAMPTZ,
    deviceType TEXT NOT NULL,
    deviceName TEXT NOT NULL
);
*/
class Session {

    static async createSession(data) {
        const query = 'INSERT INTO sessions ("id", "sessionId", "sessionName", "startTime", "endTime", "deviceType", "deviceName", "status", "sessionType") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
        await Database.query(query, [data.id, data.sessionId, data.sessionName, data.startTime, data.endTime, data.deviceType, data.deviceName, data.status, data.sessionType])
        return true

    }

    static async updateStatus(sId, status, endTime) {
        const query = `UPDATE sessions SET "status" = $1, "endTime" = $2 WHERE "sessionId" = $3`;
        await Database.query(query, [status, endTime, sId]);
        return true
    }

    static getSessions(uid) {
        const query = `SELECT * FROM sessions WHERE "id" = '${uid}'`;
        return Database.query(query);
    }

    static async getSessionsByIntersection(deviceId, deviceImei, startTime, endTime) {
        const query = `
            SELECT sessions.*, "completedLocations".data, "completedLocations".simdata,"completedLocations"."dataBase64", "completedLocations"."splittedSessions", "completedLocations"."sessionTypes"  FROM sessions
            JOIN "completedLocations" ON sessions."sessionId" = "completedLocations"."sessionId"
            WHERE sessions."id" = $1
            AND sessions."processed" = true
            AND (sessions."endTime" > to_timestamp($2) AND sessions."startTime" < to_timestamp($3));
            `
        /* Harware GPS use imei as their ids */
        const values = [deviceImei || deviceId, startTime / 1000, endTime / 1000];
        
        const startQueryTime = Date.now();
        const sessions = await Database.query(query, values);
        const endQueryTime = Date.now();
        
        console.log(`SessionQuery execution time: ${endQueryTime - startQueryTime}ms`);
        
        const { rows } = sessions;
        return rows;
    }

    static async checkSessionExists(sId) {
        const query = `SELECT * FROM sessions WHERE "sessionId" = '${sId}'`;
        const sessions = await Database.query(query);
        if (!sessions) return false
        const { rows } = sessions
        return rows[0]
    }
}

module.exports = Session;