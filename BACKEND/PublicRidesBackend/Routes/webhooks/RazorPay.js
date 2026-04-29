/* eslint-disable camelcase */
const express = require('express');
const crypto = require('crypto');
const Driver = require('../../Models/Driver');
const Trip = require('../../Models/Trip');
const PublicRidesPayment = require('../../Models/PublicRidesPayments');
const rawJson = express.raw({ type: 'application/json' });
const Razorpay = require('razorpay');
const PushNotifiationService = require('../../Services/PushNotification/PushNotifiationService');
const { sendTripPaymentCompletedMessageToDriver, sendTripPaymentCompletedMessageToPassanger, sendTripSettlementMessageToDriver } = require('../../Services/PushNotification/publicRideCustomerNotification');
const { getUserSocketIds } = require("../../Services/WebsocketUtilities");
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
const RazorPayErrorLog = require('../../Models/RazorPayErrorLog');


async function sendDriverSocketEvents(driverId, socketService, tripId, status) {

    const driverSocketIds = await getUserSocketIds(driverId);
    
    
    const socketData = {
        _id: tripId,
        status: status
    }
    socketService.publicRideDriverHandler.emitDriverPaymentCompleted(driverSocketIds, socketData)
    
}











const checkTransferType = async (orderId, transferType) => {
    const DbTransferType = await PublicRidesPayment.getTransferType(orderId);
    if (transferType !== DbTransferType) {
        return false;
    }
    return true;
}




module.exports = (app) => {
    app.post('/webhooks/razorpay', rawJson, async (req, res) => {
        const signature = req.header('X-Razorpay-Signature');
        const webhookSecret = process.env.DRIVER_SECRET;

        const expected = crypto
            .createHmac('sha256', webhookSecret)
            .update(req.body)
            .digest('hex');
        
        // console.log('Razorpay Webhook Signature:', signature);
        if (signature !== expected) {
            return res.status(200).json({ success: false, message: 'Invalid signature' });
        }

        const data = JSON.parse(req.body.toString('utf8'));

        const userId = data.payload?.order?.entity?.notes?.userId;
        const transactionId = data.payload?.payment?.entity?.id;
        const transferType = data.payload?.order?.entity?.notes?.type;

        
        // Route to appropriate handler based on transfer type
        if (transferType === 'TRIP_PAYMENT') {
            // This should be handled by customer webhook, but if it comes here, handle it
            return res.status(200).json({ success: true, message: 'Customer payment - redirect to customer webhook' });
        }
        
        // This is a driver payment
        const driverId = userId;

        const payment = data.payload?.payment?.entity;
        const order = data.payload?.order?.entity;
        const amount = order?.amount || payment?.amount;
        const currency = order?.currency || payment?.currency;

        try {
            // Validate driver ID format
            if (!driverId || driverId === 'guest') {
                return res.status(200).json({ success: false, message: 'Invalid driver ID' });
            }

            const driverDetails = await Driver.getDriverWithId(driverId);
            const lastPaymentInitTime = driverDetails?.lastPaymentInitTime;

            const eventName = data?.event;
        
            if (eventName.includes('payment') || eventName === 'order.paid') {
                const orderId = data?.payload?.payment?.entity?.order_id;

                if (!checkTransferType(orderId, 'DUE_PAYMENT')) {
                    return res.status(200).json({ success: false, message: 'Transfer type not found' });
                }
                const paymentData = data?.payload?.payment?.entity;
                const paymentId = paymentData?.id;
                if (!orderId) {
                    return res.status(200).json({ success: false, message: 'Order ID not found' });
                }
                const eventSuffix = eventName.split('.')[1];
                if ( eventSuffix === 'paid') {
                    const paymentDetails = {
                        eventName,
                        method: paymentData?.method,
                        createdAt: paymentData?.created_at
                    };
                    if (paymentData?.method === 'netbanking') {
                        paymentDetails.bankName = paymentData?.bank;
                        paymentDetails.bankTransferId = paymentData?.acquirer_data?.bank_transaction_id;
                    }
                    if (paymentData?.method === 'card') {
                        paymentDetails.cardDetails = paymentData?.card;
                    }
                    if (paymentData?.method === 'wallet') {
                        paymentDetails.walletName = paymentData?.wallet;
                    }
                    if (paymentData?.method === 'upi') {
                        paymentDetails.upiDetails = paymentData?.upi;
                        if (paymentData?.acquirer_data?.rrn) {
                            paymentDetails.upiDetails.rrn = paymentData?.acquirer_data?.rrn;
                        }
                    }
                    const updateDriverDue = await Driver.updateDriverDue(driverId, 0);
                    await Driver.updateLastOrderId(driverId, orderId)
                    const datatoUpdate = {
                        lastPaymentID: null
                    }
                    const resultnew = await Driver.updateDriver(driverId, datatoUpdate);
                    if (!resultnew) {
                        return res.status(200).json({ success: false, message: 'Failed to update driver due amount' });
                    }
                    if (!updateDriverDue) {
                        return res.status(200).json({ success: false, message: 'Failed to update driver due amount' });
                    }
                    const updateDueDetailsinTrip = await PublicRidesPayment.clearTripDue(driverId, transactionId, lastPaymentInitTime);
                    if (!updateDueDetailsinTrip) {
                        return res.status(200).json({ success: false, message: 'Failed to update trip due details' });
                    }
                    await PublicRidesPayment.updateDuePaymentDetails(orderId, paymentDetails, 'DRIVER_PAYMENT_COMPLETED', paymentId, payment, driverId, amount, currency);
                    const updatedDriverDetails = await Driver.getDriverWithId(driverId);
                    const driverDueDate = await PublicRidesPayment.updateDriverDueDate(updatedDriverDetails);
                    if (!driverDueDate) {
                        return res.status(200).json({ success: false, message: 'Failed to update driver due date' });
                    }
                    await Driver.updateDriverDueDate(driverId, driverDueDate);
                  
                } else if (eventSuffix === 'failed') {
                    const paymentDetails = {
                        eventName,
                        method: paymentData?.method,
                        createdAt: paymentData?.created_at
                    };
                    if (paymentData?.status === 'failed') {
                        paymentDetails.errorCode = paymentData?.error_code;
                        paymentDetails.errorDescription = paymentData?.error_description;
                        paymentDetails.errorSource = paymentData?.error_source;
                        paymentDetails.errorStep = paymentData?.error_step;
                        paymentDetails.errorReason = paymentData?.error_reason;
                    }

                    await PublicRidesPayment.updateDuePaymentDetails(orderId, paymentDetails, 'DRIVER_PAYMENT_FAILED', paymentId, payment, driverId, amount, currency);
                    return res.status(200).json({ success: false, message: 'Payment failed', data });
                } else if (eventSuffix === 'authorized') {
                    const paymentDetails = {
                        eventName,
                        method: paymentData?.method,
                        createdAt: paymentData?.created_at
                    };
                    await PublicRidesPayment.updateDuePaymentDetails(orderId, paymentDetails, 'DRIVER_PAYMENT_AUTHORIZED', paymentId, payment, driverId, amount, currency);
                } else if (eventSuffix === 'captured') {
                    const paymentDetails = {
                        eventName,
                        method: paymentData?.method,
                        createdAt: paymentData?.created_at
                    };
                    await PublicRidesPayment.updateDuePaymentDetails(orderId, paymentDetails, 'DRIVER_PAYMENT_CAPTURED', paymentId, payment, driverId, amount, currency);
                }
            }
             
            if (eventName.includes('refund')) {
                const orderId = data?.payload?.payment?.entity?.order_id;
                if (!checkTransferType(orderId, 'DUE_PAYMENT')) {
                    return res.status(200).json({ success: false, message: 'Transfer type not found' });
                }
                const refundData = data?.payload?.refund?.entity;
                const paymentId = refundData?.payment_id;
                const paymentDetails = {
                    eventName,
                    refundAmount: refundData?.amount,
                    currency: refundData?.currency,
                    createdAt: refundData?.created_at
                };
                const eventSuffix = eventName.split('.')[1];

                const paymentStatus = eventSuffix === 'created' ? 'DRIVER_DUE_PAYMENT_REFUND_CREATED' : eventSuffix === 'processed' ? 'DRIVER_DUE_PAYMENT_REFUND_PROCESSED' : eventSuffix === 'failed' ? 'DRIVER_DUE_PAYMENT_REFUND_FAILED' : 'DRIVER_DUE_PAYMENT_REFUNDED';
                await PublicRidesPayment.updateDuePaymentDetails(orderId, paymentDetails, paymentStatus, paymentId, payment, driverId, amount, currency);
            }

            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(200).json({ success: false, message: e?.message });
        }
    });

    app.post('/webhook/customer/tripFarePayment', rawJson, async (req, res) => {
        try {
            const signature = req.header('X-Razorpay-Signature');
            
            const webhookSecret = process.env.CUSTOMER_WEBHOOK;

            const expected = crypto
                .createHmac('sha256', webhookSecret)
                .update(req.body)
                .digest('hex');

            if (signature !== expected) {
                return res.status(200).json({ success: false, message: 'Invalid signature' });
            }

            const data = JSON.parse(req.body.toString('utf8'));
            
            

            const eventName = data?.event;

            if (eventName.includes('payment') || eventName === 'order.paid') {
                const orderId = data?.payload?.payment?.entity?.order_id;

                if (!checkTransferType(orderId, 'TRIP_PAYMENT')) {
                    return res.status(200).json({ success: false, message: 'Transfer type not found' });
                }
                const paymentData = data?.payload?.payment?.entity;
                const paymentId = paymentData?.id;
                if (!orderId) {
                    return res.status(200).json({ success: false, message: 'Order ID not found' });
                }

                const eventSuffix = eventName.split('.')[1];
                
                if ( eventSuffix === 'paid') {
                    const paymentDetails = {
                        eventName,
                        method: paymentData?.method,
                        createdAt: paymentData?.created_at
                    };
                    if (paymentData?.method === 'netbanking') {
                        paymentDetails.bankName = paymentData?.bank;
                        paymentDetails.bankTransferId = paymentData?.acquirer_data?.bank_transaction_id;
                    }
                    if (paymentData?.method === 'card') {
                        paymentDetails.cardDetails = paymentData?.card;
                    }
                    if (paymentData?.method === 'wallet') {
                        paymentDetails.walletName = paymentData?.wallet;
                    }
                    if (paymentData?.method === 'upi') {
                        paymentDetails.upiDetails = paymentData?.upi;
                        if (paymentData?.acquirer_data?.rrn) {
                            paymentDetails.upiDetails.rrn = paymentData?.acquirer_data?.rrn;
                        }
                    }
                    
                    const updateTripPaymentDetails = await PublicRidesPayment.updateTripPaymentDeatails(orderId, paymentDetails, 'USER_PAYMENT_COMPLETED', paymentId);
                    const fareInfo = updateTripPaymentDetails?.fareInfo;
                    const fareDetails = updateTripPaymentDetails?.fareInfo?.fareDetails || null;
                    if (updateTripPaymentDetails && updateTripPaymentDetails?.tripId) {
                        const rideAmount = paymentData?.amount / 100;
                        const fcmTokens = await PublicRidesPayment.getDriverandPassangerFcmToken(orderId);
                        const tripDetails = await Trip.getTripsStatusandPayment(updateTripPaymentDetails?.tripId);
                        console.log("data", data)
                        let UpdatedtripStatus = "";
                        if (tripDetails?.status === 'DROPPED' || (tripDetails?.status === 'COMPLETED' && tripDetails?.paymentReceivedByDriver)) {
                            UpdatedtripStatus = 'COMPLETED';
                            await Trip.updateOnlineTripStatus(updateTripPaymentDetails?.tripId?.toString(), UpdatedtripStatus, 'ONLINE');
                        } else if (tripDetails?.status === 'PICKEDUP' || tripDetails?.status === 'CANCELLED' || (tripDetails?.status === 'DIVERGED' && !tripDetails?.paymentReceivedByDriver)) {
                            UpdatedtripStatus = 'DIVERGED';
                            await Trip.updateOnlineTripStatus(updateTripPaymentDetails?.tripId?.toString(), UpdatedtripStatus, 'ONLINE');
                        }
                        console.log("UpdatedtripStatus", updateTripPaymentDetails);
                        if (updateTripPaymentDetails?.tripId && fcmTokens?.driverId) {
                            await Driver.updateDriver(fcmTokens?.driverId?.toString(), { tripStatus: "NOTRIP", isAvailable: true });
                            console.log(tripDetails?.status, "tripDetails after payment");
                            console.log(fareInfo?.dueStatus, "fareInfo after payment");
                            console.log(tripDetails?.paymentReceivedByDriver, "paymentReceivedByDriver after payment");
                            if ((tripDetails?.status === 'COMPLETED' || tripDetails?.status === 'DIVERGED') && tripDetails?.paymentReceivedByDriver && (!(fareInfo?.dueStatus === 'CLEARED'))) {
                                const driverDue = fareDetails?.breakdown?.driverDue || null;
                                if(driverDue){
                                    await Driver.updatedriverDueAfterTripCompletion(fcmTokens?.driverId?.toString(), driverDue, 'REMOVE_DUE');
                                }
                            }else{
                                const driverDetails = await Driver.getDriverWithId(fcmTokens?.driverId?.toString());
                                

                                if (driverDetails && fareDetails) {
                                    const driverEarningData = {
                                        driverEarnings: fareDetails?.breakdown?.driverEarnings,
                                        driverDue: 0
                                    };
                                    const driverDueDate = await PublicRidesPayment.updateDriverDueDate(driverDetails)
                                    console.log(updateTripPaymentDetails?.tripId?.toString(), "tripId in payment receive 2");
                                    await Driver.updateDriverPayment(driverDetails, driverEarningData, updateTripPaymentDetails?.tripId?.toString(), driverDueDate)
                                   


                                }


                            }
                            await PublicRidesPayment.clearTripDueOne(fcmTokens?.driverId?.toString(), updateTripPaymentDetails?.tripId?.toString());
                            sendDriverSocketEvents(fcmTokens?.driverId?.toString(), req.socketService, updateTripPaymentDetails?.tripId?.toString(), "COMPLETED").catch(err => {
                                console.log(err, "Error sending socket events to passanger")
                            })
                        }



                        if (fcmTokens?.driverFCMToken) {

                            PushNotifiationService.sendPushNotification(fcmTokens?.driverFCMToken?.token, sendTripPaymentCompletedMessageToDriver(rideAmount, paymentData?.currency)).catch(err => console.log(err));
                        }
                        if (fcmTokens?.passangerFCMToken) {
                            PushNotifiationService.sendPushNotification(fcmTokens?.passangerFCMToken?.token, sendTripPaymentCompletedMessageToPassanger(rideAmount, paymentData?.currency)).catch(err => console.log(err));
                        }
                    } else {
                        const data = JSON.parse(req.body.toString('utf8'));
                        const errorLog = new RazorPayErrorLog({
                            webhook: '/webhook/customer/tripFarePayment',
                            requestBody: data,
                            errorMessage: 'Failed to update trip payment details-tripId not found in payment update',
                            errorStack: 'e.stack'
                        });
                        await errorLog.save();
                        return res.status(200).json({ success: true, message: 'Failed to update trip payment details' });
                    }


                } else if (eventSuffix === 'failed') {
                    const paymentDetails = {
                        eventName,
                        method: paymentData?.method,
                        createdAt: paymentData?.created_at
                    };
                    if (paymentData?.status === 'failed') {
                        paymentDetails.errorCode = paymentData?.error_code;
                        paymentDetails.errorDescription = paymentData?.error_description;
                        paymentDetails.errorSource = paymentData?.error_source;
                        paymentDetails.errorStep = paymentData?.error_step;
                        paymentDetails.errorReason = paymentData?.error_reason;
                    }

                    await PublicRidesPayment.updateTripPaymentDeatails(orderId, paymentDetails, 'USER_PAYMENT_FAILED', paymentId);
                    return res.status(200).json({ success: true, message: 'Payment failed', data });
                } else if (eventSuffix === 'authorized') {
                    const paymentDetails = {
                        eventName,
                        method: paymentData?.method,
                        createdAt: paymentData?.created_at
                    };
                    await PublicRidesPayment.updateTripPaymentDeatails(orderId, paymentDetails, 'USER_PAYMENT_AUTHORIZED', paymentId);
                }
            }

            if (eventName.includes('refund')) {
                const orderId = data?.payload?.payment?.entity?.order_id;
                if (!checkTransferType(orderId, 'TRIP_PAYMENT')) {
                    return res.status(200).json({ success: false, message: 'Transfer type not found' });
                }
                const refundData = data?.payload?.refund?.entity;
                const paymentId = refundData?.payment_id;
                const paymentDetails = {
                    eventName,
                    refundAmount: refundData?.amount,
                    currency: refundData?.currency,
                    createdAt: refundData?.created_at
                };
                const eventSuffix = eventName.split('.')[1];

                const paymentStatus = eventSuffix === 'created' ? 'USER_PAYMENT_REFUND_CREATED' : eventSuffix === 'processed' ? 'USER_PAYMENT_REFUND_PROCESSED' : eventSuffix === 'failed' ? 'USER_PAYMENT_REFUND_FAILED' : 'USER_PAYMENT_REFUNDED';
                await PublicRidesPayment.updateTripPaymentDeatails(orderId, paymentDetails, paymentStatus, paymentId);
            }

            if (eventName.includes('transfer')) {
                const orderId = data?.payload?.transfer?.entity?.source;
                if (!checkTransferType(orderId, 'TRIP_PAYMENT')) {
                    return res.status(200).json({ success: false, message: 'Transfer type not found' });
                }
                const transferData = data?.payload?.transfer?.entity;
                const eventSuffix = eventName.split('.')[1];
                if (eventSuffix === 'processed') {
                    const paymentDetails = {
                        eventName,
                        transferAmount: transferData?.amount,
                        currency: transferData?.currency,
                        createdAt: transferData?.processed_at,
                        recipient: transferData?.recipient,
                        fees: transferData?.fees,
                        tax: transferData?.tax
                    };
                    await PublicRidesPayment.updateTripPaymentTimeline(orderId, paymentDetails);
                }
                if (eventSuffix === 'failed') {
                    const paymentDetails = {
                        eventName,
                        createdAt: transferData?.created_at,
                        errorCode: transferData?.error?.code,
                        errorDescription: transferData?.error?.description,
                        errorSource: transferData?.error?.source,
                        errorStep: transferData?.error?.step,
                        errorReason: transferData?.error?.reason,
                        recipient: transferData?.recipient
                    };
                    await PublicRidesPayment.updateTripPaymentTimeline(orderId, paymentDetails);
                }
            }

            if (eventName.includes('settlement')) {
                const settlementData = data?.payload?.settlement?.entity;
                const settlementId = settlementData?.id;
                
                const paymentDetails = {
                    eventName,
                    settlementAmount: settlementData?.amount,
                    createdAt: settlementData?.created_at,
                    utr: settlementData?.utrId,
                    settlementId,
                    fees: settlementData?.fees,
                    tax: settlementData?.tax
                };
                try {
                    const settlementDetails = await razorpay.transfers.all({
                        recipient_settlement_id: settlementId
                    });
                   

                    if (settlementDetails) {
                        const orderId = settlementDetails?.items[0]?.source;
                        if (!checkTransferType(orderId, 'TRIP_PAYMENT')) {
                            return res.status(200).json({ success: false, message: 'Transfer type not found' });
                        }
                        await PublicRidesPayment.updateTripPaymentTimeline(orderId, paymentDetails);
                        console.log('orderId', orderId);
                        const rideAmount = paymentDetails?.settlementAmount;
                        const currency = paymentDetails?.currency;
                        const fcmTokens = await PublicRidesPayment.getDriverandPassangerFcmToken(orderId);
                      
                        if(fcmTokens?.driverFCMToken){
                            PushNotifiationService.sendPushNotification(fcmTokens?.driverFCMToken?.token, sendTripSettlementMessageToDriver(rideAmount, currency)).catch(err => console.log(err));
                        }
                        
                    }
                } catch (e) {
                    console.log('error', e);
                }
            }

            return res.status(200).json({ success: true });
        } catch (e) {
            const data = JSON.parse(req.body.toString('utf8'));
            const errorLog = new RazorPayErrorLog({
                webhook: '/webhook/customer/tripFarePayment',
                requestBody: data,
                errorMessage: e.message,
                errorStack: e.stack
            });
            await errorLog.save();
            return res.status(200).json({ success: false, message: e?.message });
        }
    });

    app.post('/webhooks/linkedAccount', rawJson, async (req, res) => {
        try {
            const signature = req.header('X-Razorpay-Signature');
            const webhookSecret = process.env.DRIVER_SECRET;
            // console.log('linkedAccount--->>webhookSecret -->> 1', webhookSecret);
            // console.log('linkedAccount--->signature -->> 2', signature);
            const expected = crypto
                .createHmac('sha256', webhookSecret)
                .update(req.body)
                .digest('hex');
      
            if (signature !== expected) {
                return res.status(200).json({ success: false, message: 'Invalid signature' });
            }
            // console.log('linkedAccount--->>expected -->> 3', expected);
            // Parse the event manually
            const event = JSON.parse(req.body.toString('utf8'));
            // console.log('linkedAccount--->>event -->> 4', JSON.stringify(event));
            const type = event.event;
            // console.log('linkedAccount--->>type -->> 5', type);
            const STATUS_MAP = {
                'product.route.under_review': 'under_review',
                'product.route.activated': 'activated',
                'product.route.needs_clarification': 'needs_clarification',

                'account.under_review': 'under_review',
                'account.activated': 'activated',
                'account.needs_clarification': 'needs_clarification',
      
                'account.verification.initiated': 'verification_initiated',
                'account.verification.pending': 'verification_pending',
                'account.verification.completed': 'verified',
                'account.verification.failed': 'verification_failed',
      
                'stakeholder.verification.initiated': 'stakeholder_verification_initiated',
                'stakeholder.verification.pending': 'stakeholder_verification_pending',
                'stakeholder.verification.completed': 'stakeholder_verified',
                'stakeholder.verification.failed': 'stakeholder_verification_failed',
            };

            // console.log('linkedAccount--->>status -->> 6', STATUS_MAP[type]);
            const status = STATUS_MAP[type];
            // CRITICAL: Only process events defined in STATUS_MAP, reject all others (including payment events)
            if (!status) {
                return res.status(200).json({ 
                    success: true, 
                    message: 'Event rejected - linkedAccount webhook only handles account linking events' 
                });
            }
            // console.log('linkedAccount--->>status -->> 7', status);
            const prodId = event?.payload?.merchant_product?.entity?.id
            const driverDetails = await Driver.getDriverWithAccOrPrdId(event.account_id, prodId);
            // console.log('linkedAccount--->>driverDetails -->> 8', JSON.stringify(driverDetails));
            if (!driverDetails) return res.status(200).json({ success: true });
            // console.log('linkedAccount--->>driverDetails -->> 9', JSON.stringify(driverDetails));
            const updateData = {
                'razorpayLinkedAccountDetails.accountDetails.activation_status': status,
                'razorpayLinkedAccountDetails.status': status,
                'razorpayLinkedAccountDetails.lastEvent': type,
                'razorpayLinkedAccountDetails.accountDetails.lastEventAt': Date.now(),
                'isBankVerified': status === 'activated' ? true : false,
            };
            // console.log('linkedAccount--->>updateData -->> 10', JSON.stringify(updateData));
            await Driver.updateDriver(driverDetails._id, updateData);
            // console.log('linkedAccount--->>updateData -->> 11', JSON.stringify(updateData));
      
            // console.log('linkedAccount--->>res -->> 12', JSON.stringify(res));
            res.status(200).json({ success: true });
            // console.log('linkedAccount--->>res -->> 13', JSON.stringify(res));
        } catch (err) {
            res.status(200).json({ success: false, message: err.message });
        }
    });

    app.post('/webhook/due-refund', rawJson, async (req, res) => {
        const signature = req.header('X-Razorpay-Signature');
        const webhookSecret = process.env.DRIVER_SECRET;

        const expected = crypto
            .createHmac('sha256', webhookSecret)
            .update(req.body)
            .digest('hex');
        
        if (signature !== expected) {
            return res.status(200).json({ success: false, message: 'Invalid signature' });
        }

        const data = JSON.parse(req.body.toString('utf8'));

        try {

            const eventName = data?.event;
        
            if (eventName.includes('refund.created')) {
                const paymentId = data?.payload?.refund?.entity?.payment_id;
                const paymentDetails = data?.payload;
                const result = await PublicRidesPayment.updateTripPaymentTimelineByPaymentID(paymentId, paymentDetails);
                if (!result ) {
                    return res.status(200).json({ success: false, message: 'Failed to update trip payment timeline' });
                }
            }
            if (eventName.includes('refund.failed')) {
                const paymentId = data?.payload?.refund?.entity?.payment_id;
                const paymentDetails = data?.payload;
                const result = await PublicRidesPayment.updateTripPaymentTimelineByPaymentID(paymentId, paymentDetails);
                if (!result ) {
                    return res.status(200).json({ success: false, message: 'Failed to update trip payment timeline' });
                }
            }
            if (eventName.includes('refund.speed_changed')) {
                const paymentId = data?.payload?.refund?.entity?.payment_id;
                const paymentDetails = data?.payload;
                const result = await PublicRidesPayment.updateTripPaymentTimelineByPaymentID(paymentId, paymentDetails);
                if (!result) {
                    return res.status(200).json({ success: false, message: 'Failed to update trip payment timeline' });
                }
            }
          
            if (eventName.includes('refund.processed')) {
                const paymentId = data?.payload?.refund?.entity?.payment_id;
                const amountRefunded = data?.payload?.refund?.entity?.amount;
                const amountRefundedInRupees = amountRefunded / 100;
                const paymentDetails = data?.payload;
                const transaction = await PublicRidesPayment.getTransactionByPaymentId(paymentId);
                if (!transaction) {
                    return res.status(200).json({ success: false, message: 'Transaction not found' });
                }
                const driverId = transaction?.driverId;
                const updateDueDetailsinTrip = await PublicRidesPayment.updateDueDetailsinTripByPaymentID(paymentId);
                if (!updateDueDetailsinTrip) {
                    return res.status(200).json({ success: false, message: 'Failed to update trip due details' });
                }
                const updateDriverDue = await Driver.updateDriverDueRefund(driverId, amountRefundedInRupees);
                if (!updateDriverDue) {
                    return res.status(200).json({ success: false, message: 'Failed to update driver due amount' });
                }
                const result = await PublicRidesPayment.updateTripPaymentTimelineByPaymentID(paymentId, paymentDetails);
                if (!result ) {
                    return res.status(200).json({ success: false, message: 'Failed to update trip payment timeline' });
                }
            }
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(200).json({ success: false, message: e?.message });
        }
    });
};


