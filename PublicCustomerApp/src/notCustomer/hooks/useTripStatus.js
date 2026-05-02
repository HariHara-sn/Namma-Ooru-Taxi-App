import { useCallback } from 'react';
import useCurrentRideInfoStore from '../features/rideStatus/store/useCurrentRideInfoStore';
import useUserInfoStore from '../../common/store/useUserInfoStore';

const useTripStatus = () => {
  const handleTripStatusUpdate = useCallback((tripId, status) => {
    const { activeTripId } = useUserInfoStore.getState();
    const { tripStatus } = useCurrentRideInfoStore.getState();

    console.log(
      `Trip Status Updated: ${tripStatus}/${status} for Trip ID: ${tripId}/${activeTripId}`,
    );

    if (activeTripId !== tripId) {
      return;
    }

    if (status === tripStatus) {
      return;
    }
    if(global.checkOnGoingRideAndLog){
    global.checkOnGoingRideAndLog(true);
    }
  }, []);

  return { handleTripStatusUpdate };
};

export default useTripStatus;
