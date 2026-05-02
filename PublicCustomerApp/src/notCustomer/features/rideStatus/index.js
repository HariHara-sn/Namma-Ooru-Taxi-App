import React, { useState,useEffect } from 'react';
import DriverArrivalScreen from './screens/DriverArrivalScreen';
import OnRideScreen from './screens/OnRideScreen';
import DriverSearchScreen from './screens/DriverSearchScreen';
import CompletedRideScreen from './screens/RideCompletedScreen';
import { TripStatus } from './types/TripStatus';
import useCurrentRideInfoStore from './store/useCurrentRideInfoStore';
import NavBar from '../../components/NavBar';   
import { View, StyleSheet, TouchableOpacity, Vibration,Text } from 'react-native';
import { Fonts } from '../../constants/constants';
import { colors } from '../../constants/constants';
import MapIcon from '../../components/Map/MapIcon';
import CurrentLocationIcon from '../../assets/icons/CurrentLocationIcon.svg';
import locationTask from '../../controllers/GetCurrentLocation';
import CancelComponent from './component/CancelComponent';
import BookingCancelModel from './component/BookingCancelModel';
import AnimatedBottomSheetWrapper from '../shared/component/AnimatedBottomSheetWrapper';
import { useStackScreenStore } from '../../store/useStackScreenStore';
import PaymentType from '../booking/components/bookRide/PaymentType';
import { cancelRide } from '../../API/EndPoints/EndPoints';
import { showNotification } from '../../components/NotificationManger';

import useRideMatching  from '../../hooks/useRideMatching';
import  useUserInfoStore  from '../../../common/store/useUserInfoStore';
import useCalculateDistance from './hooks/useCalculateDistance';
import { useTranslation } from 'react-i18next';
import Overlay from '../../components/Overlay';
import {DataStore}from '../../controllers/DataStore';
import PREF from '../../storage/PREF';
import getGpsData from './services/getgpsdata';
import { findRoute } from '../../controllers/NEMap/findRoute';
import useLocationStore from '../../store/useLocationStore';
import useAssignedDriverInfoStore from './store/useAssignedDriverInfoStore';
import useMapStore from '../map/store/useMapStore';
import useWayPointReorderStore from '../booking/store/useWayPointReorderStore';
import { openFeedback } from '../../utils/feedback';
import {getCurrentDeviceLocation} from '../../utils/location'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { firebaselog_onRide } from '../../../common/utils/FirebaseAnalytics';

const RideStatus = () => {
  const { userdetails } = useUserInfoStore();
  const { t } = useTranslation();
  const [showOverlay, setShowOverlay] = useState(false);
  const {incrementCancelledTrips,setActiveTripId,setIncrementCancelledTripsOccurance} = useUserInfoStore();
  const {location} = useLocationStore();
  const {
    setGeometries,
    setMapBounds,
    setMapMarkers,
    setVehicleMarkers
  } = useMapStore();
  const {driverLatitude,driverLongitude} = useAssignedDriverInfoStore();
  const { duration,totalDistance,tripStatus,tripId,paymentMethod,setPaymentMethod,showBookingCancelModel,setShowBookingCancelModel,resetCurrentRideInfo,setFareDetails,setTripStatus,setFinalDistance,setFinalDuration,onGoingTripCancelled,setOngoingingTripCancelled,stops,estimatedFare} = useCurrentRideInfoStore();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const {goBack,stackScreen,setStackScreen} = useStackScreenStore();
  const [isPaymentMethodChangeShow,setIspaymentMethodChangeShow] = useState(false);
  const {stopMatching} = useRideMatching();
  const {setWaitingForDriverApproval} = useWayPointReorderStore();
  const {id:userId} = useUserInfoStore();
  const [isCalculateDistance,setIsCalculateDistance] = useState(false);
  const {cancelTripOccurance} = useUserInfoStore();
  const [showWarningModal, setShowWarningModal] = useState(false);
  
  const [cancelReason, setCancelReason] = useState('');
  const {gpsDistance, gpsDuration, loading} = useCalculateDistance({ tripId:tripId , startTime: 1717190400000, endTime: new Date().setHours(23, 59, 59, 999),enabled: isCalculateDistance});
 
 const [cancelLoading, setCancelLoading] = useState(false);
  const handleOverlay = (action) => {
   
    
    if(action === 'close'){
      setShowOverlay(false);
    }else if(action === 'open'){
      setShowOverlay(true);
    }
  };

  const CancelRide = async (payload) => {
    try{
    console.log("payload",payload)
    const response = await cancelRide(payload);
    console.log('response',response)
    if (response.success) {
    setIncrementCancelledTripsOccurance()
      setGeometries([])
      setMapMarkers([])
      setVehicleMarkers([])
      Vibration.vibrate();
        showNotification('Ride cancelled successfully');
       
        setShowBookingCancelModel(false);
        incrementCancelledTrips()

        if (tripStatus === TripStatus.PICKEDUP && response?.totalFare?.fareDetails?.fare) {
          setOngoingingTripCancelled(true);

          setStackScreen('PaymentScreen',{})
    
        } else {
          console.log('tripStatus',tripStatus)
          // await DataStore.clearData(PREF.CURRENT_TRIP)
          resetCurrentRideInfo();
          setActiveTripId(null) 
          goBack();
        } 
      firebaselog_onRide('OR_Status(OR_S)','OR_S:cancelled_by_customer_before_pickup')
      setWaitingForDriverApproval(null);
      setShowBottomSheet(false);
      setCancelLoading(false);
      }

      setCancelLoading(false);
      
      
    }
    catch (error) {
      setCancelLoading(false);
      console.error("Error cancelling ride:", error);
      showNotification('Failed to cancel ride. Please try again.');
      
    }
  }
  const handleCancel = async (reason) => {
    setCancelLoading(true);
    if(tripStatus === TripStatus.PENDING){
      //  await DataStore.clearData(PREF.CURRENT_TRIP)
      incrementCancelledTrips()
      stopMatching(tripId,userId)
      resetCurrentRideInfo();
      goBack();
      return
    }

   

    // if(AppConfig.RIDE_CANCELLED_MIDWAY_FUEL_CHARGE){
    //   const payload = {
    //     tripId,
    //     reason,
    //     totalDistance: totalDistance,
    //     totalDuration: Math.round(gpsDuration)
    // };
    
    //   await CancelRide(payload);
      
    //   return
    // }

   
    if (tripStatus === TripStatus.PICKEDUP) {
      const pickupTime = stops[0]?.arrivalTime;
      let GPSdistance = 0;
      let GPSduration = 0;
      const access_token = await DataStore.loadData('access_token');

      const data = await getGpsData({
        tripId: tripId,
        startTime: pickupTime,
        endTime: new Date().setHours(23, 59, 59, 999),
        token: access_token?.data,
      });


      if(data){

      GPSdistance = data?.distance ? data.distance : 0;
      GPSduration = data?.duration ? Math.round(data.duration) : null;

      setIsCalculateDistance(true);

      let FinalDuration = 0;
      if(stops?.[0]?.arrivalTime){
        const finalArrivalMs = Number(stops?.[0]?.arrivalTime ?? 0); 
        const nowMs = Date.now(); 
        const totalDurationMs = nowMs-finalArrivalMs;
        FinalDuration = totalDurationMs / 60000;
      }
      else{
        FinalDuration = GPSduration;
      }

      // if( distance == null && duration == null) {
      //   const routePoints = stops.filter(stop => stop.isReached == true).map(stop => ({
      //     lat: stop.location[1], 
      //     lon: stop.location[0] 
      // }));
      //   if(driverLatitude && driverLongitude) {
      //     routePoints.push({
      //       lat: driverLatitude,
      //       lon: driverLongitude
      //     });
      //   }else{
      //   if(location[0] && location[1]) {
      //     routePoints.push({
      //       lat: location[1],
      //       lon: location[0]
      //     });
      //   }
      // }
      // const routeData = await findRoute(routePoints);
      // if (routeData && routeData.trip && routeData.trip.summary) {
      // distance = routeData.trip.summary.length; 
      //  }
      // }
      console.log("FinalDuration",FinalDuration)
      console.log("GPSdistance",GPSdistance)
      
     
      
      const payload = {
        tripId,
        reason: cancelReason,
        totalDistance: parseFloat((GPSdistance)?.toFixed(1)) || 0.0,
        totalDuration: Math.round(FinalDuration),
      };
       const location = await getCurrentDeviceLocation();
      if(location && location.latitude && location.longitude){
        payload.droppedAtLoc = {
          lat: location.latitude,
          lon: location.longitude
        }
      }

      console.log("payload",payload)
      const response = await CancelRide(payload);
       firebaselog_onRide('OR_Status(OR_S)','OR_S:cancelled_by_customer_after_pickup')
      if (response.success) {
       
        setWaitingForDriverApproval(null);
        setShowBottomSheet(false);
        setCancelLoading(false);
      }
      else{
        showNotification('Failed to cancel ride. Please try again.');
        setCancelLoading(false);
      }
      
    
      setCancelLoading(false);
     
     
      return
    }
      


     }else {

      const payload = {
        tripId,
        reason,
        isNotyetPickedUp: true
      };
      console.log("payload",payload)

      await CancelRide(payload);
     
      return

      }
 
    };

 
  const renderScreen = () => {
   
    switch (tripStatus) {
      case TripStatus.PICKEDUP:
        return <OnRideScreen onCancel={()=>{setShowBottomSheet(true)}} onPaymentMethodChange={()=>{setIspaymentMethodChangeShow(true)}}  handleOverlay={handleOverlay}/>;
      case TripStatus.ACCEPTED:
        return <DriverArrivalScreen onCancel={()=>{setShowBottomSheet(true)}}   handleOverlay={handleOverlay}/>;
      case TripStatus.DROPPED:
        return <CompletedRideScreen />;
      case TripStatus.CANCELLED:
        if(onGoingTripCancelled){
          return <CompletedRideScreen type={TripStatus.CANCELLED} />;
        }
        else{
          return <DriverSearchScreen  onCancel={handleCancel} onTripCancel={()=>{setShowBottomSheet(true)}} />;
        }
      default:
        return <DriverSearchScreen  onCancel={handleCancel} onTripCancel={()=>{setShowBottomSheet(true)}}  />;
    }
  };



  useEffect(()=>{
    return () => {
      setShowBookingCancelModel(false);
      setGeometries([])
      setMapMarkers([])
    
    }
  },[])

  useEffect(()=>{
    setShowBottomSheet(false)
    setShowOverlay(false);
    if (tripStatus === TripStatus.COMPLETED || tripStatus === TripStatus.DIVERGED ){
      setStackScreen('TripFeedbackScreen',{})
    }

  },[tripStatus])

  const handleClose = () => {
    setCancelLoading(false);
  }

 

 
 


  const handlePaymentMethodChange = (paymentMethod) => {
    
    setIspaymentMethodChangeShow(false);
    setPaymentMethod(paymentMethod);
  }

  const onFeedbackPress = () => {
    try {
      const startStop = Array.isArray(stops) && stops.length > 0 ? stops[0] : undefined;
      const endStop = Array.isArray(stops) && stops.length > 0 ? stops[stops.length - 1] : undefined;
      const pickupCoords = startStop?.location; // expected [lon, lat]
      const dropCoords = endStop?.location; // expected [lon, lat]
      const distanceKm = typeof totalDistance === 'number' ? String(totalDistance) : '';

      openFeedback({
        screenName: 'RideStatus',
        initialValues: {
          tripId,
          tripStartName: startStop?.address || '',
          tripEndName: endStop?.address || '',
          tripDistanceKm: distanceKm,
          pickupCoords,
          dropCoords,
          estimatedFare: estimatedFare || '',
        },
      });
    } catch (e) {
      // no-op
    }
  };

 const getTitle = () => {
  switch(tripStatus){
    case TripStatus.PICKEDUP:
      return t('on_ride');
    case TripStatus.ACCEPTED:
      return t('driver_arrival');
    case TripStatus.DROPPED:
      return t('ride_completed');
    case TripStatus.CANCELLED:
      return t('ride_cancelled');
    default:
      return t('finding_driver');
  }
 }
  

    return <>
   {showOverlay && <Overlay
      visible={showOverlay}
      onPress={handleOverlay}
      backgroundColor="rgba(0, 0, 0, 0.7)"
      zIndex={0}
  >
    </Overlay>}
        <NavBar title={t(getTitle())} feedbackIcon={true} onrightIconPress={onFeedbackPress} />
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            try {
              if (global.checkOnGoingRideAndLog) {
                global.checkOnGoingRideAndLog(true);
              }
            } catch (e) {
              // no-op
            }
          }}
        >
          <Icon name="refresh" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.container}>
            {renderScreen()}
        </View>

        {
      showBottomSheet &&
      <AnimatedBottomSheetWrapper onClose={()=>{handleClose();setShowBottomSheet(false)}}>
        <CancelComponent onClose={()=>{setShowBottomSheet(false)}} onCancel={handleCancel}  loading={loading} cancelLoading={cancelLoading} rideStatus={tripStatus} />
      </AnimatedBottomSheetWrapper>
      
    }
    {
      isPaymentMethodChangeShow &&
      <AnimatedBottomSheetWrapper onClose={()=>{setIspaymentMethodChangeShow(false)}}>
        <PaymentType onSelect={handlePaymentMethodChange} initialValue={paymentMethod} />
      </AnimatedBottomSheetWrapper>
    }
    {
      showBookingCancelModel &&
      <AnimatedBottomSheetWrapper onClose={()=>{setShowBookingCancelModel(false)}}>
        <BookingCancelModel onClose={()=>{setShowBookingCancelModel(false)}} onCancel={handleCancel} />
      </AnimatedBottomSheetWrapper>
    }
   
    </>;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    borderRadius: 20,
  },
  refreshButton:{
    position:'absolute',
    left:20,
    top:10,
    backgroundColor:colors.white,
    padding:6,
    borderRadius:50,
    zIndex:10,
    elevation:5,
  },

  containerTop: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  containerTop_inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  containerTop_inner_text: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.black,
    textAlign: 'center',
    zIndex: 1,
  },
  container_inner: {
    backgroundColor:'#0f223c',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
   
    
  },
  currentLocationIcon: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'white',
    elevation: 10,
    top:-10
  },
});

export default RideStatus;
