import findDistance from "./FindDistance";

// Street-level validation thresholds for Indian cities
const MAX_ACCURACY_METERS = 150; // Relaxed for urban canyons, tall buildings
const MAX_JUMP_DISTANCE_KM = 0.5; // 500 meters - catch GPS teleportation
const MIN_JUMP_TIME_MS = 5000; // 5 seconds - detect rapid jumps
const MAX_SPEED_KMH = 180; // Maximum realistic speed for Indian roads
const MAX_JUMP_SPEED_KMH = 150; // Speed threshold for jump detection
const MIN_TIME_BETWEEN_POINTS_MS = 1000; // Minimum 1 second between points

export default function (currentLoc, PrevLoc, type) {
    const distance = findDistance(currentLoc, PrevLoc);
    const timeDiffBetweenTwoPoints = currentLoc.time - PrevLoc.time
    const speed = distance / (timeDiffBetweenTwoPoints / 3600000);

    // Validation for driver mode (optimized for Indian city/street conditions)
    if (type === 'driver') {
        
        // 1. Filter out duplicate/too frequent points
        if (timeDiffBetweenTwoPoints < MIN_TIME_BETWEEN_POINTS_MS) {
            console.log("invalid driver point: Points too close in time")
            return [false, speed, distance]
        }

        // 2. GPS accuracy check for street-level precision
        // In narrow Indian streets, poor accuracy = unreliable position
        if (currentLoc.accuracy && currentLoc.accuracy > MAX_ACCURACY_METERS) {
            console.log(`invalid driver point: Poor GPS accuracy (${currentLoc.accuracy}m)`)
            return [false, speed, distance]
        }

        // 3. Maximum speed check for Indian roads
        // City: 40-60 km/h, Highway: 80-120 km/h, Expressway: 100-120 km/h
        if (speed > MAX_SPEED_KMH) {
            console.log(`invalid driver point: Speed exceeds ${MAX_SPEED_KMH} km/h (${speed.toFixed(1)} km/h)`)
            return [false, speed, distance]
        }
        
        // 4. GPS jump detection - common in dense cities with tall buildings
        // If moved too far too fast, likely GPS signal loss/regain
        if (timeDiffBetweenTwoPoints < MIN_JUMP_TIME_MS && speed > MAX_JUMP_SPEED_KMH) {
            console.log(`invalid driver point: GPS jump detected (${distance.toFixed(2)}km in ${timeDiffBetweenTwoPoints/1000}s)`)
            return [false, speed, distance]
        }

        // 5. Detect GPS teleportation (moved > 500m instantly)
        // Common in narrow lanes where GPS loses lock
        if (distance > MAX_JUMP_DISTANCE_KM && timeDiffBetweenTwoPoints < MIN_JUMP_TIME_MS) {
            console.log(`invalid driver point: Teleportation detected (${distance.toFixed(2)}km in ${timeDiffBetweenTwoPoints/1000}s)`)
            return [false, speed, distance]
        }

        // 6. Speed consistency check - rapid acceleration/deceleration
        // If phone reports speed and calculated speed differ too much, suspect GPS error
        if (currentLoc.speed && Math.abs(currentLoc.speed * 1.852 - speed) > 50) {
            console.log(`invalid driver point: Speed mismatch (reported: ${(currentLoc.speed * 1.852).toFixed(1)}, calculated: ${speed.toFixed(1)})`)
            return [false, speed, distance]
        }
        
        return [true, speed, distance]
    }

    return [true, speed, distance]
}