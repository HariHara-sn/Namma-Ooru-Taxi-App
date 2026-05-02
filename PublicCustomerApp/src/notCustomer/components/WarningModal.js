import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { colors, Fonts } from '../constants/constants';
import { useTranslation } from 'react-i18next';
import AdaptiveText from './Common/AdaptiveText';

const WarningModal = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  closeText,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <View style={styles.iconContainer}>
            <AdaptiveText style={styles.iconText}>⚠️</AdaptiveText>
          </View>

          <AdaptiveText style={styles.modalTitle}>{title}</AdaptiveText>

          <AdaptiveText style={styles.warningText}>
            {message}
          </AdaptiveText>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <AdaptiveText style={styles.cancelButtonText}>{closeText || t('close')}</AdaptiveText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onConfirm}
            >
              <AdaptiveText style={styles.deleteButtonText}>{confirmText || t('confirm')}</AdaptiveText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

WarningModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  closeText: PropTypes.string,
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconText: {
    fontSize: 50,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: colors.black,
  },
  warningText: {
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: colors.grey_dark,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 10,
   
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: colors.grey_light,
    borderColor: colors.grey,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.black,
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: colors.red,
  },
  deleteButtonText: {
    color: 'white',
    fontFamily: Fonts.medium,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WarningModal;
