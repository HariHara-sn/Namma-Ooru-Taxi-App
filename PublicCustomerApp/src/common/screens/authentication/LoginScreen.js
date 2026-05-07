import { Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';


import { loginStyles } from '../../../notCustomer/styles/UserStyles';
import Logo from '../../../notCustomer/assets/image/logo.svg';
import Phone from '../../../notCustomer/assets/image/svgIcons/phone.svg';
import { CommonActions, useNavigation } from '@react-navigation/native';

import { DataStore } from '../../controllers/DataStore';

import { requestDriverOTPMutation, requestOTPMutation } from '../../../notCustomer/API/APICalls/UserAPICalls';
import FullScreenLoader from '../../../notCustomer/components/Loaders/FullScreenLoader';
import { colors } from '../../../notCustomer/constants/constants';
import { showPhoneNumberHint } from '@shayrn/react-native-android-phone-number-hint';
import useUserStore from '../../store/useUserStore';
import NavBar from '../../components/NavBar';
import { phoneNumberPattern, phoneNumberPatternIN } from '../../constants/constants';
import { isDevDriverBypassPhone } from '../../utils/devDriverBypass';

const LoginScreen = ({ route }) => {
  const { userRole } = useUserStore();
  const { navRole = userRole } = route.params || {};
  const { t } = useTranslation();
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


  // console.log('Login Screen Role:', navRole, userRole);

  const handleLoginSuccess = async (data) => {
    if (data) {
      // showNotification(t('otp_sent'), t('otp_sent_to_mobile'), 'success');
      console.log('Login data', data);
      navigation.dispatch(
        CommonActions.navigate({
          name: 'OTPScreen',
          params: {
            countryCode: country.callingCode[0],
            phoneNumber: phoneNumber,
            navRole: 'customer'
          },
        }),
      );
    }
  };

  const handleDriverLoginSuccess = async (data) => {
    if (data) {

      navigation.dispatch(
        CommonActions.navigate({
          name: 'OTPScreen',
          params: {
            countryCode: country.callingCode[0],
            phoneNumber: phoneNumber,
            navRole: 'driver'
          },
        }),
      );
    }
  }

  const { mutate: requestOTPMutate, isLoading: isLoading } = requestOTPMutation(
    handleLoginSuccess,
  );

  // requestDriverOTPMutate

  const { mutate: requestDriverOTPMutate, isLoading: isOtpLoading } = requestDriverOTPMutation(
    handleDriverLoginSuccess,
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

    // Update error message based on phone number length
    if (phoneNumber.length === 0) {
      setPhoneNumErr('');
    } else if (phoneNumber.length < 10) {
      setPhoneNumErr(t('phone_number_must_be_10_digits'));
    } else if (phoneNumber.length > 10) {
      setPhoneNumErr(t('phone_number_must_be_10_digits'));
    } else if (!phoneNumberPatternIN.test(phoneNumber)) {
      setPhoneNumErr(t('valid_phone'));
    } else {
      if (navRole === 'customer') {
        DataStore.storeData('login_phoneNumber', phoneNumber);
        requestOTPMutate(payload);
      } else {
        DataStore.storeData('login_phoneNumber', phoneNumber);
        if (isDevDriverBypassPhone(phoneNumber)) {
          handleDriverLoginSuccess({success: true});
          return;
        }
        requestDriverOTPMutate(payload);
      }

    }

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
    } else if (!phoneNumberPatternIN.test(numericValue)) {
      setPhoneNumErr(t('valid_phone'));
    } else {
      setPhoneNumErr('');
    }
  };

  const handlePhoneInputFocus = async () => {
    if (Platform.OS !== 'android' || phoneNumber) {
      return;
    }
    try {
      const hinted = await showPhoneNumberHint(
        {
          showGuidanceDialog: false,
        }
      );
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


  const headerText = () => {
    switch (navRole) {
      case 'driver':
        return t('driver_login');
      case 'customer':
        return t('customer_login');
      case 'acting_driver':
        return t('acting_driver_login');
      default:
        return '';
    }
  }

  return (
    <>
      {(isLoading || isOtpLoading) && <FullScreenLoader />}
      <View style={loginStyles.screen}>
        <NavBar onBackPress={() => navigation.reset({
          index: 0,
          routes: [{ name: 'WelcomeScreen' }],
        })} title={''} />
        <View style={loginStyles.header}>
          <Logo />
          <Text style={loginStyles.headerTxt}>
            Namma Ooru Taxi ® {'\n'}{headerText()}
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
            phoneNumber.length !== 10 && { opacity: 0.5 }
          ]}
          onPress={() => requestOTP()}
          disabled={phoneNumber.length !== 10}>
          <Text style={loginStyles.otptxt}>{t('request_otp')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default LoginScreen;
