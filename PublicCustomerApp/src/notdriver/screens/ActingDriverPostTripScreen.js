/**
 * ActingDriverPostTripScreen
 * Driver uploads 4 vehicle photos AFTER the trip + dynamic bills/expenses,
 * then triggers the actual trip end flow.
 */
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { Colors, colors, Fonts } from '../../common/constants/constants';
import {
  checkCameraPermission,
  RequestCameraPermission,
} from '../../common/controllers/PermissionHandler';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import useActingDriverMediaStore from '../store/useActingDriverMediaStore';
import { useTripAcceptStore } from '../store/useTripAcceptStore';
import useUserStore from '../../common/store/useUserStore';
import APIRequest from '../../common/APIRequest';
import useTripsStore from '../store/useTripsStore';
import { getPresignedImageUrl } from '../../common/utils/getPresignedImageUrl';

const PHOTO_SLOTS = [
  { key: 'front',     label: 'Front',      icon: 'car-back' },
  { key: 'rear',      label: 'Rear',       icon: 'car' },
  { key: 'leftSide',  label: 'Left Side',  icon: 'car-side' },
  { key: 'rightSide', label: 'Right Side', icon: 'car-side' },
];

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/* ─── image picker helper ──────────────────────────────────── */
const pickImage = async (source, callback) => {
  const options = { mediaType: 'photo', maxWidth: 1200, maxHeight: 1200, quality: 0.85 };
  const handler = res => {
    if (res.didCancel || !res.assets?.[0]) return;
    const a = res.assets[0];
    callback({ uri: a.uri, type: a.type || 'image/jpeg', name: a.fileName || `photo_${Date.now()}.jpg` });
  };
  if (source === 'camera') {
    const hasPerm = await checkCameraPermission();
    if (!hasPerm) { await RequestCameraPermission(); return; }
    launchCamera(options, handler);
  } else {
    launchImageLibrary(options, handler);
  }
};

/* ─── photo slot ───────────────────────────────────────────── */
const PhotoSlot = ({ slotKey, label, icon, image, onPick, loading }) => {
  const [busy, setBusy] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const handle = async src => { setBusy(true); await pickImage(src, img => onPick(slotKey, img)); setBusy(false); };

  useEffect(() => { setImgError(false); setImgLoading(false); }, [image?.uri]);

  return (
    <View style={ps.slot}>
      {loading ? (
        <>
          <View style={[ps.emptyThumb, ps.loadingThumb]}>
            <ActivityIndicator size="small" color={Colors.periwinkle} />
          </View>
          <Text style={ps.label}>{label}</Text>
        </>
      ) : image ? (
        <>
          <View style={{ width: '100%', height: 110, borderRadius: 8, overflow: 'hidden' }}>
            <Image
              source={{ uri: image.uri }}
              style={ps.thumb}
              onLoadStart={() => setImgLoading(true)}
              onLoadEnd={() => setImgLoading(false)}
              onError={() => { setImgLoading(false); setImgError(true); }}
            />
            {imgLoading && (
              <View style={ps.imgOverlay}>
                <ActivityIndicator size="small" color={Colors.periwinkle} />
              </View>
            )}
            {imgError && (
              <View style={ps.imgOverlay}>
                <MaterialCommunityIcons name="image-broken-variant" size={28} color="#C0C0C0" />
                <Text style={{ fontSize: 10, color: Colors.grey_dark, marginTop: 4 }}>Failed to load</Text>
              </View>
            )}
          </View>
          <View style={ps.footer}>
            <Text style={ps.label}>{label}</Text>
            <TouchableOpacity style={ps.reBtn} onPress={() => handle('camera')} activeOpacity={0.8}>
              <MaterialCommunityIcons name="camera-retake-outline" size={14} color={Colors.white} />
              <Text style={ps.reTxt}>Retake</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={ps.emptyThumb}>
            <MaterialCommunityIcons name={icon} size={34} color="#C0C0C0" />
          </View>
          <Text style={ps.label}>{label}</Text>
          <View style={ps.pickRow}>
            <TouchableOpacity style={ps.pickBtn} onPress={() => handle('camera')} disabled={busy} activeOpacity={0.8}>
              {busy
                ? <ActivityIndicator size="small" color={Colors.periwinkle} />
                : <><MaterialCommunityIcons name="camera-outline" size={16} color={Colors.periwinkle} /><Text style={ps.pickTxt}>Camera</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={ps.pickBtn} onPress={() => handle('gallery')} disabled={busy} activeOpacity={0.8}>
              <MaterialCommunityIcons name="image-outline" size={16} color={Colors.periwinkle} />
              <Text style={ps.pickTxt}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const ps = StyleSheet.create({
  slot: {
    width: '47%',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  emptyThumb: { width: '100%', height: 110, borderRadius: 8, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontFamily: Fonts.medium, color: Colors.grey_dark, textTransform: 'uppercase', letterSpacing: 0.5 },
  footer: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  imgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  reBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.periwinkle, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  reTxt: { fontSize: 11, fontFamily: Fonts.medium, color: Colors.white },
  pickRow: { flexDirection: 'row', gap: 8, width: '100%' },
  pickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F0F0FF', borderWidth: 1, borderColor: Colors.periwinkle + '44' },
  pickTxt: { fontSize: 11, fontFamily: Fonts.medium, color: Colors.periwinkle },
  loadingThumb: { backgroundColor: '#E8E8FF' },
});

/* ─── bill row ─────────────────────────────────────────────── */
const APPROVAL_CONFIG = {
  pending:  { color: '#FF9800', bg: '#FFF3E0', icon: 'clock-outline',   label: 'Pending' },
  approved: { color: '#43A047', bg: '#E8F5E9', icon: 'check-circle',    label: 'Approved' },
  rejected: { color: '#E53935', bg: '#FFEBEE', icon: 'close-circle',    label: 'Rejected' },
};

const BillRow = ({ bill, onChange, onRemove }) => {
  const [busy, setBusy] = useState(false);
  const handleReceipt = async src => {
    setBusy(true);
    await pickImage(src, img => onChange({ ...bill, receipt: img }));
    setBusy(false);
  };

  const approval = bill.approval || 'pending';
  const ac = APPROVAL_CONFIG[approval];

  return (
    <View style={br.wrap}>
      <View style={br.topRow}>
        <TextInput
          style={[br.input, { flex: 1 }]}
          placeholder="Bill description (e.g. Fuel, Toll)"
          placeholderTextColor={Colors.grey_dark}
          value={bill.description}
          onChangeText={v => onChange({ ...bill, description: v })}
        />
        {/* approval badge — only visible once set from server */}
        <View style={[br.approvalBadge, { backgroundColor: ac.bg }]}>
          <MaterialCommunityIcons name={ac.icon} size={12} color={ac.color} />
          <Text style={[br.approvalTxt, { color: ac.color }]}>{ac.label}</Text>
        </View>
        <TouchableOpacity style={br.removeBtn} onPress={onRemove} activeOpacity={0.8}>
          <MaterialCommunityIcons name="close-circle" size={20} color="#E53935" />
        </TouchableOpacity>
      </View>
      <View style={br.amountRow}>
        <Text style={br.rupee}>₹</Text>
        <TextInput
          style={[br.input, br.amountInput]}
          placeholder="0.00"
          placeholderTextColor={Colors.grey_dark}
          keyboardType="decimal-pad"
          value={bill.amount}
          onChangeText={v => onChange({ ...bill, amount: v })}
        />
      </View>
      {bill.receipt ? (
        <View style={br.receiptRow}>
          <Image source={{ uri: bill.receipt.uri }} style={br.receiptThumb} />
          <TouchableOpacity style={br.reuploadBtn} onPress={() => handleReceipt('gallery')} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={12} color={Colors.white} />
            <Text style={br.reuploadTxt}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={br.addReceiptBtn} onPress={() => handleReceipt('camera')} disabled={busy} activeOpacity={0.8}>
          {busy
            ? <ActivityIndicator size="small" color={Colors.periwinkle} />
            : <><MaterialCommunityIcons name="camera-plus-outline" size={16} color={Colors.periwinkle} /><Text style={br.addReceiptTxt}>Add Receipt Photo</Text></>}
        </TouchableOpacity>
      )}
    </View>
  );
};

const br = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    padding: 12,
    gap: 10,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { borderBottomWidth: 1, borderColor: '#D0D0D0', paddingVertical: 6, paddingHorizontal: 4, fontSize: 13, fontFamily: Fonts.regular, color: Colors.black },
  removeBtn: { padding: 2 },
  approvalBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  approvalTxt: { fontSize: 10, fontFamily: Fonts.medium },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rupee: { fontSize: 16, fontFamily: Fonts.medium, color: Colors.black },
  amountInput: { flex: 1, fontSize: 15, fontFamily: Fonts.medium },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  receiptThumb: { width: 64, height: 64, borderRadius: 8, resizeMode: 'cover' },
  reuploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.periwinkle, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  reuploadTxt: { fontSize: 11, fontFamily: Fonts.medium, color: Colors.white },
  addReceiptBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.periwinkle + '66', backgroundColor: '#F0F0FF', alignSelf: 'flex-start' },
  addReceiptTxt: { fontSize: 12, fontFamily: Fonts.medium, color: Colors.periwinkle },
});

/* ─── main screen ─────────────────────────────────────────── */
const ActingDriverPostTripScreen = () => {
  const { goBack } = useStackScreenStore();
  const { postTripPhotos, setPostTripPhotos, bills: storedBills, setBills, setPostTripDone } = useActingDriverMediaStore();
  const { setFetchLocationDate, setLoading, isGetFare } = useTripAcceptStore();
  const { userInfo } = useUserStore();
  const { activeTripData } = useTripsStore();

  const [bills, setBillsLocal] = useState(storedBills.length > 0 ? storedBills : []);
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'bills'
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [loadingFromServer, setLoadingFromServer] = useState(false);

  // Seed photos & bills from server when activeTripData hydrates from AsyncStorage (cache-cleared scenario)
  useEffect(() => {
    const serverPostPhotos = activeTripData?.[0]?.bills?.postTripVehiclePhotos;
    const serverBills = activeTripData?.[0]?.bills?.bills;

    const toObjectKey = url => {
      if (!url) return null;
      try { return decodeURIComponent(new URL(url).pathname.replace(/^\//, '')); }
      catch { return url.replace(/^https?:\/\/[^/]+\//, ''); }
    };

    const resolveSlot = async (rawUrl, name) => {
      if (!rawUrl) return null;
      const key = toObjectKey(rawUrl);
      const presigned = key ? await getPresignedImageUrl(key, userInfo?.token) : null;
      return { uri: presigned || rawUrl, type: 'image/jpeg', name };
    };

    (async () => {
      setLoadingFromServer(true);
      if (serverPostPhotos && !Object.values(postTripPhotos).some(Boolean)) {
        const [front, rear, leftSide, rightSide] = await Promise.all([
          resolveSlot(serverPostPhotos.front,     'post_front.jpg'),
          resolveSlot(serverPostPhotos.rear,      'post_rear.jpg'),
          resolveSlot(serverPostPhotos.leftSide,  'post_leftSide.jpg'),
          resolveSlot(serverPostPhotos.rightSide, 'post_rightSide.jpg'),
        ]);
        const seeded = { front, rear, leftSide, rightSide };
        if (Object.values(seeded).some(Boolean)) {
          setPostTripPhotos(seeded); // write to store — UI re-renders via Zustand subscription
          setUploaded(true);
        }
      }

      if (serverBills?.length && bills.length === 0) {
        const resolvedBills = await Promise.all(
          serverBills.map(async b => {
            let receipt = null;
            if (b.receiptPhoto) {
              const key = toObjectKey(b.receiptPhoto);
              const presigned = key ? await getPresignedImageUrl(key, userInfo?.token) : null;
              receipt = { uri: presigned || b.receiptPhoto, type: 'image/jpeg', name: 'receipt.jpg' };
            }
            return { id: uid(), description: b.description || '', amount: String(b.amount || ''), receipt, approval: b.approval || 'pending' };
          })
        );
        setBillsLocal(resolvedBills);
      }
      setLoadingFromServer(false);
    })();
  }, [activeTripData]);

  // Use store as single source of truth — no divergence possible
  const photos = postTripPhotos;
  const doneCount = Object.values(photos).filter(Boolean).length;
  const allDone = doneCount === 4;
  const totalAmount = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);

  const onPick = (key, img) => {
    const updated = { ...photos, [key]: img };
    setPostTripPhotos(updated); // update store directly — UI re-renders via subscription
    setUploaded(false);
  };

  const addBill = () => {
    const updated = [...bills, { id: uid(), description: '', amount: '', receipt: null }];
    setBillsLocal(updated);
    setBills(updated);
    setUploaded(false);
  };

  const updateBill = (id, data) => {
    const updated = bills.map(b => b.id === id ? data : b);
    setBillsLocal(updated);
    setBills(updated);
    setUploaded(false);
  };

  const removeBill = id => {
    const updated = bills.filter(b => b.id !== id);
    setBillsLocal(updated);
    setBills(updated);
    setUploaded(false);
  };

  // Step 1: upload media to server, stay on screen
  const onUpload = async () => {
    if (!allDone) {
      Alert.alert('Photos Required', 'Please capture all 4 post-trip vehicle photos before completing.', [
        { text: 'Go to Photos', onPress: () => setActiveTab('photos') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('tripId', activeTripData[0]._id);
      formData.append('phase', 'post');
      formData.append('postFront',     { uri: photos.front.uri,     type: photos.front.type,     name: photos.front.name });
      formData.append('postRear',      { uri: photos.rear.uri,      type: photos.rear.type,      name: photos.rear.name });
      formData.append('postLeftSide',  { uri: photos.leftSide.uri,  type: photos.leftSide.type,  name: photos.leftSide.name });
      formData.append('postRightSide', { uri: photos.rightSide.uri, type: photos.rightSide.type, name: photos.rightSide.name });
      const billsMeta = bills.map(b => ({ description: b.description, amount: b.amount }));
      formData.append('bills', JSON.stringify(billsMeta));
      console.log('Uploading media with data:', { tripId: activeTripData[0]._id, bills: billsMeta });
      bills.forEach((b, idx) => {
        if (b.receipt) {
          formData.append(`bill_receipt_${idx}`, { uri: b.receipt.uri, type: b.receipt.type, name: b.receipt.name });
        }
      });
      const api = new APIRequest();
      const res = await api.request('/publicrides/driver/v2/uploadTripMedia', 'POST', formData, userInfo?.token);
      if (res.success) {
        goBack();
        setUploaded(true);
        return;
      }
      if (!res?.success) {
        Alert.alert('Upload Failed', res?.message || 'Could not upload media. Please try again.');
        return;
      }
      setUploaded(true);
    } catch (e) {
      Alert.alert('Error', 'Something went wrong while uploading media.');
    } finally {
      setUploading(false);
    }
  };

  // Step 2: confirm triggers the actual trip end and goes back
  const onConfirm = () => {
    setPostTripDone(true);
    setFetchLocationDate(true);
    setLoading(true);
    goBack();
  };

  return (
    <View style={styles.screen}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => goBack()} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.black} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Post-Trip Checklist</Text>
          <Text style={styles.subtitle}>Photos & bills before ending trip</Text>
        </View>
      </View>

      {/* tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
          onPress={() => setActiveTab('photos')}
          activeOpacity={0.8}>
          <MaterialCommunityIcons name="camera-outline" size={16} color={activeTab === 'photos' ? Colors.white : Colors.grey_dark} />
          <Text style={[styles.tabTxt, activeTab === 'photos' && styles.tabTxtActive]}>
            Vehicle Photos {doneCount > 0 ? `(${doneCount}/4)` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bills' && styles.tabActive]}
          onPress={() => setActiveTab('bills')}
          activeOpacity={0.8}>
          <MaterialCommunityIcons name="receipt" size={16} color={activeTab === 'bills' ? Colors.white : Colors.grey_dark} />
          <Text style={[styles.tabTxt, activeTab === 'bills' && styles.tabTxtActive]}>
            Bills {bills.length > 0 ? `(${bills.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {activeTab === 'photos' ? (
          <>
            {/* progress dots */}
            <View style={styles.progressRow}>
              {PHOTO_SLOTS.map(s => (
                <View key={s.key} style={[styles.progressDot, photos[s.key] && styles.progressDotDone]} />
              ))}
              <Text style={styles.progressTxt}>{doneCount} / 4 photos</Text>
            </View>
            <View style={styles.grid}>
              {PHOTO_SLOTS.map(s => (
                <PhotoSlot key={s.key} slotKey={s.key} label={s.label} icon={s.icon} image={photos[s.key]} onPick={onPick} loading={loadingFromServer} />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.billsSection}>
            <View style={styles.billsHeaderRow}>
              <Text style={styles.billsTitle}>Expenses / Bills</Text>
              {bills.length > 0 && (
                <Text style={styles.billsTotal}>Total ₹{totalAmount.toFixed(2)}</Text>
              )}
            </View>
            {bills.map(bill => (
              <BillRow
                key={bill.id}
                bill={bill}
                onChange={updated => updateBill(bill.id, updated)}
                onRemove={() => removeBill(bill.id)}
              />
            ))}
            <TouchableOpacity style={styles.addBillBtn} onPress={addBill} activeOpacity={0.8}>
              <MaterialCommunityIcons name="plus" size={16} color={Colors.periwinkle} />
              <Text style={styles.addBillTxt}>Add Bill</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* footer */}
      <View style={styles.footer}>
        {/* {uploaded ? (
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={onConfirm}
            activeOpacity={0.8}>
            <MaterialCommunityIcons name="flag-checkered" size={18} color={Colors.white} />
            <Text style={styles.doneTxt}>Confirm & End Trip</Text>
          </TouchableOpacity>
        ) : (
       
        )} */}
           <TouchableOpacity
            style={[styles.doneBtn, uploading && { backgroundColor: '#81C784', elevation: 0 }]}
            onPress={onUpload}
            disabled={uploading}
            activeOpacity={0.8}>
            {uploading
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <MaterialCommunityIcons name="cloud-upload-outline" size={18} color={Colors.white} />}
            <Text style={styles.doneTxt}>{uploading ? 'Uploading...' : 'Upload'}</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
};

export default ActingDriverPostTripScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  title: { fontSize: 16, fontFamily: Fonts.semi_bold, color: Colors.black },
  subtitle: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.grey_dark, marginTop: 2 },
  tabRow: {
    flexDirection: 'row',
    gap: 0,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.periwinkle,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: Colors.white,
  },
  tabActive: { backgroundColor: Colors.periwinkle },
  tabTxt: { fontSize: 13, fontFamily: Fonts.medium, color: Colors.grey_dark },
  tabTxtActive: { color: Colors.white },
  body: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' },
  progressDotDone: { backgroundColor: Colors.periwinkle },
  progressTxt: { fontSize: 12, fontFamily: Fonts.medium, color: Colors.grey_dark, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  billsSection: { gap: 12 },
  billsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billsTitle: { fontSize: 14, fontFamily: Fonts.medium, color: Colors.black },
  billsTotal: { fontSize: 14, fontFamily: Fonts.semi_bold, color: Colors.periwinkle },
  addBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.periwinkle + '88',
    backgroundColor: '#F0F0FF',
  },
  addBillTxt: { fontSize: 13, fontFamily: Fonts.medium, color: Colors.periwinkle },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: Colors.white,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#BDBDBD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipTxt: { fontSize: 13, fontFamily: Fonts.medium, color: Colors.grey_dark },
  doneBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    paddingVertical: 13,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  doneTxt: { fontSize: 14, fontFamily: Fonts.semi_bold, color: Colors.white },
});


