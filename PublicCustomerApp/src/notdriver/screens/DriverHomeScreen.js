import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState, useCallback, useMemo, useContext } from 'react';
import {useQuery} from 'react-query';

import HomeTab from '../../notdriver/assets/icons/homeTab.svg';
import HomeHl from '../../notdriver/assets/icons/homeHl.svg';
import Tracking from '../../notdriver/assets/icons/tracking.svg';
import TrackingHl from '../../notdriver/assets/icons/trackingHl.svg';
import SettingsTab from '../../notdriver/assets/icons/settingsTab.svg';
import SettingTabHi from '../../notdriver/assets/icons/settingTabHi.svg';


import TripNotSelected from '../../notdriver/assets/icons/tripNotSelected.svg';
import TripSelected from '../../notdriver/assets/icons/tripSelected.svg';
// import TripHistory from './PDTripHistory/TripHistory';

import NetInfo from '@react-native-community/netinfo';
import { Colors, Fonts } from '../../common/constants/constants';
import MapContainer from '../../common/map/MapContainer';
import usePublicDriverStore from '../store/usePublicDriverStore';
import DriverTabBar from '../bottomNavigation/DriverTabBar';
import publicrideDriverApi from '../api/publicrideDriverApi';
import { showNotification } from '../../common/components/NotificationManger';
import useDeviceTokenStore from '../../common/store/useDeviceTokenStore';
import useDriverStatusStore from '../store/useDriverStatusStore';
import useCurrentScreenStore from '../../common/store/useCurrentScreenStore';
import APIRequest from '../../common/APIRequest';
import BGLocationTask from '../../common/controllers/BGLocationTask';
import locationTask from '../../common/controllers/GetCurrentLocation';
import Marker from '../../common/map/Marker';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import { useTripAcceptStore } from '../store/useTripAcceptStore';
import useUserStore from '../../common/store/useUserStore';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import { DataStore } from '../../common/controllers/DataStore';
import { checkFineLocationPermissions, RequestFineLocationPermission, RequestNotificationPermission } from '../../common/controllers/PermissionHandler';
import DriverMapScreen from './DriverMapScreen';
import TripHistory from './TripHistory/TripHistory';
import DriverSettingsScreen from './DriverSettingsScreen';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import DriverLocationHandler from '../components/DriverLocationHandler';
import PaymentCompletionScreen from './PaymentCompletionScreen';
import AppUpdateChecker from '../../common/components/AppUpdateChecker';
import DriverEarnings from './DriverEarnings/DriverEarnings';
import DriverRouteDetailsScreen from './DriverRouteDetailsScreen';
import DriverPermissionScreen from './DriverPermissionScreen';
import DriverVehiclesDetails from './DriverVehicleDetails/DriverVehiclesDetails';
import EditDriverVehicleDetails from './EditDriverVehicleDetails';
import DriverApprovalScreen from './DriverApprovalScreen';
import DocumentCenter from './DriverDocumentCenter/DocumentCenter';
import TripAccept from './TripAccept';
import AddDriverLocation from './AddDriverLocation';
import PublicDriverTrackingScreen from './PublicDriverTrackingScreen';
import StopChangeRequest from './StopChangeRequest';
import DriverAskVehicle from './DriverAskVehicle';
import TicketSupportScreen from '../../common/screens/RiseSupportTicket/TicketSupportScreen';
import TicketDetailScreen from '../../common/screens/RiseSupportTicket/TicketDetailScreen';
import TripDetailScreen from './TripHistory/TripDetailScreen';
import DriverBasicDetails from './DriverDetails/DriverBasicDetails';
import DriverPersonalInfo from './DriverDetails/DriverPersonalInfo';
import DriverProofDocuments from './DriverDetails/DriverProofDocuments';
import BankAccountDetails from './DriverDetails/BankAccountDetails';
import DeleteAccount from './DeleteAccount';
import DriverEditInfo from './DriverDetails/DriverEditInfo';
import SupportScreen from './SupportScreen';
import DriverVehicleApprovalScreen from './DriverVehicleApprovalScreen';
import DriverAccountRevokeScreen from './DriverAccountRevokeScreen';
import DriverHelpSupport from './DriverHelpSupport';
import WriteReview from './WriteReview';
import UpComingTripsList from './UpComingTripsList';
import UpComingTripsView from './UpComingTrips/UpComingTripsView';
import DriverIDCard from './DriverIDCard';
import PublicRidesPriceChart from './PublicRidesPriceChart/PublicRidesPriceChart';
import PublicRidesPriceChartDetails from './PublicRidesPriceChart/PublicRidesPriceChartDetails';
import { useTranslation } from 'react-i18next';
import GlobalContext from '../../context/GlobalContext';
import DriverEntry from './DriverDocumentCenter/DriverEntry';
import VehicleEntry from './DriverDocumentCenter/VehicleEntry';
import BankDetails from './DriverDocumentCenter/BankDetails';
import UPIVerification from './DriverDocumentCenter/UPIVerification';
import DriverProofDoc from './DriverDocumentCenter/DriverProofDoc';
import LanguageSelectionScreen from './LanguageSelectionScreen';
import EditDocCenter from './EditDocCenter';
import ActingDriverPreTripScreen from './ActingDriverPreTripScreen';
import ActingDriverPostTripScreen from './ActingDriverPostTripScreen';
import DriverVehiclePhotosScreen from './DriverVehiclePhotosScreen';
import DriverBillsExpensesScreen from './DriverBillsExpensesScreen';
import DrivingExperienceScreen from '../../actingDriver/screens/DrivingExperienceScreen';
import VehicleHandlingScreen from '../../actingDriver/screens/VehicleHandlingScreen';
import tripAlert from '../../common/controllers/TripAlert';
import rideMatchWSService from '../../common/controllers/socketServices/RideMatchSocketService';
import messaging from '@react-native-firebase/messaging';
import DriverMapScreenV2 from './DriverMapScreenV2';
import DriverMapScreenV3 from './DriverMapScreenV3';

const checkDriverDetails = (response) => {
  if (!response?.driver) return false;
  const requiredKeys = ['name', 'phone', 'gender', 'location', 'dob'];
  const isParivahanFailed = response.driver?.ownVehicleInfo?.isParivahanFailed === true;
  const infoKeys = ['type', 'regNo'];
  const documentKeys = isParivahanFailed ? ['vehicleRcDoc', 'insurance', 'permitDoc'] : ['vehicleRcDoc'];
  const vehicleInfo = response.driver?.ownVehicleInfo || {};
  const document = response.driver?.documents;
  const bankDetails = response?.driver?.bankDetails?.UPIID;

  const vehicleDocuments = response.driver?.ownVehicleInfo?.documents;

  const proofDoc = ['aadhar','panCard']
  const hasProofDocuments = proofDoc.some(doc => document && document[doc]);
  
  const {setLocationCompleteStatus,setDriverDetailsCompleteStatus, setVehicleDetailsCompleteStatus, setBankDetailsCompleteStatus,setDocumentsCompleteStatus} = usePublicDriverStore.getState();
  
  if (['location'].every(key => key in response.driver)) {
  setLocationCompleteStatus(true)
  }

  if (requiredKeys.every(key => key in response.driver)) {
    setDriverDetailsCompleteStatus(true)
  } 
  
  const hasVehicleInfo = infoKeys.every(key => vehicleInfo && vehicleInfo[key])
  const hasVehicleDocuments = documentKeys.every(key => vehicleDocuments && vehicleDocuments[key])

  if (hasVehicleInfo && hasVehicleDocuments) {
    setVehicleDetailsCompleteStatus(true)
  }
  if (bankDetails) {
    setBankDetailsCompleteStatus(true)
  }
  if (hasProofDocuments) {
    setDocumentsCompleteStatus(true)
  }
  return (
    requiredKeys.every(key => key in response.driver) && 
    hasVehicleInfo &&
    hasVehicleDocuments &&
    bankDetails &&
    hasProofDocuments
  );
};

const PublicRidesDriverHomeScreen = () => {
  const {setDriverInfo, 
    setVehicleInfo, storeDocuments,
    setBankInfo, setVendorId, setDriverRole, 
    setDriverDue, setDriverEarnings, 
    setDriverTotalTrips, setIsBlocked,
    setIsApproved, setUnBlockRequestSent, 
    setdriverDueDate,setDriverRatings, 
    setRazorpayLinkedAccountDetails,setMinDueAmount, setDueDuration, setIsParivahanFailed, setRazorpayUpdated} = usePublicDriverStore();
  const { stackScreen, setStackScreen } = useStackScreenStore();
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
  const [isBlockLoading, setIsBlockLoading] = useState(false)
  const {setDirectionPoints, directionPoints, setGeometries, geometries} = useMapMarkerStore()
  const [approved, setApproved] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [isBankVerified, setIsBankVerified] = useState(false)
  const {setMapLocation, setMapBounds, setUserLocation, setMapMarkers, mapMarkers, userLocation} = useMapMarkerStore();
  const [loading, setLoading] = useState(false)
  const [wsConnected, setWsConnected] = useState(Boolean(rideMatchWSService?.socket?.connected));
  const [wsConnecting, setWsConnecting] = useState(false);
  const [driverModes, setDriverModes] = useState([]);

   const getFcmToken = async () => {
    try {
      const fcmToken = await messaging().getToken();
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
      drivingExperience: response.driver?.experience || null,
      vehicleHandling: response.driver?.experience || null,
    });
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

        const vehicleApproved = response?.driver?.ownVehicleInfo?.isApproved
        const vehicleBlocked = response?.driver?.ownVehicleInfo?.isBlocked
        const vehicleDeleted = response?.driver?.ownVehicleInfo?.isDeleted

        const modes = response?.driver?.mode || []
        setDriverModes(modes)

        setTimeoutSeconds(timeoutSeconds)
        setApproved(isApproved)
        setBlocked(isBlocked)
        if (response?.driver?.isDeleted) {
          setStackScreen('AccountRevokeScreen');
          BGLocationTask.stopDriverBgTask();
          return
        }

        if(response?.driver?.role === 'dco' && !checkDriverDetails(response)){
          if (!isApproved) {
          setStackScreen('DocumentCenter');
          BGLocationTask.stopDriverBgTask();
          return
          }
        }

        if (response?.driver?.role === 'salaried' && 
          (!response?.driver?.bankDetails || response?.driver?.bankDetails === null || 
            response?.driver?.bankDetails === undefined || response?.driver?.bankDetails === '')){
          setStackScreen('DriverAskVehicle');
          return
        }
          if (response?.driver?.role === 'salaried' &&(!response?.driver?.vehicleId || response?.driver?.vehicleId === null || 
          response?.driver?.vehicleId === undefined || response?.driver?.vehicleId === '')){
          setStackScreen('DriverAskVehicle');
          return
        }
        if (!isApproved) {
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

        if (!isBankVerified) {
          setIsBankVerified(false)
          return
        } else {
          setIsBankVerified(true)
        }
        
        if (response?.driver?.mode.includes('dco')) {
          if(response?.driver?.role === 'dco' && (!vehicleApproved || vehicleBlocked || vehicleDeleted)){
          setStackScreen('DriverVehicleApprovalScreen');
          BGLocationTask.stopDriverBgTask();
          return
         }
        }
       

        if (isBlocked) {
          // setIsBlocked(true)
          BGLocationTask.stopDriverBgTask();
          return
        }

        if (upComingTrips && upComingTrips.length > 0) {
           setUpComingTrips(upComingTrips);
        } else {
          setUpComingTrips([]);
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
          <DriverTabBar
            menus={[
              { id: 1, name: 'Map', icon: <HomeTab />, iconHighlight: <HomeHl />, title: 'home', component: 
              <DriverMapScreen isLoading={isLoading} isPublicRidesDriver={true} approved={approved} blocked={blocked} isBankVerified={isBankVerified} refreshStatus={refreshStatus} modes={driverModes} role={role}/> },
              { id: 9, name: 'Trips', icon: <TripNotSelected/>, iconHighlight: <TripSelected />, title: 'trips', component: <TripHistory />},
              { id: 2, name: 'Earnings', icon: <Tracking />, iconHighlight: <TrackingHl />, title: 'earnings', component: <DriverEarnings />},
              { id: 5, name: 'Settings', icon: <SettingsTab />, iconHighlight: <SettingTabHi />, title: 'settings', component: <DriverSettingsScreen /> }
            ].filter(item => role === 'salaried' ? item.id !== 2 : true)}
          />
        );
      case 'DriverRouteDetailsScreen':
        return <DriverRouteDetailsScreen />;
      case 'DriverPermissionScreen':
        return <DriverPermissionScreen />;
      case 'DocumentCenter':
        return <DocumentCenter />;
      case 'DriverVehicleDetails':
        return <DriverVehiclesDetails approved={approved}/>;
      case 'EditDriverVehicleDetails':
          return <EditDriverVehicleDetails />;
      case 'DriverApprovalScreen':
          return <DriverApprovalScreen />;
      case 'TripAccept':
        return <TripAccept />
      case 'AddDriverLocation':
          return <AddDriverLocation isPassanger={false} updatePassangerLocation={null}/>
      case 'AddDriverLocationActing':
          return <AddDriverLocation isPassanger={false} updatePassangerLocation={null} isActingDriver={true}/>
      case 'DrivingExperience':
          return <DrivingExperienceScreen />;
      case 'VehicleHandling':
          return <VehicleHandlingScreen />;
      case 'PublicDriverTrackingScreen':
          return <PublicDriverTrackingScreen />
      case 'StopChangeRequest':
          return <StopChangeRequest />
      case 'DriverAskVehicle':
          return <DriverAskVehicle />
      case 'TicketSupportScreen':
          return <TicketSupportScreen />
      case 'TicketDetailScreen':
            return <TicketDetailScreen />
      case 'TripDetailScreen':
            return <TripDetailScreen />
      case 'DriverAccountDetails':
              return <DriverBasicDetails />
      case 'DriverPersonalInfo':
              return <DriverPersonalInfo />
      case 'DriverProofDocuments':
              return <DriverProofDocuments />
      case 'BankAccountDetails':
              return <BankAccountDetails />
      case 'DeleteAccount':
              return <DeleteAccount />
      case 'DriverEditInfo':
              return <DriverEditInfo />
      case 'SupportScreen':
              return <SupportScreen isStackScreen={true}/>
      case 'DriverVehicleApprovalScreen':
              return <DriverVehicleApprovalScreen />
      case 'AccountRevokeScreen':
              return <DriverAccountRevokeScreen />
      case 'DriverHelpSupport':
              return <DriverHelpSupport />
      case 'WriteReview':
              return <WriteReview isStackScreen={true}/>
      case 'UpComingTripsList':
              return <UpComingTripsList />
      case 'UpComingTripsView':
              return <UpComingTripsView />
      case 'DriverIDCard':
              return <DriverIDCard />
      case 'LanguageSelectionScreen':
              return <LanguageSelectionScreen />; // <LanguageSelectionScreen isStackScreen={true}/>
      case 'PriceChart':
              return <PublicRidesPriceChart />;
      case 'PriceChartDetails':
              return <PublicRidesPriceChartDetails />;
      case 'DriverEntry':
              return <DriverEntry />;
      case 'DriverVehicleEntry':
              return <VehicleEntry />;        
      case 'DriverBankDetails':
              return <BankDetails />; 
            case 'UPIVerification':
              return <UPIVerification />;
      case 'DriverProofDoc':
              return <DriverProofDoc/>;  
      case 'EditDocCenter':
              return <EditDocCenter/>;  
      case 'ActingDriverPreTripScreen':
              return <ActingDriverPreTripScreen />;
      case 'ActingDriverPostTripScreen':
              return <ActingDriverPostTripScreen />;
      case 'DriverVehiclePhotosScreen':
              return <DriverVehiclePhotosScreen />;
      case 'DriverBillsExpensesScreen':
              return <DriverBillsExpensesScreen />;
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

export default PublicRidesDriverHomeScreen;

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