import React from 'react';
import { StyleSheet } from 'react-native';
import { colors } from '../../../constants/constants';
import LinearGradient from 'react-native-linear-gradient';

const MapTopOverley = () => {
  return (
    <LinearGradient
      colors={[
        'rgba(255,255,255,1)',
        'rgba(255,255,255,0.95)',
        'rgba(255,255,255,0.85)',
        'rgba(255,255,255,0.7)',
        'rgba(255,255,255,0.5)',
        'rgba(255,255,255,0.3)',
        'rgba(255,255,255,0.15)',
        'rgba(255,255,255,0.05)',
        'rgba(255,255,255,0)'
      ]}
      locations={[0, 0.12, 0.25, 0.4, 0.6, 0.75, 0.88, 0.96, 1]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    zIndex: 1000,
    width: '100%',
  },
  text: {
    fontSize: 16,
    color: colors.black,
    textAlign: 'center',
    fontFamily: 'System',
  },
});

export default MapTopOverley;
