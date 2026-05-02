import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useRef, useState, useCallback } from 'react';

import CountryPicker, { FlagButton } from 'react-native-country-picker-modal';
import { registerationStyles } from '../../../notCustomer/styles/UserStyles';
import BackArrow from '../../assets/image/backArrow.svg';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { showNotification } from '../../../notCustomer/components/NotificationManger';
import { DataStore } from '../../../notCustomer/controllers/DataStore';
import { usePostQuery } from '../../../notCustomer/hooks/useQuery';
import useUserInfoStore from '../../store/useUserInfoStore';
import { utils } from '../../../notCustomer/utils/Utils';
import DatePicker from 'react-native-date-picker'

const RegisterationScreen = () => {
  const navigation = useNavigation();

  const { id: UserId, userdetails, setUserdetails } = useUserInfoStore();

  const [FormStepperState, setFormStepperState] = useState(0);
  const [FormStepper, setFormStepper] = useState(
    [
      {
        id: 'name',
        title: "How do we call you?",
        placeholder: "Your name",
        inputMode: 'text'
      },
      {
        id: 'dob',
        title: "What's your Date of Birth",
        placeholder: "DD-MM-YYYY",
        inputMode: 'date'
      },
      {
        id: 'email',
        title: "What's your Email Address",
        placeholder: "user@xyz.com",
        inputMode: 'email'
      },
    ]
  );

  const [Name, setName] = useState('');
  const [DOB, setDOB] = useState(new Date());
  const [Email, setEmail] = useState('');
  const [OpenDatePicker, setOpenDatePicker] = useState(false)

  const [InputErrorId, setInputErrorId] = useState('')
  const [InputErrorMssage, setInputErrorMssage] = useState('')

  const verifyEmail = (value) => (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value))


  const onRegisterSuccess = (data) => {


   

    if (data.success) {

      // showNotification('Registeration Completed Successfully', 'Registeration Completed Successfully', 'success');

      let _userDetails = { ...userdetails }

      _userDetails.personalDetails = {
        name: Name,
        dob: DOB,
        email: Email
      }

      setUserdetails(_userDetails)
      DataStore.storeData('userdetails', _userDetails)

      navigation.dispatch(
        CommonActions.navigate({
          name: 'HomeScreen'
        }),
      );

    } else {
      showNotification('Please try again', data.message, 'danger');
    }

  }

  const onRegisterError = (data) => {
    if (!data.success) showNotification('Please try again', data.message, 'danger');

  }

  const { mutate: RegisterMutate, isSuccess } = usePostQuery({
    onSuccess: onRegisterSuccess,
    onError: onRegisterError
  });

  const onStepperBackHandler = () => {
    let max_stepper_length = FormStepper.length - 1

    if (FormStepperState != 0 && FormStepperState <= max_stepper_length) setFormStepperState(FormStepperState - 1)
  }
  const onStepperNextHandler = async (id) => {

    if (InputErrorId == id) return

    let max_stepper_length = FormStepper.length - 1
    const verifyEmail = (value) => (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value))

    if (
      (id == 'name' && Name.length <= 0)
      || (id == 'dob' && DOB.length <= 0)
      || (id == 'email' && Email.length <= 0)
    ) return alert(`Please fill ${id}.`);

    if (id == 'email' && !verifyEmail(Email)) return alert(`Please enter valid email address.`);

    if (FormStepperState < max_stepper_length) setFormStepperState(FormStepperState + 1)
    else if (FormStepperState == max_stepper_length) {

      const payload = {
        name: Name,
        dob: utils.formatDate(DOB, 'DD-MM-YYYY'),
        email: Email
      }

      await RegisterMutate({
        queryKey: 'profileUpdateQuery',
        url: '/customer/profile/update',
        payload: payload
      })

    }

  }
  const onStepperInputHandler = (id, value) => {
    if (id == 'name') setName(value)
    else if (id == 'dob') setDOB(value)
    else if (id == 'email') {

      console.log(verifyEmail(value), 'ashdgasd');

      if (!verifyEmail(value)) {
        setInputErrorId(id)
        setInputErrorMssage('Please enter valid email address.')
      } else {
        setInputErrorId('')
        setInputErrorMssage('')
      }
      setEmail(value)
    }
  }

  const onStepperInputFocusHandler = (id, value) => {
    if (id == 'dob') setOpenDatePicker(true)
  }

  const getStepperInputValue = (id) => {
    if (id == 'name') return Name
    else if (id == 'dob') return utils.formatDate(DOB, 'DD-MM-YYYY')

    else if (id == 'email') return Email
  }
  const onDOBDateChange = (date) => {
    setOpenDatePicker(false)
    setDOB(date)
  }
  const onDatePickerClose = () => {
    setOpenDatePicker(false)
  }


  return (
    <View
      style={registerationStyles.container}
      key={FormStepper[FormStepperState].id}
    >
      <View style={{ gap: 5 }}>
        {FormStepperState > 0 ?
          <TouchableOpacity onPress={() => onStepperBackHandler()}>
            <BackArrow />
          </TouchableOpacity>
          : ""}
        <Text style={registerationStyles.stepperTitleStyle}>
          {FormStepper[FormStepperState].title}
        </Text>


        <View style={[
          InputErrorId == FormStepper[FormStepperState].id
            ? registerationStyles.stepperInputError : {},
          registerationStyles.stepperInputContianer
        ]}>
          <TextInput
            style={{ width: "100%", fontSize: 16 }}
            placeholder={FormStepper[FormStepperState].placeholder}
            placeholderTextColor="#000"
            inputMode={FormStepper[FormStepperState].inputMode}
            autoCapitalize="none"
            autoCorrect={false}
            value={getStepperInputValue(FormStepper[FormStepperState].id)}
            onChangeText={(value) => onStepperInputHandler(FormStepper[FormStepperState].id, value)}
            onFocus={(value) => onStepperInputFocusHandler(FormStepper[FormStepperState].id, value)}
            color="#000"
          />
          {OpenDatePicker ?
            <DatePicker
              modal
              open={OpenDatePicker}
              date={DOB}
              onConfirm={onDOBDateChange}
              onCancel={onDatePickerClose}
              mode='date'
              maximumDate={new Date()}
            />
            : ''}
        </View>
        {InputErrorId == FormStepper[FormStepperState].id ?
          <Text style={registerationStyles.stepperInputErrorMessage}>{InputErrorMssage}</Text>
          : ""}
      </View>
      <TouchableOpacity
        style={{ padding: 10, alignItems: 'flex-end' }}
        onPress={() => onStepperNextHandler(FormStepper[FormStepperState].id)}
      >
        <View style={[InputErrorId == FormStepper[FormStepperState].id ? registerationStyles.requestBtnDisabe : {}, registerationStyles.requestBtn]}>
          <Text style={{ color: 'white' }}>{
            FormStepperState == FormStepper.length - 1 ? 'Continue' : 'Next'
          } </Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default RegisterationScreen;