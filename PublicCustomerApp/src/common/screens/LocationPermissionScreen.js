import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, Linking } from 'react-native';
import LocationPermissionOverlay from '../../notCustomer/components/LocationPermissionOverlay';
import LocationSettingsModal from '../../notCustomer/components/LocationSettingsModal';
import { 
  RequestFineLocationPermission, 
  setLocationSettingsModalCallback 
} from '../../notCustomer/controllers/PermissionHandler';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const LocationPermissionScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    setLocationSettingsModalCallback(setShowSettingsModal);
    return () => setLocationSettingsModalCallback(null);
  }, []);

  const handleEnable = useCallback(async () => {
    const granted = await RequestFineLocationPermission();
    if (granted) {
      navigation.goBack();
    }
  }, [navigation]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={"white"} />
      <LocationPermissionOverlay onEnable={handleEnable} />
      <LocationSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onOpenSettings={handleOpenSettings}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});

export default LocationPermissionScreen;


