const { getDeviceAndUsersWithAccess } = require("../WebsocketUtilities");
const { getWireTamperingMessage } = require("../PushNotification/Messages");
const PushNotifiationService = require('../PushNotification/PushNotifiationService');


class WireTamperingHandler {
    constructor(webAppClientsNamespace, realtimeServerNamespace) {
        this.webAppClientsNamespace = webAppClientsNamespace;
        this.realtimeServerNamespace = realtimeServerNamespace;
    }

    emitWireTamperingAlert(socketIds, alerts) {
        socketIds.forEach(socketId => this.webAppClientsNamespace.to(socketId).emit('powerCut', alerts));
    }

    initializeRealTimeServerListeners(socket) {
        socket.on('powerCut', async (data) => {
            try {
                const { deviceId, alerts: alertsArray } = data;
                const alerts = Array.isArray(alertsArray) ? alertsArray : [alertsArray];

                const [device, results] = await getDeviceAndUsersWithAccess(deviceId.toString())
                const { validSocketIds, validFcmTokens } = results
                
                alerts.forEach(alert => {
                    if (alert.type === "powerCut") {
                        validFcmTokens.forEach(fcmToken => {
                            PushNotifiationService.sendPushNotification(fcmToken, getWireTamperingMessage(device.name), deviceId.toString(), "high")
                                .catch(err => console.log(err));
                        });
                    }
                });

                this.emitWireTamperingAlert(validSocketIds, { deviceId, data: { alerts } });
            } catch (err) {
                console.log(err)
            }
        })
    }
}

module.exports = WireTamperingHandler;