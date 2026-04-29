const LiveLocationModel = require('../../Models/LiveLocation')
const SessionModel = require('../../Models/Session')

const locationResolver = {
    getRecentLocations: async ({ deviceId, deviceImei, sessionId, startTime, endTime }) => {
        const intersectingSessions = await SessionModel.getSessionsByIntersection(deviceId, deviceImei, startTime, endTime)
        let results = await LiveLocationModel.getLocationsTraccar(deviceImei, startTime, endTime)
        if(!results || results.length === 0) {
            results = await LiveLocationModel.getLocations(deviceId, deviceImei, sessionId, startTime, endTime)
        }
        const output = { compressed: intersectingSessions, raw: results }
        return output
    },
}

module.exports = { locationResolver }