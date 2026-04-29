const Bull = require('bull');
const User = require('../../Models/User');
const { getVmtaxicustomerApp } = require('./firebaseApps');

class NOTPushNotifiationService {
    constructor() {
        const app = getVmtaxicustomerApp();
        this.messaging = app ? app.messaging() : null;
        this.queueOptions = {
            limiter: {
                max: 10,
                duration: 10000,
            },
        };
        this.invalidTokens = [];
        this.pushNotificationQueue = new Bull('notPushNotificationQueue', this.queueOptions);
        this.sendPushNotification = this.sendPushNotification.bind(this);
        this.initializeQueue();
    }

    initializeQueue() {
        this.pushNotificationQueue.process(async (job) => {
            const { fcmToken, message, deviceId, priority, params, isSilent } = job.data;
            await this.sendPushNotification(fcmToken, message, deviceId, priority, params, isSilent);
        });
    }

    sendPushNotification = async (fcmToken, message, deviceId = null, priority = "normal", params = null, isSilent = false) => {
        // console.log("NOT Push Notification Service Used")
        try {
            if (!fcmToken || typeof fcmToken !== 'string') {
                // console.error('No FCM token found');
                return false;
            }

            const payload = {
                token: fcmToken,
                notification: {
                    title: isSilent ? '' : message.title,
                    body: isSilent ? '' : message.body
                },
                data: {
                    title: message.title,
                    deviceId
                }
            };

            if (!deviceId) {
                delete payload.data['deviceId']
            }
            if (params) {
                payload.data = {
                    ...payload.data,
                    ...params
                }
            }

            if (priority === "high") {

                //for android
                payload.android = {
                    "priority": "high"
                }

                //for ios
                payload.apns = {
                    "headers": {
                        "apns-priority": "10"
                    }
                }
            }

            await this.messaging.send(payload)
            // console.log('Push notification sent successfully!');
            return true;
        }
        catch (error) {
            if (error?.errorInfo && error.errorInfo.code === 'messaging/registration-token-not-registered') {
                console.log(`Invalid token: ${fcmToken}`);
                this.invalidTokens.push(fcmToken);
            }
            // console.error('Error sending push notification:', error);
        }
        finally {
            if (this.invalidTokens.length > 20) {
                this.clearInvalidTokens([...this.invalidTokens])
                this.invalidTokens = []
            }
        }
    };


    clearInvalidTokens = async (fcmTokens) => {
        try {
            // console.log("Clearing invalid FCM tokens")
            await User.removeFcmTokens(fcmTokens)
        } catch (error) {
            // console.log(error)
        }
    }

    enqueueNotifications = async (fcmTokens, message) => {
        try {
            fcmTokens.forEach((fcmToken) => this.pushNotificationQueue.add({ fcmToken, message }));
        }
        catch (error) {
            // console.error('Error enqueuing notifications:', error);
        }
    }
}

module.exports = new NOTPushNotifiationService();

