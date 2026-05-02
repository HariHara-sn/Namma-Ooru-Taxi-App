import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import NavBar from '../components/NavBar';
import {useStackScreenStore} from '../store/useStackScreenStore';
import useSelectedVehicleStore from '../store/useSelectedVehicleStore';
import useLocationStore from '../store/useLocationStore';
import useRideSelectionStore from '../store/useRideSelectionStore';
import useMapStore from '../features/map/store/useMapStore';


import {showNotification} from '../components/NotificationManger';
import locationTask from '../controllers/GetCurrentLocation';

import SearchLoader from '../components/Loaders/SearchLoader';
import {cancelRideMutation, createRideMutation} from '../API/APICalls/RideAPICalls';
import FullScreenLoader from '../components/Loaders/FullScreenLoader';
import SelectedVehicleDetails from '../components/SelectedVehicleDetails';
import useMapStyleStore from '../store/useMapStyleStore';
    

const SelectedVehicle = () => {
 
  const {goBack, setStackScreen} = useStackScreenStore();
  const {selectedVehicle} = useSelectedVehicleStore();

  const {directions, setDirections} = useLocationStore();
  const {setBookingDetails, tripFor, selectedContact, paymentMethod, rideDuration, selectedRide, rideDistance} = useRideSelectionStore();
  const {setMapStyle,resetMapStyle} = useMapStyleStore();
  const {
    setOnSearchResults,
    setMapMarkers,
    setDirectionPoints,
    setSearchUnit,
  } = useMapStore();

  const timeoutIdRef = useRef(null);


  const onBackPress = () => {
    resetMapStyle();
    goBack();
  };

 

  const onBookingSuccess = data => {
    if (data.success) {
     
      setBookingDetails(data?.trip);
      // showNotification('Searching for Vehicle', '', 'success');
      setStackScreen('TripScreenManager');
      // setAssignedDriver(Driver)
    }
  };

  

  const onCancelSuccess =async (data) => {
    if (data.success) {
      showNotification(data.message, '', 'success');
      setBookingDetails(null);
      setDirections([
        { id: 1, name: 'Start', location: [], locationName: '' },
        { id: 2, name: 'End', location: [], locationName: '' },
      ]);
      setOnSearchResults(null);
      setMapMarkers([]);
      setDirectionPoints(null);
      setSearchUnit('');
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      
      setStackScreen('Home')
      await locationTask.getCurrentLocation();
    }
  }

  // Clear timeout on component unmount
  useEffect(() => {
    setMapStyle({
      width: "100%",
      height: "60%",
    });
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const {mutate: BookingMutate, isLoading: isBookRideLoading} =
    createRideMutation(onBookingSuccess);

  const {mutate: cancelRideMutate, isLoading: isCancelRideLoading} =
    cancelRideMutation(onCancelSuccess);

  const HandleBookRide = async () => {
    
    if (directions.length < 2) {
     showNotification(
        'Please select start and end location',
        'Please select start and end location',
        'danger',
      );
      return
    }
  
    if (!selectedVehicle || Object.keys(selectedVehicle).length <= 0) {
       showNotification(
        'Please select a vehicle',
        'Please select a vehicle',
        'danger',
      );
      return
    }
   
    let start_location = directions.filter(item => item.name == 'Start')[0];

    let end_location = directions.filter(item => item.name == 'End')[0];
   
    // let waypoints = directions.filter(item => item.name == 'Waypoint');
    // let trip_type = getTripTypeValue(selectedTrip.id);
   
    
    let vehicle_type = selectedVehicle.vehicleType;
    let tripEstimatedPrice = selectedVehicle.fare;
    let maxFare = selectedVehicle.fareMax;
    
   
    let distance = rideDistance * 1000; // Convert to meters
    let estimatedDuration = rideDuration;
    let bookingFor = tripFor == "For Myself" ? "MYSELF" : "OTHERS";
    let bookingForName = selectedContact.name 
    let bookingForPhone = selectedContact.phone
 
    let payload = {
      startLocation: [ start_location.location[0],start_location.location[1]],
      endLocation: [end_location.location[0],end_location.location[1]],
      stops: [
        {name:'Pickup Point',location:[start_location.location[0],start_location.location[1]],address:start_location.locationName},
        {name:'Drop Point',location:[end_location.location[0],end_location.location[1]],address:end_location.locationName},
      ],
      vehicleType: vehicle_type,
      passangerCount: 1,
      pickupTime: "234243242342",
      estimatedFare: tripEstimatedPrice,
      distance: distance,
      estimatedDuration: estimatedDuration,
      bookingFor: bookingFor,
      bookingForName: bookingForName,
      bookingForPhone: bookingForPhone,
      maxFare: maxFare,
      paymentMethod: paymentMethod.toUpperCase(),
    };
    console.log('payload-->>', payload)
    
    BookingMutate(payload);
    setBookingDetails(payload);
  };

  const onCancelRide = () => {
    // {"message": "Ride created successfully",
    //    "ride": {"acknowledged": true,
    //      "insertedId": "66f1506af7e54f72cfe7b0f5"}, "success": true}
    // const payload = {
    //   rideId:bookingDetails?.ride?.insertedId
    // }
    // cancelRideMutate(payload)
    goBack()
  }
  

  return (
        <>
          {(isBookRideLoading || isCancelRideLoading) && (
            <View style={{width: '100%', height: '100%', zIndex: 9999}}>
              <FullScreenLoader />
            </View>
          )}
          <NavBar title={'Choose Your Ride'} onBackPress={onBackPress} />
          <SelectedVehicleDetails
            selectedVehicle={selectedVehicle}
            HandleBookRide={HandleBookRide}
            selectedRide={selectedRide}
          />
        </>
    
  );
};

export default SelectedVehicle;
