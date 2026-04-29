// const { parentPort } = require('worker_threads');
const turf = require('@turf/turf');

/**
 * Filters points to find which are outside a given polygon.
 * @param {Array} points Array of points in [lng, lat] format.
 * @param {Object} polygon GeoJSON Polygon object.
 * @returns {Array} An array of two arrays: the first array contains points outside the polygon, and the second array contains the indices of those points.
 */
function filterPointsOutsidePolygon({points, polygon}) {
    const pointsOutside = [];
    const indicesOutside = [];
    for (let index = 0; index < points.length; index++) {
        const turfPoint = turf.point(points[index].location);
        if (!turf.booleanPointInPolygon(turfPoint, polygon)) {
            pointsOutside.push(points[index].location);
            indicesOutside.push(index);
        }else{
            indicesOutside.push(null)
            pointsOutside.push(null)
        }
    }
    return [pointsOutside, indicesOutside];
}

module.exports = filterPointsOutsidePolygon;