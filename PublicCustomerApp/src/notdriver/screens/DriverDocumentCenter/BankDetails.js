import {StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView, Platform} from 'react-native';
import React, {useState, useCallback, useRef, useEffect} from 'react';
import { Colors, emailPattern, Fonts, upiIdPattern } from '../../../common/constants/constants';
import usePublicDriverStore from '../../store/usePublicDriverStore';
import useUserStore from '../../../common/store/useUserStore';
import { useStackScreenStore } from '../../../common/store/useStackScreenStore';
import { showNotification } from '../../../common/components/Alerts/showNotification';
import InputField from '../../../common/components/InputField';
import CustomDropdown from '../../../common/components/CustomDropdown';
import { driverDetailStyles } from '../../styles/DriverDetailsUpload';
import DocumentImageScanner from '../../components/DocumentImageScanner';
import { useTranslation } from 'react-i18next';
import NavBar from '../../../common/components/NavBar';
import UseBackButton from '../../../common/hooks/UseBackButton';
import APIRequest from '../../../common/APIRequest';
import { firebaselog_onBoarding } from '../../../common/utils/FirebaseAnalytics';
import FullScreenLoader from '../../../common/loaders/FullScreenLoader';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    // flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  textField: {
    marginBottom: 10
  },
  bottomButtonContainer: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.grey_light,
    backgroundColor: Colors.white,
  },
  updatedContainer: {
    backgroundColor: Colors.white,
    elevation: 5,
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    marginVertical: 20,
    width: '96%',
    alignSelf: 'center',
  },
  updatedText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.periwinkle,
    marginBottom: 5,
  },
  supportBtn:{
    backgroundColor: Colors.periwinkle,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '50%',
    alignSelf: 'center',
  },
  supportBtnText:{
    color: Colors.white,
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  dropdownContainer: {
   
  },
  dropdownLabel: {
    fontSize: 12,
    color: Colors.grey_xxdark,
    fontFamily: Fonts.light,
    marginBottom: 5,
    marginLeft: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: Colors.white,
  },
  error: {
    fontSize: 12,
    color: Colors.danger_red,
    fontFamily: Fonts.light,
    marginTop: 4,
    marginLeft: 10,
  },
});

const BankDetails = ({onNext, isView, isEdit = false}) => {
  const {t} = useTranslation()
  const {setBankInfo, bankInfo, setIsApproved} = usePublicDriverStore();
  const {userInfo} = useUserStore();
  const {setStackScreen} = useStackScreenStore();
  const [isLoading, setIsLoading] = useState(false);
  // Bank details state
  const [accountHolder, setAccountHolder] = useState(bankInfo?.accountHolderName || '');
  const [accountNumber, setAccountNumber] = useState(bankInfo?.accountNumber || '');
  const [reEnterAccountNumber, setReEnterAccountNumber] = useState(bankInfo?.accountNumber || '');
  const [bankName, setBankName] = useState(bankInfo?.bankName || '');
  const [ifscCode, setIfscCode] = useState(bankInfo?.ifscCode || '');
  const [branch, setBranch] = useState(bankInfo?.branch || '');
  const [upiId, setUpiId] = useState(bankInfo?.UPIID || '');
  const [email, setEmail] = useState(bankInfo?.email || '');
  const [lineOne, setLineOne] = useState(bankInfo?.address?.street1 || '');
  const [lineTwo, setLineTwo] = useState(bankInfo?.address?.street2 || '');
  const [city, setCity] = useState(bankInfo?.address?.city || '');
  const [state, setState] = useState(bankInfo?.address?.state || 'TAMIL NADU');
  const [postalCode, setPostalCode] = useState(bankInfo?.address?.postal_code || '');
  const [country, setCountry] = useState(bankInfo?.address?.country || 'IN');
  const [razorpayLinkedAccountDetails, setRazorpayLinkedAccountDetails] = useState(bankInfo?.razorpayLinkedAccountDetails || null);
  const {goBack} = useStackScreenStore();
  // const [referenceCode, setReferenceCode] = useState(bankInfo?.referenceCode || generateReferenceCode());

  const [passbookImage, setPassbookImage] = useState(bankInfo?.passbookImage || null);

  // Store initial values for change detection
  const initialValuesRef = useRef(null);
  useEffect(() => {
    if (!initialValuesRef.current) {
      initialValuesRef.current = {
        accountHolderName: bankInfo?.accountHolderName || '',
        accountNumber: bankInfo?.accountNumber || '',
        bankName: bankInfo?.bankName || '',
        ifscCode: bankInfo?.ifscCode || '',
        branch: bankInfo?.branch || '',
        UPIID: bankInfo?.UPIID || '',
        email: bankInfo?.email || '',
        address: {
          street1: bankInfo?.address?.street1 || '',
          street2: bankInfo?.address?.street2 || '',
          city: bankInfo?.address?.city || '',
          state: bankInfo?.address?.state || 'TAMIL NADU',
          postal_code: bankInfo?.address?.postal_code || '',
          country: bankInfo?.address?.country || 'IN',
        },
        passbookImage: bankInfo?.passbookImage || null,
      };
    }
  }, [bankInfo]);

  // Helper to compare current form values with initial values
  const isFormChanged = () => {
    const initial = initialValuesRef.current;
    if (!initial) return false;
    if (
      accountHolder !== initial.accountHolderName ||
      accountNumber !== initial.accountNumber ||
      bankName !== initial.bankName ||
      ifscCode !== initial.ifscCode ||
      branch !== initial.branch ||
      upiId !== initial.UPIID ||
      email !== initial.email ||
      lineOne !== initial.address.street1 ||
      lineTwo !== initial.address.street2 ||
      city !== initial.address.city ||
      state !== initial.address.state ||
      postalCode !== initial.address.postal_code ||
      country !== initial.address.country ||
      (passbookImage?.uri || passbookImage) !== (initial.passbookImage?.uri || initial.passbookImage)
    ) {
      return true;
    }
    return false;
  };
  const [passbookScanMessage, setPassbookScanMessage] = useState('');

  // Error states
  const [accountHolderErr, setAccountHolderErr] = useState('');
  const [accountNumberErr, setAccountNumberErr] = useState('');
  const [reEnterAccountNumberErr, setReEnterAccountNumberErr] = useState('');
  const [bankNameErr, setBankNameErr] = useState('');
  const [ifscCodeErr, setIfscCodeErr] = useState('');
  const [branchErr, setBranchErr] = useState('');
  const [upiIdErr, setUpiIdErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [lineOneErr, setLineOneErr] = useState('');
  const [lineTwoErr, setLineTwoErr] = useState('');
  const [cityErr, setCityErr] = useState('');
  const [stateErr, setStateErr] = useState('');
  const [postalCodeErr, setPostalCodeErr] = useState('');
  // const [referenceCodeErr, setReferenceCodeErr] = useState('');
  const [passbookImageErr, setPassbookImageErr] = useState('');

  const {setBankDetailsCompleteStatus, setRazorpayUpdated } = usePublicDriverStore();

  // Validation patterns
  const accountNumberPattern = /^\d{9,18}$/; // 9-18 digits for account number
  const ifscCodePattern = /^[A-Z]{4}0[A-Z0-9]{6}$/; // IFSC code pattern

  const INDIAN_STATES = [
  { label: 'TAMIL NADU', value: 'TAMIL NADU' },
  { label: 'PUDUCHERRY', value: 'PONDICHERRY' }
  ];  

  // const INDIAN_STATES = driverConfig?.STATES ? driverConfig.STATES : INDIAN_STATES_DEFAULT

  const validateAccountNumber = useCallback((accountNum) => {
    if (!accountNum) {
      return t('please_enter_account_number');
    }
    if (!accountNumberPattern.test(accountNum)) {
      return t('please_enter_a_valid_account_number_9_18_digits');
    }
    return '';
  }, [t]);

  const validateIFSCCode = useCallback((ifsc) => {
    if (!ifsc) {
      return t('please_enter_ifsc_code');
    }
    if (!ifscCodePattern.test(ifsc.toUpperCase())) {
      return t('please_enter_a_valid_ifsc_code_e_g_sbin0001234');
    }
    return '';
  }, [t]);

  const validateEmail = useCallback((email) => {
    if (!email.trim()) {
      return t('please_enter_a_valid_email');
    }
    if (!emailPattern.test(email.trim())) {
      return t('please_enter_a_valid_email');
    }
    return '';
  }, [t]);

  const validateField = useCallback((fieldName, value) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return `${fieldName} is required`;
    }

    // Additional validation rules
    switch (fieldName) {
      case 'postalCode':
        if (trimmedValue.length < 4 || trimmedValue.length > 10) {
          return 'Postal Code must be between 4-10 characters';
        }
        if (!/^[0-9]+$/.test(trimmedValue)) {
          return 'Postal Code must contain only numbers';
        }
        break;
      case 'state':
        if (trimmedValue.length < 2) {
          return 'State must be at least 2 characters';
        }
        break;
      case 'city':
        if (trimmedValue.length < 2) {
          return 'City must be at least 2 characters';
        }
        break;
      case 'streetOne':
      case 'streetTwo':
        if (trimmedValue.length < 5) {
          return 'Street address must be at least 5 characters';
        }
        break;
    }

    return '';
  }, []);

  // const regenerateReferenceCode = () => {
  //   setReferenceCode(generateReferenceCode());
  // };

  // const validateReferenceCode = useCallback((refCode) => {
  //   if (!refCode.trim()) {
  //     return 'Reference Code is required';
  //   }
  //   if (!refCode.startsWith('DI_')) {
  //     return 'Reference Code must start with DI_';
  //   }
  //   if (refCode.length < 10) {
  //     return 'Reference Code must be at least 10 characters';
  //   }
  //   return '';
  // }, []);

  const parsePassbookDetails = useCallback(text => {
    if (!text) {
      return {};
    }

    const normalized = text.replace(/\r/g, '\n');
    const lines = normalized.split(/\n+/).map(line => line.trim()).filter(Boolean);

    let accountNumber = '';
    const accountRegexes = [
      /ACCOUNT(?:\s*(?:NUMBER|NO\.?))?[:\-\s]*([0-9\s]{9,})/i,
      /A\/C(?:OUNT)?(?:\s*NO\.?)?[:\-\s]*([0-9\s]{9,})/i,
      /ACC(?:OUNT)?\s*NO\.?[:\-\s]*([0-9\s]{9,})/i,
    ];

    for (const regex of accountRegexes) {
      const match = normalized.match(regex);
      if (match && match[1]) {
        accountNumber = match[1];
        break;
      }
    }

    if (!accountNumber) {
      const digits = normalized.match(/\b\d{9,18}\b/g);
      if (digits && digits.length > 0) {
        const preferred = digits.filter(num => num.length >= 12);
        const source = preferred.length > 0 ? preferred : digits;
        accountNumber = source.sort((a, b) => b.length - a.length)[0];
      }
    }

    accountNumber = accountNumber.replace(/\D+/g, '').slice(0, 18);

    const holderKeywords = ['ACCOUNT HOLDER', 'ACC HOLDER', 'A/C NAME', 'ACCOUNT NAME'];
    let accountHolderName = '';
    for (let i = 0; i < lines.length; i += 1) {
      const upperLine = lines[i].toUpperCase();
      const hasKeyword = holderKeywords.some(keyword => upperLine.includes(keyword));
      if (hasKeyword) {
        const parts = lines[i].split(/[:\-]/);
        if (parts.length > 1) {
          accountHolderName = parts.slice(1).join(' ').trim();
        } else if (i + 1 < lines.length) {
          accountHolderName = lines[i + 1].trim();
        }
        if (accountHolderName) {
          break;
        }
      }
    }

    const bankKeywords = ['BANK OF', 'BANK LTD', 'BANK LIMITED', 'BANK'];
    let detectedBankName = '';
    for (let i = 0; i < lines.length; i += 1) {
      const upperLine = lines[i].toUpperCase();
      const hasKeyword = bankKeywords.some(keyword => upperLine.includes(keyword));
      if (hasKeyword) {
        const cleaned = lines[i].replace(/BRANCH.*/i, '').trim();
        if (cleaned && cleaned.length > 2 && !/ACCOUNT|A\/C|ACC\s*NO/i.test(cleaned.toUpperCase())) {
          detectedBankName = cleaned;
          break;
        }
      }
    }

    const branchKeywords = ['BRANCH', 'BRANCH NAME'];
    let branchName = '';
    for (let i = 0; i < lines.length; i += 1) {
      const upperLine = lines[i].toUpperCase();
      const hasKeyword = branchKeywords.some(keyword => upperLine.includes(keyword));
      if (hasKeyword) {
        const parts = lines[i].split(/[:\-]/);
        if (parts.length > 1) {
          branchName = parts.slice(1).join(' ').trim();
        } else if (i + 1 < lines.length) {
          branchName = lines[i + 1].trim();
        }
        branchName = branchName.replace(/BRANCH/i, '').trim();
        if (branchName) {
          break;
        }
      }
    }

    const ifscMatch = normalized.toUpperCase().match(/([A-Z]{4}0[A-Z0-9]{6})/);
    const ifscCode = ifscMatch ? ifscMatch[1].toUpperCase() : '';

    const upiMatch = normalized.match(/\b[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}\b/);
    const detectedUpi = upiMatch ? upiMatch[0] : '';

    const emailMatch = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const detectedEmail = emailMatch ? emailMatch[0] : '';

    return {
      accountNumber: accountNumber || '',
      accountHolderName: accountHolderName || '',
      branchName: branchName || '',
      ifscCode,
      bankName: detectedBankName || '',
      upiId: detectedUpi || '',
      email: detectedEmail || '',
    };
  }, []);

  const handlePassbookImageSelected = useCallback(image => {
    if (!image) {
      return;
    }

    setPassbookImage(image);
    setBankInfo({ passbookImage: image });
    if (passbookImageErr) {
      setPassbookImageErr('');
    }
    setPassbookScanMessage('');
  }, [passbookImageErr, setBankInfo]);

  const handlePassbookScanComplete = useCallback(result => {
    if (!result) {
      setPassbookScanMessage(
        t('details_not_detected_update_manual', {
          defaultValue: 'Could not extract details. Update the fields manually.',
        }),
      );
      return;
    }

    const { image, text } = result;

    if (image) {
      setPassbookImage(image);
      setBankInfo({ passbookImage: image });
      setPassbookImageErr('');
    }

    const detectedText = text || '';

    if (!detectedText.trim()) {
      setPassbookScanMessage(
        t('details_not_detected_update_manual', {
          defaultValue: 'Could not extract details. Update the fields manually.',
        }),
      );
      return;
    }

    const parsed = parsePassbookDetails(detectedText);
    let didUpdate = false;

    if (parsed.accountHolderName) {
      const holder = parsed.accountHolderName.trim();
      setAccountHolder(holder);
      setBankInfo({ accountHolderName: holder });
      setAccountHolderErr('');
      didUpdate = true;
    }

    if (parsed.accountNumber) {
      const sanitizedAccount = parsed.accountNumber.trim();
      setAccountNumber(sanitizedAccount);
      setReEnterAccountNumber(sanitizedAccount);
      setBankInfo({ accountNumber: sanitizedAccount });
      setAccountNumberErr('');
      setReEnterAccountNumberErr('');
      didUpdate = true;
    }

    if (parsed.ifscCode) {
      const ifsc = parsed.ifscCode.trim().toUpperCase();
      setIfscCode(ifsc);
      setBankInfo({ ifscCode: ifsc });
      setIfscCodeErr('');
      didUpdate = true;
    }

    if (parsed.branchName) {
      const branchName = parsed.branchName.trim();
      setBranch(branchName);
      setBankInfo({ branch: branchName });
      setBranchErr('');
      didUpdate = true;
    }

    if (parsed.bankName) {
      const detectedName = parsed.bankName.trim();
      setBankName(detectedName);
      setBankInfo({ bankName: detectedName });
      setBankNameErr('');
      didUpdate = true;
    }

    if (parsed.upiId) {
      const detectedUpi = parsed.upiId.trim();
      if (upiIdPattern.test(detectedUpi)) {
        setUpiId(detectedUpi);
        setBankInfo({ UPIID: detectedUpi });
        setUpiIdErr('');
        didUpdate = true;
      }
    }

    if (parsed.email) {
      const detectedEmail = parsed.email.trim();
      if (emailPattern.test(detectedEmail)) {
        setEmail(detectedEmail);
        setBankInfo({ email: detectedEmail });
        setEmailErr('');
        didUpdate = true;
      }
    }

    setPassbookScanMessage(
      didUpdate
        ? t('details_detected_review', {
            defaultValue: 'Details detected automatically. Review before submitting.',
          })
        : t('details_not_detected_update_manual', {
            defaultValue: 'Could not extract details. Update the fields manually.',
          }),
    );
  }, [emailPattern, parsePassbookDetails, setBankInfo, t, upiIdPattern]);

  const onNextPress = async () => {
    // Only proceed if form changed
    if (!isFormChanged()) {
      // showNotification(t('no_changes_to_update', {defaultValue: 'No changes to update.'}), '', 'info');
      goBack();
      return;
    }
    let isValid = true;

    // Validate Passbook Image
    if (!passbookImage) {
      setPassbookImageErr(t('please_upload_bank_passbook_front_page'));
      isValid = false;
    } else {
      setPassbookImageErr('');
    }

    // Validate Account Holder
    if (!accountHolder.trim()) {
      setAccountHolderErr(t('please_enter_account_holder_name'));
      isValid = false;
    } else {
      setAccountHolderErr('');
    }

    // Validate Account Number
    const accountNumError = validateAccountNumber(accountNumber);
    if (accountNumError) {
      setAccountNumberErr(accountNumError);
      isValid = false;
    } else {
      setAccountNumberErr('');
    }

    // Validate Re-enter Account Number
    if (!reEnterAccountNumber) {
      setReEnterAccountNumberErr(t('please_re_enter_account_number'));
      isValid = false;
    } else if (accountNumber !== reEnterAccountNumber) {
      setReEnterAccountNumberErr(t('account_numbers_do_not_match'));
      isValid = false;
    } else {
      setReEnterAccountNumberErr('');
    }

    // Validate Bank Name
    if (!bankName.trim()) {
      setBankNameErr(t('please_enter_bank_name'));
      isValid = false;
    } else {
      setBankNameErr('');
    }

    // Validate IFSC Code
    const ifscError = validateIFSCCode(ifscCode);
    if (ifscError) {
      setIfscCodeErr(ifscError);
      isValid = false;
    } else {
      setIfscCodeErr('');
    }

    // Validate Branch
    if (!branch.trim()) {
      setBranchErr(t('please_enter_branch_name'));
      isValid = false;
    } else {
      setBranchErr('');
    }

    if(!upiId.trim()) {
      setUpiIdErr(t('please_enter_a_valid_upi_id'));
      isValid = false;
    } else {
      setUpiIdErr('')
    }
    // Validate UPI ID
    if (!upiIdPattern.test(upiId.trim())) {
      setUpiIdErr(t('please_enter_a_valid_upi_id_9999999999_upi'));
      isValid = false;
    } else {
      setUpiIdErr('');
    }

    // Validate Email
    const emailError = validateEmail(email);
    if (emailError) {
      setEmailErr(emailError);
      isValid = false;
    } else {
      setEmailErr('');
    }

    // Validate Line 1
    const lineOneError = validateField('streetOne', lineOne);
    if (lineOneError) {
      setLineOneErr(lineOneError);
      isValid = false;
    } else {
      setLineOneErr('');
    }

    // Validate Line 2
    const lineTwoError = validateField('streetTwo', lineTwo);
    if (lineTwoError) {
      setLineTwoErr(lineTwoError);
      isValid = false;
    } else {
      setLineTwoErr('');
    }

    // Validate City
    const cityError = validateField('city', city);
    if (cityError) {
      setCityErr(cityError);
      isValid = false;
    } else {
      setCityErr('');
    }

    // Validate State
    const stateError = validateField('state', state);
    if (stateError) {
      setStateErr(stateError);
      isValid = false;
    } else {
      setStateErr('');
    }

    // Validate Postal Code
    const postalCodeError = validateField('postalCode', postalCode);
    if (postalCodeError) {
      setPostalCodeErr(postalCodeError);
      isValid = false;
    } else {
      setPostalCodeErr('');
    }

    // // Validate Reference Code
    // const referenceCodeError = validateReferenceCode(referenceCode);
    // if (referenceCodeError) {
    //   setReferenceCodeErr(referenceCodeError);
    //   isValid = false;
    // } else {
    //   setReferenceCodeErr('');
    // }


    const formData = new FormData();
    formData.append('accountHolderName', accountHolder.trim());
    formData.append('accountNumber', accountNumber);
    formData.append('bankName', bankName.trim());
    formData.append('ifscCode', ifscCode.toUpperCase());
    formData.append('branch', branch.trim());
    formData.append('UPIID', upiId.trim());
    formData.append('email', email.trim());
    formData.append('address', JSON.stringify({
      street1: lineOne.trim(),
      street2: lineTwo.trim(), 
      city: city.trim(),
      state: state.trim(),
      postal_code: postalCode.trim(),
      country: country.trim()
    }));
    if(passbookImage?.uri?.includes('file://')){
    formData.append('passbookImage', {
        uri: Platform.OS === 'android' ? passbookImage?.uri : passbookImage?.uri?.replace('file://', ''),
        name: passbookImage?.name,
        type: passbookImage?.type,
      });
    }
    if (isValid) {
      setIsLoading(true);
      try {
        const api = new APIRequest();
        const response = await api.request('/publicrides/driver/v2/uploadBankDetails', 'POST', formData, userInfo.token, {}, {}, null, true);
        if (response.success) {
          const payload = {
            accountHolderName: accountHolder.trim(),
            accountNumber: accountNumber,
            bankName: bankName.trim(),
            ifscCode: ifscCode.toUpperCase(),
            branch: branch.trim(),
            UPIID: upiId.trim(),
            email: email.trim(),
            address: {
              street1: lineOne.trim(),
              street2: lineTwo.trim(),
              city: city.trim(),
              state: state.trim(),
              postal_code: postalCode.trim(),
              country: country.trim(),
            },
            passbookImage: passbookImage,
          };
          setBankInfo(payload);
          firebaselog_onBoarding('OB_Driver(OB_D)', 'OB_D:bankdetails_verifiedwith_razorpay_completed');
          setBankDetailsCompleteStatus(true);
          if (!accountNumber || accountNumber?.length === 0) {
            setRazorpayUpdated(false);
          } else {
            setRazorpayUpdated(true);
          }
          showNotification(response?.message, '', 'success');
          goBack();
        } else {
          showNotification(response?.message, '', 'danger');
        }
      } catch (error) {
        console.error('Error updating bank details:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  return (
    <View style={styles.container}>
      <NavBar title="Bank Details" onBackPress={() => goBack('DocumentCenter')} />
        <UseBackButton onBackPress={() => goBack()} />
           {/* {isLoading && <FullScreenLoader />} */}
        <View style={{width: '90%', flex: 1, alignSelf: 'center'}}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
        {razorpayLinkedAccountDetails && (
        <View style={styles.updatedContainer}>
          <Text style={styles.updatedText}><Text style={{color: Colors.black}}>Account Status: </Text>{(razorpayLinkedAccountDetails?.accountDetails?.activation_status)?.split('_')?.join(' ')?.toUpperCase()}</Text>
          <Text style={styles.updatedText}><Text style={{color: Colors.black}}>Product ID: </Text>{(razorpayLinkedAccountDetails?.accountDetails?.id)}</Text>
          <Text style={styles.updatedText}><Text style={{color: Colors.black}}>Linked Account ID: </Text>{(razorpayLinkedAccountDetails?.linkedAccountId)}</Text>
          <Text style={styles.updatedText}><Text style={{color: Colors.black}}>Requested At: </Text>{new Date(razorpayLinkedAccountDetails?.accountDetails?.requested_at * 1000)?.toUTCString()}</Text>
          <TouchableOpacity style={styles.supportBtn} onPress={() => setStackScreen('SupportScreen')}>
              <Text style={styles.supportBtnText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
          )}
          {/* Passbook Upload Section */}
          <DocumentImageScanner
            documentLabel={t('bank_passbook', { defaultValue: 'Bank Passbook' })}
            scannerTitle={`${t('upload_bank_passbook_front_page', {
              defaultValue: 'Upload bank passbook front page',
            })}*`}
            helperText={t('passbook_scan_helper', {
              defaultValue: 'Upload or capture the front page to auto-detect account details.',
            })}
            browseLabel={t('browse', { defaultValue: 'Browse' })}
            cameraLabel={t('camera', { defaultValue: 'Camera' })}
            initialImage={passbookImage}
            onImageSelected={handlePassbookImageSelected}
            onScanComplete={handlePassbookScanComplete}
            disabled={isView}
            disabledMessage={t('editing_disabled', {
              defaultValue: 'Editing is disabled in this mode.',
            })}
            containerStyle={{ marginBottom: 18 }}
          />
          {passbookImageErr ? (
            <Text style={{color: Colors.red, textAlign: 'center', marginBottom: 8, fontFamily: Fonts.medium}}>{passbookImageErr}</Text>
          ) : null}
          {passbookScanMessage ? (
            <Text style={{color: Colors.cool_grey, textAlign: 'center', marginBottom: 8, fontFamily: Fonts.light}}>
              {passbookScanMessage}
            </Text>
          ) : null}
          {/* <TouchableOpacity onPress={regenerateReferenceCode}>
            <InputField
              style={styles.textField}
              value={referenceCode}
              label={t.reference_code}
              errorText={referenceCodeErr}
              editable={false}
              selection={{start: 0, end: 0}}
              icon={
                <MaterialIcons name="refresh" size={24} color={Colors.black} />
              }
            />
          </TouchableOpacity> */}

          <InputField
            style={styles.textField}
            value={accountHolder}
            label={t('account_holder_name')}
            errorText={accountHolderErr}
            onChangeText={text => {
              setAccountHolder(text);
              setBankInfo({ accountHolderName: text });
              if (accountHolderErr && text.trim().length > 0) setAccountHolderErr('');
            }}
            isRequired={true}
            editable={isEdit ? false : true}
          />
          
          <InputField
            style={styles.textField}
            value={accountNumber}
            label={t('account_number')}
            errorText={accountNumberErr}
            keyboardType="numeric"
            maxLength={18}
            onChangeText={text => {
              setAccountNumber(text);
              setBankInfo({ accountNumber: text });
              if (accountNumberErr && text.length > 0) setAccountNumberErr('');
            }}
            isRequired={true}
            editable={isEdit ? false : true}
          />

          <InputField
            style={styles.textField}
            value={reEnterAccountNumber}
            label={t('re_enter_account_number')}
            errorText={reEnterAccountNumberErr}
            keyboardType="numeric"
            maxLength={18}
            onChangeText={text => {
              setReEnterAccountNumber(text);
              setBankInfo({ accountNumber: text });
              if (reEnterAccountNumberErr && text.length > 0) setReEnterAccountNumberErr('');
            }}
            isRequired={true}
            editable={isEdit ? false : true}
          />

          <InputField
            style={styles.textField}
            value={bankName}
            label={t('bank_name')}
            errorText={bankNameErr}
            onChangeText={text => {
              setBankName(text);
              setBankInfo({ bankName: text });
              if (bankNameErr && text.trim().length > 0) setBankNameErr('');
            }}
            isRequired={true}
            editable={isEdit ? false : true}
          />

          <InputField
            style={styles.textField}
            value={ifscCode}
            label={t('ifsc_code')}
            errorText={ifscCodeErr}
            autoCapitalize="characters"
            maxLength={11}
            onChangeText={text => {
              setIfscCode(text);
              setBankInfo({ ifscCode: text });
              if (ifscCodeErr && text.length > 0) setIfscCodeErr('');
            }}
            isRequired={true}
            editable={isEdit ? false : true}
          />

          <InputField
            style={styles.textField}
            value={branch}
            label={t('branch')}
            errorText={branchErr}
            onChangeText={text => {
              setBranch(text);
              setBankInfo({ branch: text });
              if (branchErr && text.trim().length > 0) setBranchErr('');
            }}
            isRequired={true}
            editable={isEdit ? false : true}
          />

           <InputField
            style={styles.textField}
            value={upiId}
            label={t('upi_id')}
            errorText={upiIdErr}
            onChangeText={text => {
              setUpiId(text); 
              setBankInfo({ UPIID: text });
              if (upiIdErr && text.length > 0) setUpiIdErr('');
            }}
            isRequired={true}
            editable={isEdit ? false : true}
          />


          <InputField
            style={styles.textField}
            value={email}
            label={t('Email')}
            errorText={emailErr}
            onChangeText={text => {
              setEmail(text);
              setBankInfo({ email: text });
              if (emailErr && text.trim().length > 0) setEmailErr('');
            }}
            isRequired={true}
            editable={isEdit ? false : true}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={{fontFamily: Fonts.medium, fontSize: 16, marginBottom: 10, textAlign: 'center'}}>{t('enter_your_residential_address')}</Text>
          <Text style={styles.dropdownLabel}>{t('address')} *</Text>
          <InputField
            style={styles.textField}
            value={lineOne}
            label={t('line_one')}
            errorText={lineOneErr.replace('Street address', 'Line one')}
            onChangeText={text => {
              setLineOne(text);
              setBankInfo({ address: { ...bankInfo.address,street1: text } });
              if (lineOneErr && text.trim().length > 0) setLineOneErr('');
            }}
            isRequired={true}
            editable={isEdit ? false : true}
          />

        

          <InputField
            style={styles.textField}
            value={lineTwo}
            label={t('line_two')}
            errorText={lineTwoErr.replace('Street address', 'Line two')}
            onChangeText={text => {
              setLineTwo(text);
              setBankInfo({ address: { ...bankInfo.address, street2: text } });
              if (lineTwoErr && text.trim().length > 0) setLineTwoErr('');
            }}
            isRequired={true}
            editable={isEdit ? false : true}
          />

          <InputField
            style={styles.textField}
            value={city}
            label={t('city')}
            errorText={cityErr}
            onChangeText={text => {
              setCity(text);
              setBankInfo({ address: { ...bankInfo.address, city: text } });
              if (cityErr && text.trim().length > 0) setCityErr('');
            }}
            isRequired={true}
            editable={isEdit ? false : true}
          />

        
          
            <CustomDropdown
              data={INDIAN_STATES}
              labelField="label"
              valueField="value"
              placeholder={t('state')}
              initialValue={state}
              onChange={(item) => {
                setState(item.value);
                  setBankInfo({ address: { ...bankInfo.address, state: item.value } });
                if (stateErr) setStateErr('');
              }}
              isEnableSearch={false}
              style={{margin:0,padding:0,marginVertical:10}}
              dropdownStyle={[styles.dropdown, { borderColor: stateErr ? Colors.danger_red : Colors.grey }]}
              disable={isEdit}
            />
            {!!stateErr && <Text style={styles.error}>{stateErr}</Text>}
       

          <InputField
            style={styles.textField}
            value={postalCode}
            label={t('postal_code')}
            errorText={postalCodeErr}
            onChangeText={text => {
              setPostalCode(text);
              setBankInfo({ address: { ...bankInfo.address,postal_code: text } });
              if (postalCodeErr && text.trim().length > 0) setPostalCodeErr('');
            }}
            isRequired={true}
            editable={isEdit ? false : true}
            keyboardType="numeric"
            maxLength={10}
          />

          <InputField
            style={styles.textField}
            value={country}
            label={t('country')}
            editable={false}
          />
        </View>
      </ScrollView>
          </View>
       {
        !isView && (
          <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={driverDetailStyles.nextBtn}
            onPress={onNextPress}
            disabled={isLoading}
          >
            
            {isLoading ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={driverDetailStyles.nextTxt}>{t('next')}</Text>}
          </TouchableOpacity>
        </View>
        )
       }
    </View>
  );
};

export default BankDetails;
