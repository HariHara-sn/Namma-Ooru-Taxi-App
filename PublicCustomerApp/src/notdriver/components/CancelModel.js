import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import PropTypes from 'prop-types';
import { useTripAcceptStore } from '../store/useTripAcceptStore';
import { showNotification } from '../../common/components/Alerts/showNotification';
import BottomSheetPopup from '../../common/components/BottomSheetPopup';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import { height } from '../../common/utils/scalingutils';
import { Colors, Fonts } from '../../common/constants/constants';
import { useTranslation } from 'react-i18next';



// Custom CheckBox Component
const CustomCheckBox = ({ isChecked, onToggle }) => (
  <View style={styles.checkBoxContainer}>
    <View style={[styles.checkBox, isChecked && styles.checkedBox]}>
    </View>
  </View>
);

CustomCheckBox.propTypes = {
  isChecked: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

const CancelRideModal = ({
  callCancelRide,
  modalVisible,
  setModalVisible,
  loading,
  tripData
}) => {
  const {t} = useTranslation()
  const {tripCancelReason,setTripCancelReason } = useTripAcceptStore()
  const [otherReason, setOtherReason] = useState('');
  const [error, setError] = useState('');
  const reasons = [
    'reached_destination',
    'rider_unreachable',
    'pickup_incorrect_or_far',
    'destination_too_far',
    'drop_changed',
    'payment_issue',
    'vehicle_issue',
    'personal_emergency',
    'traffic_or_weather',
    'other'
  ];

  const handleReasonSelect = (reason) => {
    setTripCancelReason(reason);
    setError(''); // Clear error when selecting a different reason
    if (reason !== 'other') {
      setOtherReason('');
    }
  };

  const handleCancel = () => {
    // Validate if "other" is selected and input is empty

    if (!tripCancelReason) {
      showNotification(t('please_select_a_reason') || 'Please select a reason','', 'danger');
      return;
    }

    if (tripCancelReason === 'other' && (!otherReason || !otherReason.trim())) {
      setError(t('please_enter_a_reason') || 'Please enter a reason');
      return;
    }

    setError(''); // Clear any previous errors
    const reason = tripCancelReason === 'other' ? otherReason : tripCancelReason;
    const translatedReason = t(reason) || reason; // Translate the reason if possible
    callCancelRide(reason, translatedReason);
  };

  const handleOtherReasonChange = (text) => {
    setOtherReason(text);
    setError(''); // Clear error when user starts typing
  };

  const status = tripData?.status
  
  const filteredReasons = status === 'ACCEPTED' ? reasons.slice(1, reasons?.length) : reasons;

  return (
      <BottomSheetPopup
        visible={modalVisible}
        driverStyles
        onClose={() => {
          setModalVisible(false);
          setTripCancelReason(null);
          setOtherReason('');
          setError('');
        }}>
      <View style={styles.modalContainer}>
       {loading && <FullScreenLoader  />}
        <View style={styles.modalView}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{tripData?.status === 'PICKEDUP' ? t('end_trip') : t('cancel_ride')}</Text>
                {tripData?.status === 'PICKEDUP' ? (
                  <Text style={styles.modalText}>{t('please_select_a_reason_for_ending_the_trip')}</Text>
                ) : (
                  <Text style={styles.modalText}>{t('please_select_a_reason_for_cancelling_the_trip')}</Text>
                )}
                <View style={styles.modalBody}> 
                  <View style={{ height:height*0.4, backgroundColor: Colors.grey_light, padding: 10, borderRadius: 10 }}>
                  <ScrollView>
            {filteredReasons?.map((reason, index) => (
              <TouchableOpacity onPress={() => handleReasonSelect(reason)} key={index} style={styles.reasonContainer}>
                <CustomCheckBox
                  isChecked={tripCancelReason === reason}
                />
                <Text style={styles.reasonText}>{t(reason)}</Text>
              </TouchableOpacity>
            ))}
            </ScrollView>
            {tripCancelReason === 'other' && (
              <>
                <TextInput
                  style={[styles.textInput, error && styles.textInputError]}
                  placeholder={t('enter_your_reason') || 'Other Reason'}
                  value={otherReason}
                  onChangeText={handleOtherReasonChange}
                  multiline={true}
                  numberOfLines={4}
                  maxLength={500}
                />
                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}
              </>
            )}
            </View>
          </View>
            </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                { backgroundColor: tripCancelReason ? '#FF0000' : '#ccc' }
              ]}
              disabled={!tripCancelReason}
              onPress={handleCancel}
            >
              <Text style={styles.modalButtonText}>{tripData?.status === 'PICKEDUP' ? t('end_trip') : t('cancel_ride')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonClose]}
              onPress={() => {
                setModalVisible(false);
                setTripCancelReason(null);
                setOtherReason('');
                setError('');
              }}
            >
              <Text style={styles.modalButtonText}>{t('cancel') || 'cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheetPopup>
  );
};

export default CancelRideModal;

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    bottom:0,
    backgroundColor: 'white',
    borderTopLeftRadius:20,
    borderTopRightRadius:20,
    overflow: 'hidden',
    width: '100%',
    height: '80%',
  },
  modalView: {
    width: '100%',
    // height: '80%',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  modalBody: {
    marginTop: 10,
    width: '100%',
    backgroundColor: '#fff',
  },
  modalHeader: {
    marginTop: 5,
    width: '100%',
    color: Colors.periwinkle,
    padding: 20,
    alignItems: 'flex-start',
  },
  
  modalHeaderText: {
    fontSize: 16,
    color: 'gray',
    fontFamily:Fonts.medium
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    fontFamily:Fonts.medium,
    width: '80%',
  },
  modalTitle: {
    fontSize: 24,
    color: Colors.periwinkle,
    marginBottom: 5,
    textAlign: 'center',
    fontFamily:Fonts.bold
  },
  modalFooter: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 10,
    alignItems: 'center',
    gap: 10,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
    fontFamily:Fonts.regular
  },
  modalButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    // marginTop: 10,
    paddingHorizontal:30,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    textAlign: 'center',
    fontFamily:Fonts.semi_bold
  },
  modalButtonClose: {
    backgroundColor: '#6c757d',
    marginBottom: 10,
  },
  cancelButton: {
    // marginTop: 10,
    // marginBottom: 10,
  },
  selectedButton: {
    backgroundColor: '#0056b3',
  },
  textInput: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  textInputError: {
    borderColor: '#FF0000',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: 5,
    fontFamily: Fonts.regular,
  },
  checkBoxContainer: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  checkBox: {
    width: 14,
    height: 14,
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  checkedBox: {
    backgroundColor: Colors.periwinkle,
    borderRadius:10
  },
});

CancelRideModal.propTypes = {
  callCancelRide: PropTypes.func.isRequired,
  modalVisible: PropTypes.bool.isRequired,
  setModalVisible: PropTypes.func.isRequired,
};
