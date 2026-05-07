import {Text, TouchableOpacity, View, StyleSheet, ScrollView, ActivityIndicator, BackHandler, Modal} from 'react-native';
import React, {useCallback, useState,useEffect} from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'react-native-calendars';
import NavBar from '../../../components/NavBar';
import {useStackScreenStore} from '../../../store/useStackScreenStore';
import {addLocation} from '../../../styles/AddLocationStyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { VEHICLE_TYPE_OPTIONS, VEHICLE_TYPE_ICON } from '../../myVehicles/constants/vehicleData';


import DashedLine from '../../../components/Common/DashedLine';

import AnimatedBottomSheetWrapper from '../../shared/component/AnimatedBottomSheetWrapper';

import ScheduleContainer from '../../../screens/SearchLocation/ScheduleContainer';
import { height, utils } from '../../../utils/Utils';
import { colors } from '../../../constants/constants';
import Contactsheet from '../components/planride/Contactsheet';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import RideLocationSetBox from '../components/planride/RideLocationSetBox';
import FavPlacesItem from '../components/planride/FavPlacesItem';
import HistoryContainer from '../../shared/component/HistoryCard';
import useRideBookingLocationStore from '../store/useRideBookingLocationStore';
import LocationTypes from '../types/LocationTypes.json';
import { useDebouncedAPICall } from '../../../hooks/useDebounce';
import useRideBookingInfo from '../store/useRideBookingInfo';
import { Fonts } from '../../../constants/constants';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import { openFeedback } from '../../../utils/feedback';

const formatCalendarDate = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addMonths = (date, months) => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
};

const getInclusiveDateRangeDays = (startDateString, endDateString) => {
  if (!startDateString) {
    return 0;
  }

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString || startDateString);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const dayMilliseconds = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.floor((endDate - startDate) / dayMilliseconds) + 1);
};

const getDateRangeMarkedDates = (startDateString, endDateString) => {
  if (!startDateString) {
    return {};
  }

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString || startDateString);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const markedDates = {};
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const dateKey = formatCalendarDate(cursor);
    markedDates[dateKey] = {
      color: colors.black,
      textColor: colors.white,
      startingDay: dateKey === startDateString,
      endingDay: dateKey === (endDateString || startDateString),
    };
    cursor.setDate(cursor.getDate() + 1);
  }

  return markedDates;
};

const PlanRideScreen = ({selectedDestination,showScheduleTime,fromSavedPlaces,mode,vehicle}) => {
  const { t } = useTranslation();
  const {userdetails,userFavPlaces} = useUserInfoStore();
  const {goBack,setStackScreen} = useStackScreenStore();
  const {setRideStartLocation,setRideEndLocation,addRideWayPoint,resetRideBookingLocation,rideStartLocation,rideEndLocation} = useRideBookingLocationStore()

  const {setPassangerDetails,setRideBookMode,rideBookMode,passangerDetails,setIsScheduledTrip,scheduleDateTime, setScheduleDateTime,setFemaleDriverOnly,setSafeNightRides,actingDriverVehicle,setActingDriverVehicle,setActingDriverHours} = useRideBookingInfo()

  const [showTripFor, setShowTripFor] = useState(false);
  const [showScheduleContainer, setShowScheduleContainer] = useState(false);
  const [selectedFavPlace, setSelectedFavPlace] = useState(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const [durationRangeStart, setDurationRangeStart] = useState(null);
  const [durationRangeEnd, setDurationRangeEnd] = useState(null);
  const [pendingRangeStart, setPendingRangeStart] = useState(null);
  const [pendingRangeEnd, setPendingRangeEnd] = useState(null);
  const [showCustomCalendarModal, setShowCustomCalendarModal] = useState(false);
  const todayDate = formatCalendarDate(new Date());
  const maxCustomDate = formatCalendarDate(addMonths(new Date(), 2));
  const selectedDurationDays = getInclusiveDateRangeDays(durationRangeStart, durationRangeEnd);
  const pendingDurationDays = getInclusiveDateRangeDays(pendingRangeStart, pendingRangeEnd);
  const durationRangeLabel = durationRangeStart
    ? `${utils.formatDate(durationRangeStart, 'DD MMM')} - ${utils.formatDate(durationRangeEnd || durationRangeStart, 'DD MMM')}`
    : '';
  const isActingDriverMode = mode === 'ACTING_DRIVER';
  const isTripDurationSelected = !isActingDriverMode || selectedDurationDays > 0;
  const hasRequiredLocations = rideStartLocation && rideEndLocation;
  const isContinueButtonVisible = hasRequiredLocations && isTripDurationSelected;

  const onPickDatesPress = () => {
    setPendingRangeStart(durationRangeStart);
    setPendingRangeEnd(durationRangeEnd);
    setShowCustomCalendarModal(true);
  };

  const onCustomDurationDateSelect = (day) => {
    const selectedDate = day.dateString;

    if (!pendingRangeStart || (pendingRangeStart && pendingRangeEnd)) {
      setPendingRangeStart(selectedDate);
      setPendingRangeEnd(null);
      return;
    }

    if (selectedDate < pendingRangeStart) {
      setPendingRangeStart(selectedDate);
      setPendingRangeEnd(null);
      return;
    }

    setPendingRangeEnd(selectedDate);
  };

  const onCustomCalendarCancel = () => {
    setPendingRangeStart(null);
    setPendingRangeEnd(null);
    setShowCustomCalendarModal(false);
  };

  const onCustomCalendarConfirm = () => {
    if (!pendingRangeStart) {
      return;
    }
    const rangeEnd = pendingRangeEnd || pendingRangeStart;
    const selectedDays = getInclusiveDateRangeDays(pendingRangeStart, rangeEnd);
    setDurationRangeStart(pendingRangeStart);
    setDurationRangeEnd(rangeEnd);
    setActingDriverHours(selectedDays * 24);
    setShowCustomCalendarModal(false);
  };

  // Handle selectedDestination from SavedPlacesScreen
  useEffect(() => {
    if (selectedDestination) {
      setRideEndLocation(selectedDestination);
    }
  }, [selectedDestination]);

  const onBackPress = async () => {
    console.log("onBackPress")
    resetRideBookingLocation()
    setScheduleDateTime(null)
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


  const oncloseDateTime = () => {
    setShowScheduleContainer(false)
    if (scheduleDateTime) return 
  }

  const onConfirmDateTime = () => {
    setShowScheduleContainer(false)
  }

  const onTripForPress = () => {
    setShowTripFor(true)
  }

  const onAddWaypoint = () => {
    setStackScreen('WaypointScreen',{fromPlanScreen:true});
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
    const nextEndLocation = isStart ? rideEndLocation : item;
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
    const nextEndLocation = item;
    const canOpenBooking = rideStartLocation && nextEndLocation && isTripDurationSelected;
    if(canOpenBooking){
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
          <TouchableOpacity style={[addLocation.rideSelection]} onPress={() => onTripForPress()}>
            <Ionicons name="person" size={18} color={colors.white} />
           { <Text style={[addLocation.rideSelectionTxt, {width:'60%',justifyContent:'center',textAlign:'center'}]} numberOfLines={1} ellipsizeMode="tail">{rideBookMode === 'MYSELF' ? t('myself') : passangerDetails?.name || t('others')}</Text>}
            <Ionicons name="chevron-down" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
        <RideLocationSetBox 
      
        onAddWaypoint={onAddWaypoint}
        onLocationClick={handleLocationClick}
        hideDestination={false}
        
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
                  onPress={() => { setActingDriverVehicle(null); setActingDriverHours(null); setDurationRangeStart(null); setDurationRangeEnd(null); goBack(); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeVehicleText}>{t('change', 'Change')}</Text>
                </TouchableOpacity>
                {!selectedDurationDays && (
                  <Text style={styles.durationRequiredText}>{t('required', 'Required')}</Text>
                )}
              </View>
            </View>

            {/* Duration selector */}
            <View style={styles.durationSection}>
              <Text style={styles.durationLabel}>{t('pick_dates', 'Pick Dates')}</Text>
              <TouchableOpacity
                style={styles.pickDatesButton}
                onPress={onPickDatesPress}
                activeOpacity={0.7}
              >
                <Text style={styles.pickDatesText}>
                  {durationRangeLabel || t('select_date_range', 'Select Date Range')}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={colors.black} />
              </TouchableOpacity>
              {selectedDurationDays ? (
                <View style={styles.durationOutputContainer}>
                  <Text style={styles.durationOutputLabel}>{t('duration', 'Duration')}</Text>
                  <Text style={styles.durationOutputText}>{selectedDurationDays}</Text>
                </View>
              ) : null}
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
        <Modal
          visible={showCustomCalendarModal}
          transparent
          animationType="fade"
          onRequestClose={onCustomCalendarCancel}
        >
          <View style={styles.calendarModalOverlay}>
            <View style={styles.calendarModalCard}>
              <Text style={styles.calendarModalTitle}>{t('pick_dates', 'Pick Dates')}</Text>
              <Calendar
                minDate={todayDate}
                maxDate={maxCustomDate}
                onDayPress={onCustomDurationDateSelect}
                markingType="period"
                markedDates={getDateRangeMarkedDates(pendingRangeStart, pendingRangeEnd)}
                hideExtraDays
                enableSwipeMonths
                theme={{
                  calendarBackground: colors.white,
                  textSectionTitleColor: colors.grey_xxdark,
                  todayTextColor: colors.black,
                  dayTextColor: colors.black,
                  monthTextColor: colors.black,
                  textMonthFontFamily: Fonts.medium,
                  textDayFontFamily: Fonts.regular,
                  textDayHeaderFontFamily: Fonts.medium,
                  arrowColor: colors.black,
                }}
              />
              {pendingRangeStart ? (
                <View style={styles.durationOutputContainer}>
                  <Text style={styles.durationOutputLabel}>{t('duration', 'Duration')}</Text>
                  <Text style={styles.durationOutputText}>{pendingDurationDays}</Text>
                </View>
              ) : null}
              <View style={styles.calendarModalActions}>
                <TouchableOpacity
                  style={styles.calendarCancelButton}
                  onPress={onCustomCalendarCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.calendarCancelText}>{t('cancel', 'Cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.calendarOkButton, !pendingRangeStart && styles.calendarOkButtonDisabled]}
                  onPress={onCustomCalendarConfirm}
                  activeOpacity={0.7}
                  disabled={!pendingRangeStart}
                >
                  <Text style={styles.calendarOkText}>{t('ok', 'OK')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      
    </>
  );
};

PlanRideScreen.propTypes = {
  selectedDestination: PropTypes.object,
  showScheduleTime: PropTypes.bool,
  fromSavedPlaces: PropTypes.bool,
  mode: PropTypes.string,
  vehicle: PropTypes.object,
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
  durationOutputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  durationOutputLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: colors.grey_xxdark,
  },
  durationOutputText: {
    fontSize: 13,
    fontFamily: Fonts.semibold || Fonts.medium,
    color: colors.black,
  },
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  calendarModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    backgroundColor: colors.white,
    padding: 14,
  },
  calendarModalTitle: {
    fontSize: 16,
    fontFamily: Fonts.semibold || Fonts.medium,
    color: colors.black,
    marginBottom: 8,
  },
  calendarModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  calendarCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  calendarCancelText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: colors.black,
  },
  calendarOkButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: colors.black,
  },
  calendarOkButtonDisabled: {
    opacity: 0.45,
  },
  calendarOkText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 5,
    marginTop: 10,
    marginBottom: 12,
  },
  tripCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 6,
    borderRadius: 22,
    backgroundColor: colors.white,
    flexShrink: 1,
  },
  tripCategoryButtonSelected: {
    backgroundColor: colors.black,
    paddingHorizontal: 18,
    borderBottomWidth: 2,
    borderBottomColor: '#00C853',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tripCategoryTitle: {
    fontSize: 15,
    fontFamily: Fonts.semibold || Fonts.medium,
    color: colors.grey_xxdark,
  },
  tripCategoryTitleSelected: {
    color: colors.white,
  },
  tripCategoryInfoButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
