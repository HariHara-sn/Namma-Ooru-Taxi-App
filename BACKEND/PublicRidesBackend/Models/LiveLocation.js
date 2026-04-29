const Database = require('../Controllers/DB/PostGres');


class LiveLocation {
    constructor() {
        this.location = null;
    }
    static addLocations = async (locations, sessionId, deviceId) => {
        // Start building the query string with placeholders
        let query = 'INSERT INTO "liveLocations" ("id", "sessionId", "time", "latitude", "longitude", "speed", "accuracy", "altitude", "altitudeAccuracy", "heading", "battery", "engineOn", "activity") VALUES ';
        const values = [];

        // For each location, append placeholders and add the values to the array
        locations.forEach((location, index) => {
            const baseIndex = index * 13; // Each location has 11 fields
            const placeholders = `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, 
                $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, 
                $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13})`;
            if (index > 0) query += ', ';
            query += placeholders;
            values.push(
                deviceId, sessionId, location.time, location.location[1],
                location.location[0], location.speed, location.accuracy,
                location.altitude, location.altitudeAccuracy, location.heading,
                location.battery, location.engineOn, location.activity
            );
        });

        const result = await Database.query(query, values);
        return result;
    }

    static addExternalGpsLocations = async (locations, sessionId, deviceImei) => {
        // Start building the query string with placeholders
        let query = 'INSERT INTO "liveLocations" ("id", "sessionId", "time", "latitude", "longitude", "speed", "accuracy", "altitude", "altitudeAccuracy", "heading", "battery") VALUES ';
        const values = [];

        // For each location, append placeholders and add the values to the array
        locations.forEach((location, index) => {
            const baseIndex = index * 11; // Each location has 11 fields
            const placeholders = `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, 
                $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, 
                $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11})`;
            if (index > 0) query += ', ';
            query += placeholders;
            values.push(
                deviceImei, sessionId, new Date(location.ts * 1000).toISOString(), location.lat,
                location.lng, location.speed, location.accuracy,
                location.altitude, location.altitudeAccuracy, location.heading,
                location.battery
            );
        });

        const result = await Database.query(query, values);
        return result;
    }

    static getLocations = async (deviceId, deviceImei, sessionId, startTime, endTime) => {
        let query, values;
        if (sessionId) {
            query = 'SELECT * FROM "liveLocations" WHERE "id" = $1 AND "sessionId" = $2 AND "time" BETWEEN to_timestamp($3) AND to_timestamp($4)';
            values = [deviceImei || deviceId, sessionId, startTime / 1000, endTime / 1000];
        } else {
            query = 'SELECT * FROM "liveLocations" WHERE "id" = $1 AND "time" BETWEEN to_timestamp($2) AND to_timestamp($3)';
            values = [deviceImei || deviceId, startTime / 1000, endTime / 1000];
        }
        // console.log(query);

        const sTime = Date.now();
        const result = await Database.query(query, values);
        const eTime = Date.now();

        console.log(`getLocations execution time: ${eTime - sTime}ms`);

        return result.rows;
    }

    static getLocationsTraccar = async (imei, startMs, endMs) => {
        // console.log("Index-friendly local timestamp filtering with ms output");
      
        const query = `
          WITH bounds AS (
            SELECT
              (to_timestamp($2::bigint / 1000.0) AT TIME ZONE 'Asia/Kolkata') AS start_local,
              -- treat endMs as inclusive; make it exclusive by adding 1 ms
              (to_timestamp($3::bigint / 1000.0) AT TIME ZONE 'Asia/Kolkata') + INTERVAL '1 millisecond' AS end_local_excl
          )
          SELECT COALESCE(
            json_agg(
              json_build_object(
                -- Convert local wall-time to an instant (IST → timestamptz) before epoch:
                'time',     (EXTRACT(EPOCH FROM (p.fixtime AT TIME ZONE 'Asia/Kolkata')) * 1000)::bigint,
                'latitude', p.latitude,
                'longitude', p.longitude, 
                'speed',    p.speed,
                'engineOn', (p.attributes::json ->> 'ignition')::boolean,
                'heading',  p.course
              )
              ORDER BY p.fixtime
            ),
            '[]'::json
          ) AS data
          FROM public.tc_positions p
          JOIN public.tc_devices d ON d.id = p.deviceid
          CROSS JOIN bounds b
          WHERE d.uniqueid = $1
            AND p.valid = true
            AND p.fixtime >= b.start_local
            AND p.fixtime <  b.end_local_excl;
        `;
      
        const values = [imei, startMs, endMs];
      
        try {
            const result = await Database.query(query, values);
            // console.log(query, values);
            return result.rows[0]?.data || [];
        } catch (err) {
            console.error("getLocationsTraccar error:", err);
            throw err;
        }
    };
      
      
    static getDeviceStats = async (deviceId, startTime, endTime) => {
        const query = `
            WITH location_intervals AS (
                SELECT
                    "engineOn",
                    "speed",
                    "latitude",
                    "longitude",
                    "time",
                    LEAD("time") OVER (ORDER BY "time") AS next_time,
                    LEAD("latitude") OVER (ORDER BY "time") AS next_latitude,
                    LEAD("longitude") OVER (ORDER BY "time") AS next_longitude
                FROM public."liveLocations"
                WHERE "id" = $1
                  AND "time" BETWEEN to_timestamp($2) AND to_timestamp($3)
            )
            SELECT
                SUM(
                    CASE WHEN "engineOn" = true THEN 
                        EXTRACT(EPOCH FROM (next_time - "time"))
                    ELSE 0 END
                ) AS total_running_time_seconds,
                SUM(
                    CASE WHEN "engineOn" = false THEN 
                        EXTRACT(EPOCH FROM (next_time - "time"))
                    ELSE 0 END
                ) AS total_halt_time_seconds,
                MAX("speed") AS top_speed,
                SUM(
                    CASE 
                        WHEN next_latitude IS NOT NULL THEN
                            6371 * 2 *
                            ASIN(SQRT(
                                POWER(SIN(RADIANS("latitude" - next_latitude)/2),2) +
                                COS(RADIANS("latitude")) * COS(RADIANS(next_latitude)) *
                                POWER(SIN(RADIANS("longitude" - next_longitude)/2),2)
                            ))
                        ELSE 0
                    END
                ) AS total_distance_km
            FROM location_intervals;
        `;
        const values = [deviceId, startTime / 1000, endTime / 1000];
    
        // console.log(query);
    
        const sTime = Date.now();
        const result = await Database.query(query, values);
        const eTime = Date.now();
    
        console.log(`getDeviceStats execution time: ${eTime - sTime}ms`);
    
        return result.rows;
    }

    static getDeviceLiveStats = async (imei) => {
        const query = `
        
            WITH latest_pos AS (
                SELECT 
                    p.*
                FROM public.tc_positions p
                JOIN public.tc_devices d ON d.id = p.deviceid
                WHERE d.uniqueid = $1 
                    AND p.valid = true
                ORDER BY p.fixtime DESC
                LIMIT 1
            )
            SELECT * FROM latest_pos lp            
        `;
      
        const values = [imei];
      
        try {
            const result = await Database.query(query, values);
            return result.rows[0] || [];
        } catch (err) {
            console.error("getDeviceLiveStats error:", err);
            throw err;
        }
    };
    


}

module.exports = LiveLocation