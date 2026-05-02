import React, {useCallback, useMemo} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import {debounce} from 'lodash';
import {colors, Fonts} from '../constants/constants';
import NavBar from '../components/NavBar';
import {useStackScreenStore} from '../store/useStackScreenStore';
import useMapStore from '../features/map/store/useMapStore';
import useLocationStore from '../store/useLocationStore';
import Marker from '../controllers/NEMap/Marker';

const SearchScreen = () => {
  const {goBack} = useStackScreenStore();
  const {
    setSearchUnit,
    onSearchResults,
    searchUnit,
    setOnSearchResults,
    setMapMarkers,
    mapMarkers,
    setDirectionPoints,
    directionPoints,
  } = useMapStore();
  const {selectedInput, setSelectedInput,setDirections, directions} = useLocationStore();

  // Debounce the search input to limit API calls 
  const debouncedSetSearchUnit = useMemo(
    () =>
      debounce(value => {
        setSearchUnit(value);
      }, 500),
    [setSearchUnit],
  );

  // Memoize the input change handler to avoid unnecessary re-renders
  const _onChangeText = useCallback(
    value => {
      debouncedSetSearchUnit(value);
    },
    [debouncedSetSearchUnit],
  );

  // Set route direction when markers are updated
  const setRouteDirection = useCallback(
    directions => {
      if (directions.length >= 2) {
        const sortedDirections = directions.sort((a, b) => a.id - b.id);
        const routeData = sortedDirections.map(direction => ({
          lat: direction.lat,
          lon: direction.lng,
        }));
        setMapMarkers([]);

        setDirectionPoints({locations: routeData, type: 'car'});
      } else {
        setDirectionPoints(null);
      }
    },
    [setDirectionPoints, setMapMarkers],
  );

  // Set route direction when markers are removed
  const updateRouteDirections = useCallback(
    newData => {
      const input = selectedInput.id;
      const routeData = directions.map(item => {
        if (item.id === input) {
          return {
            lat: newData.latitude,
            lon: newData.longitude,
            locationName: newData.address,
          };
        } else if (item.location && item.location.length > 1) {
          return {
            lat: item.location[1] !== undefined ? item.location[1] : null,
            lon: item.location[0] !== undefined ? item.location[0] : null,
          };
        } else {
          return null;
        }
      }).filter(point => point !== null && point.lat !== null && point.lon !== null);
      // console.log('hari-->>route-->>', routeData);
      setDirectionPoints({ locations: routeData, type: 'car' });
      goBack();
    },
    [selectedInput, directions]
  );
  

  // add map markers if route not added
  const addMapMarkers = useCallback(
    (item, markerType) => {
      if (!directionPoints) {
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
        marker.setFocus(true);
        goBack();
      } else {
        updateRouteDirections(item);
      }
    },
    [directionPoints],
  );

  // onpress on search results
  const onLocationNamePress = useCallback(
    item => {
      const input = selectedInput.id - 1;
      const newDirections = directions.map((dir, index) =>
        index === input
          ? {
              ...dir,
              locationName: item.address || item.name,
              location: [item.longitude, item.latitude],
            }
          : dir,
      );
      setDirections(newDirections);
      setOnSearchResults(null);
      setSearchUnit('');

      if (selectedInput.id === 1) {
        addMapMarkers(item, 'marker_start');
      } else if (selectedInput.id === directions.length - 1) {
        addMapMarkers(item, 'marker_end');
      } else {
        addMapMarkers(item, 'marker_waypoint');
      }
    },
    [directions],
  );

  const onGoBack = () =>{
    goBack(),
    setSelectedInput(null) // to disable locate on map when goBack
  }

  return (
    <View style={styles.screen}>
      <NavBar onBackPress={onGoBack} title={'Search Location'} />
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Search"
          style={styles.input}
          onChangeText={_onChangeText}
          autoFocus
        />
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => setSearchUnit('')}>
          <AntDesign name="close" color={colors.black} size={22} />
        </TouchableOpacity>
      </View>
      {onSearchResults?.searchResults?.length > 0 && searchUnit.length > 0 && (
        <ScrollView contentContainerStyle={{paddingBottom: 80}}>
          {onSearchResults.searchResults.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.resultsBtn}
              onPress={() => onLocationNamePress(item)}>
              <Text style={styles.resultsBtnName}>{item.name}</Text>
              <Text style={styles.resultsBtnAdd}>{item.address}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <TouchableOpacity style={styles.bottomBtn} onPress={()=>goBack()}>
        <Entypo name="location" size={18} color={colors.black} />
        <Text style={styles.bottomBtnTxt}>Locate on Map</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  inputContainer: {
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 0.3,
    paddingHorizontal: 5,
    elevation: 5,
    backgroundColor: colors.white,
    marginTop: 10,
  },
  closeBtn: {
    width: '12%',
    aspectRatio: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '85%',
  },
  bottomBtn: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  bottomBtnTxt: {
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 16,
    marginLeft: 15,
  },
  resultsBtn: {
    width: '90%',
    alignSelf: 'center',
    marginVertical: 5,
    borderBottomWidth: 0.3,
    paddingBottom: 8,
  },
  resultsBtnName: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.black,
  },
  resultsBtnAdd: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: colors.black,
  },
});
