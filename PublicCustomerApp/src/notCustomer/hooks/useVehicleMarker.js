import { getNearByDrivers } from '../API/EndPoints/EndPoints';
import useLocationStore from '../store/useLocationStore';
import { useState, useCallback } from 'react';
import useConfigStore from '../store/useConfigStore';

/**
 * Hook for fetching nearby drivers
 * @returns {Object} Fetch functions and state
 */
const useFetchNearbyDrivers = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const { location } = useLocationStore();
  const { appConfig } = useConfigStore();
  const fetchNearbyDrivers = useCallback(async (customLocation = null) => {
    // Respect config flag
    if (!appConfig?.SHOW_NEARBY_DRIVER) {
      setNearbyDrivers([]);
      return [];
    }

    const effectiveLocation = customLocation ?? location;
    let lat = null;
    let lon = null;

    if (Array.isArray(effectiveLocation) && effectiveLocation.length >= 2) {
      // [lon, lat]
      lon = effectiveLocation[0];
      lat = effectiveLocation[1];
    } else if (effectiveLocation && typeof effectiveLocation === 'object') {
      // { latitude, longitude } or { lat, lon|lng }
      lat = effectiveLocation.latitude ?? effectiveLocation.lat ?? null;
      lon = effectiveLocation.longitude ?? effectiveLocation.lon ?? effectiveLocation.lng ?? null;
    }

    if (lat == null || lon == null) {
      setError('Location not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getNearByDrivers(lat, lon);
      const drivers = Array.isArray(data?.drivers) ? data.drivers : [];
      setNearbyDrivers(drivers);
      return drivers;
    } catch (error) {
      console.error('Error fetching nearby drivers:', error);
      setError(error?.message || 'Failed to fetch nearby drivers');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  const clearNearbyDrivers = useCallback(() => {
    setNearbyDrivers([]);
    setError(null);
  }, []);

  return {
    fetchNearbyDrivers,
    clearNearbyDrivers,
    nearbyDrivers,
    isLoading,
    error
  };
};

export default useFetchNearbyDrivers;
