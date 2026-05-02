import { create } from 'zustand'

const useScheduleTripStore = create((set) => ({
  scheduledTrips: [],
  setScheduledTrips: (trips) => set({ scheduledTrips: trips }),
  addScheduledTrip: (trip) => set((state) => ({
    scheduledTrips: [...state.scheduledTrips, trip]
  })),
  removeScheduledTrip: (tripId) => set((state) => ({
    scheduledTrips: state.scheduledTrips?.filter(trip => trip._id !== tripId)
  })),
  clearScheduledTrips: () => set({ scheduledTrips: [] })
}));

export default useScheduleTripStore;
