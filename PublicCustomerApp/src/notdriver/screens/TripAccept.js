import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  NativeModules,
  AppState,
} from 'react-native';
import React, {useEffect, useState, useRef, useCallback, useMemo, useContext} from 'react';
import { useTripAcceptStore } from '../store/useTripAcceptStore';
import usePublicDriverStore from '../store/usePublicDriverStore';
import useUserStore from '../../common/store/useUserStore';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import useTripsStore from '../store/useTripsStore';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import { showNotification } from '../../common/components/Alerts/showNotification';
import tripAlert from '../../common/controllers/TripAlert';
import { DataStore } from '../../common/controllers/DataStore';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import driverWaitingTime from '../Controller/DriverWaitingTime';
import { height } from '../../common/utils/scalingutils';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import { DateTimeFormatter } from '../../common/utils/DateTimeFormatter';
import { Colors, colors, Fonts } from '../../common/constants/constants';
import CustomeBottomSheet from '../../common/components/CustomeBottomSheet';
import Rupee from '../../notdriver/assets/icons/rupee.svg';
import AddressComponent from '../components/AddressComponent';
import RideMatchWSService from '../../common/controllers/socketServices/RideMatchSocketService';
import PushNotifications from '../../common/core/PushNotifications';
import { useTranslation } from 'react-i18next';
import APIRequest from '../../common/APIRequest';
import GlobalContext from '../../context/GlobalContext';
import { firebaselog_tripBooking } from '../../common/utils/FirebaseAnalytics';
import findDistance from '../../common/core/FindDistance';
import overlayController from '../../common/controllers/Overlay';


const {NeNativeModule} = NativeModules;

const TripAccept = () => {
  const {
    tripId,
    tripDetails,
    loading,
    setLoading,
    setError,
    requestId,
    reset,
    timeOutSeconds,
    alertedAt,
    escalationDetails,
    setTripDetails,
    dataFromSocket
  } = useTripAcceptStore();
  // const {tripRequestData} = useTripRequestStore();
  const {setShowRatingModal, setShowPaymentInitiatedLoader} = usePublicDriverStore();
  const {userInfo} = useUserStore();
  const {setStackScreen} = useStackScreenStore();
  const {setActiveTripData, setNewStopData} = useTripsStore();
  // const resetAllStore = useResetStore();
  const bookingTime = tripDetails?.bookingTime
  const timerDuration = timeOutSeconds || 15;

  // Only start timer after successful trip fetch; null means not started
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [timerPaused, setTimerPaused] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef(null);

  const {logout} = useContext(GlobalContext)


  const { t } = useTranslation();
  
  const {setDirectionPoints,setDirectionResponse} = useMapMarkerStore();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      setAppState(nextState);
    });
    return () => {
      subscription.remove();
    };
  }, []);

    const fetchTripData = async () => {
    try {
      setLoading(true);
      const api = new APIRequest();
      const response = await api.request(`/publicrides/driver/v2/getTrip?tripId=${tripId}`, 'GET', null,  userInfo?.token);
      if (response?.success && response?.trip && response?.trip?.length > 0) {
        // console.log('Fetched trip details successfully:', response.trip[0]);
        const freshTrip = response.trip[0];
        setTripDetails(freshTrip);
        if (!requestId && freshTrip?.request_id) {
          useTripAcceptStore.setState({requestId: freshTrip.request_id});
        }
        // console.log('alertedAt:', alertedAt, 'timerDuration:', timerDuration, 'currentTime:', Date.now());
        // const remainingTimeDuration = Math.floor(((alertedAt || 0) + timerDuration * 1000 - Date.now()) / 1000);
        // console.log('Remaining time duration:', remainingTimeDuration);
          let alertedAtMs = alertedAt;
      if (typeof alertedAtMs === 'string') {
        alertedAtMs = parseInt(alertedAtMs, 10);
      }
      const timeoutSec = typeof timerDuration === 'string' ? parseInt(timerDuration, 10) : Number(timerDuration);
      const remainingTimeDuration = Math.floor(((alertedAtMs || 0) + (timeoutSec || 15) * 1000 - Date.now()) / 1000);
      const clamped = Math.max(0, remainingTimeDuration);

      

      // setTimeLeft(clamped);
      if (remainingTimeDuration <= 0) {
        setTimeLeft(0);
      } else {
        setTimeLeft(clamped);
         if (appState === 'active') {
        tripAlert.playAlertSound();
      } else {
        console.log('[RideMatchWSService] App in background; skipping alert sound');
      }
      }
      } else {
        setError('Failed to fetch trip data');
        // Do not start timer on failure
        setTimeLeft(null);
         if (response.error === "SESSION_EXPIRED") {
          logout('driver');
          tripAlert.stopAlertSound()
          BGLocationTask.stopDriverBgTask();
           overlayController.stopOverlay();
          return
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching trip data:', err);
      setError('An error occurred while fetching trip data');
      setTimeLeft(null);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(( ) => {
     if (!dataFromSocket) {
      fetchTripData();
     }
  },[])

  // Normalize stops from socket payload; fallback to pickup/drop if stops missing
  
  const stopsForDisplay = useMemo(() => {
    const stops = Array.isArray(tripDetails?.stops) ? tripDetails.stops : [];
    if (stops.length > 0) return stops;
    const fallback = [];
    if (Array.isArray(tripDetails?.pickup_location) && tripDetails.pickup_location.length === 2) {
      fallback.push({
        location: tripDetails.pickup_location,
        name: 'Pickup Point',
        address: tripDetails?.pickup_address || '',
        passangers: [],
      });
    }
    if (Array.isArray(tripDetails?.dropoff_location) && tripDetails.dropoff_location.length === 2) {
      fallback.push({
        location: tripDetails.dropoff_location,
        name: 'Drop Point',
        address: tripDetails?.dropoff_address || '',
        passangers: [],
      });
    }
    return fallback;
  }, [tripDetails]);
  
  // console.log('stopsForDisplay:', timeLeft);

  // Derive distance in meters: use estimatedDistance if present; otherwise sum between stops
  const displayDistance = useMemo(() => {
    const est = tripDetails?.estimatedDistance;
    if (typeof est === 'number' && !Number.isNaN(est) && est >= 0) {
      return est;
    }
    if (!Array.isArray(stopsForDisplay) || stopsForDisplay.length < 2) {
      return 0;
    }
    let total = 0;
    for (let i = 1; i < stopsForDisplay.length; i += 1) {
      const prev = stopsForDisplay[i - 1]?.location;
      const curr = stopsForDisplay[i]?.location;
      if (Array.isArray(prev) && prev.length === 2 && Array.isArray(curr) && curr.length === 2) {
        const a = { latitude: prev[1], longitude: prev[0] };
        const b = { latitude: curr[1], longitude: curr[0] };
        const d = findDistance(b,a, 'km');
        if (typeof d === 'number' && !Number.isNaN(d)) total += d;
      }
    }
    return total;
  }, [tripDetails?.estimatedDistance, stopsForDisplay]);


  // Use trip details from socket store; compute timer without API
  useEffect(() => {
    if (!dataFromSocket) return
    setLoading(true);
    if (tripDetails && (tripDetails?.trip_id || tripId)) {
      if (!requestId && tripDetails?.request_id) {
        useTripAcceptStore.setState({requestId: tripDetails.request_id});
      }
      // Normalize alertedAt to ms and timeout to seconds before computing
      let alertedAtMs = alertedAt;
      if (typeof alertedAtMs === 'string') {
        alertedAtMs = parseInt(alertedAtMs, 10);
      }
      const timeoutSec = typeof timerDuration === 'string' ? parseInt(timerDuration, 10) : Number(timerDuration);
      const remainingTimeDuration = Math.floor(((alertedAtMs || 0) + (timeoutSec || 15) * 1000 - Date.now()) / 1000);
      const clamped = Math.max(0, remainingTimeDuration);

      setTimeLeft(clamped);
      setTimerPaused(false);
      setError(null);
    } else {
      setError('No trip details available');
      setTimeLeft(null);
      setTimerPaused(false);
    }
    setLoading(false);
  }, [tripDetails, tripId, alertedAt, timerDuration, setLoading, setError, appState]);

  const handleDecline = useCallback((isTimerEnd) => {
    // Handle trip decline logic here
    setShowPaymentInitiatedLoader(false)
    try {
      if (!isTimerEnd) {
      const acceptData = {
        driver_id: userInfo?._id,
        trip_id: tripId,
        response: 'reject',
        request_id: requestId,
      };
      setLoading(true);
      RideMatchWSService.emit('driver_trip_response', acceptData);
      showNotification('Trip has been Cancelled', '', 'success');
      } else {
       firebaselog_tripBooking('TB_Driver_Allocation(TB_DA)', 'TB_DA:trip_timeout_inapp');
       showNotification('Trip Response Timed Out', '', 'success');
      }
      PushNotifications.onClearAllNotifications();
      tripAlert.stopAlertSound();
      // Clear all trip-related data to prevent loop
      setDirectionPoints(null);
      setStackScreen('Home');
      setActiveTripData([]);
      DataStore.storeData('activeTripId', null);
      NeNativeModule.clearDirectionPoints()
      setNewStopData(null)
      setDirectionResponse(null)
      // Reset trip accept store completely
      reset();
      BGLocationTask.hideOverlay();
    } catch (err) {
      console.log('hari-->>accept-->>err-->>', err);
      setLoading(false);
    }
  }, [userInfo?._id, tripId, requestId, setLoading, setDirectionPoints, setStackScreen, setActiveTripData, reset]);

  const onTimerComplete = useCallback(() => {
    handleDecline(true);
  }, []);

  // Start / restart animation only when we have remaining time > 0
  useEffect(() => {
    // Do nothing until we have a numeric timeLeft
    if (timeLeft == null || timerPaused) return;
    // Adjust starting progress proportionally to remaining time
    const remainingFraction = Math.min(1, timeLeft / timerDuration);
    progressAnim.setValue(remainingFraction);
    animationRef.current = Animated.timing(progressAnim, {
      toValue: 0,
      duration: timeLeft * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animationRef.current.start();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [timeLeft, timerDuration, progressAnim, timerPaused]);

  // Handle timer countdown separately, clamped at zero
  useEffect(() => {
    if (timeLeft == null || timerPaused) return; // not started or paused
    if (timeLeft <= 1) {
      onTimerComplete();
      return;
    }
    const timerId = setTimeout(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft, onTimerComplete, timerPaused]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const handleAccept = async () => {
    setLoading(true);
    setShowRatingModal(false)
    setShowPaymentInitiatedLoader(false)
    driverWaitingTime.stopWaitingTime();
    BGLocationTask.hideOverlay();
    try {
      const acceptData = {
        driver_id: userInfo?._id,
        trip_id: tripId,
        response: 'accept',
        request_id: requestId,
      };
      RideMatchWSService.emit('driver_trip_response', acceptData);
      PushNotifications.onClearAllNotifications();
      tripAlert.stopAlertSound();
      setTimerPaused(true);
      setNewStopData(null)
      reset();
    } catch (err) {
      console.log('hari-->>accept-->>err-->>', err);
      setLoading(false);
    }
  };

  const formatDistance = distance => {
    if (!distance) return '0 km';

    if (distance >= 1000) {
      const kilometers = (distance / 1000).toFixed(1);
      return `${kilometers} km`;
    }

    return `${distance ? distance.toFixed(2) : 0} km`;
  };

  useEffect(() => {
    const request = tripDetails?.routeData?.request || null;
    const response = tripDetails?.routeData?.response || null;
    if (request && response) {
      const padding = [50, 50, 50, height * 0.5];
      setDirectionResponse([
        {
          requests: request,
          response: response,
          padding: padding.map(v => parseInt(v, 10)),
        },
      ]);
      return;
    }
    if (stopsForDisplay && stopsForDisplay.length !== 0) {
      const directions = stopsForDisplay.map(direction => {
        return {
          lat: direction.location[1],
          lon: direction.location[0],
        };
      });
      const padding = [50, 50, 50, height * 0.5];
      setDirectionPoints({
        locations: directions,
        type: 'car',
        padding: padding.map(v => parseInt(v, 10)),
      });
    }
    return () => {
      setDirectionPoints(null);
      setDirectionResponse(null);
    };
  }, [stopsForDisplay, tripDetails]);

  const checkDriverToken = async () => {
     const api = new APIRequest()
     try {
       const response = await api.request('/publicrides/driver/v2/checkDriverToken', "GET", null, userInfo?.token);
        if (response.error === "SESSION_EXPIRED") {
          logout('driver');
           BGLocationTask.stopDriverBgTask();
           tripAlert.stopAlertSound();
           RideMatchWSService.close();
          return
        }
     } catch (err) {
       console.log('hari-->>checkDriverToken-->>err-->>', err);
     }
  }

  // Cleanup effect to reset loading state when component unmounts
  useEffect(() => {
    checkDriverToken()
    return () => {
      setLoading(false);
      reset();
    };
  }, [setLoading, reset]);


  const getAlertedAt = () => {
     if (typeof alertedAt === 'number') {
      return alertedAt;
    }
    if (typeof alertedAt === 'string') {
      const parsed = parseInt(alertedAt, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return 0;
  } 

  return (
    <>
      {loading && (
        <View style={{position:'absolute', width:'100%', height:'100%', zIndex:99999}}>
          <FullScreenLoader />
        </View>
      )}
      <View style={styles.container}>
        <CustomeBottomSheet useScrollView={true} snapPoints={['60%', '100%']}>
          {escalationDetails?.escalation_bonus > 0 && (
            <View style={{flexDirection:'row', justifyContent:'space-evenly', alignItems:'center', width:'90%', alignSelf:'center'}}>
              <Rupee width={30} height={30}/>
              <View style={styles.bonusContainer}>
                <Text style={styles.bonusText}>{t('special_bonus_applied', {defaultValue : 'Special bonus applied !!'})}</Text>
              </View>
              <Rupee width={30} height={30}/>
            </View>
          )}
          <View style={styles.addressComponent}>
            <View style={styles.tripDetailsConatiner}>
              <View style={styles.tripDetailsSubConatiner}>
                <Text style={styles.tripDetailsSubConatinerTxt}>{t('distance')}</Text>
                <Text style={styles.tripDetailsSubConatinerSubTxt}>{formatDistance(displayDistance)}</Text>
              </View>
              <View style={styles.tripDetailsSubConatiner}>
                <Text style={styles.tripDetailsSubConatinerTxt}>{t('booked_at')}</Text>
                <Text style={styles.tripDetailsSubConatinerSubTxt}>{DateTimeFormatter.requiredDateFormat(bookingTime || getAlertedAt(), 'hh:mm A')}</Text>
              </View>
            </View>
            <AddressComponent
              percentage={0}
              waypoints={stopsForDisplay}
              deviceLocation={null}
              isPublicRides={true}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Animated.View style={[styles.progressOverlay, {width: animatedWidth}]} />
            <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={()=>handleAccept()}>
              <Text style={styles.buttonText}>{t('accept_ride')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.declineBtn} onPress={()=>handleDecline()}>
            <Text style={styles.declineBtnTxt}>{t('decline_ride')}</Text>
          </TouchableOpacity>
        </CustomeBottomSheet>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {flex:1},
  buttonWrapper: {
    width: '90%',
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#58B487', // base green
    alignSelf:'center'
  },
  button: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily:Fonts.semi_bold
  },
  progressOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#299865', // darker green
    zIndex: 1,
  },
  timeLeftView:{
    width:30,
    height:30,
    borderRadius:50,
    borderColor:Colors.black,
    borderWidth:1,
    alignItems:'center',
    justifyContent:'center',
    alignSelf:'flex-end',
    marginVertical:10,
    marginRight:15
  },
  declineBtn:{
    width:'60%',
    backgroundColor:'#FF43430D',
    marginVertical:10,
    alignSelf:'center',
    alignItems:'center',
    justifyContent:'center',
    height:50,
    borderRadius:8,
    borderColor:'#FF4343',
    borderWidth:1
  },
  declineBtnTxt:{
    fontFamily:Fonts.semi_bold,
    fontSize:12,
    color:'#FF4343'
  },
  timerText:{
    fontFamily:Fonts.light,
    fontSize:12,
    color:Colors.black
  },
  addressComponent:{
    marginVertical:10
  },
  tripDetailsConatiner:{
    flexDirection:'row',
    justifyContent:'space-between',
    width:'90%',
    alignSelf:'center',
    borderTopWidth:1,
    borderBottomWidth:1,
    paddingVertical:10,
    borderStyle:'dashed',
    borderColor:Colors.grey_xxdark
  },
  tripDetailsSubConatiner:{
    alignItems:'center'
  },
  tripDetailsSubConatinerTxt:{
    fontFamily:Fonts.medium,
    fontSize:14,
    color:Colors.black
  },
  tripDetailsSubConatinerSubTxt:{
    fontFamily:Fonts.regular,
    fontSize:14,
    color:Colors.black
  },
  bonusContainer:{
    backgroundColor:'#E6F7EF',
    paddingHorizontal:10,
    paddingVertical:6,
    borderRadius:6,
    alignSelf:'center'
  },
  bonusText:{
    fontFamily:Fonts.medium,
    fontSize:12,
    color:'#1A8F5E'
  }
});

export default TripAccept;


