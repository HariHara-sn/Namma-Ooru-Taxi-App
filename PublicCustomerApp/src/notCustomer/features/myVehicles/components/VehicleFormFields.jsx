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
import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useOnboardingConfigStore from '../../../../common/store/useOnboardingConfigStore';
import useUserStore from '../../../../common/store/useUserStore';
import {colors} from '../../../constants/constants';
import {
  ADVANCED_FEATURES as LOCAL_FEATURES,
  AUTOMATIC_SUBTYPES as LOCAL_AUTOMATIC_SUBTYPES,
  FUEL_TYPE_OPTIONS as LOCAL_FUEL_TYPES,
  MAKES_IN_INDIA as LOCAL_MAKES,
  MODELS_BY_MAKE as LOCAL_MODELS,
  TRANSMISSION_TYPES as LOCAL_TRANSMISSION_TYPES,
  VEHICLE_TYPE_OPTIONS as LOCAL_VEHICLE_TYPES,
  YEAR_OPTIONS,
} from '../constants/vehicleData';
import styles from '../styles/vehicleStyles';
import SearchablePickerModal from './SearchablePickerModal';

const ChipRow = ({options, selected, onSelect}) => (
  <View style={styles.typeChipsRow}>
    {options.map(opt => (
      <TouchableOpacity
        key={opt.value}
        style={[
          styles.typeChip,
          selected === opt.value && styles.typeChipSelected,
        ]}
        onPress={() => onSelect(opt.value)}
        activeOpacity={0.7}>
        <Text
          style={[
            styles.typeChipText,
            selected === opt.value && styles.typeChipTextSelected,
          ]}>
          {opt.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// Multi-select chip row — `selected` is an array
const MultiChipRow = ({options, selected = [], onToggle}) => (
  <View style={styles.typeChipsRow}>
    {options.map(opt => {
      const isOn = selected.includes(opt.value);
      return (
        <TouchableOpacity
          key={opt.value}
          style={[styles.typeChip, isOn && styles.typeChipSelected]}
          onPress={() => onToggle(opt.value)}
          activeOpacity={0.7}>
          <Text
            style={[styles.typeChipText, isOn && styles.typeChipTextSelected]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const PickerTrigger = ({value, placeholder, onPress}) => (
  <TouchableOpacity
    style={[styles.input, styles.pickerTrigger]}
    onPress={onPress}
    activeOpacity={0.7}>
    <Text
      style={[
        styles.pickerTriggerText,
        !value && styles.pickerTriggerPlaceholder,
      ]}>
      {value || placeholder}
    </Text>
    <Ionicons name="chevron-down-outline" size={18} color={colors.grey_dark} />
  </TouchableOpacity>
);

const getOptionLabel = (options, value) =>
  options.find(option => option.value === value)?.label || value;

const getTransmissionTypes = options =>
  options.filter(option => ['manual', 'automatic'].includes(option.value));

const VehicleFormFields = ({values, onChange}) => {
  const {t} = useTranslation();
  const [makeVisible, setMakeVisible] = useState(false);
  const [modelVisible, setModelVisible] = useState(false);
  const [yearVisible, setYearVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [fuelTypeVisible, setFuelTypeVisible] = useState(false);
  const [transmissionVisible, setTransmissionVisible] = useState(false);
  const [customFeature, setCustomFeature] = useState('');
  const {config, fetchConfig} = useOnboardingConfigStore();
  const {userInfo, userRole} = useUserStore();

  useEffect(() => {
    fetchConfig(userInfo?.token, userRole);
  }, []);

  const VEHICLE_TYPE_OPTIONS =
    config?.VEHICLE_TYPE_OPTIONS ?? LOCAL_VEHICLE_TYPES;
  const FUEL_TYPE_OPTIONS = config?.FUEL_TYPE_OPTIONS ?? LOCAL_FUEL_TYPES;
  const TRANSMISSION_TYPES = getTransmissionTypes(
    config?.TRANSMISSION_TYPES ??
      config?.TRANSMISSION_OPTIONS ??
      LOCAL_TRANSMISSION_TYPES,
  );
  const AUTOMATIC_SUBTYPES =
    config?.AUTOMATIC_SUBTYPES ?? LOCAL_AUTOMATIC_SUBTYPES;
  const MAKES_IN_INDIA = config?.MAKES_IN_INDIA ?? LOCAL_MAKES;
  const MODELS_BY_MAKE = config?.MODELS_BY_MAKE ?? LOCAL_MODELS;
  const ADVANCED_FEATURES = config?.ADVANCED_FEATURES ?? LOCAL_FEATURES;

  const {
    vehicleType,
    make,
    model,
    year,
    fuelType,
    transmission,
    features,
    additionalInfo,
    maxSpeed,
  } = values;

  const [tempTransmission, setTempTransmission] = useState([]);
  const [tempFeatures, setTempFeatures] = useState([]);

  const toggleTempFeature = val => {
    setTempFeatures(prev =>
      prev.includes(val) ? prev.filter(f => f !== val) : [...prev, val],
    );
  };

  const selectTransmissionType = val => {
    setTempTransmission(val === 'automatic' ? ['automatic'] : [val]);
  };

  const selectAutomaticSubtype = val => {
    setTempTransmission(['automatic', val]);
  };

  const addCustomTempOption = (value, reset, setTempItems) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    setTempItems(prev => {
      const alreadyAdded = prev.some(
        item => item.toLowerCase() === trimmed.toLowerCase(),
      );
      if (!alreadyAdded) {
        return [...prev, trimmed];
      }
      return prev;
    });
    reset('');
  };

  const featureModalOptions = [
    ...ADVANCED_FEATURES,
    ...(Array.isArray(tempFeatures) ? tempFeatures : [])
      .filter(item => !ADVANCED_FEATURES.some(opt => opt.value === item))
      .map(item => ({label: item, value: item})),
  ];

  return (
    <>
      <Text style={styles.inputLabel}>
        {t('vehicle_type', 'Vehicle Type')} *
      </Text>
      <ChipRow
        options={VEHICLE_TYPE_OPTIONS}
        selected={vehicleType}
        onSelect={v => onChange('vehicleType', v)}
      />

      {!!vehicleType && (
        <>
          <Text style={styles.inputLabel}>{t('make', 'Make')} *</Text>
          <PickerTrigger
            value={make}
            placeholder="Select make"
            onPress={() => setMakeVisible(true)}
          />
        </>
      )}

      {!!make && (
        <>
          <Text style={styles.inputLabel}>{t('model', 'Model')} *</Text>
          <PickerTrigger
            value={model}
            placeholder="Select model"
            onPress={() => setModelVisible(true)}
          />
        </>
      )}

      <Text style={styles.inputLabel}>{t('year', 'Year')} *</Text>
      <PickerTrigger
        value={year}
        placeholder="Select year"
        onPress={() => setYearVisible(true)}
      />

      <Text style={styles.inputLabel}>
        {t('speedLimit', 'Speed Limit (km/h)')} *
      </Text>
      <TextInput
        style={[
          styles.input,
          maxSpeed &&
            Number(maxSpeed) < 40 && {
              borderColor: '#E53935',
              borderWidth: 1.5,
            },
        ]}
        value={maxSpeed}
        onChangeText={v => onChange('maxSpeed', v.replace(/[^0-9]/g, ''))}
        placeholder="Min 40 km/h"
        placeholderTextColor={colors.grey_dark}
        keyboardType="numeric"
        maxLength={3}
      />
      {!!maxSpeed && Number(maxSpeed) < 40 && (
        <Text
          style={{
            color: '#E53935',
            fontSize: 12,
            marginTop: -8,
            marginBottom: 8,
          }}>
          {t(
            'speed_limit_min_error',
            'The speed limit cannot be lower than 40 km/h',
          )}
        </Text>
      )}

      {/* <Text style={styles.inputLabel}>{t('fuel_type', 'Fuel Type')}</Text>
      <PickerTrigger
        value={fuelType || null}
        placeholder="Select fuel type"
        onPress={() => setFuelTypeVisible(true)}
      /> */}

      <Text style={styles.inputLabel}>
        {t('transmission', 'Transmission (Vehicle Specification)')} *
      </Text>
      <PickerTrigger
        value={
          Array.isArray(transmission) && transmission.length > 0
            ? transmission
                .map(value =>
                  getOptionLabel(
                    [...TRANSMISSION_TYPES, ...AUTOMATIC_SUBTYPES],
                    value,
                  ),
                )
                .join(', ')
            : null
        }
        placeholder="Select transmission"
        onPress={() => {
          setTempTransmission(Array.isArray(transmission) ? transmission : []);
          setTransmissionVisible(true);
        }}
      />

      <Text style={styles.inputLabel}>
        {t('advanced_features', 'Advanced Features')} *
      </Text>
      <PickerTrigger
        value={
          Array.isArray(features) && features.length > 0
            ? `${features.length} feature${
                features.length > 1 ? 's' : ''
              } selected`
            : null
        }
        placeholder="Select features"
        onPress={() => {
          setTempFeatures(Array.isArray(features) ? features : []);
          setFeaturesVisible(true);
        }}
      />

      <Text style={styles.inputLabel}>
        {t('additional_info', 'Additional Info')}
      </Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={additionalInfo}
        onChangeText={v => onChange('additionalInfo', v)}
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
        onSelect={v => {
          onChange('make', v);
          onChange('model', '');
        }}
        onClose={() => setMakeVisible(false)}
      />
      <SearchablePickerModal
        visible={modelVisible}
        title="Select Model"
        items={MODELS_BY_MAKE[make] || ['Others']}
        onSelect={v => onChange('model', v)}
        onClose={() => setModelVisible(false)}
      />
      <SearchablePickerModal
        visible={yearVisible}
        title="Select Year"
        items={YEAR_OPTIONS}
        onSelect={v => onChange('year', v)}
        onClose={() => setYearVisible(false)}
      />

      {/* Single-select fuel type modal */}
      {/* <Modal
        visible={fuelTypeVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFuelTypeVisible(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                {t('fuel_type', 'Fuel Type')}
              </Text>
              <TouchableOpacity
                onPress={() => setFuelTypeVisible(false)}
                activeOpacity={0.7}
                style={styles.pickerCloseBtn}>
                <Ionicons name="close" size={22} color={colors.black} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={FUEL_TYPE_OPTIONS}
              keyExtractor={item => item.value}
              renderItem={({item}) => {
                const isSelected = fuelType === item.value;
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      },
                      isSelected && {
                        backgroundColor: '#F0EFFF',
                        borderLeftWidth: 3,
                        borderLeftColor: colors.black,
                      },
                    ]}
                    onPress={() => {
                      onChange('fuelType', item.value);
                      setFuelTypeVisible(false);
                    }}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && {fontWeight: '600', color: colors.black},
                      ]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.black}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 8}}
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setFuelTypeVisible(false)}
              activeOpacity={0.8}>
              <Text style={styles.addBtnText}>{t('confirm', 'Confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}

      {/* Transmission modal */}
      <Modal
        visible={transmissionVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTransmissionVisible(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                {t('transmission', 'Transmission')}
              </Text>
              <TouchableOpacity
                onPress={() => setTransmissionVisible(false)}
                activeOpacity={0.7}
                style={styles.pickerCloseBtn}>
                <Ionicons name="close" size={22} color={colors.black} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TRANSMISSION_TYPES}
              keyExtractor={item => item.value}
              renderItem={({item}) => {
                const isSelected =
                  Array.isArray(tempTransmission) &&
                  tempTransmission?.[0] === item.value;
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      },
                      isSelected && {
                        backgroundColor: '#F0EFFF',
                        borderLeftWidth: 3,
                        borderLeftColor: colors.black,
                      },
                    ]}
                    onPress={() => selectTransmissionType(item.value)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && {fontWeight: '600', color: colors.black},
                      ]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.black}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                tempTransmission?.[0] === 'automatic' ? (
                  <View>
                    <Text style={[styles.inputLabel, {marginTop: 8}]}>
                      {t('automatic_type', 'Automatic Type')}
                    </Text>
                    {AUTOMATIC_SUBTYPES.map(item => {
                      const isSelected = tempTransmission?.[1] === item.value;
                      return (
                        <TouchableOpacity
                          key={item.value}
                          style={[
                            styles.pickerItem,
                            {
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginLeft: 20,
                            },
                            isSelected && {
                              backgroundColor: '#F0EFFF',
                              borderLeftWidth: 3,
                              borderLeftColor: colors.black,
                            },
                          ]}
                          onPress={() => selectAutomaticSubtype(item.value)}
                          activeOpacity={0.7}>
                          <Text
                            style={[
                              styles.pickerItemText,
                              isSelected && {
                                fontWeight: '600',
                                color: colors.black,
                              },
                            ]}>
                            {item.label}
                          </Text>
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={colors.black}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 8}}
            />
            <TouchableOpacity
              style={[styles.addBtn, styles.pickerConfirmBtn]}
              onPress={() => {
                if (
                  tempTransmission?.[0] === 'automatic' &&
                  !tempTransmission?.[1]
                ) {
                  Alert.alert(
                    t('error'),
                    t(
                      'automatic_type_required',
                      'Please select an automatic type',
                    ),
                  );
                  return;
                }
                onChange('transmission', tempTransmission);
                setTransmissionVisible(false);
              }}
              activeOpacity={0.8}>
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
        onRequestClose={() => setFeaturesVisible(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                {t('advanced_features', 'Advanced Features')}
              </Text>
              <TouchableOpacity
                onPress={() => setFeaturesVisible(false)}
                activeOpacity={0.7}
                style={styles.pickerCloseBtn}>
                <Ionicons name="close" size={22} color={colors.black} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={featureModalOptions}
              keyExtractor={item => item.value}
              renderItem={({item}) => {
                const isSelected =
                  Array.isArray(tempFeatures) &&
                  tempFeatures.includes(item.value);
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      },
                      isSelected && {
                        backgroundColor: '#F0EFFF',
                        borderLeftWidth: 3,
                        borderLeftColor: colors.black,
                      },
                    ]}
                    onPress={() => toggleTempFeature(item.value)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && {fontWeight: '600', color: colors.black},
                      ]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.black}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 8}}
            />
            <View style={styles.customFieldContainer}>
              <TextInput
                style={[styles.input, styles.customFieldInput]}
                value={customFeature}
                onChangeText={setCustomFeature}
                placeholder={t(
                  'custom_feature_placeholder',
                  'Add custom feature',
                )}
                placeholderTextColor={colors.grey_dark}
              />
              <TouchableOpacity
                style={styles.addCustomFieldBtn}
                onPress={() =>
                  addCustomTempOption(
                    customFeature,
                    setCustomFeature,
                    setTempFeatures,
                  )
                }
                activeOpacity={0.7}>
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={colors.black}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.addBtn, styles.pickerConfirmBtn]}
              onPress={() => {
                onChange('features', tempFeatures);
                setFeaturesVisible(false);
              }}
              activeOpacity={0.8}>
              <Text style={styles.addBtnText}>{t('confirm', 'Confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default VehicleFormFields;
