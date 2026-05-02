/* eslint-disable class-methods-use-this */
import PushNotification from 'react-native-push-notification';
import { Alert, Linking, NativeModules, Platform } from 'react-native';
import { useStackScreenStore } from '../store/useStackScreenStore';
import { useTripAcceptStore } from '../../notdriver/store/useTripAcceptStore';
import useTripsStore from '../../notdriver/store/useTripsStore';
import { useMapMarkerStore } from '../store/useMapMarkerStore';
import { DataStore } from '../../common/controllers/DataStore';
const {NeNativeModule} = NativeModules

class PushNotifications {
  constructor() {
    this.onNotificationHandler = this.onNotificationHandler.bind(this);
    this.tripNavigationTimeout = null;

    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: this.onNotificationHandler,
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios' && true,
    });

    // Ensure Android 13+ notification permission is requested
    if (Platform.OS === 'android') {
      try {
        PushNotification.requestPermissions();
      } catch (e) {
        console.log('Android notification permission request failed:', e?.message);
      }
    }

    PushNotification.createChannel(
      {
        channelId: 'TrackerApp',
        channelName: 'My channel',
        channelDescription: 'A channel to categorise your notifications',
        playSound: true,
        soundName: 'default',
        vibrate: true,
        importance: 4,
      },
      created => console.log(`createChannel returned '${created}'`),
    );
  }

   parseJson (stirng) {
    try {
        return JSON.parse(stirng)
    } catch (e) {
        return null
    }
   }

  async notificationEvents (notification) {
  
    const { setStackScreen } = useStackScreenStore.getState();
    const { setTripId ,setCurrentFare, setIsOnGoing, setHasActiveTrip} = useTripAcceptStore.getState();
    const {setFareBreakDown,setActiveTripData, activeTripData } = useTripsStore.getState();
    const {setDirectionPoints, setStartNavigation} = useMapMarkerStore.getState();

    if (notification.title === 'File Downloaded') {
      this.openDownloads();
    }

    // publicDrivers
  if (notification.data?.title === 'New Trip Request' || notification.title === 'New Trip Request') {
    const tripId = notification.details?.tripId || notification.data?.tripId;
    const currentFare =
      notification.details?.currentFare || notification.data?.currentFare;

    const timeOutSeconds =
      notification.data?.timeout_seconds ||
      notification.notification?.details?.timeout_seconds ||
      15;

    // timeout_seconds is expected to be in seconds; convert to milliseconds for comparison with Date.now()
    const timeLimitMs = Number(timeOutSeconds) * 1000;

    const alertedAt =
      notification.data?.alertedAt ||
      notification.notification?.details?.alertedAt;

    const alertedAtMs = parseInt(alertedAt, 10);

    console.log('alertedAtMs:', alertedAtMs);
    console.log('CurrentTime:', Date.now());
    console.log('Allowed time window:', Date.now() - timeLimitMs);

    // ✅ NEW LOGIC:
    // Only accept if alertedAt is within the last "timeLimit" seconds
    if (!alertedAtMs || alertedAtMs < Date.now() - timeLimitMs) {
      console.log('Trip request expired for onClick notification.');
      return;
    }

    // Now safe to proceed
    if (tripId) {
      if (this.tripNavigationTimeout) {
        clearTimeout(this.tripNavigationTimeout);
        this.tripNavigationTimeout = null;
      }

      this.tripNavigationTimeout = setTimeout(() => {
        const {stackScreen} = useStackScreenStore.getState();
        const currentScreen = stackScreen[stackScreen.length - 1];
        const {tripId: existingTripId} = useTripAcceptStore.getState();

        if (
          (currentScreen === 'Home' || stackScreen.length === 1) &&
          (!existingTripId || existingTripId !== tripId)
        ) {
          setTripId(tripId);
          setStackScreen('TripAccept');
          setCurrentFare(currentFare);
        } else {
          console.log(
            'Skipping auto-navigation – existing trip or not on Home.',
          );
        }
        this.tripNavigationTimeout = null;
      }, 4000);
    } else {
      console.log('tripId missing');
    }
  }

     
    if (notification.data?.title === 'Trip Cancelled By Passanger' || notification.title === 'Trip Cancelled By Passanger') {
      if (notification.data?.isOnGoingTrip === 'true' || notification?.isOnGoingTrip === 'true') {
        const fareDetails = notification?.data?.totalFare ? notification?.data?.totalFare : notification?.totalFare
        const fareData = this.parseJson(fareDetails)
        DataStore.storeData('isOngoingTrip', true)
        setFareBreakDown(fareData)
        setIsOnGoing(true)
        const updatedRideGroup = {...activeTripData[0], status:'DROPPED'};
        setActiveTripData([updatedRideGroup]);
       } else {
        DataStore.clearData('activeTripId');
        DataStore.clearData('activeTripId');
        DataStore.clearData('isOngoingTrip')
        setActiveTripData([])
        setDirectionPoints(null)
        setHasActiveTrip(null)
        setStackScreen('Home')
        NeNativeModule.endNavigation();
        setStartNavigation(false);
      }
    }

    if (notification.data?.title === 'Pickup Location Changed' || notification.title === 'Pickup Location Changed') {
      const {setStartNavigation, setDisduration} = useMapMarkerStore.getState()
      const {activeTripData} = useTripsStore.getState()
      const stops = notification?.data?.stops ? notification?.data?.stops : notification?.details?.stops
      const _stops = this.parseJson(stops)
      const activeNewTrip = {...activeTripData[0], stops: _stops}
        useTripsStore.setState({activeTripData: [activeNewTrip]})
        NeNativeModule.endNavigation();
        setStartNavigation(false);
        setDisduration(null);
    }

    if (notification.data?.title === 'Waypoints Location Changed' || notification.title === 'Waypoints Location Changed') { 
      const {setStartNavigation, setDisduration} = useMapMarkerStore.getState()
      const {setStackScreen} = useStackScreenStore.getState()
      const stops = notification?.data?.requestdata ? notification?.data?.requestdata : notification?.details?.requestdata
      const _stops = this.parseJson(stops)
      useTripsStore.setState({newStopData: _stops})
      NeNativeModule.endNavigation();
      setStartNavigation(false);
      setDisduration(null);
      setStackScreen('StopChangeRequest')
    }
  }

  scheduleNotification() {
    PushNotification.localNotificationSchedule({
      channelId: 'TrackerApp',
      title: 'New Trip Request',
      message: 'Test Trip Report',
      details: {
        tripId: '67e62d255724d2f133eba97c'
      },
      date: new Date(Date.now() + 1000 * 20),
      allowWhileIdle: true,
    });
  }

  onRemoteNotificationHandler(notification) {
     if(notification) {
      this.notificationEvents(notification)
     }
  }

  onNotificationHandler(notification) {
    console.log('Notification received:', notification);
    
    // Handle notification regardless of user interaction for foreground notifications
      this.notificationEvents(notification)
  }

  async openDownloads() {
    if (Platform.OS === 'android') {
    try {
      await Linking.sendIntent('android.intent.action.VIEW_DOWNLOADS');
    } catch (e) {
      Alert.alert(e.message);
    }
  } 
  }

  onClearAllNotifications() {
    PushNotification.removeAllDeliveredNotifications();
    PushNotification.cancelAllLocalNotifications();
  }

  getAllDeliveredNotifications(callback) {  
    PushNotification.getDeliveredNotifications(callback)
  }

  loadTripRequestData(notifications){
    const filteredNotifications = notifications.filter((message) => message.title === 'New Trip Request');
  //   console.log('Filtered Notifications:', filteredNotifications);
  //   if (filteredNotifications.length === 0 || !filteredNotifications) {
  //     console.log('No Trip Request notifications found.');
  //     return;
  //   }
  //   const convertedNotifications = filteredNotifications.flatMap((n) => {
  //   const match = n.body.match(/Trip ID:\s*(\w+),\s*BookedAt:\s*([\d\-]+\s[\d:]+)/);
  //   if (match) {
  //     return {
  //       tripId: match[1],
  //       bookedAt:new Date(match[2].replace(' ', 'T')).getTime(),
  //     };
  //   }
  //   return null;
  // }).filter(Boolean);
  //   convertedNotifications.sort((a, b) => b?.bookedAt - a?.bookedAt);
  //   const latestNotification = convertedNotifications[0];
  //   if (!latestNotification || latestNotification.bookedAt < Date.now() - 10 * 1000) {
  //     console.log('No recent trip requests found within the last 10 seconds.');
  //     return;
  //   }
  //   const { setTripId } = useTripAcceptStore.getState();
  //   const tripId = latestNotification?.tripId;
  //   if(tripId){
  //       setTimeout(() => {
  //         const { stackScreen, setStackScreen } = useStackScreenStore.getState();
  //         const currentScreen = stackScreen[stackScreen.length - 1];
  //         const { tripId: existingTripId } = useTripAcceptStore.getState();
  //         if ((currentScreen === 'Home' || stackScreen.length === 1) && 
  //             (!existingTripId || existingTripId !== tripId)) {
  //           setTripId(tripId)
  //           setStackScreen('TripAccept')
  //         } else {
  //           console.log('Skipping auto-navigation to TripAccept - already have trip or not on Home screen');
  //         }
  //       }, 4000)
  //     }else{
  //       console.log('tripId not found in notification data');
  //     }
  }

  sendNotification(fileName, title, details = {}) {
    console.log('Sending local notification:', {fileName, title, details});
    PushNotification.localNotification({
      channelId: 'TrackerApp',
      title: title, // 'File Downloaded',
      message: fileName,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 300,
      details: details
    });
        if (details.title === '🎉 Account Approved') {
      const { setStackScreen } = useStackScreenStore.getState();
       const {setIsApproved} = useTripAcceptStore.getState();
       setStackScreen('Home');
       setIsApproved(true)
    }
  }
  
}

export default new PushNotifications();
