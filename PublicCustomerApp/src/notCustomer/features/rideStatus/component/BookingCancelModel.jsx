import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { Fonts } from '../../../constants/constants';
import { useTranslation } from 'react-i18next';

const BookingCancelModel = ({ onClose, onCancel }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('are_you_sure_to_cancel_ride')}</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
              <Text style={styles.backText}>{t('back')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>{t('cancel_ride')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

BookingCancelModel.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    marginBottom: 32,
    textAlign: 'center',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#101828',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontFamily: Fonts.medium,
    fontSize: 15,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ff4d4f',
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelText: {
    color: '#ff4d4f',
    fontFamily: Fonts.medium,
    fontSize: 15,
  },
});

export default BookingCancelModel; 