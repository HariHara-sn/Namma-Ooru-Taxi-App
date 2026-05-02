import {
  Linking,
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';

import moment from 'moment';
import {useTripAcceptStore} from '../../store/useTripAcceptStore';
import {useMapMarkerStore} from '../../../common/store/useMapMarkerStore';
import {useStackScreenStore} from '../../../common/store/useStackScreenStore';
import {useTranslation} from 'react-i18next';
import {Colors, Fonts} from '../../../common/constants/constants';
import {height} from '../../../common/utils/scalingutils';
import UseBackButton from '../../../common/hooks/UseBackButton';
import CustomeBottomSheet from '../../../common/components/CustomeBottomSheet';
import AddressComponent from '../../components/AddressComponent';
import CancelRideModal from '../../components/CancelModel';
import {firebaselog_tripBooking} from '../../../common/utils/FirebaseAnalytics';
import useTripsStore from '../../store/useTripsStore';
import { DateTimeFormatter } from '../../../common/utils/DateTimeFormatter';
import NavBar from '../../../common/components/NavBar';
import useUserStore from '../../../common/store/useUserStore';
import useDriverStatusStore from '../../store/useDriverStatusStore';
import publicrideDriverApi from '../../api/publicrideDriverApi';
import NOTWSService from '../../../common/controllers/socketServices/NOTSocketServices';

const {NeNativeModule} = NativeModules;

const formatDistance = km => {
  if (km === null || km === undefined || km < 0 || typeof km === 'object')
    return '0.00 Km';
  return `${parseFloat(km).toFixed(1)} Km`;
};

const formatDuration = minutes => {
  if (minutes === null || minutes === undefined || minutes < 0) return '0 Mins';
  return `${minutes} Mins`;
};

const getCountdownMeta = scheduleDateTime => {
  const baseMeta = {
    label: 'N/A',
    variant: 'neutral',
    remainingMs: null,
  };

  if (!scheduleDateTime) {
    return baseMeta;
  }

  const target = moment(scheduleDateTime);
  if (!target.isValid()) {
    return baseMeta;
  }

  const remainingMillis = target.valueOf() - Date.now();
  const clampedMillis = Math.max(remainingMillis, 0);
  const duration = moment.duration(clampedMillis);
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  const totalMinutes = Math.floor(clampedMillis / 60000);

  if (remainingMillis <= 0) {
    return {
      label: 'Starting now',
      variant: 'critical',
      remainingMs: 0,
    };
  }

  let label;
  if (days > 0) {
    label = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    label = `${hours}h ${minutes}m`;
  } else {
    label = `${minutes}m`;
  }

  let variant = 'neutral';
  if (totalMinutes <= 15) {
    variant = 'critical';
  } else if (totalMinutes <= 60) {
    variant = 'urgent';
  } else if (totalMinutes <= 180) {
    variant = 'warning';
  }

  return {
    label,
    variant,
    remainingMs: clampedMillis,
  };
};

const formatScheduledAt = scheduleDateTime => {
  if (!scheduleDateTime) {
    return 'Not scheduled';
  }
  return DateTimeFormatter.requiredDateFormat(
    scheduleDateTime,
    'DD/MM/YYYY - hh:mm A',
  );
};

const UpComingTripsView = () => {
  const {upComingTripDetails, loading, setLoading, setTripId} = useTripAcceptStore();
  const {setDirectionPoints, routeLoading} = useMapMarkerStore();
  const {t} = useTranslation();
  const {goBack, setStackScreen} = useStackScreenStore();
  const countdownMeta = getCountdownMeta(upComingTripDetails?.scheduleDateTime);
  const {setActiveTripData} = useTripsStore();
  const {userInfo} = useUserStore();
  const {upComingTrips, setUpComingTrips} = useDriverStatusStore();
  const scheduledAt = formatScheduledAt(upComingTripDetails?.scheduleDateTime);
  const [cancelRideModalVisible, setCancelRideModalVisible] = useState(false);

  const passengerPhoneRaw = upComingTripDetails?.bookingForPhone || '';
  const passengerPhone = passengerPhoneRaw.replace(/\s|-/g, '');

  const badgeContainerStyle = [
    styles.badge,
    countdownMeta.variant === 'critical'
      ? styles.badgeCritical
      : countdownMeta.variant === 'urgent'
      ? styles.badgeUrgent
      : countdownMeta.variant === 'warning'
      ? styles.badgeWarning
      : styles.badgeNeutral,
  ];

  const badgeTextStyle = [
    styles.badgeText,
    countdownMeta.variant === 'critical'
      ? styles.badgeTextOnDark
      : countdownMeta.variant === 'urgent'
      ? styles.badgeTextOnDark
      : countdownMeta.variant === 'warning'
      ? styles.badgeTextWarning
      : styles.badgeTextNeutral,
  ];

  const badgeIconColor =
    countdownMeta.variant === 'critical' || countdownMeta.variant === 'urgent'
      ? '#FFFFFF'
      : countdownMeta.variant === 'warning'
      ? '#B45309'
      : Colors.periwinkle;

  useEffect(() => {
    if (upComingTripDetails?.stops && upComingTripDetails?.stops.length !== 0) {
      const directions = upComingTripDetails?.stops?.map(direction => {
        return {
          lat: direction.location[1],
          lon: direction.location[0],
        };
      });
      const padding = [50, 50, 50, height * 0.3];
      setDirectionPoints({
        locations: directions,
        type: 'car',
        padding: padding.map(v => parseInt(v, 10)),
      });
    }
  }, [upComingTripDetails]);

  const onGoBack = () => {
    NeNativeModule.clearDirectionPoints();
    goBack();
  };

  const handleCallPassenger = () => {
    if (!passengerPhone) {
      return;
    }
    Linking.openURL(`tel:${passengerPhone}`).catch(error => {
      console.warn('Unable to start call', error);
    });
  };

  const handleEndTrip = async reason => {
    setLoading(true);
    setCancelRideModalVisible(false);
    setLoading(false);
  };

  const onAcceptRide = async () => {
    setLoading(true);
    try {
      const tripId = upComingTripDetails?._id;
      const response = await publicrideDriverApi.startUpComingRide(
        {tripId},
        userInfo?.token,
      );

      if (response?.success) {
        const tripData = response.currentTrip || upComingTripDetails;

        // Update current trip in stores
        setTripId(tripId);
        setActiveTripData([{...tripData, status: 'ACCEPTED'}]);

        // Remove this trip from the upcoming trips list
        setUpComingTrips(
          (upComingTrips || []).filter(
            t => String(t._id) !== String(tripId),
          ),
        );

        // Notify backend socket layer that driver has started the trip
        // NOTWSService.emit('upComingTripStarted', {
        //   tripId,
        //   passangerId: upComingTripDetails?.passangerId,
        //   driverId: userInfo?._id,
        // });

        firebaselog_tripBooking(
          'TB_Driver_Allocation(TB_DA)',
          'TB_DA:trip_accepted_inapp',
        );
        setStackScreen('PublicDriverTrackingScreen');
      }
    } catch (error) {
      console.error('Error starting upcoming ride:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar onBackPress={() => onGoBack()}/>
      <UseBackButton onBackPress={() => onGoBack()} />
      <CustomeBottomSheet useScrollView>
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Passenger Details</Text>
            <View style={badgeContainerStyle}>
              <Feather name="clock" size={16} color={badgeIconColor} />
              <Text style={badgeTextStyle}>{countdownMeta.label}</Text>
            </View>
          </View>
          <View style={styles.passengerRow}>
            <View style={styles.passengerInfo}>
              <Text style={styles.passengerName}>
                {upComingTripDetails?.bookingForName || 'Passenger'}
              </Text>
              <Text style={styles.passengerMeta}>
                {upComingTripDetails?.bookingFor || 'MYSELF'}
              </Text>
              <Text style={styles.passengerMeta}>
                {passengerPhoneRaw || 'Phone not available'}
              </Text>
              {/* <Text style={styles.passengerMeta}>
              {`Vehicle: ${upComingTripDetails?.vehicleType || '-'}`}
            </Text> */}
              <Text style={styles.passengerMeta}>
                {`Payment: ${upComingTripDetails?.paymentMethod || '-'}`}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.contactButton,
                !passengerPhone && styles.contactButtonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleCallPassenger}
              disabled={!passengerPhone}>
              <Feather
                name="phone"
                size={18}
                color={passengerPhone ? '#FFFFFF' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.contactButtonText,
                  !passengerPhone && styles.contactButtonTextDisabled,
                ]}>
                {passengerPhone ? 'Call' : 'No Number'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scheduleSection}>
            <View style={styles.scheduleRow}>
              <Feather
                name="calendar"
                size={18}
                color={Colors.periwinkle}
                style={styles.scheduleIcon}
              />
              <View>
                <Text style={styles.scheduleLabel}>Scheduled Time</Text>
                <Text style={styles.scheduleValue}>{scheduledAt}</Text>
              </View>
            </View>
          </View>
        </View>

        <AddressComponent
          percentage={0}
          waypoints={upComingTripDetails?.stops || []}
          deviceLocation={null}
          isPublicRides={true}
        />
        <View style={styles.cardsContainer}>
          <View style={[styles.infoCard, styles.distanceCard]}>
            <View style={styles.cardIconContainer}>
              <Feather name="map-pin" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.cardValue}>
              {upComingTripDetails?.estimatedDistance
                ? formatDistance(upComingTripDetails?.estimatedDistance)
                : '0.00 km'}
            </Text>
            <Text style={styles.cardLabel}>{t.distance || 'Distance'}</Text>
          </View>

          <View style={[styles.infoCard, styles.durationCard]}>
            <View style={styles.cardIconContainer}>
              <Feather name="clock" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.cardValue}>
              {upComingTripDetails?.estimatedDuration
                ? formatDuration(upComingTripDetails.estimatedDuration)
                : '0 Mins'}
            </Text>
            <Text style={styles.cardLabel}>{t.duration || 'Duration'}</Text>
          </View>

          <View style={[styles.infoCard, styles.fareCard]}>
            <View style={styles.cardIconContainer}>
              <FontAwesome name="rupee" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.cardValue}>
              ₹
              {upComingTripDetails?.minFare
                ? parseFloat(upComingTripDetails.minFare).toFixed(2)
                : '0.00'}
            </Text>
            <Text style={styles.cardLabel}>{t.fare || 'Fare'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          activeOpacity={0.85}
          onPress={() => onAcceptRide()}>
          <Text style={styles.actionButtonText}>Start Ride</Text>
          <FontAwesome
            name="road"
            size={18}
            color="#FFFFFF"
            style={styles.actionButtonIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: Colors.red}]}
          activeOpacity={0.85}
          onPress={() => setCancelRideModalVisible(true)}>
          <Text style={styles.actionButtonText}>Cancel Ride</Text>
          {/* <FontAwesome
          name="road"
          size={18}
          color="#FFFFFF"
          style={styles.actionButtonIcon}
        /> */}
        </TouchableOpacity>
      </CustomeBottomSheet>
      {cancelRideModalVisible && (
        <CancelRideModal
          modalVisible={cancelRideModalVisible}
          setModalVisible={setCancelRideModalVisible}
          callCancelRide={handleEndTrip}
          loading={loading}
          tripData={upComingTripDetails}
        />
      )}
    </>
  );
};

export default UpComingTripsView;

const styles = StyleSheet.create({
  sectionCard: {
    width: '92%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 6},
    elevation: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeading: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: Colors.black,
    letterSpacing: 0.4,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  passengerInfo: {
    flexShrink: 1,
    paddingRight: 16,
  },
  passengerName: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: Colors.black,
    marginBottom: 4,
  },
  passengerMeta: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.warm_grey_two,
    marginBottom: 2,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.periwinkle,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
    elevation: 3,
  },
  contactButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  contactButtonText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  contactButtonTextDisabled: {
    color: '#9CA3AF',
  },
  scheduleSection: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(125, 95, 255, 0.08)',
    padding: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleIcon: {
    marginRight: 12,
  },
  scheduleLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.warm_grey_two,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  scheduleValue: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: Colors.black,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeNeutral: {
    backgroundColor: 'rgba(125, 95, 255, 0.15)',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeUrgent: {
    backgroundColor: '#FB923C',
  },
  badgeCritical: {
    backgroundColor: '#DC2626',
  },
  badgeText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginLeft: 6,
  },
  badgeTextNeutral: {
    color: Colors.periwinkle,
  },
  badgeTextWarning: {
    color: '#B45309',
  },
  badgeTextOnDark: {
    color: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
    backgroundColor: Colors.periwinkle,
    width: '90%',
    alignSelf: 'center',
    marginVertical: 10,
  },
  primaryButton: {
    backgroundColor: Colors.bright_orange,
  },
  actionButtonText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },

  actionButtonIcon: {
    marginLeft: 8,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    width: '90%',
    alignSelf: 'center',
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 90,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  distanceCard: {
    backgroundColor: '#4A90E2', // Blue
  },
  durationCard: {
    backgroundColor: '#50C878', // Green
  },
  fareCard: {
    backgroundColor: '#FF6B6B', // Red/Coral
  },
  cardIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    // marginBottom: 4,
    textAlign: 'center',
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
