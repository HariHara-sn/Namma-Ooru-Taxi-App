import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { registerationStyles } from '../../../notCustomer/styles/UserStyles';
import BackArrow from '../../../notCustomer/assets/image/backArrow.svg';
import { showNotification } from '../../../notCustomer/components/NotificationManger';
import { usePostQuery } from '../../../notCustomer/hooks/useQuery';
import { CommonActions,useNavigation} from '@react-navigation/native';
import useUserInfoStore from '../../store/useUserInfoStore';
import { DataStore } from '../../../notCustomer/controllers/DataStore';
import { firebaselog_onBoarding } from '../../utils/FirebaseAnalytics';

const RegisterationScreen = () => {
  const { t } = useTranslation();
  const [FormStepperState, setFormStepperState] = useState(0);
  const [FormStepper, setFormStepper] = useState([]);

  useEffect(() => {
    setFormStepper([
      {
        id: 'name',
        title: t('how_do_we_call_you'),
        placeholder: t('your_name'),
        inputMode: 'text',
        maxlength: 40
      },
      {
        id: 'email',
        title: t('whats_your_email_address'),
        placeholder: t('user_email_placeholder'),
        inputMode: 'email',
        maxlength: 40
      },
      {
        id: 'gender',
        title: t('whats_your_gender'),
        inputMode: 'text'
      }
    ]);
  }, [t]);

  const [Name, setName] = useState('');
  const [Email, setEmail] = useState('');
  const [Gender, setGender] = useState('');
  const [InputErrorId, setInputErrorId] = useState('');
  const [InputErrorMssage, setInputErrorMssage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUserdetails } = useUserInfoStore();
  const navigation = useNavigation();


  const verifyEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const verifyName = (value) => {
    return value.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(value.trim());
  };

  const validateCurrentStep = (id) => {
    setInputErrorId('');
    setInputErrorMssage('');

    switch (id) {
      case 'name':
        if (!Name.trim()) {
          setInputErrorId(id);
          setInputErrorMssage(t('please_enter_your_name'));
          return false;
        }
        if (!verifyName(Name)) {
          setInputErrorId(id);
          setInputErrorMssage(t('name_validation_error'));
          return false;
        }
        break;
      case 'email':
        if (!Email.trim()) {
          setInputErrorId(id);
          setInputErrorMssage(t('please_enter_your_email'));
          return false;
        }
        if (!verifyEmail(Email)) {
          setInputErrorId(id);
          setInputErrorMssage(t('please_enter_valid_email'));
          return false;
        }
        break;
      case 'gender':
        if (!Gender) {
          setInputErrorId(id);
          setInputErrorMssage(t('please_select_your_gender'));
          return false;
        }
        break;
      default:
        return true;
    }

    return true;
  };

  const onStepperBackHandler = () => {
    if (FormStepperState > 0) {
      setFormStepperState(FormStepperState - 1);
      setInputErrorId('');
      setInputErrorMssage('');
    }
  };

  const onRegisterSuccess =async (data) => {
    setIsLoading(false);
  

    if (data?.success) {
      showNotification(t('registration_completed_successfully'), '', 'success');
      console.log(JSON.stringify(data))
      setUserdetails(data?.user);
      let {  user} = data;
      setUserdetails(user);
      
      await DataStore.storeData('userdetails', user);
      firebaselog_onBoarding('OB_Customer(OB_C)', 'OB_C:registration_completed')
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeScreen' }],
        });
      
    } else {
      const errorMessage = data?.message || t('registration_failed');
      showNotification(t('registration_failed'), errorMessage, 'danger');
    }
  };

  const onRegisterError = (error) => {
    setIsLoading(false);
   
    
    let errorMessage = t('network_error_check_connection');
    
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }
     firebaselog_onBoarding('OB_Customer(OB_C)', 'OB_C:registration_failed')
    showNotification(t('registration_failed'), errorMessage, 'danger');
  };

  const { mutate: RegisterMutate } = usePostQuery({
    onSuccess: onRegisterSuccess,
    onError: onRegisterError
  }); 

  const onStepperNextHandler = (id) => {
    if (isLoading) return;

    if (!validateCurrentStep(id)) {
      return;
    }

    if (FormStepperState < FormStepper.length - 1) {
      setFormStepperState(FormStepperState + 1);
    } else {

      try{
      
        const payload = {
       
          name: Name.trim(),
          email: Email.trim(),
          gender: Gender,
        };

     

        RegisterMutate({
          queryKey: 'profileUpdateQuery',
          url: '/publicrides/customer/v2/updatePassengerProfile',
          payload: payload
        });
      } catch (error) {
        setIsLoading(false);
        console.log('Error in registration:', error);
        showNotification(t('registration_error'), t('unexpected_error_occurred'), 'danger');
      }
    
    }
  };

  const onStepperInputHandler = (id, value) => {
    if (InputErrorId === id) {
      setInputErrorId('');
      setInputErrorMssage('');
    }

    switch (id) {
      case 'name':
        setName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'gender':
        setGender(value);
        break;
    }
  };

  const getStepperInputValue = (id) => {
    switch (id) {
      case 'name':
        return Name;
      case 'email':
        return Email;
      default:
        return '';
    }
  };

  const getButtonText = () => {
    return FormStepperState === FormStepper.length - 1 ? t('submit') : t('next');
  };

  const isButtonDisabled = () => {
    return isLoading || InputErrorId === FormStepper[FormStepperState].id;
  };

  // Don't render until FormStepper is populated
  if (FormStepper.length === 0) {
    return (
      <View style={registerationStyles.container}>
        <Text>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={registerationStyles.container} key={FormStepper[FormStepperState].id}>
      <View style={{ gap: 5 }}>
        {FormStepperState > 0 && (
          <TouchableOpacity onPress={onStepperBackHandler} disabled={isLoading}>
            <BackArrow />
          </TouchableOpacity>
        )}

        <Text style={registerationStyles.stepperTitleStyle}>
          {FormStepper[FormStepperState].title}
        </Text>

        {FormStepper[FormStepperState].id === 'gender' ? (
          <View style={{ flexDirection: 'row', gap: 10, padding: 10 }}>
            <TouchableOpacity
              style={{
                width: '50%',
                borderWidth: 1,
                borderColor: '#000',
                padding: 10,
                borderRadius: 5,
                backgroundColor: Gender === 'male' ? '#000' : '#fff',
              }}
              onPress={() => setGender('male')}
              disabled={isLoading}
            >
              <Text style={{ color: Gender === 'male' ? '#fff' : '#000', textAlign: 'center' }}>
                {t('male')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                width: '50%',
                borderWidth: 1,
                borderColor: '#000',
                padding: 10,
                borderRadius: 5,
                backgroundColor: Gender === 'female' ? '#000' : '#fff',
              }}
              onPress={() => setGender('female')}
              disabled={isLoading}
            >
              <Text style={{ color: Gender === 'female' ? '#fff' : '#000', textAlign: 'center' }}>
                {t('female')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              InputErrorId === FormStepper[FormStepperState].id
                ? registerationStyles.stepperInputError
                : {},
              registerationStyles.stepperInputContianer
            ]}
          >
            <TextInput
              style={{ width: '100%', fontSize: 16 }}
              placeholder={FormStepper[FormStepperState].placeholder}
              placeholderTextColor="#D3D3D3"
              inputMode={FormStepper[FormStepperState].inputMode}
              autoCapitalize="none"
              autoCorrect={false}
              value={getStepperInputValue(FormStepper[FormStepperState].id)}
              onChangeText={(value) => onStepperInputHandler(FormStepper[FormStepperState].id, value)}
              color="#000"
              maxLength={FormStepper[FormStepperState].maxlength}
              editable={!isLoading}
            />
          </View>
        )}

        {InputErrorId === FormStepper[FormStepperState].id && (
          <Text style={registerationStyles.stepperInputErrorMessage}>
            {InputErrorMssage}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={{ padding: 10, alignItems: 'flex-end' }}
        onPress={() => onStepperNextHandler(FormStepper[FormStepperState].id)}
        disabled={isButtonDisabled()}
      >
        <View
          style={[
            isButtonDisabled() ? registerationStyles.requestBtnDisabe : {},
            registerationStyles.requestBtn
          ]}
        >
          <Text style={{ color: 'white' }}>{getButtonText()}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterationScreen;
