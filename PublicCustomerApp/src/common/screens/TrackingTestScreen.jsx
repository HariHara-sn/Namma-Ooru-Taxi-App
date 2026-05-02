import React, { useCallback, useState } from 'react';
import { View, Button, Alert, StyleSheet, Text } from 'react-native';
import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

const { LocationTracking } = NativeModules;

async function ensurePerms() {
  if (Platform.OS !== 'android') return true;

  const perms = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ];
  if (Platform.Version >= 29) {
    perms.push(PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION);
  }
  if (Platform.Version >= 33) {
    perms.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  const res = await PermissionsAndroid.requestMultiple(perms);
  return Object.values(res).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
}

export default function TrackingTestScreen() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  const startTracking = useCallback(async () => {
    try {
      setBusy(true);
      const ok = await ensurePerms();
      if (!ok) throw new Error('Location/notification permissions denied');
    
      const intervalMs = 5000;
      // apiUrl and headersJson can be empty; service will default to SOS tracking endpoint
      await LocationTracking.start("", intervalMs, "");
      Alert.alert('Tracking', 'Started');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to start');
    } finally {
      setBusy(false);
    }
  }, []);

  const stopTracking = useCallback(async () => {
    try {
      setBusy(true);
      await LocationTracking.stop();
      Alert.alert('Tracking', 'Stopped');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to stop');
    } finally {
      setBusy(false);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const running = await LocationTracking.isRunning();
      setStatus(running ? 'Running' : 'Stopped');
      Alert.alert('Tracking Status', running ? 'Running' : 'Stopped');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to get status');
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Tracking Test</Text>
      {status != null && <Text style={styles.subtitle}>Status: {status}</Text>}
      <View style={styles.buttonRow}>
        <Button title="Start Tracking" onPress={startTracking} disabled={busy} />
      </View>
      <View style={styles.buttonRow}>
        <Button title="Stop Tracking" onPress={stopTracking} disabled={busy} />
      </View>
      <View style={styles.buttonRow}>
        <Button title="Check Status" onPress={checkStatus} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 18, marginBottom: 24 },
  subtitle: { fontSize: 14, marginBottom: 12 },
  buttonRow: { width: '100%', marginVertical: 8 },
});


