import { useCallback } from 'react';
import useRideBookingLocationStore from '../store/useRideBookingLocationStore';
import useMapStore from '../../../features/map/store/useMapStore';
import { findRoute } from '../../../controllers/NEMap/findRoute';

/**
 * Hook to transform ride booking location data into direction points for map display
 * @returns {Object} Object containing the transform function and current ride locations
 */

const useDirectionLoad = () => {
  const { 
    rideStartLocation, 
    rideEndLocation, 
    rideWayPoints ,
    setCurrentRouteData
  } = useRideBookingLocationStore();

  const { setDirectionPoints, setMapMarkers , setVehicleMarkers ,setRouteLoading} = useMapStore();


  
  
  /**
   * Transforms ride location data into direction points format
   * @param {Object} options - Configuration options
   * @param {boolean} options.clearMarkers - Whether to clear existing map markers
   * @param {string} options.vehicleType - Type of vehicle for direction calculation
   */
  const transformRideLocationsToDirectionPoints = useCallback(async (options = {}) => {

    try{

      setRouteLoading({loading:true})
    const { clearMarkers = true, vehicleType = 'car', padding } = options;

    
    
    // Collect all valid locations in order: start -> waypoints -> end
    const allLocations = [];


    
    // Add start location if available
    if (rideStartLocation && rideStartLocation.latitude && rideStartLocation.longitude) {
      allLocations.push({
        lat: rideStartLocation.latitude,
        lon: rideStartLocation.longitude,
        locationName: rideStartLocation.name || rideStartLocation.address,
        type: 'start'
      });
    }
    
    // Add waypoints if available
    if (rideWayPoints && rideWayPoints.length > 0) {
      rideWayPoints.forEach((waypoint, index) => {
        if (waypoint.latitude && waypoint.longitude) {
          allLocations.push({
            lat: waypoint.latitude,
            lon: waypoint.longitude,
            locationName: waypoint.name || waypoint.address,
            type: 'waypoint',
            waypointIndex: index
          });
        }
      });
    }
    
    // Add end location if available
    if (rideEndLocation && rideEndLocation.latitude && rideEndLocation.longitude) {
      allLocations.push({
        lat: rideEndLocation.latitude,
        lon: rideEndLocation.longitude,
        locationName: rideEndLocation?.name || rideEndLocation?.address,
        type: 'end'
      });
    }
    
    // Only set direction points if we have at least 2 valid locations
    if (allLocations.length >= 2) {
      // Clear existing markers if requested
      if (clearMarkers) {
        setMapMarkers([]);
        setVehicleMarkers([]);
      }
 
      const {response , requests} = await findRoute(allLocations);
      
   
   
      // Transform to the format expected by setDirectionPoints
      const directionPoints = {
        requests: JSON.stringify(requests),
        response: JSON.stringify(response)
      };

      if (Array.isArray(padding) && padding.length === 4) {
        directionPoints.padding = padding.map(v => parseInt(v, 10));
      }
    
      setDirectionPoints(directionPoints);
      setCurrentRouteData(directionPoints)
      setRouteLoading({loading:false})
      return {
        success: true,
        directionPoints,
        locationCount: allLocations.length,
        distance:response.trip.summary.length,
        duration:response.trip.summary.time
      };
    } else {
      // Clear direction points if not enough locations
      setDirectionPoints(null);
      setRouteLoading({loading:false,error:true})
      return {
        success: false,
        error: 'Insufficient locations for route calculation',
        locationCount: allLocations.length
      };
    }
  }catch(error){
    setRouteLoading({loading:false,error:true})
    console.error('Error in transforming ride locations to direction points:', error);
    return {
      success: false
    }
  }
  }, [rideStartLocation, rideEndLocation, rideWayPoints, setDirectionPoints, setMapMarkers]);

  /**
   * Check if ride locations are ready for direction calculation
   */
  const isRideLocationsReady = useCallback(() => {
    const hasStart = rideStartLocation && rideStartLocation.latitude && rideStartLocation.longitude;
    const hasEnd = rideEndLocation && rideEndLocation.latitude && rideEndLocation.longitude;
    return hasStart && hasEnd;
  }, [rideStartLocation, rideEndLocation]);

  /**
   * Get all ride locations in order
   */

  const getAllRideLocations = useCallback(() => {
    const locations = [];
    
    if (rideStartLocation) locations.push({ ...rideStartLocation, type: 'start' });
    if (rideWayPoints && rideWayPoints.length > 0) {
      rideWayPoints.forEach((waypoint, index) => {
        locations.push({ ...waypoint, type: 'waypoint', waypointIndex: index });
      });
    }
    if (rideEndLocation) locations.push({ ...rideEndLocation, type: 'end' });
    
    return locations;
  }, [rideStartLocation, rideEndLocation, rideWayPoints]);

  return {
    transformRideLocationsToDirectionPoints,
    isRideLocationsReady,
    getAllRideLocations,
    rideStartLocation,
    rideEndLocation,
    rideWayPoints,
  };
};

export default useDirectionLoad;
