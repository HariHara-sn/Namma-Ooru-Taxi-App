import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import useUserStore from '../../../common/store/useUserStore';
import usePublicDriverStore from '../../store/usePublicDriverStore';
import { useStackScreenStore } from '../../../common/store/useStackScreenStore';
import { useMapMarkerStore } from '../../../common/store/useMapMarkerStore';
import useDeviceAPIStore from '../../../common/store/useDeviceAPIStore';
import useCurrentScreenStore from '../../../common/store/useCurrentScreenStore';
import DriverEntry from './DriverEntry';
import BankDetails from './BankDetails';
import DocumentsListScreen from './DocumentsListScreen';
import VehicleEntry from './VehicleEntry';
import APIRequest from '../../../common/APIRequest';
import BGLocationTask from '../../../common/controllers/BGLocationTask';
import { DataStore } from '../../../common/controllers/DataStore';
import { showNotification } from '../../../common/components/Alerts/showNotification';
import { Colors } from '../../../common/constants/constants';
import FullScreenLoader from '../../../common/loaders/FullScreenLoader';
import NavBarA from '../../../common/components/NavBarA';
import { driverDetailStyles } from '../../styles/DriverDetailsUpload';
import { useTranslation } from 'react-i18next';


const DriverVehiclesDetails = ({isEdit = false, isEditInfo = false, approved}) => {
  const navigation = useNavigation();
  const {t} = useTranslation()
  const {logout, userInfo} = useUserStore();
  const {getCompletionStatus, setIsPickLocationPressed, isPickLocationPressed} = usePublicDriverStore();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [loading, setLoading] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const {setStackScreen} = useStackScreenStore();
  // const resetAllStore = useRideSelectionStore();
  const {setMapMarkers} = useMapMarkerStore();
  const {userDeviceId} = useDeviceAPIStore();
  const {setCurrentScreen} = useCurrentScreenStore();

  const handleNext = (data) => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      console.log('All data submitted:', data);
    }
  };

  useEffect(() => {
    const completionStatus = getCompletionStatus();
    if (!completionStatus || isPickLocationPressed) return  setCurrentStep(1);
    setCurrentStep(completionStatus);
  }, []);

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleFinalSubmission = () => {
    if (approved) {
        setStackScreen('Home')
        setCurrentScreen('Map')
    } else {
      setStackScreen('DriverApprovalScreen')
    }
  }

  const _renderComponent = () => {
    switch (currentStep) {
      case 1:
        return <DriverEntry onNext={handleNext} setLocationPressed={setIsPickLocationPressed}/>;
      case 2:
        return <VehicleEntry onNext={handleNext} />;
      case 3:
        return <BankDetails onNext={handleNext} />;
      case 4:
        return <DocumentsListScreen onNext={handleFinalSubmission} />;
      default:
        return <DriverEntry onNext={handleNext} />;
    }
  };

  const getStepTitle = () => {
    return currentStep === 1 ? 'Driver Details' : currentStep === 2 ? 'Vehicle Details' : currentStep === 3 ? 'Bank Details' : 'Upload Documents';
  };

  const onLogoutPress = () => {
    // setShowLogoutModal(true);
    setStackScreen('DriverHelpSupport');
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    const url = `/publicrides/driver/v2/publicridesdriverLogout?platform=${Platform.OS}`;
    const api = new APIRequest();

    try {
      const response = await api.request(
        url,
        'POST',
        {fcmToken: {deviceImei: userDeviceId, token: userInfo?.token}},
        userInfo?.token,
      );

      if (!response.success)
        // throw new Error(response.message || 'Network request failed');

      setLoading(true);
      setMapMarkers(null);

      setTimeout(() => {
        // resetAllStore();
        logout('driver');
        setLoading(false);
        BGLocationTask.stopDriverBgTask();
        setLoading(false);
      }, 1000);

      // DataStore.clearSession();
    } catch (error) {
      console.log(error, 'Error logging out');
      showNotification(
        error?.message || 'Network request failed',
        t('pls_try_later'),
        'danger',
      );
    }
  };

  return (
    <View style={{backgroundColor: Colors.white, height: '100%',paddingBottom:20}}>
      {loading && <FullScreenLoader />}
      
      {!isEditInfo && 
      <NavBarA
        title={`${currentStep}/${totalSteps}`} 
        subtitle={getStepTitle()} 
        onBackPress={currentStep > 1 ? handleBack : undefined}
        image={
        <TouchableOpacity style={styles.powerOffBtn} onPress={() => onLogoutPress()}>
          <MaterialIcons name="support-agent" size={24} color={Colors.black} />
        </TouchableOpacity>
        }
      />}
      
      {/* <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : ""}
        > */}
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          >
          <View style={driverDetailStyles.subConatiner}>
            {_renderComponent()}
          </View>
        </ScrollView>
      {/* </KeyboardAvoidingView> */}
      {/* {showLogoutModal && (
        <QuestionModal
          message="Are you sure you want to logout?"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )} */}
    </View>
  );
};

export default DriverVehiclesDetails;

const styles = StyleSheet.create({
  powerOffBtn: {  
    padding: 10,
    backgroundColor: Colors.white,
    borderRadius:50,
  },
});
