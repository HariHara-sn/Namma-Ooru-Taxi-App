require("dotenv").config({
    path: `${process.env.NODE_ENV !== "test" ? ".env" : `.env.${process.env.NODE_ENV}`}`,
});

const { CronJob } = require('cron');
const Trip = require('../../Models/Trip');
const RideStatus = require("../../Core/PublicRides/RideStatus");
// const { getUserSocketIds } = require("../../Services/WebsocketUtilities");
const Redis = require("../DB/Redis");
const Driver = require("../../Models/Driver");
const PushNotifiationService = require("../../Services/PushNotification/PushNotifiationService");
const { sendTripRequestMessage } = require("../../Services/PushNotification/Messages");
// const socketService = require("../../main");

// async function sendPassangerSocketEvents(event, passangerId, tripId, currentFare) {
//     const passangerSocketIds = await getUserSocketIds(passangerId);
//     if(event === "tripCurrentFareUpdated"){
//         const socketData = {
//             _id: tripId,
//             currentFare: currentFare,
//         }
//         console.log(passangerSocketIds, "passangerSocketIds")
//         socketService.socketInstance.customerRideAssignHandler.emitPassangerTripFareUpdate(passangerSocketIds, socketData)
//     }
// }

async function assignDrivers() {
    
    try {
        const trips = await Trip.getPublicRidesTripByStatus(RideStatus.PENDING)
        if (!trips || trips.length === 0) {
            console.log("No pending public ride trips")
        }
        
        trips.forEach(async trip => {
            /* 
                Find driver nearby 5 drivers sort by distance from low to high 
                set maximum distance at 5 km
            */
            const pickupGeometry = {
                type: "Point",
                coordinates: trip.startLocation
            }
            const vehicleType = trip.vehicleType
            
            const selectedDrivers = await Driver.getPublicRidesDriverNearbyLocation(pickupGeometry, 5000, 5, vehicleType)
            
           
            if (!selectedDrivers || selectedDrivers.length === 0) {
                /*
                    update passanger that no drivers is available nearby
                */
                return
            }
            const selectedDriverIds = selectedDrivers.map(driver => String(driver._id))

          
           
            const cacheKey = 'PR_DA' + trip._id

            let alreadyRequestedDrivers = await Redis.getData(cacheKey)
            if (!alreadyRequestedDrivers) alreadyRequestedDrivers = []
            else alreadyRequestedDrivers = alreadyRequestedDrivers.split('|')

            /* Get drivers whom we did not send ride requests */
            const newDrivers = selectedDriverIds.filter(driver => !alreadyRequestedDrivers.includes(driver))
            const driver = newDrivers[0]
            
            const driverDetails = selectedDrivers.filter(driverObj => String(driverObj._id) === driver)[0]
            
            
            if (!driver) return console.log("No Drivers found for trip")
            
            
          
            alreadyRequestedDrivers.push(driver)
            Redis.storeData(cacheKey, alreadyRequestedDrivers.join("|"))
            
            const driverFcmTokens = driverDetails?.fcmTokens
            if(!driverFcmTokens) return console.error("No FCM tokens found for driver")
            // PRDA -> public rides driver assignment
            /* Send ride accept/reject notifications to driver */
            const { estimatedFare, maxFare, currentFare } = trip;
            let incrementedFare = currentFare
            if (currentFare) {
                incrementedFare = Math.min(currentFare + estimatedFare * 0.2, maxFare);
                await Trip.updateTripFare(trip._id, Math.round(incrementedFare));
                // sendPassangerSocketEvents(
                //     "tripCurrentFareUpdated",
                //     String(trip.passangerId),
                //     trip._id,
                //     incrementedFare
                // ).catch(err => console.error("Error sending socket to passenger", err));
                
            }else{
                await Trip.updateTripFare(trip._id, Math.round(estimatedFare));
            }

            driverFcmTokens.forEach(token => {
                PushNotifiationService.sendPushNotification(token.token, sendTripRequestMessage(trip), token.deviceId, "high", { tripId: String(trip._id), currentFare: String(incrementedFare?incrementedFare:estimatedFare) })
            })

        })

    } catch (error) {
        console.error('Error in assignDrivers:', error);
    }
}

const job = new CronJob("*/15 * * * * *", () => {// Runs every 15 seconds
    assignDrivers()
        .then(() => console.log("CronJob FOR Trips Collection Executed Successfully"))
        .catch(console.error);
}, null, false); // Set the last parameter to false to prevent auto-start

module.exports = job; // Export the CronJob instance
