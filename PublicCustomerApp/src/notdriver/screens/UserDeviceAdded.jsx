import {
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Popover from 'react-native-popover-view';


import NotificationPermission from '../../common/assets/icons/notification_per.svg';
import LocationPermission from '../../common/assets/icons/location_permission.svg';
import BGLocationPermission from '../../common/assets/icons/bloc_permission.svg';
import Overlay from '../../common/assets/icons/Overlay.svg';
import CustomToggleButton from '../../common/components/ToggleButton';
import useDeviceTokenStore from '../../common/store/useDeviceTokenStore';
import WarningMiniText from '../../common/components/WarningMiniText';
import { Colors, Fonts } from '../../common/constants/constants';
import { useTranslation } from 'react-i18next';

const UserDeviceAdded = ({ screenType, handleToggleButton }) => {
  const {t} = useTranslation()

  const hasLocationPermission = useDeviceTokenStore(
    state => state.hasLocationPermission,
  );
  const hasNotificationPermission = useDeviceTokenStore(
    state => state.hasNotificationPermission,
  );
  const hasBackgroundLocationPermission = useDeviceTokenStore(
    state => state.hasBackgroundLocationPermission,
  );

  const hasOverlayPermission = useDeviceTokenStore(
    state => state.hasOverlayPermission,
  );
  const overlayCheckSupported = useDeviceTokenStore(
    state => state.overlayCheckSupported,
  );
  // const hasUsageStatsPermission = useDeviceTokenStore(
  //   state => state.hasUsageStatsPermission
  // )

  // const hasAccessibilityPermission = useDeviceTokenStore(
  //   state => state.hasAccessibilityPermission
  // )

  return (
    <>
      <ScrollView style={userDeviceStyle.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={{ fontSize: 14, fontFamily: Fonts.light, color:Colors.black}}>
          {t('permission_screen_info')}
        </Text>

        <View style={userDeviceStyle.permissionContainer}>
          <View style={userDeviceStyle.upper}>
            <View style={userDeviceStyle.iconWithText}>
              <View style={userDeviceStyle.iconContainer}>
                <NotificationPermission width={20} height={20} />
              </View>

              <Text style={userDeviceStyle.title}>
                {t('notification_permission')}
              </Text>
            </View>

            <CustomToggleButton
              isToggled={hasNotificationPermission}
              setIsToggled={() => handleToggleButton('notification')}
            />
          </View>
        </View>
        <View style={userDeviceStyle.permissionContainer}>
          <View style={userDeviceStyle.upper}>
            <View style={userDeviceStyle.iconWithText}>
              <View style={userDeviceStyle.iconContainer}>
                <LocationPermission width={20} height={20} />
              </View>

              <Text style={userDeviceStyle.title}>
                {t('location_permission')}
              </Text>
            </View>

            <CustomToggleButton
              isToggled={hasLocationPermission}
              setIsToggled={() => handleToggleButton('location')}
            />
          </View>
        </View>
        <View style={userDeviceStyle.permissionContainer}>
          {Platform.OS === 'android' && Platform.Version <= 28 ? (
            <></>
          ) : (
            <View style={userDeviceStyle.upper}>
              <View style={{ gap: 5, flexDirection: 'row', alignItems: 'center' }}>
                <View style={userDeviceStyle.iconWithText}>
                  <View style={userDeviceStyle.iconContainer}>
                    <BGLocationPermission width={20} height={20} />
                  </View>

                  <Text style={[userDeviceStyle.title, { width: "100%" }]}>
                    {t('bg_loc_permission')}
                  </Text>
                  <Popover
                    from={(
                      <TouchableOpacity style={{ right: 10 }}>
                        <Icon name="help-outline" size={16} color="rgba(0,0,0,0.7)" />
                      </TouchableOpacity>
                    )}>
                    <Text style={{ color: "black", padding: 8, fontFamily: Fonts.light }}>
                      {t('not_tracking_info')}
                    </Text>
                  </Popover>
                </View>


              </View>

              <CustomToggleButton
                isToggled={hasBackgroundLocationPermission}
                setIsToggled={() => handleToggleButton('backgroundLocation')}
              />
            </View>
          )}
        </View>
           <View style={[userDeviceStyle.upper,{width: '94%', alignSelf: 'center', marginTop:10}]}>
           <View style={{ gap: 5, flexDirection: 'row', alignItems: 'center' }}>
             <View style={userDeviceStyle.iconWithText}>
               <View style={userDeviceStyle.iconContainer}>
                 <Overlay width={20} height={20} />
               </View>

               <Text style={[userDeviceStyle.title, { width: "100%" }]}>
                 {t('display_over_other_apps')}
               </Text>
               {!overlayCheckSupported && (
                 <Text style={userDeviceStyle.optionalTag}>(optional on this device)</Text>
               )}
               <Popover
                 from={(
                   <TouchableOpacity style={{ right: 10 }}>
                     <Icon name="help-outline" size={16} color="rgba(0,0,0,0.7)" />
                   </TouchableOpacity>
                 )}>
                 <Text style={{ color: "black", padding: 8, fontFamily: Fonts.light }}>
                  {t('display_over_other_apps_info')}
                 </Text>
               </Popover>
             </View>
           </View>
           <CustomToggleButton
             isToggled={hasOverlayPermission}
             setIsToggled={overlayCheckSupported ? () => handleToggleButton('overlay') : () => {}}
           />
         </View>     

        {Platform.OS === 'android' && Platform.Version <= 28 ? (
          <></>
        ) : (
          <>
            {Platform.OS === 'ios' ? <></> : <View style={[{
              margin: 10,
            }]}>
              <Text style={userDeviceStyle.title}>
                {t('disable_battery_optim')}
              </Text>
              <WarningMiniText
                text="disable_battery_info" />
            </View>

            }
          </>
        )}

        <Text style={userDeviceStyle.warningText}>
          {t('you_can_enable_in_this_screen')}
        </Text>
        <TouchableOpacity
          style={userDeviceStyle.settingsButton}
          onPress={() => Linking.openSettings()}>
          <Text style={userDeviceStyle.settingsButtonText}>
            {t('enable_disable_manually')}
          </Text>
        </TouchableOpacity>

      </ScrollView>

    </>

  );
};

export default UserDeviceAdded;

const userDeviceStyle = StyleSheet.create({
  container: { paddingHorizontal: 10, paddingBottom: 100 },
  upper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: 'rgba(0,0,0,0.7)', fontSize: 14, fontFamily: Fonts.regular, width: '90%', },
  errMsg: { fontSize: 12, color: 'red' },
  permissionContainer: { padding: 10, rowGap: 5 },
  warningText: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: Fonts.light,
  },
  settingsButton: { width: '100%', marginVertical: 10 },
  settingsButtonText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#454545',
    fontFamily: Fonts.light,
  },
  iconWithText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "70%",
  },
  iconContainer: {
    backgroundColor: Colors.pale_grey,
    padding: 8,
    borderRadius: 50,
    elevation: 1,
  },
  optionalTag: {
    marginLeft: 6,
    fontSize: 11,
    color: Colors.grey_dark,
    fontFamily: Fonts.light,
  }

});
