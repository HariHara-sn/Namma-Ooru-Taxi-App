import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import PropTypes from 'prop-types';


import useMapStore  from "../store/useMapStore";
import NEMap from "../../../../common/map/NeMap";
import Loaders from "../../../components/Loaders/FullScreenLoader";
import useLocationStore from "../../../store/useLocationStore";
import useMapStyleStore from "../../../store/useMapStyleStore";


import locationTask from "../../../controllers/GetCurrentLocation";
import FullScreenLoader from "../../../components/Loaders/FullScreenLoader";
import CurrentLocationIcon from '../../../assets/icons/CurrentLocationIcon.svg';
import MapTopOverley from "./MapTopOverley";
import { dir } from "i18next";


const MapContainer = ({ mapStyle }) => {
  const {
    mode,
    mapMarkers,
    searchUnit,
    onMapCenterChanged,
    onMapRotationChanged,
    geometries,
    directionPoints,
    setOnSearchResults,
    mapLocation,
    mapDblclickCallback,
    markerClickCallback,
    setMapReady,
    mapReady,
    mapClickCallback,
    startNavigation,
    mapBounds,
    directionReady,
    searchPOI,
    setSearchPOIResults,
    setUserLocation,
    setMapMoving,
    userLocation,
    setDisduration,
    setSearchPOIError,
    loading,
    vehicleMarkers,
    setRouteLoading,
    routeLoading,
  
   
  } = useMapStore();
 
  const { defaultStyle,mapbuttonStyle,isMapButtonVisible } = useMapStyleStore();

  const { location } = useLocationStore();

  const searchStr = { start_location: location ? [location[1], location[0]] : [], search_str: searchUnit }

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

  
  const onPressCurrentLocation = async () => {
    console.log('hari--->>onPressCurrentLocation-->>');
    await locationTask.getCurrentLocation();
  }
 

  return (
    <Animated.View style={[styles.mapContainer, defaultStyle, { transition: 'all 20s ease-in-out' }]}>
      {!mapReady && <Loaders message="Setting up Map" />}
      {loading && <FullScreenLoader />}
      <MapTopOverley />
      <NEMap
        mapStyle={mapStyle || styles.mapStyles}
        homeLocation={mapLocation}
        onMapReady={() => {
          setMapReady(true);
        }}
        onMapRotationChanged={onMapRotationChanged}
        markers={mapMarkers}
        searchUnit={searchStr}
        autoPOISearch={searchPOI}
        settingsProps={defaultSettings}
        bounds={mapBounds?.length > 0 ? mapBounds : null}
        onSearchResults={setOnSearchResults}
        onSearchPOIResults={setSearchPOIResults}
        mode={mode}
        onMarkerClick={markerClickCallback}
        onMapCenterChanged={onMapCenterChanged}
        onMapClick={mapClickCallback}
        geometries={geometries}
        findRoute={[]}
        onMapDblclick={mapDblclickCallback}
        navigation={startNavigation}
        onDirectionReady={directionReady}
        findRouteWithRequest={directionPoints}
        onUserLocationChange={userLocation}
        distanceListner={setDisduration}
        onSearchPOIError={setSearchPOIError}
        vehicleMarkers={vehicleMarkers}
        onRouteLoading={setRouteLoading}
        onNavigationEnd={(e) => console.log('hari--->>navigationEnd-->>', e)}
      />

     

    </Animated.View>
    
  );
};

MapContainer.propTypes = {
  mapStyle: PropTypes.object,
};

export default MapContainer;

const styles = StyleSheet.create({
  mapContainer: {
    position: "absolute", 
    zIndex: -1,
  },
  mapStyles: {
    width: "100%",
    height: "100%",
  },
  gradientContainer: {
    zIndex: 2,
    position: "absolute",
    height: 100,
    width: "100%",
  },
  LinearGradient: {
    flex: 1,
  },
  mapButtons: {
    position: 'absolute',
    shadowColor: '#000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
  },
  markLocationButton: {
    backgroundColor: 'black',
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  currentLocationButton: {
   
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex:4000
  },
  zoomButtons: {
    backgroundColor: 'white',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    gap: 8,
    elevation: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  zoomButton: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    
}  
});
