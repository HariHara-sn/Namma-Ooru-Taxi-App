import React, {useState, useCallback, useEffect} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';

import {useStackScreenStore} from '../../common/store/useStackScreenStore';
import useUserStore from '../../common/store/useUserStore';
import usePublicDriverStore from '../../notdriver/store/usePublicDriverStore';
import {Colors, Fonts} from '../../common/constants/constants';
import {showNotification} from '../../common/components/Alerts/showNotification';
import NavBar from '../../notCustomer/components/NavBar';
import UseBackButton from '../../common/hooks/UseBackButton';
import APIRequest from '../../common/APIRequest';
import useOnboardingConfigStore from '../../common/store/useOnboardingConfigStore';

const FALLBACK_VEHICLE_TYPES = [
  {label: 'Hatchback', value: 'hatchback'},
  {label: 'Sedan', value: 'sedan'},
  {label: 'SUV', value: 'suv'},
  {label: 'MUV', value: 'muv'},
  {label: 'Luxury', value: 'luxury'},
  {label: 'Auto', value: 'auto'},
  {label: 'Tempo', value: 'tempo'},
];

const FALLBACK_TRANSMISSION_TYPES = [
  {label: 'Manual', value: 'manual'},
  {label: 'Automatic', value: 'automatic'},
  {label: 'AMT', value: 'amt'},
  {label: 'CVT', value: 'cvt'},
  {label: 'DCT', value: 'dct'},
  {label: 'IMT', value: 'imt'},
  {label: 'Both (M & A)', value: 'both'},
];

const FALLBACK_FUEL_TYPES = [
  {label: 'Petrol', value: 'petrol'},
  {label: 'Diesel', value: 'diesel'},
  {label: 'CNG', value: 'cng'},
  {label: 'EV', value: 'ev'},
  {label: 'Hybrid', value: 'hybrid'},
];

const VehicleHandlingScreen = () => {
  const {t} = useTranslation();
  const {goBack} = useStackScreenStore();
  const {userInfo, userRole} = useUserStore();
  const {driverInfo, setDriverInfo} = usePublicDriverStore();
  const {config, fetchConfig} = useOnboardingConfigStore();

  useEffect(() => {
    fetchConfig(userInfo?.token, userRole);
  }, []);

  const VEHICLE_TYPES = config?.VEHICLE_TYPE_OPTIONS ?? FALLBACK_VEHICLE_TYPES;
  const TRANSMISSION_TYPES = config?.TRANSMISSION_OPTIONS ?? FALLBACK_TRANSMISSION_TYPES;
  const FUEL_TYPES = config?.FUEL_TYPE_OPTIONS ?? FALLBACK_FUEL_TYPES;

  const existing = driverInfo?.vehicleHandling || {};

  const [vehicleTypes, setVehicleTypes] = useState(existing.vehicleTypes || []);
  const [transmission, setTransmission] = useState(
    Array.isArray(existing.transmission)
      ? existing.transmission
      : existing.transmission ? [existing.transmission] : []
  );
  const [fuelTypes, setFuelTypes] = useState(existing.fuelTypes || []);
  const [nightDriving, setNightDriving] = useState(existing.nightDriving ?? false);
  const [longDistance, setLongDistance] = useState(existing.longDistance ?? false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleItem = useCallback((list, setList, value) => {
    setList(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value],
    );
  }, []);

  const onSave = async () => {
    if (vehicleTypes.length === 0) {
      showNotification(
        t('select_vehicle_type', {defaultValue: 'Please select at least one vehicle type'}),
        '',
        'danger',
      );
      return;
    }
    if (transmission.length === 0) {
      showNotification(
        t('select_transmission', {defaultValue: 'Please select transmission type'}),
        '',
        'danger',
      );
      return;
    }

    const payload = {
      vehicleHandling: {
        vehicleTypes,
        transmission,
        fuelTypes,
        nightDriving,
        longDistance,
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
        setDriverInfo({...driverInfo, vehicleHandling: payload.vehicleHandling});
showNotification(
  t('vehicle_handling_saved', {defaultValue: 'Vehicle handling experience saved'}),
  '',
  'success',
);
        goBack();
      } else {
        showNotification(response?.message || 'Error', '', 'danger');
      }
    } catch (error) {
      console.error('Error saving vehicle handling:', error);
      showNotification('Something went wrong', '', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMultiChips = (options, selected, onToggle) => (
    <View style={styles.chipRow}>
      {options.map(opt => {
        const isSelected = selected.includes(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, isSelected && styles.chipSelected]}
            activeOpacity={0.7}
            onPress={() => onToggle(opt.value)}>
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSingleChips = (options, selected, onSelect) => (
    <View style={styles.chipRow}>
      {options.map(opt => {
        const isSelected = selected === opt.value;
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

  const renderToggle = (label, value, setValue) => (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={setValue}
        trackColor={{false: '#E0E0E0', true: '#C8B8FF'}}
        thumbColor={value ? Colors.periwinkle : '#BDBDBD'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <NavBar
        title={t('vehicle_handling', {defaultValue: 'Vehicle Handling'})}
        onBackPress={() => goBack()}
      />
      <UseBackButton onBackPress={() => goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Vehicle Types Driven */}
        <Text style={styles.sectionTitle}>
          {t('vehicle_types_driven', {defaultValue: 'Vehicle Types Driven'})}
          <Text style={styles.required}> *</Text>
        </Text>
        <Text style={styles.hint}>
          {t('select_all_that_apply', {defaultValue: 'Select all that apply'})}
        </Text>
        {renderMultiChips(VEHICLE_TYPES, vehicleTypes, (val) => toggleItem(vehicleTypes, setVehicleTypes, val))}

        {/* Transmission Type */}
        <Text style={styles.sectionTitle}>
          {t('transmission_type', {defaultValue: 'Transmission Type'})}
          <Text style={styles.required}> *</Text>
        </Text>
        <Text style={styles.hint}>
          {t('select_all_that_apply', {defaultValue: 'Select all that apply'})}
        </Text>
        {renderMultiChips(TRANSMISSION_TYPES, transmission, (val) => toggleItem(transmission, setTransmission, val))}

        {/* Fuel Types Handled */}
        <Text style={styles.sectionTitle}>
          {t('fuel_types_handled', {defaultValue: 'Fuel Types Handled'})}
        </Text>
        {renderMultiChips(FUEL_TYPES, fuelTypes, (val) => toggleItem(fuelTypes, setFuelTypes, val))}

        {/* Toggle Switches */}
        <View style={styles.toggleSection}>
          {renderToggle(
            t('night_driving_experience', {defaultValue: 'Night Driving Experience'}),
            nightDriving,
            setNightDriving,
          )}
          {renderToggle(
            t('long_distance_experience', {defaultValue: 'Long-distance Trip Experience'}),
            longDistance,
            setLongDistance,
          )}
        </View>
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

export default VehicleHandlingScreen;

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
    marginBottom: 6,
  },
  required: {
    color: Colors.danger_red,
  },
  hint: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.warm_grey,
    marginBottom: 10,
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
  toggleSection: {
    marginTop: 24,
    gap: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.black,
    flex: 1,
    marginRight: 12,
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
