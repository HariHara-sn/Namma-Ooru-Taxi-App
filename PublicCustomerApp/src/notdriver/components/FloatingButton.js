/* eslint-disable react/no-children-prop */
import React, {useState, useRef, useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';

import Close from '../../notdriver/assets/icons/clock.svg';
import Break from '../../notdriver/assets/icons/break.svg';
import Sleep from '../../notdriver/assets/icons/sleep.svg';
import Online from '../../notdriver/assets/icons/online.svg';
import StatusModal from './StatusModal';

import useDriverStatusStore from '../store/useDriverStatusStore';
import APIRequest from '../../common/APIRequest';
import useUserStore from '../../common/store/useUserStore';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import useDeviceTokenStore from '../../common/store/useDeviceTokenStore';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import { breakData } from '../constants/JsonData';
import { showNotification } from '../../common/components/Alerts/showNotification';
import { DataStore } from '../../common/controllers/DataStore';
import { Colors, colors, Fonts } from '../../common/constants/constants';
import { height } from '../../common/utils/scalingutils';
import { useTranslation } from 'react-i18next';
import overlayController from '../../common/controllers/Overlay';
import RideMatchWSService from '../../common/controllers/socketServices/RideMatchSocketService';
import tripAlert from '../../common/controllers/TripAlert';
import locationTask from '../../common/controllers/GetCurrentLocation';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';

const FloatingButton = ({layOutHeight}) => {
  const {driverStatus, setDriverStatus} = useDriverStatusStore();
  const {userInfo} = useUserStore();
  const [showPopUpIcons, setShowPopUpIcons] = useState(false);
  const [onlineModal, setOnlineModal] = useState(false);
  const [onOfflineModal, setOfflineModal] = useState(false);
  const [breakModal, setBreakModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const {userLocation} = useMapMarkerStore()

  const [selectedBreak, setSelectedBreak] = useState(breakData[0]);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const {setStackScreen} = useStackScreenStore();

  const translateY1 = useRef(new Animated.Value(50)).current;
  const translateY2 = useRef(new Animated.Value(50)).current;
  const opacity1 = useRef(new Animated.Value(0)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  const {
    hasLocationPermission,
    hasBackgroundLocationPermission,
    hasNotificationPermission,
    hasOverlayPermission,
    overlayCheckSupported
  } = useDeviceTokenStore();

  const resetAnimationValues = () => {
    translateY1.setValue(50);
    translateY2.setValue(50);
    opacity1.setValue(0);
    opacity2.setValue(0);
  };

  const triggerAnimation = () => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(translateY1, {
          toValue: 0,
          duration: 300,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(opacity1, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(translateY2, {
          toValue: 0,
          duration: 300,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(opacity2, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const updateDriverStatus = (status) => {  
    if (status === 'online') {
          const isAndroidLessThanOrEqual28 = Platform.OS === 'android' && Platform.Version <= 28;
          const overlayPermOk = overlayCheckSupported ? hasOverlayPermission : true;
          const hasAllRequiredPermissions = isAndroidLessThanOrEqual28 
            ? (hasLocationPermission && hasNotificationPermission && overlayPermOk)
            : (hasLocationPermission && hasBackgroundLocationPermission && hasNotificationPermission && overlayPermOk);
      if (!hasAllRequiredPermissions){
        setStackScreen('DriverPermissionScreen')
      } else {
        _updateDriverStatus(status)
      }
    }else {
      _updateDriverStatus(status)
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
          await DataStore.storeData('userdetails', _newUserInfo);
          // BGLocationTask.stopDriverBgTask()
          // console.log("STATUS UPDATE:", status)
           if (status === 'online') {
             await RideMatchWSService.initDriverRoomSocket(userInfo?._id).then((res)=>{
             if (res) {
               RideMatchWSService.emit('join_driver_room', { driver_id: userInfo?._id })
               }
              })
            BGLocationTask.runDriverBgTask();
            if (overlayCheckSupported && hasOverlayPermission) {
              overlayController.startOverlay();
            }
          } else {
            BGLocationTask.stopDriverBgTask()
            if (overlayCheckSupported && hasOverlayPermission) {
              overlayController.stopOverlay();
            }
            tripAlert.stopAlertSound()
          }
          setDriverStatus(status)
       } else {
        showNotification('Low Network Connection','','danger')
       }
       setIsLoading(false)
     }catch (e) {
       console.log("ERROR UPDATING DRIVER STATUS:", e)
      showNotification('Something Went Wrong','','danger')
      setIsLoading(false)
     }
  }

  const togglePopUpIcons = () => {
    if (!showPopUpIcons) {
      resetAnimationValues();
    }
    setShowPopUpIcons(prev => !prev);
    triggerAnimation();
  };

  const updateStatus = (status) => {
    if (status === 'online') {
      updateDriverStatus('online')
      setOnlineModal(false)
      setIsTimerActive(false)
    } else if (status === 'offline'){
      updateDriverStatus('offline')
      setOfflineModal(false);
      togglePopUpIcons();
    } else {
      setBreakModal(false);
      togglePopUpIcons();
      setIsTimerActive(true);
      setRemainingTime(selectedBreak.value)
    }
  };

  // useEffect(() => {
  //   let interval = null;

  //   if (isTimerActive && remainingTime > 0) {
  //     interval = setInterval(() => {
  //       setRemainingTime((prevTime) => prevTime - 1);
  //     }, 1000);
  //   } else if (remainingTime === 0) {
  //     setIsTimerActive(false);
  //     updateStatus('Online')
  //   }

  //   return () => clearInterval(interval);
  // }, [isTimerActive, remainingTime]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const onBreakPress = (item) => {
     setSelectedBreak(item)
  }

  const renderOnlineModal = () => (
    <StatusModal
      isVisible={onlineModal}
      onClose={() => {
        setOnlineModal(false);
      }}
      rightBtnText={t('yes_go_online')}
      leftBtnTxt={t('cancel')}
      successMessage={t('are_you_sure_want_to_go_online_and_ready_to_take_trips')}
      animationType={'slide'}
      onRightPress={()=>updateStatus('online')}
      status={'Online'}
      rightBtnStyle={{ backgroundColor: Colors.green_xxlight, borderColor: Colors.green_online }}
      rightBtnTextStyle={{ color: Colors.green_online}}
      leftBtnStyle={{ backgroundColor: Colors.danger_red, borderColor: Colors.danger_red }}
      leftBtnTextStyle={{ color: Colors.white }}
    />
  );

  const renderOfflineModal = () => (
    <StatusModal
      isVisible={onOfflineModal}
      onClose={() => {
        setOfflineModal(false);
      }}
      rightBtnText={t('yes_go_offline')}
      leftBtnTxt={t('no_be_online')}
      successMessage={t('are_you_sure_want_to_go_offline')}
      animationType={'slide'}
      onRightPress={()=>updateStatus('offline')}
      status={'Offline'}
    />
  );

  const renderBreakModal = () => (
    <StatusModal
      isVisible={breakModal}
      onClose={() => {
        setBreakModal(false);
      }}
      rightBtnText={'Confirm'}
      leftBtnTxt={'Cancel'}
      successMessage={'Select the break time you want'}
      animationType={'slide'}
      onRightPress={()=>updateStatus('Break')}
      status={'Offline'}
      children={
        <View style={styles.breakContainer}>
          {breakData.map((item)=> (
            <TouchableOpacity key={item.id}
            onPress={()=>onBreakPress(item)} 
            style={[styles.breakBtn,{
              backgroundColor:selectedBreak.id === item.id ? 
              Colors.white : Colors.grey,
              borderColor: selectedBreak.id === item.id ? 
              Colors.yellow : Colors.grey,
            }]}
            >
              {item.icon}
              <Text style={styles.duration}>{item.duration}</Text>
            </TouchableOpacity>
          ))}
        </View>
      }
    />
  );

  return (
    <>
      {isLoading && <FullScreenLoader />}
      {showPopUpIcons && (
        <View style={[styles.popUpIconsContainer,{bottom: height * 0.2 + (layOutHeight || 0)}]}>
          {/* <Animated.View
            style={{
              transform: [{translateY: translateY1}],
              opacity: opacity1,
            }}>
            <TouchableOpacity onPress={() => setBreakModal(true)} style={styles.popUpIcon}>
              <Break />
            </TouchableOpacity>
          </Animated.View> */}
          <Animated.View
            style={{
              transform: [{translateY: translateY2}],
              opacity: opacity2,
            }}>
            <TouchableOpacity
              onPress={() => setOfflineModal(true)}
              style={[styles.popUpIcon, {backgroundColor: Colors.danger_red}]}>
              <Sleep />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
      {!showPopUpIcons && (
        <View style={[styles.popUpStatusContainer, {bottom: height * 0.2 + (layOutHeight || 0)}]}>
          <View style={styles.popUpTextConatiner}>
            {driverStatus === 'online' && (
              <Text style={styles.popUpText}>{t('you_are_online')}</Text>
            )}
            {(driverStatus === 'offline' || !driverStatus) && (
              <Text style={[styles.popUpText, {color: Colors.danger_red}]}>
                {t('you_are_currently_offline')}.{'\n'}
                <Text style={styles.popUpTextSmall}>
                  {t('please_go_online_when_you_are_ready_to_take_trips')}
                </Text>
              </Text>
            )}
             {driverStatus === 'Break' && (
              <TouchableOpacity onPress={()=>setOnlineModal(true)}>
              <Text style={[styles.popUpText,{color:Colors.violet}]}>Break Time Ends in 
              <Text style={styles.timer}> {formatTime(remainingTime)}</Text>
              <Entypo name="cross" color={Colors.danger_red} size={20}/></Text>
              </TouchableOpacity>
            )}
            <AntDesign name="caretdown" color={Colors.grey_xdark} size={18} />
          </View>
        </View>
      )}

      <View style={[styles.floatingBtnContainer, {bottom: height * 0.12 + (layOutHeight || 0)}]}>
        {showPopUpIcons ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.floatingBtn]}
            onPress={togglePopUpIcons}>
            <Close />
          </TouchableOpacity>
        ) : (
          <>
            {driverStatus === 'online' && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.floatingBtn,
                  {backgroundColor: Colors.green_online},
                ]}
                onPress={togglePopUpIcons}>
                <Online />
              </TouchableOpacity>
            )}
            {(driverStatus === 'offline' || !driverStatus) && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.floatingBtn,
                  {backgroundColor: Colors.danger_red},
                ]}
                onPress={()=>setOnlineModal(true)}>
                <Sleep />
              </TouchableOpacity>
            )}
             {driverStatus === 'Break' && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.floatingBtn,
                  {backgroundColor: Colors.violet},
                ]}
                onPress={()=>setOnlineModal(true)}>
                <Break />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
      {onlineModal && renderOnlineModal()}
      {onOfflineModal && renderOfflineModal()}
      {breakModal && renderBreakModal()}
    </>
  );
};

const styles = StyleSheet.create({
  floatingBtnContainer: {
    position: 'absolute',
    
    alignSelf: 'center',
    zIndex: 1,
  },
  floatingBtn: {
    height: 55,
    width: 55,
    borderRadius: 35,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  popUpIconsContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
  },
  popUpIcon: {
    backgroundColor: Colors.periwinkle,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 5,
  },
  popUpStatusContainer: {
    position: 'absolute',
    // bottom: height * 0.2,
    alignSelf: 'center',
    alignItems: 'center',
  },
  popUpTextConatiner: {
    alignItems: 'center',
  },
  popUpText: {
    backgroundColor: Colors.white,
    paddingVertical: 5,
    paddingHorizontal: 30,
    borderRadius: 8,
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.green_online,
    textAlign: 'center',
  },
  popUpTextSmall: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: Colors.grey_xxdark,
  },
  breakContainer:{
    flexDirection:'row',
    width:'100%',
    alignItems:'center',
    justifyContent:'space-evenly',
  },
  breakBtn:{
    paddingVertical:5,
    flexDirection:'row',
    gap:4,
    paddingHorizontal:4,
    borderRadius:8,
    borderWidth:1,
    alignItems:'center'
  },
  timer:{
    fontFamily:Fonts.semi_bold
  },
  duration:{
    fontFamily:Fonts.light,
    color:Colors.black
  }
});

export default FloatingButton;


