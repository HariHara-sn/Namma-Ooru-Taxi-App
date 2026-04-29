// Utils/WorkingHoursUtils.js
function roundHours(v) {
    return Math.round(v * 100) / 100;
}

/**
 * Split a [start,end] window across months only.
 * Returns entries like { monthKey:'YYYY-MM', fromTime, toTime, hours }
 */
function buildMonthSegments(startTime, endTime) {
    const segments = [];
    if (typeof startTime !== 'number' || typeof endTime !== 'number' || endTime < startTime) {
        return segments;
    }

    let cursor = startTime;
    while (cursor <= endTime) {
        const d = new Date(cursor);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        // end of current month
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() - 1;

        const segStart = cursor;
        const segEnd = Math.min(monthEnd, endTime);
        const hours = roundHours((segEnd - segStart) / (1000 * 60 * 60));

        segments.push({ monthKey, fromTime: segStart, toTime: segEnd, hours });
        cursor = segEnd + 1;
    }

    return segments;
}

/**
 * Mutates a driver.workingHours array (in-memory) so it matches the new schema:
 *   workingHours: [{ month, totalHours, statusLog:[{status, fromTime, toTime}] }]
 * Increments totalHours ONLY for status === 'online'.
 */
function appendStatusIntervalsMonthly(workingHours, status, startTime, endTime) {
    if (!Array.isArray(workingHours)) return;
    const segments = buildMonthSegments(startTime, endTime);

    for (const seg of segments) {
        let monthObj = workingHours.find(m => m && m.month === seg.monthKey);
        if (!monthObj) {
            monthObj = { month: seg.monthKey, totalHours: 0, statusLog: [] };
            workingHours.push(monthObj);
        }
        if (!Array.isArray(monthObj.statusLog)) monthObj.statusLog = [];

        monthObj.statusLog.push({
            status,
            fromTime: seg.fromTime,
            toTime: seg.toTime,
        });

        if (status === 'online') {
            monthObj.totalHours = roundHours((monthObj.totalHours || 0) + seg.hours);
        }
    }
}

module.exports = {
    roundHours,
    buildMonthSegments,
    appendStatusIntervalsMonthly,
};
