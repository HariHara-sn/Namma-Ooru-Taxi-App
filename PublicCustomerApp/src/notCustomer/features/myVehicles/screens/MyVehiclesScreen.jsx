import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import NavBar from '../../../components/NavBar';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import { colors } from '../../../constants/constants';
import {
  updatePassangerVehicle,
  getPassangerVehicles,
  editPassangerVehicle,
  deletePassangerVehicle,
} from '../../../API/EndPoints/EndPoints';
import VehicleCard from '../components/VehicleCard';
import VehicleFormFields from '../components/VehicleFormFields';
import styles from '../styles/vehicleStyles';

// ─── Initial form state ───────────────────────────────────────────────────────
const EMPTY_FIELDS = {
  vehicleType: '',
  make: '',
  model: '',
  year: '',
  fuelType: '',
  transmission: [],  features: [],  additionalInfo: '',
  maxSpeed: '',
};

const fieldsFromVehicle = (v) => ({
  vehicleType: v.type || '',
  make: v.make || '',
  model: v.model || '',
  year: v.year ? String(v.year) : '',
  fuelType: v.fuelType || '',
  transmission: Array.isArray(v.transmission) ? v.transmission : (v.transmission ? [v.transmission] : []),  features: Array.isArray(v.features) ? v.features : [],  additionalInfo: v.additionalInfo || '',
  maxSpeed: v.maxSpeed ? String(v.maxSpeed) : '',
});

// ─── Step 1: Registration number ─────────────────────────────────────────────
const RegNoForm = ({ onVerify, onCancel }) => {
  const { t } = useTranslation();
  const [regNo, setRegNo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    const trimmed = regNo.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert(t('error'), t('reg_no_required', 'Please enter registration number'));
      return;
    }
    setLoading(true);
    try {
      const response = await updatePassangerVehicle({ regNo: trimmed });
      onVerify(trimmed, response);
    } catch (_) {
      Alert.alert(t('error'), t('something_went_wrong', 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      <AdaptiveText style={styles.formTitle}>{t('add_vehicle', 'Add Vehicle')}</AdaptiveText>
      <Text style={styles.formSubtitle}>
        {t('enter_reg_no_to_verify', 'Enter your vehicle registration number to auto-fetch details')}
      </Text>
      <Text style={styles.inputLabel}>{t('registration_number', 'Registration Number')} *</Text>
      <TextInput
        style={styles.input}
        value={regNo}
        onChangeText={setRegNo}
        placeholder="e.g. TN01AB1234"
        placeholderTextColor={colors.grey_dark}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <View style={styles.formActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>{t('cancel', 'Cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addBtn, loading && styles.addBtnDisabled]}
          onPress={handleVerify}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.addBtnText}>{t('verify', 'Verify')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Step 2: Manual details after Parivahan failure ──────────────────────────
const ManualForm = ({ regNo, onAdd, onCancel }) => {
  const { t } = useTranslation();
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleAdd = async () => {
    if (!fields.vehicleType) {
      Alert.alert(t('error'), t('vehicle_type_required', 'Please select a vehicle type'));
      return;
    }
    if (fields.maxSpeed && Number(fields.maxSpeed) < 40) {
      Alert.alert(t('error'), t('max_speed_min_error', 'Minimum allowed max speed is 40 km/h'));
      return;
    }
    setLoading(true);
    try {
      const response = await updatePassangerVehicle({
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
      });
      if (response.success) {
        onAdd(response.vehicle || { regNo, ...fields, type: fields.vehicleType });
      } else {
        Alert.alert(t('error'), response.message || t('something_went_wrong', 'Something went wrong'));
      }
    } catch (_) {
      Alert.alert(t('error'), t('something_went_wrong', 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <AdaptiveText style={styles.formTitle}>{t('add_vehicle', 'Add Vehicle')}</AdaptiveText>
      <View style={styles.failedBanner}>
        <Ionicons name="information-circle-outline" size={18} color={colors.orange} />
        <Text style={styles.failedBannerText}>
          {t('parivahan_failed_desc', 'Could not auto-fetch details. Please enter them manually.')}
        </Text>
      </View>
      <Text style={styles.inputLabel}>{t('registration_number', 'Registration Number')}</Text>
      <TextInput style={[styles.input, styles.inputDisabled]} value={regNo} editable={false} />
      <VehicleFormFields values={fields} onChange={handleChange} />
      <View style={styles.formActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>{t('cancel', 'Cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addBtn, loading && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.addBtnText}>{t('add', 'Add')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ─── Edit form ────────────────────────────────────────────────────────────────
const EditForm = ({ vehicle, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [fields, setFields] = useState(() => fieldsFromVehicle(vehicle));
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!fields.vehicleType) {
      Alert.alert(t('error'), t('vehicle_type_required', 'Please select a vehicle type'));
      return;
    }
    if (fields.maxSpeed && Number(fields.maxSpeed) < 40) {
      Alert.alert(t('error'), t('max_speed_min_error', 'Minimum allowed max speed is 40 km/h'));
      return;
    }
    const updated = {
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
    setLoading(true);
    try {
      const response = await editPassangerVehicle(vehicle._id, updated);
      if (response.success) {
        onSave({ ...vehicle, ...updated });
      } else {
        Alert.alert(t('error'), response.message || t('something_went_wrong', 'Something went wrong'));
      }
    } catch (_) {
      Alert.alert(t('error'), t('something_went_wrong', 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <AdaptiveText style={styles.formTitle}>{t('edit_vehicle', 'Edit Vehicle')}</AdaptiveText>
      <Text style={styles.inputLabel}>{t('registration_number', 'Registration Number')}</Text>
      <TextInput style={[styles.input, styles.inputDisabled]} value={vehicle?.regNo} editable={false} />
      <VehicleFormFields values={fields} onChange={handleChange} />
      <View style={styles.formActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>{t('cancel', 'Cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addBtn, loading && styles.addBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
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

// ─── Main screen ──────────────────────────────────────────────────────────────
const MyVehiclesScreen = () => {
  const { t } = useTranslation();
  const { goBack } = useStackScreenStore();

  // 'list' | 'regNo' | 'manual' | 'edit'
  const [view, setView] = useState('list');
  const [pendingRegNo, setPendingRegNo] = useState('');
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const response = await getPassangerVehicles();
      if (response.success) setVehicles(response.vehicles || []);
    } catch (_) {
      // silently fail; list stays empty
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleVerifyResult = useCallback((regNo, response) => {
    if (response.isParivahanFailed) {
      setPendingRegNo(regNo);
      setView('manual');
    } else if (response.success) {
      setVehicles((prev) => [response.vehicle, ...prev]);
      setView('list');
    } else {
      Alert.alert(t('error'), response.message || t('something_went_wrong', 'Something went wrong'));
    }
  }, [t]);

  const handleManualAdd = useCallback((vehicle) => {
    setVehicles((prev) => [vehicle, ...prev]);
    setView('list');
  }, []);

  const handleCancel = useCallback(() => {
    setPendingRegNo('');
    setEditingVehicle(null);
    setView('list');
  }, []);

  const handleEdit = useCallback((vehicle) => {
    setEditingVehicle(vehicle);
    setView('edit');
  }, []);

  const handleEditSave = useCallback((updatedVehicle) => {
    setVehicles((prev) =>
      prev.map((v) => (v._id?.toString() === updatedVehicle._id?.toString() ? updatedVehicle : v)),
    );
    setEditingVehicle(null);
    setView('list');
  }, []);

  const handleDelete = useCallback((vehicle) => {
    Alert.alert(
      t('delete_vehicle', 'Delete Vehicle'),
      t('delete_vehicle_confirm', 'Are you sure you want to remove this vehicle?'),
      [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deletePassangerVehicle(vehicle._id);
              if (response.success) {
                setVehicles((prev) =>
                  prev.filter((v) => v._id?.toString() !== vehicle._id?.toString()),
                );
              } else {
                Alert.alert(t('error'), response.message || t('something_went_wrong', 'Something went wrong'));
              }
            } catch (_) {
              Alert.alert(t('error'), t('something_went_wrong', 'Something went wrong. Please try again.'));
            }
          },
        },
      ],
    );
  }, [t]);

  if (view === 'edit') {
    return (
      <View style={styles.container}>
        <NavBar title={t('edit_vehicle', 'Edit Vehicle')} onBackPress={handleCancel} withBg withShadow />
        <EditForm vehicle={editingVehicle} onSave={handleEditSave} onCancel={handleCancel} />
      </View>
    );
  }

  if (view === 'regNo') {
    return (
      <View style={styles.container}>
        <NavBar title={t('add_vehicle', 'Add Vehicle')} onBackPress={handleCancel} withBg withShadow />
        <RegNoForm onVerify={handleVerifyResult} onCancel={handleCancel} />
      </View>
    );
  }

  if (view === 'manual') {
    return (
      <View style={styles.container}>
        <NavBar title={t('add_vehicle', 'Add Vehicle')} onBackPress={handleCancel} withBg withShadow />
        <ManualForm regNo={pendingRegNo} onAdd={handleManualAdd} onCancel={handleCancel} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavBar title={t('my_vehicles', 'My Vehicles')} onBackPress={goBack} withBg withShadow />
      <View style={styles.content}>
        {loadingVehicles ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.black} />
          </View>
        ) : vehicles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={colors.grey_dark} />
            <Text style={styles.emptyTitle}>{t('no_vehicles', 'No Vehicles Added')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('no_vehicles_desc', 'Add your vehicles to quickly book an acting driver')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(item, idx) => item._id?.toString() || String(idx)}
            renderItem={({ item }) => (
              <VehicleCard vehicle={item} onEdit={handleEdit} onDelete={handleDelete} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        <TouchableOpacity style={styles.addVehicleBtn} onPress={() => setView('regNo')} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color={colors.white} />
          <Text style={styles.addVehicleBtnText}>{t('add_vehicle', 'Add Vehicle')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MyVehiclesScreen;
