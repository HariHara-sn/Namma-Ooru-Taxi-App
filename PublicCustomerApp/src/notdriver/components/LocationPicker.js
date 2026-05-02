import {StyleSheet, Text, View} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import { Colors } from '../../common/constants/constants';
import SearchAPI from '../../notCustomer/controllers/NEMap/Search';


const LocationPicker = (props) => {
  const {setIsLoading, onAddressCallback} = props;
  const {
    setMapClickCallback,
    setMapMarkers,
    setUserLocation,
    userLocation,
    setMapLocation,
    setOnMapCenterChanged,
    setOnMapRotationChanged,
    mapMoving,
    setMapMoving,
  } = useMapMarkerStore();

  const searchRef = useRef(new SearchAPI());

  const fetchAddressName = async (lat, lng) => {
    // const coordinates = [lat, lng];
    try {
      // const search = new SearchAPI();
      // const response = await search.reverseGeocodeV2(coordinates);
      // if (response) {
      //   return (  
      //     response ||
      //     'Unnamed Location'
      //   );
      // }
      const response = await searchRef.current.reverseGeocode(lat, lng);    
      return response.address?.length > 0
        ? response.address.join(', ')
        : 'Unnamed Location';
    } catch (e) {
      console.error('Failed to fetch address', e);
      return '';
    }
  };

  const debouncedMapCenterChange = async data => {
    setIsLoading(true);
    const address = await fetchAddressName(data.longitude, data.latitude);
    let item = {
      latitude: data.longitude,
      longitude: data.latitude,
      name: address,
      type: null,
      locationFrom: 'MAP',
    };
    onAddressCallback(item);
    setIsLoading(false);
  };

  const onmapCenterChanged = async data => {
    setMapMoving(false);
    debouncedMapCenterChange(data);
  };

  const onMapRotationChangedCallback = async () => {
    setMapMoving(true);
    setIsLoading(true);
  };

    useEffect(() => {
      return () => {
        if (debouncedMapCenterChange && debouncedMapCenterChange.cancel) {
          debouncedMapCenterChange.cancel();
        }
        if (searchRef.current && searchRef.current.searchAbortController) {
          searchRef.current.searchAbortController.abort();
        }
      };
    }, []);

  useEffect(() => {
    setOnMapCenterChanged(onmapCenterChanged);
    setOnMapRotationChanged(onMapRotationChangedCallback);
    return () => {
      setOnMapCenterChanged(null);
      setOnMapRotationChanged(null);
    };
  }, []);

  return (
    <View style={[styles.pickIconContainer]}>
      <View
        style={[
          mapMoving && {marginBottom: 7},
          {alignSelf: 'center', alignItems: 'center'},
        ]}>
        <Text style={styles.markerText}>📍</Text>
      </View>
      <View style={[styles.shadowContainer]}>
      </View>
    </View>
  );
};

export default LocationPicker;

const styles = StyleSheet.create({
  pickIcon: {
    width: 25,
    height: 25,
  },
  pickIconVerticalLine: {
    width: 2,
    height: 15,
    backgroundColor: Colors.black,
  },
  shadowContainer: {
    width: 100,
    height: 100,
    backgroundColor: Colors.grey,
    borderRadius: 50,
  },
  shadow: {
    width: 100,
    height: 100,
    backgroundColor: Colors.grey,
    borderRadius: 50,
  },
  shadowContainer: {
    height: 10,
    width: 10,
    top: -5,
    backgroundColor: '#101010' + '50',
    alignSelf: 'center',
    marginBottom: 10,
    borderRadius: 50,
    transform: [{scaleX: 2}],
  },
  pickIconContainer: {
    marginBottom: 7,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99
  },
  markerText:{
    fontSize: 24,
  }
});
