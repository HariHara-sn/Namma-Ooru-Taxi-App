import {Text, TextInput, TouchableOpacity, View, Platform} from 'react-native';
import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';


import {loginStyles} from '../../styles/UserStyles';
import Logo from '../../assets/image/logo.svg';
import Phone from '../../assets/image/svgIcons/phone.svg';
import {CommonActions, useNavigation} from '@react-navigation/native';

import {requestOTPMutation} from '../../API/APICalls/UserAPICalls';
import FullScreenLoader from '../../components/Loaders/FullScreenLoader';
import { colors } from '../../constants/constants';
import { showPhoneNumberHint } from '@shayrn/react-native-android-phone-number-hint';
import { DataStore } from '../../common/controllers/DataStore';


const DriverAuthentication = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const country = {
    callingCode: ['91'],
    cca2: 'IN',
    currency: ['INR'],
    flag: 'flag-in',
    name: 'India',
    region: 'Asia',
    subregion: 'Southern Asia',
  };
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumErr, setPhoneNumErr] = useState('');

  const handleLoginSuccess = (data) => {
    if (data) {
      // showNotification(t('otp_sent'), t('otp_sent_to_mobile'), 'success');
      console.log('Login data', data);
      navigation.dispatch(
        CommonActions.navigate({
          name: 'OTPScreen',
          params: {
            countryCode: country.callingCode[0],
            phoneNumber: phoneNumber,
          },
        }),
      );
    }
  };

  const {mutate: requestOTPMutate, isLoading: isLoading} = requestOTPMutation(
    handleLoginSuccess,
  );

  const renderCountryCode = () => (
    <View style={loginStyles.countryPicker}>
      <View>
        <Text style={loginStyles.flag}>🇮🇳</Text>
      </View>
      <Text style={loginStyles.callingCode}>
        +{country.callingCode[0]}
      </Text>
    </View>
  );

 
  const requestOTP = async () => {
    
    const payload = {
      phone: `+${country.callingCode[0]}${phoneNumber}`,
     
    };
    DataStore.storeData('login_phoneNumber', phoneNumber);
    requestOTPMutate(payload);
  };

  const handleChange = text => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setPhoneNumber(numericValue);
    
    // Update error message based on phone number length
    if (numericValue.length === 0) {
      setPhoneNumErr('');
    } else if (numericValue.length < 10) {
      setPhoneNumErr(t('phone_number_must_be_10_digits'));
    } else if (numericValue.length > 10) {
      setPhoneNumErr(t('phone_number_must_be_10_digits'));
    } else {
      setPhoneNumErr('');
    }
  };

  const handlePhoneInputFocus = async () => {
    if (Platform.OS !== 'android' || phoneNumber) {
      return;
    }
    try {
      const hinted = await showPhoneNumberHint();
      if (hinted) {
        const digits = String(hinted).replace(/[^0-9]/g, '');
        const cc = country.callingCode[0];
        let local = digits;
        if (local.startsWith(cc)) {
          local = local.slice(cc.length);
        }
        if (local.length > 10) local = local.slice(-10);
        setPhoneNumber(local);
        if (local.length !== 10) {
          setPhoneNumErr(t('phone_number_must_be_10_digits'));
        } else {
          setPhoneNumErr('');
        }
      }
    } catch (e) {
      // Handle known error codes gracefully; keep silent in UI
      // console.log('Phone number hint error:', e);
    }
  };

            



  return (
    <>
      {isLoading && <FullScreenLoader />}
      <View style={loginStyles.screen}>
        <View style={loginStyles.header}>
          <Logo />
          <Text style={loginStyles.headerTxt}>
            Namma Ooru Taxi ® {'\n'} for Drivers
          </Text>
        </View>
        <View style={loginStyles.contectContainer}>
          <Text style={loginStyles.signInTxt}>
            {t('sign_in_by_mobile')}
          </Text>
          <View style={loginStyles.inputConatiner}>
            {renderCountryCode()}
            <TextInput
              style={loginStyles.input}
              placeholder={t('mobile_number')}
              keyboardType="number-pad"
              onChangeText={handleChange}
              onFocus={handlePhoneInputFocus}
              value={phoneNumber}
              placeholderTextColor={colors.grey_xdark}
              maxLength={10}
            />
            <View style={loginStyles.phoneIcon}>
              <Phone />
            </View>
          </View>
          {phoneNumErr !== '' && (
            <Text style={loginStyles.errTxt}>{phoneNumErr}</Text>
          )}
        </View>
       
        <TouchableOpacity
          style={[
            loginStyles.otpBtn,
            phoneNumber.length !== 10 && {opacity: 0.5}
          ]}
          onPress={() => requestOTP()}
          disabled={phoneNumber.length !== 10}>
          <Text style={loginStyles.otptxt}>{t('request_otp')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default DriverAuthentication;
