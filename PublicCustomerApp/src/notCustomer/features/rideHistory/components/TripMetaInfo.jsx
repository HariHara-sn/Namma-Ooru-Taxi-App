import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, Fonts } from '../../../constants/constants';

const TripMetaInfo = ({ date, tripId}) => (
  <View style={styles.container}>
    <Text style={styles.date}>{date}</Text>
    <Text style={styles.tripId}>Ride ID : {tripId}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 5,
    
  },
  date: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.black,
  },
  tripId: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: colors.grey_xxdark,
    marginTop: 2,
  },
});

export default TripMetaInfo; 