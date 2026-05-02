import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, ScrollView, Platform } from 'react-native';
import {useQuery} from 'react-query';
import useUserStore from '../../common/store/useUserStore';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import useDeviceAPIStore from '../../common/store/useDeviceAPIStore';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import { Colors, contactPhone, Fonts } from '../../common/constants/constants';
import { showNotification } from '../../common/components/Alerts/showNotification';
import APIRequest from '../../common/APIRequest';
import publicrideDriverApi from '../api/publicrideDriverApi';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import { DataStore } from '../../common/controllers/DataStore';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import { settingsScreen } from '../styles/SettingsStyles';
import { height } from '../../common/utils/scalingutils';
import ApprovalIcon from '../../notdriver/assets/icons/Approval_BG.svg';
import DocWhiteIcon from '../../notdriver/assets/icons/doc_white.svg';
import { useTranslation } from 'react-i18next';
import usePublicDriverStore from '../store/usePublicDriverStore';
import GlobalContext from '../../context/GlobalContext';

const DriverApprovalScreen = () => {
  const { userInfo } = useUserStore()
  const {logout} = useContext(GlobalContext)
  const {setStackScreen} = useStackScreenStore();
  const {userDeviceId} = useDeviceAPIStore();
  const {driverRole, isApproved, isBlocked, unBlockRequestSent, setUnBlockRequestSent, driverInfo, setDriverInfo, setIsApproved} = usePublicDriverStore();
  const name = driverInfo?.name || 'Driver Name';
  const phone = driverInfo?.phone || '';
  const [loading, setLoading] = useState(false)
  const {t} = useTranslation();
  const {setMapMarkers} = useMapMarkerStore();
  // const resetAllStore = useRideSelectionStore();

  const handleContactUs = () => {
    Linking.openURL(`tel:${contactPhone}`);
  };

  const handleEditDocuments = () => {
    setStackScreen('DocumentCenter');
  };

  const sendUnBlockRequest = async() => {
    if (unBlockRequestSent) return showNotification('Unblock Request Already Sent','', 'success');
    setLoading(true)
    const api = new APIRequest();
    const url = `/publicrides/driver/v2/sendUnblockRequest`;
    try {
      const res = await api.request(url, 'GET', {}, userInfo?.token);
      if(res.success){
        setUnBlockRequestSent(true)
        showNotification(t('unblock_request_sent'),'', 'success')
      } else {
        showNotification(t('something_went_wrong'),'', 'error')
      }
      setLoading(false)
    } catch (error) {
      // console.log('error', error)
      setLoading(false)
    }
  }

  const storePublicDriverInfo = (response) => {
    setDriverInfo({
      name: response.driver?.name || '',
      phone: response.driver?.phone || '',
      aadharNo: response.driver?.aadharNo || '',
      panNo: response.driver?.panNo || '',
      licenseNo: response.driver?.licenseNo || '',
      gender: response.driver?.gender || '',
      homeLocation: response.driver?.homeLocation || null,
      drivingExperience: response.driver?.drivingExperience || null,
      vehicleHandling: response.driver?.vehicleHandling || null,
    });
  }

  const { data, isLoading, error, refetch, isFetching } = useQuery(
    ['driverDetails'], 
    () => publicrideDriverApi.getDriverDetails(userInfo?.token),
    {
      enabled: true,
      onSuccess: (response) => {
        if(response?.success){
        storePublicDriverInfo(response);
        setIsApproved(response?.driver?.isApproved || false);
      }
      },
      onError: (error) => {setStackScreen('DriverApprovalScreen')},
    }
  );

  const [isChecking, setIsChecking] = useState(false);

  const onCheckStatusPress = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      const result = await refetch();
      const resp = result?.data;
      const approved = resp?.driver?.isApproved;
      if (approved) {
        setStackScreen('Home');
        setIsApproved(true)
      } else {
        showNotification(t('still_under_review') || 'Still under review', '', 'info');
      }
    } catch (e) {
      showNotification(t('something_went_wrong') || 'Something went wrong', '', 'danger');
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
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
        throw new Error(response.message || 'Network request failed');

      setLoading(true);
      setMapMarkers(null);

      setTimeout(() => {
        // resetAllStore();
        logout('driver');
        setLoading(false);
        BGLocationTask.stopDriverBgTask();
        setLoading(false);
      }, 1000);

      DataStore.clearSession();
    } catch (error) {
      // console.log(error, 'Error logging out');
      showNotification(
        error?.message || 'Network request failed',
        t('pls_try_later'),
        'danger',
      );
    }
  };

  return (
    <View style={styles.container}>
      {(loading || isLoading) && <FullScreenLoader />}
      <ScrollView contentContainerStyle={{paddingBottom:100}}>
      <View style={styles.header}>
       <View style={styles.approvalImageBG}>
        <ApprovalIcon />
        </View>
        {
          isBlocked ? (
            <Text style={styles.title}>{t('your_account_is_blocked')}</Text>
          ) :(
            <Text style={styles.title}>{t('wait_for_approval')}</Text>
          )
        }
      
        <View style={styles.seperator}/>
        <View style={styles.profileContainer}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profilePhone}>{phone}</Text>
        </View>
      </View>
      {isBlocked ? (
         <View style={styles.body}>
         <Text style={styles.infoText}>
          {t('your_account_has_been_blocked_due_to_some_reasons')}
         </Text>
         <Text style={styles.infoText}>
           {t('if_you_have_any_queries_please')}{' '}
           <Text style={styles.contactLink} onPress={handleContactUs}>{t('contact_us')}.</Text>
         </Text>
         <TouchableOpacity style={styles.unblockBtn} onPress={sendUnBlockRequest}>
          <Text style={styles.unblockBtnText}>{unBlockRequestSent ? t('unblock_request_sent') : t('send_unblock_request')}</Text>
         </TouchableOpacity>
       </View>
      ):(
       <>
        {/* Message Section */}
      <View style={styles.body}>
        <Text style={styles.infoText}>
          {t('we_are_working_hard_to_verify_taxi_and_approve_them_so_please_understand_that_approval_process_will_take_some_time_thanks_for_your_patience')}
        </Text>
        <Text style={styles.infoText}>
            {t('if_you_have_any_queries_regarding_registration_or_app_please')}{' '}
          <Text style={styles.contactLink} onPress={handleContactUs}>{t('contact_us')}.</Text>
        </Text>
        <TouchableOpacity
          style={[styles.checkStatusBtn, (isChecking || isFetching) && styles.checkStatusBtnDisabled]}
          onPress={onCheckStatusPress}
          disabled={isChecking || isFetching}
        >
          <Text style={styles.checkStatusText}>
            {(isChecking || isFetching) ? (t('refreshing') || 'Refreshing...') : (t('check_status') || 'Check Status')}
          </Text>
        </TouchableOpacity>
      </View>
      {/* Edit Documents Button */}
      {driverRole === 'dco' && (
      <View style={styles.footer}>
        <TouchableOpacity style={styles.editBtn} onPress={handleEditDocuments}>
            <DocWhiteIcon />
          <Text style={styles.editBtnText}>{t('edit_documents')}</Text>
        </TouchableOpacity>
      </View>
      )}
       </>
      )}
</ScrollView>
      <TouchableOpacity
        style={[
          settingsScreen.logoutButton,
          {
            bottom: 20,
            position: 'absolute',
            alignSelf: 'center',
            width: '80%',
          },
        ]}
        onPress={() => handleLogout()}>
        <Text style={settingsScreen.logoutButtonText}>{t('logout')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DriverApprovalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
  },
  header: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Colors.black,
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginBottom: 12,
    lineHeight: 32,
  },
  body: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: height * 0.1,
    borderTopWidth:0.3,
    width:'100%',
    paddingTop:height * 0.05,
  },
  infoText: {
    fontFamily: Fonts.light,
    fontSize: 14,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  contactLink: {
    color: Colors.yellow_orange,
    textDecorationLine: 'underline',
    fontFamily: Fonts.regular,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  editBtnText: {
    color: Colors.white,
    fontFamily: Fonts.medium,
    fontSize: 16,
    marginLeft: 8,
  },
  approvalImageBG:{
    position:'absolute',
    alignSelf:'flex-end'
  },
  seperator:{
    width:'40%',
    height:5,
    backgroundColor:Colors.periwinkle,
    top:10,
    borderRadius:100
  },
  profileContainer:{
    marginTop:20,
  },
  profileName:{
    fontFamily:Fonts.medium,
    fontSize:16,
    color:Colors.black, 
    marginTop:10
  },
  profilePhone:{
    fontFamily:Fonts.regular,
    fontSize:14,
    color:Colors.grey_xxdark
  },
  unblockBtn:{
    backgroundColor:Colors.periwinkle,
    padding:10,
    borderRadius:8,
    marginTop:10,
    alignItems:'center',
    justifyContent:'center'
  },
  unblockBtnText:{
    fontFamily:Fonts.regular,
    fontSize:16,
    color:Colors.white
  },
  checkStatusBtn:{
    backgroundColor: Colors.grey_light,
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  checkStatusBtnDisabled:{
    opacity: 0.6,
  },
  checkStatusText:{
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#1976D2',
  }
})