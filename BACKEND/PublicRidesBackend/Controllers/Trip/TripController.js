
const Controller = require('../Controller');
const TripPublicRideController = require('./TripPublicRideController');


class TripController extends Controller {

    constructor() {
        super();

        this.acceptRidePublicRides = this.acceptRidePublicRides.bind(this);
        // this.cancelTripPublicRides = this.cancelTripPublicRides.bind(this);
        this.TripStopsChange = this.TripStopsChange.bind(this);
        this.getpublicRidesTripStatus = this.getpublicRidesTripStatus.bind(this);
        this.updateWaypointsDriverReached = this.updateWaypointsDriverReached.bind(this);
        this.passengerStopChangeRequest = this.passengerStopChangeRequest.bind(this);
        this.updateWaypointsDriverWaitTime = this.updateWaypointsDriverWaitTime.bind(this);
        this.acceptPassengerStopChangeRequest = this.acceptPassengerStopChangeRequest.bind(this);
        this.cancelTripByDriver = this.cancelTripByDriver.bind(this)
        this.cancelTripByPassenger = this.cancelTripByPassenger.bind(this)
        this.alertPassangerPickup = this.alertPassangerPickup.bind(this)
        this.makeMaskedCall = this.makeMaskedCall.bind(this)

        this.acceptUpComingRidePublicRides = this.acceptUpComingRidePublicRides.bind(this)
        this.startUpComingRidePublicRides = this.startUpComingRidePublicRides.bind(this)
        this.cancelUpComingTrip = this.cancelUpComingTrip.bind(this)
    }

   
}

TripPublicRideController(TripController);
module.exports = TripController; 