const getDeviceRequestReceivedMessage = (requester, device) => {
    const title = 'New Device Request'
    const message = `${requester.name} has requested for your ${device.name} device.`
    return { title, body: message }
}

const getDeviceRequestAcceptedMessage = (device) => {
    const title = 'Device Request Accepted'
    const message = `${device.name} has been shared with you by the device owner`
    return { title, body: message }
}

const getDeviceRequestRejectedMessage = (device) => {
    const title = 'Device Request Rejected'
    const message = `Request to access ${device.name} has been rejected by the device owner`
    return { title, body: message }
}

const getDeviceAccessRemovedMessage = (device) => {
    const title = 'Device Access Removed'
    const message = `Your access to ${device.name} has been removed by the device owner`
    return { title, body: message }
}

const sendTripRequestMessage = () => {
    const title = 'New Trip Request'
    const message = `You have a new trip request`
    return { title, body: message }
}
const sendTripCancelledMessage = (name) => {
    const title = 'Trip Cancelled By Driver'
    const message = `Your trip has been cancelled by ${name}`
    return { title, body: message }
}
const sendTripCancelledByPassangerMessage = (name) => {
    const title = 'Trip Cancelled By Passenger'
    const message = `Your trip has been cancelled by ${name}`
    return { title, body: message }
}
const sendTripCancelledByPassangerMessageafterPickup = (name) => {
    const title = 'Trip Cancelled By Passenger After Pickup'
    const message = `Your trip has been cancelled by ${name}. Please contact support for further assistance.`
    return { title, body: message }
}
const sendTripCancelledByDriverMessage = (name) => {
    const title = 'Trip Cancelled By Driver'
    const message = `Your trip has been cancelled by ${name}`
    return { title, body: message }
}
const sendNewBillRequestMessage = (count, total) => {
    const title = 'New Bill Request 🧾';
    const body = count === 1
        ? `Your driver has added a bill of ₹${total}. Please review and respond.`
        : `Your driver has added ${count} bills totalling ₹${total}. Please review and respond.`;
    return { title, body };
}
const sendBillRejectedDriverMessage = (description, amount) => {
    const title = 'Bill Rejected ❌';
    const body = description
        ? `Your bill "${description}" (₹${amount}) was rejected by the passenger.`
        : `Your bill of ₹${amount} was rejected by the passenger.`;
    return { title, body };
}

const sendBillPaidDriverMessage = (description, amount) => {
    const title = 'Bill Paid ✅';
    const body = description
        ? `Your bill "${description}" (₹${amount}) has been marked as paid by the passenger.`
        : `Your bill of ₹${amount} has been marked as paid by the passenger.`;
    return { title, body };
}
const sendTripCancelledByDriverMessageafterPickup = (name) => {
    const title = 'Trip Cancelled By Driver After Pickup'
    const message = `Your trip has been cancelled by ${name}. Please contact support for further assistance.`
    return { title, body: message }
}
const sendTripDriverAssignedMessage = (name) => {
    const title = 'Driver Assigned'
    const templates = [`${name} has been assigned as your driver and is on the way.`, `We've found ${name} as your driver for this trip.`, `${name} is confirmed as your driver. Get ready for your ride.`]
    const message = templates[Math.floor(Math.random() * templates.length)]
    return { title, body: message }
}

const getGroupRequestedMessage = (group) => {
    const title = 'New Group Request'
    const message = `You have been requested to join the group "${group.name}" by the group admin, ${group.adminEmail}`
    return { title, body: message }
}

const getGroupRequestAcceptedMessage = (fromUser, group) => {
    const title = 'User Accepted Group Request'
    const message = `User ${fromUser} accepted the group request for "${group.name}" that you sent`
    return { title, body: message }
}

const getGroupRequestRejectedMessage = (fromUser, group) => {
    const title = 'User Rejected Group Request'
    const message = `User ${fromUser} rejected the group request for "${group.name}" that you sent`
    return { title, body: message }
}

const getGroupUserRemovedMessage = (group) => {
    const title = 'User Removed From Group'
    const message = `You have been removed from the group "${group.name}" by the group owner, ${group.adminEmail}`
    return { title, body: message }
}

const getGroupUserLeftMessage = (fromUser, group) => {
    const title = 'User Left The Group'
    const message = `User ${fromUser} left from the group "${group.name}"`
    return { title, body: message }
}

const getGeofenceAlertMessage = (deviceName, alert, geofenceName) => {
    const title = `Geofence Alert`;
    let message;
    if (alert.type === 'geofenceIn') message = `${deviceName} entered ${geofenceName}`;
    if (alert.type === 'geofenceOut') message = `${deviceName} is out of ${geofenceName}`;
    return { title, body: message }
}

const getActivityCompletedMessage = (deviceName, activity) => {
    const title = `Activity Complete`;
    const message = `${deviceName} has completed a ${activity} activity, Click here to view the report`;
    return { title, body: message }
}

const getWireTamperingMessage = (deviceName) => {
    const title = `GPS Wire Tampering Alert`
    const message = `GPS Device ${deviceName} Wire Tampering Detected`;
    return { title, body: message }
}

const getHardDrivingMessage = (deviceName, alert) => {
    const title = "Hard Driving Alert";
    let message;

    if (alert.type === 'hardCornering') {
        message = `Hard Cornering Detected in ${deviceName}`;
    } else if (alert.type === 'hardAcceleration') {
        message = `Hard Acceleration Detected in ${deviceName}`;
    } else if (alert.type === 'hardBraking') {
        message = `Hard Braking Detected in ${deviceName}`;
    }

    return { title, body: message };
}

const getRealTimeServerAlertMessage = (deviceName, alert, geofenceIdsWithNames = null) => {
    let title, message;

    if (alert.type === 'overSpeed') {
        title = `Overspeeding Alert`;
        message = `${deviceName} is overspeeding`;
    } else if (alert.type === 'sosPress') {
        title = `SOS Alert`;
        message = `SOS button has been pressed on ${deviceName}`;
    } else if (alert.type === 'geofenceIn' || alert.type === "geofenceOut") {
        const geofenceName = geofenceIdsWithNames
            .filter(geofence => geofence._id.equals(alert.geofenceId)) // Use .equals for ObjectId comparison
            .map(geofence => geofence.geofenceName);

        title = `Geofence Alert`;
        message = (alert.type === 'geofenceIn') ? `${deviceName} entered ${geofenceName}` : `${deviceName} is out of ${geofenceName}`;
    } else if (alert.type === 'engineOn' || alert.type === "engineOff") {
        title = `Engine Status Alert`;
        message = (alert.type === 'engineOn') ? `The engine has turned on in this ${deviceName}` : `The engine has turned off in this ${deviceName}`;
    }

    return { title, body: message };
}

const getNotificationStoppedMessage = (device) => {
    const title = 'Mobile Tracking Stopped'
    const message = `Your Mobile ${device.name} has not updated its location in over 6 hours. Please check your device.`
    return { title, body: message }
}

const getOverSpeedMessage = (device) => {
    const title = 'Overspeeding Alert'
    const message = `${device.name} is overspeeding. Click here to view`
    return { title, body: message }
}

const parkingModeAlert = (device) => {
    const title = 'Vehicle Moved in Parking Mode!'
    const message = `Your parked vehicle ${device.name} has detected movement`
    return { title, body: message }
}

const getDeviceUsageAlert = (device, data, date) => {
    const title = 'Device Usage Alert'

    const message = data.map(app => {
        const totalMinutes = Math.floor(app.foregroundTime / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `App "${app.appName}" was used for ${hours} hrs ${minutes} mins`;
    }).join("\n");

    return { title, body: message + ` ${date} on the Device: ${device.name}` }
}

const getFareAlert = (fare, distance, duration) => {
    const title = `Ride Fare For your Trip is ${fare?.fare}`
    const message = `Traveled Distance ${distance} Total duration ${duration}`
    return { title, body: message }
}

const sendPickupLocationChangeAlert = (type) => {
    const title = `${type === 'pickup' ? 'Pickup' : 'Waypoints'} Location Changed`
    const message = `Your ${type === 'pickup' ? 'pickup' : 'waypoints'} location has been changed`
    return { title, body: message }
}

const AcceptedLocationChangeAlert = (type) => {
    const title = `${type === 'pickup' ? 'Pickup' : 'Waypoints'} Location Change Accepted`
    const message = `Your ${type === 'pickup' ? 'pickup' : 'waypoints'} location change request has been accepted by driver`
    return { title, body: message }
}
const RejectedLocationChangeAlert = (type) => {
    const title = `${type === 'pickup' ? 'Pickup' : 'Waypoints'} Location Change Rejected`
    const message = `Your ${type === 'pickup' ? 'pickup' : 'waypoints'} location change request has been rejected by driver`
    return { title, body: message }
}

// Subscription & SIM lifecycle messages
const getSubscriptionActivatedMessage = (deviceCount, planName, endDate) => {
    const title = 'Subscription Activated';
    const message = `Your subscription for ${deviceCount} device${deviceCount > 1 ? 's' : ''}${planName ? ` (${planName})` : ''} is active until ${endDate}.`;
    return { title, body: message };
};

const getSubscriptionExpiredMessage = (expiredCount) => {
    const title = 'Subscription Expired';
    const message = `${expiredCount} device subscription${expiredCount > 1 ? 's' : ''} expired today. Renew to continue service.`;
    return { title, body: message };
};

const getSimExpiredMessage = (expiredCount) => {
    const title = 'SIM Plan Expired';
    const message = `${expiredCount} device SIM plan${expiredCount > 1 ? 's' : ''} expired today. Recharge to restore connectivity.`;
    return { title, body: message };
};

const getAdminExpirySummaryMessage = (subCount, simCount) => {
    const title = 'Daily Expiry Summary';
    const message = `Subscriptions expired: ${subCount}. SIMs expired: ${simCount}. Check dashboard for details.`;
    return { title, body: message };
};

module.exports = {
    getActivityCompletedMessage,
    getNotificationStoppedMessage,
    getRealTimeServerAlertMessage,
    getDeviceRequestReceivedMessage,
    getDeviceRequestAcceptedMessage,
    getDeviceRequestRejectedMessage,
    getDeviceAccessRemovedMessage,
    getGroupRequestedMessage,
    getGroupRequestAcceptedMessage,
    getGroupRequestRejectedMessage,
    getGroupUserRemovedMessage,
    getGroupUserLeftMessage,
    getGeofenceAlertMessage,
    getOverSpeedMessage,
    parkingModeAlert,
    getWireTamperingMessage,
    getHardDrivingMessage,
    sendTripRequestMessage,
    sendTripCancelledMessage,
    sendTripCancelledByDriverMessage,
    sendNewBillRequestMessage,
    sendBillRejectedDriverMessage,
    sendBillPaidDriverMessage,
    sendTripCancelledByPassangerMessage,
    sendTripDriverAssignedMessage,
    getDeviceUsageAlert,
    getFareAlert,
    sendPickupLocationChangeAlert,
    AcceptedLocationChangeAlert,
    RejectedLocationChangeAlert,
    getSubscriptionActivatedMessage,
    getSubscriptionExpiredMessage,
    getSimExpiredMessage,
    getAdminExpirySummaryMessage,
    sendTripCancelledByPassangerMessageafterPickup,
    sendTripCancelledByDriverMessageafterPickup,
}

