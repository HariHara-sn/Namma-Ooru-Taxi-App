const filterPointsOutsideCircle = require("./CircleFunctions")
const pointsOutsidePolygon = require("./PolygonFunctions")

/**
 * Analyzes points against specified geofences to generate entry and exit alerts.
 * This function takes a set of points (locations with timestamps), a list of geofences,
 * and the last known alerts for each geofence for a specific device. It then determines
 * if any of the points fall outside the boundaries of the geofences, indicating an exit,
 * or if any points re-enter the geofences, indicating an entry. Alerts are generated for
 * each entry and exit event, with details including the geofence ID, the type of alert
 * (entry or exit), the timestamp of the event, the location, and the device ID.
 * 
 * @param {Object} params - The function parameters.
 * @param {Array} params.points - Array of point objects with location and time properties.
 * @param {Array} params.geoFences - Array of geofence objects with boundary and _id properties.
 * @param {Object} params.lastKnownAlerts - Object mapping geofence IDs to the last known alert for that geofence.
 * @param {String} params.deviceId - The ID of the device associated with the points.
 * @returns {Array} An array of alert objects generated from analyzing the points against the geofences.
 */
module.exports = async function ({ points, geoFences, lastKnownAlerts, deviceId }) {

    const alerts = []
    for (const geofence of geoFences) {
        let result
        if (geofence.type === "Polygon") {
            result = pointsOutsidePolygon({ points: points, polygon: geofence.boundary })
        } else if (geofence.type === "Circle") {
            result = filterPointsOutsideCircle({
                center: geofence.boundary.center,
                radius: geofence.boundary.radius,
                points: points
            })
        }
        const outIndices = result[1]
        let startedFromOutside = lastKnownAlerts[geofence._id] ? lastKnownAlerts[geofence._id].type === "geofenceOut" : outIndices[0] === 0
        const geoFenceId = geofence._id.toString()

        if (points.length === 1 && !lastKnownAlerts[geofence._id]) {
            alerts.push({
                geofenceId: geoFenceId,
                info: {
                    serverTime: new Date().getTime()
                },
                type: points.length === 1 && outIndices[0] !== null ? "geofenceOut" : "geofenceIn",
                time: new Date(points[0].time).getTime(),
                location: points[0].location,
                deviceId
            });
        }

        // Create Alerts whenever there is a out coordinate 
        // and also whenever there is a in coordinate after out coordinate
        // If startedFromOutside check whether he comes back in
        // Collected all the alerts
        const startIndex = lastKnownAlerts[geofence._id] ? 0 : 1
        for (let i = startIndex; i < outIndices.length; i++) {
            const currentIndexOutside = outIndices[i] !== null
            if (startedFromOutside) {
                if (currentIndexOutside) continue
                else {
                    const time = new Date(points[i].time).getTime()
                    alerts.push({
                        geofenceId: geoFenceId,
                        info: {
                            serverTime: new Date().getTime()
                        },
                        type: "geofenceIn",
                        time: time,
                        location: points[i].location,
                        deviceId
                    });
                    startedFromOutside = false
                }
            } else {
                if (!currentIndexOutside) continue
                else {
                    const time = new Date(points[i].time).getTime()
                    alerts.push({
                        geofenceId: geoFenceId,
                        info: {
                            serverTime: new Date().getTime()
                        },
                        type: "geofenceOut",
                        time: time,
                        location: points[i].location,
                        deviceId
                    });
                    startedFromOutside = true
                }

            }
        }

    }

    return alerts

}