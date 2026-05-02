/**
 * VehicleFormFields
 *
 * Renders the shared set of vehicle detail fields used by both ManualForm and
 * EditForm: vehicle type chips, make/model/year pickers, fuel type chips,
 * transmission chips, colour input, and additional info.
 *
 * Props:
 *   values      – { vehicleType, make, model, year, fuelType, transmission, features, additionalInfo }
 *   onChange    – (field, value) => void
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../../constants/constants';
import {
  VEHICLE_TYPE_OPTIONS as LOCAL_VEHICLE_TYPES,
  FUEL_TYPE_OPTIONS as LOCAL_FUEL_TYPES,
  TRANSMISSION_OPTIONS as LOCAL_TRANSMISSION,
  MAKES_IN_INDIA as LOCAL_MAKES,
  MODELS_BY_MAKE as LOCAL_MODELS,
  YEAR_OPTIONS,
  ADVANCED_FEATURES as LOCAL_FEATURES,
} from '../constants/vehicleData';
import SearchablePickerModal from './SearchablePickerModal';
import styles from '../styles/vehicleStyles';
import useOnboardingConfigStore from '../../../../common/store/useOnboardingConfigStore';
import useUserStore from '../../../../common/store/useUserStore';

const ChipRow = ({ options, selected, onSelect }) => (
  <View style={styles.typeChipsRow}>
    {options.map((opt) => (
      <TouchableOpacity
        key={opt.value}
        style={[styles.typeChip, selected === opt.value && styles.typeChipSelected]}
        onPress={() => onSelect(opt.value)}
        activeOpacity={0.7}
      >
        <Text style={[styles.typeChipText, selected === opt.value && styles.typeChipTextSelected]}>
          {opt.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// Multi-select chip row — `selected` is an array
const MultiChipRow = ({ options, selected = [], onToggle }) => (
  <View style={styles.typeChipsRow}>
    {options.map((opt) => {
      const isOn = selected.includes(opt.value);
      return (
        <TouchableOpacity
          key={opt.value}
          style={[styles.typeChip, isOn && styles.typeChipSelected]}
          onPress={() => onToggle(opt.value)}
          activeOpacity={0.7}
        >
          <Text style={[styles.typeChipText, isOn && styles.typeChipTextSelected]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const PickerTrigger = ({ value, placeholder, onPress }) => (
  <TouchableOpacity
    style={[styles.input, styles.pickerTrigger]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.pickerTriggerText, !value && styles.pickerTriggerPlaceholder]}>
      {value || placeholder}
    </Text>
    <Ionicons name="chevron-down-outline" size={18} color={colors.grey_dark} />
  </TouchableOpacity>
);

const VehicleFormFields = ({ values, onChange }) => {
  const { t } = useTranslation();
  const [makeVisible, setMakeVisible] = useState(false);
  const [modelVisible, setModelVisible] = useState(false);
  const [yearVisible, setYearVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [fuelTypeVisible, setFuelTypeVisible] = useState(false);
  const [transmissionVisible, setTransmissionVisible] = useState(false);
  const { config, fetchConfig } = useOnboardingConfigStore();
  const { userInfo, userRole } = useUserStore();

  useEffect(() => {
    fetchConfig(userInfo?.token, userRole);
  }, []);

  const VEHICLE_TYPE_OPTIONS = config?.VEHICLE_TYPE_OPTIONS ?? LOCAL_VEHICLE_TYPES;
  const FUEL_TYPE_OPTIONS = config?.FUEL_TYPE_OPTIONS ?? LOCAL_FUEL_TYPES;
  const TRANSMISSION_OPTIONS = config?.TRANSMISSION_OPTIONS ?? LOCAL_TRANSMISSION;
  const MAKES_IN_INDIA = config?.MAKES_IN_INDIA ?? LOCAL_MAKES;
  const MODELS_BY_MAKE = config?.MODELS_BY_MAKE ?? LOCAL_MODELS;
  const ADVANCED_FEATURES = config?.ADVANCED_FEATURES ?? LOCAL_FEATURES;

  const { vehicleType, make, model, year, fuelType, transmission, features, additionalInfo, maxSpeed } = values;

  const toggleFeature = (val) => {
    const current = Array.isArray(features) ? features : [];
    const updated = current.includes(val)
      ? current.filter((f) => f !== val)
      : [...current, val];
    onChange('features', updated);
  };

  const toggleTransmission = (val) => {
    const current = Array.isArray(transmission) ? transmission : [];
    const updated = current.includes(val)
      ? current.filter((t) => t !== val)
      : [...current, val];
    onChange('transmission', updated);
  };

  return (
    <>
      <Text style={styles.inputLabel}>{t('vehicle_type', 'Vehicle Type')} *</Text>
      <ChipRow
        options={VEHICLE_TYPE_OPTIONS}
        selected={vehicleType}
        onSelect={(v) => onChange('vehicleType', v)}
      />

      <Text style={styles.inputLabel}>{t('make', 'Make')}</Text>
      <PickerTrigger
        value={make}
        placeholder="Select make"
        onPress={() => setMakeVisible(true)}
      />

      <Text style={styles.inputLabel}>{t('model', 'Model')}</Text>
      <PickerTrigger
        value={model}
        placeholder="Select model"
        onPress={() => setModelVisible(true)}
      />

      <Text style={styles.inputLabel}>{t('year', 'Year')}</Text>
      <PickerTrigger
        value={year}
        placeholder="Select year"
        onPress={() => setYearVisible(true)}
      />

      <Text style={styles.inputLabel}>{t('max_speed', 'Max Speed (km/h)')}</Text>
      <TextInput
        style={[
          styles.input,
          maxSpeed && Number(maxSpeed) < 40 && { borderColor: '#E53935', borderWidth: 1.5 },
        ]}
        value={maxSpeed}
        onChangeText={(v) => onChange('maxSpeed', v.replace(/[^0-9]/g, ''))}
        placeholder="Min 40 km/h"
        placeholderTextColor={colors.grey_dark}
        keyboardType="numeric"
        maxLength={3}
      />
      {!!maxSpeed && Number(maxSpeed) < 40 && (
        <Text style={{ color: '#E53935', fontSize: 12, marginTop: -8, marginBottom: 8 }}>
          {t('max_speed_min_error', 'Minimum allowed max speed is 40 km/h')}
        </Text>
      )}

      <Text style={styles.inputLabel}>{t('fuel_type', 'Fuel Type')}</Text>
      <PickerTrigger
        value={fuelType || null}
        placeholder="Select fuel type"
        onPress={() => setFuelTypeVisible(true)}
      />

      <Text style={styles.inputLabel}>{t('transmission', 'Transmission')}</Text>
      <PickerTrigger
        value={
          Array.isArray(transmission) && transmission.length > 0
            ? transmission.join(', ')
            : null
        }
        placeholder="Select transmission"
        onPress={() => setTransmissionVisible(true)}
      />

      <Text style={styles.inputLabel}>{t('advanced_features', 'Advanced Features')}</Text>
      <PickerTrigger
        value={
          Array.isArray(features) && features.length > 0
            ? `${features.length} feature${features.length > 1 ? 's' : ''} selected`
            : null
        }
        placeholder="Select features"
        onPress={() => setFeaturesVisible(true)}
      />

      <Text style={styles.inputLabel}>{t('additional_info', 'Additional Info')}</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={additionalInfo}
        onChangeText={(v) => onChange('additionalInfo', v)}
        placeholder="Any other details about your vehicle"
        placeholderTextColor={colors.grey_dark}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <SearchablePickerModal
        visible={makeVisible}
        title="Select Make"
        items={MAKES_IN_INDIA}
        onSelect={(v) => { onChange('make', v); onChange('model', ''); }}
        onClose={() => setMakeVisible(false)}
      />
      <SearchablePickerModal
        visible={modelVisible}
        title="Select Model"
        items={MODELS_BY_MAKE[make] || ['Others']}
        onSelect={(v) => onChange('model', v)}
        onClose={() => setModelVisible(false)}
      />
      <SearchablePickerModal
        visible={yearVisible}
        title="Select Year"
        items={YEAR_OPTIONS}
        onSelect={(v) => onChange('year', v)}
        onClose={() => setYearVisible(false)}
      />

      {/* Single-select fuel type modal */}
      <Modal
        visible={fuelTypeVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFuelTypeVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{t('fuel_type', 'Fuel Type')}</Text>
              <TouchableOpacity
                onPress={() => setFuelTypeVisible(false)}
                activeOpacity={0.7}
                style={styles.pickerCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.black} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={FUEL_TYPE_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = fuelType === item.value;
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                      isSelected && { backgroundColor: '#F0EFFF', borderLeftWidth: 3, borderLeftColor: colors.black },
                    ]}
                    onPress={() => { onChange('fuelType', item.value); setFuelTypeVisible(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerItemText, isSelected && { fontWeight: '600', color: colors.black }]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.black} />
                    )}
                  </TouchableOpacity>
                );
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setFuelTypeVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>{t('confirm', 'Confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Multi-select transmission modal */}
      <Modal
        visible={transmissionVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTransmissionVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{t('transmission', 'Transmission')}</Text>
              <TouchableOpacity
                onPress={() => setTransmissionVisible(false)}
                activeOpacity={0.7}
                style={styles.pickerCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.black} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TRANSMISSION_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = Array.isArray(transmission) && transmission?.includes(item.value);
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                      isSelected && { backgroundColor: '#F0EFFF', borderLeftWidth: 3, borderLeftColor: colors.black },
                    ]}
                    onPress={() => toggleTransmission(item.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerItemText, isSelected && { fontWeight: '600', color: colors.black }]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.black} />
                    )}
                  </TouchableOpacity>
                );
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setTransmissionVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>{t('confirm', 'Confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Multi-select features modal */}
      <Modal
        visible={featuresVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFeaturesVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{t('advanced_features', 'Advanced Features')}</Text>
              <TouchableOpacity
                onPress={() => setFeaturesVisible(false)}
                activeOpacity={0.7}
                style={styles.pickerCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.black} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ADVANCED_FEATURES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = Array.isArray(features) && features.includes(item.value);
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                      isSelected && { backgroundColor: '#F0EFFF', borderLeftWidth: 3, borderLeftColor: colors.black },
                    ]}
                    onPress={() => toggleFeature(item.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerItemText, isSelected && { fontWeight: '600', color: colors.black }]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.black} />
                    )}
                  </TouchableOpacity>
                );
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setFeaturesVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>{t('confirm', 'Confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default VehicleFormFields;
