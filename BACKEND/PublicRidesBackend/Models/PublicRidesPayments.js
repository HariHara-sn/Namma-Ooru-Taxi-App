const { ObjectId } = require('mongodb');
const Mongo = require('../Controllers/DB/Mongo');

const PAYMENTS_COLLECTION = 'publicRidesPayments';
const TRIPS_COLLECTION = 'trips';
const PUBLIC_RIDES_TRANSACTIONS_COLLECTION = 'publicRidesTransactions';
const REGIONAL_OFFICE_COLLECTION = 'regionaloffices';
const VENDORS_COLLECTION = 'vendors';




class PublicRidesPayment {
    static updatePaymentToTrip = async (tripId, driverId, passengerId, fareDetails) => {
        const tripObjectId = new ObjectId(tripId);
        const driverObjectId = new ObjectId(driverId);
        const passengerObjectId = new ObjectId(passengerId);

        const now = new Date().getTime();
        const driverEarning = fareDetails.breakdown?.driverEarnings || 0;
        const driverDue = fareDetails.breakdown?.driverDue || 0;

        const existingPayment = await Mongo.findOne(PAYMENTS_COLLECTION, {
            tripId: tripObjectId
        });

        let paymentId;

        if (existingPayment) {
            await Mongo.updateOne(
                PAYMENTS_COLLECTION,
                { _id: existingPayment._id },
                {
                    fareDetails,
                    driverId: driverObjectId,
                    passengerId: passengerObjectId,
                    driverEarning,
                    driverDue,
                    passengerPaymentStatus: 'pending',
                    updatedAt: now
                }
            );
            paymentId = existingPayment._id;
        } else {
            const insertResult = await Mongo.insertOne(PAYMENTS_COLLECTION, {
                tripId: tripObjectId,
                driverId: driverObjectId,
                passengerId: passengerObjectId,
                fareDetails,
                driverEarning,
                driverDue,
                passengerPaymentStatus: 'pending',
                createdAt: now,
                updatedAt: now
            });
            paymentId = insertResult.insertedId;
        }

        // Update paymentId in trips collection
        await Mongo.updateOne(
            TRIPS_COLLECTION,
            { _id: tripObjectId },
            { paymentId }
        );

        return { success: true, paymentId };
    };

    static updatePassangerPaymentStatus = async (tripId, paymentMethod) => {
        const result = await Mongo.updateOne(
            PAYMENTS_COLLECTION,
            { tripId: new ObjectId(tripId)},
            { passengerPaymentStatus: 'completed', paymentMethod: paymentMethod }
        );
        return result
    }

    static updateVendorDue = async (vedorId, vendorDueEarnings) => {
        const result = await Mongo.updateOneIncreament(
            VENDORS_COLLECTION,
            { _id: new ObjectId(vedorId)},
            { 
                vendorDue: vendorDueEarnings.vendorDue,
                vendorEarnings: vendorDueEarnings.vendorEarnings
            }
        );
        return result;
    }

    static getPaymentDetailsById = async (paymentId) => {
        const payment = await Mongo.findOne(PAYMENTS_COLLECTION, { _id: new ObjectId(paymentId) });
        return payment;
    }
    static getPaymentDetailsByTrip = async (tripId) => {
        const payment = await Mongo.findOne(PAYMENTS_COLLECTION, { tripId: new ObjectId(tripId) });
        return payment;
    }
    static getPaymentDetailsByTripId = async (tripId) => {
        if (typeof tripId === 'string') {
            tripId = new ObjectId(tripId);
        }
        const payment = await Mongo.findOne(PAYMENTS_COLLECTION, { tripId: tripId });
        return payment;
    }
    static updatePaymentStatus = async (paymentId, transactionId) => {
        const payment = await Mongo.updateOne(PAYMENTS_COLLECTION, { _id: new ObjectId(paymentId) }, { transactionId });
        return payment;
    }
    static clearTripDue = async (driverId, transactionId, lastPaymentInitTime) => {
        const payment = await Mongo.updateMany(
            PAYMENTS_COLLECTION,
            {
                driverId: new ObjectId(driverId),
                createdAt: { $lt: lastPaymentInitTime || new Date().getTime() },
            },
            {
                dueStatus: "CLEARED", 
                dueTransactionId: transactionId
            }            
        );
        return payment;
    }

    static clearTripDueOne = async (driverId, tripId) => {
        const payment = await Mongo.updateOne(
            PAYMENTS_COLLECTION,
            {
                driverId: new ObjectId(driverId),
                tripId: new ObjectId(tripId),
            },
            {
                dueStatus: "CLEARED", 
                passengerPaymentStatus: "completed"

            }            
        );
        return payment;
    }

    static getTripDueDetails = async (driverId, tripId) => {
        const payment = await Mongo.findOne(PAYMENTS_COLLECTION, { driverId: new ObjectId(driverId), tripId: new ObjectId(tripId) });
        if(payment?.driverDue){
            return payment?.driverDue;
        }
        return null;
    }
    

    static getPaymentsForDriver = async (filter, page = 1, limit = 10) => {
        const queryFilter = { ...filter };
        if (queryFilter.status === 'all') {
            delete queryFilter.status;
        }

        // Split into two separate aggregations for better performance
        
        // 1. Get paginated payments data
        const paymentsPipeline = [
            { $match: queryFilter },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        // 2. Get aggregated stats with count
        const statsPipeline = [
            { $match: queryFilter },
            {
                $addFields: {
                    // Normalize field name - check both driverEarnings and driverEarning
                    normalizedDriverEarnings: { $ifNull: ["$driverEarnings", "$driverEarning"] },
                    // Convert null to 0 for earnings (only sum non-null values)
                    earningsForSum: {
                        $cond: [
                            { $ne: [{ $ifNull: ["$driverEarnings", "$driverEarning"] }, null] },
                            { $ifNull: ["$driverEarnings", "$driverEarning"] },
                            0
                        ]
                    },
                    // Convert null to 0 for driverDue (only for non-null values)
                    driverDueForSum: {
                        $cond: [
                            { $ne: ["$driverDue", null] },
                            "$driverDue",
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$earningsForSum" },
                    clearedDue: {
                        $sum: {
                            $cond: [
                                { $eq: ["$dueStatus", "CLEARED"] },
                                "$driverDueForSum",
                                0
                            ]
                        }
                    },
                    pendingDue: {
                        $sum: {
                            $cond: [
                                { $ne: ["$dueStatus", "CLEARED"] },
                                "$driverDueForSum",
                                0
                            ]
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ];

        // Run both queries in parallel
        const [payments, statsResults] = await Promise.all([
            Mongo.aggregate(PAYMENTS_COLLECTION, paymentsPipeline),
            Mongo.aggregate(PAYMENTS_COLLECTION, statsPipeline)
        ]);

        const stats = statsResults[0] || { 
            totalEarnings: 0, 
            clearedDue: 0, 
            pendingDue: 0,
            count: 0 
        };

        // Ensure null values are converted to 0 (MongoDB $sum can return null in edge cases)
        const totalEarnings = (stats.totalEarnings !== null && stats.totalEarnings !== undefined) ? stats.totalEarnings : 0;
        const clearedDue = (stats.clearedDue !== null && stats.clearedDue !== undefined) ? stats.clearedDue : 0;
        const pendingDue = (stats.pendingDue !== null && stats.pendingDue !== undefined) ? stats.pendingDue : 0;
        
        return {
            payments,
            totalCount: stats.count || 0,
            totalEarnings: totalEarnings,
            clearedDue: clearedDue, 
            pendingDue: pendingDue,
            count: stats.count || 0
        };
    }

    static updateTransactionDetails = async (driverId, order, payment) => {
        const obj = { 
            driverId: new ObjectId(driverId), 
            amount: order.amount, 
            currency: order.currency, 
            orderId: order.id, 
            receipt: order.receipt, 
            paymentId: payment.id, 
            vpa: payment.vpa, 
            email: payment.email, 
            contact: payment.contact, 
            createdAt: new Date().getTime(), transferType: 'DUE_PAYMENT'}
        const transaction = await Mongo.insertOne(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, obj );
        return transaction;
    }

    static getTransactionHistory = async (filter, page = 1, limit = 10) => {
        const queryFilter = { ...filter };
        const pipeline = [
            { $match: queryFilter },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ];

        const result = await Mongo.aggregate(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, pipeline);
        const totalCount = await Mongo.countDocuments(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, queryFilter);
        return { transactions: result, totalCount };
    }

    static updateDriverDueDate = async (driver) => {
        const pipeline = [
            {
                $match: {
                    _id: new ObjectId(driver.regionalOffice)
                }
            },
            {
                $lookup: {
                    from: 'fareconfigs',
                    localField: 'fareConfig',
                    foreignField: '_id',
                    as: 'fareConfig'
                }
            }
        ];
        const regionalOffice = await Mongo.aggregate(REGIONAL_OFFICE_COLLECTION, pipeline);
        const fareConfig = regionalOffice[0].fareConfig
        const dueRepayCycle = fareConfig[0].dueRepayCycle
        return dueRepayCycle
    }

    static updateTripPaymentDeatails = async (orderId, paymentDetails, paymentStatus, paymentId) => {
        await Mongo.updateOne(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, { orderId: orderId }, { passengerPaymentStatus: paymentStatus, paymentId: paymentId });

        if (paymentDetails) {
            await Mongo.updateOneAddToSet(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, { orderId: orderId }, { paymentTimeline: paymentDetails });
        }

        const transaction = await Mongo.findOne(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, { orderId: orderId });
        if (!transaction || !transaction.tripId) {
            return { success: true };
        }

        let fareInfo = null;
        const tripId = transaction.tripId;

        if (tripId && (ObjectId.isValid(tripId) || tripId instanceof ObjectId)) {
            const tripObjectId = tripId instanceof ObjectId ? tripId : new ObjectId(tripId);
            fareInfo = await Mongo.findOne(PAYMENTS_COLLECTION, { tripId: tripObjectId });
        }

        return transaction?.tripId ? { success: true, tripId: transaction.tripId, fareInfo } : { success: true };
    }
    static updateTripPaymentTimeline= async (orderId, paymentDetails) => {
        await Mongo.updateOneAddToSet(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, { orderId: orderId }, { paymentTimeline: paymentDetails });
        return true;
    }

    static updateTripPaymentTimelineByPaymentID = async (paymentId, paymentDetails) => {
        await Mongo.updateOneAddToSet(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, { paymentId: paymentId }, { paymentTimeline: paymentDetails });
        return true;
    }

    static updateDuePaymentDetails = async (orderId, paymentDetails, paymentStatus, paymentId, payment, driverId, amount, currency) => {
        const doc = await Mongo.findOne(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, { orderId: orderId });
        if (!doc) {
            const obj = {
                orderId: orderId,
                driverPaymentStatus: paymentStatus,
                paymentId: paymentId,
                paymentTimeline: [paymentDetails],
                driverId: new ObjectId(driverId),
                vpa: payment.vpa,
                email: payment.email,
                contact: payment.contact,
                createdAt: new Date().getTime(), 
                transferType: 'DUE_PAYMENT',
                amount: amount,
                currency: currency,
            }
            // Insert new document if orderId doesn't exist
            await Mongo.insertOne(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, obj);
            return { success: true };
        }
        // Update existing document with both status and timeline in one operation
        await Mongo.updateOneRaw(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, { orderId: orderId }, { 
            $set: { driverPaymentStatus: paymentStatus, paymentId: paymentId },
            $addToSet: { paymentTimeline: paymentDetails }
        });
        // console.log("Update result:", updateResult);
        return { success: true };
    }


    static upsertTransferData = async (tripId, transferData) => {
        await Mongo.updateOneRawUpsert(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, { tripId: new ObjectId(tripId) }, { $set: { tripId: new ObjectId(tripId), ...transferData } });
    }

    static getTransferType = async (orderId) => {
        const transferType = await Mongo.findOne(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, { orderId: orderId });
        if (!transferType) {
            return null;
        }
        return transferType?.transferType;
    }
    static getDriverandPassangerFcmToken = async (orderId) => {
        const transaction = await Mongo.findOne(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, { orderId });
        if (!transaction) {
            return null;
        }
        const tripId = transaction?.tripId;

        const query = Mongo.aggregate(TRIPS_COLLECTION, [
            {
                $match: {
                    _id: new ObjectId(tripId)
                }
            },
            {
                $lookup: {
                    from: 'drivers',
                    localField: 'driverId',
                    foreignField: '_id',
                    as: 'driverInfo'
                }
            },
            {
                $lookup: {
                    from: 'passangers',
                    localField: 'passangerId',
                    foreignField: '_id',
                    as: 'passangerInfo'
                }
            },
            {
                $unwind: '$driverInfo'
            },
            {
                $unwind: '$passangerInfo'
            },
            {
                $project: {
                    _id: 0,
                    driverFCMToken: '$driverInfo.fcmToken',
                    driverId: '$driverInfo._id',
                    currentTripId: '$driverInfo.currentTripId',
                    passangerId: '$passangerInfo._id',
                    passangerFCMToken: '$passangerInfo.fcmToken'
                }
            }
        ]);

        const result = await query;
        if (result?.length > 0) {
            return result[0];
        }
        return { driverFCMToken: null, passangerFCMToken: null };
    }

    static getTransactionByPaymentId = async (paymentId) => {
        const transaction = await Mongo.findOne(PUBLIC_RIDES_TRANSACTIONS_COLLECTION, { paymentId: paymentId });
        return transaction;
    }

    static updateDueDetailsinTripByPaymentID = async (paymentId) => {
        const payment = await Mongo.updateMany(
            PAYMENTS_COLLECTION,
            {
                dueTransactionId: paymentId,
            },
            {
                dueStatus: "NOT_CLEARED", 
            }            
        );
        return payment;
    }
    
    static getMultipleTripsPaymentDetails = async (tripIds) => {
        tripIds = tripIds.map(id => new ObjectId(id))
        const result = await Mongo.find(PAYMENTS_COLLECTION, { tripId: { $in: tripIds } });
        return result;
    }
}

module.exports = PublicRidesPayment;
