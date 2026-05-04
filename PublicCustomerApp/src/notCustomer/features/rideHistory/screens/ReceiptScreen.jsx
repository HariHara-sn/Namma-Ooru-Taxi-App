import React, { useState, useRef, useEffect }   from 'react';
import { ScrollView, View, StyleSheet, Text, TouchableOpacity, Alert, Modal, BackHandler, Platform, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import NavBar from '../../../components/NavBar';
import { Fonts, colors } from '../../../constants/constants';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PDFCreator from '../../../utils/PDFCreator';
import { utils } from '../../../utils/Utils';
let FileViewer;
try {
  // Use dynamic require to avoid bundling issues if not installed
  FileViewer = require('react-native-file-viewer');
} catch (e) {
  FileViewer = null;
}

const ReceiptScreen = ({ rideId,tripFare,tripDistance,tripDuration,driverDetails,vehicleDetails,tripStops,bookingTime,fareDetails,paymentMethod,paymentStatus,recipientDetails,adminInfo,visible, onClose, mode = 'modal', showHeader, rideStatus }) => {
  const { t } = useTranslation();
  const { goBack } = useStackScreenStore();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    // Ensure Android hardware back triggers the same behavior when inline
    if (mode !== 'modal') {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBackPress();
        return true; // consume the event
      });
      return () => subscription.remove();
    }
  }, [mode, onClose]);
  // Use the actual trip data or dummy data if not provided
  const rideData = {
    _id: rideId,
    fareDetails: { fare: tripFare },
    estimatedFare: tripFare,
    bookingTime: bookingTime,
    finalDistance: tripDistance,
    finalDuration: tripDuration,
    vehicleType: vehicleDetails?.vehicleType,
    driverInfo: {
      driverName: driverDetails?.driverName,
      driverRating: driverDetails?.driverRating,
      vehicleBrand: driverDetails?.vehicleBrand,
      vehicleModel: driverDetails?.vehicleModel,
      vehicleNumber: driverDetails?.vehicleNumber
    },
    stops: tripStops,
    paymentMethod: paymentMethod,
    passengerPaymentStatus: paymentStatus,
    vehicleInfo: vehicleDetails
  };

  const effectiveShowHeader = typeof showHeader === 'boolean' ? showHeader : mode === 'modal';

  const handleBackPress = () => {
    if (onClose) {
      onClose();
    } else {
      goBack();
    }
  };

  const handleMultiSheetPDF = async () => {
    setLoadingReceipt(true);
    try {
      const supportUrl = adminInfo?.supportUrl || "https://nammaoorutaxi.com";
      const currency = fareDetails?.currency || "₹";

      const sheets = [
        {
          type: 'tripBill',
          data: {
            title: "Trip Bill",
            companyName: adminInfo?.name,
      
            customerName: recipientDetails?.name,
            dateLong: bookingTime,
            currency: "₹",
            totalAmount: fareDetails?.fare,
          
            bookingId: rideId,
          
            yourTripAmount: fareDetails?.breakdown?.subtotal+fareDetails?.breakdown?.feesWithTax?.total,
            totalPayable: fareDetails?.fare,
            taxesLine: `Includes ${currency} ${fareDetails?.breakdown?.taxes?.total} Taxes`,
          
            driverName: driverDetails?.driverName,
            driverPhotoUrl:  driverDetails?.driverPhoto,
         
          
            distance: tripDistance,
            travelTime: tripDuration,
            vehicleLabel: `${driverDetails?.vehicleModel}-${driverDetails?.vehicleBrand}`,
            tripType: "Drop Only",
        
            pickupAddress: tripStops[0]?.address,
            pickupTime: utils.formatDateAndTime(tripStops[0]?.arrivalTime),
          
            
            dropAddress: tripStops[tripStops.length-1].address,
            dropTime: rideStatus === 'COMPLETED' ? utils.formatDateAndTime(tripStops[tripStops.length-1].arrivalTime) : '--',
            supportUrl: supportUrl,
            supportUrlText: supportUrl,
            footerNote: "Above fare based on travel distance and waiting. Toll, Parking, Permit charges may apply. T&C apply."
          }
        }
      ];

      const fileName = 'Receipt_' + rideId;
      const pdfPath = await PDFCreator.createMultiSheetPDF(sheets, fileName, null);
      // Show floating toast (2s) with saved path
      setToastMessage(`Saved to:\n${pdfPath}`);
      setShowToast(true);
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => setShowToast(false), 2000);
      try {
              if (FileViewer && FileViewer.open) {
                await FileViewer.open(pdfPath, { showOpenWithDialog: true });
              } else {
                // Fallback: Linking (may fail on Android N+ without FileProvider)
                const uri = Platform.OS === 'android' ? `file://${pdfPath}` : pdfPath;
                const canOpen = await Linking.canOpenURL(uri);
                if (canOpen) {
                  await Linking.openURL(uri);
                }
              }
            } catch (openErr) {
              console.warn('Failed to open PDF automatically:', openErr);
            }
    } catch (error) {
      console.error('Multi-sheet PDF error:', error);
      Alert.alert('Error', 'Failed to create multi-sheet PDF: ' + error.message, [{ text: 'OK' }]);
    } finally {
      setLoadingReceipt(false);
    }
  };

  

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = days[date.getDay()];
    const dateNum = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${day}, ${dateNum} ${month} ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
  };

  const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '₹0.00';
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDuration = (minutes) => {
    return `${minutes} Mins`;
  };

  const formatDistance = (km) => {
    if (km === null || km === undefined) return '-- Km';
    const num = typeof km === 'string' ? parseFloat(km) : km;
    if (isNaN(num)) return '-- Km';
    return `${Number(num).toFixed(1)} Km`;
  };

  const content = (
      <View style={styles.container}>
        {effectiveShowHeader && <NavBar withBg onBackPress={handleBackPress} title={t('receipt')} />}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
        {/* Receipt Header with Car Image */}
        <View style={styles.receiptHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.receiptTitle}>{t('receipt')}</Text>
            <Text style={styles.receiptDate}>{formatDate(rideData.bookingTime)}</Text>
          </View>
         
        </View>

        {/* Total Amount */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>{t('total')}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(rideData.fareDetails?.fare || rideData.estimatedFare)}</Text>
        </View>

        {/* Receipt Details */}
        <View style={styles.receiptDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('trip_charge')}</Text>
            <Text style={styles.detailValue}>{formatCurrency(rideData.fareDetails?.fare || rideData.estimatedFare)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('subtotal')}</Text>
            <Text style={styles.detailValue}>{formatCurrency((rideData.fareDetails?.fare || rideData.estimatedFare) * 0.93)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('tax')}</Text>
            <Text style={styles.detailValue}>{formatCurrency((rideData.fareDetails?.fare || rideData.estimatedFare) * 0.07)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('payment')}</Text>
            <Text style={styles.detailValue}>{rideData.paymentMethod}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('transaction_id')}</Text>
            <Text style={styles.detailValue}>#{rideData._id}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('distance')}</Text>
            <Text style={styles.detailValue}>{formatDistance(rideData.finalDistance)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('duration')}</Text>
            <Text style={styles.detailValue}>{formatDuration(rideData.finalDuration)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('ride_type')}</Text>
            <Text style={styles.detailValue}>{vehicleDetails?.vehicleType}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('start_location')}</Text>
            <Text style={styles.detailValue}>{rideData.stops?.[0]?.address || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('end_location')}</Text>
            <Text style={styles.detailValue}>{rideData.stops?.[rideData.stops.length - 1]?.address || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('driver_name')}</Text>
          <Text style={styles.detailValue}>{rideData.driverInfo?.driverName}</Text>
             
          </View>
          
         
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleMultiSheetPDF}
            disabled={loadingReceipt}
          >
            {loadingReceipt ? (
              <MaterialCommunityIcons name="progress-clock" size={20} color={colors.white} />
            ) : (
              <MaterialCommunityIcons name="file-download" size={20} color={colors.white} />
            )}
            <Text style={styles.downloadButtonText}>
              {loadingReceipt ? `${t('downloading')}...` : t('download_pdf')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Toast */}
      {showToast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
      </View>
  );

  if (mode === 'modal') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        presentationStyle="fullScreen"
        onRequestClose={handleBackPress}
      >
        {content}
      </Modal>
    );
  }

  // Inline mode: ignore `visible` prop and simply render content
  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  receiptHeader: {
    backgroundColor: colors.black,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  receiptTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: colors.white,
    marginBottom: 8,
  },
  receiptDate: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.grey_xxdark,
  },
  carImageContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carEmoji: {
    fontSize: 40,
  },
  totalContainer: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalLabel: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.black,
    marginBottom: 8,
  },
  totalAmount: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    color: colors.green,
  },
  receiptDetails: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey_light,
  },
  detailLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.black,
    flex: 1,
  },
  detailValue: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.black,
    textAlign: 'right',
    flex: 1,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingContainer: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ratingText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: colors.black,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: colors.black,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    padding: 16,
    marginRight: 6,
  },
  downloadButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.white,
  },
  emailButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginLeft: 6,
  },
  emailButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#2196F3',
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: '15%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    zIndex: 10,
    elevation:5,
  },
  toastText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: colors.white,
    textAlign: 'center',
  },
});

ReceiptScreen.propTypes = {
  rideId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tripFare: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tripDistance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tripDuration: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  driverDetails: PropTypes.shape({
    driverName: PropTypes.string,
    driverRating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    driverPhotoUrl: PropTypes.string,
    driverPhoto: PropTypes.string,
    vehicleBrand: PropTypes.string,
    vehicleModel: PropTypes.string,
    vehicleNumber: PropTypes.string,
  }),
  vehicleDetails: PropTypes.shape({
    vehicleBrand: PropTypes.string,
    vehicleModel: PropTypes.string,
    vehicleNumber: PropTypes.string,
    vehicleType: PropTypes.string,
  }),
  tripStops: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string,
      arrivalTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      waitingTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  bookingTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  fareDetails: PropTypes.object,
  paymentMethod: PropTypes.string,
  paymentStatus: PropTypes.string,
  supplierDetails: PropTypes.object,
  recipientDetails: PropTypes.object,
  adminInfo: PropTypes.object,
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  mode: PropTypes.oneOf(['modal', 'inline']),
  showHeader: PropTypes.bool,
  rideStatus: PropTypes.string,
};

export default ReceiptScreen; 
