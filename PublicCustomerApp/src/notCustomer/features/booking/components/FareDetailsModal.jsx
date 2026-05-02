import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Fonts, colors } from '../../../constants/constants';

const AnimatedDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animateDots());
    };

    animateDots();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View
        style={[
          styles.dot,
          {
            opacity: dot1,
            transform: [{ scale: dot1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            })}],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            opacity: dot2,
            transform: [{ scale: dot2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            })}],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            opacity: dot3,
            transform: [{ scale: dot3.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            })}],
          },
        ]}
      />
    </View>
  );
};

const FareDetailsModal = ({
  visible,
  onClose,
  onConfirm,
  fareData,
  isLoading = false,
  driverWaitingApproval=null,
  loading=false
}) => {
  const { t } = useTranslation();
  const { distance, duration, fare, waitingTime = 0 } = fareData || {};

  const formatwaitingTime = (waitingTimeInMinutes) => {
    if (waitingTimeInMinutes === 0) return `0 ${t('min')}`;
    return `${waitingTimeInMinutes} ${t('min')}`;
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <MaterialIcons name="receipt" size={25} color="#000" />
              <Text style={styles.modalTitle}>{t('updated_fare_details')}</Text>
            </View>
          </View>

          {/* Fare Details */}
          <View style={styles.fareDetailsContainer}>
            {/* Distance */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <MaterialIcons name="straighten" size={20} color={colors.blue} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('distance')}</Text>
                <Text style={styles.detailValue}>
                  {distance || "--"} Km
                </Text>
              </View>
            </View>

            {/* Duration */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <MaterialIcons name="schedule" size={20} color={colors.orange} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('duration')}</Text>
                <Text style={styles.detailValue}>
                  {duration || "--"} Mins
                </Text>
              </View>
            </View>

            {/* Wait Time */}
            {waitingTime > 0 && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <MaterialIcons name="timer" size={20} color={colors.orange} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>{t('wait_time')}</Text>
                  <Text style={styles.detailValue}>
                    {formatwaitingTime(waitingTime)}
                  </Text>
                </View>
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Total Fare */}
            <View style={styles.totalFareContainer}>
              <Text style={styles.totalFareLabel}>{t('total_fare')}</Text>
              <Text style={styles.totalFareValue}>
                ₹{fare != null ? fare.toFixed(2) : '0.00'}
              </Text>
            </View>

            {/* Fare Disclaimer */}
            <View style={styles.disclaimerContainer}>
              {/* <View style={styles.disclaimerHeader}>
                <MaterialIcons name="info" size={16} color={colors.orange} />
                <Text style={styles.disclaimerTitle}>Fare may vary</Text>
              </View> */}
              <Text style={styles.disclaimerText}>
                {t('fare_disclaimer')}
              </Text>
            </View>
          </View>
         
          {/* Action Buttons */}
          <View style={styles.buttonContainer}>

            {driverWaitingApproval ?
            <View style={styles.driverWaitingApprovalContainer}>
                <Text style={styles.driverWaitingApprovalText}>{t('waiting_for_driver_approval')}</Text>
                <AnimatedDots />
            </View>
             :
            <>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                isLoading && styles.disabledButton
              ]}
              onPress={onConfirm}
              disabled={isLoading || loading}
            >
              <Text style={styles.confirmButtonText}>
                {isLoading  || loading ? t('confirming') : t('confirm')}
              </Text>
            </TouchableOpacity>
            </>
}
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalView: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.medium,
    color: '#1a1a1a',
  },
  fareDetailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.grey_xxlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: colors.grey_xxdark,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#1a1a1a',
  },
  divider: {
    height: 1,
    backgroundColor: colors.grey_light,
    marginVertical: 16,
  },
  totalFareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  totalFareLabel: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: '#1a1a1a',
  },
  totalFareValue: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: colors.green,
  },
  disclaimerContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    padding:10,
    borderStyle:"dashed",
   
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: 'green',
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: colors.grey_xxdark,
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  cancelButton: {
    backgroundColor: colors.grey_xxlight,
    borderWidth: 1,
    borderColor: colors.grey_light,
  },
  confirmButton: {
    backgroundColor: colors.black,
  },
  disabledButton: {
    backgroundColor: colors.grey_dark,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: colors.grey_xxdark,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: colors.white,
    },
    driverWaitingApprovalContainer:{
        width:"100%",
        alignItems:'center',
        justifyContent:'center',
        padding:10,
        backgroundColor: colors.yellow_xxlight,
    borderRadius: 12,

   
    },
    driverWaitingApprovalText:{
        fontSize:16,
        fontFamily:Fonts.medium,
        color:colors.grey_xxdark
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.orange,
      marginHorizontal: 4,
    },
});

FareDetailsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  fareData: PropTypes.shape({
    distance: PropTypes.number,
    duration: PropTypes.number,
    fare: PropTypes.number,
    waitingTime: PropTypes.number,
  }),
  isLoading: PropTypes.bool,
  driverWaitingApproval: PropTypes.bool,
};

export default FareDetailsModal; 