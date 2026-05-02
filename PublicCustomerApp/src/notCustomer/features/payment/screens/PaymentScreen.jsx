import React, { useState ,useEffect, useRef } from 'react';
import { ScrollView, View, StyleSheet ,Text,TouchableOpacity, ActivityIndicator, Animated, Dimensions, BackHandler, Platform } from 'react-native';
import FareHeader from '../../rideHistory/components/FareHeader';
import TripMetaInfo from '../../rideHistory/components/TripMetaInfo';
import TripPersonVehicle from '../../rideHistory/components/TripPersonVehicle';
import TripStats from '../../rideHistory/components/TripStats';
import AddressContainer from '../../../components/Trips/AddressContainer';
import {Fonts} from '../../../constants/constants';
import { useTranslation } from 'react-i18next'; 
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { colors } from '../../../constants/constants';
import InvoiceScreen from '../../rideHistory/screens/InvoiceScreen';
import {utils} from '../../../utils/Utils';
import { DataStore } from '../../../controllers/DataStore';
import PREF from '../../../storage/PREF';
import { getTripDetails } from '../../../API/EndPoints/EndPoints';
import SkeletonLoader from '../../../components/Loaders/SkeletonLoader';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import usePaymentStore from '../store/usePaymentStore';
import { getPresignedImageUrl } from '../../../../common/utils/getPresignedImageUrl';
import ScrollHintChevron from '../../../components/Common/ScrollHintChevron';
import { createOrder } from '../../../API/EndPoints/EndPoints';
import RazorpayCheckout from 'react-native-razorpay';
import Config from "react-native-config";

import { showNotification } from '../../../components/NotificationManger';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import  useUserInfoStore  from '../../../../common/store/useUserInfoStore';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import useConfigStore from '../../../store/useConfigStore'; 
import { openFeedback } from '../../../utils/feedback';
import DroppedButPaymentPendingLongtime from '../../../components/DroppedButPaymentPendingLongtime';
import { firebaselog_tripCompletion,firebaselog_tripPayment } from '../../../../common/utils/FirebaseAnalytics';

const PaymentScreen = ({lastTripId=null}) => {

  const {t} = useTranslation();
  const {currentTripId,tripStatus,rideId,tripFare,tripDistance,tripDuration,driverDetails,vehicleDetails,paymentMethod,isLoading,setTripDetails,tripStops,fareDetails,bookingTime,supplierDetails,recipientDetails,adminDetails,paymentStatus,invoiceId, razorPayAccountId } = usePaymentStore();
  const { userdetails } = useUserInfoStore();
  const userToken = userdetails?.token || null;
  const [driverPhotoUri, setDriverPhotoUri] = useState(null);

  useEffect(() => {
    let isActive = true;
    const fetchPhoto = async () => {
      const trimmed = driverDetails?.driverPhoto?.trim();
      if (!trimmed || !userToken) {
        setDriverPhotoUri(null);
        return;
      }
      const normalizedKey = trimmed.replace(/^https?:\/\/[^/]+\/?/, '').replace(/^\//, '');
      try {
        const signedUrl = await getPresignedImageUrl(normalizedKey, userToken);
        if (isActive) setDriverPhotoUri(signedUrl || null);
      } catch {
        if (isActive) setDriverPhotoUri(null);
      }
    };
    fetchPhoto();
    return () => { isActive = false; };
  }, [driverDetails?.driverPhoto, userToken]);
  const [showInvoice, setShowInvoice] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const overlayAnim = useRef(new Animated.Value(screenHeight)).current;
  const [svHeight, setSvHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPGConfirm, setShowPGConfirm] = useState(false);
  const [showDroppedPaymentPending, setShowDroppedPaymentPending] = useState(false);
  const { appConfig } = useConfigStore();
  const isPaymentGateway = appConfig?.PAYMENT_METHODS === "PG" && razorPayAccountId;
  // Toggle to show the pre-payment confirmation modal
  const showModel = true; // set to false to skip confirmation
  // Config: control whether gateway fee is added to shown fare before clicking PAY
  const showGateFeeAddedFare = false;
  const {setStackScreen , reset} = useStackScreenStore();
  const { incrementTotalSpend,incrementCompletedTrips } = useUserInfoStore();
  const animateIn = () => {
    Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = (onEnd) => {
    Animated.timing(overlayAnim, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (onEnd) onEnd();
    });
  };

  const handleInvoicePress = () => {
    overlayAnim.setValue(screenHeight);
    setShowInvoice(true);
    requestAnimationFrame(animateIn);
  };
 
  const handleInvoiceClose = () => {
    animateOut(() => setShowInvoice(false));
  };

  console.log(driverDetails,"driverDetails")
  console.log(appConfig?.PAYMENT_METHODS,"appConfig")

  const fetchTripDetails = async () => {
    const currentTripId = await DataStore.loadData(PREF.CURRENT_TRIP);

    const id = lastTripId || currentTripId?.data;
    if(!id){
      reset()
      return;
    }
    const tripDetails = await getTripDetails(id);
    
    if(tripDetails?.success){
      setTripDetails(tripDetails);
    }
  }

  useEffect(()=>{
    fetchTripDetails();
  },[])
  useEffect(()=>{
    if(driverDetails){
      console.log(driverDetails,"driverDetails")
    }
  },[driverDetails])

  const onFeedbackPress = () => {
      try {
        const stops = Array.isArray(tripStops) ? tripStops : [];
        const startStop = stops.length > 0 ? stops[0] : undefined;
        const endStop = stops.length > 0 ? stops[stops.length - 1] : undefined;
        const pickupCoords = startStop?.location; // expected [lon, lat]
        const dropCoords = endStop?.location; // expected [lon, lat]
        const distanceKm = typeof tripDistance === 'number' ? String(tripDistance) : tripDistance;
        const tripId = currentTripId;
        const estimatedFare = tripFare;
  
        openFeedback({
          screenName: 'RideStatus',
          initialValues: {
            tripId,
            tripStartName: startStop?.address || '',
            tripEndName: endStop?.address || '',
            tripDistanceKm: 1,
            pickupCoords,
            dropCoords,
            estimatedFare: estimatedFare || '',
          },
        });
      } catch (e) {
        // silent fail
      }
    };

  useFocusEffect(
    React.useCallback(() => {
      const handleBackPress = () => {
        if (showInvoice) {
          handleInvoiceClose();
          return true;
        }

        if (Platform.OS === 'android') {
          BackHandler.exitApp();
          return true;
        }

        return false;
      };

      const backHandlerSub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandlerSub.remove();
    }, [showInvoice]),
  );

  const formatDate = (timestamp) => {
    return utils.formatDateAndTime(timestamp);
  };

  // Derived fare calculations for online payment method
  const baseFare = Number(tripFare) || 0;
  const isOnlinePayment = true;
  // Dynamic percentages from appConfig (fallback to 18% fee, 4% GST)
  const gatewayFeePercent = Number(appConfig?.GATEWAY_FEE_PERCENT) || 2;
  const gatewayFeeGSTPercent = Number(appConfig?.GATEWAY_FEE_GST_PERCENT) || 18;
  const gatewayFeeRate = gatewayFeePercent / 100;
  const gstRateOnGateway = gatewayFeeGSTPercent / 100; // GST applied on gateway fee
  // Gateway fee calculated on base fare, GST calculated on gateway fee
  const gatewayFee = isOnlinePayment ? +(baseFare * gatewayFeeRate).toFixed(2) : 0;
  const gstAmount = isOnlinePayment ? +(gatewayFee * gstRateOnGateway).toFixed(2) : 0;
  const totalPayable = isOnlinePayment ? +(baseFare + gatewayFee + gstAmount).toFixed(2) : baseFare;
  // The fare shown on UI prior to payment depends on config
  const displayedFare = isOnlinePayment && showGateFeeAddedFare ? totalPayable : baseFare;

  const shouldShowScrollHint = contentHeight > svHeight + 20 ;

  // Decide whether to show the "Dropped but payment pending" modal
  useEffect(() => {
    try {
      const lastStop = Array.isArray(tripStops) && tripStops.length ? tripStops[tripStops.length - 1] : null;
      const droppedAt = lastStop?.updatedAt || null;
      const eligibleStatus = tripStatus === 'DROPPED' || (tripStatus === 'CANCELLED' && !!fareDetails);
      if (eligibleStatus && droppedAt) {
        const longAgo = utils.isTripDroppedBeyondFeedbackWindow(droppedAt,30);
        setShowDroppedPaymentPending(!!longAgo);
      } else {
        setShowDroppedPaymentPending(false);
      }
    } catch (e) {
      setShowDroppedPaymentPending(false);
    }
  }, [tripStops, tripStatus, fareDetails]);

  const modalTripBundle = React.useMemo(() => ({
    _id: currentTripId,
    stops: tripStops,
    fareDetails: fareDetails,
    finalDistance: tripDistance,
    finalDuration: tripDuration,
    bookingTime: bookingTime,
  }), [currentTripId, tripStops, fareDetails, tripDistance, tripDuration, bookingTime]);

  const handlePayNow = () => {
    if (isProcessingPayment) return; // Prevent double tap
    // Show confirmation modal before proceeding to order and Razorpay, based on flag
    if (showModel && isOnlinePayment) {
      setShowPGConfirm(true);
    } else {
      proceedPaymentWithPG();
    }
  }

  const proceedPaymentWithPG = async () => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);

    try {
      console.log(driverDetails,"driverDetails")
      const driveracountNumber = driverDetails?.razorPayId;
      if(!driveracountNumber){
        showNotification(t('driver_account_number_not_found'),t('please_contact_support'),"error");
        setIsProcessingPayment(false);
        return;
      }

      const splitAmount = fareDetails?.breakdown?.driverEarnings?.toFixed(2);

      const receiptId = `Rept-${rideId}`;

      const transfer=[
        {
          "account": driveracountNumber,
          "amount": splitAmount*100,
          "currency": "INR",
        },
      ]
      const response = await createOrder({
        amount: totalPayable,
        currency: 'INR',
        receiptId: receiptId,
        transferList:transfer,
        tripId:currentTripId,
      });
      console.log(response,"response")

      if(response?.success){
        firebaselog_tripCompletion('TP_Razorpay(TP_R)',`TP_R:order_created`);
        const orderId = response?.order?.id;
        const amount = response?.order?.amount;
        if (!orderId) {
          showNotification(t('order_creation_failed'),t('please_try_again'),"error");
          setIsProcessingPayment(false);
          return;
        }
        
        try{
          const options = {
            description: 'Trip Fare',
            image: 'https://virtualmaze.com/images/Logo-header.svg',
            currency: 'INR',
            key:appConfig?.RAZORPAY_KEY_ID,
            amount: amount,
            name: appConfig?.COMPANYNAME,
            order_id: orderId, // Replace this with an order_id created using Orders API.
            theme: { color: 'black' },
          };

          RazorpayCheckout.open(options)
            .then((data) => {
              firebaselog_tripCompletion('TP_Method(TP_M)',`TP_M:razorpay`);
              firebaselog_tripCompletion('TP_Razorpay(TP_R)',`TP_R:paid`);
              firebaselog_tripPayment('TP_complete', `TP_R:TP_complete`)
              console.log(JSON.stringify(data,null,2),"data")
              incrementTotalSpend(totalPayable)
              incrementCompletedTrips()
              setStackScreen('TripFeedbackScreen',{});
              // handle success
              // showNotification(t('payment_successful'),"","success");
              setIsProcessingPayment(false);
              setShowPGConfirm(false);
            })
            .catch((error) => {
              // handle failure
              firebaselog_tripCompletion('TP_Razorpay(TP_R)',`TP_R:failed`);
              showNotification(t('payment_failed'),error?.message || t('something_went_wrong'),"error");
              setIsProcessingPayment(false);
              setShowPGConfirm(false);
            });
        } 
        catch (error) {
          showNotification(t('payment_failed'),t('something_went_wrong'),"error");
          setIsProcessingPayment(false);
          setShowPGConfirm(false);
        } 
      } else {
        setIsProcessingPayment(false);
        showNotification(t('make_online_payment_failed'), t('please_try_again'),"error");
      }
    } catch (err) {
        showNotification(t('make_online_payment_failed'), t('please_try_again'),"error");
    
      setIsProcessingPayment(false);
      setShowPGConfirm(false);
    }
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ScrollView contentContainerStyle={[styles.scrollContent,{gap:20}]} showsVerticalScrollIndicator={false}>
          <SkeletonLoader height={80} borderRadius={10} />
          <View style={{ height: 16 ,justifyContent:"center",alignItems:"center",marginVertical:10}} >
            <SkeletonLoader height={18} width={'60%'} borderRadius={6} />
            <View style={{ height: 10 }} />
            <SkeletonLoader height={14} width={'40%'} borderRadius={6} />
          </View>

          <View style={{ height: 16 }} />
          <SkeletonLoader height={200} borderRadius={10} />

          <View style={{ height: 16 }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SkeletonLoader height={100} width={'32%'} borderRadius={10} />
            <SkeletonLoader height={100} width={'32%'} borderRadius={10} />
            <SkeletonLoader height={100} width={'32%'} borderRadius={10} />
          </View>

          <View style={{ height: 16 }} />
          <View style={styles.paymentMethodContainer}>
            <SkeletonLoader height={18} width={'50%'} borderRadius={6} />
            <View style={{ height: 12 }} />
            <View style={styles.paymentMethodKeyContainer}>
              <SkeletonLoader height={14} width={'30%'} borderRadius={6} />
              <SkeletonLoader height={14} width={'30%'} borderRadius={6} />
            </View>
            <View style={styles.paymentMethodKeyContainer}>
              <SkeletonLoader height={14} width={'30%'} borderRadius={6} />
              <SkeletonLoader height={14} width={'30%'} borderRadius={6} />
            </View>
          </View>

          <View style={{ height: 8 }} />
          <View style={styles.actionButtonsContainer}>
            <View style={{ flex: 1 }}>
              <SkeletonLoader height={52} borderRadius={10} />
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onLayout={(e) => setSvHeight(e.nativeEvent.layout.height)}
          onContentSizeChange={(w, h) => setContentHeight(h)}
        >
          <FareHeader fare={displayedFare}  RideStatus={tripStatus == "CANCELLED" ? t('ride_was_cancelled_midway') : t('destination_reached')}  />
         
          <TripMetaInfo date={formatDate(bookingTime)} tripId={rideId} />
          <AddressContainer directions={tripStops}  completed={true}/>
          <TripPersonVehicle driverName={driverDetails?.driverName} driverPhoto={driverPhotoUri} vehicleType={driverDetails?.vehicleType} vehicleBrand={driverDetails?.vehicleBrand} vehicleModel={driverDetails?.vehicleModel} vehicleNumber={driverDetails?.vehicleNumber} />
          <View style={{marginVertical:15}}> 
            <TripStats totalDistance={tripDistance} totalDuration={tripDuration} totalFare={displayedFare} />
          </View>

          <TouchableOpacity style={styles.feedbackButton} onPress={onFeedbackPress}>
            <MaterialIcons name="feedback" size={20} color={colors.white} />
            <Text style={styles.feedbackButtonText}>{t('give_feedback')}</Text>
          </TouchableOpacity>
          {isOnlinePayment && showGateFeeAddedFare && (
            <>
            </>
          )}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.invoiceButton} onPress={handleInvoicePress}>
              <FontAwesome5 name="file-invoice" size={20} color={colors.black} />
              <AdaptiveText style={styles.invoiceButtonText}>{t('show_invoice')}</AdaptiveText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {isPaymentGateway && !isLoading && (
        <View style={styles.bottomBar}>
          {shouldShowScrollHint && (
            <ScrollHintChevron direction='down' style={{ top: -30, alignSelf: 'center' }} />
          )}
          <TouchableOpacity
            style={[styles.bottomButton, isProcessingPayment && { opacity: 0.7 }]}
            onPress={handlePayNow}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <AdaptiveText style={styles.bottomButtonText}>PAY NOW</AdaptiveText>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      {/* Invoice Overlay */}
      {showInvoice && (
        <Animated.View style={[styles.overlayContainer, { transform: [{ translateY: overlayAnim }] }]}>
          <InvoiceScreen 
            invoiceId={invoiceId}
            rideId={rideId}
            tripFare={tripFare}
            tripDistance={tripDistance}
            tripDuration={tripDuration}
            driverDetails={driverDetails}
            vehicleDetails={driverDetails}
            tripStops={tripStops}
            bookingTime={bookingTime}
            fareDetails={fareDetails}
            paymentMethod={paymentMethod}
            supplierDetails={supplierDetails}
            recipientDetails={recipientDetails}
            adminInfo={adminDetails}
            paymentStatus={paymentStatus}
            mode="inline"
            showHeader={true}
            onClose={handleInvoiceClose}
            rideStatus={tripStatus}
          />
        </Animated.View>
      )}
      {showModel && showPGConfirm && (
        <View style={styles.pgConfirmOverlay}>
          <View style={styles.pgConfirmCard}>
            <AdaptiveText style={styles.pgConfirmTitle}>{t('confirm_payment')}</AdaptiveText>
            <AdaptiveText style={styles.pgConfirmDesc}>
              {t('you_are_paying_via_razorpay')}
            </AdaptiveText>
            <View style={{ height: 8 }} />
            {/* <View style={styles.paymentMethodKeyContainer}>
              <Text style={styles.paymentMethodKey}>{t('payment_method')}</Text>
              <Text style={styles.paymentMethodValue}>{paymentMethod}</Text>
            </View> */}
            <View style={[styles.paymentMethodKeyContainer,{marginTop:4}]}> 
              <Text style={[styles.paymentMethodKey,{fontFamily:Fonts.semi_bold}]}>{t('total_payable')}</Text>
              <Text style={[styles.paymentMethodValue,{fontFamily:Fonts.bold}]}>₹ {totalPayable.toFixed(2)}</Text>
            </View>
            <AdaptiveText style={styles.pgConfirmNote}>
              {t('payment_gateway_fee_plus_gst')} {t('applied').toLowerCase()}
            </AdaptiveText>
            <View style={{ height: 12 }} />
            <View style={styles.pgConfirmActions}>
              <TouchableOpacity style={[styles.pgConfirmButton, styles.pgCancel]} onPress={() => setShowPGConfirm(false)}>
                <AdaptiveText style={styles.pgConfirmButtonText}>{t('cancel')}</AdaptiveText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pgConfirmButton, styles.pgConfirm]} onPress={proceedPaymentWithPG} disabled={isProcessingPayment}>
                {isProcessingPayment ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <AdaptiveText style={styles.pgConfirmButtonText}>{t('confirm')}</AdaptiveText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {showDroppedPaymentPending && (
        <DroppedButPaymentPendingLongtime
          visible={showDroppedPaymentPending}
          trip={modalTripBundle}
          driver={driverDetails}
          vehicle={vehicleDetails}
          onClose={() => setShowDroppedPaymentPending(false)}
          onSubmit={() => setShowDroppedPaymentPending(false)}
        />
      )}
      {/* <PayButton amount={finalFare} onPress={handlePayNow} paymentMethod={paymentMethod} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    
  },
  cashPayment: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD54F',
    borderStyle:'dashed'
  },
 
  cashPaymentText: {
    fontSize: 16,
    fontFamily: Fonts.semi_bold,
    color: 'black',
    textAlign: 'center',
   
  },
  paymentMethodContainer: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    marginVertical: 10,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodLabel: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: colors.black,
    marginBottom: 15,
  },
  paymentMethodValue: {
    fontFamily: Fonts.medium,
    fontSize: 28,
    color: colors.black,
  },
  paymentStatusContainer: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    marginVertical: 10,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentStatusLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.black,
    marginBottom: 8,
  },
  paymentStatusValue: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
    
  },
  receiptButton: {
    backgroundColor: colors.grey_xdark,
    borderRadius: 10,
    padding: 16,
    marginVertical: 10,
    alignItems: 'center',
    flexDirection:"row",
    justifyContent:"center",
    
   flex:1
  },
  receiptButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.black,
  },
  invoiceButton: {
    backgroundColor: colors.grey_xdark,
    borderRadius: 10,
    padding: 16,
    marginVertical: 10,
    alignItems: 'center',
    flexDirection:"row",
    justifyContent:"center",
    gap:10,
    
    flex:1
  },
  invoiceButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.black,
  },
  actionButtonsContainer:{
    flexDirection:"row",
    width:"100%",
    flex:1,
    gap:10
  },
  paymentMethodKeyContainer:{
    flexDirection:"column",
    alignItems:"center",
    justifyContent:"",
    gap:10,
    marginBottom:10
  },
  paymentMethodKey:{
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.grey_xxdark,
  },
  feedbackButton: {
    backgroundColor: colors.blue,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.white,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
    zIndex: 100,
    elevation: 20,
    overflow: 'visible',
  },
  bottomButton: {
    backgroundColor: colors.green,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.white,
  },
  overlayContainer:{
    position:'absolute',
    left:0,
    right:0,
    top:0,
    bottom:0,
    backgroundColor: colors.white,
    zIndex: 9999,
    elevation: 12,
  },
  pgConfirmOverlay:{
    position:'absolute',
    left:0,
    right:0,
    top:0,
    bottom:0,
    backgroundColor:'rgba(0,0,0,0.35)',
    zIndex:9999,
    justifyContent:'center',
    alignItems:'center'
  },
  pgConfirmCard:{
    width:'90%',
    backgroundColor:colors.white,
    borderRadius:12,
    padding:16,
    elevation:6
  },
  pgConfirmTitle:{
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: colors.black,
    marginBottom:4
  },
  pgConfirmDesc:{
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: colors.grey_xdark
  },
  pgConfirmNote:{
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: colors.grey_xxdark,
    textAlign:'center',
  },
  pgConfirmActions:{
    flexDirection:'row',
    gap:10,
    marginTop:12
  },
  pgConfirmButton:{
    flex:1,
    borderRadius:10,
    paddingVertical:12,
    alignItems:'center',
    justifyContent:'center'
  },
  pgCancel:{
    backgroundColor: colors.grey_xdark
  },
  pgConfirm:{
    backgroundColor: colors.green
  },
  pgConfirmButtonText:{
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: colors.white
  }
});

export default PaymentScreen;
