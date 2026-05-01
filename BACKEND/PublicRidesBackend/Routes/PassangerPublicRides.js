const express = require('express');
const Router = express.Router();

const PassangerController = require('../Controllers/Passanger/PassangerController');
const CheckPassangerAuthenticated = require('../MiddleWares/CheckPassangerAuthenticated');
const TripController = require('../Controllers/Trip/TripController');
const passangerController = new PassangerController()
const tripController = new TripController()
const { createHandler } = require('graphql-http/lib/use/express');
const { getRecentLocationsSchema } = require('../graphql/schemas/LocationGetSchema');
const { locationResolver } = require('../graphql/resolvers/LocationResolver');
const SOSController = require('../Controllers/SOS/SOSController');
const sosController = new SOSController();
const { withTiming } = require('../Utils/timingLogger');

Router.get('/', (req, res) => {
    res.send('Hello from Passanger Public Rides API - Backend HARIHARASUDHAN');
});

Router.post('/signup', withTiming(passangerController, passangerController.publicridesSignupCustomer))
Router.post('/login', withTiming(passangerController, passangerController.publicridesLoginCustomer))
Router.post('/updatePassengerProfile', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesUpdatePassangerProfile))
Router.post('/verifyOTP', withTiming(passangerController, passangerController.publicridesVerifyOTP))
Router.post('/resendOTP', withTiming(passangerController, passangerController.publicridesResendOTP))
Router.post('/bookTrip', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesBookTrip))
Router.post('/bookActingDriverTrip', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesBookActingDriverTrip))
Router.get('/getTrip', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesGetTrip))
Router.get('/getTrips', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesGetTrips))
Router.post('/getRideEstimation', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesGetRideEstimations))
Router.get('/getUserStats', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesGetUserStats))
Router.post('/cancelTrip', CheckPassangerAuthenticated, withTiming(tripController, tripController.cancelTripPublicRides))
Router.post('/getPassengerAvaliableCoupons', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesGetPassengerAvaliableCoupons))
Router.get('/getNearByDrivers', withTiming(passangerController, passangerController.publicridesGetNearByDrivers))
Router.post('/tripStopsChange', CheckPassangerAuthenticated, withTiming(tripController, tripController.TripStopsChange))
Router.post('/getPublicRidesTripStatus', CheckPassangerAuthenticated, withTiming(tripController, tripController.getpublicRidesTripStatus))
Router.post('/paymentStatusUpdate', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.passangerPaymentStatusUpdate))
Router.post('/passengerDriverRating', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesPassengerDriverRating))
Router.post('/getPreFinalFare', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.getPreFinalFare))
Router.post('/passangerStopChangeRequest', CheckPassangerAuthenticated, withTiming(tripController, tripController.passengerStopChangeRequest))
Router.post('/addFavPlaces', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesAddFavPlaces))
Router.post('/deleteFavPlaces', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesDeleteFavPlaces))
Router.post('/rideCancelByPassenger', CheckPassangerAuthenticated, withTiming(tripController, tripController.cancelTripByPassenger))
Router.get('/getTicketCategories', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.getPublicRidesTicketCategories))
Router.post('/getPassengerAccountDeletion', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.getPublicRidesPassaengerAccountDeletion))
Router.post('/accountDeletionRequest', withTiming(passangerController, passangerController.publicridesAccountDeletionRequest))
Router.post('/accountDeletionRequest/confirm', withTiming(passangerController, passangerController.publicridesAccountDeletionRequestConfirm))
Router.post('/submitFeedback', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesSubmitFeedback))
Router.get('/getTripPaymentDetails', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesGetTripPaymentDetails))
Router.post('/testSimulateDriver', withTiming(passangerController, passangerController.publicridesTestSimulateDriver))
Router.post('/sendTestPushNotification', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.sendPassangerTestPushNotification))
Router.get('/getAvaliableVehicleInfo', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.publicridesAvaliableVehicleInfo))
Router.post('/makeMaskedCallToDriver', CheckPassangerAuthenticated, withTiming(tripController, tripController.makeMaskedCall))
Router.post('/addEmergencyContact', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.addEmergencyContact))
Router.get('/getEmergencyContacts', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.getEmergencyContacts))
Router.post('/removeEmergencyContact', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.removeEmergencyContact))
Router.post('/passengerPaymentIssues', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.passengerPaymentIssues))
Router.post('/updateFCMToken', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.updatePassangerFCMToken))
Router.post('/graphql/location', CheckPassangerAuthenticated, withTiming(null, createHandler({
    schema: getRecentLocationsSchema,
    rootValue: locationResolver,
    graphiql: true,
})))
Router.post('/sosTriggered', CheckPassangerAuthenticated, withTiming(sosController, sosController.SosTriggered))
Router.post('/sos/tracking/update', CheckPassangerAuthenticated, withTiming(sosController, sosController.updateSosTrackingData))
Router.get('/sos/tracking', withTiming(sosController, sosController.getSosTrackingData))
Router.get('/sos/details', withTiming(sosController, sosController.getSosEventDetails))
Router.post('/sos/stop', CheckPassangerAuthenticated, withTiming(sosController, sosController.stopSosTracking))
Router.post('/confirmTripStatus', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.confirmTripStatusByPassanger))
Router.get('/getPassengerTripStats', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.getPassengerTripStats))
Router.post('/updatePassangerVehicle', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.updatePassangerVehicle))
Router.get('/getPassangerVehicles', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.getPassangerVehicles))
Router.post('/editPassangerVehicle', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.editPassangerVehicle))
Router.post('/deletePassangerVehicle', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.deletePassangerVehicle))
Router.get('/getOnboardingConfig', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.getOnboardingConfig))
Router.post('/approveBill', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.approveBill))
Router.post('/markBillAsPaid', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.markBillAsPaid))
Router.post('/uploadPaymentReceipt', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.uploadPaymentReceipt))
Router.post('/updateNotificationPreferences', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.updateNotificationPreferences))
Router.post('/manageGarage', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.manageGarageCreate))
Router.get('/manageGarage', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.manageGarageList))
Router.put('/manageGarage/:vehicleId', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.manageGarageUpdate))
Router.delete('/manageGarage/:vehicleId', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.manageGarageDelete))
Router.post('/actingDriver/onewayTrip', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.bookActingDriverOnewayTrip))
Router.post('/actingDriver/roundTrip', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.bookActingDriverRoundTrip))
Router.post('/actingDriver/outstationTrip', CheckPassangerAuthenticated, withTiming(passangerController, passangerController.bookActingDriverOutstationTrip))
module.exports = Router
