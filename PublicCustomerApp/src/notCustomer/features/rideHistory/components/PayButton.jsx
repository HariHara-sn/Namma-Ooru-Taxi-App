import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, Fonts } from '../../../constants/constants';
import { useTranslation } from 'react-i18next';
const PayButton = ({ amount = '₹117.50', onPress,paymentMethod }) => {
  const {t} = useTranslation();
  return (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.text}>{paymentMethod == 'CASH' ? t('pay_through_upi') : t('pay')}</Text>
  </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.green,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal:15
  },
  text: {
    color: colors.white,
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
  },
});

export default PayButton; 