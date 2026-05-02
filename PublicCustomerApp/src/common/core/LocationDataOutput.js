export default function () {
    return {
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
        activities: [],

        engineStates: [],
        engineSessionTypes: [], /* 1 - Running , 0 - Off, 2 - Idle */
        engineSessions: [],

        idleSessions: [],
        overSpeedSessions: [],

        bounds: [],
        distanceIntervals: {

        },
        dateDistanceMap: {},
    }

}