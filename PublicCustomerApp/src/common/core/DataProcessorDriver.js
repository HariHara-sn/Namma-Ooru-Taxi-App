import getRawGPSDataFromCombinedData from "./GetRawGPSDataFromCombinedData";
import isTripLocationValid from "./isTripLocationValid";
import LocationDataOutput from "./LocationDataOutput";
import MobileActivities from './Activities'

const getMergedSession = (sessionA, sessionB) => {
    return [
        sessionA[0],
        sessionB[1],
        sessionA[2],
        sessionB[3],
        sessionB[3] - sessionA[2],
        sessionA[5] + sessionB[5],
        Math.max(sessionA[6], sessionB[6]),
        Math.min(sessionA[7], sessionB[7]),
        (sessionA[8] * sessionA[6] + sessionB[8] * sessionB[6]) / (sessionA[6] + sessionB[6]),
        Math.max(sessionA[9], sessionB[9]),
        Math.min(sessionA[10], sessionB[10]),
        (sessionA[11] * sessionA[6] + sessionB[11] * sessionB[6]) / (sessionA[6] + sessionB[6])
    ]
}

/*

    Main Worker Function
    This function is responsible for processing the data received from the main thread
    The function receives raw and compressed data from server
    It decompress the compressed data then converts back to original form
    Then it loop through the data and split the data into multiple tracks and categorize them based on the engine/time/distance constraints and mark Idle/Running times
    Finally it returns the processed data back to the main thread
*/

function processData({ id, device, data, options }) {

    const rawData = getRawGPSDataFromCombinedData(data, options)

    /* A minimum of 15 minutes without moving is considered as pause/Idle */
    const MIN_TIME_TOSKIP_AND_MERGE_SESSIONS = 2 * 1000 * 60;
    const MIN_TIME_TOSKIP_SESSIONS = 0.5 * 1000 * 60; //30sec


    /* Container Object to store the output */
    const output = LocationDataOutput()

    /*
        Function to add a session to the output
    */
    function addSession(
        { start, end, startTime, endTime, duration, distance, maxSpeed, minSpeed, averageSpeed, maxAlt, minAlt, averageAlt, valid = true },
        type,
        output
    ) {

        // Check if start or end indices are invalid (negative)
        if (start < 0 || end < 0) {
            return
        }

        // If the session type is "rest" but the distance is greater than 1,
        // reclassify it as "unknown" since it's not a typical rest behavior
        if ((type === "rest") && distance > 1) {
            type = "unknown"
        }

        // Ignore sessions shorter than 30 seconds (0.5 minutes) and distance < 0.1 km
        if ((duration < 1000 * 60 * 0.5) && distance < 0.1) {
            return
        }

        // If the type is "unknown" and the distance is less than 0.2 km, reclassify it as "rest" as it is would be most probably idle
        if (type === "unknown" && distance < 0.2) {
            type = "rest"
        }

        if (type === "walking" && distance < 0.1) {
            type = "rest"
        }

        /* When travelling in vehicle and user takes phone and tilt it it detected as tilting */
        /* Also in between vehicle travel it also detects unknowns */

        if (output.sessions.length > 1) {
            const currentActivity = type
            const prevActivity = output.sessionTypes[output.sessionTypes.length - 1]
            const onePrevActivity = output.sessionTypes[output.sessionTypes.length - 2]
            const cond1 = currentActivity === "invehicle" && prevActivity === "tilting" && onePrevActivity === "invehicle"
            const cond2 = currentActivity === "invehicle" && prevActivity === "unknown" && onePrevActivity === "invehicle"
            if (cond1 || cond2) {
                const prevSession = output.sessions[output.sessions.length - 1]
                const prevActivityDuration = prevSession[4]
                if (prevActivityDuration < 1000 * 60 * 1.5) {
                    /* Merge last two sessions */
                    const onePrevSession = output.sessions[output.sessions.length - 2]
                    const mergedSession = getMergedSession(onePrevSession, prevSession)
                    const finalSession = getMergedSession(mergedSession,
                        [start, end, startTime, endTime, duration, distance, maxSpeed, minSpeed, averageSpeed, maxAlt, minAlt, averageAlt, valid]
                    )
                    output.sessions.pop()
                    output.sessions.pop()
                    output.sessions.push(finalSession)
                    output.sessionTypes.pop()
                    output.sessionTypes.pop()
                    output.sessionTypes.push("invehicle")
                    return
                }
            }
        }



        if (output.sessions.length) {
            const prevSession = output.sessions[output.sessions.length - 1]
            const prevSessionType = output.sessionTypes[output.sessions.length - 1]

            if (
                // (prevSessionType === type) ||
                (type === "invehicle" && (prevSessionType === "tilting" || prevSessionType === "unknown"))
            ) {
                /* merge it into single session */

                output.sessions[output.sessions.length - 1] = getMergedSession(
                    prevSession,
                    [start, end, startTime, endTime, duration, distance, maxSpeed, minSpeed, averageSpeed, maxAlt, minAlt, averageAlt, valid]
                )
                output.sessionTypes[output.sessionTypes.length - 1] = type
                return
            }
        }

        /* if tilting and distance is greater than 0.2 km it must be some other action */

        if(type === "tilting" && distance> 0.2){
            type = "unknown"
        }

        /* dont add session if rest is below 2 mins-- creating many activities */
        if(type === "rest" && duration< 2 * 60 * 1000){
            return
        }

        output.sessions.push([start, end, startTime, endTime, duration, distance, maxSpeed, minSpeed, averageSpeed, maxAlt, minAlt, averageAlt, valid])
        output.sessionTypes.push(type)
    }

    const sessionMergerLoop = (sessions, sessionTypes) => {
        const updatedOutput = { sessions: [], sessionTypes: [] }
        for (let i = 0; i < sessions.length; i++) {
            const session = sessions[i]
            addSession(
                {
                    start: session[0],
                    end: session[1],
                    startTime: session[2],
                    endTime: session[3],
                    duration: session[4],
                    distance: session[5],
                    maxSpeed: session[6],
                    minSpeed: session[7],
                    averageSpeed: session[8],
                    maxAlt: session[9],
                    minAlt: session[10],
                    averageAlt: session[11],
                    valid: session[12]
                },
                sessionTypes[i],
                updatedOutput
            )

        }
        return updatedOutput
    }

    /*
        Function to add a value to output into all array fields
    */

    function addOuputValues({
        latitude, longitude, speed, accuracy, altitude, altitude_accuracy, bearing, battery, time, distance, heading
    }) {
        output.lats.push(latitude)
        output.lons.push(longitude)
        output.speeds.push(speed)
        output.accuracies.push(accuracy)
        output.altitudes.push(altitude)
        output.altitude_accuracies.push(altitude_accuracy)
        output.headings.push(heading)
        output.batteries.push(battery)
        output.times.push(time)
        output.map_matched_lats.push(latitude)
        output.map_matched_lons.push(longitude)
        output.distances.push(distance)

        const date = new Date(parseInt(time));
        const hour = date.getHours();
        const hourInterval = `${hour}-${hour + 1}`;
        if (output.distanceIntervals[hourInterval]) {
            output.distanceIntervals[hourInterval] += distance
        } else {
            output.distanceIntervals[hourInterval] = distance
        }
    }

    if (!rawData?.length) return { data: output }

    let currentActivity = null;
    let activityStartIndex = 0;
    let sessionStartIndex = 0;
    let totalDistance = 0;
    let maxSpeed = 0;
    let minSpeed = Infinity;
    let sumSpeed = 0;
    let maxAlt = -Infinity;
    let minAlt = Infinity;
    let sumAlt = 0;
    let count = 0;
    let prevLocation = rawData[0]
    let [minLon, minLat, maxLon, maxLat] = [rawData[0].longitude, rawData[0].latitude, rawData[0].longitude, rawData[0].latitude]

    for (let i = 0; i < rawData.length; i++) {
        let location = rawData[i];
        location = { ...location, speed: location.speed * 1.852, time: parseInt(location.time) }
        const [isValid, speed, distance] = i === 0 ? [true, 0, 0] : isTripLocationValid(location, prevLocation, 'driver')
        if (!isValid) {
            continue
        }

        minLon = location.longitude < minLon ? location.longitude : minLon
        maxLon = location.longitude > maxLon ? location.longitude : maxLon
        minLat = location.latitude < minLat ? location.latitude : minLat
        maxLat = location.latitude > maxLat ? location.latitude : maxLat

        // Find the corresponding activity
        const activityObj = MobileActivities.find(act => act.values.includes(location.activity));
        const activity = activityObj ? activityObj.name : 'unknown';
        const timeDifference = location.time - prevLocation.time;

        if ((activity !== currentActivity) || (timeDifference > 1000 * 60 * 15)) {
            if (currentActivity !== null) {
                // Add the completed session
                const endIndex = (output.lats.length >= 0) ? output.lats.length-1 : 0;
                const startTime = output.times[sessionStartIndex];
                const endTime = output.times[endIndex];
                const duration = endTime - startTime;
                const averageSpeed = count > 0 ? sumSpeed / count : 0;
                const averageAlt = count > 0 ? sumAlt / count : 0;

                addSession(
                    {
                        start: sessionStartIndex,
                        end: endIndex,
                        startTime,
                        endTime,
                        duration,
                        distance: totalDistance,
                        maxSpeed,
                        minSpeed,
                        averageSpeed,
                        maxAlt,
                        minAlt,
                        averageAlt
                    },
                    currentActivity,
                    output
                );
                sessionStartIndex = output.lats.length ? (output.lats.length) : 0;

                // Add the activity segment

                // Reset session variables
                totalDistance = 0;
                maxSpeed = 0;
                minSpeed = Infinity;
                sumSpeed = 0;
                maxAlt = -Infinity;
                minAlt = Infinity;
                sumAlt = 0;
                count = 0;
            }
            currentActivity = activity;
            activityStartIndex = i;
        }

        // Update session statistics
        totalDistance += distance;
        maxSpeed = Math.max(maxSpeed, speed);
        minSpeed = Math.min(minSpeed, speed);
        sumSpeed += speed;
        maxAlt = Math.max(maxAlt, location.altitude || 0);
        minAlt = Math.min(minAlt, location.altitude || 0);
        sumAlt += location.altitude || 0;
        prevLocation = location
        count++;

        // Add the location data to the output
        addOuputValues({
            latitude: location.latitude,
            longitude: location.longitude,
            speed: speed,
            accuracy: location.accuracy || 0,
            altitude: location.altitude || 0,
            altitude_accuracy: location.altitude_accuracy || 0,
            heading: location.heading,
            battery: location.battery || 0,
            time: location.time,
            distance: distance
        });


    }
    output.bounds = [minLon, minLat, maxLon, maxLat]
    // Add the last session
    if (currentActivity !== null) {
        const endIndex = output.lats.length - 1;
        const startTime = output.times[sessionStartIndex];
        const endTime = output.times[endIndex];
        const duration = endTime - startTime;
        const averageSpeed = count > 0 ? sumSpeed / count : 0;
        const averageAlt = count > 0 ? sumAlt / count : 0;

        addSession(
            {
                start: sessionStartIndex,
                end: endIndex,
                startTime,
                endTime,
                duration,
                distance: totalDistance,
                maxSpeed,
                minSpeed,
                averageSpeed,
                maxAlt,
                minAlt,
                averageAlt
            },
            currentActivity,
            output
        );
    }

    // while (true) {
    //     const { sessions, sessionTypes } = sessionMergerLoop(output.sessions, output.sessionTypes)
    //     if (sessions.length === output.sessions.length) break
    //     output.sessions = sessions
    //     output.sessionTypes = sessionTypes
    // }



    /*
        Handle mergin of latlngs into single array
    */
    if (options?.mergeLatLngs) {
        const merged = []
        for (let i = 0; i < output.lats.length; i++) {
            const lat = output.lats[i]
            const lon = output.lons[i]
            if (options.mergeSpeedWithLatLngs) merged.push([lat, lon, output.speeds[i]])
            else
                merged.push([lat, lon])
        }
        output.latLngs = merged
    }
    if (options?.mergeLngLats) {
        const merged = []
        for (let i = 0; i < output.lats.length; i++) {
            const lat = output.lats[i]
            const lon = output.lons[i]
            if (options.mergeSpeedWithLatLngs) merged.push([lon, lat, output.speeds[i]])
            else
                merged.push([lon, lat])
        }
        output.lngLats = merged
    }

    return {
        data: output,
        id: id,
        device: device
    };
}

export default processData
