import { useEffect, useRef, useMemo, useCallback } from 'react';
import { findRoute } from '../../../controllers/NEMap/findRoute';
import Polyline from '../../../controllers/NEMap/Polyline';
import useMapStore from '../../map/store/useMapStore';
import useAssignedDriverInfoStore from '../store/useAssignedDriverInfoStore';
import useCurrentRideInfoStore from '../store/useCurrentRideInfoStore';
import polyline from '@mapbox/polyline';

const usePolyLineTrack = (screenMode = 'arrival') => {
  const {
    driverLatitude,
    driverLongitude
  } = useAssignedDriverInfoStore();

  const {
    rideStartLocation,
    rideEndLocation,
    stops,
    setEstimatedPickuoMins
  } = useCurrentRideInfoStore();

  const {
    setGeometries
  } = useMapStore();

  const polylineRef = useRef(null);
  const lastRoutePointsRef = useRef(null);
  const originalCoordinatesRef = useRef(null);
  const lastDriverLocationRef = useRef(null);
  const routeSummaryRef = useRef(null);
  const deviationThreshold = 500; // meters - distance threshold for considering driver off-route

  // Function to calculate distance between two points in meters
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Function to calculate total distance of remaining coordinates
  const calculateRemainingDistance = useCallback((coordinates) => {
    if (!coordinates || coordinates.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lon1, lat1] = coordinates[i];
      const [lon2, lat2] = coordinates[i + 1];
      totalDistance += calculateDistance(lat1, lon1, lat2, lon2);
    }
    return totalDistance;
  }, [calculateDistance]);

  // Function to calculate estimated time based on remaining distance and original time
  const calculateEstimatedTime = useCallback((remainingDistance, originalTime, originalDistance) => {
    if (!originalTime || !originalDistance || originalDistance === 0) return null;
    
    // Calculate time per meter from original route
    const timePerMeter = originalTime / originalDistance;
    
    // Calculate estimated time for remaining distance
    const estimatedTimeSeconds = remainingDistance * timePerMeter;
    
    // Convert to minutes and round to nearest minute
    const estimatedTimeMinutes = Math.round(estimatedTimeSeconds / 60);
    
    return Math.max(1, estimatedTimeMinutes); // Minimum 1 minute
  }, []);

  // Function to update estimated pickup time
  const updateEstimatedPickupTime = useCallback((coordinates) => {
    if (!routeSummaryRef.current || !coordinates) return;

    const { time: originalTime, length: originalDistance } = routeSummaryRef.current;
    const remainingDistance = calculateRemainingDistance(coordinates);
    
    // Convert original distance from km to meters
    const originalDistanceMeters = originalDistance * 1000;
    
    const estimatedMinutes = calculateEstimatedTime(remainingDistance, originalTime, originalDistanceMeters);
    
    if (estimatedMinutes !== null) {
      setEstimatedPickuoMins(estimatedMinutes);
    }
  }, [calculateRemainingDistance, calculateEstimatedTime, setEstimatedPickuoMins]);

  // Function to find the closest point on polyline to driver location
  const findClosestPointOnPolyline = useCallback((driverLat, driverLon, coordinates) => {
    if (!coordinates || coordinates.length === 0) return { index: -1, distance: Infinity };

    let minDistance = Infinity;
    let closestIndex = -1;

    coordinates.forEach((coord, index) => {
      const distance = calculateDistance(driverLat, driverLon, coord[1], coord[0]);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return { index: closestIndex, distance: minDistance };
  }, [calculateDistance]);

  // Function to check if driver has deviated significantly from route
  const hasDriverDeviated = useCallback((driverLat, driverLon, coordinates) => {
    if (!coordinates || coordinates.length === 0) return true;

    const { distance } = findClosestPointOnPolyline(driverLat, driverLon, coordinates);
    return distance > deviationThreshold;
  }, [findClosestPointOnPolyline, deviationThreshold]);

  // Function to update polyline by removing passed coordinates
  const updatePolylineProgress = useCallback((driverLat, driverLon, coordinates) => {
    if (!coordinates || coordinates.length === 0) return coordinates;

    const { index: closestIndex } = findClosestPointOnPolyline(driverLat, driverLon, coordinates);
    
    if (closestIndex === -1) return coordinates;

    // Keep some points behind for continuity and smoothness
    const keepBehind = 1;
    const startIndex = Math.max(0, closestIndex - keepBehind);

    // Keep a small lookahead to avoid abrupt end truncation
    const keepAhead = Math.min(5, coordinates.length - closestIndex - 1);
    const endIndexExclusive = coordinates.length - keepAhead;

    const updatedCoordinates = coordinates.slice(startIndex, endIndexExclusive);
    
    // Update estimated pickup time based on remaining coordinates
    updateEstimatedPickupTime(updatedCoordinates);
    
    return updatedCoordinates;
  }, [findClosestPointOnPolyline, updateEstimatedPickupTime]);

  // Function to organize polyline coordinates from route data
  const getOrganizedPolylineCoordinates = useCallback((routeData) => {
    if (!routeData?.trip?.legs || routeData.trip.legs.length === 0) {
      return [];
    }

    const coordinates = routeData.trip.legs.map(leg => {
      if (!leg.shape) {
        return [];
      }
      
      const decoded = polyline.decode(leg.shape, 6);
      return decoded.map(([lat, lon]) => [lon, lat]);
    }).flat();

    return coordinates;
  }, []);

  // Function to extract route summary from route data
  const extractRouteSummary = useCallback((routeData) => {
    if (!routeData?.trip?.legs || routeData.trip.legs.length === 0) {
      return null;
    }

    // For routes with waypoints, calculate total time and distance across all legs
    if (routeData.trip.legs.length > 1) {
      let totalTime = 0;
      let totalLength = 0;
      
      routeData.trip.legs.forEach(leg => {
        if (leg.summary) {
          totalTime += leg.summary.time || 0;
          totalLength += leg.summary.length || 0;
        }
      });
      
      return { time: totalTime, length: totalLength };
    }

    // Get the first leg's summary (for single leg routes)
    const leg = routeData.trip.legs[0];
    if (leg.summary) {
      return leg.summary;
    }

    return null;
  }, []);

  // Function to get route points based on screen mode
  const getRoutePoints = useCallback(() => {
    if (screenMode === 'arrival') {
      // Driver to start location
      if (driverLatitude && driverLongitude && rideStartLocation) {
        return [
          { lat: driverLatitude, lon: driverLongitude },
          { 
            lat: rideStartLocation.latitude || rideStartLocation.lat || rideStartLocation[1], 
            lon: rideStartLocation.longitude || rideStartLocation.lng || rideStartLocation[0]
          }
        ];
      }
    } else if (screenMode === 'on-ride') {
      // Start to end location with waypoints
      if (rideStartLocation && rideEndLocation) {
        const points = [
          { 
            lat: rideStartLocation.latitude || rideStartLocation.lat || rideStartLocation[1], 
            lon: rideStartLocation.longitude || rideStartLocation.lng || rideStartLocation[0]
          }
        ];

        // Add waypoints from stops array if available
        if (stops && stops.length > 0) {
          stops.forEach(stop => {
            if (stop.location && Array.isArray(stop.location) && stop.location.length === 2) {
              points.push({
                lat: stop.location[1], // lat is at index 1
                lon: stop.location[0]  // lon is at index 0
              });
            }
          });
        }

        // Add end location
        points.push({
          lat: rideEndLocation.latitude || rideEndLocation.lat || rideEndLocation[1], 
          lon: rideEndLocation.longitude || rideEndLocation.lng || rideEndLocation[0]
        });

        return points;
      }
    }
    return null;
  }, [screenMode, driverLatitude, driverLongitude, rideStartLocation, rideEndLocation, stops]);

  // Memoized route points to prevent unnecessary API calls
  const routePoints = useMemo(() => {
    return getRoutePoints();
  }, [getRoutePoints]);

  // Function to fetch route and create polyline
  const fetchRouteAndCreatePolyline = useCallback(async (points) => {
    if (!points || points.length < 2) {
      return null;
    }

   

    try {
      const routeRes = await findRoute(points);
      const routeData = routeRes?.response;
      
      if (!routeData) {
        return null;
      }

      const coordinates = getOrganizedPolylineCoordinates(routeData);

      if (coordinates.length === 0) {
        return null;
      }


      // Extract and store route summary for time calculations
      const routeSummary = extractRouteSummary(routeData);
      if (routeSummary) {
        routeSummaryRef.current = routeSummary;
        
        // Set initial estimated pickup time
        const estimatedMinutes = Math.round(routeSummary.time / 60);
        setEstimatedPickuoMins(estimatedMinutes);
      }

      // Store original coordinates for progress tracking
      originalCoordinatesRef.current = [...coordinates];

      // Create polyline based on screen mode
      const hasWaypoints = screenMode === 'on-ride' && stops && stops.length > 2;
      const polylineId = screenMode === 'arrival' ? 'driver-to-start' : 
                        hasWaypoints ? 'start-to-end-with-waypoints' : 'start-to-end';
      const polylineName = screenMode === 'arrival' ? 'Driver to Pickup' : 
                          hasWaypoints ? 'Route with Waypoints' : 'Route to Destination';
      const polylineColor = '#000000';



      console.log('polylineId', coordinates)
      const polylineObj = new Polyline(
        polylineId,
        polylineName,
        coordinates,
        polylineColor,
        'small'
      );

      
      polylineObj.setFocus(false);

      polylineRef.current = polylineObj;
      return polylineObj;

    } catch (error) {
      // Keep error logging for errors
      console.error('Error fetching route and creating polyline:', error);
      return null;
    }
  }, [screenMode, stops, getOrganizedPolylineCoordinates, extractRouteSummary, setEstimatedPickuoMins]);

  // Function to update polyline with current coordinates
  const updatePolylineWithCoordinates = useCallback((coordinates) => {
    if (!coordinates || coordinates.length === 0) {
      setGeometries([]);
      return;
    }
    console.log('coordinates', coordinates);

    const hasWaypoints = screenMode === 'on-ride' && stops && stops.length > 2;
    const polylineId = screenMode === 'arrival' ? 'driver-to-start' : 
                      hasWaypoints ? 'start-to-end-with-waypoints' : 'start-to-end';
    const polylineName = screenMode === 'arrival' ? 'Driver to Pickup' : 
                        hasWaypoints ? 'Route with Waypoints' : 'Route to Destination';
    const polylineColor = '#000000';

    const polylineObj = new Polyline(
      polylineId,
      polylineName,
      coordinates,
      polylineColor,
      'small'
    );
   
    polylineObj.setFocus(false);

    polylineRef.current = polylineObj;
    setGeometries([polylineObj]);
  }, [screenMode, stops, setGeometries]);

  // Effect to handle route updates (initial route fetch)
  useEffect(() => {
    if (!routePoints) {
      return;
    }

    // Check if route points have changed
    const currentPoints = JSON.stringify(routePoints);
    if (lastRoutePointsRef.current === currentPoints) {
      return;
    }

    lastRoutePointsRef.current = currentPoints;

    const updatePolyline = async () => {
      const polylineObj = await fetchRouteAndCreatePolyline(routePoints);
      
      if (polylineObj) {
        setGeometries([polylineObj]);
      } else {
        setGeometries([]);
      }
    };

    updatePolyline();
  }, [routePoints, fetchRouteAndCreatePolyline, setGeometries]);

  // Effect to handle driver location updates and polyline progress
  useEffect(() => {
    if (!driverLatitude || !driverLongitude || !originalCoordinatesRef.current) {
      return;
    }

    const currentLocation = `${driverLatitude},${driverLongitude}`;
    if (lastDriverLocationRef.current === currentLocation) {
      return; // Driver location hasn't changed
    }

    lastDriverLocationRef.current = currentLocation;

    // Check if driver has deviated significantly from the route
    if (hasDriverDeviated(driverLatitude, driverLongitude, originalCoordinatesRef.current)) {
      // Reset and fetch new route
      originalCoordinatesRef.current = null;
      lastRoutePointsRef.current = null;
      routeSummaryRef.current = null;
      
      // Trigger new route fetch by updating route points
      const newRoutePoints = getRoutePoints();
      if (newRoutePoints) {
        fetchRouteAndCreatePolyline(newRoutePoints).then(polylineObj => {
          if (polylineObj) {
            setGeometries([polylineObj]);
          }
        });
      }
    } else {
      // Update polyline progress by removing passed coordinates
      const updatedCoordinates = updatePolylineProgress(
        driverLatitude, 
        driverLongitude, 
        originalCoordinatesRef.current
      );
      
      if (updatedCoordinates.length !== originalCoordinatesRef.current.length) {
        originalCoordinatesRef.current = updatedCoordinates;
        updatePolylineWithCoordinates(updatedCoordinates);
      }
    }
  }, [driverLatitude, driverLongitude, hasDriverDeviated, updatePolylineProgress, updatePolylineWithCoordinates, getRoutePoints, fetchRouteAndCreatePolyline, setGeometries]);

  // Function to clear polyline
  const clearPolyline = useCallback(() => {
    setGeometries([]);
    polylineRef.current = null;
    lastRoutePointsRef.current = null;
    originalCoordinatesRef.current = null;
    lastDriverLocationRef.current = null;
    routeSummaryRef.current = null;
  }, [setGeometries]);

  // Function to update polyline (for manual updates)
  const updatePolyline = useCallback(async () => {
    if (routePoints) {
      const polylineObj = await fetchRouteAndCreatePolyline(routePoints);
      if (polylineObj) {
        setGeometries([polylineObj]);
      }
    }
  }, [routePoints, fetchRouteAndCreatePolyline, setGeometries]);

  return {
    clearPolyline,
    updatePolyline,
    polyline: polylineRef.current,
    routePoints
  };
};

export default usePolyLineTrack;
