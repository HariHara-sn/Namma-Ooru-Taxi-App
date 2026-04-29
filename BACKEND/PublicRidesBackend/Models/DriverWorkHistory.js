// Models/DriverWorkHistory.js
const Mongo = require('../Controllers/DB/Mongo');
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = 'driverWorkHistory';

/**
 * Get the start and end timestamps (ms) for the month containing `timestamp`.
 */
function getMonthBounds(timestamp) {
    const d = new Date(timestamp);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    return { monthStart, monthEnd };
}

/**
 * Get the day key (YYYY-MM-DD) for a given timestamp.
 */
function getDayKey(timestamp) {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Split [fromTime, toTime] across month boundaries.
 * Returns an array of { monthStart, monthEnd, segFrom, segTo } per month.
 */
function splitByMonth(fromTime, toTime) {
    const segments = [];
    let cursor = fromTime;

    while (cursor <= toTime) {
        const { monthStart, monthEnd } = getMonthBounds(cursor);
        const segFrom = cursor;
        const segTo = Math.min(monthEnd, toTime);
        segments.push({ monthStart, monthEnd, segFrom, segTo });
        // move cursor to the first millisecond of next month
        cursor = monthEnd + 1;
    }

    return segments;
}

/**
 * Compute daily online minutes from the workingHours array.
 * Groups all "online" entries by day and sums up minutes.
 * Returns: { "YYYY-MM-DD": minutes, ... }
 */
function computeDailyOnlineHours(workingHours) {
    const dailyMap = {};

    for (const entry of workingHours) {
        if (entry.status !== 'online') continue;

        let cursor = entry.from;
        const endTime = entry.to;

        while (cursor < endTime) {
            const dayKey = getDayKey(cursor);
            // end of the current day
            const d = new Date(cursor);
            const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
            const segEnd = Math.min(dayEnd, endTime);
            const minutes = (segEnd - cursor) / (1000 * 60);

            dailyMap[dayKey] = Math.round(((dailyMap[dayKey] || 0) + minutes) * 100) / 100;
            cursor = segEnd + 1;
        }
    }

    return dailyMap;
}

/**
 * Compute total monthly online minutes from the workingHours array.
 */
function computeMonthlyOnlineMinutes(workingHours) {
    let total = 0;
    for (const entry of workingHours) {
        if (entry.status !== 'online') continue;
        total += (entry.to - entry.from) / (1000 * 60);
    }
    return Math.round(total * 100) / 100;
}

/**
 * Log a driver status change session into monthly documents.
 *
 * Each month gets its own document per driver with structure:
 * {
 *   driverId: ObjectId,
 *   workingHours: [ { status, from, to, location? }, ... ],
 *   dailyOnlineMinutes: { "YYYY-MM-DD": minutes, ... },
 *   totalOnlineMinutes: Number,
 *   lastUpdatedAt: Number,
 *   from: monthStart (ms),
 *   to: monthEnd (ms)
 * }
 */
async function logDriverSessionMonthly(driverId, fromTime, toTime, status, location = null) {
    // Normalize driverId
    let driverObjectId = driverId;
    if (typeof driverId === 'string' && /^[0-9a-fA-F]{24}$/.test(driverId)) {
        driverObjectId = new ObjectId(driverId);
    }

    const now = Date.now();
    const segments = splitByMonth(fromTime, toTime);

    for (const seg of segments) {
        const filter = {
            driverId: driverObjectId,
            from: seg.monthStart,
            to: seg.monthEnd,
        };

        const workingHourEntry = {
            status: status,
            from: seg.segFrom,
            to: seg.segTo,
        };

        if (location) {
            workingHourEntry.location = location;
        }

        // Upsert: create monthly doc if not exists, then push the working hour entry
        await Mongo.updateOneRawUpsert(
            COLLECTION_NAME,
            filter,
            {
                $setOnInsert: {
                    driverId: driverObjectId,
                    from: seg.monthStart,
                    to: seg.monthEnd,
                },
                $push: {
                    workingHours: workingHourEntry,
                },
                $set: {
                    lastUpdatedAt: now,
                },
            }
        );

        // Now recompute daily online hours and total for this month doc
        const monthDoc = await Mongo.findOne(COLLECTION_NAME, filter);

        if (monthDoc && Array.isArray(monthDoc.workingHours)) {
            const dailyOnlineMinutes = computeDailyOnlineHours(monthDoc.workingHours);
            const totalOnlineMinutes = computeMonthlyOnlineMinutes(monthDoc.workingHours);

            await Mongo.updateOneRaw(
                COLLECTION_NAME,
                { _id: monthDoc._id },
                {
                    $set: {
                        dailyOnlineMinutes: dailyOnlineMinutes,
                        totalOnlineMinutes: totalOnlineMinutes,
                    },
                }
            );
        }
    }

    return { acknowledged: true };
}

/**
 * Get all work history documents for a driver, optionally filtered by month range.
 */
async function getDriverWorkHistory(driverId, fromMonth, toMonth) {
    let driverObjectId = driverId;
    if (typeof driverId === 'string' && /^[0-9a-fA-F]{24}$/.test(driverId)) {
        driverObjectId = new ObjectId(driverId);
    }

    const filter = { driverId: driverObjectId };

    if (fromMonth) filter.from = { $gte: fromMonth };
    if (toMonth) filter.to = { $lte: toMonth };

    return Mongo.find(COLLECTION_NAME, filter);
}

module.exports = {
    logDriverSessionMonthly,
    getDriverWorkHistory,
    // exported for testing
    splitByMonth,
    computeDailyOnlineHours,
    computeMonthlyOnlineMinutes,
    getMonthBounds,
};
