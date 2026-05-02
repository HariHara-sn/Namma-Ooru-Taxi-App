/**
 * ActingDriverPreTripScreen
 * Driver uploads 4 vehicle photos BEFORE the trip starts.
 * Front · Rear · Left Side · Right Side
 */
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts } from '../../common/constants/constants';
import {
  checkCameraPermission,
  RequestCameraPermission,
} from '../../common/controllers/PermissionHandler';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import useActingDriverMediaStore from '../store/useActingDriverMediaStore';
import useUserStore from '../../common/store/useUserStore';
import { useTripAcceptStore } from '../store/useTripAcceptStore';
import APIRequest from '../../common/APIRequest';
import useTripsStore from '../store/useTripsStore';
import { getPresignedImageUrl } from '../../common/utils/getPresignedImageUrl';
import { useTranslation } from 'react-i18next';

const PHOTO_SLOTS = [
  { key: 'front',     label: 'front',      icon: 'car-back' },
  { key: 'rear',      label: 'rear',       icon: 'car' },
  { key: 'leftSide',  label: 'left_side',  icon: 'car-side' },
  { key: 'rightSide', label: 'right_side', icon: 'car-side' },
];

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

const PhotoSlot = ({ slotKey, label, icon, image, onPick, loading, t }) => {
  const [busy, setBusy] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const handle = async src => { setBusy(true); await pickImage(src, img => onPick(slotKey, img)); setBusy(false); };

  // Reset error state when image changes
  useEffect(() => { setImgError(false); setImgLoading(false); }, [image?.uri]);

  return (
    <View style={ss.slot}>
      {loading ? (
        <>
          <View style={[ss.emptyThumb, ss.loadingThumb]}>
            <ActivityIndicator size="small" color={Colors.periwinkle} />
          </View>
          {/* <Text style={ss.slotLabel}>{t(label)}</Text> */}
        </>
      ) : image ? (
        <>
          <View style={{ width: '100%', height: 110, borderRadius: 8, overflow: 'hidden' }}>
            <Image
              source={{ uri: image.uri }}
              style={ss.thumb}
              onLoadStart={() => setImgLoading(true)}
              onLoadEnd={() => setImgLoading(false)}
              onError={() => { setImgLoading(false); setImgError(true); }}
            />
            {imgLoading && (
              <View style={ss.imgOverlay}>
                <ActivityIndicator size="small" color={Colors.periwinkle} />
              </View>
            )}
            {imgError && (
              <View style={ss.imgOverlay}>
                <MaterialCommunityIcons name="image-broken-variant" size={28} color="#C0C0C0" />
                <Text style={{ fontSize: 10, color: Colors.grey_dark, marginTop: 4 }}>{t('failed_to_load')}</Text>
              </View>
            )}
          </View>
          <View style={ss.slotFooter}>
            {/* <Text style={ss.slotLabel}>{t(label)}</Text> */}
            <TouchableOpacity style={ss.reBtn} onPress={() => handle('camera')} activeOpacity={0.8}>
              <MaterialCommunityIcons name="camera-retake-outline" size={14} color={Colors.white} />
              <Text style={ss.reTxt}>{t('retake')}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={ss.emptyThumb}>
            <MaterialCommunityIcons name={icon} size={34} color="#C0C0C0" />
          </View>
          {/* <Text style={ss.slotLabel}>{t(label)}</Text> */}
          <View style={ss.pickRow}>
            <TouchableOpacity style={ss.pickBtn} onPress={() => handle('camera')} disabled={busy} activeOpacity={0.8}>
              {busy
                ? <ActivityIndicator size="small" color={Colors.periwinkle} />
                : <><MaterialCommunityIcons name="camera-outline" size={16} color={Colors.periwinkle} /><Text style={ss.pickTxt}>{t('camera')}</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={ss.pickBtn} onPress={() => handle('gallery')} disabled={busy} activeOpacity={0.8}>
              <MaterialCommunityIcons name="image-outline" size={16} color={Colors.periwinkle} />
              <Text style={ss.pickTxt}>{t('gallery')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

/* ─── main screen ─────────────────────────────────────────── */
const ActingDriverPreTripScreen = () => {
  const { goBack } = useStackScreenStore();
  const { preTripPhotos, setPreTripPhotos, setPreTripDone } = useActingDriverMediaStore();
  const { userInfo } = useUserStore();
  const { activeTripData } = useTripsStore();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [loadingFromServer, setLoadingFromServer] = useState(false);
  const {t} = useTranslation()

  // Seed photos from server when activeTripData hydrates from AsyncStorage (cache-cleared scenario)
  useEffect(() => {
    if (Object.values(preTripPhotos).some(Boolean)) return; // skip if store already has photos
    const serverPrePhotos = activeTripData?.[0]?.bills?.preTripVehiclePhotos;
    if (!serverPrePhotos) return;

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
      const [front, rear, leftSide, rightSide] = await Promise.all([
        resolveSlot(serverPrePhotos.front,     'pre_front.jpg'),
        resolveSlot(serverPrePhotos.rear,      'pre_rear.jpg'),
        resolveSlot(serverPrePhotos.leftSide,  'pre_leftSide.jpg'),
        resolveSlot(serverPrePhotos.rightSide, 'pre_rightSide.jpg'),
      ]);
      const seeded = { front, rear, leftSide, rightSide };
      if (Object.values(seeded).some(Boolean)) {
        setPreTripPhotos(seeded);
        setUploaded(true);
      }
      setLoadingFromServer(false);
    })();
  }, [activeTripData]);

  // Use store as single source of truth — no divergence possible
  const photos = preTripPhotos;
  const doneCount = Object.values(photos).filter(Boolean).length;
  const allDone = doneCount === 4;

  const onPick = (key, img) => {
    const updated = { ...photos, [key]: img };
    setPreTripPhotos(updated); // update store directly — UI re-renders via subscription
    setUploaded(false);
  };

  // Step 1: upload photos to server, stay on screen
  const onUpload = async () => {
    if (!allDone) {
      Alert.alert(t('photos_required'), t('please_capture_all_4_vehicle_photos_before_starting'));
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('tripId', activeTripData[0]._id);
      formData.append('phase', 'pre');
      formData.append('preFront',     { uri: photos.front.uri,     type: photos.front.type,     name: photos.front.name });
      formData.append('preRear',      { uri: photos.rear.uri,      type: photos.rear.type,      name: photos.rear.name });
      formData.append('preLeftSide',  { uri: photos.leftSide.uri,  type: photos.leftSide.type,  name: photos.leftSide.name });
      formData.append('preRightSide', { uri: photos.rightSide.uri, type: photos.rightSide.type, name: photos.rightSide.name });
      const api = new APIRequest();
      const res = await api.request('/publicrides/driver/v2/uploadTripMedia', 'POST', formData, userInfo?.token);
      if (res.success) {
        setUploaded(true);
        return;
      }
      if (!res?.success) {
        Alert.alert('Upload Failed', res?.message || 'Could not upload photos. Please try again.');
        return;
      }
      setUploaded(true);
    } catch (e) {
      Alert.alert('Error', 'Something went wrong while uploading photos.');
    } finally {
      setUploading(false);
    }
  };

  // Step 2: confirm triggers the trip start and goes back
  const onConfirm = () => {
    setPreTripDone(true);
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
          <Text style={styles.title}>{t('vehicle_photos_before_trip')}</Text>
          <Text style={styles.subtitle}>{t('capture_all_4_angles_before_you_start')}</Text>
        </View>
      </View>

      {/* progress */}
      <View style={styles.progressRow}>
        {PHOTO_SLOTS.map((s, i) => (
          <View
            key={s.key}
            style={[styles.progressDot, photos[s.key] && styles.progressDotDone]}
          />
        ))}
        <Text style={styles.progressTxt}>{doneCount} / 4 photos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {PHOTO_SLOTS.map(s => (
          <PhotoSlot
            key={s.key}
            slotKey={s.key}
            label={s.label}
            icon={s.icon}
            image={photos[s.key]}
            onPick={onPick}
            loading={loadingFromServer}
            t={t}
          />
        ))}
      </ScrollView>

      {/* footer */}
      <View style={styles.footer}>
        {/* {uploaded ? (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={onConfirm}
            activeOpacity={0.8}>
            <MaterialCommunityIcons name="flag-checkered" size={18} color={Colors.white} />
            <Text style={styles.confirmTxt}>Start Trip</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.confirmBtn, (!allDone || uploading) && styles.confirmBtnDisabled]}
            onPress={onUpload}
            disabled={!allDone || uploading}
            activeOpacity={0.8}>
            {uploading
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <MaterialCommunityIcons name="cloud-upload-outline" size={18} color={Colors.white} />}
            <Text style={styles.confirmTxt}>{uploading ? 'Uploading...' : 'Upload Photos'}</Text>
          </TouchableOpacity>
        )} */}
         <TouchableOpacity
            style={[styles.confirmBtn, (!allDone || uploading) && styles.confirmBtnDisabled]}
            onPress={onUpload}
            disabled={!allDone || uploading}
            activeOpacity={0.8}>
            {uploading
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <MaterialCommunityIcons name="cloud-upload-outline" size={18} color={Colors.white} />}
            <Text style={styles.confirmTxt}>{uploading ? t('uploading') : t('upload_photos')}</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
};

export default ActingDriverPreTripScreen;

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
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  progressDotDone: { backgroundColor: Colors.periwinkle },
  progressTxt: { fontSize: 12, fontFamily: Fonts.medium, color: Colors.grey_dark, marginLeft: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
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
  skipTxt: { fontSize: 14, fontFamily: Fonts.medium, color: Colors.grey_dark },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.periwinkle,
    paddingVertical: 13,
    borderRadius: 10,
    elevation: 3,
    shadowColor: Colors.periwinkle,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  confirmBtnDisabled: { backgroundColor: '#BDBDBD', elevation: 0, shadowOpacity: 0 },
  confirmTxt: { fontSize: 14, fontFamily: Fonts.semi_bold, color: Colors.white },
  
});


const ss = StyleSheet.create({
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
  imgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  emptyThumb: {
    width: '100%',
    height: 110,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: { fontSize: 12, fontFamily: Fonts.medium, color: Colors.grey_dark, textTransform: 'uppercase', letterSpacing: 0.5 },
  loadingThumb: { backgroundColor: '#E8E8FF' },
  slotFooter: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.periwinkle, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  reTxt: { fontSize: 11, fontFamily: Fonts.medium, color: Colors.white },
  pickRow: { flexDirection: 'row', gap: 8, width: '100%' },
  pickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F0F0FF', borderWidth: 1, borderColor: Colors.periwinkle + '44' },
  pickTxt: { fontSize: 11, fontFamily: Fonts.medium, color: Colors.periwinkle },
});