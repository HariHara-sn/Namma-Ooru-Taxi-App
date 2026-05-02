/* eslint-disable class-methods-use-this */
import PushNotification from 'react-native-push-notification';
import { Alert, Linking, Platform } from 'react-native';
import { useStackScreenStore } from '../store/useStackScreenStore';


class PushNotifications {
  constructor() {
    this.onNotificationHandler = this.onNotificationHandler.bind(this);

    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: this.onNotificationHandler,
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios' && true,
    });

    PushNotification.createChannel(
      {
        channelId: 'TrackerApp',
        channelName: 'My channel',
        channelDescription: 'A channel to categorise your notifications',
        playSound: true,
        soundName: 'default',
        vibrate: true,
      },
      created => console.log(`createChannel returned '${created}'`),
    );
  }

  async notificationEvents (notification) {
    const { setStackScreen } = useStackScreenStore.getState();
    // if (notification.title === 'Trip Cancelled By Driver') {
    //   setStackScreen('TripDetailsScreen')
    // }
    
  }




  
  scheduleNotification() {
    console.log('scheduleNotification')
    
    PushNotification.localNotification({
      channelId: 'TrackerApp',
      title: 'Trip Cancelled By Driver',
      message: 'Karthik cancelled the trip',
      details: {
        tripId: '67e38154ad833de5f7426985'
      },
      date: new Date(Date.now() + 1000 * 20), // 10 seconds from now
    });
  }

  onRemoteNotificationHandler(notification) {
 
     if(notification) {
      this.notificationEvents(notification)
     }
  }

  onNotificationHandler(notification) {
    if (notification.userInteraction) {
      this.notificationEvents(notification)
    }
  }

  

  sendNotification(fileName, title, details = null) {
    if (!fileName || !title || details===null) {
      console.log('PushNotifications: Missing fileName or title');
      return;
    }
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
  }
}

export default new PushNotifications();
