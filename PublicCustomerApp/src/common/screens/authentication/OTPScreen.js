import {Text, TouchableOpacity, View, Platform, ActivityIndicator} from 'react-native';
import React, {useState, useEffect, useRef, useContext} from 'react';
import {useTranslation} from 'react-i18next';

import {loginStyles} from '../../../notCustomer/styles/UserStyles';
import {colors} from '../../../notCustomer/constants/constants';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {showNotification} from '../../../notCustomer/components/NotificationManger';
import {DataStore} from '../../../notCustomer/controllers/DataStore';
import useUserInfoStore from '../../store/useUserInfoStore';
import {requestOTPMutation, verifyActingDriverOTPMutation, verifyDriverOTPMutation, verifyOTPMutation} from '../../../notCustomer/API/APICalls/UserAPICalls';
import Icon from 'react-native-vector-icons/MaterialIcons';
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';  
import PropTypes from 'prop-types';  
import { GlobalContext } from '../../../context/GlobalContext';
import useRideMatching from '../../../notCustomer/hooks/useRideMatching';
import OTPInput from '../../../common/components/OTPInput';
import AdaptiveText from '../../../notCustomer/components/Common/AdaptiveText';
import useUserStore from '../../store/useUserStore';
import { firebaselog_userLogin } from '../../utils/FirebaseAnalytics';
// Utility function to mask phone number
const maskPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.length < 5) return phoneNumber;
  
  const firstThree = phoneNumber.substring(0, 3);
  const lastTwo = phoneNumber.substring(phoneNumber.length - 2);
  const middleAsterisks = '*'.repeat(phoneNumber.length - 5);
  
  return `${firstThree}${middleAsterisks}${lastTwo}`;
};

const OTPScreen = ({route}) => {
  const {userRole, setUserInfo, setIsDev} = useUserStore();
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {addListener, addRideMatchListener, addNOTSocketListener} = useContext(GlobalContext);
  const { initializeSocket} = useRideMatching();
  const [loginPhoneNumber] = useState(
    route.params.phoneNumber,
  );
  const [countryCode] = useState(
    route.params.countryCode,
  );
  const {navRole} = route.params || userRole;
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const [timer, setTimer] = useState(120);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  

  const {setID, setUserdetails} = useUserInfoStore();
  
  // Add ref for OTP input to enable auto-fill
  const otpRef = useRef(null);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsButtonDisabled(false);
    }
  }, [timer]);

  const handleVerificationSuccess = async data => {
    try {
      if (data.success) {
        console.log('Verification data', data);
        setOtpError(''); // Clear error on success
       
        let { user, isNewUser } = data;
        
        setID(user._id);
        setUserdetails(user);

        await DataStore.storeData('access_token', user?.token);
        addListener(user?.token);
        await DataStore.storeData('userdetails', user);
        // Prefetch user stats after successful login

        if (isNewUser) {
          firebaselog_userLogin('UL_Newuser(UL_New)', 'UL_New:driver');
          navigation.dispatch(
            CommonActions.navigate({
              name: 'RegisterationScreen',
            }),
          );
        } else {
          firebaselog_userLogin('UL_Customer(UL_C)', 'UL_C:login_success');
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeScreen' }],
          });
        }
        // showNotification(t('otp_verified'), t('otp_verified_successfully'), 'success');
      } else {
        setOtpError(t('invalid_otp'));
        console.log('OTP verification failed:', data);

        if(typeof data?.message === 'string'){  
          showNotification(t('failed'), t('invalid_otp'), 'danger');
        }else{
          showNotification(t('failed'), t('something_went_wrong'), 'danger');
        }
        firebaselog_userLogin('UL_Customer(UL_C)', 'UL_C:login_failed')
      }
    } catch (error) {
      console.log('Error in handleVerificationSuccess:', error);

      showNotification(t('failed'), t('something_went_wrong'), 'danger');
    }
  };

  const handleDriverVerificationSuccess = async (data) => {
 try {
      if (data.success) {
        setOtpError('');
       
        let { user } = data;
          const deviceImei = await DeviceInfo.getUniqueId().catch(error => {
        console.log('Error getting device IMEI: ', error);
        });
        setID(user._id);
        setUserdetails(user);
        setUserInfo(user);
        setIsDev(data?.user?.dev);
        await DataStore.storeData('access_token', user?.token);
        addNOTSocketListener(user?.token);
        addRideMatchListener(user?._id);
        await DataStore.storeData('userdetails', user);
        await DataStore.storeData("bg_userToken", user?.token)
        await DataStore.storeData("bg_deviceImei", deviceImei)
          if (user && Object.prototype.hasOwnProperty.call(user, 'isAvailable')) {
            firebaselog_userLogin('UL_Driver(UL_D)', 'UL_D:login_success');
          } else {
            firebaselog_userLogin('UL_Newuser(UL_New)', 'UL_New:driver');
          }
          navigation.reset({
            index: 0,
            routes: [{name: 'HomeScreen'}],
          });
        // showNotification(t('otp_verified'), t('otp_verified_successfully'), 'success');
      } else {
        setOtpError(t('invalid_otp'));

        if(typeof data?.message === 'string'){  
          showNotification(t('failed'), t('invalid_otp'), 'danger');
        }else{
          console.log('Driver OTP verification failed:', data);
          showNotification(t('failed'), t('something_went_wrong'), 'danger');
        }
        firebaselog_userLogin('UL_Driver(UL_D)', 'UL_D:login_failed')
      }
    } catch (error) {
      console.error('Error in handleVerificationSuccess:', error);

      showNotification(t('failed'), t('something_went_wrong'), 'danger');
    }
  } 

  //   const handleActingDriverVerificationSuccess = async (data) => {
  //   try {
  //     if (data.success) {
  //       setOtpError('');
       
  //       let { user } = data;
  //         const deviceImei = await DeviceInfo.getUniqueId().catch(error => {
  //       console.log('Error getting device IMEI: ', error);
  //       });
  //       setID(user._id);
  //       setUserdetails(user);
  //       setUserInfo(user);
  //       setIsDev(data?.user?.dev);
  //       await DataStore.storeData('access_token', user?.token);
  //       addNOTSocketListener(user?.token);
  //       addRideMatchListener(user?._id);
  //       await DataStore.storeData('userdetails', user);
  //       await DataStore.storeData("bg_userToken", user?.token)
  //       await DataStore.storeData("bg_deviceImei", deviceImei)
  //         if (user && Object.prototype.hasOwnProperty.call(user, 'isAvailable')) {
  //           firebaselog_userLogin('UL_Driver(UL_D)', 'UL_D:login_success');
  //         } else {
  //           firebaselog_userLogin('UL_Newuser(UL_New)', 'UL_New:driver');
  //         }
  //         navigation.reset({
  //           index: 0,
  //           routes: [{name: 'HomeScreen'}],
  //         });
  //       // showNotification(t('otp_verified'), t('otp_verified_successfully'), 'success');
  //     } else {
  //       setOtpError(t('invalid_otp'));

  //       if(typeof data?.message === 'string'){  
  //         showNotification(t('failed'), t('invalid_otp'), 'danger');
  //       }else{
  //         console.log('Driver OTP verification failed:', data);
  //         showNotification(t('failed'), t('something_went_wrong'), 'danger');
  //       }
  //       firebaselog_userLogin('UL_Driver(UL_D)', 'UL_D:login_failed')
  //     }
  //   } catch (error) {
  //     console.error('Error in handleVerificationSuccess:', error);

  //     showNotification(t('failed'), t('something_went_wrong'), 'danger');
  //   }
  // } 

  const {mutate: verifyOTPMutate, isLoading: isLoading, error: verifyOTPError} = verifyOTPMutation(
    handleVerificationSuccess,
  );

  const {mutate: verifyDriverOTPMutate, isLoading: isVerifyOTPLoading, error: verifyDriverOTPError} = verifyDriverOTPMutation(
    handleDriverVerificationSuccess,
  );

  // const {mutate: verifyActingDriverOTPMutate, isLoading: isVerifyActingOTPLoading, error: verifyActingDriverOTPError} = verifyActingDriverOTPMutation(
  //   handleActingDriverVerificationSuccess,
  // );

  // Log errors only when they change
  useEffect(() => {
    if (verifyOTPError) {
      firebaselog_userLogin('UL_Customer(UL_C)', 'UL_C:login_failed')
      console.error('verifyOTPMutation error:', verifyOTPError);
    }
  }, [verifyOTPError]);

  useEffect(() => {
    if (verifyDriverOTPError) {
      firebaselog_userLogin('UL_Driver(UL_D)', 'UL_D:login_failed')
      console.error('verifyDriverOTPMutation error:', verifyDriverOTPError);
    }
  }, [verifyDriverOTPError]);

  const getFcmToken = async () => {
    try {
      const fcmToken = await messaging().getToken();
      return fcmToken;
    } catch (error) {
      console.log('Error getting FCM token: ', error);
    }
  };

   console.log('Payload for OTP verification:', navRole);

  const verifyOtp = async () => {
    if (otpInput.length === 0) {
      showNotification(t('please_verify_OTP'), t('invalid_otp'), 'danger');
    } else {
      const fcmToken = await getFcmToken();
      const deviceImei = await DeviceInfo.getUniqueId().catch(error => {
        console.log('Error getting device IMEI: ', error);
      });
      const tokenCred = {
        token: fcmToken,
        deviceImei: deviceImei,
      };
      let deviceMeta = {
        os: '',
        osVersion: '',
        appVersion: '',
        buildNumber: '',
        brand: '',
        model: '',
      };
      try {
        deviceMeta = {
          os: Platform?.OS || '',
          osVersion: DeviceInfo.getSystemVersion?.() || '',
          appVersion: DeviceInfo.getVersion?.() || '',
          buildNumber: DeviceInfo.getBuildNumber?.() || '',
          brand: DeviceInfo.getBrand?.() || '',
          model: DeviceInfo.getModel?.() || '',
        };
      } catch (e) {
        console.log('Error building device meta: ', e);
      }
      const payload = {
        otp: otpInput,
        phone: `+${countryCode}${loginPhoneNumber}`,
        fcmToken: tokenCred,
        deviceMeta: deviceMeta,
      };

      if (navRole === 'customer') {
        verifyOTPMutate(payload);
      } else {
      const sendToServer = {
      otp: otpInput,
      phone: `+${countryCode}${loginPhoneNumber}`,
      deviceMeta: deviceMeta,
    };
    const tokenCred = {
      token: fcmToken,
      deviceImei: deviceImei,
    };

    if (fcmToken) sendToServer.fcmToken = tokenCred;
   
    if (navRole === 'acting_driver') {
      verifyActingDriverOTPMutate(sendToServer);
    } else {
        verifyDriverOTPMutate(sendToServer);
      }     
    } 
    }
  };


  useEffect(()=>{
    if(otpInput.length === 6){
      verifyOtp()
    }
  },[otpInput])

 
  const onOtpChange = (text) => {
    if (otpError) {
      setOtpError('');
    }
    const digitsOnly = (text || '').replace(/[^0-9]/g, '');
    const code = digitsOnly.slice(0, 6);
    setOtpInput(code);
  };
  
  const handleResendSuccess = (data) => {
    if(data.success){
      showNotification(t('otp_resend'), t('otp_resend_successfully'), 'success');
      
    }else{
      showNotification(t('otp_resend'), t('failed_to_resend_otp') , 'danger');
    }
  };
  const {mutate: requestOTPMutate} = requestOTPMutation(
    handleResendSuccess,
  );

  const resendOTP = async () => {
    const payload = {
      phone: `+${countryCode}${loginPhoneNumber}`,
     
    };
    DataStore.storeData('login_phoneNumber', loginPhoneNumber);
    requestOTPMutate(payload);
    setTimer(120);
    setIsButtonDisabled(true);
  };

  

  return (
    <View style={loginStyles.screen}>
    
      
      {/* Header with back button */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20}}>
      
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.blue_xxdark,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Icon name="chevron-left" size={30} color="white" />
        </TouchableOpacity>
      </View>
      
      <AdaptiveText style={[loginStyles.headerTxt, loginStyles.otpHeaderTxt]}>
        {t('one_time_password_otp')}
      </AdaptiveText>
      <AdaptiveText style={[loginStyles.headerContent, loginStyles.otpHeaderTxt]}>
        {t('otp_sent_to_mobile')}
      </AdaptiveText>
      <Text style={loginStyles.phoneTxt}>{maskPhoneNumber(loginPhoneNumber)}</Text>
      

      <View style={loginStyles.otpContainer}>
      <OTPInput
          inputCount={6}
          onChange={onOtpChange}
          onComplete={(code) => setOtpInput(code)}  // your effect will auto-verify when length===6
          autoFocus
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          focusedBorderColor={colors.blue_xxdark}
          tintColor={[
            colors.grey_xdark,
            colors.grey_xdark ,
            colors.grey_xdark,
            colors.grey_xdark,
            colors.grey_xdark,
            colors.grey_xdark,
          ]}
          inputStyle={{
            width: 40,
            height: 60,
            borderWidth: 1,    
            margin: 5,
            borderRadius: 5,
            color: colors.black,
          }}
      />
      </View>
      {otpError ? <Text style={{color: 'red', textAlign: 'center', marginTop: 10}}>{otpError}</Text> : null}
      <TouchableOpacity disabled={isButtonDisabled} onPress={()=> isButtonDisabled ? null : resendOTP()}>
      <Text style={loginStyles.resendOTP}>{t('resend_otp')} {isButtonDisabled ? `${t('in')} ${formatTime(timer)}` : null}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={loginStyles.otpBtn}
        onPress={() => verifyOtp()}
        disabled={isLoading || isVerifyOTPLoading}>
        {isLoading || isVerifyOTPLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={loginStyles.otptxt}>{t('verify_otp')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

OTPScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      phoneNumber: PropTypes.string.isRequired,
      countryCode: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default OTPScreen;
