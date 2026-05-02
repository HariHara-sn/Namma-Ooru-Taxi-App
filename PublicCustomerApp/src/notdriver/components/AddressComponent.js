import {Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useContext, useEffect, useRef, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useUserStore from '../../common/store/useUserStore';
import { Colors, Fonts } from '../../common/constants/constants';
import WayPointIndicator from '../Indicators/WayPointIndicator';
import YellowMarker from '../../notdriver/assets/icons/YellowMarker.svg';
import StatLocBlue from '../../notdriver/assets/icons/statLocBlue.svg';
import { useTranslation } from 'react-i18next';
import { DateTimeFormatter } from '../../common/utils/DateTimeFormatter';
import Entypo from 'react-native-vector-icons/Entypo';

const AddressComponent = props => {
  const {userInfo} = useUserStore()
  const {percentage, waypoints, screen, deviceLocation, isPublicRides} = props;
  const {t} = useTranslation()

  const busPosition = useRef(new Animated.Value(0)).current;
  const [finalPosition, setFinalPosition] = useState(0);

  const transformedData = waypoints;
  const [modalVisible, setModalVisible] = useState(false);

  // Waypoints are the stops between pickup and drop (indices 1..length-2)
  const hasWaypoints = transformedData?.length > 2;
  // Always render only pickup (index 0) and drop (last index); waypoints shown in modal
  const visibleStops = transformedData
    ? [transformedData[0], transformedData[transformedData.length - 1]].filter(Boolean)
    : [];
  const handleBusLayout = (event, index) => {
    if (index === transformedData.length - 1) {
      const {y} = event.nativeEvent.layout;
      setFinalPosition(y);
    }
  };

  const translateY = busPosition.interpolate({
    inputRange: [0, 100],
    outputRange: [0, finalPosition],
  });

  useEffect(() => {
    Animated.timing(busPosition, {
      toValue: percentage,
      duration: 4000,
      useNativeDriver: true,
    }).start();
  }, [busPosition, finalPosition]);

   const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined || minutes <= 0) return '0 Min';
    if (minutes <= 1 || minutes < 2) return '1 Min';
    return `${DateTimeFormatter.formatMinutesToDuration(minutes)}`;
   };

  function isMyStop(name) {
    const result = transformedData.find(stop => 
      stop?.passangers?.some(passenger => passenger?._id === userInfo?._id)
    );

    if (result && name === result.name) {
      return 'your_stop';
    }
    return null;
  }

  return (
    <View style={[styles.mainContainer,{width: screen === 'rideDetails' ? '100%' : '92%',backgroundColor: isPublicRides ? Colors.white : Colors.grey_light},]}>

      {/* ── Pickup & Drop only ── */}
      {visibleStops.map((item, rawIndex) => {
        // rawIndex 0 = pickup, 1 = drop (actual indices 0 and last)
        const actualIndex = rawIndex === 0 ? 0 : transformedData.length - 1;
        let displayName = item.name;
        let displayIcon = item.icon;

        if (actualIndex === 0) {
          displayName = isPublicRides ? 'pick_up_location' : 'start_loc';
          displayIcon = isPublicRides ? <StatLocBlue /> : <YellowMarker />;
        } else {
          displayName = isPublicRides ? 'drop_location' : 'end_loc';
          displayIcon = <Ionicons name={isPublicRides ? 'location-outline' : 'flag'} color={'red'} size={18} />;
        }

        return (
          <View
            style={styles.addContainer}
            key={actualIndex}
            onLayout={event => handleBusLayout(event, actualIndex)}>
            <View style={[styles.markerIcons, {backgroundColor: isPublicRides ? Colors.white : Colors.grey_light}]}>{displayIcon}</View>
            <Text style={styles.nameTxt}>
              {t(displayName) || displayName}{' '}
              <Text style={styles.yourStopTxt}>{t(isMyStop(item.name))}</Text>
            </Text>
            <Text style={styles.addTxt}>{item.address.length > 30 ? item.address.substring(0, 30) + '...' : item.address}</Text>
            {item?.waitingTime > 0 && (
              <View style={styles.waitingTimeContainer}>
                <Entypo name="clock" size={14} color={Colors.periwinkle} />
                <Text style={styles.waitingTimeTxt}>{formatDuration(item.waitingTime)}</Text>
              </View>
            )}
          </View>
        );
      })}

      {/* ── View more button ── */}
      <TouchableOpacity style={styles.viewMoreBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <Ionicons name="map-outline" size={14} color={Colors.periwinkle} />
        <Text style={styles.viewMoreTxt}>
          {hasWaypoints ? `${t('view_full_address')} · ${transformedData.length - 2} ${t('stop')}${transformedData.length - 2 > 1 ? 's' : ''}` : t('view_full_address')}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.periwinkle} />
      </TouchableOpacity>

      {/* ── Full route modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('full_route')}

              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color={Colors.black} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {transformedData?.map((item, index) => {
                let displayName;
                let displayIcon;

                if (index === 0) {
                  displayName = isPublicRides ? 'pick_up_location' : 'start_loc';
                  displayIcon = isPublicRides ? <StatLocBlue /> : <YellowMarker />;
                } else if (index === transformedData.length - 1) {
                  displayName = isPublicRides ? 'drop_location' : 'end_loc';
                  displayIcon = <Ionicons name={isPublicRides ? 'location-outline' : 'flag'} color={'red'} size={18} />;
                } else {
                  displayName = `stop`;
                  displayIcon = <WayPointIndicator waypoints={index} />;
                }

                return (
                  <View style={styles.addContainer} key={index}>
                    <View style={[styles.markerIcons, { backgroundColor: Colors.white }]}>{displayIcon}</View>
                    <Text style={styles.nameTxt}>
                      {displayName === 'stop'
                        ? t(displayName) + ' ' + index
                        : t(displayName) || displayName}{' '}
                      <Text style={styles.yourStopTxt}>{t(isMyStop(item.name))}</Text>
                    </Text>
                    <Text style={styles.addTxt}>{item.address}</Text>
                    {item?.waitingTime > 0 && (
                      <View style={styles.waitingTimeContainer}>
                        <Entypo name="clock" size={14} color={Colors.periwinkle} />
                        <Text style={styles.waitingTimeTxt}>{formatDuration(item.waitingTime)}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddressComponent;

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: Colors.grey_light,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 15,
    elevation:5,
    width:'100%',
    marginVertical:10,
    paddingVertical:10,
  },
  nameTxt: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.cool_grey,
  },
  addTxt: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.black,
  },
  addContainer: {
    borderLeftWidth: 1,
    paddingLeft: 20,
    borderStyle: 'dashed',
    marginTop:10,
    width:'100%',
  },
  countTxt: {
    fontFamily: Fonts.regular,
    fontSize: 18,
  },
  markerIcons: {
    position: 'absolute',
    left: -12,
    backgroundColor: Colors.grey_light,
    alignItems: 'center',
    justifyContent: 'center',
    width: 25,
    height: 25,
  },
  busIcon: {
    position: 'absolute',
    left: 4,
    zIndex: 1,
  },
  yourStopTxt:{
    fontFamily:Fonts.regular,
    color:'#1379ff',
    fontSize:12
  },
  waitingTimeContainer:{
    flexDirection:'row',
    gap:5,
    marginTop:10,
    alignItems:'center'
  },
  waitingTimeTxt:{
    fontFamily:Fonts.regular,
    fontSize:14,
    color:Colors.periwinkle
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.periwinkle + '55',
    backgroundColor: Colors.periwinkle + '11',
    alignSelf: 'flex-start',
  },
  viewMoreTxt: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.periwinkle,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: Colors.black,
  },
});
