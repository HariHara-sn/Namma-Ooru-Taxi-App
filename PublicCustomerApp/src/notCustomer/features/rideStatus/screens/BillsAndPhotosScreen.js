import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { getTripDetails, approveBill, markBillAsPaid, uploadPaymentReceipt } from '../../../API/EndPoints/EndPoints';
import { getPresignedImageUrl } from '../../../../common/utils/getPresignedImageUrl';
import { colors, Fonts } from '../../../constants/constants';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import useCurrentRideInfoStore from '../store/useCurrentRideInfoStore';

const PHOTO_LABELS = {
  front: 'Front',
  rear: 'Rear',
  leftSide: 'Left Side',
  rightSide: 'Right Side',
};

const normalizeKey = (url) =>
  url?.trim().replace(/^https?:\/\/[^/]+\/?/, '').replace(/^\//, '') || '';

const BillsAndPhotosScreen = ({ tripId }) => {
  const { goBack } = useStackScreenStore();
  const { userdetails } = useUserInfoStore();
  const token = userdetails?.token || null;

  const { bills: socketBills } = useCurrentRideInfoStore();
  // Track the last socketBills reference we processed so we only react to genuine changes
  const socketBillsRef = useRef(socketBills);

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  // Keep a stable ref to bills so the socket sync effect can read it without being a dep
  const billsRef = useRef(bills);
  useEffect(() => { billsRef.current = bills; }, [bills]);
  const [driverInfo, setDriverInfo] = useState({});
  const [preTripPhotos, setPreTripPhotos] = useState({});
  const [postTripPhotos, setPostTripPhotos] = useState({});
  const [previewUri, setPreviewUri] = useState(null);
  // tracks per-bill action: 'payNow' | 'payLater' | 'rejected' | 'paid'
  const [billActions, setBillActions] = useState({});
  const [billLoadingIdx, setBillLoadingIdx] = useState(null);
  const [paidLoadingIdx, setPaidLoadingIdx] = useState(null);
  // payment receipts: { [idx]: localUri | uploadedUrl }
  const [paymentReceiptUris, setPaymentReceiptUris] = useState({});
  const [receiptUploadingIdx, setReceiptUploadingIdx] = useState(null);
  // source picker modal
  const [sourcePickerVisible, setSourcePickerVisible] = useState(false);
  const [pendingPickerIdx, setPendingPickerIdx] = useState(null);

  const resolveUrl = useCallback(
    async (rawUrl) => {
      const key = normalizeKey(rawUrl);
      if (!key || !token) return null;
      return getPresignedImageUrl(key, token);
    },
    [token],
  );

  const payViaUpi = async ({ amount, upiId, name }) => {
    const txnRef = `TXN${Date.now()}`;
    const note = 'Ride Bill Payment';

    const url =
      `upi://pay?pa=${encodeURIComponent(upiId)}` +
      `&pn=${encodeURIComponent(name)}` +
      `&tr=${encodeURIComponent(txnRef)}` +
      `&tn=${encodeURIComponent(note)}` +
      `&am=${encodeURIComponent(parseFloat(amount).toFixed(2))}` +
      `&cu=INR`;

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Error', 'No UPI app found on this device');
      return false;
    }

    try {
      await Linking.openURL(url);
      return true;
    } catch (e) {
      Alert.alert('Error', 'Unable to open UPI app');
      return false;
    }
  };

  useEffect(() => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    let active = true;

    const fetchData = async () => {
      try {
        const data = await getTripDetails(tripId);
        if (!active) return;

        const tripBills = data?.trip?.bills?.bills || [];
        const preRaw = data?.trip?.bills?.preTripVehiclePhotos || {};
        const postRaw = data?.trip?.bills?.postTripVehiclePhotos || {};

        // Resolve receipt photos for bills
        const billsWithUrls = await Promise.all(
          tripBills.map(async (bill) => ({
            ...bill,
            receiptPhotoUri: bill.receiptPhoto
              ? await resolveUrl(bill.receiptPhoto)
              : null,
          })),
        );
        if (!active) return;

        // Resolve pre-trip vehicle photo URLs
        const resolvedPre = {};
        for (const key of Object.keys(PHOTO_LABELS)) {
          if (preRaw[key]) {
            resolvedPre[key] = await resolveUrl(preRaw[key]);
          }
        }
        if (!active) return;

        // Resolve post-trip vehicle photo URLs
        const resolvedPost = {};
        for (const key of Object.keys(PHOTO_LABELS)) {
          if (postRaw[key]) {
            resolvedPost[key] = await resolveUrl(postRaw[key]);
          }
        }
        if (!active) return;

        setBills(billsWithUrls);
        setPreTripPhotos(resolvedPre);
        setPostTripPhotos(resolvedPost);
        setDriverInfo(data?.trip?.driverInfo || {});

        // Seed billActions from existing approval values
        const initialActions = {};
        const initialReceipts = {};
        billsWithUrls.forEach((bill, idx) => {
          if (bill.approval === 'approved') initialActions[idx] = 'payNow';
          if (bill.approval === 'rejected') initialActions[idx] = 'rejected';
          if (bill.paidAt) initialActions[idx] = 'paid';
          if (bill.paymentReceiptPhoto) {
            resolveUrl(bill.paymentReceiptPhoto).then(url => {
              if (url) setPaymentReceiptUris(prev => ({ ...prev, [idx]: url }));
            });
          }
        });
        setBillActions(initialActions);
      } catch (e) {
        // silently handle
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [tripId, resolveUrl]);

  // Sync bills from socket store when driver adds or deletes a bill in real-time
  useEffect(() => {
    // Skip if no change in the socket store reference (same object = no new socket event)
    if (socketBills === socketBillsRef.current) return;
    socketBillsRef.current = socketBills;
    // Don't update while the initial API fetch is still running (it will set bills itself)
    if (loading) return;
    if (!socketBills?.bills) return;

    let active = true;
    (async () => {
      try {
        const tripBills = socketBills.bills;
        const billsWithUrls = await Promise.all(
          tripBills.map(async (bill) => {
            // Reuse an already-resolved URL for the same receipt photo key
            const existing = billsRef.current.find(b => b.receiptPhoto && b.receiptPhoto === bill.receiptPhoto);
            return {
              ...bill,
              receiptPhotoUri:
                existing?.receiptPhotoUri ||
                (bill.receiptPhoto ? await resolveUrl(bill.receiptPhoto) : null),
            };
          }),
        );
        if (!active) return;
        setBills(billsWithUrls);
        // Re-seed bill action states from approval values
        const newActions = {};
        billsWithUrls.forEach((bill, idx) => {
          if (bill.approval === 'approved') newActions[idx] = 'payNow';
          if (bill.approval === 'rejected') newActions[idx] = 'rejected';
          if (bill.paidAt) newActions[idx] = 'paid';
          if (bill.paymentReceiptPhoto) {
            resolveUrl(bill.paymentReceiptPhoto).then(url => {
              if (url) setPaymentReceiptUris(prev => ({ ...prev, [idx]: url }));
            });
          }
        });
        setBillActions(newActions);
      } catch {
        // silently handle
      }
    })();

    return () => {
      active = false;
    };
  }, [socketBills, loading, resolveUrl, bills]);

  const hasPrePhotos = Object.values(preTripPhotos).some(Boolean);
  const hasPostPhotos = Object.values(postTripPhotos).some(Boolean);
  const isEmpty = !loading && bills.length === 0 && !hasPrePhotos && !hasPostPhotos;

  const handleBillAction = async (idx, action) => {
    if (action === 'payNow') {
      const bill = bills[idx];
      const opened = await payViaUpi({
        amount: bill.amount,
        upiId: driverInfo?.upiid || '',
        name: driverInfo?.driverName || 'Driver',
      });
      if (!opened) return;
    }

    if (action === 'approved') return

    const approval = action === 'rejected' ? 'rejected' : 'approved';
    setBillLoadingIdx(idx);
    try {
      const res = await approveBill(String(tripId), idx, approval);
      if (res?.success) {
        setBillActions(prev => ({ ...prev, [idx]: action }));
      } else {
        Alert.alert('Error', res?.message || 'Could not update bill.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setBillLoadingIdx(null);
    }
  };

  const handleMarkAsPaid = async (idx) => {
    setPaidLoadingIdx(idx);
    try {
      const res = await markBillAsPaid(String(tripId), idx);
      if (res?.success) {
        setBillActions(prev => ({ ...prev, [idx]: 'paid' }));
      } else {
        Alert.alert('Error', res?.message || 'Could not mark bill as paid.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setPaidLoadingIdx(null);
    }
  };

  const runPicker = useCallback((launcher, idx) => {
    const pickerOptions = { mediaType: 'photo', maxWidth: 1200, maxHeight: 1200, quality: 0.85 };
    launcher(pickerOptions, async (response) => {
      if (response.didCancel || !response.assets?.[0]) return;
      const asset = response.assets[0];
      setReceiptUploadingIdx(idx);
      setPaymentReceiptUris(prev => ({ ...prev, [idx]: asset.uri }));
      try {
        const res = await uploadPaymentReceipt(String(tripId), idx, asset);
        if (res?.success && res?.url) {
          setPaymentReceiptUris(prev => ({ ...prev, [idx]: res.url }));
        } else {
          Alert.alert('Error', res?.message || 'Could not upload receipt.');
          setPaymentReceiptUris(prev => { const next = { ...prev }; delete next[idx]; return next; });
        }
      } catch {
        Alert.alert('Error', 'Something went wrong uploading the receipt.');
        setPaymentReceiptUris(prev => { const next = { ...prev }; delete next[idx]; return next; });
      } finally {
        setReceiptUploadingIdx(null);
      }
    });
  }, [tripId]);

  const handleUploadReceipt = (idx) => {
    setPendingPickerIdx(idx);
    setSourcePickerVisible(true);
  };

  const handlePickSource = useCallback(async (source) => {
    const idx = pendingPickerIdx;
    setSourcePickerVisible(false);
    setPendingPickerIdx(null);
    if (source === 'gallery') {
      runPicker(launchImageLibrary, idx);
      return;
    }
    // Camera — request permission on Android
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs camera access to take a photo of your payment receipt.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Camera permission is required. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
          return;
        }
      } catch {
        Alert.alert('Error', 'Could not request camera permission.');
        return;
      }
    }
    runPicker(launchCamera, idx);
  }, [pendingPickerIdx, runPicker]);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bills & Photos</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingTxt}>Loading details…</Text>
        </View>
      ) : isEmpty ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="receipt-outline" size={40} color="#93C5FD" />
          </View>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyText}>No bills or vehicle photos have been added for this trip</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Driver Bills */}
          {bills.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <Ionicons name="receipt-outline" size={16} color="#2563EB" />
                </View>
                <Text style={styles.sectionTitle}>Driver Bills</Text>
                <View style={styles.billCountBadge}>
                  <Text style={styles.billCountTxt}>{bills.length}</Text>
                </View>
              </View>
              {bills.map((bill, idx) => {
                const action = billActions[idx] || null;
                const isLoading = billLoadingIdx === idx;
                return (
                  <View key={idx} style={[styles.billCard, action === 'rejected' && styles.billCardRejected, action === 'paid' && styles.billCardPaid]}>
                    {/* Bill header row */}
                    <View style={styles.billHeaderRow}>
                      <View style={styles.billIconWrap}>
                        <Ionicons name="receipt-outline" size={16} color={action === 'rejected' ? '#DC2626' : '#2563EB'} />
                      </View>
                      <Text style={styles.billDesc} numberOfLines={2}>{bill.description || 'Expense'}</Text>
                      <View style={[styles.amountPill, action === 'rejected' && styles.amountPillRejected]}>
                        <Text style={[styles.amountPillTxt, action === 'rejected' && styles.amountPillTxtRejected]}>
                          ₹{parseFloat(bill.amount || 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {bill.receiptPhotoUri && (
                      <TouchableOpacity onPress={() => setPreviewUri(bill.receiptPhotoUri)} activeOpacity={0.8} style={styles.receiptThumbWrap}>
                        <Image source={{ uri: bill.receiptPhotoUri }} style={styles.receiptThumb} resizeMode="cover" />
                        <View style={styles.receiptThumbOverlay}>
                          <Ionicons name="expand-outline" size={18} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* Status / Action area */}
                    {action ? (
                      <View style={[styles.statusBadge, action === 'rejected' ? styles.statusRejected : styles.statusPaid]}>
                        <Ionicons
                          name={action === 'rejected' ? 'close-circle' : 'checkmark-circle'}
                          size={15}
                          color={action === 'rejected' ? '#DC2626' : '#16A34A'}
                        />
                        <Text style={[styles.statusTxt, action === 'rejected' ? styles.statusTxtRejected : styles.statusTxtPaid]}>
                          {action === 'rejected' ? 'Bill Rejected' : 'Payment Confirmed'}
                        </Text>
                      </View>
                    ) : (isLoading || paidLoadingIdx === idx) ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#2563EB" />
                        <Text style={styles.loadingRowTxt}>Processing…</Text>
                      </View>
                    ) : (
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.paidBtn]}
                          onPress={() => handleMarkAsPaid(idx)}
                          activeOpacity={0.8}>
                          <Ionicons name="checkmark-done" size={14} color="#fff" />
                          <Text style={styles.actionTxt}>Mark Paid</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() => handleBillAction(idx, 'rejected')}
                          activeOpacity={0.8}>
                          <Ionicons name="close" size={14} color="#fff" />
                          <Text style={styles.actionTxt}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Payment receipt upload — visible for non-rejected bills */}
                    {action !== 'rejected' && (
                      <View style={styles.receiptSection}>
                        <Text style={styles.receiptSectionLabel}>Payment Receipt</Text>
                        {receiptUploadingIdx === idx ? (
                          <View style={styles.receiptLoading}>
                            <ActivityIndicator size="small" color="#2563EB" />
                            <Text style={styles.receiptUploadingTxt}>Uploading…</Text>
                          </View>
                        ) : paymentReceiptUris[idx] ? (
                          <View style={styles.receiptRow}>
                            <TouchableOpacity onPress={() => setPreviewUri(paymentReceiptUris[idx])} activeOpacity={0.8}>
                              <Image source={{ uri: paymentReceiptUris[idx] }} style={styles.receiptThumbSmall} resizeMode="cover" />
                            </TouchableOpacity>
                            <View style={styles.receiptInfoCol}>
                              <View style={styles.receiptUploadedRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                                <Text style={styles.receiptUploadedTxt}>Receipt uploaded</Text>
                              </View>
                              <TouchableOpacity style={styles.editReceiptBtn} onPress={() => handleUploadReceipt(idx)} activeOpacity={0.8}>
                                <Ionicons name="create-outline" size={13} color="#2563EB" />
                                <Text style={styles.editReceiptTxt}>Change</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity style={styles.uploadReceiptBtn} onPress={() => handleUploadReceipt(idx)} activeOpacity={0.8}>
                            <View style={styles.uploadIconCircle}>
                              <Ionicons name="cloud-upload-outline" size={18} color="#2563EB" />
                            </View>
                            <Text style={styles.uploadReceiptTxt}>Upload Payment Receipt</Text>
                            <Ionicons name="chevron-forward" size={16} color="#93C5FD" />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Pre-trip Vehicle Photos */}
          {hasPrePhotos && (
            <PhotoSection
              title="Pre-trip Photos"
              iconName="car-outline"
              photos={preTripPhotos}
              onPress={setPreviewUri}
            />
          )}

          {/* Post-trip Vehicle Photos */}
          {hasPostPhotos && (
            <PhotoSection
              title="Post-trip Photos"
              iconName="camera-outline"
              photos={postTripPhotos}
              onPress={setPreviewUri}
            />
          )}
        </ScrollView>
      )}

      {/* Full-screen Image Preview */}
      <Modal
        visible={!!previewUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewUri(null)} activeOpacity={0.8}>
            <View style={styles.previewCloseCircle}>
              <Icon name="close" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
          {previewUri && (
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* Source Picker Modal */}
      <Modal
        visible={sourcePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setSourcePickerVisible(false); setPendingPickerIdx(null); }}>
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => { setSourcePickerVisible(false); setPendingPickerIdx(null); }}>
          <View style={styles.pickerSheet}>
            {/* Handle bar */}
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Upload Payment Receipt</Text>
            <Text style={styles.pickerSubtitle}>Choose how you'd like to add the photo</Text>

            <TouchableOpacity
              style={styles.pickerOption}
              activeOpacity={0.8}
              onPress={() => handlePickSource('camera')}>
              <View style={[styles.pickerOptionIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="camera" size={24} color="#2563EB" />
              </View>
              <View style={styles.pickerOptionText}>
                <Text style={styles.pickerOptionTitle}>Take a Photo</Text>
                <Text style={styles.pickerOptionDesc}>Open camera to capture receipt</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <View style={styles.pickerDivider} />

            <TouchableOpacity
              style={styles.pickerOption}
              activeOpacity={0.8}
              onPress={() => handlePickSource('gallery')}>
              <View style={[styles.pickerOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="images" size={24} color="#16A34A" />
              </View>
              <View style={styles.pickerOptionText}>
                <Text style={styles.pickerOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.pickerOptionDesc}>Pick an existing photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerCancelBtn}
              activeOpacity={0.8}
              onPress={() => { setSourcePickerVisible(false); setPendingPickerIdx(null); }}>
              <Text style={styles.pickerCancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const PhotoSection = ({ title, iconName, photos, onPress }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>
        <Ionicons name={iconName || 'camera-outline'} size={16} color="#2563EB" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.photoGrid}>
      {Object.entries(PHOTO_LABELS).map(([key, label]) =>
        photos[key] ? (
          <TouchableOpacity
            key={key}
            style={styles.photoItem}
            onPress={() => onPress(photos[key])}
            activeOpacity={0.85}>
            <Image source={{ uri: photos[key] }} style={styles.photoThumb} resizeMode="cover" />
            <View style={styles.photoLabelOverlay}>
              <Text style={styles.photoLabel}>{label}</Text>
            </View>
          </TouchableOpacity>
        ) : null,
      )}
    </View>
  </View>
);

PhotoSection.propTypes = {
  title: PropTypes.string.isRequired,
  iconName: PropTypes.string,
  photos: PropTypes.object.isRequired,
  onPress: PropTypes.func.isRequired,
};

BillsAndPhotosScreen.propTypes = {
  tripId: PropTypes.string,
};

export default BillsAndPhotosScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 6,
    shadowColor: 'black',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  backBtn: {
    padding: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: '#fff',
    flex: 1,
    letterSpacing: 0.3,
  },
  headerSpacer: { width: 36 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingTxt: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: Fonts.medium,
    fontSize: 18,
    color: '#1E3A8A',
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 21,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1E40AF',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: '#1E3A8A',
    flex: 1,
  },
  billCountBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  billCountTxt: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#1D4ED8',
  },
  billCard: {
    borderRadius: 12,
    backgroundColor: '#F8FAFF',
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    gap: 10,
  },
  billCardRejected: {
    borderLeftColor: '#DC2626',
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF7F7',
  },
  billCardPaid: {
    borderLeftColor: '#16A34A',
    borderColor: '#DCFCE7',
    backgroundColor: '#F7FFF8',
  },
  billHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  billIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  billDesc: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#1E3A8A',
    flex: 1,
  },
  billAmount: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#212121',
  },
  amountPill: {
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  amountPillRejected: {
    backgroundColor: '#FEE2E2',
  },
  amountPillTxt: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#16A34A',
  },
  amountPillTxtRejected: {
    color: '#DC2626',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  statusPaid: { backgroundColor: '#DCFCE7' },
  statusRejected: { backgroundColor: '#FEE2E2' },
  statusTxt: { fontSize: 13, fontFamily: Fonts.medium },
  statusTxtPaid: { color: '#16A34A' },
  statusTxtRejected: { color: '#DC2626' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  loadingRowTxt: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#6B7280',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  payNowBtn: { backgroundColor: '#059669' },
  paidBtn: { backgroundColor: '#1D4ED8' },
  rejectBtn: { backgroundColor: '#DC2626' },
  actionTxt: { fontSize: 13, fontFamily: Fonts.medium, color: '#fff' },
  receiptThumbWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  receiptThumb: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
  },
  receiptThumbOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 16,
    padding: 5,
  },
  receiptSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
    paddingTop: 12,
    gap: 8,
  },
  receiptSectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  uploadReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  uploadIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadReceiptTxt: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#2563EB',
    flex: 1,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  receiptThumbSmall: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
  },
  receiptInfoCol: {
    flex: 1,
    gap: 6,
  },
  receiptUploadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptUploadedTxt: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#16A34A',
  },
  editReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
  },
  editReceiptTxt: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#2563EB',
  },
  receiptLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  receiptUploadingTxt: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#2563EB',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoItem: {
    width: '47.5%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  photoThumb: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#EEF2FF',
  },
  photoLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  photoLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#fff',
    textAlign: 'center',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
  },
  previewCloseCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  // Source picker bottom sheet
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
    elevation: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 17,
    fontFamily: Fonts.medium,
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 4,
  },
  pickerSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  pickerOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pickerOptionText: {
    flex: 1,
    gap: 2,
  },
  pickerOptionTitle: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: '#1E293B',
  },
  pickerOptionDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#94A3B8',
  },
  pickerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },
  pickerCancelBtn: {
    marginTop: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pickerCancelTxt: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: '#64748B',
  },
});


