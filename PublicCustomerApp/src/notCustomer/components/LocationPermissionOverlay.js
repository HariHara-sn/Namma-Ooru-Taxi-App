import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import PermissionImage from '../assets/image/permissionImage.svg';
import { Fonts } from '../constants/constants';
// import { height, width } from '../utils/Utils';

const LocationPermissionOverlay = ({ onEnable, title, description, primaryButtonLabel }) => {
  const { t } = useTranslation();

  const openSettings = async () => {
    Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <PermissionImage width="100%" height="100%" />
        </View>

        <Text style={styles.title}>
          {title || t('location_permission_required', 'Location permission required')}
        </Text>

        <Text style={styles.description}>
          {description ||
            t(
              'enable_location_to_continue',
              'Please enable location permission to continue.'
            )}
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={onEnable}>
          <Text style={styles.primaryButtonText}>
            {primaryButtonLabel || t('enable_permission', 'Enable permission')}
          </Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.secondaryButton} onPress={openSettings}>
          <Text style={styles.secondaryButtonText}>
            {t('open_settings', 'Open settings')}
          </Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

LocationPermissionOverlay.propTypes = {
  onEnable: PropTypes.func.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  primaryButtonLabel: PropTypes.string,
};

LocationPermissionOverlay.defaultProps = {
  title: undefined,
  description: undefined,
  primaryButtonLabel: undefined,
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: 320,
  },
  iconContainer: {
   width: 500,
   height: 300,
   alignItems: "center",
   justifyContent: "center",
   marginBottom: 16, 
  },
  title: {
    fontSize: 22,
  
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: Fonts.bold,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: 'Outfit-Regular',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 180,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Outfit-SemiBold',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Outfit-SemiBold',
  },
});

export default LocationPermissionOverlay;


