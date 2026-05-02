import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PropTypes from 'prop-types';

import { Fonts, colors } from '../../constants/constants';
import { useTranslation } from 'react-i18next';
import SkeletonLoader from '../Loaders/SkeletonLoader';

const StatCard = ({ iconName, iconLib = 'Ionicons', label, value, bgColor, iconColor, loading }) => {
 
  const Icon = iconLib === 'Material' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.card, { backgroundColor: bgColor }] }>
      <View style={[styles.iconWrap,{backgroundColor:iconColor+20}]}>
        <Icon name={iconName} size={30} color={iconColor} />
      </View>
      {loading ? (
        <SkeletonLoader style={{ width: '50%', height: 20, borderRadius: 5, marginTop: 5 }} />
      ) : (
        <Text style={styles.valueText}>{value}</Text>
      )}
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );
};

StatCard.propTypes = {
  iconName: PropTypes.string.isRequired,
  iconLib: PropTypes.oneOf(['Ionicons', 'Material']),
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  bgColor: PropTypes.string.isRequired,
  iconColor: PropTypes.string.isRequired,
  loading: PropTypes.bool,
};

const MyAccountStats = ({ stats, loading }) => {
  console.log("stats",JSON.stringify(stats));
  const { totalSpend = 0, cancelledTrips = 0, completedTrips = 0, totalTrips = 0 } = stats || {};
  const { t } = useTranslation();
  const data = [
    {
      key: 'totalTrips',
      label: 'total_trips',
      value: totalTrips,
      iconName: 'car-outline',
      iconLib: 'Ionicons',
      bgColor: colors.blue_xlight,
      iconColor: colors.blue,
    },
    {
      key: 'completedTrips',
      label: 'completed',
      value: completedTrips,
      iconName: 'check-decagram-outline',
      iconLib: 'Material',
      bgColor: colors.green_xlight,
      iconColor: colors.green,
    },
    {
      key: 'cancelledTrips',
      label: 'cancelled',
      value: cancelledTrips,
      iconName: 'close-circle-outline',
      iconLib: 'Material',
      bgColor: colors.orange_xlight,
      iconColor: colors.orange,
    },
    {
      key: 'totalSpend',
      label: 'total_spend',
      value: totalSpend == null
        ? '-'
        : (typeof totalSpend === 'number' ? `₹${totalSpend.toFixed(0)}` : totalSpend),
      iconName: 'wallet-outline',
      iconLib: 'Ionicons',
      bgColor: colors.yellow_light,
      iconColor: colors.violet,
    },
  ];

  return (
    <View style={styles.container}>
      {data.map(item => (
        <StatCard
          key={item.key}
          iconName={item.iconName}
          iconLib={item.iconLib}
          label={t(item.label)}
          value={item.value || "0"}
          bgColor={item.bgColor}
          iconColor={item.iconColor}
          loading={loading}
        />
      ))}
    </View>
  );
};

MyAccountStats.propTypes = {
  stats: PropTypes.shape({
    totalSpend: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    cancelledTrips: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    completedTrips: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalTrips: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  loading: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  card: {
    width: '48%',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  valueText: {
    fontFamily: Fonts.semi_bold,
    color: colors.commonBlack,
    fontSize: 18,
    paddingLeft:5
  },
  labelText: {
    fontFamily: Fonts.regular,
    color: colors.grey_xxdark,
    fontSize: 12,
    marginTop: 2,
    paddingLeft:5
  },
});

export default MyAccountStats;