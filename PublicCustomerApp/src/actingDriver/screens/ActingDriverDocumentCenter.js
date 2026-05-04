import React, {useContext, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from 'react-i18next';

import {useStackScreenStore} from '../../common/store/useStackScreenStore';
import usePublicDriverStore from '../../notdriver/store/usePublicDriverStore';
import useUserStore from '../../common/store/useUserStore';
import useDeviceAPIStore from '../../common/store/useDeviceAPIStore';
import {useMapMarkerStore} from '../../common/store/useMapMarkerStore';
import {Colors, Fonts} from '../../common/constants/constants';
import {firebaselog_onBoarding} from '../../common/utils/FirebaseAnalytics';
import APIRequest from '../../common/APIRequest';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import GlobalContext from '../../context/GlobalContext';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';

const ActingDriverDocumentCenter = () => {
  const {t} = useTranslation();
  const {setStackScreen, goBack} = useStackScreenStore();
  const [showBankOptions, setShowBankOptions] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const {isApproved} = usePublicDriverStore();
  const {userInfo} = useUserStore();
  const {logout} = useContext(GlobalContext);
  const {userDeviceId} = useDeviceAPIStore();
  const {setMapMarkers} = useMapMarkerStore();

  const {
    driverDetailsCompleteStatus,
    bankDetailsCompleteStatus,
    documentsCompleteStatus,
    driverInfo,
  } = usePublicDriverStore();

  const drivingExperienceComplete = Boolean(driverInfo?.drivingExperience?.totalExperience);
  const vehicleHandlingComplete = Boolean(
    driverInfo?.vehicleHandling?.vehicleTypes?.length > 0 &&
    driverInfo?.vehicleHandling?.transmission,
  );

  const docCompleted =
    driverDetailsCompleteStatus &&
    bankDetailsCompleteStatus &&
    documentsCompleteStatus &&
    drivingExperienceComplete &&
    vehicleHandlingComplete;

  const sections = [
    {
      id: 'driverDetails',
      title: t('driver_details', {defaultValue: 'Driver Details'}),
      icon: 'person',
      screen: 'DriverEntry',
      complete: driverDetailsCompleteStatus,
    },
    {
      id: 'bankDetails',
      title: t('bank_details', {defaultValue: 'Bank Details'}),
      icon: 'account-balance',
      screen: 'DriverBankDetails',
      complete: bankDetailsCompleteStatus,
    },
    {
      id: 'proofDocuments',
      title: t('proof_documents', {defaultValue: 'Proof Documents'}),
      icon: 'fact-check',
      screen: 'DriverProofDoc',
      complete: documentsCompleteStatus,
    },
    {
      id: 'drivingExperience',
      title: t('driving_experience', {defaultValue: 'Driving Experience'}),
      icon: 'speed',
      screen: 'DrivingExperience',
      complete: drivingExperienceComplete,
    },
    {
      id: 'vehicleHandling',
      title: t('vehicle_handling', {defaultValue: 'Vehicle Handling'}),
      icon: 'directions-car',
      screen: 'VehicleHandling',
      complete: vehicleHandlingComplete,
    },
  ];

  const handleSectionPress = section => {
    if (section.id === 'bankDetails') {
      setShowBankOptions(true);
      return;
    }
    if (!section.screen) {
      return;
    }
    setStackScreen(section.screen);
  };

  const handleBankSelection = screen => {
    setShowBankOptions(false);
    if (!screen) {
      return;
    }
    setTimeout(() => setStackScreen(screen), 200);
  };

  const onDonePress = () => {
    if (isApproved) {
      goBack();
    } else {
      firebaselog_onBoarding('OB_Driver(OB_D)', 'OB_D:acting_driver_onboarding_completed');
      setStackScreen('DriverApprovalScreen');
    }
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
      setShowLogoutModal(false);
      setMapMarkers(null);
      setTimeout(() => {
        logout('driver');
        setLoading(false);
        BGLocationTask.stopDriverBgTask();
      }, 1000);
    } catch (error) {
      console.log('Logout error:', error);
      setLoading(false);
      setShowLogoutModal(false);
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(true);
  };

  const renderStatus = (complete, optional) => (
    <View
      style={[
        styles.statusBadge,
        complete ? styles.statusBadgeComplete : optional ? styles.statusBadgeOptional : styles.statusBadgePending,
      ]}>
      <Text
        style={[
          styles.statusText,
          complete ? styles.statusTextComplete : optional ? styles.statusTextOptional : styles.statusTextPending,
        ]}>
        {complete ? t('complete') : optional ? t('optional', {defaultValue: 'Optional'}) : t('pending')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerView}>
        <Text style={styles.title}>{t('document_center')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setStackScreen('DriverHelpSupport')}>
            <MaterialIcons name="support-agent" size={24} color={Colors.black} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={confirmLogout}>
            <MaterialIcons
              name="power-settings-new"
              size={24}
              color={Colors.red}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {t('document_center_subtitle')}
        </Text>
        <View style={styles.sectionsContainer}>
          {sections.map(section => (
            <TouchableOpacity
              key={section.id}
              activeOpacity={0.8}
              style={styles.sectionCard}
              onPress={() => handleSectionPress(section)}>
              <View style={styles.iconWrapper}>
                <MaterialIcons
                  name={section.icon}
                  size={24}
                  color={Colors.white}
                />
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <View style={styles.sectionMeta}>
                {renderStatus(section.complete, section.optional)}
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={Colors.warm_grey}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bank Options Modal */}
      <Modal
        transparent
        visible={showBankOptions}
        animationType="fade"
        onRequestClose={() => setShowBankOptions(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {t('document_center_bank_modal_title', {
                defaultValue: 'Verify payouts with',
              })}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.8}
              onPress={() => handleBankSelection('UPIVerification')}>
              <Text style={styles.modalButtonText}>
                {t('document_center_select_upi', {
                  defaultValue: 'Verify UPI ID',
                })}
              </Text>
            </TouchableOpacity>
            <Text style={styles.orText}>--- OR ---</Text>
            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.8}
              onPress={() => handleBankSelection('DriverBankDetails')}>
              <Text style={styles.modalButtonText}>
                {t('document_center_select_bank', {
                  defaultValue: 'Verify Bank Account',
                })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              activeOpacity={0.8}
              onPress={() => setShowBankOptions(false)}>
              <Text style={styles.modalCancelText}>
                {t('cancel', {defaultValue: 'Cancel'})}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        transparent
        visible={showLogoutModal}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <MaterialIcons
              name="logout"
              size={40}
              color={Colors.red}
              style={{alignSelf: 'center'}}
            />
            <Text style={styles.modalTitle}>
              {t('logout', {defaultValue: 'Logout'})}
            </Text>
            <Text style={styles.logoutMessage}>
              {t('logout_confirm_message', {
                defaultValue: 'Are you sure you want to logout?',
              })}
            </Text>
            <TouchableOpacity
              style={[styles.logoutConfirmButton, loading && {opacity: 0.7}]}
              activeOpacity={0.8}
              onPress={handleLogout}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.logoutConfirmButtonText}>
                  {t('logout', {defaultValue: 'Logout'})}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              activeOpacity={0.8}
              onPress={() => setShowLogoutModal(false)}>
              <Text style={styles.modalCancelText}>
                {t('cancel', {defaultValue: 'Cancel'})}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading && <FullScreenLoader />}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.doneButton, !docCompleted && styles.doneButtonDisabled]}
          onPress={() => onDonePress()}
          activeOpacity={0.8}
          disabled={!docCompleted}>
          <Text style={styles.doneButtonText}>
            {t('done', {defaultValue: 'Done'})}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ActingDriverDocumentCenter;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  subtitle: {
    marginTop: 24,
    marginBottom: 16,
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.grey_dark,
    zIndex: 9,
    opacity: 0.8,
  },
  sectionsContainer: {
    gap: 12,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.periwinkle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: Colors.black,
  },
  sectionMeta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    opacity: 1,
  },
  statusBadgeComplete: {
    backgroundColor: '#E3F4E6',
  },
  statusBadgePending: {
    backgroundColor: '#FCE6E6',
  },
  statusBadgeOptional: {
    backgroundColor: '#E8F0FE',
  },
  statusText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  statusTextComplete: {
    color: Colors.green,
  },
  statusTextPending: {
    color: Colors.red,
  },
  statusTextOptional: {
    color: Colors.periwinkle,
  },
  title: {
    fontFamily: Fonts.semi_bold,
    fontSize: 20,
    color: Colors.black,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.grey_light,
    padding: 16,
    backgroundColor: Colors.white,
  },
  doneButton: {
    backgroundColor: Colors.periwinkle,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonDisabled: {
    opacity: 0.6,
  },
  doneButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.white,
  },
  headerView: {
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  modalTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: Colors.black,
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.periwinkle,
    alignItems: 'center',
  },
  modalButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.white,
  },
  modalCancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.warm_grey,
  },
  orText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.dark_grey,
    textAlign: 'center',
  },
  logoutMessage: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.dark_grey,
    textAlign: 'center',
  },
  logoutConfirmButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.red,
    alignItems: 'center',
  },
  logoutConfirmButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.white,
  },
});
