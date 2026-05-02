import { useContext, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import useDriverStatusStore from "../store/useDriverStatusStore";
import useUserStore from "../../common/store/useUserStore";
import useTripRequestStore from "../store/useTripRequestStore";
import { useStackScreenStore } from "../../common/store/useStackScreenStore";
import useDeviceTokenStore from "../../common/store/useDeviceTokenStore";
import { checkBackgroundLocationPermissions, checkFineLocationPermissions, CheckNotificationPermissions, checkOverlayPermission, isOverlayCheckAccessible } from "../../common/controllers/PermissionHandler";
import BGLocationTask from "../../common/controllers/BGLocationTask";
import APIRequest from "../../common/APIRequest";
import { showNotification } from "../../common/components/Alerts/showNotification";
import { DataStore } from "../../common/controllers/DataStore";
import { useTripAcceptStore } from "../store/useTripAcceptStore";
import overlayController from "../../common/controllers/Overlay";
import locationTask from "../../common/controllers/GetCurrentLocation";
import { useMapMarkerStore } from "../../common/store/useMapMarkerStore";

function DriverLocationHandler() {

  const permissionIntervalRef = useRef(null)
  const {driverStatus, setDriverStatus } = useDriverStatusStore()
  const {userInfo} = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const {tripRequestData} = useTripRequestStore()
  const {userLocation} = useMapMarkerStore()

  const {
    hasLocationPermission, hasNotificationPermission,
    setHasLocationPermission, setHasNotificationPermission,
    hasBackgroundLocationPermission, setHasBackgroundLocationPermission,
    setHasOverlayPermission, hasOverlayPermission,
    overlayCheckSupported, setOverlayCheckSupported
  } = useDeviceTokenStore()

  useEffect(() => {
    async function checkPermission() {
      const hasNotificationPermissions = await CheckNotificationPermissions();
      setHasNotificationPermission(hasNotificationPermissions);

      const hasFineLocationPermissions = await checkFineLocationPermissions();
      setHasLocationPermission(hasFineLocationPermissions);

      const hasBackgroundLocationPermissions = await checkBackgroundLocationPermissions();
      setHasBackgroundLocationPermission(hasBackgroundLocationPermissions);

      const overlayAccessible = isOverlayCheckAccessible();
      setOverlayCheckSupported(overlayAccessible);
      if (overlayAccessible) {
        const overlayPermissionGranted = await checkOverlayPermission();
        setHasOverlayPermission(overlayPermissionGranted);
      } else {
        // Bypass overlay check on devices where it's not accessible
        setHasOverlayPermission(true);
      }
      // if (driverStatus === "online") {
      //   if (!overlayPermissionGranted) {
      //       setStackScreen('DriverPermissionScreen')
      //   }
      // } 
      const bgPermission = Platform.OS === 'android' && Platform.Version <= 28 ? true : hasBackgroundLocationPermissions;
      if (bgPermission && hasNotificationPermissions && driverStatus === "online") {
        BGLocationTask.runDriverBgTask();
      }
    }

    function startPermissionCheck() {
      if (!permissionIntervalRef.current) {
        checkPermission();
        permissionIntervalRef.current = setInterval(checkPermission, 3000);
      }
    }

    startPermissionCheck();

    return () => {
      if (permissionIntervalRef.current) {
        clearInterval(permissionIntervalRef.current);
        permissionIntervalRef.current = null;
      }
    };
  }, [driverStatus, hasBackgroundLocationPermission, hasNotificationPermission, hasLocationPermission, hasOverlayPermission, overlayCheckSupported]);

  const _updateDriverStatus = async (status) => {
    if (!userLocation) {
      await locationTask.getCurrentLocation();
      showNotification('Fetching Current Location', '', 'info');
      return;
    }
    setIsLoading(true)
     try {
       const apiRequest = new APIRequest()
       const payload = {
        status: status,
        location: {
          lat: userLocation?.[0],
          lon: userLocation?.[1]
        }
       }
       const response = await apiRequest.request('/publicrides/driver/v2/updatePublicRidesDriverStatus', "POST", payload, userInfo?.token)
       if (response?.success) {
          showNotification(response?.message,'','success')
          const _newUserInfo = userInfo
          _newUserInfo.driverStatus = {
            status: status,
            updatedOn: new Date().getTime(),
          }
          await DataStore.storeData('userdetails', _newUserInfo);
          setDriverStatus(status)
          BGLocationTask.stopDriverBgTask();
          if (overlayCheckSupported && hasOverlayPermission) {
            overlayController.stopOverlay();
          }
       } else {
        showNotification('Low Network Connection','','danger')
       }
       setIsLoading(false)
     }catch (e) {
      // console.log('updateDriverStatus -->> ', e)
      showNotification('Something Went Wrong','','danger')
      setIsLoading(false)
     }
  }  

  useEffect(() => {
    if (!tripRequestData || !tripRequestData.data) return
    const timeOut = tripRequestData.data?.timeout_seconds || 10
    const tripId = tripRequestData.data?.tripId
    const latestNotification = tripRequestData.data;
    const bookedAt = latestNotification.alertedAt;
    const parsed = parseInt(timeOut, 10);

    if (!bookedAt || bookedAt < Date.now() - parsed * 1000) {
      console.log('No recent trip requests found within the last 10 seconds.');
      return;
    }
    const { setTripId } = useTripAcceptStore.getState();
    if(tripId){
        setTimeout(() => {
          const { stackScreen, setStackScreen } = useStackScreenStore.getState();
          const currentScreen = stackScreen[stackScreen.length - 1];
          const { tripId: existingTripId } = useTripAcceptStore.getState();
          if ((currentScreen === 'Home' || stackScreen.length === 1) && 
              (!existingTripId || existingTripId !== tripId)) {
            setTripId(tripId)
            setStackScreen('TripAccept')
          } else {
            console.log('Skipping auto-navigation to TripAccept - already have trip or not on Home screen');
          }
        }, 1000)
      }else{
        console.log('tripId not found in notification data');
      }
  },[])

  useEffect(() => {
    if (userInfo?.driverStatus?.status === 'offline') {
      overlayController.stopOverlay().catch(() => {});
      return
    }
    if (!overlayCheckSupported || !hasOverlayPermission) return;
    overlayController.stopOverlay().catch(() => {});

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        if (overlayCheckSupported && hasOverlayPermission) {
          overlayController.stopOverlay().catch(() => {});
        }
      } else if (state === 'background') {
        if (overlayCheckSupported && hasOverlayPermission) {
          overlayController.restartOverlayIfPermitted().catch(() => {});
        }
      }
    });

    return () => {
      subscription?.remove?.();
    };
  }, []);


  useEffect(() => {
    let isCancelled = false;

    const ensureBgTaskRunning = async () => {
      if (isCancelled) return;
      if (!userInfo?.token) return;

      const isCurrentlyRunning = await BGLocationTask.isRunning();
      if (isCurrentlyRunning) return;

      const overlayPermissionGranted = overlayCheckSupported ? await checkOverlayPermission() : true;
      const isAndroidLessThanOrEqual28 =
        Platform.OS === 'android' && Platform.Version <= 28;
      const hasAllRequiredPermissions = isAndroidLessThanOrEqual28
        ? hasLocationPermission && hasNotificationPermission && (overlayCheckSupported ? overlayPermissionGranted : true)
        : hasLocationPermission &&
          hasBackgroundLocationPermission &&
          hasNotificationPermission &&
          (overlayCheckSupported ? overlayPermissionGranted : true);

      if (userInfo?.driverStatus?.status === 'online') {
        if (!hasAllRequiredPermissions) {
          _updateDriverStatus('offline');
        } else {
          BGLocationTask.runDriverBgTask();
        }
      }
    };

    ensureBgTaskRunning();

    return () => {
      isCancelled = true;
    };
  }, [
    hasLocationPermission,
    hasNotificationPermission,
    hasBackgroundLocationPermission,
    hasOverlayPermission,
    userInfo?.driverStatus?.status,
    userInfo?.token,
  ]);
  return <>

  </>

}

export default DriverLocationHandler