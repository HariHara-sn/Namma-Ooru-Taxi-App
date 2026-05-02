import {Image, StyleSheet, Text, TouchableOpacity, View, Animated,Easing,Dimensions} from 'react-native';
import React, {useState,useEffect,useRef} from 'react';
import BottomSheet from './BottomSheet';
import { StatusBar } from 'react-native';
import {vehicleDetailsStyles} from '../styles/VehicleDetails';
import AddressContainer from './Trips/AddressContainer';

import PeopleBlack from '../assets/image/peopleBlack.svg';
import DurationBlack from '../assets/image/durationBlack.svg';
import FareGreen from '../assets/image/fareGreen.svg';
import useLocationStore from '../store/useLocationStore';
import Rocket from '../assets/image/svgIcons/rocket.svg';
import EndBlack from '../assets/image/svgIcons/end_black.svg';
import useRideSelectionStore from '../store/useRideSelectionStore';
import {utils} from '../utils/Utils';
import ScheduleContainer from '../screens/SearchLocation/ScheduleContainer';
import BookedTick from '../assets/image/svgIcons/bookedTick.svg';
import {colors} from '../constants/constants';
import { getVehicleDetailsById } from '../constants/JsonData';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useMapStyleStore from '../store/useMapStyleStore';

const SelectedVehicleDetails = props => {
  const {selectedVehicle, HandleBookRide, selectedRide} = props;
  const {directions} = useLocationStore();
  const {scheduleDateTime,setPaymentMethod,paymentMethod,bookingDetails} = useRideSelectionStore();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;
  const {setMapStyle} = useMapStyleStore();

  const [showScheduleContainer, setShowScheduleContainer] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const paymentOptions = ['Cash', 'UPI'];
 


  const getLocationIcon = item => {
  
    switch (item.name) {
      case 'Start':
        return <Rocket />;
      case 'End':
        return <EndBlack />;
      default:
        if (item.name.startsWith('Waypoint')) {
          return <EndBlack />;
        }
        return null;
    }
  };

  const oncloseDateTime = () => {
    setShowScheduleContainer(false);
  };

  const onConfirmDateTime = () => {
    setShowScheduleContainer(false);
  };

  const scheduleDate = scheduleDateTime?.date
    ? utils.formatDate(scheduleDateTime?.date)
    : '';
  const scheduleTime = scheduleDateTime?.time
    ? utils.timestampTo12HourFormat(scheduleDateTime?.time)
    : '';

  const isBooked = false;

  useEffect(() => {
    setMapStyle({
      width: "100%",
      height: "70%",
    });

    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 500, // Increased duration for a slower animation
      useNativeDriver: true,
      easing: Easing.in(Easing.ease) // Correctly use Easing.inOut
    }).start();
  }, []);

  const getRandomColor = (vehicleType ) => {
   
    const colors = {
      'SEDAN': '#9b3e3e',
      'SUV': '#4b48ab',
      'HATCHBACK': '#4b88ab',
      'BIKE': '#9B59B6',
      'AUTO': '#F9D423'
    }
    return colors[vehicleType] || '#000000';
  };


  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff"  />
      <Animated.View 
        style={{
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [screenHeight, 0]
              })
            }
          ],
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 10,
          paddingBottom:10,
          position: 'absolute',
          bottom: 0,
          width: '100%',
          maxHeight: screenHeight * 0.7
        }}
      >
       <View>
        {selectedRide.name === 'Schedule' && isBooked && (
          <>
            <View
              style={[
                vehicleDetailsStyles.detailsContainer,
                {alignItems: 'center', backgroundColor: 'transparent'},
              ]}>
              <BookedTick />
              <View style={{marginLeft: 10}}>
                <Text style={vehicleDetailsStyles.successMsg}>
                  Your scheduled ride booked successfully
                </Text>
                <Text style={vehicleDetailsStyles.successMsgDriver}>
                  Your driver will be assigned 10 minutes before scheduled time
                </Text>
              </View>
            </View>
            <View style={vehicleDetailsStyles.priceContainer}>
              <Text style={vehicleDetailsStyles.priceContainerTxt}>
                Estimated amount to be paid {'\n'}
                <Text style={{fontSize: 12}}>(Price may vary)</Text>
              </Text>
              <Text style={vehicleDetailsStyles.priceTxt}>₹100</Text>
            </View>
          </>
        )}
        <View style={vehicleDetailsStyles.detailsContainer}>
          <View style={vehicleDetailsStyles.vehicleImageContainer}>
            <View style={[vehicleDetailsStyles.vehicleImageBg, {backgroundColor:getRandomColor(selectedVehicle.vehicleType)}]}></View>
            <Image
            style={vehicleDetailsStyles.vehicleImage}
            source={getVehicleDetailsById(selectedVehicle.vehicleType).image}
          />
          </View>
          <View style={{flex:1,justifyContent:'space-between',width:"50%"}}>
            <Text style={vehicleDetailsStyles.name}>
              {getVehicleDetailsById(selectedVehicle.vehicleType).name}
            </Text>
            <View style={vehicleDetailsStyles.durationContainer}>

            {selectedRide.name !== 'Schedule' && (
              <Text style={vehicleDetailsStyles.durationTxt}>
                {' '}
                <DurationBlack /> {selectedVehicle?.timeTakenToPickup}
              </Text>
            )}

            <Text style={vehicleDetailsStyles.durationTxt}>
              {' '}
              <PeopleBlack /> {getVehicleDetailsById(selectedVehicle.vehicleType).capacity}
            </Text>

              
            </View>
           
            {selectedRide.name !== 'Schedule' && (
              <Text style={vehicleDetailsStyles.fareTxt}>
                <FareGreen /> {selectedVehicle.fare} - {selectedVehicle.fareMax}
              </Text>
            )}
          </View>
        </View>
        {selectedRide.name === 'Schedule' && (
          <View style={vehicleDetailsStyles.paymentContainer}>
            <DurationBlack />
            <Text style={vehicleDetailsStyles.dateTimeText}>
              {scheduleDate + '-' + scheduleTime}
            </Text>
            <TouchableOpacity onPress={() => setShowScheduleContainer(true)}>
              <Text style={vehicleDetailsStyles.changeBtn}>Change</Text>
            </TouchableOpacity>
          </View>
        )}
        <AddressContainer directions={directions} />
        <TouchableOpacity 
          style={vehicleDetailsStyles.paymentContainer}
          onPress={() => setShowPaymentOptions(true)}
        >
          <Text style={vehicleDetailsStyles.paymentTxt}>Payment Method</Text>
              <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                <Text style={[vehicleDetailsStyles.paymentTxt,{color:colors.green}]}>{paymentMethod || 'Cash'}</Text>
                <Ionicons name="chevron-down" size={24} color="black" style={{transform:[{rotate:showPaymentOptions ? '180deg' : '0deg'}]}} />
              </View>
          </TouchableOpacity>
        {showPaymentOptions && (
          <View style={vehicleDetailsStyles.paymentOptionsContainer}>
            {paymentOptions.map((option, index) => (
            <TouchableOpacity 
              key={index}
              style={[vehicleDetailsStyles.paymentOption, { borderColor: paymentMethod === option ? colors.green : colors.grey,}]}
              onPress={() => {
                setPaymentMethod(option);
                setShowPaymentOptions(false);
              }}
            >
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: paymentMethod === option ? colors.green : colors.grey,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10
                }}>
                    {paymentMethod === option && (
                    <View style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: colors.green
                    }} />
                  )}
                </View>
                <Text style={vehicleDetailsStyles.paymentTxt}>{option}</Text>
              </View>
            </TouchableOpacity>
            ))}
            
          </View>
        )}
        {isBooked ? (
          <TouchableOpacity
            style={[
              vehicleDetailsStyles.cnfrmBtn,
              {backgroundColor: colors.cance_red},
            ]}
            onPress={HandleBookRide}>
            <Text style={vehicleDetailsStyles.cnfrmBtnTxt}>Cancel Booking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={vehicleDetailsStyles.cnfrmBtn}
            onPress={HandleBookRide}>
            <Text style={vehicleDetailsStyles.cnfrmBtnTxt}>
              Confirm {getVehicleDetailsById(selectedVehicle.vehicleType).name} Ride
            </Text>
          </TouchableOpacity>
        )}
        </View>
      </Animated.View>
      {showScheduleContainer && (
        <View style={{zIndex: 9999, flex: 1}}>
          <ScheduleContainer
            oncloseDateTime={oncloseDateTime}
            onConfirmDateTime={onConfirmDateTime}
            scheduleTime={scheduleDateTime.time}
            scheduleDate={
              new Date(scheduleDateTime.date).toISOString().split('T')[0]
            }
            isUpdate={true}
          />
        </View>
      )}
    </>
  );
};

export default SelectedVehicleDetails;
