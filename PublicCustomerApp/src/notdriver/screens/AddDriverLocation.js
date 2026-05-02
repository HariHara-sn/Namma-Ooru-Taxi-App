import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {debounce} from 'lodash';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import usePublicDriverStore from '../store/usePublicDriverStore';
import Marker from '../../common/map/Marker';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import UseBackButton from '../../common/hooks/UseBackButton';
import { Colors, Fonts } from '../../common/constants/constants';
import { RouteScreenStyles } from '../styles/RouteScreenStyles';
import TrackingMapIcons from '../../common/components/Alerts/TrackingMapIcons';
import useLocationStore from '../../common/store/useLocationStore';
import { clearAllStateVectors, clearSingleStateVector, performSearch } from '../../common/map/NESearch';
import { height, width } from '../../common/utils/scalingutils';
import NavBar from '../../common/components/NavBar';
import LocationPicker from '../components/LocationPicker';
import SearchResult from '../components/SearchView/SearchResult';
import StateVectorConatiner from '../components/SearchView/StateVectorConatiner';
import APIRequest from '../../common/controllers/APIRequest';
import AlertModal from '../components/AlertModal';
import locationTask from '../../common/controllers/GetCurrentLocation';
import { checkFineLocationPermissions, RequestFineLocationPermission } from '../../common/controllers/PermissionHandler';
import { showNotification } from '../../common/components/Alerts/showNotification';
import { useTranslation } from 'react-i18next';
import useUserStore from '../../common/store/useUserStore';
import SearchAPI from '../../notCustomer/controllers/NEMap/Search';
import { firebaselog_onBoarding } from '../../common/utils/FirebaseAnalytics';

const CACHE_EXPIRY = 5 * 60 * 1000;
const searchCache = new Map();

const AddDriverLocation = ({isPassanger, updatePassangerLocation, isGeofenceSearch, onCloseIconPress, updateMapMarker,fromDriverEntry = false}) => {
  const {goBack} = useStackScreenStore();
  const {setMapClickCallback, setMapMarkers, setUserLocation, setMapLocation, setOnMapCenterChanged, setOnMapRotationChanged, mapMoving, setMapMoving, userLocation} =
    useMapMarkerStore();
  const { onSearchResults, setOnSearchResults } = useMapMarkerStore();
  const { setDriverInfo, driverInfo } = usePublicDriverStore();

  const [isLoding, setIsLoading] = useState(false);
  const [addressName, setAddressName] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  // Store initial location for change detection
  const initialLocationRef = useRef(null);
  useEffect(() => {
    if (!initialLocationRef.current && driverInfo?.homeLocation) {
      initialLocationRef.current = {
        coordinates: driverInfo?.homeLocation?.coordinates || null,
        addressName: driverInfo?.homeLocation?.addressName || '',
      };
    }
  }, [driverInfo]);
  // Helper to compare current location with initial
  const isLocationChanged = () => {
    const initial = initialLocationRef.current;
    if (!initial) return !!selectedAddress;
    if (!selectedAddress) return false;
    // Check if lat/lng are within 100 meters
    const prevLat = initial.coordinates?.[0];
    const prevLng = initial.coordinates?.[1];
    const currLat = selectedAddress.lat;
    const currLng = selectedAddress.lng;
    if (prevLat != null && prevLng != null && currLat != null && currLng != null) {
      // Haversine formula
      const toRad = x => x * Math.PI / 180;
      const R = 6371000; // meters
      const dLat = toRad(currLat - prevLat);
      const dLng = toRad(currLng - prevLng);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(toRad(prevLat)) * Math.cos(toRad(currLat)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      if (distance < 500 && selectedAddress.address === (initial.addressName || '')) {
        return false;
      }
    }
    return (
      selectedAddress.lat !== prevLat ||
      selectedAddress.lng !== prevLng ||
      selectedAddress.address !== (initial.addressName || '')
    );
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const {location, setSelectedInput} = useLocationStore();
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const [stateVector, setStateVector] = useState(null);
  const [matchedStrings, setMatchedStrings] = useState([]);
  const {t} = useTranslation()
  const [showLocationModal, setShowLocationModal] = useState(false);

  const {userInfo} = useUserStore()

  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const {setLocationCompleteStatus} = usePublicDriverStore();

  const searchRef = useRef(new SearchAPI());

    // Region configuration
    const REGIONS = useMemo(() => [
      { id: 1, name: 'India', value: 'india' },
      // { id: 2, name: 'United States', value: 'united states' }
    ], []);
  
    const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);

    const {setIsApproved} = usePublicDriverStore();

  const searchInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // const fetchAddressName = async (lat, lng) => {
  //   const coordinates = [lat, lng];
  //   try {
  //     const search = new SearchAPI();
  //     const response = await search.reverseGeocodeV2(coordinates);
  //     if (response) {
  //       return (
  //         response?.properties?.street ||
  //         response?.properties?.name ||
  //         'Unnamed Location'
  //       );
  //     }
  //   } catch (e) {
  //     console.error('Failed to fetch address', e);
  //     return '';
  //   }
  // };

  const updateUserLocation = async (coordinates, fromSearch=false) => {
    console.log("coordinates",JSON.stringify(coordinates));
    setIsLoading(true);
    const {latitude, longitude} = coordinates;
    if (!fromSearch) {
      // const address = await fetchAddressName(latitude, longitude);
      const response = await searchRef.current.reverseGeocode(longitude, latitude); 
      console.log("response",JSON.stringify(response));
      // setAddressName(address);
      // setSelectedAddress({
      //   lat:latitude,
      //   lng:longitude,
      //   address: address
      // })
    }
    setUserLocation([latitude, longitude]);
    const userMarker = new Marker(
      'location 1',
      'userMarker',
      longitude,
      latitude,
      'pin_inactive',
      36,
      true,
    );
    userMarker.setFocus(true);
    userMarker.setAnimate(false);
    // setMapMarkers([userMarker]);
    setMapLocation({
      lat:latitude,
      lng:longitude,
      maxZoom: 16,
      zoom: 16,
    });
    setIsLoading(false);
  };

  const currentLocationCallBack = coordinates => {
    updateUserLocation({
      latitude: coordinates.coords.latitude,
      longitude: coordinates.coords.longitude,
    });
  };

  useEffect(() => {
    if(location && fromDriverEntry){
      console.log("location",JSON.stringify(location));
      updateUserLocation({latitude: location?.[1] , longitude: location?.[0] }, true);
    }
  }, [])

  const onClosePress = () => {
    if (isGeofenceSearch) {
      onCloseIconPress()
    }
    setOnSearchResults(null)
    setAddressName('')
    setSelectedAddress(null)
    Keyboard.dismiss();
  }

  const getSearchData = (searchData) => {
    const order = [
      { key: 'fastMatch', title: 'fast_match' },
      { key: 'fullSearch', title: 'full_search' },
      { key: 'area', title: 'area' },
      { key: 'city', title: 'city' },
      { key: 'street', title: 'street' },
      { key: 'district', title: 'district' },
      { key: 'state', title: 'state' },
      { key: 'country', title: 'country' },
      { key: 'postcode', title: 'postcode' },
    ];

    return order.reduce((arr, { key, title }) => {
      if (searchData?.[key]) {
        arr.push({
          title,
          data: searchData[key],
        });
      }
      return arr;
    }, []);
  }


  const searchAPI = useCallback(
    async (value, statevectore = {}, fullSearch = false) => {
      try {
       
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

      
        abortControllerRef.current = new AbortController();

        const normalizedStateVector = statevectore || {};
        const stateVectorStr = JSON.stringify(normalizedStateVector);
        const cacheKey = `${value.toLowerCase().trim()}_${stateVectorStr}`;
        const cachedResult = searchCache.get(cacheKey);

       
        if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_EXPIRY) {
          setOnSearchResults(cachedResult.results);
          setMatchedStrings(cachedResult.matchedStrings || []);
          setHasSearchResults(Boolean(cachedResult.hasSearchResults));
          return;
        }

 
        if (statevectore && Object.keys(statevectore).length > 0) {
          fullSearch = true;
        }


        const searchParams = {
          latitude: location?.[1] || 11.0168,
          longitude: location?.[0] || 76.9558,
          searchString: value,
          mapUnitName: selectedRegion?.value || "india",
          stateVector: statevectore,
          resultCount: 20,
          langCode: 'en',
          debug: false,
          onlineOnly: false,
          makeFullSearch: fullSearch,
          isPoiSearch: false,
          radius: 50000,
          category: [],
        };

        setIsLoading(true);


        const searchResults = await performSearch(searchParams);        

        if (searchResults?.unifiedSearchData) {
          const searchDataArray = {
            title:"unifiedSearchData",
            data:searchResults.unifiedSearchData
          };
          setOnSearchResults([searchDataArray]);
          setHasSearchResults(true);
          searchCache.set(cacheKey, {
            results: [searchDataArray],
            matchedStrings: [],
            hasSearchResults: true,
            timestamp: Date.now(),
          });
        } else if (searchResults?.searchData) {
          const searchDataArray = getSearchData(searchResults.searchData);
          setOnSearchResults(searchDataArray);
        
          const ms = searchResults?.searchData?.matchedStrings || [];
          setMatchedStrings(ms);
          setHasSearchResults(true);
          searchCache.set(cacheKey, {
            results: searchDataArray,
            matchedStrings: ms,
            hasSearchResults: true,
            timestamp: Date.now(),
          });
        } else {
          setHasSearchResults(false);
          setOnSearchResults([]);
          setMatchedStrings([]);
          searchCache.set(cacheKey, {
            results: [],
            matchedStrings: [],
            hasSearchResults: false,
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        // Silently handle cancellation
        if (
          e.name === 'AbortError' ||
          e.message?.includes('cancelled') ||
          e.message?.includes('Search operation was cancelled')
        ) {
          return;
        }
        console.error('Error performing search:', value, e);
        setOnSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [location, setOnSearchResults, selectedRegion]
  );
  const debouncedSetSearchUnit = useMemo(() => debounce((query) => {
    if (query.trim()) searchAPI(query);
    else setOnSearchResults([]);
  }, 300), [searchAPI]);
  
  const _onChangeText = useCallback(
    value => {
      setAddressName(value);
      // Only trigger search if the value has meaningful content (not just spaces)
      if (value.trim().length > 0) {
        debouncedSetSearchUnit(value);
      } else {
        // Clear results immediately when input is empty
        setOnSearchResults([]);
        debouncedSetSearchUnit.cancel();
      }
    },
    [debouncedSetSearchUnit],
  );

  const onLocationNamePress = (item) => {
    console.log("item", item)
    if (isGeofenceSearch) {
      updateMapMarker(item)
    }
    const locationObj = {
      latitude:item.latitude,
      longitude:item.longitude,
    }
    updateUserLocation(locationObj, true)
    setAddressName(item.name)
    setSelectedAddress({
      lat:item.latitude,
      lng:item.longitude,
      address:item.name
    })
    clearAllStateVectors(item);
    setOnSearchResults(null)
    setMatchedStrings([]);
  }

  const selectedCallBack = async (item) => {
    if (item?.sectionType === 'fast_match' || item?.stateVectorForMatches){
      if(item?.stateVectorForMatches){
            await searchAPI('', item?.stateVectorForMatches);
            setAddressName('');
            setStateVector(item?.stateVectorForMatches);
          }
    }else{
      console.log("item",item);
      onLocationNamePress(item);
    }
  
  };

  // const renderLogoutModal = () => {
  //   return (
  //     <AlertModal
  //     isVisible={showLogoutModal}
  //     onClose={() => {
  //       setShowLogoutModal(false)
  //     }}
  //     rightBtnText={'logout'}
  //     leftBtnTxt={'cancel'}
  //     successMessage={'Are you sure you want to logout?'}
  //     onRightPress={() => handlePassangerLogout()}
  //     animationType={'slide'}
  //   />
  //   )
  // }

  const onGoBack = () => {
    if (isPassanger) {
      setShowLogoutModal(true)
    } else {
      setOnSearchResults(null)
      setAddressName('')
      setSelectedAddress(null)
      goBack()
    }
  }

const removeStateVecotr = async (item) => {
  clearSingleStateVector(item.key, item.index);
  setOnSearchResults([])
  setStateVector(null);
  setMatchedStrings([]);
  await searchAPI('', null);
}

 const locateOnMap = () => {
    setSelectedAddress(null)
    setOnSearchResults(null)
    setAddressName(null)
 }

   const getUserLocation = async () =>{
    await locationTask.getCurrentLocation().then((position) => {
      const {latitude, longitude} = position.coords;
      console.log("current location",latitude, longitude);
      updateUserLocation({latitude, longitude});
    }).catch((error) => {
      console.log("Error getting current location", error);
    });
  }

  useEffect(() => {
    let mounted = true;
    const fetchCurrent = async () => {
      try {
        const useLoc = await locationTask.getCurrentLocation();
        if (!mounted) return;
        const { latitude, longitude } = useLoc.coords;
        updateUserLocation({ latitude, longitude });
      } catch (e) {
        console.log('Error getting current location on mount', e);
      }
    };
    fetchCurrent();
    return () => {
      mounted = false;
    };
  }, [])

  const getCurrentLocation = async () => {
    const isLocationPermitted = await checkFineLocationPermissions();
    if (!isLocationPermitted) {
      const hasLocationpermission = await RequestFineLocationPermission();
      if (!hasLocationpermission) {
        showNotification(
          t('location_permission_denied'),
          t('grant_location_permission'),
          'danger',
          3000,
        );
        return;
      }
    }
    getUserLocation();
  };

 const LocationRequestModal = () => {
     return (
       <AlertModal
       isVisible={showLocationModal}
       onClose={() => {
         setShowLocationModal(false);
       }}
       rightBtnText={t('allow')}
       leftBtnTxt={t('cancel')}
       successMessage={t('please_allow_location_access_to_continue_we_need_your_location_to_continue')} 
       onRightPress={() => {
         getCurrentLocation();
         setShowLocationModal(false);
       }}
       animationType={'slide'}
     />
     );
   };

 const updateDriverPrefferedLocation =async (updateDriverHomeLocation)=> {
   if (!userLocation) {
      setShowLocationModal(true);
      return;
    }
   // Only proceed if location changed
   if (!isLocationChanged()) {
     onGoBack();
     return;
   }
   try {
    setIsLocationLoading(true)
     const api = new APIRequest();
     const url = `/publicrides/driver/v2/updatePreferredWorkLocation`;
     const payload = {
       homeLocation: updateDriverHomeLocation,
       location: userLocation.reverse(),
     };
     const res = await api.request(url, 'POST', payload, userInfo?.token);
     if (res?.success) {
         setDriverInfo({homeLocation: updateDriverHomeLocation,coordinates: [selectedAddress.lng, selectedAddress.lat]})
         setLocationCompleteStatus(true)
         setIsApproved(false)
         onGoBack()
     } else {
        showNotification(res?.message, res?.message, 'danger');
     }
    setIsLocationLoading(false)
   } catch (err) {
      console.log("Error updating preferred location", err);
    setIsLocationLoading(false)
   }
 }

 const onConfirmLocation = () => {
   const updateDriverHomeLocation = {
     coordinates : [selectedAddress.lat, selectedAddress.lng],
     addressName : selectedAddress.address,
   } 
   if (isPassanger) {
    updatePassangerLocation(updateDriverHomeLocation)
   }else {
    firebaselog_onBoarding('OB_Driver(OB_D)', 'OB_D:preferred_work_location')
    updateDriverPrefferedLocation(updateDriverHomeLocation)
   }
 }

 const onAddressCallback = (item) => {
  setAddressName(item.name)
  setSelectedAddress({
    lat:item.latitude,
    lng:item.longitude,
    address:item.name
  })
 }

  return (
    <View style={{flex: 1, alignContent: 'center' , justifyContent:'center'}}>
      {isLocationLoading && <FullScreenLoader />}
       {! isGeofenceSearch && <NavBar title={isPassanger ? "Add Your Pick up Location" : "Add Driver Location"} onBackPress={() => onGoBack()} withBg />}
      <UseBackButton onBackPress={() => onGoBack()} />
        {!onSearchResults && !isGeofenceSearch &&  <LocationPicker setIsLoading={setIsLoading} onAddressCallback={onAddressCallback}/>}
      <View style={styles.screenContainer}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Search Location"
          style={styles.input}
          value={addressName}
          onChangeText={(text)=>_onChangeText(text)}
          autoFocus
          ref={searchInputRef}
          multiline
        />
         {isLoding && <ActivityIndicator color={Colors.periwinkle}/>}
           <TouchableOpacity style={{padding: 5}} onPressIn={onClosePress}>
          <AntDesign name="closecircleo" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>
      {!onSearchResults && (
        <View style={RouteScreenStyles.mapIconContainer}>
          <TrackingMapIcons
            markersData={[]}
            isDriverLocation={true}
            currentLocationCallBack={currentLocationCallBack}
            onlyLocation={true}
          />
        </View>
      )}
      {matchedStrings.length > 0 && (
        <StateVectorConatiner stateVectorArr={matchedStrings} removeStateVector={removeStateVecotr}/>
      )}
      {onSearchResults && <SearchResult searchTxt={addressName} search_data={onSearchResults} selectedCallBack={(item,type)=>selectedCallBack(item,type)} locateonMap={locateOnMap}/> }
      {selectedAddress && !onSearchResults && 
       <TouchableOpacity style={styles.addLocationBtn} onPress={()=>onConfirmLocation()}>
       <Text style={styles.addLocationBtnText}>Confirm Location</Text>
        </TouchableOpacity>
      }
      </View>
      {showLocationModal && <LocationRequestModal />}
      {/* {showLogoutModal && renderLogoutModal()} */}
    </View>
  );
};

export default AddDriverLocation;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
   
  },
  inputContainer: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grey,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    // borderWidth: 1,
    borderColor: Colors.grey,
    borderRadius: 10,
    padding: 10,
    fontFamily: Fonts.regular,
    width: '80%',
    color:Colors.black
  },
  addLocationBtn: {
    backgroundColor: Colors.periwinkle,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.grey,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  addLocationBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.semi_bold,
  },
  modalView: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: height,
    width: width,
    zIndex: -1,
  },
  modalContainer: {
    width: '100%',
    // height: height * 0.75,
    position: 'absolute',
    backgroundColor: Colors.white,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginRight: 10,
    marginVertical: 10,
  },
});
