import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

import NavBar from '../../../common/components/NavBar';
import InputField from '../../../common/components/InputField';
import DocumentImageScanner from '../../components/DocumentImageScanner';
import usePublicDriverStore from '../../store/usePublicDriverStore';
import useUserStore from '../../../common/store/useUserStore';
import { showNotification } from '../../../common/components/Alerts/showNotification';
import APIRequest from '../../../common/controllers/APIRequest';
import { Colors, Fonts, vehicleNumberPattern } from '../../../common/constants/constants';
import { vehicleList } from '../../../common/constants/jsonData';
import { useStackScreenStore } from '../../../common/store/useStackScreenStore';
import UseBackButton from '../../../common/hooks/UseBackButton';
import { firebaselog_onBoarding } from '../../../common/utils/FirebaseAnalytics';
import FullScreenLoader from '../../../common/loaders/FullScreenLoader';

const VehicleEntry = ({ onNext }) => {

  // Store initial values for change detection (set only on mount)
  const initialValuesRef = React.useRef(null);
  useEffect(() => {
    if (!initialValuesRef.current) {
      initialValuesRef.current = {
        selectedType: vehicleInfo?.type || null,
        regNo: vehicleInfo?.regNo || '',
        vehicleRcDoc: vehicleInfo?.vehicleRcDoc || null,
        insuranceDoc: vehicleInfo?.insurance || null,
        permitNumber: vehicleInfo?.permitNumber || '',
        permitDoc: vehicleInfo?.permitDoc || null,
      };
    }
  }, []);

  
  const { t } = useTranslation();
  const { setVehicleInfo, vehicleInfo, driverInfo } = usePublicDriverStore();
  const { userInfo } = useUserStore();

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vehicleTypeError, setVehicleTypeError] = useState('');
  const [isFetchingTypes, setIsFetchingTypes] = useState(false);

  const [selectedType, setSelectedType] = useState(vehicleInfo.type || null);
  const [regNo, setRegNo] = useState(vehicleInfo.regNo || '');
  const [regNoError, setRegNoError] = useState('');

  const [vehicleRcDoc, setVehicleRcDoc] = useState(vehicleInfo.vehicleRcDoc || null);
  const [vehicleRcError, setVehicleRcError] = useState('');
  const [vehicleRcScanMessage, setVehicleRcScanMessage] = useState('');

  const [insuranceDoc, setInsuranceDoc] = useState(vehicleInfo.insurance || null);
  const [insuranceDocError, setInsuranceDocError] = useState('');

  const [permitNumber, setPermitNumber] = useState(vehicleInfo.permitNumber || '');
  const [permitNumberError, setPermitNumberError] = useState('');

  const [permitDoc, setPermitDoc] = useState(vehicleInfo.permitDoc || null);

  const [permitDocError, setPermitDocError] = useState('');

  const {goBack} = useStackScreenStore();

  const { setVehicleDetailsCompleteStatus } = usePublicDriverStore();

  const {isParivahanFailed, setIsParivahanFailed} = usePublicDriverStore();

  const [isSaving, setIsSaving] = useState(false);

  const {setIsApproved} = usePublicDriverStore();

  const shouldShowAdditionalDocs = isParivahanFailed;

    // Utility to check if form values changed (compare to initial values only)
    const isFormChanged = () => {
      const initial = initialValuesRef.current;
      const getImageUri = img => {
        if (!img) return '';
        if (typeof img === 'string') return img;
        if (typeof img === 'object' && img.uri) return img.uri;
        return '';
      };
      return (
        selectedType !== initial.selectedType ||
        regNo !== initial.regNo ||
        getImageUri(vehicleRcDoc) !== getImageUri(initial.vehicleRcDoc) ||
        getImageUri(insuranceDoc) !== getImageUri(initial.insuranceDoc) ||
        permitNumber !== initial.permitNumber ||
        getImageUri(permitDoc) !== getImageUri(initial.permitDoc)
      );
    };

  const loadVehicleTypes = useCallback(async () => {
    setIsFetchingTypes(true);
    try {
      const api = new APIRequest();
      const response = await api.request(
        '/publicrides/driver/v2/getAvailabelVehicle',
        'GET',
        {},
        userInfo?.token,
      );
      if (response?.success && response?.vehicleList?.vehicleTypes) {
        setVehicleTypes(Object.keys(response.vehicleList.vehicleTypes));
      } else {
        setVehicleTypes(vehicleList.map(item => item.name));
      }
    } catch (error) {
      console.warn('Failed to load vehicle types', error);
      setVehicleTypes(vehicleList.map(item => item.name));
    } finally {
      setIsFetchingTypes(false);
    }
  }, [userInfo?.token]);

  useEffect(() => {
    loadVehicleTypes();
  }, [loadVehicleTypes]);

  const getVehicleIcon = useCallback(
    type => {
      const icon = vehicleList.find(item => item.name === type)?.image;
      if (icon) {
        return React.cloneElement(icon, { width: 32, height: 32 });
      }
      return <MaterialIcons name="directions-car" size={20} color={Colors.periwinkle} />;
    },
    [],
  );

  const getVehicleLabel = useCallback(
    type => {
      const matching = vehicleList.find(item => item.name === type);
      if (!matching) {
        return type.replace(/_/g, ' ');
      }
      return matching.title ? t(matching.title) : matching.name;
    },
    [t],
  );

  const normalizeVehicleRegNumber = useCallback(value => {
    if (!value) {
      return '';
    }
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }, []);

  const extractVehicleRegNumber = useCallback(text => {
    if (!text) {
      return '';
    }
    const normalized = text.toUpperCase().replace(/[^A-Z0-9\s-]/g, ' ');
    const match = normalized.match(/[A-Z]{2}\s*-?\s*\d{1,2}\s*-?\s*[A-Z]{0,2}\s*-?\s*\d{4}/);
    return match ? match[0] : '';
  }, []);

  const handleVehicleRcScanComplete = useCallback(
    result => {
      if (!result) {
        setVehicleRcScanMessage('');
        return;
      }

      if (result.image) {
        setVehicleRcDoc(result.image);
        setVehicleInfo({ vehicleRcDoc: result.image });
        setVehicleRcError('');
      }

      const applyVehicleNumber = candidate => {
        if (!candidate) {
          return false;
        }
        const detected = extractVehicleRegNumber(candidate);
        if (!detected) {
          return false;
        }
        const formatted = normalizeVehicleRegNumber(detected);
        if (!formatted) {
          return false;
        }
        setRegNo(formatted);
        setVehicleInfo({ regNo: formatted });
        setRegNoError('');
        return true;
      };

      const serverPayload = result?.preScanResponse ?? result?.raw?.data ?? result?.raw ?? null;
      const payloadData = serverPayload?.data ?? serverPayload;

      let autoFilled = false;

      if (payloadData) {
        const parsedValues = payloadData?.parsed ?? {};
        const rawFields = payloadData?.rawFields ?? {};

        const candidateSources = [
          parsedValues?.registrationNumber,
          parsedValues?.licenseNumber,
          rawFields?.DocumentNumber?.valueString,
          rawFields?.DocumentNumber?.content,
        ];

        for (const candidate of candidateSources) {
          if (applyVehicleNumber(candidate)) {
            autoFilled = true;
            break;
          }
        }
      }

      if (!autoFilled && result.text) {
        autoFilled = applyVehicleNumber(result.text);
      }

      if (autoFilled) {
        setVehicleRcScanMessage(
          t('details_detected_review', {
            defaultValue: 'Details detected automatically. Review before submitting.',
          }),
        );
        return;
      }

      setVehicleRcScanMessage(
        t('vehicle_details_not_detected_update_manual', {
          defaultValue: 'Could not extract vehicle number. Update the field manually.',
        }),
      );
    },
    [extractVehicleRegNumber, normalizeVehicleRegNumber, setVehicleInfo, t],
  );

  const validate = useCallback(() => {
    let isValid = true;

    if (!selectedType) {
      setVehicleTypeError(t('please_select_vehicle_type', { defaultValue: 'Please select vehicle type' }));
      isValid = false;
    } else {
      setVehicleTypeError('');
    }

    if (!vehicleRcDoc) {
      setVehicleRcError(t('please_upload_vehicle_rc', { defaultValue: 'Upload the vehicle RC.' }));
      isValid = false;
    } else {
      setVehicleRcError('');
    }

    if (!regNo) {
      setRegNoError(t('please_enter_registration_number', { defaultValue: 'Enter registration number.' }));
      isValid = false;
    } else if (!vehicleNumberPattern.test(regNo)) {
      setRegNoError(
        t('please_enter_a_valid_vehicle_registration_number', {
          defaultValue: 'Enter a valid vehicle registration number.',
        }),
      );
      isValid = false;
    } else {
      setRegNoError('');
    }

    if (shouldShowAdditionalDocs) {
      const hasInsuranceDoc = insuranceDoc || vehicleInfo.insuranceDoc;
      if (!hasInsuranceDoc) {
        setInsuranceDocError(t('please_upload_insurance_document', { defaultValue: 'Upload the insurance document.' }));
        isValid = false;
      } else {
        setInsuranceDocError('');
      }

      if (!permitNumber?.trim()) {
        setPermitNumberError(t('please_enter_permit_number', { defaultValue: 'Enter the permit number.' }));
        isValid = false;
      } else {
        setPermitNumberError('');
      }

      const hasPermitDoc = permitDoc || vehicleInfo.permitDoc;
      if (!hasPermitDoc) {
        setPermitDocError(t('please_upload_permit_document', { defaultValue: 'Upload the permit document.' }));
        isValid = false;
      } else {
        setPermitDocError('');
      }
    } else {
      setInsuranceDocError('');
      setPermitNumberError('');
      setPermitDocError('');
    }

    return isValid;
  }, [insuranceDoc, permitDoc, permitNumber, regNo, selectedType, shouldShowAdditionalDocs, t, vehicleRcDoc]);

  const _validateNew = useCallback(() => {
    let isValid = true;

    if (!selectedType) {
      setVehicleTypeError(t('please_select_vehicle_type', { defaultValue: 'Please select vehicle type' }));
      isValid = false;
    } else {
      setVehicleTypeError('');
    }

    if (!vehicleRcDoc) {
      setVehicleRcError(t('please_upload_vehicle_rc', { defaultValue: 'Upload the vehicle RC.' }));
      isValid = false;
    } else {
      setVehicleRcError('');
    }

    if (!regNo) {
      setRegNoError(t('please_enter_registration_number', { defaultValue: 'Enter registration number.' }));
      isValid = false;
    } else if (!vehicleNumberPattern.test(regNo)) {
      setRegNoError(
        t('please_enter_a_valid_vehicle_registration_number', {
          defaultValue: 'Enter a valid vehicle registration number.',
        }),
      );
      isValid = false;
    } else {
      setRegNoError('');
    }

    if (isParivahanFailed) {
      const hasInsuranceDoc = insuranceDoc || vehicleInfo.insuranceDoc;
      if (!hasInsuranceDoc) {
        setInsuranceDocError(t('please_upload_insurance_document', { defaultValue: 'Upload the insurance document.' }));
        isValid = false;
      } else {
        setInsuranceDocError('');
      }

      // Permit number is now optional, so no validation error if empty
      setPermitNumberError('');

      const hasPermitDoc = permitDoc || vehicleInfo.permitDoc;
      if (!hasPermitDoc) {
        setPermitDocError(t('please_upload_permit_document', { defaultValue: 'Upload the permit document.' }));
        isValid = false;
      } else {
        setPermitDocError('');
      }
    } else {
      setInsuranceDocError('');
      setPermitNumberError('');
      setPermitDocError('');
    }

    return isValid;
  }, [insuranceDoc, permitDoc, permitNumber, regNo, selectedType, t, vehicleRcDoc, isParivahanFailed]);

  // Removed retry helper to make single-attempt API calls for both endpoints

  const updateProof = useCallback(async () => {
 
    if (!_validateNew()) {
      return;
    }

       if (!isFormChanged()) {
      goBack();
      return;
    }

    const formData = new FormData();
    formData.append('type', selectedType);
    formData.append('regNo', regNo.trim());
    if (permitNumber && permitNumber.trim()) {
      formData.append('permitNumber', permitNumber.trim());
    }

    if (isParivahanFailed) {
      if (insuranceDoc?.uri?.includes('file://')) {
        formData.append('insurance', {
          uri: Platform.OS === 'android' ? insuranceDoc?.uri : insuranceDoc?.uri?.replace('file://', ''),
          name: 'vehicle_insurance.jpg',
          type: 'image/jpeg',
        });
      }
      if (permitDoc?.uri?.includes('file://')) {
        formData.append('permitDoc', {
          uri: Platform.OS === 'android' ? permitDoc?.uri : permitDoc?.uri?.replace('file://', ''),
          name: 'vehicle_permit.jpg',
          type: 'image/jpeg',
        });
      }
    }

    setIsSaving(true);
    try {
      const maxRetries = 3;
      let response = null;
      for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
          const api = new APIRequest();
          response = await api.request(
            `/publicrides/driver/v2/updateDriverVehicleProof`,
            'POST',
            formData,
            userInfo?.token,
          );
          break;
        } catch (err) {
          const msg = String(err?.message || err || '');
          console.log('Error on attempt ', attempt, msg)
          const isNetworkFail = msg.includes('Network request failed');
          if (isNetworkFail && attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          }
          throw err;
        }
      }

      if (response?.success) {
        setVehicleInfo({
          type: selectedType,
          regNo: regNo.trim(),
          vehicleRcDoc,
          insuranceDoc,
          permitNumber: permitNumber.trim(),
          permitDoc,
        });
        showNotification(response?.message, '', 'success');
        setIsParivahanFailed(true);
        setVehicleDetailsCompleteStatus(true);
        firebaselog_onBoarding('OB_Driver(OB_D)', 'OB_D:vehicle_details_entry_manual')
        goBack();
        return;
      }

      // showNotification(response?.message, '', 'danger');
    } catch (error) {
      console.error('Error updating vehicle details: --- >>>', error);
      showNotification(
        t('something_went_wrong', { defaultValue: 'Something went wrong. Try again.' }),
        '',
        'danger',
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    _validateNew,
    goBack,
    insuranceDoc,
    permitDoc,
    permitNumber,
    regNo,
    selectedType,
    setIsParivahanFailed,
    setVehicleDetailsCompleteStatus,
    setVehicleInfo,
    t,
    userInfo?.token,
    vehicleRcDoc,
    isFormChanged,
    isParivahanFailed,
  ]);
   
  const onNextPress = useCallback(async () => {
  
    if (!validate()) {
      return;
    }
      if (!isFormChanged()) {
      goBack();
      return;
    }
    
    setIsSaving(true);
    const formData = new FormData();
    formData.append('type', selectedType);
    formData.append('regNo', regNo.trim());
    formData.append('permitNumber', permitNumber.trim());
    if (vehicleRcDoc?.uri?.includes('file://')) {
      formData.append('vehicleRcDoc', {
        uri: Platform.OS === 'android' ? vehicleRcDoc?.uri : vehicleRcDoc?.uri?.replace('file://', ''),
        name: 'vehicle_rc.jpg',
        type: 'image/jpeg',
      });
    }
    try {
      const maxRetries = 3;
      let response = null;
      for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
          const api = new APIRequest();
          response = await api.request(
            `/publicrides/driver/v2/updateDriverVehicleInfo`,
            'POST',
            formData,
            userInfo?.token,
          );
          break;
        } catch (err) {
          const msg = String(err?.message || err || '');
          const isNetworkFail = msg.includes('Network request failed');
          if (isNetworkFail && attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          }
          throw err;
        }
      }
      if (response?.success) {
        setVehicleInfo({
          type: selectedType,
          regNo: regNo.trim(),
          vehicleRcDoc: vehicleRcDoc,
          insuranceDoc: insuranceDoc || vehicleInfo.insuranceDoc || null,
          permitNumber: permitNumber?.trim(),
          permitDoc: permitDoc || vehicleInfo.permitDoc || null,
        });
        if (response?.message === 'parivahan_verification_failed') {
          showNotification(
            t('please_add_additional_details', {
              defaultValue: 'Please Add Additional Details',
            }),
            '',
            'success',
          );
          setIsParivahanFailed(true);
          setVehicleDetailsCompleteStatus(false);
          firebaselog_onBoarding('OB_Driver(OB_D)', 'OB_D:vehicle_details_entry_parivahan_verification_failed')
          return;
        }
        showNotification(response?.message, '', 'success');
        setIsParivahanFailed(false);
        setVehicleDetailsCompleteStatus(true);
        setIsApproved(false)
        firebaselog_onBoarding('OB_Driver(OB_D)', 'OB_D:vehicle_details_entry_parivahan_verification_completed')
        goBack();
        return;
      } else {
        showNotification(response?.message, '', 'danger');
      }
    } catch (error) {
      console.error('Error updating vehicle details:', error);
      showNotification(
        t('something_went_wrong', { defaultValue: 'Something went wrong. Try again.' }),
        '',
        'danger',
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    permitDoc,
    permitNumber,
    regNo,
    selectedType,
    setIsParivahanFailed,
    setVehicleDetailsCompleteStatus,
    setVehicleInfo,
    t,
    userInfo?.token,
    vehicleRcDoc,
    isFormChanged,
  ]);

  const renderVehicleTypes = useMemo(() => {
    if (isFetchingTypes) {
      return (
        <View style={styles.typeLoaderContainer}>
          <ActivityIndicator size="small" color={Colors.periwinkle} />
        </View>
      );
    }

    if (!driverInfo.homeLocation) {
      return (
         <Text style={styles.typeEmptyText}>
          {t('please_select_preffered_wrk_location', { defaultValue: 'Please select preferred work location.' })}
        </Text>
      )
    }

    if (!vehicleTypes || vehicleTypes.length === 0) {
      return (
        <Text style={styles.typeEmptyText}>
          {t('vehicle_types_not_available', { defaultValue: 'No vehicle types available.' })}
        </Text>
      );
    }

    return (
      <View style={styles.vehicleGrid}>
        {vehicleTypes.map(type => {
          const isActive = selectedType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.vehicleCard, isActive ? styles.vehicleCardActive : null]}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedType(type);
                setVehicleInfo({ type });
                setVehicleTypeError('');
              }}
            >
              <View style={styles.vehicleIcon}>{getVehicleIcon(type)}</View>
              <Text style={styles.vehicleLabel}>{getVehicleLabel(type)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [getVehicleIcon, getVehicleLabel, isFetchingTypes, selectedType, setVehicleInfo, t, vehicleTypes]);

  return (
    <View style={styles.container}>
      
      <NavBar title={t('vehicle_details', { defaultValue: 'Vehicle Details' })} onBackPress={() => goBack()} />
      <UseBackButton onBackPress={() => goBack()} />
     
        {/* {isSaving && <FullScreenLoader />} */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('vehicle_type', { defaultValue: 'Vehicle Type' })}
          </Text>
          {renderVehicleTypes}
          {vehicleTypeError ? <Text style={styles.errorText}>{vehicleTypeError}</Text> : null}
        </View>

        <View style={styles.section}>
          <DocumentImageScanner
            documentType="VEHICLE_RC"
            documentLabel={t('vehicle_registration_certificate', { defaultValue: 'Vehicle RC' })}
            browseLabel={t('browse', { defaultValue: 'Browse' })}
            cameraLabel={t('camera', { defaultValue: 'Camera' })}
            cameraType="back"
            onScanComplete={handleVehicleRcScanComplete}
            onImageSelected={image => {
              if (image) {
                setVehicleRcDoc(image);
                setVehicleInfo({ vehicleRcDoc: image });
                setVehicleRcError('');
              }
            }}
            initialImage={vehicleRcDoc || vehicleInfo?.vehicleRcDoc || null}
            helperText={t('vehicle_rc_scan_helper', {
              defaultValue: 'Upload or capture the vehicle RC to detect the registration number automatically.',
            })}
            scannerTitle={t('upload_vehicle_rc', { defaultValue: 'Upload or capture vehicle RC' })}
            containerStyle={styles.rcScannerContainer}
          />
          {vehicleRcScanMessage ? (
            <Text style={styles.helperText}>{vehicleRcScanMessage}</Text>
          ) : null}
          {vehicleRcError ? <Text style={styles.errorText}>{vehicleRcError}</Text> : null}
        </View>

        {shouldShowAdditionalDocs ? (
          <>
            <View style={styles.section}>
              <DocumentImageScanner
                documentType="VEHICLE_INSURANCE"
                documentLabel={t('vehicle_insurance_document', { defaultValue: 'Insurance Document' })}
                browseLabel={t('browse', { defaultValue: 'Browse' })}
                cameraLabel={t('camera', { defaultValue: 'Camera' })}
                cameraType="back"
                onImageSelected={image => {
                  if (image) {
                    setInsuranceDoc(image);
                    setVehicleInfo({ insuranceDoc: image });
                    setInsuranceDocError('');
                  }
                }}
                initialImage={insuranceDoc || vehicleInfo?.insuranceDoc || null}
                helperText={t('insurance_scan_helper', {
                  defaultValue: 'Upload your active insurance proof to stay compliant.',
                })}
                scannerTitle={t('upload_vehicle_insurance', { defaultValue: 'Upload or capture insurance document' })}
                containerStyle={styles.rcScannerContainer}
              />
              {insuranceDocError ? <Text style={styles.errorText}>{insuranceDocError}</Text> : null}
            </View>

            <View style={styles.section}>
              <DocumentImageScanner
                documentType="VEHICLE_PERMIT"
                documentLabel={t('vehicle_permit_document', { defaultValue: 'Permit Document' })}
                browseLabel={t('browse', { defaultValue: 'Browse' })}
                cameraLabel={t('camera', { defaultValue: 'Camera' })}
                onImageSelected={image => {
                  if (image) {
                    setPermitDoc(image);
                    setVehicleInfo({ permitDoc: image });
                    setPermitDocError('');
                  }
                }}
                cameraType="back"
                initialImage={permitDoc || vehicleInfo?.permitDoc || null}
                helperText={t('permit_scan_helper', {
                  defaultValue: 'Upload your valid vehicle permit for faster verification.',
                })}
                scannerTitle={t('upload_vehicle_permit', { defaultValue: 'Upload or capture permit document' })}
                containerStyle={styles.rcScannerContainer}
              />
              {permitDocError ? <Text style={styles.errorText}>{permitDocError}</Text> : null}
            </View>
          </>
        ) : null}
        <View style={styles.section}>
          <InputField
            label={t('vehicle_registration_number', { defaultValue: 'Vehicle Registration Number' })}
            value={regNo}
            errorText={regNoError}
            autoCapitalize="characters"
            onChangeText={text => {
              setRegNo(text);
              setVehicleInfo({ regNo: text });
              setRegNoError('');
              setVehicleRcScanMessage('');
            }}
            isRequired
          />
        </View>

        {shouldShowAdditionalDocs ? (
          <View style={styles.section}>
            <InputField
              label={t('vehicle_permit_number', { defaultValue: 'Permit Number' })}
              value={permitNumber}
              errorText={permitNumberError}
              autoCapitalize="characters"
              onChangeText={text => {
                setPermitNumber(text);
                setVehicleInfo({ permitNumber: text });
                setPermitNumberError('');
              }}
              isRequired={false}
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, isSaving ? styles.nextButtonDisabled : null]}
          onPress={() => isParivahanFailed ? updateProof() : onNextPress()}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.nextButtonText}>
              {t('next', { defaultValue: 'Next' })}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VehicleEntry;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.black,
    marginBottom: 12,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vehicleCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: Colors.grey,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  vehicleCardActive: {
    borderColor: Colors.periwinkle,
    backgroundColor: Colors.white_dirt,
  },
  vehicleIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.black,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  typeLoaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  typeEmptyText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.cool_grey,
  },
  helperText: {
    marginTop: 8,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.cool_grey,
  },
  errorText: {
    marginTop: 6,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.danger_red,
  },
  rcScannerContainer: {
    marginTop: 0,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.grey_light,
    padding: 16,
    backgroundColor: Colors.white,
  },
  nextButton: {
    backgroundColor: Colors.periwinkle,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.white,
  },
});
