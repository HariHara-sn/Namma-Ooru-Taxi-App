import {Animated, Text, TouchableOpacity, View} from 'react-native';
import React, {useCallback, useRef, useState,useEffect} from 'react';
import NavBar from '../../components/NavBar';
import {useStackScreenStore} from '../../store/useStackScreenStore';
import AddLocationCard from './AddLocationCard';
import useLocationStore from '../../store/useLocationStore';
import useMapStore from '../../features/map/store/useMapStore';
import locationTask from '../../controllers/GetCurrentLocation';
import {addLocation} from '../../styles/AddLocationStyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useRideSelectionStore from '../../store/useRideSelectionStore';
import TripType from './TripType';
import RideType from './RideType';
import ScheduleContainer from './ScheduleContainer';
import { rideType } from '../../constants/JsonData';
import { rideEstimation } from '../../API/APICalls/RideAPICalls';
import FullScreenLoader from '../../components/Loaders/FullScreenLoader';
import useMapStyleStore from '../../store/useMapStyleStore';
import { colors } from '../../constants/constants';
import Contactsheet from '../../components/Contactsheet';
import useUserInfoStore from '../../../common/store/useUserInfoStore';
import { findRoute } from '../../controllers/NEMap/findRoute';
const SearchLocation = () => {
  const {userdetails} = useUserInfoStore();
  const {goBack,setStackScreen} = useStackScreenStore();
  const {setDirections, directions, setSelectedInput, selectedInput} = useLocationStore();
  const {setMapStyle,resetMapStyle} = useMapStyleStore();
  const {
    setOnSearchResults,
    setMapMarkers,
    setDirectionPoints,
    setSearchUnit,
    directionPoints,
  } = useMapStore();

  const {setSelectedTrip, selectedTrip, selectedRide, setSelectedRide, scheduleDateTime, setScheduleDateTime,vehicleList, setVehicleList, tripFor, setSelectedContact,setRideDistance,setRideDuration,rideDistance} =
    useRideSelectionStore();

  const [isHidden, setIsHidden] = useState(false);
  const [showTripFor, setShowTripFor] = useState(false);
  const [selectedContent] = useState('');
  const [showScheduleContainer, setShowScheduleContainer] = useState(false);

  const bounceValue = useRef(new Animated.Value(1200)).current;

  const _toggleSubview = useCallback(() => {
    let toValue = 0;
    if (isHidden) {
      toValue = 1200;
    }
    Animated.spring(bounceValue, {
      toValue: toValue,
      velocity: 12,
      tension: 8,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setIsHidden(!isHidden);
  }, [isHidden]);

  const onBackPress = async () => {
    resetMapStyle();
    if (vehicleList.length !== 0) return setVehicleList([])
    setDirections([
      {id: 1, name: 'Start', location: [], locationName: ''},
      {id: 2, name: 'End', location: [], locationName: ''},
    ]);
    setOnSearchResults(null);
    setMapMarkers([]);
    goBack();
    setDirectionPoints(null);
    setSearchUnit('');
    setSelectedInput(null);
    await locationTask.getCurrentLocation();
    
  };

  useEffect(() => {
    setMapStyle({
      width: "100%",
      height: "70%",
      bottom: 0,
    });
    setSelectedContact({name:userdetails.name,phone:userdetails.phone})
  }, []);


  useEffect(() => {
    const fetchRoute = async () => {
      if (directions) {
        const res = await findRoute(directions);

        const response = res?.response;
        
        if(response && response?.trip?.summary){
          
  
           setRideDistance(response?.trip?.summary?.length)
           setRideDuration(response?.trip?.summary?.time)
           
        }
      }
    };
    
    fetchRoute();
  }, [directions]);

  const onEstimationSuccess = (data) => {
    if (data?.data == null){
      return alert('No vehicle available')
    }
   
    if (!data?.data) return;
    setVehicleList(data.data);
    if (data.data.length !== 0) {
      setStackScreen('VehicleList');
    }
  };

  const {mutate: estimationMutate, isLoading: isEstimationLoading} =
    rideEstimation(onEstimationSuccess);

  const onConfirm = () => {
    let start_location = directions.filter(item => item.name == 'Start')[0]

    let payload = {
      pickupLocation: [start_location.location[0],start_location.location[1]],
      distance: rideDistance,
      

      // waypoints: waypoints.map(item => { return { lat: item.location[0], lon: item.location[1] } }),
      // trip_type: trip_type,
    }
    
    estimationMutate(payload)
  };

  const onTripSelect = item => {
    setSelectedTrip(item);
    _toggleSubview();
  };

  const onRideSelect = item => {
    setSelectedRide(item);
    if (item.name === 'Schedule') {
      setShowScheduleContainer(true)
    } else {
      _toggleSubview();
      setScheduleDateTime(null);
    }
  };

  const oncloseDateTime = () => {
    setShowScheduleContainer(false)
    if (scheduleDateTime) return 
    setSelectedRide(rideType[0])
  }

  const onConfirmDateTime = () => {
    setShowScheduleContainer(false)
    _toggleSubview();
  }

  const onTripForPress = () => {
    setShowTripFor(true)
  }

  const getplace = () => {
   
    if(selectedInput?.name === 'Start'){
      return 'start location'
    }else if(selectedInput?.name === 'End'){
      return 'destination'
    }else if(selectedInput?.name.startsWith('Waypoint')){
      return `stop ${selectedInput?.id-1}`
    }
    else{
      return 'destination'
    }
  }


  return (
    <>
      {isEstimationLoading && <FullScreenLoader />}
      <NavBar withBg onBackPress={onBackPress} title={'Plan your trip'} />
      
    
  
      <View style={addLocation.rideSelectionContainer}>
        {/* <TouchableOpacity
          style={addLocation.rideSelection}
          onPress={() => onTripTypePress()}>
          <Onway />
          <Text style={addLocation.rideSelectionTxt}>{selectedTrip.name}</Text>
          <Ionicons name={"chevron-down"} size={14} color={"white"} />
        </TouchableOpacity> */}
        <TouchableOpacity style={addLocation.rideSelection}  onPress={() => onTripForPress()}>
        <Ionicons name="person" size={18} color={colors.white} />
        <Text style={addLocation.rideSelectionTxt}>{tripFor}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.white} />
      </TouchableOpacity>
      </View>
      <AddLocationCard screenType={'searchLocation'} />
      {selectedInput && <Text style={{width:'fit-content',backgroundColor:colors.grey_xxlight,color:colors.black,elevation:10,marginTop:10,fontSize:16,paddingVertical:5,paddingHorizontal:15,textAlign:'center',alignSelf:'center',borderRadius:10}}>Mark {getplace()} in map</Text>}
      {directionPoints && (
        <TouchableOpacity
          style={addLocation.confirmBtn}
          onPress={() => onConfirm()}>
          <View style={addLocation.confirmBtnTxtContainer}>
            <Text style={addLocation.confirmBtnTxt}>CONFIRM  DESTINATION</Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </View>
        </TouchableOpacity>
      )}
      <Animated.View
        onPress={() => console.log('pressed')}
        style={[
          addLocation.rideOptionContainer,
          { transform: [{ translateY: bounceValue }] },
        ]}>
        {selectedContent === 'TripType' && (
          <TripType
            _toggleSubview={_toggleSubview}
            onTripSelect={onTripSelect}
            selectedTrip={selectedTrip}
          />
        )}
        {selectedContent === 'RideType' && (
          <RideType
            _toggleSubview={_toggleSubview}
            onTripSelect={onRideSelect}
            selectedRide={selectedRide}
          />
        )}
      </Animated.View>
      {showScheduleContainer &&
        <ScheduleContainer oncloseDateTime={oncloseDateTime} onConfirmDateTime={onConfirmDateTime} />
      }
      {showTripFor &&
       
       <Contactsheet onClose={() => setShowTripFor(false)} onConfirm={() => setShowTripFor(false)} />
      }
      {/* {vehicleList.length !== 0 && 
        <VehicleListScreen vehicleListData={vehicleList}/>
      } */}
    </>
  );
};

export default SearchLocation;
