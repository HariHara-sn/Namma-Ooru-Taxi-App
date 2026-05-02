/* eslint-disable no-sequences */
import {StyleSheet, View} from 'react-native';
import React, {useCallback, useRef} from 'react';

import FullScreenLoader from '../loaders/FullScreenLoader';
import { useMapMarkerStore } from '../store/useMapMarkerStore';
import NEMap from './NeMap';

const MapContainer = () => {
  const {
    mapMarkers,
    geometries,
    mapBounds,
    setUserLocation,
    userLocation,
    mapLocation,
    mapDblclickCallback,
    markerClickCallback,
    setMapReady,
    mapReady,
    mapClickCallback,
    resizeMapOnMarkerUpdate,
    directionPoints,
    startNavigation,
    setDirectionReadyCallback,
    setDisduration,
    onNavigationEnd,
    setOnSearchResults,
    onMapRotationChanged,
    onMapCenterChanged,
    setRouteLoading,
    setNativeError,
    setNavigationError,
    setRouteNotFound,
    directionResponse
  } = useMapMarkerStore();
   const defaultSettings = {
    "distanceFormate": "Kilometers(km)/ Meters(m)",
    "ferry": "Avoid",
    "gpsReliability": "High",
    "highways": "Prefer",
    "language": "en",
    "livingStreet": "Slightly Prefer",
    "mapAppearance": "Small",
    "navAccuracy": "Medium",
    "tolls": "Slightly Prefer"
  }

  const lastUpdateRef = useRef(0);

  const handleUserLocationChange = useCallback((location) => {
    if (!location) return;
    const now = Date.now();
    // Throttle to once every 5 seconds
    if (now - lastUpdateRef.current < 5000) return;

    const lat = location.latitude;
    const lon = location.longitude;
    if (typeof lat !== 'number' || typeof lon !== 'number') return;

    // Only update if different from previous coords
    const same = Array.isArray(userLocation) && userLocation[0] === lat && userLocation[1] === lon;
    if (same) return;

    lastUpdateRef.current = now;
    setUserLocation([lat, lon]);
  }, [userLocation, setUserLocation]);

  return (
    <View style={styles.mapContainer}>
      {!mapReady && <FullScreenLoader message="Setting up Map" />}
      <NEMap
        resizeMapOnMarkerUpdate={resizeMapOnMarkerUpdate}
        mapStyle={styles.mapStyles}
        homeLocation={mapLocation}
        onMapReady={() => {
          setMapReady(true);
        }}
        onMapCenterChanged={onMapCenterChanged}
        onMapRotationChanged={onMapRotationChanged}
        markers={mapMarkers}
        onMarkerClick={markerClickCallback}
        onMapClick={mapClickCallback}
        geometries={geometries}
        onMapDblclick={mapDblclickCallback}
        bounds={mapBounds}
        onUserLocationChange={handleUserLocationChange}
        findRoute={directionPoints}
        findRouteWithRequest={directionResponse}
        navigation={startNavigation}
        onDirectionReady={setDirectionReadyCallback}
        distanceListner={setDisduration} // [lat, lon, remainingDistance, remainingDuration, speed, ldistance, lduration, navLegIndex, bearing]
        onNavigationEnd={onNavigationEnd}
        onSearchResults={setOnSearchResults}
        onRouteLoading={setRouteLoading}
        onNativeError={setNativeError}
        onNavigationError={setNavigationError}
        routeNotFound={setRouteNotFound}
        settingsProps={defaultSettings}
      />
    </View>
  );
};

export default MapContainer;

const styles = StyleSheet.create({
  mapContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  mapStyles: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  gradientContainer: {
    zIndex: 2,
    position: 'absolute',
    height: 100,
    width: '100%',
  },
  LinearGradient: {
    flex: 1,
  },
});
