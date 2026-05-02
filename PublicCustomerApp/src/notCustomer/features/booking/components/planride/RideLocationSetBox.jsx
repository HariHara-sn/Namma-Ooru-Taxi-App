import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import DestinationIcon from '../../../../assets/icons/destinationIcon';
import { Fonts } from '../../../../constants/constants';
import LocationTypes from '../../types/LocationTypes.json';

import useRideBookingLocationStore from '../../store/useRideBookingLocationStore';
import {utils} from '../../../../utils/Utils';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DashedLine from '../../../../components/Common/DashedLine';



const RideLocationSetBox = ({
  onAddWaypoint,
  onLocationClick,
}) => {
  const { t } = useTranslation();
  const {rideStartLocation,rideEndLocation,rideWayPoints} = useRideBookingLocationStore()

  

  const destination = rideEndLocation ? utils.formatAddressName(rideEndLocation) : t('search_destination')
  const pickup = rideStartLocation ? utils.formatAddressName(rideStartLocation) : t('search_destination')
  const setPickupText = t('cant_find_you_set_pickup')

  const startLocationLable = rideStartLocation?.name === "Current Location" ? t('current_location') : t('pickup_location')

  


  return (
    <View>
      {!rideStartLocation && (
        <View style={styles.warningTextContainer}>  
          <Text style={styles.warningText}>{setPickupText}</Text>
        </View>
      )}
      <View style={styles.container}>
      {/* Pickup Row */}
      <TouchableOpacity style={[styles.row]} onPress={()=>onLocationClick(LocationTypes.START_LOCATION)}>
        <View style={styles.iconContainer}>
        <View style={[styles.dottedVerticalLine, { borderColor: 'transparent' }]} />

        <View style={[styles.iconItem, { backgroundColor: '#4caf5030' }]}> 
          <View style={styles.iconSubItem} />
        </View>
        <DashedLine color="grey" strokeWidth={1} dashLength={3} dashGap={5} vertical={true} />
        </View>
        <View style={[styles.locationContainer]}>
          <Text style={styles.label}>{startLocationLable}</Text>
          {rideStartLocation ? <Text style={styles.address} numberOfLines={1}>{pickup}</Text>:<Text style={styles.placeHolder}>{t('search_pickup_location')}</Text>}
        </View>
      </TouchableOpacity>
      <View style={styles.stopContainer} onPress={()=>onLocationClick(LocationTypes.WAYPOINT_LOCATION)}>
        <View style={styles.iconContainer}>
       {rideWayPoints.length> 0 && <DashedLine color="grey" strokeWidth={1} dashLength={3} dashGap={5} vertical={true} />}
        { rideWayPoints.length > 0 && 
        <>
        <View style={styles.iconItem}>
          <View style={[styles.iconSubItem,{backgroundColor:'black'}]} />
        </View>
        <DashedLine color="grey" strokeWidth={1} dashLength={3} dashGap={5} vertical={true} />
         </>
        }
        </View>
       
   
        {
          rideWayPoints.length > 0 ?
           <View style={styles.stopLocationMainContainer}>
          
           <View style={styles.stopCountContainer}>
             <Text style={styles.stopCountText}> {rideWayPoints.length} {rideWayPoints.length === 1 ? t('stop') : t('stops')}</Text>
           </View>
           <View style={styles.stopLloctiondashedHorozontalLine}/>
          </View>
          : <View style={styles.stopLocationContainer}/>
        }
          
         
        
      </View>
        <TouchableOpacity style={styles.addStopBtnAbsolute} onPress={()=>onAddWaypoint(LocationTypes.WAYPOINT_LOCATION)}>
            <View style={styles.plusIconBg}>
            {rideWayPoints.length ?<Icon name="edit" size={20} color="white" /> : <Icon name="add" size={20} color="white" />}
            </View>
        </TouchableOpacity>
     
      {/* Destination Row */}
      <TouchableOpacity style={[styles.row]} onPress={()=>onLocationClick(LocationTypes.DESTINATION_LOCATION)} activeOpacity={0.7}>
        <View style={styles.iconContainer}>
        <DashedLine color="grey" strokeWidth={1} dashLength={3} dashGap={5} vertical={true} />
        
         <DestinationIcon  height={23} width={23} />
        <View style={[styles.dottedVerticalLine, { borderColor: 'transparent' }]} />

        
        </View>
        <View style={[styles.locationContainer]}>
          <Text style={styles.label}>{t('destination')}</Text>
          {rideEndLocation ? <Text style={styles.address} numberOfLines={1}>{destination}</Text>:<Text style={styles.placeHolder}>{t('search_destination')}</Text>}
        </View>
      </TouchableOpacity>
  
      </View>
    </View>
  );
};

RideLocationSetBox.propTypes = {
  pickup: PropTypes.string,
  destination: PropTypes.string,
  onAddWaypoint: PropTypes.func,
  onLocationClick: PropTypes.func,
  onSearchDestination: PropTypes.func,
};

const styles = StyleSheet.create({
  warningTextContainer: {
    backgroundColor: '#FFC107'+'30',
    padding: 5,
    borderRadius: 10,
    marginHorizontal: 8,
    marginTop: 4,
  },
  warningText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#FFC107',
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical:5,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    margin: 8,
    boxShadow: '0 3px 6px 0 rgba(0, 0, 0, 0.05)',
    border: 'solid 0.5px #e0e0e0',
    position: 'relative',
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    
  },
  iconItem: {
    width: 25,
    height: 25,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSubItem: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4caf50',
  },
  locationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: 15,
    paddingVertical: 10,
   
   
  },
  label: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 2,
  },
  address: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'left',
    color: '#212121',
    fontFamily: Fonts.medium,
    maxWidth: '95%',
  },
  placeHolder: {
    fontSize: 15,
    color: '#A0A0A0',
   
    fontFamily: Fonts.medium,
  },
  dottedVerticalLine: {
    width: 1,
    flex: 1,
    borderStyle: 'dashed',
    borderLeftWidth: 1,
    borderColor: ' #e0e0e0;',
  },
  iconContainer: {
    width: 25,
   
    justifyContent: 'center',
    alignItems: 'center',
   
  },
 
  plusIconBg: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStopBtnAbsolute: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    right: 10,

  
  
    zIndex: 10,
  },
  dottedLineContainer: {
    alignItems: 'center',
  
  },
  dottedLine: {
    height: 2,
    width: '100%',
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 1,
  },
  stopContainer: {

    flexDirection: 'row',
  },
  stopLocationContainer: {
    flex: 1,
    height: 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: 15,
    backgroundColor: '#eee',
    borderRadius: 10,
    
    
    
   
    
  },
  stopCountContainer: {
    backgroundColor:  '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginVertical:5,
  },
  stopCountText: {
    fontSize: 14,
    color: 'black',
    fontFamily: Fonts.medium,
  },
  stopLocationMainContainer: {
    flex:1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft:15,
  },
  stopLloctiondashedHorozontalLine: {
    height: 2,
    flex:1,
    borderBottomWidth: 1,
    borderBottomColor:  '#eee',
  },
});

export default RideLocationSetBox;
