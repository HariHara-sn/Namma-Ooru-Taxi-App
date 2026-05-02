import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, Fonts } from '../../../constants/constants';

const TripDetails = ({
  driver = { name: 'John Doe', vehicle: 'Maruti Suzuki Swift Dzire - TN 01 AB 1234', image: null },
  distance = '12 Km',
  duration = '30 min',
  fare = '₹117.50',
}) => (
  <View style={styles.container}>
    <View style={styles.driverRow}>
      <Image
        source={driver.image || require('../../../assets/image/account/cardProfile.svg')}
        style={styles.driverImg}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.driverName}>{driver.name}</Text>
        <Text style={styles.vehicle}>{driver.vehicle}</Text>
      </View>
    </View>
    <View style={styles.statsRow}>
      <View style={styles.statBox}>
        <Text style={styles.statLabel}>Distance</Text>
        <Text style={styles.statValue}>{distance}</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statLabel}>Duration</Text>
        <Text style={styles.statValue}>{duration}</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statLabel}>Fare</Text>
        <Text style={styles.statValue}>{fare}</Text>
      </View>
    </View>
  </View>
);

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
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.grey_xxlight,
  },
  driverName: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.black,
  },
  vehicle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: colors.grey_xxdark,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: colors.grey_xxdark,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: colors.black,
    marginTop: 2,
  },
});

export default TripDetails; 