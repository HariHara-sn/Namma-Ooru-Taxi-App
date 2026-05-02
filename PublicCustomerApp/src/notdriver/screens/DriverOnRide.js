import {ActivityIndicator, AppState, Linking, KeyboardAvoidingView, Modal, NativeModules, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import 'moment-timezone';
import Feather from 'react-native-vector-icons/Feather';
import useUserStore from '../../common/store/useUserStore';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import useDeviceTokenStore from '../../common/store/useDeviceTokenStore';
import { useTripAcceptStore } from '../store/useTripAcceptStore';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import usePublicDriverStore from '../store/usePublicDriverStore';
import { checkBackgroundLocationPermissions, checkFineLocationPermissions, RequestBackgroundLocationPermission, RequestFineLocationPermission } from '../../common/controllers/PermissionHandler';
import locationTask from '../../common/controllers/GetCurrentLocation';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import driverWaitingTime from '../Controller/DriverWaitingTime';
import { showNotification } from '../../common/components/Alerts/showNotification';
import { DataStore } from '../../common/controllers/DataStore';
import APIRequest from '../../common/APIRequest';
import { height } from '../../common/utils/scalingutils';
import { Colors, Fonts } from '../../common/constants/constants';
import { RouteScreenStyles } from '../styles/RouteScreenStyles';
import TrackingMapIcons from '../../common/components/Alerts/TrackingMapIcons';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import { DateTimeFormatter } from '../../common/utils/DateTimeFormatter';
import { utils } from '../../common/utils/utils';
import AddressComponent from '../components/AddressComponent';
import CustomeBottomSheet from '../../common/components/CustomeBottomSheet';
import BottomSheetPopup from '../../common/components/BottomSheetPopup';
import { findDistanceInMeters } from '../../common/core/FindDistance';
import PickUpModal from '../components/PickUpModal';
import WaitingTime from '../components/WaitingTime';
import TripFareCalculator from '../../common/core/TripFareCalculator';
import useTripsStore from '../store/useTripsStore';
import { cancelTrip } from '../components/CancelTripUpdate';
import RideMatchWSService from '../../common/controllers/socketServices/RideMatchSocketService';
import CancelRideModal from '../components/CancelModel';
import TripDetails from '../components/TripDetailCom';
import { useTranslation } from 'react-i18next';
import { firebaselog_onRide } from '../../common/utils/FirebaseAnalytics';
import ArrivedPickUpLocation from '../components/ArrivedPickUpLocation';
import ModalFooter from '../components/ModalFooter';
import useActingDriverMediaStore from '../store/useActingDriverMediaStore';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ActingDriverMediaButtons from '../components/ActingDriverMediaButtons';

const {NeNativeModule} = NativeModules;

const DriverOnRide = () => {
  const {t} = useTranslation()
  const[cancelRideModalVisible, setCancelRideModalVisible] = useState(false);
  const {userInfo, userRole} = useUserStore();
  const {
    setStartNavigation,
    setDirectionPoints,
    disduration,
    setDisduration,
    userLocation,
    directionReadyCallback,
    directionPoints,
    setUserLocation,
    // routeLoading,
    nativeError,
    navigationError,
    setMapMarkers,
    startNavigation,
    routeLoading,
    routeNotFound,
    setRouteNotFound,
    setDirectionResponse
  } = useMapMarkerStore();
  const {activeTripData, setActiveTripData, updateStopData, setCurrentTripAcceptedTime} = useTripsStore();
  const {
    hasLocationPermission,
    hasBackgroundLocationPermission,
    hasNotificationPermission,
  } = useDeviceTokenStore();
  // const [loading,setLoading] = useState(false)
  const {loading, setLoading, tripDetails, setTripDetails} = useTripAcceptStore()
  const {tripId, requestId, fetchLocationDate, setFetchLocationDate, isGetFare, setIsOnGoing, setIsGetFare } = useTripAcceptStore()
  const {fareBreakDown, setFareBreakDown} = useTripsStore()

  const setStackScreen = useStackScreenStore(state => state.setStackScreen);
 
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReachedPickup, setIsReachedPickup] = useState(false);
  const [isReachedDropoff, setIsReachedDropoff] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [error, setError] = useState(null)
  const [totalDistance, setTotalDistance] = useState('')
  const [totalDuration, setTotalDuration] = useState('')

  const [currentWaypointDetails, setCurrentWaypointDetails] = useState(null);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [tempStopData, setTempStopData] = useState(null);
  const [showWaypointReached,setShowWaypointReached] = useState(false)
  const [showTimeStartModal, setShowTimerStartModal] = useState(false)
  const [newLegIndex, setNewLegIndex] = useState(0)
  const prevNavLegIndex = useRef(null); // store last navLegIndex
  const [openNavChoiceModal, setOpenNavChoiceModal] = useState(false)
  const [openRouteRetryModal, setOpenRouteRetryModal] = useState(false)

  const [pickUpAlertLoading, setPickUpAlertLoading] = useState(false)

  const [watingTime, setWaitingTime] = useState(0)
  const [isAlertSent, setIsAlertSent] = useState(false)

  const {driverInfo} = usePublicDriverStore();

  const tripsStatus = activeTripData && activeTripData[0]?.status ? activeTripData[0]?.status : "";

  const isActingDriverTrip = activeTripData[0]?.isActingDriverTrip ? activeTripData[0]?.isActingDriverTrip : false;
  
  const { preTripDone, postTripDone, pendingNavOpen, setPendingNavOpen, reset: resetDriverMedia } = useActingDriverMediaStore();
  // Fallback: if store was cleared but photos are already on server, treat as done
  const _prePhotos = activeTripData?.[0]?.bills?.preTripVehiclePhotos;
  const preTripUploadedOnServer = !!(_prePhotos?.front && _prePhotos?.rear && _prePhotos?.leftSide && _prePhotos?.rightSide);
  const _postPhotos = activeTripData?.[0]?.bills?.postTripVehiclePhotos;
  const postTripUploadedOnServer = !!(_postPhotos?.front && _postPhotos?.rear && _postPhotos?.leftSide && _postPhotos?.rightSide);
  const postTripReady = postTripDone || postTripUploadedOnServer;

  const [showPreTripWarning, setShowPreTripWarning] = useState(false);
  const [showPostTripWarning, setShowPostTripWarning] = useState(false);

  // Auto-open nav choice modal after driver returns from pre-trip photo screen
  useEffect(() => {
    if (pendingNavOpen && preTripDone) {
      setPendingNavOpen(false);
      setOpenNavChoiceModal(true);
    }
  }, [preTripDone, pendingNavOpen]);

  const getNonreachedStops = useTripsStore.getState().getNonreachedStops;
  const nonreachedStops = getNonreachedStops();

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  const [otpLoading, setOTPLoading] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const onStartNavigationPress = async () => {
    // If acting driver trip and pre-trip photos not yet done, go to pre-trip screen first.
    // Set pendingNavOpen so the nav modal auto-opens when the driver returns.
    if (isActingDriverTrip && !preTripDone && !preTripUploadedOnServer) {
      setPendingNavOpen(true);
      setStackScreen('DriverVehiclePhotosScreen');
      return;
    }
    setOpenNavChoiceModal(true);
  };

  const onNavigationClick = async () => {
    const haslocationPression = await checkFineLocationPermissions();
    const hasbackgroundPression = Platform.OS === 'android' && Platform.Version <= 28 ? true : await checkBackgroundLocationPermissions();
    if (!haslocationPression) {
      await RequestFineLocationPermission();
      return;
    }
    if (!hasbackgroundPression) {
      await RequestBackgroundLocationPermission();
      return;
    }
    if (!userLocation) {
      await locationTask.getCurrentLocation();
      return;
    }
  };

  const onStartWating = () => {
    if (BGLocationTask.isRunning()) {
        driverWaitingTime.startWatingTime()
        setShowWaypointReached(false)
        setShowTimerStartModal(false)
    } else {
       // TODO : enable foreground service and start timer
       showNotification('Background service Not Enabled','Please Enable Foregorund Service before Starting','danger')
    }
  }

  const onStopTimer =()=> {
    // driverWaitingTime.startWatingTime()
    driverWaitingTime.stopWaitingTime()
  }

  const handleEndTrip = async (reason, translatedReason) => {
    // if (!hasbackgroundPression || !haslocationPression) {
    //   onNavigationClick()

    //   return;
    // }

    const _translatedReason = translatedReason || reason;

    if (!userLocation) {
      await locationTask.getCurrentLocation();
      showNotification('Fetching Current Location', '', 'info');
      return;
    }
      setLoading(true);
      if (tripsStatus === 'ACCEPTED') {
        const api = new APIRequest();
        const response = await api.request(`/publicrides/driver/v2/cancelTrip`, 'POST', {tripId:activeTripData[0]?._id, reason: _translatedReason, isBeforePickup: true,  droppedAtLoc: {
          lat: userLocation?.[0],
          lon: userLocation?.[1]
        }}, userInfo.token);
        if (response.success) {
          resetDriverMedia();
          cancelTrip(response)
          firebaselog_onRide('OR_Status(OR_S)', 'OR_S:cancelled_by_driver_before_pickup')
        } else {
          showNotification(`Failed to Cancel Trip`, response?.message, 'danger')
        }
        setLoading(false);
      } else if (tripsStatus === 'PICKEDUP' && reason !== 'reached_destination') {
        setIsGetFare(false)
        setFetchLocationDate(true)
        DataStore.storeData('isOngoingTrip', true)
        setIsOnGoing(true)
      } else if (tripsStatus === 'PICKEDUP' && reason === 'reached_destination')  {
        // Acting driver: gate end-trip behind post-trip photo check
        if (isActingDriverTrip && !postTripReady) {
          setLoading(false);
          setShowPostTripWarning(true);
          return;
        }
        endTrip();
      } else {
        setLoading(true);
        try {
          const cancelData = {driver_id:userInfo?._id, trip_id:activeTripData?.[0]?._id, response: 'reject'}
          RideMatchWSService.emit('driver_trip_response', cancelData)
          setCancelRideModalVisible(false)
          DataStore.storeData('activeTripId', null);
          setLoading(false);
        }catch (err) {
          console.log('hari-->>accept-->>err-->>', err)
        }
      }
  }

  const onFairDetails = async (res, encodedPolyline) => {
    if (res.success) {
      if(res?.isOnGoingTrip) {
        DataStore.storeData('isOngoingTrip', true)
        setIsOnGoing(true)
    }
    const finalDistance = res?.totalFare?.distance || 0
    const finalDuration = res?.totalFare?.duration || 0
    setFareBreakDown(res?.totalFare)
    const updatedRideGroup = {
      ...activeTripData[0], 
      status:isGetFare?  'DROPPED' : 'CANCELLED', 
      finalDistance: finalDistance, 
      finalDuration: finalDuration,
      encodedPolyline: encodedPolyline,
    };
    setActiveTripData([updatedRideGroup]);
    NeNativeModule.endNavigation();
    setStartNavigation(false);
    setDisduration(null);
    driverWaitingTime.stopWaitingTime()
    // showNotification(res?.message, res?.message, 'success');
    resetDriverMedia();
    firebaselog_onRide('OR_Status(OR_S)', isGetFare ? 'OR_S:dropped' : 'OR_S:cancelled_by_driver_after_pickup')
    } else {
    showNotification(res?.message || 'Something went wrong', res?.message || 'Error Fetching Fare', 'danger');
    }
  
    setFetchLocationDate(false);
    setIsLoading(false);
    setLoading(false);
  }

  const endTrip = async () => {
    const haslocationPression = await checkFineLocationPermissions();
    const hasbackgroundPression = Platform.OS === 'android' && Platform.Version <= 28 ? true : await checkBackgroundLocationPermissions();
    if (!hasbackgroundPression || !haslocationPression) {
      onNavigationClick()
      return;
    }
    if (!userLocation) {
      await locationTask.getCurrentLocation();
      showNotification('Fetching Current Location', '', 'info');
      return;
    }
    // Acting driver: gate end-trip behind post-trip photo check
    if (isActingDriverTrip) {
      if (!postTripReady) {
        setShowPostTripWarning(true);
        return;
      }
      // Photos already uploaded — fall through to end the trip normally
    }
    setFetchLocationDate(true)
    setLoading(true)
  }

  const onReachedPickup = () => {
    // If acting driver and pre-trip photos not yet uploaded, warn before opening OTP
    if (isActingDriverTrip && !preTripDone && !preTripUploadedOnServer) {
      setShowPreTripWarning(true);
      return;
    }
    setModalVisible(true);
  }

  const onReachedPickupAlert = async () => {
     setPickUpAlertLoading(true)
     try {
        const api = new APIRequest();
        const url = `/publicrides/driver/v2/alertPassangerPickup`;
        const payload = {
           driverName: driverInfo?.name,
           tripId: activeTripData[0]?._id,
        };
        const res = await api.request(url, 'POST', payload, userInfo.token);
        if(res.success) {
          // showNotification('Alert sent', 'Alert sent', 'success');
          setIsAlertSent(true)
          
        } else {
          showNotification('Something went wrong', res.message, 'danger');
        }
        setPickUpAlertLoading(false)
     }
     catch (error) {
      showNotification('Something went wrong', '', 'danger');
      setPickUpAlertLoading(false)
     }
  }

  const handleWaypointsConfirm = async () => {
    setIsLoading(true);
    const filterStopNumber = tempStopData ? tempStopData[0] : activeTripData[0];
    const nextStopNumber = filterStopNumber?.stops?.filter(stop => stop.stopUpdated === true).length;
    try {
      const api = new APIRequest();
      const url = `/publicrides/driver/v2/updateWaypointsDriverReached`;
      const payload = {
        tripId: activeTripData[0]?._id,
        stopNumber: nextStopNumber,
        isReached:true,
      };
      const res = await api.request(
        url,
        'POST',
        payload,
        userInfo?.token,
      );
      if (res?.success) {
          NeNativeModule.endNavigation();
          setStartNavigation(false);
          setDisduration(null);
        setShowWaypointReached(false);
        setModalVisible(false);
        if (nonreachedStops[0]?.waitingTime && nonreachedStops[0]?.waitingTime !== 0) {
           updateStopData(nonreachedStops[0].name, true, 'PICKEDUP', 0, false)
           onStartWating()
        } else {
          setCurrentWaypointIndex(prevIndex => prevIndex + 1);
          updateStopData(nonreachedStops[0].name, true, 'PICKEDUP', 0, true)
          // NeNativeModule.moveToNextWaypoint();
        }
       
        // showNotification(res?.message, 'Stop Updated', 'success');
        // await DriverAnalytics.triggerDriverTripStatus(`stop_${nextStopNumber}_reached`);
      } else {
        showNotification(res?.message, res?.message, 'danger');
        setModalVisible(false);
      }
      setIsLoading(false);
    } catch (error) {
      showNotification('Something went wrong', '', 'danger');
      setIsLoading(false);
      setModalVisible(false);
    }
  };

  const handleWaypointsWaitTime = async (finalFinalTime, sotp, nextStopNumber) => {
    setIsLoading(true);
    try {
      const api = new APIRequest();
      const url = `/publicrides/driver/v2/updateWaypointsDriverWaitTime`;
      const payload = {
        tripId: activeTripData[0]?._id,
        stopNumber: nextStopNumber,
        driverWaitTime: finalFinalTime,
        stopUpdated: true
      };
      const res = await api.request(
        url,
        'POST',
        payload,
        userInfo?.token,
      );
      if (res?.success) {
        updateStopData(sotp[0].name, true, 'PICKEDUP', finalFinalTime, true)
        setWaitingTime(0)
        setShowWaypointReached(false)
        setShowTimerStartModal(false)
        NeNativeModule.endNavigation();
        // NeNativeModule.moveToNextWaypoint();
        setStartNavigation(false);
        setDisduration(null);
        setCurrentWaypointIndex(prevIndex => prevIndex + 1);
        // showNotification(res?.message, 'Pickup Successfully', 'success');
        // await DriverAnalytics.triggerDriverTripStatus(`stop_${nextStopNumber}_reached`);
      } else {
        showNotification(res?.message, res?.message, 'danger');
        setModalVisible(false);
      }
      setIsLoading(false);
    } catch (error) {
      showNotification('Something went wrong', '', 'danger');
      setIsLoading(false);
      setModalVisible(false);
    }
  };

  // const nonReachedStops = updateStopData(nonreachedStops[0]?.name, true, 'PICKEDUP', 0, true);
  //    const jnronvw = nonReachedStops?.nonReachedStops?.map(stop => stop?.location)
  //       console.log('hari-->>otp-->>', jnronvw);

  //      NeNativeModule.updatePointsOnNavigation(jnronvw)
   

  const verifyOTP = async (otp) => {   
    setOTPLoading(true)
    try{
      const api = new APIRequest();
      const url = `/publicrides/driver/v2/verifyTripOtp`;
      const payload = {
        otp: otp,
        tripId: activeTripData[0]?._id,
      }
      const res = await api.request(url, 'POST', payload, userInfo?.token);
      if(res?.success){
        // showNotification(res?.message, res?.message, 'success');
        setModalVisible(!modalVisible);
        setDirectionPoints(null);
        setDirectionResponse(null);
        setDisduration(null);
        setStartNavigation(false);
        updateStopData(nonreachedStops[0]?.name, true, 'PICKEDUP', 0, true)
        setIsReachedPickup(false);
        setCurrentTripAcceptedTime(new Date().getTime());
        firebaselog_onRide('OR_Status(OR_S)', 'OR_S:pickedup')
        setTripDetails(null)
        // updateDirectionsPoints();
      }else{
        showNotification(res?.message, res?.message, 'danger');
      }
      setOTPLoading(false)
    }catch(error){
      showNotification('Something went wrong', '', 'danger');
      setOTPLoading(false)
    }
  }
      
  const handlePickupConfirm = (otp) => {
    if (otp.length !== 4) {
      showNotification('Please enter the correct OTP', '', 'danger');
      return;
    }
    verifyOTP(otp)
    setDisduration(null);
    NeNativeModule.endNavigation();
  }

  const updateDirectionsPoints = () => {
    if (!userLocation) return;
    if (tripsStatus === 'ACCEPTED') {
      // if (tripDetails?.pickUpRoute ) {
      //   const request = tripDetails?.pickUpRoute?.request;
      //   const response = tripDetails?.pickUpRoute?.response;
      //   const padding = [50, 50, 50, height * 0.5];
      //   setDirectionResponse([
      //           {
      //             requests: request,
      //             response: response,
      //             padding: padding.map(v => parseInt(v, 10)),
      //           },
      //   ]);
      //   return;
      // }
      const directions = [
        {
          lat: activeTripData[0]?.stops[0]?.location[1],
          lon: activeTripData[0]?.stops[0]?.location[0],
        },
      ];
      directions.unshift({
        lat: userLocation[0] || 0,
        lon: userLocation[1] || 0,
      });
       const padding = [50, 50, 50, height*0.3]
      setDirectionPoints({
        locations: directions,
        type: 'car',
        padding: padding.map(v => parseInt(v, 10))
      });
    } 

    if (tripsStatus === 'PICKEDUP'){
      // if (tripDetails?.routeData) {
      //   const request = tripDetails?.routeData?.request;
      //   const response = tripDetails?.routeData?.response;
        
      //   const padding = [50, 50, 50, height * 0.5];
      //   setDirectionResponse([
      //           {
      //             requests: request,
      //             response: response,
      //             padding: padding.map(v => parseInt(v, 10)),
      //           },
      //   ]);
      //   return;
      // }
      nonreachedStops.unshift({
        lat: userLocation[0] || 0,
        lon: userLocation[1] || 0,
      });
       const padding = [50, 50, 50, height*0.3]
      setDirectionPoints({
        locations: nonreachedStops,
        type: 'car',
        padding: padding.map(v => parseInt(v, 10))
      });
    }
  };

  useEffect(() => {
    if (!activeTripData || activeTripData?.length === 0) return;
    if (startNavigation) return;
    updateDirectionsPoints();
  }, [tripsStatus, activeTripData,appStateVisible, tripDetails]);

  useEffect(() => {
    if (!disduration?.location) {
      if (userLocation && nonreachedStops?.[0]?.location) {
        const distance = findDistanceInMeters(userLocation, nonreachedStops[0].location);
        if (distance < 200 && distance >= 0) {
          if (tripsStatus === 'ACCEPTED') {
            setIsReachedPickup(true);
            return;
          }
          if (tripsStatus === 'PICKEDUP') {
              if (!nonreachedStops[0]?.stopUpdated && nonreachedStops?.length !== 1) {
                setShowWaypointReached(true);
              }
              if (nonreachedStops?.length === 1) {
                setShowWaypointReached(false);
                setIsReachedDropoff(true);
              }
          }
        }
      }
      return;
    }

    const [
      lat,
      lon,
      remainingDistance,
      remainingDuration,
      speed,
      ldistance,
      lduration,
      navLegIndex,
      bearing,
    ] = disduration?.location;

    // Track leg index progression
    if (prevNavLegIndex.current === null || prevNavLegIndex.current === 0) {
      prevNavLegIndex.current = navLegIndex;
      setCurrentWaypointIndex(navLegIndex)
    } else {
      if (navLegIndex > prevNavLegIndex.current) {
        setNewLegIndex(prev => prev + 1);
        prevNavLegIndex.current = navLegIndex;
      } else if (navLegIndex !== prevNavLegIndex.current) {
        prevNavLegIndex.current = navLegIndex;
      }
    }


    const distanceInMeters = ldistance;

    if (distanceInMeters < 500 && distanceInMeters >= 0) {
      // if (tripsStatus === 'ACCEPTED') {
      //   setIsReachedPickup(true);
      //   return;
      // }
      if (tripsStatus === 'PICKEDUP') {
        if (newLegIndex === currentWaypointIndex) {
          if (!nonreachedStops[0]?.stopUpdated && nonreachedStops?.length !== 1) {
            setShowWaypointReached(true);
          }
          if (nonreachedStops?.length === 1) {
            setShowWaypointReached(false);
            setIsReachedDropoff(true);
          }
        }   
      }
    }
  }, [disduration, userLocation, nonreachedStops]);

  const onReachedStop = () => {
    handleWaypointsConfirm()
  }

  const openGoogleMaps = () => {
    const stops = nonreachedStops.map(stop => `${stop.location?.[1]},${stop.location?.[0]}`);
    const destination = stops?.[0]
    if (!destination) {
      showNotification('No destination found', 'No destination found', 'danger');
      return;
    }
    let url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&dir_action=navigate&destination=${destination}`;

    Linking.canOpenURL(url)
      .then(supported => {
        setOpenNavChoiceModal(false)
        if (!supported) {
          console.log("Can't handle url: " + url);
        }
        return Linking.openURL(url), setDirectionPoints(null);
      })
      .catch(err => console.error('An error occurred', err));
  };

  const handleNavMode = async (mode) => {
    if (mode === 'google') {
      firebaselog_onRide('OR_Navigation(OR_N)', 'OR_N:navigation_mode_google')
      openGoogleMaps()
    } else {
       if (!directionReadyCallback) {
      showNotification(
        'Please wait for the direction to be ready',
        '',
        'danger',
      );
      updateDirectionsPoints();
      return;
    }
     if (routeLoading?.error) {
      setOpenNavChoiceModal(false);
      setOpenRouteRetryModal(true);
      return;
    }
    firebaselog_onRide('OR_Navigation(OR_N)', 'OR_N:navigation_mode_vm')
    setStartNavigation(true);
    setMapMarkers([]);
    setOpenNavChoiceModal(false)
    setRouteNotFound(null);
    }
    await BGLocationTask.runDriverBgTask();

  }

  const renderOpenNavChoiceModal = () => {
    return (
      <BottomSheetPopup
        visible={openNavChoiceModal}
        driverStyles
        onClose={() => {
          setOpenNavChoiceModal(!openNavChoiceModal);
        }}>
        <View style={styles.navSheetContainer}>
          <View style={styles.navHeaderRow}>
            <Text style={[styles.navHeader, {width:'90%'}]}>{t('choose_navigation_mode')}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('cancel_trip')} onPress={() => setOpenNavChoiceModal(false)} style={styles.navCloseBtn}>
              <MaterialCommunityIcons name="close" size={20} color={Colors.grey_dark} />
            </TouchableOpacity>
          </View>
          <Text style={styles.navSubHeader}>{t('start_navigation')} – {t('choose_navigation_mode')}</Text>
          <View style={styles.navOptionsRow}>
            <Pressable
              onPress={() => handleNavMode('google')}
              style={({pressed}) => [
                styles.navOptionCard,
                pressed && styles.navOptionPressed,
              ]}
            >
              {/* <View style={styles.navIconCircle}>
                <MaterialCommunityIcons name="google-maps" size={24} color={Colors.white} />
              </View> */}
              <Text style={styles.navOptionLabel}>{t('google')}</Text>
              <Text style={styles.navOptionDesc}>{t('start_navigation')}</Text>
            </Pressable>
            <Pressable
              onPress={() => handleNavMode('vm')}
              style={({pressed}) => [
                styles.navOptionCard,
                pressed && styles.navOptionPressed,
              ]}
            >
              {/* <View style={[styles.navIconCircle,{backgroundColor:Colors.periwinkle}]}> 
                <MaterialCommunityIcons name="road-variant" size={24} color={Colors.white} />
              </View> */}
              <Text style={styles.navOptionLabel}>{t('vm')}</Text>
              <Text style={styles.navOptionDesc}>{t('start_navigation')}</Text>
            </Pressable>
          </View>
          <View style={styles.navFooterHintWrapper}>
            <MaterialCommunityIcons name="information" size={16} color={Colors.grey_dark} />
            <Text style={styles.navFooterHint}>{t('press_to_update_status')}</Text>
          </View>
        </View>
      </BottomSheetPopup>
    );
  };

  const renderRouteRetryModal = () => {
    return (
      <>
        {/* Fullscreen overlay styled like RouteStatusOverlay */}
        <View style={styles.routeOverlay} pointerEvents="auto">
          <View style={styles.routeErrorBox}>
            <View style={styles.routeIconWrapper}>
              <MaterialCommunityIcons name="alert-circle-outline" size={44} color={Colors.red} />
            </View>
            <Text style={styles.routeErrorText} numberOfLines={2}>
              {t('routeStatus_errorTitle', { defaultValue: 'Failed to fetch route' })}
            </Text>
            <Text style={styles.routeHelperText}>
              {t('routeStatus_helper', { defaultValue: 'Ensure your internet is stable and try again.' })}
            </Text>
            <View style={{flexDirection:'row', gap:8, marginTop:6}}>
              <TouchableOpacity
                style={styles.routeRetryBtn}
                onPress={() => {
                  updateDirectionsPoints();
                  setOpenRouteRetryModal(false);
                }}
              >
                <Text style={styles.routeRetryText}>{t('routeStatus_retry', { defaultValue: 'Try Again' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.routeBackBtn}
                onPress={() => setOpenRouteRetryModal(false)}
              >
                <Text style={styles.routeBackText}>{t('routeStatus_back', { defaultValue: 'Back' })}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </>
    );
  };

  const renderPickUpModal = () => {
    return (
      <BottomSheetPopup
        visible={modalVisible}
        onClose={() => {
          setModalVisible(!modalVisible);
        }}
        driverStyles
        >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, width: '100%', bottom: 0, position: 'absolute' }}>
          <View style={RouteScreenStyles.modalView}>
            <PickUpModal
              isPublicRide={true}
              stopsDetails={activeTripData && activeTripData.length > 0 && activeTripData[0]}
              onConfirmPress={handlePickupConfirm}
              isLoading={isLoading}
              otpLoading={otpLoading}
            />
          </View>
        </KeyboardAvoidingView>
      </BottomSheetPopup>
    );
  };

  const refreshDirections = () => {
    setTripDetails(null);
    updateDirectionsPoints();
  }

  const onRecenter = () => {
    NeNativeModule.recenterNavigation();
  }



  // const isRouteLoading = routeLoading?.loading ? routeLoading?.loading : false

  // Handle native errors
  // useEffect(() => {
  //   if (nativeError) {
  //     console.log('Native Error:', nativeError);
  //     showNotification(
  //       'Navigation Error', 
  //       `${nativeError.errorType}: ${nativeError.errorMessage}`, 
  //       'danger'
  //     );
  //     setStartNavigation(false);
  //   }
  // }, [nativeError]);

  // Handle navigation errors
  // useEffect(() => {
  //   if (navigationError) {
  //     console.log('Navigation Error:', navigationError);
  //     showNotification(
  //       'Navigation Failed', 
  //       `${navigationError.errorMessage} (Code: ${navigationError.errorCode})`, 
  //       'danger'
  //     );
  //     setStartNavigation(false);
  //   }
  // }, [navigationError]);

  //   useEffect(() => {
  //   // console.log('Route Loading Status:', routeLoading);
  //   if (routeLoading?.message === 'initialState') return;
  //   if (routeLoading?.loading) return
  //   if (routeLoading?.error) {
  //     setOpenRouteRetryModal(true);
  //   }
  // }, [routeLoading])

  // Handle Route not found error
   useEffect(() => {
    if (routeNotFound) {
      if (routeNotFound == "ROUTENOTFOUND") { 
        setStartNavigation(false);
        updateDirectionsPoints();
    }
  }
  }, [routeNotFound]);

  return (
    <>
    <View style={{flex: 1}}>
      <WaitingTime setWaitingTime={setWaitingTime} onFinalTime={(finalTime, sotp, nextStopNumber)=>handleWaypointsWaitTime(finalTime, sotp, nextStopNumber)}/>       
     {fetchLocationDate && (
        <TripFareCalculator
        tripData={activeTripData[0]}
        setLoading={setLoading}
        setError={((err)=>{
          console.log('Fare calculation error:', err);
          if (err) {
           setError(err)
           setFetchLocationDate(false);
           setLoading(false);
           showNotification('Please Try Again', '', 'danger');
          }
        })}
        isGetFare={isGetFare}
        onDone={(finalData, encodedPolyline) => {
        console.log('Fare calculated with', finalData);
          onFairDetails(finalData, encodedPolyline)
          setFetchLocationDate(false);
        }}
        />
        )}
      {disduration ? null : (
        <View style={RouteScreenStyles.mapIconContainer}>
          <TrackingMapIcons markersData={directionPoints} refreshDirections={()=>refreshDirections()} />
        </View>
      )}
      {!activeTripData || activeTripData?.length === 0 ? (
        <View style={RouteScreenStyles.noActiveRouteContainer}>
          <Text style={RouteScreenStyles.noActiveRouteTxt}>
            {t('no_active_route')} !!
          </Text>
        </View>
      ) : (
        <CustomeBottomSheet useScrollView={true}>
        {loading && <FullScreenLoader />}
         {
            !disduration && tripsStatus !== "COMPLETED" ? 
                (hasLocationPermission && (Platform.OS === 'android' && Platform.Version <= 28 ? true : hasBackgroundLocationPermission) &&
                hasNotificationPermission)&& (
                  <TouchableOpacity disabled={routeLoading?.loading && routeLoading?.message !== 'initialState'} style={styles.navBtn} onPress={() => onStartNavigationPress()}>
                    {routeLoading?.loading && routeLoading?.message !== 'initialState'? <ActivityIndicator size="small" color={Colors.white} /> : 
                    <>
                    <MaterialCommunityIcons name="navigation-variant-outline" size={20} color={Colors.white} />
                    <Text style={styles.navBtnTxt}>{t('start_navigation')}</Text>
                    </>}
                      
                  </TouchableOpacity>
                )
              : null
          }
          {watingTime > 0 &&
          <View style={styles.waitingCard}>
            <View style={styles.waitingTopRow}>
              <View style={styles.waitingIconCircle}>
                <MaterialCommunityIcons name="timer-sand" size={18} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.waitingLabel}>{t('waiting_time')}</Text>
                <Text style={styles.waitingTimer}>{DateTimeFormatter.formatSecondsToDuration(watingTime)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.stopTimerBtn} onPress={()=>onStopTimer()}>
              <Feather name="square" size={14} color={Colors.white} />
              <Text style={styles.stopTimerBtnTxt}>{t('stop_timer')}</Text>
            </TouchableOpacity>
          </View>
          }
          {tripsStatus !== 'ACCEPTED' && showWaypointReached && watingTime <= 0 &&
          <View style={styles.reachedBtnWrap}>
            <TouchableOpacity style={styles.reachedBtn} onPress={()=>onReachedStop()}>
              <MaterialCommunityIcons name="map-marker-check" size={22} color={Colors.white} />
              <View>
                <Text style={styles.reachedBtnTitle}>{t('reached')} {nonreachedStops[0]?.name}</Text>
                <Text style={styles.reachedBtnSub}>{t('press_to_update_status')}</Text>
              </View>
            </TouchableOpacity>
            </View>
           }
             {disduration && (
              <View style={styles.durationBar}>
                <View style={styles.durationInfoWrap}>
                  <View style={styles.durationChip}>
                    <Feather name="map-pin" size={13} color={Colors.periwinkle} />
                    <Text style={styles.durationChipTxt}>
                      {disduration?.location[2] < 1000 ? Math.round(disduration?.location[2]) + ' m' : utils.metersToKilometers(disduration?.location[2])?.toFixed(2) + ' km'}
                    </Text>
                  </View>
                  <View style={styles.durationChip}>
                    <Feather name="clock" size={13} color={Colors.periwinkle} />
                    <Text style={styles.durationChipTxt}>
                      {DateTimeFormatter.convertSecondsToReadable(disduration?.location[3], true)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.recenterBtn} onPress={()=>onRecenter()}>
                  <Feather name="navigation-2" size={16} color={Colors.white} />
                  <Text style={styles.recenterBtnText}>Re-center</Text>
                </TouchableOpacity>
              </View>
            )}
          {tripsStatus === 'ACCEPTED' && 
          <ArrivedPickUpLocation  
          pickUpAlertLoading={pickUpAlertLoading}
          isAlertSent={isAlertSent}
          onReachedPickupAlert={onReachedPickupAlert}
           onReachedPickup={onReachedPickup}/>
          }
          
          {
            isReachedDropoff &&
            <>
            <View
              style={[
                RouteScreenStyles.headerContainer,
                {backgroundColor: Colors.green},
              ]}>
              <View style={RouteScreenStyles.stopContainer}>
                <Text
                  style={[RouteScreenStyles.addressTxt, {color: '#ffffff'}]}>
                  {t('you_have_successfully_reached_your_destination')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={RouteScreenStyles.endTripBtn}
              onPress={() => endTrip()}>
              <Text style={RouteScreenStyles.endTripTxt}>{t('end_trip')}</Text>
            </TouchableOpacity>
          </>
          }
          
          {(!hasLocationPermission ||
            (!hasBackgroundLocationPermission && (Platform.OS === 'android' && Platform.Version > 28)) ||
            !hasNotificationPermission) ? (
              <View
                style={[
                  RouteScreenStyles.headerContainer,
                  {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  },
                ]}>
                <Text
                  style={[
                    RouteScreenStyles.stopTxt,
                    {fontSize: 12, width: '60%'},
                  ]}>
                  {t('please_enable_required_permissions')}
                </Text>
                <TouchableOpacity
                  onPress={() => setStackScreen('DriverPermissionScreen')}
                  style={RouteScreenStyles.enableNowBtn}>
                  <Text
                    style={[
                      RouteScreenStyles.stopTxt,
                      {fontSize: 12, color: Colors.black},
                    ]}>
                    {t('enable_now')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : !userLocation ? (
              <View
                style={[
                  RouteScreenStyles.headerContainer,
                  {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  },
                ]}>
                <Text
                  style={[
                    RouteScreenStyles.stopTxt,
                    {fontSize: 12, width: '60%'},
                  ]}>
                  {t('location_not_found')}
                </Text>
                <TouchableOpacity
                  onPress={() => onNavigationClick()}
                  style={RouteScreenStyles.enableNowBtn}>
                  <Text
                    style={[
                      RouteScreenStyles.stopTxt,
                      {fontSize: 12, color: Colors.black},
                    ]}>
                    {t('try_again')}
                  </Text>
                </TouchableOpacity>
              </View>
            ):null}
          {isActingDriverTrip && <ActingDriverMediaButtons />}
          <TripDetails activeTripData={activeTripData} setModalVisible={setCancelRideModalVisible} />
            {/* Acting driver: quick-access media upload button */}
          
          <AddressComponent
              percentage={0}
              waypoints={activeTripData[0]?.stops}
              deviceLocation={null}
              isPublicRides={true}
            />

        

            {isReachedDropoff? (
             <></>
            ):(
            <ModalFooter setCancelRideModalVisible={setCancelRideModalVisible} activeTripData={activeTripData} />
            )}
       
        </CustomeBottomSheet>
      )}
      {cancelRideModalVisible && <CancelRideModal modalVisible={cancelRideModalVisible} setModalVisible={setCancelRideModalVisible} callCancelRide={handleEndTrip} loading={loading} tripData={activeTripData?.[0]}/>}
        {modalVisible && renderPickUpModal()}
        <Modal transparent animationType="fade" visible={showPreTripWarning} onRequestClose={() => setShowPreTripWarning(false)}>
          <View style={styles.preTripOverlay}>
            <View style={styles.preTripWarningBox}>
              {/* <MaterialCommunityIcons name="camera-alert" size={48} color="#E65100" style={{ alignSelf: 'center', marginBottom: 10 }} /> */}
              <Text style={styles.preTripWarningTitle}>{t('vehicle_photos_required')}</Text>
              <Text style={styles.preTripWarningMsg}>
                {t('please_upload_pre_trip_photos_before_entering_otp', { defaultValue: 'Please upload the 4 pre-trip vehicle condition photos before entering the OTP. This helps record the vehicle\'s condition at trip start.' })}
              </Text>
              <TouchableOpacity
                style={styles.preTripUploadBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setShowPreTripWarning(false);
                  setStackScreen('DriverVehiclePhotosScreen');
                }}>
                <MaterialCommunityIcons name="camera-plus-outline" size={18} color={Colors.white} />
                <Text style={styles.preTripUploadBtnTxt}>{t('upload_photos_now')}</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={styles.preTripSkipBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setShowPreTripWarning(false);
                  setModalVisible(true);
                }}>
                <Text style={styles.preTripSkipTxt}>Skip & Enter OTP Anyway</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </Modal>
        <Modal transparent animationType="fade" visible={showPostTripWarning} onRequestClose={() => setShowPostTripWarning(false)}>
          <View style={styles.preTripOverlay}>
            <View style={styles.preTripWarningBox}>
              <Text style={styles.preTripWarningTitle}>{t('post_trip_photos_required')}</Text>
              <Text style={styles.preTripWarningMsg}>
                {t('please_upload_post_trip_photos_before_ending_ride', { defaultValue: 'Please upload the 4 post-trip vehicle condition photos before ending the ride. This helps record the vehicle\'s condition at trip end.' })}
              </Text>
              <TouchableOpacity
                style={styles.preTripUploadBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setShowPostTripWarning(false);
                  setStackScreen('DriverVehiclePhotosScreen');
                }}>
                <MaterialCommunityIcons name="camera-plus-outline" size={18} color={Colors.white} />
                <Text style={styles.preTripUploadBtnTxt}>{t('upload_photos_now')}</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={styles.preTripSkipBtn}
                activeOpacity={0.8}
                onPress={() => setShowPostTripWarning(false)}>
                <Text style={styles.preTripSkipTxt}>Skip for Now</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </Modal>
        {/* {showTimeStartModal && renderWaitTimeModal()} */}
        {openNavChoiceModal && renderOpenNavChoiceModal()}
        {openRouteRetryModal && renderRouteRetryModal()}
    </View>
    </>
  );
};

export default DriverOnRide;

const styles = StyleSheet.create({
    /* ── Pre-trip warning modal ── */
    preTripOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    preTripWarningBox: {
      backgroundColor: Colors.white,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 360,
      gap: 10,
    },
    preTripWarningTitle: {
      fontSize: 17,
      fontFamily: Fonts.semi_bold,
      color: '#BF360C',
      textAlign: 'center',
    },
    preTripWarningMsg: {
      fontSize: 13,
      fontFamily: Fonts.regular,
      color: '#555',
      textAlign: 'center',
      lineHeight: 20,
    },
    preTripUploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: Colors.periwinkle,
      paddingVertical: 13,
      borderRadius: 10,
      marginTop: 6,
    },
    preTripUploadBtnTxt: { fontSize: 14, fontFamily: Fonts.semi_bold, color: Colors.white },
    preTripSkipBtn: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    preTripSkipTxt: { fontSize: 13, fontFamily: Fonts.medium, color: '#999' },
    /* ── Start Navigation Button ── */
    navBtn:{
      flexDirection:'row',
      alignItems:'center',
      justifyContent:'center',
      alignSelf:'center',
      gap:8,
      backgroundColor:Colors.periwinkle,
      paddingVertical:12,
      paddingHorizontal:28,
      borderRadius:28,
      marginVertical:10,
      elevation:4,
      shadowColor:Colors.periwinkle,
      shadowOffset:{width:0,height:3},
      shadowOpacity:0.35,
      shadowRadius:6,
    },
    navBtnTxt:{
      fontFamily:Fonts.semi_bold,
      fontSize:14,
      color:Colors.white,
    },
    /* ── Waiting Time Card ── */
    waitingCard:{
      width:'90%',
      alignSelf:'center',
      backgroundColor:'#FFF8E1',
      borderRadius:14,
      padding:14,
      marginVertical:10,
      elevation:3,
      shadowColor:'#000',
      shadowOffset:{width:0,height:1},
      shadowOpacity:0.1,
      shadowRadius:4,
      borderLeftWidth:4,
      borderLeftColor:'#FFC107',
    },
    waitingTopRow:{
      flexDirection:'row',
      alignItems:'center',
      gap:12,
      marginBottom:12,
    },
    waitingIconCircle:{
      width:36,
      height:36,
      borderRadius:18,
      backgroundColor:'#FFC107',
      alignItems:'center',
      justifyContent:'center',
    },
    waitingLabel:{
      fontFamily:Fonts.regular,
      fontSize:11,
      color:'#9E8600',
    },
    waitingTimer:{
      fontFamily:Fonts.semi_bold,
      fontSize:20,
      color:Colors.black,
    },
    stopTimerBtn:{
      flexDirection:'row',
      alignItems:'center',
      justifyContent:'center',
      gap:6,
      backgroundColor:'#E53935',
      paddingVertical:8,
      borderRadius:8,
    },
    stopTimerBtnTxt:{
      fontFamily:Fonts.medium,
      fontSize:13,
      color:Colors.white,
    },
    /* ── Reached Waypoint ── */
    reachedBtnWrap:{
      paddingHorizontal:16,
      marginVertical:8,
    },
    reachedBtn:{
      flexDirection:'row',
      alignItems:'center',
      gap:12,
      backgroundColor:Colors.periwinkle,
      paddingVertical:14,
      paddingHorizontal:18,
      borderRadius:14,
      elevation:4,
      shadowColor:Colors.periwinkle,
      shadowOffset:{width:0,height:2},
      shadowOpacity:0.3,
      shadowRadius:5,
    },
    reachedBtnTitle:{
      fontFamily:Fonts.semi_bold,
      fontSize:14,
      color:Colors.white,
    },
    reachedBtnSub:{
      fontFamily:Fonts.regular,
      fontSize:11,
      color:'rgba(255,255,255,0.8)',
      marginTop:2,
    },
    /* ── Duration Bar ── */
    durationBar:{
      flexDirection:'row',
      alignItems:'center',
      justifyContent:'space-between',
      width:'92%',
      alignSelf:'center',
      backgroundColor:'#F5F5FF',
      borderRadius:14,
      paddingVertical:10,
      paddingHorizontal:14,
      marginVertical:10,
      elevation:2,
      shadowColor:'#000',
      shadowOffset:{width:0,height:1},
      shadowOpacity:0.06,
      shadowRadius:3,
      borderWidth:1,
      borderColor:'#E8E8F0',
    },
    durationInfoWrap:{
      flexDirection:'row',
      backgroundColor:Colors.yellow_xlight,
      elevation:2,
      borderRadius:20,
      gap:5,
    },
    durationChip:{
      flexDirection:'row',
      alignItems:'center',
      gap:3,
      borderColor:Colors.black,
      paddingVertical:2,
      paddingHorizontal:6,
      borderRadius:20,
      borderLeftWidth:1

    },
    durationChipTxt:{
      fontFamily:Fonts.medium,
      fontSize:13,
      color:Colors.black,
    },
    recenterBtn:{
      // width:36,
      // height:36,
      borderRadius:18,
      backgroundColor:Colors.periwinkle,
      alignItems:'center',
      justifyContent:'center',
      elevation:2,
      flexDirection:'row',
      paddingVertical:5,
      paddingHorizontal:14,
      gap:4
    },
    recenterBtnText:{
      fontSize:12,
      fontFamily:Fonts.medium,
      color:Colors.white,
    },
    /* Navigation Choice Modal Styles */
    navSheetContainer:{
      paddingHorizontal:18,
      paddingTop:12,
      paddingBottom:28,
      gap:14,
      backgroundColor:Colors.white,
      borderRadius:10,
      width:'90%'
    },
    navHeaderRow:{
      flexDirection:'row',
      alignItems:'center',
      justifyContent:'space-between'
    },
    navHeader:{
      fontFamily:Fonts.semi_bold,
      fontSize:16,
      color:Colors.black
    },
    navSubHeader:{
      fontFamily:Fonts.light,
      fontSize:12,
      color:Colors.grey_dark
    },
    navCloseBtn:{
      padding:6,
      borderRadius:20,
      backgroundColor:Colors.grey_xlight
    },
    navOptionsRow:{
      flexDirection:'row',
      gap:12
    },
    navOptionCard:{
      flex:1,
      backgroundColor:Colors.white,
      borderRadius:12,
      paddingVertical:14,
      paddingHorizontal:12,
      elevation:3,
      shadowColor:'#000',
      shadowOffset:{width:0,height:1},
      shadowOpacity:0.15,
      shadowRadius:2,
      borderWidth:1,
      borderColor:Colors.grey_xlight,
      gap:6
    },
    navOptionPressed:{
      opacity:0.8,
      transform:[{scale:0.98}]
    },
    navIconCircle:{
      width:40,
      height:40,
      borderRadius:20,
      backgroundColor:Colors.periwinkle,
      alignItems:'center',
      justifyContent:'center'
    },
    navOptionLabel:{
      fontFamily:Fonts.medium,
      fontSize:14,
      color:Colors.black
    },
    navOptionDesc:{
      fontFamily:Fonts.light,
      fontSize:11,
      color:Colors.grey_dark
    },
    navFooterHintWrapper:{
      flexDirection:'row',
      alignItems:'center',
      gap:6,
      marginTop:4
    },
    navFooterHint:{
      fontFamily:Fonts.light,
      fontSize:11,
      color:Colors.grey_dark,
      flex:1
    },
    /* RouteStatusOverlay-like styles */
    routeOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    routeErrorBox: {
      width: '75%',
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      elevation: 4,
    },
    routeIconWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    routeErrorText: {
      color: Colors.red,
      fontSize: 14,
      marginBottom: 8,
      fontFamily:Fonts.regular
    },
    routeHelperText: {
      color: Colors.grey_dark,
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 8,
      fontFamily:Fonts.regular
    },
    routeRetryBtn: {
      backgroundColor: Colors.grey_dark,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    routeRetryText: {
      color: 'white',
      fontSize: 14,
    fontFamily:Fonts.semi_bold
    },
    routeBackBtn: {
      backgroundColor: 'transparent',
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: Colors.grey_dark,
    },
    routeBackText: {
      color: Colors.grey_dark,
      fontSize: 14,
      fontFamily:Fonts.semi_bold
    },
    /* ── Acting driver media upload row ── */
})
