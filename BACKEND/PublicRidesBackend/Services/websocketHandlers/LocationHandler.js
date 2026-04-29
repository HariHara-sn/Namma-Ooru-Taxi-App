const Redis = require("../../Controllers/DB/Redis");
const { parkingModeAlert } = require("../PushNotification/Messages");
const { getDeviceAndUsersWithAccess } = require("../WebsocketUtilities");
const Device = require('../../Models/Device');
const PushNotifiationService = require("../PushNotification/PushNotifiationService");

const FIFTEEN_MINUTES = 1000 * 60 * 15;

class LocationHandler {
    constructor(webAppClientsNamespace, realtimeServerNamespace) {
        this.webAppClientsNamespace = webAppClientsNamespace;
        this.realtimeServerNamespace = realtimeServerNamespace;
    }

    emitDeviceLocationUpdate(socketIds, location) {
        socketIds.forEach(socketId => {
            const socket = this.webAppClientsNamespace.sockets.get(socketId);
            if (socket && socket.connected) {
                socket.emit('deviceLocationUpdate', location);
            }
        });
    }

    initializeRealTimeServerListeners(socket) {
        socket.on('deviceLocationUpdate', async (data) => {
            try {
                const { deviceId } = data
                /*check socket ids is in cache */
                // let cachedSocketIds = await Redis.getData(deviceId + "_socket_ids")
                // if (cachedSocketIds) {
                //     this.emitDeviceLocationUpdate(JSON.parse(cachedSocketIds), { deviceId, data: { location: data.location, liveStats: data.liveStats } })
                //     return
                // }

                /* this is an expensive query so we cache it for 5 minutes */
                /* the location trigger will happen for evey 10 sec for each vehicle */
                /* so the cache will optmize performance */


                // const { validSocketIds } = await getUsersWhoHaveAccessToDevice(deviceId)

                // /* TODO ADD CACHE */

                // this.emitDeviceLocationUpdate(validSocketIds, { deviceId, data: { location: data.location, liveStats: data.liveStats } })
                // return

                const [device, results] = await getDeviceAndUsersWithAccess(deviceId.toString())
                const { validSocketIds, validFcmTokens } = results
                Redis.storeDataWithExpiry(deviceId + "_socket_ids", JSON.stringify(validSocketIds), 60 * 5)
                this.emitDeviceLocationUpdate(validSocketIds, { deviceId, data: { location: data.location, liveStats: data.liveStats } })

                /* Check for parking mode enabled in device */
                const speedinKm = device?.liveStats?.speed * 1.852;
                if (device?.liveStats?.parkingMode === 'on' && speedinKm > 5) {
                    const lastParkingModeAlertTime = device?.liveStats?.lastParkingModeAlertTime;
                 
                    if (!lastParkingModeAlertTime || (new Date().getTime() - lastParkingModeAlertTime > FIFTEEN_MINUTES)) {
                         
                        Device.updateLiveStats(deviceId, {
                            ...device.liveStats,
                            lastParkingModeAlertTime: new Date().getTime()
                        })
                            .then(res => console.log("Parking mode notification time updated", res))
                            .catch(err => console.log(err));
                 
                        const message = parkingModeAlert(device);
                        validFcmTokens.forEach(fcmToken => 
                            PushNotifiationService.sendPushNotification(fcmToken, message, device._id.toString(), "high")
                        );
                    }
                }

            } catch (err) {
                console.log(err, "err", data)
            }
        })
    }
}

module.exports = LocationHandler