import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, Fonts } from '../../../constants/constants';
import HomeIcon from '../../../assets/icons/HomeIcon.svg';
import WorkIcon from '../../../assets/icons/WorkIcon.svg';
import FavIcon from '../../../assets/icons/FavIcon.svg';
import {  utils, width } from '../../../utils/Utils';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import {useStackScreenStore} from '../../../store/useStackScreenStore';
import AddFavIcon from '../../../assets/icons/AddFavIcon.svg';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { firebaselog_ridePlanning } from '../../../../common/utils/FirebaseAnalytics';


const FavLabelItems = React.memo(({onLabelPress,enableAdd=true,onLocationAdd=null}) => {
  const { t } = useTranslation();
  const responsiveMaxWidth = width * 0.8;
  const {userFavPlaces} = useUserInfoStore();
  const {setStackScreen} = useStackScreenStore();

  const handleAddFavPlacePress = () => {
    setStackScreen('SavedPlacesScreen',{
      
    });
  }

  // Check if there are no favorite places
  const hasNoFavorites = !userFavPlaces || userFavPlaces.length === 0;

  
  return (
    <View style={styles.FavouriteAddressContainer}> 
      {onLocationAdd && (
        <TouchableOpacity  style={styles.FavouriteAddressItem} onPress={()=>onLocationAdd()}>
            <View style={[styles.FavouriteAddressItemIcon,{backgroundColor:colors.grey_xlight, borderRadius:30, padding:10,marginLeft:5}]}>
               <Icon name="location-on" size={24} color={colors.dark} />
            </View>
           <View  style={styles.FavouriteAddressItemTextContainer}>
           <AdaptiveText style={styles.FavouriteAddressItemText}>{t('locate_on_map')}</AdaptiveText>
           
       </View>
       </TouchableOpacity>

      )}
      {userFavPlaces?.length > 0 && <AdaptiveText style={styles.FavouriteAddressContainerTitle}>{t('favorite_places')}</AdaptiveText>}
      {hasNoFavorites && enableAdd ? (
       
        // <TouchableOpacity style={styles.FavouriteAddressItem} onPress={handleAddFavPlacePress}>
         
        //   <View style={styles.AddFavouriteAddressItemTextContainer}>
        //     <AdaptiveText style={[styles.FavouriteAddressItemText,{color:"#757575"}]}>+ {t('add_favorite_places')}</AdaptiveText>
        //   </View>
        // </TouchableOpacity>
        <View >
          </View>
      ) : (
    
        userFavPlaces?.map((item,index)=>(
          <TouchableOpacity key={index} style={styles.FavouriteAddressItem} onPress={()=>{
            firebaselog_ridePlanning('RP_Place_Select_Method(RP_PSM)', `RP_PSM:fav_places`);
            onLabelPress(item.label,item.locationData)}}>
            <View style={styles.FavouriteAddressItemIcon}>
              {item.label.toLowerCase() === 'home' ? <HomeIcon width={50} height={50} /> : item.label.toLowerCase() === 'work' ? <WorkIcon width={50} height={50} /> : <View style={{paddingHorizontal:2}}><FavIcon width={45} height={45} /></View>  }
            </View>
           <View key={index} style={styles.FavouriteAddressItemTextContainer}>
           <AdaptiveText style={styles.FavouriteAddressItemText}>{item.label}</AdaptiveText>
           <AdaptiveText numberOfLines={1} ellipsizeMode="tail" fontSize={13} style={[styles.FavouriteAddressItemSubText, { maxWidth: responsiveMaxWidth-10 }]}>{utils.formatAddressName(item.locationData)}</AdaptiveText>
       </View>
       </TouchableOpacity>
        ))
      )}
    </View>
  );
});

FavLabelItems.displayName = 'FavLabelItems';

const styles = StyleSheet.create({
   
    FavouriteAddressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
       
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
        marginVertical: 10,
        paddingHorizontal: 5,
      
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
        textTransform: 'capitalize',
        
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
      AddFavouriteAddressItemTextContainer: {
        flex:1,
        alignItems: 'center',
        justifyContent:'center',
        padding:10,
        paddingVertical:10,
        marginHorizontal:5,
        borderRadius: 16,
        borderWidth:1,
        borderColor:"#757575",
        borderStyle:"dashed",
       
      },
      FavouriteAddressContainerTitle: {
        
          // fontSize: 16,
          // fontFamily: Fonts.medium,
          // color: colors.black,
          // paddingLeft:10
        marginTop: 10,
        marginBottom: 5,
        marginLeft: 5,
        fontSize: 18,
        fontFamily: Fonts.medium,
        color: "#969696ff",
        
      },
});

export default FavLabelItems; 