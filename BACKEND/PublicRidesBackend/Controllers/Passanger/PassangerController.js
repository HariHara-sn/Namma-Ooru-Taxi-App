const Controller = require("../Controller");
const PublicRidePassangerController = require("./PublicRidePassangerController");
const ActingDriverCustomerController = require("./ActingDriverCustomerController");

class PassangerController extends Controller {
  constructor() {
    super();

    /* PUBLIC RIDES SECTIONS */
    this.publicridesSignupCustomer = this.publicridesSignupCustomer.bind(this);
    this.publicridesLoginCustomer = this.publicridesLoginCustomer.bind(this);
    this.publicridesVerifyOTP = this.publicridesVerifyOTP.bind(this);
    this.publicridesResendOTP = this.publicridesResendOTP.bind(this);
    this.publicridesGetRideEstimations =
      this.publicridesGetRideEstimations.bind(this);
    this.publicridesBookTrip = this.publicridesBookTrip.bind(this);
    this.publicridesBookActingDriverTrip =
      this.publicridesBookActingDriverTrip.bind(this);
    this.publicridesGetTrip = this.publicridesGetTrip.bind(this);
    // Only one Trip details
    this.getActingDriverTrip = this.getActingDriverTrip.bind(this);
    // All ActingDriver Trip details
    this.getActingDriverTrips = this.getActingDriverTrips.bind(this);
    this.publicridesGetTrips = this.publicridesGetTrips.bind(this);
    this.publicridesGetUserStats = this.publicridesGetUserStats.bind(this);
    this.publicridesUpdatePassangerProfile =
      this.publicridesUpdatePassangerProfile.bind(this);
    this.publicridesAvaliableVehicleInfo =
      this.publicridesAvaliableVehicleInfo.bind(this);

    this.publicridesGetPassengerAvaliableCoupons =
      this.publicridesGetPassengerAvaliableCoupons.bind(this);
    this.publicridesGetNearByDrivers =
      this.publicridesGetNearByDrivers.bind(this);
    this.passangerPaymentStatusUpdate =
      this.passangerPaymentStatusUpdate.bind(this);
    this.publicridesPassengerDriverRating =
      this.publicridesPassengerDriverRating.bind(this);
    this.getPreFinalFare = this.getPreFinalFare.bind(this);
    this.publicridesAddFavPlaces = this.publicridesAddFavPlaces.bind(this);
    this.publicridesDeleteFavPlaces =
      this.publicridesDeleteFavPlaces.bind(this);
    this.getPublicRidesTicketCategories =
      this.getPublicRidesTicketCategories.bind(this);
    this.getPublicRidesPassaengerAccountDeletion =
      this.getPublicRidesPassaengerAccountDeletion.bind(this);
    this.publicridesAccountDeletionRequest =
      this.publicridesAccountDeletionRequest.bind(this);
    this.publicridesAccountDeletionRequestConfirm =
      this.publicridesAccountDeletionRequestConfirm.bind(this);
    this.publicridesGetTripPaymentDetails =
      this.publicridesGetTripPaymentDetails.bind(this);
    this.publicridesTestSimulateDriver =
      this.publicridesTestSimulateDriver.bind(this);
    this.sendPassangerTestPushNotification =
      this.sendPassangerTestPushNotification.bind(this);
    this.addEmergencyContact = this.addEmergencyContact.bind(this);
    this.getEmergencyContacts = this.getEmergencyContacts.bind(this);
    this.removeEmergencyContact = this.removeEmergencyContact.bind(this);
    this.confirmTripStatusByPassanger =
      this.confirmTripStatusByPassanger.bind(this);
    this.publicridesSubmitFeedback = this.publicridesSubmitFeedback.bind(this);
    this.passengerPaymentIssues = this.passengerPaymentIssues.bind(this);
    this.updatePassangerFCMToken = this.updatePassangerFCMToken.bind(this);
    this.getOnboardingConfig = this.getOnboardingConfig.bind(this);
    this.approveBill = this.approveBill.bind(this);
    this.manageGarageCreate = this.manageGarageCreate.bind(this);
    this.manageGarageList = this.manageGarageList.bind(this);
    this.manageGarageUpdate = this.manageGarageUpdate.bind(this);
    this.manageGarageDelete = this.manageGarageDelete.bind(this);
    //TripType
    // this.bookActingDriverOnewayTrip =
    //   this.bookActingDriverOnewayTrip.bind(this);
    // this.bookActingDriverRoundTrip = this.bookActingDriverRoundTrip.bind(this);
    // this.bookActingDriverOutstationTrip =
    //   this.bookActingDriverOutstationTrip.bind(this);
    // this.bookActingDriverTripByType =
    //   this.bookActingDriverTripByType.bind(this);
  }
}

PublicRidePassangerController(PassangerController);
ActingDriverCustomerController(PassangerController);
module.exports = PassangerController;
