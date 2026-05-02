/**
 * DriverVehiclePhotosScreen
 * Combined screen for uploading pre-trip AND post-trip vehicle photos.
 */
import React, { useEffect, useState } from 'react';
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
import useTripsStore from '../store/useTripsStore';
import APIRequest from '../../common/APIRequest';
import { getPresignedImageUrl } from '../../common/utils/getPresignedImageUrl';
import UseBackButton from '../../common/hooks/UseBackButton';
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
  const [imgError, setImgError] = useState(false);
  const handle = async src => { setBusy(true); await pickImage(src, img => onPick(slotKey, img)); setBusy(false); };

  useEffect(() => { setImgError(false); }, [image?.uri]);

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
          <View style={{ width: '100%', height: 100, borderRadius: 8, overflow: 'hidden' }}>
            <Image
              source={{ uri: image.uri }}
              style={ps.thumb}
              onError={() => setImgError(true)}
            />
            {imgError && (
              <View style={ps.imgOverlay}>
                <MaterialCommunityIcons name="image-broken-variant" size={24} color="#C0C0C0" />
              </View>
            )}
          </View>
          <View style={ps.footer}>
            <Text style={ps.label}>{t(label)}</Text>
            <TouchableOpacity style={ps.reBtn} onPress={() => handle('camera')} activeOpacity={0.8}>
              <MaterialCommunityIcons name="camera-retake-outline" size={13} color={Colors.white} />
              <Text style={ps.reTxt}>{t('retake')}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={ps.emptyThumb}>
            <MaterialCommunityIcons name={icon} size={30} color="#C0C0C0" />
          </View>
          <Text style={ps.label}>{t(label)}</Text>
          <View style={ps.pickRow}>
            <TouchableOpacity style={ps.pickBtn} onPress={() => handle('camera')} disabled={busy} activeOpacity={0.8}>
              {busy
                ? <ActivityIndicator size="small" color={Colors.periwinkle} />
                : <><MaterialCommunityIcons name="camera-outline" size={14} color={Colors.periwinkle} /><Text style={ps.pickTxt}>{t('camera')}</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={ps.pickBtn} onPress={() => handle('gallery')} disabled={busy} activeOpacity={0.8}>
              <MaterialCommunityIcons name="image-outline" size={14} color={Colors.periwinkle} />
              <Text style={ps.pickTxt}>{t('gallery')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const ps = StyleSheet.create({
  slot: { width: '47%', borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA', padding: 10, alignItems: 'center', gap: 6 },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  imgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  emptyThumb: { width: '100%', height: 100, borderRadius: 8, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  loadingThumb: { backgroundColor: '#E8E8FF' },
  label: { fontSize: 11, fontFamily: Fonts.medium, color: Colors.grey_dark, textTransform: 'uppercase', letterSpacing: 0.5 },
  footer: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.periwinkle, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 6 },
  reTxt: { fontSize: 10, fontFamily: Fonts.medium, color: Colors.white },
  pickRow: { flexDirection: 'row', gap: 6, width: '100%' },
  pickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 7, borderRadius: 8, backgroundColor: '#F0F0FF', borderWidth: 1, borderColor: Colors.periwinkle + '44' },
  pickTxt: { fontSize: 10, fontFamily: Fonts.medium, color: Colors.periwinkle },
});

/* ─── main screen ─────────────────────────────────────────── */
const DriverVehiclePhotosScreen = () => {
  const { goBack } = useStackScreenStore();
  const {
    preTripPhotos, setPreTripPhotos, setPreTripDone,
    postTripPhotos, setPostTripPhotos, setPostTripDone,
  } = useActingDriverMediaStore();
  const { userInfo } = useUserStore();
  const { activeTripData } = useTripsStore();

  const [loadingFromServer, setLoadingFromServer] = useState(false);
  const [uploadingPre, setUploadingPre] = useState(false);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [preUploaded, setPreUploaded] = useState(false);
  const [postUploaded, setPostUploaded] = useState(false);

  const { t } = useTranslation();

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

  // Seed from server
  useEffect(() => {
    const serverBills = activeTripData?.[0]?.bills;
    if (!serverBills) return;

    (async () => {
      setLoadingFromServer(true);
      try {
        const pre = serverBills.preTripVehiclePhotos;
        if (pre?.front && !Object.values(preTripPhotos).some(Boolean)) {
          const [front, rear, leftSide, rightSide] = await Promise.all([
            resolveSlot(pre.front, 'pre_front.jpg'),
            resolveSlot(pre.rear, 'pre_rear.jpg'),
            resolveSlot(pre.leftSide, 'pre_leftSide.jpg'),
            resolveSlot(pre.rightSide, 'pre_rightSide.jpg'),
          ]);
          const seeded = { front, rear, leftSide, rightSide };
          if (Object.values(seeded).some(Boolean)) { setPreTripPhotos(seeded); setPreUploaded(true); }
        }

        const post = serverBills.postTripVehiclePhotos;
        if (post?.front && !Object.values(postTripPhotos).some(Boolean)) {
          const [front, rear, leftSide, rightSide] = await Promise.all([
            resolveSlot(post.front, 'post_front.jpg'),
            resolveSlot(post.rear, 'post_rear.jpg'),
            resolveSlot(post.leftSide, 'post_leftSide.jpg'),
            resolveSlot(post.rightSide, 'post_rightSide.jpg'),
          ]);
          const seeded = { front, rear, leftSide, rightSide };
          if (Object.values(seeded).some(Boolean)) { setPostTripPhotos(seeded); setPostUploaded(true); }
        }
      } finally {
        setLoadingFromServer(false);
      }
    })();
  }, [activeTripData]);

  const preDoneCount = Object.values(preTripPhotos).filter(Boolean).length;
  const postDoneCount = Object.values(postTripPhotos).filter(Boolean).length;
  const preAllDone = preDoneCount === 4;
  const postAllDone = postDoneCount === 4;
  const tripStatus = activeTripData?.[0]?.status;
  const isAccepted = tripStatus === 'ACCEPTED';

  const [preExpanded, setPreExpanded] = useState(true);
  const [postExpanded, setPostExpanded] = useState(true);

  const onPickPre = (key, img) => { setPreTripPhotos({ ...preTripPhotos, [key]: img }); setPreUploaded(false); };
  const onPickPost = (key, img) => { setPostTripPhotos({ ...postTripPhotos, [key]: img }); setPostUploaded(false); };

  const uploadPre = async () => {
    if (!preAllDone) { Alert.alert(t('photos_required'), t('please_capture_all_4_pre_trip_photos')); return; }
    try {
      setUploadingPre(true);
      const formData = new FormData();
      formData.append('tripId', activeTripData[0]._id);
      formData.append('phase', 'pre');
      formData.append('preFront',     { uri: preTripPhotos.front.uri,     type: preTripPhotos.front.type,     name: preTripPhotos.front.name });
      formData.append('preRear',      { uri: preTripPhotos.rear.uri,      type: preTripPhotos.rear.type,      name: preTripPhotos.rear.name });
      formData.append('preLeftSide',  { uri: preTripPhotos.leftSide.uri,  type: preTripPhotos.leftSide.type,  name: preTripPhotos.leftSide.name });
      formData.append('preRightSide', { uri: preTripPhotos.rightSide.uri, type: preTripPhotos.rightSide.type, name: preTripPhotos.rightSide.name });
      const api = new APIRequest();
      const res = await api.request('/publicrides/driver/v2/uploadTripMedia', 'POST', formData, userInfo?.token);
      if (res.success) { setPreUploaded(true); setPreTripDone(true);goBack(); }
      else Alert.alert('Upload Failed', res?.message || 'Could not upload pre-trip photos.');
    } catch { Alert.alert('Error', 'Something went wrong.'); }
    finally { setUploadingPre(false); }
  };

  const uploadPost = async () => {
    if (!postAllDone) { Alert.alert(t('photos_required'), t('please_capture_all_4_post_trip_photos')); return; }
    try {
      setUploadingPost(true);
      const formData = new FormData();
      formData.append('tripId', activeTripData[0]._id);
      formData.append('phase', 'post');
      formData.append('postFront',     { uri: postTripPhotos.front.uri,     type: postTripPhotos.front.type,     name: postTripPhotos.front.name });
      formData.append('postRear',      { uri: postTripPhotos.rear.uri,      type: postTripPhotos.rear.type,      name: postTripPhotos.rear.name });
      formData.append('postLeftSide',  { uri: postTripPhotos.leftSide.uri,  type: postTripPhotos.leftSide.type,  name: postTripPhotos.leftSide.name });
      formData.append('postRightSide', { uri: postTripPhotos.rightSide.uri, type: postTripPhotos.rightSide.type, name: postTripPhotos.rightSide.name });
      const api = new APIRequest();
      const res = await api.request('/publicrides/driver/v2/uploadTripMedia', 'POST', formData, userInfo?.token);
      if (res.success) { goBack(); setPostUploaded(true); setPostTripDone(true); }
      else Alert.alert('Upload Failed', res?.message || 'Could not upload post-trip photos.');
    } catch { Alert.alert('Error', 'Something went wrong.'); }
    finally { setUploadingPost(false); }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <UseBackButton onBackPress={goBack} />
        <TouchableOpacity style={styles.backBtn} onPress={() => goBack()} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.black} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{t('vehicle_photos')}</Text>
          <Text style={styles.subtitle}>{t('upload_before_after_trip_photos')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Pre-trip Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeaderRow} onPress={() => setPreExpanded(v => !v)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="car-back" size={18} color={Colors.periwinkle} />
            <Text style={styles.sectionTitle}>{t('pre_trip_photos')}</Text>
            <Text style={styles.progressTxt}>{preDoneCount}/4</Text>
            {preUploaded && (
              <View style={styles.uploadedBadge}>
                <MaterialCommunityIcons name="check-circle" size={13} color="#43A047" />
                <Text style={styles.uploadedTxt}>{t('uploaded')}</Text>
              </View>
            )}
            <MaterialCommunityIcons
              name={preExpanded ? 'chevron-up' : 'chevron-down'}
              size={20} color={Colors.grey_dark} style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
          {preExpanded && (
            <>
              <View style={styles.grid}>
                {PHOTO_SLOTS.map(s => (
                  <PhotoSlot key={s.key} slotKey={s.key} label={s.label} icon={s.icon} t={t}
                    image={preTripPhotos[s.key]} onPick={onPickPre} loading={loadingFromServer} />
                ))}
              </View>
              <TouchableOpacity
                style={[styles.uploadBtn, (!preAllDone || uploadingPre) && styles.uploadBtnDisabled]}
                onPress={uploadPre}
                disabled={!preAllDone || uploadingPre}
                activeOpacity={0.8}>
                {uploadingPre
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <MaterialCommunityIcons name="cloud-upload-outline" size={16} color={Colors.white} />}
                <Text style={styles.uploadBtnTxt}>{uploadingPre ? t('uploading') : preUploaded ? t('reupload_pre_trip') : t('upload_pre_trip_photos')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Post-trip Section */}
        {!isAccepted && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeaderRow} onPress={() => setPostExpanded(v => !v)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="car" size={18} color={Colors.periwinkle} />
            <Text style={styles.sectionTitle}>{t('post_trip_photos')}</Text>
            <Text style={styles.progressTxt}>{postDoneCount}/4</Text>
            {postUploaded && (
              <View style={styles.uploadedBadge}>
                <MaterialCommunityIcons name="check-circle" size={13} color="#43A047" />
                <Text style={styles.uploadedTxt}>{t('uploaded')}</Text>
              </View>
            )}
            <MaterialCommunityIcons
              name={postExpanded ? 'chevron-up' : 'chevron-down'}
              size={20} color={Colors.grey_dark} style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
          {postExpanded && (
            <>
              <View style={styles.grid}>
                {PHOTO_SLOTS.map(s => (
                  <PhotoSlot key={s.key} slotKey={s.key} label={s.label} icon={s.icon} t={t}
                    image={postTripPhotos[s.key]} onPick={onPickPost} loading={loadingFromServer} />
                ))}
              </View>
              <TouchableOpacity
                style={[styles.uploadBtn, (!postAllDone || uploadingPost) && styles.uploadBtnDisabled]}
                onPress={uploadPost}
                disabled={!postAllDone || uploadingPost}
                activeOpacity={0.8}>
                {uploadingPost
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <MaterialCommunityIcons name="cloud-upload-outline" size={16} color={Colors.white} />}
                <Text style={styles.uploadBtnTxt}>{uploadingPost ? t('uploading') : postUploaded ? t('reupload_post_trip') : t('upload_post_trip_photos')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        )}
      </ScrollView>
    </View>
  );
};

export default DriverVehiclePhotosScreen;

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
  body: { padding: 16, gap: 16, paddingBottom: 30 },
  section: {
    backgroundColor: '#FAFAFA', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#EBEBEB', gap: 12,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontFamily: Fonts.semi_bold, color: Colors.black, flex: 1 },
  progressTxt: { fontSize: 12, fontFamily: Fonts.medium, color: Colors.grey_dark },
  uploadedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  uploadedTxt: { fontSize: 11, fontFamily: Fonts.medium, color: '#43A047' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.periwinkle, paddingVertical: 12, borderRadius: 10,
  },
  uploadBtnDisabled: { backgroundColor: '#BDBDBD' },
  uploadBtnTxt: { fontSize: 13, fontFamily: Fonts.medium, color: Colors.white },
});
