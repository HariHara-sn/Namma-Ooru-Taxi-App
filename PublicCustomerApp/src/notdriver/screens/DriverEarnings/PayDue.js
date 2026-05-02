import {
  ActivityIndicator,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import RazorpayCheckout from 'react-native-razorpay';
import usePublicDriverStore from '../../store/usePublicDriverStore';
import useTripsStore from '../../store/useTripsStore';
import APIRequest from '../../../common/APIRequest';
import { showNotification } from '../../../common/components/Alerts/showNotification';
import { DateTimeFormatter } from '../../../common/utils/DateTimeFormatter';
import { Colors, contactMail, contactPhone, Fonts } from '../../../common/constants/constants';
import { useTranslation } from 'react-i18next';
import useUserStore from '../../../common/store/useUserStore';

const toNumber = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatCurrency = value => `₹${toNumber(value).toFixed(2)}`;

const formatLabel = key => {
  if (!key || typeof key !== 'string') {
    return 'Item';
  }
  return key
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(.)|\s+(.)/g, match => match.toUpperCase());
};

const formatTypeSuffix = item => {
  if (!item || typeof item !== 'object') {
    return '';
  }

  const rawType = typeof item.type === 'string' ? item.type.toLowerCase() : '';
  if (!rawType) {
    return '';
  }

  const rawValue = item.value ?? item.amount;
  if (rawValue === undefined || rawValue === null) {
    return '';
  }

  const numericValue = Number(rawValue);
  const hasNumericValue = Number.isFinite(numericValue);
  const stringValue = hasNumericValue
    ? numericValue % 1 === 0
      ? numericValue.toString()
      : numericValue.toFixed(2)
    : String(rawValue);

  switch (rawType) {
    case 'percentage':
      return `${stringValue}%`;
    case 'fixed':
      return `₹${hasNumericValue ? numericValue.toFixed(2) : stringValue}`;
    case 'multiplier':
      return `×${stringValue}`;
    default:
      return '';
  }
};

const DEFAULT_SUMMARY_ORDER = [
  'baseAmount',
  'feesAmount',
  'amountWithFeesBeforeTax',
  'subtotalBeforeTax',
  'feesTax',
  'totalTax',
  'amountWithFees',
  'driverDue',
  'totalPayable',
];

const ALWAYS_INCLUDE_SUMMARY_KEYS = new Set(['driverDue']);
const EXCLUDE_SUMMARY_KEYS = new Set(['totalPayable', 'baseAmount']);

const getInvoiceLabel = (translations, key) => {
  if (translations && typeof translations === 'object') {
    const maybeLabel = translations[key];
    if (typeof maybeLabel === 'string' && maybeLabel.trim().length > 0) {
      return maybeLabel;
    }
  }
  return formatLabel(key);
};

const buildSummaryStructure = (data = {}, fallbackDue = 0) => {
  const summaryMap = {};
  const rawOrder = [];

  const register = (key, value, {fallbackValue, force} = {}) => {
    const candidate = value ?? fallbackValue;
    if (candidate === undefined || candidate === null) {
      if (!force) {
        return;
      }
    }
    const numericValue = toNumber(candidate ?? 0);
    summaryMap[key] = numericValue;
    if (!rawOrder.includes(key)) {
      rawOrder.push(key);
    }
  };

  register('baseAmount', data.baseAmount, {fallbackValue: fallbackDue, force: true});
  register('totalTax', data.totalTax, {fallbackValue: data.feesTax});
  const driverDueCandidate =
    data.driverDue ?? data.amountWithFees ?? fallbackDue;
  register('driverDue', data.driverDue, {
    fallbackValue: driverDueCandidate,
    force: true,
  });

  const totalPayableCandidate =
    data.totalPayable ?? driverDueCandidate;
  register('totalPayable', data.totalPayable, {
    fallbackValue: totalPayableCandidate,
    force: true,
  });

  const summaryKeys = Object.keys(summaryMap);
  const orderedKeys = DEFAULT_SUMMARY_ORDER.filter(key => summaryKeys.includes(key));
  summaryKeys.forEach(key => {
    if (!orderedKeys.includes(key)) {
      orderedKeys.push(key);
    }
  });

  return {summaryMap, summaryOrder: orderedKeys};
};

const createInvoiceState = baseAmount => {
  const amount = toNumber(baseAmount);
  const {summaryMap, summaryOrder} = buildSummaryStructure(
    {
      baseAmount: amount,
      amountWithFeesBeforeTax: amount,
      subtotalBeforeTax: amount,
      amountWithFees: amount,
      driverDue: amount,
      totalPayable: amount,
      feesAmount: 0,
      feesTax: 0,
      totalTax: 0,
    },
    amount,
  );
  return {
    baseAmount: amount,
    feesAmount: 0,
    amountWithFeesBeforeTax: amount,
    amountWithFees: amount,
    feesTax: 0,
    subtotalBeforeTax: amount,
    totalTax: 0,
    driverDue: amount,
    adjustments: {},
    totalPayable: amount,
    summaryMap,
    summaryOrder,
    hasRemoteData: false,
  };
};

const PayDue = ({driverDue, driverDueDate , fetchDueDate, driverInfo}) => {
  const {setDriverDue, minDueAmount, razorpayLinkedAccountDetails} = usePublicDriverStore();
  const {driverConfig} = useTripsStore();
  const {t} = useTranslation()
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(() =>
    createInvoiceState(driverDue),
  );
  const {userInfo} = useUserStore()

  const updateTransactionID = async paymentResponse => {
    try {
      const api = new APIRequest();
      const payload = {
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
        signature: paymentResponse.razorpay_signature,
      };
      const response = await api.request(
        `/publicrides/payments/driver/updateDriverPaymentID`,
        'POST',
        payload,
        userInfo?.token,
      );
      if (response.success) {
        const driverDetails = response?.driverDetails || {};
        const dueAmount = toNumber(driverDetails?.driverDue || 0);
        setDriverDue(dueAmount);
        showNotification('Payment Successful', 'Your payment was successful', 'success');
      } 
    } catch (error) {
      console.log('hari-->> update transaction id error', error);
      // showNotification('Payment Confirmation Failed', 'Please contact support', 'error');
    }
  }

  useEffect(() => {
    setInvoiceDetails(prev => {
      if (prev.hasRemoteData) {
        return prev;
      }
      return createInvoiceState(driverDue);
    });
  }, [driverDue]);

  const pay = async order => {
    const options = {
      key: driverConfig?.RAZORPAY_KEY_ID,
      // key: 'rzp_test_RYpW0I0MGrz5QH',
      amount: order?.amount,
      currency: order?.currency,
      name: 'NammaOoruTaxi',
      description: 'Ride payment',
      order_id: order?.id,
      prefill: {
        name: driverInfo?.name || 'NammaOoruTaxi',
        email: razorpayLinkedAccountDetails?.email || contactMail,
        contact: driverInfo?.phone || contactPhone,
      },
      theme: {color: '#0ea5e9'},
    };
    try {
      const res = await RazorpayCheckout.open(options);
      // console.log('hari-->> razorpay response', res);
      if (res.razorpay_payment_id) {
        updateTransactionID(res);
        setInvoiceVisible(false);
        fetchDueDate?.();
      }
    } catch (e) {
      // console.log('hari-->> razorpay', e);
      showNotification('Payment Failed', 'Payment failed', 'error');
      throw e;
    }
  };

  const handlePayDue = async () => {
    setIsPaymentProcessing(true);
    try {
      const api = new APIRequest();
      const summaryMapRef = invoiceDetails?.summaryMap || {};
      const payableAmount = toNumber(
        summaryMapRef.totalPayable ??
          summaryMapRef.driverDue ??
          invoiceDetails?.totalPayable ??
          invoiceDetails?.driverDue ??
          driverDue,
      );
      const payload = {
        amount: payableAmount,
        receiptId: Math.random().toString(36).substring(2, 15),
        currency: 'INR',
      };
      const response = await api.request(
        `/publicrides/payments/driver/create-order`,
        'POST',
        payload,
        userInfo?.token,
      );
      if (response.success) {
        const order = response.order;
        await pay(order);
      } else {
        showNotification('Something Went Wrong', 'Please Try Again', 'error');
      }
    } catch (error) {
      console.log('hari-->> pay due error', error);
    }
    setIsPaymentProcessing(false);
  };

  const openInvoice = async () => {
    setIsSummaryLoading(true);
    try {
      const api = new APIRequest();
      const payload = {
        DueAmount: toNumber(driverDue),
      };
      const response = await api.request(
        '/publicrides/driver/v2/getDueInvoice',
        'POST',
        payload,
        userInfo?.token,
      );
      if (response.success && response.data) {
        const data = response.data;
        const {summaryMap, summaryOrder} = buildSummaryStructure(
          data,
          driverDue,
        );
        const driverDueValue = toNumber(
          summaryMap.driverDue ?? data.driverDue ?? data.amountWithFees ?? driverDue,
        );
        const totalPayableValue = toNumber(
          summaryMap.totalPayable ?? data.totalPayable ?? driverDueValue,
        );
        const normalized = {
          baseAmount: toNumber(
            summaryMap.baseAmount ?? data.baseAmount ?? driverDue,
          ),
          adjustments: data.adjustments || {},
          totalPayable: totalPayableValue,
          summaryMap,
          summaryOrder,
          hasRemoteData: true,
        };
        setInvoiceDetails(normalized);
        setInvoiceVisible(true);
      } else {
        showNotification('Unable to fetch receipt', 'Please try again', 'error');
      }
    } catch (error) {
      // console.log('hari-->> fetch invoice error', error);
      showNotification('Unable to fetch invoice', 'Please try again', 'error');
    }
    setIsSummaryLoading(false);
  };

  const isPayEnabled =
    DateTimeFormatter.requiredDateFormat(driverDueDate, 'YYYY-MM-DD') <=
      DateTimeFormatter.requiredDateFormat(
        new Date(Date.now() + 24 * 60 * 60 * 1000),
        'YYYY-MM-DD',
      ) && driverDue >= minDueAmount;

  const summaryRows = useMemo(() => {
    if (!invoiceDetails) {
      return [];
    }
    const map = invoiceDetails.summaryMap || {};
    const order = invoiceDetails.summaryOrder || [];
    return order
      .filter(key => !EXCLUDE_SUMMARY_KEYS.has(key))
      .filter(key => {
        if (ALWAYS_INCLUDE_SUMMARY_KEYS.has(key)) {
          return true;
        }
        const value = map[key];
        return value !== undefined && value !== null && toNumber(value) !== 0;
      })
      .map(key => {
        const rawValue =
          key === 'driverDue'
            ? map.baseAmount ?? map[key]
            : map[key];
        return {
          key,
          label: getInvoiceLabel(t, key),
          value: formatCurrency(rawValue),
        };
      });
  }, [invoiceDetails, t]);

  const summaryMap = invoiceDetails?.summaryMap || {};
  const displayedDueValue =
    summaryMap.driverDue ??
    summaryMap.totalPayable ??
    (invoiceDetails?.hasRemoteData ? invoiceDetails.driverDue : driverDue);
  const displayedDue = toNumber(displayedDueValue);
  const totalPayableValue =
    summaryMap.totalPayable ?? invoiceDetails?.totalPayable ?? displayedDue;

  const adjustmentEntries = Object.entries(
    invoiceDetails?.adjustments || {},
  );

  return (
    <View style={styles.headerContinaer}>
      <ImageBackground
        source={require('../../assets/images/earningsBg.png')}
        resizeMode="cover"
        style={styles.headerContinaerBG}>
        <View style={styles.payDueContainer}>
          <Text style={styles.payDueText}>{t('pay_due_amount')}</Text>
          <Text style={styles.priceTxt}>₹{driverDue ? driverDue?.toFixed(2) : 0}</Text>
          {driverDueDate && (
            <Text style={styles.dueTxt}>
              {t('next_due_date')}:{' '}
              {DateTimeFormatter.requiredDateFormat(
                driverDueDate,
                'D MMM,YYYY',
              )}
            </Text>
          )}
          {driverDueDate && (
            <TouchableOpacity
              style={[
                styles.payNowBtn,
                {
                  opacity: isPayEnabled ? 1 : 0.5,
                }
              ]}
              disabled={!isPayEnabled || isSummaryLoading}
              onPress={openInvoice}>
              {isSummaryLoading || isPaymentProcessing ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.payNowBtnTxt}>{t('pay_now')}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ImageBackground>
      <Modal
        transparent
        visible={invoiceVisible}
        animationType="fade"
        onRequestClose={() => {
          if (!isPaymentProcessing) {
            setInvoiceVisible(false);
          }
        }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.invoiceTitle}>{t('invoice') || 'Invoice'}</Text>
            {summaryRows.length > 0
              ? summaryRows.map(row => (
                  <View style={styles.invoiceRow} key={row.key}>
                    <Text style={styles.invoiceLabel}>{row.label}</Text>
                    <Text style={styles.invoiceValue}>{row.value}</Text>
                  </View>
                ))
              : (
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>
                      {getInvoiceLabel(t, 'driverDue')}
                    </Text>
                    <Text style={styles.invoiceValue}>
                      {formatCurrency(summaryMap.baseAmount ?? displayedDue)}
                    </Text>
                  </View>
                )}
            {adjustmentEntries.map(([key, adjustment]) => (
              <View style={styles.adjustmentSection} key={key}>
                <View style={styles.invoiceRow}>
                  {(() => {
                    const typeSuffix = formatTypeSuffix(adjustment);
                    const labelText = (adjustment?.label || formatLabel(key))
                      + (typeSuffix ? ` (${typeSuffix})` : '');
                    return (
                      <Text style={styles.invoiceLabel}>{labelText}</Text>
                    );
                  })()}
                  <Text style={styles.invoiceValue}>
                    {formatCurrency(adjustment?.amount)}
                  </Text>
                </View>
                {adjustment?.tax &&
                  Object.entries(adjustment.tax).map(([taxKey, taxValue]) => (
                    <View style={styles.taxRow} key={`${key}-${taxKey}`}>
                      {(() => {
                        const taxSuffix = formatTypeSuffix(taxValue);
                        const labelText = formatLabel(taxKey)
                          + (taxSuffix ? ` (${taxSuffix})` : '');
                        return (
                          <Text style={styles.taxLabel}>{labelText}</Text>
                        );
                      })()}
                      <Text style={styles.taxValue}>
                        {formatCurrency(
                          typeof taxValue === 'object' && taxValue !== null
                            ? taxValue.amount
                            : taxValue,
                        )}
                      </Text>
                    </View>
                  ))}
                {adjustment?.taxTotal !== undefined && (
                  <View style={styles.taxRow}>
                    <Text style={styles.taxLabel}>
                      {getInvoiceLabel(t, 'tax_total')}
                    </Text>
                    <Text style={styles.taxValue}>
                      {formatCurrency(adjustment.taxTotal)}
                    </Text>
                  </View>
                )}
                {adjustment?.totalWithTax !== undefined && (
                  <View style={styles.taxRow}>
                    <Text style={styles.taxLabel}>
                      {getInvoiceLabel(t, 'total_with_tax')}
                    </Text>
                    <Text style={styles.taxValue}>
                      {formatCurrency(adjustment.totalWithTax)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            <View style={styles.invoiceDivider} />
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceTotalLabel}>
                {getInvoiceLabel(t, 'totalPayable')}
              </Text>
              <Text style={styles.invoiceTotalValue}>
                {formatCurrency(totalPayableValue)}
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                disabled={isPaymentProcessing}
                onPress={() => setInvoiceVisible(false)}>
                <Text style={styles.cancelButtonText}>{t('cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  isPaymentProcessing && styles.disabledButton,
                  {
                    opacity: isPayEnabled ? 1 : 0.5,
                  }
                ]}
                disabled={!isPayEnabled || isSummaryLoading || isPaymentProcessing}
                onPress={handlePayDue}>
                {isPaymentProcessing ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>{t('pay_now') || 'Pay Now'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PayDue;

const styles = StyleSheet.create({
  headerContinaer: {
    marginTop: 20,
    width: '90%',
    alignSelf: 'center',
    minHeight: 180, 
    maxHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 10,
  },
  payDueText: {
    fontFamily: Fonts.regular,
    color: '#004B49',
    fontSize: 16,
    marginLeft: 20,
    marginTop: 10,
  },
  priceTxt: {
    fontFamily: Fonts.medium,
    color: '#004B49',
    fontSize: 30,
    marginLeft: 20,
    marginTop: 10,
  },
  dueTxt: {
    fontFamily: Fonts.regular,
    color: '#004B49',
    fontSize: 12,
    marginLeft: 20,
    marginTop: 10,
  },
  payNowBtn: {
    backgroundColor: '#004B49',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginRight: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  payNowBtnTxt: {
    fontFamily: Fonts.regular,
    color: Colors.white,
    fontSize: 14,
  },
  payDueContainer: {
    width: '100%',
    height: '100%',
  },
  headerContinaerBG: {
    width: '100%',
    paddingTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  invoiceTitle: {
    fontFamily: Fonts.medium,
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  adjustmentSection: {
    marginTop: 8,
  },
  invoiceLabel: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#1e293b',
  },
  invoiceValue: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#1e293b',
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  invoiceTotalLabel: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: '#0f172a',
  },
  invoiceTotalValue: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: '#0f172a',
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    paddingLeft: 12,
  },
  taxLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#475569',
  },
  taxValue: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#475569',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#004B49',
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#1e293b',
  },
  confirmButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.white,
  },
});
