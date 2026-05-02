/*
    Constants
*/
const R = 6371e3;

export default function findDistance(locationA, locationB, type="km") {
    const φ1 = locationB.latitude * Math.PI / 180; // φ, λ in radians
    const φ2 = locationA.latitude * Math.PI / 180;
    const Δφ = (locationA.latitude - locationB.latitude) * Math.PI / 180;
    const Δλ = (locationA.longitude - locationB.longitude) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceInKilometers = (R * c) / 1000;
    if (type === "km") {
        return distanceInKilometers;
    } else if (type === "m") {
        return distanceInKilometers * 1000;
    } else if (type === "mi") {
        return distanceInKilometers * 0.621371;
    } else if (type === "ft") {
        return distanceInKilometers * 3280.84;
    }
}

export function findDistanceInMeters(userLocation, nonreachedStops) {
    const R = 6371e3; // Earth's radius in meters

    // Handle array vs object input formats
    let lat1, lon1, lat2, lon2;
    
    if (Array.isArray(userLocation)) {
        lat1 = userLocation[0];
        lon1 = userLocation[1];
    } else {
        lat1 = userLocation?.latitude;
        lon1 = userLocation?.longitude;
    }

    if (Array.isArray(nonreachedStops)) {
        lat2 = nonreachedStops[1];
        lon2 = nonreachedStops[0];
    } else {
        lat2 = nonreachedStops?.[0]?.location?.[1];
        lon2 = nonreachedStops?.[0]?.location?.[0];
    }

    // Convert to radians
    const lat1Rad = lat1 * Math.PI/180;
    const lat2Rad = lat2 * Math.PI/180;
    const deltaLat = (lat2 - lat1) * Math.PI/180;
    const deltaLon = (lon2 - lon1) * Math.PI/180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}