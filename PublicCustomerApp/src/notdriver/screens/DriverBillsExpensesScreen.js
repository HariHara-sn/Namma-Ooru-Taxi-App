/**
 * DriverBillsExpensesScreen
 * Driver uploads bills/expenses one by one via a modal.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { Colors, Fonts } from '../../common/constants/constants';
import {
  checkCameraPermission,
  RequestCameraPermission,
} from '../../common/controllers/PermissionHandler';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import useActingDriverMediaStore from '../store/useActingDriverMediaStore';
import useUserStore from '../../common/store/useUserStore';
import APIRequest from '../../common/APIRequest';
import useTripsStore from '../store/useTripsStore';
import { getPresignedImageUrl } from '../../common/utils/getPresignedImageUrl';
import UseBackButton from '../../common/hooks/UseBackButton';
import { useTranslation } from 'react-i18next';

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

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

const APPROVAL_CONFIG = {
  pending:  { color: '#FF9800', bg: '#FFF3E0', icon: 'clock-outline',   label: 'Pending' },
  approved: { color: '#43A047', bg: '#E8F5E9', icon: 'check-circle',    label: 'Approved' },
  rejected: { color: '#E53935', bg: '#FFEBEE', icon: 'close-circle',    label: 'Rejected' },
};

/* ─── delete confirmation modal ──────────────────────────── */
const DeleteConfirmModal = ({ visible, bill, onClose, onConfirm, deleting }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={dm.overlay}>
      <View style={dm.box}>
        <MaterialCommunityIcons name="delete-outline" size={36} color="#E53935" />
        <Text style={dm.title}>Delete Bill?</Text>
        <Text style={dm.body} numberOfLines={2}>
          {bill ? `"${bill.description}" ₹${parseFloat(bill.amount || 0).toFixed(2)}` : ''}
        </Text>
        <View style={dm.btnRow}>
          <TouchableOpacity style={dm.cancelBtn} onPress={onClose} disabled={deleting} activeOpacity={0.8}>
            <Text style={dm.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dm.deleteBtn} onPress={onConfirm} disabled={deleting} activeOpacity={0.8}>
            {deleting
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={dm.deleteTxt}>Delete</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);


/* ─── full-screen photo preview modal ────────────────────── */
const PhotoPreviewModal = ({ uri, onClose }) => (
  <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
    <View style={pp.overlay}>
      <TouchableOpacity style={pp.closeBtn} onPress={onClose} activeOpacity={0.8}>
        <MaterialCommunityIcons name="close" size={26} color={Colors.white} />
      </TouchableOpacity>
      <Image source={{ uri }} style={pp.image} resizeMode="contain" />
    </View>
  </Modal>
);

const pp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '80%' },
  closeBtn: { position: 'absolute', top: 44, right: 16, zIndex: 10, padding: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20 },
});

/* ─── read-only bill card ─────────────────────────────────── */
const BillCard = ({ bill, index, onRemove, onEdit, token }) => {
  const [previewUri, setPreviewUri] = React.useState(null);
  const [paymentReceiptUri, setPaymentReceiptUri] = React.useState(null);

  React.useEffect(() => {
    if (!bill.paymentReceiptPhoto || !token) return;
    let cancelled = false;
    const key = bill.paymentReceiptPhoto
      .replace(/^https?:\/\/[^/]+\/?/, '')
      .replace(/^\//, '');
    getPresignedImageUrl(key, token).then(url => {
      if (!cancelled && url) setPaymentReceiptUri(url);
    });
    return () => { cancelled = true; };
  }, [bill.paymentReceiptPhoto, token]);

  return (
  <View style={bc.wrap}>
    <View style={bc.topRow}>
      <View style={bc.indexCircle}>
        <Text style={bc.indexTxt}>{index + 1}</Text>
      </View>
      <View style={bc.info}>
        <Text style={bc.desc} numberOfLines={1}>{bill.description}</Text>
        <Text style={bc.amount}>₹{parseFloat(bill.amount || 0).toFixed(2)}</Text>
      </View>
      <View style={[bc.badge, { backgroundColor: APPROVAL_CONFIG[bill.approval || 'pending'].bg }]}>
        <MaterialCommunityIcons
          name={APPROVAL_CONFIG[bill.approval || 'pending'].icon}
          size={11}
          color={APPROVAL_CONFIG[bill.approval || 'pending'].color}
        />
        <Text style={[bc.badgeTxt, { color: APPROVAL_CONFIG[bill.approval || 'pending'].color }]}>
          {APPROVAL_CONFIG[bill.approval || 'pending'].label}
        </Text>
      </View>
      {bill.approval !== 'approved' && bill.approval !== 'rejected' && (
        <TouchableOpacity style={bc.editBtn} onPress={onEdit} activeOpacity={0.8}>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.periwinkle} />
        </TouchableOpacity>
      )}
      {bill.approval !== 'rejected' && (
        <TouchableOpacity style={bc.removeBtn} onPress={onRemove} activeOpacity={0.8}>
          <MaterialCommunityIcons name="close-circle-outline" size={20} color="#BDBDBD" />
        </TouchableOpacity>
      )}
    </View>
    {bill.receipt && (
      <TouchableOpacity onPress={() => setPreviewUri(bill.receipt.uri)} activeOpacity={0.85}>
        <Image source={{ uri: bill.receipt.uri }} style={bc.receiptThumb} resizeMode="cover" />
        <View style={bc.receiptOverlay}>
          <MaterialCommunityIcons name="eye" size={20} color={Colors.black} />
        </View>
      </TouchableOpacity>
    )}
    {paymentReceiptUri && (
      <View style={bc.paymentReceiptWrap}>
        <View style={bc.paymentReceiptHeader}>
          <MaterialCommunityIcons name="check-circle" size={14} color="#16A34A" />
          <Text style={bc.paymentReceiptLabel}>Payment Receipt from Passenger</Text>
        </View>
        <TouchableOpacity onPress={() => setPreviewUri(paymentReceiptUri)} activeOpacity={0.85}>
          <Image source={{ uri: paymentReceiptUri }} style={bc.receiptThumb} resizeMode="cover" />
          <View style={bc.receiptOverlay}>
            <MaterialCommunityIcons name="eye" size={20} color={Colors.black} />
          </View>
        </TouchableOpacity>
      </View>
    )}
    <PhotoPreviewModal uri={previewUri} onClose={() => setPreviewUri(null)} />
  </View>
  );
};

/* ─── edit bill modal ─────────────────────────────────────── */
const EditBillModal = ({ visible, bill, onClose, onSave, tripId, token }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState(null); // { uri, type, name } | null
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [errors, setErrors] = useState({});
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const amountRef = useRef(null);

  // Pre-fill whenever bill changes
  useEffect(() => {
    if (!bill) return;
    setDescription(bill.description || '');
    setAmount(String(bill.amount || ''));
    setReceipt(bill.receipt || null);
    setRemoveReceipt(false);
    setErrors({});
  }, [bill]);

  const handleClose = () => { setErrors({}); onClose(); };

  const handlePickReceipt = async src => {
    setReceiptBusy(true);
    await pickImage(src, img => { setReceipt(img); setRemoveReceipt(false); });
    setReceiptBusy(false);
  };

  const validate = () => {
    const e = {};
    if (!description.trim()) e.description = 'Description is required';
    if (!amount.trim()) e.amount = 'Amount is required';
    else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) e.amount = 'Enter a valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('tripId', tripId);
      if (bill.serverId) formData.append('billId', bill.serverId);
      else if (bill.serverIndex !== undefined) formData.append('billIndex', String(bill.serverIndex));
      formData.append('description', description.trim());
      formData.append('amount', amount.trim());
      // New receipt file — only if it's a locally picked asset (has a file:// uri)
      if (receipt && receipt.uri?.startsWith('file://')) {
        formData.append('bill_receipt', { uri: receipt.uri, type: receipt.type, name: receipt.name });
      } else if (removeReceipt) {
        formData.append('removeReceipt', 'true');
      }
      const api = new APIRequest();
      const res = await api.request('/publicrides/driver/v2/editTripBill', 'POST', formData, token);
      if (res.success) {
        onSave({
          ...bill,
          description: description.trim(),
          amount: amount.trim(),
          receipt: removeReceipt ? null : receipt,
          approval: 'pending',
        });
      } else {
        Alert.alert('Update Failed', res?.message || 'Could not update bill.');
      }
    } catch { Alert.alert('Error', 'Something went wrong.'); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={ms.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ms.sheetWrap}>
          <View style={ms.sheet}>
            <View style={ms.handle} />

            <View style={ms.modalHeader}>
              <Text style={ms.modalTitle}>Edit Bill</Text>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close" size={22} color={Colors.grey_dark} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={ms.fieldWrap}>
              <Text style={ms.label}>Description <Text style={ms.required}>*</Text></Text>
              <TextInput
                style={[ms.input, errors.description && ms.inputError]}
                placeholder="e.g. Fuel, Toll, Parking"
                placeholderTextColor={Colors.grey_dark}
                value={description}
                onChangeText={v => { setDescription(v); if (errors.description) setErrors(e => ({ ...e, description: null })); }}
                returnKeyType="next"
                onSubmitEditing={() => amountRef.current?.focus()}
              />
              {errors.description ? <Text style={ms.errorTxt}>{errors.description}</Text> : null}
            </View>

            {/* Amount */}
            <View style={ms.fieldWrap}>
              <Text style={ms.label}>Amount (₹) <Text style={ms.required}>*</Text></Text>
              <View style={[ms.amountWrap, errors.amount && ms.inputError]}>
                <Text style={ms.rupee}>₹</Text>
                <TextInput
                  ref={amountRef}
                  style={ms.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.grey_dark}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={v => { setAmount(v); if (errors.amount) setErrors(e => ({ ...e, amount: null })); }}
                />
              </View>
              {errors.amount ? <Text style={ms.errorTxt}>{errors.amount}</Text> : null}
            </View>

            {/* Receipt photo */}
            <View style={ms.fieldWrap}>
              <Text style={ms.label}>Receipt Photo <Text style={ms.optional}>(optional)</Text></Text>
              {receipt && !removeReceipt ? (
                <View style={ms.receiptPreviewRow}>
                  <Image source={{ uri: receipt.uri }} style={ms.receiptPreview} resizeMode="cover" />
                  <TouchableOpacity style={ms.changeBtn} onPress={() => handlePickReceipt('gallery')} disabled={receiptBusy} activeOpacity={0.8}>
                    <Feather name="refresh-cw" size={12} color={Colors.white} />
                    <Text style={ms.changeTxt}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={ms.removeReceiptBtn} onPress={() => { setReceipt(null); setRemoveReceipt(true); }} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="close" size={16} color="#E53935" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={ms.pickerRow}>
                  <TouchableOpacity style={ms.pickerBtn} onPress={() => handlePickReceipt('camera')} disabled={receiptBusy} activeOpacity={0.8}>
                    {receiptBusy
                      ? <ActivityIndicator size="small" color={Colors.periwinkle} />
                      : <><MaterialCommunityIcons name="camera-outline" size={16} color={Colors.periwinkle} /><Text style={ms.pickerTxt}>Camera</Text></>}
                  </TouchableOpacity>
                  <TouchableOpacity style={ms.pickerBtn} onPress={() => handlePickReceipt('gallery')} disabled={receiptBusy} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="image-outline" size={16} color={Colors.periwinkle} />
                    <Text style={ms.pickerTxt}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Save button */}
            <TouchableOpacity style={[ms.addBtn, submitting && ms.addBtnDisabled]} onPress={handleSave} disabled={submitting} activeOpacity={0.8}>
              {submitting ? <ActivityIndicator size="small" color={Colors.white} /> : null}
              <Text style={ms.addBtnTxt}>{submitting ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

/* ─── add bill modal ──────────────────────────────────────── */
const AddBillModal = ({ visible, onClose, onAdd, tripId, token, t }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [errors, setErrors] = useState({});
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const amountRef = useRef(null);

  const reset = () => {
    setDescription('');
    setAmount('');
    setReceipt(null);
    setErrors({});
  };

  const handleClose = () => { reset(); onClose(); };

  const handlePickReceipt = async src => {
    setReceiptBusy(true);
    await pickImage(src, img => setReceipt(img));
    setReceiptBusy(false);
  };

  const validate = () => {
    const e = {};
    if (!description.trim()) e.description = 'Description is required';
    if (!amount.trim()) e.amount = 'Amount is required';
    else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) e.amount = 'Enter a valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('tripId', tripId);
      formData.append('phase', 'bills');
      formData.append('bills', JSON.stringify([{ description: description.trim(), amount: amount.trim() }]));
      if (receipt) {
        formData.append('bill_receipt_0', { uri: receipt.uri, type: receipt.type, name: receipt.name });
      }
      const api = new APIRequest();
      const res = await api.request('/publicrides/driver/v2/uploadTripMedia', 'POST', formData, token);
      if (res.success) {
        const serverId = res.bills?.[0]?.billId || null;
        onAdd({ id: uid(), serverId, description: description.trim(), amount: amount.trim(), receipt, approval: 'pending' });
        reset();
      } else {
        Alert.alert('Upload Failed', res?.message || 'Could not add bill.');
      }
    } catch { Alert.alert('Error', 'Something went wrong.'); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={ms.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ms.sheetWrap}>
          <View style={ms.sheet}>
            {/* handle bar */}
            <View style={ms.handle} />

            <View style={ms.modalHeader}>
              <Text style={ms.modalTitle}>{t('add_bill_expense')}</Text>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close" size={22} color={Colors.grey_dark} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={ms.fieldWrap}>
              <Text style={ms.label}>{t('description')} <Text style={ms.required}>*</Text></Text>
              <TextInput
                style={[ms.input, errors.description && ms.inputError]}
                placeholder={t('description_placeholder')}
                placeholderTextColor={Colors.grey_dark}
                value={description}
                onChangeText={v => { setDescription(v); if (errors.description) setErrors(e => ({ ...e, description: null })); }}
                returnKeyType="next"
                onSubmitEditing={() => amountRef.current?.focus()}
              />
              {errors.description ? <Text style={ms.errorTxt}>{errors.description}</Text> : null}
            </View>

            {/* Amount */}
            <View style={ms.fieldWrap}>
              <Text style={ms.label}>{t('amount')} (₹) <Text style={ms.required}>*</Text></Text>
              <View style={[ms.amountWrap, errors.amount && ms.inputError]}>
                <Text style={ms.rupee}>₹</Text>
                <TextInput
                  ref={amountRef}
                  style={ms.amountInput}
                  placeholder={'00.00'}
                  placeholderTextColor={Colors.grey_dark}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={v => { setAmount(v); if (errors.amount) setErrors(e => ({ ...e, amount: null })); }}
                />
              </View>
              {errors.amount ? <Text style={ms.errorTxt}>{errors.amount}</Text> : null}
            </View>

            {/* Receipt photo */}
            <View style={ms.fieldWrap}>
              <Text style={ms.label}>{t('receipt_photo')} <Text style={ms.optional}>({t('optional')})</Text></Text>
              {receipt ? (
                <View style={ms.receiptPreviewRow}>
                  <Image source={{ uri: receipt.uri }} style={ms.receiptPreview} resizeMode="cover" />
                  <TouchableOpacity style={ms.changeBtn} onPress={() => handlePickReceipt('gallery')} activeOpacity={0.8}>
                    <Feather name="refresh-cw" size={12} color={Colors.white} />
                    <Text style={ms.changeTxt}>{t('change')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={ms.removeReceiptBtn} onPress={() => setReceipt(null)} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="close" size={16} color="#E53935" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={ms.pickerRow}>
                  <TouchableOpacity style={ms.pickerBtn} onPress={() => handlePickReceipt('camera')} disabled={receiptBusy} activeOpacity={0.8}>
                    {receiptBusy
                      ? <ActivityIndicator size="small" color={Colors.periwinkle} />
                      : <><MaterialCommunityIcons name="camera-outline" size={16} color={Colors.periwinkle} /><Text style={ms.pickerTxt}>Camera</Text></>}
                  </TouchableOpacity>
                  <TouchableOpacity style={ms.pickerBtn} onPress={() => handlePickReceipt('gallery')} disabled={receiptBusy} activeOpacity={0.8}>
                    <MaterialCommunityIcons name="image-outline" size={16} color={Colors.periwinkle} />
                    <Text style={ms.pickerTxt}>{t('gallery')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Add button */}
            <TouchableOpacity style={[ms.addBtn, submitting && ms.addBtnDisabled]} onPress={handleAdd} disabled={submitting} activeOpacity={0.8}>
              {submitting
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <></>}
              <Text style={ms.addBtnTxt}>{submitting ? t('adding') : t('add_bill')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

/* ─── main screen ─────────────────────────────────────────── */
const DriverBillsExpensesScreen = () => {
  const { goBack } = useStackScreenStore();
  const { bills: storedBills, setBills, } = useActingDriverMediaStore();
  const { userInfo } = useUserStore();
  const { activeTripData, setActiveTripData } = useTripsStore();

  const {t} = useTranslation();

  const [bills, setBillsLocal] = useState(storedBills.length > 0 ? storedBills : []);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // bill to confirm delete
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // bill being edited

  // Sync approval status and payment receipt from media store whenever storedBills changes (e.g. socket update)
  useEffect(() => {
    if (!storedBills?.length) return;
    setBillsLocal(prev => {
      if (prev.length === 0) return prev;
      const next = prev.map(b => {
        const stored = storedBills.find(
          s => s.id === b.id || (s.serverId && s.serverId === b.serverId),
        );
        if (!stored) return b;
        const approvalChanged = stored.approval !== b.approval;
        const receiptChanged = stored.paymentReceiptPhoto !== b.paymentReceiptPhoto;
        if (!approvalChanged && !receiptChanged) return b;
        return { ...b, approval: stored.approval, paymentReceiptPhoto: stored.paymentReceiptPhoto };
      });
      const changed = next.some((b, i) => b !== prev[i]);
      return changed ? next : prev;
    });
  }, [storedBills]);

  // Seed bills from server
  useEffect(() => {
    const serverBills = activeTripData?.[0]?.bills?.bills;
    if (!serverBills?.length || bills.length > 0) return;

    const toObjectKey = url => {
      if (!url) return null;
      try { return decodeURIComponent(new URL(url).pathname.replace(/^\//, '')); }
      catch { return url.replace(/^https?:\/\/[^/]+\//, ''); }
    };

    (async () => {
      const resolved = await Promise.all(
        serverBills.map(async (b, idx) => {
          let receipt = null;
          if (b.receiptPhoto) {
            const key = toObjectKey(b.receiptPhoto);
            const presigned = key ? await getPresignedImageUrl(key, userInfo?.token) : null;
            receipt = { uri: presigned || b.receiptPhoto, type: 'image/jpeg', name: 'receipt.jpg' };
          }
          return { id: uid(), serverId: b.billId || null, serverIndex: idx, description: b.description || '', amount: String(b.amount || ''), receipt, approval: b.approval || 'pending', paymentReceiptPhoto: b.paymentReceiptPhoto || null };
        })
      );
      setBillsLocal(resolved);
      setBills(resolved);
    })();
  }, [activeTripData?.[0]?.bills]);

  const totalAmount = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);

  const handleAddBill = bill => {
    const updated = [...bills, bill];
    setBillsLocal(updated);
    setBills(updated);
    setModalVisible(false);
  };

  const handleEditBill = updatedBill => {
    const updated = bills.map(b => b.id === updatedBill.id ? updatedBill : b);
    setBillsLocal(updated);
    setBills(updated);
    // Keep activeTripData in sync
    const serverBills = activeTripData?.[0]?.bills?.bills;
    if (serverBills && (updatedBill.serverId || updatedBill.serverIndex !== undefined)) {
      const syncedServer = serverBills.map((b, i) => {
        const matchById = updatedBill.serverId && b.billId === updatedBill.serverId;
        const matchByIdx = !matchById && updatedBill.serverIndex !== undefined && i === updatedBill.serverIndex;
        if (!matchById && !matchByIdx) return b;
        return { ...b, description: updatedBill.description, amount: parseFloat(updatedBill.amount) || 0, approval: 'pending' };
      });
      setActiveTripData([{ ...activeTripData[0], bills: { ...activeTripData[0].bills, bills: syncedServer } }]);
    }
    setEditTarget(null);
  };

  const removeBill = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const hasBillId = !!deleteTarget.serverId;
      const hasBillIndex = deleteTarget.serverIndex !== undefined && deleteTarget.serverIndex !== null;
      if (hasBillId || hasBillIndex) {
        const body = { tripId: activeTripData?.[0]?._id };
        if (hasBillId) body.billId = deleteTarget.serverId;
        else body.billIndex = deleteTarget.serverIndex;
        const api = new APIRequest();
        const res = await api.request(
          '/publicrides/driver/v2/deleteTripBill',
          'POST',
          body,
          userInfo?.token,
        );
        if (!res.success) {
          Alert.alert('Error', res?.message || 'Could not delete bill.');
          setDeleting(false);
          return;
        }
        // Keep activeTripData in sync so seeding won't re-add deleted bill
        const currentServerBills = activeTripData?.[0]?.bills?.bills || [];
        const updatedServerBills = hasBillId
          ? currentServerBills.filter(b => b.billId !== deleteTarget.serverId)
          : currentServerBills.filter((_, i) => i !== deleteTarget.serverIndex);
        setActiveTripData([{
          ...activeTripData[0],
          bills: { ...activeTripData[0].bills, bills: updatedServerBills },
        }]);
      }
      const updated = bills.filter(b => b.id !== deleteTarget.id);
      setBillsLocal(updated);
      setBills(updated);
      setDeleteTarget(null);
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <UseBackButton onBackPress={goBack} />
        <TouchableOpacity style={styles.backBtn} onPress={() => goBack()} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.black} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{t('bills_expenses')}</Text>
          <Text style={styles.subtitle}>{t('add_trip_expenses_and_receipts')}</Text>
        </View>
        {bills.length > 0 && (
          <Text style={styles.totalText}>₹{totalAmount.toFixed(2)}</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {bills.length === 0 ? (
          <View style={styles.emptyState}>
            {/* <MaterialCommunityIcons name="receipt-text-outline" size={52} color="#C0C0C0" /> */}
            <Text style={styles.emptyTxt}>{t('no_bills_added_yet')}</Text>
            <Text style={styles.emptySubTxt}>{t('tap_add_bill_below_to_record_an_expense')}</Text>
          </View>
        ) : (
          <View style={styles.billsList}>
            <Text style={styles.billsCountTxt}>{bills.length} {t('bill', { count: bills.length })} {t('added')}</Text>
            {bills.map((bill, idx) => (
              <BillCard
                key={bill.id}
                bill={bill}
                index={idx}
                onEdit={() => setEditTarget(bill)}
                onRemove={() => setDeleteTarget(bill)}
                token={userInfo?.token}
              />
            ))}
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBillBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus-circle-outline" size={18} color={Colors.periwinkle} />
          <Text style={styles.addBillTxt}>{t('add_bill')}</Text>
        </TouchableOpacity>
      </View>
      {modalVisible && (
       <AddBillModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddBill}
        tripId={activeTripData?.[0]?._id}
        token={userInfo?.token}
        t={t}
      />
      )}
      

      <DeleteConfirmModal
        visible={!!deleteTarget}
        bill={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={removeBill}
        deleting={deleting}
         t={t}
      />

      <EditBillModal
        visible={!!editTarget}
        bill={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEditBill}
        tripId={activeTripData?.[0]?._id}
        token={userInfo?.token}
         t={t}
      />
    </View>
  );
};

export default DriverBillsExpensesScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
    borderBottomWidth: 1, borderColor: '#F0F0F0',
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  title: { fontSize: 16, fontFamily: Fonts.semi_bold, color: Colors.black },
  subtitle: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.grey_dark, marginTop: 2 },
  totalText: { fontSize: 16, fontFamily: Fonts.semi_bold, color: Colors.periwinkle },
  body: { padding: 16, gap: 14, paddingBottom: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyTxt: { fontSize: 15, fontFamily: Fonts.medium, color: Colors.grey_dark },
  emptySubTxt: { fontSize: 12, fontFamily: Fonts.regular, color: '#BDBDBD' },
  billsList: { gap: 10 },
  billsCountTxt: { fontSize: 12, fontFamily: Fonts.medium, color: Colors.grey_dark, marginBottom: 2 },
  footer: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderColor: '#F0F0F0', backgroundColor: Colors.white,
  },
  addBillBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: Colors.periwinkle + '88', backgroundColor: '#F8F8FF',
  },
  addBillTxt: { fontSize: 14, fontFamily: Fonts.medium, color: Colors.periwinkle },
});

const dm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  box: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 10, width: '100%',
  },
  title: { fontSize: 17, fontFamily: Fonts.semi_bold, color: Colors.black },
  body: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.grey_dark, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 6, width: '100%' },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center',
  },
  cancelTxt: { fontSize: 14, fontFamily: Fonts.medium, color: Colors.grey_dark },
  deleteBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#E53935', alignItems: 'center',
  },
  deleteTxt: { fontSize: 14, fontFamily: Fonts.semi_bold, color: Colors.white },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetWrap: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12,
    gap: 16,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 4 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 16, fontFamily: Fonts.semi_bold, color: Colors.black },
  fieldWrap: { gap: 6 },
  label: { fontSize: 13, fontFamily: Fonts.medium, color: Colors.black },
  required: { color: '#E53935' },
  optional: { color: Colors.grey_dark, fontFamily: Fonts.regular },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, fontFamily: Fonts.regular, color: Colors.black,
  },
  inputError: { borderColor: '#E53935' },
  errorTxt: { fontSize: 11, fontFamily: Fonts.regular, color: '#E53935', marginTop: 2 },
  amountWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10,
    paddingHorizontal: 12,
  },
  rupee: { fontSize: 16, fontFamily: Fonts.medium, color: Colors.black, marginRight: 4 },
  amountInput: { flex: 1, paddingVertical: 10, fontSize: 14, fontFamily: Fonts.regular, color: Colors.black },
  receiptPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  receiptPreview: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#eee' },
  changeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.periwinkle, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
  },
  changeTxt: { fontSize: 11, fontFamily: Fonts.medium, color: Colors.white },
  removeReceiptBtn: { padding: 4 },
  pickerRow: { flexDirection: 'row', gap: 10 },
  pickerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.periwinkle + '44', backgroundColor: '#F0F0FF',
  },
  pickerTxt: { fontSize: 12, fontFamily: Fonts.medium, color: Colors.periwinkle },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.periwinkle, paddingVertical: 14, borderRadius: 12, marginTop: 4,
  },
  addBtnTxt: { fontSize: 14, fontFamily: Fonts.semi_bold, color: Colors.white },
  addBtnDisabled: { backgroundColor: '#BDBDBD' },
});

const bc = StyleSheet.create({
  wrap: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 12,
    gap: 8,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  indexCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.periwinkle + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  indexTxt: { fontSize: 12, fontFamily: Fonts.semi_bold, color: Colors.periwinkle },
  info: { flex: 1 },
  desc: { fontSize: 13, fontFamily: Fonts.medium, color: Colors.black },
  amount: { fontSize: 13, fontFamily: Fonts.semi_bold, color: Colors.periwinkle, marginTop: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20,
  },
  badgeTxt: { fontSize: 10, fontFamily: Fonts.medium },
  editBtn: { padding: 2 },
  removeBtn: { padding: 2 },
  receiptThumb: { width: '100%', height: 100, borderRadius: 8, backgroundColor: '#eee' },
  receiptOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  paymentReceiptWrap: { gap: 6, marginTop: 2 },
  paymentReceiptHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  paymentReceiptLabel: { fontSize: 11, fontFamily: Fonts.medium, color: '#16A34A' },
});


