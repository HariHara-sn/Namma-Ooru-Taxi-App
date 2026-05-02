import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, SafeAreaView, NativeModules, TextInput, DeviceEventEmitter } from 'react-native';
import PropTypes from 'prop-types';
import { colors, Fonts } from '../../../constants/constants';
import { triggerSOS } from '../../../API/EndPoints/EndPoints';
import { DataStore } from '../../../controllers/DataStore';
import PREF from '../../../storage/PREF';
import useCurrentRideInfoStore from '../store/useCurrentRideInfoStore';
import useAssignedDriverInfoStore from '../store/useAssignedDriverInfoStore';
import useLocationStore from '../../../store/useLocationStore';
import { useEmergencyContactsStore } from '../../emergencyContact/store/useEmergencyContactsStore';
import AdaptiveText from '../../../components/Common/AdaptiveText';

const SOS_COUNTDOWN_SECONDS = 5;

const SOSModal = ({ onClose, presetTriggered = false }) => {
  const { tripId, stops } = useCurrentRideInfoStore();
  const { location } = useLocationStore();
  const contacts = useEmergencyContactsStore ? useEmergencyContactsStore((s) => s.contacts) : [];

  const [secondsLeft, setSecondsLeft] = useState(SOS_COUNTDOWN_SECONDS);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(presetTriggered ? true : false);
  const [sharedSummary, setSharedSummary] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [askReason, setAskReason] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const intervalRef = useRef(null);
  const { driverName, vehicleNumber } = useAssignedDriverInfoStore();

  const coordinates = useMemo(() => {
    // Expecting location format to be { coordinates: [lon, lat] } or [lon, lat]
    if (!location) return null;
    if (Array.isArray(location)) return { lon: location[0], lat: location[1] };
    if (Array.isArray(location?.coordinates)) return { lon: location.coordinates[0], lat: location.coordinates[1] };
    if (location?.lon !== undefined && location?.lat !== undefined) return { lon: location.lon, lat: location.lat };
    return null;
  }, [location]);

  const mapsLink = useMemo(() => {
    if (!coordinates) return null;
    const { lat, lon } = coordinates;
    return Platform.select({
      ios: `http://maps.apple.com/?ll=${lat},${lon}`,
      android: `https://maps.google.com/?q=${lat},${lon}`,
      default: `https://maps.google.com/?q=${lat},${lon}`,
    });
  }, [coordinates]);

  useEffect(() => {
    if (presetTriggered) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          handleFireSOS();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [presetTriggered]);

  useEffect(() => {
    if (!presetTriggered) return;
    // Initialize summary and tracking state without re-triggering
    const pickup = Array.isArray(stops) && stops.length > 0 ? (stops[0]?.name || 'Pickup') : null;
    const destination = Array.isArray(stops) && stops.length > 1 ? (stops[stops.length - 1]?.name || 'Destination') : null;
    setSharedSummary({ pickup, destination, driverName, vehicleNumber, mapsLink, tripId });
    (async () => {
      try {
        if (Platform.OS === 'android' && NativeModules?.LocationTracking?.isRunning) {
          const r = await NativeModules.LocationTracking.isRunning();
          setTracking(!!r);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [presetTriggered, stops, driverName, vehicleNumber, mapsLink, tripId]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('LocationTrackingStopped', () => {
      // Close modal when service emits stop event
      if (onClose) onClose();
    });
    return () => {
      sub.remove();
    };
  }, [onClose]);

  const handleFireSOS = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Call API
      const payload = { tripId , location };
      const response = await triggerSOS(payload);
      if (response?.sosEventId) {
        try { 
          await DataStore.storeData(PREF.SOS_EVENTID, response.sosEventId); 
        } catch (e) {
          console.log('Failed to store SOS event id');
        }
      }

      // Prepare trip/location summary (no SMS intent)
      const pickup = Array.isArray(stops) && stops.length > 0 ? (stops[0]?.name || 'Pickup') : null;
      const destination = Array.isArray(stops) && stops.length > 1 ? (stops[stops.length - 1]?.name || 'Destination') : null;
   

      setSharedSummary({ pickup, destination, driverName, vehicleNumber, mapsLink, tripId });
      setCompleted(true);
      // Start background live tracking after SOS triggers
      try {
        if (Platform.OS === 'android' && NativeModules?.LocationTracking?.start) {
          await NativeModules.LocationTracking.start("", 5000, "");
          setTracking(true);
        }
      } catch (e) {
        // ignore start errors
      }
    } catch (err) {
      // Silent fail; could show a toast if infrastructure exists
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (onClose) onClose();
  };

  const handleCallNow = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    await handleFireSOS();
  };

  const handleCallEmergency = async () => {
    try { await Linking.openURL('tel:112'); } catch (e) {
      // ignore
    }
  };

  const handleStopTracking = async () => {
    setAskReason(true);
  };

  const submitStopWithReason = async () => {
    const finalReason = (reasonText && reasonText.trim()) ? reasonText.trim() : 'Passenger safe at destination';
    const status = 'resolved';
    try {
      if (Platform.OS === 'android' && NativeModules?.LocationTracking?.stopWithPayload) {
        await NativeModules.LocationTracking.stopWithPayload(finalReason, status);
        setTracking(false);
      } else if (Platform.OS === 'android' && NativeModules?.LocationTracking?.stop) {
        await NativeModules.LocationTracking.stop();
        setTracking(false);
      }
    } catch (e) {
      // ignore stop errors
    } finally {
      setAskReason(false);
      onClose()
    }
  };

  const cancelStopReason = () => {
    setAskReason(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {!completed ? (
          <>
            <AdaptiveText style={styles.title}>Emergency SOS</AdaptiveText>
            <AdaptiveText style={styles.subtitle}>Your live location will be shared with your emergency contacts and our support team.</AdaptiveText>
            <View style={styles.timerBox}>
              <AdaptiveText style={styles.timerText}>{secondsLeft}s</AdaptiveText>
              <AdaptiveText style={styles.timerLabel}>Auto triggering in</AdaptiveText>
            </View>
            <View style={styles.actions}>
             
              <TouchableOpacity onPress={handleCallNow} style={[styles.btn, styles.primary]} activeOpacity={0.7}>
                <Text style={[styles.btnText, styles.primaryText]}>Trigger now</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancel} style={[styles.btn, styles.cancel]} activeOpacity={0.7}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detailsBox}>
              {mapsLink && <AdaptiveText style={styles.detail}>Location link will be shared.</AdaptiveText>}
              {Array.isArray(contacts) && contacts.length > 0 ? (
                <AdaptiveText style={styles.detail}>Contacts: {contacts.map((c) => c.name || c.phone).slice(0, 3).join(', ')}{contacts.length > 3 ? '…' : ''}</AdaptiveText>
              ) : (
                <AdaptiveText style={styles.detail}>No emergency contacts added.</AdaptiveText>
              )}
            </View>
          </>
        ) : (
          <>
            <AdaptiveText style={styles.title}>SOS Triggered</AdaptiveText>
            <AdaptiveText style={styles.subtitle}>We shared your live location and trip details with your emergency contacts. Our support team has been notified and will call shortly.</AdaptiveText>
            <View style={styles.summaryBox}>
              {sharedSummary?.tripId && <AdaptiveText style={styles.summaryItem}>Trip ID: {sharedSummary.tripId}</AdaptiveText>}
              {sharedSummary?.pickup && sharedSummary?.destination && (
                <AdaptiveText style={styles.summaryItem}>Trip: {sharedSummary.pickup} → {sharedSummary.destination}</AdaptiveText>
              )}
              {(sharedSummary?.driverName || sharedSummary?.vehicleNumber) && (
                <AdaptiveText style={styles.summaryItem}>Driver: {sharedSummary.driverName || '-'}{sharedSummary.vehicleNumber ? ` • ${sharedSummary.vehicleNumber}` : ''}</AdaptiveText>
              )}
              {/* {sharedSummary?.mapsLink && (
                <TouchableOpacity onPress={() => { if (sharedSummary.mapsLink) Linking.openURL(sharedSummary.mapsLink).catch(()=>{}); }}>
                  <AdaptiveText style={[styles.summaryItem, styles.link]}>Open live location</AdaptiveText>
                </TouchableOpacity>
              )} */}
            </View>
            <View style={styles.actionsAfter}>
              <TouchableOpacity onPress={handleCallEmergency} style={[styles.btn, styles.primary]} activeOpacity={0.7}>
                <Text style={[styles.btnText, styles.primaryText]}>Call Emergency</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStopTracking} style={[styles.btn, styles.cancel]} activeOpacity={0.7}>
                <Text style={styles.btnText}>{tracking ? 'Stop Tracking' : 'Tracking Stopped'}</Text>
              </TouchableOpacity>
            </View>

            {askReason && (
              <View style={styles.reasonOverlay}>
                <View style={styles.reasonCard}>
                  <AdaptiveText style={styles.reasonTitle}>Stop Tracking</AdaptiveText>
                  <AdaptiveText style={styles.reasonSubtitle}>Please share a reason</AdaptiveText>
                  <View style={styles.quickRow}>
                    <TouchableOpacity style={styles.quickBtn} onPress={()=>setReasonText('Mistakenly pressed')}>
                      <Text style={styles.quickBtnText}>Mistakenly pressed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickBtn} onPress={()=>setReasonText('Passenger safe at destination')}>
                      <Text style={styles.quickBtnText}>Safe at destination</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    value={reasonText}
                    onChangeText={setReasonText}
                    placeholder="Type your reason"
                    style={styles.reasonInput}
                    placeholderTextColor={colors.grey_xxdark}
                    multiline
                  />
                  <View style={styles.reasonActions}>
                    <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={cancelStopReason}>
                      <Text style={styles.btnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.primary]} onPress={submitStopWithReason}>
                      <Text style={[styles.btnText, styles.primaryText]}>Submit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

SOSModal.propTypes = {
  onClose: PropTypes.func,
  presetTriggered: PropTypes.bool,
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flex: 1,
    justifyContent: 'center',
  },
  summaryBox: {
    marginTop: 12,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  summaryItem: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.grey_xxdark,
    marginTop: 6,
    textAlign: 'center',
  },
  link: {
    color: '#2563EB',
  },
  title: {
    fontFamily: Fonts.medium,
    fontSize: 18,
    color: colors.black,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.grey_xxdark,
    textAlign: 'center',
    marginTop: 6,
  },
  timerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  timerText: {
    fontFamily: Fonts.medium,
    fontSize: 36,
    color: colors.orange,
  },
  timerLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: colors.grey_xxdark,
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 12,
   
  },
  actionsAfter: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  btn: {
    
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    backgroundColor: colors.grey,
  },
  primary: {
    backgroundColor: '#e11d48',
  },
  btnText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: colors.black,
  },
  primaryText: {
    color: colors.white,
  },
  detailsBox: {
    marginTop: 16,
  },
  detail: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: colors.grey_xxdark,
    textAlign: 'center',
  },
  reasonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  reasonCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  reasonTitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.black,
    textAlign: 'center',
  },
  reasonSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: colors.grey_xxdark,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.grey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: colors.black,
  },
  reasonInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.grey_xxdark,
    borderRadius: 8,
    padding: 10,
    color: colors.black,
    textAlignVertical: 'top',
    backgroundColor: 'white',
  },
  reasonActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
});

export default SOSModal;


