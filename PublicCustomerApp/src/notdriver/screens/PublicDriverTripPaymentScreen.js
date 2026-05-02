import {
  ActivityIndicator,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {  useEffect, useState } from 'react';
import Fontisto from 'react-native-vector-icons/Fontisto'
import * as Progress from 'react-native-progress';
import QRCode from "react-qr-code"
import Clipboard from '@react-native-clipboard/clipboard';
import polyline from '@mapbox/polyline'
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather'
import useTripsStore from '../store/useTripsStore';
import useUserStore from '../../common/store/useUserStore';
import usePublicDriverStore from '../store/usePublicDriverStore';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import BottomSheetPopup from '../../common/components/BottomSheetPopup';
import { showNotification } from '../../common/components/Alerts/showNotification';
import { Colors, Fonts } from '../../common/constants/constants';
import CustomeBottomSheet from '../../common/components/CustomeBottomSheet';
import { DateTimeFormatter } from '../../common/utils/DateTimeFormatter';
import AddressComponent from '../components/AddressComponent';
import Polyline from '../../common/map/Polyline';
import PaymentMethod from '../../notdriver/assets/icons/paymentMethod.svg'
import InvoiceScreen from './InvoiceScreen';
import { useTranslation } from 'react-i18next';
import Marker from '../../common/map/Marker';

const paymentMethods = [
  {
    id: 1,
    name: 'Collected By Driver',
    key: 'collected_by_driver',
    value: 0
  },
  {
    id: 2,
    name: 'Sent To Vendor',
    key: 'sent_to_vendor',
    value: 1
  }
]

  const formatDistance = (km) => {
    if (km === null || km === undefined || km < 0 || typeof km === 'object') return '0.00 Km';
    return `${parseFloat(km).toFixed(1)} Km`;
  };

 const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined || minutes <= 0) return '0 Min';
  if (minutes <= 1 || minutes < 2) return '1 Min';
  return `${DateTimeFormatter.formatMinutesToDuration(minutes)}`;
 };
 
const PublicDriverTripPaymentScreen = ({onPaymentReceive, fareDetails, tripDetials, isLoading, isDetailsScreen}) => {
  const {activeTripData, setActiveTripData,  fareBreakDown:rideFare } = useTripsStore();
  const {userInfo} = useUserStore()
  const {bankInfo, driverInfo}= usePublicDriverStore()
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const {driverRole} = usePublicDriverStore()
  const {setGeometries, directionPoints, setDirectionPoints, setMapMarkers} = useMapMarkerStore();
  const [copiedText, setCopiedText] = useState(null);
  const {setStackScreen} = useStackScreenStore()
  const {showPaymentInitiatedLoader, setShowPaymentInitiatedLoader} = usePublicDriverStore()
  const [paymentTimer, setPaymentTimer] = useState(0);
  const [progress, setProgress] = useState(0);

  const {t} = useTranslation()

  const fareBreakDown = fareDetails ? fareDetails?.fareDetails : rideFare?.fareDetails;
  const tripId = fareDetails ? fareDetails?.tripId : activeTripData?.[0]?._id;
  const rideId = tripDetials?.rideId ? tripDetials?.rideId : activeTripData?.[0]?.rideId;
  const feesBreakDown = fareBreakDown?.breakdown?.fees;
  const taxBreakDown = fareBreakDown?.breakdown?.taxes;
  const driverEarnings = fareBreakDown?.breakdown?.driverEarnings;
  const driverDue = fareBreakDown?.breakdown?.driverDue;
  const finalFare = fareBreakDown?.breakdown?.finalFare;
  const couponDiscount = fareBreakDown?.breakdown?.couponDiscount;
  const subtotal = fareBreakDown?.breakdown?.subtotal;
  const distance = rideFare ? activeTripData?.[0]?.finalDistance : tripDetials?.finalDistance;
  const duration = rideFare ? activeTripData?.[0]?.finalDuration : tripDetials?.finalDuration;
  const fare = fareBreakDown?.fare;

  const supplierInfo = rideFare?.supplierInfo ? {
    name: rideFare.supplierInfo.VendorName,
    phone: rideFare.supplierInfo.ownerPhone,
    email: rideFare.supplierInfo.ownerEmail,
    state: rideFare.supplierInfo.state,
    address: rideFare.supplierInfo.fullAddress,
    gstNumber: rideFare.supplierInfo.gst,
    panNumber: rideFare.supplierInfo.companyPANNumber,
  }: {
    name: driverInfo.name || 'N/A',
    phone: driverInfo.phone || 'N/A',
    email: driverInfo.email || 'N/A',
    state: driverInfo.homeLocation?.state || 'N/A',
    address: driverInfo.homeLocation?.address || 'N/A',
    gstNumber: driverInfo.gstNumber || 'N/A',
    panNumber: driverInfo.panNumber || 'N/A',
  };

  const recipient = tripDetials?.recipient ? tripDetials?.recipient : null

  const upiLink = `upi://pay?pa=${bankInfo?.UPIID}&pn=${encodeURIComponent(bankInfo?.accountHolderName)}&am=${fareBreakDown?.fare}&cu=INR`;
  const renderInvoiceModal = () => {
    return (
      <BottomSheetPopup
      visible={isInvoiceModalVisible}
      onClose={() => {
        setIsInvoiceModalVisible(false)
      }}
      driverStyles>
      <View style={styles.centeredView}>
       <InvoiceScreen fareDetails={fareBreakDown} onClose={()=>setIsInvoiceModalVisible(false)} distance={distance} duration={duration} tripDetials={tripDetials} supplierInfo={supplierInfo} recipient={recipient} tripBills={tripDetials?.bills}/>
      </View>
      </BottomSheetPopup>
    )
  }

  const onSubmitPaymentMethod = () => {
    if(selectedPaymentMethod === null) {
      showNotification(t('please_select_a_payment_method'), '', 'danger')
      return
    }
    onPaymentReceive(fareBreakDown, selectedPaymentMethod, selectedPaymentMethod)
    setPaymentMethodModalVisible(false)
  }

  const renderPaymentMethodModal = () => {
    return (
      <BottomSheetPopup
      visible={paymentMethodModalVisible}
      onClose={() => {
        setPaymentMethodModalVisible(false)
      }}
      driverStyles>
        <View style={styles.paymentMethodContainerModal}>
          {paymentMethods.map((item, index) => (
            <TouchableOpacity key={index} style={styles.paymentMethodContainer} onPress={()=>setSelectedPaymentMethod(item.value)}>
              <Fontisto name={selectedPaymentMethod === item.value ? "radio-btn-active" : "radio-btn-passive"} size={24} color={selectedPaymentMethod === item.value ? Colors.periwinkle : Colors.grey_xdark} />
              <Text style={{fontFamily: Fonts.medium, fontSize: 16, color:selectedPaymentMethod === item.value ? Colors.periwinkle : Colors.black}}>{item.key}</Text>
            </TouchableOpacity>
          ))}
          <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
            <TouchableOpacity 
              style={[styles.button, {backgroundColor: Colors.grey_xdark}]} 
              onPress={() => setPaymentMethodModalVisible(false)}>
              <Text style={styles.textStyle}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, {backgroundColor: Colors.periwinkle}]} 
              onPress={onSubmitPaymentMethod}>
              <Text style={styles.textStyle}>{t('submit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
       
    </BottomSheetPopup>
    )
  }

  useEffect(() => {
    let polylineData = null;
    if (activeTripData?.[0]?.encodedPolyline) {
        const decodedData = polyline.decode(activeTripData?.[0]?.encodedPolyline, 6);
        const reversedCoordinates = decodedData.map(([lat, lon]) => [lon, lat]);
        polylineData = new Polyline(
          1,
          `routes`,
          reversedCoordinates,
          "#174EA6",
          'small',
        );
        polylineData.setPadding([200, 230, 200, 400]);
        polylineData.setFocus(true);
        setGeometries([polylineData]);
        const startLocation = reversedCoordinates?.[0];
        const endLocation = reversedCoordinates?.[reversedCoordinates?.length - 1];
        // console.log('startLocation', startLocation);
        // console.log('endLocation', endLocation);
        // const startMarker = new Marker(
        //   'startMarker',
        //   'pickup_point',
        //   startLocation[0],
        //   startLocation[1],
        //   'start_marker',
        //   36,
        //   false,
        // );
        // const endMarker = new Marker(
        //   'endMarker',
        //   'endMarker',
        //   endLocation[0],
        //   endLocation[1],
        //   'end_marker',
        //   36,
        //   false
        // );
        // setMapMarkers([startMarker, endMarker])
    }
    if (directionPoints) {
      setDirectionPoints(null)
    }
    return () => {
      setDirectionPoints(null)
      setGeometries(null)
      setMapMarkers(null)
    }
  }, [activeTripData, directionPoints])

  const copyToClipboard = (upiId) => {
    Clipboard.setString(upiId);
  };

  useEffect(() => {
    const DURATION_MS = 15000;
    let intervalId;
    let start = Date.now();
    if (isDetailsScreen) return;
    if (showPaymentInitiatedLoader) {
      setPaymentTimer(0);
      setProgress(0);
      intervalId = setInterval(() => {
        const elapsed = Date.now() - start;
        const p = Math.min(elapsed / DURATION_MS, 1);
        setProgress(p);
        const secs = Math.min(Math.ceil(elapsed / 1000), 15);
        setPaymentTimer(secs);
        if (elapsed >= DURATION_MS) {
          clearInterval(intervalId);
          // Auto-close modal on completion
          try { setShowPaymentInitiatedLoader(false); } catch (e) {}
        }
      }, 100);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showPaymentInitiatedLoader]);

  const renderPaymentModal = () => {
    return (
      <Modal visible={true} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>Payment Initiated</Text>
            <View>
              <Progress.Circle size={120} thickness={8} progress={progress} color={Colors.periwinkle} unfilledColor="#EEEEEE" borderWidth={0} showsText={false} />
              <View style={styles.progressTextOverlay}>
                <Text style={styles.progressText}>{Math.max(0, 15 - paymentTimer)}s</Text>
              </View>
            </View>
            <Text style={styles.progressSubtitle}>Please wait while we process…</Text>
            <Text style={styles.progressSubtitle}>Please do not close the app, or Go back</Text>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <>
    {showPaymentInitiatedLoader &&
    <View style={{position:'absolute', width:'100%', height:'100%', zIndex:99999, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,0,0,0.5)'}}>
      {renderPaymentModal()}
    </View>
    }
    <View style={styles.Container}>
      <CustomeBottomSheet useScrollView={true}>
        <View style={{paddingBottom: 100}}>
        {/* Fare Hero */}
        <View style={styles.fareContainer}>
          <ImageBackground
            source={require('../../common/assets/images/rideFareBackground.webp')}
            style={styles.fareBackground}
            resizeMode="cover">
            <Text style={styles.fareTxtTitle}>{t('ride_fare')}</Text>
            <Text style={styles.fareTxt}>
              {'₹'}{fareBreakDown?.fare}.<Text style={{fontSize: 16}}>00</Text>
            </Text>
          </ImageBackground>
        </View>

        {/* Booking Info */}
        <View style={styles.bookingInfoCard}>
          <Text style={styles.bookingTime}>
            {tripDetials?.bookingTime || activeTripData?.[0]?.bookingTime ? DateTimeFormatter.requiredDateFormat(activeTripData?.[0]?.bookingTime || tripDetials?.bookingTime, 'DD MMM YYYY, hh:mm A') : ''}
          </Text>
          {rideId ? <Text style={styles.bookingId}>Ride ID: {rideId}</Text> : null}
        </View>

        {/* Help Button */}
        <TouchableOpacity style={styles.helpBtn} onPress={() => setStackScreen('DriverHelpSupport')}>
          <MaterialIcons name="support-agent" size={20} color={Colors.periwinkle} />
          <Text style={styles.helpText}>{t('help') || 'HELP'}</Text>
        </TouchableOpacity>

        {/* Location Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('location_details')}</Text>
          <View style={styles.sectionDivider} />
          <AddressComponent
            percentage={0}
            waypoints={activeTripData?.[0]?.stops || tripDetials?.stops}
            deviceLocation={null}
            isPublicRides={true}
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.cardsContainer}>
          <View style={[styles.infoCard, styles.distanceCard]}>
            <View style={styles.cardIconContainer}>
              <Feather name="map-pin" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.cardValue}>
              {distance ? formatDistance(distance) : '0.00 km'}
            </Text>
            <Text style={styles.cardLabel}>{t('distance') || 'Distance'}</Text>
          </View>
          <View style={[styles.infoCard, styles.durationCard]}>
            <View style={styles.cardIconContainer}>
              <Feather name="clock" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.cardValue}>
              {duration ? formatDuration(duration) : '0 Min'}
            </Text>
            <Text style={styles.cardLabel}>{t('duration') || 'Duration'}</Text>
          </View>
          <View style={[styles.infoCard, styles.fareCard]}>
            <View style={styles.cardIconContainer}>
              <FontAwesome name="rupee" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.cardValue}>
              ₹{fare ? parseFloat(fare).toFixed(2) : '0.00'}
            </Text>
            <Text style={styles.cardLabel}>{t('fare') || 'Fare'}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('payment_details')}</Text>
          <View style={styles.sectionDivider} />
          <View style={styles.feesBreakDownContainer}>
            {couponDiscount !== null && couponDiscount > 0 && (
              <View style={styles.feesBreakDown}>
                <Text style={styles.amountKey}>{t('coupon')}</Text>
                <Text style={[styles.amountValue, {color: Colors.green}]}>- ₹{taxBreakDown?.couponDiscount?.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.feesBreakDown}>
              <Text style={[styles.amountKey, {color: '#E53935'}]}>{t('due')}</Text>
              <Text style={[styles.amountValue, {color: '#E53935'}]}>₹{driverDue?.toFixed(2)}</Text>
            </View>
            <View style={styles.feesBreakDown}>
              <Text style={[styles.amountKey, {color: '#2E7D32'}]}>{t('earnings')}</Text>
              <Text style={[styles.amountValue, {color: '#2E7D32'}]}>₹{driverEarnings?.toFixed(2)}</Text>
            </View>
            <View style={styles.feesBreakDown}>
              <Text style={styles.amountKey}>{t('subtotal')}</Text>
              <Text style={styles.amountValue}>₹{subtotal?.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>{t('total')}</Text>
                <Text style={styles.totalSubLabel}>(inclusive of tax)</Text>
              </View>
              <Text style={styles.totalValue}>₹{finalFare?.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.viewDetailedBtn} onPress={() => setIsInvoiceModalVisible(true)}>
            <Text style={styles.viewDetailedBtnText}>{t('view_detailed')}</Text>
            <Feather name="chevron-right" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Payment Section */}
        {!fareDetails && (
          <View style={styles.paymentSectionCard}>
            <View style={styles.paymentMethodRow}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <PaymentMethod />
                <Text style={styles.paymentMethodLabel}>{t('payment_method')}</Text>
              </View>
              <View style={styles.paymentMethodBadge}>
                <Text style={styles.paymentMethodBadgeText}>{activeTripData?.[0]?.paymentMethod || tripDetials?.paymentMethod}</Text>
              </View>
            </View>

            <View style={styles.qrSection}>
              <Text style={styles.FareAmnt}>₹ {fareBreakDown?.fare?.toFixed(2)}</Text>
              <View style={styles.QrCodeView}>
                <QRCode value={upiLink} size={180} />
              </View>
              <TouchableOpacity style={styles.upiCopyBtn} onPress={() => copyToClipboard(bankInfo?.UPIID)}>
                <Text style={styles.upiCopyBtnText}>{bankInfo?.UPIID}</Text>
                <Feather name="copy" size={15} color={Colors.periwinkle} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity disabled={isLoading} style={styles.receiveBtn} onPress={() => {driverRole === 'dco' ? onPaymentReceive(fareBreakDown, selectedPaymentMethod, selectedPaymentMethod) : setPaymentMethodModalVisible(true)}}>
              {isLoading ? <ActivityIndicator color={Colors.white} /> : (
                <>
                  <Feather name="check-circle" size={18} color={Colors.white} />
                  <Text style={styles.receiveBtnTxt}>{t('payment_received')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        </View>
      </CustomeBottomSheet>
      {isInvoiceModalVisible && renderInvoiceModal()}
      {paymentMethodModalVisible && renderPaymentMethodModal()}
    </View>
     </>
  );
};

export default PublicDriverTripPaymentScreen;

const styles = StyleSheet.create({
  Container: {
    flex: 1,
  },
  /* Fare Hero */
  fareContainer: {
    width: '92%',
    alignSelf: 'center',
    height: 110,
    overflow: 'hidden',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  fareBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fareTxtTitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fareTxt: {
    fontFamily: Fonts.semi_bold,
    color: Colors.white,
    textAlign: 'center',
    fontSize: 32,
    marginTop: 2,
  },
  /* Booking Info */
  bookingInfoCard: {
    alignItems: 'center',
    marginTop: 14,
  },
  bookingTime: {
    fontFamily: Fonts.medium,
    color: Colors.black,
    fontSize: 14,
    textAlign: 'center',
  },
  bookingId: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 3,
  },
  /* Help */
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.periwinkle,
    marginVertical: 10,
  },
  helpText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 13,
    color: Colors.periwinkle,
  },
  /* Section Card */
  sectionCard: {
    width: '92%',
    alignSelf: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontFamily: Fonts.semi_bold,
    color: Colors.black,
    fontSize: 15,
    marginBottom: 6,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 10,
  },
  /* Stats Cards */
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  infoCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  distanceCard: {
    backgroundColor: '#4A90E2',
  },
  durationCard: {
    backgroundColor: '#50C878',
  },
  fareCard: {
    backgroundColor: '#FF6B6B',
  },
  cardIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    marginBottom: 3,
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
  /* Payment Details */
  feesBreakDownContainer: {
    gap: 8,
  },
  feesBreakDown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  amountKey: {
    fontFamily: Fonts.medium,
    color: Colors.black,
    fontSize: 14,
  },
  amountValue: {
    fontFamily: Fonts.semi_bold,
    fontSize: 14,
    color: Colors.black,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: Colors.periwinkle,
  },
  totalSubLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: '#9E9E9E',
  },
  totalValue: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: Colors.periwinkle,
  },
  viewDetailedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.periwinkle,
    borderRadius: 24,
    paddingVertical: 11,
    marginTop: 14,
  },
  viewDetailedBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.white,
  },
  /* Payment Section */
  paymentSectionCard: {
    width: '92%',
    alignSelf: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentMethodLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.black,
  },
  paymentMethodBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  paymentMethodBadgeText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#2E7D32',
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  FareAmnt: {
    fontFamily: Fonts.semi_bold,
    fontSize: 24,
    color: Colors.periwinkle,
    textAlign: 'center',
    marginBottom: 14,
  },
  QrCodeView: {
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  upiCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F0FF',
    marginTop: 14,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  upiCopyBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.periwinkle,
  },
  receiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.periwinkle,
    borderRadius: 28,
    paddingVertical: 14,
    marginTop: 20,
    elevation: 3,
    shadowColor: Colors.periwinkle,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  receiveBtnTxt: {
    fontFamily: Fonts.semi_bold,
    fontSize: 15,
    color: Colors.white,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    width: '80%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  progressTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: Colors.black,
    marginBottom: 12,
  },
  progressSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#757575',
    marginTop: 12,
  },
  progressTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.black,
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    width: '45%',
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  paymentMethodContainer:{
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    width: '100%',
    gap: 10,
  },
  paymentMethodContainerModal:{
    width: '75%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    gap: 12,
  },
  paymentTimer:{
    width:'90%',
    height:100,
    backgroundColor:Colors.white,
    alignSelf:'center',
  },
});
