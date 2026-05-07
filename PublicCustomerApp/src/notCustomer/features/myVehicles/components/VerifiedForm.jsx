/**
 * VerifiedForm
 *
 * Component to display vehicle details after MParivahan verification.
 * Shows verified fields as read-only labels and allows editing of remaining fields.
 *
 * Props:
 *   vehicleId   - ID of the verified vehicle (for editing)
 *   regNo       - Registration number
 *   verifiedData - Object with verified vehicle details from MParivahan
 *   onSave      - Callback when form is submitted
 *   onCancel    - Callback when cancel is pressed
 */

import React, {useCallback, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {updatePassangerVehicle} from '../../../API/EndPoints/EndPoints';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import {colors} from '../../../constants/constants';
import styles from '../styles/vehicleStyles';
import VehicleFormFields from './VehicleFormFields';

const VerifiedFieldDisplay = ({label, value}) => (
  <View style={styles.verifiedFieldContainer}>
    <Text style={styles.verifiedFieldLabel}>{label}:</Text>
    <Text style={styles.verifiedFieldValue}>{value || 'N/A'}</Text>
  </View>
);

const hasValidTransmission = transmission =>
  Array.isArray(transmission) &&
  transmission.length > 0 &&
  (transmission[0] !== 'automatic' || !!transmission[1]);

const VerifiedForm = ({vehicleId, regNo, verifiedData, onSave, onCancel}) => {
  const {t} = useTranslation();
  const [fields, setFields] = useState({
    vehicleType: verifiedData?.class || '',
    make: verifiedData?.brand_name || '',
    model: verifiedData?.brand_model || '',
    year: verifiedData?.registration_date
      ? new Date(verifiedData.registration_date).getFullYear().toString()
      : '',
    fuelType: verifiedData?.fuel_type || '',
    transmission: [],
    features: [],
    additionalInfo: '',
    maxSpeed: '',
  });
  const [loading, setLoading] = useState(false);
  const [isVerifiedDetailsExpanded, setIsVerifiedDetailsExpanded] =
    useState(false);

  const handleChange = useCallback((key, value) => {
    setFields(prev => ({...prev, [key]: value}));
  }, []);

  const handleSave = async () => {
    if (!fields.vehicleType) {
      Alert.alert(
        t('error'),
        t('vehicle_type_required', 'Please select a vehicle type'),
      );
      return;
    }
    if (!fields.make?.trim()) {
      Alert.alert(t('error'), t('make_required', 'Please select a make'));
      return;
    }
    if (!fields.model?.trim()) {
      Alert.alert(t('error'), t('model_required', 'Please select a model'));
      return;
    }
    if (!fields.year) {
      Alert.alert(t('error'), t('year_required', 'Please select a year'));
      return;
    }
    if (!fields.maxSpeed) {
      Alert.alert(
        t('error'),
        t('speed_limit_required', 'Please enter a speed limit'),
      );
      return;
    }
    if (fields.maxSpeed && Number(fields.maxSpeed) < 40) {
      Alert.alert(
        t('error'),
        t('max_speed_min_error', 'Minimum allowed max speed is 40 km/h'),
      );
      return;
    }
    if (!hasValidTransmission(fields.transmission)) {
      Alert.alert(
        t('error'),
        t('transmission_required', 'Please select a transmission'),
      );
      return;
    }
    if (!fields.features || fields.features.length === 0) {
      Alert.alert(
        t('error'),
        t('features_required', 'Please select at least one feature'),
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        regNo,
        type: fields.vehicleType,
        make: fields.make.trim(),
        model: fields.model.trim(),
        year: fields.year,
        fuelType: fields.fuelType,
        transmission: fields.transmission,
        features: fields.features,
        additionalInfo: fields.additionalInfo.trim(),
        maxSpeed: fields.maxSpeed ? Number(fields.maxSpeed) : undefined,
      };

      // Use updatePassangerVehicle which handles upsert (create or update)
      const response = await updatePassangerVehicle(payload);

      if (response.success) {
        onSave(response.vehicle || {regNo, ...fields});
      } else {
        Alert.alert(
          t('error'),
          response.message || t('something_went_wrong', 'Something went wrong'),
        );
      }
    } catch (error) {
      Alert.alert(
        t('error'),
        error?.message ||
          t('something_went_wrong', 'Something went wrong. Please try again.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.formContainer}
      showsVerticalScrollIndicator={false}>
      <AdaptiveText style={styles.formTitle}>
        {t('vehicle_details_verified', 'Vehicle Details Verified')}
      </AdaptiveText>

      <View style={styles.successBanner}>
        <Ionicons
          name="checkmark-circle-outline"
          size={18}
          color={colors.success_green || '#4CAF50'}
        />
        <Text style={styles.successBannerText}>
          {t(
            'vehicle_verified_desc',
            'Your vehicle details have been successfully verified.',
          )}
        </Text>
      </View>

      {/* Registration Number */}
      <Text style={styles.inputLabel}>
        {t('registration_number', 'Registration Number')}
      </Text>
      <TextInput
        style={[styles.input, styles.inputDisabled]}
        value={regNo}
        editable={false}
      />

      {/* Verified Fields - Read Only Display */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 15,
          marginBottom: isVerifiedDetailsExpanded ? 10 : 15,
        }}
        onPress={() => setIsVerifiedDetailsExpanded(!isVerifiedDetailsExpanded)}
        activeOpacity={0.7}>
        <Text style={[styles.sectionTitle, {marginTop: 0, marginBottom: 0}]}>
          {t('verified_details', 'Verified Details')}
        </Text>
        <Ionicons
          name={isVerifiedDetailsExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.black}
        />
      </TouchableOpacity>

      {isVerifiedDetailsExpanded && (
        <View style={{marginBottom: 10}}>
          <VerifiedFieldDisplay
            label={t('vehicle_class', 'Class')}
            value={verifiedData?.class || fields.vehicleType}
          />

          <VerifiedFieldDisplay
            label={t('brand_name', 'Brand')}
            value={verifiedData?.brand_name || fields.make}
          />

          <VerifiedFieldDisplay
            label={t('brand_model', 'Model')}
            value={verifiedData?.brand_model || fields.model}
          />

          <VerifiedFieldDisplay
            label={t('fuel_type', 'Fuel Type')}
            value={verifiedData?.fuel_type || fields.fuelType}
          />

          <VerifiedFieldDisplay
            label={t('color', 'Color')}
            value={verifiedData?.color}
          />

          <VerifiedFieldDisplay
            label={t('seating_capacity', 'Seating Capacity')}
            value={verifiedData?.seating_capacity}
          />

          <VerifiedFieldDisplay
            label={t('cubic_capacity', 'Cubic Capacity')}
            value={verifiedData?.cubic_capacity}
          />
        </View>
      )}

      {/* Editable Fields */}
      <Text style={styles.sectionTitle}>
        {t('additional_details', 'Vehicle Details')}
      </Text>

      {/* Vehicle Type Selector */}
      <VehicleFormFields values={fields} onChange={handleChange} />

      <View style={[styles.formActions, {marginBottom: 10}]}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>{t('cancel', 'Cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addBtn, loading && styles.addBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.addBtnText}>{t('save', 'Save')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default VerifiedForm;
