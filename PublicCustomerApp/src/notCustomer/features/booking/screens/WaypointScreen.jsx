import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Alert,
  Vibration

} from 'react-native';
import { useTranslation } from 'react-i18next';

import NavBar from '../../../components/NavBar';
import WaypointContainer from '../components/wayPoints/waypointContainer';
import FareDetailsModal from '../components/FareDetailsModal';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import useRideBookingLocationStore from '../store/useRideBookingLocationStore';
import useWayPointReorderStore from '../store/useWayPointReorderStore';
import useWaypointDirectionLoad from '../hooks/useWaypointDirectionLoad';
import useMapStore from '../../../features/map/store/useMapStore';
import  LocationTypes  from '../types/LocationTypes';
import { colors, Fonts } from '../../../constants/constants';
import { getPreFinalFare,passangerStopChangeRequest } from '../../../API/EndPoints/EndPoints';
import useCurrentRideInfoStore from '../../rideStatus/store/useCurrentRideInfoStore';
import { height } from '../../../utils/Utils';
import {utils} from '../../../utils/Utils';
import useRideVehicleStore from '../store/useRideVehicleStore';
import { from } from '@apollo/client';
import RouteStatusOverlay from '../../../components/Loaders/RouteStatusOverlay';
import { firebaselog_onRide, firebaselog_ridePlanning } from '../../../../common/utils/FirebaseAnalytics';

const WaypointScreen = ({ fromDriverArrival = false }) => {
  const {tripId,maxDistanceLimit,tripStatus}=useCurrentRideInfoStore()
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showFareModal, setShowFareModal] = React.useState(false);
  const [fareData, setFareData] = React.useState(null);
  const [isFareLoading, setIsFareLoading] = React.useState(false);
  const {rideStartLocation,rideEndLocation,rideWayPoints,setRideStartLocation,setRideEndLocation,setRideWayPoints} =  useRideBookingLocationStore()
  const {reOrderWaypoints,setReOrderWaypoints,setReachedStops,reachedStops,waitingForDriverApproval,setWaitingForDriverApproval,onGoingRideStops,setOnGoingRideStops,setEditedRoutecheckText,editedRoutecheckText} = useWayPointReorderStore()
  const [distance,setDistance] = React.useState(0)
  const [duration,setDuration] = React.useState(0)
  const { goBack,setStackScreen,goBackToScreen } = useStackScreenStore();
  const [enableConfirmButton,setEnableConfirmButton] = React.useState(false)
  const {availableVehicles} = useRideVehicleStore()
  const [maxVehicleDistanceLimit,setMaxVehicleDistanceLimit] = React.useState(false)
 const { 
 
    currentRouteData
  } = useRideBookingLocationStore();

  

 




  // Use the waypoint direction load hook
  const { 
    transformWaypointsToDirectionPoints, 
    isWaypointsReady 
  } = useWaypointDirectionLoad();
  
  const { setDirectionPoints,setDirectionReady, routeLoading } = useMapStore();

 
 
  const onBackPress = () => {
    setReOrderWaypoints([])
    setOnGoingRideStops(null)
    setReachedStops([])
    goBack();
    
  };

  

 
  useEffect(() => {
    const onHardwareBack = () => {
      onBackPress();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);

    return () => {
      subscription.remove();
    };
  }, [onBackPress]);
  useEffect(() => {

    if (!reOrderWaypoints.length) {
    
      let Arr = []
      
      if (!onGoingRideStops) {
        if (rideStartLocation) {
          Arr.push(rideStartLocation)
        }
        if (rideWayPoints?.length) {
          Arr = [...Arr, ...rideWayPoints]
        }
        if (rideEndLocation) {
          Arr.push(rideEndLocation)
        }
     

    
        const transformedData = Arr.map((waypoint, index) => ({
          ...waypoint,
          id: waypoint.id || `waypoint-${index}-${Date.now()}`,
          type: index === 0 ? LocationTypes.START_LOCATION : LocationTypes.WAYPOINT_LOCATION
        }));
        console.log("transformedData",transformedData)
        if(transformedData.length > 1){
          setEnableConfirmButton(true)
        }
        setReOrderWaypoints(transformedData)
      } else {
        Arr=onGoingRideStops
        const reachedStops = Arr.filter((waypoint) => waypoint.isReached).map(item=>{
          return{
            ...item,
            latitude:item.location[1],
            longitude:item.location[0]
          }
        })
        const balanceStops = Arr.filter((waypoint) => !waypoint.isReached)
      
        setReachedStops(reachedStops)
        const transformedData = balanceStops.map((waypoint, index) => ({
          ...waypoint,
          id: waypoint.id || `waypoint-${index}-${Date.now()}`,
          type: index === 0 ? LocationTypes.START_LOCATION : LocationTypes.WAYPOINT_LOCATION,
          latitude: waypoint.location[1],
          longitude: waypoint.location[0]
        }));

        const editedRoutecheckText = transformedData.map((item)=>{
          return `${item.latitude},${item.longitude},${item.waitingTime}`
        }).join(",")
        console.log("waypoint editedRoutecheckText",editedRoutecheckText)
        setEditedRoutecheckText(editedRoutecheckText)


       


        setReOrderWaypoints(transformedData)
      }
    }


  setWaitingForDriverApproval(null)
    
 

  }, []);

  useEffect(() => {
    return () => {
      setIsLoading(false);
    }
  }, [])


  const handleDirectionReady = (data) => {
    setMaxVehicleDistanceLimit(false)
    // Extract distance and duration from direction data
    if(data?.duration){
      let dur = Math.round(data?.duration/60)
      setDuration(dur)
    }
    if(data?.distance){
      setDistance(data?.distance != null ? (data.distance).toFixed(1) : null)

    }

    console.log("driverArrival maxDistanceLimit",maxDistanceLimit,fromDriverArrival)
    
    if (tripStatus=='ACCEPTED' || reachedStops.length > 0) {

      console.log("data distance",data?.distance)
      if(maxDistanceLimit && data?.distance){
        // Check if the new distance exceeds the max distance limit
        const distanceInKm = data.distance ;
        if (distanceInKm > maxDistanceLimit) {
          Alert.alert(
            t('distance_limit_exceeded') || 'Distance Limit Exceeded',
            t('edited_route_exceeds_max_distance', { maxDistance: maxDistanceLimit }) || `The edited route exceeds the maximum allowed distance of ${maxDistanceLimit} km. Please adjust your stops.`
          );
          setMaxVehicleDistanceLimit(true)
          setEnableConfirmButton(false);
          return;
        }
      }
    }

    
}

  // useEffect(() => {
  // setDirectionReady(handleDirectionReady)
  // }, [])

  const hasNearbyDuplicateStops = (points, thresholdMeters = 100) => {
    const coords = (points || [])
      .map(p => {
        const lat = (p && p.latitude != null) ? p.latitude : (Array.isArray(p?.location) ? p.location[1] : undefined);
        const lon = (p && p.longitude != null) ? p.longitude : (Array.isArray(p?.location) ? p.location[0] : undefined);
        return (typeof lat === 'number' && typeof lon === 'number') ? { lat, lon } : null;
      })
      .filter(Boolean);
    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        const d = utils.calculateDistanceInMeters(coords[i].lat, coords[i].lon, coords[j].lat, coords[j].lon);
        if (d <= thresholdMeters) return true;
      }
    }
    return false;
  };

  const waypointRoute =async ()=>{
      if (isWaypointsReady()) {
      const result = await transformWaypointsToDirectionPoints({
        clearMarkers: true,
        vehicleType: 'car',
        padding: [50, height*0.4, 50, 100]
      });
      console.log("waypointRoute result",result)
      
      if (result.success) {
        handleDirectionReady(result);
        console.log('Waypoint direction points set successfully:', result.waypointCount, 'waypoints');
      } else {
        console.log('Failed to set waypoint direction points:', result.error);
      }
    }
  }


  // Transform waypoints to direction points when waypoints are ready
  useEffect(() => {
  
    waypointRoute();
    // Cleanup: set direction points and reorder waypoints to null when component unmounts
    return () => {
      setDirectionPoints(null);
      
    };
  }, [transformWaypointsToDirectionPoints, isWaypointsReady, setDirectionPoints, setReOrderWaypoints]);

  // These functions are now handled by the WaypointContainer component
  // which uses the store directly

  const onConfirmRoute = () => {

    firebaselog_ridePlanning('RP_Stop(RP_S)', `RP_S:stop_added`);
    
    
    if (reOrderWaypoints && reOrderWaypoints.length > 0) {
      // First index becomes start location
      const newStartLocation = reOrderWaypoints[0];
      newStartLocation.type = LocationTypes.START_LOCATION
      
      // Last index becomes end location
      const newEndLocation = reOrderWaypoints[reOrderWaypoints.length - 1];
      newEndLocation.type = LocationTypes.DESTINATION_LOCATION
      // Middle items become waypoints (excluding first and last)
      const newWayPoints = reOrderWaypoints.slice(1, reOrderWaypoints.length - 1);
      newWayPoints.map(waypoint => {
        waypoint.type = LocationTypes.WAYPOINT_LOCATION
        return waypoint
      })
      // Update the ride booking location store
      setRideStartLocation(newStartLocation);
      setRideEndLocation(newEndLocation);
      setRideWayPoints(newWayPoints);
      
      
    }

   
    
    // Reset reorder waypoints and go back
    setReOrderWaypoints([]);
    // goBack();
    goBackToScreen('BookRideScreen',{
      DurationFromAddStopsScreen:duration,
      DistanceFromAddStopsScreen:distance,
    })
  }

  const onRetryFetchRoute = () => {
    try {
       setDirectionPoints(null);
       waypointRoute();
      
    } catch (e) {
      // swallow; RouteStatusOverlay will keep showing error until next attempt
    }
  };


  const getFare =async()=>{

  if(!distance && !duration){
   return 0
  }

   let TotalwaitingTime = 0

  const newWayPoints = [...reachedStops,...reOrderWaypoints]

  newWayPoints.map((item)=>{
    if(item === newWayPoints[0] || item === newWayPoints[newWayPoints.length - 1]){
      TotalwaitingTime += 0
    }else{
      TotalwaitingTime += item.waitingTime
    }
   })

   const Payload = {
    tripId:tripId,
    distance,
    duration,
    waitingTime:TotalwaitingTime,
   }

   

   setIsFareLoading(true)
   try {
    console.log("Payload",Payload)
     const res = await getPreFinalFare(Payload)

     console.log("res",res)
   
     
     if (res && res.fare) {
       setFareData({
         distance,
         duration,
         fare: res.fare.fare || 0,
         waitingTime: TotalwaitingTime
       });
       setShowFareModal(true);
     }
   } catch (error) {
     console.error("Error getting fare:", error);
   } finally {
     setIsFareLoading(false);
   }

  }

  const handleFareConfirm = () => {
    ConformEditedRoute();
  };

  const handleFareClose = () => {
    setShowFareModal(false);
  };

   
   
  
  



  const ConformEditedRoute = async() => {
    setIsLoading(true);
    const filterKeys = (obj) => {
      const rest = { ...obj };
      delete rest.latitude;
      delete rest.longitude;
      delete rest.type;
      delete rest.locationFrom;
      delete rest.id;
      delete rest.placeName;
      return rest;
    };

    console.log("reOrderWaypoints",reOrderWaypoints)

    const updatedBalanceStops = reOrderWaypoints.map(item => ({
      ...filterKeys(item),
      address: utils.getFormatedHeader(item),
      location: item.location ? item.location : [item.longitude, item.latitude],
      isReached: item?.isReached || false,
      waitingTime: item?.waitingTime || 0,
    }));

    console.log("updatedBalanceStops",updatedBalanceStops)

    const updatedRideWayPoints = [
      ...reachedStops.map(item => ({
        ...filterKeys(item),
        address: item.address,
        location: item.location ? item.location : [item.longitude, item.latitude],
        isReached: item?.isReached || false,
        waitingTime: item?.waitingTime || 0,
      })),
      ...updatedBalanceStops
    ];

    const finalWaypoints = updatedRideWayPoints.map((item, index) => {
      let name;
      let waitingTime;
      if (index === 0) {
        name = 'Pickup point';
        waitingTime = 0
      } else if (index === updatedRideWayPoints.length - 1) {
        name = 'Drop point'
        waitingTime = 0
      } else {
        name = `Stop ${index}`;
        waitingTime = item.waitingTime
      }
     
      return {
        ...item,
        name,
        waitingTime
      };
    });

    
    const routeData = {
      request: currentRouteData?.requests || null,
      response: currentRouteData?.response || null
    }

    

    const finalPayload = {
      tripId:tripId,
      distance,
      duration,
      stops:finalWaypoints,
      fare:fareData.fare,
      routeData:routeData
    }
    

    const res = await passangerStopChangeRequest(finalPayload)

   if(res && res.success){
    goBack();
    setWaitingForDriverApproval('PENDING')
    firebaselog_onRide('OR_Edit(OR_E)','OR_E:stops_change')
    setOnGoingRideStops(null)
    setReOrderWaypoints([])
    setReachedStops([])
   }
   setIsLoading(false);
  }

  return (
    <>
      <View style={styles.topContainer}>
        
      {distance ? <Text style={styles.distanceText}>{distance} Km</Text> : null}
      <NavBar onBackPress={onBackPress} title={t('add_stops')} />
          <WaypointContainer  setEnableConfirmButton={setEnableConfirmButton} editedRoutecheckText={editedRoutecheckText} fromDriverArrival={fromDriverArrival}/>
        
          { maxVehicleDistanceLimit && <Text style={{color: 'red',padding: 10,textAlign: 'center'}}>{t('max_vehicle_distance_limit_exceeded')}</Text> }
          
      </View>
      {/* Route status overlay positioned below topContainer */}
     
      
        
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled,!enableConfirmButton && styles.confirmButtonDisabled, routeLoading?.loading && styles.confirmButtonDisabled]}
          disabled={isLoading || !enableConfirmButton || routeLoading?.loading}
          onPress={async () => {
            // Validate that no stops are within 100m of each other
            // Vibration.vibrate(100);
            const pointsToValidate = onGoingRideStops ? [...reachedStops, ...reOrderWaypoints] : reOrderWaypoints;
            // if (hasNearbyDuplicateStops(pointsToValidate, 100)) {
            //   Alert.alert(t('invalid_stops') || 'Invalid stops', t('stops_too_close') || 'Two stops are within 100 meters. Please adjust your stops.');
            //   return;
            // }

            setIsLoading(true);

            if (onGoingRideStops) {
              await getFare();
              setIsLoading(false);
            } else {
              onConfirmRoute();
            }
            setEditedRoutecheckText("")
          }}
        >
        {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.confirmButtonText]}>
              {onGoingRideStops ? t('confirm_edited_route'): t('confirm_route')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <FareDetailsModal
        visible={showFareModal}
        onConfirm={handleFareConfirm}
        onClose={handleFareClose}
        fareData={fareData}
        isLoading={isFareLoading}
        driverWaitingApproval={waitingForDriverApproval}
        loading={isLoading}
      />
       <RouteStatusOverlay
        loading={!!routeLoading?.loading}
        error={routeLoading?.error}
        onRetry={onRetryFetchRoute}
        top={height * 0.55} // Adjust top position based on NavBar height
        left={10}
        right={10}
        bottom={0}
        onBack={onBackPress}
      />

    </>
  );
};

const styles = StyleSheet.create({
  topContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 5,
    backgroundColor:"white",
    borderBottomLeftRadius:20,
    borderBottomRightRadius:20,
    elevation:5,
   
  },
  distanceText: {
    position: 'absolute',
    top: 15,
    right: 30,
    fontSize: 14,
    fontWeight: 'medium',
    paddingRight: 10,
    color: '#0f223c'
  },
  content: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom:15,
    
    marginHorizontal: 10,
    borderRadius:12,

    backgroundColor: 'white',
  },
  confirmButton: {
    backgroundColor: '#0f223c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#0f223c'+'90',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
   
    fontFamily: Fonts.medium,
  },
  confirmButtonDisabledText:{
    color:colors.grey_dark
  }
});

export default WaypointScreen;
