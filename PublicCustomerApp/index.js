/**
 * @format
 */

import {AppRegistry, LogBox} from 'react-native';
import './src/shim';
import App from './App';
import {name as appName} from './app.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Removed early user stats prefetch; will run after login

AppRegistry.registerComponent(appName, () => App);

// Persist overlay payload from headless task (cold start safe)
const OVERLAY_PAYLOAD_KEY = 'overlay_last_payload';
AppRegistry.registerHeadlessTask('OverlayPayloadTask', () => async (data) => {
  try {
    const json = data?.payload || '{}';
    await AsyncStorage.setItem(OVERLAY_PAYLOAD_KEY, json);
  } catch {}
});

// LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs();
