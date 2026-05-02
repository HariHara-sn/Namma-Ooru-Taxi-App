import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Image, ScrollView } from 'react-native';
import AdaptiveText from './Common/AdaptiveText';
import { Fonts } from '../constants/constants';
import TripMetaInfo from '../features/rideHistory/components/TripMetaInfo';
import TripPersonVehicle from '../features/rideHistory/components/TripPersonVehicle';
import { utils } from '../utils/Utils';
import { DataStore } from '../controllers/DataStore';
import PropTypes from 'prop-types';
import { passengerPaymentIssues } from '../API/EndPoints/EndPoints';
import { useStackScreenStore } from '../store/useStackScreenStore';
import PREF from '../storage/PREF';
import useUserInfoStore from '../../common/store/useUserInfoStore';

const PRESET_MESSAGES = [
  'Yes, I paid the driver in cash',
  'Yes, I paid the driver via UPI',
  'I have paid using Razorpay',
];
const BOTTOM_BAR_HEIGHT = 90;

// Use global util for date-time formatting

const line = v => (v ? v : '—');


const formatMoney = (value, currency = '₹') => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${currency} ${n.toFixed(2)}`;
};

const formatDistance = value => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(1)} km`;
};

const formatDuration = mins => {
  const n = Number(mins);
  if (!Number.isFinite(n)) return '—';
  if (n >= 60) {
    const h = Math.floor(n / 60);
    const m = Math.round(n % 60);
    return `${h}h ${m}m`;
  }
  return `${Math.round(n)} mins`;
};

const DroppedButPaymentPendingLongtime = ({
  visible,
  onClose,
  onSubmit,
  trip,
  driver,
  vehicle,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const { reset } = useStackScreenStore();
  const { setActiveTripId } = useUserInfoStore();

  useEffect(() => {
    if (!visible) {
      setSubmitting(false);
      setMessage('');
    }
  }, [visible]);

  const dropInfo = useMemo(() => {
    const stops = trip?.stops || [];
    const last = stops[stops.length - 1] || {};
    const locationName = last.name || last.title || last.address || last.placeName || '';
    const droppedAt = last.updatedAt || trip?.droppedAt || trip?.completedAt || '';
    return { locationName, droppedAt };
  }, [trip]);

  const driverLine = useMemo(() => {
    const name = driver?.name || driver?.driverName || driver?.driver?.name || '';
    return line(name);
  }, [driver]);

  const vehicleLine = useMemo(() => {
    const plate = vehicle?.plate || vehicle?.registrationNumber || vehicle?.regNo || vehicle?.number || '';
    const model = vehicle?.model || vehicle?.makeModel || vehicle?.make || '';
    const joined = [model, plate].filter(Boolean).join(' • ');
    return line(joined);
  }, [vehicle]);

  const fareAmount = useMemo(() => {
    return trip?.fareDetails?.fare ?? trip?.estimatedFare ?? null;
  }, [trip]);

  const totalDistance = useMemo(() => {
    return trip?.finalDistance ?? trip?.estimatedDistance ?? null;
  }, [trip]);

  const totalDuration = useMemo(() => {
    return trip?.finalDuration ?? trip?.estimatedDuration ?? null;
  }, [trip]);

  const handleClose = () => {
    if (submitting) return;
    onClose && onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const body = {
        tripId: trip?._id,
        passengerIssues: message.trim(),
      };
      const response = await passengerPaymentIssues(body);
      console.log('passengerPaymentIssues response:', response);
      if (response?.success) {
        await DataStore.clearData(PREF.CURRENT_TRIP);
        setActiveTripId(null);
        reset();
        onSubmit && onSubmit();
        
      }
      
    } catch (e) {
      // Optionally handle error with a toast
    } finally {
      setSubmitting(false);
    }
  };

  const applyPreset = text => {
    setMessage(text);
  };

  const formatDate = (timestamp) => utils.formatDateAndTime(timestamp);

  const driverDetailsForCard = useMemo(() => ({
    driverName: driver?.driverName || driver?.name || driver?.driver?.name || '',
    driverPhoto: driver?.driverPhoto || driver?.photo || driver?.driver?.photo || '',
    vehicleType: driver?.vehicleType || vehicle?.vehicleType || vehicle?.type || '',
    vehicleBrand: driver?.vehicleBrand || vehicle?.vehicleBrand || vehicle?.brand || vehicle?.make || '',
    vehicleModel: driver?.vehicleModel || vehicle?.vehicleModel || vehicle?.model || vehicle?.makeModel || '',
    vehicleNumber: driver?.vehicleNumber || vehicle?.registrationNumber || vehicle?.regNo || vehicle?.number || '',
  }), [driver, vehicle]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={{ paddingBottom: BOTTOM_BAR_HEIGHT + 24 }}>
          

            <AdaptiveText style={styles.title}>Payment Pending</AdaptiveText>
          
            <View style={{ marginTop: 5, marginBottom: 25 }}>
              <TripPersonVehicle
                driverName={driverDetailsForCard.driverName}
                driverPhoto={driverDetailsForCard.driverPhoto}
                vehicleType={driverDetailsForCard.vehicleType}
                vehicleBrand={driverDetailsForCard.vehicleBrand}
                vehicleModel={driverDetailsForCard.vehicleModel}
                vehicleNumber={driverDetailsForCard.vehicleNumber}
              />
            </View>
         
             <Text style={styles.message}>
              You dropped at {line(dropInfo.locationName)} on {line(formatDate(dropInfo.droppedAt))}.
            </Text>
            
            <Text style={[styles.message, { marginTop: 8 }]}>
              Payment status not updated yet. If there are any issues, please describe below.
            </Text>

            <TextInput
              style={styles.input}
              multiline
              editable={!submitting}
              placeholder="Type your note here"
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              maxLength={250}
            />

            <View style={styles.presetWrap}>
              {PRESET_MESSAGES.map(txt => (
                <TouchableOpacity
                  key={txt}
                  style={styles.presetChip}
                  onPress={() => applyPreset(txt)}
                  disabled={submitting}
                >
                  <Text style={styles.presetText}>{txt}</Text>
                </TouchableOpacity>
              ))}
            </View>

               <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Fare</Text>
                <Text style={styles.statValue}>{formatMoney(fareAmount)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{formatDistance(totalDistance)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{formatDuration(totalDuration)}</Text>
              </View>
            </View>

            {submitting && (
              <View style={styles.loaderRow}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loaderText}>Submitting…</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.bottomBar}>
            <View style={styles.buttons}>
              <TouchableOpacity style={[styles.btn, submitting && styles.btnDisabled]} onPress={handleClose} disabled={submitting}>
                <AdaptiveText style={styles.btnText}>Close</AdaptiveText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <AdaptiveText style={styles.primaryBtnText}>Submit</AdaptiveText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 0,
    padding: 16,
  },
  headerImage: {
    alignSelf: 'center',
    width: 220,
    height: 220,
  },
  title: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontFamily: Fonts.regular,
    width: '90%',
    textAlign: 'center',
    alignSelf: 'center',
 
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    borderTopColor: '#f0f0f0ff',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: Fonts.medium,
  },
  statValue: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: '#111',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailKey: {
    fontFamily: Fonts.medium,
    color: '#666',
  },
  detailValue: {
    fontFamily: Fonts.medium,
    color: '#000',
    maxWidth: '60%',
    textAlign: 'right',
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  loaderText: {
    marginLeft: 8,
    color: '#007AFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#000',
    marginTop: 15,
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetText: {
    fontSize: 12,
    color: '#111',
  },
  buttons: {
    gap: 10,
    marginTop: 14,
    flexDirection: 'row',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    height: BOTTOM_BAR_HEIGHT,
  },
  btn: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: 'black',
  },
  primaryBtn: {
    backgroundColor: '#000000ff',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1,
  },
  primaryBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: 'white',
  },
});

DroppedButPaymentPendingLongtime.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  trip: PropTypes.object,
  driver: PropTypes.object,
  vehicle: PropTypes.object,
};

export default DroppedButPaymentPendingLongtime;
