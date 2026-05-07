/* eslint-disable no-unused-vars */
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState, useCallback, useMemo, useContext } from 'react';
import {useQuery} from 'react-query';

import HomeTab from '../../notdriver/assets/icons/homeTab.svg';
import HomeHl from '../../notdriver/assets/icons/homeHl.svg';
import SettingsTab from '../../notdriver/assets/icons/settingsTab.svg';
import SettingTabHi from '../../notdriver/assets/icons/settingTabHi.svg';

import TripNotSelected from '../../notdriver/assets/icons/tripNotSelected.svg';
import TripSelected from '../../notdriver/assets/icons/tripSelected.svg';
import usePublicDriverStore from '../../notdriver/store/usePublicDriverStore';
import { useTripAcceptStore } from '../../notdriver/store/useTripAcceptStore';
import useDriverStatusStore from '../../notdriver/store/useDriverStatusStore';
import useCurrentScreenStore from '../../common/store/useCurrentScreenStore';
import useUserStore from '../../common/store/useUserStore';
import useDeviceTokenStore from '../../common/store/useDeviceTokenStore';
import GlobalContext from '../../context/GlobalContext';
import { useTranslation } from 'react-i18next';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import APIRequest from '../../common/APIRequest';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import publicrideDriverApi from '../../notdriver/api/publicrideDriverApi';
import tripAlert from '../../common/controllers/TripAlert';
import { DataStore } from '../../common/controllers/DataStore';
import Marker from '../../common/map/Marker';
import { checkFineLocationPermissions, RequestFineLocationPermission, RequestNotificationPermission } from '../../common/controllers/PermissionHandler';
import { showNotification } from '../../common/components/NotificationManger';
import MapContainer from '../../common/map/MapContainer';
import { Colors, colors, Fonts } from '../../common/constants/constants';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import PaymentCompletionScreen from '../../notdriver/screens/PaymentCompletionScreen';
import AppUpdateChecker from '../../common/components/AppUpdateChecker';
import DriverLocationHandler from '../../notdriver/components/DriverLocationHandler';
import ActingDriverTabBar from '../../notdriver/bottomNavigation/DriverTabBar';
import { getMessaging } from '@react-native-firebase/messaging';
import NetInfo from '@react-native-community/netinfo';
import rideMatchWSService from '../../common/controllers/socketServices/RideMatchSocketService';
import locationTask from '../../common/controllers/GetCurrentLocation';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import ActingDriverMapScreen from './ActingDriverMapScreen';
import ActingDriverDocumentCenter from './ActingDriverDocumentCenter';
import DriverEntry from '../../notdriver/screens/DriverDocumentCenter/DriverEntry';
import BankDetails from '../../notdriver/screens/DriverDocumentCenter/BankDetails';
import UPIVerification from '../../notdriver/screens/DriverDocumentCenter/UPIVerification';
import DriverProofDoc from '../../notdriver/screens/DriverDocumentCenter/DriverProofDoc';
import ActingDriverSettingsScreen from './ActingDriverSettingsScreen';
import TripHistory from '../../notdriver/screens/TripHistory/TripHistory';
import TicketSupportScreen from '../../common/screens/RiseSupportTicket/TicketSupportScreen';
import TicketDetailScreen from '../../common/screens/RiseSupportTicket/TicketDetailScreen';
import DriverBasicDetails from '../../notdriver/screens/DriverDetails/DriverBasicDetails';
import DriverPersonalInfo from '../../notdriver/screens/DriverDetails/DriverPersonalInfo';
import DriverProofDocuments from '../../notdriver/screens/DriverDetails/DriverProofDocuments';
import BankAccountDetails from '../../notdriver/screens/DriverDetails/BankAccountDetails';
import DriverEditInfo from '../../notdriver/screens/DriverDetails/DriverEditInfo';
import DeleteAccount from '../../notdriver/screens/DeleteAccount';
import DriverHelpSupport from '../../notdriver/screens/DriverHelpSupport';
import DriverApprovalScreen from '../../notdriver/screens/DriverApprovalScreen';
import DriverAccountRevokeScreen from '../../notdriver/screens/DriverAccountRevokeScreen';
import DrivingExperienceScreen from './DrivingExperienceScreen';
import VehicleHandlingScreen from './VehicleHandlingScreen';
import LanguageScreen from '../../notdriver/screens/LanguageSelectionScreen';
import AddDriverLocation from '../../notdriver/screens/AddDriverLocation';
import ActingDriverEditDocCenter from './ActingDriverEditDocCenter';
import VehicleEntry from '../../notdriver/screens/DriverDocumentCenter/VehicleEntry';
import PublicDriverTrackingScreen from '../../notdriver/screens/PublicDriverTrackingScreen';
import DriverPermissionScreen from '../../notdriver/screens/DriverPermissionScreen';
import {isDevDriverBypassUser} from '../../common/utils/devDriverBypass';

const checkDriverDetails = (response) => {
  if (!response?.driver) return false;
  const driverDetailKeys = ['name', 'phone', 'gender', 'dob'];
  const document = response.driver?.documents;
  const bankDetails = response?.driver?.bankDetails?.UPIID;

  const proofDoc = ['aadhar','panCard']
  const hasProofDocuments = proofDoc.some(doc => document && document[doc]);
  
  const {setDriverDetailsCompleteStatus, setBankDetailsCompleteStatus, setDocumentsCompleteStatus} = usePublicDriverStore.getState();

  if (driverDetailKeys.every(key => key in response.driver)) {
    setDriverDetailsCompleteStatus(true)
  } 
  if (bankDetails) {
    setBankDetailsCompleteStatus(true)
  }
  if (hasProofDocuments) {
    setDocumentsCompleteStatus(true)
  }
  if (isDevDriverBypassUser(response.driver)) {
    setDriverDetailsCompleteStatus(true)
    setBankDetailsCompleteStatus(true)
    setDocumentsCompleteStatus(true)
    return true;
  }
  return (
    driverDetailKeys.every(key => key in response.driver) && 
    bankDetails &&
    hasProofDocuments
  );
};

const ActingDriverHomeScreen = () => {
  const {setDriverInfo, 
    setVehicleInfo, storeDocuments,
    setBankInfo, setVendorId, setDriverRole, 
    setDriverDue, setDriverEarnings, 
    setDriverTotalTrips, setIsBlocked,
    setIsApproved, setUnBlockRequestSent, 
    setdriverDueDate,setDriverRatings, 
    setRazorpayLinkedAccountDetails,setMinDueAmount, setDueDuration, setIsParivahanFailed, setRazorpayUpdated,
    setLocationCompleteStatus} = usePublicDriverStore();
  const { stackScreen, setStackScreen } = useStackScreenStore()
  const {setTimeoutSeconds, setLoading: setTripAcceptLoading} = useTripAcceptStore();
  const {setDriverStatus, setUpComingTrips} = useDriverStatusStore();
  const {setCurrentScreen, currentScreen} = useCurrentScreenStore()
  const {userInfo, setIsDev } = useUserStore();
  const {
    hasNotificationPermission,
    setHasNotificationPermission,
    hasLocationPermission,
    setHasLocationPermission,
  } = useDeviceTokenStore();
  const {logout} = useContext(GlobalContext);
  const {t} = useTranslation();
  const [role, setRole] = useState('dco');
  const [setIsBlockLoading] = useState(false)
  const { setGeometries, geometries} = useMapMarkerStore()
  const [approved, setApproved] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [isBankVerified, setIsBankVerified] = useState(false)
  const {setMapLocation, setUserLocation, setMapMarkers, mapMarkers, userLocation} = useMapMarkerStore();
  const [loading, setLoading] = useState(false)
  const [wsConnected, setWsConnected] = useState(Boolean(rideMatchWSService?.socket?.connected));
  const [wsConnecting, setWsConnecting] = useState(false);

   const getFcmToken = async () => {
    try {
      const fcmToken = await getMessaging().getToken();
      return fcmToken;
    } catch (error) {
      console.log('Error getting FCM token: ', error);
    }
  };

  const updateFcmToken = async (fcmData) => {
      if (fcmData?.isUpdated) return
      setLoading(true)
      try {
        const fcmToken = await getFcmToken();
        const api = new APIRequest();
        const fcmPayload = {
          fcmToken: fcmToken || '',
        }
        const response = await api.request(`/publicrides/driver/v2/updateFcmToken`, 'POST', fcmPayload, userInfo?.token)
        if (response?.success) {
          console.log('hari-->>fcm token updated successfully', response);
        } else {
          console.log('hari-->>fcm token update failed', response);
        }
         setLoading(false)
      } catch (error) {
        console.log('hari-->>error updating fcm token-->>', error);
          setLoading(false)
      }
  }

  const storePublicDriverInfo = (response) => {
    setDriverInfo({
      name: response.driver?.name || '',
      phone: response.driver?.phone || '',
      licenseNo: response.driver?.licenseNo || '',
      gender: response.driver?.gender || '',
      homeLocation: response.driver?.homeLocation || null,
      alternatePhone : response.driver?.alternatePhone || '',
      driverPhoto : response.driver?.documents?.driverPhoto || null,
      licenseDocument: response.driver?.documents?.drivingLicense || null,
      dob: response.driver?.dob || '',
      drivingExperience: response.driver?.experience
        ? {
            totalExperience: response.driver.experience.totalExperience || '',
            commercialExperience: response.driver.experience.commercialExperience || '',
            hasPlatformExperience: response.driver.experience.hasPlatformExperience ?? null,
            platforms: response.driver.experience.platforms || [],
            approxTrips: response.driver.experience.approxTrips || '',
            driverRating: response.driver.experience.driverRating || '',
          }
        : null,
      vehicleHandling: response.driver?.experience
        ? {
            vehicleTypes: response.driver.experience.vehicleTypes || [],
            transmission: response.driver.experience.transmission || '',
            fuelTypes: response.driver.experience.fuelTypes || [],
            nightDriving: response.driver.experience.nightDriving ?? false,
            longDistance: response.driver.experience.longDistance ?? false,
          }
        : null,
    });
    if (response.driver?.homeLocation) {
      setLocationCompleteStatus(true);
    }
  }
  const storePublicDriverVehicleInfo = (response) => {
     if(response?.success && !response.driver?.ownVehicleInfo){
      return;
     }
     const vehicleInfo = response.driver?.ownVehicleInfo;
     vehicleInfo.vehicleRcDoc = vehicleInfo?.documents?.vehicleRcDoc|| null;
     vehicleInfo.insurance = vehicleInfo?.documents?.insurance|| null;
     vehicleInfo.permitDoc = vehicleInfo?.documents?.permitDoc|| null;
     const parivahan_status = vehicleInfo?.isParivahanFailed;
     setVehicleInfo(vehicleInfo);
      if (parivahan_status) {
        setIsParivahanFailed(true)
      }
  }
  const storeDocumentsInfo = (response) => {
    const documents = response.driver?.documents;
    const vehicleDocuments = response.driver?.ownVehicleInfo?.documents;
    const documentsList = {...documents, ...vehicleDocuments}
    storeDocuments(documentsList);
    const bankInfo = response.driver?.bankDetails;
    const passbookImage = documents?.passbookImage;
    setBankInfo({...bankInfo, passbookImage: passbookImage});
  }

  const storeBankInfo = (response) => {
    const bankInfo = response.driver?.bankDetails;
    const _razorpayLinkedAccountDetails = response.driver?.razorpayLinkedAccountDetails;
    const _address = bankInfo?.address;
    let address;
    try {
        address = typeof _address === 'string' ? JSON.parse(_address) : _address;
    } catch (error) {
        address = _address;
    }
    if (_razorpayLinkedAccountDetails) {
      setRazorpayUpdated(true)
    } else {
      setRazorpayUpdated(false)
    }
    setBankInfo({...bankInfo, address: address, razorpayLinkedAccountDetails: _razorpayLinkedAccountDetails});
  }

  const updateDueDuration = (driver) => {
      const createdAt = driver?.createdOn
      const lastTransactionDate = driver?.lastPaymentInitTime
      const nextDueDate = driver?.nextDueDate
      const startTime = lastTransactionDate ? lastTransactionDate : createdAt
      const endTime = nextDueDate ? nextDueDate : null
      setDueDuration({startTime:startTime, endTime: endTime})
  }
  
  const blockDriver = async () => {
    setIsBlockLoading(true)
    try {
      const api = new APIRequest();
     const response = await api.request(`/publicrides/driver/v2/blockDriver`, 'POST', {driverId: userInfo?._id}, userInfo?.token)
     if (response?.success) {
      setIsBlocked(true)
      // setStackScreen('DriverApprovalScreen')
      BGLocationTask.stopDriverBgTask();
     }
    } catch (error) {
      console.log('hari-->>error-->>', error)
    } finally {
    
        setIsBlockLoading(false)
      }
  }

  const updateNextDueDate = async () => { 
    setIsBlockLoading(true)
    try {
      const api = new APIRequest();
     const response = await api.request(`/publicrides/driver/v2/updateNextDueDate`, 'POST', {}, userInfo?.token)
     if (response?.success) {
       setdriverDueDate(response?.nextDueDate)
     }
    } catch (error) {
      console.log('hari-->>error-->>', error)
    } finally {
      setIsBlockLoading(false)
    }
  }

  const getLastTransactionDetails = async (paymentId, token) => {
    try {
      const api = new APIRequest();
      const payload = { 
        lastPaymentID: paymentId 
      };
      const response = await api.request(`/publicrides/payments/driver/duePayStatusCheck`, 'POST', payload, token);
      if (response?.success) {
          setDriverDue(0);
          if (response.nextDueDate) {
            setdriverDueDate(response.nextDueDate);
          }
      }
    } catch (error) {
      console.log('hari-->>error-->>', error)
    }
  }

  const [isOnline, setIsOnline] = useState(null);

   useEffect(() => {
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected);
    });
  }, []);

  // Subscribe to network connectivity changes
  useEffect(() => {
    const handleConnectivityChange = state => {
      setIsOnline(state.isConnected);
      refetch();
    };

    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
     const screen = stackScreen[stackScreen.length - 1];
     if (currentScreen !== 'Map') return;
     if (screen === 'Home') 
     refetch();
  },[currentScreen, stackScreen])

  const { data, isLoading, error, refetch, isFetching } = useQuery(
    ['driverDetails'], 
    () => publicrideDriverApi.getDriverDetails(userInfo?.token),
    {
      refetchOnReconnect: true,
      onSuccess: (response) => {
        if(response?.success){
        storePublicDriverInfo(response);
        storePublicDriverVehicleInfo(response);
        storeDocumentsInfo(response);
        storeBankInfo(response);
        setVendorId(response?.driver?.vendorId)
        setDriverRole(response?.driver?.role)
        setRole(response?.driver?.role)
        setDriverDue(response?.driver?.driverDue || 0)
        setDriverEarnings(response?.driver?.driverEarnings || 0)
        setDriverTotalTrips(response?.driver?.totalTripsAccepted || 0)
        setUnBlockRequestSent(response?.driver?.unBlockRequestSent)
        setDriverStatus(response?.driver?.driverStatus?.status ? response?.driver?.driverStatus?.status : 'offline')
        setdriverDueDate(response?.driver?.nextDueDate)
        setDriverRatings(response?.driver?.ratingData || null)
        setRazorpayLinkedAccountDetails(response?.driver?.razorpayLinkedAccountDetails || null)
        updateDueDuration(response?.driver)
        updateFcmToken(response?.driver?.fcmToken)
        setIsDev(response?.driver?.dev);
        const lastPaymentID = response?.driver?.lastPaymentID || null;
        const upComingTrips = response?.driver?.upComingTrips || [];

        if (lastPaymentID && lastPaymentID !== null) {
          getLastTransactionDetails(lastPaymentID, userInfo?.token);
        }
        const minDueAmount = response?.driver?.minDueAmount || 1
        setMinDueAmount(minDueAmount)
        if (response?.driver?.nextDueDate) {
          const currentTimeMs = new Date().getTime();
          if (response?.driver?.nextDueDate < currentTimeMs) {
             if (response?.driver?.driverDue >= minDueAmount) {
               blockDriver();
             } else {
               updateNextDueDate();
             }
          }
        }

    
        const acceptedTrips = response?.driver?.totalTripsAccepted

        const isApproved = response?.driver?.isApproved
        const isBlocked = response?.driver?.isBlocked
        const timeoutSeconds = response?.driver?.tripAcceptDuration
        const isBankVerified = response?.driver?.isBankVerified
        const shouldBypassVerifyDoc =
          isDevDriverBypassUser(response?.driver) || isDevDriverBypassUser(userInfo)

        setTimeoutSeconds(timeoutSeconds)
        setApproved(shouldBypassVerifyDoc ? true : isApproved)
        setBlocked(shouldBypassVerifyDoc ? false : isBlocked)
        if (response?.driver?.isDeleted) {
          setStackScreen('AccountRevokeScreen');
          BGLocationTask.stopDriverBgTask();
          return
        }

        // Always evaluate completion statuses so the edit doc screen reflects current state
        const allDetailsDone = checkDriverDetails(response);
        if(!shouldBypassVerifyDoc && response?.driver?.role === 'dco' && !allDetailsDone){
          if (!isApproved) {
          setStackScreen('DocumentCenter');
          BGLocationTask.stopDriverBgTask();
          return
          }
        }

        
        if (!shouldBypassVerifyDoc && !isApproved) {
          if (acceptedTrips === 0) {
            setStackScreen('DriverApprovalScreen');
            BGLocationTask.stopDriverBgTask();
            return
          } else {
            setIsApproved(false)
            BGLocationTask.stopDriverBgTask();
            return
          }
        }

        if (!shouldBypassVerifyDoc && !isBankVerified) {
          setIsBankVerified(false)
          return
        } else {
          setIsBankVerified(true)
        }

        if (!shouldBypassVerifyDoc && isBlocked) {
          // setIsBlocked(true)
          BGLocationTask.stopDriverBgTask();
          return
        }

        if (upComingTrips && upComingTrips.length > 0) {
           setUpComingTrips(upComingTrips);
          return
        }
      }
      else {
        if (response.error === "SESSION_EXPIRED") {
          logout('driver');
           BGLocationTask.stopDriverBgTask();
          tripAlert.stopAlertSound()
          return
        }
      }
      },
      onError: (error) => {setStackScreen('Home')},
    }
  );

  // Reset loading state when navigating away from TripAccept screen
  useEffect(() => {
    const currentScreen = stackScreen[stackScreen.length - 1];
    if (currentScreen !== 'TripAccept') {
      setTripAcceptLoading(false);
    }
  }, [stackScreen, setTripAcceptLoading]);

  useEffect(()=>{
      const getActiveTripId = async () => {
       const tripId = await DataStore.loadData('activeTripId') 
       if (tripId.data) {
        setStackScreen('PublicDriverTrackingScreen')
        } else {
          setStackScreen('Home')
          setCurrentScreen('Map')
        }
      }
      getActiveTripId()
   },[])

   const setUserMarker  = (latitude, longitude) => {
    setUserLocation([latitude, longitude])
        setMapLocation({
          lat: latitude,
          lng: longitude,
          zoom: 16,
        });
          const userMarker = new Marker(
          'locations1',
          'userMarker',
          longitude,
          latitude,
          'pin_inactive',
          36,
          false,
        );
        const newMarkers = [userMarker]
        const hasMarker = mapMarkers?.find(marker => marker?.id !== 'locations1')
        if (!hasMarker) {
          setMapMarkers(newMarkers)
        }
        setLoading(false)
  }

  const refreshStatus = useCallback((val) => {
    if (isFetching) {
      console.log('[refreshStatus] fetch already in progress');
      return;
    }
    refetch();
  }, [refetch, isFetching]);

  useEffect(()=>{
    if (geometries){
      setGeometries(null);
    }
    if (hasLocationPermission && !userLocation) {
      getUserLocation();
    }
    if(!hasLocationPermission)return
    getCurrentLocation();
  },[])

  // Track socket connection status and listen for connect/disconnect
  useEffect(() => {
    const sock = rideMatchWSService?.socket;
    setWsConnected(Boolean(sock?.connected));
    if (!sock) return;
    const onConnect = () => setWsConnected(true);
    const onDisconnect = () => setWsConnected(false);
    const onError = () => setWsConnected(false);
    rideMatchWSService.on('connect', onConnect);
    rideMatchWSService.on('disconnect', onDisconnect);
    rideMatchWSService.on('connect_error', onError);
    return () => {
      rideMatchWSService.off('connect', onConnect);
      rideMatchWSService.off('disconnect', onDisconnect);
      rideMatchWSService.off('connect_error', onError);
    };
  }, [rideMatchWSService?.socket]);

  const getUserLocation = async () =>{
    await locationTask.getCurrentLocation().then((position) => {
        setUserMarker(position.coords.latitude, position.coords.longitude)
    })
  }

  const getCurrentLocation = async () => {
    const isLocationPermitted = await checkFineLocationPermissions(t);
    if (!isLocationPermitted) {
      const hasLocationpermission = await RequestFineLocationPermission(t);
      if (!hasLocationpermission) {
        showNotification(
          t('loc_permission_denied'),
          t('grant_loc_permission'),
          'danger',
          3000,
        );
        return;
      }
    }

    getUserLocation();
  };

   const renderNotificationPermission = () => {
    return (
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.text}>
            {t('please_enable_notification_permission_to_get_real_time_updates')}
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              RequestNotificationPermission(t).then((res) => {
                if(res){
                  setHasNotificationPermission(true)
                }
              })
            }}>
            <Text style={styles.buttonText}>
            {t('enable_now')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
   }

   const renderLocationPermission = () => {
    return (
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.text}>
            {t('please_enable_location_permission_to_get_real_time_updates')}
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              RequestFineLocationPermission(t).then((res) => {
                if(res){
                  setHasLocationPermission(true)
                  getCurrentLocation();
                }
              })
            }}>
            <Text style={styles.buttonText}>
              {t('enable_now')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
   }

  const renderContent = () => {
    switch (stackScreen[stackScreen.length - 1]) {
      case 'Home':
        return (
          <ActingDriverTabBar
            menus={[
              { id: 1, name: 'Map', icon: <HomeTab />, iconHighlight: <HomeHl />, title: 'home', component: 
              <ActingDriverMapScreen isLoading={isLoading} isPublicRidesDriver={true} approved={approved} blocked={blocked} isBankVerified={isBankVerified} refreshStatus={refreshStatus} /> },
              { id: 9, name: 'Trips', icon: <TripNotSelected/>, iconHighlight: <TripSelected />, title: 'trips', component: <TripHistory />},
            //   { id: 2, name: 'Earnings', icon: <Tracking />, iconHighlight: <TrackingHl />, title: 'earnings', component: <DriverEarnings />},
              { id: 5, name: 'Settings', icon: <SettingsTab />, iconHighlight: <SettingTabHi />, title: 'settings', component: <ActingDriverSettingsScreen /> },
            ]}
          />
        );
      case 'DocumentCenter':
        return <ActingDriverDocumentCenter />;
      case 'DriverEntry':
        return <DriverEntry />;
      case 'DriverBankDetails':
        return <BankDetails />;
      case 'UPIVerification':
        return <UPIVerification />;
      case 'DriverProofDoc':
        return <DriverProofDoc />;
      case 'DriverAccountDetails':
        return <DriverBasicDetails />;
      case 'DriverPersonalInfo':
        return <DriverPersonalInfo />;
      case 'DriverProofDocuments':
        return <DriverProofDocuments />;
      case 'BankAccountDetails':
        return <BankAccountDetails />;
      case 'DriverEditInfo':
        return <DriverEditInfo />;
      case 'DeleteAccount':
        return <DeleteAccount />;
      case 'TicketSupportScreen':
        return <TicketSupportScreen />;
      case 'TicketDetailScreen':
        return <TicketDetailScreen />;
      case 'DriverHelpSupport':
        return <DriverHelpSupport />;
      case 'DriverApprovalScreen':
        return <DriverApprovalScreen />;
      case 'AccountRevokeScreen':
        return <DriverAccountRevokeScreen />;
      case 'DrivingExperience':
        return <DrivingExperienceScreen />;
      case 'VehicleHandling':
        return <VehicleHandlingScreen />;
      case 'AddDriverLocation':
        return <AddDriverLocation isPassanger={false} updatePassangerLocation={null} isActingDriver={true} />;
      case 'AddDriverLocationNormal':
        return <AddDriverLocation isPassanger={false} updatePassangerLocation={null} isActingDriver={false} />;
      case 'DriverVehicleEntry':
        return <VehicleEntry />;
      case 'EditDocCenter':
        return <ActingDriverEditDocCenter />;
      case 'LanguageSelectionScreen':
        return <LanguageScreen />;
      case 'PublicDriverTrackingScreen':
        return <PublicDriverTrackingScreen />;
      case 'DriverPermissionScreen':
        return <DriverPermissionScreen />;
      default:
        return <Text>Home</Text>;
    }
  };

  const memoizedDriverLocationHandler = useMemo(
    () => <DriverLocationHandler />,
    [],
  );

  return (
    <>
     <View style={{ flex: 1 }}>
      <MapContainer />
      {/* Socket reconnect banner (only for approved, not blocked) */}
      {!wsConnected && approved && !blocked && (
        <View style={{position:'absolute', top: 0, left: 0, right: 0, backgroundColor: Colors.pale_grey_two, padding: 8, flexDirection:'row', alignItems:'center', justifyContent:'space-between', zIndex: 1000}}>
          <Text style={{fontFamily: Fonts.medium, color: Colors.black}}>Network Not Connected</Text>
          <TouchableOpacity
            disabled={wsConnecting}
            onPress={async () => {
              try {
                setWsConnecting(true);
                const ok = await rideMatchWSService.initDriverRoomSocket(userInfo?._id);
                setWsConnected(Boolean(ok));
              } catch (e) {
                setWsConnected(false);
              } finally {
                setWsConnecting(false);
              }
            }}
            style={{backgroundColor: Colors.periwinkle, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8}}
          >
            <Text style={{color: Colors.white, fontFamily: Fonts.medium}}>{wsConnecting ? 'Reconnecting…' : 'Reconnect'}</Text>
          </TouchableOpacity>
        </View>
      )}
        {(isLoading || loading)&&
    <View style={{position:'absolute', width:'100%', height:'100%',}}>
    <FullScreenLoader /> 
    </View>
    }
      {!hasNotificationPermission && renderNotificationPermission()}
      {!hasLocationPermission && renderLocationPermission()}
      {renderContent()}
      {approved ? memoizedDriverLocationHandler : null}
      <PaymentCompletionScreen />
      <AppUpdateChecker />
    </View>
    </>
   
  );
};

export default ActingDriverHomeScreen;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex:99999
  },
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center'
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily:Fonts.regular,
    color: Colors.black
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily:Fonts.regular
  }
});


