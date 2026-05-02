import {View, Text, TouchableOpacity, Linking, Platform} from 'react-native';
import React, {use, useContext, useState} from 'react';
import {ScrollView} from 'react-native-gesture-handler';
import Entypo from 'react-native-vector-icons/Entypo';
import usePublicDriverStore from '../store/usePublicDriverStore';
import useUserStore from '../../common/store/useUserStore';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import overlayController from '../Controller/OverlayController';
import { showNotification } from '../../common/components/Alerts/showNotification';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import useCurrentScreenStore from '../../common/store/useCurrentScreenStore';
import useDeviceAPIStore from '../../common/store/useDeviceAPIStore';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import { Colors, Icons } from '../../common/constants/constants';
import { settingsScreen } from '../styles/SettingsStyles';
import UseBackButton from '../../common/hooks/UseBackButton';
import { height } from '../../common/utils/scalingutils';

import DriverDetails from '../../notdriver/assets/icons/driverdetails.svg';
import Language from '../../notdriver/assets/icons/Language.svg';
import APIRequest from '../../common/APIRequest';
import User from '../../notdriver/assets/icons/User.svg'
import Supportticket from '../../notdriver/assets/icons/supportticket.svg';

import TicketSupportScreen from '../../common/screens/RiseSupportTicket/TicketSupportScreen';
import VehicleDetailsIcon from '../../notdriver/assets/icons/vehicleDetails.svg'
import VehicleDetails from './VehicleDetails';
import Help from '../../common/assets/icons/help.svg'
import SupportScreen from './SupportScreen';
import WriteReview from './WriteReview';
import Writereview from '../../notdriver/assets/icons/writereview.svg'
import TermsAndConditions from './TermsContent';
import Terms from '../../notdriver/assets/icons/terms.svg'
import PrivacyPolicy from './PrivacyPolicy';
import Privacy from '../../notdriver/assets/icons/privacy.svg'
import AboutUs from './AboutUs';
import About from '../../common/assets/icons/about.svg'
import MoreApp from '../../common/assets/icons/moreApp.svg'
import GlobalContext from '../../context/GlobalContext';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import LanguageScreen from '../../common/screens/OnBoard/LanguageScreen';

export default function PublicDriverSettingsScreen() {
  const {t} = useTranslation();
  // const resetAllStore = useResetStore();
  const {userInfo} = useUserStore();
  const {logout} = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const {setStackScreen} = useStackScreenStore();
  const {driverRole, setDriverRole, driverInfo} = usePublicDriverStore();
  const [screenData, updateScreenData] = useState(null);
  const [showScreen, setShowScreen] = useState(null);
  const navigation = useNavigation();

  const {setMapMarkers} = useMapMarkerStore();
  const {userDeviceId} = useDeviceAPIStore();

  const {setCurrentScreen} = useCurrentScreenStore();

  const settingsData = [
    {
      id: 1,
      name: 'My Account',
      icon: <DriverDetails width={30} height={30} />,
      screen: 'DriverAccountDetails',
      title: 'my_account',
    },
    {
      id: 22,
      name: "Language",
      icon: <Language />,
      component: <LanguageScreen fromSettings />,
      title: 'language',
    },
    // {
    //   id: 3,
    //   name: 'Company Info',
    //   icon: <CompanyInfo />,
    //   component: <CompanyInfoScreen />,
    //   title: 'company_info',
    // },
    {
      id: 2,
      name: 'Raise Ticket',
      icon:  <Supportticket width={30} height={30} />,
      component: <TicketSupportScreen />,
      title: 'raise_ticket',
      screen: 'TicketSupportScreen'
    },
    {
      id: 3,
      name: "vehicle_details",
      icon: <VehicleDetailsIcon width={35} height={35} />,
      component: <VehicleDetails />,
      title: 'vehicle_details'
    },
    {
      id: 4,
      name: 'Help & Support',
      icon: <Help />,
      component: <SupportScreen />,
      title: 'contact',
    },
    {
      id: 6,
      name: 'Send Feedback',
      icon: <Writereview width={35} height={35} />,
      component: <WriteReview />,
      title: 'send_feedback',
    },
    {
      id: 5,
      name: 'Terms and Conditions',
      icon: <Terms />,
      component: <TermsAndConditions type={'terms'} />,
      title: 'terms_and_conditions',
    },
    {
      id: 7,
      name: 'Privacy Policy',
      icon: <Privacy />,
      component: <PrivacyPolicy />,
      title: 'privacy_policy',
    },
    {
      id: 8,
      name: 'About Us',
      icon: <About />,
      component: <AboutUs />,
      title: 'about_us',
    },
    {
      id: 9,
      name: 'More Apps',
      icon: <MoreApp />,
      link: true,
      component: null,
      title: 'more_apps',
    },
  ];

  const handleLogout = async () => {
    setLoading(true);
    const url = `/publicrides/driver/v2/publicridesdriverLogout?platform=${Platform.OS}`;
    const api = new APIRequest();

    try {
      const response = await api.request(
        url,
        'POST',
        {fcmToken: {deviceImei: userDeviceId, token: userInfo?.token}},
        userInfo?.token,
      );

      if (!response.success)
        throw new Error(response.message || 'Network request failed');

      setMapMarkers(null);

      setTimeout(() => {
        // resetAllStore();
        logout('driver');
        setLoading(false);
        BGLocationTask.stopDriverBgTask();
        overlayController.stopOverlay();
        setLoading(false);
      }, 1000);

      // DataStore.clearSession();
    } catch (error) {
      console.log(error, 'Error logging out');
      showNotification(
        error?.message || 'Network request failed',
        '',
        'danger',
      );
    }
  };

  const onBackPress = () => {
    if (!screenData && !showScreen) { 
       setCurrentScreen('Map')
      return;
    }
    setShowScreen(false);
    updateScreenData({}); 
  };

  const onMenuPress = item => {
    if (item.screen) {
      setStackScreen(item.screen);
    } else {
      setShowScreen(true);
      updateScreenData(item);
    }
  };

  const modalScreen = () => {
    if (screenData.link) {
      setShowScreen(false);
      Linking.openURL(
        'https://play.google.com/store/apps/dev?id=6749335729462274356&hl=en-IN',
      );
      return;
    }

    return (
      <View style={settingsScreen.overlay}>
        <UseBackButton onBackPress={() => onBackPress()} />
        <View
          style={[settingsScreen.settingHeader, settingsScreen.modalHeader]}>
          <TouchableOpacity onPress={() => onBackPress()}>
            <View>{Icons.back_arrow}</View>
          </TouchableOpacity>
          <Text style={[settingsScreen.settingText, settingsScreen.headerText]}>
            {t(screenData.title) || screenData.name}
          </Text>
        </View>
        {screenData.component}
      </View>
    );
  };

  const filteredSettingsData = settingsData?.filter(item => driverRole === 'dco' ? item.id !== 3 : true);

  return (
    <View style={settingsScreen.screen}>
      {loading && <FullScreenLoader />}
      <UseBackButton onBackPress={() => onBackPress()} />
         <View style={[settingsScreen.profileContainer, {borderBottomWidth:0.3, backgroundColor:Colors.white}]}>
          <View style={settingsScreen.profileImageContainer}>
            <View style={settingsScreen.passangerImg}>
              <User width={60} height={60} />
            </View>
          </View>
          <View>
            <Text style={settingsScreen.helloTxt}>{t('hello')} !</Text>
            <Text style={settingsScreen.nameTxt}>{driverInfo?.name || driverInfo?.phone}</Text>
          </View>
        </View>
      <ScrollView contentContainerStyle={{paddingBottom: 150}}>
       
        {filteredSettingsData.map(item => {
          return (
            <TouchableOpacity
              key={item.id}
              style={settingsScreen.buttons}
              onPress={() => onMenuPress(item)}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {item.icon}
                <Text numberOfLines={2} style={settingsScreen.buttonsTxt}>
                  {t(item.title) || item.name}
                </Text>
              </View>
              <Entypo name="chevron-right" size={20} color={Colors.black} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity
        style={[
          settingsScreen.logoutButton,
          {
            bottom: height * 0.1,
            position: 'absolute',
            alignSelf: 'center',
            width: '80%',
          },
        ]}
        onPress={() => handleLogout()}>
        <Text style={settingsScreen.logoutButtonText}>{t('logout')}</Text>
      </TouchableOpacity>
      {showScreen && modalScreen()}
    </View>
  );
}
