import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomeBottomSheet from '../../common/components/CustomeBottomSheet';

const driverImage = require('../../notCustomer/assets/image/ContinueAsDriver.webp');
const actingDriverImage = require('../../common/assets/images/acting_driver.webp');

import SideDrawerPublicRides from '../components/SideDrawerPublicRides';
import TrackingMapIcons from '../../common/components/Alerts/TrackingMapIcons';
import StatusModal from '../components/StatusModal';
import TotalTrips from '../assets/icons/totalTrips.svg';
import TotalEarnings from '../assets/icons/totalEarnings.svg';

import useDriverStatusStore from '../store/useDriverStatusStore';
import useUserStore from '../../common/store/useUserStore';
import useDeviceTokenStore from '../../common/store/useDeviceTokenStore';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import APIRequest from '../../common/APIRequest';
import { DateTimeFormatter } from '../../common/utils/DateTimeFormatter';
import { DataStore } from '../../common/controllers/DataStore';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import locationTask from '../../common/controllers/GetCurrentLocation';
import { showNotification } from '../../common/components/Alerts/showNotification';
import { Colors, Fonts } from '../../common/constants/constants';

// ─── Mode promo cards config ───────────────────────────────────────────────────
const MODE_CARDS = {
  dco: {
    mode: 'dco',
    title: 'Become a Driver',
    tagline: 'Own your vehicle. Earn on every trip.',
    description:
      'Register your own vehicle, complete document verification and start accepting ride requests from passengers near you.',
    icon: 'drive-eta',
    iconBg: Colors.blue_xxlight,
    iconColor: Colors.electric_blue,
    bullets: [
      { icon: 'directions-car', text: 'Use your own vehicle' },
      { icon: 'attach-money', text: 'Keep more of what you earn' },
      { icon: 'star', text: 'Build your ratings & reputation' },
    ],
    cta: 'Add My Vehicle',
    screen: 'DocumentCenter',
  },
  acting_driver: {
    mode: 'acting_driver',
    title: 'Become an Acting Driver',
    tagline: "Drive clients' vehicles. Zero asset cost.",
    description:
      "Get matched with customers who need a trusted driver for their own vehicle — perfect if you don't own a car.",
    icon: 'swap-horiz',
    iconBg: Colors.yellow_xlight,
    iconColor: Colors.yellow_orange,
    bullets: [
      { icon: 'no-crash', text: 'No vehicle of your own needed' },
      { icon: 'schedule', text: 'Flexible hours, work when you want' },
      { icon: 'verified-user', text: 'Background-verified & trusted' },
    ],
    cta: 'Get Started',
    screen: 'DrivingExperienceScreen',
  },
};

const DriverMapScreenV2 = (props) => {
  const { isLoading, approved, blocked, isBankVerified, refreshStatus, modes } = props;


  // ─── earnings ──────────────────────────────────────────────────────────────
  const { userInfo, setPendingDriverMode } = useUserStore();
  const [startDate, endDate] = DateTimeFormatter.getTodaysStartEndTime();
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);
  const [summaryModal, setSummaryModal] = useState(false);

  // ─── online / offline ──────────────────────────────────────────────────────
  const { driverStatus, setDriverStatus } = useDriverStatusStore();
  const { userLocation } = useMapMarkerStore();
  const { setStackScreen } = useStackScreenStore();
  const {
    hasLocationPermission,
    hasBackgroundLocationPermission,
    hasNotificationPermission,
    hasOverlayPermission,
    overlayCheckSupported,
  } = useDeviceTokenStore();
  const [statusLoading, setStatusLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  // ─── mode bottom sheet ────────────────────────────────────────────────────
  const hasDco = Array.isArray(modes) && modes.includes('dco');
  const hasActingDriver = Array.isArray(modes) && modes.includes('acting_driver');
  const missingModes = [!hasDco && 'dco', !hasActingDriver && 'acting_driver'].filter(Boolean);
  const [sheetDismissed, setSheetDismissed] = useState(false);
  const showSheet = missingModes.length > 0 && !sheetDismissed;

  // ─── fetch today's earnings ────────────────────────────────────────────────
  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const api = new APIRequest();
      const response = await api.request(
        `/publicrides/payments/driver/get-Payments?page=1&limit=0&tripStatus=all&startTime=${startDate}&endTime=${endDate}`,
        'GET',
        {},
        userInfo?.token,
      );
      if (response.success) {
        setTotalEarnings(response?.totalEarnings);
        setTotalTrips(response?.count);
      }
    } catch (error) {
      console.error('fetchPayments error:', error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // ─── online / offline toggle ───────────────────────────────────────────────
  const handleStatusPress = () => {
    const next = driverStatus === 'online' ? 'offline' : 'online';
    if (next === 'online') {
      const isAndroid28 = Platform.OS === 'android' && Platform.Version <= 28;
      const overlayOk = overlayCheckSupported ? hasOverlayPermission : true;
      const hasAll = isAndroid28
        ? hasLocationPermission && hasNotificationPermission && overlayOk
        : hasLocationPermission && hasBackgroundLocationPermission && hasNotificationPermission && overlayOk;
      if (!hasAll) {
        setStackScreen('DriverPermissionScreen');
        return;
      }
    }
    setPendingStatus(next);
    setConfirmModal(true);
  };

  const confirmStatusUpdate = async () => {
    setConfirmModal(false);
    if (!userLocation) {
      await locationTask.getCurrentLocation();
      showNotification('Fetching Current Location', '', 'info');
      return;
    }
    setStatusLoading(true);
    try {
      const api = new APIRequest();
      const response = await api.request(
        '/publicrides/driver/v2/updatePublicRidesDriverStatus',
        'POST',
        { status: pendingStatus, location: { lat: userLocation?.[0], lon: userLocation?.[1] } },
        userInfo?.token,
      );
      if (response?.success) {
        showNotification(response?.message, '', 'success');
        setDriverStatus(pendingStatus);
        const updated = { ...userInfo, driverStatus: { status: pendingStatus, updatedOn: Date.now() } };
        await DataStore.storeData('userdetails', updated);
        if (pendingStatus === 'online') {
          BGLocationTask.runDriverBgTask();
        } else {
          BGLocationTask.stopDriverBgTask();
        }
      }
    } catch (err) {
      console.error('status update error:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const isOnline = driverStatus === 'online';

  const renderModeCard = (modeKey) => {
    const card = MODE_CARDS[modeKey];
    if (!card) return null;
    const isDco = modeKey === 'dco';
    const imgSrc = isDco ? driverImage : actingDriverImage;
    return (
      <View key={modeKey} style={[styles.welcomeCard, isDco ? styles.dcoCard : styles.actingCard]}>
        {/* top row: text left | image right */}
        <View style={styles.wCardTopRow}>
          <View style={styles.wCardBody}>
            <Text style={styles.wCardLabel}>{isDco ? 'Become a' : 'Become an'}</Text>
            <Text style={styles.wCardTitle}>{isDco ? 'Driver' : 'Acting Driver'}</Text>
          </View>
          <Image source={imgSrc} style={styles.wCardImage} resizeMode="contain" />
        </View>

        {/* bottom: description + full-width CTA */}
        <Text style={styles.wCardDesc}>{card.description}</Text>
        <TouchableOpacity
          style={styles.wCtaBtn}
          activeOpacity={0.85}
          onPress={() => {
            setSheetDismissed(true);
            setPendingDriverMode(isDco ? 'driver' : 'acting_driver');
            setStackScreen('DocumentCenter');
          }}>
          <Text style={styles.wCtaTxt}>{card.cta}</Text>
          <MaterialIcons name="arrow-forward" size={16} color={isDco ? '#0F223C' : '#3B2C6E'} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderModeSheet = () => {
    if (!showSheet) return null;
    const snapPt = missingModes.length > 1 ? ['80%', '95%'] : ['50%', '65%'];
    return (
      <CustomeBottomSheet useScrollView snapPoints={snapPt}>
        <View style={styles.sheetContent}>
          {/* heading */}
          {/* <View style={styles.sheetHeaderRow}> */}
            {/* <View>
              <Text style={styles.sheetHeading}>Unlock More Earnings</Text>
              <Text style={styles.sheetSubHeading}>Choose a mode to get started</Text>
            </View> */}
            {/* <TouchableOpacity onPress={() => setSheetDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={Colors.warm_grey} />
            </TouchableOpacity> */}
          {/* </View> */}

          {/* one or two cards */}
          {missingModes.map(renderModeCard)}
        </View>
      </CustomeBottomSheet>
    );
  };

  return (
    <>
      {/* ── dark header background bar ─────────────────────────────────────── */}
      <View style={styles.headerBg} />

      {/* ── side drawer (renders its own hamburger at top-left absolutely) ──── */}
      <SideDrawerPublicRides />

      {/* ── earnings pill – centred in header ─────────────────────────────── */}
      <View style={styles.earningsWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.earningsBtn}
          disabled={paymentsLoading}
          onPress={() => setSummaryModal(true)}>
          {paymentsLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.earningsTxt}>
              <Text style={{ color: Colors.yellow }}>₹ </Text>
              {totalEarnings ? totalEarnings.toFixed(2) : '0.00'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── online / offline toggle – right side of header ─────────────────── */}
      <View style={styles.statusWrapper}>
        <TouchableOpacity
          style={[styles.statusBtn, { backgroundColor: isOnline ? Colors.green : Colors.battleship_grey }]}
          onPress={handleStatusPress}
          disabled={statusLoading}>
          {statusLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? Colors.battery_green : Colors.cool_grey }]} />
              <Text style={styles.statusTxt}>{isOnline ? 'Online' : 'Offline'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── tracking / map icons – below header, right aligned ─────────────── */}
      <View style={styles.mapIconsContainer}>
        <TrackingMapIcons markersData={[]} ishomeDriver modes={modes} />
      </View>

      {/* ── today summary modal ────────────────────────────────────────────── */}
      <StatusModal
        isVisible={summaryModal}
        animationType="fade"
        onClose={() => setSummaryModal(false)}
        onBackDropPress={() => setSummaryModal(false)}
        additionalContainerStyles={{ alignItems: '' }}>
        <View>
          <Text style={styles.summaryTitle}>Today Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <TotalTrips />
              <Text style={styles.summaryValue}>{totalTrips}</Text>
              <Text style={styles.summaryLabel}>Today Trips</Text>
            </View>
            <View style={styles.summaryCard}>
              <TotalEarnings />
              <Text style={styles.summaryValue}>
                ₹{totalEarnings ? totalEarnings.toFixed(2) : '0.00'}
              </Text>
              <Text style={styles.summaryLabel}>Today Earnings</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setSummaryModal(false)} style={styles.closeBtn}>
            <Text style={styles.closeBtnTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </StatusModal>

      {/* ── mode unlock bottom sheet ─────────────────────────────────────── */}
      {renderModeSheet()}

      {/* ── online / offline confirmation modal ───────────────────────────── */}
      <StatusModal
        isVisible={confirmModal}
        animationType="fade"
        onClose={() => setConfirmModal(false)}
        onBackDropPress={() => setConfirmModal(false)}
        onRightPress={confirmStatusUpdate}
        rightBtnText={pendingStatus === 'online' ? 'Go Online' : 'Go Offline'}
        leftBtnTxt="Cancel">
        <View>
          <Text style={styles.summaryTitle}>
            {pendingStatus === 'online' ? 'Go Online?' : 'Go Offline?'}
          </Text>
          <Text style={styles.confirmSubTxt}>
            {pendingStatus === 'online'
              ? 'You will start receiving trip requests.'
              : 'You will stop receiving trip requests.'}
          </Text>
        </View>
      </StatusModal>
    </>
  );
};

export default DriverMapScreenV2;

const styles = StyleSheet.create({
  // header
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(10,10,10,0.82)',
    zIndex: 0,
  },
  earningsWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  earningsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    backgroundColor: Colors.black,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsTxt: {
    fontFamily: Fonts.medium,
    color: Colors.white,
    fontSize: 18,
  },
  // status toggle
  statusWrapper: {
    position: 'absolute',
    top: 17,
    right: 10,
    zIndex: 2,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTxt: {
    fontFamily: Fonts.medium,
    color: Colors.white,
    fontSize: 13,
  },
  // map icons
  mapIconsContainer: {
    position: 'absolute',
    right: 10,
    top: 82,
    zIndex: 1,
  },
  // summary modal
  summaryTitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 24,
    marginVertical: 8,
  },
  summaryCard: {
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.black,
  },
  summaryLabel: {
    fontFamily: Fonts.light,
    fontSize: 13,
    color: Colors.warm_grey,
  },
  closeBtn: {
    marginTop: 12,
    alignSelf: 'center',
  },
  closeBtnTxt: {
    fontFamily: Fonts.medium,
    color: Colors.electric_blue,
    fontSize: 14,
  },
  // confirm modal
  confirmSubTxt: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.warm_grey,
    textAlign: 'center',
    marginTop: 4,
  },
  // ── mode bottom sheet ──────────────────────────────────────────────────────
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetHeading: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.black,
  },
  sheetSubHeading: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.warm_grey,
    marginTop: 2,
  },
  welcomeCard: {
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#00000040',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  dcoCard: {
    backgroundColor: '#0F223C',
  },
  actingCard: {
    backgroundColor: '#3B2C6E',
  },
  wCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wCardBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  wCardLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  wCardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: Colors.white,
    lineHeight: 28,
  },
  wCardImage: {
    width: 80,
    height: 80,
  },
  wCardDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 19,
    marginBottom: 14,
  },
  wCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 11,
  },
  wCtaTxt: {
    fontFamily: Fonts.semi_bold,
    fontSize: 14,
    color: Colors.black,
  },
  // card (shared sub-elements kept for bulletList etc.)
  cardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.black,
    marginBottom: 3,
  },
  cardTagline: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.warm_grey,
  },
  cardDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.battleship_grey,
    lineHeight: 21,
    marginBottom: 14,
  },
  bulletList: {
    gap: 10,
    marginBottom: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.pale_grey_two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletTxt: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.black,
    flex: 1,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  ctaBtnTxt: {
    fontFamily: Fonts.semi_bold,
    fontSize: 15,
    color: Colors.white,
  },
});