/* eslint-disable camelcase */
const Controller = require("../Controller")
const PhonepayPaymentController = require('./PhonepayPaymentController')
const Redis = require('../DB/Redis')
const Driver = require('../../Models/Driver')
const PublicRidesPayment = require("../../Models/PublicRidesPayments")
const { ObjectId } = require("mongodb")
const Razorpay = require('razorpay');
const RazorPayLinking = require("../Driver/RazorPayLinking")
const Trip = require("../../Models/Trip");
const { getUserSocketIds } = require("../../Services/WebsocketUtilities");  



const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


async function sendDriverSocketEvents(driverId, socketService, tripId, data) {
    console.log("sendDriverSocketEvents called with driverId:", driverId, "tripId:", tripId, "data:", data);
    const driverSocketIds = await getUserSocketIds(driverId);
    
    
    const socketData = {
        tripId: tripId,
        data: data
    }
    console.log("driverSocketIds", driverSocketIds)
    console.log("socketData", socketData)
    socketService.publicRideDriverHandler.emitpassangerPaymentInitiated(driverSocketIds, socketData)
    
}





class PublicRidesPaymentsController extends Controller {
    constructor() {
        super()

    }

    getDriverPayments = async (req, res) => {
        const driverId = req.driver.id
        try {
            console.log('hari-->>driverId-->>', driverId)
            
            return res.json({ success: true, });
        } catch (err) {
            console.log(err)
            return this.handleError(err, res);
        }

    }



    PhonepayInitPayment = async (req, res) => {
        try {
            const { amount } = req.body



            if(!amount) {
                return res.json({ success: false, message: 'Amount is required' })
            }

            if(amount <= 0) {
                return res.json({ success: false, message: 'Amount must be greater than 0' })
            }

            

            const driverId = req.driver.id

            let AuthToken = await Redis.getData(`driver_${driverId}_phonepay_auth`)
            
            if(!AuthToken) {
                const tokenResponse = await PhonepayPaymentController.PhonepayAuth() 
                AuthToken = tokenResponse.data.accessToken
                await Redis.storeDataWithExpiry(`driver_${driverId}_phonepay_auth`, tokenResponse.data.accessToken, tokenResponse.data.expiresIn)
            }

            const orderId = `driver_${driverId}_order_${Date.now()}`

          

            const orderData = {
                merchantOrderId: orderId,
                amount: amount*100,
            }



            const orderResponse = await PhonepayPaymentController.PhonepayCreateOrder(AuthToken, orderData)

            // Update the last payment order ID for the driver for future status checks
            await Driver.updateLastOrderId(driverId, orderId)
          

            if(orderResponse?.success) {
                return res.json({ success: true, data: orderResponse?.data, merchantOrderId: orderData.merchantOrderId })
            }else{
                return res.json({ success: false, message: orderResponse?.message })
            }
            
            
        } catch (err) {
            console.log(err)
            return this.handleError(err, res);
        }
    }


    checkandUpdatePaymentStatus = async (req, res) => {
        try {
            const driverId = req.driver.id


            const { orderId } = req.body

            const DriverDetails = await Driver.getDriverWithId(driverId)
            const lastPaymentInitTime = DriverDetails?.lastPaymentInitTime
            if(!DriverDetails) {
                return res.json({ success: false, message: 'Driver not found' })
            }

            // Check if the orderId matches the last payment order ID for the driver
            if(DriverDetails?.lastPaymentOrderId !== orderId) {
                return res.json({ success: false, message: 'Invalid order ID for this driver' })
            }

            let AuthToken = await Redis.getData(`driver_${driverId}_phonepay_auth`)
            if(!AuthToken) {
                const tokenResponse = await PhonepayPaymentController.PhonepayAuth() 
                AuthToken = tokenResponse.data.accessToken
                await Redis.storeDataWithExpiry(`driver_${driverId}_phonepay_auth`, tokenResponse.data.accessToken, tokenResponse.data.expiresIn)
            }

            const orderResponse = await PhonepayPaymentController.PhonepayStatusCheck(orderId, AuthToken)
            if(!orderResponse) {
                return res.json({ success: false, message: 'Order not found or invalid order ID' })
            }

            const orderStatus = orderResponse?.data?.state
            if(orderStatus === 'COMPLETED') {
                const transactionId = orderResponse?.data?.paymentDetails[0]?.transactionId
                if(!transactionId) {
                    return res.json({ success: false, message: 'Transaction ID not found in order response' })
                }

                const updateDriverDue= await Driver.updateDriverDue(driverId, 0)
                await Driver.updateLastOrderId(driverId, orderId)
                if(!updateDriverDue) {
                    return res.json({ success: false, message: 'Failed to update driver due amount' })
                }

                const updateDueDetailsinTrip = await PublicRidesPayment.clearTripDue(driverId, transactionId, lastPaymentInitTime)
                if(!updateDueDetailsinTrip) {
                    return res.json({ success: false, message: 'Failed to update trip due details' })
                }


        
            }

            // Return the order response
            if(orderResponse?.success) {
                return res.json({ success: true, data: orderResponse?.data })
            }else{
                return res.json({ success: false, message: orderResponse?.message })
            }
        } catch (error) {
            console.log(error)
        }
    }

    publicridesGetPayments = async (req, res) => {
        let { startTime, endTime, tripStatus, page, limit } = req.query;
        const driverId = req.driver.id;
        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 10;
        try {

            if (startTime) {
                startTime = parseInt(startTime, 10);
            }

            if (endTime) {
                endTime = parseInt(endTime, 10);
            }

            // Fix: Convert driverId to ObjectId
            const filter = { driverId: new ObjectId(driverId) };

            // Only add bookingTime filter if startTime or endTime is provided
            if (startTime || endTime) {
                filter.createdAt = {};
                if (startTime && !Number.isNaN(startTime)) {
                    filter.createdAt.$gte = startTime;
                }
                if (endTime && !Number.isNaN(endTime)) {
                    filter.createdAt.$lte = endTime;
                }
            }

            if (tripStatus) {
                filter.status = tripStatus;
            }

            const { payments, totalCount, totalEarnings, clearedDue, pendingDue, count } = await PublicRidesPayment.getPaymentsForDriver(filter, page, limit);

            return res.json({ 
                success: true, 
                payments: payments, 
                totalEarnings: totalEarnings,
                clearedDue: clearedDue,
                pendingDue: pendingDue,
                count: count,
                pagination: { totalPages: Math.ceil(totalCount / limit), page, limit } 
            });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    razorpayCreateOrder = async (req, res) => {
        const { amount, receiptId, currency = 'INR' } = req.body;
        const amountInPaise = amount*100

        const options = {
            amount: parseInt(amountInPaise),
            currency,
            receipt: receiptId,
            notes: { userId: req.driver?.id || 'guest' }
        };
        try {
            const order = await razorpay.orders.create(options);
            return res.json({status: 200, success: true, order});
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    customerRazorpayCreateOrder = async (req, res) => {
        const { amount, receiptId, currency = 'INR', transferList, tripId} = req.body;
        const amountInPaise = amount*100
    
        const options = {
            amount: amountInPaise,
            currency,
            receipt: receiptId,
            notes: { userId: req.passanger?.id || req.passenger?.id || 'guest', type: 'TRIP_PAYMENT', tripId: tripId }
            
        };
      
        if(transferList) {
            options.transfers = transferList
        }
        try {
            const order = await razorpay.orders.create(options);

            const orderId = order?.id;
            const transferDetails = order?.transfers.map(transfer => ({
                trfId: transfer.id,
                receiver: transfer.recipient,
                amount: transfer.amount,
                currency: transfer.currency
            }));

            if (transferDetails.length > 0 && orderId) {
                const transferData = {
                    splitDetails: transferDetails,
                    orderId: orderId,
                    transferType: "TRIP_PAYMENT",
                    paymentTimeline: [{
                        eventName: "order.created",
                        amount: amount,
                        currency: currency,
                        createdAt: new Date().getTime()
                    }],
                    passengerPaymentStatus: "USER_PAYMENT_PENDING"
                };

                try {
                    await PublicRidesPayment.upsertTransferData(tripId, transferData);
                } catch (err) {
                    console.log(err, "Error upserting transfer data")
                }
            }

            const driverId = await Trip.getdriverAllocatedForTrip(tripId);

            console.log("driverId", driverId)

            if (driverId) {

                console.log("Sending socket event to driver for trip payment initiation")
                sendDriverSocketEvents(driverId.toString(), req.socketService, tripId.toString(), { passangerPaymentInitiated: true }).catch(err => {
                    console.log(err, "Error sending socket events to passanger")
                })
            }
            return res.json({ status: 200, success: true, order });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    getTransactionHistory = async (req, res) => {
        let { startTime, endTime, page, limit } = req.query;
        const driverId = req.driver.id;

        // Fix: Convert pagination parameters to integers with defaults
        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 10;


        try {

            if (startTime) {
                startTime = parseInt(startTime, 10);
            }

            if (endTime) {
                endTime = parseInt(endTime, 10);
            }

            // Fix: Convert driverId to ObjectId
            const filter = { driverId: new ObjectId(driverId), transferType: 'DUE_PAYMENT' };

            // Only add bookingTime filter if startTime or endTime is provided
            if (startTime || endTime) {
                filter.createdAt = {};
                if (startTime && !Number.isNaN(startTime)) {
                    filter.createdAt.$gte = startTime;
                }
                if (endTime && !Number.isNaN(endTime)) {
                    filter.createdAt.$lte = endTime;
                }
            }

            const { transactions, totalCount } = await PublicRidesPayment.getTransactionHistory(filter, page, limit);

            return res.json({ 
                success: true, 
                transactions: transactions, 
                pagination: { totalPages: Math.ceil(totalCount / limit), page, limit } 
            });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    getDriverDueDate = async (req, res) => {
        const driverId = req.driver.id;
        try {
            const driverDetails = await Driver.getDriverWithId(driverId);
            const dueDate = await PublicRidesPayment.updateDriverDueDate(driverDetails);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if(!dueDate) {
                return res.json({ 
                    success: true, 
                    driverDueDate: { 
                        type: "monthly", 
                        value: 1, 
                        date: today.getTime() 
                    } 
                });
            }
            
            const { type, value } = dueDate;
            let nextDueDate = new Date(today);
    
            // Check if driver has already cleared their due
            if (driverDetails.dueClearedAt) {
                const clearedDate = new Date(driverDetails.dueClearedAt);
                clearedDate.setHours(0, 0, 0, 0);
                
                if (type === "monthly") {
                    const day = parseInt(value, 10);
                    // Start from the month after the cleared date
                    let nextMonth = new Date(clearedDate.getFullYear(), clearedDate.getMonth() + 1, day);
                    // Keep moving forward until we find a date after the cleared date
                    while (nextMonth <= clearedDate) {
                        nextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, day);
                    }
                    nextDueDate = nextMonth;
                }
                
                if (type === "weekly") {
                    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                    const targetDay = weekdays.indexOf(value.toLowerCase());
                    
                    // Find the next occurrence of the target weekday after the cleared date
                    const nextWeek = new Date(clearedDate);
                    const currentDay = nextWeek.getDay();
                    let daysToAdd = (targetDay - currentDay + 7) % 7;
                    
                    if (daysToAdd === 0) {
                        // Same day, move to next week
                        daysToAdd = 7;
                    }
                    
                    nextWeek.setDate(nextWeek.getDate() + daysToAdd);
                    nextDueDate = nextWeek;
                }
                
                if (type === "day") {
                    const interval = parseInt(value, 10);
                    const epoch = new Date(1970, 0, 1);
                    const clearedDaysSinceEpoch = Math.floor((clearedDate - epoch) / (1000 * 60 * 60 * 24));
                    
                    // Find the next cycle after the cleared date
                    const nextCycleDays = Math.ceil((clearedDaysSinceEpoch + 1) / interval) * interval;
                    const daysToNextCycle = nextCycleDays - clearedDaysSinceEpoch;
                    
                    nextDueDate = new Date(clearedDate);
                    nextDueDate.setDate(clearedDate.getDate() + daysToNextCycle);
                }
            } else {
                // Original logic for when driver hasn't cleared their due
                if (type === "monthly") {
                    const day = parseInt(value, 10);
                    // Set the due date to the specified day of current month
                    nextDueDate = new Date(today.getFullYear(), today.getMonth(), day);
                    
                    // If today is past the due date this month, move to next month
                    if (today > nextDueDate) {
                        nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, day);
                    }
                    
                    // If driver has cleared due before this due date, move to next month
                    if (driverDetails.dueClearedAt && driverDetails.dueClearedAt >= nextDueDate.getTime()) {
                        nextDueDate = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, day);
                    }
                }
                
                if (type === "weekly") {
                    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                    const targetDay = weekdays.indexOf(value.toLowerCase());
                    
                    if (targetDay === -1) {
                        return res.json({ success: false, message: 'Invalid weekday value' });
                    }
                    
                    const currentDay = today.getDay();
                    const daysToAdd = (targetDay - currentDay + 7) % 7;
                    
                    // If it's the same day and not cleared, it's today
                    if (daysToAdd === 0) {
                        nextDueDate = new Date(today);
                    } else {
                        nextDueDate = new Date(today);
                        nextDueDate.setDate(today.getDate() + daysToAdd);
                    }
                    
                    // If driver has cleared due before this due date, move to next week
                    if (driverDetails.dueClearedAt && driverDetails.dueClearedAt >= nextDueDate.getTime()) {
                        nextDueDate.setDate(nextDueDate.getDate() + 7);
                    }
                }
                
                if (type === "day") {
                    const interval = parseInt(value, 10);
                    if (isNaN(interval) || interval <= 0) {
                        return res.json({ success: false, message: 'Invalid day interval value' });
                    }
                    
                    // Calculate days since epoch to determine if today is a due date
                    const epoch = new Date(1970, 0, 1);
                    const daysSinceEpoch = Math.floor((today - epoch) / (1000 * 60 * 60 * 24));
                    
                    // Calculate the next due date
                    const remainder = daysSinceEpoch % interval;
                    if (remainder === 0) {
                        // Today is a due date
                        nextDueDate = new Date(today);
                    } else {
                        // Calculate days until next due date
                        const daysToAdd = interval - remainder;
                        nextDueDate = new Date(today);
                        nextDueDate.setDate(today.getDate() + daysToAdd);
                    }
                    
                    // If driver has cleared due before this due date, move to next interval
                    if (driverDetails.dueClearedAt && driverDetails.dueClearedAt >= nextDueDate.getTime()) {
                        // Find the next cycle after the cleared date
                        const clearedDate = new Date(driverDetails.dueClearedAt);
                        clearedDate.setHours(0, 0, 0, 0);
                        
                        // Calculate days since epoch for the cleared date
                        const clearedDaysSinceEpoch = Math.floor((clearedDate - epoch) / (1000 * 60 * 60 * 24));
                        
                        // Find the next due date after the cleared date
                        const nextCycleDays = Math.ceil((clearedDaysSinceEpoch + 1) / interval) * interval;
                        const daysToNextCycle = nextCycleDays - clearedDaysSinceEpoch;
                        
                        nextDueDate = new Date(clearedDate);
                        nextDueDate.setDate(clearedDate.getDate() + daysToNextCycle);
                    }
                }
            }
            return res.json({ 
                success: true, 
                driverDueDate: { 
                    type, 
                    value, 
                    date: nextDueDate.getTime() 
                } 
            });
        } catch (err) {
            return this.handleError(err, res);
        }
    };

    updateDriverPaymentID = async (req, res) => {
        try {
            const driverId = req.driver.id;
            const paymentId = req.body.paymentId;
            const driverDetails = await Driver.updatePaymentID(driverId, paymentId);
            // console.log('Updated driver details:', driverDetails);
            return res.json({ status: 200, success: true, driverDetails });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    duePayStatusCheck = async (req, res) => {
        try {
            const driverId = req.driver.id;
            const paymentId = req?.body?.lastPaymentID;
            if (!paymentId) {
                return res.json({ status: 200, success: false, message: 'Payment ID Not Found' });
            }
            const razorpayLinking = new RazorPayLinking();
            const _paymentDetails = await razorpayLinking.getPaymentDetails(paymentId);
        
            const getLastTransaction = await PublicRidesPayment.getTransactionByPaymentId(paymentId, driverId);
            const transactionStatus = getLastTransaction?.driverPaymentStatus;
            if (transactionStatus && transactionStatus === 'DRIVER_PAYMENT_COMPLETED') {
                return res.json({ status: 200, success: false, message: 'Payment already processed' });
            }
            let dueDate = null

            const paymentDetails = _paymentDetails?.data

            const driverDetails = await Driver.getDriverWithId(driverId);
            const lastPaymentInitTime = driverDetails?.lastPaymentInitTime;
            // created, authorized, captured, refunded, failed
            if (paymentDetails?.status === 'captured') {
                if (paymentDetails?.method === 'netbanking') {
                    paymentDetails.bankName = paymentDetails?.bank;
                    paymentDetails.bankTransferId = paymentDetails?.acquirer_data?.bank_transaction_id;
                }
                if (paymentDetails?.method === 'card') {
                    paymentDetails.cardDetails = paymentDetails?.card;
                }
                if (paymentDetails?.method === 'wallet') {
                    paymentDetails.walletName = paymentDetails?.wallet;
                }
                if (paymentDetails?.method === 'upi') {
                    paymentDetails.upiDetails = paymentDetails?.upi;
                    if (paymentDetails?.acquirer_data?.rrn) {
                        paymentDetails.upiDetails.rrn = paymentDetails?.acquirer_data?.rrn;
                    }
                }
                const updateDriverDue = await Driver.updateDriverDue(driverId, 0)
                const datatoUpdate = {
                    lastPaymentID: null
                }
                await Driver.updateDriver(driverId, datatoUpdate);

                if(!updateDriverDue) {
                    return res.json({status: 200, success: false, message: 'Failed to update driver due amount' })
                }

                const updateDueDetailsinTrip = await PublicRidesPayment.clearTripDue(driverId, paymentId, lastPaymentInitTime)
                if(!updateDueDetailsinTrip) {
                    return res.json({status: 200, success: false, message: 'Failed to update trip due details' })
                }

                const orderID = paymentDetails?.order_id;
                const payment = {
                    vpa: paymentDetails.vpa,
                    email: paymentDetails.email,
                    contact: paymentDetails.contact,
                }
                const amount = paymentDetails.amount / 100; // converting paise to rupees
                const currency = paymentDetails.currency;

                await PublicRidesPayment.updateDuePaymentDetails(orderID, paymentDetails, 'DRIVER_PAYMENT_COMPLETED', paymentId, payment, driverId, amount, currency);
                const updatedDriverDetails = await Driver.getDriverWithId(driverId);
                const driverDueDate = await PublicRidesPayment.updateDriverDueDate(updatedDriverDetails);
                if (!driverDueDate) {
                    return res.status(200).json({ success: false, message: 'Failed to update driver due date' });
                }
                dueDate = await Driver.updateDriverDueDate(driverId, driverDueDate);
                return res.json({ status: 200, success: true, nextDueDate: dueDate.nextDueDate });
            }
        } catch (err) {
            return this.handleError(err, res);
        }
    }
}

module.exports = PublicRidesPaymentsController