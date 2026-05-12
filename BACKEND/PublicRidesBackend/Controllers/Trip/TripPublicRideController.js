const Driver = require("../../Models/Driver");
const Trip = require("../../Models/Trip");
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { e2eS3File } = require("../../Models/e2eS3File");
const RideStatus = require('../../Core/PublicRides/RideStatus');
const Passanger = require("../../Models/Passanger");
const { getUserSocketIds } = require("../../Services/WebsocketUtilities");
const OTP = require("../../Controllers/OTP");
const PushNotifiationService = require("../../Services/PushNotification/PushNotifiationService");
const NOTPushNotifiationService = require("../../Services/PushNotification/NOTPushNotifiationService");
const { sendTripCancelledByPassangerMessage,sendTripCancelledByPassangerMessageafterPickup,sendTripCancelledByDriverMessageafterPickup, sendTripCancelledByDriverMessage, sendPickupLocationChangeAlert, AcceptedLocationChangeAlert, RejectedLocationChangeAlert, sendNewBillRequestMessage } = require("../../Services/PushNotification/Messages");
const { sendTripDriverAssignedMessage, sendAlertPassangerPickupMessagewithOTP, sendTripDriverAssignedMessageWithOTP } = require("../../Services/PushNotification/publicRideCustomerNotification");
const GeneratePresignedUrl = require("../../Controllers/GeneratePresignedUrl");
const FareConfigs = require("../../Models/FareConfigs");    
// const { getFareAlert } = require("../../Services/PushNotification/Messages");
const FareService = require("../../fareEngine/services/FareService");
const Exotel = require("../../Services/exotel");
const OTP_LENGTH = 4;

async function sendPassangerSocketEvents(type, passangerId, socketService, driver, trip, otp, action) {

    const passangerSocketIds = await getUserSocketIds(passangerId);
    if(type === "driverAllocated"){
        const socketData = {
            _id: trip._id,
            driver,
            otp,
            tripStatus: "ACCEPTED",
            tripData: trip
        }

        socketService.customerRideAssignHandler.emitDriverAllocated(passangerSocketIds, socketData)
    }
    if (type === "upComingTripDriverAllocated") {
        const socketData = {
            _id: trip._id,
            driver,
            otp,
            tripStatus: "DRIVER_ASSIGNED",
            tripData: trip,
            upComingTrip: true,
            message: "upComingTripDriverAllocated"
        }

        socketService.customerRideAssignHandler.emitDriverAllocated(passangerSocketIds, socketData)
    }
    if(type === "tripCancelledByDriver"){
        const socketData = {
            _id: trip._id,
            tripStatus: "CANCELLED",
            fareDetails: trip?.fareDetails || null,
            isOnGoingTrip: trip?.fareDetails ? true : false
        }
        socketService.customerRideAssignHandler.emitPassangerTripStatus(passangerSocketIds, socketData)
    }
    if(type === "acceptedLocationChangeRequest"){
        const socketData = {
            _id: trip._id,
            stops: trip.stops,
            estimatedDuration: trip.estimatedDuration,
            estimatedDistance: trip.estimatedDistance,
            estimatedFare: trip.estimatedFare,
            action: action
        }
        socketService.customerRideAssignHandler.emitPassangerLocationChange(passangerSocketIds, socketData)
    }
    if(type === 'WaypointsReached'){
        const socketData = {
            _id: trip._id,
            tripData: trip,
            tripStatus: "PICKEDUP",
        }
        socketService.customerRideAssignHandler.emitPassangerTripStatus(passangerSocketIds, socketData)
    }
    if(type === 'newBillRequest'){
        const socketData = {
            _id: trip._id,
            bills: trip.bills,
            tripStatus: trip.status,
        }
        socketService.customerRideAssignHandler.emitNewBillRequest(passangerSocketIds, socketData)
    }

}
async function sendDriverSocketEvents(type, driverId, socketService, tripId, trip, status) {

    const driverSocketIds = await getUserSocketIds(driverId);
    if(type === "tripCancelledByPassenger"){
        const socketData = {
            _id: trip._id,
            tripStatus: "CANCELLED",
            totalFare: trip?.fareDetails || null,
            isOnGoingTrip: trip?.fareDetails ? true : false,
        }
       
        socketService.publicRideDriverHandler.emitDriverTripStatus(driverSocketIds, socketData)
    }

    if(type === "stopChangeRequest"){
        const socketData = {
            _id: tripId,
            changeRequestStops: trip,
            status: status
        }
        socketService.publicRideDriverHandler.emitStopChangeRequest(driverSocketIds, socketData)
    }
}



module.exports = function (CLASS) {

    CLASS.prototype.acceptRidePublicRides = async function (req, res) {
        const driverId = req.driver.id;
        try {

            const tripId = req.body?.tripId;
            if (!tripId) return res.status(400).json({ success: false, message: 'Trip ID is required' });

            const driver = await Driver.getDriverWithId(driverId);
            if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });

            const trip = await Trip.getTripById(tripId);
            if (!trip) return res.status(400).json({ success: false, message: 'Trip not found' });

            if (!trip.publicRidesTrip) return res.status(400).json({ success: false, message: 'Trip is not a public rides trip' });
            if (trip.status === RideStatus.CANCELLED ) return res.status(400).json({ success: true, message: 'Trip is already cancelled', isCancelled: true });
            
            // if (trip.status !== RideStatus.MATCHED && trip.driverId?.toString() === driverId){
            //     console.log("Driver already assigned to this trip, proceeding to accept");
            //     return res.status(200).json({ success: true, message: 'Trip is already accepted by another driver' });
            // }
            const passangerId = trip.passangerId;
            const otp = OTP.generateOTP(OTP_LENGTH);
            /* get Passanger FCM tokens and socketIDS */
            const passanger = await Passanger.getPassangerWithId(passangerId);
            if (!passanger) return res.status(400).json({ success: false, message: 'Passanger not found' });
            const tripTimeline = {
                state: 'ACCEPTED',
                timestamp: new Date().getTime(),
            };
            await Trip.assignDriverToTripwithTimeline(tripId, driverId, otp, tripTimeline);

            const getMaxDistanceLimit = await FareConfigs.getMaxDistanceLimit(trip?.regionCode || 'default', trip?.vehicleType);
             
            trip.maxDistanceLimit = getMaxDistanceLimit || null;

            // console.log(getMaxDistanceLimit, "Max Distance Limit for the trip");
          
            // await Driver.updateDriver(driverId, { tripStatus: "ONGOING" })
            // if (!driver.ownVehicleInfo) {
            //     return res.status(400).json({ success: false, message: 'Driver has no vehicle assigned. Please assign a vehicle to the driver before accepting rides.' });
            // }

            const driverInfo = {
                driverName: driver.name,
                driverPhone: driver.phone,
                driverRating: driver.rating || null,
                vehicleType: driver.ownVehicleInfo.type,
                vehicleModel: driver.ownVehicleInfo.model,
                vehicleBrand: driver.ownVehicleInfo.make,
                vehicleColor: driver.ownVehicleInfo.color,
                vehicleNumber: driver.ownVehicleInfo.regNo,
                otp: otp,
                upiid: driver.bankDetails?.UPIID || null,
                driverLocaiton: driver.location
            };
   
            if(driver?.documents?.driverPhoto){
                const ImagePath = driver.documents.driverPhoto.replace(/^https:\/\/[^/]+\/?/, '');
                const rjvw = new GeneratePresignedUrl()
                driverInfo.driverPhoto = await rjvw.generatePresignedImg(ImagePath)
                driverInfo.driverPhotoImg = ImagePath
            }
           

            
            sendPassangerSocketEvents("driverAllocated", passangerId, req.socketService, driverInfo, trip, otp).catch(err => {
                console.log(err, "Error sending socket events to passanger")
            })

            
            if (passanger?.fcmToken) {
                if(req.useNotPushNotification){
                    await NOTPushNotifiationService.sendPushNotification(passanger.fcmToken.token, sendTripDriverAssignedMessageWithOTP(driver.name, otp), null, "high", { tripId: String(trip._id), "trip_status": 'ACCEPTED' });
                }else{
                    await PushNotifiationService.sendPushNotification(passanger.fcmToken.token, sendTripDriverAssignedMessageWithOTP(driver.name, otp), null, "high", { tripId: String(trip._id), "trip_status": 'ACCEPTED' });

                }
               
            }

            const currentTrip = await Trip.getTripById(tripId);
            if(!currentTrip) return res.status(400).json({ success: false, message: 'Trip not found' });


            
            currentTrip.maxDistanceLimit = getMaxDistanceLimit || null;

            return res.status(200).json({ success: true, message: 'Trip accepted successfully', currentTrip: currentTrip });

        } catch (error) {
            return this.handleError(error, res)
        }
    }

    CLASS.prototype.cancelTripByDriver = async function (req, res) {
        try {
            const driverId = req.driver.id
            const {tripId, reason, totalDistance, totalDuration, encodedPolyline, droppedAtLoc, isBeforePickup} = req.body
            const trip =await Trip.getTripById(tripId)
            const TripPassenger = await Passanger.getPassangerWithId(trip.passangerId);
            const TripDriver = await Driver.getDriverWithId(trip.driverId);
            let farecalculationDistance = totalDistance || 0;
            let farecalculationDuration = totalDuration || 0;
            // DistanceOffset logic: if totalDistance < estimatedDistance, offset is 4; if more, offset is 1
            let DistanceOffset = 3; // default, will be set below
            const DurationOffset = 20;
            let estimatedDistance = 0;
            let estimatedDuration = 0;
            if(trip?.estimatedDistance && trip?.estimatedDuration){
                estimatedDistance = trip?.estimatedDistance ? Number(trip?.estimatedDistance) : 0;
                estimatedDuration = trip?.estimatedDuration ? Number(trip?.estimatedDuration) : 0;
            }
            if (totalDistance < estimatedDistance) {
                DistanceOffset = 3;
            } else {
                DistanceOffset = 1;
            }
            const distanceDiff = Math.abs(totalDistance - estimatedDistance);
            const durationDiff = Math.abs(totalDuration - estimatedDuration);
            if (DistanceOffset >= distanceDiff) {
                farecalculationDistance = estimatedDistance;
            }
            if (DurationOffset >= durationDiff) {
                farecalculationDuration = estimatedDuration;
            }
            const driverWaitingTime = trip?.stops?.reduce((sum, stop) => {
                return sum + (stop.driverWaitTime || 0);
            }, 0);
            if (!trip) return res.status(400).json({success: false, message: 'Trip not Found'})
            const isAccepted = trip.status === RideStatus.ACCEPTED;

         

            // If droppedAtLoc provided, normalize and prepare cancel meta
            let cancelMeta = null;
            if (droppedAtLoc) {
                const src = droppedAtLoc?.location || droppedAtLoc;
                const lat = Number(src?.latitude ?? src?.lat);
                const lon = Number(src?.longitude ?? src?.lon ?? src?.lng);
                if (Number.isFinite(lat) && Number.isFinite(lon)) {
                    const loc = { lat, lon };
                    cancelMeta = { cancelledLoc: loc, cancelledAt: Date.now(), droppedAtLoc: loc };
                }
            }
        
            if (isAccepted || isBeforePickup) {
                const timeline = {
                    state: 'CANCELLED_BY_DRIVER_BEFORE_PICKUP',
                    timestamp: new Date().getTime(),
                };
                await Driver.updateDriver(driverId, { tripStatus: "NOTRIP", isAvailable: true });
            
                await Trip.cancelTripwithTimeline(tripId, reason, 'DRIVER', timeline);
                if (cancelMeta) {
                    await Trip.updateCancelledMeta(tripId, cancelMeta);
                }
                sendPassangerSocketEvents(
                    "tripCancelledByDriver",
                    String(TripPassenger._id),
                    req.socketService,
                    null,
                    trip,
                    null
                ).catch(err => console.error("Error sending socket to passenger", err));
                if (TripPassenger?.fcmToken) {
                    if(req.useNotPushNotification){
                        await NOTPushNotifiationService.sendPushNotification(
                            TripPassenger.fcmToken?.token,
                            sendTripCancelledByDriverMessage(TripDriver.name),
                            null,
                            "high",
                            { tripId: String(trip._id), "trip_status": 'CANCELLED' }
                        );

                    }else{
                        if(req.useNotPushNotification){ 
                            await PushNotifiationService.sendPushNotification(
                                TripPassenger.fcmToken?.token,
                                sendTripCancelledByDriverMessage(TripDriver.name),
                                null,
                                "high",
                                { tripId: String(trip._id), "trip_status": 'CANCELLED' }
                            );
                        }else{
                            await PushNotifiationService.sendPushNotification(  
                                TripPassenger.fcmToken?.token,
                                sendTripCancelledByDriverMessage(TripDriver.name),
                                null,
                                "high",
                                { tripId: String(trip._id), "trip_status": 'CANCELLED' }
                            );
                        }
                    }
                }   
                return res.json({ success: true, message: "Trip Cancelled Successfully", isOnGoingTrip: false });
            }
            const farepayload = {
                distance: farecalculationDistance,
                duration: farecalculationDuration,
                waitTime: driverWaitingTime,
                zone: 'all',
                tripId: tripId
            }
            const getfinalFare = await FareService.calculateFinalFareFromTrip(farepayload)
            if (!getfinalFare.success) return res.json({ success: false, message: "Fare Details Fetch Fails" });
            const finalFare = getfinalFare?.data
            finalFare.distance = totalDistance
            finalFare.duration = totalDuration
            trip.fareDetails = finalFare;
            const timeline = {
                state: 'CANCELLED_BY_DRIVER_AFTER_PICKUP',
                timestamp: new Date().getTime(),
            };
            await Trip.updateCancelTripFinalInfo(tripId, RideStatus.CANCELLED, reason, totalDuration, totalDistance, driverWaitingTime, encodedPolyline, 'DRIVER', timeline)
            if (cancelMeta) {
                await Trip.updateCancelledMeta(tripId, cancelMeta);
            }
            // const updatePaymentsToTrip = await PublicRidesPayment.updatePaymentToTrip(tripId, driverId, passangerId, finalFare)
            // await Driver.updateDriver(driverId, { tripStatus: "NOTRIP", isAvailable: true });
            // if (!updatePaymentsToTrip.success) return res.json({ success: true, message: "Error updating fare details"});
            sendPassangerSocketEvents(
                "tripCancelledByDriver",
                String(TripPassenger._id),
                req.socketService,
                null,
                trip,
                null
            ).catch(err => console.error("Error sending socket to passenger", err));

            if (TripPassenger?.fcmToken) {
                if(req.useNotPushNotification){
                    await NOTPushNotifiationService.sendPushNotification(
                        TripPassenger.fcmToken?.token,
                        sendTripCancelledByDriverMessageafterPickup(TripDriver.name),
                        null,
                        "high",
                        { tripId: String(trip._id), "trip_status": 'CANCELLED' }
                    );

                }else{
                    await PushNotifiationService.sendPushNotification(
                        TripPassenger.fcmToken?.token,
                        sendTripCancelledByDriverMessageafterPickup(TripDriver.name),
                        null,
                        "high",
                        { tripId: String(trip._id), "trip_status": 'CANCELLED' }
                    );
                }
            }
            return res.json({ success: true, message: "Trip Cancelled Successfully", isOnGoingTrip: true, totalFare: finalFare,});
        } catch (e) {
            return this.handleError(e, res)
        }
    }
    
    CLASS.prototype.cancelTripByPassenger = async function (req, res) {
        try {
            const passengerId = req.passanger.id
            const {tripId, reason, totalDistance, totalDuration, isNotyetPickedUp} = req.body
            const trip =await Trip.getTripById(tripId)
            console.log(trip, "Trip in cancel by passenger");
            const TripPassenger = await Passanger.getPassangerWithId(passengerId);
            
            const TripDriver = await Driver.getDriverWithId(trip.driverId);
            const driverId = trip.driverId;
            const driverLocation = await Driver.getDriverLocation(driverId);


            let farecalculationDistance = totalDistance || 0;
            let farecalculationDuration = totalDuration || 0;
            // DistanceOffset logic: if totalDistance < estimatedDistance, offset is 4; if more, offset is 1
            let DistanceOffset = 3; // default, will be set below
            const DurationOffset = 20;
            let estimatedDistance = 0;
            let estimatedDuration = 0;
            if(trip?.estimatedDistance && trip?.estimatedDuration){
                estimatedDistance = trip?.estimatedDistance ? Number(trip?.estimatedDistance) : 0;
                estimatedDuration = trip?.estimatedDuration ? Number(trip?.estimatedDuration) : 0;
            }
            if (totalDistance < estimatedDistance) {
                DistanceOffset = 3;
            } else {
                DistanceOffset = 1;
            }
            const distanceDiff = Math.abs(totalDistance - estimatedDistance);
            const durationDiff = Math.abs(totalDuration - estimatedDuration);
            if (DistanceOffset >= distanceDiff) {
                farecalculationDistance = estimatedDistance;
            }
            if (DurationOffset >= durationDiff) {
                farecalculationDuration = estimatedDuration;
            }
            const driverWaitingTime = trip?.stops?.reduce((sum, stop) => {
                return sum + (stop.driverWaitTime || 0);
            }, 0);
            if (!trip) return res.status(400).json({success: false, message: 'Trip not Found'})
            const isAccepted = trip.status === RideStatus.ACCEPTED;
            const isPickedUp = trip.status === RideStatus.PICKEDUP;
            const isScheduled = trip.status === RideStatus.SCHEDULED;

          

            await Passanger.updatePassangerUpdateCancelledTrips(passengerId);
           


            // If droppedAtLoc provided, normalize and store cancel metadata (location + time)
            let cancelMeta = null;
            if (
                driverLocation &&
                Array.isArray(driverLocation.coordinates) &&
                driverLocation.coordinates.length >= 2 &&
                driverLocation.coordinates[0] !== null &&
                driverLocation.coordinates[1] !== null
            ) {
                const src = driverLocation.coordinates;
                const lat = Number(src[1]);
                const lon = Number(src[0]);
                if (Number.isFinite(lat) && Number.isFinite(lon)) {
                    const loc = { lat, lon };
                    cancelMeta = { cancelledLoc: loc, cancelledAt: Date.now() };
                }
            }
            if (isAccepted || isScheduled || isNotyetPickedUp) {
                const timeline = {
                    state: 'CANCELLED_BY_PASSENGER_BEFORE_PICKUP',
                    timestamp: new Date().getTime(),
                };
                await Trip.cancelTripwithTimeline(tripId, reason, 'PASSENGER', timeline)

                if (cancelMeta) {
                    await Trip.updateCancelledMeta(tripId, cancelMeta);
                }

                if(driverId && TripDriver){
                    await Driver.updateDriver(driverId, { tripStatus: "NOTRIP", isAvailable: true });
                
                    sendDriverSocketEvents(
                        "tripCancelledByPassenger",
                        String(TripDriver._id),
                        req.socketService,
                        null,
                        trip,
                        null
                    ).catch(err => console.error("Error sending socket to passenger", err));
                    if (TripDriver?.fcmToken) {
                        if(req.useNotPushNotification){
                            await NOTPushNotifiationService.sendPushNotification(
                                TripDriver.fcmToken?.token,
                                sendTripCancelledByPassangerMessage(TripPassenger.name),
                                null,
                                "high",
                                { tripId: String(trip._id), isOnGoingTrip: "false" }
                            );

                        }else{
                            await PushNotifiationService.sendPushNotification(
                                TripDriver.fcmToken?.token,
                                sendTripCancelledByPassangerMessage(TripPassenger.name),
                                null,
                                "high",
                                { tripId: String(trip._id), isOnGoingTrip: "false" }
                            );
                        }
                    }
                }   
                return res.json({ success: true, message: "Trip Cancelled Successfully"});
            }else if(isPickedUp){
                const farepayload = {
                    distance: farecalculationDistance,
                    duration: farecalculationDuration,
                    waitTime: driverWaitingTime,
                    zone: 'all',
                    tripId: tripId
                }
                const getfinalFare = await FareService.calculateFinalFareFromTrip(farepayload)
                if (!getfinalFare.success) return res.json({ success: false, message: "Fare Details Fetch Fails" });
                const finalFare = getfinalFare?.data
                finalFare.distance = totalDistance
                finalFare.duration = totalDuration
                trip.fareDetails = finalFare;
                const timeline = {  
                    state: 'CANCELLED_BY_PASSENGER_AFTER_PICKUP',       
                    timestamp: new Date().getTime(),
                }
               
                await Trip.updateCancelTripFinalInfo(tripId, RideStatus.CANCELLED, reason, totalDuration, totalDistance, driverWaitingTime, null, 'PASSENGER', timeline)
                if (cancelMeta) {
                    await Trip.updateCancelledMeta(tripId, cancelMeta);
                }
                // const updatePaymentsToTrip = await PublicRidesPayment.updatePaymentToTrip(tripId, driverId, passengerId, finalFare)
                // await Driver.updateDriver(driverId, { tripStatus: "NOTRIP", isAvailable: true });
                // if (!updatePaymentsToTrip.success) return res.json({ success: true, message: "Error updating fare details"});
                sendDriverSocketEvents(
                    "tripCancelledByPassenger",
                    String(TripDriver._id),
                    req.socketService,
                    null,
                    trip,
                    null,
                ).catch(err => console.error("Error sending socket to passenger", err));

                if(TripDriver?.fcmToken){
                    if(req.useNotPushNotification){
                        await NOTPushNotifiationService.sendPushNotification(
                            TripDriver.fcmToken?.token,
                            sendTripCancelledByPassangerMessageafterPickup(TripPassenger.name),
                            null,
                            "high",
                            { tripId: String(trip._id), isOnGoingTrip: "true", totalFare: JSON.stringify(finalFare)}
                        );

                    }else{
                        await PushNotifiationService.sendPushNotification(
                            TripDriver.fcmToken?.token,
                            sendTripCancelledByPassangerMessageafterPickup(TripPassenger.name),
                            null,
                            "high",
                            { tripId: String(trip._id), isOnGoingTrip: "true", totalFare: JSON.stringify(finalFare)}
                        );
                    }
                }
            
                return res.json({ success: true, message: "Trip Cancelled Successfully", totalFare: finalFare});
            }
            return res.json({ success: false, message: "Not OnGoing Trip"});
        } catch (e) {
            return this.handleError(e, res)
        }
    }

    CLASS.prototype.TripStopsChange = async function (req, res) {
        try {
            const { tripId, stops } = req.body;
            const trip = await Trip.getTripById(tripId);
            if (!trip) return res.status(400).json({ success: false, message: 'Trip not found' });
            const TripDriver = await Driver.getDriverWithId(trip.driverId);
            if (!TripDriver) return res.status(400).json({ success: false, message: 'Driver not found' });
            const result = await Trip.updateTripStops(tripId, stops);
            if(trip.startLocation[0] !== stops[0]?.location[0] && trip.startLocation[1] !== stops[0]?.location[1] ){
                await Trip.updateStartLocation(tripId, stops[0]?.location);
            }
            if(trip.endLocation[0] !== stops[stops.length - 1]?.location[0] && trip.endLocation[1] !== stops[stops.length - 1]?.location[1]){
                await Trip.updateEndLocation(tripId, stops[stops.length - 1]?.location);
            }
            sendDriverSocketEvents("stopChangeRequest", trip.driverId, req.socketService, tripId, stops, trip.status).catch(err => {
                console.log(err, "Error sending socket events to driver")
            })
            if (TripDriver?.fcmToken) {
                if(req.useNotPushNotification){
                    await NOTPushNotifiationService.sendPushNotification(
                        TripDriver.fcmToken?.token,
                        sendPickupLocationChangeAlert('pickup'),
                        null,
                        "high",
                        { tripId: String(trip._id), stops: JSON.stringify(stops)}
                    );

                }else{          
                    await PushNotifiationService.sendPushNotification(
                        TripDriver.fcmToken?.token,
                        sendPickupLocationChangeAlert('pickup'),
                        null,
                        "high",
                        { tripId: String(trip._id), stops: JSON.stringify(stops)}
                    );
                }
            }
            return res.status(200).json({ success: true, message: 'Trip stops changed successfully', result });
        } catch (error) {
            return this.handleError(error, res)
        }
    }

    CLASS.prototype.acceptPassengerStopChangeRequest = async function (req, res) {
        try {
            const { tripId, action } = req.body;
            const trip = await Trip.getTripById(tripId);

            const passangerId = trip.passangerId;
            if (!trip) return res.status(400).json({ success: false, message: 'Trip not found' }); 
            const stops =trip.stopChangeRequest.stops
            const passanger = await Passanger.getPassangerWithId(passangerId);
            if (action === 'accept') {
                const result = await Trip.updateTripStops(tripId, trip.stopChangeRequest.stops);
                await Trip.updateTripStopChangesInfo(tripId, action, trip.stopChangeRequest.duration, trip.stopChangeRequest.distance, trip.stopChangeRequest.fare);
                trip.stops = stops;
                trip.estimatedDuration = trip.stopChangeRequest.duration;
                trip.estimatedDistance = trip.stopChangeRequest.distance;    
                trip.estimatedFare = trip.stopChangeRequest.fare;
    
                if(trip.startLocation[0] !== stops[0]?.location[0] && trip.startLocation[1] !== stops[0]?.location[1] ){
                    await Trip.updateStartLocation(tripId, stops[0]?.location);
                }
                if(trip.endLocation[0] !== stops[stops.length - 1]?.location[0] && trip.endLocation[1] !== stops[stops.length - 1]?.location[1]){
                    await Trip.updateEndLocation(tripId, stops[stops.length - 1]?.location);
                }
                if (passanger?.fcmToken) {
                    if(req.useNotPushNotification){
                        await NOTPushNotifiationService.sendPushNotification(
                            passanger.fcmToken?.token,
                            AcceptedLocationChangeAlert('waypoints'),
                            null,
                            "high",
                            { tripId: String(trip._id), action: action }
                        );

                    }else{
                        await PushNotifiationService.sendPushNotification(
                            passanger.fcmToken?.token,
                            AcceptedLocationChangeAlert('waypoints'),
                            null,
                            "high",
                            { tripId: String(trip._id), action: action }
                        );
                    }
                }
                res.status(200).json({ success: true, message: 'Update Stops Accepted By driver', result, trip });
            } else {
                const result = await Trip.updateTripStopChangesInfo(tripId, action);
                if (passanger?.fcmToken) {
                    if(req.useNotPushNotification){ 
                        await NOTPushNotifiationService.sendPushNotification(
                            passanger.fcmToken?.token,
                            RejectedLocationChangeAlert('waypoints'),
                            null,
                            "high",
                            { tripId: String(trip._id), action: action }
                        );
                    }else{  
                        await PushNotifiationService.sendPushNotification(
                            passanger.fcmToken?.token,
                            RejectedLocationChangeAlert('waypoints'),
                            null,
                            "high",
                            { tripId: String(trip._id), action: action }
                        );
                    }
                }
                res.status(200).json({ success: true, message: 'Update Stops Rejected By driver', result, trip });
            }
            sendPassangerSocketEvents("acceptedLocationChangeRequest", passangerId, req.socketService, null, trip, null, action).catch(err => {
                console.log(err, "Error sending socket events to passanger")
            })

           
            
        } catch (error) {
            return this.handleError(error, res)
        }
    }

    CLASS.prototype.passengerStopChangeRequest = async function (req, res) {
        try {
            const { tripId, stops, distance, duration, fare, routeData } = req.body;
            const trip = await Trip.getTripById(tripId);
            if (!trip) return res.status(400).json({ success: false, message: 'Trip not found' });
            const driverId = trip.driverId.toString()
            const TripDriver = await Driver.getDriverWithId(trip.driverId);
            if (!TripDriver) return res.status(400).json({ success: false, message: 'Driver not found' });
          
            const requestdata = {
                stops,
                distance,
                duration,
                fare,
                status: "PENDING",
                routeData
            }
            console.log(requestdata, "Request Data for stop change");   

            const result = await Trip.updateStopsRequest(tripId, requestdata);
            sendDriverSocketEvents("stopChangeRequest", driverId, req.socketService, tripId, requestdata).catch(err => {
                console.log(err, "Error sending socket events to passanger")
            })
            if (TripDriver?.fcmToken) {
                if(req.useNotPushNotification){
                    await NOTPushNotifiationService.sendPushNotification(
                        TripDriver.fcmToken?.token,
                        sendPickupLocationChangeAlert('waypoints'),
                        null,
                        "high",
                        { tripId: String(trip._id), requestdata: JSON.stringify(requestdata)}
                    );

                }else{
                    await PushNotifiationService.sendPushNotification(
                        TripDriver.fcmToken?.token,
                        sendPickupLocationChangeAlert('waypoints'),
                        null,
                        "high",
                        { tripId: String(trip._id), requestdata: JSON.stringify(requestdata)}
                    );
                }
            }
            return res.status(200).json({ success: true, message: 'Trip stops changed successfully', result, requestdata });
        }catch (error) {
            return this.handleError(error, res)
        }
    }

    CLASS.prototype.getpublicRidesTripStatus = async function (req, res) {
        try {
            const { tripId } = req.body;
            const trip = await Trip.getTripById(tripId);
            if (!trip) return res.status(400).json({ success: false, message: 'Trip not found' });
            return res.status(200).json({ success: true, tripStatus: trip.status });
        } catch (error) {
            return this.handleError(error, res)
        }
    }

    CLASS.prototype.updateWaypointsDriverReached = async function (req, res) {
        try {
            const { tripId, isReached, stopNumber } = req.body;
            let driverWaitTime = 0
            let stopUpdated = false
            const trip = await Trip.getTripById(tripId);
            if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
            if (stopNumber < 1 || stopNumber > trip.stops.length) {
                return res.status(400).json({ success: false, message: 'Invalid stop number' });
            }
            const waitingTime = trip.stops[stopNumber]?.waitingTime;
            if (waitingTime === undefined || waitingTime === null || waitingTime <= 0) {
                driverWaitTime = 0;
                stopUpdated = true;
            }
            await Trip.updateReachedForTrip(tripId, isReached, stopNumber, driverWaitTime, stopUpdated);
            if(isReached){
                trip.stops[stopNumber].isReached = true;
                trip.stops[stopNumber].arrivalTime = new Date().getTime();
                trip.stops[stopNumber].driverWaitTime = driverWaitTime;
                trip.stops[stopNumber].stopUpdated = stopUpdated;
            }
            sendPassangerSocketEvents("WaypointsReached", trip.passangerId, req.socketService, null, trip, null).catch(err => {
                console.log(err, "Error sending socket events to passanger")
            })

            return res.status(200).json({ success: true, message: 'Stop Updated', data: trip.stops[stopNumber] });
        } catch (error) {
            return this.handleError(error, res)
        }
    }

    CLASS.prototype.updateWaypointsDriverWaitTime = async function (req, res) {
        try {
            const { tripId, stopNumber, driverWaitTime, stopUpdated } = req.body;
            const trip = await Trip.getTripById(tripId);
            if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
            if (stopNumber < 1 || stopNumber > trip.stops.length) {
                return res.status(400).json({ success: false, message: 'Invalid stop number' });
            }
            await Trip.updateWaitTimeForTrip(tripId, stopNumber, driverWaitTime, stopUpdated);
            if(stopUpdated){
                trip.stops[stopNumber].driverWaitTime = driverWaitTime;
                trip.stops[stopNumber].stopUpdated = stopUpdated;
                trip.stops[stopNumber].driverWaitTime = driverWaitTime;
            }
            sendPassangerSocketEvents("WaypointsReached", trip.passangerId, req.socketService, null, trip, null).catch(err => {
                console.log(err, "Error sending socket events to passanger")
            })
            return res.status(200).json({ success: true, message: `Wait Time of ${driverWaitTime} updated in stop successfully`, data: trip.stops[stopNumber] });
        } catch (error) {
            return this.handleError(error, res)
        }
    }

    CLASS.prototype.alertPassangerPickup = async function (req, res) {
        try {
            const { tripId, driverName } = req.body;
            const trip = await Trip.getTripById(tripId);
            const passangerId = trip?.passangerId?.toString();
            const passanger = await Passanger.getPassangerWithId(passangerId);
            if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
            if (passanger?.fcmToken && trip && trip?.otp) {
                if(req.useNotPushNotification){
                    await NOTPushNotifiationService.sendPushNotification(
                        passanger?.fcmToken?.token,
                        sendAlertPassangerPickupMessagewithOTP(driverName, trip.otp),
                        null,
                        "high",
                        { tripId: String(trip._id) }
                    );

                }else{  
                    await PushNotifiationService.sendPushNotification(
                        passanger?.fcmToken?.token,
                        sendAlertPassangerPickupMessagewithOTP(driverName, trip.otp),
                        null,
                        "high",
                        { tripId: String(trip._id) }
                    );
                }
            }
            return res.status(200).json({ success: true, message: 'Alert Passanger Pickup' });
        } catch (error) {
            return this.handleError(error, res)
        }
    }

    CLASS.prototype.makeMaskedCall = async function (req, res) {
        try {
            const { from, to } = req.body;
            if(!from || !to) return res.status(400).json({ success: false, message: 'From and To are required' });
            const exotel = new Exotel();
            const response = await exotel.makeCall(from, to);
            return res.status(200).json({ success: true, message: 'Masked Call Made', response });      
        } catch (error) {
            return this.handleError(error, res)
        }
    }  
    
    
    CLASS.prototype.acceptUpComingRidePublicRides = async function (req, res) {
        try {
            const driverId = req.driver.id;

            const tripId = req.body?.tripId;
            if (!tripId) return res.status(400).json({ success: false, message: 'Trip ID is required' });

            const driver = await Driver.getDriverWithId(driverId);
            if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });

            const trip = await Trip.getTripById(tripId);
            if (!trip) return res.status(400).json({ success: false, message: 'Trip not found' });

            if (!trip.publicRidesTrip) return res.status(400).json({ success: false, message: 'Trip is not a public rides trip' });
         
            if (trip.status !== RideStatus.MATCHED && trip.driverId === driverId) return res.status(400).json({ success: false, message: 'Trip is already accepted by another driver' });

            const passangerId = trip.passangerId;
            const otp = OTP.generateOTP(OTP_LENGTH);
            /* get Passanger FCM tokens and socketIDS */
            const passanger = await Passanger.getPassangerWithId(passangerId);
            if (!passanger) return res.status(400).json({ success: false, message: 'Passanger not found' });
            await Trip.assignDriverToTrip(tripId, driverId, otp);

            const getMaxDistanceLimit = await FareConfigs.getMaxDistanceLimit(trip?.regionCode || 'default', trip?.vehicleType);
             
            trip.maxDistanceLimit = getMaxDistanceLimit || null;

            // console.log(getMaxDistanceLimit, "Max Distance Limit for the trip");
          
            // await Driver.updateDriver(driverId, { tripStatus: "ONGOING" })
            const driverInfo = {
                driverName: driver.name,
                driverPhone: driver.phone,
                driverRating: driver.rating || null,
                vehicleType: driver.ownVehicleInfo.type,
                vehicleModel: driver.ownVehicleInfo.model,
                vehicleBrand: driver.ownVehicleInfo.make,
                vehicleColor: driver.ownVehicleInfo.color,
                vehicleNumber: driver.ownVehicleInfo.regNo,
                otp: otp,
                upiid: driver.bankDetails.UPIID,
                driverLocaiton: driver.location
            };
   
            if(driver?.documents?.driverPhoto){
                const ImagePath = driver.documents.driverPhoto.replace(/^https:\/\/[^/]+\/?/, '');
                const rjvw = new GeneratePresignedUrl()
                driverInfo.driverPhoto = await rjvw.generatePresignedImg(ImagePath)
            }

            const updateUpComingTripToDriver = await Driver.updateComingTripToDriver(driverId, tripId)
            console.log(updateUpComingTripToDriver)
           
            sendPassangerSocketEvents("upComingTripDriverAllocated", passangerId, req.socketService, driverInfo, trip, otp).catch(err => {
                console.log(err, "Error sending socket events to passanger")
            })

            
            if (passanger?.fcmToken) {
                if(req.useNotPushNotification){
                    await NOTPushNotifiationService.sendPushNotification(passanger.fcmToken.token, sendTripDriverAssignedMessage(driver.name), null, "high", { tripId: String(trip._id) });

                }else{  
                    await PushNotifiationService.sendPushNotification(passanger.fcmToken.token, sendTripDriverAssignedMessage(driver.name), null, "high", { tripId: String(trip._id) });
                }
            }

            trip.maxDistanceLimit = getMaxDistanceLimit || null;

            return res.status(200).json({ success: true, message: 'Trip accepted successfully', currentTrip: trip });
        } catch (err) {
            return this.handleError(err, res)
        }
    }

    CLASS.prototype.startUpComingRidePublicRides = async function (req, res) {
        try {
            const driverId = req.driver.id;

            const tripId = req.body?.tripId;
            if (!tripId) return res.status(400).json({ success: false, message: 'Trip ID is required' });

            const driver = await Driver.getDriverWithId(driverId);
            if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });

            const trip = await Trip.getTripById(tripId);
            if (!trip) return res.status(400).json({ success: false, message: 'Trip not found' });

            if (!trip.publicRidesTrip) return res.status(400).json({ success: false, message: 'Trip is not a public rides trip' });
         
            if (trip.status !== RideStatus.MATCHED && trip.driverId === driverId) return res.status(400).json({ success: false, message: 'Trip is already accepted by another driver' });

            const passangerId = trip.passangerId;
            const otp = OTP.generateOTP(OTP_LENGTH);
            /* get Passanger FCM tokens and socketIDS */
            const passanger = await Passanger.getPassangerWithId(passangerId);
            if (!passanger) return res.status(400).json({ success: false, message: 'Passanger not found' });
            await Trip.assignDriverToTrip(tripId, driverId, otp);

            const getMaxDistanceLimit = await FareConfigs.getMaxDistanceLimit(trip?.regionCode || 'default', trip?.vehicleType);
             
            trip.maxDistanceLimit = getMaxDistanceLimit || null;

            // console.log(getMaxDistanceLimit, "Max Distance Limit for the trip");
          
            // await Driver.updateDriver(driverId, { tripStatus: "ONGOING" })
            const driverInfo = {
                driverName: driver.name,
                driverPhone: driver.phone,
                driverRating: driver.rating || null,
                vehicleType: driver.ownVehicleInfo.type,
                vehicleModel: driver.ownVehicleInfo.model,
                vehicleBrand: driver.ownVehicleInfo.make,
                vehicleColor: driver.ownVehicleInfo.color,
                vehicleNumber: driver.ownVehicleInfo.regNo,
                otp: otp,
                upiid: driver.bankDetails.UPIID,
                driverLocaiton: driver.location
            };
   
            if(driver?.documents?.driverPhoto){
                const ImagePath = driver.documents.driverPhoto.replace(/^https:\/\/[^/]+\/?/, '');
                const rjvw = new GeneratePresignedUrl()
                driverInfo.driverPhoto = await rjvw.generatePresignedImg(ImagePath)
            }

            const updateUpComingTripToDriver = await Driver.updateCurrentTripId(driverId, tripId)
            console.log(updateUpComingTripToDriver)
           
            sendPassangerSocketEvents("upComingTripStarted", passangerId, req.socketService, driverInfo, trip, otp).catch(err => {
                console.log(err, "Error sending socket events to passanger")
            })

            
            if (passanger?.fcmToken) {
                if(req.useNotPushNotification){
                    await NOTPushNotifiationService.sendPushNotification(passanger.fcmToken.token, sendTripDriverAssignedMessage(driver.name), null, "high", { tripId: String(trip._id) });

                }else{
                    await PushNotifiationService.sendPushNotification(passanger.fcmToken.token, sendTripDriverAssignedMessage(driver.name), null, "high", { tripId: String(trip._id) });
                }
            }

            trip.maxDistanceLimit = getMaxDistanceLimit || null;

            return res.status(200).json({ success: true, message: 'Trip accepted successfully', currentTrip: trip });
        } catch (err) {
            return this.handleError(err, res)
        }
    }

    CLASS.prototype.cancelUpComingTrip = async function (req, res) {
        try {
            const {tripId, reason} = req.body

            const trip =await Trip.getTripById(tripId)
            const TripPassenger = await Passanger.getPassangerWithId(trip.passangerId);
            const TripDriver = await Driver.getDriverWithId(trip.driverId);

            await Driver.updateDriver(TripDriver, { tripStatus: "NOTRIP", isAvailable: true });
            await Trip.cancelTrip(tripId, reason)
            sendPassangerSocketEvents(
                "tripCancelledByDriver",
                String(TripPassenger._id),
                req.socketService,
                null,
                trip,
                null
            ).catch(err => console.error("Error sending socket to passenger", err));
            if (TripPassenger?.fcmToken) {
                if(req.useNotPushNotification){
                    await NOTPushNotifiationService.sendPushNotification(
                        TripPassenger.fcmToken?.token,
                        sendTripCancelledByDriverMessage(TripDriver.name),
                        null,
                        "high",
                        { tripId: String(trip._id) }
                    );

                }else{
                    await PushNotifiationService.sendPushNotification(
                        TripPassenger.fcmToken?.token,
                        sendTripCancelledByDriverMessage(TripDriver.name),
                        null,
                        "high",
                        { tripId: String(trip._id) }
                    );
                }
            }   
            return res.json({ success: true, message: "Trip Cancelled Successfully", isOnGoingTrip: false });
        }catch (err) {
            return this.handleError(err, res)
        }
    }

    /**
     * POST /publicrides/driver/v2/uploadTripMedia
     * Uploads before/after vehicle photos and bill receipt images for an
     * acting-driver trip.  Stores URLs on the trip document under:
     *
     *   trip.bills = {
     *     preTripVehiclePhotos:  { front, rear, leftSide, rightSide },
     *     postTripVehiclePhotos: { front, rear, leftSide, rightSide },
     *     bills: [{ description, amount, receiptPhoto }]
     *   }
     *
     * Body (multipart/form-data):
     *   tripId          – required
     *   phase           – 'pre' | 'post'
     *   bills           – JSON string  (post phase only)
     *   preFront, preRear, preLeftSide, preRightSide   (pre phase)
     *   postFront, postRear, postLeftSide, postRightSide (post phase)
     *   bill_receipt_<idx>   – receipt image for bill[idx] (post phase, optional)
     */
    CLASS.prototype.uploadTripMedia = async function (req, res) {
        const storage = multer.memoryStorage();
        // multer.any() accepts all field names — supports unlimited bill receipts
        const mediaUpload = multer({ storage }).any();

        mediaUpload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: 'File parse error', error: err.message });
            }
            try {
                const { tripId: rawTripId, phase, bills: billsJson } = req.body || {};
                const tripId = typeof rawTripId === 'string' ? rawTripId.trim() : rawTripId;

                if (!tripId) return res.status(400).json({ success: false, message: 'tripId is required' });
                if (!/^[a-f\d]{24}$/i.test(tripId)) return res.status(400).json({ success: false, message: 'tripId is not a valid ObjectId' });
                if (!phase || !['pre', 'post', 'bills'].includes(phase)) {
                    return res.status(400).json({ success: false, message: "phase must be 'pre', 'post', or 'bills'" });
                }

                const trip = await Trip.getTripById(tripId);
                if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

                // multer.any() puts files in req.files as a flat array
                const filesArray = req.files || [];
                const fileMap = {};
                filesArray.forEach(f => { fileMap[f.fieldname] = f; });

                // ── helper: upload one file to S3 ──────────────────────────
                const uploadFile = async (fieldName, s3Key) => {
                    const file = fileMap[fieldName];
                    if (!file) return null;
                    const result = await e2eS3File('upload', file, s3Key, `trips/${tripId}/media/`);
                    return result?.completed ? result.url : null;
                };

                // Read existing bills object (may already have data from the other phase)
                const existingBills = trip.bills || {};
                const setPayload = {};

                if (phase === 'pre') {
                    const front     = await uploadFile('preFront',     `${tripId}_preFront`);
                    const rear      = await uploadFile('preRear',      `${tripId}_preRear`);
                    const leftSide  = await uploadFile('preLeftSide',  `${tripId}_preLeftSide`);
                    const rightSide = await uploadFile('preRightSide', `${tripId}_preRightSide`);

                    const photos = {
                        front:     front     || existingBills.preTripVehiclePhotos?.front     || '',
                        rear:      rear      || existingBills.preTripVehiclePhotos?.rear      || '',
                        leftSide:  leftSide  || existingBills.preTripVehiclePhotos?.leftSide  || '',
                        rightSide: rightSide || existingBills.preTripVehiclePhotos?.rightSide || '',
                    };

                    if (!front && !rear && !leftSide && !rightSide) {
                        return res.status(400).json({ success: false, message: 'No pre-trip photos provided' });
                    }

                    setPayload['bills.preTripVehiclePhotos'] = photos;
                    await Trip.updateTripMediaData(tripId, setPayload);

                } else if (phase === 'post') {
                    // ── post-trip photos ───────────────────────────────────
                    const front     = await uploadFile('postFront',     `${tripId}_postFront`);
                    const rear      = await uploadFile('postRear',      `${tripId}_postRear`);
                    const leftSide  = await uploadFile('postLeftSide',  `${tripId}_postLeftSide`);
                    const rightSide = await uploadFile('postRightSide', `${tripId}_postRightSide`);

                    if (!front && !rear && !leftSide && !rightSide) {
                        return res.status(400).json({ success: false, message: 'No post-trip photos provided' });
                    }

                    setPayload['bills.postTripVehiclePhotos'] = {
                        front:     front     || existingBills.postTripVehiclePhotos?.front     || '',
                        rear:      rear      || existingBills.postTripVehiclePhotos?.rear      || '',
                        leftSide:  leftSide  || existingBills.postTripVehiclePhotos?.leftSide  || '',
                        rightSide: rightSide || existingBills.postTripVehiclePhotos?.rightSide || '',
                    };

                    // ── bills array with optional receipt photos ───────────
                    if (billsJson) {
                        let parsedBills;
                        try { parsedBills = JSON.parse(billsJson); } catch (_) {
                            return res.status(400).json({ success: false, message: 'bills must be valid JSON' });
                        }

                        const billsWithPhotos = await Promise.all(
                            parsedBills.map(async (bill, idx) => {
                                const receiptPhoto = await uploadFile(
                                    `bill_receipt_${idx}`,
                                    `${tripId}_bill_receipt_${idx}`
                                );
                                return {
                                    billId:       uuidv4(),
                                    description:  bill.description  || '',
                                    amount:       parseFloat(bill.amount) || 0,
                                    receiptPhoto: receiptPhoto || '',
                                    approval:     'pending',
                                };
                            })
                        );

                        setPayload['bills.bills'] = billsWithPhotos;
                    }

                    await Trip.updateTripMediaData(tripId, setPayload);
                }

                // ── bills-only phase ──────────────────────────────────
                if (phase === 'bills') {
                    if (!billsJson) {
                        return res.status(400).json({ success: false, message: 'bills JSON is required for bills phase' });
                    }
                    let parsedBills;
                    try { parsedBills = JSON.parse(billsJson); } catch (_) {
                        return res.status(400).json({ success: false, message: 'bills must be valid JSON' });
                    }

                    // Build bill objects with unique billId, upload receipts
                    const billsWithPhotos = await Promise.all(
                        parsedBills.map(async (bill, idx) => {
                            const receiptPhoto = await uploadFile(
                                `bill_receipt_${idx}`,
                                `${tripId}_bill_receipt_${idx}_${Date.now()}`
                            );
                            return {
                                billId:       uuidv4(),
                                description:  bill.description  || '',
                                amount:       parseFloat(bill.amount) || 0,
                                receiptPhoto: receiptPhoto || '',
                                approval:     'pending',
                            };
                        })
                    );

                    // Push each bill individually (preserves existing bills)
                    await Promise.all(billsWithPhotos.map(b => Trip.pushBillToTrip(tripId, b)));

                    // Notify passenger
                    const billCount = billsWithPhotos.length;
                    const billTotal = billsWithPhotos
                        .reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0)
                        .toFixed(2);

                    const passangerId = trip.passangerId?.toString();
                    const passanger = await Passanger.getPassangerWithId(passangerId);
                    trip.bills = { ...existingBills, bills: [...(existingBills.bills || []), ...billsWithPhotos] };

                    sendPassangerSocketEvents(
                        'newBillRequest',
                        passangerId,
                        req.socketService,
                        null,
                        trip,
                        null
                    ).catch(err => console.error('Error sending newBillRequest socket:', err));

                    if (passanger?.fcmToken?.token) {
                        const msg = sendNewBillRequestMessage(billCount, billTotal);
                        if (req.useNotPushNotification) {
                            NOTPushNotifiationService.sendPushNotification(
                                passanger.fcmToken.token, msg, null, 'high',
                                { tripId: String(trip._id) }
                            );
                        } else {
                            PushNotifiationService.sendPushNotification(
                                passanger.fcmToken.token, msg, null, 'high',
                                { tripId: String(trip._id) }
                            );
                        }
                    }

                    // Return billId(s) so client can store them for deletion
                    const returnedBills = billsWithPhotos.map(b => ({ billId: b.billId, description: b.description, amount: b.amount }));
                    return res.json({ success: true, message: 'Bills uploaded successfully', bills: returnedBills });
                }

                // Notify passenger when driver uploads bills (post phase only)
                if (phase === 'post' && setPayload['bills.bills']?.length > 0) {
                    const uploadedBills = setPayload['bills.bills'];
                    const billCount = uploadedBills.length;
                    const billTotal = uploadedBills
                        .reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0)
                        .toFixed(2);

                    const passangerId = trip.passangerId?.toString();
                    const passanger = await Passanger.getPassangerWithId(passangerId);

                    // Attach bills to trip object for socket payload
                    trip.bills = { ...existingBills, bills: uploadedBills };

                    sendPassangerSocketEvents(
                        'newBillRequest',
                        passangerId,
                        req.socketService,
                        null,
                        trip,
                        null
                    ).catch(err => console.error('Error sending newBillRequest socket:', err));

                    if (passanger?.fcmToken?.token) {
                        const msg = sendNewBillRequestMessage(billCount, billTotal);
                        if (req.useNotPushNotification) {
                            NOTPushNotifiationService.sendPushNotification(
                                passanger.fcmToken.token,
                                msg,
                                null,
                                'high',
                                { tripId: String(trip._id) }
                            );
                        } else {
                            PushNotifiationService.sendPushNotification(
                                passanger.fcmToken.token,
                                msg,
                                null,
                                'high',
                                { tripId: String(trip._id) }
                            );
                        }
                    }
                }

                return res.json({ success: true, message: `Trip ${phase}-trip media uploaded successfully` });

            } catch (err) {
                return this.handleError(err, res);
            }
        });
    }

    CLASS.prototype.deleteTripBill = async function (req, res) {
        try {
            const { tripId: rawTripId, billId, billIndex } = req.body || {};
            const tripId = typeof rawTripId === 'string' ? rawTripId.trim() : rawTripId;

            if (!tripId) return res.status(400).json({ success: false, message: 'tripId is required' });
            if (!/^[a-f\d]{24}$/i.test(tripId)) return res.status(400).json({ success: false, message: 'tripId is not a valid ObjectId' });
            if (!billId && billIndex === undefined) return res.status(400).json({ success: false, message: 'billId or billIndex is required' });

            const trip = await Trip.getTripById(tripId);
            if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

            // Resolve the bill — by billId or by index
            const allBills = trip.bills?.bills || [];
            let bill;
            let resolvedIndex;
            if (billId) {
                resolvedIndex = allBills.findIndex(b => b.billId === billId);
                bill = resolvedIndex !== -1 ? allBills[resolvedIndex] : null;
            } else {
                resolvedIndex = parseInt(billIndex, 10);
                bill = (!isNaN(resolvedIndex) && resolvedIndex >= 0 && resolvedIndex < allBills.length)
                    ? allBills[resolvedIndex]
                    : null;
            }

            if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

            // Delete receipt from S3 if it exists
            if (bill?.receiptPhoto) {
                try {
                    const receiptUrl = bill.receiptPhoto;
                    const keyMatch = receiptUrl.match(/^https?:\/\/[^/]+\/(.+)$/);
                    if (keyMatch?.[1]) {
                        await e2eS3File('deleteByKey', null, null, keyMatch[1]);
                    }
                } catch (s3Err) {
                    console.error('Failed to delete receipt from S3:', s3Err);
                }
            }

            if (billId) {
                await Trip.removeBillFromTrip(tripId, billId);
            } else {
                await Trip.removeBillFromTripByIndex(tripId, resolvedIndex);
            }

            // Emit socket update to passenger with the refreshed bills
            const updatedTrip = await Trip.getTripById(tripId);
            if (updatedTrip?.passangerId) {
                sendPassangerSocketEvents('newBillRequest', String(updatedTrip.passangerId), req.socketService, null, updatedTrip).catch(err => {
                    console.error('Error emitting bill-delete socket to passenger:', err);
                });
            }

            return res.json({ success: true, message: 'Bill deleted successfully' });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    /**
     * POST /publicrides/driver/v2/editTripBill
     * Body (multipart/form-data):
     *   tripId       – required
     *   billId       – preferred identifier (or billIndex)
     *   billIndex    – fallback identifier
     *   description  – new description
     *   amount       – new amount
     *   bill_receipt – optional new receipt image file
     *   removeReceipt – 'true' to delete existing receipt without replacing
     */
    CLASS.prototype.editTripBill = async function (req, res) {
        const storage = multer.memoryStorage();
        const mediaUpload = multer({ storage }).any();

        mediaUpload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: 'File parse error', error: err.message });
            }
            try {
                const { tripId: rawTripId, billId, billIndex, description, amount, removeReceipt } = req.body || {};
                const tripId = typeof rawTripId === 'string' ? rawTripId.trim() : rawTripId;

                if (!tripId) return res.status(400).json({ success: false, message: 'tripId is required' });
                if (!/^[a-f\d]{24}$/i.test(tripId)) return res.status(400).json({ success: false, message: 'tripId is not a valid ObjectId' });
                if (!billId && billIndex === undefined) return res.status(400).json({ success: false, message: 'billId or billIndex is required' });

                const trip = await Trip.getTripById(tripId);
                if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

                const allBills = trip.bills?.bills || [];
                let resolvedIndex;
                let bill;
                if (billId) {
                    resolvedIndex = allBills.findIndex(b => b.billId === billId);
                    bill = resolvedIndex !== -1 ? allBills[resolvedIndex] : null;
                } else {
                    resolvedIndex = parseInt(billIndex, 10);
                    bill = (!isNaN(resolvedIndex) && resolvedIndex >= 0 && resolvedIndex < allBills.length)
                        ? allBills[resolvedIndex]
                        : null;
                }

                if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
                if (bill.approval === 'approved') {
                    return res.status(400).json({ success: false, message: 'Approved bills cannot be edited' });
                }

                // Build update fields — always reset approval to pending on edit
                const updateFields = { approval: 'pending' };
                if (description?.trim()) updateFields.description = description.trim();
                if (amount !== undefined && amount !== '') {
                    const parsed = parseFloat(amount);
                    if (isNaN(parsed) || parsed <= 0) {
                        return res.status(400).json({ success: false, message: 'amount must be a positive number' });
                    }
                    updateFields.amount = parsed;
                }

                // Handle receipt
                const filesArray = req.files || [];
                const fileMap = {};
                filesArray.forEach(f => { fileMap[f.fieldname] = f; });

                const uploadFile = async (fieldName, s3Key) => {
                    const file = fileMap[fieldName];
                    if (!file) return null;
                    const result = await e2eS3File('upload', file, s3Key, `trips/${tripId}/media/`);
                    return result?.completed ? result.url : null;
                };

                if (fileMap['bill_receipt']) {
                    // Delete old receipt from S3 if it exists
                    if (bill.receiptPhoto) {
                        try {
                            const keyMatch = bill.receiptPhoto.match(/^https?:\/\/[^/]+\/(.+)$/);
                            if (keyMatch?.[1]) await e2eS3File('deleteByKey', null, null, keyMatch[1]);
                        } catch (s3Err) {
                            console.error('Failed to delete old receipt from S3:', s3Err);
                        }
                    }
                    const newReceiptUrl = await uploadFile('bill_receipt', `${tripId}_bill_receipt_${resolvedIndex}_${Date.now()}`);
                    if (newReceiptUrl) updateFields.receiptPhoto = newReceiptUrl;
                } else if (removeReceipt === 'true' || removeReceipt === true) {
                    if (bill.receiptPhoto) {
                        try {
                            const keyMatch = bill.receiptPhoto.match(/^https?:\/\/[^/]+\/(.+)$/);
                            if (keyMatch?.[1]) await e2eS3File('deleteByKey', null, null, keyMatch[1]);
                        } catch (s3Err) {
                            console.error('Failed to delete receipt from S3:', s3Err);
                        }
                    }
                    updateFields.receiptPhoto = '';
                }

                await Trip.updateBillByIndex(tripId, resolvedIndex, updateFields);

                // Emit updated bill list to passenger via socket
                const updatedTrip = await Trip.getTripById(tripId);
                if (updatedTrip?.passangerId) {
                    sendPassangerSocketEvents('newBillRequest', String(updatedTrip.passangerId), req.socketService, null, updatedTrip).catch(err => {
                        console.error('editTripBill socket error:', err);
                    });
                }

                const updatedBill = updatedTrip?.bills?.bills?.[resolvedIndex];
                return res.json({ success: true, message: 'Bill updated', bill: updatedBill });
            } catch (err) {
                return this.handleError(err, res);
            }
        });
    }
}