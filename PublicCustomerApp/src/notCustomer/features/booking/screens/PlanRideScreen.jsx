import {Text, TouchableOpacity, View, StyleSheet, ScrollView, ActivityIndicator, BackHandler, Vibration} from 'react-native';
import React, {useCallback, useState,useEffect} from 'react';
import { useTranslation } from 'react-i18next';
import NavBar from '../../../components/NavBar';
import {useStackScreenStore} from '../../../store/useStackScreenStore';
import {addLocation} from '../../../styles/AddLocationStyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { VEHICLE_TYPE_OPTIONS, VEHICLE_TYPE_ICON } from '../../myVehicles/constants/vehicleData';


import Schdule from '../../../assets/image/svgIcons/schdule.svg';
import DashedLine from '../../../components/Common/DashedLine';

import AnimatedBottomSheetWrapper from '../../shared/component/AnimatedBottomSheetWrapper';
import useRideSelectionStore from '../../../store/useRideSelectionStore';

import TripType from '../components/planride/TripType';
import ScheduleContainer from '../../../screens/SearchLocation/ScheduleContainer';
import { rideType } from '../../../constants/JsonData';
import { height, utils } from '../../../utils/Utils';
import { colors } from '../../../constants/constants';
import Contactsheet from '../components/planride/Contactsheet';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import RideLocationSetBox from '../components/planride/RideLocationSetBox';
import FavPlacesItem from '../components/planride/FavPlacesItem';
import HistoryContainer from '../../shared/component/HistoryCard';
import PickLocationButton from '../../shared/component/PickLocationButton';
import useRideBookingLocationStore from '../store/useRideBookingLocationStore';
import LocationTypes from '../types/LocationTypes.json';
import { useDebouncedAPICall } from '../../../hooks/useDebounce';
import useRideBookingInfo from '../store/useRideBookingInfo';
import { Fonts } from '../../../constants/constants';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import { openFeedback } from '../../../utils/feedback';

const PlanRideScreen = ({selectedDestination,showScheduleTime,fromSavedPlaces,mode,vehicle}) => {
  const { t } = useTranslation();
  const {userdetails,userFavPlaces} = useUserInfoStore();
  const {goBack,setStackScreen} = useStackScreenStore();
  const {setRideStartLocation,setRideEndLocation,addRideWayPoint,resetRideBookingLocation,rideStartLocation,rideEndLocation} = useRideBookingLocationStore()

  const {selectedRide, setSelectedRide } =
    useRideSelectionStore();
  const {setPassangerDetails,setRideBookMode,rideBookMode,passangerDetails,setIsScheduledTrip,scheduleDateTime, setScheduleDateTime,femaleDriverOnly,setFemaleDriverOnly,safeNightRides,setSafeNightRides,actingDriverVehicle,setActingDriverVehicle,actingDriverHours,setActingDriverHours} = useRideBookingInfo()

  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showTripFor, setShowTripFor] = useState(false);
  const [showScheduleContainer, setShowScheduleContainer] = useState(false);
  const [selectedFavPlace, setSelectedFavPlace] = useState(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const [durationUnit, setDurationUnit] = useState('hr'); // '30min' | 'hr' | 'day'
  const [durationValue, setDurationValue] = useState(null);
  const [selectedTripCategory, setSelectedTripCategory] = useState('oneway');

  const TRIP_CATEGORY_OPTIONS = [
    {
      key: 'oneway',
      icon: 'navigate-outline',
      title: 'Oneway Trip',
      description: 'Nearby drops, select both pickup and destination',
    },
    {
      key: 'roundtrip',
      icon: 'repeat-outline',
      title: 'Round Trip',
      description: 'Pickup and destination same',
    },
    {
      key: 'outstation',
      icon: 'map-outline',
      title: 'Outstation Trip',
      description: 'Other state or districts, select both pickup and destination',
    },
  ];

  const DURATION_UNITS = [
    { key: '30min', label: '30 Min' },
    { key: 'hr',    label: 'Hours'  },
    { key: 'day',   label: 'Days'   },
  ];
  const HOUR_OPTIONS = [1, 2, 3, 4, 6, 8, 12];
  const DAY_OPTIONS  = [1, 2, 3, 7, 14];
  const isActingDriverMode = mode === 'ACTING_DRIVER';
  const isRoundTrip = isActingDriverMode && selectedTripCategory === 'roundtrip';
  const isTripDurationRequired = isActingDriverMode && (isRoundTrip || selectedTripCategory === 'outstation');
  const isCarDurationSelected = durationUnit === '30min' || durationValue != null;
  const isTripDurationSelected = !isTripDurationRequired || isCarDurationSelected;
  const hasRequiredLocations = isRoundTrip ? rideStartLocation : rideStartLocation && rideEndLocation;
  const isContinueButtonVisible = hasRequiredLocations && isTripDurationSelected;

  const onDurationUnitChange = (unit) => {
    setDurationUnit(unit);
    setDurationValue(null);
    setActingDriverHours(unit === '30min' ? 0.5 : null);
  };

  const onDurationValueChange = (val) => {
    setDurationValue(val);
    setActingDriverHours(durationUnit === 'day' ? val * 24 : val);
  };

  // Handle selectedDestination from SavedPlacesScreen
  useEffect(() => {
    if (selectedDestination) {
      setRideEndLocation(selectedDestination);
    }
  }, [selectedDestination]);

  useEffect(() => {
    if (isRoundTrip && rideStartLocation) {
      setRideEndLocation(rideStartLocation);
    }
  }, [isRoundTrip, rideStartLocation, setRideEndLocation]);

  const _toggleSubview = useCallback(() => {
    setShowBottomSheet(!showBottomSheet);
  }, [showBottomSheet]);

  const onBackPress = async () => {
    console.log("onBackPress")
    resetRideBookingLocation()
    setScheduleDateTime(null)
    setSelectedRide(rideType[0])
    setIsScheduledTrip(false)
    setFemaleDriverOnly(false)
    setSafeNightRides(false)
    setActingDriverVehicle(null)
    setActingDriverHours(null)
    goBack();
  };


 
  const onFeedbackPress = () => {
    const startName = (rideStartLocation && (rideStartLocation.name || rideStartLocation.address)) || '';
    const endName = (rideEndLocation && (rideEndLocation.name || rideEndLocation.address)) || '';
    const pickupCoords = rideStartLocation && rideStartLocation.latitude != null && rideStartLocation.longitude != null
      ? `${rideStartLocation.latitude},${rideStartLocation.longitude}` : '';
    const dropCoords = rideEndLocation && rideEndLocation.latitude != null && rideEndLocation.longitude != null
      ? `${rideEndLocation.latitude},${rideEndLocation.longitude}` : '';
    openFeedback({
      screenName: 'PlanRideScreen',
      params: { rideMode: rideBookMode, tripStartName: startName, tripEndName: endName, pickupCoords, dropCoords },
      initialValues: { tripStartName: startName, tripEndName: endName, pickupCoords, dropCoords },
      onSubmit: async () => {
        // hook to send feedback if needed
      },
    });
  };

  const handleFavouriteLocationPress = useCallback((location) => {
    if(location.locationData){
      setSelectedFavPlace(location)
      setRideEndLocation(location.locationData)
    }
  }, []);

 

  useEffect(() => {
    if(mode == 'ACTING_DRIVER' && vehicle){
      setActingDriverVehicle(vehicle);
    }
    if(mode == 'SCHEDULE_TRIP'){
      console.log("Schedule ride mode detected");
      setShowScheduleContainer(true)
    }
    if(mode == 'FEMALE_DRIVER'){
      setFemaleDriverOnly(true)
    }
    if(mode == 'NIGHT_TRIP'){
      setSafeNightRides(true)
    }
    if(mode == 'MULTI_STOP'){
      onAddWaypoint()
      
    }
    if(mode == 'FAMILY_RIDE'){
      onTripForPress()
      
    }
    return () => {
      setIsContinuing(false);
    };
  }, []);

  useEffect(() => {
    const handleHardwareBackPress = () => {
      onBackPress();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBackPress);
    return () => {
      subscription.remove();
    };
  }, [onBackPress]);


  const onRideTypePress = () => {
    
    _toggleSubview();
  };



  const onRideSelect = item => {
    setSelectedRide(item);
    if (item.name === 'Schedule') {
      setShowScheduleContainer(true)
      setIsScheduledTrip(true)
    } else {
      _toggleSubview();
      setScheduleDateTime(null);
      setIsScheduledTrip(false)
    }
  };

  const oncloseDateTime = () => {
    setShowScheduleContainer(false)
    if (scheduleDateTime) return 
    setSelectedRide(rideType[0])
  }

  const onConfirmDateTime = () => {
    setShowScheduleContainer(false)
    _toggleSubview();
  }

  const onTripForPress = () => {
    setShowTripFor(true)
  }

  const onAddWaypoint = () => {
    setStackScreen('WaypointScreen',{fromPlanScreen:true});
  }

  const onTripCategoryPress = (key) => {
    if (selectedTripCategory === 'roundtrip' && key !== 'roundtrip' && rideEndLocation === rideStartLocation) {
      setRideEndLocation(null);
    }
    setSelectedTripCategory(key);
    if (key === 'roundtrip' && rideStartLocation) {
      setRideEndLocation(rideStartLocation);
    }
  }


  const HandsetRideLocation = (item,type)=>{
    if (type === LocationTypes.START_LOCATION){
      setRideStartLocation(item)
    }else if (type === LocationTypes.DESTINATION_LOCATION){
      setRideEndLocation(item)
    }else if (type === LocationTypes.WAYPOINT_LOCATION){
      addRideWayPoint(item)
    }
  }

  // Debounced search callback to prevent excessive API calls
  const debouncedSearchCallback = useDebouncedAPICall((item, type) => {
    HandsetRideLocation(item, type);
    goBack();
    if(type !== LocationTypes.START_LOCATION && rideStartLocation && rideEndLocation && isTripDurationSelected){
      setStackScreen('BookRideScreen',{})
    }
  }, 300);

  const onSearchClickResultCallback = (item,type) =>{
    console.log("onSearchClickResultCallback",item,type);
    debouncedSearchCallback(item,type)
   

    
  }

  const onSearchClick = (type) =>{
    setStackScreen("SearchScreen",{
      onSearchClick:onSearchClickResultCallback,
      searchType:type,
      label:type === LocationTypes.DESTINATION_LOCATION ? t('locate_drop_location') : type === LocationTypes.WAYPOINT_LOCATION ? t('locate_stop') : t('locate_pickup_location')
    })
  }

  const handleLocationClick=(type)=>{
    console.log("handleLocationClick",type)
    
    handlePickLocation(type)
    // onSearchClick(type)
  }

  // Debounced pick location callback
  const debouncedPickLocationCallback = (item, type) => {
    // First update the store with the selected location
    HandsetRideLocation(item, type);

    const isStart = type === LocationTypes.START_LOCATION;
    // Derive what start/end will be after this selection to avoid using stale values
    const nextStartLocation = isStart ? item : rideStartLocation;
    const nextEndLocation = isRoundTrip ? nextStartLocation : isStart ? rideEndLocation : item; // if selecting destination/waypoint, item is the end/waypoint
    if (isRoundTrip && nextStartLocation) {
      setRideEndLocation(nextStartLocation);
    }
    console.log("nextStartLocation,nextEndLocation",nextStartLocation,nextEndLocation)
    // // If we have both start & end after this selection and it's not a start selection, go straight to booking
    if ( nextStartLocation && nextEndLocation && isTripDurationSelected && !nextStartLocation?.currentLocation) {
      goBack()
      setStackScreen(mode === 'ACTING_DRIVER' ? 'BookActingDriverScreen' : 'BookRideScreen', {});
      return; // Skip going back, we are moving forward
    }

    // Otherwise just go back to the previous screen
    goBack();
  };

  const onPickLocationResultCallback = (item,type) =>{
    debouncedPickLocationCallback(item,type)
    
  }
   const confirmPickUpCurrentLocation = () => {
    console.log("confirmPickUpCurrentLocation",fromSavedPlaces)
    const props ={
      onPickLocationResultCallback:onPickLocationResultCallback,
      locationType:LocationTypes.START_LOCATION,
      label:t('locate_pickup_location'),
      buttonLabel:t('button_locate_pickup_location'),
      isFromRidePointsSelection:true,
      searchBar:true,
      currentLocation:true,
      focusSearchOnMount:false,
    }
    setStackScreen('PickLocationScreen', props);
  }

  const handlePickLocation = (type=null) =>{

    const props ={
      onPickLocationResultCallback:onPickLocationResultCallback,
      locationType:type?type:LocationTypes.DESTINATION_LOCATION,
      label: type === LocationTypes.DESTINATION_LOCATION ? t('locate_drop_location') : type === LocationTypes.WAYPOINT_LOCATION ? t('locate_stop') : t('locate_pickup_location'),
      buttonLabel: type === LocationTypes.DESTINATION_LOCATION ? t('button_locate_drop_location') : type === LocationTypes.WAYPOINT_LOCATION ? t('button_locate_stop') : t('button_locate_pickup_location'),
      isFromRidePointsSelection:true,
      searchBar:true,
      focusSearchOnMount:true,
    }

    if(type === LocationTypes.START_LOCATION && rideStartLocation){
      props.defaultLocation = rideStartLocation
    }
    if(type === LocationTypes.DESTINATION_LOCATION && rideEndLocation){
      props.defaultLocation = rideEndLocation
    }
    
    setStackScreen('PickLocationScreen', props)
  }

  // Debounced history location callback
  const debouncedHistoryCallback = useDebouncedAPICall((item) => {
    HandsetRideLocation(item,LocationTypes.DESTINATION_LOCATION)
  }, 300);

  const handleHistoryLocationClick=(item)=>{
    debouncedHistoryCallback(item)
    const nextEndLocation = isRoundTrip ? rideStartLocation : item;
    const canOpenBooking = isRoundTrip ? rideStartLocation && isTripDurationSelected : rideStartLocation && nextEndLocation && isTripDurationSelected;
    if(canOpenBooking){
      if (isRoundTrip && rideStartLocation) {
        setRideEndLocation(rideStartLocation);
      }
    setStackScreen(mode === 'ACTING_DRIVER' ? 'BookActingDriverScreen' : 'BookRideScreen',{})
    }

  }

   useEffect(() => {
    if (userdetails){
      if(!rideBookMode){
        setRideBookMode('MYSELF')
        setPassangerDetails({name:userdetails.name,phone:userdetails.phone})
      }
    }
    
    if( rideEndLocation && !rideStartLocation && fromSavedPlaces ){
      confirmPickUpCurrentLocation()
    }
    
    if(showScheduleTime){
      setShowScheduleContainer(true)
    }
  }, [fromSavedPlaces, rideEndLocation, rideStartLocation, showScheduleTime, userdetails, rideBookMode, scheduleDateTime]);
 

  const handleContinue = () => {  
     setIsContinuing(true); 
     if (isRoundTrip && rideStartLocation) {
      setRideEndLocation(rideStartLocation);
     }
     if(rideStartLocation?.currentLocation){
      const props={
        onPickLocationResultCallback:onPickLocationResultCallback,
        locationType:LocationTypes.START_LOCATION,
        label:t('button_locate_pickup_location'),
        buttonLabel:t('button_locate_pickup_location'),
        isFromRidePointsSelection:true,
        searchBar:true,
        currentLocation:true,
        defaultLocation:rideStartLocation,
        focusSearchOnMount:false,
        isConfirmLocation:true,
        isActingDriver: mode === 'ACTING_DRIVER',
        selectedVehicle: actingDriverVehicle,
      }
      setStackScreen('PickLocationScreen', props);
      return;
     }
     setStackScreen(mode === 'ACTING_DRIVER' ? 'BookActingDriverScreen' : 'BookRideScreen', {});
    //  Vibration.vibrate(100);
  }



const isScheduleSelected = Boolean(scheduleDateTime?.date)
const isScheduleToday = isScheduleSelected ? utils.isToday(scheduleDateTime.date) : false
const scheduleDateLabel = isScheduleSelected ? (isScheduleToday ? t('today') : utils.formatDate(scheduleDateTime.date, 'ddd DD')) : ""
const scheduleTime = scheduleDateTime?.time ? utils.timestampTo12HourFormat(scheduleDateTime?.time) : ""

  return (
    <>
      


      <View style={styles.PlanRideScreen}>
        <NavBar
          withBg
          onBackPress={onBackPress}
          title={t('plan_your_trip')}
          feedbackIcon={true}
          onrightIconPress={onFeedbackPress}
        />

        <View style={addLocation.rideSelectionContainer}>
          <TouchableOpacity
            style={[addLocation.rideSelection,scheduleDateLabel&&{flex:2}]}
            onPress={() => onRideTypePress()}>
            <Schdule />
            <Text style={addLocation.rideSelectionTxt}>{!scheduleDateLabel && t(selectedRide.translationKey)}{' '}{scheduleDateLabel ? scheduleDateLabel + " - " + scheduleTime.toUpperCase() : scheduleTime.toUpperCase()}
            </Text>
            {!scheduleDateLabel && <Ionicons name={"chevron-down"} size={14} color={"white"} />}
          </TouchableOpacity>

          <TouchableOpacity style={[addLocation.rideSelection]} onPress={() => onTripForPress()}>
            <Ionicons name="person" size={18} color={colors.white} />
           { <Text style={[addLocation.rideSelectionTxt, {width:'60%',justifyContent:'center',textAlign:'center'}]} numberOfLines={1} ellipsizeMode="tail">{rideBookMode === 'MYSELF' ? t('myself') : passangerDetails?.name || t('others')}</Text>}
            <Ionicons name="chevron-down" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
        <RideLocationSetBox 
      
        onAddWaypoint={onAddWaypoint}
        onLocationClick={handleLocationClick}
        hideDestination={isRoundTrip}
        
        />

      

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.favPlacesContainer}
          style={styles.favPlacesScrollView}
        >  
          {userFavPlaces?.map((item,index)=>(
            <FavPlacesItem key={index} data={item} onPress={() => {
              handleFavouriteLocationPress(item)
            }}  selected={selectedFavPlace?.label === item.label} />
          ))}
          <FavPlacesItem data={{label:t('add_favorite_places')}} onPress={() => {
            setStackScreen("SavedPlacesScreen",{})
          }} type="add" />
        </ScrollView>
        {isActingDriverMode && (
          <View style={styles.tripCategoryContainer}>
            {TRIP_CATEGORY_OPTIONS.map(item => {
              const isSelected = selectedTripCategory === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.tripCategoryButton, isSelected && styles.tripCategoryButtonSelected]}
                  onPress={() => onTripCategoryPress(item.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.tripCategoryIconWrap, isSelected && styles.tripCategoryIconWrapSelected]}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={isSelected ? colors.white : colors.black}
                    />
                  </View>
                  <Text
                    style={[styles.tripCategoryTitle, isSelected && styles.tripCategoryTitleSelected]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.tripCategoryDescription, isSelected && styles.tripCategoryDescriptionSelected]}
                    numberOfLines={3}
                  >
                    {item.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <DashedLine style={styles.dottedLine} />
        <ScrollView style={{ flex: 1}} contentContainerStyle={{paddingBottom: height*0.2}}>
            {/* Acting Driver: selected vehicle + duration */}
        {mode === 'ACTING_DRIVER' && actingDriverVehicle && (
          <View style={styles.actingDriverPanel}>
            {/* Vehicle row */}
            <View style={styles.actingVehicleRow}>
              <Ionicons
                name={VEHICLE_TYPE_ICON[actingDriverVehicle.type] || 'car-outline'}
                size={22}
                color={colors.black}
              />
              <View style={styles.actingVehicleInfo}>
                <Text style={styles.actingVehicleReg}>{actingDriverVehicle.regNo}</Text>
                <Text style={styles.actingVehicleMeta}>
                  {[
                    VEHICLE_TYPE_OPTIONS.find(o => o.value === actingDriverVehicle.type)?.label,
                    actingDriverVehicle.make,
                    actingDriverVehicle.model,
                    actingDriverVehicle.year,
                  ].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View style={styles.changeVehicleContainer}>
                <TouchableOpacity
                  style={styles.changeVehicleBtn}
                  onPress={() => { setActingDriverVehicle(null); setActingDriverHours(null); goBack(); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeVehicleText}>{t('change', 'Change')}</Text>
                </TouchableOpacity>
                {isTripDurationRequired && !isCarDurationSelected && (
                  <Text style={styles.durationRequiredText}>{t('required', 'Required')}</Text>
                )}
              </View>
            </View>

            {/* Duration selector */}
            <View style={styles.durationSection}>
              <Text style={styles.durationLabel}>{t('duration', 'Duration')}</Text>
              <View style={styles.durationUnitRow}>
                {DURATION_UNITS.map(u => (
                  <TouchableOpacity
                    key={u.key}
                    style={[styles.durationUnitBtn, durationUnit === u.key && styles.durationUnitBtnSelected]}
                    onPress={() => onDurationUnitChange(u.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.durationUnitText, durationUnit === u.key && styles.durationUnitTextSelected]}>
                      {u.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {durationUnit !== '30min' && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.durationChipsRow}
                >
                  {(durationUnit === 'hr' ? HOUR_OPTIONS : DAY_OPTIONS).map(v => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.durationChip, durationValue === v && styles.durationChipSelected]}
                      onPress={() => onDurationValueChange(v)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.durationChipText, durationValue === v && styles.durationChipTextSelected]}>
                        {durationUnit === 'hr' ? `${v}h` : `${v}d`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}
        <HistoryContainer selectCallback={handleHistoryLocationClick} bottomborder = {false} fromSearchScreen={true}/>
        </ScrollView>

        <View style={styles.pickLocationContainer}> 
          {/* <PickLocationButton
          onPress={handlePickLocation}
       
          /> */}
         {
          isContinueButtonVisible && (
            <TouchableOpacity style={[styles.continueButton, isContinuing && styles.continueButtonDisabled]} onPress={()=>{  handleContinue()}} disabled={isContinuing}>
              {isContinuing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AdaptiveText style={[styles.continueButtonText, isContinuing && styles.continueButtonTextDisabled]} color={colors.white}>{t('continue')}</AdaptiveText>
              )}
            </TouchableOpacity>
          )
         }
        </View>
       

        {showBottomSheet  && (
          <AnimatedBottomSheetWrapper onClose={_toggleSubview}>
            <TripType

              onTripSelect={onRideSelect}
              selectedRide={selectedRide}
            />
          </AnimatedBottomSheetWrapper>
        )}

        {showScheduleContainer &&
          <AnimatedBottomSheetWrapper onClose={oncloseDateTime}>
            <ScheduleContainer oncloseDateTime={oncloseDateTime} onConfirmDateTime={onConfirmDateTime} />
          </AnimatedBottomSheetWrapper>
        }
        {showTripFor &&
          <AnimatedBottomSheetWrapper onClose={() => setShowTripFor(false)}>
            <Contactsheet onClose={() => setShowTripFor(false)} onConfirm={() => setShowTripFor(false)} />
          </AnimatedBottomSheetWrapper>
        }
      </View>
      
    </>
  );
};

PlanRideScreen.propTypes = {
  selectedDestination: PropTypes.object,
  showScheduleTime: PropTypes.bool,
};

const styles = StyleSheet.create({
  PlanRideScreen: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
   
  },
  actingDriverPanel: {
    marginHorizontal: 4,
    marginTop: 10,
    marginBottom: 2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  actingVehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actingVehicleInfo: {
    flex: 1,
  },
  actingVehicleReg: {
    fontSize: 14,
    fontFamily: Fonts.semibold || Fonts.medium,
    color: colors.black,
  },
  actingVehicleMeta: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: colors.grey_xxdark,
    marginTop: 2,
  },
  changeVehicleContainer: {
    alignItems: 'center',
    gap: 3,
  },
  changeVehicleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  changeVehicleText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: colors.black,
  },
  durationRequiredText: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    color: '#E53935',
  },
  durationSection: {
    gap: 8,
  },
  durationLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: colors.black,
  },
  durationUnitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationUnitBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  durationUnitBtnSelected: {
    borderColor: colors.black,
    backgroundColor: colors.black,
  },
  durationUnitText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: colors.black,
  },
  durationUnitTextSelected: {
    color: colors.white,
  },
  durationChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  durationChipSelected: {
    borderColor: colors.black,
    backgroundColor: colors.black,
  },
  durationChipText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: colors.black,
  },
  durationChipTextSelected: {
    color: colors.white,
  },
  favPlacesContainer: {
    flexDirection: 'row',
    paddingVertical:10,
    gap:10,
    paddingHorizontal:5
    
  },
  favPlacesScrollView: {
    flexGrow: 0,
  },
  tripCategoryContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 5,
    marginBottom: 8,
  },
  tripCategoryButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    padding: 8,
    justifyContent: 'space-between',
  },
  tripCategoryButtonSelected: {
    borderColor: colors.black,
    backgroundColor: colors.black,
  },
  tripCategoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripCategoryIconWrapSelected: {
    backgroundColor: '#333333',
  },
  tripCategoryTitle: {
    fontSize: 12,
    fontFamily: Fonts.semibold || Fonts.medium,
    color: colors.black,
  },
  tripCategoryTitleSelected: {
    color: colors.white,
  },
  tripCategoryDescription: {
    fontSize: 9,
    lineHeight: 12,
    fontFamily: Fonts.regular,
    color: colors.grey_xxdark,
  },
  tripCategoryDescriptionSelected: {
    color: '#E0E0E0',
  },
  dottedLine:{
    marginVertical: 5,
    marginHorizontal: 10,
  },
  pickLocationContainer: {
    position:"absolute",
    bottom:0,
    width:"100%",
    alignSelf:'center',
    paddingHorizontal: 5,
    backgroundColor:'white'
   
  },
  continueButton:{
    backgroundColor:"#000",
    width:"100%",
    padding:15,
    borderRadius:10,
    alignItems:'center',
    justifyContent:'center',
    marginVertical:10,
  },
  continueButtonText:{
    color:"#fff",
    fontSize:16,
    fontFamily:Fonts.medium,
  },
  continueButtonDisabled:{
    backgroundColor:'#757575',
    opacity:0.6,
  },
  continueButtonTextDisabled:{
    color:'#BDBDBD',
  },
});

export default PlanRideScreen;
