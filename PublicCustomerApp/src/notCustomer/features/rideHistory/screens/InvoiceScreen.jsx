import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Text, TouchableOpacity, Alert, Modal, BackHandler, Linking, Platform } from 'react-native';
let FileViewer;
try {
  // Use dynamic require to avoid bundling issues if not installed
  FileViewer = require('react-native-file-viewer');
} catch (e) {
  FileViewer = null;
}
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import NavBar from '../../../components/NavBar';
import { Fonts, colors } from '../../../constants/constants';
import PDFCreator from '../../../utils/PDFCreator';
import { utils } from '../../../utils/Utils';

const InvoiceScreen = ({ rideId,tripDistance,tripDuration,driverDetails,vehicleDetails,tripStops,bookingTime,fareDetails,paymentMethod,paymentStatus,supplierDetails,recipientDetails,adminInfo,visible, onClose, mode = 'modal', showHeader, rideStatus }) => {
  const { t } = useTranslation();
  const { goBack } = useStackScreenStore();
  const [customFolder] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const toastTimerRef = useRef(null);
  
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    // Ensure Android hardware back triggers the same behavior
    if (mode !== 'modal') {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBackPress();
        return true; // consume the event
      });
      return () => subscription.remove();
    }
  }, [mode, onClose]);
  
  const defaultCompanyInfo = {
    name: supplierDetails?.name || 'N/A',
    address: supplierDetails?.address || 'N/A',
    phone: supplierDetails?.phone || 'N/A',
    email: supplierDetails?.email || 'N/A',
    gstin: supplierDetails?.gstNumber || 'N/A',
    pan: supplierDetails?.panNumber || 'N/A',
  };
  
  const defaultCustomerInfo = {
    name: recipientDetails?.name || 'N/A',
    phone: recipientDetails?.phone || 'N/A',
    address: tripStops?.[0]?.address || 'N/A'
  };
  
  const defaultDriverInfo = {
    driverName: driverDetails?.driverName || 'N/A',
    driverRating: driverDetails?.driverRating || 'N/A',
    vehicleBrand: vehicleDetails?.vehicleBrand || 'N/A',
    vehicleModel: vehicleDetails?.vehicleModel || 'N/A',
    vehicleNumber: vehicleDetails?.vehicleNumber || 'N/A'
  };
  const isVendor = false
  
 
  
  // Merge actual data with defaults
  const mergedRideData = fareDetails?.breakdown || {};

  const effectiveShowHeader = typeof showHeader === 'boolean' ? showHeader : mode === 'modal';

  const handleBackPress = () => {
    if (onClose) {
      onClose();
    } else {
      goBack();
    }
  };

  const handleMultiSheetPDF = async () => {
    setLoadingInvoice(true);
    try {
      const supportUrl = adminInfo?.supportUrl || "https://nammaoorutaxi.com";
      const currency = fareDetails?.currency || "₹";

      console.log("fareDetails",driverDetails?.driverPhoto)

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
            driverPhotoUrl: driverDetails?.driverPhoto,
         
          
            distance: tripDistance,
            travelTime: tripDuration,
            vehicleLabel: `${defaultDriverInfo?.vehicleModel}-${defaultDriverInfo?.vehicleBrand}`,
            tripType: "Drop Only",
        
            pickupAddress: tripStops[0].address,
            pickupTime: utils.formatDateAndTime(tripStops[0].arrivalTime),
          
            
            dropAddress: tripStops[tripStops.length-1].address,
            dropTime: rideStatus === 'COMPLETED' ? utils.formatDateAndTime(tripStops[tripStops.length-1].arrivalTime) : '--',
            supportUrl: supportUrl,
            supportUrlText: supportUrl,
            footerNote: "Above fare based on travel distance and waiting. Toll, Parking, Permit charges may apply. T&C apply."
          }
        },
        isVendor ? {
          type: 'vendorInvoice',
          data: {
            // Header
            invoiceTitle: "Vendor Trip Invoice",
            invoiceType: "Original Tax Invoice",
            invoiceDate: fareDetails?.invoicedAt,
            invoiceNumber: fareDetails?.invoiceId,
          
            // Customer Info
            customerName: recipientDetails?.name,
            customerMobile: recipientDetails?.phone,
            pickupAddress: tripStops[0].address,
            serviceType: "Renting of Motor Cab",
            paymentMethod: paymentMethod,
          
            // Vendor Info
            vendor: {
              name: supplierDetails?.name,
              phone: supplierDetails?.phone,
              email: supplierDetails?.email,
              gst: supplierDetails?.gstNumber,
              pan: supplierDetails?.panNumber
            },
          
            // Trip Summary
            totalDistance: tripDistance,
            totalTravelTime: tripDuration,
            totalWaitingTime: tripStops[0].waitingTime,
            paymentStatus: paymentStatus,
          
            // Fare
            baseFare: fareDetails?.breakdown?.distancefare+fareDetails?.breakdown?.zoneAdjustment+fareDetails?.breakdown?.rideMatchAdjustment+fareDetails?.breakdown?.surgeAdjustment+fareDetails?.breakdown?.incentives+fareDetails?.breakdown?.lowPerformancePenalty,
           
         
            waitingFare: fareDetails?.breakdown?.waitTimeCost,
            discount: fareDetails?.breakdown?.couponDiscount,
            subTotal: fareDetails?.breakdown?.subtotal,
          
            // Tax
            taxes: fareDetails?.breakdown?.taxes,
          
            // Net fare after tax and discount
            netFare: fareDetails?.breakdown?.subtotal + fareDetails?.breakdown?.taxes?.total,
          
            // Notes
            notes: [
              "Fare includes waiting charges.",
              "This is a computer-generated invoice.",
              "Please retain for your records."
            ],
          
            // Signature / Authority
            authorityName: "Authorized Signatory",
            authorityCompany: adminInfo?.name,
            authoritySignUrl: supplierDetails?.digitalSignature
          }
        } : {
          type: 'driverInvoice',
          data: {
            invoiceTitle: "Driver Trip Invoice",
            invoiceType: "Original Tax Invoice",
            invoiceDate: fareDetails?.invoicedAt,
            invoiceNumber: fareDetails?.invoiceId,
            customerName: recipientDetails?.name,
            customerMobile: recipientDetails?.phone,
            pickupAddress: tripStops[0].address,
            serviceType: "Renting of motor cab",
            paymentMethod: paymentMethod,
          
            // Driver & Vehicle
            driverName: driverDetails?.driverName,
            operatorName: adminInfo?.name,
            vehicleNumber: vehicleDetails?.vehicleNumber,
            stateUT: adminInfo?.state,
            bookingId: rideId,
          
            // KPIs
            totalDistance: tripDistance,
            totalTravelTime: tripDuration,
            totalWaitingTime: tripStops[0].waitingTime,
            paymentStatus: paymentStatus,
          
            // Fare Breakdown
            baseFare: fareDetails?.breakdown?.distancefare+fareDetails?.breakdown?.zoneAdjustment+fareDetails?.breakdown?.rideMatchAdjustment+fareDetails?.breakdown?.surgeAdjustment+fareDetails?.breakdown?.incentives+fareDetails?.breakdown?.lowPerformancePenalty,
           
          
            waitingFare: fareDetails?.breakdown?.waitTimeCost,
            discount: fareDetails?.breakdown?.couponDiscount,
            subTotal: fareDetails?.breakdown?.subtotal,
            netFare: fareDetails?.breakdown?.subtotal,
          
            // Notes
            notes: [
              "Fare excludes tax breakdown and includes any waiting charges.",
              "Please keep this invoice for your records. This is a computer generated document."
            ],
          
            // Authority / Signature
            authorityName: "Authorized Signatory",
            authorityCompany: adminInfo?.name,
            authoritySignUrl: supplierDetails?.digitalSignature  // URL for signature image
          }
        },
        {
          type: 'platformInvoice',
          data: {
            // Branding / Header
            companyLogoUrl: adminInfo?.logo,
            companyName: adminInfo?.name,
            companyAddressLines: [
              adminInfo?.address,
              adminInfo?.city,
              adminInfo?.state
            ],
            companyGSTIN: adminInfo?.gstNumber,
            companyStateName: adminInfo?.state,
            companyStateCode: adminInfo?.stateCode,
            companyEmail: adminInfo?.email,
          
            invoiceTitle: "Original Tax Invoice",
            invoiceType: "Original Tax Invoice",
            invoiceDate: fareDetails?.invoicedAt,
            invoiceNumber: fareDetails?.invoiceId,
            serviceTaxCategory: "Business Auxiliary Service",
            hsnSacCode: fareDetails?.breakdown?.hsnSacCode || "N/A",
          
            // Customer
            customerName: recipientDetails?.name,
            customerGSTNumber: recipientDetails?.gstNumber || "N/A",
            mobileNumber: recipientDetails?.phone || "N/A",
            supplyAddress:
              adminInfo?.address,
          
            // Trip / Booking
            bookingId: rideId,
          
            // Currency
            currency: "₹",
          
            // Fees with tax breakdown
            feesWithTax: fareDetails?.breakdown?.feesWithTax,
          
            // Footer / Signatory
            authorityName: "Authorised Signatory",
            authoritySignUrl: supplierDetails?.digitalSignature,
            footerNote:
              "Above fare given based on travel distance and waiting. Toll, Parking, Permit charges may apply. T&C apply."
          }
          
        }
        
      ];

      const fileName = 'Invoice_' + fareDetails?.invoiceId;
      const pdfPath = await PDFCreator.createMultiSheetPDF(sheets, fileName, customFolder || null);
      console.log("=====> PDF PATH", pdfPath)
      
      // Show floating toast for 5 seconds with path
      setToastMessage(`Saved to:\n${pdfPath}`);
      setShowToast(true);
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => setShowToast(false), 2000);

      // Try opening the PDF automatically using FileViewer (handles FileProvider)
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
      setLoadingInvoice(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount == null || isNaN(Number(amount))) {
      return '₹0.00';
    }
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const formatDuration = (minutes) => {
    if (minutes == null || isNaN(Number(minutes))) {
      return '0 Min';
    }
    if (minutes == 1 || minutes === 0) {
      return `${minutes} Min`;
    }
    return `${minutes} Mins`;
  };

  const formatDistance = (km) => {
    const num = Number(km);
    if (!isNaN(num) && isFinite(num)) {
      return `${num?.toFixed(1)} Km`;
    }
    return `0 Km`;
  };

  const humanizeKey = (key) => {
    if (!key) return '';
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  // Derived amounts
  const rideCost =
    Number(mergedRideData.distancefare || 0) +
    Number(mergedRideData.zoneAdjustment || 0) +
    Number(mergedRideData.rideMatchAdjustment || 0) +
    Number(mergedRideData.surgeAdjustment || 0) +
    Number(mergedRideData.incentives || 0) +
    Number(mergedRideData.lowPerformancePenalty || 0);

  const waitingCost = Number(mergedRideData.waitTimeCost || 0);
  const couponDiscount = Number(mergedRideData.couponDiscount || 0);
  const subtotal = Number(mergedRideData.subtotal || 0);
  const taxes = mergedRideData?.taxes?.breakdown || {};
  const feesWithTax = mergedRideData?.feesWithTax?.breakdown || {};

  const content = (
      <View style={styles.container}>
        {effectiveShowHeader && <NavBar withBg onBackPress={handleBackPress} title={t('invoice_detail')} />}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Invoice Header */}
          <View style={styles.invoiceHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.invoiceTitle}>{t('invoice')}</Text>
              <Text style={styles.invoiceNumber}>#{fareDetails?.invoiceId || 'N/A'}</Text>
              <Text style={styles.invoiceDate}>{utils.formatDateAndTime(fareDetails?.invoicedAt)}</Text>
            </View>
            <View style={styles.carImageContainer}>
              <MaterialCommunityIcons name="car" size={32} color={colors.blue} />
            </View>
          </View>

          {/* Company and Customer Info */}
          <View style={styles.infoSection}>
            <View style={styles.companyInfo}>
              <Text style={styles.sectionTitle}>{t('supplier_info')}</Text>
              <Text style={styles.companyName}>{(mergedRideData.companyInfo && mergedRideData.companyInfo.name) || defaultCompanyInfo.name}</Text>
              <Text style={styles.companyAddress}>{(mergedRideData.companyInfo && mergedRideData.companyInfo.address) || defaultCompanyInfo.address}</Text>
                <View style={styles.companyContactContainer}>
                {/* <Ionicons name="call" size={20}color={'black'} /> */}
                <Text style={styles.companyContact}> {(mergedRideData.companyInfo && mergedRideData.companyInfo.phone) || defaultCompanyInfo.phone}</Text>
                </View>
                <View style={styles.companyContactContainer}>
                {/* <MaterialIcons name="email" size={20} color={'black'} /> */}
              {/* <Text style={styles.companyEmail}> {(mergedRideData.companyInfo && mergedRideData.companyInfo.email) || defaultCompanyInfo.email}</Text> */}
              </View>
          
              {/* <Text style={styles.companyGstin}>{t('gstin')}: {(mergedRideData.companyInfo && mergedRideData.companyInfo.gstin) || defaultCompanyInfo.gstin}</Text> */}
            </View>
            
            <View style={styles.customerInfo}>
              <Text style={styles.sectionTitle}>{t('recipient_info')}</Text>
              <Text style={styles.customerName}>{(mergedRideData.customerInfo && mergedRideData.customerInfo.name) || defaultCustomerInfo.name}</Text>
              <Text style={styles.customerAddress}>{(mergedRideData.customerInfo && mergedRideData.customerInfo.address) || defaultCustomerInfo.address}</Text>
              <View style={styles.customerContactContainer}>
              {/* <Ionicons name="call" size={20} color={'black'} /> */}
              <Text style={styles.customerContact}> {(mergedRideData.customerInfo && mergedRideData.customerInfo.phone) || defaultCustomerInfo.phone}</Text>
              </View>
              <View style={styles.customerContactContainer}>
              {/* <MaterialIcons name="email" size={20} color={'black'} /> */}
              {/* <Text style={styles.customerEmail}> {(mergedRideData.customerInfo && mergedRideData.customerInfo.email) || defaultCustomerInfo.email}</Text> */}
              </View>
            </View>
          </View>

          {/* Trip Details */}
          <View style={styles.tripDetails}>
            <Text style={styles.sectionTitle}>{t('trip_details')}</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('ride_type')}</Text>
              <Text style={styles.detailValue}>{vehicleDetails?.vehicleType}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('start_location')}</Text>
              <Text style={styles.detailValue}>{tripStops?.[0]?.address || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('end_location')}</Text>
              <Text style={styles.detailValue}>{tripStops?.[tripStops.length - 1]?.address || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('distance')}</Text>
              <Text style={styles.detailValue}>{formatDistance(tripDistance)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('duration')}</Text>
              <Text style={styles.detailValue}>{formatDuration(tripDuration)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('driver_name')}</Text>
              <Text style={styles.detailValue}>{mergedRideData.driverInfo?.driverName || defaultDriverInfo.driverName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('vehicle_number')}</Text>
              <Text style={styles.detailValue}>{mergedRideData.driverInfo?.vehicleNumber || defaultDriverInfo.vehicleNumber}</Text>
            </View>
          </View>

          {/* Invoice Breakdown */}
          <View style={styles.invoiceBreakdown}>
            <Text style={styles.sectionTitle}>{t('invoice_breakdown')}</Text>

            {/* Ride Cost */}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{t('ride_cost')}</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(rideCost)}</Text>
            </View>

            {/* Waiting Cost */}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{t('waiting_cost')}</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(waitingCost)}</Text>
            </View>

            {/* Coupon Discount */}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{t('coupon_discount')}</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(couponDiscount).replace('₹', '')}</Text>
            </View>

            {/* Subtotal */}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{t('subtotal')}</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(subtotal)}</Text>
            </View>

            {/* Taxes */}
            {Object.keys(taxes).length > 0 && (
              <View>
                {Object.entries(taxes).map(([taxKey, taxValue], idx) => (
                  <View key={`tax-${taxKey}-${idx}`} style={styles.taxRow}>
                    <Text style={styles.taxLabel}>
                      {humanizeKey(taxKey)} {taxValue?.type === 'percentage' && `(${taxValue?.value}%)`}
                    </Text>
                    <Text style={styles.taxValue}>{formatCurrency(taxValue?.tax || 0)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Fees With Tax */}
            {Object.keys(feesWithTax).length > 0 && (
              <View>
                {Object.entries(feesWithTax).map(([feeKey, feeObj], idx) => (
                  <View key={`fee-${feeKey}-${idx}`}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>{humanizeKey(feeKey)}</Text>
                      <Text style={styles.breakdownValue}>{formatCurrency(feeObj?.feeAmount || feeObj?.total || 0)}</Text>
                    </View>
                    {/* Fee Tax Breakdown */}
                    {feeObj?.taxAmount && (
                      Object.entries(feeObj.taxAmount).map(([tKey, tVal], tIdx) => (
                        <View key={`fee-tax-${feeKey}-${tKey}-${tIdx}`} style={styles.taxRow}>
                          <Text style={styles.taxLabel}>
                            {humanizeKey(tKey)} {tVal?.type === 'percentage' && `- ${tVal?.value}%`}
                          </Text>
                          <Text style={styles.taxValue}>{formatCurrency(tVal?.tax || 0)}</Text>
                        </View>
                      ))
                    )}
                    {/* Fee Total, if available and different */}
                    {/* {typeof feeObj?.total === 'number' && feeObj.total !== feeObj?.feeAmount && (
                      <View style={styles.taxRow}>
                        <Text style={styles.taxLabel}>{humanizeKey(feeKey)} Total</Text>
                        <Text style={styles.taxValue}>{formatCurrency(feeObj.total)}</Text>
                      </View>
                    )} */}
                  </View>
                ))}
              </View>
            )}

            {/* Grand Total */}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{t('total') || 'Total'}</Text>
              <Text style={styles.totalValue}>{formatCurrency(mergedRideData.finalFare || 0)}</Text>
            </View>
          </View>

          {/* Payment Info
          <View style={styles.paymentInfo}>
            <Text style={styles.sectionTitle}>{t('payment_info')}</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('payment_method')}</Text>
              <Text style={styles.detailValue}>{mergedRideData.paymentMethod}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('payment_status')}</Text>
              <Text style={styles.detailValue}>{mergedRideData.passengerPaymentStatus?.toUpperCase() || 'PENDING'}</Text>
            </View>
          </View> */}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleMultiSheetPDF}
              disabled={loadingInvoice}
            >
              {loadingInvoice ? (
                <MaterialIcons name="hourglass-empty" size={24} color={colors.white} />
              ) : (
                <MaterialIcons name="file-download" size={24} color={colors.white} />
              )}
              <Text style={styles.downloadButtonText}>
                {loadingInvoice ? ` ${t('downloading')}...` : ` ${t('download_invoice')}`}
              </Text>
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.emailButton} onPress={handleEmailInvoice}>
              <Text style={styles.emailButtonText}><MaterialIcons name="email" size={16} color="#2196F3" /> {t('email_invoice')}</Text>
            </TouchableOpacity> */}
          </View>
        </ScrollView>

        {/* Floating Toast */}
        {showToast && (
          <View style={styles.toast}>
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
        onRequestClose={handleBackPress}
      >
        {content}
      </Modal>
    );
  }

  // Inline mode: ignore `visible` and just render content
  return content;
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
  invoiceHeader: {
    backgroundColor: 'black',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  invoiceTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: "white",
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  invoiceNumber: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.blue,
    marginBottom: 4,
  },
  invoiceDate: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.grey_xxdark,
  },
  carImageContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blue_light,
    borderRadius: 30,
  },
  infoSection: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  companyInfo: {
    flex: 1,
    backgroundColor: colors.white,
    gap:5,
    borderRadius: 10,
    padding: 16,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  customerInfo: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap:5
  },
  sectionTitle: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.grey_xxdark,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  companyName: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: colors.black,
    marginBottom: 4,
  },
  companyAddress: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.grey_xxdark,
    marginBottom: 4,
  },
  companyContact: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: colors.grey_xxdark,
 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  companyEmail: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: colors.grey_xxdark,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  companyGstin: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.grey_xxdark,
    marginBottom: 2,
  },
  customerName: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: colors.black,
    marginBottom: 4,
  },
  customerAddress: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.grey_xxdark,
    marginBottom: 4,
  },
  customerContact: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.grey_xxdark,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerEmail: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.grey_xxdark,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripDetails: {
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
    paddingVertical: 8,
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
  invoiceBreakdown: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey_light,
  },
  breakdownLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.black,
    flex: 1,
  },
  breakdownValue: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.black,
    textAlign: 'right',
    flex: 1,
  },
  totalValue: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: colors.green,
    textAlign: 'right',
    flex: 1,
  },
  paymentInfo: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: colors.black,
   
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginRight: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  downloadButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  emailButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  companyContactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerContactContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey_light,
  },
  taxLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.grey_xxdark,
    flex: 1,
  },
  taxValue: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.grey_xxdark,
    textAlign: 'right',
    flex: 1,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: "15%",
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
  }
});

InvoiceScreen.propTypes = {
  rideId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tripDistance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tripDuration: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  driverDetails: PropTypes.shape({
    driverName: PropTypes.string,
    driverRating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    driverPhotoUrl: PropTypes.string,
    driverPhoto: PropTypes.string,
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

export default InvoiceScreen; 