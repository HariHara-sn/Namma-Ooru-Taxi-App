import RNPermissions, { PERMISSIONS, requestMultiple, RESULTS, checkNotifications, requestNotifications, request, checkLocationAccuracy, check } from 'react-native-permissions';
import { Alert, Linking, NativeModules, Platform } from 'react-native';
import { PermissionsAndroid } from 'react-native';
const { OverlayModule } = NativeModules;

export const CheckNotificationPermissions = async () => {
  try {
    let grantedPostNotifications = await checkNotifications();
    grantedPostNotifications = grantedPostNotifications?.status;
    
    if (Platform.OS === 'android') {
      return grantedPostNotifications === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      return grantedPostNotifications === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

export const checkFineLocationPermissions = async () => {
  if (Platform.OS === 'android') {
  try {
    const grantedFineLocation = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    return grantedFineLocation;
  } catch (error) {
    console.error('Error checking fine location permissions:', error);
    return false;
  }
} else {
 const hasLocationAccuracy = await checkLocationAccuracy()
  if (hasLocationAccuracy) {
    return true;
  } else {
    return false;
  }
}
}

export const checkBackgroundLocationPermissions = async () => {
  if (Platform.OS === 'android') {
  try {
    const grantedBackgroundLocation = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION);
    return grantedBackgroundLocation;
  } catch (error) {
    console.error('Error checking background location permissions:', error);
    return false;
  }
} else {
  const hasLocationAccuracy = await check(PERMISSIONS.IOS.LOCATION_ALWAYS)
  if (hasLocationAccuracy) {
    return true;
  } else {
    return false;
  }
}
}

const fgServiceLocationPermission = PermissionsAndroid.PERMISSIONS?.FOREGROUND_SERVICE_LOCATION;

const isFgServiceLocationRuntimePermissionSupported = Platform.OS === 'android' && Platform.Version >= 34 && !!fgServiceLocationPermission;

export const checkForegroundServiceLocationPermission = async () => {
  if (!isFgServiceLocationRuntimePermissionSupported) return true;
  try {
    return await PermissionsAndroid.check(fgServiceLocationPermission);
  } catch (error) {
    console.error('Error checking foreground service location permission:', error);
    return false;
  }
};

export const RequestForegroundServiceLocationPermission = async (translation) => {
  if (!isFgServiceLocationRuntimePermissionSupported) return true;

  const hasPermission = await checkForegroundServiceLocationPermission();
  if (hasPermission) return true;

  try {
    const result = await PermissionsAndroid.request(fgServiceLocationPermission);

    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN || result === 'never_ask_again') {
      Alert.alert(
        translation?.['perm_required'] ?? 'Permission required',
        translation?.perm_help_info ?? 'Enable permissions from settings to continue',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }

    return false;
  } catch (error) {
    console.error('Error requesting foreground service location permission:', error);
    return false;
  }
};

export const checkUsageStatsPermission = async () => {
  // if (Platform.OS === 'android') {
  //   const { UsageStats } = NativeModules;
  //   const granted = await UsageStats.checkUsagePermission();
  //   return granted;
  // } else {
  //   return false;
  // }
}

export const checkAccessibilityPermission = async () => {
  // if (Platform.OS === 'android') {
  //   const { AccessibilityBlocker } = NativeModules;
  //   const granted = await AccessibilityBlocker.isServiceEnabled();
  //   return granted;
  // } else {
  //   return false;
  // }
}

export const checkActivityRecogitionPermissions = async () => {
  if (Platform.OS === 'android') {
  try {
    const grantedActivityRecognition = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION);
    return grantedActivityRecognition;
  } catch (error) {
    console.error('Error checking activity recognition permissions:', error);
    return false;
  }
} else {
  const result = await check(PERMISSIONS.IOS.MOTION);
  if (result === 'granted') {
    return true;
  } else {
    return false;
  }
}
}

export const checkDeviceContactPermissions = async () => {
  if (Platform.OS === 'android') {
  try {
    const grantedContactRecognition = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
    return grantedContactRecognition;
  } catch (error) {
    console.error('Error checking Contact permissions:', error);
    return false;
    }
}
}

export const RequestBackgroundLocationPermission = async (translation) => {// translation is the obj passed to function for translation method
  if (Platform.OS === 'android') {
  const hasBackgroundLocationPermission = await checkBackgroundLocationPermissions()
  if (hasBackgroundLocationPermission) {
    const hasFgServicePermission = await RequestForegroundServiceLocationPermission(translation);
    return hasFgServicePermission;
  } else {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    )

    if (result === "never_ask_again") {
        Alert.alert(
          'Permission Required',
          'Enable permissions from settings to continue',
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
      return false
    }
    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      const hasFgServicePermission = await RequestForegroundServiceLocationPermission(translation);
      return hasFgServicePermission;
    }
    return false;
  }
} else {
  await request(PERMISSIONS.IOS.LOCATION_ALWAYS).then((accuracy) => {
    if (accuracy === 'granted') {
      return true;
    } else {
      Alert.alert(
        translation['perm_required'],
        translation.perm_help_info,
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
      return false;
    }
  })
}}

export const RequestFineLocationPermission = async (translation) => { // translation is the obj passed to function for translation method
  if (Platform.OS === 'android') {
  const hasFineLocationPermission = await checkFineLocationPermissions()
  if (hasFineLocationPermission) {
    const hasFgServicePermission = await RequestForegroundServiceLocationPermission(translation);
    return hasFgServicePermission;
  } else {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (result === "never_ask_again") {
      Alert.alert(
        'Permission Required',
        'Enable permissions from settings to continue',
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
      return false
    }

    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      const hasFgServicePermission = await RequestForegroundServiceLocationPermission(translation);
      return hasFgServicePermission;
    }

    return false;
  }
} else {
  await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE).then((accuracy) => {
    console.log(accuracy,"accuracy")
    if (accuracy === 'granted') {
      return true;
    } else {
      Alert.alert(
        translation['perm_required'],
        translation.perm_help_info,
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
      return false;
    }
  })
    }
}

export const RequestActivityPermission = async () => {
  const hasActivityRecognitionPermission = await checkActivityRecogitionPermissions()
  console.log(hasActivityRecognitionPermission,"hasActivityRecognitionPermission")
  if (Platform.OS === 'android') {
    if (hasActivityRecognitionPermission) {
      return true;
    } else  {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  } else {
    const result = await RNPermissions.request(PERMISSIONS.IOS.MOTION);
    console.log(result,"result")
    if (result === 'unavailable') {
      Alert.alert(
        'Motion is unavailable',
        'Motion is not available on this device',
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Okay",
            // onPress: () => Linking.openSettings()
          }
        ]
      );
      return false;
    } else {
      return false;
    }
  }
}

export const RequestNotificationPermission = async (translation) => {
  const hasNotificationPermission = await CheckNotificationPermissions()
  if (hasNotificationPermission) return true;
  else {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const grantedPostNotifications = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        
      );

      if (grantedPostNotifications === "never_ask_again") {
        Alert.alert(
          "Permission Required",
          "Enable permissions from settings to continue",
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
        return false
      }
      return grantedPostNotifications === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      Alert.alert(
        translation['perm_required'],
        translation.perm_help_info,
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
      return false;
    }}
    else {
       await requestNotifications(
         ['alert', 'sound','badge',]
    ).then(({status, settings}) => {
      if (status === 'blocked') {
        Alert.alert(
          translation['perm_required'],
          translation.perm_help_info,
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
        return false;
      }
    });

    }
  }
}

export const RequestDeviceContactPermission = async () => {// translation is the obj passed to function for translation method

  const hasDeviceContactPermission = await checkDeviceContactPermissions()
  if (hasDeviceContactPermission) {
    return true;
  } else {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    )
    if (result === "never_ask_again") {
        Alert.alert(
          'je',
          'translation.perm_help_info',
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
      return false
    }
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
}

export const checkCameraPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const grantedCamera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      return grantedCamera;
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  } else {
    const permissions = [PERMISSIONS.IOS.CAMERA];
    const statuses = await requestMultiple(permissions);
    return statuses[permissions[0]] === RESULTS.GRANTED;
  }
};

export const RequestCameraPermission = async (translation) => {
    const hasCameraPermission = await checkCameraPermission()
  if (hasCameraPermission) {
    return true;
  } else {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      if (result === "never_ask_again") {
        Alert.alert(
          'Camer Permission Required',
          'Camera permission is required to use camera features. Please enable it from settings. To Upload Documents',
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
        return false;
      }
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const result = await request(PERMISSIONS.IOS.CAMERA)
      return result === RESULTS.GRANTED;
    }
  }
}

export const RequestUsageStatsPermission = async () => {
  if (Platform.OS === 'android') {
  const hasUsageStatsPermission = await checkUsageStatsPermission()
  if (hasUsageStatsPermission) return true;
  else {
    const { UsageStats } = NativeModules;
    const result = await UsageStats.openUsageSettings()
    return result;
  }
} else {
  return false;
}
}

export const RequestAccessibilityPermission = async () => {
  if (Platform.OS === 'android') {
    const hasAccessibilityPermission = await checkAccessibilityPermission()
    if (hasAccessibilityPermission) return true;
    else {
      const { AccessibilityBlocker } = NativeModules;
      const result = await AccessibilityBlocker.openAccessibilitySettings()
      return result;
    }
  } else {
    return false;
  }
}

export const ensureOverlayPermission = async () => {
  if (Platform.OS !== 'android') return false;
  try {
    if (!OverlayModule || typeof OverlayModule.canDrawOverlays !== 'function') {
      // Overlay permission check not accessible on this device
      return false;
    }
    const okay = await OverlayModule.canDrawOverlays();
    return okay;
  } catch (e) {
    console.warn('ensureOverlayPermission: overlay check failed', e);
    return false;
  }
}

export const openOverLaySettings = async () => {
  if (!OverlayModule || typeof OverlayModule.openOverlaySettings !== 'function') {
    console.warn('OverlayModule.openOverlaySettings is not available');
    return false;
  }

  const result = OverlayModule.openOverlaySettings();
  if (result instanceof Promise) {
    await result;
  }
  return true;
}

export const checkOverlayPermission = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    return await OverlayModule.canDrawOverlays();
  } catch (error) {
    console.error('Error checking overlay permission:', error);
    return false;
  }
}

// Returns whether overlay permission can be checked on this device
export const isOverlayCheckAccessible = () => {
  if (Platform.OS !== 'android') return false;
  try {
    return !!(OverlayModule && typeof OverlayModule.canDrawOverlays === 'function');
  } catch (e) {
    return false;
  }
}
