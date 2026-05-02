import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import NavBar from '../../../components/NavBar';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import MapIcon from '../../../components/Map/MapIcon';
import CurrentLocationIcon from "../../../assets/icons/CurrentLocationIcon.svg"
import AddStopIcon from "../../../assets/icons/AddStopIcon.svg"
import { height, width } from '../../../utils/Utils';
import { colors, Fonts } from '../../../constants/constants';
import useRideBookingInfo from '../store/useRideBookingInfo';
import useDirectionLoad from '../hooks/useDirectionLoad';
import useMapStore from '../../map/store/useMapStore';
import useBookTrip from '../hooks/useBookTrip';
// Import the ride estimation mutation
// import { VEHICLE_LABELS } from '../../../constants/VehicleLabels';
import { getRideEstimation } from '../../../API/EndPoints/EndPoints';
import RideInfo from '../components/bookRide/RideInfo';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Schdule from '../../../assets/image/svgIcons/schdule.svg';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import Marker from '../../../controllers/NEMap/Marker';
import { utils } from '../../../utils/Utils';


import AnimatedBottomSheetWrapper from '../../shared/component/AnimatedBottomSheetWrapper';
import PaymentType from '../components/bookRide/PaymentType';
import VehicleList from '../components/bookRide/VehicleList';
import DriverNotFoundModal from '../components/bookRide/DriverNotFoundModal';
import useRideVehicleStore from '../store/useRideVehicleStore'; 
import vehicleType from '../types/vehicleType.json'
import RidePreference from '../components/bookRide/RidePreference';
import CouponContainer from '../components/bookRide/CouponConatiner';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import { preferenceShowRideStatus } from '../../../storage/userLocalStorage';
import useRideBookingLocationStore from '../store/useRideBookingLocationStore';
import ScrollHintChevron from '../../../components/Common/ScrollHintChevron';
import { useDebouncedAPICall } from '../../../hooks/useDebounce';
import RouteStatusOverlay from '../../../components/Loaders/RouteStatusOverlay';
import useConfigStore from '../../../store/useConfigStore';
// import useRideSelectionStore from '../../../store/useRideSelectionStore';
import PropTypes from 'prop-types';
import { buildKey as buildEstimationCacheKey, getFromCache as getEstimationFromCache, setInCache as setEstimationInCache, prune as pruneEstimationCache } from '../store/useEstimationCacheStore';
import { showNotification } from '../../../components/NotificationManger';
import { openFeedback } from '../../../utils/feedback';
import useNearbyDrivers from '../../../store/useNearByDrivers';
import useRideMatchStore from '../../rideStatus/store/useRideMatchStore';

const BottomSheetHeader = (rideDistance,estimatedDuration,setShowPreference) => {
    const {setStackScreen} = useStackScreenStore()
    const {rideStartLocation,rideEndLocation,rideWayPoints} = useRideBookingLocationStore()
    const {setMapBounds} = useMapStore()
    // const {availableVehicles} = useRideVehicleStore()
    
    const handleAddStop = () => {
       
        setStackScreen('WaypointScreen',{})
    }
    const handleCurrentLocation = async () => {
        const coords = [[rideStartLocation.longitude,rideStartLocation.latitude],[rideEndLocation.longitude,rideEndLocation.latitude],...rideWayPoints.map(waypoint => [waypoint.longitude,waypoint.latitude])]
        const bounds = utils.getBoundingBox(coords)
        const margin = [50, 100, 50,height*0.65]
        const finalBounds = [bounds, margin]
        setMapBounds(finalBounds);
    }
    return (
        <View style={styles.bottomSheetHeaderContainer}>
        <View style={styles.bottomSheetHeader}>
            <MapIcon />

            <View style={styles.mapActionContainer}>
            <TouchableOpacity style={styles.currentLocationIconContainer} onPress={handleCurrentLocation}>
                <CurrentLocationIcon width={25} height={25} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.currentLocationIconContainer} onPress={handleAddStop}>
                <AddStopIcon width={25} height={25} />
            </TouchableOpacity>
            </View>
        </View>
        {/* <View style={styles.handle}></View> */}
        <RideInfo distance={rideDistance} duration={estimatedDuration} showPreference={setShowPreference}/>
      
        </View>
    )
}


const BookRideScreen = ({DurationFromAddStopsScreen = null,DistanceFromAddStopsScreen = null,RideMatchDriverNotFound=false}) => {
    const { t } = useTranslation();
    
    const {goBack,goBackToScreen} = useStackScreenStore()
    const {paymentType,setPaymentType, rideDistance,estimatedDuration,couponCode,setRegionOfficeId,setRegionOfficeCode, updateBookingInfo,scheduleDateTime} = useRideBookingInfo()
    const [isPaymentTypeOpen, setIsPaymentTypeOpen] = useState(false)
    const {isPreferenceShow,setIsPreferenceShow} = useUserInfoStore()
    const {setAvailableVehicles,availableVehicles,setSelectedVehicle,selectedVehicle} = useRideVehicleStore()
    const [showPreference,setShowPreference] = useState(false)
    const {setDriverFetchInProgress, driverFetchInProgress} = useNearbyDrivers();
    const [,setScrolledUntillBottom] = useState(false)
    const [bottomSheetHeight,setBottomSheetHeight] = useState(370)
    const [isEstimationError, setIsEstimationError] = useState(false)
    
    const { 
        transformRideLocationsToDirectionPoints, 
        isRideLocationsReady,
        rideStartLocation,
        rideEndLocation,
        rideWayPoints
    } = useDirectionLoad();
      const {setDriverMatched} = useRideMatchStore();



    

    const { setDirectionReady,routeLoading , routeRetryCount, setRouteRetryCount,setRouteLoading} = useMapStore()     


    // Use the booking hook for trip booking
    const {
        bookTrip,
        isLoading: isBookingLoading,
        isBookingReady,
        getBookingValidationErrors,
        getCurrentBookingPayload
    } = useBookTrip();
    // const { start } = useNearbyPollingControl();
    // const { drivers } = useNearbyDriversStore();
    // const { setMapMarkers,mapMarkers } = useMapStore();
    // const { selectedVehicle } = useRideVehicleStore();

    const [showCoupon,setShowCoupon] = useState(false)
    const [isEstimationLoading, setIsEstimationLoading] = useState(false)
    const [isLongLoad, setIsLongLoad] = useState(false)
    const longLoadTimerRef = useRef(null)
    const [showDriverNotFoundModal, setShowDriverNotFoundModal] = useState(!!RideMatchDriverNotFound)
    const [modalOverrides, setModalOverrides] = useState(null)
    const [showMaxDistanceExceededModal, setShowMaxDistanceExceededModal] = useState(false)
    const [isNotServingArea, setIsNotServingArea] = useState(false)
    // Booking info retry/error modal state
    const [showBookingInfoErrorModal, setShowBookingInfoErrorModal] = useState(false)
    const bookingInfoAttemptsRef = useRef(0)
    const bookingInfoTimerRef = useRef(null)
    const { appConfig } = useConfigStore();

    useEffect(() => {
       DirectionRoute();
    setDriverMatched(false) // reset driver matched state when booking screen mounts
    }, []);


    const onRetryFetchRoute = () => {  
        DirectionRoute(); 
    }



    // useEffect(()=>{
    //     if(AppConfig.SHOW_NEARBY_DRIVER){
    //         start();
    //     }
    // },[])


    // useEffect(()=>{
    //     if(drivers?.length > 0 && AppConfig.SHOW_NEARBY_DRIVER){

    //         const exisitingMarkers = mapMarkers.filter((marker)=>marker.name != 'driver-marker')
            
    //       const markers = drivers.filter((driver)=>driver.vehicleType == selectedVehicle?.type).map((driver)=>{
    
    //         const marker = new Marker(
    //           driver.id || 'driver-marker',
    //           'driver-marker',
    //           driver.lon,
    //           driver.lat,
    //           driver.vehicleType.toLowerCase(),
    //           48,
    //           false,
    //           driver.bearing || 0
    //         );
    //         return marker
    //       })
    //       if(markers.length > 0){
    //         setMapMarkers([...exisitingMarkers, ...markers])
    //       }
    //     }
    
    //     return ()=>{
    //       setMapMarkers([])
    //     }
    //   },[drivers])

  
    

    const handleDirectionReady = (data) => {
       
        if (data?.distance && data?.duration) {
            
            const distanceKm = Number(data.distance) ; 
            const durationMin = Number(data.duration)/ 60 ;

            const minDistanceKm = appConfig.MIN_TRIP_DISTANCE_METER ? appConfig.MIN_TRIP_DISTANCE_METER / 1000 : 0;
   

            if (Number.isFinite(distanceKm) && distanceKm <= minDistanceKm) {
                setModalOverrides({
                    title: t('trip_distance_too_short_title') || 'Invalid Trip Distance',
                    message:
                        t('trip_distance_too_short', { minDistance: appConfig.MIN_TRIP_DISTANCE_METER }) ||
                        `The trip distance is too short. Minimum allowed distance is ${appConfig.MIN_TRIP_DISTANCE_METER} meters.`,
                    ctaLabel: t('edit_places_button', 'Edit Places'),
                    onPrimaryAction: handleBackPress,
                    type: 'min_distance'
                })
                setShowDriverNotFoundModal(true)
                return;
            }   
            updateBookingInfo({
                rideDistance: Number.isFinite(distanceKm) ? distanceKm.toFixed(1) : null,
                estimatedDuration: Number.isFinite(durationMin) ? Math.max(1, Math.round(durationMin)) : 1
            });
            
        }
    }

    useEffect(() => {
        // setDirectionReady(handleDirectionReady)
        // if(DurationFromAddStopsScreen && DistanceFromAddStopsScreen){
            // updateBookingInfo({
            //     rideDistance: DistanceFromAddStopsScreen,
            //     estimatedDuration: DurationFromAddStopsScreen || 1
            // });
        // }
   
   
        return ()=>{
            setAvailableVehicles([])
        }
    }, [])

    useEffect(() => {
        if (RideMatchDriverNotFound) {
            setShowDriverNotFoundModal(true)
        }
    }, [RideMatchDriverNotFound])




    
    
    const transformEstimateDatStore=(data,rideDistances)=>{
        
        const distanceNum = rideDistances != null ? Number(rideDistances) : null;
        
      
        if(utils.isEmptyObject(data)){
            setIsNotServingArea(true)
            setAvailableVehicles([])
            setIsEstimationLoading(false)
            setIsEstimationError(true)
            
            return;
        }

        
        const vehicleList = vehicleType.reduce((acc, spec, index) => {
            const rideTypeData = data?.[spec.type];
            if (!rideTypeData) return acc;
            const minFareNumber = Number(rideTypeData.minFare);
            const maxFareNumber = Number(rideTypeData.maxFare);
            acc.push({
                id: index,
                type: spec.type,
                capacity: spec.capacity,
                minFare: Number.isFinite(minFareNumber) ? minFareNumber : null,
                maxFare: Number.isFinite(maxFareNumber) ? maxFareNumber : null,
                currency: rideTypeData.currency,
                estimatedDuration: rideTypeData.estimatedDuration ?? spec.estimatedDuration,
                maxDistanceLimit: rideTypeData.maxDistanceLimit ?? null,
                isExceedingMaxDistance: distanceNum != null && rideTypeData.maxDistanceLimit ? rideTypeData.maxDistanceLimit < distanceNum : false,
            });
            return acc;
        }, [])

        

        const withinLimit = vehicleList.filter(v => !v.isExceedingMaxDistance);
        const exceedingLimit = vehicleList.filter(v => v.isExceedingMaxDistance);
        const sortedVehicleList = [...withinLimit, ...exceedingLimit];
      
        if (selectedVehicle && selectedVehicle?.vehicleType) {
            const currentlyselected = vehicleList.find(v => v.type === selectedVehicle.vehicleType);
            if (currentlyselected) {
                const selected = selectedVehicle;
                selected['minFare'] = currentlyselected?.minFare || null;
                selected['maxFare'] = currentlyselected?.maxFare || null;
                setSelectedVehicle(selected);
               
            }
        }


   

        // Show modal if all vehicles exceed max distance (only when distance is known)
        if (distanceNum != null && withinLimit.length === 0 && exceedingLimit.length > 0) {
            setShowMaxDistanceExceededModal(true)
        } else {
            setShowMaxDistanceExceededModal(false)
        }

        useRideVehicleStore.setState({
            availableVehicles: sortedVehicleList,
           
        })
        
    }



    // Ride estimation mutation
    const onEstimationSuccess = (data) => {
        if (data?.result?.success) {
            setIsEstimationError(false)
            // Handle successful estimation
            if(data?.regionCode){
                setRegionOfficeCode(data?.regionCode)
            }
            if(data?.regionOfficeId){
                setRegionOfficeId(data?.regionOfficeId)
            }
            transformEstimateDatStore(data?.result?.data?.fareRanges, data?.result?.data?.distance);
                   
        } else {
            showNotification(t('ride_estimation_title'), data?.message || t('failed_to_get_fare_estimation'), 'danger');
            setIsEstimationError(true)
            // setBottomSheetHeight(350)
            useRideVehicleStore.setState({
                availableVehicles: [],
                selectedVehicle: null,
            })
        }
    };

    const estimationInFlightRef = useRef(false);

    const estimationCaller = useCallback(async (payload,cacheKey) => {
        if (estimationInFlightRef.current) return;
        estimationInFlightRef.current = true;
        try {
            setIsEstimationLoading(true)
            setIsEstimationError(false)
            // start long-load timer (e.g., 12s)
            if (longLoadTimerRef.current) {
                clearTimeout(longLoadTimerRef.current)
            }
            longLoadTimerRef.current = setTimeout(() => {
                // if still loading with no vehicles, mark as long load
                setIsLongLoad(true)
            }, 12000)
            const data = await getRideEstimation(payload);
            
            // Save to cache on success
            if (cacheKey && data?.result?.success) {
                setEstimationInCache(cacheKey, data);

            }
            onEstimationSuccess(data);
        } catch (error) {
            showNotification(
                t('ride_estimation_title'),
                t('request_failed'),
                'danger'
            );
            setIsEstimationError(true)
            // setBottomSheetHeight(350)
            useRideVehicleStore.setState({
                availableVehicles: [],
                selectedVehicle: null,
            })
        } finally {
            estimationInFlightRef.current = false;
            setIsEstimationLoading(false)
            if (longLoadTimerRef.current) {
                clearTimeout(longLoadTimerRef.current)
                longLoadTimerRef.current = null
            }
        }
    }, []);

    const debouncedGetRideEstimation = useDebouncedAPICall(estimationCaller, 500);

    useEffect(() => {
        return () => {
            if (debouncedGetRideEstimation && debouncedGetRideEstimation.cancel) {
                debouncedGetRideEstimation.cancel();
            }
        }
    }, []);

    const getEstimatedFare = async () => {
        setDriverFetchInProgress(true);
    
        const cacheKey = buildEstimationCacheKey({
            start: rideStartLocation,
            end: rideEndLocation,
            waypoints: rideWayPoints,
        });

        // Prune old entries and try cache first
        pruneEstimationCache();
        const cached = getEstimationFromCache(cacheKey);
        if (cached) {
          
            onEstimationSuccess(cached);
            return;
        }

        const payload = {
            distance: rideDistance,
            duration: estimatedDuration,
           coordinates: [
        rideStartLocation.longitude, 
        rideStartLocation.latitude
    ],
        };

        setIsLongLoad(false)
        debouncedGetRideEstimation(payload,cacheKey);
    };
    // Add effect to trigger estimation when direction data is available
    useEffect(() => {
        if (rideDistance && estimatedDuration ) {
            getEstimatedFare();
        }
    }, [rideDistance, estimatedDuration]);

    // // Retry and reinitialize logic
    // const handleRetryInitialize = async () => {
    //     try {
    //         setIsLongLoad(false)
    //         setIsEstimationError(false)
    //         setAvailableVehicles([])
          
    //         // re-transform direction points to ensure map/distance refresh
    //         if (isRideLocationsReady()) {
    //             const res = await  transformRideLocationsToDirectionPoints({
    //                 clearMarkers: true,
    //                 vehicleType: 'motorcycle',
    //                 padding: [50, 50, 50, height*0.5]
    //             })

    //             console.log("Retry transformRideLocationsToDirectionPoints result", res)
    //         }
    //         // re-trigger estimation if we have distance/duration
    //         if (rideDistance && estimatedDuration) {
    //             getEstimatedFare()
    //         }
    //     } catch(e) {
    //         // no-op
    //     }
    // }


    


    const { setDirectionPoints,directionPoints } = useMapStore();

    const DirectionRoute = async () =>{
            console.log("DirectionRoute called")
            const result = await transformRideLocationsToDirectionPoints({
                clearMarkers: true,
                vehicleType: 'car',
                padding:  [50, 50, 50, height*0.5]
            });
            
            if (result.success) {
                console.log("DirectionRoute success")
                handleDirectionReady(result)
                console.log("setting direction points")
            } else {
                console.log("DirectionRoute failed", result)
            }
        
    }

    
    

    // Cleanup effect to clear direction points when component unmounts
    useEffect(() => {
        
        
        return () => {
            
            setDirectionPoints(null);
            updateBookingInfo({ rideDistance: null, estimatedDuration: null })
        };
    }, [setDirectionPoints]);


    useEffect(() => {
        if(!isPreferenceShow){
            preferenceShowRideStatus("true")
            setIsPreferenceShow(true)
            setShowPreference(true)
        }
    }, [])

    
    const handlePaymentType = () => {
        setIsPaymentTypeOpen(true)        
    }
    const handlePaymentSelect = (paymentType) => {
        setPaymentType(paymentType)
        setIsPaymentTypeOpen(false)
    }

    const handleConfirmRide = async () => {
        try {
          
            if (!isBookingReady()) {
                const errors = getBookingValidationErrors();
                console.log('Booking validation errors:', errors);
                return;
            }

            const payload = getCurrentBookingPayload();
    

            await bookTrip();
            
        } catch (error) {
            console.error('Booking failed:', error);
        }
    }

   

const handleBackPress = () => {
    setIsNotServingArea(false)
    setShowDriverNotFoundModal(false)
    setShowMaxDistanceExceededModal(false)
    updateBookingInfo({ rideDistance: null, estimatedDuration: null })
    goBack()
}



const handleCouponPress = () => {
    setShowCoupon(true)
}
const handleChangeScheduleTime=()=>{

    goBackToScreen('PlanRideScreen',{showScheduleTime:true})


}

const handleServiceAreaModalClose = () => {
     setShowMaxDistanceExceededModal(false);
                                    try {
                                        goBackToScreen('PlanRideScreen', { focusEditPlaces: true });
                                    } catch (e) {
                                        goBack();
                                    }
}

const handleRetryInitialize = async () => {
    // DirectionRoute();

     if (rideDistance && estimatedDuration ) {
            getEstimatedFare();
        }
}


const scheduleDate = scheduleDateTime?.date ? utils.formatDate(scheduleDateTime?.date, 'ddd DD MMM YYYY') : ""
const scheduleTime = scheduleDateTime?.time ? utils.timestampTo12HourFormat(scheduleDateTime?.time) : ""

  return (
    <>
   <View>
    <NavBar elevation={true} onBackPress={handleBackPress} feedbackIcon={true} onrightIconPress={() => {
      try {
        const startName = rideStartLocation;
        const endName = rideEndLocation ;
        const distanceKm = rideDistance != null ? String(rideDistance) : '';
        const pickupCoords = rideStartLocation && rideStartLocation.latitude != null && rideStartLocation.longitude != null
          ? `${rideStartLocation.latitude},${rideStartLocation.longitude}` : '';
        const dropCoords = rideEndLocation && rideEndLocation.latitude != null && rideEndLocation.longitude != null
          ? `${rideEndLocation.latitude},${rideEndLocation.longitude}` : '';
        openFeedback({
          screenName: 'BookRideScreen',
          initialValues: {
            tripStartName: startName,
            tripEndName: endName,
            tripDistanceKm: distanceKm,
            pickupCoords,
            dropCoords,
          },
        });
      } catch (e) {
        // no-op
      }
    }} />
    {!!scheduleDate && <View style={styles.ScheduleOption}>
            <Schdule />
            <AdaptiveText style={styles.rideSelectionTxt}>{scheduleDate && scheduleDate + " - " + scheduleTime}
            </AdaptiveText>
           <TouchableOpacity 
            onPress={handleChangeScheduleTime}
            style={styles.editButton}
            activeOpacity={0.7}
           >
            <Icon name="edit" color="white" size={20} />
            </TouchableOpacity>
       
    </View>
}



   </View>
   <BottomSheetWrapper
        snapPoints={[bottomSheetHeight]}
        index={0}
        enablePanDownToClose={false}
        enableOverDrag={true}
        enableScroll={true}
        handleComponent={()=>BottomSheetHeader(rideDistance,estimatedDuration,setShowPreference)}
        handleIndicatorStyle={{
          backgroundColor: '#DEDEDE',
          width: 50,
          height: 4,
        }}
      
   >
    {/* <BottomSheetHeader /> */}
 
      
    
   
      <VehicleList  availableVehicles={availableVehicles} isLoading={isEstimationLoading} isEstimationError={isEstimationError} setScrolledUntillBottom={setScrolledUntillBottom} distance={rideDistance}/>
      { (isLongLoad || (isEstimationError && availableVehicles?.length === 0)) && (
        <View style={{paddingHorizontal:16}}>
            <View style={{
                borderWidth:1,
                borderColor:'#E0E0E0',
                backgroundColor:'#FFF',
                borderRadius:12,
                padding:12,
                alignItems:'center',
                justifyContent:'center'
            }}>
                <AdaptiveText style={{fontFamily:Fonts.regular, fontSize:14, color:colors.black, textAlign:'center'}}>
                    {isLongLoad ? t('taking_long_time','It’s taking longer than expected to load fares.') : t('failed_to_get_fare_estimation','Failed to get fare estimation.')}
                </AdaptiveText>
                <TouchableOpacity onPress={handleRetryInitialize} activeOpacity={0.85} style={{marginTop:10, backgroundColor:colors.black, borderRadius:8, paddingVertical:10, paddingHorizontal:16}}>
                    <AdaptiveText style={{fontFamily:Fonts.semi_bold, fontSize:14, color:colors.white}}>{t('retry','Retry')}</AdaptiveText>
                </TouchableOpacity>
            </View>
        </View>
      )}
      <View style={{height:100}}/>
           

   </BottomSheetWrapper>
 
          <View style={styles.bottomContainer}>
         { availableVehicles?.length >3 && <ScrollHintChevron direction='down' style={{ top: -30, alignSelf: 'center' }} />}
              <TouchableOpacity style={styles.CouponContainer } onPress={handleCouponPress}>
                 {!couponCode ? (
                   <>
                     <FontAwesome6 name="percent" size={20} color={colors.black} />
                     <AdaptiveText style={styles.CouponText}>{t('offer_coupons')}</AdaptiveText>
                     <Icon name="chevron-right" size={20} color="#888" />
                   </>
                 ) : (
                   <>
                    <FontAwesome6 name="percent" size={16} color={colors.grey_dark} />
                     <AdaptiveText >{t('coupon')}</AdaptiveText>
                     <AdaptiveText style={[styles.CouponText, {fontFamily:Fonts.semi_bold}]}>{couponCode}</AdaptiveText>
                     <AdaptiveText>{t('applied')}</AdaptiveText>
                   </>
                 )}

              </TouchableOpacity>
              <View style={[styles.BookingButtonContainer, {backgroundColor: availableVehicles?.length === 0 ? colors.grey_xxdark : colors.black}]}>
             
                  <TouchableOpacity style={styles.BookingPaymentContainer} onPress={handlePaymentType}>
                      <View style={styles.BookingPaymentHeader}>
                          <AdaptiveText style={styles.BookingPaymentHeaderText}>{t('pay_by')}</AdaptiveText>
                          <View style={styles.BookingPaymentMode}>
                              <AdaptiveText style={styles.BookingPaymentModeText}>{paymentType}</AdaptiveText>
                              <Icon name="arrow-drop-down" color={colors.white} style={{ fontSize: 20 }}></Icon>
                          </View>
                      </View>
                  </TouchableOpacity>

                    <View style={styles.BookingButtonSection}>
                      <TouchableOpacity
                          style={[styles.BookingButton, availableVehicles?.length === 0 && styles.BookingButtonDisabled,selectedVehicle == null && styles.BookingButtonDisabled, driverFetchInProgress && styles.BookingButtonDisabled, routeLoading?.loading && styles.BookingButtonDisabled,isBookingLoading && {backgroundColor:colors.orange}]}
                          onPress={availableVehicles?.length === 0 ? null : handleConfirmRide}
                          disabled={isBookingLoading || availableVehicles?.length === 0 || routeLoading?.loading || selectedVehicle == null || driverFetchInProgress}
                      >
                          <AdaptiveText style={styles.BookingButtonText}>
                              {isBookingLoading ? t('booking') : t('confirm_ride')}
                          </AdaptiveText>
                      </TouchableOpacity>
                    </View>
              </View>
          </View>

          <RouteStatusOverlay
        loading={!!routeLoading?.loading}
        error={routeLoading?.error}
        onBack={handleBackPress}
        onRetry={onRetryFetchRoute}
        top={height * 0.25} // Adjust top position based on NavBar height
    
      />

        { isPaymentTypeOpen  && (
          <AnimatedBottomSheetWrapper onClose={()=>setIsPaymentTypeOpen(false)} zIndex={100000}>
            <PaymentType onSelect={handlePaymentSelect} initialValue={paymentType} />
          </AnimatedBottomSheetWrapper>
        )}

        {
            showPreference && (
                <AnimatedBottomSheetWrapper onClose={()=>setShowPreference(false)} zIndex={100000}>
                    <RidePreference  />
                </AnimatedBottomSheetWrapper>
            )
        }

        {
            showCoupon && 
            (
            <AnimatedBottomSheetWrapper onClose={()=>setShowCoupon(false)} zIndex={100000}>
                    <CouponContainer />
            </AnimatedBottomSheetWrapper>
            )
        }

        <DriverNotFoundModal
            visible={showDriverNotFoundModal}
            onClose={() => {
                setShowDriverNotFoundModal(false)
                if (modalOverrides) {
                    setModalOverrides(null)
                    handleBackPress()
                }
            }}
            title={modalOverrides?.title}
            message={modalOverrides?.message}
            ctaLabel={modalOverrides?.ctaLabel}
            onPrimaryAction={modalOverrides?.onPrimaryAction}
            type={modalOverrides?.type|| null}
        />
        { (showMaxDistanceExceededModal || isNotServingArea) && (
            <Modal
                animationType="fade"
                transparent
                visible
                statusBarTranslucent={true}
                onRequestClose={handleServiceAreaModalClose}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalView, styles.modernModalView]}>
                        <View style={styles.modalIconContainer}>
                            <Icon name="warning" size={28} color={colors.orange} />
                        </View>
                        <AdaptiveText style={[styles.modalTitle, styles.modalTitleModern]}>
                           {isNotServingArea ? t('not_serving_area_title', 'Service Not Available in This Area') : t('distance_exceeded_title', 'Trip Distance Too Long')}
                        </AdaptiveText>
                        <AdaptiveText style={[styles.modalMessage, styles.modalMessageModern]}>
                            {isNotServingArea ? t('not_serving_area_message', 'We are currently not serving this area. Please choose a different location.') : t('distance_exceeded_message', 'All available vehicles exceed their maximum trip distance for this route. Please choose different pickup and drop locations.')}
                        </AdaptiveText>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.primaryActionButton]}
                                onPress={() => {
                                    setShowMaxDistanceExceededModal(false);
                                    try {
                                        goBackToScreen('PlanRideScreen', { focusEditPlaces: true });
                                    } catch (e) {
                                        goBack();
                                    }
                                }}
                                activeOpacity={0.85}
                            >
                                <Icon name="edit" size={18} color={colors.white} />
                                <AdaptiveText style={[styles.modalButtonText, styles.primaryActionText]}>
                                    {t('edit_places_button', 'Edit Places')}
                                </AdaptiveText>
                            </TouchableOpacity>
                            {/* <TouchableOpacity
                                style={[styles.modalButton, styles.secondaryActionButton]}
                                onPress={() => setShowMaxDistanceExceededModal(false)}
                                activeOpacity={0.85}
                            >
                                <Icon name="close" size={18} color={colors.black} />
                                <AdaptiveText style={[styles.modalButtonText, styles.secondaryActionText]}>
                                    {t('dismiss', 'Dismiss')}
                                </AdaptiveText>
                            </TouchableOpacity> */}
                        </View>
                    </View>
                </View>
            </Modal>
        )}
        {/* { showBookingInfoErrorModal && (
            <Modal
                animationType="fade"
                transparent
                visible
                statusBarTranslucent={true}
                onRequestClose={() => setShowBookingInfoErrorModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalView, styles.modernModalView]}>
                        <View style={styles.modalIconContainer}>
                            <Icon name="error-outline" size={28} color={colors.orange} />
                        </View>
                        <AdaptiveText style={[styles.modalTitle, styles.modalTitleModern]}>
                            {t('booking_info_load_failed_title', 'Failed to Load Ride Info')}
                        </AdaptiveText>
                        <AdaptiveText style={[styles.modalMessage, styles.modalMessageModern]}>
                            {t('booking_info_load_failed_message', 'We could not load distance and duration after multiple attempts. Please retry or adjust locations.')}
                        </AdaptiveText>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.primaryActionButton]}
                                onPress={async () => {
                                    setShowBookingInfoErrorModal(false)
                                    bookingInfoAttemptsRef.current = 0
                                    // Force another attempt immediately
                                    try {
                                        if (isRideLocationsReady()) {
                                            const res = await transformRideLocationsToDirectionPoints({
                                                clearMarkers: true,
                                                vehicleType: 'motorcycle',
                                                padding: [50, 50, 50, height*0.5]
                                            })

                                            console.log("Retry transformRideLocationsToDirectionPoints result", res)
                                        }
                                    } catch (e) {}
                                }}
                                activeOpacity={0.85}
                            >
                                <Icon name="refresh" size={18} color={colors.white} />
                                <AdaptiveText style={[styles.modalButtonText, styles.primaryActionText]}>
                                    {t('retry', 'Retry')}
                                </AdaptiveText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.secondaryActionButton]}
                                onPress={() => setShowBookingInfoErrorModal(false)}
                                activeOpacity={0.85}
                            >
                                <Icon name="close" size={18} color={colors.black} />
                                <AdaptiveText style={[styles.modalButtonText, styles.secondaryActionText]}>
                                    {t('dismiss', 'Dismiss')}
                                </AdaptiveText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        )} */}
   </>
  );
};

BookRideScreen.propTypes = {
  DurationFromAddStopsScreen: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  DistanceFromAddStopsScreen: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  RideMatchDriverNotFound: PropTypes.bool,
};

const styles = StyleSheet.create({
    bottomSheetHeader:{
        position:"absolute",
        
        width:width,
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"flex-end",
        top:-115,
        paddingHorizontal:10,
       
    
    },
    bottomSheetHeaderContainer:{
       paddingHorizontal:10,
       paddingVertical:10,
       
    
    },
    mapActionContainer:{
        flexDirection:"column",
        alignItems:"flex-end",
        justifyContent:"flex-end",
        gap:10,
        paddingBottom:10,
      
       
    },
    bottomSheetContent: {
        paddingHorizontal: 15,
        alignItems: 'center',
    },
    contentContainer: {
        width: '100%',
        flex: 1,
        
       
    },
    bottomSheetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#212121',
    },
    bottomSheetSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    bottomSheetInputContainer: {
        width: '100%',
        height: 100,
        backgroundColor: 'red',
    },
    currentLocationIconContainer: {
        padding:10,
        borderRadius:30,
        backgroundColor:"white",
        elevation:5
    },
    bottomContainer:{
        position:"absolute",
        bottom:0,
        left:0,
        right:0,
        zIndex:100000,
        elevation:10,
        backgroundColor:"white",
        borderTopWidth:1,
        borderColor:'#e0e0e0',
       
    },
    BookingButtonContainer:{
      
        backgroundColor: colors.black,
        width:"100%",
        borderTopLeftRadius:20,
        borderTopRightRadius:20,
        flexDirection:"row",
        padding:10,
       
        elevation:5,
       
    },
    BookingPaymentContainer:{
        width:"30%",
        alignItems:"flex-start",
        justifyContent:"center",
        paddingHorizontal:15
        
    
        
       
    },
    BookingButtonSection:{
        width:"70%",
    },
    BookingButton:{
        width:"100%",
        padding:15,
        backgroundColor:colors.green,
        borderRadius:20,
        borderWidth:1,
        borderColor:"white",
       
    },
    BookingButtonText:{
        color:colors.white,
        fontSize:14,
        fontFamily:Fonts.medium,
        textAlign:"center",
    },
    BookingButtonDisabled:{
        backgroundColor:colors.grey_light,
        opacity:0.7,
    },
    
    BookingPaymentHeaderText:{
        fontSize:12,
        color:colors.white,
        fontFamily:Fonts.regular,
        
    },

   
    BookingPaymentModeText:{
        fontSize:16,
        fontFamily:Fonts.regular,
        color:colors.white,
    },
    BookingPaymentMode:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"center",
        gap:5,
    },
    advanceOptionsContainer:{
        width:"100%",
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth:1,
        borderBottomColor: '#E0E0E0',
        backgroundColor:"red",
        zIndex:100000
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
        paddingHorizontal: 10,
    },
    toggleLabel: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: colors.black,
        marginRight: 10,
    },
    customToggle: {
        width: 40,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    customToggleActive: {
        backgroundColor: '#008d34',
    },
    toggleThumb: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'white',
        position: 'absolute',
        left: 2,
    },
    toggleThumbActive: {
        left: 22,
        },
    CouponContainer:{
        width:"100%",
        paddingHorizontal:15,
        paddingVertical:10,
      
        zIndex:100000,
        justifyContent:"center",
        alignItems:"center",
        flexDirection:"row",
        gap:10,
        backgroundColor:"#fffae2",
        
    },
    CouponText:{
        fontSize:14,
        fontFamily:Fonts.regular,
        color:colors.black,
    },
    ScheduleOption:{
        
        position:"absolute",
        backgroundColor:"black",
        top:10,
        right:15,
        borderRadius:20,
        elevation:5,
        paddingVertical:5,
        paddingHorizontal:10,
        flexDirection:"row",
        gap:5,
        alignItems:"center",
        zIndex:9999


    },
    ScheduleOptionText:{
        backgroundColor:"transperent",
        color:"white"
       
    },
    rideSelectionTxt:{
    color: colors.white,
    fontFamily: Fonts.regular,
    fontSize: 14,
    display: 'flex',
    paddingLeft:5,
    },
    editButton:{
        paddingLeft:10,
        paddingRight:5,
        paddingVertical:5,
    },
    handle:{
        width:"15%",
        alignSelf:"center",
        height:7,
        backgroundColor:colors.grey_light,
        borderRadius:10,
    },
    modalContainer:{
        flex:1,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:'rgba(0,0,0,0.5)'
    },
    modalView:{
        width:'85%',
        backgroundColor:colors.white,
        borderRadius:16,
        padding:20,
        paddingTop:0,
        alignItems:'center',
        elevation:5
    },
    modernModalView:{
        paddingTop:20,
        paddingBottom:24,
    },
    modalIconContainer:{
        width:48,
        height:48,
        borderRadius:24,
        backgroundColor:'#FFF3E0',
        alignItems:'center',
        justifyContent:'center',
        marginTop:10,
        marginBottom:12,
    },
    modalTitle:{
        fontFamily:Fonts.semi_bold,
        fontSize:18,
        color:colors.black,
        marginBottom:8,
        textAlign:'center'
    },
    modalTitleModern:{
        fontSize:20,
    },
    modalMessage:{
        fontFamily:Fonts.regular,
        fontSize:14,
        color:colors.black,
        textAlign:'center',
        marginBottom:16
    },
    modalMessageModern:{
        fontSize:15,
        color:'#4A4A4A',
        marginHorizontal:6,
    },
    modalButton:{
        flexDirection:'row',
        alignItems:'center',
        gap:8,
        borderRadius:10,
        paddingVertical:12,
        paddingHorizontal:16,
        minWidth:140,
        alignSelf:'center'
    },
    primaryActionButton:{
        backgroundColor:colors.black,
    },
    secondaryActionButton:{
        backgroundColor:'#F2F2F2',
        borderWidth:1,
        borderColor:'#E6E6E6',
    },
    modalActions:{
        width:'100%',
        flexDirection:'row',
        justifyContent:'center',
        gap:12,
        marginTop:4,
    },
    modalButtonText:{
        fontFamily:Fonts.semi_bold,
        fontSize:14,
        textAlign:'center'
    },
    primaryActionText:{
        color:colors.white,
    },
    secondaryActionText:{
        color:colors.black,
    },
    vehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop:10,
        borderColor: 'black',
        borderWidth:1,
        borderRadius: 15,
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginBottom: 5,
        backgroundColor: colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,

      
      },
      selectedVehicleCard: {
        borderWidth:1,
        borderColor: '#0f223c',
      
       
      },
      selectedText: {
        color: colors.white,
      },
      vehicleImageContainer: {
        width: 56,
        height: 56,
        marginRight: 14,
        alignItems: 'center',
        justifyContent: 'center',
      },
      vehicleImage: {
        width: 65,
        height: 65,
      },
      vehicleInfoContainer: {
        flex: 1,
        justifyContent: 'center',
      },
      rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop:5
      },
      vehicleNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap:5,
        marginTop:5,
        flex:1
      },
      evContainer: {
        backgroundColor: "green",
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
      },
      evText: {
        fontSize: 12,
        fontFamily:Fonts.medium,
        color: colors.white,
        fontStyle:"italic",
      },
      vehicleNameText: {
        fontSize: 16,
        fontFamily:Fonts.regular,
        color: colors.black,
      },
      vehicleName: {
        fontSize: 16,
        fontFamily:Fonts.regular,
        color: colors.black,
      },
      price: {
        fontSize: 16,
        fontFamily:Fonts.medium,
        color: colors.black,
      },
      timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      timeText: {
        fontSize: 13,
        color: "#757575",
        marginLeft: 4,
        fontFamily:Fonts.regular,
      },
      dot: {
        fontSize: 16,
        color: "#757575",
        marginHorizontal: 6,
        fontFamily:Fonts.bold,
      },
      dropTime: {
        fontSize: 13,
        color: "#757575",
      },
      passengerRow: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      passengerText: {
        fontSize: 13,
        color: "#757575",
        marginLeft: 4,
      },
      confirmButton: {
        backgroundColor: colors.green,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
      },
      confirmButtonText: {
        fontSize: 16,
        fontWeight: Fonts.bold,
        color: colors.white,
      },

});

export default BookRideScreen;
