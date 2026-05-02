import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import NavBar from '../../../components/NavBar';
import FareHeader from '../components/FareHeader';
import TripMetaInfo from '../components/TripMetaInfo';
import TripPersonVehicle from '../components/TripPersonVehicle';
import TripStats from '../components/TripStats';
import PaymentDetails from '../components/PaymentDetails';
import SupportSection from '../components/SupportSection';
import AddressContainer from '../../../components/Trips/AddressContainer';
import ReceiptScreen from './ReceiptScreen';
import InvoiceScreen from './InvoiceScreen';
import { Fonts, colors } from '../../../constants/constants';
import { utils } from '../../../utils/Utils';
import PropTypes from 'prop-types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { openFeedback } from '../../../utils/feedback';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import { getPresignedImageUrl } from '../../../../common/utils/getPresignedImageUrl';

const RideDetailScreen = ({ TripData }) => {
  console.log("TripData",TripData)
  const { t } = useTranslation();
  const { goBack } = useStackScreenStore();
  const { userdetails } = useUserInfoStore();
  const userToken = userdetails?.token || null;
  const [showReceipt, setShowReceipt] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [driverPhotoUri, setDriverPhotoUri] = useState(null);
  const [isDriverPhotoLoading, setIsDriverPhotoLoading] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const overlayAnim = useRef(new Animated.Value(screenHeight)).current;

  
 
  
  // Use the actual trip data
  const rideData = TripData || {};

  const handleBackPress = () => {
    goBack();
  };

  const handleSupportPress = () => {
    // Handle support button press
    
  };

  const onFeedbackPress = () => {
    try {
      const stops = Array.isArray(rideData?.stops) ? rideData.stops : [];
      const startStop = stops.length > 0 ? stops[0] : undefined;
      const endStop = stops.length > 0 ? stops[stops.length - 1] : undefined;
      const pickupCoords = startStop?.location; // expected [lon, lat]
      const dropCoords = endStop?.location; // expected [lon, lat]
      const distanceKm = typeof rideData?.finalDistance === 'number' ? String(rideData.finalDistance) : rideData?.estimatedDistance;
      const tripId = rideData?._id;
      const estimatedFare = rideData?.fareDetails?.fare || rideData?.estimatedFare;

    

      openFeedback({
        screenName: 'RideStatus',
        initialValues: {
          tripId,
          tripStartName: startStop?.address || '',
          tripEndName: endStop?.address || '',
          tripDistanceKm: distanceKm,
          pickupCoords,
          dropCoords,
          estimatedFare: estimatedFare || '',
        },
      });
    } catch (e) {
      // silent fail
    }
  };

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

  const handleReceiptPress = () => {
    setShowInvoice(false);
    overlayAnim.setValue(screenHeight);
    setShowReceipt(true);
    requestAnimationFrame(animateIn);
  };

  const handleReceiptClose = () => {
    animateOut(() => setShowReceipt(false));
  };

  const handleInvoicePress = () => {
    setShowReceipt(false);
    overlayAnim.setValue(screenHeight);
    setShowInvoice(true);
    requestAnimationFrame(animateIn);
  };

  const handleInvoiceClose = () => {
    animateOut(() => setShowInvoice(false));
  };

  const formatDate = (timestamp) => {
    return utils.formatDateAndTime(timestamp);
  };

  // Transform stops data to match AddressContainer expected format
  const transformStops = (stops) => {
    if (!stops || !Array.isArray(stops)) return [];
    
    return stops.map((stop, index) => ({
      id: index + 1,
      address: stop.address,
      locationName: stop.name,
      location: stop.location,
      isReached: stop.isReached,
      waitingTime: stop.waitingTime,
      arrivalTime: stop.arrivalTime,
    }));
  };

  
  const isFareCalculated= rideData?.fareDetails?.fare || rideData?.customerInvoice || null

  const BreakdownFare = isFareCalculated ? rideData?.customerInvoice? utils.getInvoiceFormat(rideData?.customerInvoice) : utils.getFareBreakdown(rideData?.fareDetails) : null

  const distance = rideData?.finalDistance || 0
  const duration = rideData?.finalDuration  || 0

  useEffect(() => {
    let isActive = true;


    const resolveDriverPhoto = async () => {
      const rawPhoto = rideData?.driverInfo?.driverPhoto;
      const trimmed = typeof rawPhoto === 'string' ? rawPhoto.trim() : '';

      if (!trimmed) {
        setDriverPhotoUri(null);
        setIsDriverPhotoLoading(false);
        return;
      }

      const normalizedKey = trimmed.replace(/^https?:\/\/[^/]+\/?/, '').replace(/^\//, '');

      if (!normalizedKey || !userToken) {
        setDriverPhotoUri(null);
        setIsDriverPhotoLoading(false);
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
  }, [rideData?.driverInfo?.driverPhoto, userToken]);

  console.log("rideData",rideData)
  console.log("rideFareDetails",rideData?.status)
  console.log(utils.getRideStatus(rideData?.status),"keb")
  return (
    <View style={styles.container}>
      <NavBar withBg onBackPress={handleBackPress} title={t('ride_details')} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {
           <FareHeader fare={rideData.fareDetails?.fare || rideData.estimatedFare || 0} RideStatus={utils.getRideStatus(rideData?.status)}  hideFare={rideData?.status != "COMPLETED" && rideData?.status != "DIVERGED"} />
        }
          {(rideData?.cancelledBy && rideData?.status == 'CANCELLED' )&&  <Text style={{color:colors.grey_xxdark,fontFamily:Fonts.regular,marginTop:10,alignItems:'center',width:"100%",textAlign:'center'}}>{rideData?.cancelledBy == "DRIVER" ? t('cancelled_by_driver') : t('cancelled_by_you')}</Text> }
        
        <TripMetaInfo 
          date={formatDate(rideData.bookingTime)} 
          tripId={rideData.rideId} 
        />
      
       
        {/* Show OTP if available */}
       
     
        <AddressContainer directions={transformStops(rideData.stops)} />

         {rideData?.otp ? (
          <View style={styles.inlinePanel}>
            <View style={styles.inlineHeader}>
              <Text style={styles.inlineTitle}>{t('O T P')}</Text>
            </View>
            <Text style={{
              fontFamily: Fonts.semi_bold,
              fontSize: 24,
              letterSpacing: 2,
              color: colors.black,
              textAlign: 'center',
            }}>
              {String(rideData.otp)}
            </Text>
          </View>
        ) : null}
        
        
        <TripPersonVehicle 
          driverName={rideData.driverInfo?.driverName} 
          driverPhoto={driverPhotoUri || undefined} 
          driverPhotoLoading={isDriverPhotoLoading}
          showDriverPhotoPlaceholder
          vehicleType={rideData?.vehicleType} 
          vehicleBrand={rideData.driverInfo?.vehicleBrand} 
          vehicleModel={rideData.driverInfo?.vehicleModel} 
          vehicleNumber={rideData.driverInfo?.vehicleNumber} 
        />

        <View style={{marginVertical:20}}>
        
        <TripStats 
          isNotCompleted={rideData?.status != "COMPLETED" && rideData?.status != "DIVERGED"}
          totalDistance={distance} 
          totalDuration={duration} 
          totalFare={rideData.fareDetails?.fare} 
        />
        
        </View>
        <View style={[{backgroundColor:'transparent',elevation:0,shadowOpacity:0,justifyContent:'center',alignItems:'center'}]}>
        <TouchableOpacity style={styles.feedbackButton} onPress={onFeedbackPress}>
          <MaterialIcons name="feedback" size={20} color={colors.white} />
          <Text style={styles.feedbackButtonText}>{t('give_feedback')}</Text>
        </TouchableOpacity>
        </View>
       {/* {isFareCalculated && <PaymentDetails 
          finalFare={rideData.fareDetails?.fare || rideData.estimatedFare} 
          breakdownFare={BreakdownFare}
          
        />} */}
       {(rideData?.status =="COMPLETED" || rideData?.status == 'DIVERGED') && (
        <View style={styles.paymentMethodContainer}>
          <Text style={styles.paymentMethodLabel}>{t('payment_details')}</Text>
          <View style={styles.paymentMethodKeyContainer}>
            <Text style={styles.paymentMethodKey}>{t('trip_fare')}</Text>
            <Text style={styles.paymentMethodValue}> ₹ {rideData.fareDetails?.fare || "00.00"}</Text>
          </View>
          <View style={styles.paymentMethodKeyContainer}>
            <Text style={styles.paymentMethodKey}>{t('payment_method')}</Text>
            <Text style={styles.paymentMethodValue}>{rideData.paymentMethod}</Text>
          </View>
          {rideData.passengerPaymentStatus && <View style={styles.paymentMethodKeyContainer}>
          <Text style={styles.paymentMethodKey}>{t('payment_status')}</Text>
          <Text style={[
            styles.paymentMethodValue, 
           
          ]}>
            {rideData.passengerPaymentStatus?.toUpperCase() || 'PENDING'}
          </Text>

          </View>}
         
        </View>
        )}
        
        
        
        {/* <SupportSection onPress={handleSupportPress} /> */}
        
        {/* Receipt Button */}
       {(rideData?.status == "COMPLETED" || rideData?.status == "DIVERGED" )&& <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.receiptButton} onPress={handleReceiptPress}>
          <MaterialIcons name="receipt" size={20} color={colors.black} />
          <Text style={styles.receiptButtonText}> {t('view_receipt')}</Text>
        </TouchableOpacity>
        
        {/* Invoice Button */}
        <TouchableOpacity style={styles.invoiceButton} onPress={handleInvoicePress}>
          <FontAwesome5 name="file-invoice" size={20} color={colors.white} />
          <Text style={styles.invoiceButtonText}>{t('show_invoice')}</Text>
        </TouchableOpacity>
        {/* Feedback Button */}
        
        </View>
        }


      </ScrollView>
      
      {/* Overlay layers rendered on top with zIndex */}
      {showReceipt && (
        <Animated.View style={[styles.overlayContainer, { transform: [{ translateY: overlayAnim }] }]}>
          <ReceiptScreen 
            rideId={rideData?.rideId}
            tripFare={rideData.fareDetails?.fare}
            tripDistance={rideData.finalDistance }
            tripDuration={rideData.finalDuration }
            driverDetails={rideData.driverInfo}
            vehicleDetails={rideData.driverInfo}
            tripStops={rideData.stops}
            bookingTime={rideData.bookingTime}
            fareDetails={rideData.fareDetails}
            paymentMethod={rideData.paymentMethod}
            recipientDetails={rideData.recipient}
            adminInfo={rideData.adminInfo}
            paymentStatus={rideData.passengerPaymentStatus}
            mode="inline"
            showHeader={true}
            onClose={handleReceiptClose}
            rideStatus={rideData?.status}
          />
        </Animated.View>
      )}
      {showInvoice && (
        <Animated.View style={[styles.overlayContainer, { transform: [{ translateY: overlayAnim }] }]}>
          <InvoiceScreen 
            rideId={rideData?.rideId}
            tripFare={rideData.fareDetails?.fare}
            tripDistance={rideData.finalDistance }
            tripDuration={rideData.finalDuration}
            driverDetails={rideData.driverInfo}
            vehicleDetails={rideData.driverInfo}
            tripStops={rideData.stops}
            bookingTime={rideData.bookingTime}
            fareDetails={rideData.fareDetails}
            paymentMethod={rideData.paymentMethod}
            supplierDetails={rideData.supplier}
            recipientDetails={rideData.recipient}
            adminInfo={rideData.adminInfo}
            paymentStatus={rideData.passengerPaymentStatus}
            mode="inline"
            showHeader={true}
            onClose={handleInvoiceClose}
            rideStatus={rideData?.status}
          />
        </Animated.View>
      )}
    </View>
  );
};

RideDetailScreen.propTypes = {
  TripData: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
    fontSize: 14,
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
    backgroundColor: colors.black,
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
    color: colors.white,
  },
  feedbackButton:{
    backgroundColor: colors.blue,
    borderRadius: 30,
    padding: 16,
    marginVertical: 10,
    alignItems: 'center',
    flexDirection:'row',
    justifyContent:'center',
    width:"50%",
    gap:10
  },
  feedbackButtonText:{
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.white,
  },
  actionButtonsContainer:{
    flexDirection:"row",
    width:"100%",
    flex:1,
    gap:10
  },
  paymentMethodKeyContainer:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between",
    gap:10,
    marginBottom:10
  },
  paymentMethodKey:{
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.grey_xxdark,
  },
  inlinePanel:{
    width: '100%',

    justifyContent: 'center',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    
  },
  inlineHeader:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  inlineTitle:{
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: colors.grey_xxdark,
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
  
});

export default RideDetailScreen;
