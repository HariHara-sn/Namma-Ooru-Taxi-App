import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storageOptions = {
name: 'trip-store',
  getStorage: () => AsyncStorage,
};

const storeFunctione = (set, get) => ({
  tripData: null,
  setTripData: tripData => set({tripData}),

  tripDataLoading: false,
  setTripDataLoading: tripDataLoading => set({tripDataLoading}),

  tripDataError: null,
  setTripDataError: tripDataError => set({tripDataError}),

  activeTripData: null,
  updateStopData: (stopName, isReached, newStatus, waitingTime, stopUpdated) => {
    let updatedTrips;
    set(state => {
      updatedTrips = state?.activeTripData?.map(trip => ({
        ...trip,
        status: newStatus,
        stops: trip.stops.map(stop =>
          stop.name === stopName
            ? {
                ...stop,
                isReached: isReached,
                driverWaitTime: waitingTime || 0,
                stopUpdated: stopUpdated,
              }
            : stop
        )
      }));
      return { activeTripData: updatedTrips };
    });
    const updatedStop = updatedTrips?.[0]?.stops?.find(s => s.name === stopName);
    const nonReachedStops = updatedTrips?.[0]?.stops?.filter(stop => !stop.stopUpdated);
    return { nonReachedStops, updatedStop };
  },

  updateNewStopData: (newStopData) => {
    set(state => {
      const updatedTrips = state.activeTripData.map(trip => ({
        ...trip,
        estimatedDuration : newStopData?.duration,
        estimatedDistance : newStopData?.distance,
        estimatedFare : newStopData?.fare,
        stops: newStopData?.stops
      }));
      return { activeTripData: updatedTrips };
    });
  },

  getNonreachedStops: () => {
    const tripData = get().activeTripData;
    return tripData?.[0]?.stops?.filter(
      stop => !stop.stopUpdated
    )?.map(stop => ({
      lat: stop?.location[1],
      lon: stop?.location[0],
      ...stop
    })) || [];
  },

  getReachedStops: () => {
    const tripData = get().activeTripData;
    if (!tripData) return [];
    return tripData?.[0]?.stops?.filter(
      stop => stop?.stopUpdated
    )?.map(stop => ({
      lat: stop?.location[1],
      lon: stop?.location[0],
      ...stop
    })) || [];
  },

  setActiveTripData: activeTripData => set({activeTripData}),

  fareBreakDown: null,
  setFareBreakDown:(fare) => set({ fareBreakDown: fare }),

  newStopData: null,
  setNewStopData:(newStopData) => set({ newStopData: newStopData }),

  currentTripAcceptedTime: null,
  setCurrentTripAcceptedTime:(currentTripAcceptedTime) => set({ currentTripAcceptedTime: currentTripAcceptedTime }),

  driverConfig: null,
  setDriverConfig:(driverConfig) => set({ driverConfig: driverConfig }),

  
});

const useTripsStore = create(persist(storeFunctione, storageOptions));
export default useTripsStore

export const useSelectedRouteStore = create((set)=>({
  selectedRoute: null,
  setSelectedRoute: selectedRoute => set({selectedRoute}),

  selectedTrip: null,
  setSelectedTrip: selectedTrip => set({selectedTrip}),
}))

