/* eslint-disable react/react-in-jsx-scope */
import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  BackHandler,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import useTripsStore from '../../notdriver/store/useTripsStore';
import { DataStore } from '../controllers/DataStore';
import { Colors, Fonts } from '../constants/constants';



const compareVersions = (currentVersion = '', targetVersion = '') => {
  const currentParts = String(currentVersion)
    .split('.')
    .map(part => parseInt(part, 10) || 0);
  const targetParts = String(targetVersion)
    .split('.')
    .map(part => parseInt(part, 10) || 0);
  const maxLength = Math.max(currentParts.length, targetParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const current = currentParts[index] || 0;
    const target = targetParts[index] || 0;
    if (current > target) {
      return 1;
    }
    if (current < target) {
      return -1;
    }
  }
  return 0;
};

const parseConfigBoolean = value => {
  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true';
  }
  return Boolean(value);
};

const AppUpdateChecker = () => {
  const {driverConfig} = useTripsStore();
  const [showForceUpdateModal, setShowForceUpdateModal] = useState(false);
  const [requiredAppVersion, setRequiredAppVersion] = useState(null);

  const currentAppVersion = useMemo(() => DeviceInfo.getVersion?.() || '0.0.0', []);

  useEffect(() => {
    let isMounted = true;

    const evaluateForceUpdate = async () => {
      try {
        const tripIdData = await DataStore.loadData('activeTripId');
        if (!isMounted) {
          return;
        }

        if (tripIdData?.data) {
          setShowForceUpdateModal(false);
          setRequiredAppVersion(null);
          return;
        }

        if (!driverConfig) {
          setShowForceUpdateModal(false);
          setRequiredAppVersion(null);
          return;
        }

        const immediateFlagValues = [
          driverConfig?.IMMEDIATE_UPDATE_REQUIRED,
          driverConfig?.IMMEDIATE_UPDATE,
          driverConfig?.FORCE_UPDATE,
          driverConfig?.IS_IMMEDIATE_UPDATE_REQUIRED,
          driverConfig?.FORCE_UPDATE_REQUIRED,
          driverConfig?.forceUpdate,
          driverConfig?.immediateUpdateRequired,
        ];
        const immediateFlag = immediateFlagValues.some(value => parseConfigBoolean(value));

        const targetVersion =
          driverConfig?.FORCE_UPDATE_VERSION ||
          driverConfig?.IMMEDIATE_UPDATE_VERSION ||
          driverConfig?.MIN_SUPPORTED_VERSION ||
          driverConfig?.MIN_VERSION ||
          driverConfig?.MINIMUM_SUPPORTED_VERSION;

        const normalizedTargetVersion = targetVersion ? String(targetVersion) : null;

        if (!immediateFlag || !normalizedTargetVersion) {
          setShowForceUpdateModal(false);
          setRequiredAppVersion(null);
          return;
        }

        if (compareVersions(currentAppVersion, normalizedTargetVersion) < 0) {
          setRequiredAppVersion(normalizedTargetVersion);
          setShowForceUpdateModal(true);
        } else {
          setShowForceUpdateModal(false);
          setRequiredAppVersion(null);
        }
      } catch (error) {
        console.log('[AppUpdateChecker] Failed to evaluate force update', error);
        setShowForceUpdateModal(false);
        setRequiredAppVersion(null);
      }
    };

    evaluateForceUpdate();

    return () => {
      isMounted = false;
    };
  }, [driverConfig, currentAppVersion]);

  useEffect(() => {
    if (!showForceUpdateModal) {
      return;
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, [showForceUpdateModal]);

  const handleForceUpdatePress = useCallback(async () => {
    try {
      const bundleId = DeviceInfo.getBundleId?.();
      if (Platform.OS === 'android') {
        const configuredUrl =
          driverConfig?.PLAYSTORE_URL ||
          driverConfig?.PLAY_STORE_URL ||
          driverConfig?.UPDATE_URL;
        const marketUrl = configuredUrl || (bundleId ? `market://details?id=${bundleId}` : null);
        const webFallbackUrl =
          driverConfig?.PLAYSTORE_WEB_URL ||
          (bundleId ? `https://play.google.com/store/apps/details?id=${bundleId}` : null);

        if (marketUrl) {
          try {
            const canOpenMarket = await Linking.canOpenURL(marketUrl);
            if (canOpenMarket) {
              await Linking.openURL(marketUrl);
              return;
            }
          } catch (marketError) {
            console.log('[AppUpdateChecker] Error opening market URL', marketError);
          }
        }

        if (webFallbackUrl) {
          try {
            await Linking.openURL(webFallbackUrl);
            return;
          } catch (webError) {
            console.log('[AppUpdateChecker] Error opening web fallback', webError);
          }
        }

        Alert.alert('Update Required', 'Unable to open the Play Store. Please update the app manually.');
        return;
      }

      const iosUrl =
        driverConfig?.APP_STORE_URL ||
        driverConfig?.APPSTORE_URL ||
        driverConfig?.UPDATE_URL;
      if (iosUrl) {
        try {
          await Linking.openURL(iosUrl);
          return;
        } catch (iosError) {
          console.log('[AppUpdateChecker] Error opening App Store URL', iosError);
        }
      }

      Alert.alert('Update Required', 'Please open the App Store and update the app to continue.');
    } catch (error) {
      console.log('[AppUpdateChecker] Unexpected error navigating to store', error);
      Alert.alert('Update Required', 'Please update the app to continue.');
    }
  }, [driverConfig]);

  if (!showForceUpdateModal) {
    return null;
  }

  return (
    <>
  
    <Modal
      visible={showForceUpdateModal}
      animationType="fade"
      transparent
      onRequestClose={() => {}}
    >
      <View style={styles.forceUpdateOverlay}>
        <View style={styles.forceUpdateContainer}>
          <Text style={styles.forceUpdateTitle}>Update Required</Text>
          <Text style={styles.forceUpdateMessage}>
            A newer version of the app is available. Please update to continue.
          </Text>
          {requiredAppVersion && (
            <Text style={styles.forceUpdateVersion}>
              {`Current ${currentAppVersion} → Required ${requiredAppVersion}`}
            </Text>
          )}
          <TouchableOpacity
            style={styles.forceUpdateButton}
            accessibilityRole="button"
            accessibilityLabel="Update Now"
            onPress={handleForceUpdatePress}
          >
            <Text style={styles.forceUpdateButtonText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
      </>
  );
};

export default AppUpdateChecker;

const styles = StyleSheet.create({
  forceUpdateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forceUpdateContainer: {
    backgroundColor: Colors.white,
    width: '85%',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  forceUpdateTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 20,
    color: Colors.black,
    marginBottom: 12,
  },
  forceUpdateMessage: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.grey_dark,
    textAlign: 'center',
    marginBottom: 16,
  },
  forceUpdateVersion: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: Colors.grey_dark,
    marginBottom: 24,
  },
  forceUpdateButton: {
    backgroundColor: Colors.periwinkle,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },
  forceUpdateButtonText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: Colors.white,
  },
});