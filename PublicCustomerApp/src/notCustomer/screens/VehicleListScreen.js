import { Text, View, Image, TouchableOpacity, StatusBar, Dimensions, Animated, Easing } from 'react-native'; // Import Easing here
import React, { useEffect, useRef } from 'react';
import { vehicleList } from '../styles/AddLocationStyles';
import Duration from '../assets/image/duration.svg';
import People from '../assets/image/people.svg';
import useSelectedVehicleStore from '../store/useSelectedVehicleStore';
import { getVehicleDetailsById } from '../constants/JsonData';
import { Fonts, colors } from '../constants/constants';
import useRideSelectionStore from '../store/useRideSelectionStore';
import NavBar from '../components/NavBar';
import { useStackScreenStore } from '../store/useStackScreenStore';
import useMapStyleStore from '../store/useMapStyleStore';
import useVehicleLocationStore from '../store/useVehicleLoactionStore';
import SelectedVehicle from './SelectedVehicle';
import { Directions } from 'react-native-gesture-handler';
import Marker from "../controllers/NEMap/Marker";
import useMapStore from '../features/map/store/useMapStore';
import useLocationStore from '../store/useLocationStore';
const VehicleListScreen = () => {
  const { goBack, setStackScreen } = useStackScreenStore();
  const { setSelectedVehicle ,  selectedVehicle} = useSelectedVehicleStore();
  const { vehicleList: vehicles } = useRideSelectionStore();
  const { setMapStyle, resetMapStyle } = useMapStyleStore();
  const { location } = useLocationStore();
  const { setCurrentVehicleType } = useVehicleLocationStore();
  const { setMapMarkers, mapMarkers } = useMapStore();
  
  const screenHeight = Dimensions.get('window').height;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Function to calculate map height based on vehicle count
  const calculateMapHeight = (vehicleCount) => {
    if (vehicleCount === 0) {
      return "90%"; // Full height when no vehicles
    } else if (vehicleCount === 1) {
      return "85%"; // Slightly less for single vehicle
    } else if (vehicleCount === 2) {
      return "80%"; // Medium height for 2 vehicles
    } else if (vehicleCount <= 4) {
      return "75%"; // Standard height for 3-4 vehicles
    } else {
      return "70%"; // Reduced height for 5+ vehicles
    }
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    console.log('vehicle-->>', vehicle)
    setCurrentVehicleType((vehicle.vehicleType).toLowerCase());
  };

  const handleVehicleSelection=()=>{
    resetMapStyle()
    setStackScreen('SelectedVehicle');
  }
  // useEffect(() => {
  //   if (currentVehicleType === "none") {
  //     // removeAllMarkers(mapMarkers)
  //     const marker = new Marker(
  //       '1',
  //       'currentLocation',
  //       location[0],
  //       location[1],
  //       'marker_start',
  //       36,
  //       true
  //     );
      
  //     setMapMarkers([marker]);
     
  //   } else {
  //     if (currentVehicleType === "all") {
  //       let allVehicleMarkers = [];
  //       Object.values(vehicleLocations).forEach(vehicleArray => {
  //         if (vehicleArray && vehicleArray.length > 0) {
  //           const markers = vehicleArray.map(vehicle => {
  //             return new Marker(
  //               vehicle.id,
  //               'car',
  //               vehicle.longitude, 
  //               vehicle.latitude,
  //               vehicleArray,
  //               36,
  //               true,
  //               266.6896667480469

  //             );
  //           });
  //           allVehicleMarkers = [...allVehicleMarkers, ...markers];
  //         }
  //       });
  //       setMapMarkers(allVehicleMarkers);
  //     } else {
  //       const vehicleMarkers = vehicleLocations[currentVehicleType].map(vehicle => {
  //         return new Marker(
  //           vehicle.id,
  //           'car',
  //           vehicle.longitude,
  //           vehicle.latitude, 
  //           currentVehicleType,
  //           36,
  //           true,
  //           266.6896667480469
  //         );
  //       });
  //       console.log('vehicleMarkers-->>', vehicleMarkers)
  //       setMapMarkers(vehicleMarkers);
  //     }
  //   }
    
  // }, [currentVehicleType, vehicleLocations]);
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start();

    setTimeout(() => {
      setMapStyle({
        width: "100%",
        height: calculateMapHeight(vehicles.length),
        transition: 'all 5s ease-in-out',
      });
    }, 50);

  
    // Auto select first vehicle
    if (vehicles.length > 0) {
      handleVehicleSelect(vehicles[0]);
    }
  }, [vehicles.length]);

  const onBackPress = () => {
    setSelectedVehicle(null)
    resetMapStyle();
    goBack();
    setCurrentVehicleType('none')
  };
  const getRandomColor = (vehicleType ) => {
    console.log('vehicleType-->>', vehicleType)
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavBar onBackPress={onBackPress} title={'Choose Vehicle'} />
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
          maxHeight: screenHeight * 0.7,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        
          
        }}
      >
        <View>
          {vehicles.map((item, idx) => {
            
            const vehicleDetails = getVehicleDetailsById(item.vehicleType);
            return (
              <TouchableOpacity key={idx} style={[vehicleList.cards, selectedVehicle?.vehicleType === item?.vehicleType && { backgroundColor: colors.grey_xlight}]} onPress={() => handleVehicleSelect(item)}>
                <View style={vehicleList.imageContainer}>
                  <View style={[vehicleList.imageBg, {backgroundColor:getRandomColor(item.vehicleType)}]}>

                  </View>
                  <Image
                    source={vehicleDetails.image}
                    style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                  />
                </View>
                <View style={vehicleList.vehicleDetails}>
                  <Text style={vehicleList.vehicleName}>{vehicleDetails.name}</Text>
                  <View style={vehicleList.vehicleDetailsContainer}>
                    <View style={vehicleList.vehicleDetailsTxt}>
                      <Duration />
                      <Text style={{ fontFamily: Fonts.light, color: colors.black, fontSize:12 }}>{item.timeTakenToPickup || ''} mins away</Text>
                    </View>
                    <View style={vehicleList.vehicleDetailsTxt}>
                      <People />
                      <Text style={{ fontFamily: Fonts.light, color: colors.black }}>{item.passengerCount}</Text>
                    </View>
                  </View>
                </View>
                <View style={vehicleList.priceDetails}>
                  <Text style={vehicleList.totalPrice}>₹{item.fare} - {item.fareMax}</Text>
                  {item.discount_price > 0 && (
                    <Text style={vehicleList.discountPrice}>
                      {item.discount_price}% off
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {selectedVehicle  && <TouchableOpacity style={vehicleList.confirmBtn} onPress={()=>handleVehicleSelection()}>
          <View style={vehicleList.confirmBtnTxtContainer}>
          <Text style={vehicleList.confirmBtnTxt}>Confirm {selectedVehicle?.vehicleType}</Text>
          </View>
         
        </TouchableOpacity> }
      </Animated.View>
    </>
  );
};

export default VehicleListScreen;
