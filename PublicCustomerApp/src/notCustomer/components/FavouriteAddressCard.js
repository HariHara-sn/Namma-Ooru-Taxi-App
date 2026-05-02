import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Fonts } from '../constants/constants';
import HomeIcon from '../assets/icons/HomeIcon.svg';
import WorkIcon from '../assets/icons/WorkIcon.svg';
import { utils, width } from '../utils/Utils';
import Ionicons from 'react-native-vector-icons/Ionicons';

const FavouriteAddressCard = ({ 
    homeLocation,
    workLocation,
    LocationPress,
  
}) => {
  const responsiveMaxWidth = width * 0.8;

  
  return (


    <View style={[styles.FavouriteAddressContainer,homeLocation || workLocation ? {} : styles.noLocation]}>
          <TouchableOpacity style={[styles.FavouriteAddressItem,homeLocation || workLocation ? {} : styles.noLocationItem]} onPress={() => LocationPress('Home',homeLocation)}>
              <View style={styles.FavouriteAddressItemIcon}>
                  <HomeIcon width={50} height={50} />
              </View>
              {homeLocation ? 
              <View style={styles.FavouriteAddressItemTextContainer}>
                  <Text style={styles.FavouriteAddressItemText}>Home</Text>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.FavouriteAddressItemSubText, { maxWidth: responsiveMaxWidth }]}>{utils.toTitleCaseName(homeLocation?.name)}, {homeLocation.address}</Text>
              </View> : <View style={styles.addLocation}>
               
                <Text style={[styles.addLocationText, {color: "#37f"}]}>Add Home</Text>
            
              </View>
              }
          </TouchableOpacity>
          <TouchableOpacity style={[styles.FavouriteAddressItem,workLocation || homeLocation ? {} : styles.noLocationItem]} onPress={() => LocationPress('Work',workLocation)}>
              <View style={styles.FavouriteAddressItemIcon}>
                  <WorkIcon width={50} height={50} />
              </View>
              {workLocation ? 
              <View style={styles.FavouriteAddressItemTextContainer}>
                  <Text style={styles.FavouriteAddressItemText}>Work</Text>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.FavouriteAddressItemSubText, { maxWidth: responsiveMaxWidth }]}>{utils.toTitleCaseName(workLocation?.name)}, {workLocation.address}</Text>
              </View> : <View style={styles.addLocation}>
             
                <Text style={[styles.addLocationText, {color: "#0cb400"}]}>Add Work </Text>
            
              </View>}
          </TouchableOpacity>
    </View>


  );
};

const styles = StyleSheet.create({
   
    FavouriteAddressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        paddingHorizontal: 16,
        paddingVertical: 0,
        borderRadius: 16,
       
      },
      noLocationItem: {
        gap: 10,
        
        backgroundColor: '#e0e0e0'+'50',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 5,
        
      },
      FavouriteAddressContainer:{
        gap: 20,
        marginTop: 20,
      
      },

      noLocation: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 0,
        borderRadius: 16,
       
      },
      FavouriteAddressItemIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        
      },
      FavouriteAddressItemTextContainer: {
        gap: 5,
        paddingLeft: 5,
      },
      FavouriteAddressItemText: {
        fontFamily: Fonts.regular,
        fontSize: 16,
        textAlign: 'left',
        color: '#212121',
        
      },
      FavouriteAddressItemSubText: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: '#757575',
        textAlign: 'left',
      },
      addLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
       
        paddingVertical: 0,
        borderRadius: 16,
        paddingHorizontal: 5,
       
      },
      addLocationText: {
        fontFamily: Fonts.regular,
        fontSize: 16,
        color:"grey",
        textAlign: 'left',
      },
});

export default FavouriteAddressCard; 