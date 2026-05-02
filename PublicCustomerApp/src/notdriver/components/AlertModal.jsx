import {View, Modal, Text, TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import React from 'react';
import PropTypes from 'prop-types';
import { Colors, Fonts } from '../../common/constants/constants';
import { flexStyle } from '../../common/styles/flexStyle';
import { useTranslation } from 'react-i18next';



const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    alignItems: 'center',
    gap: 20,
  },
  closeButton: {
    alignSelf: 'center',
    paddingVertical: 15,
    backgroundColor: 'black',
    // paddingHorizontal: 14,
    borderRadius: 8,
    width: '50%',
    textAlign: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  title: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.black,
    textAlign:'center'
  },
});

const AlertModal = ({
  isVisible,
  onClose,
  successMessage,
  onBackDropPress,
  additionalContainerStyles,
  animationType = 'none',
  children,
  onRightPress,
  rightBtnText,
  SubText,
  isLoading,
  leftBtnTxt,
  additionalRightBtnStyles,
  additionalLeftBtnStyles
}) => {
  const {t} = useTranslation();
  return (
    <Modal
      transparent
      animationType={animationType}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.overlay} onPress={onBackDropPress}>
        <View style={[styles.modalContainer, additionalContainerStyles]}>
          {successMessage && <Text style={styles.title}>{t(successMessage) ??  successMessage}</Text>}
          {SubText && <Text style={styles.title}>{t('name')}: {SubText}</Text>}
          <View>{children}</View>
          <View style={[flexStyle.frg10, additionalLeftBtnStyles]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>{t(leftBtnTxt) ?? leftBtnTxt}</Text>
            </TouchableOpacity>
            {rightBtnText && (
              <TouchableOpacity
                onPress={onRightPress}
                style={[styles.closeButton, additionalRightBtnStyles]}>
                  {isLoading ? <ActivityIndicator /> : <Text style={styles.closeButtonText}>{t(rightBtnText) ?? rightBtnText}</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;

AlertModal.propTypes = {
  isVisible: PropTypes.bool,
  onClose: PropTypes.func,
  successMessage: PropTypes.string,
  image: PropTypes.any,
  SvgImage: PropTypes.any,
  onBackDropPress: PropTypes.func,
  additionalContainerStyles: PropTypes.object,
  animationType: PropTypes.string,
  children: PropTypes.any,
  onRightPress: PropTypes.func,
  rightBtnText: PropTypes.string,
  SubText: PropTypes.string,
  isLoading: PropTypes.bool,
  leftBtnTxt: PropTypes.string,
  additionalRightBtnStyles: PropTypes.object,
};

AlertModal.defaultProps = {
  isVisible: false,
  onClose: () => {},
  successMessage: '',
  image: '',
  SvgImage: '',
  onBackDropPress: () => {},
  additionalContainerStyles: {},
  animationType: '',
  children: '',
  onRightPress: () => {},
  rightBtnText: '',
  SubText: '',
  isLoading: false,
  leftBtnTxt: '',
  additionalRightBtnStyles: {},
};
