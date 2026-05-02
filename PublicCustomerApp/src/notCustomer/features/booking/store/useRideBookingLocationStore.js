import { create } from 'zustand';

/**
 * @typedef {Object} Location
 * @property {string} address - The full address of the location
 * @property {string} name - The name of the location
 * @property {number} latitude - Latitude coordinate
 * @property {number} longitude - Longitude coordinate
 * @property {string} [type] - Optional type of location
 * @property {number} [distance] - Optional distance value
 * @property {string} [label] - Optional label for the location
 */

const useRideBookingLocationStore = create((set, get) => ({

    rideStartLocation: null,
    rideEndLocation: null,
    currentRouteData:null,
    rideWayPoints: [],

    /**
     * @param {Location} location
     */
    setRideStartLocation: (location) => set({ rideStartLocation: location }),
    setCurrentRouteData: (routeData) => set({ currentRouteData: routeData }),
    
    /**
     * @param {Location} location
     */
    setRideEndLocation: (location) => set({ rideEndLocation: location }),
    
    /**
     * @param {Location[]} wayPoints
     */
    setRideWayPoints: (wayPoints) => set({ rideWayPoints: wayPoints }),
    
    /**
     * @param {Location} wayPoint
     */
    addRideWayPoint: (wayPoint) => set({ rideWayPoints: [...get().rideWayPoints, wayPoint] }),

    resetRideBookingLocation: () => set({
        rideStartLocation: null,
        rideEndLocation: null,
        rideWayPoints: []
    }),

    resetRideWayPoint: () => set({ rideWayPoints: [] }),
  
}));

export default useRideBookingLocationStore;
