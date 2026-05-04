import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, Fonts } from '../constants/constants';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const LocationSettingsModal = ({ visible, onClose, onOpenSettings }) => {
  const { t } = useTranslation();

  const steps = Platform.select({
    android: [
      t('go_to_app_settings', 'Go to App Settings'),
      t('tap_permissions', 'Tap Permissions'),
      t('enable_location', 'Enable Location permission'),
    ],
    ios: [
      t('go_to_settings', 'Go to Settings'),
      t('tap_app_name', 'Tap on our app name'),
      t('tap_location', 'Tap Location'),
      t('choose_always_or_while_using', 'Choose "Always" or "While Using App"'),
    ],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('enable_location_steps', 'How to enable location')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.font_black} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.openSettingsButton}
            onPress={onOpenSettings}
          >
            <Text style={styles.buttonText}>{t('open_settings', 'Open Settings')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: colors.font_black,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: colors.font_black,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: colors.font_black,
  },
  openSettingsButton: {
    backgroundColor: colors.yellow,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: colors.font_black,
  },
});

export default LocationSettingsModal;

