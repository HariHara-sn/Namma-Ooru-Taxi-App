import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
  } from 'react-native';
  import React from 'react';
  import { useTranslation } from 'react-i18next';
  import {Fonts,colors} from '../../../constants/constants';
  import ProfileImage from '../../../assets/image/svgIcons/profileImage.svg';
  import FemaleAvatar from '../../../assets/image/femaleAvatar.svg';
  import useLocationStore from '../../../store/useLocationStore';
  import HomeMenuIcon from '../../../assets/icons/HomeMenu.svg';
  import {utils, width} from '../../../utils/Utils';
import CurrentLocationIcon from '../../../assets/icons/CurrentLocationIcon.svg';
import { height } from '../../../utils/Utils';
import locationTask from '../../../controllers/GetCurrentLocation';
import { isSystemLocationEnabled, openSystemLocationSettings } from '../../../controllers/PermissionHandler';
import SkeletonLoader from '../../../components/Loaders/SkeletonLoader';
import PropTypes from 'prop-types';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import TextTicker from 'react-native-text-ticker'
  
  const LocationHeader = React.memo((props) => {
    const { t } = useTranslation();
    const {toggleMenu} = props;
    const {userdetails} = useUserInfoStore();
    const { currentLocationName } = useLocationStore();
   
    const handleCurrentLocation = async () => {
      try {
        await locationTask.getCurrentLocation();
        const enabled = await isSystemLocationEnabled();
        if (!enabled) {
          Alert.alert(
            'Location is turned off',
            'Please enable system Location services to continue.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Enable',
                onPress: async () => {
                  try {
                    const stillOff = await isSystemLocationEnabled();
                    if (!stillOff) {
                      await openSystemLocationSettings();
                      return;
                    }
                  } catch (e) { /* no-op */ }
                },
              },
            ],
          );
          return;
        }
      } catch (e) { /* no-op */ }
     
    }
    // Calculate responsive maxWidth (70% of screen width)
    const responsiveMaxWidth = width * 0.7;
  
    return (
      <View style={styles.headerWrapper}>
      <View style={styles.addressContainer}>
        <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
        }}>
        <TouchableOpacity style={styles.homeMenuIcon} onPress={() => toggleMenu()}>
          <HomeMenuIcon width={20} height={20} />
        </TouchableOpacity>
        <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center'}}>
         {userdetails?.gender === 'female' ? <FemaleAvatar width={40} height={40} /> : <ProfileImage width={40} height={40} />}
        </TouchableOpacity>
        </View>
        <View style={{marginLeft: 10}}>
        <Text style={styles.title}>{t('your_location')}</Text>
        {currentLocationName ? (
          <TextTicker
          style={[styles.address]}
          duration={30000}
          scroll={true}
          repeatSpacer={150}
          marqueeDelay={1500}
          bounce={false}
          >
          {utils.formatAddressName(currentLocationName)}
          </TextTicker>
        ) : (
          <SkeletonLoader
          height={20}
          width={responsiveMaxWidth - 50}
          backgroundColor={colors.grey_xlight}
          />
        )}
        </View>
      </View>
      <TouchableOpacity style={styles.currentLocationIconContainer} onPress={handleCurrentLocation}>
        <CurrentLocationIcon width={25} height={25} />
      </TouchableOpacity>
      </View>
    );
  });
  LocationHeader.propTypes = {
    toggleMenu: PropTypes.func.isRequired,
  };

  LocationHeader.displayName = 'LocationHeader';
  
  export default LocationHeader;
  
  const styles = StyleSheet.create({
    headerWrapper: {
      position: 'relative',
      width: '100%',
      // Ensures the wrapper takes up space for absolute positioning
      minHeight: 80,
      zIndex: 100,
    },
    addressContainer: {
      position: 'absolute',
      top: 20,
      left: '5%',
      right: '5%',
      zIndex: 100,
      flexDirection: 'row',
      padding: 8,
      elevation: 5,
      overflow: 'hidden',
      width: '90%',
      alignSelf: 'center',
      borderRadius: 16,
      boxShadow: '0 3px 6px 0 rgba(0, 0, 0, 0.05)',
      border: 'solid 0.5px #e0e0e0',
      backgroundColor: '#fff',
      marginRight: 10,
    },
    homeMenuIcon: {
      paddingLeft: 10,
      paddingRight: 7,
     
      alignItems:"center",
      justifyContent:"center",
      height: "100%",
    },
    addressProfileImage: {
      width: 40,
      height: 40,
      marginRight: 10,
    },
    title: {
      fontFamily: Fonts.regular,
      fontSize: 12,
      color: '#757575',
      maxWidth: '95%',
    },
    address: {
      color: '#212121',
      fontSize: 14,
      fontWeight: 500,
      marginTop: 2,
      fontFamily: Fonts.medium,
    },
    currentLocationIconContainer: {
      position: 'absolute',
      height: 40,
      width: 40,
      right: 30,
      bottom: -height*0.06,
      zIndex: 101,
      backgroundColor: 'white',
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 30,
      elevation: 10,
     
    },
  });