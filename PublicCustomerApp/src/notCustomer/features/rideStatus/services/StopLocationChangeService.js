import useCurrentRideInfoStore from '../store/useCurrentRideInfoStore';
import { updateTripStops } from '../../../API/EndPoints/EndPoints';
import  LocationTypes  from '../../booking/types/LocationTypes.json';
import { use } from 'react';

/**
 * Calls the API to update trip stops for the current ride.
 * @param {Object} stopData - The new stop data to update.
 * @returns {Promise<Object>} - The API response.
 */
export const changeStopLocation = async (updatedStop,totalDistance,totalDuration) => {
  // Get current ride info (e.g., tripId)
  const { tripId,stops } = useCurrentRideInfoStore.getState();
  

  const upadtedstops = [...stops]
  if (updatedStop?.type == LocationTypes.START_LOCATION) {
    upadtedstops[0].address = updatedStop?.address;
    upadtedstops[0].location[1] = updatedStop?.latitude;
    upadtedstops[0].location[0] = updatedStop?.longitude;
    
  } else if (updatedStop?.type == LocationTypes.END_LOCATION) {
    upadtedstops[stops.length - 1].address = updatedStop?.address;
    upadtedstops[stops.length - 1].location[1] = updatedStop?.latitude;
    upadtedstops[stops.length - 1].location[0] = updatedStop?.longitude;

  }

  // Prepare payload for API
  const payload = {
    tripId,
    stops:upadtedstops,
    estimatedDistance:totalDistance?.toFixed(2),
    estimatedDuration:totalDuration,
  };

  console.log('payload',payload);

  // Call the API to update trip stops
  const response = await updateTripStops(payload);
  console.log('updateTripStops response',response);
  if (response.success) {
    
    useCurrentRideInfoStore.setState({ stops: upadtedstops });
    useCurrentRideInfoStore.setState({totalDistance:totalDistance?.toFixed(2)});
    useCurrentRideInfoStore.setState({duration:totalDuration});
    useCurrentRideInfoStore.setState({ rideStartLocation: upadtedstops[0]?.location });
    useCurrentRideInfoStore.setState({ rideEndLocation: upadtedstops[stops.length - 1]?.location });
  }
  return response;

};
