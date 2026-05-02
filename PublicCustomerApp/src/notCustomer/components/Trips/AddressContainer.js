import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { colors, Fonts } from '../../constants/constants';
import Rocket from '../../assets/image/svgIcons/rocket.svg';
import EndBlack from '../../assets/image/svgIcons/end_black.svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStackScreenStore } from '../../store/useStackScreenStore';
import  useCurrentRideInfoStore  from '../../features/rideStatus/store/useCurrentRideInfoStore';

import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import { useTranslation } from 'react-i18next';
import  useWayPointReorderStore from '../../features/booking/store/useWayPointReorderStore';
import {utils} from '../../utils/Utils';
import AdaptiveText from '../Common/AdaptiveText';
const AddressContainer = ({ directions,edit=false ,live=false,completed=false , bg=null, fromDriverArrival=false}) => {


  const getLocationIcon = (item,index,length,isReached) => {

    if(live && isReached){
      return <View style={{width:20,height:20,backgroundColor:'#00920a',borderRadius:100,alignItems:'center',justifyContent:'center'}}>
           <FontAwesome name="check" size={12} color={colors.white} />
      </View>
    }
  
    switch (index) {
      case 0:
        return <Rocket height={18} width={18} style={{color:isReached ? '#00920a': 'black'}}/>;
      case length-1:
        return <EndBlack height={20} width={20} color={colors.primary}/>;
      default:
        return <View style={{width:20,height:20,backgroundColor:'black',borderRadius:100,alignItems:'center',justifyContent:'center'}}>
          <Text style={{color:'white',fontSize:12,fontFamily:Fonts.regular}}>{index}</Text>
        </View>;
    }
  };

    const {setStackScreen} = useStackScreenStore()
    const {tripId,stops} = useCurrentRideInfoStore()
    const {t} = useTranslation();
    const {setOnGoingRideStops} = useWayPointReorderStore()
  const handleStopEdit = () => {
    console.log("beforeEditStops",stops)
    setOnGoingRideStops(stops)
    setStackScreen('WaypointScreen',{
      tripId:tripId,
      fromDriverArrival:fromDriverArrival
    })
  }
  
  return (
    <>
    <View style={[styles.parenrent]}>
    {edit && (<View style={{alignItems:"center",paddingVertical:10,flexDirection:"row",justifyContent:"space-between",paddingHorizontal:15}}>
       
  
       <AdaptiveText style={{fontSize:16, color:colors.grey_dark,fontFamily:Fonts.regular}}>{t('stops')}</AdaptiveText>
           <TouchableOpacity style={{flexDirection:'row',gap:5,alignItems:'center',paddingVertical:3,borderRadius:5}} onPress={handleStopEdit}>  
          
           <AdaptiveText style={{fontSize:14, color:colors.blue,fontFamily:Fonts.regular}}>{t('edit')}</AdaptiveText>
           <Icon name="edit" size={20} color={colors.blue} />
        
           </TouchableOpacity>
           
        
         </View> )}
     
    
    <View style={[styles.locationContainer,!edit && {backgroundColor:colors.white_dirt},bg && {backgroundColor:bg}]}>
      
        
   
        
      <View style={styles.line}></View>
      {directions.map((item, index) => {
        return (
          <View key={item.id} style={styles.locationNames}>
            {getLocationIcon(item,index,directions.length,item.isReached)}
            <View style={styles.locationTxtContainer}>
              <Text style={{fontSize:14, color:'#212121',fontFamily:Fonts.semi_bold}}>
                {index == 0 ? t('pickup') : index != directions.length-1 ? t('stop_index',{stop:index}) : t('drop')}
              </Text>
              <Text numberOfLines={2} ellipsizeMode="tail" style={styles.locationTxt}>
               {item.address ? utils.formatAddressName(item.address) : item.locationName}
              </Text>
              {(item.driverWaitTime || item.waitingTime) ? (
                <View style={{flexDirection:'row',gap:5,marginTop:5}}>
                  <Text style={{fontSize:12, color:colors.grey_dark,fontFamily:Fonts.regular}}>{t('driver_wait_time')} : </Text>
                  <Text style={{fontSize:12, color:colors.grey_xxdark,fontFamily:Fonts.semi_bold}}>
                    {(item.driverWaitTime ? item.driverWaitTime : item.waitingTime) + ' ' + t('mins')}
                  </Text>
                </View>
              ) : null}
              {item.arrivalTime && <View style={{flexDirection:'row',gap:5,alignItems:'center',marginTop:5}}>
                <Icon name="access-time" size={12} color={colors.grey_dark} />
                <Text style={{fontSize:12, color:colors.grey_dark,fontFamily:Fonts.regular}}>
                  {item.arrivalTime ? utils.formatDateAndTime(item.arrivalTime) : '--:--'}
                </Text>
              </View>}
              {
                completed && !item.isReached && (
                  <Text style={{fontSize:12, color:colors.red,fontFamily:Fonts.regular}}>
                    {t('not_reached')}
                  </Text>
                )
              }
           
             
             
            </View>
            {/* {edit && !item.isReached && (
              <TouchableOpacity style={{paddingTop:10}} onPress={handleStopEdit}>  
              <Icon name="edit" size={20} color={colors.black} />
              </TouchableOpacity>
            )} */}
          </View>
        );
      })}
    </View>
    
  
    </View>
   
    </>
    
  );
};

AddressContainer.propTypes = {
  directions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      locationName: PropTypes.string
    })
  ).isRequired,
  edit: PropTypes.bool,
  live: PropTypes.bool,
};

const styles = StyleSheet.create({
  parenrent:{
    marginVertical:15,
    marginBottom:30,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 10,
 
  },
  locationContainer: {
    backgroundColor: colors.white,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  
  },
  locationNames: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
   
  },
  locationTxtContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  locationTxt: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.black,
  },
  line:{
    position:'absolute',
    flex:1,
    width:1,
    borderLeftWidth:1,
    borderLeftColor:'grey',
    borderStyle:'dashed',
    left:25,
    right:0,
    top:0,
    bottom:0,
    marginVertical:40
  }
});

export default AddressContainer;