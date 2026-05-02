import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import PropTypes from 'prop-types';
import { colors, Fonts } from '../constants/constants';
import { useTranslation } from 'react-i18next';

const DeleteAccountModal = ({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const { t } = useTranslation();
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          {/* Warning Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>⚠️</Text>
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>{t('delete_account')}</Text>

          {/* Warning Message */}
          <Text style={styles.warningText}>
            {t('delete_account_warning', 'Are you sure you want to delete your account?')}
          </Text>

          {/* Info Message */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              • {t('delete_account_info_timeline')}
            </Text>
            <Text style={styles.infoText}>
              • {t('delete_account_info_data')}
            </Text>
            <Text style={styles.infoText}>
              • {t('delete_account_info_cannot_undo')}
            </Text>
          </View>

          {/* Reason Input */}
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>{t('reason_optional')}</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder={t('delete_account_reason_placeholder')}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>{t('cancel').toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={() => onConfirm(reason)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.deleteButtonText}>{t('delete_account')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconText: {
    fontSize: 48,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Fonts.bold,
  },
  warningText: {
    fontSize: 16,
    color: colors.black,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Fonts.medium,
  },
  infoContainer: {
    backgroundColor: colors.yellow_xxlight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: colors.black,
    marginBottom: 8,
    fontFamily: Fonts.regular,
  },
  reasonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  reasonLabel: {
    fontSize: 14,
    color: colors.black,
    marginBottom: 8,
    fontFamily: Fonts.medium,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.grey_light,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.black,
    fontFamily: Fonts.regular,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.grey_light,
  },
  deleteButton: {
    backgroundColor: colors.danger_red,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semi_bold,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semi_bold,
  },
});

DeleteAccountModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default DeleteAccountModal; 