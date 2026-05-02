import lz4 from 'lz4js';
import * as msgpack from '@msgpack/msgpack';
import { decode as atob } from 'base-64';

// self.addEventListener('message', function (e) {
//     const data = e.data;
//     const result = processData(data);
//     self.postMessage(result);
// });

/*

    Main Worker Function
    This function is responsible for processing the data received from the main thread
    The function receives raw and compressed data from server
    It decompress the compressed data then converts back to original form
    Then it loop through the data and split the data into multiple tracks and categorize them based on the engine/time/distance constraints and mark Idle/Running times
    Finally it returns the processed data back to the main thread
*/

function processData({ id, device, data, options }) {
    /*
        Constants
    */
    console.log("Started processing Data")
    const R = 6371e3;

    /* A minimum of 15 minutes without moving is considered as pause/Idle */
    const TIME_CONSIDERED_PAUSE = 10 * 1000 * 60;
    const MIN_ACTIVE_MOVEMENT = 5 * 1000 * 60

    /*
        Calculate the distance between two geographical locations using the Haversine formula.
    */
    function findDistance(locationA, locationB) {
        const φ1 = locationB.latitude * Math.PI / 180; // φ, λ in radians
        const φ2 = locationA.latitude * Math.PI / 180;
        const Δφ = (locationA.latitude - locationB.latitude) * Math.PI / 180;
        const Δλ = (locationA.longitude - locationB.longitude) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceInKilometers = (R * c) / 1000;
        return distanceInKilometers
    }

    /* Container Object to store the output */
    const output = {
        lats: [],
        lons: [],
        speeds: [],
        accuracies: [],
        altitudes: [],
        altitude_accuracies: [],
        headings: [],
        batteries: [],
        times: [],
        map_matched_lats: [],
        map_matched_lons: [],
        distances: [],
        sessions: [],
        sessionTypes: [],
        rotation: [],

        engineStates: [],
        engineSessionTypes: [], /* 1 - Running , 0 - Off, 2 - Idle */
        engineSessions: [],

        idleSessions: [],
        overSpeedSessions: [],

        bounds: [],
        distanceIntervals: {

        },
        dateDistanceMap: {},
        dateEngineTimeMap: {},
        activities: []
    }

    for (let hour = 0; hour < 24; hour++) {
        const hourInterval = `${hour}-${hour + 1}`;
        output.distanceIntervals[hourInterval] = 0;
    }


    /* 
        Clone of container to store converted compressed data 
    */

    const compressedToRawTempStore = { ...output }

    /*
        Function to add a session to the output
    */
    function addSession(start, end, startTime, endTime, duration, distance, maxSpeed, minSpeed, averageSpeed, maxAlt, minAlt, averageAlt, valid = true) {
        if(start<0 || end<0){
            console.log(start,end, "skipped")
            return
        }
        output.sessions.push([start, end, startTime, endTime, duration, distance, maxSpeed, minSpeed, averageSpeed, maxAlt, minAlt, averageAlt, valid])
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
        
        const dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
        if (!output.dateDistanceMap[dateString]) {
            output.dateDistanceMap[dateString] = distance
        } else {
            output.dateDistanceMap[dateString] += distance
        }
    }
    let { compressed, raw } = data
    /*
        This is the order in which compressed byte array will be received from the server
    */
    const locationOrder = [
        "lats",
        "lons",
        "speeds",
        "accuracies",
        "altitudes",
        "altitude_accuracies",
        "headings",
        "batteries",
        "times",
        "map_matched_lats",
        "map_matched_lons",
        "distances",
        "engineStates",
        "activities"
    ];

    if (!compressed && !raw) return output
    if (!compressed) compressed = []
    if (!raw) raw = []
    /*
        Decompress and convert back to original form with lz4 and msgpack
    */

    for (let i = 0; i < compressed.length; i++) {
        const session = compressed[i];
        const base64 = session.dataBase64  //BASE_64_TEST
        let splittedSession = null;
        if (base64) {
            splittedSession = base64.split("|")
        } else {
            splittedSession = session.data
        }
        if (!splittedSession) continue
        for (let j = 0; j < splittedSession.length; j++) {
            let dataBuffer = null;
            if (base64) {
                const base64Data = splittedSession[j]
                const binaryString = atob(base64Data);
                dataBuffer = new Uint8Array(binaryString.length);

                for (let i = 0; i < binaryString.length; i++) {
                    dataBuffer[i] = binaryString.charCodeAt(i);
                }
            } else {
                dataBuffer = splittedSession[j]
            }

            if (!dataBuffer) continue

            const decompressedSize = (dataBuffer[0]) | (dataBuffer[1] << 8) | (dataBuffer[2] << 16) | (dataBuffer[3] << 24);
            const src = dataBuffer.slice(4);

            /* Crate a byte array to store uncompressed data */
            const dst = new Uint8Array(decompressedSize);
            /* Decompress the data */
            lz4.decompressBlock(src, dst, 0, src.length, 0);
            /* Deserialize the data */
            const decodedOutput = msgpack.decode(dst);
            /* Store the data in the temp store */
            const type = locationOrder[j];
            compressedToRawTempStore[type] = compressedToRawTempStore[type].concat(decodedOutput);
        }
    }
    /*
        Convert Data back to its raw form
        Loop it reverse to properly arrange values based on time
    */
    const compressedInRaw = []
    let prevTime = 0
    for (let i = 0; i < compressedToRawTempStore.lats.length; i++) {
        const lat = compressedToRawTempStore.lats[i];
        const lon = compressedToRawTempStore.lons[i];
        const time = compressedToRawTempStore.times[i]
        const speed = compressedToRawTempStore.speeds[i]
        const accuracy = compressedToRawTempStore.accuracies[i]
        const altitude = compressedToRawTempStore.altitudes[i]
        const altitude_accuracy = compressedToRawTempStore.altitude_accuracies[i]
        const heading = compressedToRawTempStore.headings[i]
        const battery = compressedToRawTempStore.batteries[i]
        const engineState = compressedToRawTempStore.engineStates[i]
        prevTime = time
        if (time < options?.range?.start) {
            continue
        }
        if (time > options?.range?.end) {
            continue
        }
        compressedInRaw.push(
            {
                latitude: lat,
                longitude: lon,
                time: time,
                speed: speed,
                accuracy: accuracy,
                altitude: altitude,
                altitude_accuracy: altitude_accuracy,
                heading: heading,
                battery: battery,
                engineOn: engineState
            }
        )

    }

    /* Sorting Based on Time */

    // compressedInRaw.sort((a, b) => a.time - b.time);
    if (options.range) {
        raw = raw.filter(data => parseInt(data.time) >= options?.range?.start && parseInt(data.time) <= options?.range?.end)
    }
    raw = [...compressedInRaw, ...raw];
    raw = raw.sort((a, b) => a.time - b.time);
    /* Delete unwanted memory */
    delete compressedToRawTempStore.lats
    delete compressedToRawTempStore.lons
    delete compressedToRawTempStore.times
    delete compressedToRawTempStore.speeds
    delete compressedToRawTempStore.accuracies
    delete compressedToRawTempStore.altitudes
    delete compressedToRawTempStore.altitude_accuracies
    delete compressedToRawTempStore.headings
    delete compressedToRawTempStore.batteries

    /* Process live data */
    if (raw.length) {
        let prevPoint = undefined
        let rawDistance = 0
        let paused = false
        let pauseStartIndex = 0
        let pauseStartTime = 0

        /*
            Track current live session that is being processed
        */
        const currentLiveSession = {
            start: output.lats.length,
            startTime: raw[0].time,
            distance: 0,
            maxSpeed: 0,
            minSpeed: 200,
            averageSpeed: 0,
            maxAlt: 0,
            minAlt: 0,
            averageAlt: 0,
            prevTime: null,

            pointsCount: 0,
            speedSum: 0,
            addSpeeds: function (speed) {
                if (speed < 1) return
                this.averageSpeed = (this.averageSpeed * this.pointsCount + speed) / (this.pointsCount + 1)
            },
            increasePointCount: function () {
                this.pointsCount++
            },
            /* Reset state to initial values */
            reset: function () {
                this.start = output.lats.length > 0 ? output.lats.length - 1 : 0;
                this.startTime = null;
                this.distance = 0;
                this.maxSpeed = 0;
                this.minSpeed = 200;
                this.averageSpeed = 0;
                this.maxAlt = 0;
                this.minAlt = 0;
                this.averageAlt = 0;
                this.prevTime = null
                this.pointsCount = 0
                this.speedSum = 0
            }
        }

        /* 
            Live data is not compressed 
            Loop throguh the data and split into multple sessions based on 
            Engine/Time/Distance constranints
        */

        /* State to handle engine on/off idle hours */
        let engineState = raw[0].engineOn ? 1 : 0
        let engineStateStartIndex = 0
        let engineIdleStartIndex = null
        let engineIdle = false

        /* State to handle overspeeds */
        let isOverSpeeding = false
        let overSpeedStartIndex = null
        let [minLon, minLat, maxLon, maxLat] = [raw[0].longitude, raw[0].latitude, raw[0].longitude, raw[0].latitude]


        for (let i = 0; i < raw.length; i++) {
            let location = raw[i]
            const isLastPoint = i === raw.length - 1
            /* Convert engine state to 1 or 0 */
            /* Convert Speed from knots to km/hr */
            location = { ...location, speed: location.speed * 1.852, time: parseInt(location.time), engineOn: location.engineOn ? 1 : 0 }
            /* Time is retrived as string from postgres raw data */
            let isLastPointValid = true

            minLon = location.longitude < minLon ? location.longitude : minLon
            maxLon = location.longitude > maxLon ? location.longitude : maxLon
            minLat = location.latitude < minLat ? location.latitude : minLat
            maxLat = location.latitude > maxLat ? location.latitude : maxLat


            /*
                Overspeeding sessions
            */

            if (options?.maxAllowedSpeed) {

                if (location.speed > options.maxAllowedSpeed) {
                    if (!isOverSpeeding) {
                        isOverSpeeding = true
                        overSpeedStartIndex = i
                    }
                } else {
                    if (isOverSpeeding) {
                        const start = raw[overSpeedStartIndex].time
                        const end = raw[i].time
                        const duration = end - start
                        output.overSpeedSessions.push([start, end, duration, raw[overSpeedStartIndex].latitude, raw[overSpeedStartIndex].longitude])
                        isOverSpeeding = false
                        overSpeedStartIndex = null
                    }
                }
            }

            /* 
                Finding idle sessions
                if speed is less than 0.2 consider as idle start
            */
            if (location.engineOn) {
                if (location.speed < 0.2) {
                    if (!engineIdle) {
                        engineIdle = true
                        engineIdleStartIndex = i
                    }
                } else {
                    if (engineIdle) {
                        const start = raw[engineIdleStartIndex].time
                        const end = raw[i].time
                        const duration = end - start
                        if (duration > 1000 * 60 * 1) {
                            output.idleSessions.push([start, end, duration, raw[engineIdleStartIndex].latitude, raw[engineIdleStartIndex].longitude])
                        }
                        engineIdle = false
                        engineIdleStartIndex = null
                    }
                }
            } else {
                if (engineIdleStartIndex !== null) {
                    const start = raw[engineIdleStartIndex].time
                    const end = raw[i].time
                    const duration = end - start
                    if (duration > 1000 * 60 * 2) {
                        output.idleSessions.push([start, end, duration, raw[engineIdleStartIndex].latitude, raw[engineIdleStartIndex].longitude])
                    }
                }
                engineIdle = false
                engineIdleStartIndex = null
            }

            /* Engine On/Off sessions handling */
            if (location.engineOn !== engineState) {
                output.engineSessions.push([raw[engineStateStartIndex].time, raw[i].time, engineState, raw[engineStateStartIndex].latitude, raw[engineStateStartIndex].longitude])
                output.engineSessionTypes.push(engineState)
                engineStateStartIndex = i
                engineState = location.engineOn
            }

            if (!prevPoint) {
                output.distances.push(0);
                prevPoint = location
                continue
            }

            const distanceInKilometers = findDistance(prevPoint, location) // converting distance to kilometers
            if (!currentLiveSession.startTime) {
                currentLiveSession.startTime = prevPoint ? prevPoint.time : location.time
            }

            /*
            caculate speed from distancein kilometers and timedifference in milliseconds
            */
            const timeDiffBetweenTwoPoints = location.time - prevPoint.time
            const speed = distanceInKilometers / (timeDiffBetweenTwoPoints / 3600000);

            /*
                If distance travelled is under 200 m and timedifference is greater than 30mins end the session as pause
            */

            if (
                (
                    (timeDiffBetweenTwoPoints > 30 * 60 * 1000) &&
                    distanceInKilometers < 0.2 &&
                    currentLiveSession.start === output.lats.length
                )
                ||
                distanceInKilometers > 2
            ) {
                let sessionValid = true
                if (currentLiveSession.start === output.lats.length - 1) {
                    sessionValid = false
                    currentLiveSession.distance+=distanceInKilometers
                    addOuputValues({ ...location, distance: distanceInKilometers })
                    addSession(
                        currentLiveSession.start,
                        output.lats.length - 1,
                        currentLiveSession.startTime,
                        location.time,
                        location.time - currentLiveSession.startTime,
                        0,
                        currentLiveSession.maxSpeed,
                        currentLiveSession.minSpeed,
                        currentLiveSession.averageSpeed,
                        currentLiveSession.maxAlt,
                        currentLiveSession.minAlt,
                        currentLiveSession.averageAlt,
                        sessionValid
                    )
                    prevPoint = location
                    output.sessionTypes.push(0)
                    currentLiveSession.reset()
                    paused = false
                    engineIdle = false
                    isOverSpeeding = false
                    pauseStartIndex = null
                    continue
                } else {
                    addOuputValues({ ...location, distance: distanceInKilometers })
                    currentLiveSession.distance+=distanceInKilometers
                    addSession(
                        currentLiveSession.start,
                        output.lats.length - 2,
                        currentLiveSession.startTime,
                        output.times[output.times.length - 2],
                        output.times[output.times.length - 2] - currentLiveSession.startTime,
                        currentLiveSession.distance,
                        currentLiveSession.maxSpeed,
                        currentLiveSession.minSpeed,
                        currentLiveSession.averageSpeed,
                        currentLiveSession.maxAlt,
                        currentLiveSession.minAlt,
                        currentLiveSession.averageAlt,
                        sessionValid
                    )
                    addSession(
                        output.lats.length - 2,
                        output.lats.length - 1,
                        output.times[output.times.length - 1],
                        location.time,
                        location.time - output.times[output.times.length - 1],
                        0,
                        currentLiveSession.maxSpeed,
                        currentLiveSession.minSpeed,
                        currentLiveSession.averageSpeed,
                        currentLiveSession.maxAlt,
                        currentLiveSession.minAlt,
                        currentLiveSession.averageAlt,
                        false
                    )
                    prevPoint = location
                    output.sessionTypes.push(0, 0)
                    currentLiveSession.reset()
                    paused = false
                    engineIdle = false
                    isOverSpeeding = false
                    pauseStartIndex = null
                    continue
                }
            }
            /* Unrealistic speed due to location jumping */
            if (speed > 180) {
                if (!isLastPoint) continue
                else isLastPointValid = false
            }
            // isLastPointValid = true

            if (distanceInKilometers > 0.1) {

                if (speed > location.speed * 3) {
                    if (!isLastPoint) continue
                    else isLastPointValid = false

                }
            }
            /*
                if distance travelled in the time interval is very small
                set paused as true to indicate vehicle is at rest
            */
            if (distanceInKilometers < 0.03 && !isLastPoint) {
                if (paused === false) {
                    paused = true;
                    pauseStartTime = prevPoint?.time || location.time;
                    pauseStartIndex = output.lats.length
                    currentLiveSession.distance += distanceInKilometers
                    addOuputValues(
                        { ...location, distance: distanceInKilometers }
                    )
                    prevPoint = location
                    continue

                }

                if (!isLastPoint) {
                    addOuputValues(
                        { ...location, distance: distanceInKilometers }
                    )
                    currentLiveSession.distance += distanceInKilometers
                    prevPoint = location
                    continue
                }
            }

            if (isLastPoint) {
                const timeInPause = location.time - pauseStartTime;
                const sessionEnd = isLastPointValid ? location.time : prevPoint.time
                if (paused === true && timeInPause > TIME_CONSIDERED_PAUSE) {
                    if (pauseStartIndex === currentLiveSession.start) {
                        if (isLastPointValid) {
                            addOuputValues({ ...location, distance: distanceInKilometers })
                            prevPoint = location
                        }
                        addSession(
                            currentLiveSession.start,
                            output.lats.length,
                            currentLiveSession.startTime,
                            sessionEnd,
                            sessionEnd - currentLiveSession.startTime,
                            0,
                            currentLiveSession.maxSpeed,
                            currentLiveSession.minSpeed,
                            currentLiveSession.averageSpeed,
                            currentLiveSession.maxAlt,
                            currentLiveSession.minAlt,
                            currentLiveSession.averageAlt
                        )
                        output.sessionTypes.push(1)
                        currentLiveSession.reset()
                        continue
                    } else {
                        /* Split session into TWO */
                        addSession(
                            currentLiveSession.start,
                            pauseStartIndex,
                            currentLiveSession.startTime,
                            pauseStartTime,
                            pauseStartTime - currentLiveSession.startTime,
                            currentLiveSession.distance,
                            currentLiveSession.maxSpeed,
                            currentLiveSession.minSpeed,
                            currentLiveSession.averageSpeed,
                            currentLiveSession.maxAlt,
                            currentLiveSession.minAlt,
                            currentLiveSession.averageAlt
                        )
                        output.sessionTypes.push(0)
                        if (isLastPointValid) {
                            addOuputValues({ ...location, distance: distanceInKilometers })
                            currentLiveSession.distance += distanceInKilometers
                            prevPoint = location
                        }
                        addSession(
                            pauseStartIndex,
                            output.lats.length,
                            pauseStartTime,
                            sessionEnd,
                            sessionEnd - pauseStartTime,
                            0,
                            0,
                            0, 0, 0, 0, 0
                        )
                        output.sessionTypes.push(1)
                        currentLiveSession.reset()
                        continue
                    }

                } else {
                    addSession(
                        currentLiveSession.start,
                        output.lats.length,
                        currentLiveSession.startTime,
                        sessionEnd,
                        sessionEnd - currentLiveSession.startTime,
                        currentLiveSession.distance,
                        currentLiveSession.maxSpeed,
                        currentLiveSession.minSpeed,
                        currentLiveSession.averageSpeed,
                        currentLiveSession.maxAlt,
                        currentLiveSession.minAlt,
                        currentLiveSession.averageAlt
                    )
                    if (isLastPointValid) {
                        addOuputValues({ ...location, distance: distanceInKilometers })
                        prevPoint
                    }
                    output.sessionTypes.push(0)
                    currentLiveSession.reset()
                    continue
                }
            }

            if (paused === true) {
                paused = false;
                const timeInPause = location.time - pauseStartTime;
                if (timeInPause > TIME_CONSIDERED_PAUSE) {
                    /* Make this session as IDLE */
                    /* If the starting time of the session is not pause split into two sessions */
                    if (pauseStartIndex === currentLiveSession.start) {
                        addOuputValues({ ...location, distance: distanceInKilometers })
                        addSession(
                            currentLiveSession.start,
                            output.lats.length,
                            currentLiveSession.startTime,
                            location.time,
                            location.time - currentLiveSession.startTime,
                            0,
                            currentLiveSession.maxSpeed,
                            currentLiveSession.minSpeed,
                            currentLiveSession.averageSpeed,
                            currentLiveSession.maxAlt,
                            currentLiveSession.minAlt,
                            currentLiveSession.averageAlt
                        )
                        output.sessionTypes.push(1)
                        prevPoint = location
                        currentLiveSession.reset()
                        continue
                    } else {
                        /* split into Two sessions */
                        /* One moving session and one idle session */
                        currentLiveSession.distance += distanceInKilometers
                        addSession(
                            currentLiveSession.start,
                            pauseStartIndex,
                            currentLiveSession.startTime,
                            pauseStartTime,
                            pauseStartTime - currentLiveSession.startTime,
                            currentLiveSession.distance,
                            currentLiveSession.maxSpeed,
                            currentLiveSession.minSpeed,
                            currentLiveSession.averageSpeed,
                            currentLiveSession.maxAlt,
                            currentLiveSession.minAlt,
                            currentLiveSession.averageAlt
                        )
                        output.sessionTypes.push(0)
                        addOuputValues({ ...location, distance: distanceInKilometers })
                        prevPoint = location
                        addSession(
                            pauseStartIndex,
                            output.lats.length - 1,
                            pauseStartTime,
                            location.time,
                            location.time - pauseStartTime,
                            0,
                            0,
                            0, 0, 0, 0, 0
                        )
                        output.sessionTypes.push(1)
                        currentLiveSession.reset()
                        continue
                    }
                }
            }
            paused = false
            currentLiveSession.distance += distanceInKilometers
            currentLiveSession.duration = location.time - (raw[i - 1] ? raw[i - 1].time : 0)
            currentLiveSession.maxSpeed = Math.max(currentLiveSession.maxSpeed, location.speed)
            currentLiveSession.minSpeed = Math.min(currentLiveSession.minSpeed, location.speed)
            currentLiveSession.maxAlt = Math.max(currentLiveSession.maxAlt, location.altitude)
            currentLiveSession.minAlt = Math.min(currentLiveSession.minAlt, location.altitude)
            currentLiveSession.increasePointCount()
            currentLiveSession.addSpeeds(location.speed)
            rawDistance += distanceInKilometers
            addOuputValues({ ...location, distance: distanceInKilometers })
            prevPoint = location
        }

        output.rawDistance = rawDistance
        output.bounds = [minLon, minLat, maxLon, maxLat]
    }

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
