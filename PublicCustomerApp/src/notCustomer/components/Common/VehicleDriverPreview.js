import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getVehicleImage } from '../../features/rideStatus/types/vehicleImd';

const VehicleDriverPreview = ({ vehicleType = 'AUTO', driverPhoto = null, isElectricVehicle = false, vehicleStyle, driverStyle }) => {
  // Accept either a local require object or a uri-style object
  const driverSource = driverPhoto
    ? (typeof driverPhoto === 'string' ? { uri: driverPhoto } : driverPhoto)
    : null;

  return (
    <View style={styles.imagesRow}>
      {getVehicleImage(vehicleType, vehicleStyle || styles.vehicleImg)}
      <View style={styles.driverImgWrap}>
        {isElectricVehicle && (
          <Ionicons name="bolt" size={20} color="#00770d" style={styles.boltIcon} />
        )}
        {driverSource && (
          <Image source={driverSource} style={driverStyle || styles.driverImg} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 8,
    minWidth: 100
  },
  vehicleImg: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    transform: [{ scaleX: -1 }],
  },
  driverImgWrap: {
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 32,
    overflow: 'hidden',
    marginLeft: -10,
    marginRight: 8,
    backgroundColor: '#fff',
    zIndex: 2,
    elevation:5
  },
  driverImg: {
    width: 60,
    height: 60,
    borderRadius: 24,
    
  },
  boltIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 3,
  },
});

export default VehicleDriverPreview;
