/*
    Constants
*/
const R = 6371e3;

export default function findDistance(locationA, locationB) {
    const φ1 = locationB.latitude * Math.PI / 180; // φ, λ in radians
    const φ2 = locationA.latitude * Math.PI / 180;
    const Δφ = (locationA.latitude - locationB.latitude) * Math.PI / 180;
    const Δλ = (locationA.longitude - locationB.longitude) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceInKilometers = (R * c) / 1000;
    return distanceInKilometers
}