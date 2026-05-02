import React from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import AdaptiveText from '../../../../components/Common/AdaptiveText';
import { colors, Fonts } from '../../../../constants/constants';

const DriverNotFoundImage = require('../../../../assets/image/Driver_Not_Found.webp');
const auto = require('../../../../assets/vehicle/AUTO.webp');

const DriverNotFoundModal = ({ visible, onClose, title, message, ctaLabel, onPrimaryAction, type = null }) => {
  const { t } = useTranslation();

  const resolvedTitle = title || t('driver_not_found');
  const resolvedMessage = message || t('unable_to_find_driver');
  const resolvedCtaLabel = ctaLabel || t('ok', 'OK');
  const handlePrimaryPress = () => {
    if (typeof onPrimaryAction === 'function') {
      onPrimaryAction();
      return;
    }
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          {type === 'min_distance'? <Image source={auto} style={[styles.modalImage,{width: 150}]} resizeMode="contain" /> : <Image source={DriverNotFoundImage} style={styles.modalImage} resizeMode="contain" /> }
          <AdaptiveText style={styles.modalTitle}>{resolvedTitle}</AdaptiveText>
          <AdaptiveText style={styles.modalMessage}>{resolvedMessage}</AdaptiveText>
          <TouchableOpacity
            style={[styles.modalButton, styles.primaryActionButton]}
            onPress={handlePrimaryPress}
            activeOpacity={0.8}
          >
            <AdaptiveText style={styles.modalButtonText}>{resolvedCtaLabel}</AdaptiveText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

DriverNotFoundModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  ctaLabel: PropTypes.string,
  onPrimaryAction: PropTypes.func,
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
    elevation: 5,
  },
  modalImage: {
    width: '90%',
    height: 250,
    marginBottom: 10,
  },
  modalTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: colors.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.black,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 140,
    alignSelf: 'center',
  },
  primaryActionButton: {
    backgroundColor: colors.black,
  },
  modalButtonText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
  },
});

export default DriverNotFoundModal;
