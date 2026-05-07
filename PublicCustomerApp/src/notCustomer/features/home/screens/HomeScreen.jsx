import {
  Animated, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  View,
  Alert
} from 'react-native';
import React, {useEffect, useRef, useState, useCallback,useContext} from 'react';
import { useTranslation } from 'react-i18next';


import SideDrawer from '../../../components/Drawer/SideDrawer';
import {colors, Fonts} from '../../../constants/constants';

import {useStackScreenStore} from '../../../store/useStackScreenStore';
import LocationHeader from '../components/LocationHeader';
import HistoryCard from '../../shared/component/HistoryCard';
import { useBottomSheetSpringConfigs } from "@gorhom/bottom-sheet";
import SearchIcon from '../../../assets/icons/SearchIcon.svg';
import MapIcon from '../../../components/Map/MapIcon';
import FavLabelItems from '../components/FavLabelItems';
import useLocationStore from '../../../store/useLocationStore';
import  LocationTypes  from '../../booking/types/LocationTypes.json';  
import useRideBookingLocationStore from '../../booking/store/useRideBookingLocationStore'
import useRideVehicleStore from '../../booking/store/useRideVehicleStore';
import { VEHICLE_LABELS } from '../../../constants/VehicleLabels';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import { height, utils, width } from '../../../utils/Utils';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import Marker from '../../../controllers/NEMap/Marker';
import useMapStore from '../../../features/map/store/useMapStore';

import  {useNearbyPollingControl}  from '../../../store/useNearByDriverPollingControl';
import PropTypes from 'prop-types';
import { checkNotificationPermissions, RequestNotificationPermission } from '../../../controllers/PermissionHandler';
import useScheduleTripStore from '../../../store/useScheduleTripStore';
import ScheduledTripBanner from '../components/ScheduledTripBanner';
import DynamicSection from '../components/DynamicSection';
import useNearbyDrivers from '../../../store/useNearByDrivers';
import useConfigStore from '../../../store/useConfigStore'; 
import { firebaselog_ridePlanning } from '../../../../common/utils/FirebaseAnalytics';
import SocialMediaModal from '../../../components/SocialMediaModal';
import { GlobalContext } from '../../../../context/GlobalContext';


const BottomSheetHeader = ({ makeRidePlan, style }) => {
  const { t } = useTranslation();
  const handlePress = useCallback(() => {
    makeRidePlan();
  }, [makeRidePlan]);

 

  
  return (
    <View style={[styles.bottomSheetHeader, style]}>
      <View style={styles.bottomSheetHeaderIconContainer}>
    <MapIcon />
    </View>
    <View style={styles.bottomSheetHeaderContainer}>
    <TouchableOpacity
          style={styles.searchContainer}
          onPress={handlePress}
          
        >
          <SearchIcon />
          <AdaptiveText style={styles.searchContainerText}>
            {t('where_do_you_want_to_go')}
          </AdaptiveText>
        </TouchableOpacity>
    </View>
    </View>
  )
}

const MapScreen = () => {
  const { t } = useTranslation();
   const { showModal } = useContext(GlobalContext);
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState(null);
  const {setStackScreen , setShowSocialMediaModal , showSocialMediaModal} = useStackScreenStore();
  const {location,currentLocationName} = useLocationStore();
  const {setRideStartLocation,setRideEndLocation,resetRideBookingLocation } = useRideBookingLocationStore()
  const { setSelectedVehicle } = useRideVehicleStore();
  const { fetchLatestDrivers, driversAll } = useNearbyDrivers();
 
  const {setMapMarkers,setMapBounds,setVehicleMarkers, setDirectionPoints , mapReady} = useMapStore();
  const { scheduledTrips } = useScheduleTripStore();
  const { appConfig } = useConfigStore();
  
  // useEffect(()=>{
  //   if(drivers?.length > 0 && AppConfig.SHOW_NEARBY_DRIVER){
  //     const markers = drivers.map((driver)=>{

  //       const marker = new Marker(
  //         driver.id || 'driver-marker',
  //         driver.vehicleType || 'Driver',
  //         driver.lon,
  //         driver.lat,
  //         driver.vehicleType.toLowerCase(),
  //         48,
  //         false,
  //         driver.bearing || 0
  //       );
  //       return marker
  //     })
  //     setMapMarkers(markers)
      
  //   }

  //   return ()=>{
  //     setMapMarkers([])
  //   }
  // },[drivers])


  // useEffect(()=>{
  //   if(location && location.length > 0){
  //     const bounds = utils.getBoundingBox([[location[0],location[1]]])
  //     const margin = [50, 100, 50, height*0.4]
  //     const finalBounds = [bounds, margin]
  //     setTimeout(() => {  
  //       setMapBounds(finalBounds);
  //     }, 2000);
  //   }
  // },[location])



  
  
  const scaleValue = useRef(new Animated.Value(1)).current;
  const offsetValue = useRef(new Animated.Value(0)).current;
  const closeButtonOffset = useRef(new Animated.Value(0)).current;


  const ANIMATION_CONFIG = {
    duration: 300,
    useNativeDriver: true,
  };





  const animateMenu = useCallback((toValue) => {
    try {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: toValue ? 0.9 : 1,
          ...ANIMATION_CONFIG,
        }),
        Animated.timing(offsetValue, {
          toValue: toValue ? 300 : 0,
          ...ANIMATION_CONFIG,
        }),
        Animated.timing(closeButtonOffset, {
          toValue: toValue ? -30 : 0,
          ...ANIMATION_CONFIG,
        }),
      ]).start();
    } catch (error) {
     console.log(error, 'animateMenu');
    }
  }, [scaleValue, offsetValue, closeButtonOffset]);


  
 
  const toggleMenu = useCallback(() => {
    try {
      animateMenu(!showMenu);
      setShowMenu(!showMenu);
    } catch (error) {
          console.log(error, 'toggleMenu');
    }
  }, [showMenu, animateMenu]);

  // Handle menu state changes
  useEffect(() => {
    if (!showMenu) {
      animateMenu(false);
    }
  
  }, [showMenu]);

  const normalizeVehicleType = useCallback((type) => {
    if (!type) {
      return 'driver';
    }
    return type.toLowerCase().replace(/\s+/g, '_');
  }, []);

  const updateMarkersWithDrivers = useCallback((driverList = null, vehicleTypeOverride = null) => {
    try {
      const drivers = Array.isArray(driverList) ? driverList : driversAll;

      if (!Array.isArray(drivers) || drivers.length === 0) {
        setVehicleMarkers([]);
        return;
      }
      const markers = drivers
        .map((driver) => {
          if (!driver) {
            return null;
          }

          const vehicleType = normalizeVehicleType(vehicleTypeOverride || driver.vehicleType);
          const coords = driver?.location?.coordinates;
          const longitude = Array.isArray(coords) && coords.length > 0 ? coords[0] : driver?.lon;
          const latitude = Array.isArray(coords) && coords.length > 1 ? coords[1] : driver?.lat;
          if (longitude == null || latitude == null) {
            return null;
          }
          const marker = new Marker(
            driver._id,
            driver.vehicleType || 'Driver',
            longitude,
            latitude,
            vehicleType,
            36,
            false,
            driver.bearing || 0
          );
          return marker;
        })
        .filter(Boolean);
     
      setVehicleMarkers(markers);
    } catch (error) {
      console.log('Error updating markers with drivers:', error);
    } 
  }, [driversAll, normalizeVehicleType, setVehicleMarkers]);  

  const updateVehicleMarkersWithDrivers = useCallback( async () => {
    try {
      if (!appConfig.SHOW_NEARBY_DRIVER) {
        return;
      }
      if (!Array.isArray(location) || location.length < 2) {
        console.warn('Location is not available for fetching drivers');
        return;
      }
      const drivers = await fetchLatestDrivers({
          latitude:  location[1],  
          longitude: location[0],
          radius: 10000
        });
        
        if (!Array.isArray(drivers) || drivers.length === 0) {
          setVehicleMarkers([]);
          return;
        }
        updateMarkersWithDrivers(drivers);
    } catch (error) {
      console.log('Error updating vehicle markers with drivers:', error);
    }
  }, [appConfig.SHOW_NEARBY_DRIVER, fetchLatestDrivers, location, setVehicleMarkers, updateMarkersWithDrivers]);

  useEffect(()=>{
    
    
    if(appConfig.SHOW_NEARBY_DRIVER){
      
      updateVehicleMarkersWithDrivers();
    }
  },[appConfig.SHOW_NEARBY_DRIVER, updateVehicleMarkersWithDrivers])

  useEffect(() => {
    (async () => {
      try {
       const notifGranted = await checkNotificationPermissions();
        if (!notifGranted) {
          await RequestNotificationPermission();
        }
      } catch (e) {
        // no-op
      }
    })();
  }, []);


  

  
  const setHomeMapMarker = (locationData) => {
   
      const randomId = `home-marker`;
      const homeMarker = new Marker(  
        randomId,
        randomId,
        locationData[0],  
        locationData[1],
        'pin_inactive',
        36,
        true,  
        0
      );
      homeMarker.setAnimate(true);
      homeMarker.setAnimationTime(10000);
      homeMarker.setFocus(false)
      homeMarker.setDoRotation(false)
      setMapMarkers([homeMarker]);
    
  };

  useEffect(()=>{
    setDirectionPoints(null);
    resetRideBookingLocation()
    if(location && location.length > 0){
      
      const bounds = utils.getBoundingBox([[location[0],location[1]]],1000)
      const margin = [10, 10, 10, 10+height*0.4]
      const finalBounds = [bounds, margin]
      setTimeout(() => {
        setMapBounds(finalBounds);
        setHomeMapMarker(location)
      },100);
    }
    return () => {
      setMapMarkers([])
      setVehicleMarkers([])
    } 
  },[location,mapReady])

  const handleMenu = useCallback(() => {
    try {
      setShowMenu(!showMenu);
    } catch (error) {
      console.log(error, 'handleMenu');
    }
  }, [showMenu]);
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 50,
    stiffness: 500,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.1,
    restSpeedThreshold: 0.1,
  });

  
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const granted = await checkFineLocationPermissions();
  //       setHasLocationPermission(!!granted);
  //     } catch (e) {
  //       setHasLocationPermission(false);
  //     }
  //   })();
  // }, []);

  // const handleEnableLocationPermission = useCallback(async () => {
  //   try {
  //     const granted = await RequestFineLocationPermission();
  //     setHasLocationPermission(!!granted);
  //   } catch (e) {
  //     setHasLocationPermission(false);
  //   }
  // }, []);

  const onHistoryPress = useCallback((item) => {
    try {
      if (!item) {
        throw new Error('Invalid history item');
      }
      if (!location || !Array.isArray(location) || location.length < 2 || !currentLocationName) {
        Alert.alert(t('location_not_found'))
        return;
      }
      const locationData ={
        name:"Current Location",
        latitude:location[1],
        longitude:location[0],
        address:currentLocationName.address,
        placeName:currentLocationName.placeName,
        type:LocationTypes.START_LOCATION,
        locationFrom:"MAP",
        currentLocation:true
      }
     
      setRideStartLocation(locationData)
      setRideEndLocation(item)
      setStackScreen("PlanRideScreen",{})
     
     
    } catch (error) {
      console.log(error, 'onHistoryPress');
    }
  }, [location, currentLocationName, setRideStartLocation, setRideEndLocation, setStackScreen, t]);



  const ErrorMessage = () => (
    error && (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => setError(null)}
        > 
          <Text style={styles.errorButtonText}>{t('dismiss')}</Text>
        </TouchableOpacity>
      </View>
    )
  );

  const handleFavouriteLocationPress = useCallback((locationType,labelLocation) => {
    try {

      if (!labelLocation) {
        return;
      }
      if(!location || !currentLocationName || !location.length){
        Alert.alert(t('location_not_found'))
        return;
      }
      const locationData ={
        name:"Current Location",
        latitude:location[1],
        longitude:location[0],
        address:currentLocationName.address,
        placeName:currentLocationName.placeName,
        type:LocationTypes.START_LOCATION,
        locationFrom:"MAP",
        currentLocation:true

      }
      setRideStartLocation(locationData)
      setRideEndLocation(labelLocation)
      setStackScreen("PlanRideScreen",{})
    } catch (error) {
      console.log(error, 'handleFavouriteLocationPress');
    }
    
  }, [location, currentLocationName, setRideStartLocation, setRideEndLocation, setStackScreen, t]);

  const setCurrentLoactionPickupLocation = useCallback(() => {
    if(!location || !currentLocationName || !location.length){
      return;
    }
     const locationData ={
      name:"Current Location",
      latitude:location[1],
      longitude:location[0],
      address:currentLocationName.address,
      placeName:currentLocationName.placeName,
      type:LocationTypes.START_LOCATION,
      locationFrom:"MAP",
      currentLocation:true
    }
    setRideStartLocation(locationData)
  }, [location, currentLocationName]);
  const makeRidePlan = useCallback((screenParams = {}) => {

    if(!location || !currentLocationName || !location.length){
      setStackScreen("PlanRideScreen", screenParams)
      return;
    }

    setCurrentLoactionPickupLocation();
  
    setStackScreen("PlanRideScreen", screenParams)
  }, [location, currentLocationName, setRideStartLocation, setStackScreen])

    const handleServiceVehicleSelect = useCallback((item) => {
   
      if(!item || !item.key){
        return;
      }

      

      const vehicleLabel = item.label || VEHICLE_LABELS[item.key] || item.key;

     
      if(item.key == "schedule_trip"){
        firebaselog_ridePlanning('RP_Type(RP_T)', `RP_T:scheduled_trip`);
        makeRidePlan({ mode: "SCHEDULE_TRIP" });
        return;
      }
      if(item.key == "female_driver"){
        firebaselog_ridePlanning('RP_Pref(RP_P)','RP_P:female_driver')
        makeRidePlan({mode: "FEMALE_DRIVER"});
        return;
      }

      if(item.key == "night_trip"){
        firebaselog_ridePlanning('RP_Pref(RP_P)','RP_P:night_ride')
        makeRidePlan({mode: "NIGHT_TRIP"});
        return;
      }


      if(item.key == "bannerStops"){
        firebaselog_ridePlanning('RP_Stop(RP_S)', `RP_S:stop_added`);
        setCurrentLoactionPickupLocation();
        setStackScreen("PlanRideScreen",{});
        setStackScreen('WaypointScreen',{fromPlanScreen:true});
        return;
      }

      if(item.key == "bannerFamily"){
        makeRidePlan({mode: "FAMILY_RIDE"});
        return;
      }
      if(item.key == "bannerAuto"){
        makeRidePlan({mode: "FEMALE_DRIVER"});
        return;
      }

      if(item.key == "acting_driver"){
        setCurrentLoactionPickupLocation();
        setStackScreen('ActingDriverVehicleSelectScreen', {});
        // setStackScreen('MyVehiclesScreen', {});
        return;
      }

      if(item.key == "mygarage"){
        setStackScreen('MyVehiclesScreen', {});
        return;
      }

      
      setSelectedVehicle({
        id: item.key,
        type: item.key.toUpperCase(),
        vehicleType: item.key.toUpperCase(),
        label: vehicleLabel,
        source: "home_services",
      });
      firebaselog_ridePlanning('RP_Vehicle_Type(RP_VT)', `RP_VT:${item.key}`);

      makeRidePlan({ preselectedVehicleType: item.key });
      
    }, [setSelectedVehicle, makeRidePlan, setCurrentLoactionPickupLocation, setStackScreen])

    const renderBottomSheetHandle = useCallback((handleProps) => (
      <BottomSheetHeader {...handleProps} makeRidePlan={makeRidePlan} />
    ), [makeRidePlan]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      

      <Animated.View style={styles.headerContainer}>
            <LocationHeader toggleMenu={toggleMenu} showMenu={showMenu} />
      </Animated.View>

      <BottomSheetWrapper 
       snapPoints={['40%','80%']}
       index={0}
       enablePanDownToClose={false}
       enableOverDrag={true}
       enableScroll={true}
        enableHandlePanningGesture={false}
        activeOffsetY={[-25, 25]}
        overdragResistanceFactor={6}
        animationConfigs={animationConfigs}
      
       handleComponent={renderBottomSheetHandle}
       handleIndicatorStyle={{
         backgroundColor: '#DEDEDE',
         width: 50,
         height: 4,
       }}>
        
        <View style={{marginTop:60}}>
        
          {<ScheduledTripBanner/>}    {/* need to implement */}
        
          <DynamicSection onSelect={handleServiceVehicleSelect}/>
          <FavLabelItems onLabelPress={handleFavouriteLocationPress}/>
          <HistoryCard selectCallback={onHistoryPress} header={true} bottomborder={false}  fromHomeScreen={true}/>
        </View>
        
        
      </BottomSheetWrapper>

      {showMenu && <SideDrawer handleMenu={handleMenu} />}
      {showSocialMediaModal && <SocialMediaModal onClose={() => setShowSocialMediaModal(false)} visible={showSocialMediaModal} />}
      <ErrorMessage />
    </>
  );
};

export default MapScreen;

BottomSheetHeader.propTypes = {
  makeRidePlan: PropTypes.func,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  headerContainer: {
    zIndex: 1,
  },
  gradientOverlay: {
    height: 50,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 10,
    width:"100%",
  
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '90%',
    alignSelf: 'center',
    gap: 10,
    marginTop: 20,
    borderWidth: 0.3,
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4b48ab',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchContainerText: {
    fontFamily: Fonts.regular,
  
    fontSize: 16,
      
    textAlign: 'left',
    color: '#121212',
  },
  buttonText: {
    fontFamily: Fonts.medium,
    color: colors.white,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    color: colors.white,
    fontFamily: Fonts.medium,
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    zIndex: 1000,
  },
  errorText: {
    color: '#c62828',
    fontFamily: Fonts.medium,
    marginBottom: 10,
  },
  errorButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: '#f44336',
    borderRadius: 5,
  },
  errorButtonText: {
    color: colors.white,
    fontFamily: Fonts.medium,
    fontSize: 12,
  },


  bottomSheetHeader: {
    display:"flex",
    flexDirection:"column",
    justifyContent:"space-between",
    alignSelf:"center",
    alignItems:"left",
    position:"absolute",    
    width:"100%",
    flex:1,
    gap:5,
    top:-45,
    
  },
  bottomSheetHeaderIconContainer: {
  paddingHorizontal:10,
  },
  bottomSheetHeaderContainer: {
    width: '100%',
    paddingTop:15,
    backgroundColor:colors.white,
    paddingBottom:10,
    paddingHorizontal:10,
    borderTopLeftRadius:20,
    borderTopRightRadius:20,
    borderTopWidth:1,
    borderTopColor:colors.grey,
  },
  bottomSheetContent: {
    marginTop:height*0.06,
    flex:1,
    
  
  },
});
