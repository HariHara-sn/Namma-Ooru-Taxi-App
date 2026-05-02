import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import InputField from '../../../common/components/InputField';
import {useTranslation} from 'react-i18next';
import UseBackButton from '../../../common/hooks/UseBackButton';
import {useStackScreenStore} from '../../../common/store/useStackScreenStore';
import NavBar from '../../../common/components/NavBar';
import useUserStore from '../../../common/store/useUserStore';
import APIRequest from '../../../common/APIRequest';
import {showNotification} from '../../../common/components/NotificationManger';
import usePublicDriverStore from '../../store/usePublicDriverStore';
import {driverDetailStyles} from '../../styles/DriverDetailsUpload';
import {Colors, upiIdPattern} from '../../../common/constants/constants';
import { firebaselog_onBoarding } from '../../../common/utils/FirebaseAnalytics';
import FullScreenLoader from '../../../common/loaders/FullScreenLoader';

const UPIVerification = () => {
   const {setBankInfo, bankInfo, setBankDetailsCompleteStatus} = usePublicDriverStore();
  const [upiId, setUpiId] = React.useState(bankInfo?.UPIID || '');
  // Store initial UPI value for change detection
  const initialUPIRef = React.useRef(null);
  React.useEffect(() => {
    if (initialUPIRef.current === null) {
      initialUPIRef.current = bankInfo?.UPIID || '';
    }
  }, [bankInfo]);

  const isUPIChanged = () => {
    return upiId !== (initialUPIRef.current || '');
  };
  const [upiIdErr, setUpiIdErr] = React.useState('');
  // const [bankInfo, setBankInfo] = React.useState({});
  const {t} = useTranslation();
  const {goBack} = useStackScreenStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const {setIsApproved} = usePublicDriverStore();

  const {userInfo} = useUserStore();

  const updateUPIInfo = () => {
    // Only proceed if UPI changed
    if (!isUPIChanged()) {
      // showNotification(t('no_changes_to_update', {defaultValue: 'No changes to update.'}), '', 'info');
      goBack();
      return;
    }
    if (upiId.trim().length === 0) {
      setUpiIdErr(t('please_enter_a_valid_upi_id'));
    } else if (!upiIdPattern.test(upiId.trim())) {
      setUpiIdErr(t('please_enter_a_valid_upi_id_9999999999_upi'));
    } else {
      setUpiIdErr('');
      _updateUPIInfo();
    }
  };

  const _updateUPIInfo = async () => {
    setIsLoading(true);
    const api = new APIRequest();
    const payload = {
      UPIID: upiId,
    };
    try {
      const res = await api.request('/publicrides/driver/v2/verifyUPI','POST',payload,userInfo.token,);
      if (res.success) {
        const payload = {
          UPIID: upiId.trim(),
        };
        setBankInfo(payload);
        setIsApproved(false)
        showNotification(
          'success',
          t('upi_updated_successfully'),
          '',
          'success',
        );
        setBankDetailsCompleteStatus(true)
        firebaselog_onBoarding('OB_Driver(OB_D)', 'OB_D:bankdetails_verifiedwith_UPI_completed')
        goBack();
      } else {
        showNotification(
          'error',
          res?.message || t('something_went_wrong'),
          '',
          'danger',
        );
      }
      setIsLoading(false);
    } catch (error) {
      showNotification('error', t('something_went_wrong'), '', 'danger');
      setIsLoading(false);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <NavBar title={t('upi_verification')} onBackPress={() => goBack()} />
      <UseBackButton onBackPress={() => goBack()} />
        {/* {isLoading && <FullScreenLoader />} */}
      <View style={styles.container}>
        <InputField
          style={styles.textField}
          value={upiId}
          label={t('upi_id')}
          errorText={upiIdErr}
          onChangeText={text => {
            setUpiId(text);
            setBankInfo({UPIID: text});
            if (upiIdErr && text.length > 0) setUpiIdErr('');
          }}
          isRequired={true}
        />
      </View>
      <View
        style={[
          styles.bottomButtonContainer,
          {width: '90%', alignSelf: 'center'},
        ]}>
        <TouchableOpacity
          style={driverDetailStyles.nextBtn}
          onPress={updateUPIInfo}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={driverDetailStyles.nextTxt}>{t('next')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UPIVerification;

const styles = StyleSheet.create({
  container: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 20,
  },
});
