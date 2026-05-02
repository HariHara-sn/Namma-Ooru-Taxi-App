import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { useStackScreenStore } from '../store/useStackScreenStore';
import Homescreen from '../features/home/screens/HomeScreen.jsx'
import MapContainer from '../features/map/components/MapContainer.js';
import { RequestAllPermissions } from '../controllers/PermissionHandler';
import locationTask from '../controllers/GetCurrentLocation';
import SearchScreen from '../features/search/screens/SearchScreen';
import WaypointScreen from '../features/booking/screens/WaypointScreen';
import { StatusBar, View, StyleSheet, AppState, Platform, Alert } from 'react-native';
import LottieView from 'lottie-react-native';
import messaging from '@react-native-firebase/messaging';
import useUserInfoStore from '../../common/store/useUserInfoStore.js';
import { getStoredLocation, getPreferenceShowRideStatus} from '../storage/userLocalStorage';
import PickLocationScreen from './PickLocationScreen';
import { useCustomBackHandler } from '../hooks/useCustomBackHandler';
import PlanRideScreen from '../features/booking/screens/PlanRideScreen.jsx';
import BookRideScreen from '../features/booking/screens/BookRideScreen.jsx';
import BookActingDriverScreen from '../features/booking/screens/BookActingDriverScreen.jsx';
import { getUserStats, confirmTripStatus ,getCurrentTrip, updateFcmTokenAPI} from '../API/EndPoints/EndPoints';
import RideStatus from '../features/rideStatus';
import useCurrentRideInfoStore from '../features/rideStatus/store/useCurrentRideInfoStore';
import PaymentScreen from '../features/payment/screens/PaymentScreen';
import useAssignedDriverInfoStore  from '../features/rideStatus/store/useAssignedDriverInfoStore';
import TripFeedbackScreen from '../features/rating/screens/TripFeedbackScreen';
import { DataStore } from '../controllers/DataStore';
import useMapStore from '../features/map/store/useMapStore';
import { useNearbyPollingControl } from '../store/useNearByDriverPollingControl';

import LanguageScreen from '../../common/screens/OnBoard/LanguageScreen.jsx';
import AboutScreen from '../features/Profile/MyAccountScreen';
import RideDetailScreen from '../features/rideHistory/screens/RideDetailScreen';
import ContactScreen from '../features/about/screens/ContactScreen';
import SavedPlacesScreen from '../features/savedPlaces/screens/SavedPlacesScreen';
import PreferencesScreen from '../features/preferences/screens/PreferencesScreen';
import LegalScreen from '../features/legal/screens/LegalScreen';
import AddPlaceDetailScreen from '../features/savedPlaces/screens/addplaceDetailScreen';
import GoogleMapScreen from '../features/googleMap/screens/GoogleMapScreen';
import SupportScreen from '../features/support/screens/SupportScreen';
import TicketDetailScreen from '../features/support/screens/TicketDetailScreen';
import TripSelectionScreen from '../features/support/screens/TripSelectionScreen';
import useLocationStore from '../store/useLocationStore';
import PREF from '../storage/PREF';
import { useDebounce } from '../hooks/useDebounce';
import useConfigStore from '../store/useConfigStore';
import AdaptiveText from '../components/Common/AdaptiveText';
import { Fonts } from '../constants/constants';
import SearchAPI from '../controllers/NEMap/Search';
import { useNavigation } from '@react-navigation/native';
import { checkFineLocationPermissions, isSystemLocationEnabled, openSystemLocationSettings } from '../controllers/PermissionHandler';
import EmergencyHomeScreen from '../features/emergencyContact/screens/EmergencyHomeScreen';
import { CommonActions } from '@react-navigation/native';
import useRideMatching from '../hooks/useRideMatching';
import TrackingTestScreen from '../../common/screens/TrackingTestScreen.jsx';
import TestScreen from './TestScreen';
import { useNetwork } from '../../context/NetworkContext';
import DeviceInfo from 'react-native-device-info';
import { showNotification } from '../components/NotificationManger';
import { useTranslation } from 'react-i18next';
import ScheduleScreen from '../features/schedule/screens/ScheduleScreen';
import useScheduleTripStore from '../store/useScheduleTripStore';
import RideHistory from '../features/rideHistory/index.js';
import { utils } from '../utils/Utils';
import EmergencyContactScreenOverlay from '../../common/screens/OnBoard/EmergencyContactScreen.jsx';
import { checkUpdateStatus } from '../components/UpdateChecker';
import UpdateOverlay from '../components/UpdateOverlay';
import OverdueTripModal from '../components/OverdueTripModal';
import LocationPermissionOverlay from '../components/LocationPermissionOverlay';
import UnableToConnectOverlay from '../components/UnableToConnectOverlay';
import { log } from '@react-native-firebase/crashlytics';
import ContributionScreen from '../features/contribution/screens/ContributionScreen.jsx';
import DriverAccessScreen from '../../common/screens/Driver/DriverAccessScreen.jsx';
import ActingDriverVehicleSelectScreen from '../features/home/screens/ActingDriverVehicleSelectScreen.jsx';
import MyVehiclesScreen from '../features/myVehicles/screens/MyVehiclesScreen.jsx';
import BillsAndPhotosScreen from '../features/rideStatus/screens/BillsAndPhotosScreen';
import TripSettingsScreen from '../features/rideStatus/screens/TripSettingsScreen';
import TripTimelineScreen from '../features/rideStatus/screens/TripTimelineScreen';
import NotificationSettingsScreen from '../features/notifications/screens/NotificationSettingsScreen';
import useRideMatchStore from '../features/rideStatus/store/useRideMatchStore.js';
import usePaymentStore from '../features/payment/store/usePaymentStore.js';
import { consumeUserStatsPrefetch } from '../controllers/UserStatsPrefetch';
import useRideBookingLocationStore from '../features/booking/store/useRideBookingLocationStore.js';
import { setActive } from 'react-native-sound';
import GlobalContext from '../../context/GlobalContext.js';
import useUserStore from '../../common/store/useUserStore.js';
const BootLoaderOverlay = React.memo(function BootLoaderOverlay() {
  return (
    <View style={styles.overlay}>
     
      <View style={styles.lottieContainer}>
        <LottieView
          source={require('../assets/lottie/car_travel.json')}
          autoPlay
          loop
          renderMode="HARDWARE"
          style={styles.lottie}
        />
        
      </View>
      <AdaptiveText style={styles.loadingText}>Warming up the engine…</AdaptiveText>
      
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(254, 254, 254, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  lottieContainer: {
    backgroundColor:'rgb(249, 249, 249)' ,
    borderRadius: 200,
    padding: 20,
   
   
    
  },
  lottie: {
    width: 220,
    height: 220,
  },
  loadingText: {
    position: 'absolute',
    bottom: "20%",
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
   
    color: 'black',
   
    fontFamily: Fonts.semi_bold,
  },
});

const Home = () => {
  const {location, setCurrentLocationName} = useLocationStore();
  const { setLocation } = useLocationStore.getState();
  const { stackScreen,reset,goBackToScreen ,getCurrentScreenName} = useStackScreenStore();
  const { rideStartLocation, rideEndLocation } = useRideBookingLocationStore();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const appState = useRef(AppState.currentState);
  const permissionsRequested = useRef(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [locationCheckComplete, setLocationCheckComplete] = useState(false);
  const [locationBlockReason, setLocationBlockReason] = useState(null);
  const { appConfig ,updateAvailable} = useConfigStore();
  const { driverMatched, setDriverMatched } = useRideMatchStore();
  const { showModal} = useContext(GlobalContext);
  // /const {currentTripId,setCurrentTripId } = usePaymentStore();
  
  const { setHomelocation, setWorklocation, setIsPreferenceShow} = useUserInfoStore();
  const { setStackScreen } = useStackScreenStore();
  const { setCurrentRideInfo , setFareDetails ,tripId,resetCurrentRideInfo} = useCurrentRideInfoStore();
  const { setAllocatedDriverInfo ,clearDriverInfo} = useAssignedDriverInfoStore();
  const { setUserdetails ,setID,setUserFavPlaces,setRatingData,setTotalSpend,setCancelledTrips,setCompletedTrips,setTotalTrips,id,resetUserInfo,setCancelledTripsOccurance} = useUserInfoStore();
  const { setMapShown , mapShown, setUserLocation} = useMapStore();
  const { setTarget } = useNearbyPollingControl();
  const { setConfig } = useConfigStore();
  const { initializeSocket,resetSocket} = useRideMatching();
  const { isConnected } = useNetwork();
  const { setScheduledTrips } = useScheduleTripStore();
  const prevIsConnectedRef = useRef(isConnected);
  const [showemergencyOverlay, setShowEmergencyOverlay] = useState(false);
  const [updateMode, setUpdateMode] = useState('none');
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);
  // Removed modal flow; PaymentScreen will display details

  const hasInitialLocationProcessed = useRef(false);
  const lastProcessedKey = useRef(null);
  const geocodeCache = useRef(new Map());
  const processLocationRef = useRef(null);
  const lastProcessedLocationRef = useRef(null); // Track last processed location to avoid rerenders
  const isCheckingRideRef = useRef(false);
  const {setActiveTripId ,activeTripId} = useUserInfoStore();
  const {setIsDev} = useUserStore();
  
 
  const stableDebounceCallback = useRef((lng, lat) => {
    if (processLocationRef.current) {
      processLocationRef.current(lng, lat);
    }
  }).current;
  const debouncedProcessLocation = useDebounce(stableDebounceCallback, 600);


  processLocationRef.current = async (lng, lat) => {
    try {
      const key = `${lng},${lat}`;
      const cachedAddress = geocodeCache.current.get(key);
      if (cachedAddress) {
        setCurrentLocationName(cachedAddress);
        return;
      }
      const search = new SearchAPI();
      const response = await search.reverseGeocode(lng, lat);
      geocodeCache.current.set(key, response);
      setCurrentLocationName(response);
    } catch (e) {
      console.error('Failed to fetch address', e);
    }
  };
  
  const checkAllPermissions = async () => {
    if (permissionsRequested.current) return;

    permissionsRequested.current = true;
    try {
      const permissions = await RequestAllPermissions();
      const hasFullAccess = await navigateToPermissionIfNeeded();

      if (!hasFullAccess) {
        permissionsRequested.current = false;
        return;
      }

      if (permissions.location) {
        await locationTask.getCurrentLocation();
      }
    } catch (error) {
      permissionsRequested.current = false;
      console.error('Failed to request app permissions', error);
    }


    
  };

  useEffect(() => {
    console.log("activeTripId changed in Home.js",activeTripId);
  }, [activeTripId]);


  const checkEmergencyContactSaved = async () => {
    const emergencyContact = await DataStore.loadData('emergency_contact');
    console.log("emergencyContact",emergencyContact)
    if (!emergencyContact?.data) {
      return setShowEmergencyOverlay(true);
    } else {
      return setShowEmergencyOverlay(false);
    }
  };

  const updateLocationDebounced = useCallback(async (lng, lat) => {
    setLocation([lng, lat]);
    if (lng && lat) {
      try {
        const key = `${lng},${lat}`;

      
        if (lastProcessedKey.current === key) {
          const cached = geocodeCache.current.get(key);
          if (cached) {
            setCurrentLocationName(cached);
          }
          return;
        }
        lastProcessedKey.current = key;

     
        if (!hasInitialLocationProcessed.current) {
          hasInitialLocationProcessed.current = true;
          await processLocationRef.current(lng, lat);
          return;
        }

     
        debouncedProcessLocation(lng, lat);
      } catch (e) {
        console.error('Failed to handle location update', e);
      }
    }
  }, [setLocation, setCurrentLocationName, debouncedProcessLocation]);



  useEffect(() => { 
    const currentScreen = getCurrentScreenName();
    if (driverMatched && currentScreen === 'RideStatus') {  
    
      // checkOnGoingRideAndLog(true); 
      // setDriverMatched(false);
      
    }

  }, [driverMatched,getCurrentScreenName]);
  
  const handleUserLocatioChange = useCallback(currentLocation => {
    const lng = currentLocation?.longitude;
    const lat = currentLocation?.latitude;
    if (lng == null || lat == null) {
      return;
    }
    
    // Get last processed location from ref (avoids store access and rerenders)
    const lastProcessed = lastProcessedLocationRef.current;
    
    // If no previous location, update immediately
    if (!lastProcessed) {
      lastProcessedLocationRef.current = { lng, lat };
      updateLocationDebounced(lng, lat);
      return;
    }
    
    // Calculate distance in meters
    const distanceInMeters = utils.calculateDistanceInMeters(
      lastProcessed.lat,
      lastProcessed.lng,
      lat,
      lng
    );
    
    // Only update if moved more than 100 meters
    if (distanceInMeters > 100) {
      lastProcessedLocationRef.current = { lng, lat };
      updateLocationDebounced(lng, lat);
    }
  }, [updateLocationDebounced]);

  useEffect(() => {
    setUserLocation(handleUserLocatioChange);
  }, [handleUserLocatioChange, setUserLocation]);

  useEffect(() => {
    if (!hasLocationPermission) {
      return;
    }

    (async () => {
      try {
        await locationTask.getCurrentLocation();
      } catch (error) {
        console.log('Failed to fetch current location', error);
      }
    })();
  }, [hasLocationPermission]);

  const logout = async () => {

   
    await DataStore.storeData('access_token', null);
    await DataStore.storeData('refresh_token', null);
    await DataStore.storeData('userdetails', null);
    reset()
    resetUserInfo();
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
  
  }


  const checkFavouriteLocation = async () => {
    const homeLocation = await getStoredLocation('Home');
    const workLocation = await getStoredLocation('Work');
 
    setHomelocation(homeLocation);
    setWorklocation(workLocation);
  };

  const checkDeviceImei = async (fcmToken) => {
    const deviceImei = await DeviceInfo.getUniqueId();
    if(deviceImei === fcmToken?.deviceImei){
      return true;
    }
    return false;
  } 

  const checkTrip = async (response,currentTripId=null) => {
    // console.log("checkTrip response",response, currentTripId)
    if(response?.trip?.status == "CANCELLED" && !response?.trip?.fareDetails && currentTripId ){
      showModal('ride_cancelled_by_driver', null, {type: 'warning', imageName: 'cancelled_auto'});
    }
    if(!response?.trip || !response?.success){
      return;
    }

    if(response?.trip?.status == "CANCELLED" && !response?.trip?.fareDetails && currentTripId ){
      showModal('ride_cancelled_by_driver', null, {type: 'warning', imageName: 'cancelled_auto'});
    }

    if(response?.trip?.status == "DROPPED" || ( response?.trip?.status == "CANCELLED" && response?.trip?.fareDetails)){
      if(response?.trip?._id){
        setStackScreen('PaymentScreen', { lastTripId:response?.trip?._id});
        }
        return;   
      }
      if((response?.trip?.status == "COMPLETED" || response?.trip?.status == "DIVERGED") && currentTripId ){
        setStackScreen('TripFeedbackScreen', { });
        return;
      }
      
      if(response?.trip){
        const _id = response?.trip?._id || null;
        setActiveTripId(_id);
        if(response?.trip?.status == "PENDING")
        {
          return;
        }

        if(response?.trip?.status == "CANCELLED"|| response?.trip?.status == "COMPLETED" || response?.trip?.status == "DIVERGED") {
          await DataStore.clearData(PREF.CURRENT_TRIP)
          setActiveTripId(null);
          resetCurrentRideInfo();
         
          const currentScreen = getCurrentScreenName();
        
        
          const { rideStartLocation: latestStart, rideEndLocation: latestEnd } = useRideBookingLocationStore.getState();
          const directionsReady = !!latestStart && !!latestEnd;
        
          if (currentScreen == 'RideStatus') {
             if(directionsReady){
              goBackToScreen('BookRideScreen',{});
             }else{
              reset();
             }
          }
          return;
        }
        // console.log("Setting current ride info with trip data", response.trip);
        setCurrentRideInfo(response?.trip);

        if(response?.assignDriver){
          setAllocatedDriverInfo(response?.assignDriver);
        }
        if(response?.trip?.fareDetails){
          const fareData = {
            fareDetails:response?.trip?.fareDetails,
          }
          if(response?.trip?.customerInvoice){
            fareData.customerInvoice = response?.trip?.customerInvoice;
          }
          setFareDetails(fareData)
        }
        setStackScreen('RideStatus', { });


        // Check if trip has exceeded estimated duration by 10 minutes from pickup context
        if(response?.trip?.status !== "ACCEPTED"){
        const pickupArrivalTime = response?.trip?.stops?.[0]?.arrivalTime || null;
        const isActingDriverTrip = response?.trip?.isActingDriverTrip || null;
        if (isActingDriverTrip) return; // Skip overdue check for acting driver trips as they may have different rules
        try{
          const isOverdue = utils.isTripOverEstimatedDuration(
            response?.trip?.bookingTime,
            pickupArrivalTime,
            response?.trip?.estimatedDuration,
            90
          );
       
          if(isOverdue){
            setShowOverdueModal(true);
          }
        } catch (e) {
          console.error('Error checking overdue trip:', e);
        }
        
    }}
  }

  const getFcmToken = async () => {
    try {
      const fcmToken = await messaging().getToken();
      return fcmToken;
    } catch (error) {
      console.log('Error getting FCM token: ', error);
    }
  };

  const updateFCMToken = async () => {
    try {
      const fcmToken = await getFcmToken();
      const deviceImei = await DeviceInfo.getUniqueId().catch(error => {
        console.log('Error getting device IMEI: ', error);
      });
      const tokenCred = {
        token: fcmToken,
        deviceImei: deviceImei,
      };

      const response = await updateFcmTokenAPI(tokenCred);
      if (!response?.success) {
        Alert.alert(
          t('update_fcm_failed_title', 'Unable to update'),
          t('update_fcm_failed_message', 'We could not update your notification settings. Please try again.'),
          [
            {
              text: t('retry', 'Retry'),
              onPress: () => {
                updateFCMToken();
              },
            },
            {
              text: t('cancel', 'Cancel'),
              style: 'cancel',
            },
          ],
        );
        return;
      }
    } catch (error) {
      console.error('Error updating FCM token:', error);
      Alert.alert(
        t('update_fcm_failed_title', 'Unable to update'),
        t('update_fcm_failed_message', 'Please try again.'),
        [
          {
            text: t('retry', 'Retry'),
            onPress: () => {
              updateFCMToken();
            },
          },
          {
            text: t('cancel', 'Cancel'),
            style: 'cancel',
          },
        ],
      );
    }
  }


  const checkConfig = async (Response,currentTripId=null) => {
    
    try {
      if (!Response?.success) {
        setConfigError(true);
        setShowNetworkError(true);
        return;
      }

  
      if (Response?.success) {


        if (showNetworkError) {
          setShowNetworkError(false);
        }
        if (configError) {
          setConfigError(false);
        }



        if(Response?.userStats?.deviceMeta?.buildNumber){
          const lastBuildNumber = parseInt(Response?.userStats?.deviceMeta?.buildNumber);
          if(Response?.appConfig?.FORCE_UPDATE){
            let platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
            const forceUpdateConfig = Response?.appConfig?.FORCE_UPDATE[platform]?.BUILD_NUMBER

            console.log("Checking for forced update. Last build number:", lastBuildNumber, "Force update config:", forceUpdateConfig);
            if(forceUpdateConfig && lastBuildNumber < forceUpdateConfig){
              showNotification(t('session_expired'), t('session_expired_message'), 'warning');
              logout()
              return
            }
          
        }

       
      }
       if(Response?.userStats?.dev){
          console.log("User is identified as a developer, disabling firebase Events");
          setIsDev(true);
        }


        if (Response?.userStats?.fcmToken) {
          const isActiveLogin = await checkDeviceImei(Response?.userStats?.fcmToken);
          if (!isActiveLogin) {
            showNotification(t('session_logged_out_title'), t('session_logged_out_other_device_message'), 'warning');
            logout();
            return;
          }
          console.log("FCM Token isUpdated status:",Response?.userStats?.fcmToken?.isUpdated);
          if(!(Response?.userStats?.fcmToken?.isUpdated)){
             await updateFCMToken();
          }
        }

        if (!(Response?.userStats)) {
          logout();
          return;
        }

        if (Response?.userStats?.name == "") {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'RegisterationScreen' }],
            }),
          );
        }

        if (Response?.scheduleTrips && Response?.scheduleTrips?.length > 0) {
          setScheduledTrips(Response?.scheduleTrips);
        }

        if (Response?.appConfig) {
          Response.appConfig['SHOW_NEARBY_DRIVER'] = true;
          setConfig(Response.appConfig);
          if (Response.appConfig?.FORCE_UPDATE && !currentTripId) {
            console.log("Checking for updates due to app config FORCE_UPDATE");
            checkForUpdates(Response.appConfig.FORCE_UPDATE);
          }else{
            console.log("No FORCE_UPDATE flag or active trip, skipping update check.");
          }
        } else {
          setConfigError(true);
        }

        if (Response?.userStats?.favPlaces?.length > 0) {
          setUserFavPlaces(Response?.userStats?.favPlaces);
        }

        if (Response?.userStats?.rating) {
          setRatingData(Response?.userStats?.rating);
        }

        if(Response?.userStats?.stats?.cancelTripOccurance){
          setCancelledTripsOccurance(Response?.userStats?.stats?.cancelTripOccurance);
        }
        if (Response?.userStats?.stats?.completedTrips) {
          setCompletedTrips(Response?.userStats?.stats?.completedTrips);
        }

      } else {
        setConfigError(true);
        setShowNetworkError(true);
      }
    } catch (error) {
      console.error('Error fetching ongoing ride:', error);
      setConfigError(true);
      setShowNetworkError(true);
    }

  }

  const checkOnGoingRideAndLog = async (tripOnly=false) => {
    console.log("Checking ongoing ride...");
    console.log("tripOnly flag:", tripOnly);
    if (isCheckingRideRef.current) {
      return;
    }
    isCheckingRideRef.current = true;
    try {
      setConfigError(false);
      const currentTrip = await DataStore.loadData(PREF.CURRENT_TRIP);
      const currentTripId = currentTrip?.data || null;

      const response = tripOnly ? await getCurrentTrip() : await getUserStats(currentTripId);
      console.log('Ongoing ride response:', response);

      if (!tripOnly) {
        await checkConfig(response, currentTripId);
      }
      await checkTrip(response,currentTripId);

    } catch (error) {
      console.error('Error fetching ongoing ride:', error);
    } finally {
      isCheckingRideRef.current = false;
      setBootLoading(false);
    }
  }

  const retryLoadAppConfig = async () => {
    setConfigError(false);
    setShowNetworkError(false);
    setBootLoading(true);
    await checkOnGoingRideAndLog();
  };
  // Expose refresh handler globally so other screens can trigger it
  useEffect(() => {
    global.checkOnGoingRideAndLog = checkOnGoingRideAndLog;
    return () => {
      if (global.checkOnGoingRideAndLog === checkOnGoingRideAndLog) {
        global.checkOnGoingRideAndLog = undefined;
      }
    };
  }, [checkOnGoingRideAndLog]);




  const checkPreferenceShowRideStatus = async () => {
    const preferenceShowRideStatus = await getPreferenceShowRideStatus();
    if(preferenceShowRideStatus == "true"){
      setIsPreferenceShow(true);
    }
  }

 const checkForUpdates = async (forceUpdateConfig) => {
   const mode = await checkUpdateStatus(forceUpdateConfig);
   
   const isForce = mode === 'force';
   const isAndroidForce = Platform.OS === 'android' && isForce;
   const isIOSForce = Platform.OS === 'ios' && isForce;
   if (isAndroidForce || isIOSForce) setUpdateMode(mode);
 };





  const loadUserDetails = async () => {
    
    const userdetails = await DataStore.loadData('userdetails');
    
    if(userdetails.data){
      
      setUserdetails(userdetails.data);
      setID(userdetails.data._id);
      if(userdetails.data._id){
        await initializeSocket(userdetails.data._id);
      }
    }
  
  }

  const coordsbasedDatafetch = async () => {
    
  } 

 


  useEffect(() => {
    checkAllPermissions();
    loadUserDetails();
    checkFavouriteLocation();
    checkPreferenceShowRideStatus();
    checkOnGoingRideAndLog()
    checkEmergencyContactSaved();
  }, []);

  const navigateToPermissionIfNeeded = useCallback(async () => {
    try {
      const [granted, systemEnabled] = await Promise.all([
        checkFineLocationPermissions(),
        isSystemLocationEnabled(),
      ]);
      const hasFullAccess = !!granted && !!systemEnabled;

      setHasLocationPermission(hasFullAccess);

      if (!granted) {
        setLocationBlockReason('permission');
        permissionsRequested.current = false;
        navigation.navigate('LocationPermission');
        return false;
      }

      if (!systemEnabled) {
        setLocationBlockReason('services');
        permissionsRequested.current = false;
        return false;
      }

      setLocationBlockReason(null);
      return true;
    } catch (error) {
      console.log('error', error);
      setHasLocationPermission(false);
      setLocationBlockReason('permission');
      permissionsRequested.current = false;
      return false;
    } finally {
      setLocationCheckComplete(true);
    }
  }, [navigation]);

  const handleLocationOverlayAction = useCallback(async () => {
    if (locationBlockReason === 'services') {
      await openSystemLocationSettings();
      return;
    }

    navigation.navigate('LocationPermission');
  }, [locationBlockReason, navigation]);

  useEffect(() => {
    (async () => {
      try {
        // Ensure we cache current permission state early
        const grantedNow = await checkFineLocationPermissions();
        setHasLocationPermission(!!grantedNow);
        const onBoarding = await DataStore.loadData('onBoarding');
        if (onBoarding?.data === 'onBoardingDone') {
          await navigateToPermissionIfNeeded();
        }
      } catch (e) {
        // no-op
      }
    })();
  }, [navigateToPermissionIfNeeded]);

  useEffect(() => {
    const handleReconnect = async () => {
      if (prevIsConnectedRef.current === false && isConnected) {
        await checkOnGoingRideAndLog();
        if (id) {
          await resetSocket();
          await initializeSocket(id);
        }
      }
      prevIsConnectedRef.current = isConnected;
    };
    handleReconnect();
  }, [isConnected, id, initializeSocket, resetSocket]);


  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      navigateToPermissionIfNeeded();
    });

    return unsubscribe;
  }, [navigation, navigateToPermissionIfNeeded]);


  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextState => {
      appState.current = nextState;

      if (nextState === 'active') {
        const currentScreen = getCurrentScreenName();
        console.log("App has come to the foreground, current screen:", currentScreen);
        if (activeTripId && (currentScreen === 'RideStatus' || currentScreen === 'Home' || currentScreen === 'PaymentScreen')) {
          console.log("Checking ongoing ride due to app foreground and active trip:", activeTripId);
          await checkOnGoingRideAndLog(true);
        }else{
          console.log("No active trip or irrelevant screen, just checking permissions.");
        }

        await navigateToPermissionIfNeeded();
      }
    });
    return () => subscription.remove();
  }, [navigateToPermissionIfNeeded, tripId, getCurrentScreenName, setActiveTripId, activeTripId]);

  useCustomBackHandler();

  useEffect(()=>{
    
    if(location?.length>1){
      setTarget(location[1],location[0]);
      coordsbasedDatafetch();
    }
  },[location])


  if(showemergencyOverlay){
    return <EmergencyContactScreenOverlay onClose={async () => {
      setShowEmergencyOverlay(false);
    }} />
  }

  


  const renderContent = () => {
    const current = stackScreen[stackScreen.length - 1];
    const { name, params } = current;

    switch (name) {
      case 'Home':
        return <Homescreen {...params} />;
      case 'PlanRideScreen':
        return <PlanRideScreen {...params} />;
      case 'SearchScreen':
        return <SearchScreen {...params} />;
      case 'BookRideScreen':
        return <BookRideScreen {...params} />;
      case 'BookActingDriverScreen':
        return <BookActingDriverScreen {...params} />;
      case 'RideStatus':
        return <RideStatus {...params} />;
      case 'WaypointScreen':
        return <WaypointScreen {...params} />;
      case 'PickLocationScreen':
        return <PickLocationScreen {...params} />;
      case 'PaymentScreen':
        return <PaymentScreen {...params} />;
      case 'TripFeedbackScreen':
        return <TripFeedbackScreen {...params} />;
      case 'MyRidesScreen':
        return < RideHistory  {...params}/>;
      case 'RideDetailScreen':
        return <RideDetailScreen {...params} />;
      case 'MyAccountScreen':
        return <AboutScreen {...params} />;
      case 'SavedPlacesScreen':
        return <SavedPlacesScreen {...params} />;
      case 'PreferencesScreen':
        return <PreferencesScreen {...params} />;
      case 'ContactScreen':
        return <ContactScreen {...params} />;
      case 'LegalScreen':
        return <LegalScreen {...params} />;
      case 'LanguageScreen':
        return <LanguageScreen {...params} />;
      case 'AddPlaceDetailScreen':
        return <AddPlaceDetailScreen {...params} />;

      case 'SupportScreen':
        return <SupportScreen {...params} />;
      case 'TicketDetailScreen':
        return <TicketDetailScreen {...params} />;
      case 'TripSelectionScreen':
        return <TripSelectionScreen {...params} />;
      case 'GoogleMapScreen':
        return <GoogleMapScreen {...params} />;
      case 'EmergencyScreen':
        return <EmergencyHomeScreen {...params} />;
      case 'TrackingTestScreen':
        return <TrackingTestScreen {...params} />;
      case 'TestScreen':
        return <TestScreen {...params} />;
      case 'ScheduleScreen':
        return <ScheduleScreen {...params} />;
      case 'ContributionScreen':
        return <ContributionScreen {...params} />;
      case 'DriverAccessScreen':
        return <DriverAccessScreen {...params} />;
      case 'ActingDriverVehicleSelectScreen':
        return <ActingDriverVehicleSelectScreen {...params} />;
      case 'MyVehiclesScreen':
        return <MyVehiclesScreen {...params} />;
      case 'BillsAndPhotosScreen':
        return <BillsAndPhotosScreen {...params} />;
      case 'TripSettingsScreen':
        return <TripSettingsScreen {...params} />;
      case 'TripTimelineScreen':
        return <TripTimelineScreen {...params} />;
      case 'NotificationSettingsScreen':
        return <NotificationSettingsScreen {...params} />;
      default:
        return null;
    }
  };

  const updateTripStatusApi = async (tripId, status,note) => {
    try {
      const resp = await confirmTripStatus({ tripId, tripStatus: status, passengerFeedBack: note });
 
      if (resp?.success) {
        // showNotification(t('success'), resp?.message || t('updated_successfully'), 'success');
        await DataStore.clearData(PREF.CURRENT_TRIP)
        setActiveTripId(null);
        resetCurrentRideInfo();
        clearDriverInfo();
        setShowOverdueModal(false);
        setStackScreen('Home', {});

      } else {
        showNotification(t('error'), resp?.message || t('something_went_wrong'), 'error');
        setShowOverdueModal(false);
      }
    } catch (e) {
      console.log("error",e)
      showNotification(t('error'), t('something_went_wrong'), 'error');
      setShowOverdueModal(false);
    }
  }

  const handleOverdueTripSelect = (status,TripId,note) => {
    if(status === 'ONGOING'){
      setShowOverdueModal(false);
      return;
    }
 
    if(TripId){
      updateTripStatusApi(TripId,status.note);
    }
  }

  const showLocationOverlay = locationCheckComplete && hasLocationPermission === false;
  const showAppContent = locationCheckComplete && hasLocationPermission === true;

  

  return (
    <>
     {bootLoading && (
        <BootLoaderOverlay />
      )}

      {
        updateMode !== 'none' && (
           <UpdateOverlay
                          visible={updateMode !== 'none'}
                          mode={updateMode}
                          onClose={() => setUpdateMode('none')}
          />
        ) 
      }
      {showOverdueModal && (
        <OverdueTripModal
          visible={showOverdueModal}
          onClose={() => setShowOverdueModal(false)}
          onSelect={handleOverdueTripSelect}
          TripId={tripId}
        />
      )}
     <StatusBar barStyle="dark-content" backgroundColor={"white"} />
      {showAppContent && renderContent()}
     {showAppContent && (
       <MapContainer
         mapReady={mapShown}
         setMapReady={setMapShown}
       />
     )}
     {showLocationOverlay && (
         <LocationPermissionOverlay
           onEnable={handleLocationOverlayAction}
           title={
             locationBlockReason === 'services'
               ? t('location_services_disabled', 'Location services disabled')
               : t('location_permission_required', 'Location permission required')
           }
           description={
             locationBlockReason === 'services'
               ? t(
                   'enable_system_location_to_continue',
                   'Please enable Location services on your device to continue.'
                 )
               : t(
                   'enable_location_to_continue',
                   'Please enable location permission to continue.'
                 )
           }
           primaryButtonLabel={
             locationBlockReason === 'services'
               ? t('open_settings', 'Open settings')
               : t('enable_permission', 'Enable permission')
           }
         />
       )}
    
      {showNetworkError && (
        <UnableToConnectOverlay onRetry={retryLoadAppConfig} />
      )}

      {/* {overlayStatuses.includes(tripStatus) && (
        <TripStatusOverlay status={tripStatus} />
      )} */}
    </>
  );
};

export default Home;