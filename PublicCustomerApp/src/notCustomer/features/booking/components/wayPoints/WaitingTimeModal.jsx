import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Fonts} from '../../../../constants/constants';
import AdaptiveText from '../../../../components/Common/AdaptiveText'; 
import useConfigStore from '../../../../store/useConfigStore';

const WaitingTimeModal = ({
  visible,
  onClose,
  onSave,
  waypointData,
}) => {
  const { t } = useTranslation();
  const [selectedTime, setSelectedTime] = useState(5);
  const [customTime, setCustomTime] = useState('');
  const { appConfig } = useConfigStore();
  const predefinedTimes = [10, 15, 20, 30, 45, 60];
  const defaultwaitingTime = appConfig?.DEFAULT_WAIT_TIME;
  const waitingTimeChargesPerMinute = appConfig?.WAIT_TIME_CHARGES_PER_MINUTE;
  const maxwaitingTime = appConfig?.MAX_WAIT_TIME;
  const showWaitPriceInfo = appConfig?.SHOW_WAIT_PRICE_INFO;
  const defaultWaitTimeValue = Number(defaultwaitingTime);
  const normalizedDefaultWaitTime = Number.isFinite(defaultWaitTimeValue) && defaultWaitTimeValue > 0
    ? defaultWaitTimeValue
    : 5;
  const normalizedMaxWaitTime = Number(maxwaitingTime) || 60;
  const defaultWaitThreshold = Math.min(normalizedDefaultWaitTime, normalizedMaxWaitTime);
  const availablePredefinedTimes = predefinedTimes.filter((time) => time <= normalizedMaxWaitTime);
  


  useEffect(() => {
    if (waypointData?.item?.waitingTime) {
      const initialWaitTime = Math.min(waypointData.item.waitingTime, normalizedMaxWaitTime);
      setSelectedTime(initialWaitTime);
      setCustomTime(String(initialWaitTime));
    } else {
      setSelectedTime(defaultWaitThreshold);
    }
  }, [waypointData, defaultWaitThreshold, normalizedMaxWaitTime]);

  const handleTimeSelect = (time) => {
    if (time > normalizedMaxWaitTime) {
      setSelectedTime(normalizedMaxWaitTime);
      setCustomTime(String(normalizedMaxWaitTime));
      return;
    }
    setSelectedTime(time);
    setCustomTime(String(time));
  };

  const handleCustomTimeChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomTime(numericValue);
    if (numericValue) {
      const timeValue = parseInt(numericValue, 10);
      setSelectedTime(timeValue); // Allow setting any value for validation
    } else {
      setSelectedTime(defaultWaitThreshold); // Reset to default if empty
    }
  };

  const handleSave = () => {
    if (onSave && waypointData && !isBelowDefault && !isAboveMax) {
      onSave(waypointData.index, {
        ...waypointData.item,
        waitingTime: Math.min(selectedTime, normalizedMaxWaitTime)
      });
    }
    onClose();
  };

  const handleRemovewaitingTime = () => {
    if (onSave && waypointData) {
      onSave(waypointData.index, {
        ...waypointData.item,
        waitingTime: 0 // Remove wait time by setting to 0
      });
    }
    onClose();
  };

  const isBelowDefault = selectedTime < defaultWaitThreshold;
  const isAboveMax = selectedTime > normalizedMaxWaitTime;
  const canSave = !isBelowDefault && !isAboveMax && selectedTime >= defaultWaitThreshold;
  const showInputError = isBelowDefault || isAboveMax;
  const haswaitingTime = waypointData?.item?.waitingTime && waypointData.item.waitingTime > 0;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>  
              <MaterialIcons name="schedule" size={25} color="#000" />
              <Text style={styles.modalTitle}>{t('add_stop_wait_time')}</Text>
            </View>
          </View>

          {/* Info Text */}
          <View style={styles.infoSection}>
            <AdaptiveText style={styles.infoText}>
              {t('wait_time_info',{defaultwaitingTime})}
            </AdaptiveText>
          </View>

          {/* Time Input */}
          <View style={styles.timeSection}>
            
            <View style={[
              styles.timeInputContainer,
              showInputError && styles.timeInputContainerError
            ]}>
              <TextInput
                style={styles.timeInput}
                placeholder={String(defaultwaitingTime ?? defaultWaitThreshold)}
                placeholderTextColor="#CCC"
                value={customTime}
                onChangeText={handleCustomTimeChange}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.timeUnit}>{t('mins')}</Text>
            </View>
            {isBelowDefault && (
              <View style={styles.warningContainer}>
                <MaterialIcons name="warning" size={16} color="#ff6b6b" />
                <Text style={styles.warningText}>
                  {t('minimum_wait_time', { defaultwaitingTime })}
                </Text>
              </View>
            )}
            {isAboveMax && (
              <View style={styles.warningContainer}>
                <MaterialIcons name="warning" size={16} color="#ff6b6b" />
                <Text style={styles.warningText}>
                  {t('maximum_wait_time', { maxwaitingTime: normalizedMaxWaitTime })}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Options */}
          <View style={styles.quickOptionsSection}>
          
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timeButtonsContainer}>
                {availablePredefinedTimes.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeButton,
                      selectedTime === time && styles.selectedTimeButton,
                      time < defaultWaitThreshold && styles.disabledTimeButton
                    ]}
                    onPress={() => handleTimeSelect(time)}
                    disabled={time < defaultWaitThreshold}
                  >
                    <AdaptiveText style={[
                      styles.timeButtonText,
                      selectedTime === time && styles.selectedTimeButtonText,
                      time < defaultWaitThreshold && styles.disabledTimeButtonText
                    ]}>
                      {time}
                    </AdaptiveText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Location Info */}
          <View style={styles.locationSection}>
            <MaterialIcons name="location-on" size={16} color="#666" style={styles.locationIcon} />
            <View style={styles.locationTextContainer}>
              <AdaptiveText style={styles.locationAddress} numberOfLines={2}>
                {waypointData?.item?.address || t('unknown_address')}
              </AdaptiveText>
              {/* <Text style={styles.coordinates}>
                {waypointData?.item?.latitude?.toFixed(4) || 'N/A'}, {waypointData?.item?.longitude?.toFixed(4) || 'N/A'}
              </Text> */}
            </View>
          </View>

          {showWaitPriceInfo && (
            <View style={styles.chargesInfoSection}>
              <View style={styles.chargesHeader}>
                <MaterialIcons name="info" size={16} color="#666" />
              <Text style={styles.chargesTitle}>{t('wait_time_charges')}</Text>
            </View>
            <AdaptiveText style={styles.chargesText}>
              {t('wait_time_charges_info', { defaultwaitingTime, waitingTimeChargesPerMinute, maxwaitingTime })}
            </AdaptiveText>
          </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
           
            
            {haswaitingTime ? (
              <TouchableOpacity
                style={[styles.button, styles.removeButton]}
                onPress={handleRemovewaitingTime}
              >
                <AdaptiveText style={styles.removeButtonText}>{t('remove')}</AdaptiveText>
              </TouchableOpacity>
            ):(
              <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <AdaptiveText style={styles.cancelButtonText}>{t('skip')}</AdaptiveText>
            </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                !canSave && styles.disabledButton
              ]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <AdaptiveText style={styles.saveButtonText}>{t('set')}</AdaptiveText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalView: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleContainer:{
    flexDirection:'row',
    alignItems:'center',
    gap:10
  },
  modalTitle: {
    fontSize: 20,
    fontFamily:Fonts.medium,
    color: '#1a1a1a',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:'center',
    marginBottom: 24,
    padding: 5,
   
    textAlign:'center',
  
    borderRadius: 12,
  },
  locationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  locationTextContainer: {
 
    justifyContent:'center',
  },
  locationAddress: {
    fontSize: 14,
    fontFamily:Fonts.regular,
    color: '#1a1a1a',
    lineHeight: 20,
    marginBottom: 4,
    textAlign:'center',
  },
  coordinates: {
    fontSize: 12,
    color: '#666',
   
  },
  timeSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily:Fonts.regular,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeInputContainerError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  timeInput: {
    flex: 1,
    fontSize: 18,
    fontFamily:Fonts.regular,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  timeUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontFamily:Fonts.regular,
  },
  warningText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 8,
    fontFamily:Fonts.regular,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    paddingHorizontal: 4,
  },
  quickOptionsSection: {
    marginBottom: 24,
  },
  timeButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedTimeButton: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  disabledTimeButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
  },
  timeButtonText: {
    fontSize: 14,
    fontFamily:Fonts.regular,
    color: '#666',
  },
  selectedTimeButtonText: {
    color: '#fff',
    fontFamily:Fonts.regular,
  },
  disabledTimeButtonText: {
    color: '#ccc',
    fontFamily:Fonts.regular,
  },
  chargesInfoSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
   
  },
  chargesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  chargesTitle: {
    fontSize: 14,
    fontFamily:Fonts.medium,
    color: '#1a1a1a',
  },
  chargesText: {
    fontSize: 12,
    fontFamily:Fonts.regular,
    color: '#666',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  saveButton: {
    backgroundColor: 'black',
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily:Fonts.regular,
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily:Fonts.regular,
    color: '#fff',
  },
  removeButton: {
    backgroundColor: '#ff6b6b',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  removeButtonText: {
    fontSize: 16,
    fontFamily:Fonts.regular,
    color: '#fff',
  },
  infoSection: {
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    fontFamily:Fonts.regular,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

WaitingTimeModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  waypointData: PropTypes.shape({
    index: PropTypes.number,
    item: PropTypes.shape({
      name: PropTypes.string,
      address: PropTypes.string,
      latitude: PropTypes.number,
      longitude: PropTypes.number,
      waitingTime: PropTypes.number,
    }),
  }),
};

export default WaitingTimeModal; 