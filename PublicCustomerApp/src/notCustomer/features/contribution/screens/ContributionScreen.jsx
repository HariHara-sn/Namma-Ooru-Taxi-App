import React, { use, useCallback, useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useContributionStore from '../store/useContributionStore';
import { useTranslation } from 'react-i18next';
import { showNotification } from '../../../components/NotificationManger';
import { colors, Fonts } from '../../../constants/constants';
import locationTask from '../../../controllers/GetCurrentLocation';
import NavBar from '../../../components/NavBar';
import { useStackScreenStore } from '../../../store/useStackScreenStore';

const ContributionScreen = () => {
  const { t } = useTranslation();
  const { setStackScreen ,goBack} = useStackScreenStore();
  const {
    lat, lon, placeName, address, category, categories, customCategory,
    setLocation, setPlaceName, setAddress, setCategory, setCustomCategory,
    submitContribution, reset, submitting
  } = useContributionStore();
  const [item,setItem] = useState(null);

  const [locLoading, setLocLoading] = useState(false);

  const onPickLocationResultCallback =(item)=> {
    if (item?.latitude && item?.longitude){
      setLocation({ lat: item.latitude, lon: item.longitude  });
      setItem(item);
    }
    goBack();
  }
 

  const pickupLocation = ()=>{
    setStackScreen('PickLocationScreen', {
    onPickLocationResultCallback:onPickLocationResultCallback,
      buttonLabel:t('button_locate_pickup_location'),
      isFromContribution:true,
      searchBar:true,
      focusSearchOnMount:true,
    });
  }

  const onSubmit = async () => {
    const resp = await submitContribution();
    if (resp.success) {
      showNotification(t('success'), t('thank_you_for_contribution', 'Thank you for your contribution!'), 'success');
      reset();
    } else {
      showNotification(t('error'), resp.message || t('something_went_wrong'), 'error');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavBar withBg onBackPress={() => setStackScreen('Home', {})} title={t('contribution', 'Contribution')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        <View style={styles.section}>
          <AdaptiveText style={styles.label}>{t('location', 'Location')}</AdaptiveText>
          <View style={styles.locationRow}>
            <TouchableOpacity
              style={[
                styles.locBtn,
                lat != null && lon != null && styles.locBtnSelected
              ]}
              onPress={pickupLocation}
              disabled={locLoading}
            >
              <Ionicons name="locate" size={20} color={lat != null ? colors.grey_dark : colors.black} />
              <AdaptiveText style={[styles.locBtnText, lat != null && lon != null && styles.locBtnTextSelected]}>
                {locLoading
                  ? t('loading', 'Loading...')
                  : (lat != null && lon != null
                      ? t('change_location', 'Change Location')
                      : t('pick_location', 'Pick Location'))}
              </AdaptiveText>
            </TouchableOpacity>
          </View>
          {lat != null && lon != null && (
            <View style={styles.coordsWrapper}>
              <Ionicons name="checkmark-circle" size={18} color={colors.grey_dark} />
              <AdaptiveText style={styles.coordsText}>{lat.toFixed(6)}, {lon.toFixed(6)}</AdaptiveText>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <AdaptiveText style={styles.label}>{t('place_name', 'Place Name')}</AdaptiveText>
          <TextInput
            style={styles.input}
            placeholder={t('enter_place_name', 'Enter place name')}
            value={placeName}
            onChangeText={setPlaceName}
          />
        </View>

        <View style={styles.section}>
          <AdaptiveText style={styles.label}>{t('address', 'Address')}</AdaptiveText>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder={t('enter_address', 'Enter address')}
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        <View style={styles.section}>
          <AdaptiveText style={styles.label}>{t('category', 'Category')}</AdaptiveText>
          <View style={styles.categoryList}>
            {categories.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.categoryRow, category === c.id && styles.categoryRowActive]}
                onPress={() => setCategory(c.id)}
              >
                <Ionicons name={category === c.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={category === c.id ? colors.grey_dark : '#666'} />
                <AdaptiveText style={[styles.categoryText, category === c.id && styles.categoryTextActive]}>{c.label}</AdaptiveText>
              </TouchableOpacity>
            ))}
          </View>
          {category === 'other' && (
            <View style={styles.customCategoryWrapper}>
              <AdaptiveText style={styles.label}>{t('custom_category', 'Custom Category')}</AdaptiveText>
              <TextInput
                style={styles.input}
                placeholder={t('enter_custom_category', 'Enter category')}
                value={customCategory}
                onChangeText={setCustomCategory}
              />
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.submitWrapper} onPress={onSubmit} disabled={submitting}>
          <LinearGradient colors={[colors.grey_dark, '#303030']} style={styles.submitBtn} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }}>
            <Ionicons name="send" size={18} color={colors.white || 'white'} />
            <AdaptiveText style={styles.submitText}>{submitting ? t('submitting', 'Submitting...') : t('submit', 'Submit')}</AdaptiveText>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff'
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // title removed in favor of NavBar
  section: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: 8,
    color: '#333'
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f2f2f2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30
  },
  locBtnSelected: {
    backgroundColor: '#e0e0e0'
  },
  locBtnText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: colors.black
  },
  locBtnTextSelected: {
    fontFamily: Fonts.semi_bold
  },
  coords: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#555'
  },
  coordsWrapper: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eef3f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  coordsText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: colors.black
  },
  input: {
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'black'
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top'
  },
  categoryList: {
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden'
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    gap: 12
  },
  categoryRowActive: {
    backgroundColor: '#e9e9e9'
  },
  categoryText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#333'
  },
  categoryTextActive: {
    color: colors.black
  },
  customCategoryWrapper: {
    marginTop: 14
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e2e2',
    backgroundColor: '#fff'
  },
  submitWrapper: {
    width: '100%'
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16
  },
  submitText: {
    fontSize: 15,
    fontFamily: Fonts.semi_bold,
    color: 'white'
  }
});

export default ContributionScreen;
