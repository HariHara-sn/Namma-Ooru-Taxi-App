// jobs/dailyTripStats.js
require('dotenv').config({
    path: process.env.NODE_ENV !== 'test' ? '.env' : `.env.${process.env.NODE_ENV}`,
});

const fs = require('fs');
const path = require('path');
const { CronJob } = require('cron');

const Trip = require('../../Models/Trip');
const Driver = require('../../Models/Driver');
const Mongo = require('../DB/Mongo');
// const Mailer = require('../../Core/Alerts/Mailer');

// ---- simple state persistence (epoch ms in UTC) -----------------------------
const STATE_FILE = path.join(__dirname, '.dailyTripStats.lastRun');

function readLastRunMs() {
    try {
        const s = fs.readFileSync(STATE_FILE, 'utf8').trim();
        const n = Number(s);
        return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
        return null;
    }
}

function writeLastRunMs(ms) {
    try {
        fs.writeFileSync(STATE_FILE, String(ms));
    } catch (e) {
        console.error('[dailyTripStats] Failed to persist lastRun:', e);
    }
}

// ---- main work --------------------------------------------------------------
async function runDailyTripStats({ startMs, endMs }) {
    // Your model methods expect Date objects
    const start = new Date(startMs);
    const end = new Date(endMs);

    // 1) Trips (assuming Trip.getDailyTrips returns [{status, count}] style)
    const rows = await Trip.getDailyTrips(start, end);

    // 2) Status aggregation (tolerant to unknown values)
    const stats = {};
    let totalTrips = 0;
    for (const r of rows || []) {
        const key = (r.status || 'UNKNOWN').toString().toUpperCase();
        const c = Number(r.count) || 0;
        totalTrips += c;
        stats[key] = (stats[key] || 0) + c;
    }

    // 3) Drivers
    const drivers = await Driver.getDriversByDate(start, end);
    const inductedDrivers = Array.isArray(drivers) ? drivers.length : 0;

    const blockedDrivers = await Driver.getBlockedDrivers();
    const blockedDriversCount = Array.isArray(blockedDrivers) ? blockedDrivers.length : 0;

    // 4) Group failed trips by same passenger and nearby stops (<500m)
    const failedTrips = await Mongo.findProjection(
        'trips',
        {
            startTime: { $gte: start.getTime(), $lte: end.getTime() },
            status: 'FAILED'
        },
        { _id: 1, passangerId: 1, stops: 1 }
    );

    function extractStopPoints(t) {
        if (!Array.isArray(t.stops)) return [];
        const points = [];
        for (const s of t.stops) {
            if (Array.isArray(s?.location) && s.location.length >= 2) {
                const lng = Number(s.location[0]);
                const lat = Number(s.location[1]);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    points.push({ lat, lng });
                }
            }
        }
        return points;
    }

    function haversineMeters(a, b) {
        const R = 6371000; // Earth radius in meters
        const dLat = (b.lat - a.lat) * Math.PI / 180;
        const dLng = (b.lng - a.lng) * Math.PI / 180;
        const lat1 = a.lat * Math.PI / 180;
        const lat2 = b.lat * Math.PI / 180;
        const sinDLat = Math.sin(dLat / 2);
        const sinDLng = Math.sin(dLng / 2);
        const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
        const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
        return R * c;
    }

    function clusterByStops(trips, maxMeters = 500) {
        const clusters = [];
        for (const t of trips) {
            const points = extractStopPoints(t);
            if (points.length === 0) continue;
            for (const p of points) {
                let placed = false;
                for (const cl of clusters) {
                    const dist = haversineMeters(p, cl.center);
                    if (dist <= maxMeters) {
                        // Update center based on total points in cluster
                        cl._pointCount = (cl._pointCount || 1);
                        cl.center.lat = (cl.center.lat * cl._pointCount + p.lat) / (cl._pointCount + 1);
                        cl.center.lng = (cl.center.lng * cl._pointCount + p.lng) / (cl._pointCount + 1);
                        cl._pointCount += 1;
                        cl._tripIds.add(String(t._id));
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    const set = new Set();
                    set.add(String(t._id));
                    clusters.push({ center: { ...p }, _pointCount: 1, _tripIds: set });
                }
            }
        }
        // Normalize clusters: count unique trips and list them
        return clusters.map(cl => ({ center: cl.center, count: cl._tripIds.size, tripIds: Array.from(cl._tripIds) }));
    }

    const failedGroupsByPassenger = {};
    for (const t of failedTrips || []) {
        const pid = t.passangerId ? String(t.passangerId) : null;
        if (!pid) continue;
        if (!failedGroupsByPassenger[pid]) failedGroupsByPassenger[pid] = [];
        // We'll cluster per passenger after collecting all
    }
    // Build map pid -> trips
    const tripsByPassenger = {};
    for (const t of failedTrips || []) {
        const pid = t.passangerId ? String(t.passangerId) : null;
        if (!pid) continue;
        (tripsByPassenger[pid] ||= []).push(t);
    }
    const failedSimilarGroups = Object.entries(tripsByPassenger).map(([pid, list]) => ({
        passangerId: pid,
        clusters: clusterByStops(list, 500)
    }));

    const result = {
        range: { start: start.toISOString(), end: end.toISOString() },
        totalTrips,
        byStatus: stats,
        inductedDrivers,
        blockedDrivers: blockedDriversCount,
        failedSimilarGroups
    };

    return result;
}

// ---- helper to compute "today 8PM IST" -------------------------------------
// We schedule the job at 20:00 Asia/Kolkata, so `endMs` is simply now.
// For the *first* run (no lastRun), we backfill 24h.
function getRunWindowNow() {
    const endMs = Date.now(); // when the cron fires (≈ 8PM IST)
    const lastRunMs = readLastRunMs();
    const startMs = lastRunMs && lastRunMs < endMs ? lastRunMs : endMs - 24 * 60 * 60 * 1000;
    return { startMs, endMs };
}
// */10 * * * * * every 10 seconds for testing
// 0 0 20 * * * 20:00:00 every day
// ---- CRON (runs at 20:00 IST daily) ----------------------------------------
const job = new CronJob(
    '0 0 20 * * *', // sec min hour -> 20:00:00 every day
    async () => {
        const { startMs, endMs } = getRunWindowNow();

        try {
            const stats = await runDailyTripStats({ startMs, endMs });
            console.log('[dailyTripStats] result:', stats);

            // const mailResponse = await Mailer('30199hp@gmail.com', `Your email OTP is ${'vebvr'}`, 'Email OTP Verification', null, null);
            // console.log('[dailyTripStats] mailResponse:', mailResponse);
            // persist “last successful run time” as the end of this run
            writeLastRunMs(endMs);

            // Optional: persist to DB
            // await DailyStats.findOneAndUpdate(
            //   { date: stats.range.end.slice(0, 10) },
            //   stats,
            //   { upsert: true, new: true }
            // );
        } catch (err) {
            console.error('[dailyTripStats] FAILED:', err);
            // Do NOT advance lastRun on failure; next run will re-cover this window.
        }
    },
    null,
    true,
    'Asia/Kolkata'
);

module.exports = job;
