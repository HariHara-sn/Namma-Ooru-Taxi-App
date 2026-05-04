import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import React from 'react';
import PropTypes from 'prop-types';
import { Colors, colors, Fonts } from '../../common/constants/constants';

const StatusModal = ({
  isVisible,
  onClose,
  successMessage,
  onBackDropPress,
  additionalContainerStyles,
  animationType = 'none',
  children,
  onRightPress,
  rightBtnText,
  leftBtnTxt,
  status,
  leftCloseBtnTextColor,
  rightCloseBtnTextColor,
  leftBtnStyle,
  rightBtnStyle,
  leftBtnTextStyle,
  rightBtnTextStyle,
  messageTitleStyle,
}) => {

  return (
    <Modal
      transparent
      animationType={animationType}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.overlay} onPress={onBackDropPress}>
        <View style={[styles.modalContainer, additionalContainerStyles]}>
          {successMessage && <Text style={[styles.title, messageTitleStyle]}>{successMessage}</Text>}
          {children && <View>{children}</View>}
          <View style={{flexDirection: 'row', gap: 10}}>
            {
              leftBtnTxt && 
              <TouchableOpacity 
                onPress={onClose} 
                style={[
                  styles.offlineCloseBtn, 
                  leftCloseBtnTextColor && {borderColor: leftCloseBtnTextColor},
                  leftBtnStyle
                ]}>
                <Text style={[styles.offlineCloseBtnText, leftBtnTextStyle]}>{leftBtnTxt}</Text>
              </TouchableOpacity>
            }
            {rightBtnText &&
             <TouchableOpacity
               onPress={onRightPress}
               style={[
                 styles.offlineActionBtn, 
                 rightCloseBtnTextColor && {borderColor: rightCloseBtnTextColor},
                 rightBtnStyle
               ]}>
               <Text style={[styles.offlineActionBtnText, rightBtnTextStyle]}>{rightBtnText}</Text>
             </TouchableOpacity> 
            }
           
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default StatusModal;

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
  title: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.black,
    textAlign: 'center',
  },
  offlineCloseBtn: {
    backgroundColor: Colors.green_xxlight,
    width: '50%',
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.green_online,
    borderRadius: 8,
  },
  offlineCloseBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.green_online,
  },
  offlineActionBtn: {
    backgroundColor: Colors.orange_xxlight,
    width: '50%',
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.danger_red,
    borderRadius: 8,
  },
  offlineActionBtnText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.danger_red,
  },
  onlineActionBtn: {
    backgroundColor: Colors.black,
    width: '50%',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  onlineActionText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.white,
  },
});

StatusModal.propTypes = {
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
  leftCloseBtnTextColor: PropTypes.string,
  rightCloseBtnTextColor: PropTypes.string,
  leftBtnStyle: PropTypes.object,
  rightBtnStyle: PropTypes.object,
  leftBtnTextStyle: PropTypes.object,
  rightBtnTextStyle: PropTypes.object,
  messageTitleStyle: PropTypes.object,
};

StatusModal.defaultProps = {
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
  leftCloseBtnTextColor: '',
  rightCloseBtnTextColor: '',
  leftBtnStyle: {},
  rightBtnStyle: {},
  leftBtnTextStyle: {},
  rightBtnTextStyle: {},
  messageTitleStyle: {},
};


