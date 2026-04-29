const express = require('express');
const Router = express.Router();

const DriverController = require('../Controllers/Driver/DriverController');
const TripController = require('../Controllers/Trip/TripController');
const ActingDriverPublicRidesController = require('../Controllers/Driver/ActingDriverPublicRidesController');
const CheckDriverAuthenticated = require('../MiddleWares/CheckDriverAuthenticated');
const CheckAdminOrDriverAuthenticated = require('../MiddleWares/CheckAdminOrDriverAuthenticated');
const { createHandler } = require('graphql-http/lib/use/express');
const { getRecentLocationsSchema } = require('../graphql/schemas/LocationGetSchema');
const { tripLocationResolver } = require('../graphql/resolvers/TripLocationResolver');
const OCRController = require('../Controllers/OCR/OCR');
const { withTiming } = require('../Utils/timingLogger');
const LocationController = require('../Controllers/Location/LocationController');

// const CheckUserAuthenticated = require('../MiddleWares/CheckUserAuthenticated');
const driverController = new DriverController()
const tripController = new TripController()
const ocrController = new OCRController()

const locationController = new LocationController();

Router.post('/signup', withTiming(driverController, driverController.registerPublicRides))
Router.post('/sendOTP', withTiming(driverController, driverController.loginPublicRides))
Router.post('/publicridesdriverLogout', CheckDriverAuthenticated, withTiming(driverController, driverController.publicridesdriverLogout))
Router.post('/verifyOTP', withTiming(driverController, driverController.verifyPublicRidesOTP))
Router.post('/uploadDocs', CheckDriverAuthenticated, withTiming(driverController, driverController.uploadPublicRidesDocs))
Router.post('/uploadBankDetails', CheckDriverAuthenticated, withTiming(driverController, driverController.uploadPublicRidesDriverBankDetails))
Router.get('/getDriverDetails', CheckDriverAuthenticated, withTiming(driverController, driverController.getDriverDetailsPublicRides))
Router.post('/updateVehicleInformation', CheckDriverAuthenticated, withTiming(driverController, driverController.updateVehicleInformationPublicRides))
Router.post('/updateDriverDetails', CheckDriverAuthenticated, withTiming(driverController, driverController.updateDriverDetails))
Router.get('/getTrip', CheckDriverAuthenticated, withTiming(driverController, driverController.getTrip))
Router.get('/getActiveTrip', CheckDriverAuthenticated, withTiming(driverController, driverController.getActiveTrip))
Router.post('/acceptRide', CheckDriverAuthenticated, withTiming(tripController, tripController.acceptRidePublicRides))
Router.post('/getTotalFare', CheckDriverAuthenticated, withTiming(driverController, driverController.getTotalFare))
Router.post('/verifyTripOtp', CheckDriverAuthenticated, withTiming(driverController, driverController.verifyTripOtp))
Router.post('/updatePublicRidesDriverStatus', CheckDriverAuthenticated, withTiming(driverController, driverController.updatePublicRidesDriverStatus))
Router.post('/cancelTrip', CheckDriverAuthenticated, withTiming(tripController, tripController.cancelTripByDriver))
Router.post('/driverPassengerRating', CheckDriverAuthenticated, withTiming(driverController, driverController.publicridesDriverPassengerRating))
Router.post('/updatePaymentReceive', CheckDriverAuthenticated, withTiming(driverController, driverController.updatePaymentReceive))
Router.post('/updateWaypointsDriverReached', CheckDriverAuthenticated, withTiming(tripController, tripController.updateWaypointsDriverReached));
Router.post('/updateWaypointsDriverWaitTime', CheckDriverAuthenticated, withTiming(tripController, tripController.updateWaypointsDriverWaitTime));
Router.post('/acceptPassengerStopChangeRequest', withTiming(tripController, tripController.acceptPassengerStopChangeRequest))
Router.post('/getTrips', CheckDriverAuthenticated, withTiming(driverController, driverController.publicridesGetTrips))
Router.post('/logoutFromVehicle', CheckDriverAuthenticated, withTiming(driverController, driverController.logoutFromVehicle))
Router.get('/getAvailabelVendorVehicle', CheckDriverAuthenticated, withTiming(driverController, driverController.getAvailabelVendorVehicle))
Router.post('/updateDriverVehicle', CheckDriverAuthenticated, withTiming(driverController, driverController.updateDriverVehicle))
Router.get('/getAvailabelVehicle', CheckDriverAuthenticated, withTiming(driverController, driverController.getAvailabelVehicle))
Router.get('/getTicketCategories', CheckDriverAuthenticated, withTiming(driverController, driverController.getPublicRidesTicketCategories))
Router.get('/getDriverWrkHistory', CheckDriverAuthenticated, withTiming(driverController, driverController.getPublicDriverWrkHistory))
Router.post('/driverDeleteAccount', CheckDriverAuthenticated, withTiming(driverController, driverController.driverDeleteAccount))
Router.get('/sendUnblockRequest', CheckDriverAuthenticated, withTiming(driverController, driverController.sendUnblockRequest))
Router.post('/updateDriverMovements', CheckDriverAuthenticated, withTiming(driverController, driverController.updateDriverMovements))
Router.get('/requestEditDocuments', CheckDriverAuthenticated, withTiming(driverController, driverController.requestEditDocuments))
Router.post('/blockDriver', CheckDriverAuthenticated, withTiming(driverController, driverController.publicridesBlockDriver))
Router.post('/alertPassangerPickup', CheckDriverAuthenticated, withTiming(tripController, tripController.alertPassangerPickup))
Router.post('/razorpay/link', CheckAdminOrDriverAuthenticated, withTiming(driverController, driverController.razorpayLink))
Router.post('/inititateMaskedCall', CheckDriverAuthenticated, withTiming(tripController, tripController.makeMaskedCall))
Router.post('/updateDriverDynamicData', CheckDriverAuthenticated, withTiming(driverController, driverController.updateDriverDynamicData))
Router.post('/revokeAccountDeletion', CheckDriverAuthenticated, withTiming(driverController, driverController.revokeAccountDeletion))
Router.post('/driverAppConfig', CheckDriverAuthenticated, withTiming(driverController, driverController.driverAppConfig))
Router.post('/notDriverAppConfig', CheckDriverAuthenticated, withTiming(driverController, driverController.notDriverAppConfig))
Router.post('/getDueInvoice', CheckDriverAuthenticated, withTiming(driverController, driverController.getDueInvoice))
Router.post('/updateNextDueDate', CheckDriverAuthenticated, withTiming(driverController, driverController.updateNextDueDate))
Router.get('/getFareConfigs', CheckDriverAuthenticated, driverController.getFareConfigs)
Router.post('/acceptUpComingRide', CheckDriverAuthenticated, withTiming(tripController, tripController.acceptUpComingRidePublicRides))
Router.post('/startUpComingRidePublicRides', CheckDriverAuthenticated, withTiming(tripController, tripController.startUpComingRidePublicRides))
Router.post('/getMultipleTripsDetail', CheckDriverAuthenticated, withTiming(driverController, driverController.getMultipleTripsDetail))
Router.post('/getWorkLog', CheckDriverAuthenticated, withTiming(driverController, driverController.getWorkLog))

// new driverEntry Fields
Router.post('/updatePreferredWorkLocation', CheckDriverAuthenticated, withTiming(driverController, driverController.updatePreferredWorkLocation))
Router.post('/updateDriverInfo', CheckDriverAuthenticated, withTiming(driverController, driverController.updateDriverInfo))
Router.post('/updateDriverVehicleInfo', CheckDriverAuthenticated, withTiming(driverController, driverController.updateDriverVehicleInfo))
Router.post('/updateDriverProof', CheckDriverAuthenticated, withTiming(driverController, driverController.updateDriverProof))
Router.post('/verifyUPI', CheckDriverAuthenticated, withTiming(driverController, driverController.verifyUPI))
Router.post('/updateDriverVehicleProof', CheckDriverAuthenticated, withTiming(driverController, driverController.updateDriverVehicleProof))
Router.get('/checkDriverToken', CheckDriverAuthenticated, withTiming(driverController, driverController.checkDriverToken))
Router.post('/updateFCMToken', CheckDriverAuthenticated, withTiming(driverController, driverController.updateFCMToken))
// OCR
Router.post('/scanDoc', CheckDriverAuthenticated, withTiming(driverController, ocrController.scanDocument))

Router.post('/wakeUpBGService', CheckDriverAuthenticated, withTiming(driverController, driverController.wakeUpBGService))

Router.get('/getOnboardingConfig', CheckDriverAuthenticated, withTiming(driverController, driverController.getOnboardingConfig))
Router.post('/uploadTripMedia', CheckDriverAuthenticated, withTiming(tripController, tripController.uploadTripMedia));
Router.post('/deleteTripBill', CheckDriverAuthenticated, withTiming(tripController, tripController.deleteTripBill));
Router.post('/editTripBill', CheckDriverAuthenticated, withTiming(tripController, tripController.editTripBill));
Router.post('/addTripLocation', CheckDriverAuthenticated, locationController.addTripLocationDriver);
// graphql for publicRidesDriver
Router.post('/graphql/location', CheckDriverAuthenticated, withTiming(null, createHandler({
    schema: getRecentLocationsSchema,
    rootValue: tripLocationResolver,
    graphiql: true,
})))

module.exports = Router