import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ActivityIndicator, Platform, Vibration, BackHandler } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import BottomSheetWrapper from './BottomSheetWrapper';
import { useFeedbackSheetStore } from '../store/useFeedbackSheetStore';
import { Fonts } from '../constants/constants';
import { colors } from '../constants/constants';
import { useTranslation } from 'react-i18next';
import { submitAppFeedback } from '../API/EndPoints/EndPoints';
import { showNotification } from './NotificationManger';
import { utils } from '../utils/Utils';

const FieldLabel = ({ label, required }) => (
  <Text style={styles.label}>
    {label}
    {required ? <Text style={styles.required}>*</Text> : null}
  </Text>
);

FieldLabel.propTypes = {
  label: PropTypes.string,
  required: PropTypes.bool,
};

const OptionItem = ({ selected, label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.optionItem, selected && styles.optionItemSelected]}>
    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

OptionItem.propTypes = {
  selected: PropTypes.bool,
  label: PropTypes.string,
  onPress: PropTypes.func,
};

// Centralized field generator (labels/placeholders via i18n)
const buildFields = (t, screenName) => ([
  ...(screenName && String(screenName).toLowerCase().includes('search') ? [
    { name: 'searchIssue', label: t('feedback_search_issue_label'), type: 'multiline', placeholder: t('feedback_search_issue_placeholder'), required: true },
  ] : []),
  ...(screenName && String(screenName).toLowerCase().includes('picklocation') ? [
    { name: 'pickLocationIssue', label: t('feedback_pick_location_issue_label'), type: 'multiline', placeholder: t('feedback_pick_location_issue_placeholder'), required: true },
  ] : []),
  ...(screenName && (String(screenName).toLowerCase().includes('bookride') || String(screenName).toLowerCase().includes('planride')) ? [
    { name: 'tripIssue', label: t('feedback_trip_issue_label'), type: 'multiline', placeholder: t('feedback_trip_issue_placeholder'), required: true },
  ] : []),
  { name: 'goodThings', label: t('feedback_good_things_label'), type: 'multiline', placeholder: t('feedback_good_things_placeholder'), required: true },
  { name: 'badThings', label: t('feedback_bad_things_label'), type: 'multiline', placeholder: t('feedback_bad_things_placeholder'), required: true },
  { name: 'improvements', label: t('feedback_improvements_label'), type: 'multiline', placeholder: t('feedback_improvements_placeholder'), required: true },
  { name: 'issueMessage', label: t('feedback_issue_label'), type: 'multiline', placeholder: t('feedback_issue_placeholder'), required: true },
  { name: 'contactEmail', label: t('feedback_contact_email_label'), type: 'email', placeholder: t('feedback_email_placeholder'), autoCapitalize: 'none' },
  { name: 'consentEmail', label: t('feedback_consent_text'), type: 'toggle', defaultValue: false },
]);

const SectionTitle = ({ icon, text, required }) => (
  <View style={styles.sectionTitle}>
    <Text style={styles.sectionText}>
      {text}
      {required ? <Text style={styles.required}>*</Text> : null}
    </Text>
    <Ionicons name={icon} size={16} color={colors.blue} />
  </View>
);

const Checkbox = ({ checked, onToggle }) => (
  <TouchableOpacity onPress={onToggle} style={styles.checkbox} accessibilityRole={'checkbox'} accessibilityState={{ checked }}>
    <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
      {checked ? <Ionicons name={'checkmark'} size={14} color={colors.white} /> : null}
    </View>
  </TouchableOpacity>
);

Checkbox.propTypes = {
  checked: PropTypes.bool,
  onToggle: PropTypes.func,
};

SectionTitle.propTypes = {
  icon: PropTypes.string,
  text: PropTypes.string,
  required: PropTypes.bool,
};

const FeedbackBottomSheet = () => {
  const { t } = useTranslation();
  const sheetRef = useRef(null);
  const [sheetIndex, setSheetIndex] = useState(-1);
  const [inputHeights, setInputHeights] = useState({});
  const { isVisible, values, setValue, setValues, submitting, setSubmitting, close, screenName } = useFeedbackSheetStore(state => ({
    isVisible: state.isVisible,
    values: state.values,
    setValue: state.setValue,
    setValues: state.setValues,
    submitting: state.submitting,
    setSubmitting: state.setSubmitting,
    close: state.close,
    screenName: state.screenName,
  }));

  useEffect(() => {
    setSheetIndex(isVisible ? 1 : -1);
  }, [isVisible]);

  useEffect(() => {
    const backAction = () => {
      if (isVisible) {
        sheetRef.current?.close();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [isVisible, close]);

  const snapPoints = useMemo(() => ['40%', '100%'], []);

  const fields = useMemo(() => buildFields(t, screenName), [t, screenName]);
  const lowerScreenName = typeof screenName === 'string' ? String(screenName).toLowerCase() : '';
  const showGenericIssue = !(
    lowerScreenName.includes('search') ||
    lowerScreenName.includes('picklocation') ||
    lowerScreenName.includes('bookride') 
  );

  // Initialize defaults for missing values when sheet opens
  useEffect(() => {
    if (!isVisible) return;
    const next = {};
    fields.forEach(f => {
      const key = f.name;
      const current = values[key];
      if (current === undefined) {
        if (Object.prototype.hasOwnProperty.call(f, 'defaultValue')) {
          next[key] = f.defaultValue;
        } else {
          next[key] = f.type === 'toggle' ? false : '';
        }
      }
    });
    if (Object.keys(next).length) {
      setValues(next);
    }
  }, [isVisible, fields]);

  const onSubmitPress = async () => {
    // Vibration.vibrate(100);
    const visibleFields = fields.filter(f => {
      if (f.name === 'issueMessage') {
        return showGenericIssue;
      }
      if (['searchIssue', 'pickLocationIssue', 'tripIssue'].includes(f.name)) {
        const lowerScreenName = typeof screenName === 'string' ? String(screenName).toLowerCase() : '';
        if (f.name === 'searchIssue') return lowerScreenName.includes('search');
        if (f.name === 'pickLocationIssue') return lowerScreenName.includes('picklocation');
        if (f.name === 'tripIssue') return lowerScreenName.includes('bookride') ;
      }
      return true;
    });

    for (const field of visibleFields) {
      console.log("field",field)
      if (field.required) {
        const value = values[field.name];
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          // eslint-disable-next-line no-alert
          alert(t('fill_all_required_fields'));
          return;
        }
      }
    }

    const trimmedEmail = typeof values.contactEmail === 'string' ? values.contactEmail.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (trimmedEmail && !values.consentEmail) {
      alert(t('feedback_validation_email_consent'));
      return;
    }

    // If consent is enabled, or email is voluntarily provided, ensure email is valid
    if (values.consentEmail || trimmedEmail) {
      if (!trimmedEmail) {
        alert(t('feedback_validation_email'));
        return;
      }
      if (!emailRegex.test(trimmedEmail)) {
        alert(t('feedback_validation_email'));
        return;
      }
    }

    try {
      setSubmitting(true);
      const rawSearchQuery = typeof values.searchQuery === 'string' ? values.searchQuery.trim() : '';
      const rawSearchIssue = typeof values.searchIssue === 'string' ? values.searchIssue.trim() : '';
      const combinedSearchIssue = rawSearchQuery
        ? `${rawSearchQuery}${rawSearchIssue ? ` - ${rawSearchIssue}` : ''}`
        : rawSearchIssue;
      // Build payload and include only keys that actually have values
      // Helpers to normalize coordinates into [lon, lat]
      const toLonLatArray = (input) => {
        if (!input) return undefined;
        // Already [lon, lat]
        if (Array.isArray(input) && input.length >= 2 && typeof input[0] === 'number' && typeof input[1] === 'number') {
          return [input[0], input[1]];
        }
        // String "lat,lon" or "lat , lon"
        if (typeof input === 'string') {
          const nums = input.split(/[,\s]+/).map((n) => parseFloat(n)).filter((n) => !Number.isNaN(n));
          if (nums.length >= 2) {
            const lat = nums[0];
            const lon = nums[1];
            if (Number.isFinite(lat) && Number.isFinite(lon)) {
              return [lon, lat];
            }
          }
          return undefined;
        }
        // Object with latitude/longitude
        if (typeof input === 'object') {
          const lat = input?.latitude ?? input?.lat;
          const lon = input?.longitude ?? input?.lon;
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return [Number(lon), Number(lat)];
          }
          // GeoJSON-like { location: [lon, lat] }
          if (Array.isArray(input?.location) && input.location.length >= 2) {
            const a = input.location;
            if (Number.isFinite(a[0]) && Number.isFinite(a[1])) {
              return [a[0], a[1]];
            }
          }
        }
        return undefined;
      };
      const coalesceCoords = (...candidates) => {
        for (let i = 0; i < candidates.length; i += 1) {
          const out = toLonLatArray(candidates[i]);
          if (out) return out;
        }
        return undefined;
      };
      const toAddressString = (addr) => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr;
        try {
          return utils.formatAddressName(addr) || '';
        } catch {
          return '';
        }
      };

      // Build trip objects
      const tripStartObj = {};
      const tripStartAddress = toAddressString(values.tripStartName);
      if (tripStartAddress && tripStartAddress.trim().length > 0) {
        tripStartObj.address = tripStartAddress.trim();
      }
      const tripStartCoords = coalesceCoords(values.pickupCoords, values.tripStartCoords, values.tripStartName);
      if (tripStartCoords) {
        tripStartObj.coords = tripStartCoords;
      }

      const tripEndObj = {};
      const tripEndAddress = toAddressString(values.tripEndName);
      if (tripEndAddress && tripEndAddress.trim().length > 0) {
        tripEndObj.address = tripEndAddress.trim();
      }
      const tripEndCoords = coalesceCoords(values.dropCoords, values.tripEndCoords, values.tripEndName);
      if (tripEndCoords) {
        tripEndObj.coords = tripEndCoords;
      }

      const isRideStatus = typeof screenName === 'string' && screenName.toLowerCase().includes('ridestatus');
      const fullPayload = {
        screen: screenName || 'Unknown',
        tripId: isRideStatus ? values.tripId : undefined,
        searchIssue: combinedSearchIssue,
        pickLocationIssue: values.pickLocationIssue,
        pickLocationCoords: toLonLatArray(values.coords),
        tripIssue: values.tripIssue,
        tripStart: Object.keys(tripStartObj).length ? tripStartObj : undefined,
        tripEnd: Object.keys(tripEndObj).length ? tripEndObj : undefined,
        tripDistanceKm: values.tripDistanceKm,
        goodThings: values.goodThings,
        badThings: values.badThings,
        improvements: values.improvements,
        issueMessage: values.issueMessage,
        email: trimmedEmail,
      };
      const payload = Object.keys(fullPayload).reduce((acc, key) => {
        const v = fullPayload[key];
        if (v === undefined || v === null) {
          return acc;
        }
        if (typeof v === 'string' && v.trim() === '') {
          return acc;
        }
        if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) {
          return acc;
        }
        acc[key] = v;
        return acc;
      }, {});

      console.log('payload', payload);
      const response = await submitAppFeedback(payload);
      sheetRef.current?.close();
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (f) => {
    const key = f.name;
    const val = values[key];
    const type = f.type || 'text';

    switch (type) {
      case 'text':
        return (
          <View key={key} style={styles.fieldBlock}>
            {/* <FieldLabel label={f.label || key} required={!!f.required} /> */}
            <TextInput
              value={typeof val === 'string' ? val : String(val ?? '')}
              onChangeText={(t) => setValue(key, t)}
              placeholder={f.placeholder}
              placeholderTextColor={'#9AA1A9'}
              style={styles.input}
              placeholderFontFamily={Fonts.regular}
              autoCapitalize={f.autoCapitalize}
              keyboardType={f.keyboardType}
            />
          </View>
        );
      case 'email':
        return (
          <View key={key} style={styles.fieldBlock}>
            {/* <FieldLabel label={f.label || key} required={!!f.required} /> */}
            <TextInput
              value={typeof val === 'string' ? val : String(val ?? '')}
              onChangeText={(t) => setValue(key, t)}
              placeholder={f.placeholder}
              style={styles.input}
              autoCapitalize={f.autoCapitalize || 'none'}
              placeholderFontFamily={Fonts.regular}
              autoCorrect={false}
              keyboardType={'email-address'}
            />
            <Text style={styles.hintText}>We use your email only to follow up on this feedback.</Text>
          </View>
        );
      case 'number':
        return (
          <View key={key} style={styles.fieldBlock}>
            {/* <FieldLabel label={f.label || key} required={!!f.required} /> */}
            <TextInput
              value={String(val ?? '')}
              onChangeText={(t) => setValue(key, t.replace(/[^0-9.]/g, ''))}
              placeholder={f.placeholder}
              placeholderFontFamily={Fonts.regular}
              keyboardType="numeric"
              
              style={styles.input}
            />
          </View>
        );
      case 'multiline':
      case 'textarea': {
        const dynamicHeight = Math.max(44, Math.min(200, inputHeights[key] || 44));
        const isAndroidSearchIssue = Platform.OS === 'android' && key === 'searchIssue';
        return (
          <View key={key} style={styles.fieldBlock}>
            {/* <FieldLabel label={f.label || key} required={!!f.required} /> */}
            <TextInput
              value={typeof val === 'string' ? val : String(val ?? '')}
              onChangeText={(t) => setValue(key, t)}
              placeholder={f.placeholder}
              placeholderTextColor={'#9AA1A9'}
              style={[styles.input, styles.multiline, { height: dynamicHeight }]}
              placeholderFontFamily={Fonts.regular}
              multiline
              scrollEnabled={false}
              // Workaround Android crash showing insertion handle on some themes
              caretHidden={isAndroidSearchIssue}
              selectTextOnFocus={false}
              underlineColorAndroid="transparent"
              onContentSizeChange={(e) => {
                const h = e?.nativeEvent?.contentSize?.height || 44;
                setInputHeights(prev => ({ ...prev, [key]: h }));
              }}
              textAlignVertical="top"
            />
          </View>
        );
      }
      case 'toggle':
        return (
          <View key={key} style={[styles.fieldBlock, styles.toggleRow]}>
            {/* <FieldLabel label={f.label || key} required={!!f.required} /> */}
            <Switch value={!!val} onValueChange={(v) => setValue(key, v)} />
          </View>
        );
      case 'select':
        return (
          <View key={key} style={styles.fieldBlock}>
            {/* <FieldLabel label={f.label || key} required={!!f.required} /> */}
            <View style={styles.optionsWrap}>
              {(f.options || []).map((opt) => (
                <OptionItem
                  key={String(opt.value)}
                  label={opt.label}
                  selected={val === opt.value}
                  onPress={() => setValue(key, opt.value)}
                />
              ))}
            </View>
          </View>
        );
      default:
        return (
          <View key={key} style={styles.fieldBlock}>
            {/* <FieldLabel label={f.label || key} required={!!f.required} /> */}
            <TextInput
              value={typeof val === 'string' ? val : String(val ?? '')}
              onChangeText={(t) => setValue(key, t)}
              placeholder={f.placeholder}
              style={styles.input}
            />
          </View>
        );
    }
  };

  return (
    <BottomSheetWrapper
      ref={sheetRef}
      index={sheetIndex}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableOverDrag
      enableScroll
      backdrop
      style={styles.sheet}
      onChange={(idx) => {
        if (idx === -1) {
          close();
        }
      }}
    >
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Ionicons name={'chatbubbles-outline'} size={20} color={'#0A84FF'} />
            <Text style={styles.title}>{t('feedback_title')}</Text>
          </View>
          <TouchableOpacity onPress={() => sheetRef.current?.close()} style={styles.closeBtn} accessibilityLabel={'Close feedback'}>
            <Ionicons name={'close'} size={22} color={'#111'} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{t('feedback_subtitle')}</Text>
        <View style={styles.fieldsWrap}>
          {screenName && String(screenName).toLowerCase().includes('search') && (
            <>
              <SectionTitle icon={'search-outline'} text={t('feedback_search_issue_title')} required />
            {!!values.searchQuery && (
              <Text style={styles.coordsText}>{t('feedback_search_query_label', { query: values.searchQuery })}</Text>
            )}
              {fields.filter(f => f.name === 'searchIssue').map(renderField)}
            </>
          )}
          {screenName && String(screenName).toLowerCase().includes('picklocation') && (
            <>
              <SectionTitle icon={'location-outline'} text={t('feedback_pick_location_issue_title')} required />
              {!!values.coords && (
                <Text style={styles.coordsText}>{t('feedback_selected_coords')}: {values.coords}</Text>
              )}
              {fields.filter(f => f.name === 'pickLocationIssue').map(renderField)}
            </>
          )}
          {screenName && (
            String(screenName).toLowerCase().includes('bookride') ||
            (String(screenName).toLowerCase().includes('planride') && !!values.tripStartName && !!values.tripEndName && !!values.tripDistanceKm)
          ) && (
            <>
              <SectionTitle icon={'flag-outline'} text={t('feedback_trip_issue_title')} required />
              <Text style={styles.coordsText}>{t('feedback_pickup_label')}: {utils.formatAddressName(values.tripStartName) || '-'}</Text>
              <Text style={styles.coordsText}>{t('feedback_drop_label')}: {utils.formatAddressName(values.tripEndName) || '-'}</Text>
              {!!values.tripDistanceKm && (
                <Text style={styles.coordsText}>{t('feedback_distance_label')}: {values.tripDistanceKm} km</Text>
              )}
              {fields.filter(f => f.name === 'tripIssue').map(renderField)}
            </>
          )}
          {screenName && String(screenName).toLowerCase().includes('ridestatus') && (
            <>
              <SectionTitle icon={'flag-outline'} text={t('feedback_trip_issue_title')} required />
              <Text style={styles.coordsText}>{t('feedback_pickup_label')}: {utils.formatAddressName(values.tripStartName) || '-'}</Text>
              <Text style={styles.coordsText}>{t('feedback_drop_label')}: {utils.formatAddressName(values.tripEndName) || '-'}</Text>
              {!!values.tripDistanceKm && (
                <Text style={styles.coordsText}>{t('feedback_distance_label')}: {values.tripDistanceKm} km</Text>
              )}
              {!!values.estimatedFare && (
                <Text style={styles.coordsText}>{t('feedback_estimated_fare_label', 'Estimated fare')}: ₹{values.estimatedFare}</Text>
              )}
              {fields.filter(f => f.name === 'tripIssue').map(renderField)}
            </>
          )}
          <SectionTitle icon={'happy-outline'} text={t('feedback_good_things_title')} required />
          {fields.filter(f => f.name === 'goodThings').map(renderField)}

        
          <SectionTitle icon={'alert-circle-outline'} text={t('feedback_bad_things_title')} required />
          {fields.filter(f => f.name === 'badThings').map(renderField)}

        
          <SectionTitle icon={'trending-up-outline'} text={t('feedback_improvements_title')} required />
          {fields.filter(f => f.name === 'improvements').map(renderField)}

        
          {showGenericIssue && (
            <>
              <SectionTitle icon={'bug-outline'} text={t('feedback_issue_title')} required />
              {fields.filter(f => f.name === 'issueMessage').map(renderField)}
            </>
          )}

        
          <SectionTitle icon={'mail-outline'} text={t('feedback_email_title')} />
          <View style={styles.contactRow}>
            <TextInput
              value={values.contactEmail || ''}
              onChangeText={(t) => setValue('contactEmail', t)}
              placeholder={t('feedback_email_placeholder')}
              placeholderTextColor={'#9AA1A9'}
              style={[styles.input, styles.contactInput]}
              autoCapitalize={'none'}
              autoCorrect={false}
              keyboardType={'email-address'}
            />
          </View>
          <Text style={styles.hintText}>{t('feedback_email_hint')}</Text>
          <View style={styles.consentRow}>
            <Checkbox checked={!!values.consentEmail} onToggle={() => setValue('consentEmail', !values.consentEmail)} />
            <Text style={styles.consentText}>{t('feedback_consent_text')}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => sheetRef.current?.close()} style={[styles.btn, styles.btnGhost]} disabled={submitting}>
            <Text style={[styles.btnText, styles.btnGhostText]}>{t('cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSubmitPress} style={[styles.btn, styles.btnPrimary]} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t('submit')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetWrapper>
  );
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: 'white',
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
   
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  title: {
    fontFamily: Fonts.semi_bold,
    color: colors.black,
    fontSize: 20,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  subtitle: {
    marginBottom: 8,
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 14,
  },
  fieldsWrap: {
    gap:10,
    marginTop: 10,
    marginBottom: 10,
  
  },
  fieldBlock: {
    marginBottom: 5,
  },
  label: {

    marginBottom: 6,
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 14,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 0,
  },
  sectionText: {
    fontSize: 14,
                fontFamily: Fonts.semi_bold,
                color: colors.black,
 
  },
  required: {
    color: '#D00',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
   
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    backgroundColor:colors.grey_xlight,
    color: colors.black,
  },
  multiline: {
    minHeight: 44,
  },
  hintText: {
    marginTop: 6,
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  optionItemSelected: {
    borderColor: '#0A84FF',
    backgroundColor: '#E6F0FF',
  },
  optionText: {
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 14,
  },
  optionTextSelected: {
    color: colors.blue,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactInput: {
    flex: 1,
  },
  contactHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '90%',
    marginTop: 20,
  },
  linkText: {
    color: colors.blue,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  consentText: {
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 12,
  },
  coordsText: {
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 12,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 48,
  },
  btnText: {
    fontSize: 14,
    fontFamily: Fonts.semi_bold,
    color: colors.white,
    textAlign: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.black,
    borderRadius: 10,
    minWidth: 100,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
 
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF1F5',
  },
  btnGhost: {
   
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: colors.grey_xlight,
  },
  btnGhostText: {
    fontFamily: Fonts.regular,
    color: colors.black,
  
    fontSize: 14,
  },
  checkbox: {
    padding: 2,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxBoxChecked: {
    backgroundColor: colors.blue,
  },
});

export default FeedbackBottomSheet;


