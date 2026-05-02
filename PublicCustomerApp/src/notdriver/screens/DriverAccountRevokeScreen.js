import { StyleSheet, Text, View, TouchableOpacity, Platform, ScrollView } from 'react-native'
import React, { useContext, useState } from 'react'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import useUserStore from '../../common/store/useUserStore'
import GlobalContext from '../../context/GlobalContext'
import { useStackScreenStore } from '../../common/store/useStackScreenStore'
import useCurrentScreenStore from '../../common/store/useCurrentScreenStore'
import useDeviceAPIStore from '../../common/store/useDeviceAPIStore'
import usePublicDriverStore from '../store/usePublicDriverStore'
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore'
import BGLocationTask from '../../common/controllers/BGLocationTask'
import { DataStore } from '../../common/controllers/DataStore'
import { showNotification } from '../../common/components/Alerts/showNotification'
import FullScreenLoader from '../../common/loaders/FullScreenLoader'
import APIRequest from '../../common/APIRequest'
import { Colors, Fonts } from '../../common/constants/constants'
import { settingsScreen } from '../styles/SettingsStyles'
import StatusModal from '../components/StatusModal'
import { height } from '../../common/utils/scalingutils'
import ApprovalIcon from '../../notdriver/assets/icons/Approval_BG.svg';

const DriverAccountRevokeScreen = () => {
  const { logout } = useContext(GlobalContext)
  const {userInfo} = useUserStore()
  const {setCurrentScreen} = useCurrentScreenStore()
  const { userDeviceId } = useDeviceAPIStore()
  const { driverInfo, vehicleInfo } = usePublicDriverStore()
  const { setMapMarkers } = useMapMarkerStore()
  // const resetAllStore = useResetStore()
  const [loading, setLoading] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [revokeRequestSent, setRevokeRequestSent] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  const { t } = {}

  const name = driverInfo?.name || 'Driver'
  const vehicleName = vehicleInfo?.type || 'Your Vehicle'
  const vehicleNumber = vehicleInfo?.regNo || 'XX-XX-XXXX'


  const handleRevokeAccount = async () => {
    setIsRevoking(true)
    const api = new APIRequest()
    const url = `/publicrides/driver/v2/revokeAccountDeletion`
    
    try {
      const response = await api.request(
        url,
        'POST',
        {},
        userInfo?.token,
      )

      if (response?.success) {
        setShowRevokeModal(false)
        setRevokeRequestSent(true)
        setCurrentScreen('Map')
        showNotification(
          response?.message || 'Revoke request sent successfully',
          'Waiting for approval...',
          'success',
        )
      } else {
        showNotification(
          response?.message || 'Failed to send revoke request',
          t.pls_try_later,
          'danger',
        )
      }
    } catch (error) {
      console.log('Error revoking account:', error)
      showNotification(
        error?.message || 'Network request failed',
        t.pls_try_later,
        'danger',
      )
    } finally {
      setIsRevoking(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    const url = `/publicrides/driver/v2/publicridesdriverLogout?platform=${Platform.OS}`
    const api = new APIRequest()

    try {
      const response = await api.request(
        url,
        'POST',
        { fcmToken: { deviceImei: userDeviceId, token: userInfo?.token } },
        userInfo?.token,
      )

      if (!response.success)
        throw new Error(response.message || 'Network request failed')

      setMapMarkers(null)

      setTimeout(() => {
        // resetAllStore()
        logout('driver')
        setLoading(false)
        BGLocationTask.stopDriverBgTask()
        setLoading(false)
      }, 1000)

      // DataStore.clearSession()
    } catch (error) {
      console.log(error, 'Error logging out')
      showNotification(
        error?.message || 'Network request failed',
        t.pls_try_later,
        'danger',
      )
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={{paddingBottom:100}} style={styles.container}>
      {(loading || isRevoking) && <FullScreenLoader />}
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.approvalImageBG}>
          <ApprovalIcon />
        </View>
        
        <Text style={styles.title}>Account & Vehicle{'\n'}Deleted</Text>
        
        <View style={styles.separator} />
        
        <View style={styles.profileContainer}>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profilePhone}>{vehicleName} - {vehicleNumber}</Text>
        </View>
      </View>

      {/* Body Section */}
      <View style={styles.body}>
        <View style={styles.messageContainer}>
          <MaterialCommunityIcons 
            name="alert-circle" 
            size={24} 
            color={Colors.danger_red} 
            style={styles.icon}
          />
          <Text style={styles.infoText}>
            Your account and vehicle have been marked as deleted.
          </Text>
        </View>

        <Text style={styles.subInfoText}>
          Your account and associated vehicle information have been marked as deleted in our system. 
          If you believe this was done in error, you can request to revoke the deletion.
        </Text>

        {revokeRequestSent && (
          <View style={styles.waitingContainer}>
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={24} 
              color={Colors.periwinkle} 
            />
            <Text style={styles.waitingText}>
              Your revoke request has been sent. Please wait for approval...
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.revokeButton,
              revokeRequestSent && styles.buttonDisabled
            ]}
            onPress={() => setShowRevokeModal(true)}
            disabled={revokeRequestSent || loading}
          >
            <MaterialCommunityIcons 
              name="undo" 
              size={20} 
              color={Colors.white} 
              style={styles.buttonIcon}
            />
            <Text style={styles.revokeButtonText}>
              {revokeRequestSent ? 'Revoke Request Sent' : 'Would you like to revoke'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              settingsScreen.logoutButton,
              styles.logoutButton,
            //   revokeRequestSent && styles.buttonDisabled
            ]}
            onPress={handleLogout}
            disabled={loading}
          >
            <Text style={settingsScreen.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Revoke Confirmation Modal */}
      <StatusModal
        isVisible={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        successMessage="Request Account Revoke"
        leftBtnTxt="Cancel"
        rightBtnText={isRevoking ? 'Sending...' : 'Confirm'}
        onRightPress={handleRevokeAccount}
        animationType="fade"
        additionalContainerStyles={styles.modalContainer}
      >
        <Text style={styles.modalMessage}>
          Are you sure you want to request revoking the account deletion?{'\n\n'}
          Your request will be reviewed and you'll be notified once approved.
        </Text>
      </StatusModal>
    </ScrollView>
  )
}

export default DriverAccountRevokeScreen

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
  approvalImageBG: {
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
  profileContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  profileName: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: Colors.black,
    marginBottom: 4,
  },
  profilePhone: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.grey_xxdark,
  },
  body: {
    marginTop: height * 0.05,
    paddingTop: height * 0.02,
    borderTopWidth: 0.3,
    borderTopColor: Colors.grey,
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.pink_light,
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: Colors.danger_red,
    flex: 1,
    lineHeight: 24,
  },
  subInfoText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.black,
    lineHeight: 22,
    marginBottom: 24,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue_xxlight,
    padding: 16,
    borderRadius: 10,
    marginBottom: 24,
  },
  waitingText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.periwinkle,
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 24,
    gap: 16,
  },
  revokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.periwinkle,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  revokeButtonText: {
    color: Colors.white,
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
  },
  modalContainer: {
    width: '85%',
  },
  modalMessage: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.black,
    textAlign: 'center',
    lineHeight: 22,
  },
})