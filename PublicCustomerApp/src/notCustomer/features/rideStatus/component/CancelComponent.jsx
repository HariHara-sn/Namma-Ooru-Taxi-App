import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Fonts } from '../../../constants/constants';
import { useTranslation } from 'react-i18next';
import { TripStatus } from '../types/TripStatus';
import AdaptiveText from '../../../components/Common/AdaptiveText';
const REASONS = {'PENDING':[
  'driver_is_taking_too_long',
  'driver_asked_to_cancel',
  'driver_not_responding',
  'booked_by_mistake',
  'fare_is_too_high_surge',
    'other',
],
'ONGOING': [
  'driver_is_taking_too_long',
  'driver_asked_to_cancel',
  'driver_not_responding',
  'driver_is_rude_or_unprofessional',
  'vehicle_is_not_clean_or_safe',
  'unexpected_route_or_detour',
  'fare_is_too_high_surge',
  'other',
],

}

const getReasons = (rideStatus) => {
  if(rideStatus === TripStatus.PENDING || rideStatus === TripStatus.ACCEPTED){
    return REASONS.PENDING;
  }else if(rideStatus === TripStatus.PICKEDUP){
    return REASONS.ONGOING;
  }
}



const CancelComponent = ({ onClose, onCancel, loading,cancelLoading,rideStatus }) => {
  const [selected, setSelected] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {t} = useTranslation();
  const handleSelect = (reason) => {
    setSelected(reason);
    if (reason !== 'other') {
      setOtherReason('');
    }
  };

  const handleConfirm = async () => {
    if (onCancel) {
      setIsLoading(true);
      
      try {
        if (selected === 'other') {
          if(!otherReason.trim()) {
              Alert.alert(t('please_enter_a_reason'));
              setIsLoading(false);
              return;
          }
          await onCancel(otherReason);
        } else {
          await onCancel(t(selected));
        }
      } catch (error) {
          console.error(t('error'), error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <AdaptiveText style={styles.title}>{t('why_are_you_cancelling_the_trip')}</AdaptiveText>
      <View style={styles.box}>
        <ScrollView>
          {getReasons(rideStatus)?.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={styles.row}
              onPress={() => handleSelect(reason)}
              activeOpacity={0.7}
            >
              <View style={styles.checkboxOuter}>
                {selected === reason && <View style={styles.checkboxInner} />}
              </View>
              <AdaptiveText style={styles.reasonText}>{t(reason)}</AdaptiveText>
            </TouchableOpacity>
          ))}
          {selected === 'other' && (
            <View style={{ marginTop: 8 }}>
              <TextInput
                style={styles.input}
                placeholder={t('enter_your_reason')}
                value={otherReason}
                onChangeText={setOtherReason}
                multiline
              />
            </View>
          )}
        </ScrollView>
      </View>
      <View style={styles.noteBox}>
        <AdaptiveText style={styles.noteText}>{t('no_cancellation_fees_will_be_charged')}</AdaptiveText>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.goBackBtn} onPress={onClose}>
          <AdaptiveText style={styles.goBackText}>{t('go_back')}</AdaptiveText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[  styles.confirmBtn, {opacity: !selected || (selected === 'other' && !otherReason.trim()) || isLoading ? 0.5 : 1}]}
          onPress={handleConfirm}
          disabled={!selected || (selected === 'other' && !otherReason.trim()) || isLoading || cancelLoading || loading}
        >
          {isLoading || cancelLoading || loading ? (
            <ActivityIndicator size="small" color="#ff4d4f" />
          ) : (
            <AdaptiveText style={styles.confirmText}>{t('confirm_cancellation')}</AdaptiveText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    marginBottom: 16,
    textAlign: 'center',
  },
  box: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxOuter: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: '#bbb',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: '#222',
    borderRadius: 3,
  },
  reasonText: {
    fontSize: 15,
    color: '#222',
    fontFamily: Fonts.regular,  
  },
  noteBox: {
    backgroundColor: '#fffbe6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 24,
    alignItems: 'center',
  },
  noteText: {
    color: '#b59f3b',
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goBackBtn: {
    flex: 1,
    backgroundColor: '#101828',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  goBackText: {
    color: '#fff',
    fontFamily: Fonts.medium,
    fontSize: 15,
  },
  confirmBtn: {
    flex: 2,
    borderWidth: 1.5,
    borderColor: '#ff4d4f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  confirmText: {
    color: '#ff4d4f',
    fontFamily: Fonts.medium,
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    minHeight: 40,
    marginTop: 4,
    color: '#222',
    fontFamily: Fonts.regular,
  },
});

export default CancelComponent;
