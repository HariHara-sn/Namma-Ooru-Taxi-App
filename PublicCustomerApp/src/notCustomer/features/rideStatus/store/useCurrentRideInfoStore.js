import { create } from 'zustand';
import { TripStatus } from '../types/TripStatus';
import {utils} from '../../../utils/Utils';

const useCurrentRideInfoStore = create((set) => ({
  tripId: null,
  tripStatus: null,
  rideStartLocation: null,
  rideEndLocation: null,
  stops: [],
  duration: null,
  minFare: null,
  maxFare: null,
  totalDistance: null,
  currentDistance: null,
  otp: null,
  estArrivalTime: null,
  paymentMethod: null,
  estimatedFare:null,
  // Additional fields from trip data
  bookingFor: null,
  bookingForName: null,
  bookingForPhone: null,
  bookingTime: null,
  pickupTime: null,
  passangerCount: null,
  passangerId: null,
  vehicleType: null,
  publicRidesTrip: null,
  estimatedPickuoMins:null,
  estimatedArrivalMins:null,
  showBookingCancelModel:false,
  maxDistanceLimit:null,
  finalFare:"",
  breakdownFare:[],
  finalDuration:"",
  finalDistance:"",
  onGoingTripCancelled:null,
  bills: null,
  isActingDriverTrip: null,
  harshDriving: null,
  passengerNotificationPreferences: null,

  setTripId: (tripId) => set({ tripId }),
  setTripStatus: (tripStatus) => set({ tripStatus }),
  setRideStartLocation: (rideStartLocation) => set({ rideStartLocation }),
  setRideEndLocation: (rideEndLocation) => set({ rideEndLocation }),
  setStops: (stops) => set({ stops }),
  setDuration: (duration) => set({ duration }),
  setMinFare: (minFare) => set({ minFare }),
  setMaxFare: (maxFare) => set({ maxFare }),
  setTotalDistance: (totalDistance) => set({ totalDistance }),
  setCurrentDistance: (currentDistance) => set({ currentDistance }),
  setOtp: (otp) => set({ otp }),
  setEstArrivalTime: (estArrivalTime) => set({ estArrivalTime }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setEstimatedPickuoMins: (estimatedPickuoMins) => set({ estimatedPickuoMins }),
  setEstimatedArrivalMins: (estimatedArrivalMins) => set({ estimatedArrivalMins }),
  setBreakdownFare: (breakdownFare) => set({ breakdownFare }),
  setShowBookingCancelModel: (showBookingCancelModel) => set({ showBookingCancelModel }),
  setEstimatedFare: (estimatedFare) => set({ estimatedFare }),
  setFinalFare: (finalFare) => {
    set({finalFare})
  },
  setFinalDuration: (finalDuration) => {
    set({finalDuration})
  },
  setFinalDistance: (finalDistance) => {
    set({finalDistance})
  },
  setOngoingingTripCancelled: (onGoingTripCancelled) => {
    set({onGoingTripCancelled})
  },
  setBills: (bills) => set({ bills }),
  setPassengerNotificationPreferences: (passengerNotificationPreferences) => set({ passengerNotificationPreferences }),

  appendHarshDrivingEvents: (events) => set(state => {
    const current = state.harshDriving || { harshBreaking: [], harshAcceleration: [], harshCornering: [], overspeeding: [] };
    // Normalize: incoming value can be a single object or an array — always spread into the existing array
    const toArray = (v) => {
      if (!v) return [];
      return Array.isArray(v) ? v : [v];
    };
    return {
      harshDriving: {
        harshBreaking:     [...(current.harshBreaking     || []), ...toArray(events.harshBreaking)],
        harshAcceleration: [...(current.harshAcceleration || []), ...toArray(events.harshAcceleration)],
        harshCornering:    [...(current.harshCornering    || []), ...toArray(events.harshCornering)],
        overspeeding:      [...(current.overspeeding      || []), ...toArray(events.overspeeding)],
      },
    };
  }),

  setFareDetails: (fareData) => {
 
    if (fareData?.fareDetails?.fare != null) {
      set({ finalFare: fareData.fareDetails.fare });
    }

    const BreakdownFare = fareData?.customerInvoice ? utils.getInvoiceFormat(fareData?.customerInvoice) : utils.getFareBreakdown(fareData?.fareDetails)

    set({ breakdownFare: BreakdownFare });
  },


  setpassangerLocationChange: (data) => {
    console.log("locccc",data)
    set({stops:data?.stops})
    set({estimatedFare:data?.estimatedFare})
    set({totalDistance:data?.estimatedDistance})
    set({duration:data?.estimatedDuration})
    
    
    
  },
  
  setCurrentRideInfo: (info) => set({
    tripId: info._id || info.tripId || null,
    tripStatus: info.status || info.tripStatus || null,
    rideStartLocation: info.startLocation || info.rideStartLocation || null,
    rideEndLocation: info.endLocation || info.rideEndLocation || null,
    stops: info.stops || [],
    duration: info.estimatedDuration || info.duration || null,
    minFare: info.minFare || info.basePrice || null,
    maxFare: info.maxFare || info.maxPrice || null,
    totalDistance: info.distance || info.totalDistance || info.estimatedDistance || null,
    currentDistance: info.distance || info.currentDistance || null,
    otp: info.otp ?? null,
    estArrivalTime: info.estArrivalTime ?? null,
    paymentMethod: info.paymentMethod || null,
    // Additional fields from sample data
    bookingFor: info.bookingFor || null,
    bookingForName: info.bookingForName || null,
    bookingForPhone: info.bookingForPhone || null,
    bookingTime: info.bookingTime || null,
    pickupTime: info.pickupTime || null,
    passangerCount: info.passangerCount || null,
    passangerId: info.passangerId || null,
    vehicleType: info.vehicleType || null,
    publicRidesTrip: typeof info.publicRidesTrip === 'boolean' ? info.publicRidesTrip : null,
    finalDistance: info.finalDistance || null,
    finalDuration: info.finalDuration || null,
    estimatedFare:info.estimatedFare || null,
    onGoingTripCancelled:info.onGoingTripCancelled || null,
    maxDistanceLimit: info.maxDistanceLimit || null,
    bills: info.bills || null,
    isActingDriverTrip: info.isActingDriverTrip || null,
    harshDriving: info.harshDriving || null,
    passengerNotificationPreferences: info.passengerNotificationPreferences || null,
  }),

  resetCurrentRideInfo: () => set({
    tripId: null,
    tripStatus: null,
    rideStartLocation: null,
    rideEndLocation: null,
    stops: [],
    duration: null,
    minFare: null,
    maxFare: null,
    totalDistance: null,
    currentDistance: null,
    otp: null,
    estArrivalTime: null,
    paymentMethod: null,
    // Reset additional fields
    bookingFor: null,
    bookingForName: null,
    bookingForPhone: null,
    bookingTime: null,
    pickupTime: null,
    passangerCount: null,
    passangerId: null,
    vehicleType: null,
    publicRidesTrip: null,
    estimatedPickuoMins:null,
    estimatedArrivalMins:null,
    onGoingTripCancelled:null,
    maxDistanceLimit:null,
    isActingDriverTrip: null,
    passengerNotificationPreferences: null,
  }),
}));

export default useCurrentRideInfoStore;
