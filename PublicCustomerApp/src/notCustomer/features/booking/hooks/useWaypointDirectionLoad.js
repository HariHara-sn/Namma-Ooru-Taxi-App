import { useCallback } from 'react';
import useWayPointReorderStore from '../store/useWayPointReorderStore';
import useRideBookingLocationStore from '../store/useRideBookingLocationStore';
import useMapStore from '../../../features/map/store/useMapStore';
import { findRoute } from '../../../controllers/NEMap/findRoute';

/**
 * Hook to transform waypoint reorder data into direction points for map display
 * @returns {Object} Object containing the transform function and current waypoint data
 */
const useWaypointDirectionLoad = () => {
  const { reOrderWaypoints,reachedStops } = useWayPointReorderStore();
  
  const { setDirectionPoints, setMapMarkers , setVehicleMarkers,setRouteLoading } = useMapStore();
  const { 
   
    setCurrentRouteData
  } = useRideBookingLocationStore();


  /**
   * Transforms reOrderWaypoints data into direction points format
   * @param {Object} options - Configuration options
   * @param {boolean} options.clearMarkers - Whether to clear existing map markers
   * @param {string} options.vehicleType - Type of vehicle for direction calculation
   */
  const transformWaypointsToDirectionPoints = useCallback(async(options = {}) => {
    try{
    setRouteLoading({loading:true,error:false})
    const { clearMarkers = true, vehicleType = 'car',padding } = options;
    const updatedReOrderWaypoints = [...reachedStops,...reOrderWaypoints];
    // Filter out valid waypoints with coordinates
    const validWaypoints = updatedReOrderWaypoints.filter(waypoint => 
      waypoint.latitude && 
      waypoint.longitude && 
      waypoint.type !== 'add-stop'
    );
    
    // Only set direction points if we have at least 2 valid waypoints
    if (validWaypoints.length >= 2) {
      // Clear existing markers if requested
      if (clearMarkers) {
        setMapMarkers([]);
        setVehicleMarkers([]);
      }

      const allLocations = validWaypoints.map(waypoint => ({
          lat: waypoint.latitude,
          lon: waypoint.longitude
        }))
  


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
        waypointCount: validWaypoints.length,
        waypoints: validWaypoints,
        distance:response.trip.summary.length,
        duration:response.trip.summary.time
      };
    } else {
      // Clear direction points if not enough waypoints
      setDirectionPoints(null);
      setRouteLoading({loading:false,error:true})
      return {
        success: false,
        error: 'Insufficient waypoints for route calculation',
        waypointCount: validWaypoints.length
      };
    }
  }catch(error){
    setRouteLoading({loading:false,error:true})
    console.error('Error in transforming waypoints to direction points:', error);
  }
  }, [reOrderWaypoints, setDirectionPoints, setMapMarkers, reachedStops]);

  /**
   * Check if waypoints are ready for direction calculation
   */
  const isWaypointsReady = useCallback(() => {
    const validWaypoints = reOrderWaypoints.filter(waypoint => 
      waypoint.latitude && 
      waypoint.longitude && 
      waypoint.type !== 'add-stop'
    );
    return validWaypoints.length >= 2 || (reachedStops.length >= 1 && validWaypoints.length >= 1);
  }, [reOrderWaypoints]);

  /**
   * Get all valid waypoints in order
   */
  const getValidWaypoints = useCallback(() => {
    return reOrderWaypoints.filter(waypoint => 
      waypoint.latitude && 
      waypoint.longitude && 
      waypoint.type !== 'add-stop'
    );
  }, [reOrderWaypoints]);

  /**
   * Get waypoints by type
   */
  const getWaypointsByType = useCallback((type) => {
    return reOrderWaypoints.filter(waypoint => waypoint.type === type);
  }, [reOrderWaypoints]);

  return {
    transformWaypointsToDirectionPoints,
    isWaypointsReady,
    getValidWaypoints,
    getWaypointsByType,
    reOrderWaypoints
  };
};

export default useWaypointDirectionLoad; 