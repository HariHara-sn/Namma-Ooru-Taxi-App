import { create } from 'zustand';
import useCurrentRideInfoStore from './useCurrentRideInfoStore';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import rideMatchingSocketService from '../../../controllers/RideMatchingSocketService';

const useRideMatchStore = create(set => ({
  currentDriverLatitude: null,
  setCurrentDriverLatitude: (latitude) => set({ currentDriverLatitude: latitude }),

  currentDriverLongitude: null,
  setCurrentDriverLongitude: (longitude) => set({ currentDriverLongitude: longitude }),

  driverName: null,
  setDriverName: (name) => set({ driverName: name }),

  status: null,
  setStatus: (status) => set({ status }),

  message: null,
  setMessage: (message) => set({ message }),

  driverMatched: false,
  setDriverMatched: (matched) => set({ driverMatched: matched }),

  setRideMatchStatus: (data) => {
    // Update status and message
    set({
      status: data.status || null,
      message: data.message || null,
      driverName: data.driver?.name || null,
      currentDriverLatitude: data.driver?.location?.[1] ?? null,
      currentDriverLongitude: data.driver?.location?.[0] ?? null,
    });
  },

  resetRideMatchStatus: () => {
    set({
      status: null,
      message: null,
      driverName: null,
      currentDriverLatitude: null,
      currentDriverLongitude: null,
    });
  },

  retryRideMatching: async () => {
    const { tripId, vehicleType } = useCurrentRideInfoStore.getState();
    const { id: userId } = useUserInfoStore.getState();
    
    if (!tripId || !userId) {
      console.error('❌ Trip ID or User ID missing for retry');
      return false;
    }

    try {
      console.log('🔄 Retrying ride matching for trip:', tripId);
      
      // Reset to searching state
      set({
        status: 'searching',
        message: 'Searching for drivers...',
        driverName: null,
        currentDriverLatitude: null,
        currentDriverLongitude: null,
      });

      // Send find driver request
      rideMatchingSocketService.findDriver(tripId, userId, vehicleType);
      return true;
    } catch (error) {
      console.error('🚨 Error retrying ride matching:', error);
      set({
        status: 'failed',
        message: 'Failed to retry ride matching',
        driverName: null,
        currentDriverLatitude: null,
        currentDriverLongitude: null,
      });
      return false;
    }
  },

  startRideMatching: async (tripId, userId, vehicleType) => {
    if (!tripId || !userId) {
      console.error('❌ Trip ID or User ID missing for ride matching');
      return false;
    }

    try {
      console.log('🚀 Starting ride matching for trip:', tripId);
      
      // Reset matching state
      set({
        status: 'searching',
        message: 'Searching for drivers...',
        driverName: null,
        currentDriverLatitude: null,
        currentDriverLongitude: null,
      });

      // Send find driver request
      rideMatchingSocketService.findDriver(tripId, userId, vehicleType);
      return true;
    } catch (error) {
      console.error('🚨 Error starting ride matching:', error);
      set({
        status: 'failed',
        message: 'Failed to start ride matching',
        driverName: null,
        currentDriverLatitude: null,
        currentDriverLongitude: null,
      });
      return false;
    }
  },

  stopRideMatching: (tripId, userId) => {
    console.log('🛑 Stopping ride matching');
    rideMatchingSocketService.cancelRide(tripId, userId);
    
    set({
      status: 'cancelled',
      message: 'Ride matching cancelled',
      driverName: null,
      currentDriverLatitude: null,
      currentDriverLongitude: null,
    });
  }
}));

export default useRideMatchStore;
