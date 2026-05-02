import { Alert, Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';


export const checkFineLocationPermissions = async () => {
  try {
    let grantedFineLocation = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    console.log("grantedFineLocation",grantedFineLocation)
    return grantedFineLocation;
  } catch (error) {
    console.error('Error checking fine location permissions:', error);
    return false;
  }
}

export const checkNotificationPermissions = async () => {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().hasPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } else {
      // For Android, notification permissions are granted by default for API < 33
      // For API >= 33, we need to check POST_NOTIFICATIONS permission
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        return granted;
      }
      return true;
    }
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

let locationSettingsModalCallback = null;

export const setLocationSettingsModalCallback = (callback) => {
  locationSettingsModalCallback = callback;
};

export const RequestFineLocationPermission = async () => {
  const hasFineLocationPermission = await checkFineLocationPermissions();
  if (hasFineLocationPermission) {
    return true;
  } else {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (result === "never_ask_again") {
      // Show custom modal if callback is set
      if (locationSettingsModalCallback) {
        locationSettingsModalCallback(true);
      }
      // Alert.alert(
      //   'Permission Required','',
      //   [
      //     {
      //       text: "Cancel",
      //       style: "cancel"
      //     },
      //     {
      //       text: "Open Settings",
      //       onPress: () => Linking.openSettings()
      //     }
      //   ]
      // );
      return false
    }

    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
}

export const RequestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    } else {
      // For Android API >= 33, request POST_NOTIFICATIONS permission
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // For older Android versions, notifications are granted by default
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export const RequestAllPermissions = async () => {
  try {
    // Request both location and notification permissions
    const locationPermission = await RequestFineLocationPermission();
    const notificationPermission = await RequestNotificationPermission();
    
    return {
      location: locationPermission,
      notification: notificationPermission
    };
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return {
      location: false,
      notification: false
    };
  }
}


// Background Location Permissions (Android focused)
export const checkBackgroundLocationPermissions = async () => {
  try {
    if (Platform.OS !== 'android') {
      return true;
    }
    if (Platform.Version < 29) {
      // Below Android 10, background access is covered by fine location
      return await checkFineLocationPermissions();
    }
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    );
    return granted;
  } catch (error) {
    console.error('Error checking background location permissions:', error);
    return false;
  }
}

export const RequestBackgroundLocationPermission = async () => {
  try {
    if (Platform.OS !== 'android') {
      return true;
    }

    // Ensure fine location first
    let hasFineLocation = await checkFineLocationPermissions();
    if (!hasFineLocation) {
      const fineResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (fineResult === 'never_ask_again') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to proceed.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      if (fineResult !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Required', 'Please allow location permission to continue.');
        return false;
      }

      hasFineLocation = true;
    }

    if (Platform.Version < 29) {
      // Background location not separately required before Android 10
      return true;
    }

    const hasBackground = await checkBackgroundLocationPermissions();
    if (hasBackground) {
      return true;
    }

    const backgroundResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    );

    if (backgroundResult === 'never_ask_again') {
      Alert.alert(
        'Permission Required',
        'Allow "Location" -> "Allow all the time" in Settings to enable SOS live location.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return false;
    }

    if (backgroundResult !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert('Permission Required', 'Background location is required to use SOS.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting background location permission:', error);
    return false;
  }
}

// System-wide Location Services (GPS) status
export const isSystemLocationEnabled = async () => {
  try {
    const enabled = await DeviceInfo.isLocationEnabled();
    return !!enabled;
  } catch (error) {
    console.error('Error checking system location services:', error);
    // Fail-open to avoid blocking app if API fails
    return true;
  }
}

export const openSystemLocationSettings = async () => {
  try {
    if (Platform.OS === 'android') {
      if (typeof Linking.sendIntent === 'function') {
        await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
        return;
      }
      // Fallback: open app settings if intent unavailable
      await Linking.openSettings();
      return;
    }
    // iOS fallback to app settings
    await Linking.openSettings();
  } catch (error) {
    console.error('Failed to open system location settings', error);
  }
}

export const RequestContactsPermission = async () => {
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
  );

  if (result === "never_ask_again") {
    Alert.alert(
      'Permission Required','',
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Open Settings",
          onPress: () => Linking.openSettings()
        }
      ]
    );
  }
  return result === PermissionsAndroid.RESULTS.GRANTED;


}
export const checkContactsPermission = async () => {
  const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
  return result;
}




