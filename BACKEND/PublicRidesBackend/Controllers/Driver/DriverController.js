
const Controller = require('../Controller');
const ActingDriverPublicRidesController = require('./ActingDriverPublicRidesController');

const DriverPublicRidesController = require('./DriverPublicRidesController');

class DriverController extends Controller {

    constructor() {
        super()

        this.registerPublicRides = this.registerPublicRides.bind(this)
        this.loginPublicRides = this.loginPublicRides.bind(this)
        this.verifyPublicRidesOTP = this.verifyPublicRidesOTP.bind(this)
        this.uploadPublicRidesDocs = this.uploadPublicRidesDocs.bind(this)
        this.uploadPublicRidesDriverBankDetails = this.uploadPublicRidesDriverBankDetails.bind(this)
        this.getDriverDocsPublicRides = this.getDriverDocsPublicRides.bind(this)
        this.getDriverDetailsPublicRides = this.getDriverDetailsPublicRides.bind(this)
        this.updateVehicleInformationPublicRides = this.updateVehicleInformationPublicRides.bind(this)
        this.updateDriverDetails = this.updateDriverDetails.bind(this)
        this.getTrip = this.getTrip.bind(this)
        this.getActiveTrip = this.getActiveTrip.bind(this)
        this.verifyTripOtp = this.verifyTripOtp.bind(this)
        this.updatePublicRidesDriverStatus = this.updatePublicRidesDriverStatus.bind(this)
        this.getTotalFare = this.getTotalFare.bind(this);
        this.publicridesDriverPassengerRating = this.publicridesDriverPassengerRating.bind(this)
        this.updatePaymentReceive = this.updatePaymentReceive.bind(this)
        this.publicridesGetTrips = this.publicridesGetTrips.bind(this)
        this.logoutFromVehicle = this.logoutFromVehicle.bind(this)
        this.getAvailabelVendorVehicle = this.getAvailabelVendorVehicle.bind(this)
        this.updateDriverVehicle = this.updateDriverVehicle.bind(this)
        this.getAvailabelVehicle = this.getAvailabelVehicle.bind(this)
        this.updateDriverMovements = this.updateDriverMovements.bind(this)
        this.requestEditDocuments = this.requestEditDocuments.bind(this)
        this.publicridesdriverLogout = this.publicridesdriverLogout.bind(this)
        this.publicridesBlockDriver = this.publicridesBlockDriver.bind(this)
        this.driverDeleteAccount = this.driverDeleteAccount.bind(this)
        this.razorpayLink = this.razorpayLink.bind(this)
        this.updateDriverDynamicData = this.updateDriverDynamicData.bind(this)
        this.revokeAccountDeletion = this.revokeAccountDeletion.bind(this)
        this.driverAppConfig = this.driverAppConfig.bind(this)
        this.notDriverAppConfig = this.notDriverAppConfig.bind(this)
        this.getOnboardingConfig = this.getOnboardingConfig.bind(this)
        this.getDueInvoice = this.getDueInvoice.bind(this)
        this.updateNextDueDate = this.updateNextDueDate.bind(this)
        this.getFareConfigs = this.getFareConfigs.bind(this)
        this.getMultipleTripsDetail = this.getMultipleTripsDetail.bind(this)
        this.updatePreferredWorkLocation = this.updatePreferredWorkLocation.bind(this)
        this.updateDriverInfo = this.updateDriverInfo.bind(this)
        this.updateDriverVehicleInfo = this.updateDriverVehicleInfo.bind(this)
        this.updateDriverProof = this.updateDriverProof.bind(this)
        this.verifyUPI = this.verifyUPI.bind(this)
        this.updateDriverVehicleProof = this.updateDriverVehicleProof.bind(this)
        this.checkDriverToken = this.checkDriverToken.bind(this)
        this.wakeUpBGService = this.wakeUpBGService.bind(this)
        this.updateFCMToken = this.updateFCMToken.bind(this)
        this.getWorkLog = this.getWorkLog.bind(this)

        //Acting Driver
        this.verifyPublicRidesADOTP = this.verifyPublicRidesADOTP.bind(this)
        this.updateDrivingExperience = this.updateDrivingExperience.bind(this)
        this.updateActingDriverPreferredWorkLocation = this.updateActingDriverPreferredWorkLocation.bind(this)
        this.updateDriverMode = this.updateDriverMode.bind(this)
        this.acceptRideForActingDriver = this.acceptRideForActingDriver.bind(this)
    }

   
}

ActingDriverPublicRidesController(DriverController)
DriverPublicRidesController(DriverController)
module.exports = DriverController