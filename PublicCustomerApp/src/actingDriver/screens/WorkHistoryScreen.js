import React, {useState, useCallback} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

import {useStackScreenStore} from '../../common/store/useStackScreenStore';
import useUserStore from '../../common/store/useUserStore';
import usePublicDriverStore from '../../notdriver/store/usePublicDriverStore';
import {Colors, Fonts} from '../../common/constants/constants';
import {showNotification} from '../../common/components/Alerts/showNotification';
import InputField from '../../common/components/InputField';
import NavBar from '../../notCustomer/components/NavBar';
import UseBackButton from '../../common/hooks/UseBackButton';
import APIRequest from '../../common/APIRequest';

const LEAVING_REASONS = [
  {label: 'Better opportunity', value: 'better_opportunity'},
  {label: 'Low earnings', value: 'low_earnings'},
  {label: 'Relocated', value: 'relocated'},
  {label: 'Personal reasons', value: 'personal'},
  {label: 'Contract ended', value: 'contract_ended'},
  {label: 'Other', value: 'other'},
];

const createEmptyEntry = () => ({
  id: Date.now().toString(),
  employer: '',
  role: '',
  fromDate: '',
  toDate: '',
  city: '',
  reasonForLeaving: '',
});

const formatDate = (date) => {
  if (!date) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}-${yyyy}`;
};

const WorkHistoryScreen = () => {
  const {t} = useTranslation();
  const {goBack} = useStackScreenStore();
  const {userInfo} = useUserStore();
  const {driverInfo, setDriverInfo} = usePublicDriverStore();

  const existing = driverInfo?.workHistory || [];
  const [entries, setEntries] = useState(
    existing.length > 0
      ? existing.map(e => ({...e, id: e.id || Date.now().toString()}))
      : [createEmptyEntry()],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [activeDatePicker, setActiveDatePicker] = useState(null); // { entryId, field }
  const [datePickerValue, setDatePickerValue] = useState(new Date());

  const updateEntry = useCallback((id, field, value) => {
    setEntries(prev =>
      prev.map(entry =>
        entry.id === id ? {...entry, [field]: value} : entry,
      ),
    );
  }, []);

  const addEntry = useCallback(() => {
    setEntries(prev => [...prev, createEmptyEntry()]);
  }, []);

  const removeEntry = useCallback((id) => {
    setEntries(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(entry => entry.id !== id);
    });
  }, []);

  const openDatePicker = useCallback((entryId, field) => {
    setActiveDatePicker({entryId, field});
    setDatePickerValue(new Date());
  }, []);

  const handleDateChange = useCallback((event, selectedDate) => {
    if (Platform.OS === 'android') {
      setActiveDatePicker(null);
    }
    if (selectedDate && activeDatePicker) {
      const formatted = formatDate(selectedDate);
      updateEntry(activeDatePicker.entryId, activeDatePicker.field, formatted);
      setDatePickerValue(selectedDate);
    }
    if (Platform.OS === 'ios') {
      setActiveDatePicker(null);
    }
  }, [activeDatePicker, updateEntry]);

  const onSave = async () => {
    const filledEntries = entries.filter(e => e.employer.trim() || e.role.trim());
    
    for (let i = 0; i < filledEntries.length; i++) {
      const entry = filledEntries[i];
      if (!entry.employer.trim()) {
        showNotification(
          t('enter_employer', {defaultValue: 'Please enter employer/platform name'}),
          '',
          'danger',
        );
        return;
      }
      if (!entry.role.trim()) {
        showNotification(
          t('enter_role', {defaultValue: 'Please enter your role'}),
          '',
          'danger',
        );
        return;
      }
    }

    const payload = {
// eslint-disable-next-line no-unused-vars
      workHistory: filledEntries.map(({id: _id, ...rest}) => rest),
    };

    setIsLoading(true);
    try {
      const api = new APIRequest();
      const response = await api.request(
        '/publicrides/driver/v2/updateDriverInfo',
        'POST',
        payload,
        userInfo?.token,
      );
      if (response.success) {
        setDriverInfo({...driverInfo, ...payload});
        showNotification(
          t('work_history_saved', {defaultValue: 'Work history saved'}),
          '',
          'success',
        );
        goBack();
      } else {
        showNotification(response?.message || 'Error', '', 'danger');
      }
    } catch (error) {
      console.error('Error saving work history:', error);
      showNotification('Something went wrong', '', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const renderReasonChips = (entryId, selected) => (
    <View style={styles.chipRow}>
      {LEAVING_REASONS.map(opt => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, isSelected && styles.chipSelected]}
            activeOpacity={0.7}
            onPress={() => updateEntry(entryId, 'reasonForLeaving', opt.value)}>
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderEntry = (entry, index) => (
    <View key={entry.id} style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryIndex}>
          {t('experience_number', {defaultValue: `Experience #${index + 1}`, number: index + 1})}
        </Text>
        {entries.length > 1 && (
          <TouchableOpacity onPress={() => removeEntry(entry.id)} style={styles.removeBtn}>
            <MaterialIcons name="close" size={20} color={Colors.danger_red} />
          </TouchableOpacity>
        )}
      </View>

      <InputField
        value={entry.employer}
        label={t('employer_platform', {defaultValue: 'Employer / Platform'})}
        onChangeText={text => updateEntry(entry.id, 'employer', text)}
        isRequired
      />

      <InputField
        value={entry.role}
        label={t('role', {defaultValue: 'Role'})}
        onChangeText={text => updateEntry(entry.id, 'role', text)}
        isRequired
      />

      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <TouchableOpacity
            onPress={() => openDatePicker(entry.id, 'fromDate')}
            activeOpacity={0.7}>
            <InputField
              value={entry.fromDate}
              label={t('from_date', {defaultValue: 'From (MM-YYYY)'})}
              editable={false}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.dateField}>
          <TouchableOpacity
            onPress={() => openDatePicker(entry.id, 'toDate')}
            activeOpacity={0.7}>
            <InputField
              value={entry.toDate}
              label={t('to_date', {defaultValue: 'To (MM-YYYY)'})}
              editable={false}
            />
          </TouchableOpacity>
        </View>
      </View>

      <InputField
        value={entry.city}
        label={t('city', {defaultValue: 'City'})}
        onChangeText={text => updateEntry(entry.id, 'city', text)}
      />

      <Text style={styles.reasonLabel}>
        {t('reason_for_leaving', {defaultValue: 'Reason for Leaving'})}
      </Text>
      {renderReasonChips(entry.id, entry.reasonForLeaving)}
    </View>
  );

  return (
    <View style={styles.container}>
      <NavBar
        title={t('work_history', {defaultValue: 'Work History'})}
        onBackPress={() => goBack()}
      />
      <UseBackButton onBackPress={() => goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {entries.map((entry, index) => renderEntry(entry, index))}

        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={addEntry}>
          <MaterialIcons name="add-circle-outline" size={22} color={Colors.periwinkle} />
          <Text style={styles.addBtnText}>
            {t('add_experience', {defaultValue: '+ Add Experience'})}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {activeDatePicker && (
        <DateTimePicker
          value={datePickerValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

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
              {t('save_and_continue', {defaultValue: 'Save & Continue'})}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WorkHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 10,
  },
  entryCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 16,
    marginBottom: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryIndex: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.periwinkle,
  },
  removeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#FFF0F0',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.black,
    marginTop: 8,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  chipSelected: {
    borderColor: Colors.periwinkle,
    backgroundColor: '#F0EBFF',
  },
  chipText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.warm_grey,
  },
  chipTextSelected: {
    color: Colors.periwinkle,
    fontFamily: Fonts.medium,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.periwinkle,
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
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
