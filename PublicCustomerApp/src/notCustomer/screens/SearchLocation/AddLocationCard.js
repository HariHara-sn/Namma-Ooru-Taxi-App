import React, {useRef, useState, useCallback, useEffect} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import PropTypes from 'prop-types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import YourLoc from '../../assets/image/svgIcons/yourLoc.svg';
import EndLoc from '../../assets/image/svgIcons/endLoc.svg';
import Flag from '../../assets/image/svgIcons/flag.svg';
import AddWaypoint from '../../assets/image/svgIcons/addWaypoint.svg';
import {addLocation} from '../../styles/AddLocationStyles';
import DragAndDropCard from '../../components/DragAndDropCard';
import {colors} from '../../constants/constants';
import useLocationStore from '../../store/useLocationStore';
import useMapStore from '../../features/map/store/useMapStore';
import Marker from '../../controllers/NEMap/Marker';
import {useStackScreenStore} from '../../store/useStackScreenStore';
import SearchAPI from '../../controllers/NEMap/Search';
import Directions from '../../controllers/NEMap/Directions';

const AddLocationCard = () => {
  const {directions, setDirections, setSelectedInput, selectedInput} = useLocationStore();
  const {setStackScreen} = useStackScreenStore();
  const {
    mapMarkers,
    setMapMarkers,
    setDirectionPoints,
    setMapClickCallback,
    directionPoints,
    setLoading,
    loading
  } = useMapStore();

  const inputRefs = useRef([]);
  const itemHeight = 80;

  const onFocus = useCallback((id, obj) => {
    setStackScreen('SearchScreen');
    
    setSelectedInput(obj);
  
  }, []);

  const getLocationIcon = useCallback((id, totalLocations) => {
    if (id === 0) {
      return {
        icon: <YourLoc style={addLocation.dragIcons}/>,
        name: 'Start Location',
      };
    } else if (id === totalLocations - 1) {
      return {
        icon: <EndLoc  style={addLocation.dragIcons} width={15} height={15} />,
        name: 'End Location',
      };
    } else {
      return {
        icon: <Flag  style={addLocation.dragIcons} width={15} height={15} />,
        name: `Waypoint`,
      };
    }
  }, []);

    // update newDirections on location reaarange
    const updateDirections = useCallback(directions => {
      const directionPoints = directions
        .map(direction => {
          if (direction.location.length > 0) {
            return {
              lat: direction.location[1],
              lon: direction.location[0],
            };
          } else {
            return null;
          }
        })
        .filter(point => point !== null);
      if (directionPoints.length > 0) {
        setDirectionPoints({locations: directionPoints, type: 'car'});
      } else {
        console.log('No valid direction points found. Not updating state.');
      }
    }, []);

  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex !== toIndex) {
      const newDirections = [...directions];

      // Swap only the locationName and location arrays
      const fromItem = newDirections[fromIndex];
      const toItem = newDirections[toIndex];

      const tempLocationName = fromItem.locationName;
      const tempLocation = fromItem.location;

      fromItem.locationName = toItem.locationName;
      fromItem.location = toItem.location;

      toItem.locationName = tempLocationName;
      toItem.location = tempLocation;
      setDirections(newDirections);
      updateDirections(newDirections);
    }
  };

  const addWaypoints = () => {
    setStackScreen('WaypointScreen');
  };

  const removeWaypoints = id => {
    const filteredData = directions.filter(item => item.id !== id);
    // Rearrange id after deletion
    const newData = filteredData.map((item, index) => ({
      ...item,
      id: index + 1,
      name: item.name.startsWith('Waypoint') ? `Waypoint ${index}` : item.name,
    }));
    setDirections(newData);
    _updateRemoveWaypoints(newData);
  };

  //  remove wave points marker and update directions
  const _updateRemoveWaypoints = useCallback(
    newData => {
      const routeData = newData
        .map(item => {
          return {
            lat: item.location[1],
            lon: item.location[0],
          };
        })
        .filter(point => point.lat !== undefined && point.lon !== undefined);  
      if (routeData.length > 0) {
        setDirectionPoints({ locations: routeData, type: 'car' });
      } else {
        console.log('No valid route data available to set direction points.');
      }
    },
    [directions]
  );
  
// Set route direction when markers are cleared
  const updateRouteDirections = useCallback(
    async (newData) => {
      const sortedDirections = [...newData].sort((a, b) => a.id - b.id);
      const routeData = sortedDirections.map(newData => ({
        lat: newData.location[1],
        lon: newData.location[0],
      })).filter(point => point.lat !== undefined && point.lon !== undefined);  ;
      setDirectionPoints({ locations: routeData, type: 'car' });
      const directions = new Directions();
      // const response = 
      await directions.findRoute(routeData);
      // console.log(response, 'routeData')
    },
    [directions],
  );
  
    // Set route direction when markers are updated
    const setRouteDirection = useCallback(
      async directions => {
        if (directions.length >= 2) {
          // Create a copy of the directions before sorting
          const sortedDirections = [...directions].sort((a, b) => a.id - b.id);
    
          const routeData = sortedDirections.map(direction => ({
            lat: direction.lat,
            lon: direction.lng,
          }));
    
          setMapMarkers([]); 
          setDirectionPoints({ locations: routeData, type: 'car' });
          
         
          
        } else {
          setDirectionPoints(null); 
        }
      },
      [setDirectionPoints, setMapMarkers]
    );

    // add map markers on map click
  const addMapMarkers = useCallback(
    (item, markerType) => {
        const marker = new Marker(
          String(selectedInput.id),
          item?.name || Math.random().toString(),
          item?.longitude,
          item?.latitude,
          markerType,
          36,
          true,
        );
        const updatedMarkers = [...mapMarkers];
        const existingIndex = updatedMarkers.findIndex(
          m => m.type === markerType,
        );
        if (existingIndex !== -1) {
          updatedMarkers[existingIndex] = marker;
        } else {
          updatedMarkers.push(marker);
        }
        setMapMarkers(updatedMarkers);
        setRouteDirection(updatedMarkers);
    },
    [directionPoints],
  );

  // update location name when markers updated in map
  const updateLocationNames = async (data, input) => {
    const {latitude, longitude} = data;
    const address = await fetchAddressName(latitude, longitude, true);
    const newDirections = directions.map((dir) =>
      dir.id === input.id
        ? {
            ...dir,
            locationName: address,
            location: [longitude, latitude],
          }
        : dir,
    );
    setDirections(newDirections);
    if (!directionPoints) {
      addMapMarkers(data);
    } else {
      updateRouteDirections(newDirections);
    }
  };

  const fetchAddressName = async (lat, lng) => {
    const coordinates = [lat, lng];
    try {
      const search = new SearchAPI();
      const response = await search.reverseGeocode(coordinates);
      if (response) {
        return (
          response?.properties?.street ||
          response?.properties?.name ||
          "Unnamed Location"
        );
      }
    } catch (e) {
      console.error("Failed to fetch address", e);
      return "";
    }
  };

  // locate on map 
  const mapClickCallback = async (data) => {
   
    if (selectedInput === null) return false;
    
    if (selectedInput.name === 'Start') {
      updateLocationNames(data, selectedInput, 'marker_start')
    } else if (selectedInput.name === 'End') {
      updateLocationNames(data, selectedInput, 'marker_end')
    } else {
      updateLocationNames(data, selectedInput, 'marker_waypoint')
    }
    setSelectedInput(null);
  };

  useEffect(() => {
    setMapClickCallback(mapClickCallback);
  }, [selectedInput]);

  return (
    <View style={{backgroundColor: colors.white, paddingVertical: 5}}>
      <View style={addLocation.addLocationContainer}>
        <View style={{width:'88%'}}>
          {directions.map((direction, index) => (
            <React.Fragment key={direction.id}>
              <DragAndDropCard
                index={index}
                length={directions.length}
                itemHeight={itemHeight}
                topOffset={0}
                onDragEnd={(dragIndex, hoverIndex, isMoved) => {
                  console.log(
                    `Dragged from ${dragIndex} to ${hoverIndex} - Moved: ${isMoved}`,
                  );
                  if (isMoved) return moveItem(dragIndex, hoverIndex);
                  if (!isMoved && inputRefs.current[hoverIndex])
                    inputRefs.current[hoverIndex].focus();
                }}>
                <Text style={addLocation.inputHeader}>
                  {direction?.name?.includes('Waypoint') ? direction.name : getLocationIcon(index, directions.length).name}
                </Text>
                <View style={addLocation.draggableCard}>
                  {getLocationIcon(index, directions.length).icon}
                  <TextInput
                    ref={el => (inputRefs.current[index] = el)}
                    style={addLocation.draggableInput}
                    value={direction.locationName ? `${direction.locationName.charAt(0).toUpperCase()}${direction.locationName.slice(1)}${direction.locationAddress ? `, ${direction.locationAddress}` : ''}` : ''}
                    onFocus={() => onFocus(index, direction)}
                    selection={{start: 0}}
                    // editable={false}
                  />
                  {getLocationIcon(index, directions.length).name === 'Waypoint' && (
                    <TouchableOpacity onPress={() => removeWaypoints(direction.id)}>
                      <Ionicons name={'close'} size={20} />
                    </TouchableOpacity>
                  )}
                </View>
              </DragAndDropCard>
              {index !== directions.length - 1 && (
                <View style={addLocation.divider} />
              )}
            </React.Fragment>
          ))}
        </View>
        <TouchableOpacity
          style={addLocation.waypointsbtn}
          onPress={() => addWaypoints()}>
          <AddWaypoint />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddLocationCard;

AddLocationCard.propTypes = {
  screenType: PropTypes.string,
};
