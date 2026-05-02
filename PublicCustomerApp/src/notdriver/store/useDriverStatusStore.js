import {create} from 'zustand';

const useDriverStatusStore = create(set => ({
  driverStatus: null,
  setDriverStatus: driverStatus => set({driverStatus}),

  upComingTrips: [],
  setUpComingTrips: upComingTrips => set({upComingTrips}),

  selectedFare: null,
  setSelectedFare: selectedFare => set({selectedFare}),
}));

export default useDriverStatusStore;
