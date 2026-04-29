const sendTripDriverAssignedMessage = (name) => {
    const title = 'Driver Assigned 🚗';
    const templates = [
        `${name} has been assigned as your driver and is on the way. 🎯`,
        `We've found ${name} as your driver for this trip. 🌟`, 
        `${name} is confirmed as your driver. Get ready for your ride. 🚀`
    ];
    const message = templates[Math.floor(Math.random() * templates.length)];
    return { title, body: message };
};
const sendTripDriverAssignedMessageWithOTP = (name, otp) => {
    const title = 'Driver Assigned 🚗';
    const templates = [
        `OTP: ${otp}. ${name} has been assigned as your driver and is on the way. 🎯`,
        `OTP: ${otp}. We've found ${name} as your driver for this trip. 🌟`,
        `OTP: ${otp}. ${name} is confirmed as your driver. Get ready for your ride. 🚀`
    ];
    const message = templates[Math.floor(Math.random() * templates.length)];
    return { title, body: message };
};

const sendDriverOntheWayMessage = (name) => {
    const title = 'Driver On The Way 🚙';
    const templates = [
        `${name} is on the way to your location. Get ready for your ride. 🎯`,
        `${name} is heading towards your pickup point. 🏃`,
        `Your driver ${name} will arrive shortly. ⏳`,
        `${name} is almost at your location. 📍`,
        `${name} is on the way. Please be ready. 🚦`
    ];
    const message = templates[Math.floor(Math.random() * templates.length)];
    return { title, body: message };
};

const sendDriverAlmostreachedMessage = (name, otp) => {
    const title = 'Driver Almost Reached 📍';
    const templates = [
        `${name} is almost at your location. Your OTP is ${otp}. 🔑`,
        `Your driver ${name} is about to arrive. Please use OTP ${otp}. 🎯`,
        `${name} will reach your pickup point shortly. Share OTP ${otp} to start your ride. 🚀`,
        `Your ride with ${name} is near your location. OTP: ${otp}. ⏳`,
        `${name} is close to your pickup spot. Use OTP ${otp} when boarding. 🎉`
    ];
    const message = templates[Math.floor(Math.random() * templates.length)];
    return { title, body: message };
};

const sendCustomerTripStartedMessage = () => {
    const title = 'Trip Started 🚗';
    const templates = [
        'Your trip has started. 🎯',
        'You are now on your way to your destination. 🚀',
        'The ride has begun. Sit back and relax. 😊',
        'Your journey is in progress. 🌟',
        'Trip started. Enjoy your ride! 🎉'
    ];
    const message = templates[Math.floor(Math.random() * templates.length)];
    return { title, body: message };
};

const sendReachedstopMessage = (name, stopname) => {
    const title = 'Reached Stop 🚏';
    const templates = [
        `You are now at the ${stopname} stop. 📍`,
        `Arrived at ${stopname} stop. 🎯`,
        `Now stopping at ${stopname}. ⏱️`
    ];
    const message = templates[Math.floor(Math.random() * templates.length)];
    return { title, body: message };
};

const aboutToReachDestinationMessage = (name, destination) => {
    const title = 'About To Reach Destination 🎯';
    const templates = [
        `You are about to reach your destination: ${destination}. 🚗`,
        `Your ride is nearing ${destination}. ⏳`,
        `Almost there — approaching ${destination}. 📍`,
        `You will soon arrive at your destination: ${destination}. 🎉`,
        `The drop-off point ${destination} is just ahead. 🏁`
    ];
    const message = templates[Math.floor(Math.random() * templates.length)];
    return { title, body: message };
};

const reachedDestinationMessage = (tripFare) => {
    const title = 'Reached Destination 🏁';
    const templates = [
        `You have reached your destination. Your fare is ₹${tripFare}. 💰`,
        `Trip completed! Total fare: ₹${tripFare}. 🎉`,
        `You've arrived at your destination. Please pay ₹${tripFare}. 💳`,
        `Destination reached. Your ride fare: ₹${tripFare}. 🎯`,
        `Your journey is complete. Fare due: ₹${tripFare}. ✨`
    ];
    const message = templates[Math.floor(Math.random() * templates.length)];
    return { title, body: message };
};

const sendCompletedTripMessagePaymentCompleted = (tripFare) => {
    const title = 'Ride Completed ✅';
    const templates = [
        `Thank you for choosing us! Your trip is completed and payment of ₹${tripFare} has been received. 🙏`,
        `Thanks for riding with us! Trip completed and payment of ₹${tripFare} received successfully. 💫`, 
        `Thank you for choosing our service! Your ride is complete and fare of ₹${tripFare} has been paid. 💰`,
        `Thanks for traveling with us! Your journey is finished and payment of ₹${tripFare} is confirmed. ✨`,
        `Thank you for riding! Trip completed and ₹${tripFare} has been processed. We appreciate your trust! 🎉`
    ];
    const message = templates[Math.floor(Math.random() * templates.length)];
    return { title, body: message };
};

const sendTripCancelledMessage = (name) => {
    const title = 'Trip Cancelled By Driver ❌';
    const message = `Your trip has been cancelled by ${name} 😔`;
    return { title, body: message };
};

const sendTripPaymentCompletedMessageToDriver = (fare, currency) => {
    const currencySymbol = currency === 'INR' ? '₹' : '$';
    const title = 'Payment Success! 🎉';
    const templates = [
        `Great news! ${currencySymbol}${fare} payment received for your ride 💰`,
        `Payment of ${currencySymbol}${fare} has been credited to your account ✅`,
        `You've received ${currencySymbol}${fare} for your completed trip 💫`,
        `Trip payment of ${currencySymbol}${fare} successfully processed 🌟`,
    ];
    const message = templates[Math.floor(Math.random() * templates.length)];
    return { title, body: message };
};

const sendTripPaymentCompletedMessageToPassanger = (fare, currency) => {
    const currencySymbol = currency === 'INR' ? '₹' : '$';
    const title = 'Payment Successful ✅';
    const templates = [
        `Your payment of ${currencySymbol}${fare} has been processed successfully 💫`,
        `Thanks for riding! Payment of ${currencySymbol}${fare} confirmed 🙏`,
        `Trip payment complete: ${currencySymbol}${fare} paid successfully 💰`,
        `Payment confirmed: ${currencySymbol}${fare} for your journey 🌟`,
        `Transaction successful: ${currencySymbol}${fare} paid for your ride 🎉`
    ];
    const message = templates[Math.floor(Math.random() * templates.length)];
    return { title, body: message };
};

const sendTripSettlementMessageToDriver = (fare, currency = 'INR') => {
    const currencySymbol = currency === 'INR' ? '₹' : '$';
    const title = 'Settlement Successful ✅';
    const templates = [
        `Your settlement of ${currencySymbol}${fare} has been processed successfully 💫`,
        `Settlement of ${currencySymbol}${fare} has been processed successfully 💰`,
        `Settlement successful: ${currencySymbol}${fare} for your journey 🌟`,
        `Transaction successful: ${currencySymbol}${fare} paid for your ride 🎉`
    ];
    const message = templates[Math.floor(Math.random() * templates.length)];
    return { title, body: message };
};

const sendAlertPassangerPickupMessage = (name) => {
    const title = 'Driver Arrived 🚗';
    const message = `Driver ${name} has arrived at your pickup location 📍`;
    return { title, body: message };
};
const sendAlertPassangerPickupMessagewithOTP = (name, otp) => {
    const title = 'Driver Arrived 🚗';
    const message = `OTP: ${otp}. Driver ${name} has arrived at your pickup location 📍.`;
    return { title, body: message };
};

module.exports = {
    sendTripDriverAssignedMessage,
    sendTripCancelledMessage,
    sendDriverOntheWayMessage,
    sendDriverAlmostreachedMessage,
    sendCustomerTripStartedMessage,
    sendReachedstopMessage,
    aboutToReachDestinationMessage,
    sendCompletedTripMessagePaymentCompleted,
    reachedDestinationMessage,
    sendTripPaymentCompletedMessageToDriver,
    sendTripPaymentCompletedMessageToPassanger,
    sendTripSettlementMessageToDriver,
    sendAlertPassangerPickupMessage,
    sendTripDriverAssignedMessageWithOTP,
    sendAlertPassangerPickupMessagewithOTP
};