import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Platform } from 'react-native';
import usePublicDriverStore from '../store/usePublicDriverStore';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import useUserStore from '../../common/store/useUserStore';
import useDeviceAPIStore from '../../common/store/useDeviceAPIStore';
import GlobalContext from '../../context/GlobalContext';
import APIRequest from '../../common/APIRequest';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import { DataStore } from '../../common/controllers/DataStore';
import { showNotification } from '../../common/components/Alerts/showNotification';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import { settingsScreen } from '../styles/SettingsStyles';
import { Colors, contactPhone, Fonts } from '../../common/constants/constants';
import { height } from '../../common/utils/scalingutils';
import VehicleIcon from '../../notdriver/assets/icons/vehicle.svg'
import DocWhiteIcon from '../../notdriver/assets/icons/doc_white.svg'
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import publicrideDriverApi from '../api/publicrideDriverApi';

const DriverVehicleApprovalScreen = ({ vehicleStatus = 'pending' }) => {
  // vehicleStatus can be: 'pending', 'approved', 'blocked', 'deleted'
  const { setIsApproved} = usePublicDriverStore();

  const { vehicleInfo , setVehicleInfo} = usePublicDriverStore();
  const {setStackScreen} = useStackScreenStore();
  const {t} = useTranslation()
  const {setMapMarkers} = useMapMarkerStore();
  // const resetAllStore = useResetStore();
  const {logout} = useContext(GlobalContext);
  const {userInfo} = useUserStore()
  const {userDeviceId} = useDeviceAPIStore();
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const vehicleName = vehicleInfo?.type || 'Your Vehicle';
  const vehicleNumber = vehicleInfo?.regNo || 'XX-XX-XXXX';
  const vehicleApproved = vehicleInfo?.isApproved
  const vehicleBlocked = vehicleInfo?.isBlocked
  const vehicleDeleted = vehicleInfo?.isDeleted

    const { data, isLoading, error, refetch, isFetching } = useQuery(
      ['driverDetails'], 
      () => publicrideDriverApi.getDriverDetails(userInfo?.token),
      {
        enabled: true,
        onSuccess: (response) => {
          if(response?.success){
          setVehicleInfo(response?.driver || {});
          // setIsApproved(response?.driver?.isApproved || false);
        }
        },
        onError: (error) => {setStackScreen('DriverApprovalScreen')},
      }
    );

  const handleContactUs = () => {
    Linking.openURL(`tel:${contactPhone}`);
  };

  const handleEditDocuments = () => {
    setStackScreen('DocumentCenter');
  };

  const handleLogout = async () => {
    setLoading(true);
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
      console.log(error, 'Error logging out');
      showNotification(
        error?.message || 'Network request failed',
        t.pls_try_later,
        'danger',
      );
    }
  };


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

  return (
    <View style={styles.container}>
      {loading && <FullScreenLoader />}
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.vehicleImageBG}>
          <VehicleIcon width={80} height={80} />
        </View>
        
        <Text style={styles.title}>{t('vehicle_approval')}</Text>
        
        <View style={styles.separator} />
        
        {/* Vehicle Info */}
        <View style={styles.vehicleContainer}>
          <Text style={styles.vehicleName}>{vehicleName}</Text>
          <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
        </View>
      </View>

      {/* Body Section */}
      <View style={styles.body}>
        <View style={styles.body}>
        <Text style={styles.infoText}>
            {t('vehicle_approval_desc')}
        </Text>
        <Text style={styles.infoText}>
          {t('vehicle_approval_desc_info')}
          <Text style={styles.contactLink} onPress={handleContactUs}>{t('contact_us')}</Text>
        </Text>
      </View>

        {vehicleBlocked && (
          <Text style={[styles.infoText, styles.blockedText]}>
            {t('vehicle_approval_desc_info')}
          </Text>
        )}
        {vehicleDeleted && (
          <Text style={[styles.infoText, styles.blockedText]}>
            {t('vehicle_deleted')}
          </Text>
        )}
        {!vehicleApproved && (
          <Text style={[styles.infoText, styles.blockedText]}>
            {t('vehicle_approval_info')}
          </Text>
        )}
      </View>

       <TouchableOpacity
                style={[styles.checkStatusBtn, (isChecking || isFetching) && styles.checkStatusBtnDisabled]}
                onPress={onCheckStatusPress}
                disabled={isChecking || isFetching}
              >
                <Text style={styles.checkStatusText}>
                  {(isChecking || isFetching) ? (t('refreshing') || 'Refreshing...') : (t('check_status') || 'Check Status')}
                </Text>
              </TouchableOpacity>
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={handleEditDocuments}
        >
          <DocWhiteIcon />
          <Text style={styles.editBtnText}>{t('edit_documents')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
        style={[
          settingsScreen.logoutButton,
          {
            // bottom: height * 0.1,
            // position: 'absolute',
            alignSelf: 'center',
            width: '80%',
          },
        ]}
        onPress={() => handleLogout()}>
        <Text style={settingsScreen.logoutButtonText}>{t('logout')}</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

export default DriverVehicleApprovalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'flex-start',
  },
  vehicleImageBG: {
    position: 'absolute',
    alignSelf: 'flex-end',
    opacity: 0.1,
    top: 0,
    right: 0,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Colors.black,
    textAlign: 'left',
    marginBottom: 12,
    lineHeight: 36,
  },
  separator: {
    width: '40%',
    height: 5,
    backgroundColor: Colors.periwinkle,
    borderRadius: 100,
    marginBottom: 20,
  },
  vehicleContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  statusBadge: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'center',
  },
  vehicleName: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: Colors.black,
    marginBottom: 4,
  },
  vehicleNumber: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.grey_xxdark,
    letterSpacing: 1,
  },
  body: {
    marginTop: height * 0.05,
    paddingTop: height * 0.02,
    borderTopWidth: 0.3,
    borderTopColor: Colors.grey,
  },
  messageContainer: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginBottom: 24,
  },
  infoText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.black,
    lineHeight: 22,
    marginBottom: 8,
  },
  subInfoText: {
    fontFamily: Fonts.light,
    fontSize: 13,
    color: Colors.grey,
    lineHeight: 20,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 20,
  },
  contactLink: {
    color: Colors.yellow_orange,
    textDecorationLine: 'underline',
    fontFamily: Fonts.semi_bold,
  },
  tipsContainer: {
    backgroundColor: '#FFF7E5',
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  tipsTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 14,
    color: Colors.black,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.yellow_orange,
    marginRight: 8,
  },
  tipText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.black,
    flex: 1,
    lineHeight: 20,
  },
  blockedInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFE9E9',
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  blockedText: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    color: Colors.danger_red,
    marginTop: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
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
});