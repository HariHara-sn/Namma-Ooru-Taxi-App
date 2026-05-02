/**
 * ActingDriverTripMedia
 * Shown at the end of an acting-driver trip to collect:
 *  - Vehicle photo BEFORE trip
 *  - Vehicle photo AFTER trip
 *  - Dynamic bills (description + amount + optional receipt image)
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { Colors, Fonts } from '../../common/constants/constants';
import {
  checkCameraPermission,
  RequestCameraPermission,
} from '../../common/controllers/PermissionHandler';

/* ─── helpers ─────────────────────────────────────────────── */
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const pickImage = async (source, callback) => {
  const options = {
    mediaType: 'photo',
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
  };

  const handler = response => {
    if (response.didCancel || !response.assets?.[0]) return;
    const asset = response.assets[0];
    callback({
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      name: asset.fileName || `photo_${Date.now()}.jpg`,
    });
  };

  if (source === 'camera') {
    const hasPerm = await checkCameraPermission();
    if (!hasPerm) {
      await RequestCameraPermission();
      return;
    }
    launchCamera(options, handler);
  } else {
    launchImageLibrary(options, handler);
  }
};

/* ─── small reusable photo slot ───────────────────────────── */
const PhotoSlot = ({ label, image, onPick }) => {
  const [busy, setBusy] = useState(false);

  const handle = async source => {
    setBusy(true);
    await pickImage(source, img => onPick(img));
    setBusy(false);
  };

  return (
    <View style={ps.wrap}>
      <Text style={ps.label}>{label}</Text>
      {image ? (
        <View style={ps.previewWrap}>
          <Image source={{ uri: image.uri }} style={ps.preview} />
          <TouchableOpacity
            style={ps.changeBtn}
            onPress={() => handle('gallery')}
            activeOpacity={0.8}>
            <Feather name="refresh-cw" size={13} color={Colors.white} />
            <Text style={ps.changeTxt}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={ps.btnRow}>
          <TouchableOpacity
            style={ps.iconBtn}
            onPress={() => handle('camera')}
            activeOpacity={0.8}
            disabled={busy}>
            {busy ? (
              <ActivityIndicator size="small" color={Colors.periwinkle} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={20}
                  color={Colors.periwinkle}
                />
                <Text style={ps.iconBtnTxt}>Camera</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={ps.iconBtn}
            onPress={() => handle('gallery')}
            activeOpacity={0.8}
            disabled={busy}>
            <MaterialCommunityIcons
              name="image-outline"
              size={20}
              color={Colors.periwinkle}
            />
            <Text style={ps.iconBtnTxt}>Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const ps = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    padding: 10,
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.grey_dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F0F0FF',
    borderWidth: 1,
    borderColor: Colors.periwinkle + '44',
  },
  iconBtnTxt: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.periwinkle,
  },
  previewWrap: {
    gap: 6,
  },
  preview: {
    width: '100%',
    height: 110,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.periwinkle,
    borderRadius: 8,
    paddingVertical: 6,
  },
  changeTxt: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.white,
  },
});

/* ─── bill row ─────────────────────────────────────────────── */
const BillRow = ({ bill, onChange, onRemove }) => {
  const [busy, setBusy] = useState(false);

  const handleReceiptPick = async source => {
    setBusy(true);
    await pickImage(source, img => onChange({ ...bill, receipt: img }));
    setBusy(false);
  };

  return (
    <View style={br.wrap}>
      {/* top row: description + remove */}
      <View style={br.topRow}>
        <TextInput
          style={[br.input, { flex: 1 }]}
          placeholder="Bill description"
          placeholderTextColor={Colors.grey_dark}
          value={bill.description}
          onChangeText={t => onChange({ ...bill, description: t })}
        />
        <TouchableOpacity
          style={br.removeBtn}
          onPress={onRemove}
          activeOpacity={0.8}>
          <MaterialCommunityIcons name="close" size={16} color={Colors.red} />
        </TouchableOpacity>
      </View>

      {/* amount */}
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

      {/* receipt photo */}
      {bill.receipt ? (
        <View style={br.receiptRow}>
          <Image
            source={{ uri: bill.receipt.uri }}
            style={br.receiptThumb}
          />
          <TouchableOpacity
            style={br.reuploadBtn}
            onPress={() => handleReceiptPick('gallery')}
            activeOpacity={0.8}>
            <Feather name="refresh-cw" size={12} color={Colors.white} />
            <Text style={br.reuploadTxt}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={br.receiptBtnRow}>
          <TouchableOpacity
            style={br.receiptBtn}
            onPress={() => handleReceiptPick('camera')}
            disabled={busy}
            activeOpacity={0.8}>
            {busy ? (
              <ActivityIndicator size="small" color={Colors.periwinkle} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="camera-plus-outline"
                  size={16}
                  color={Colors.periwinkle}
                />
                <Text style={br.receiptBtnTxt}>Add Receipt</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#D0D0D0',
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.black,
  },
  removeBtn: {
    padding: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rupee: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.black,
  },
  amountInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  receiptThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  reuploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.periwinkle,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  reuploadTxt: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.white,
  },
  receiptBtnRow: {
    flexDirection: 'row',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.periwinkle + '66',
    backgroundColor: '#F0F0FF',
  },
  receiptBtnTxt: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.periwinkle,
  },
});

/* ─── main component ───────────────────────────────────────── */
/**
 * Props:
 *  onChange(data) — called whenever state changes with:
 *    { vehiclePhotoBefore, vehiclePhotoAfter, bills: [{ id, description, amount, receipt }] }
 */
const ActingDriverTripMedia = ({ onChange }) => {
  const [photoBefore, setPhotoBefore] = useState(null);
  const [photoAfter, setPhotoAfter] = useState(null);
  const [bills, setBills] = useState([]);

  const notify = (before, after, bs) => {
    onChange?.({
      vehiclePhotoBefore: before,
      vehiclePhotoAfter: after,
      bills: bs,
    });
  };

  const setBeforeAndNotify = img => {
    setPhotoBefore(img);
    notify(img, photoAfter, bills);
  };

  const setAfterAndNotify = img => {
    setPhotoAfter(img);
    notify(photoBefore, img, bills);
  };

  const addBill = () => {
    const newBills = [
      ...bills,
      { id: uid(), description: '', amount: '', receipt: null },
    ];
    setBills(newBills);
    notify(photoBefore, photoAfter, newBills);
  };

  const updateBill = (id, updated) => {
    const newBills = bills.map(b => (b.id === id ? updated : b));
    setBills(newBills);
    notify(photoBefore, photoAfter, newBills);
  };

  const removeBill = id => {
    const newBills = bills.filter(b => b.id !== id);
    setBills(newBills);
    notify(photoBefore, photoAfter, newBills);
  };

  const totalAmount = bills.reduce(
    (sum, b) => sum + (parseFloat(b.amount) || 0),
    0,
  );

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.headerRow}>
        <MaterialCommunityIcons
          name="file-document-edit-outline"
          size={18}
          color={Colors.periwinkle}
        />
        <Text style={styles.headerText}>Trip Media & Bills</Text>
      </View>

      {/* vehicle photos */}
      <View style={styles.photosRow}>
        <PhotoSlot
          label="Before Trip"
          image={photoBefore}
          onPick={setBeforeAndNotify}
        />
        <PhotoSlot
          label="After Trip"
          image={photoAfter}
          onPick={setAfterAndNotify}
        />
      </View>

      {/* bills section */}
      <View style={styles.billsSection}>
        <View style={styles.billsHeader}>
          <Text style={styles.billsTitle}>Bills / Expenses</Text>
          {bills.length > 0 && (
            <Text style={styles.billsTotal}>
              Total ₹{totalAmount.toFixed(2)}
            </Text>
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

        <TouchableOpacity
          style={styles.addBillBtn}
          onPress={addBill}
          activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={16} color={Colors.periwinkle} />
          <Text style={styles.addBillTxt}>Add Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ActingDriverTripMedia;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 10,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 15,
    fontFamily: Fonts.semi_bold,
    color: Colors.black,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 10,
  },
  billsSection: {
    gap: 10,
  },
  billsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billsTitle: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.black,
  },
  billsTotal: {
    fontSize: 13,
    fontFamily: Fonts.semi_bold,
    color: Colors.periwinkle,
  },
  addBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.periwinkle + '88',
    backgroundColor: '#F0F0FF',
  },
  addBillTxt: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.periwinkle,
  },
});
