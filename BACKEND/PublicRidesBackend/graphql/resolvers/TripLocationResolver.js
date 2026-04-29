const LiveLocationModel = require('../../Models/LiveLocation')
const SessionModel = require('../../Models/Session')

const tripLocationResolver = {
    getRecentLocations: async ({ deviceId, deviceImei, sessionId, startTime, endTime }) => {
        const intersectingSessions = await SessionModel.getSessionsByIntersection(deviceId, deviceImei, startTime, endTime)
        const results = await LiveLocationModel.getLocations(deviceId, deviceImei, sessionId, startTime, endTime)
        const output = { compressed: intersectingSessions, raw: results }
        return output
    },
}

module.exports = { tripLocationResolver }