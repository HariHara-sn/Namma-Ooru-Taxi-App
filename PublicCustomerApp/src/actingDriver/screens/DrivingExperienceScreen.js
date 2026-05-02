import React, {useState, useCallback} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {useStackScreenStore} from '../../common/store/useStackScreenStore';
import useUserStore from '../../common/store/useUserStore';
import usePublicDriverStore from '../../notdriver/store/usePublicDriverStore';
import {Colors, Fonts} from '../../common/constants/constants';
import {showNotification} from '../../common/components/Alerts/showNotification';
import NavBar from '../../notCustomer/components/NavBar';
import UseBackButton from '../../common/hooks/UseBackButton';
import APIRequest from '../../common/APIRequest';

const EXPERIENCE_RANGES = [
  {label: '0–1 yr', value: '0-1'},
  {label: '1–3 yrs', value: '1-3'},
  {label: '3–5 yrs', value: '3-5'},
  {label: '5–10 yrs', value: '5-10'},
  {label: '10+ yrs', value: '10+'},
];

const COMMERCIAL_OPTIONS = [
  {label: 'None', value: 'none'},
  {label: '< 1 year', value: '<1'},
  {label: '1–3 years', value: '1-3'},
  {label: '3–5 years', value: '3-5'},
  {label: '5+ years', value: '5+'},
];

const PLATFORMS = [
  {label: 'Uber', value: 'uber'},
  {label: 'Ola', value: 'ola'},
  {label: 'Rapido', value: 'rapido'},
  {label: 'Local Taxi', value: 'local_taxi'},
  {label: 'Private Hire', value: 'private_hire'},
  {label: 'Other', value: 'other'},
];

const TRIP_RANGES = [
  {label: '0–100', value: '0-100'},
  {label: '100–500', value: '100-500'},
  {label: '500–1000', value: '500-1000'},
  {label: '1000–5000', value: '1000-5000'},
  {label: '5000+', value: '5000+'},
];

const RATING_OPTIONS = [
  {label: '⭐ 3.0–3.5', value: '3.0-3.5'},
  {label: '⭐ 3.5–4.0', value: '3.5-4.0'},
  {label: '⭐ 4.0–4.5', value: '4.0-4.5'},
  {label: '⭐ 4.5–5.0', value: '4.5-5.0'},
  {label: 'N/A', value: 'na'},
];

const DrivingExperienceScreen = () => {
  const {t} = useTranslation();
  const {goBack} = useStackScreenStore();
  const {userInfo} = useUserStore();
  const {driverInfo, setDriverInfo} = usePublicDriverStore();

  const existing = driverInfo?.drivingExperience || {};

  const [totalExp, setTotalExp] = useState(existing.totalExperience || '');
  const [commercialExp, setCommercialExp] = useState(existing.commercialExperience || '');
  const [platformExp, setPlatformExp] = useState(existing.hasPlatformExperience ?? null);
  const [platforms, setPlatforms] = useState(existing.platforms || []);
  const [approxTrips, setApproxTrips] = useState(existing.approxTrips || '');
  const [driverRating, setDriverRating] = useState(existing.driverRating || '');
  const [isLoading, setIsLoading] = useState(false);

  const togglePlatform = useCallback((value) => {
    setPlatforms(prev =>
      prev.includes(value)
        ? prev.filter(p => p !== value)
        : [...prev, value],
    );
  }, []);

  const onSave = async () => {
    if (!totalExp) {
      showNotification(
        t('select_total_experience', {defaultValue: 'Please select your total driving experience'}),
        '',
        'danger',
      );
      return;
    }

    const payload = {
      drivingExperience: {
        totalExperience: totalExp,
        commercialExperience: commercialExp,
        hasPlatformExperience: platformExp,
        platforms: platformExp ? platforms : [],
        approxTrips: platformExp ? approxTrips : '',
        driverRating: platformExp ? driverRating : '',
      },
    };

    setIsLoading(true);
    try {
      const api = new APIRequest();
      const response = await api.request(
        '/publicrides/actingDriver/v2/updateDrivingExperience',
        'POST',
        payload,
        userInfo?.token,
      );
      if (response.success) {
        setDriverInfo({...driverInfo, drivingExperience: payload.drivingExperience});
        showNotification(
          t('experience_saved', {defaultValue: 'Driving experience saved'}),
          '',
          'success',
        );
        goBack();
      } else {
        showNotification(response?.message || 'Error', '', 'danger');
      }
    } catch (error) {
      console.error('Error saving driving experience:', error);
      showNotification('Something went wrong', '', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const renderChipGroup = (options, selected, onSelect, multi = false) => (
    <View style={styles.chipRow}>
      {options.map(opt => {
        const isSelected = multi
          ? selected.includes(opt.value)
          : selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, isSelected && styles.chipSelected]}
            activeOpacity={0.7}
            onPress={() => onSelect(opt.value)}>
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSelectableCards = (options, selected, onSelect) => (
    <View style={styles.cardRow}>
      {options.map(opt => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.selectableCard, isSelected && styles.selectableCardSelected]}
            activeOpacity={0.7}
            onPress={() => onSelect(opt.value)}>
            <Text style={[styles.selectableCardText, isSelected && styles.selectableCardTextSelected]}>
              {opt.label}
            </Text>
            {isSelected && (
              <MaterialIcons name="check-circle" size={18} color={Colors.periwinkle} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <NavBar
        title={t('driving_experience', {defaultValue: 'Driving Experience'})}
        onBackPress={() => goBack()}
      />
      <UseBackButton onBackPress={() => goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Total Driving Experience */}
        <Text style={styles.sectionTitle}>
          {t('total_driving_experience', {defaultValue: 'Total Driving Experience'})}
          <Text style={styles.required}> *</Text>
        </Text>
        {renderChipGroup(EXPERIENCE_RANGES, totalExp, setTotalExp)}

        {/* Commercial Driving Experience */}
        <Text style={styles.sectionTitle}>
          {t('commercial_driving_experience', {defaultValue: 'Commercial Driving Experience'})}
        </Text>
        {renderSelectableCards(COMMERCIAL_OPTIONS, commercialExp, setCommercialExp)}

        {/* Ride-hailing Platform Experience */}
        <Text style={styles.sectionTitle}>
          {t('ride_hailing_experience', {defaultValue: 'Ride-hailing Platform Experience'})}
        </Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, platformExp === true && styles.toggleBtnActive]}
            onPress={() => setPlatformExp(true)}>
            <Text style={[styles.toggleText, platformExp === true && styles.toggleTextActive]}>
              {t('yes', {defaultValue: 'Yes'})}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, platformExp === false && styles.toggleBtnActive]}
            onPress={() => setPlatformExp(false)}>
            <Text style={[styles.toggleText, platformExp === false && styles.toggleTextActive]}>
              {t('no', {defaultValue: 'No'})}
            </Text>
          </TouchableOpacity>
        </View>

        {platformExp && (
          <>
            {/* Platforms Worked With */}
            <Text style={styles.sectionTitle}>
              {t('platforms_worked_with', {defaultValue: 'Platforms Worked With'})}
            </Text>
            {renderChipGroup(PLATFORMS, platforms, togglePlatform, true)}

            {/* Approx Completed Trips */}
            <Text style={styles.sectionTitle}>
              {t('approx_completed_trips', {defaultValue: 'Approx Completed Trips'})}
            </Text>
            {renderChipGroup(TRIP_RANGES, approxTrips, setApproxTrips)}

            {/* Driver Rating */}
            <Text style={styles.sectionTitle}>
              {t('driver_rating_range', {defaultValue: 'Driver Rating'})}
            </Text>
            {renderChipGroup(RATING_OPTIONS, driverRating, setDriverRating)}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.8}
          onPress={onSave}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>
              {t('next', {defaultValue: 'Next'})}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DrivingExperienceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.black,
    marginTop: 20,
    marginBottom: 10,
  },
  required: {
    color: Colors.danger_red,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  chipSelected: {
    borderColor: Colors.periwinkle,
    backgroundColor: '#F0EBFF',
  },
  chipText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.warm_grey,
  },
  chipTextSelected: {
    color: Colors.periwinkle,
    fontFamily: Fonts.medium,
  },
  cardRow: {
    gap: 10,
  },
  selectableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  selectableCardSelected: {
    borderColor: Colors.periwinkle,
    backgroundColor: '#F0EBFF',
  },
  selectableCardText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.black,
  },
  selectableCardTextSelected: {
    color: Colors.periwinkle,
    fontFamily: Fonts.medium,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  toggleBtnActive: {
    borderColor: Colors.periwinkle,
    backgroundColor: '#F0EBFF',
  },
  toggleText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.warm_grey,
  },
  toggleTextActive: {
    color: Colors.periwinkle,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveBtn: {
    backgroundColor: Colors.periwinkle,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.semi_bold,
  },
});
