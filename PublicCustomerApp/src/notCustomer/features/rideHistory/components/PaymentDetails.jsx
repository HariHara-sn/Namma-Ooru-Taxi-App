import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, Fonts } from '../../../constants/constants';

const PaymentDetails = ({
 finalFare,breakdownFare,type="fare"
}) => {
  const { t } = useTranslation();
  
  const renderBreakdownItem = (item, index) => {
    return (
      <View key={index}>
        {/* Main item */}
        <View style={styles.row}>
          <Text style={styles.label}>{item.key}</Text>
          <Text style={styles.value}>₹{item.value != null ? Number(item.value).toFixed(2) : '0.00'}</Text>
        </View>
        
        {/* Tax items if they exist */}
        {item.tax && item.tax.map((taxItem, taxIndex) => (
          <View key={`${index}-${taxIndex}`} style={styles.taxRow}>
            <Text style={styles.taxLabel}>{taxItem.key} {taxItem?.tax && `- ${taxItem?.tax}`}</Text>
            <Text style={styles.taxValue}>₹{taxItem.value != null ? Number(taxItem.value).toFixed(2) : '0.00'}</Text>
          </View>
        ))}
      </View>
    );
  };


  const renderFareBreakdown = (item,index) => {
    return (
        
        <View key={index} style={styles.row}>
          <Text style={styles.label}>{item.name}</Text>
          <Text style={styles.value}>
            ₹{item.amount != null ? Number(item.amount).toFixed(2) : '0.00'}
          </Text>
        </View>
     
    )
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('ride_bill')}</Text>
      {breakdownFare?.map((item, index) => type !== "fare" ? renderBreakdownItem(item, index) : renderFareBreakdown(item, index))}
      
      <View style={styles.row}>
        <Text style={styles.totalLabel}>{t('total_fare')}</Text>
        <Text style={styles.totalValue}>
          ₹{finalFare != null ? Number(finalFare).toFixed(2) : '0.00'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    marginVertical: 10,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: colors.black,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  label: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: colors.black,
    textTransform: 'capitalize',
  },
  value: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.black,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 1,
    
  },
  taxLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: colors.grey_xxdark,
  },
  taxValue: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.grey_xxdark,
  },
  totalLabel: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: colors.black,
    marginTop: 6,
  },
  totalValue: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: colors.black,
    marginTop: 6,
  },
});

export default PaymentDetails; 