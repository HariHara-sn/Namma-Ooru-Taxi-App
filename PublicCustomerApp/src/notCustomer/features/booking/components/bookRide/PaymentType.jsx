import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import PaymentCashIcon from '../../../../assets/icons/payments/PaymentCashIcon.svg';
import PaymentUPIIcon from '../../../../assets/icons/payments/PaymentUPIIcon.svg';
import PropTypes from 'prop-types';
import { colors } from '../../../../constants/constants';
import { Fonts } from '../../../../constants/constants';

const PAYMENT_OPTIONS = [
  { key: 'cash', label: 'Cash',value:"CASH" },
  { key: 'upi', label: 'Online', value:"ONLINE" },
];

const PaymentType = ({ onSelect, initialValue }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(initialValue || 'CASH');

  const handleSelect = (key) => {
    setSelected(key);
    onSelect && onSelect(key);
    
  };



  return (
    <View style={styles.container}>
        <Text style={styles.PaymentHeader}>{t('pay_by')}</Text>
      {PAYMENT_OPTIONS.map(({ key, label, Icon,value }) => (
        <TouchableOpacity
          key={key}
          style={[styles.option, selected === value && styles.selectedOption]}
          onPress={() => handleSelect(value)}
          activeOpacity={0.8}
        >
          {/* <Icon width={28} height={28} style={styles.icon} /> */}
          <Text style={styles.label}>{label}</Text>
          <View style={styles.radioOuter}>
            {selected === value && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      ))}
    
    </View>
  );
};

PaymentType.propTypes = {
  onSelect: PropTypes.func,
  initialValue: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal:10,
    paddingBottom:20
  },

  PaymentHeader:{
    fontSize:16,
    fontFamily:Fonts.medium,
    color:colors.black,
    marginBottom:20,
    textAlign:"center"
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  selectedOption: {
    borderColor: '#219653',
    backgroundColor: '#F0FFF5',
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    color: '#222',
    flex: 1,
    fontFamily:Fonts.regular,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#219653',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#219653',
  },
  PaymentTypeConfirmButton:{
    width:"100%",
    paddingHorizontal:10,
    paddingVertical:15,
    backgroundColor:"#008d34",
    borderRadius:10,
    alignItems:"center",
    justifyContent:"center",
    marginTop:20
  },
  PaymentTypeConfirmButtonText:{
    fontSize:16,
    fontFamily:Fonts.medium,
    color:colors.white,
  },
 
    });

export default PaymentType;
