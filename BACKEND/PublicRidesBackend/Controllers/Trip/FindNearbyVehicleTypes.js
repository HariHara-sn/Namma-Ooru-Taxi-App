const RateChart = require("../../Core/PublicRides/RateChart");
const VehicleType = require("../../Core/PublicRides/VehicleType");
const Driver = require("../../Models/Driver");


/*
    Find nearby vehicle types and calculate approximate fare for each vehicle type
    @param pickupLocation: [number, number] - pickup location
    @param travelDistance: number - travel distance between pickup and drop location in meters
    @return nearbyVehicleTypes: [object] - array of objects with vehicleType and fare information
*/
/*
 NOTE: FOR TRAVELDISTANCE, Dont use straight line distance, instead use distance from the routing engine
*/
const PassengerCount ={
    [VehicleType.SEDAN]: 4,
    [VehicleType.SUV]: 6,
    [VehicleType.AUTO]: 3,
    [VehicleType.HATCHBACK]: 4,
    [VehicleType.BIKE]: 1,
   
}

//fornow is static need to change it to dynamic based on the traffic and distance
const TimeTaken = {
    [VehicleType.SEDAN]: 10,
    [VehicleType.SUV]: 15,
    [VehicleType.AUTO]: 10,
    [VehicleType.HATCHBACK]: 10,
    [VehicleType.MOTORBIKE]: 5,
    [VehicleType.SCOOTER]: 5
}
module.exports = async function FindNearbyVehicleTypes(pickupLocation, travelDistance = 1000) {

    const pickupPoint = {
        type: "Point",
        coordinates: pickupLocation
    }

    const vehicleTypes = [
        VehicleType.SEDAN,
        VehicleType.SUV,
        VehicleType.AUTO,
        VehicleType.HATCHBACK,
        VehicleType.MOTORBIKE,
        VehicleType.SCOOTER
    ]

    /* Check nearby 10-20 vehicles nearby the pickup location within 5kms and sort by distance from low to high */
    const nearbyDrivers = await Driver.getPublicRidesDriverNearbyLocation(pickupPoint, 5000, 20, null)

    if (!nearbyDrivers || nearbyDrivers.length === 0) {
        return null
    }

    /* out of all vehicles keep one vehicle of each vehicle type which should have the minimum distance from the pickup location */
    const nearbyVehicleTypes = []
    vehicleTypes.forEach(vehicleType => {
        const drivers = nearbyDrivers.filter(driver => driver.ownVehicleInfo.vehicleType === vehicleType)
        if (drivers.length > 0) {
            
            // Calculate fare for this vehicle type
            const fare = Math.round(RateChart[vehicleType].baseRate +
                (RateChart[vehicleType].perKmRate * travelDistance))
            
            // Only add vehicle type and fare information
            nearbyVehicleTypes.push({
                vehicleType: vehicleType,
                fare: fare,
                fareMax: Math.round(fare * 1.8), /* +80% */
                passengerCount: PassengerCount[vehicleType],
                timeTakenToPickup: TimeTaken[vehicleType]
            })
        }
    })

    if (!nearbyVehicleTypes || nearbyVehicleTypes.length === 0) {
        return null
    }

    return nearbyVehicleTypes
}