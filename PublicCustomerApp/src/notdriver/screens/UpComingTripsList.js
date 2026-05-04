import {StyleSheet, Text, TouchableOpacity, View, ScrollView} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';
import useDriverStatusStore from '../store/useDriverStatusStore';
import useUserStore from '../../common/store/useUserStore';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import { useTripAcceptStore } from '../store/useTripAcceptStore';
import useTripsStore from '../store/useTripsStore';
import APIRequest from '../../common/APIRequest';
import { showNotification } from '../../common/components/Alerts/showNotification';
import NavBar from '../../common/components/NavBar';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import UseBackButton from '../../common/hooks/UseBackButton';
import { Colors, colors, Fonts } from '../../common/constants/constants';
import { DateTimeFormatter } from '../../common/utils/DateTimeFormatter';
import AddressComponent from '../components/AddressComponent';
import { useTranslation } from 'react-i18next';



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

const UpComingTripsList = () => {
  const {upComingTrips} = useDriverStatusStore();
  const {userInfo} = useUserStore();
  const [trips, setTrips] = useState([]);
  const {goBack, setStackScreen} = useStackScreenStore();
  const {t} = useTranslation()
  const {setUpComingTripDetails} = useTripAcceptStore();
  const [loading, setLoading] = useState(false);
  const {setActiveTripData} = useTripsStore();

  const fetchUpComingTripsDetails = async tripsIds => {
    setLoading(true)
    try {
      const API = new APIRequest();
      const payload = {
        tripIds: tripsIds,
      };
      const response = await API.request(
        '/publicrides/driver/v2/getMultipleTripsDetail',
        'POST',
        payload,
        userInfo.token,
      );
      if (response?.success) {
        setTrips(response.data);
      } else {
        showNotification('Trip Details Not Found', '', 'error');
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching trip details:', error);
      setLoading(false)
    }
  };

  useEffect(() => {
    if (!upComingTrips || upComingTrips.length === 0) return;
    if (upComingTrips) {
      fetchUpComingTripsDetails(upComingTrips);
    }
  }, [upComingTrips]);

  const onStartRide = trip => {
    const tripData = [trip];
    setActiveTripData(tripData);
    console.log('tripData', tripData);
    setStackScreen('PublicDriverTrackingScreen');
  }

  return (
    <View style={styles.screen}>
      <NavBar title={'Upcoming Trips'} onBackPress={() => goBack()} />
      {loading && <FullScreenLoader/>}
      <UseBackButton onBackPress={() => goBack()} />
      {!trips || trips.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 50,
          }}>
          <Text
            style={{
              fontFamily: Fonts.medium,
              fontSize: 16,
              color: Colors.warm_grey,
            }}>
            No Upcoming Trips Found
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{paddingVertical: 20, paddingBottom: 40}}
          showsVerticalScrollIndicator={false}>
          {trips
            ?.sort(
              (a, b) =>
                new Date(a.scheduleDateTime) - new Date(b.scheduleDateTime),
            )
            .map(trip => {
              const countdownMeta = getCountdownMeta(trip?.scheduleDateTime);
              const scheduledAt = DateTimeFormatter.requiredDateFormat(
                trip.scheduleDateTime,
                'DD/MM/YYYY - hh:mm',
              );

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
                countdownMeta.variant === 'critical' ||
                countdownMeta.variant === 'urgent'
                  ? '#FFFFFF'
                  : countdownMeta.variant === 'warning'
                    ? '#B45309'
                    : Colors.periwinkle;

              return (
                <View key={trip._id} style={styles.tripCard}>
                  <View style={styles.headerRow}>
                    <View>
                      <Text style={styles.rideIdLabel}>Ride ID</Text>
                      <Text style={styles.rideIdValue}>
                        {trip?.rideId || '-'}
                      </Text>
                    </View>
                    <View style={badgeContainerStyle}>
                      <Feather name="clock" size={16} color={badgeIconColor} />
                      <Text style={badgeTextStyle}>{countdownMeta.label}</Text>
                    </View>
                  </View>

                  <View style={styles.scheduleCard}>
                    <Feather
                      name="calendar"
                      size={18}
                      color={Colors.periwinkle}
                      style={styles.scheduleIcon}
                    />
                    <View>
                      <Text style={styles.scheduleLabel}>Scheduled At</Text>
                      <Text style={styles.scheduleValue}>{scheduledAt}</Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.cardsContainer}>
                    <View style={[styles.infoCard, styles.distanceCard]}>
                      <View style={styles.cardIconContainer}>
                        <Feather name="map-pin" size={16} color="#FFFFFF" />
                      </View>
                      <Text style={styles.cardValue}>
                        {trip?.estimatedDistance
                          ? formatDistance(trip?.estimatedDistance)
                          : '0.00 km'}
                      </Text>
                      <Text style={styles.cardLabel}>
                        {t('distance') || 'Distance'}
                      </Text>
                    </View>

                    <View style={[styles.infoCard, styles.durationCard]}>
                      <View style={styles.cardIconContainer}>
                        <Feather name="clock" size={16} color="#FFFFFF" />
                      </View>
                      <Text style={styles.cardValue}>
                        {trip?.estimatedDuration
                          ? formatDuration(trip.estimatedDuration)
                          : '0 Mins'}
                      </Text>
                      <Text style={styles.cardLabel}>
                        {t('duration') || 'Duration'}
                      </Text>
                    </View>

                    <View style={[styles.infoCard, styles.fareCard]}>
                      <View style={styles.cardIconContainer}>
                        <FontAwesome name="rupee" size={16} color="#FFFFFF" />
                      </View>
                      <Text style={styles.cardValue}>
                        ₹
                        {trip?.minFare
                          ? parseFloat(trip.minFare).toFixed(2)
                          : '0.00'}
                      </Text>
                            <Text style={styles.cardLabel}>{t('fare') || 'Fare'}</Text>
                    </View>
                  </View>

                  <View style={styles.routeContainer}>
                    <AddressComponent
                      percentage={0}
                      waypoints={trip?.stops || []}
                      deviceLocation={null}
                      isPublicRides={true}
                    />
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.secondaryButton,
                        styles.buttonSpacing,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {setUpComingTripDetails(trip); setStackScreen('UpComingTripsView')}}>
                      <Text
                        style={[
                          styles.actionButtonText,
                          styles.secondaryButtonText,
                        ]}>
                        View
                      </Text>
                      <Feather
                        name="arrow-right"
                        size={18}
                        color={Colors.periwinkle}
                        style={styles.actionButtonIcon}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.primaryButton]}
                      activeOpacity={0.85}
                      onPress={() => onStartRide(trip)}>
                      <Text style={styles.actionButtonText}>Start Ride</Text>
                      <FontAwesome
                        name="road"
                        size={18}
                        color="#FFFFFF"
                        style={styles.actionButtonIcon}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
        </ScrollView>
      )}
    </View>
  );
};

export default UpComingTripsList;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  tripCard: {
    width: '92%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 6},
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rideIdLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.warm_grey,
  },
  rideIdValue: {
    fontFamily: Fonts.semi_bold,
    fontSize: 20,
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
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(125, 95, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
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
  separator: {
    height: 1,
    backgroundColor: '#ECEFF4',
    marginVertical: 18,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
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
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  routeContainer: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#F5F3FF',
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 14,
    color: Colors.periwinkle,
    marginBottom: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
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
  },
  primaryButton: {
    backgroundColor: Colors.bright_orange,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1.2,
    borderColor: Colors.periwinkle,
  },
  buttonSpacing: {
    marginRight: 12,
  },
  actionButtonText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: Colors.periwinkle,
  },
  actionButtonIcon: {
    marginLeft: 8,
  },
});


