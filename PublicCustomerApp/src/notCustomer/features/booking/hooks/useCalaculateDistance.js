import { useState, useCallback } from 'react';
import { findRoute } from '../../../controllers/NEMap/findRoute';

/**
 * Hook for calculating distance and duration between points using route API
 * @returns {Object} Distance calculation functions and state
 */
const useCalculateDistance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [distanceData, setDistanceData] = useState(null);

  /**
   * Calculate distance and duration between points
   * @param {Array} points - Array of points with lat/lon or location coordinates
   * @returns {Promise<Object>} Object containing distance and duration
   */
  const calculateDistance = useCallback(async (points) => {
    if (!points || points.length < 2) {
      setError('At least 2 points are required for distance calculation');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const routeRes = await findRoute(points);

      const routeData = routeRes?.response;
      
      if (!routeData || !routeData.trip) {
        throw new Error('No route data received');
      }

      const trip = routeData.trip;
      const legs = trip.legs || [];
      
      // Calculate total distance and duration
      let totalDistance = 0;
      let totalDuration = 0;

      legs.forEach(leg => {
        totalDistance += leg.summary?.length || 0;
        totalDuration += leg.summary?.time || 0;
      });

      const result = {
        distance: totalDistance, // in kilometers
        duration: totalDuration, // in seconds
        distanceFormatted: `${(totalDistance).toFixed(2)} km`,
        durationFormatted: formatDuration(totalDuration),
        routeData: routeData
      };

      setDistanceData(result);
      return result;

    } catch (err) {
      const errorMessage = err.message || 'Failed to calculate distance';
      setError(errorMessage);
      console.error('Distance calculation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Format duration from seconds to human readable format
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration string
   */
  const formatDuration = useCallback((seconds) => {
    if (!seconds) return '0 min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  }, []);

  /**
   * Clear current distance data and error state
   */
  const clearDistanceData = useCallback(() => {
    setDistanceData(null);
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    distanceData,
    
    // Actions
    calculateDistance,
    clearDistanceData,
    
    // Helper functions
    formatDuration
  };
};

export default useCalculateDistance;
