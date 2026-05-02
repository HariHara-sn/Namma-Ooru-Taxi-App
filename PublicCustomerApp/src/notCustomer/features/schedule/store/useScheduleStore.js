import { create } from 'zustand';

// Shape of schedule data we care about on ScheduleScreen
// This store centralizes incoming payload and exposes convenient selectors

const initialState = {
  id: null,
  rideId: null,
  startLocation: null,
  endLocation: null,
  stops: [],
  isScheduledTrip: false,
  vehicleType: null,
  passangerCount: 1,
  minFare: null,
  maxFare: null,
  estimatedDistance: null,
  estimatedDuration: null,
  bookingFor: null,
  bookingForName: null,
  bookingForPhone: null,
  paymentMethod: 'CASH',
  nightRide: false,
  femaleOnly: false,
  regionalOffice: null,
  regionCode: null,
  bookingTime: null,
  status: null,
};

const useScheduleStore = create((set, get) => ({
  ...initialState,

  // Accepts the raw payload and maps to our internal state shape
  setFromPayload: (payload) => set(() => ({
    id: payload?._id || null,
    rideId: payload?.rideId || null,
    startLocation: payload?.startLocation || null,
    endLocation: payload?.endLocation || null,
    stops: Array.isArray(payload?.stops) ? payload.stops : [],
    isScheduledTrip: Boolean(payload?.isScheduledTrip),
    vehicleType: payload?.vehicleType || null,
    passangerCount: Number(payload?.passangerCount) || 1,
    minFare: payload?.minFare ?? null,
    maxFare: payload?.maxFare ?? null,
    estimatedDistance: payload?.estimatedDistance ?? null,
    estimatedDuration: payload?.estimatedDuration ?? null,
    bookingFor: payload?.bookingFor || null,
    bookingForName: payload?.bookingForName || null,
    bookingForPhone: payload?.bookingForPhone || null,
    paymentMethod: payload?.paymentMethod || 'CASH',
    nightRide: Boolean(payload?.nightRide),
    femaleOnly: Boolean(payload?.femaleOnly),
    regionalOffice: payload?.regionalOffice || null,
    regionCode: payload?.regionCode || null,
    bookingTime: payload?.bookingTime || null,
    status: payload?.status || null,
  })),

  reset: () => set({ ...initialState }),
}));

export default useScheduleStore;


