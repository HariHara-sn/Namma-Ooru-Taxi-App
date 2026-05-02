import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MapIcon from '../../../../components/Map/MapIcon';
import CurrentLocationIcon from "../../../../assets/icons/CurrentLocationIcon.svg";
import AddStopIcon from "../../../../assets/icons/AddStopIcon.svg";
import { colors } from '../../../../constants/constants';
import { height } from '../../../../utils/Utils';

const MapHeader = ({ onCurrentLocation, onAddStop }) => {
  return (
    <View style={styles.container}>
      <MapIcon />
      
      <View style={styles.mapActionContainer}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onCurrentLocation}
          activeOpacity={0.7}
        >
          <CurrentLocationIcon width={25} height={25} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onAddStop}
          activeOpacity={0.7}
        >
          <AddStopIcon width={25} height={25} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position:'absolute',
    top:-110,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    width:"100%",
    backgroundColor: 'transparent',
   
  },
  mapActionContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    marginBottom:10
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default MapHeader; 