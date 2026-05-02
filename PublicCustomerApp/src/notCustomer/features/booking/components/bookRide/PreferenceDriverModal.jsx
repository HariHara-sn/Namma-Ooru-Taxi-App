import React from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import AdaptiveText from '../../../../components/Common/AdaptiveText';
import { colors, Fonts } from '../../../../constants/constants';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import AUTO from '../../../../assets/vehicle/AUTO.webp';
import BIKE from '../../../../assets/vehicle/BIKE.webp';
import HATCHBACK from '../../../../assets/vehicle/HATCHBACK.webp';
import SEDAN from '../../../../assets/vehicle/SEDAN.webp';
import SUV from '../../../../assets/vehicle/SUV.webp';
import ELECTRIC_AUTO from '../../../../assets/vehicle/AUTO.webp';
import ELECTRIC_BIKE from '../../../../assets/vehicle/BIKE.webp';
import ELECTRIC_HATCHBACK from '../../../../assets/vehicle/HATCHBACK.webp';
import ELECTRIC_SEDAN from '../../../../assets/vehicle/SEDAN.webp';
import ELECTRIC_SUV from '../../../../assets/vehicle/SUV.webp';
import ExSEDAN from '../../../../assets/vehicle/ExSEDAN.webp';

import FemaleAvatar from '../../../../assets/vehicle/FEMALE_DRIVER.webp';

const VEHICLE_IMAGES = {
  AUTO,
  BIKE,
  HATCHBACK,
  SEDAN,
  SUV,
  ELECTRIC_AUTO,
  ELECTRIC_BIKE,
  ELECTRIC_HATCHBACK,
  ELECTRIC_SEDAN,
  ELECTRIC_SUV,
};

const PreferenceDriverModal = ({
  visible,
  onClose,
  variant, // 'female' | 'trusted'
  vehicleType,
  title,
  message,
  ctaLabel,
}) => {
  const { t } = useTranslation();

  const resolvedTitle =
    title ||
    (variant === 'female'
      ? t('no_female_drivers_available', 'No female drivers available')
      : t('no_trusted_drivers_available', 'No trusted drivers available'));

  const resolvedMessage =
    message ||
    (variant === 'female'
      ? t(
          'no_female_drivers_hint',
          'No female drivers are nearby right now. You can search all drivers instead.'
        )
      : t(
          'no_trusted_drivers_hint',
          'No trusted drivers are nearby right now. You can search all drivers instead.'
        ));

  const resolvedCta = ctaLabel || t('search_all_drivers', 'Search all drivers');

  const vehicleImage = VEHICLE_IMAGES[vehicleType] || ExSEDAN;

  return (
    <Modal animationType="fade" transparent visible={visible} statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <View style={styles.compositeImageWrapper}>
            <Image source={vehicleImage} style={styles.vehicleImage} resizeMode="contain" />
             {variant === 'female' && ( <View style={styles.badgeWrapper}>
                <Image source={FemaleAvatar} style={{ width: 50, height: 50 }} />
            </View>  ) }
          </View>
          <AdaptiveText style={styles.modalTitle}>{resolvedTitle}</AdaptiveText>
          <AdaptiveText style={styles.modalMessage}>{resolvedMessage}</AdaptiveText>
          <TouchableOpacity style={[styles.modalButton, styles.primaryActionButton]} onPress={onClose} activeOpacity={0.85}>
            <AdaptiveText style={styles.modalButtonText}>{resolvedCta}</AdaptiveText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

PreferenceDriverModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['female', 'trusted']).isRequired,
  vehicleType: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
  ctaLabel: PropTypes.string,
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
    paddingTop: 24,
    alignItems: 'center',
    elevation: 5,
  },
  compositeImageWrapper: {
    width: '60%',
    height: 180,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleImage: {
    width: '65%',
    height: '100%',
  },
  badgeWrapper: {
    position: 'absolute',
    bottom: 20,
    left: '12%',
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: colors.grey_xlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  modalTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: colors.black,
    marginBottom: 6,
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
    minWidth: 160,
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

export default PreferenceDriverModal;
