import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import OTPTextInput from 'react-native-otp-textinput';
import Fontisto from 'react-native-vector-icons/Fontisto';
import { Platform } from 'react-native';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import { DataStore } from '../../common/controllers/DataStore';
import { showNotification } from '../../common/components/Alerts/showNotification';
import useUserStore from '../../common/store/useUserStore';
import GlobalContext from '../../context/GlobalContext';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import usePublicDriverStore from '../store/usePublicDriverStore';
import APIRequest from '../../common/APIRequest';
import { Colors, colors, Fonts } from '../../common/constants/constants';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import UseBackButton from '../../common/hooks/UseBackButton';
import NavBar from '../../common/components/NavBar';
import { moderateScale } from '../../common/utils/scalingutils';
import InputWithRightIcon from '../../common/components/InputWithRightIcon';
import { useTranslation } from 'react-i18next';

const DeleteAccount = () => {
    const {goBack} = useStackScreenStore();
    const [phone, setPhone] = useState('');
    const [phoneErr, setPhoneErr] = useState('');
    const [isChecked, setIsChecked] = useState(false)
    const [showOtpView, setShowOtpView] = useState(false)
    const [otp, setOtp] = useState('')
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [timer, setTimer] = useState(120);
    const [isLoading, setIsLoading] = useState(false)

    // const resetAllStore = useResetStore();
    const {userInfo} = useUserStore()
    const {logout} = useContext(GlobalContext);
    const {setMapMarkers} = useMapMarkerStore();
    const {driverInfo,vehicleInfo, driverRole } = usePublicDriverStore();
    const {t} = useTranslation()
    const onBackPress = () => {
        goBack()
    }

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      };

      const onResendOtpPress = useCallback(() => {
        if (timer > 0) {
          const interval = setInterval(() => {
            setTimer((prevTimer) => prevTimer - 1);
          }, 1000);
          return () => clearInterval(interval);
        } else {
          setIsButtonDisabled(false);
        }
      }, [timer]);

      const verifyDriverOTP = async () => {
        setIsLoading(true);
        const api = new APIRequest();
        const url = `/publicrides/driver/v2/driverDeleteAccount`;
        const payload = {
                phone:'+91'+phone,
                otp:otp,
                role:driverRole,
                vehicleId:vehicleInfo._id,
        }
        try {
            const res = await api.request(url, 'POST', payload, userInfo.token);
            console.log('otpverifiedres',res)
            if(res.success){
                setIsLoading(true);
                setMapMarkers(null);
          
                setTimeout(() => {
                  // resetAllStore();
                  logout('driver');
                  setIsLoading(false);
                  BGLocationTask.stopDriverBgTask();
                  setIsLoading(false);
                }, 1000);
          
                DataStore.clearSession();
                showNotification(res?.message, res?.message, 'success')
            } else {
                showNotification(res?.message, res?.message, 'danger')
            }
        } catch (error) {
            console.log('error',error)
        } finally {
            setIsLoading(false);
        }
        
      }

    const getOtpPress = async () => {
        if (phone.trim().length === 0) {
            setPhoneErr(t('please_enter_your_phone_number'));
          } else if (phone.length !== 10) {
            setPhoneErr(t('please_enter_a_valid_phone_number'));
          } else if (!isChecked) {
            console.log('getOtpPress')
            showNotification(t('please_agree_to_the_terms_and_conditions'), '', 'danger')
          } else if ('+91'+phone !== driverInfo.phone) {
            showNotification(t('please_enter_your_registered_phone_number'), '', 'danger')
          }else {
            await onGetOtp();
          }
    }

    const onGetOtp = async () => {
        setIsLoading(true);
        const api = new APIRequest();
        const url = `/publicrides/driver/v2/sendOTP?platform=${Platform.OS}`;
        const payload = {
            phone:'+91'+phone,
        }       
        try {
            const res = await api.request(url, 'POST', payload, userInfo.token);

            if(res.success){
                setShowOtpView(true)
                setTimer(120)
                setOtp(null)
                onResendOtpPress()
                showNotification(res?.message, res?.message, 'success')
            } else {
                showNotification(res?.message, res?.message, 'danger')
            }
        } catch (error) {
            console.log('error',error)
        } finally {
            setIsLoading(false);
        }
    }

    const handleOtpChange = (value) => {
        setOtp(value)
    }

    const renderOtpView = () => {
        return (
            <View style={{width:'90%',alignSelf:'center'}}>
        <View style={styles.otpContainer}>
        <OTPTextInput
          inputCount={6}
          textInputStyle={{
            width: 40,
            height: 60,
            borderColor: 'gray',
            borderWidth: 1,
            margin: 5,
            borderRadius: 5,
            color: Colors.black,
          }}
          handleTextChange={(value)=>handleOtpChange(value)}
          focusedBorderColor={Colors.periwinkle}
          autoFocus={true}
          tintColor={[
            Colors.periwinkle,
            Colors.periwinkle,
            Colors.periwinkle,
            Colors.periwinkle,
            Colors.periwinkle,
            Colors.periwinkle,
          ]}
        />
      </View>
     {timer > 0 ? (
        <Text style={styles.resendOTP}>{t('resend_otp')} {`${formatTime(timer)}`}</Text>
      ) : (
        <View style={styles.resendOTPContainer}>
          <TouchableOpacity onPress={()=>onGetOtp()}>
          <Text style={styles.resendOTP}>{t('resend_otp')}</Text>
        </TouchableOpacity>
      </View>
      )}
      <TouchableOpacity style={styles.otpBtn} onPress={() => verifyDriverOTP()}>
        <Text style={styles.otptxt}>{t('verify_otp')}</Text>
      </TouchableOpacity>
            </View>
        )
    }

  return (
    <>
     {isLoading && <FullScreenLoader />}
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom:100}}>
      <UseBackButton onBackPress={onBackPress} />
      <NavBar title={t('delete_account')} onBackPress={onBackPress} /> 
      <View style={styles.pointsContainer}>
        <View style={styles.pointRow}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.pointText}>{t('your_account_will_be_marked_as_deleted_immediately')}</Text>
        </View>
        <View style={styles.pointRow}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.pointText}>{t('all_related_data_will_be_permanently_deleted_within_30_days')}</Text>
        </View>
        <View style={styles.pointRow}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.pointText}>{t('this_action_cant_be_undone_deleted_data_is_not_recoverable')}</Text>
        </View>
        <View style={styles.pointRow}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.pointText}>{t('you_wont_be_able_to_take_trips_or_access_driver_features_after_this')}</Text>
        </View>
        <View style={styles.pointRow}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.pointText}>{t('certain_records_may_be_retained_as_required_by_law')}</Text>
        </View>
      </View>
      {showOtpView ?  (
        renderOtpView()
      ):(
        <>
         <View style={styles.inputContainer}>
         <InputWithRightIcon
            label={'phone'}
            onInputChange={setPhone}
            keyboardType={'numeric'}
            iconName={'phone'}
            value={phone}
            maxLength={10}
            countryCode={'+91'}
            setCountryCode={() => {}}
            handleCountrySelect={() => {}}
          />
          <Text style={styles.errorMsg}>
            {(phone.length === 0 || phone.length !== 10) && phoneErr}
          </Text>
        </View>
        <TouchableOpacity style={styles.rememberContainer} onPress={()=>setIsChecked(!isChecked)}>
            <Fontisto name={isChecked ? 'checkbox-active' : 'checkbox-passive'} size={20} color={isChecked ? Colors.periwinkle : Colors.black   } />
        <Text style={styles.rememberTxt}>{t('i_understand_that_my_account_will_be_marked_as_deleted_now_my_data_will_be_permanently_deleted_within_30_days_i_wont_be_able_to_take_trips_and_this_action_cannot_be_undone')}</Text>

        </TouchableOpacity>
        <TouchableOpacity style={styles.getOtpBtn} onPress={getOtpPress}>
            <Text style={styles.getOtpBtnText}>{t('get_otp')}</Text>
        </TouchableOpacity>
        </>
      )}
        
    </ScrollView>
    </>
  )
}

export default DeleteAccount

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    inputContainer: {
        width:'90%',
        alignSelf:'center',
        marginTop:20,
    },
    getOtpBtn:{
        backgroundColor:Colors.periwinkle,
        borderRadius:10,
        padding:10,
        alignItems:'center',
        justifyContent:'center',
        width:'90%',
        alignSelf:'center',
    },
    getOtpBtnText:{
        color:Colors.white,
        fontFamily:Fonts.medium,
        fontSize:16,
    },
    pointsContainer:{
        width:'80%',    
        alignSelf:'center',
        marginTop:20,
    },
    pointRow:{
        flexDirection:'row',
        alignItems:'center',
        marginBottom:10,
    },
    bullet:{
        fontSize:16,
        marginRight:10,
        color:Colors.periwinkle,
    },
    pointText:{
        fontFamily:Fonts.medium,
        fontSize:14,
    },
    errorMsg:{
        color:Colors.red,
        fontFamily:Fonts.regular,
        fontSize:12,
        marginTop:10,
    },
    rememberContainer:{
        flexDirection:'row',
        alignItems:'center',
        width:'90%',
        alignSelf:'center',
        marginVertical:10,
        gap:10,
    },
    rememberTxt:{
        fontFamily:Fonts.light,
        fontSize:12,
        color:Colors.black,
        width:'90%',
    },
    otpContainer:{
        flexDirection:'row',
        marginTop:15,
        justifyContent:'center',
        alignItems:'center'
      },
      resendOTPContainer:{
        marginTop:15,
        justifyContent:'center',
        alignItems:'center'
      },
      resendOTP:{
        fontSize:moderateScale(14),
        fontFamily:Fonts.regular,
        color:Colors.black,
        textAlign:'center',
        marginTop:10
      },
      otpBtn:{
        backgroundColor:Colors.periwinkle,
        padding:10,
        borderRadius:8,
        marginTop:10,
        alignItems:'center',
        justifyContent:'center'
      },
      otptxt:{
        fontSize:moderateScale(16),
        fontFamily:Fonts.regular,
        color:Colors.white,
        textAlign:'center',
      }
})

