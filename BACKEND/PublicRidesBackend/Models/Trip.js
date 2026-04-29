const { ObjectId } = require('mongodb');
const Mongo = require('../Controllers/DB/Mongo');
const { DatabaseInsertFailed } = require('./Exeptions');
const RideStatus = require('../Core/PublicRides/RideStatus');

const COLLECTION_NAME = 'trips';

class Trip {

    static addTrip = async (tripData) => {
        const result = await Mongo.insertOne(COLLECTION_NAME, tripData);
        if (result.acknowledged) return result
        else throw new DatabaseInsertFailed('Failed to add device to databse -- Insert Failed');
    }

    static updateTripStatus = async (tripId, status) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { status });
        return result;
    }

    static updateTripStatusandPaymentMethodwithTimeline = async (tripId, status, paymentMethod, tripTimelineObj) => {
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            {
                $set: { status, paymentMethod, paymentReceivedByDriver: true },
                $push: { tripTimeline: tripTimelineObj }
            }
        );
        return result;
    }

    static updateTripStatusandStops = async (tripId, status) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { 
            status, 
            "stops.0.isReached": true, 
            "stops.0.arrivalTime": new Date().getTime(),
            "stops.0.updatedAt": new Date().getTime(),
            "stops.0.driverWaitTime": 0,
            "stops.0.waitingTime": 0,
            "stops.0.stopUpdated": true
        });
        return result;
    }
    static updateTripStatusandStopswithTimeline = async (tripId, status, tripTimelineObj) => {
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            {
                $set: {
                    status,
                    "stops.0.isReached": true,
                    "stops.0.arrivalTime": new Date().getTime(),
                    "stops.0.updatedAt": new Date().getTime(),
                    "stops.0.driverWaitTime": 0,
                    "stops.0.waitingTime": 0,
                    "stops.0.stopUpdated": true
                },
                $push: { tripTimeline: tripTimelineObj }
            }
        );
        return result;
    }

    static getTripStatus = async (tripId) => {
        const result = await Mongo.findOneProjection(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { _id: 0, status: 1 });
        return result;
    }

    static getTripsStatusandPayment = async (tripId) => {
        const result = await Mongo.findOneProjection(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { _id: 0, status: 1, paymentReceivedByDriver: 1 });
        if (result) {
            result.paymentReceivedByDriver = result.paymentReceivedByDriver || false;
        }
        return result;
    }

    static getPublicRidesTripByStatus = async (status) => {
        const fourMinutesAgo = Date.now() - 3 * 60 * 1000;
        const result = await Mongo.find(COLLECTION_NAME, { publicRidesTrip: true, status: status, bookingTime: { $gte: fourMinutesAgo } })
        return result
    }

    static assignDriverToTrip = async (tripId, driverId, otp) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { driverId: new ObjectId(driverId), status: 'ACCEPTED', otp: otp });
        return result;
    }
    static assignDriverToTripwithTimeline = async (tripId, driverId, otp, tripTimelineObj) => {
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            {
                $set: { driverId: new ObjectId(driverId), status: 'ACCEPTED', otp: otp },
                $push: { tripTimeline: tripTimelineObj }
            }
        );
        return result;
    }
    static cancelTrip = async (tripId, reason, role) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { status: RideStatus.CANCELLED, cancelReason: reason, cancelledBy: role });
        return result;
    }
    static cancelTripwithTimeline = async (tripId, reason, role, tripTimelineObj) => {
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            {
                $set: { status: RideStatus.CANCELLED, cancelReason: reason, cancelledBy: role },
                $push: { tripTimeline: tripTimelineObj }
            }
        );
        return result;
    }

    static getTripById = async (tripId) => {
        const result = await Mongo.findOne(COLLECTION_NAME, { _id: new ObjectId(tripId) });
        return result;
    }

    static resetToDriverAssign = async (tripId) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { driverId: null, status: RideStatus.PENDING, otp: null, bookingTime: new Date().getTime() });
        return result;
    }

    static getTripsForPassanger = async (filter, page = 1, limit = 10) => {
        const queryFilter = { ...filter };
        if (queryFilter.status === 'ALL') {
            delete queryFilter.status;
        } else if (queryFilter.status === 'COMPLETED') {
            // If status is COMPLETED, match both COMPLETED and DIVERGED
            queryFilter.status = { $in: ['COMPLETED', 'DIVERGED'] };
        }

        function buildDriverIdMatch(driverId) {
            const ids = [];
          
            // if coming as ObjectId
            if (driverId instanceof ObjectId) {
              ids.push(driverId);
              ids.push(driverId.toString());
              return { $in: ids };
            }
          
            // if coming as string
            if (typeof driverId === "string") {
              ids.push(driverId); // match string stored docs
              if (ObjectId.isValid(driverId)) ids.push(new ObjectId(driverId)); // match ObjectId stored docs
              return { $in: ids };
            }
          
            // fallback
            return driverId;
        }

        if (queryFilter.driverId) {
            queryFilter.driverId = buildDriverIdMatch(queryFilter.driverId);
        }
        
        const pipeline = [
            { $match: queryFilter },
            { $sort: { bookingTime: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ];

        console.log("Query filter for getTripsForPassanger", pipeline);
 
        const result = await Mongo.aggregate(COLLECTION_NAME, pipeline);
        const totalCount = await Mongo.countDocuments(COLLECTION_NAME, queryFilter);
        return { trips: result, totalCount };
    }

    static getTripByPassangerCurrentTrip = async (passangerId) => {
        const result = await Mongo.findOneSorted(COLLECTION_NAME, { passangerId: new ObjectId(passangerId), status: { $in: [RideStatus.PENDING, RideStatus.ACCEPTED, RideStatus.PICKEDUP, RideStatus.DROPPED, RideStatus.CANCELLED] } }, { bookingTime: -1 } );
        return result;
    }

    static updateTripFinalFareData = async (tripId, fareDetails) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { fareDetails });
        return result;
    }

    static updateTripMediaData = async (tripId, setFields) => {
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            { $set: setFields }
        );
        return result;
    }

    static updateBillApproval = async (tripId, billIndex, approval) => {
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            { $set: { [`bills.bills.${billIndex}.approval`]: approval } }
        );
        return result;
    }

    static pushBillToTrip = async (tripId, bill) => {
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            { $push: { 'bills.bills': bill } }
        );
        return result;
    }

    static removeBillFromTrip = async (tripId, billId) => {
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            { $pull: { 'bills.bills': { billId } } }
        );
        return result;
    }

    static updateBillByIndex = async (tripId, billIndex, fields) => {
        const setObj = {};
        Object.keys(fields).forEach(k => {
            setObj[`bills.bills.${billIndex}.${k}`] = fields[k];
        });
        return Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            { $set: setObj }
        );
    }

    static removeBillFromTripByIndex = async (tripId, idx) => {
        const unsetField = `bills.bills.${idx}`;
        await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            { $unset: { [unsetField]: 1 } }
        );
        return Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            { $pull: { 'bills.bills': null } }
        );
    }

    static getTripWithPassangerDetails = async (tripId) => {
        const groupQuery = [
            {$match: { '_id': new ObjectId(tripId)} },
            {$lookup: {from: "passangers", localField: "passangerId", foreignField: "_id", 
                as: "passangerDetails", 
                pipeline: [
                    {
                        '$project': {
                            '_id': 1,
                            'email': 1,
                            'phone': 1,
                            'name': 1,
                            'gender': 1
                        }
                    }
                ]}},
            { 
                '$unwind': { path: "$passangerDetails", preserveNullAndEmptyArrays: true } // Convert array to object
            }
        ];
        const trips = await Mongo.aggregate(COLLECTION_NAME, groupQuery)
        return trips
    }

    static getTrips = async (filter) => {
        const query = { ...filter };
        let page;
        let skip = 0;
        let limit = 10;

        if (filter?.tripId) query['_id'] = new ObjectId(filter.tripId);
        if (filter?.driverId) query['driverId'] = new ObjectId(filter.driverId);
        if (filter?.vehicleId) query['vehicleId'] = new ObjectId(filter.vehicleId);
        if (filter?.passangerId) query['passangers'] = new ObjectId(filter.passangerId);
        if (filter?.vendorId) query['vendorId'] = new ObjectId(filter.vendorId);
        if (filter?.startDate)
            query.startTime = { $gte: parseInt(filter.startDate, 10) };

        if (filter?.endDate)
            query.endTime = { $lte: parseInt(filter.endDate, 10) };

        if (filter?.page) {
            page = parseInt(filter?.page, 10);
            limit = filter?.limit ? parseInt(filter?.limit, 10) : limit;
            skip = (page - 1) * limit;
        }

        delete query.passangerId;
        delete query.startDate;
        delete query.endDate;
        delete query.tripId;
        delete query.page;
        delete query.limit;

        const pipeline = [
            { '$match': query },
            //sort
            { '$sort': { 'startTime': -1 } },
            // Pagination logic
            { $skip: skip }, // Skip previous pages
            { $limit: limit },
            {
                '$lookup': {
                    'from': 'drivers',
                    'localField': 'driverId',
                    'foreignField': '_id',
                    'as': 'driverData',
                    'pipeline': [
                        {
                            '$project': {
                                '_id': 1,
                                'email': 1,
                                'phone': 1,
                                'name': 1,
                                'gender': 1
                            }
                        }
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'devices',
                    'localField': 'vehicleId',
                    'foreignField': '_id',
                    'as': 'vehicleData',
                    'pipeline': [
                        {
                            '$project': {
                                '_id': 1,
                                'name': 1,
                                'deviceInfo': 1,
                                'liveStats': 1,
                                'location': 1
                            }
                        }
                    ]
                }
            },
            {
                '$lookup': {
                    'from': 'passangers',
                    'localField': 'passangers',
                    'foreignField': '_id',
                    'as': 'passangerData',
                    'pipeline': [
                        {
                            '$project': {
                                '_id': 1,
                                'email': 1,
                                'name': 1,
                                'phone': 1,
                                'gender': 1
                            }
                        }
                    ]
                }
            },
            {
                '$set': {
                    'stops': {
                        '$map': {
                            'input': '$stops',
                            'as': 'stop',
                            'in': {
                                '$mergeObjects': [
                                    '$$stop', {
                                        'passangers': {
                                            '$map': {
                                                'input': '$$stop.passangers',
                                                'as': 'passengerId',
                                                'in': {
                                                    '$arrayElemAt': [
                                                        {
                                                            '$filter': {
                                                                'input': '$passangerData',
                                                                'as': 'passenger',
                                                                'cond': {
                                                                    '$eq': [
                                                                        {
                                                                            '$toString': '$$passenger._id'
                                                                        }, '$$passengerId'
                                                                    ]
                                                                }
                                                            }
                                                        }, 0
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                '$unwind': {
                    'path': '$driverData',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$unwind': {
                    'path': '$vehicleData',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$project': {
                    '_id': 1,
                    'rideGroupId': 1,
                    'rideGroupName': 1,
                    'routeId': 1,
                    'routeName': 1,
                    'routeType': 1,
                    'timezone': 1,
                    'startTime': 1,
                    'endTime': 1,
                    'startLocation': 1,
                    'endLocation': 1,
                    'userId': 1,
                    'createdOn': 1,
                    'createdBy': 1,
                    'status': 1,
                    'driverData': 1,
                    'vehicleData': 1,
                    'passangerData': 1,
                    'stops': 1,
                    'stopsCount': 1
                }
            }
        ]

        const result = await Mongo.aggregate(COLLECTION_NAME, pipeline)
        const count = await Mongo.aggregate(COLLECTION_NAME, [
            { $match: query },
            { $count: "totalRecords" }
        ])
        return { result, count: count[0]?.totalRecords || 0, page, limit }
    }

    static getTripCounts = async ( userId ) => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
    
        const pipeline = [
            {
                $match: {
                    userId: userId
                }
            },
            {
                $group: {
                    _id: null,
                    totalTrips: { $sum: 1 },
                    todayTrips: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gte: ["$startTime", todayStart.getTime()] },
                                        { $lte: ["$startTime", todayEnd.getTime()] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    activeTrips: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "active"] },
                                1,
                                0
                            ]
                        }
                    },
                    completedTrips: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "completed"] },
                                1,
                                0
                            ]
                        }
                    },
                    scheduledTrips: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "scheduled"] },
                                1,
                                0
                            ]
                        }
                    },
                    cancelledTrips: {
                        $sum: {
                            $cond: [
                                { $in: ["$status", ["inactive", "cancelled"]] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalTrips: 1,
                    todayTrips: 1,
                    activeTrips: 1,
                    completedTrips: 1,
                    scheduledTrips: 1,
                    cancelledTrips: 1
                }
            }
        ];
        
    
        const result = await Mongo.aggregate(COLLECTION_NAME, pipeline);
        return (
            result[0] || {
                totalTrips: 0,
                todayTrips: 0,
                activeTrips: 0,
                completedTrips: 0,
                scheduledTrips: 0,
                cancelledTrips: 0
            }
        );
    };
    

    static updatePickupOrDropPasasngers = async (tripId, data, stopNumber, action) => {
        const result = await Mongo.updateOne(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            {
                [`stops.${stopNumber - 1}.${action}PassengerCount`]: data.length,
                [`stops.${stopNumber - 1}.${action}PassengersData`]: data
            }
        );
        return result;
    }

    static setDriverForUpcomingTrips = async (vehicleId, driverId) => {
        const result = await Mongo.updateMany(COLLECTION_NAME, { vehicleId: new ObjectId(vehicleId), status: "scheduled" }, { driverId: new ObjectId(driverId) });
        return result;
    }

    static checkTripForDuplicates = async (data) => {
        const result = await Mongo.findOne(COLLECTION_NAME, data);
        return result;
    }
    static updateTripFare = async (tripId, fare) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { currentFare: fare });
        return result;
    }

    static updateTripStops = async (tripId, stops) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { stops: stops });
        return result;
    }
    static updateStopsRequest = async (tripId, requestdata) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { stopChangeRequest: requestdata });
        return result;
    }
    static updateStartLocation = async (tripId, startLocation) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { startLocation: startLocation });
        return result;
    }
    static updateEndLocation = async (tripId, endLocation) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { endLocation: endLocation });
        return result;
    }
    static updateTripFinalInfo = async (tripId, status, duration, distance, totalWatingTime, stopNumber, encodedData) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { 
            status,
            finalDuration: duration, 
            finalDistance: distance, 
            driverWaitTime: totalWatingTime,
            [`stops.${stopNumber}.isReached`]: true,
            [`stops.${stopNumber}.arrivalTime`]: new Date().getTime(),
            [`stops.${stopNumber}.updatedAt`]: new Date().getTime(),
            [`stops.${stopNumber}.driverWaitTime`]: totalWatingTime,
            [`stops.${stopNumber}.waitingTime`]: 0,
            [`stops.${stopNumber}.stopUpdated`]: true,
            encodedPolyline: encodedData
        });
        return result;
    }
    static updateTripFinalInfowithTimeline = async (tripId, status, duration, distance, totalWatingTime, stopNumber, encodedData, tripTimelineObj) => {
        const result = await Mongo.updateOneRaw(COLLECTION_NAME, { _id: new ObjectId(tripId) }, 
            {
                $set: { 
                    status,
                    finalDuration: duration, 
                    finalDistance: distance, 
                    driverWaitTime: totalWatingTime,
                    [`stops.${stopNumber}.isReached`]: true,
                    [`stops.${stopNumber}.arrivalTime`]: new Date().getTime(),
                    [`stops.${stopNumber}.updatedAt`]: new Date().getTime(),
                    [`stops.${stopNumber}.driverWaitTime`]: totalWatingTime,
                    [`stops.${stopNumber}.waitingTime`]: 0,
                    [`stops.${stopNumber}.stopUpdated`]: true,
                    encodedPolyline: encodedData
                },
                $push: { tripTimeline: tripTimelineObj }
    
            });
        return result;
    }

    static updateCancelTripFinalInfo = async (tripId, status, reason, duration, distance, totalWatingTime, encodedData, role, tripTimelineObj) => {
        const result = await Mongo.updateOneRaw(COLLECTION_NAME, { _id: new ObjectId(tripId) }, 
            {
                $set: { 
                    status,
                    finalDuration: duration, 
                    finalDistance: distance, 
                    driverWaitTime: totalWatingTime,
                    cancelReason: reason,
                    encodedPolyline: encodedData,
                    cancelledBy: role
                },
                $push: { tripTimeline: tripTimelineObj }
            });
        return result;
    }

    static updateTripDriverRating = async (tripId, rating) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { driverRating: rating });
        return result;
    }
    static updateTripPassengerRating = async (tripId, rating) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { passengerRating: rating });
        return result;
    }

    static updateCancelledMeta = async (tripId, data) => {
        const payload = {};
        if (data && data.cancelledLoc) payload.cancelledLoc = data.cancelledLoc;
        if (data && data.cancelledAt) payload.cancelledAt = data.cancelledAt;
        if (Object.keys(payload).length === 0) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, payload);
        return result;
    }

    static updateReachedForTrip = async (tripId, isReached, stopNumber, driverWaitTime, stopUpdated) => {
        const result = await Mongo.updateOne(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            {
                [`stops.${stopNumber}.isReached`]: isReached,
                [`stops.${stopNumber}.arrivalTime`]: new Date().getTime(),
                [`stops.${stopNumber}.updateAt`]: new Date().getTime(),
                [`stops.${stopNumber}.driverWaitTime`]: driverWaitTime,
                [`stops.${stopNumber}.stopUpdated`]: stopUpdated,
            }
        );
        return result
    }

    static updateWaitTimeForTrip = async (tripId, stopNumber, driverWaitTime, stopUpdated) => {
        const result = await Mongo.updateOne(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            {
                [`stops.${stopNumber}.driverWaitTime`]: driverWaitTime,
                [`stops.${stopNumber}.updateAt`]: new Date().getTime(),
                [`stops.${stopNumber}.stopUpdated`]: stopUpdated,
            }
        );
        return result
    }

    static updateTripStopChangesInfo = async (tripId, status, estimatedDuration, estimatedDistance, estimatedFare, ) => {
        let payloadToUpload ={}
        if (status === 'accept') {
            payloadToUpload = {
                estimatedDuration: estimatedDuration,
                estimatedDistance: estimatedDistance,
                estimatedFare: estimatedFare,
                ["stopChangeRequest.status"]: status
            }
        }else {
            payloadToUpload = {
                ["stopChangeRequest.status"]: status
            }
        }
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, payloadToUpload);
        return result;
    }

    static updateOnlineTripStatus = async (tripId, status, paymentType) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { status, paymentMethod: paymentType || 'OFFLINE'});
        return result;
    }
    static getScheduleTrips = async () => {
        const pipeline = [
            { $match: { isScheduledTrip: true, status: 'SCHEDULED' } },
          
            {
                $lookup: {
                    from: 'drivers',
                    localField: 'driverId',
                    foreignField: '_id',
                    as: 'driverData',
                    pipeline: [
                        { $project: { _id: 1, email: 1, phone: 1, name: 1, gender: 1, vehicleId: 1, documents: 1 } }
                    ]
                }
            },
          
            // Unwind driver first so vehicleId is a single value
            { $unwind: { path: '$driverData', preserveNullAndEmptyArrays: true } },
          
            {
                $lookup: {
                    from: 'vehicles',
                    let: { vId: '$driverData.vehicleId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        '$_id',
                                        {
                                            // If vId is already an ObjectId, use it; else cast from string
                                            $cond: [
                                                { $eq: [{ $type: '$$vId' }, 'objectId'] },
                                                '$$vId',
                                                { $toObjectId: '$$vId' }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $project: { _id: 1, regNo: 1, color: 1, type: 1, make: 1, model: 1 } }
                    ],
                    as: 'vehicleData'
                }
            },
          
            { $unwind: { path: '$vehicleData', preserveNullAndEmptyArrays: true } }
        ];
        const result = await Mongo.aggregate(COLLECTION_NAME, pipeline);
        return result || [];
    }

    static updateDurationExceededTripStatusByPassanger = async (tripId, status, reasonCode) => {
        try {
            if (!tripId) throw new Error('tripId is required');
            if (!ObjectId.isValid(tripId)) throw new Error('Invalid tripId');
            if (!status) throw new Error('status is required');
            if (!Object.values(RideStatus).includes(status)) throw new Error('Invalid status');

            const result = await Mongo.updateOne(
                COLLECTION_NAME,
                { _id: new ObjectId(tripId) },
                { status, verificationNeeded: true, isDurationExceededTrip: true, cancelReasonCode: reasonCode }
            );

            if (!result?.acknowledged) throw new Error('Update not acknowledged');
            if (result.matchedCount === 0) throw new Error('Trip not found');

            return result;
        } catch (err) {
            throw new Error(`Failed to update duration-exceeded status: ${err.message}`);
        }
    }

    static getMultipleTripsDetail = async (tripId) => {
        tripId = tripId.map(id => new ObjectId(id))
        const result = await Mongo.find(COLLECTION_NAME, { _id: { $in: tripId } });
        return result;
    }

    static getdriverAllocatedForTrip = async (tripId) => {
        const result = await Mongo.findOneProjection(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { _id: 0, driverId: 1 });
        return result?.driverId;
    }
    static getDailyTrips = async (startDate, endDate) => {
        const startMs = startDate instanceof Date ? startDate.getTime() : Number(startDate);
        const endMs = endDate instanceof Date ? endDate.getTime() : Number(endDate);

        if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
            throw new Error('Invalid start/end date for getDailyTrips');
        }

        const pipeline = [
            {
                $match: {
                    startTime: { $gte: startMs, $lte: endMs }
                }
            },
            {
                $group: {
                    _id: { $toUpper: { $ifNull: ['$status', 'UNKNOWN'] } },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    status: '$_id',
                    count: 1
                }
            }
        ];

        const result = await Mongo.aggregate(COLLECTION_NAME, pipeline);
        return result;
    }

    static getPassengerStats = async (passengerId) => {
        const pipeline = [
            {
                $match: {
                    createdBy: passengerId
                }
            },
            {
                $group: {
                    _id: null,
                    totalTrips: { $sum: 1 },
                    completedTrips: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "COMPLETED"] },
                                1,
                                0
                            ]
                        }
                    },
                    cancelledTrips: {
                        $sum: {
                            $cond: [
                                { $in: ["$status", ["CANCELLED", "DIVERGED", "FAILED"]] },
                                1,
                                0
                            ]
                        }
                    },
                    completedAndDivergedTrips: {
                        $push: {
                            $cond: [
                                { $in: ["$status", ["COMPLETED", "DIVERGED"]] },
                                "$_id",
                                null
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalTrips: 1,
                    completedTrips: 1,
                    cancelledTrips: 1,
                    completedAndDivergedTrips: {
                        $filter: {
                            input: "$completedAndDivergedTrips",
                            as: "trip",
                            cond: { $ne: ["$$trip", null] }
                        }
                    }
                }
            }
        ];

        const result = await Mongo.aggregate(COLLECTION_NAME, pipeline);

        if (result.length === 0) {
            return {
                totalTrips: 0,
                completedTrips: 0,
                cancelledTrips: 0,
                totalSpends: 0
            };
        }

        const { totalTrips, completedTrips, cancelledTrips, completedAndDivergedTrips } = result[0];

        const payments = await Mongo.aggregate('publicRidesPayments', [
            {
                $match: {
                    tripId: { $in: completedAndDivergedTrips }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSpends: { $sum: "$fareDetails.fare" }
                }
            }
        ]);

        return {
            totalTrips,
            completedTrips,
            cancelledTrips,
            totalSpends: payments.length > 0 ? payments[0].totalSpends : 0
        };
    };
    static addPaymentIssues = async (tripId, status, issueData) => {
        try {
            if (!tripId) throw new Error('tripId is required');
            if (!ObjectId.isValid(tripId)) throw new Error('Invalid tripId');
            if (!status) throw new Error('status is required');
            if (!Object.values(RideStatus).includes(status)) throw new Error('Invalid status');
            if (issueData === undefined || issueData === null) throw new Error('issueData is required');

            if (typeof issueData !== 'string') throw new Error('issueData must be a string');
            const issueText = issueData.trim();
            if (!issueText) throw new Error('issueData cannot be empty');

            const result = await Mongo.updateOne(
                COLLECTION_NAME,
                { _id: new ObjectId(tripId) },
                { passengerPaymentIssue: issueText, status, isPaymentIssue: true, verificationNeeded: true }
            );

            if (!result?.acknowledged) throw new Error('Update not acknowledged');
            if (result.matchedCount === 0) throw new Error('Trip not found');

            return result;
        } catch (err) {
            throw new Error(`Failed to update payment issues: ${err.message}`);
        }
    }   

    static updateHarshDrivingStats = async (tripId, harshBreaking, harshAcceleration, harshCornering, overspeeding) => {
        const pushFields = {};
        if (harshBreaking && harshBreaking.length > 0) {
            pushFields["harshDriving.harshBreaking"] = { $each: harshBreaking };
        }
        if (harshAcceleration && harshAcceleration.length > 0) {
            pushFields["harshDriving.harshAcceleration"] = { $each: harshAcceleration };
        }
        if (harshCornering && harshCornering.length > 0) {
            pushFields["harshDriving.harshCornering"] = { $each: harshCornering };
        }
        if (overspeeding && overspeeding.length > 0) {
            pushFields["harshDriving.overspeeding"] = { $each: overspeeding };
        }
        if (Object.keys(pushFields).length === 0) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
        const result = await Mongo.updateOneRaw(
            COLLECTION_NAME,
            { _id: new ObjectId(tripId) },
            { $push: pushFields }
        );
        return result;
    }

    static updatePassengerNotificationPreferences = async (tripId, notificationPreferences) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { passengerNotificationPreferences: notificationPreferences });
        return result;
    }

    static updateLastSpeedAlertTime = async (tripId, timestamp) => {
        const result = await Mongo.updateOne(COLLECTION_NAME, { _id: new ObjectId(tripId) }, { lastSpeedAlertTime: timestamp });
        return result;
    }
}

module.exports = Trip;