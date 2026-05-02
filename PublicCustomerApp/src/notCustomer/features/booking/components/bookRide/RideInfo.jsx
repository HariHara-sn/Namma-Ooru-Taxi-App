import React, { useState ,useEffect} from 'react';
import { View, Text, StyleSheet,TouchableOpacity} from 'react-native';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TripRouteIcon from "../../../../assets/icons/tripRouteIcon.svg"

import { Fonts } from "../../../../constants/constants"
import PreferenceIcon from "../../../../assets/icons/PrefrenceIcon.svg"
import useRideBookingInfo from "../../store/useRideBookingInfo"
const RideInfo = ({
  distance = '30',
  showPreference =null,
  hidePreference = false,
}) => {
  const { t } = useTranslation();
  const [hasAnyPreference,setHasAnyPreference] = useState(false)
  const {femaleDriverOnly,safeNightRides} = useRideBookingInfo()
  useEffect(()=>{
    if(femaleDriverOnly || safeNightRides){
      setHasAnyPreference(true)
    }else{
      setHasAnyPreference(false)
    }
   
  },[femaleDriverOnly,safeNightRides])
  return (
    
    <View style={[styles.container, ]}>
      <View style={styles.infoItem}>
        <TripRouteIcon width={16} height={16}/>
        <Text style={[styles.infoText]}>{distance} {t('km')}</Text>
      </View>
      
      {/* <View style={styles.infoItem}>
        <DurationIcon width={16} height={16}/>
                    <Text style={[styles.infoText, textStyle]}>{minDuration} - {maxDuration} min</Text>
      </View>
      <View style={styles.infoItem}>
                        <RupeeIcon width={16} height={16}/>
            <Text style={[styles.infoText, textStyle]}>₹{minFare} - ₹{maxFare}</Text>
      </View> */}
      {hidePreference ? null : (
        <TouchableOpacity style={styles.preferenceContainer} onPress={()=>{showPreference(true)}}> 
          {hasAnyPreference && <View style={styles.preferenceIconContainer}/>}
              <PreferenceIcon width={35} height={35}/>
        </TouchableOpacity>
      )}
    </View>
  );
};

RideInfo.propTypes = {
  distance: PropTypes.string,
  duration: PropTypes.string,
  fare: PropTypes.string,
  containerStyle: PropTypes.object,
  textStyle: PropTypes.object,
  iconColor: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    position:"sticky",
    top:0,
    
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex:1000,
    paddingHorizontal:10,
    alignItems:"center",
    
  },
  preferenceIconContainer: {
    position:"absolute",
    height:10,
    width:10,
    borderRadius:5,
    right:0,
    top:0,
    zIndex:1,
    backgroundColor:"red",
    borderWidth:1,
    borderColor:"white",
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:10,
   
  },
  icon: {
    marginRight: 6,
    
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    fontFamily:Fonts.regular
  },
  
});

export default RideInfo;
