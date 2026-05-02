import {
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import React, {useState, useEffect, useCallback, use} from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';
import useUserStore from '../../../common/store/useUserStore';
import usePublicDriverStore from '../../store/usePublicDriverStore';
import { useStackScreenStore } from '../../../common/store/useStackScreenStore';
import { useMapMarkerStore } from '../../../common/store/useMapMarkerStore';
import { Colors, Fonts, licenseNumberPattern, phoneNumberPattern } from '../../../common/constants/constants';
import publicrideDriverApi from '../../api/publicrideDriverApi';
import { showNotification } from '../../../common/components/Alerts/showNotification';
import locationTask from '../../../common/controllers/GetCurrentLocation';
import { checkFineLocationPermissions, RequestFineLocationPermission } from '../../../common/controllers/PermissionHandler';
import InputField from '../../../common/components/InputField';
import { driverDetailStyles } from '../../styles/DriverDetailsUpload';
import { genderData } from '../../../common/constants/jsonData';

import UserName from '../../../notdriver/assets/icons/name.svg';
import Phone from '../../../notdriver/assets/icons/phone.svg';
import License from '../../../notdriver/assets/icons/license.svg';
import AlertModal from '../../components/AlertModal';
import { useTranslation } from 'react-i18next';
import DocumentImageScanner from '../../components/DocumentImageScanner';
import NavBar from '../../../notCustomer/components/NavBar';

const DriverEntry = ({onNext, isEdit = false, setLocationPressed = null}) => {
  const {t} = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const {userInfo} = useUserStore()
  const {setDriverInfo, driverInfo} = usePublicDriverStore();
  const { setStackScreen } = useStackScreenStore();
  const [name, setName] = useState(driverInfo.name);
  const [phone, setPhone] = useState(driverInfo.phone);
  const [alternatePhone, setAlternatePhone] = useState(driverInfo.alternatePhone);
  const [licenseNum, setLicenseNum] = useState(driverInfo.licenseNo);
  const [gender, setGender] = useState(driverInfo.gender);
  const [nameErr, setNameErr] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [alternatePhoneErr, setAlternatePhoneErr] = useState('');
  const [licenseNumErr, setLicenseNumErr] = useState('');
  const [driverLocation, setDriverLocation] = useState(driverInfo.homeLocation);
  const [driverLocationErr, setDriverLocationErr] = useState('');
  const [genderErr, setGenderErr] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [licenseScanMessage, setLicenseScanMessage] = useState('');
  const [driverPhoto, setDriverPhoto] = useState(driverInfo.driverPhoto || null);
  
  const {userLocation} = useMapMarkerStore();

  const {goBack} = useStackScreenStore();

  const normalizeLicenseNumber = useCallback(value => {
    if (!value) {
      return '';
    }
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length <= 4) {
      return cleaned;
    }
    if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`.trim();
    }
    if (cleaned.length <= 12) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)}${cleaned.slice(8)}`.trim();
    }
    const first = cleaned.slice(0, 4);
    const second = cleaned.slice(4, 8);
    const rest = cleaned.slice(8);
    return `${first} ${second}${rest}`.trim();
  }, []);
      
  const extractLicenseNumber = useCallback(text => {
    if (!text) {
      return '';
    }
    const normalized = text.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ');
    const licenseMatch = normalized.match(/[A-Z]{2}\s*\d{2}\s*\d{4}\s*\d{7,8}/);
    return licenseMatch ? licenseMatch[0] : '';
  }, []);

  const handleLicenseScanComplete = useCallback(result => {
    if (!result) {
      setLicenseScanMessage('');
      return;
    }

    if (result.image) {
      setDriverInfo({ licenseDocument: result.image });
    }

    const detectedLicense = extractLicenseNumber(result.text);

    let didUpdate = false;

    if (detectedLicense) {
      const formatted = normalizeLicenseNumber(detectedLicense);
      if (formatted) {
        setLicenseNum(formatted);
        setDriverInfo({ licenseNo: formatted });
        if (licenseNumErr && formatted.length > 0) {
          setLicenseNumErr('');
        }
        didUpdate = true;
      }
    }

    if (didUpdate) {
      setLicenseScanMessage(t('details_detected_review', {
        defaultValue: 'Details detected automatically. Review before submitting.',
      }));
    } else {
      setLicenseScanMessage(t('details_not_detected_update_manual', {
        defaultValue: 'Could not extract license details. Update the fields manually.',
      }));
    }
  }, [extractLicenseNumber, licenseNumErr, normalizeLicenseNumber, setDriverInfo, t]);

  const validateName = () => {
    if (name.length === 0) {
      setNameErr(t('please_enter_name'));
      return false;
    }
    setNameErr('');
    return true;
  };

  const validatePhone = () => {
    if (phone.length === 0) {
      setPhoneErr(t('please_enter_phone'));
      return false;
    } else if (!phoneNumberPattern.test(phone)) {
      setPhoneErr(t('valid_phone') +' '+ t('starts_with_91'));
      return false;
    }
    setPhoneErr('');
    return true;
  };

  const validateAlternatePhone = () => {
    if (!alternatePhone || alternatePhone.length === 0) {
      setAlternatePhoneErr('');
      return true;
    }
    if (!phoneNumberPattern.test(alternatePhone)) {
      setAlternatePhoneErr(t('phone_number_must_be_10_digits'));
      return false;
    }
    setAlternatePhoneErr('');
    return true;
  }

  const validateLicense = () => {
    if (!licenseNum || licenseNum.length === 0) {
      setLicenseNumErr('');
      // setLicenseNumErr(t.please_enter_license_number);
      return true;
    } else if (!licenseNumberPattern.test(licenseNum)) {
      setLicenseNumErr(t('please_enter_a_valid_license_number_tn01_20110012345'));
      return false;
    }
    setLicenseNumErr('');
    return true;
  };

  const validateGender = () => {
    if (!gender) {
      setGenderErr(t('please_select_gender') ? t('please_select_gender') : 'Please select gender');
      return false;
    }
    setGenderErr('');
    return true;
  };

  const validateDriverLocation = () => {
    if (!driverLocation || driverLocation.addressName === '') {
      setDriverLocationErr(t('please_enter_driver_location'));
      return false;
    }
    setDriverLocationErr('');
    return true;
  };
  
  const onNextPress = async () => {
    const isNameValid = validateName();
    const isPhoneValid = validatePhone();
    const isLicenseValid = validateLicense();
    const isGenderValid = validateGender();
    const isDriverLocationValid = validateDriverLocation();
    const isAlternatePhoneValid = validateAlternatePhone();
  
    if (!userLocation) {
      setShowLocationModal(true);
      return;
    }

    if (isNameValid && isPhoneValid && isLicenseValid && isGenderValid && isDriverLocationValid && isAlternatePhoneValid) {
      const payload = {
        name: name,
        phone: phone,
        alternatePhone: alternatePhone,
        aadharNo: driverInfo.aadharNo,
        panNo: driverInfo.panNo,
        licenseNo: licenseNum,
        gender: gender,
        homeLocation: {coordinates:driverInfo.homeLocation?.coordinates , addressName:driverInfo.homeLocation?.addressName},
        location: userLocation.reverse(),
        driverPhoto: driverPhoto || driverInfo.driverPhoto || null,
      };
      setIsLoading(true);
      try {
        const response = await publicrideDriverApi.updateDriverDetails(payload,userInfo?.token);
        setIsLoading(false);
        if (response.success) {
          setDriverInfo(payload);
          onNext();
        } else {
          showNotification(response?.message, 'Please Contact Support', 'danger')
        }
      } catch (error) {
        console.error('Error updating driver details:', error);
      } finally {
        setIsLoading(false);
      }
    }
      
    
  };

  const getUserLocation = async () =>{
    await locationTask.getCurrentLocation()  
  }

  const getCurrentLocation = async () => {
    const isLocationPermitted = await checkFineLocationPermissions();
    if (!isLocationPermitted) {
      const hasLocationpermission = await RequestFineLocationPermission();
      if (!hasLocationpermission) {
        showNotification(
          t('location_permission_denied'),
          t('grant_location_permission'),
          'danger',
          3000,
        );
        return;
      }
    }
    getUserLocation();
  };

  const LocationRequestModal = () => {
    return (
      <AlertModal
      isVisible={showLocationModal}
      onClose={() => {
        setShowLocationModal(false);
      }}
      rightBtnText={t('allow')}
      leftBtnTxt={t('cancel')}
      successMessage={t('please_allow_location_access_to_continue_we_need_your_location_to_continue')} 
      // SubText={'We need your location to continue'}
      onRightPress={() => {
        getCurrentLocation();
        setShowLocationModal(false);
      }}
      animationType={'slide'}
    />
    );
  };

  useEffect(() => {
    if (setLocationPressed) {
      console.log('setLocationPressed', setLocationPressed)
      setLocationPressed(false)
    }
  }, [])



  const handleLocationPress = () => {
      setLocationPressed(true)
      setStackScreen('AddDriverLocation',{fromDriverEntry: true})
  }

  useEffect(() => {
    setDriverLocation(driverInfo.homeLocation);
  }, [driverInfo.homeLocation])

  useEffect(() => {
    setDriverPhoto(driverInfo.driverPhoto || null);
  }, [driverInfo.driverPhoto]);

  return (
    <View style={{flex: 1, backgroundColor: Colors.white}}>
    <NavBar title={t('driver_details',{defaultValue: 'Driver Details'})} onBackPress={() => goBack()} />
    <ScrollView contentContainerStyle={{paddingBottom: 32, backgroundColor: Colors.white, alignItems: 'center'}}>
    <View style={{gap: 10, width:'90%'}}>
      <View>
         <View style={{ marginTop: 16 }}>
        <DocumentImageScanner
          documentLabel={t('driver_photo', {
            defaultValue: 'Driver Photo',
          })}
          browseLabel={t('browse', { defaultValue: 'Browse' })}
          cameraLabel={t('camera', { defaultValue: 'Camera' })}
          cameraType="front"
          onScanComplete={result => {
            if (result?.image) {
              setDriverPhoto(result.image);
              setDriverInfo({ driverPhoto: result.image });
            }
          }}
          onImageSelected={image => {
            if (image) {
              setDriverPhoto(image);
              setDriverInfo({ driverPhoto: image });
            }
          }}
          helperText={t('driver_photo_helper', {
            defaultValue: 'Upload or capture a clear recent photo of the driver.',
          })}
          scannerTitle={t('upload_driver_photo', {
            defaultValue: 'Upload or capture driver photo',
          })}
          disabled={isEdit}
          disabledMessage={t('editing_disabled', {
            defaultValue: 'Editing is disabled in this mode.',
          })}
          containerStyle={{ marginTop: 0 }}
        />
      </View>
        <View style={{ marginTop: 16 }}>
        <DocumentImageScanner
          documentLabel={t('driving_license', {
            defaultValue: 'Driving License',
          })}
          browseLabel={t('browse', { defaultValue: 'Browse' })}
          cameraLabel={t('camera', { defaultValue: 'Camera' })}
          cameraType="back"
          onScanComplete={handleLicenseScanComplete}
          onImageSelected={image => {
            if (image) {
              setDriverInfo({ licenseDocument: image });
            }
          }}
          helperText={t('license_scan_helper', {
            defaultValue: 'Upload or capture the driving license to scan details automatically.',
          })}
          scannerTitle={t('upload_driving_license', {
            defaultValue: 'Upload or capture driving license',
          })}
          disabled={isEdit}
          disabledMessage={t('editing_disabled', {
            defaultValue: 'Editing is disabled in this mode.',
          })}
          containerStyle={{ marginTop: 0 }}
        />
        {licenseScanMessage ? (
          <Text style={{ color: Colors.cool_grey, fontSize: 12, marginTop: 8 }}>
            {licenseScanMessage}
          </Text>
        ) : null}
      </View>
      {/* <TouchableOpacity onPress={handleLocationPress} disabled={isEdit}>    
       <InputField
        style={driverDetailStyles.textField}
        value={driverLocation?.addressName}
        label={t('preferred_work_location')}
        errorText={driverLocationErr}
        onChangeText={text => {
          if (driverLocationErr && text.length > 0) setDriverLocation(driverLocation);
        }}
        icon={<Entypo name="location" size={16} color="black" />}
        editable={false}
        onPressOut={() => setStackScreen('AddDriverLocation',{fromDriverEntry: true})}
        selection={{start:0, end:0}}
      />
        </TouchableOpacity> */}
      <InputField
        style={driverDetailStyles.textField}
        value={name}
        label={t('full_name')}
        errorText={nameErr}
        onChangeText={text => {
          setName(text);
          setDriverInfo({ name: text });
          if (nameErr && text.length > 0) setNameErr('');
        }}
        icon={<UserName />}
        isRequired={true}
        editable={isEdit ? false : true}
      />
      <Text style={driverDetailStyles.GenderLabel}>
        {t('gender', {defaultValue: 'Gender'})}
        <Text style={{color: Colors.danger_red}}> *</Text>
      </Text>
      <View style={driverDetailStyles.GenderContainer}>
        {genderData.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[
              driverDetailStyles.GenderBtn,
              {
                backgroundColor:
                  item.value.toLowerCase() === gender.toLowerCase()
                    ? Colors.white
                    : Colors.grey_light,
                borderColor:
                  item.value.toLowerCase() === gender.toLowerCase()
                    ? Colors.periwinkle
                    : Colors.grey_light,
              },
            ]}
            disabled={isEdit}
            onPress={isEdit ? null : () => {
              setGender(item.value);
              setDriverInfo({ gender: item.value });
              if (genderErr) setGenderErr('');
            }}
            >
            {item.icon}
            <Text
              style={[
                driverDetailStyles.GenderTxt,
                item.value.toLowerCase() === gender.toLowerCase()
                  ? {color: Colors.periwinkle, fontFamily: Fonts.semi_bold}
                  : {},
              ]}
            >
              {t(item.name)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {Boolean(genderErr) && (
        <Text style={{ color: Colors.danger_red, fontSize: 12, marginTop: -10, marginBottom: 5 }}>
          {genderErr}
        </Text>
      )}
      <InputField
        style={driverDetailStyles.textField}
        value={phone}
        label={t('phone_number')}
        errorText={phoneErr}
        onChangeText={text => {
          setPhone(text);
          setDriverInfo({ phone: text });
          if (phoneErr && text.length > 0) setPhoneErr('');
        }}
        icon={<Phone />}
        keyboardType="number-pad"
        maxLength={13}
        isRequired={true}
        editable={ false}
      />
      <InputField
        style={driverDetailStyles.textField}
        value={licenseNum}
        label={t('license_number')}
        errorText={licenseNumErr}
        autoCapitalize='characters' 
        onChangeText={text => {
          setLicenseNum(text);
          setDriverInfo({ licenseNo: text });
          if (licenseNumErr && text.length > 0) setLicenseNumErr('');
          if (licenseScanMessage) setLicenseScanMessage('');
        }}
        icon={<License />}
        isRequired={true}
        editable={isEdit ? false : true}
        noSpaces={true}
        />
      </View>

         <InputField
        style={driverDetailStyles.textField}
        value={alternatePhone}
        label={t('alternate_phone_number')}
        errorText={alternatePhoneErr}
        onChangeText={text => {
          let formatted = (text || '').toString();
          const digits = formatted.replace(/[^0-9]/g, '');
          if (formatted.startsWith('+91')) {
            // keep +91 and max 10 local digits
            const local = digits.replace(/^91/, '').slice(0, 10);
            formatted = '+91' + local;
          } else {
            const local = digits.endsWith('91') && digits.length > 10
              ? digits.slice(-10)
              : digits.slice(-10);
            formatted = local.length > 0 ? '+91' + local : '';
          }
          setAlternatePhone(formatted);
          setDriverInfo({ alternatePhone: formatted });
          if (alternatePhoneErr && formatted.length > 0) setAlternatePhoneErr('');
        }}
        icon={<Phone />}
        keyboardType="number-pad"
        maxLength={13}
        isRequired={false}
        editable={true}
      />
      
      <TouchableOpacity
        style={driverDetailStyles.nextBtn}
        onPress={() => onNextPress()}>
        <Text style={driverDetailStyles.nextTxt}>{t('next')}</Text>
        {isLoading ? <ActivityIndicator size="small" color={Colors.white} /> : <AntDesign name="arrowright" color={Colors.white} size={18} />}
      </TouchableOpacity>
    
      </View>
      </ScrollView>
      {showLocationModal && <LocationRequestModal />}
      </View>
  );
};

export default DriverEntry;
