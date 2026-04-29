/**
 * Checks if given points are within a circle.
 * @param {Object} center - The center of the circle with latitude and longitude.
 * @param {number} radius - The radius of the circle in meters.
 * @param {Array} points - The points to check, each with latitude and longitude.
 * @returns {Array} - An array of two arrays: the first array contains points outside the circle, and the second array contains the indices of those points.
 */
const turf = require('@turf/turf');

function filterPointsOutsideCircle({ center, radius, points }) {
    const pointsOutsideCircle = [];
    const indicesOutsideCircle = [];
    const circle = turf.circle(center, radius * 0.001, { steps: 64, units: 'kilometers' });
    
    for (let index = 0; index < points.length; index++) {
        const point = points[index];
        const turfPoint = turf.point(point.location);
        if (!turf.booleanPointInPolygon(turfPoint, circle)) {
            pointsOutsideCircle.push(point);
            indicesOutsideCircle.push(index);
        } else {
            indicesOutsideCircle.push(null)
            pointsOutsideCircle.push(null)
        }
    }

    return [pointsOutsideCircle, indicesOutsideCircle];
}

module.exports = filterPointsOutsideCircle;