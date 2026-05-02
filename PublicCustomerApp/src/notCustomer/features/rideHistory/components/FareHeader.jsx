import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, Fonts } from '../../../constants/constants';
import { ImageBackground } from 'react-native';
import rideFareBackground from "../../../assets/image/rideFareBackground.webp"

const FareHeader = ({ fare = '₹117.50', RideStatus = false , hideFare = false }) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.headerContainer}>
    <ImageBackground source={rideFareBackground} style={styles.imageBackground}>
      <Text style={styles.TripStatus}>{t(RideStatus)}</Text>
      {/* <Text style={styles.label}>{t('ride_fare')}</Text> */}
     {!hideFare && <Text style={styles.fare}>₹ {fare != null ? fare.toFixed(2) : '0.00'}</Text>}
      
    </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    color: colors.white,
    fontFamily: Fonts.medium,
    fontSize: 14,
    marginBottom: 4,
  },
  fare: {
    color: colors.white,
    fontFamily: Fonts.bold,
    fontSize: 28,
  },
  TripStatus: {
    color: colors.white,
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
});

export default FareHeader; 