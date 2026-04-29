const { getDeviceAndUsersWithAccess } = require("../WebsocketUtilities");
const { getHardDrivingMessage } = require("../PushNotification/Messages");
const PushNotifiationService = require('../PushNotification/PushNotifiationService');

class DrivingEventsHandler {
    constructor(webAppClientsNamespace, realtimeServerNamespace) {
        this.webAppClientsNamespace = webAppClientsNamespace;
        this.realtimeServerNamespace = realtimeServerNamespace;
    }

    emitDrivingEventsAlert(socketIds, alerts) {
        socketIds.forEach(socketId => this.webAppClientsNamespace.to(socketId).emit('hardDriving', alerts));
    }

    initializeRealTimeServerListeners(socket) {
        socket.on('hardDriving', async (data) => {
            try {
                const { deviceId, alerts: alertsArray } = data;
                const alerts = Array.isArray(alertsArray) ? alertsArray : [alertsArray];

                const [device, results] = await getDeviceAndUsersWithAccess(deviceId.toString())
                const { validSocketIds, validFcmTokens } = results
                
                alerts.forEach(alert => {       
                    validFcmTokens.forEach(fcmToken => {
                        PushNotifiationService.sendPushNotification(fcmToken, getHardDrivingMessage(device.name, alert), deviceId.toString())
                            .catch(err => console.log(err));
                    });
                });

                this.emitGeofenceAlert(validSocketIds, { deviceId, data: { alerts } });
            } catch (err) {
                console.log(err)
            }
        })
    }
}

module.exports = DrivingEventsHandler;