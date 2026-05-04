import React, { useRef, useEffect } from 'react';
import {
  Text,
  View,
  Animated,
  TouchableOpacity,
  ScrollView,
  Easing,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { drawerStyles } from '../../styles/DrawerStyles';
import { useStackScreenStore } from '../../store/useStackScreenStore';  

import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';

import ProfileImage from '../../assets/image/svgIcons/profileImage.svg';
import useUserInfoStore from '../../../common/store/useUserInfoStore';
import useSupportStore from '../../features/support/store/useSupportStore';
import AdaptiveText from '../Common/AdaptiveText';
import LinearGradient from 'react-native-linear-gradient';
import {colors} from '../../constants/constants';
import FemaleAvatar from '../../assets/image/femaleAvatar.svg';
import { openFeedbackSheet } from '../../store/useFeedbackSheetStore';
import useConfigStore from '../../store/useConfigStore';
const SideDrawerV2 = ({ handleMenu }) => {
  const { t } = useTranslation();
  const { userdetails,ratingData } = useUserInfoStore();
  const { setStackScreen } = useStackScreenStore();
  const { unreadCount } = useSupportStore();
  const { appConfig } = useConfigStore();

  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isFemale = userdetails?.gender === 'female';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setTimeout(() => {
        handleMenu();
      }, 0);
    });
  }
  
  const drawerData = [
    {
      id: 'my-account',
      name: t('my_account'),
      screen: 'MyAccountScreen',
      icon: <Ionicons name="person" size={20} color="black" />,
    },
    {
      id: 'your-rides',
      name: t('my_rides'),
      screen: 'MyRidesScreen',
      icon: <Ionicons name="car" size={20} color="black" />,
    },
    {
      id: 'hire-drivers',
      name: t('hire_drivers', 'Hire Drivers'),
      screen: 'HireDriversScreen',
      icon: <Ionicons name="car-sport" size={20} color="black" />,
    },
    {
      id: 'garage',
      name: t('garage', 'Garage'),
      screen: 'GarageScreen',
      icon: <Ionicons name="car-sport-outline" size={20} color="black" />,
    },
    {
      id: 'saved-places',
      name: t('saved_places'),
      screen: 'SavedPlacesScreen',
      icon: <Ionicons name="star" size={20} color="black" />,
    },
    // {
    //   id: 'preferences',
    //   name: t('preferences'),
    //   screen: 'PreferencesScreen',
    //   icon: <Ionicons name="options" size={20} color="black" />,
    // },
    // {
    //   id: 'receipts',
    //   name: 'Receipts',
    //   screen: 'ReceiptsScreen',
    //   icon: <Ionicons name="receipt" size={24} color="#1e3a8a" />,
    // },
    {
      id: 'notification',
      name: t('notification'),
      screen: 'NotificationSettingsScreen',
      icon: <Ionicons name="notifications" size={20} color="black" />,
    },
    {
      id: 'language',
      name: t('language'),
      screen: 'LanguageScreen',
      icon: <Ionicons name="globe" size={20} color="black" />,
    },
    {
      id: 'support',
      name: t('support'),
      screen: 'SupportScreen',
      icon: <Ionicons name="help-circle" size={20} color="black" />,
    },
    {
      id: 'driver-access',
      name: t('become_a_driver', 'Become a Driver'),
      screen: 'DriverAccessScreen',
      icon: <Ionicons name="car-outline" size={20} color="black" />,
    },
    {
      id: 'feedback',
      name: t('feedback_menu', 'Feedback'),
      icon: <Ionicons name="chatbubbles-outline" size={20} color="black" />,
      action: () => openFeedbackSheet({ screenName: 'SideDrawer' }),
    },
    {
      id: 'emergency',
      name: t('emergency_emergency_contact'),
      screen: 'EmergencyScreen',
      icon: <Ionicons name="alert-circle" size={20} color="black" />,

    },
    {
      id: 'contact-us',
      name: t('contact'),
      screen: 'ContactScreen',
      icon: <Ionicons name="headset" size={20} color="black" />,
    },
    // {
    //   id: 'about',
    //   name: 'About',
    //   screen: 'AboutScreen',
    //   icon: <Ionicons name="information-circle" size={24} color="#1e3a8a" />,
    // },
    {
      id: 'legal',
      name: t('legal'),
      screen: 'LegalScreen',
      icon: <Ionicons name="document-text" size={20} color="black" />,
    },
    // {
    //   id: 'contribution',
    //   name: t('contribution', 'Contribution'),
    //   screen: 'ContributionScreen',
    //   icon: <Ionicons name="add-circle-outline" size={20} color="black" />,
    // },
    // {
    //   id: 'tracking-test',
    //   name: 'Tracking Test',
    //   screen: 'TrackingTestScreen',
    //   icon: <Ionicons name="locate" size={20} color="black" />,
    // },
    
    // {
    //   id: 'test-screen',
    //   name: t('test_screen'),
    //   screen: 'ScheduleScreen',
    //   icon: <Ionicons name="flask" size={20} color="black" />,
    // },
  ].filter(Boolean);



  const HandleOpenDrawerMenu = (menu) => {
    if (menu.screen) {
      if (menu.screen === 'LanguageScreen'){
        setStackScreen(menu.screen,{fromDrawer:true});
      }
      
      else if (menu.screen === 'DriverAccessScreen'){ 
         setStackScreen(menu.screen,{fromHome:true});
      }        
      else{
        
        setStackScreen(menu.screen);
      }
      
    } else if (typeof menu.action === 'function') {
      menu.action();
    }
    closeDrawer();
  }
  


  return (
    <Animated.View style={[drawerStyles.container, {opacity: fadeAnim}]}>
      <Animated.View style={[drawerStyles.drawercontainer, {transform: [{translateX: slideAnim}]}]}>
        <LinearGradient colors={[colors.grey_dark,'#303030']}  start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}style={drawerStyles.profileContainer}>
          {isFemale ? <FemaleAvatar width={60} height={60} /> : <ProfileImage width={60} height={60} /> }
          <View style={{flexDirection:'column',alignItems:'flex-start',gap:0,flex:1}}>
          <Text style={drawerStyles.userName}  numberOfLines={1} >{userdetails?.name}</Text>
        {(ratingData && ratingData.currentrating != null) && (
          <Text style={drawerStyles.ratingText}>
            ★ {ratingData.currentrating != null ? ratingData.currentrating.toFixed(1) : 0} ({ratingData.count != null ? ratingData.count : 0})
          </Text>
        )}
          </View>
        </LinearGradient>
        <View style={drawerStyles.contentContainer}>
          <ScrollView>
            {drawerData.map(item => {
              return (
                <React.Fragment key={`drawer-${item.id}`}>
                <TouchableOpacity
                  style={drawerStyles.drawerBtns}
                  onPress={() => HandleOpenDrawerMenu(item)}
                >
                  <View style={{ position: 'relative',flexDirection:'row',alignItems:'center',gap:15 }}>
                    {item.icon}
                 
                  <AdaptiveText style={drawerStyles.btnText} color={colors.black}>{item.name}</AdaptiveText>
                  </View>
                  <Ionicons name={'chevron-forward'} size={20} color={'#757575'} />
                </TouchableOpacity>
                {drawerData.indexOf(item) !== drawerData.length - 1 && <View style={drawerStyles.divider} />} 
                </React.Fragment>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>
      <View style={drawerStyles.closeBtnMainContainer} onPress={closeDrawer} >
        <TouchableOpacity onPress={closeDrawer} style={drawerStyles.closeBtnContainer}>
            <Ionicons name={'close'} size={30} color={'black'} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

SideDrawerV2.propTypes = {
  handleMenu: PropTypes.func.isRequired,
};

export default SideDrawerV2;
