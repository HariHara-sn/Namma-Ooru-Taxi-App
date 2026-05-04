import React, {
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {DataStore} from '../common/controllers/DataStore';
import SplashScreen from '../common/screens/SplashScreen';
import WelcomeScreen from '../common/screens/OnBoard/WelcomeScreen.jsx';
import LanguageScreen from '../common/screens/OnBoard/LanguageScreen.jsx';
import OnBoarding from '../common/screens/OnBoard/OnBoarding.jsx';
import Home from '../notCustomer/screens/Home';
import TrackingTestScreen from '../common/screens/TrackingTestScreen.jsx';
import LocationPermissionScreen from '../common/screens/LocationPermissionScreen';
import LoginScreen from '../common/screens/authentication/LoginScreen';
import RegisterationScreen from '../common/screens/authentication/RegisterationScreen';
import OTPScreen from '../common/screens/authentication/OTPScreen';
import DriverAccessScreen from '../common/screens/Driver/DriverAccessScreen.jsx';
import useUserInfoStore from '../common/store/useUserInfoStore';
import {GlobalContext} from '../context/GlobalContext';
import PropTypes from 'prop-types';
import i18n from '../common/i18n';
import InAppUpdates from '../utils/InAppUpdates';

import ContactScreen from '../notCustomer/features/about/screens/ContactScreen';
import useUserStore from '../common/store/useUserStore.js';
import DriverHomeScreen from '../notdriver/screens/DriverHomeScreen.js';
import ActingDriverHome from '../actingDriver/screens/ActingDriverHome.js';
import { APP_CONFIG } from '../config/appConfig';
import AppConfig from '../notCustomer/Config/AppConfig.js';

const Navigation = () => {
  const Stack = createNativeStackNavigator();
  const [initialRoute, setInitialRoute] = useState('LanguageScreen');
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const {addListener, addNOTSocketListener, addRideMatchListener} = useContext(GlobalContext);
  const {setLanguage} = useUserInfoStore();

  const {userRole, setUserRole, setUserInfo} = useUserStore();

  // useRideMatching();

  const nextScreen = useCallback(async () => {
    const userRole = await DataStore.loadData('userRole');
    const language = await DataStore.loadData('language');
    // const onBoarding = await DataStore.loadData('onBoarding');
    const access_token = await DataStore.loadData('access_token');
    const user_details = await DataStore.loadData('userdetails');
    // const userInfo = await DataStore.loadData('userdetails');

    if (userRole?.data) {
      setUserRole(userRole.data);
    }

    // DEV OVERRIDE: Directly navigate to HomeScreen for specific role
    if (APP_CONFIG.DEV_MODE === true) {
      const devRole = APP_CONFIG.DEV_ROLE || 'customer';
      setUserRole(devRole);
      setInitialRoute('HomeScreen');
      if (access_token?.data) {
        if (devRole === 'driver' || devRole === 'actingDriver') {
          addNOTSocketListener(access_token.data);
          addRideMatchListener(user_details?.data?._id);
        } else {
          addListener(access_token.data);
        }
        setUserInfo(user_details?.data);
      }
      return;
    }

    if (userRole?.data === 'driver' || userRole?.data === 'actingDriver') {
      if (access_token.data) {
        setInitialRoute('HomeScreen');
        console.log('Driver Access Token:', user_details?.data?._id);
        addNOTSocketListener(access_token?.data);
        addRideMatchListener(user_details?.data?._id);
        setUserInfo(user_details?.data);
      } else {
        setInitialRoute('LoginScreen');
      }
      return;
    }

    if (access_token.data) {
      setInitialRoute('HomeScreen');
      addListener(access_token.data);

    } else if (language.data && language.data !== 'languageDone') {
      // If language is stored as a language code (en, ta, hi, etc.)
      setLanguage(language.data);
      try {
        i18n.changeLanguage(language.data);
      } catch (e) {
        console.warn('i18n changeLanguage failed', e);
      }

      // if (onBoarding.data === 'onBoardingDone') {
      //   setInitialRoute('LoginScreen');
      // } else {
      //   setInitialRoute('OnBoarding');
      // }
      setInitialRoute('LoginScreen');
    } else {
      setInitialRoute('LanguageScreen');
    }
  }, []);

  const roleBasedScreens = useMemo(() => {
    switch (userRole) {
      case 'customer':
        return {
          homeScreen: Home,
        };
      case 'driver':
        return {
          homeScreen: DriverHomeScreen,
        };
      case 'actingDriver':
        return {
          homeScreen: ActingDriverHome,  //driverpage
        };
      default:
        return {
          homeScreen: Home,
        };
    }
  }, [userRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      nextScreen().finally(() => {
        setIsSplashLoading(false);
        // if (typeof onSplashComplete === 'function') {
        //   onSplashComplete();
        // }
      });
    }, __DEV__ ? 10 : 3000);
    return () => clearTimeout(timer);
  }, [nextScreen /*onSplashComplete*/]);

  // Call in-app update check with 2-second delay after splash screen completes
  useEffect(() => {
    if (isSplashLoading) return;
    const timeoutId = setTimeout(() => {
      console.log(
        '[Navigation] Checking for in-app updates (immediate/force) after splash...',
      );
      InAppUpdates.checkUpdateStatus();
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [isSplashLoading]);

  if (isSplashLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="LanguageScreen" component={LanguageScreen} />
      <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
      <Stack.Screen name="OnBoarding" component={OnBoarding} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen
        name="RegisterationScreen"
        component={RegisterationScreen}
      />
      <Stack.Screen name="OTPScreen" component={OTPScreen} />
      <Stack.Screen name="HomeScreen" component={roleBasedScreens.homeScreen} />
      <Stack.Screen name="TrackingTestScreen" component={TrackingTestScreen} />
      <Stack.Screen
        name="LocationPermission"
        component={LocationPermissionScreen}
      />
      <Stack.Screen name="DriverAccessScreen" component={DriverAccessScreen} />
      <Stack.Screen name="ContactScreen" component={ContactScreen} />
    </Stack.Navigator>
  );
};

export default Navigation;

Navigation.propTypes = {
  onSplashComplete: PropTypes.func,
};
