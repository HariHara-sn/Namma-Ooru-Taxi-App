import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Image } from 'react-native';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { DataStore } from '../../../notCustomer/controllers/DataStore';
import { useStackScreenStore } from '../../../notCustomer/store/useStackScreenStore';
import SOS from '../../../notCustomer/assets/image/SOS.webp';
import { Fonts } from '../../../notCustomer/constants/constants';

export default function EmergencyContactScreenOverlay({ onClose }) {
  const { t } = useTranslation();
  const { setStackScreen } = useStackScreenStore();
  const [isProcessing, setIsProcessing] = useState(false);


  const storeViewdEmergencyContactScreen = async () => {
    try {
      await DataStore.storeData('emergency_contact', true);
    } catch (e) {
      console.warn('Failed to store emergency contact viewed status', e);
    } 
  }

  const saveAndProceed = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      await storeViewdEmergencyContactScreen();
      onClose();
      setStackScreen('EmergencyScreen');
    } catch (e) {
      console.warn('Failed to save emergency contact', e);
      Alert.alert(t('error'), e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const skipAndProceed = async () => {
    if (isProcessing) return;
    try {
   
      await storeViewdEmergencyContactScreen();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
       
          <Image source={SOS} style={styles.icon} />
      
      </View>
      <View style={styles.content}>
        <Text style={styles.heading}>{t('emergency_emergency_contact')}</Text>
       
        <Text style={styles.description}>{t('emergency_description')}</Text>
        <View style={styles.benefits}>
          <Text style={styles.benefitItem}>• {t('emergency_benefit_1')}</Text>
          <Text style={styles.benefitItem}>• {t('emergency_benefit_2')}</Text>
          <Text style={styles.benefitItem}>• {t('emergency_benefit_3')}</Text>
        </View>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, styles.skipBtn, isProcessing && styles.btnDisabled]}
          onPress={skipAndProceed}
          disabled={isProcessing}
          testID="skip-emergency"
        >
          {isProcessing ? <ActivityIndicator color="#333" /> : <Text style={styles.skipText}>{t('skip_for_now')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.saveBtn, isProcessing && styles.btnDisabled]}
          onPress={saveAndProceed}
          disabled={isProcessing}
          testID="save-emergency"
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>{t('add_contact')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

EmergencyContactScreenOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  content: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  heading: {
    fontSize: 20,
    fontFamily: Fonts.semi_bold,
    color: '#111',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Fonts.bold,
  },
  description: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  benefits: {
    paddingHorizontal: 10,
    marginTop: 4,
    marginBottom: 8,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 360,
    gap: 5,
  },
  benefitItem: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#353535ff',
    marginTop: 4,
    textAlign: 'left',
    lineHeight: 20,
  },
  label: {
    marginTop: 8,
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  icon: {
    width: '100%',
    maxWidth: 400,
    height: 300,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 6,
    alignItems: 'center',
  },
  skipBtn: {
    backgroundColor: '#e5e7eb',
  },
  saveBtn: {
    backgroundColor: '#111',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  skipText: {
    color: '#111',
    fontFamily: Fonts.regular,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: Fonts.regular,
  },
});
