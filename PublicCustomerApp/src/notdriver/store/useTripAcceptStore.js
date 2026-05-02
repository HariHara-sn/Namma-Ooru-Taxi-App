import { create } from 'zustand';

export const useTripAcceptStore = create((set) => ({
  // Store the trip ID that is currently being accepted/viewed
  tripId: null,
  
  // Store the complete trip details object
  tripDetails: null,

  currentFare: null,
  
  // Loading and error states
  loading: false,
  error: null,

  requestId: null,

  timeOutSeconds: 0,

  hasActiveTrip:null,
  setHasActiveTrip: (tripId) => set({ hasActiveTrip: tripId }),

  tripCancelReason: null,
  setTripCancelReason: (tripCancelReason) => set({ tripCancelReason: tripCancelReason }),

  setTimeoutSeconds :(sec) => set({ timeOutSeconds: sec }), 
  
  setRequestId: (id) => set({ requestId: id }),
  // Action to set the trip ID
  setTripId: (id) => set({ tripId: id }),
  
  // Action to set the trip details
  setTripDetails: (details) => set({ tripDetails: details }),

  setCurrentFare: (fare) => set({ currentFare: fare }),
  
  // Action to update both trip ID and details at once
  setTrip: (id, details) => set({ tripId: id, tripDetails: details }),
  
  // Action to set loading state
  setLoading: (status) => set({ loading: status }),
  
  // Action to set error state
  setError: (error) => set({ error }),

  fetchLocationDate: false,
  setFetchLocationDate: (fetchLocationDate)=>set({fetchLocationDate: fetchLocationDate}),

  isGetFare: true,
  setIsGetFare:(isGetFare) => set({isGetFare: isGetFare}),

  isOnGoing: false,
  setIsOnGoing: (isOnGoing) => set({isOnGoing: isOnGoing}),

  alertedAt: null,
  setAlertedAt: (alertedAt) => set({ alertedAt: alertedAt }),

  upComingTripDetails: null,
  setUpComingTripDetails: (upComingTripDetails) => set({ upComingTripDetails: upComingTripDetails }),

  escalationDetails: null,
  setEscalationDetails: (escalationDetails) => set({ escalationDetails: escalationDetails }),

  dataFromSocket: false,
  setDataFromSocket: (dataFromSocket) => set({ dataFromSocket: dataFromSocket }),
  
  // Action to reset the store
  reset: () => set({ error: null, escalationDetails: null}),
}));
