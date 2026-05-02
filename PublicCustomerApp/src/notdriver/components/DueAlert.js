import React, {useMemo} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Colors, Fonts} from '../../common/constants/constants';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const DueAlert = ({dueAmount, dueDate, onPressPayNow}) => {
  const {t} = useTranslation();

  const parsedDueAmount = Number(dueAmount ?? 0);
  const dueDateMs = typeof dueDate === 'string' ? Number(dueDate) : Number(dueDate);

  const {daysLeft, formattedAmount} = useMemo(() => {
    if (!Number.isFinite(parsedDueAmount) || parsedDueAmount <= 0 || !Number.isFinite(dueDateMs)) {
      return {daysLeft: null, formattedAmount: null};
    }

    const remainingMs = Math.max(0, dueDateMs - Date.now());
    const computedDays = Math.max(0, Math.ceil(remainingMs / ONE_DAY_MS));
    const formattedValue = parsedDueAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return {daysLeft: computedDays, formattedAmount: formattedValue};
  }, [parsedDueAmount, dueDateMs]);

  if (!formattedAmount || daysLeft === null) {
    return null;
  }

  const nextDueText = t('next_due_in', {defaultValue: 'Next due in'});
  const dayWord = t('day_with_count', {
    count: daysLeft,
    defaultValue: daysLeft === 1 ? 'day' : 'days',
  });

  return (
    <View style={styles.container}>
      <View style={styles.infoColumn}>
        <Text style={styles.subtitle}>
          {t('due_amount_label') + ': ₹' + formattedAmount}
        </Text>
        <Text style={styles.helper}>
          {nextDueText}{' '}
          <Text style={styles.highlight}>{daysLeft}</Text>{' '}
          <Text style={styles.highlight}>{dayWord}</Text>
        </Text>
      </View>
      <TouchableOpacity
        style={styles.payNowButton}
        onPress={onPressPayNow}
        activeOpacity={0.85}
      >
        <Text style={styles.payNowText}>
          {t('pay_now', {defaultValue: 'Pay Now'})}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default DueAlert;

const styles = StyleSheet.create({
  container: {
    // flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5E6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFD08A',
  },
  infoColumn: {
    // flex: 1,
    paddingRight: 12,
  },
  title: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: Colors.black,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#DB7C1D',
    marginBottom: 4,
  },
  helper: {
    fontFamily: Fonts.regular,
    fontSize:18,
    color: Colors.cool_grey,
  },
  highlight: {
    fontFamily: Fonts.semi_bold,
    color: '#C15C00',
    fontSize:18
  },
  payNowButton: {
    backgroundColor: '#F08B2E',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 24,
    alignSelf: 'center',
    marginTop:10
  },
  payNowText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 14,
    color: Colors.white,
  },
});