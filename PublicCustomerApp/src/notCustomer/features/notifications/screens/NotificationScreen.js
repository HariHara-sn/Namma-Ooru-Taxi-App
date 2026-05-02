import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import NavBar from '../components/NavBar';
import { useStackScreenStore } from '../store/useStackScreenStore';
import { CommonActions } from '@react-navigation/native';
import ScheduleIcon from "../assets/image/notification/scheduleIcon.svg"
import DriverIcon from "../assets/image/notification/driverIcon.svg"
import { colors } from '../constants/constants';
const NotificationScreen = () => {
  const { setStackScreen } = useStackScreenStore();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'schedule', message: 'You have upcoming rides scheduled ', time: '10:00 AM', date: '2025-02-13' },
    { id: '2', type: 'driver', message: 'Your driver has reached your location', time: '11:00 AM', date: '2025-02-12' },
    { id: '3', type: 'schedule', message: 'You have upcoming rides scheduled', time: '10:00 AM', date: '2025-02-12' },
  ]);

  const groupNotificationsByDate = (notifications) => {
    const groupedNotifications = notifications.reduce((acc, notification) => {
      const date = notification.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(notification);
      return acc;
    }, {});

    return groupedNotifications;
  };

  const formatDateHeader = (date) => {
    const today = new Date();
    const notificationDate = new Date(date);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (notificationDate.getDate() === today.getDate()) {
      return 'Today';
    } else if (notificationDate.getDate() === yesterday.getDate()) {
      return 'Yesterday'; 
    } else {
      return date;
    }
  };

  const renderNotification = ({ item }) => (
    <View style={styles.notificationItem}>
       <View style={{padding: 15, backgroundColor: colors.grey_xlight, borderRadius: 30}}>
      {item.type === 'driver' && <DriverIcon style={{fill: colors.grey}}/>}
      {item.type === 'schedule' && <ScheduleIcon style={{fill: colors.grey}}/>}
      </View>
      <View style={styles.notificationText}>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
    </View>
  );

  const HandleBackBtn = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'HomeScreen' }],
      }),
    );
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <>
      <NavBar withBg onBackPress={HandleBackBtn} title={'Notifications'} />
      <View style={styles.container}>
        {Object.keys(groupedNotifications).map((date) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{formatDateHeader(date)}</Text>
            <FlatList
              data={groupedNotifications[date]}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id}
            />
          </View>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal:20,
    backgroundColor: 'white',
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 18,
    color: colors.black,
    marginBottom: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  notificationText: {
    marginLeft: 10,
  },
  notificationTime: {
 
    color: colors.grey,
  },       
  notificationMessage: {
    fontSize: 15,
   
    
  },
});

export default NotificationScreen;
