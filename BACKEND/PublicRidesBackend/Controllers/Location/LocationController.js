const { ObjectId } = require('mongodb');
const { locationSchema, externalGpsLocationSchema } = require('../../Schemas/Locationschema')
const PushNotifiationService = require('../../Services/PushNotification/PushNotifiationService');
const { getActivityCompletedMessage, getOverSpeedMessage, parkingModeAlert } = require("../../Services/PushNotification/Messages");


const { getUsersWhoHaveAccessToDevice, getUserWhoHaveAccessToTrip } = require('../../Services/WebsocketUtilities');
const Device = require('../../Models/Device');
const Session = require('../../Models/Session');
const LiveLocation = require('../../Models/LiveLocation');
const Controller = require('../Controller');
const LocationControllerTrip = require('./LocationControllerTrip');
const Redis = require('../DB/Redis');
const countriesAndTimezones = require('countries-and-timezones');

class LocationController extends Controller{

    constructor(){
        super()
        this.addTripLocationDriver = this.addTripLocationDriver.bind(this)
      
    }
    validate = async (data) => {
            try {
                const value = await locationSchema.validateAsync(data);
                return [value, { success: true }];
            } catch (error) {
                return [null, { error: error.details[0].message, success: false }];
            }
        }
    
        // Validates the incoming data against the external location schema
        validateExternalGpsLocationSchema = async (data) => {
            try {
                const value = await externalGpsLocationSchema.validateAsync(data);
                return [value, { success: true }];
            } catch (error) {
                return [null, { error: error.details[0].message, success: false }];
            }
        }
    
        /**
         * @api {post} /location Add Location
         * @apiName AddLocation
         * @apiGroup Location
         * @apiVersion 1.0.0
         * @apiDescription Adds a single location or multiple locations to the database.
         * 
         * @apiParam {Object[]} locations Array of location objects.
         * @apiParam {String} id User ID.
         * @apiParam {String} [sessionId] Session ID, if adding locations to an existing session.
         * @apiParam {String} sessionName Name of the session.
         * @apiParam {Boolean} completed Indicates if the session is completed.
         * @apiParam {String} deviceType Type of the device.
         * @apiParam {String} deviceName Name of the device.
         * 
         * @apiSuccess {Boolean} success Indicates if the operation was successful.
         * @apiSuccess {String} message Success message.
         * @apiSuccess {Object[]} details Additional details.
         * 
         * @apiError (Error 400) {Boolean} success Indicates failure of the operation.
         * @apiError (Error 400) {String} message Error message.
         * @apiError (Error 400) {Object[]} details Additional details.
         */
        addLocation = async (req, res) => {
            // Validate the request data
            const [payload, errRes] = await this.validate(req.body);
            if (!payload) return res.status(400).json(errRes);
    
            const userId = req.user.id;
            const deviceId = req.device.id;
    
            // if (payload.id !== deviceId) return res.status(401).json({ success: false, message: 'UnAuthorized' });
            if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });
            // return res.status(200).json({ success: true, message: 'Locations added', details: [] });
    
            try {
                const device = await Device.getDevice(userId, deviceId);
                if (!device) return res.status(400).json({ success: false, message: 'Device ID Should Be Valid' });
    
                const geofences = device.geofences
                const groupGeofences = device.groupGeofences
                const combinedGeofenceIds = geofences.concat(groupGeofences)
    
                // Convert each element in the array to a new ObjectId
                const combinedGeofenceObjectIds = combinedGeofenceIds.map(hexString => new ObjectId(hexString));
                // Prepare session data from the payload
                const sessionData = {
                    id: payload.id,
                    sessionId: payload.sessionId,
                    sessionName: payload.sessionName,
                    startTime: new Date(),
                    deviceType: payload.deviceType,
                    deviceName: device.name,
                    status: payload.completed ? 'completed' : 'live',
                    sessionType: "REAL"
                }
                /*
                    Creating a temp Unique id for the device with datestring
                    Later the Rust cronjob will process this on the next day
                */
                if (!payload.sessionId) {
                    const currentDate = new Date().toISOString().split('T')[0];
                    const dateString = currentDate.split('-').reverse().join('/');
                    const sessionId = dateString + '|' + (device.imei);
                    payload.sessionId = sessionId
                    sessionData.sessionId = sessionId;
                    sessionData.sessionType = "TEMP"
                }
    
                // Prepare Device last location details to update
                const deviceLastCoordinate = payload.locations[payload.locations.length - 1]
                const lastCoordinateDetails = {
                    type: "Point",
                    coordinates: deviceLastCoordinate.location
                }
                const deviceLastLocationDetail = {
                    location: lastCoordinateDetails,
                    liveStats: {
                        battery: deviceLastCoordinate.battery,
                        speed: deviceLastCoordinate.speed,
                        lastLocationUpdatedOn: new Date(deviceLastCoordinate.time).getTime(),
                        course: deviceLastCoordinate.heading,
                        activity: deviceLastCoordinate.activity,
                    },
                    status: "online",
                }
    
                //TODO -> find the first point which is change in activity and set it as activityStartTime
                if (!device.liveStats?.activityStartTime) {
                    deviceLastLocationDetail.liveStats.activityStartTime = deviceLastLocationDetail.liveStats.lastLocationUpdatedOn
                }
                // Copy over existing activityStartTime if activity hasn't changed
                if (device.liveStats?.activity === deviceLastCoordinate.activity) {
                    deviceLastLocationDetail.liveStats.activityStartTime = device?.liveStats?.activityStartTime || deviceLastLocationDetail?.liveStats?.lastLocationUpdatedOn
                }
                // Reset activityStartTime if activity has changed
                if (device.liveStats?.activity !== deviceLastCoordinate.activity) {
                    deviceLastLocationDetail.liveStats.activityStartTime = deviceLastLocationDetail.liveStats.lastLocationUpdatedOn
                }
    
                const speedinKm = deviceLastCoordinate.speed * 1.852
                const isOVerSpeeding = speedinKm > 40
                const parkingMode = speedinKm > 5
    
                if (isOVerSpeeding) {
                    deviceLastLocationDetail.liveStats.lastSpeedAlertTime = new Date().getTime()
                }
    
                if (parkingMode && device?.liveStats?.parkingMode === 'on') {
                    deviceLastLocationDetail.liveStats.lastParkingModeAlertTime = new Date().getTime()
                }
    
                let existingSession = undefined
                if (payload.sessionId) {
                    existingSession = await Session.checkSessionExists(payload.sessionId);
                    if (existingSession && existingSession.status === 'completed') {
                        return res.status(400).json({ success: false, message: 'Session already completed', details: [] });
                    }
                }
                /*
                    Not adding await as its not required to await for this function to respond
    
                */
                /* No need of sending notification to the owner he will receive local notifications */
                const imei = device.imei
                this.getValidSocketIds(device, false, [imei])
                    .then((data) => {
                        const { validSocketIds, validFcmTokens } = data
                        this.#emitSocketLocation(
                            device,
                            { location: lastCoordinateDetails, liveStats: deviceLastLocationDetail.liveStats },
                            req.socketService,
                            validSocketIds
                        )
    
                        /*
                            Check for device overspeeding and send notification
                        */
                        /* convert speed from knots to km/h */
    
                        if (isOVerSpeeding) {
                            if (device.liveStats?.lastSpeedAlertTime && (new Date().getTime() - device.liveStats.lastSpeedAlertTime) < 1000 * 60 * 15) return
                            const message = getOverSpeedMessage(device)
                            validFcmTokens.forEach(fcmToken => {
                                PushNotifiationService.sendPushNotification(fcmToken, message, device._id.toString(), "high")
                            })
                        }
    
                        if (parkingMode && device?.liveStats?.parkingMode === 'on') { // "on" "off"                       
                            if (device.liveStats?.lastParkingModeAlertTime && (new Date().getTime() - device.liveStats?.lastParkingModeAlertTime) < 1000 * 60 * 15) return
                            const message = parkingModeAlert(device);
                            validFcmTokens.forEach(fcmToken =>
                                PushNotifiationService.sendPushNotification(fcmToken, message, device._id.toString(), "high")
                            );
                            
                        }
    
                        /*
                            Start Worker thread to do geofence analysis
                        */
                        if (combinedGeofenceObjectIds.length > 0) {
                            this.runGeoFenceAnalysis(combinedGeofenceObjectIds, payload.locations, device, req.socketService, validSocketIds, validFcmTokens)
                        }
    
                        /*
                            Send notification if activity has changed
                        */
                        if (device.liveStats?.activity && device.liveStats.activity !== deviceLastCoordinate.activity) {
                            /* Previous Activity ended here */
                            /* trigger notification to users who have access to this device */
    
                            if (device.liveStats?.activity !== "IN_VEHICLE") return console.log("Activity is not IN_VEHICLE")
                            const startTime = device.liveStats?.activityStartTime
                            const endTime = deviceLastLocationDetail.liveStats.lastLocationUpdatedOn
                            const currentTime = new Date().getTime()
    
                            /* If the event happends within an hour, send notification */
                            if ((currentTime - endTime) < 1000 * 60 * 60) {
                                if ((endTime - startTime) > 1000 * 60 * 15) {
                                    /* send notification */
                                    const message = getActivityCompletedMessage(device.name, device.liveStats.activity)
                                    validFcmTokens.forEach(fcmToken => {
                                        const params = {
                                            startTime: String(startTime),
                                            endTime: String(endTime)
                                        }
                                        console.log("Sending activity completed notification to ", fcmToken)
                                        PushNotifiationService.sendPushNotification(fcmToken, message, device._id.toString(), "high", params)
                                    })
                                } else {
                                    console.log("less than 5 mins ", endTime - startTime)
                                }
                            } else {
                                console.log("Event is not within an hour skipping notification")
                            }
    
                        }
                    }
                    )
                    .catch(err => {
                        console.error('Error getting valid socket IDs:', err)
                    })
    
                /*
                    Check if any viewer is waiting for this device to send realtime location through sockets
                */
    
                const fastSocketCacheId = 'FMT:' + device.imei.toString()
                const fastSocketIds = await Redis.getData(fastSocketCacheId)
                let hasToConnectFastSocket = false
                
                if(fastSocketIds){
                    const values = fastSocketIds.split(',')
                    const userIds = values.map(v => v.split('|')[1])
                    if(userIds.length > 0){
                        hasToConnectFastSocket = true
                    }
                }
    
                // If session exists, add location to that session
                if (existingSession) {
                    await LiveLocation.addLocations(payload.locations, payload.sessionId, payload.id);
                    await Device.updateLiveStatsAndLocation(deviceId, deviceLastLocationDetail.location, deviceLastLocationDetail.liveStats);
                    if (payload.completed) {
                        sessionData.endTime = new Date(payload.locations[payload.locations.length - 1].time);
                        await Session.updateStatus(payload.sessionId, 'completed', sessionData.endTime)
                    }
                    return res.status(200).json({ success: true, message: 'Locations added', details: [], hasToConnectFastSocket });
                }
    
                // If session does not exist, create a new session and add locations
                // Get the startTime from the first location
                const startTime = new Date(payload.locations[0].time);
                sessionData.startTime = startTime;
                if (payload.completed) {
                    sessionData.endTime = new Date(payload.locations[payload.locations.length - 1].time);
                }
                await Session.createSession(sessionData)
                await LiveLocation.addLocations(payload.locations, payload.sessionId, payload.id);
                await Device.updateLiveStatsAndLocation(deviceId, deviceLastLocationDetail.location, deviceLastLocationDetail.liveStats);
                return res.status(200).json({ success: true, message: 'Locations added', details: [], hasToConnectFastSocket });
    
            } catch (err) {
                console.error(err);
                this.handleError(err, res);
            }
        }
    
        addExternalGpsLocation = async (req, res) => {
            // Validate the request data
            const [payload, errRes] = await this.validateExternalGpsLocationSchema(req.body);
            if (!payload) return res.status(400).json(errRes);
    
            // let endTime;
            const userId = req.user.id;
            if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });
    
            try {
                const { externalGpsDevices } = payload;
    
                // Prepare session data from the payload
                const sessionPromises = externalGpsDevices.data.map(async zone => {
                    const gpsDevicePromises = zone.locations.map(async gpsDevice => {
    
                        const sessionData = {
                            id: gpsDevice.imei,
                            sessionId: payload.sessionId,
                            sessionName: payload.sessionName,
                            startTime: new Date(),
                            deviceType: "externalGpsDevice",
                            deviceName: gpsDevice.vehiclename,
                            status: payload.completed ? 'completed' : 'live',
                            sessionType: "REAL"
                        }
                        /*
                            Creating a temp Unique id for the device with datestring
                            Later the Rust cronjob will process this on the next day
                        */
    
                        if (!payload.sessionId) {
                            const currentDate = new Date().toISOString().split('T')[0];
                            const dateString = currentDate.split('-').reverse().join('/');
                            const sessionId = dateString + '|' + (gpsDevice.imei);
                            // payload.sessionId = sessionId
                            sessionData.sessionId = sessionId;
                            sessionData.sessionName = `${zone.zid}_${gpsDevice.vehiclename}`;
                            sessionData.sessionType = "TEMP"
                        }
    
                        let existingSession = undefined
                        if (sessionData.sessionId) {
                            existingSession = await Session.checkSessionExists(sessionData.sessionId);
                            if (existingSession && existingSession.status === 'completed') {
                                return res.status(400).json({ success: false, message: 'Session already completed', details: [] });
                            }
                        }
    
                        // If session exists, add location to that session
                        if (existingSession) {
                            await LiveLocation.addExternalGpsLocations(gpsDevice.location, sessionData.sessionId, gpsDevice.imei);
                            if (payload.completed && !payload.sessionId) {
                                sessionData.endTime = new Date((gpsDevice.location[gpsDevice.location.length - 1].ts) * 1000);
                                await Session.updateStatus(sessionData.sessionId, 'completed', sessionData.endTime)
                            }
                            return;
                        }
    
                        // If session does not exist, create a new session and add locations
                        // Get the startTime from the first location
                        const startTime = new Date(gpsDevice.location[0].ts * 1000);
                        sessionData.startTime = startTime;
                        if (payload.completed && !payload.sessionId) {
                            sessionData.endTime = new Date((gpsDevice.location[gpsDevice.location.length - 1].ts) * 1000);
                        }
    
                        await Session.createSession(sessionData)
                        await LiveLocation.addExternalGpsLocations(gpsDevice.location, sessionData.sessionId, gpsDevice.imei);
                        // to calculate end time of the session
                        // endTime = new Date((gpsDevice.location[gpsDevice.location.length - 1].ts) * 1000);
                    });
    
                    return Promise.all(gpsDevicePromises);
                });
                // if (payload.completed && payload.sessionId) {
                //     await Session.updateStatus(payload.sessionId, 'completed', endTime)
                // }
                await Promise.all(sessionPromises);
                return res.status(200).json({ success: true, message: 'Locations added', details: [] });
    
            } catch (err) {
                console.error(err);
                this.handleError(err, res);
            }
        }
    
        
    
        #emitSocketLocation = async (device, data, socketService, validSocketIds) => {
            /*
                Find users who have access to this deviceId
                C
            */
            try {
                socketService.locationHandler.emitDeviceLocationUpdate(validSocketIds, { deviceId: device._id.toString(), data })
            } catch (err) {
                console.log(err)
            }
        }
    
       
        getValidSocketIds = async (device, isOwnerOnly = false, excludeImeis = []) => {
    
            /*
                Find users who have access to this deviceId
                C
            */
            try {
                const { validSocketIds, validFcmTokens } = await getUsersWhoHaveAccessToDevice(null, device, isOwnerOnly, [], [], excludeImeis)
                return { validSocketIds, validFcmTokens }
            } catch (err) {
                console.log(err)
                return false
            }
        }
    
        getValidSocketIdsForTrip = async (socketService, tripId, lastCoordinateDetails, driverLastLocationDetail) => {
            return this._getValidSocketIdsForTrip(tripId)
                .then((data) => {
                    const { validSocketIds, validFcmTokens } = data
                    this.#emitDriverSocketLocation(
                        tripId,
                        { location: lastCoordinateDetails, liveStats: driverLastLocationDetail.liveStats },
                        socketService,
                        validSocketIds
                    )
                    return { validSocketIds, validFcmTokens }
                }
                )
                .catch(err => {
                    console.error('Error getting valid socket IDs:', err)
                })
        }
         
        _getValidSocketIdsForTrip = async (tripId) => {
            try {
                const { validSocketIds, validFcmTokens } = await getUserWhoHaveAccessToTrip(tripId)
                return { validSocketIds, validFcmTokens }
            } catch (err) {
                console.log(err)
                return { validSocketIds: [], validFcmTokens: [] }
            }
        }
    
        #emitDriverSocketLocation = async (tripId, data, socketService, validSocketIds) => {
            try {
                socketService.driverLocationHandler.emitDriverLocationUpdate(validSocketIds, {tripId: tripId, data })
            } catch (err) {
                console.log(err)
            }
        }
    
    
        // Placeholder for adding encoded location data
        addLocationEncoded = async () => {
    
        }
    
        getLocationData = async(req, res) => {
            try {
                const { imei, startTime, endTime, utcOffset=330 } = req.body;
    
                if (!imei || !startTime || !endTime) {
                    return res.status(400).json({
                        success: false,
                        error: 'IMEI, startTime, and endTime are required'
                    });
                }
    
                const userId = req.user.id;
                if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });
    
                const device = await Device.getDeviceFromImei(imei);
                if(!device) return res.status(400).json({ success: false, message: 'Device not found' });
    
                if (device.userId.toString() !== userId) return res.status(400).json({ success: false, message: 'User does not have permission for this device' });
    
                let timeZone = countriesAndTimezones.getAllTimezones();
                timeZone = Object.values(timeZone);
                const timeZoneList = timeZone.find((timezone) => timezone.utcOffset === utcOffset);
                timeZone = timeZoneList?.name || 'Asia/Kolkata';
    
                const locations = await LiveLocation.getLocationsTraccar(imei, parseInt(startTime), parseInt(endTime), timeZone);
                return res.status(200).json({
                    success: true,
                    data: { 
                        getRecentLocations: {
                            raw: locations,
                            compressed: []
                        }
                    }
                });
            } catch (error) {
                console.error('Error getting location data:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to get location data'
                });
            }
        }
    
        // Handles errors by sending a 500 response
        handleError = async (err, res) => {
            res.status(500).json({
                error: 'Internal server error',
                success: false
            });
        }

   
}

LocationControllerTrip(LocationController)
module.exports = LocationController;

