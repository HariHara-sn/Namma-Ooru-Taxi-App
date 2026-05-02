import React, {useState, useRef, useCallback} from 'react';
import {
  Text,
  View,
  Animated,
  TouchableOpacity,
  ScrollView,
  Linking,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DeviceInfo from 'react-native-device-info';

import Logo from '../../common/assets/icons/CompanyLogo.svg';
import DriverLogo from '../../notCustomer/assets/image/logo.svg';
import PriceChart from '../../notdriver/assets/icons/priceChart.svg';
import DriverDetails from '../../notdriver/assets/icons/driverdetails.svg';
import useDeviceTokenStore from '../../common/store/useDeviceTokenStore';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import useUserStore from '../../common/store/useUserStore';
import {useStackScreenStore} from '../../common/store/useStackScreenStore';
import {homeStyles} from '../styles/homeStyles';
import {driverDrawerStyles} from '../styles/driverDrawerStyles';
import {Colors, Fonts} from '../../common/constants/constants';
import {flexStyle} from '../../common/styles/flexStyle';
import {useTranslation} from 'react-i18next';
import {loginStyles} from '../../notCustomer/styles/UserStyles';

const SideDrawerPublicRides = () => {
  const {width: WIDTH} = Dimensions.get('window');
  const {selectedLanguage, trackingMode, userRole} = useUserStore();
  const width = selectedLanguage === 'ar' ? WIDTH : -WIDTH;

  const {
    hasLocationPermission,
    hasNotificationPermission,
    hasBackgroundLocationPermission,
    hasActivityRecognitionPermission,
    hasUsageStatsPermission,
  } = useDeviceTokenStore();

  const setStackScreen = useStackScreenStore(state => state.setStackScreen);

  const [isHidden, setIsHidden] = useState(true);
  const bounceValue = useRef(new Animated.Value(width)).current;
  const [drawerData, setDrawerData] = useState([
    {
      id: 1,
      name: 'My Account',
      icons: <DriverDetails width={20} height={20} />,
      screenName: 'DriverAccountDetails',
      title: 'my_account',
    },
    {
      id: 2,
      name: 'Price Chart',
      screenName: 'PriceChart',
      icons: <PriceChart width={20} height={20} />,
      title: 'price_chart',
    },
  ]);

  const {t} = useTranslation();

  const _toggleSubview = useCallback(() => {
    let toValue = width;
    if (isHidden) {
      toValue = 0;
    }
    Animated.spring(bounceValue, {
      toValue: toValue,
      velocity: 3,
      tension: 2,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setIsHidden(!isHidden);
  }, [isHidden]);

  const onPressMenu = item => {
    setStackScreen(item.screenName);
  };

  const handlePress = () => {
    Linking.openURL('https://virtualmaze.com/');
    return true;
  };

  const hasAllPermissions =
    hasNotificationPermission &&
    hasLocationPermission &&
    hasActivityRecognitionPermission &&
    hasBackgroundLocationPermission &&
    BGLocationTask.isRunning() &&
    hasUsageStatsPermission;

  const getDrawerData = () => {
    if (trackingMode === 'vehicle_tracking') {
      return drawerData.filter(
        item =>
          item.id !== 1 &&
          item.id !== 2 &&
          item.id !== 4 &&
          item.id !== 7 &&
          item.id !== 8 &&
          item.id !== 10,
      );
    }
    if (trackingMode === 'mobile_tracking') {
      return drawerData.filter(
        item =>
          item.id !== 5 && item.id !== 6 && item.id !== 8 && item.id !== 9,
      );
    }
    if (trackingMode === 'combined_tracking') {
      return drawerData.filter(item => item.id !== 9 && item.id !== 10);
    }
    return drawerData;
  };

  return (
    <>
      <View style={homeStyles.userdetails}>
        <TouchableOpacity
          style={driverDrawerStyles.iconOpen}
          onPress={_toggleSubview}>
          <MaterialCommunityIcons
            name="format-list-bulleted-type"
            color={Colors.white}
            size={25}
            onPress={() => _toggleSubview()}
          />
        </TouchableOpacity>
      </View>
      <TouchableWithoutFeedback onPress={() => _toggleSubview()}>
        <Animated.View
          style={[
            driverDrawerStyles.subView,
            {transform: [{translateX: bounceValue}]},
          ]}>
          <View style={[driverDrawerStyles.subContainer]}>
            <View
              style={{
                alignItems: 'center',
                paddingTop: 16,
                backgroundColor: Colors.grey_light,
                marginVertical: 20,
                padding: 5,
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 10,
                elevation: 5,
                justifyContent: 'space-evenly',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-evenly',
                  width: '100%',
                }}>
                <DriverLogo width={50} height={50} />
                <Text style={[loginStyles.headerTxt, {fontSize: 18}]}>
                  Namma Ooru Taxi ® {'\n'}{' '}
                  {userRole === 'driver'
                    ? t('driver_login')
                    : t('customer_login')}
                </Text>
              </View>
              <Text style={driverDrawerStyles.versionText}>
                v{DeviceInfo.getVersion()} ({DeviceInfo.getBuildNumber()})
              </Text>
            </View>

            <View style={[driverDrawerStyles.optionsContainer]}>
              <ScrollView
                contentContainerStyle={{paddingBottom: 300}}
                showsVerticalScrollIndicator={false}>
                {getDrawerData().map(item => {
                  return (
                    <TouchableOpacity
                      style={driverDrawerStyles.optionBtns}
                      key={item.id}
                      onPress={() => onPressMenu(item)}>
                      <View style={flexStyle.frg10}>
                        {item.icons}
                        <Text style={driverDrawerStyles.optionName}>
                          {t(item.title)}
                        </Text>
                        {item.name === 'Track Your Device' &&
                        !hasAllPermissions > 0 ? (
                          <View
                            style={{
                              position: 'absolute',
                              right: 20,
                              backgroundColor: Colors.periwinkle,
                              height: 15,
                              width: 15,
                              borderRadius: 7.5,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            <Text style={{color: 'white', fontSize: 10}}>
                              {1}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <TouchableOpacity
              style={driverDrawerStyles.madeByBtn}
              onPress={() => handlePress()}>
              <Text style={driverDrawerStyles.madeByText}>Made By</Text>
              <Logo width={50} height={35} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={driverDrawerStyles.iconClose}
            onPress={_toggleSubview}>
            <Ionicons name="close-sharp" color={Colors.white} size={25} />
          </TouchableOpacity>
        </Animated.View>
      </TouchableWithoutFeedback>
    </>
  );
};
export default SideDrawerPublicRides;
