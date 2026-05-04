import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, StatusBar, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import Geolocation from 'react-native-geolocation-service';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, Fonts } from '../../../constants/constants';

import OneWayTrip from './OneWayTrip';
import RoundTrip from './RoundTrip';
import OutstationTrip from './OutstationTrip';
import NEMap from '../../../../common/map/NeMap';
import Marker from '../../../../common/map/Marker';
import useLocationStore from '../../../store/useLocationStore';
import SearchAPI from '../../../controllers/NEMap/Search';
import { RequestFineLocationPermission } from '../../../controllers/PermissionHandler';

const CURRENT_LOCATION_MARKER_ID = 'hire-driver-current-location';

const getLocationLabel = (locationName, fallback = 'Current Location') => {
  if (!locationName) return fallback;
  if (typeof locationName === 'string') return locationName;
  return (
    locationName.placeName ||
    locationName.name ||
    (Array.isArray(locationName.address) ? locationName.address.filter(Boolean).join(', ') : locationName.address) ||
    fallback
  );
};

const createCurrentLocationMarker = coords => {
  if (!coords || coords.latitude == null || coords.longitude == null) return null;
  const marker = new Marker(
    CURRENT_LOCATION_MARKER_ID,
    'Current Location',
    coords.longitude,
    coords.latitude,
    'bearing',
    48,
    true,
  );
  marker.setAnimate(false);
  marker.setFocus(false);
  marker.setDoRotation(false);
  return marker;
};

const HireDriversScreen = () => {
  const { t } = useTranslation();
  const { goBack } = useStackScreenStore();
  const {
    selectedInput,
    setSelectedInput,
    directions,
    setDirections,
    location,
    setLocation,
    currentLocationName,
    setCurrentLocationName,
  } = useLocationStore();
  const [activeTab, setActiveTab] = useState('oneWay');
  const [sourceLocation, setSourceLocation] = useState(getLocationLabel(currentLocationName, t('current_location', 'Current Location')));
  const [currentMapCenter, setCurrentMapCenter] = useState(null);
  const [mapHomeLocation, setMapHomeLocation] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);
  const searchRef = useRef(new SearchAPI());

  const applyCurrentLocationToMap = useCallback(async (coords, locationName = currentLocationName) => {
    if (!coords) return;

    const label = getLocationLabel(locationName, t('current_location', 'Current Location'));
    const marker = createCurrentLocationMarker(coords);

    setSourceLocation(label);
    setCurrentMapCenter(coords);
    setMapHomeLocation({
      lat: coords.latitude,
      lng: coords.longitude,
      zoom: 18,
    });
    setMapMarkers(marker ? [marker] : []);

    const updatedDirections = [...useLocationStore.getState().directions];
    updatedDirections[0] = {
      ...updatedDirections[0],
      location: [coords.longitude, coords.latitude],
      locationName: label,
    };
    setDirections(updatedDirections);
  }, [currentLocationName, setDirections, t]);

  const fetchAndShowCurrentLocation = useCallback(async () => {
    try {
      let coords = Array.isArray(location) && location.length >= 2
        ? { longitude: location[0], latitude: location[1] }
        : null;
      let resolvedLocationName = currentLocationName;

      if (!coords) {
        const hasPermission = await RequestFineLocationPermission();
        if (!hasPermission) return;

        const position = await new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              accuracy: {
                android: 'high',
                ios: 'bestForNavigation',
              },
              enableHighAccuracy: true,
              maximumAge: 20000,
              timeout: 15000,
            },
          );
        });

        coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation([coords.longitude, coords.latitude]);
      }

      if (!getLocationLabel(resolvedLocationName, '')) {
        const response = await searchRef.current.reverseGeocode(coords.longitude, coords.latitude);
        if (response) {
          resolvedLocationName = response;
          setCurrentLocationName(response);
        }
      }

      await applyCurrentLocationToMap(coords, resolvedLocationName);
    } catch (error) {
      console.log('Error fetching current location:', error);
    }
  }, [applyCurrentLocationToMap, currentLocationName, location, setCurrentLocationName, setLocation]);

  useEffect(() => {
    fetchAndShowCurrentLocation();
  }, [fetchAndShowCurrentLocation]);

  useEffect(() => {
    if (!selectedInput || !location || location.length < 2) return;
    const coords = {
      longitude: location[0],
      latitude: location[1],
    };
    applyCurrentLocationToMap(coords, currentLocationName);
  }, [applyCurrentLocationToMap, currentLocationName, location, selectedInput]);

  const handleMapCenterChange = async (data) => {
    if (!selectedInput) return;
    
    const coords = {
      latitude: data.latitude,
      longitude: data.longitude
    };
    setCurrentMapCenter(coords);

    // Optionally update address in real-time or just on "Done"
    // For better UX, we can just update coordinates here
    const updatedDirections = [...directions];
    const index = selectedInput === 'Start' ? 0 : 1;
    updatedDirections[index] = {
      ...updatedDirections[index],
      location: [coords.longitude, coords.latitude],
      // locationName: 'Marked on map...' // We'll fetch real name on Done
    };
    setDirections(updatedDirections);
  };

  const handleDoneMarking = async () => {
    if (currentMapCenter) {
      try {
        const response = await searchRef.current.reverseGeocode(currentMapCenter.longitude, currentMapCenter.latitude);
        if (response) {
          const updatedDirections = [...directions];
          const index = selectedInput === 'Start' ? 0 : 1;
          const locationName = getLocationLabel(response, 'Selected Location');
          updatedDirections[index] = {
            ...updatedDirections[index],
            locationName
          };
          if (selectedInput === 'Start') {
            setSourceLocation(getLocationLabel(response, 'Selected Location'));
          }
          setDirections(updatedDirections);
        }
      } catch (error) {
        console.log("Error reverse geocoding:", error);
      }
    }
    setSelectedInput(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'oneWay': return <OneWayTrip />;
      case 'roundTrip': return <RoundTrip />;
      case 'outstation': return <OutstationTrip />;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f222b" />
      
      {/* Top Header */}
      <View style={styles.headerContainer}>
        <SafeAreaView>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={goBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('hire_drivers', 'Hire Drivers')}</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.getHelpText}>{t('get_help', 'Get Help')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Map Area */}
      <View style={styles.mapArea}>
        <NEMap
          mapStyle={StyleSheet.absoluteFillObject}
          homeLocation={mapHomeLocation}
          markers={mapMarkers}
          navigation={false}
          onMapCenterChanged={handleMapCenterChange}
        />
        
        {/* Floating Source Location Input */}
        {!selectedInput && (
          <View style={styles.floatingSourceBox}>
            <Ionicons name="location" size={24} color="#5e626a" style={styles.sourceIcon} />
            <TextInput
              style={styles.sourceInput}
              value={sourceLocation}
              onChangeText={setSourceLocation}
              placeholder="Search source location..."
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Mark Location Overlay */}
        {selectedInput && (
          <View style={styles.markLocationOverlay}>
            <View style={styles.markLocationCard}>
              <Ionicons name="location" size={24} color={colors.red || '#F44336'} />
              <Text style={styles.markLocationText}>
                {t('mark_location_on_map', 'Mark location on map')}
              </Text>
              <TouchableOpacity 
                style={styles.doneButton}
                onPress={handleDoneMarking}
              >
                <Text style={styles.doneButtonText}>{t('done', 'Done')}</Text>
              </TouchableOpacity>
            </View>
            {/* Center Pin Indicator */}
            <View style={styles.centerPinContainer} pointerEvents="none">
              <Ionicons name="location" size={40} color={colors.red || '#F44336'} style={styles.centerPin} />
            </View>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {t('pickup_drop_diff', "in one way, pickup & drop are at 'different' locations in city")}
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('oneWay')}
          >
            <MaterialCommunityIcons 
              name="ray-start-arrow" 
              size={24} 
              color={activeTab === 'oneWay' ? colors.black : '#999'} 
            />
            <Text style={[styles.tabText, activeTab === 'oneWay' && styles.activeTabText]}>
              {t('one_way', 'One Way')}
            </Text>
            {activeTab === 'oneWay' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('roundTrip')}
          >
            <MaterialCommunityIcons 
              name="sync" 
              size={24} 
              color={activeTab === 'roundTrip' ? colors.black : '#999'} 
            />
            <Text style={[styles.tabText, activeTab === 'roundTrip' && styles.activeTabText]}>
              {t('round_trip', 'Round Trip')}
            </Text>
            {activeTab === 'roundTrip' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('outstation')}
          >
            <MaterialCommunityIcons 
              name="highway" 
              size={24} 
              color={activeTab === 'outstation' ? colors.black : '#999'} 
            />
            <Text style={[styles.tabText, activeTab === 'outstation' && styles.activeTabText]}>
              {t('outstation', 'Outstation')}
            </Text>
            {activeTab === 'outstation' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#1f222b',
    paddingBottom: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 20,
    color: colors.white,
  },
  getHelpText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: '#00d289', // Green color from reference
    textDecorationLine: 'underline',
  },
  mapArea: {
    flex: 2, // Takes 2 portions
    position: 'relative',
  },
  floatingSourceBox: {
    position: 'absolute',
    top: -15, // Overlap slightly with header if desired, or just space it from top
    left: 16,
    right: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sourceIcon: {
    marginRight: 8,
  },
  sourceInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: colors.black,
  },
  bottomSheet: {
    flex: 1.5, // Takes the rest
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -16, // Overlap the map slightly
    overflow: 'hidden',
  },
  banner: {
    backgroundColor: '#e6f7ef', // Light green bg
    paddingVertical: 8,
    alignItems: 'center',
  },
  bannerText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#00a86b',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  activeTabText: {
    color: colors.black,
    fontFamily: Fonts.semi_bold,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: '#00a86b',
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
  },
  markLocationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markLocationCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.white,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  markLocationText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: colors.black,
    marginLeft: 8,
  },
  doneButton: {
    backgroundColor: '#00a86b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  doneButtonText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 14,
    color: colors.white,
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40, // Half of pin height roughly
    marginLeft: -20,
  },
  centerPin: {
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  }
});

export default HireDriversScreen;
