import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useCallback, useState} from 'react';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import useUserStore from '../../common/store/useUserStore';
import useDriverStatusStore from '../store/useDriverStatusStore';
import { showNotification } from '../../common/components/Alerts/showNotification';
import { openOverLaySettings, RequestActivityPermission, RequestBackgroundLocationPermission, RequestFineLocationPermission, RequestNotificationPermission } from '../../common/controllers/PermissionHandler';
import APIRequest from '../../common/APIRequest';
import { DataStore } from '../../common/controllers/DataStore';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import { permissionData } from '../../common/constants/jsonData';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import NavBar from '../../common/components/NavBar';
import UseBackButton from '../../common/hooks/UseBackButton';
import { Colors, Fonts } from '../../common/constants/constants';
import UserDeviceAdded from './UserDeviceAdded';
import PopupContainerWithBtns from '../../common/components/PopupContainerWithBtns';
import BgLocation from '../../notdriver/assets/icons/Location.svg';
import useDeviceTokenStore from '../../common/store/useDeviceTokenStore';
import overlayController from '../../common/controllers/Overlay';
import { useTranslation } from 'react-i18next';
import rideMatchWSService from '../../common/controllers/socketServices/RideMatchSocketService';
import locationTask from '../../common/controllers/GetCurrentLocation';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';

const DriverPermissionScreen = () => {
  const {t} = useTranslation();
  const {goBack} = useStackScreenStore();
  const {hasLocationPermission, setHasNotificationPermission, setHasLocationPermission, hasNotificationPermission, hasBackgroundLocationPermission, setHasBackgroundLocationPermission, hasOverlayPermission, setHasOverlayPermission, overlayCheckSupported} = useDeviceTokenStore();

  const [togglePopup, setTogglePopup] = useState(false);
  const [type, setType] = useState('backgroundLocation');
  const [isLoading, setIsLoading] = useState(false);
  const {userInfo} = useUserStore()
  const {setDriverStatus} = useDriverStatusStore();

  const {userLocation} = useMapMarkerStore()

  const onBackPress = () => {
    goBack();
  };

  const handleToggleButton = async type => {
    if (type === 'notification') {
      if (hasNotificationPermission)
        return showNotification(
          `${t('notification_permission')} ${t('already_enabled')}`,
          t('disable_manually_app_settings'),
          'warning',
          3000,
        );
      const res = await RequestNotificationPermission(t);
      setHasNotificationPermission(res);
    }

    if (type === 'location') {
      if (hasLocationPermission)
        return showNotification(
          t('location_permission') + ' ' + t('already_enabled'),
          t('disable_manually_app_settings'),
          'warning',
          3000,
        );
        const res = await RequestFineLocationPermission(t);
        setHasLocationPermission(res);
    }

    if (type === 'backgroundLocation') {
      if (hasBackgroundLocationPermission)
        return showNotification(
          t('bg_loc_permission') + ' ' + t('already_enabled'),
          t('disable_manually_app_settings'),
          'warning',
          3000,
        );
      setType(type);
     
      return setTogglePopup(true);
    }


    if (type === "overlay") {
      if (hasOverlayPermission) return showNotification('OverLay Permission' + " " + t('already_enabled'), t('disable_manually_app_settings'), "warning", 3000)
      setType(type)
      return setTogglePopup(true)
    }
  };

  const handleOnPress = async () => {
    if (type === 'backgroundLocation'){
        const res = await RequestBackgroundLocationPermission(t);
        setHasBackgroundLocationPermission(res);
        setTogglePopup(false);
    }
    if (type === "activityRecognition") await RequestActivityPermission(t)
      setTogglePopup(false)

    if (type === "overlay"){
      const res = await openOverLaySettings()
      setHasOverlayPermission(res)
      setTogglePopup(false)
    }
    }

  const updateDriverStatus = () => {
    const isAndroidLessThanOrEqual28 = Platform.OS === 'android' && Platform.Version <= 28;
    const overlayPermOk = overlayCheckSupported ? hasOverlayPermission : true;
    const hasAllRequiredPermissions = isAndroidLessThanOrEqual28 
      ? (hasLocationPermission && hasNotificationPermission && overlayPermOk)
      : (hasLocationPermission && hasBackgroundLocationPermission && hasNotificationPermission && overlayPermOk);

    if (hasAllRequiredPermissions) {
      _updateDriverStatus('online');
    } else {
      showNotification('Please enable all permissions to go online', '', 'danger');
    }
  }

  const _updateDriverStatus = async (status) => {
    if (!userLocation) {
      await locationTask.getCurrentLocation();
      showNotification('Fetching Current Location', '', 'info');
      return;
    }
    setIsLoading(true)
     try {
       const apiRequest = new APIRequest()
           const payload = {
        status: status,
        location: {
          lat: userLocation?.[0],
          lon: userLocation?.[1]
        }
       }
       const response = await apiRequest.request('/publicrides/driver/v2/updatePublicRidesDriverStatus', "POST", payload, userInfo?.token)
       if (response?.success) {
          showNotification(response?.message,'','success')
          const _newUserInfo = userInfo
          _newUserInfo.driverStatus = {
            status: status,
            updatedOn: new Date().getTime()
          }
          await DataStore.storeData('userdetails',_newUserInfo);
          setDriverStatus(status)
          if (status === 'online') {
            BGLocationTask.runDriverBgTask();
            await rideMatchWSService.initDriverRoomSocket(userInfo?._id);
            if (overlayCheckSupported && hasOverlayPermission) {
              overlayController.startOverlay();
            }
          } else {
            BGLocationTask.stopDriverBgTask()
            if (overlayCheckSupported && hasOverlayPermission) {
              overlayController.stopOverlay();
            }
          }
          goBack()
       } else {
        showNotification('Low Network Connection','','danger')
       }
       setIsLoading(false)
     }catch (e) {
      // console.log('updateDriverStatus -->> ', e)
      showNotification('Something Went Wrong','','danger')
      setIsLoading(false)
     }
  }

  const renderPopupContent = () => {
    return (
      <View>
        <Text style={styles.textColor}>
          {type === 'backgroundLocation'
            ? 'Background Location Info'
            : 'Appear on Top Info'}{' '}
        </Text>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 15,
          }}>
          {<BgLocation height={140} width={140} />}
        </View>
        <Text style={styles.info}>{permissionData[type]}</Text>
      </View>
    );
  };

  const usePermissionChecker = useCallback(() => {
   return (
    <UserDeviceAdded
    role={'driver'}
    handleToggleButton={handleToggleButton}
    />
   )
  }, [hasLocationPermission, hasNotificationPermission, hasBackgroundLocationPermission, hasOverlayPermission])


  return (
    <View style={styles.screenContainer}>
      {isLoading && <FullScreenLoader/>}
      <NavBar title={t('permission_screen')} onBackPress={onBackPress} />
      <UseBackButton onBackPress={onBackPress} />
      {usePermissionChecker()}
      {
        togglePopup && <PopupContainerWithBtns
          handleCancel={() => setTogglePopup(false)}
          handleOnPress={() => handleOnPress()}
          onClose={() => setTogglePopup(false)}
          >
            {
              renderPopupContent()
            }
          </PopupContainerWithBtns>
        }
        <TouchableOpacity onPress={() => updateDriverStatus()} style={styles.OnlineBtn}>
        <Text style={styles.OnlineBtnText}>{t('go_online')}</Text>
        </TouchableOpacity>
       
    </View>
  );
};

export default DriverPermissionScreen;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  skipText: {
    color: Colors.periwinkle,
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
  centeredView: {
    alignItems: 'center',
    padding: 5,
    paddingHorizontal: 10,
  },
  padding10: {
    padding: 10,
  },
  declineText: {
    color: 'red',
    fontWeight: '500',
  },
  approveText: {
    color: '#fff',
    fontWeight: '500',
  },
  textColor: {
    color: "#212121",
    textAlign: 'center',
    marginVertical: 5,
    fontFamily: Fonts.medium,
  },
  info: {
    color: "#212121",
    textAlign: "center",
    fontWeight: "500",
    marginVertical: 10,
    fontFamily: Fonts.light
  },
  OnlineBtn:{
    backgroundColor: Colors.periwinkle,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '90%',
    marginHorizontal: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  OnlineBtnText:{
    color: Colors.white,
    fontFamily: Fonts.medium,
    fontSize: 16,
  }
});