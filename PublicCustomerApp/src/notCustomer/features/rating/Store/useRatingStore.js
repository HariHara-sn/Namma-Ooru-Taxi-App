import { create } from 'zustand';

const useRatingStore = create((set, get) => ({
  currentTripId: null,
  setCurrentTripId: (tripId) => set({ currentTripId: tripId }),

  invoiceId: null,
  setInvoiceId: (invoiceId) => set({ invoiceId: invoiceId }),

  rideId: null,
  setRideId: (rideId) => set({ rideId: rideId }),

  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),

  bookingTime: null,
  setBookingTime: (time) => set({ bookingTime: time }),

  tripStops: [],
  setTripStops: (stops) => set({ tripStops: stops }),

  tripDistance: null,
  setTripDistance: (distance) => set({ tripDistance: distance }),

  tripDuration: null,
  setTripDuration: (duration) => set({ tripDuration: duration }),

  tripFare: null,
  setTripFare: (fare) => set({ tripFare: fare }),

  driverDetails: null,
  setDriverDetails: (details) => set({ driverDetails: details }),

  vehicleDetails: null,
  setVehicleDetails: (details) => set({ vehicleDetails: details }),

  fareDetails: null,
  setFareDetails: (details) => set({ fareDetails: details }),

  tripStatus: null,
  setTripStatus: (status) => set({ tripStatus: status }),

  supplierDetails: null,
  setSupplierDetails: (details) => set({ supplierDetails: details }),

  adminDetails: null,
  setAdminDetails: (details) => set({ adminDetails: details }),

  recipientDetails: null,
  setRecipientDetails: (details) => set({ recipientDetails: details }),

  paymentStatus: null,
  paymentMethod: null,
  setPaymentStatus: (status) => set({ paymentStatus: status }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  resetPayment: () => set({
    paymentStatus: null,
    paymentMethod: null,
    paymentDetails: null,
  }),

  setTripDetails: (data) => {
    const {
      setTripDistance,
      setTripDuration,
      setTripFare,
      setDriverDetails,
      setTripStops,
      setVehicleDetails,
      setFareDetails,
      setPaymentStatus,
      setPaymentMethod,
      setCurrentTripId,
      setIsLoading,
      setRideId,
      setBookingTime,
      setTripStatus,
      setSupplierDetails,
      setRecipientDetails,
      setAdminDetails,
      setInvoiceId,
    } = get();

    if (data?.trip?.rideId !== undefined) {
      setRideId(data.trip.rideId);
    }

    if(data?.trip?.fareDetails?.invoiceId !== undefined){
      setInvoiceId(data.trip?.fareDetails?.invoiceId);
    }

    if (data?.trip?.finalDistance !== undefined) {
        if(data.trip.finalDistance){
          const num = Number(data.trip.finalDistance);
          if (!isNaN(num) && isFinite(num)) {
            setTripDistance(num);
          }
        }
    }
    if (data?.trip?.finalDuration !== undefined) {
      setTripDuration(data.trip.finalDuration);
    }
    if (data?.trip?.fareDetails?.fare !== undefined) {
      setTripFare(data?.trip?.fareDetails?.fare);
    }
    if (data?.trip?.driverInfo !== undefined) { 
      setDriverDetails(data?.trip?.driverInfo);
    }
    if (data?.trip?.stops !== undefined) {
      setTripStops(data.trip.stops);
    }
    if (data?.trip?.vehicleInfo !== undefined) {
      setVehicleDetails(data?.trip?.vehicleInfo);
    }
    if (data?.trip?.fareDetails !== undefined) {
      setFareDetails(data?.trip?.fareDetails);
    }
    if (data?.trip?.paymentMethod !== undefined) {
      setPaymentMethod(data?.trip?.paymentMethod);
    }
    if (data?.fareDetails?.passengerPaymentStatus !== undefined) {
      setPaymentStatus(data?.trip?.fareDetails?.passengerPaymentStatus);
    }
    if (data?.trip?._id !== undefined) {
      setCurrentTripId(data.trip._id);
    }
    if (data?.trip?.createdAt !== undefined) {
      setBookingTime(data.trip.createdAt);
    }
    if(data?.trip?.status !== undefined){
      setTripStatus(data.trip.status);
    } 

    if(data?.trip?.supplier !== undefined){
      setSupplierDetails(data.trip.supplier);
    }

    if(data?.trip?.recipient !== undefined){
      setRecipientDetails(data.trip.recipient);
    }
  
    if(data?.trip?.adminInfo !== undefined){
      setAdminDetails(data.trip.adminInfo);
    }
    setIsLoading(false);    
  },
}));

export default useRatingStore;
