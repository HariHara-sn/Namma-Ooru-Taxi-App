import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Linking, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { DataStore } from '../controllers/DataStore';
import { Platform } from 'react-native';
import useConfigStore from '../store/useConfigStore';
import AppUpdate from "../assets/image/app_update.webp"
import { colors, Fonts } from '../constants/constants';
import { useTranslation } from 'react-i18next';
export default function UpdateOverlay({ visible, mode, onClose }) {
  if (!visible) return null;
  const { appConfig } = useConfigStore();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      const storeUrl = Platform.select({
        android: appConfig.appLink?.android,
        ios: appConfig.appLink?.ios,
      });
      
      if (!storeUrl) {
        console.error('Store URL not found');
        return;
      }

      await Linking.openURL(storeUrl);
    } catch (error) {
      console.error('Error opening store:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setIsLoading(true);
      await DataStore.storeData('updateSkipDate', new Date().toISOString());
      onClose();
    } catch (error) {
      console.error('Error skipping update:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Image source={AppUpdate} style={styles.image} />
          <Text style={styles.title}>{t('update.title', { defaultValue: 'App Update Available' })}</Text>
          <Text style={styles.message}>
            {t('update.message', { defaultValue: 'A newer version of the app is available. Please update for the best experience.' })}
            {mode === 'force' && `\n\n${t('update.required', { defaultValue: 'This update is required to continue using the app.' })}`}
          </Text>

          <TouchableOpacity 
            onPress={handleUpdate} 
            style={[styles.updateButton, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>{t('update.update_now', { defaultValue: 'Update Now' })}</Text>
            )}
          </TouchableOpacity>

          {/* {mode === 'optional' && (
            <TouchableOpacity 
              onPress={handleSkip} 
              style={[styles.skipButton, isLoading && styles.buttonDisabled]}
              disabled={isLoading}
            >
              <Text style={styles.skipButtonText}>{t('skip_for_now', { defaultValue: 'Skip for now' })}</Text>
            </TouchableOpacity>
          )} */}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 0,
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: '100%',
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily:Fonts.medium,
    marginBottom: 12,
    color: '#000',
  },
  message: {
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
    fontSize: 14,
    fontFamily:Fonts.regular,
    lineHeight: 20,
  },
  updateButton: {
    backgroundColor: colors.black,
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontFamily:Fonts.bold,
    fontSize: 16,
  },
  skipButton: {
    marginTop: 16,
    padding: 8,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 14,
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginBottom: 16,
    alignSelf: 'center',
    marginBottom: 30,
  },
});

