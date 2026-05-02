import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, ActivityIndicator, Linking, Platform } from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { Fonts, colors } from '../../../constants/constants';
import { getVehicleImage } from '../types/vehicleImd';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import LocationTypes from '../../booking/types/LocationTypes.json';
import useAssignedDriverInfoStore from '../store/useAssignedDriverInfoStore';
import useCurrentRideInfoStore from '../store/useCurrentRideInfoStore';
import { changeStopLocation } from '../services/StopLocationChangeService';
import { showNotification } from '../../../components/NotificationManger';
import { useTranslation } from 'react-i18next';
import useWayPointReorderStore from '../../booking/store/useWayPointReorderStore';
import TripDetailsModal from '../../../components/TripDetailsModal';
import { height, utils } from '../../../utils/Utils';
import useRouteDraw from '../hooks/useRouteDraw';
import StatusConatainerWrapper from '../component/StatusConatainerWrapper';
import useStopsMarkerHook from '../hooks/useStopsMarkerHook';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import { getTotalDistanceAndTime } from '../services/getTotalDistanceandTime';
import { firebaselog_onRide } from '../../../../common/utils/FirebaseAnalytics';
import { getPresignedImageUrl } from '../../../../common/utils/getPresignedImageUrl';
import locationTask from '../../../controllers/GetCurrentLocation';

const shallowEqual = (a, b) => {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  for (let index = 0; index < aKeys.length; index += 1) {
    const key = aKeys[index];
    if (!Object.prototype.hasOwnProperty.call(b, key) || !Object.is(a[key], b[key])) {
      return false;
    }
  }
  return true;
};

const DriverArrivalScreen = ({ onCancel, handleOverlay }) => {
  const {
    driverName,
    rating,
    vehicleNumber,
    model,
    brand,
    color,
    driverPhoto,
    phone,
  } = useAssignedDriverInfoStore(
    state => ({
      driverName: state.driverName,
      rating: state.rating,
      vehicleNumber: state.vehicleNumber,
      model: state.model,
      brand: state.brand,
      color: state.color,
      driverPhoto: state.driverPhoto,
      phone: state.phone,
    }),
    shallowEqual,
  );

  // Helper to limit string length and add ellipsis if needed
  const limitText = (text, max = 10) => {
    console.log(`Limiting text: "${text}" to max length of ${max}`);
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  };

  const {
    stops,
    otp,
    duration,
    totalDistance,
    vehicleType,
    estimatedFare,
    paymentMethod,
    isActingDriverTrip,
    passengerNotificationPreferences,
    tripId,
  } = useCurrentRideInfoStore(
    state => ({
      stops: state.stops,
      otp: state.otp,
      duration: state.duration,
      totalDistance: state.totalDistance,
      vehicleType: state.vehicleType,
      estimatedFare: state.estimatedFare,
      paymentMethod: state.paymentMethod,
      isActingDriverTrip : state.isActingDriverTrip,
      passengerNotificationPreferences: state.passengerNotificationPreferences,
      tripId: state.tripId,
    }),
    shallowEqual,
  );

  const { goBack, setStackScreen } = useStackScreenStore();
  const { t } = useTranslation();
  const { waitingForDriverApproval } = useWayPointReorderStore();
  const { userdetails } = useUserInfoStore();
  const userToken = userdetails?.token || null;

  const [loading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isCallingDriver, setIsCallingDriver] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(null);
  const [driverPhotoUri, setDriverPhotoUri] = useState(null);
  const [isDriverPhotoLoading, setIsDriverPhotoLoading] = useState(false);

  // Removed driverPhotoCacheRef: always fetch driver photo via API call
  const boundingBoxRef = useRef(null);

  const pickupStop = useMemo(() => (stops && stops.length > 0 ? stops[0] : null), [stops]);
  const otpDigits = useMemo(() => (otp ? otp.split('') : []), [otp]);
  const passengerPhone = userdetails?.phone;

  const durationDisplay = useMemo(() => {
    if (estimatedDuration === null || estimatedDuration === undefined) {
      return { label: '--', isSingular: false };
    }
    const numericValue = Number(estimatedDuration);
    if (!Number.isFinite(numericValue)) {
      return { label: estimatedDuration, isSingular: false };
    }
    const rounded = Math.max(0, Math.round(numericValue));
    return { label: String(rounded), isSingular: rounded === 1 };
  }, [estimatedDuration]);

  const handleBoundingBoxReady = useCallback(fn => {
    boundingBoxRef.current = fn;
  }, []);

  const handleEstimatedDurationChange = useCallback(value => {
    setEstimatedDuration(prev => (Object.is(prev, value) ? prev : value));
  }, []);

  const handleMapIconPress = useCallback(() => {
    if (isActingDriverTrip) {
      locationTask.getCurrentLocation();
    } else {
      boundingBoxRef.current?.();
    }
  }, [isActingDriverTrip]);

  useEffect(() => {
    let isActive = true;


    const resolveDriverPhoto = async () => {
      const trimmed = driverPhoto?.trim();
      if (!trimmed) {
        setDriverPhotoUri(null);
        return;
      }

      const normalizedKey = trimmed.replace(/^https?:\/\/[^/]+\/?/, '').replace(/^\//, '');

      if (!normalizedKey || !userToken) {
        setDriverPhotoUri(null);
        return;
      }

      try {
        setIsDriverPhotoLoading(true);
        const signedUrl = await getPresignedImageUrl(normalizedKey, userToken);
        if (!isActive) {
          return;
        }
        setDriverPhotoUri(signedUrl || null);
      } catch (error) {
        if (isActive) {
          setDriverPhotoUri(null);
        }
      } finally {
        if (isActive) {
          setIsDriverPhotoLoading(false);
        }
      }
    };

    resolveDriverPhoto();

    return () => {
      isActive = false;
    };
  }, [driverPhoto, userToken]);

  useEffect(() => {
    if (isActingDriverTrip || !stops || stops.length === 0) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      boundingBoxRef.current?.();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [stops, isActingDriverTrip]);

  useEffect(() => {
    if (isActingDriverTrip) return undefined;
    const interval = setInterval(() => {
      boundingBoxRef.current?.();
    }, 15000);
    return () => clearInterval(interval);
  }, [isActingDriverTrip]);

  const handlePickLocation = useCallback(
    async item => {
      if (!item) {
        return;
      }
      goBack();
      const formattedAddress = utils.formatAddressName(item);
      item.address = formattedAddress;

      const { totalDistance: updatedDistance, totalDuration } = await getTotalDistanceAndTime(stops, true);

      try {
        const res = await changeStopLocation(item, updatedDistance, totalDuration);
        if (res.success) {
          // success toast handled elsewhere; keep silent update
          firebaselog_onRide('OR_Edit(OR_E)','OR_E:pickuppoint_change')
        }
      } catch (error) {
        console.log('error', error);
      }
    },
    [goBack, stops],
  );

  const handleChangeLocation = useCallback(
    item => {
      if (!item) {
        return;
      }
      setStackScreen('PickLocationScreen', {
        onPickLocationResultCallback: handlePickLocation,
        locationType: LocationTypes.START_LOCATION,
        defaultLocation: item,
        label: t('edit_pickup_location'),
        isFromRidePointsSelection: false,
        loading,
        limitRadius: 0.5,
      });
    },
    [handlePickLocation, loading, setStackScreen, t],
  );

  const toggleExpand = useCallback(() => {
    const action = expanded ? 'close' : 'open';
    handleOverlay(action);
    setExpanded(prev => !prev);
  }, [expanded, handleOverlay]);

  const chevronRotation = expanded ? '90deg' : '0deg';

  const makeCallIntent = useCallback(async () => {
    if (isCallingDriver) {
      return;
    }
    if (!passengerPhone || !phone) {
      showNotification(t('error'), t('unable_to_place_call'), 'error');
      return;
    }

    const driverNumber = phone.replace(/[^+\d]/g, '');
    if (driverNumber.length < 5) {
      showNotification(t('error'), t('invalid_driver_phone_number'), 'error');
      return;
    }

    try {
      setIsCallingDriver(true);

      const scheme = Platform.OS === 'ios' ? 'telprompt:' : 'tel:';
      const url = `${scheme}${driverNumber}`;
      const canOpen = await Linking.canOpenURL(url);

      if (!canOpen) {
        if (Platform.OS === 'ios' && scheme === 'telprompt:') {
          const fallbackUrl = `tel:${driverNumber}`;
          const fallbackOk = await Linking.canOpenURL(fallbackUrl);
          if (fallbackOk) {
            await Linking.openURL(fallbackUrl);
            return;
          }
        }
        showNotification(t('error'), t('unable_to_place_call'), 'error');
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      showNotification(t('error'), t('error_in_making_call_to_driver'), 'error');
    } finally {
      setIsCallingDriver(false);
    }
  }, [isCallingDriver, passengerPhone, phone, t]);

  return (
    <StatusConatainerWrapper backgroundColor="black" onMapIconPress={handleMapIconPress}>
      <DriverLocationEffects
        stops={stops}
        vehicleType={vehicleType}
        onEstimatedDurationChange={handleEstimatedDurationChange}
        onBoundingBoxReady={handleBoundingBoxReady}
        isActingDriverTrip={isActingDriverTrip}

      />
      {isActingDriverTrip ? (
      <View style={styles.containerTop}>
        <AdaptiveText style={styles.topBarText}>{t('your_driver_is_on_the_way')}</AdaptiveText>
      </View>
      ):(
      <View style={styles.containerTop}>
        <AdaptiveText style={styles.topBarText}>{t('your_driver_will_arrive_in')}</AdaptiveText>
        <View style={styles.timeBox}>
          <AdaptiveText style={styles.timeText}>
            {durationDisplay.label}
            {durationDisplay.label === '--' ? '' : durationDisplay.isSingular ? ' Min' : ' Mins'}
          </AdaptiveText>
        </View>
      </View>
      )}
     

      <View style={[styles.root, { backgroundColor: 'white' }]}>
        {isActingDriverTrip ? <>
        </> : 
        <View style={styles.vehicleCard}>
          {getVehicleImage(vehicleType, styles.vehicleImg)}
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleNum}>{vehicleNumber}</Text>
            <View style={styles.vehicleDescRow}>
              {brand ? (
                <Text style={styles.vehicleDesc} numberOfLines={1} ellipsizeMode="tail">
                  {brand}
                </Text>
              ) : null}
              {brand && model ? <Text style={styles.vehicleDescSeparator}>.</Text> : null}
              {model ? (
                <Text style={styles.vehicleDesc} numberOfLines={1} ellipsizeMode="tail">
                  {model}
                </Text>
              ) : null}
              {(model || brand) && color ? <Text style={styles.vehicleDescSeparator}>.</Text> : null}
              {color ? (
                <Text  numberOfLines={1} ellipsizeMode="tail" style={[styles.vehicleDesc, { textTransform: 'capitalize' }]}>
                {limitText(color, 10)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        }
       

        <View style={styles.driverRow}>
          <View style={styles.driverProfile}>
            {driverPhotoUri ? (
              <Image source={{ uri: driverPhotoUri }} style={styles.driverImg} resizeMode="cover" />
            ) : (
              <View style={[styles.driverImg, styles.driverImgPlaceholder]}>
                {isDriverPhotoLoading ? <ActivityIndicator size="small" color="#7c7c7c" /> : null}
              </View>
            )}
            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              {/* <Text style={styles.ratingText}>{rating}</Text> */}
            </View>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driverName}</Text>
          </View>
          <View style={styles.otpBox}>
            <Text style={styles.otpLabel}>OTP</Text>
            <View style={styles.otpRow}>
              {otpDigits.map((digit, index) => (
                <Text key={index} style={styles.otpDigit}>
                  {digit}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.pickupRow}>
          <View style={styles.pickupInfo}>
            <Text style={styles.pickupLabel}>{t('pickup_location')}</Text>
            <Text style={styles.pickupValue} numberOfLines={1} ellipsizeMode="tail">
              {pickupStop?.address || '--'}
            </Text>
          </View>
          <TouchableOpacity style={styles.changeBtn} onPress={() => handleChangeLocation(pickupStop)}>
            <Text style={styles.changeBtnText}>{t('change')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.tripDetailsRow} onPress={toggleExpand} activeOpacity={0.7}>
          <AdaptiveText style={styles.tripDetailsLabel}>{t('trip_details')}</AdaptiveText>
          <View style={styles.tripDetailsRight}>
            {waitingForDriverApproval === 'PENDING' && (
              <View style={styles.driverWaitingApprovalContainer}>
                <Text style={styles.driverWaitingApprovalText}>{t('waiting_for_driver_approval')}</Text>
              </View>
            )}
            <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
              <Icon name="keyboard-arrow-right" size={25} color="#000" />
            </Animated.View>
          </View>
        </TouchableOpacity>

        <TripDetailsModal
          visible={expanded}
          onClose={toggleExpand}
          stops={stops?.length > 0 ? stops : []}
          waitingForDriverApproval={waitingForDriverApproval}
          height={height}
          onCancel={onCancel}
          paymentMethod={paymentMethod}
          notificationPreferences={passengerNotificationPreferences}>
          <View style={{ flexDirection: 'row', flex: 1, marginBottom: 0 }}>
            <View style={styles.rideInfoItem}>
              <Text style={styles.rideInfoLabel}>{t('duration')}</Text>
              <Text style={styles.rideInfoValue}>{duration || '--'} {duration === 1 ? 'Min' : 'Mins'}</Text>
            </View>
            <View style={styles.rideInfoItem}>
              <Text style={styles.rideInfoLabel}>{t('distance')}</Text>
              <Text style={styles.rideInfoValue}>{totalDistance || '--'} Km</Text>
            </View>
            <View style={styles.rideInfoItem}>
              <Text style={styles.rideInfoLabel}>{t('est_price')}</Text>
              <Text style={styles.rideInfoValue}>₹{estimatedFare || '--'}</Text>
            </View>
          </View>
        </TripDetailsModal>

        {/* Bills & Photos row */}
        {/* <TouchableOpacity
          style={styles.tripDetailsRow}
          onPress={() => setStackScreen('BillsAndPhotosScreen', { tripId })}
          activeOpacity={0.7}>
          <AdaptiveText style={styles.tripDetailsLabel}>Bills & Photos</AdaptiveText>
          <Icon name="keyboard-arrow-right" size={25} color="#000" />
        </TouchableOpacity> */}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.callBtn, isCallingDriver && styles.callBtnDisabled]}
            onPress={makeCallIntent}
            disabled={isCallingDriver}
          >
            {isCallingDriver ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Icon name="phone" size={20} color={colors.white} />
                <Text style={styles.callBtnText}>{t('call_driver')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </StatusConatainerWrapper>
  );
};

const DriverLocationEffects = React.memo(
  ({ stops, vehicleType, onBoundingBoxReady, onEstimatedDurationChange, isActingDriverTrip }) => {
    const { driverLatitude, driverLongitude, driverAngle } = useAssignedDriverInfoStore(
      state => ({
        driverLatitude: state.driverLatitude,
        driverLongitude: state.driverLongitude,
        driverAngle: state.driverAngle,
      }),
      shallowEqual,
    );

    const primaryStop = useMemo(() => (stops && stops.length > 0 ? stops[0] : null), [stops]);
    const destinationLat = primaryStop?.location?.[1] ?? null;
    const destinationLon = primaryStop?.location?.[0] ?? null;

    const { estimatedDuration, SetViewBoundingBox } = useRouteDraw({
      destinationlat: destinationLat,
      destinationlon: destinationLon,
      driverLat: driverLatitude,
      driverLon: driverLongitude,
      isActingDriverTrip: isActingDriverTrip,
    });

    useStopsMarkerHook(stops, driverLatitude, driverLongitude, vehicleType, 'pickup', driverAngle, isActingDriverTrip);

    useEffect(() => {
      if (onBoundingBoxReady) {
        onBoundingBoxReady(SetViewBoundingBox);
      }
    }, [SetViewBoundingBox, onBoundingBoxReady]);

    useEffect(() => {
      if (onEstimatedDurationChange) {
        onEstimatedDurationChange(estimatedDuration);
      }
    }, [estimatedDuration, onEstimatedDurationChange]);

    return null;
  },
);

DriverLocationEffects.displayName = 'DriverLocationEffects';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
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
    backgroundColor: '#0f223c',
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
    top: -10,
  },
  containerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    zIndex: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  topBar: {
    backgroundColor: '#174EA6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topBarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Fonts.regular,
    
  },
  timeBox: {
    backgroundColor: colors.white+'30',
   
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  timeText: {
    color: colors.white,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  pickupInfo: {
    flex: 1,
    gap: 5,
  },
  pickupLabel: {
    color: '#888',
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  pickupValue: {
    color: '#222',
    fontSize: 15,
    maxWidth: '90%',
    fontFamily: Fonts.regular,
    textAlign: 'left',
  },
  changeBtn: {
    borderColor: '#4289e5',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  changeBtnText: {
    color: colors.blue,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    justifyContent: 'center',
    gap: 20,
    paddingLeft:20,
   
  },
  vehicleInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  vehicleDescRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  vehicleImg: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    transform: [{ scaleX: -1 }],
   
  },
  vehicleNum: {
    fontFamily: Fonts.semi_bold,
    fontSize: 24,
    marginBottom: 2,
    color: colors.black,
  },
  vehicleDesc: {
    color: '#616161',
    fontSize: 14,
    fontFamily: Fonts.regular,
    flexShrink: 1,
    minWidth: 0,
  },
  vehicleDescSeparator: {
    marginHorizontal: 4,
    color: '#616161',
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  driverProfile: {
    alignItems: 'center',
  
    marginRight: 10,
  },
  driverImg: {
    width: 70,
    height: 70,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 4,
  },
  driverImgPlaceholder: {
    backgroundColor: '#d9d9d9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  
    position: 'absolute',
    bottom: -5,
    elevation: 5, 
  },
  star: {
    color: '#FFD700',
    fontSize: 12,
    marginRight: 2,
  },
  ratingText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  driverName: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    marginBottom: 2,
    color: colors.black,
  },
  driverLabel: {
    color: '#888',
    fontSize: 13,
  },
  otpBox: {
    alignItems: 'center',
    marginLeft: 10,
  },
  otpLabel: {
    color: '#888',
    fontFamily: Fonts.regular,
    fontSize: 13,
    marginBottom: 5,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 2,
  },
  otpDigit: {
    backgroundColor: colors.grey,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontFamily: Fonts.regular,
    fontSize: 18,
    marginHorizontal: 1,
    color: colors.black,
  },
  rideInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginBottom: 16,
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    borderBottomWidth: 1,
  },
  rideInfoItem: {
    padding: 10,
    alignItems: 'center',
    flex: 1,
  },
  rideInfoLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
    fontFamily:Fonts.regular,
  },
  rideInfoValue: {
   
    fontSize: 15,
    fontFamily:Fonts.medium,
    color:colors.grey_xxdark,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop:10,
    gap:15,
   
  },
  callBtn: {
    flexDirection: 'row',
    gap: 10,
    padding:15,

    backgroundColor: '#00770d',
   
    borderWidth: 1,
    borderColor: '#00770d',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
 
    flex:1,
    
  },
  callBtnDisabled: {
    opacity: 0.7,
  },
  callBtnText: {

    color: colors.white,
    fontFamily: Fonts.medium,
    fontSize: 14,

  },
  shareBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#4289e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FF5A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  tripDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingTop: 14,
    paddingBottom: 5,
   
   
    flex:1,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  
    marginVertical:5,
    
  },
  tripDetailsLabel: {
    color: '#757575',
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  tripDetailsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driverWaitingApprovalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderRadius: 12,
    flexDirection: 'row',
  },
  driverWaitingApprovalText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: colors.grey_xxdark,
  },
  chevron: {
    fontSize: 20,
    color: '#888',
    fontFamily: Fonts.medium,
    marginLeft: 8,
  },
  cancelBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
  },
});

export default DriverArrivalScreen;

DriverArrivalScreen.propTypes = {
  onCancel: PropTypes.func,
  handleOverlay: PropTypes.func,
};
  