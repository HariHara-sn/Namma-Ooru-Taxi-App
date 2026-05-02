import {create} from 'zustand';
import { rideType, tripType } from '../constants/JsonData';
const tripFor = ['For Myself'];

const useRideSelectionStore = create(set => ({
  selectedTrip: tripType[0],
  setSelectedTrip: selectedTrip => set({selectedTrip}),

  selectedRide: rideType[0],
  setSelectedRide: selectedRide => set({selectedRide}),

  tripFor: tripFor[0],
  setTripFor: tripFor => set({tripFor}),

  contactDetails: [],
  setContactDetails: contactDetails => set({contactDetails}),

  selectedContact: null,
  setSelectedContact: selectedContact => set({selectedContact}),

  paymentMethod: "Cash",
  setPaymentMethod: paymentMethod => set({paymentMethod}),

  scheduleDateTime: null,
  setScheduleDateTime: (scheduleDateTime) => set({ scheduleDateTime }),

  vehicleList: [],
  setVehicleList: (vehicleList) => set({ vehicleList }),

  bookingDetails: null,
  setBookingDetails: (bookingDetails) => set({bookingDetails}),

  updateBookingStatus: (status) => set(state => ({
    bookingDetails: {
      ...state.bookingDetails,
      status
    }
  })),

  updateOtp: (otp) => set(state => ({
    bookingDetails: {
      ...state.bookingDetails,
      otp
    }
  })),

  currentFare: null,
  setCurrentFare: (currentFare) => set({currentFare}),

  assignedDriver: null,
  setAssignedDriver: (assignedDriver) => set({assignedDriver}),

  otp: "8949",
  setOtp: (otp) => set({otp}),

  rideDistance: null,
  setRideDistance: (rideDistance) => set({rideDistance}),

  rideDuration: null,
  setRideDuration: (rideDuration) => set({rideDuration}),

  rideStatus: null,
  setRideStatus: (rideStatus) => set({rideStatus}),

  finalFareDetails: null,
  setFinalFareDetails: (finalFareDetails) => set({finalFareDetails}),
}));

export default useRideSelectionStore;
