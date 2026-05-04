import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Pulse from './Pulse';
import VehicleSearch from '../../assets/image/svgIcons/vehicleSearch.svg';
import { colors, Fonts } from '../../constants/constants';
import SwipeBtn from '../SwipeBtn';
import useRideSelectionStore from '../../store/useRideSelectionStore';
import useSelectedVehicleStore from '../../store/useSelectedVehicleStore';

const SearchLoader = ({ handleSwipeSuccess }) => {
  const { bookingDetails } = useRideSelectionStore();

  const fareText = () => {
    if (!bookingDetails) return null;
    return (
      <Text style={styles.secondaryText}>
        Estimated fare :{' '}
        <Text style={styles.greenText}>
          ₹{bookingDetails.estimatedFare} - ₹{bookingDetails.maxFare}
        </Text>
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <Pulse />
      <View style={styles.contentContainer}>
        <VehicleSearch />
        <Text style={styles.mainText}>Searching for Auto...</Text>
        <View style={styles.fareContainer}>{fareText()}</View>
      </View>
      <View style={styles.swipeButtonContainer}>
        <SwipeBtn name="SWIPE TO CANCEL" onHandleSwipeEnd={handleSwipeSuccess} />
      </View>
    </View>
  );
};

export default SearchLoader;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 300,
    backgroundColor: 'white',
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  contentContainer: {
    width: '80%',
    marginTop: 60,
    alignSelf: 'center',
    alignItems: 'center',
  },
  fareContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  mainText: {
    fontFamily: Fonts.medium,
    color: colors.black,
    fontSize: 16,
    marginTop: 10,
  },
  secondaryText: {
    fontFamily: Fonts.medium,
    color: colors.grey,
    fontSize: 14,
    textAlign: 'center',
  },
  greenText: {
    color: colors.green,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  swipeButtonContainer: {
    marginTop: 20,
  },
});


