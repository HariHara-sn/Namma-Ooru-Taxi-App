import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const TripStatusOverlay = ({ status }) => {
  if (!status) return null;

  return (
    <View style={styles.overlay}>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)', // transparent white
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

TripStatusOverlay.propTypes = {
  status: PropTypes.string,
};

export default TripStatusOverlay; 