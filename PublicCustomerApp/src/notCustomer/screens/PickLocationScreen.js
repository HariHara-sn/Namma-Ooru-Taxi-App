import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Vibration,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import {useStackScreenStore} from '../store/useStackScreenStore';
import NavBar from '../components/NavBar';
import useMapStore from '../features/map/store/useMapStore';
import PickIcon from '../assets/icons/pickupIcon.webp';
import { colors, Fonts   } from '../constants/constants';
import { height, utils} from '../utils/Utils';
import MapIcon from '../components/Map/MapIcon';
import SearchAPI from '../controllers/NEMap/Search';
import SkeletonLoader from '../components/Loaders/SkeletonLoader';
import useLocationStore from '../store/useLocationStore';
import useMapStyleStore from '../store/useMapStyleStore';
import CurrentLocationIcon from '../assets/icons/CurrentLocationIcon.svg';
import { openFeedback } from '../utils/feedback';
import  Circle from '../controllers/NEMap/Circle';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import  Polyline  from '../controllers/NEMap/Polyline';
import  Marker  from '../controllers/NEMap/Marker';

// import locationTask from "../controllers/GetCurrentLocation";
import usePropsStore from '../store/usePropsStore';
import { useDebouncedAPICall } from '../hooks/useDebounce';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import PropTypes from 'prop-types';
import AdaptiveText from '../components/Common/AdaptiveText';
import { findRoute } from '../controllers/NEMap/findRoute';
import polyline from '@mapbox/polyline';
import useRideBookingLocationStore from '../features/booking/store/useRideBookingLocationStore';
import SearchScreenWrapper from '../features/search/screens/SearchWrapper.jsx';
import { search } from 'react-native-country-picker-modal/lib/CountryService';
import FavPlacesItem from '../features/booking/components/planride/FavPlacesItem';
import useUserInfoStore from '../../common/store/useUserInfoStore.js';
import { ScrollView } from 'react-native';
import MapMove from '../assets/image/MapMove.webp';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaselog_ridePlanning } from '../../common/utils/FirebaseAnalytics.js';

const CURRENT_LOCATION_MARKER_ID = 'pick-location-current-location';

const createCurrentLocationMarker = (locationData) => {
  if (!Array.isArray(locationData) || locationData.length < 2) return null;
  const marker = new Marker(
    CURRENT_LOCATION_MARKER_ID,
    'Current Location',
    locationData[0],
    locationData[1],
    'bearing',
    48,
    false,
    0,
  );
  marker.setAnimate(false);
  marker.setFocus(false);
  marker.setDoRotation(false);
  return marker;
};


const PickLocationScreen = ({onPickLocationResultCallback,locationType=null,defaultLocation=null,label=null,isFromRidePointsSelection=false,limitRadius=null, searchBar=false,index=null,buttonLabel=null,isFromContribution=false, focusSearchOnMount=true,isConfirmLocation=false,isFromwaypointEdit=false}) => {
  const {goBack} = useStackScreenStore();
  const { setOnMapCenterChanged,setMapMarkers,setOnMapRotationChanged,setMapLocation,setGeometries } = useMapStore();
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const {setStackScreen} = useStackScreenStore();
  const [searchTxt, setSearchTxt] = useState(null);
  const {currentLocationName,location} = useLocationStore();
  const {setIsMapButtonVisible} = useMapStyleStore();
  const {pickedLocation,setPickedLocation} = usePropsStore();
  const [showSearch,setShowSearch] = useState(false);
  const [isError,setIsError] = useState(false);
  // Store error message as a single string instead of an object
  const [isErrorMessage,setIsErrorMessage] = useState('');
  // Ref to suppress handling of the next map center change when it is programmatic
  const suppressCenterChangeRef = useRef(false);
  const [mapMoving,setMapMoving] = useState(false)
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false); // track keyboard visibility
  const [searchBarBottom, setSearchBarBottom] = useState(80); // dynamic overlay top (fallback)
  const [holeRect, setHoleRect] = useState(null); // union rect to keep visible
  // One-time hint state
  const [hasSeenMapMoveHint, setHasSeenMapMoveHint] = useState(true); // default true until storage check
  const searchRef = useRef(new SearchAPI());
  const searchInputRef = useRef(null); // ref to control focus/blur of search TextInput
  const iconButtonRef = useRef(null);
  const inputContainerRef = useRef(null);
  const { 
    rideStartLocation, 
    rideEndLocation, 
    rideWayPoints 
  } = useRideBookingLocationStore();
  const { userFavPlaces } = useUserInfoStore();
  const linearGradientColors = isConfirmLocation?['transparent','#00aa41ff'] : ['transparent','#303030',];
  const currentLocationMarker = useMemo(() => createCurrentLocationMarker(location), [location]);

  const setMapMarkersWithCurrentLocation = useCallback((markers = []) => {
    const nextMarkers = currentLocationMarker ? [currentLocationMarker, ...markers] : markers;
    setMapMarkers(nextMarkers);
  }, [currentLocationMarker, setMapMarkers]);

  const getLastLatLngfromPolyLine = useCallback(async (polylineData) => {
    console.log("polylineData",polylineData)
    const encodedPolyline = polylineData.trip.legs?.[0].shape || null;

    if(!encodedPolyline){
      return null;
    }
    const coordinates = await polyline.decode(encodedPolyline, 6);
    console.log("coordinates",coordinates)
    return coordinates[coordinates.length - 1];
  }, []);

  // --- Attention animation values for search bar ---
  const searchBarScale = useRef(new Animated.Value(0.9)).current;
  const searchBarOpacity = useRef(new Animated.Value(0)).current;
  // Removed search icon animation (static icon)
  const searchTextOpacity = useRef(new Animated.Value(1)).current;
  const searchBarTranslateY = useRef(new Animated.Value(-40)).current; // slide from top
  // Bottom container slide-up animation values
  // (Removed bottom container animation)

  useEffect(() => {
    // Run only on initial mount
    Animated.parallel([
      Animated.timing(searchBarScale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(searchBarOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(searchBarTranslateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle breathing for placeholder / search text
    Animated.loop(
      Animated.sequence([
        Animated.timing(searchTextOpacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(searchTextOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bottom container animation removed
  }, []);

  // Load one-time overlay flag
  useEffect(() => {
    (async () => {
      try {
        const val = await AsyncStorage.getItem('@hasSeenMapMoveHint');
        if (!val) {
          // Not stored yet -> show hint once
          setHasSeenMapMoveHint(false);
          AsyncStorage.setItem('@hasSeenMapMoveHint', 'true').catch(() => {});
        }
      } catch (e) {
        // silently ignore
        setHasSeenMapMoveHint(false);
      }
    })();
  }, []);


  // Delayed focus of search input when screen mounts (only if searchBar + focusSearchOnMount)
  useEffect(() => {
    if (!searchBar || !focusSearchOnMount || defaultLocation) return;
    const focusTimeout = setTimeout(() => {
      if (searchInputRef.current) {
        try {
          searchInputRef.current.focus();
        } catch (e) {
          // silently ignore focus errors
        }
      }
    },500);


    setKeyboardVisible(true);
     // delay in ms
    return () => clearTimeout(focusTimeout);
  }, [searchBar]);
  
  const extractRouteSummary = useCallback((routeData) => {
        if (!routeData?.trip?.legs || routeData.trip.legs.length === 0) {
          return null;
        }
        if (routeData.trip.legs.length > 1) {
          let totalTime = 0;
          let totalLength = 0;
          routeData.trip.legs.forEach(leg => {
            if (leg.summary) {
              totalTime += leg.summary.time || 0;
              totalLength += leg.summary.length || 0;
            }
          });
          return { time: totalTime, length: totalLength };
        }
        const leg = routeData.trip.legs[0];
        
        if (leg.summary) {
          return { summary: leg.summary, shape: leg.shape };
        }
        return null;
      }, []);
  const fetchAddressName = useCallback(async (longitude, latitude) => {
    try {
      const response = await searchRef.current.reverseGeocode(longitude, latitude);    
      return response 

    } catch (e) {
      console.error("Failed to fetch address", e);
      return "";
    }
    
  }, []);

 
  const debouncedMapCenterChange = useDebouncedAPICall(async (data) => {
    setIsAddressLoading(true);
    setIsError(false);
    setIsErrorMessage('');
    if(!limitRadius){
    setGeometries([]);
    setMapMarkersWithCurrentLocation();
    }
    const response = await fetchAddressName(data.longitude, data.latitude);
    
    let item = {
      latitude: data.latitude,
      longitude: data.longitude,
      placeName: response.placeName,
      type:locationType,
      locationFrom:"MAP"
    }
    if(response.address){
      item.address = response.address;
    }
    setSearchTxt(null);
    // setHomeMapMarker([pickedLocation?.longitude, pickedLocation?.latitude],'home',48);
    setPickedLocation(item);
    setIsAddressLoading(false);
  }, 500);

  const onmapCenterChanged = async (data)=>{
    // Ignore the next center change if we flagged it as programmatic
    if (suppressCenterChangeRef.current) {
      suppressCenterChangeRef.current = false;
      setMapLocation(false)
      return;
    }
    setMapMoving(false);
    // Start loading a new address only after user interaction
    setIsAddressLoading(true);
    debouncedMapCenterChange(data);
  };

  const onMapRotationChangedCallback = async ()=>{
    setMapMoving(true);
    Keyboard.dismiss();
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }

    
  }

   const setHomeMapMarker = (locationdata, type='home',size=48) => {
    if(locationdata && locationdata.length > 0){
      console.log('setting home marker at', locationdata);
      const randomId = `home-marker-${Math.random().toString(36).substr(2, 9)}`;
      const homeMarker = new Marker(  
        randomId,
        randomId,
        locationdata[0],  
        locationdata[1],
        type,
        size,
        true,  
        0
      );
      homeMarker.setAnimate(true);
      homeMarker.setAnimationTime(10000);
      console.log('homeMarker', homeMarker);
      setMapMarkersWithCurrentLocation([homeMarker]);
    }   
  };


  const centerMap = async ()=>{
    console.log('centerMap called with location:', location);
    if(!location) return;
    setPickedLocation({
      latitude:location[1], 
      longitude: location[0],
      placeName: currentLocationName.placeName,
      address: currentLocationName.address, 
      type:locationType,
      locationFrom:"MAP"
    });
    setTimeout(()=>{
      setMapLocation({
        lat: location[1],
        lng: location[0],
        zoom: 18,
      });
    },100)

  }

  useEffect(()=>{

    setOnMapCenterChanged(onmapCenterChanged);
    setOnMapRotationChanged(onMapRotationChangedCallback);

    const hasExistingPick = !!(
      pickedLocation &&
      pickedLocation.latitude != null &&
      pickedLocation.longitude != null && defaultLocation==null
    );

    if (hasExistingPick) {
      
      setIsMapButtonVisible(false);
      setMapMarkersWithCurrentLocation();
      suppressCenterChangeRef.current = true;
      // setTimeout(() => {
      //   setMapLocation({
      //     lat: pickedLocation.latitude,
      //     lng: pickedLocation.longitude,
      //     zoom: 18,
      //   });
      // }, 100);
      centerMap();
      setTimeout(()=>{
        setMapMoving(false);
      },500)

    } else if (defaultLocation){

      console.log('defaultLocation',defaultLocation);
      
      if(!defaultLocation.location && ( !defaultLocation.latitude && !defaultLocation.longitude)) return;

      const lat = defaultLocation?.location?.[1] || defaultLocation.latitude;
      const lon = defaultLocation?.location?.[0] || defaultLocation.longitude;

      console.log({
        latitude:lat,
        longitude:lon,
        placeName:defaultLocation.placeName || defaultLocation,
        address:defaultLocation.address,
        type:locationType,
        locationFrom:"MAP"
      })
      setPickedLocation({
        latitude:lat,
        longitude:lon,
        placeName:defaultLocation.placeName || defaultLocation?.name,
        address:defaultLocation.address,
        type:locationType,
        locationFrom:"MAP"
      });
      suppressCenterChangeRef.current = true;
      setMapLocation({
        lat: defaultLocation?.location?.[1] || defaultLocation.latitude,
        lng: defaultLocation?.location?.[0] || defaultLocation.longitude,
        zoom: 25,
      });

      if(limitRadius && limitRadius>0){
        const circle = new Circle(
      'circle1',
      'Circle 1',
      defaultLocation.location[1],
      defaultLocation.location[0],
      limitRadius * 1000, // radius in meters
      "#1A7d5fff",
      "#7d5fff", 
      "medium",
      );
      console.log('circle',circle);
      setGeometries([circle]);
         // Convert km to meters
      }
       setTimeout(()=>{
        setMapMoving(false);
      },500)
      setIsAddressLoading(false);

      
    } else {
     
      if(!location) return;
      console.log('location',location);
      setPickedLocation({
        latitude:location[1], 
        longitude: location[0],
        placeName: currentLocationName.placeName,
        address: currentLocationName.address, 
        type:locationType,
        locationFrom:"MAP"
      });

      setIsMapButtonVisible(false);
      setMapMarkersWithCurrentLocation(); 
      suppressCenterChangeRef.current = true;
      // setTimeout(()=>{
      //   setMapLocation({
      //     lat: location[1],
      //     lng: location[0],
      //     zoom: 18,
      //   });
      // },200);
      centerMap();
       setTimeout(()=>{
        setMapMoving(false);
      },500)
    }
    
    return ()=>{
      setOnMapCenterChanged(null);
      setIsMapButtonVisible(true);
    };
  },[]);

  useEffect(() => {
    setMapMarkersWithCurrentLocation();
  }, [setMapMarkersWithCurrentLocation]);

  useEffect(() => {
    return () => {
      setIsConfirming(false);
    };
  }, []);

  // Listen for keyboard show/hide to toggle bottomContainer visibility
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      // Measure positions of the two visible containers to compute hole rect
      setTimeout(() => {
        try {
          let a = null, b = null;
          if (iconButtonRef.current && iconButtonRef.current.measureInWindow) {
            iconButtonRef.current.measureInWindow((x, y, width, height) => {
              a = { x, y, width, height };
              if (b) {
                const x1 = Math.min(a.x, b.x);
                const y1 = Math.min(a.y, b.y);
                const x2 = Math.max(a.x + a.width, b.x + b.width);
                const y2 = Math.max(a.y + a.height, b.y + b.height);
                setHoleRect({ x: x1, y: y1, width: x2 - x1, height: y2 - y1 });
              }
            });
          }
          if (inputContainerRef.current && inputContainerRef.current.measureInWindow) {
            inputContainerRef.current.measureInWindow((x, y, width, height) => {
              b = { x, y, width, height };
              if (a) {
                const x1 = Math.min(a.x, b.x);
                const y1 = Math.min(a.y, b.y);
                const x2 = Math.max(a.x + a.width, b.x + b.width);
                const y2 = Math.max(a.y + a.height, b.y + b.height);
                setHoleRect({ x: x1, y: y1, width: x2 - x1, height: y2 - y1 });
              }
            });
          }
        } catch (e) {
          // Fallback: keep previous behavior using searchBarBottom
          setHoleRect(null);
        }
      }, 100);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (debouncedMapCenterChange && debouncedMapCenterChange.cancel) {
        debouncedMapCenterChange.cancel();
      }
      if (searchRef.current && searchRef.current.searchAbortController) {
        searchRef.current.searchAbortController.abort();
      }
    };
  }, []);

  const handleFeedback = () => {
    console.log("handleFeedback pickedLocation",pickedLocation)
          const lat = pickedLocation?.latitude.toFixed(6);
          const lon = pickedLocation?.longitude.toFixed(6);
          const coordStr = (lat != null && lon != null) ? `${lat} , ${lon}` : '';
          openFeedback({
            screenName: 'PickLocationScreen',
            initialValues: { coords: coordStr },
          });
        };

  const handleBack = () => {
    // Clear transient picked location only when user explicitly backs out.
    setPickedLocation(null);
    setGeometries([]);
    goBack();
  };

  const onSearchClickResultCallback = (result,type) => {
    if(!result) return;
     if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    Keyboard.dismiss();
    // Cancel any pending reverse geocode from map center change to avoid overwriting
    if (debouncedMapCenterChange && debouncedMapCenterChange.cancel) {
      debouncedMapCenterChange.cancel();
    }

    // Suppress the center change event triggered by programmatic map update
    suppressCenterChangeRef.current = true;
    const updated = {
      latitude: result.latitude,
      longitude: result.longitude,
      placeName: result.placeName || result.name || '',
      address: result.address,
      type: locationType ?? type,
      locationFrom: 'MAP'
    };
    setPickedLocation(updated);
    setSearchTxt(updated.placeName || updated.address || '');
    // Ensure UI stops showing skeleton loader
    setIsAddressLoading(false);
    setMapLocation({
      lat: updated.latitude,
      lng: updated.longitude,
      zoom: 18,
    });
    console.log('onSearchClickResultCallback', updated);
    setShowSearch(false);
    setMapMoving(false);
    firebaselog_ridePlanning('RP_Place_Select_Method(RP_PSM)', 'RP_PSM:search');
    // Blur / dismiss keyboard after selection
   
    
   
  };

  const handleSearch = () => {
    setShowSearch(true);
  }

  const showroute = async(shape)=>{
    if(!shape) return;

    console.log("shape",shape)
    const coordinates = await polyline.decode(shape, 6)?.map((latlng)=> [latlng[1], latlng[0]]);
    console.log("coordinates",coordinates)
    
 
    const polylineGeo = new Polyline(
            'driver-to-start',
            'Driver to Pickup',
            coordinates,
            '#0000FF',
            'medium' );   
    polylineGeo.setFocus(false)
    polylineGeo.setPattern('dashed')
    console.log("polylineGeo",polylineGeo)
    setGeometries([polylineGeo]);
    
  }

  // removed unused handleCurrentLocation to satisfy linter

  return (
    <>
      
      {searchBar ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          style={styles.searchBarContainer}
        >
          <View
            style={styles.searchBar}
            onLayout={(e)=>{
              const { y, height } = e.nativeEvent.layout;
              // searchBarContainer has top:5; overlay should begin below this view
              setSearchBarBottom(y + height + 10);
            }}
          >
            <TouchableOpacity
              ref={iconButtonRef}
              style={styles.searchBarIconButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={t('back', { defaultValue: 'Back' })}
            >
              <Icon name="arrow-back" size={22} color={colors.black} />
            </TouchableOpacity>
            <Animated.View
              style={{
                flex: 1,
                transform: [
                  { translateY: searchBarTranslateY },
                  { scale: searchBarScale }
                ],
                opacity: searchBarOpacity,
              }}
            >
              <View ref={inputContainerRef} style={[styles.searchBarInputContainer,{elevation:10}]}> 
                <View>
                  <Icon name="search" size={24} color={colors.blue} />
                </View>
                <Animated.View style={{flex:1, opacity: searchTxt ? 1 : searchTextOpacity}}>
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchBarInput}
                    value={searchTxt || ''}
                    onChangeText={(text)=>{
                      setSearchTxt(text);
                      // Show search overlay only when length > 1, hide otherwise
                      setShowSearch(text && text.length > 1);
                    }}
                    placeholder={t('search_cities_areas_streets')}
                    placeholderTextColor={colors.grey_dark}
                    autoCorrect={false} // Primary prop to disable auto-correction
                    spellCheck={false} // Disables the red underlines for misspelled words
                    autoComplete="off" // Disables autofill suggestions
                  />
                </Animated.View>
                { (searchTxt && searchTxt.length > 0) && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={t('clear_search', { defaultValue: 'Clear search' })}
                    onPress={() => {
                      setSearchTxt('');
                      setShowSearch(false);
                      
                      Keyboard.dismiss();
                      if (searchInputRef.current) {
                        try { searchInputRef.current.focus(); } catch(e) {}
                        
                      }
                      Keyboard.dismiss();
                    }}
                    style={styles.clearSearchBtn}
                  >
                    <Icon name="close" size={18} color={colors.grey_dark} />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </View>
          {!!userFavPlaces && !showSearch && userFavPlaces.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={!(keyboardVisible && !showSearch)}
              contentContainerStyle={styles.favPlacesContainer}
              style={styles.favPlacesScrollView}
            >
              {userFavPlaces.map((item, index) => (
                <FavPlacesItem
                  key={index}
                  data={item}
                  fromPickScreen={true}
                
                  selected={
                    !!(
                      pickedLocation &&
                      (
                        (item?.label && pickedLocation?.placeName && item.label.toLowerCase() === pickedLocation.placeName.toLowerCase()) ||
                        (item?.locationData && pickedLocation?.latitude != null && pickedLocation?.longitude != null &&
                          (
                            (item.locationData.latitude != null && item.locationData.longitude != null &&
                              item.locationData.latitude === pickedLocation.latitude &&
                              item.locationData.longitude === pickedLocation.longitude)
                          )
                        )
                      )
                    )
                  }
                  onPress={() => {
                    const loc = item?.locationData;
                    if (!loc) return;
                    // Use existing search result handler to center map and set picked location
                    onSearchClickResultCallback({
                      latitude: loc.latitude ?? loc?.location?.[1],
                      longitude: loc.longitude ?? loc?.location?.[0],
                      placeName: loc.placeName || loc.name || item.label || '',
                      address: loc.address,
                    }, locationType);
                  }}
                />
              ))}
              {/* <FavPlacesItem
                data={{ label: t('add_favorite_places') }}
                onPress={() => {
                  setStackScreen('SavedPlacesScreen', {});
                }}
                type="add"
              /> */}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      ):
      <NavBar
        title={ t('locate_on_map')}
        onBackPress={handleBack}
        feedbackIcon={true}
        onrightIconPress={handleFeedback}
      />
      }
      <View style={[styles.container]}>
        <View style={[mapMoving && { marginBottom: 7 },{ alignSelf: 'center', alignItems: 'center' }]}>
         {isConfirmLocation ? <View style={styles.pickIconContainer}>
          <Text style={styles.pickIconText}>{t('pickup')}</Text>
         </View> : <Image source={PickIcon} style={styles.pickIcon} />}
          <View style={styles.pickIconVerticalLine}></View>
        </View>
        <View style={[styles.shadowContainer]}>
          <View style={[styles.shadow]}>
          </View>
        </View>
      </View>
      
      <View style={styles.bottomContainer}>

        <View style={styles.mapIconContainer}>
          <MapIcon />
          
        </View>
        <View>
      
        <TouchableOpacity style={styles.currentLocationIconContainer} onPress={centerMap}>
          <CurrentLocationIcon width={25} height={25} />
          </TouchableOpacity>
         {(!isFromContribution )&& <TouchableOpacity
              style={[styles.feedbackIcon, { backgroundColor: colors.black,}]}
              onPress={handleFeedback}
            >
               <Ionicons name={"chatbubble-ellipses-outline"} size={25} color={colors.white} />
            </TouchableOpacity>}
        </View>
          {isError ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorHeader}>
                <Ionicons name="alert-circle" size={42} color={colors.red} style={styles.errorIcon} />
                <View style={styles.errorTextWrapper}>
                  {(isErrorMessage || t('unable_to_fetch_location'))
                    .split('\n')
                    .map((line, idx) => (
                      <AdaptiveText
                        key={idx}
                        style={idx === 0 ? styles.errorTitle : styles.errorMessage}
                        color={colors.red}
                      >
                        {line}
                      </AdaptiveText>
                    ))}
                </View>
              </View>
              <TouchableOpacity
                style={styles.errorActionButton}
                onPress={() => {
                  setIsError(false);
                  setIsErrorMessage('');
                  setGeometries([]);
                  setMapMarkersWithCurrentLocation();
                }}
                accessibilityRole="button"
                accessibilityLabel={t('pick_different_place', { defaultValue: 'Pick a different place' })}
              >
                <Ionicons name="location-outline" size={18} color={colors.white} style={styles.errorActionButtonIcon} />
                <AdaptiveText
                  style={styles.errorActionButtonText}
                  color={colors.white}
                >
                  {t('pick_different_place', { defaultValue: 'Pick a different place' })}
                </AdaptiveText>
              </TouchableOpacity>
            </View>
          ) : ( <>
        { !isConfirmLocation && <LinearGradient
          colors={linearGradientColors}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={styles.bottomContainerWarrapper}
        >
          <AdaptiveText style={styles.bottomContainerText} color={colors.white}> {label ? label : t('pick_location')}</AdaptiveText>
        </LinearGradient>}
        <View style={styles.AddressContainer}>
          {/* <View style={styles.AddressContainerIcon}>
                    <Icon name="location-on" size={30} color="#ffd11a"/>
                  </View> */}
          <View style={styles.AddressContainerMain}>
              <AdaptiveText style={styles.AddressContainerTextTitle} color={colors.grey_xxdark}>📍 {isFromContribution?t('coordinates'):t('address')}</AdaptiveText>
          { isFromContribution && !isAddressLoading ?
           <Text style={styles.AddressContainerPlaceName} color={colors.black}>
                {`Lat: ${pickedLocation?.latitude?.toFixed(6) || ''} , Lon: ${pickedLocation?.longitude?.toFixed(6) || ''}`}
               </Text>
          
          :!isAddressLoading && pickedLocation?.placeName && (
               <Text style={styles.AddressContainerPlaceName} color={colors.black}>
                 {utils.capitalizeFirstLetter(pickedLocation?.placeName)}
               </Text>
             )} 
            {!isAddressLoading && pickedLocation?.address && pickedLocation?.placeName && (
              <Text style={styles.AddressContainerTextAddress} color={colors.grey_xxdark}>
                {Array.isArray(pickedLocation.address)
                  ? utils.formatArrayAddress(pickedLocation.address)
                  : pickedLocation.address}
              </Text>
            )}

            {(isAddressLoading || !pickedLocation?.placeName)  &&
              <View style={styles.AddressContainerSkeleton}>
                <SkeletonLoader
                  width="100%"
                  height={20}
                  borderRadius={4}
                  backgroundColor="#E8E8E8"
                  shimmerColor="#F5F5F5"
                />
                


                <SkeletonLoader
                  width="70%"
                  height={20}
                  borderRadius={4}
                  backgroundColor="#E8E8E8"
                  shimmerColor="#F5F5F5"
                />
              </View>
            }
          </View>

        </View>
        {limitRadius && limitRadius>0 &&
        <View style={{alignSelf:'center', backgroundColor:colors.yellow+'50',paddingHorizontal:10,paddingVertical:5,marginTop:5,width:"90%",borderRadius:5}}>
      
          <AdaptiveText style={{alignSelf:'center', fontSize:12, color:colors.grey_xxdark}}>{t('location_within_radius', { radius: limitRadius })}</AdaptiveText>
        </View>
        }
        <TouchableOpacity
          style={[
            styles.bottomContainerButton,
            (isAddressLoading || isConfirming || !pickedLocation?.placeName) && styles.bottomContainerButtonDisabled,
            
          ]}
          onPress={async () => {
               firebaselog_ridePlanning('RP_Place_Select_Method(RP_PSM)', 'RP_PSM:picklocation');
            if (isAddressLoading || isConfirming || !pickedLocation?.placeName) return;
            if(isFromContribution){
              
              onPickLocationResultCallback(pickedLocation, locationType,index);
              setPickedLocation(null);
              return;
            }
            // Vibration.vibrate(100);
            setIsConfirming(true);
            try {
              
               if(limitRadius){
                const fromLat = defaultLocation?.location[1];
                const fromLon = defaultLocation?.location[0];

                const toLat = pickedLocation?.latitude;
                const toLon = pickedLocation?.longitude;
                console.log('fromLat',fromLat,'fromLon',fromLon,'toLat',toLat,'toLon',toLon);
                const distanceFromCenter = utils.calculateDistanceInMeters(fromLat, fromLon, toLat, toLon);
                console.log('distanceFromCenter',distanceFromCenter);
                if(distanceFromCenter > limitRadius * 1000){

                const title = t('location_outside_radius_title', { defaultValue: 'Location outside allowed radius' });
                const message = t('location_outside_radius_message', { defaultValue: `You must select a location within a ${limitRadius} km radius.` });
                setIsError(true);
                setIsErrorMessage(`${title}\n${message}`);
                Alert.alert(title, message);
                 setIsConfirming(false);
                
                return;
                }
              }else{
                setGeometries([]);
              }

              if(!isFromRidePointsSelection){
                onPickLocationResultCallback(pickedLocation, locationType,index);
                setPickedLocation(null);
                return;
              }

              
        
              let fromLat = null;
              let fromLon = null;
              let toLat = null
              let toLon = null;

           
              
              if(rideStartLocation){
                 fromLat = rideStartLocation?.latitude;
                 fromLon = rideStartLocation?.longitude;
              }
              if(rideEndLocation){
                 toLat = rideEndLocation?.latitude;
                 toLon = rideEndLocation?.longitude;
              }

              if(locationType == 'START_LOCATION'){
                 fromLat = pickedLocation?.latitude;
                 fromLon = pickedLocation?.longitude;
              }
              if(locationType == 'DESTINATION_LOCATION'){
                  toLat = pickedLocation?.latitude; 
                  toLon = pickedLocation?.longitude;
              }

              console.log(locationType, fromLat, fromLon, toLat, toLon);
             
             
              if (fromLat == null || fromLon == null || toLat == null || toLon == null) {
                onPickLocationResultCallback(pickedLocation, locationType,index);
                setPickedLocation(null);
                return;
              }
              const distanceMeters = utils.calculateDistanceInMeters(fromLat, fromLon, toLat, toLon);
              console.log('Calculated distance (meters):', distanceMeters);

             
              const isSameLocation = distanceMeters < 20 && !isFromwaypointEdit; // treat <30m as same location
              if (isSameLocation) {
                const title = t('same_location_title', { defaultValue: 'Locations too close' });
                const message = t('same_location_message', { defaultValue: 'Pickup and drop-off locations are very close. Please choose a farther location.' });
                setIsError(true);
                setIsErrorMessage(`${title}\n${message}`);
                
                return;
              }


              const points = [
                { lat: fromLat, lon: fromLon },
                { lat: toLat, lon: toLon }
              ];

            

              // const routeRes = await findRoute(points);

              // const routeData = routeRes?.response || null;
              // const {summary, shape} = await extractRouteSummary(routeData);
              // const lastLatLng = await getLastLatLngfromPolyLine(routeData);
    
              // const distanceKm = summary?.length || null;
            
              // if (distanceKm >= 0) {
              
                // if(lastLatLng && locationType == 'DESTINATION_LOCATION'){
                //   pickedLocation.latitude = lastLatLng[0];
                //   pickedLocation.longitude = lastLatLng[1];
                // }
                onPickLocationResultCallback(pickedLocation, locationType,index);
                setPickedLocation(null);
              // } else {
              //   // Alert.alert('No route found', 'No route is available to the selected location.');
              //   setIsError(true);
              //   setIsErrorMessage(t('no_route_found_message', { defaultValue: 'No route is available to the selected location.' }));
               
              // } 
              // else {
              //   const title = t('min_distance_title', { defaultValue: 'Distance too short' });
              //   const message = t('min_distance_message', { defaultValue: 'Ride distance must be at least 200 m' });
              //   setIsError(true);
              //   setIsErrorMessage(`${title}\n${message}`);
              //   if(locationType == 'START_LOCATION'){
              //       setHomeMapMarker([toLon,toLat],'drop_point',64);
              //   }
              //   if(locationType == 'END_LOCATION'){ 
              //       setHomeMapMarker(location);
              //   }
              //   showroute(shape)
              // }
            } catch (e) {
              console.error('Route check failed', e);
              // Alert.alert('Error', 'Failed to find a route. Please try again.');
            } finally {
              setIsConfirming(false);
            }
          }}
          disabled={isAddressLoading || isConfirming || !pickedLocation?.placeName}
        >
          {isConfirming ? (
            <ActivityIndicator color="white" />
          ) : (
            <AdaptiveText style={[
            styles.bottomContainerButtonText,
            (isAddressLoading || isConfirming || !pickedLocation?.placeName) && styles.bottomContainerButtonTextDisabled
         
            ]} color={colors.white}>{buttonLabel || t('confirm_location')}</AdaptiveText>
          )}
        </TouchableOpacity>

      </>)}
          </View>
          
          {/* Black overlay when keyboard is visible, excluding icon + input containers */}
          {keyboardVisible && !showSearch && !hasSeenMapMoveHint && (
            <>
              {/* Single full-screen overlay; two containers are raised above via zIndex */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  Keyboard.dismiss();
                  if (searchInputRef.current) { try { searchInputRef.current.blur(); } catch(e) {} }
                }}
                style={[styles.keyboardOverlay, { top: 0 }]}
              >
                <Image source={MapMove} style={styles.mapMoveImage} />
                <Text style={styles.mapMoveText}>{t('move_map_to_select_location')}</Text>
              </TouchableOpacity>
            </>
          )}

      {showSearch && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          style={styles.searchOverlay}
        >
          <SearchScreenWrapper
            onSearchClick={onSearchClickResultCallback}
            searchType={locationType}
            onClose={() => setShowSearch(false)}
            hidePickLocation={true}
            searchPlaceholder={t('search_cities_areas_streets')}
            searchString={searchTxt || ''}
          />
        </KeyboardAvoidingView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  pickIcon: {
    width: 25,
    height: 25,
  },
  pickIconVerticalLine: {
    width: 2,
    height: 15,
    backgroundColor: colors.black,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    borderRadius:20,
    marginHorizontal:10,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
    elevation: 10,
    zIndex: 1000,
    alignSelf:'center',
    justifyContent:'center',
    
  },
  bottomContainerText: {
    fontSize: 16,
    color: 'white',
    padding: 7,
    paddingHorizontal:10,
    fontFamily: Fonts.medium,
  },
  AddressContainer: {
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.grey,
    marginHorizontal:5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 15,
    
  },
  AddressContainerMain: {
    gap: 5,
    width: '100%',
  },
  AddressContainerTextTitle: {
    fontSize: 14,
    color: '#757575',
    fontFamily: Fonts.regular,
    
   
  },
  searchBarContainer:{
    position:'absolute',
    top:5,
    left:10,
    right:10,
    zIndex:3000,
  
    alignItems:'center',
  },
  searchBar:{
    flexDirection:'row',
    alignItems:'center',
    gap:7,
    paddingHorizontal:12,
    paddingVertical:10,
  
    borderRadius:12,
    width:"100%",
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
  
  },
  searchBarIconButton:{
    backgroundColor: colors.white,
    borderRadius: 999,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.grey_light,
    elevation: 20,
    zIndex: 4000,
  },
  searchBarInputContainer:{
    flex:1,
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:colors.white,
    borderRadius:30,
    paddingHorizontal:10,
    paddingVertical:10,
    gap:8,
    borderWidth:1,
    borderColor:colors.grey_xlight,
    elevation:25,
    zIndex: 4000,
   
  },
  clearSearchBtn:{
    padding:6,
    borderRadius:20,
    backgroundColor: colors.grey_xlight,
    alignItems:'center',
    justifyContent:'center'
  },
  searchBarInput:{
    flex:1,
    fontSize:16,
    fontFamily: Fonts.regular,
    color: colors.black,
    padding:0,
    // textTransform:'capitalize'
  },
  AddressContainerIcon: {
    backgroundColor:  '#fff79e',
    padding: 10,
    paddingVertical: 15,
    borderWidth: 0.5,
    borderColor:'#ffea00',
    borderRadius: 14,
  },
  AddressContainerTextAddress: {
    fontSize: 14,
    color: colors.grey_xxdark,
    textWrap: 'wrap',
    lineHeight: 20,
    fontFamily: Fonts.regular,
  
  },   
  feedbackIcon: {
    position: 'absolute',
    top: -height * 0.15,
    right: 10,
    zIndex: 1000,
    backgroundColor: colors.black,
    padding: 10,
    borderRadius: 30,
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
   
  AddressContainerPlaceName: {
    fontSize: 16,
    color: colors.black,
    textWrap: 'wrap',
    lineHeight: 20,
    fontFamily: Fonts.medium,
    marginTop: 10,
  },
  bottomContainerButton: {
    
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal:10,
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    
    
    borderRadius: 16,
    backgroundColor: '#212121',
  },
  bottomContainerButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  bottomContainerButtonDisabled: {
    backgroundColor: '#757575',
    opacity: 0.6,
  },
  bottomContainerButtonTextDisabled: {
    color: '#BDBDBD',
  },
  mapIconContainer: {
   position: 'absolute',
   top: -25,
   left: 10,
   zIndex: 1000,
  },
  AddressContainerSkeleton: {
    gap: 5,
  },
  currentLocationIconContainer: {
    position: 'absolute',
    top: -height * 0.07,
    right: 10,
    zIndex: 1000,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 30,
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainerWarrapper: {
   padding:0,
   margin:5,
   borderTopLeftRadius:13,
   width:"70%"
  },
  pickIconContainer:{
    alignItems:'center',
    justifyContent:'center',
    backgroundColor: colors.black,
    paddingHorizontal:10,
    paddingVertical:5,
    borderRadius:20,
  },
  pickIconText:{  
    color: colors.white,

    fontSize:12,
    fontFamily: Fonts.medium,
  },
  shadowContainer: {
   
  
    height: 10,
    width: 10,
    top: -5,
   
    backgroundColor: '#101010'+'50',
    alignSelf: 'center',
    marginBottom: 10,
    borderRadius: 50,
    transform: [{ scaleX: 2 }],
  },
  searchOverlay:{
    position:'absolute',
    top:80,
    left:20,
    right:20,
    bottom:20,
    backgroundColor: 'white',
    zIndex:2000,
    elevation:20,
    borderRadius:10,
  }
  ,keyboardOverlay:{
    position:'absolute',
    left:0,
    right:0,
    bottom:0,
    backgroundColor: 'black',
    opacity: 0.8,
    zIndex:2000,
    justifyContent:'center',
    alignItems:'center',
   
  }
  ,errorContainer:{
    minHeight:200,
    width:'100%',
    alignSelf:'center',
    backgroundColor: colors.red + '10',
    borderRadius:18,
    padding:18,
    borderWidth:1,
    borderColor: colors.red,
    justifyContent:'center'
  },
  errorHeader:{
    flexDirection:'row',
    alignItems:'flex-start'
  },
  errorIcon:{
    marginRight:14,
    marginTop:2
  },
  errorTextWrapper:{
    flex:1
  },
  errorTitle:{
    fontSize:16,
    fontFamily: Fonts.medium
  },
  errorMessage:{
    fontSize:14,
    marginTop:6,
    fontFamily: Fonts.regular
  },
  errorActionButton:{
    marginTop:20,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor: colors.black,
    paddingVertical:14,
    paddingHorizontal:20,
    borderRadius:30
  },
  errorActionButtonIcon:{
    marginRight:8
  },
  errorActionButtonText:{
    fontSize:14,
    fontFamily: Fonts.medium
  }
  ,favPlacesContainer: {
    flexDirection: 'row',
    paddingVertical:0,
    gap:10,
    paddingHorizontal:5
  },
  favPlacesScrollView: {
    flexGrow: 0,
    zIndex: 3000,
  },
  mapMoveImage: {
    width: 100,
    height: 100,
    alignSelf: 'center',
   marginTop:height * 0.2,
    opacity: 0.4,
  },
  mapMoveText: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: Fonts.medium,
    opacity: 0.8,
  },
});

PickLocationScreen.propTypes = {
  onPickLocationResultCallback: PropTypes.func.isRequired,
  locationType: PropTypes.any,
  defaultLocation: PropTypes.shape({
    location: PropTypes.arrayOf(PropTypes.number),
    placeName: PropTypes.string,
    address: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  }),
  label: PropTypes.string,
  isFromRidePointsSelection: PropTypes.bool,
  focusSearchOnMount: PropTypes.bool,
};

export default PickLocationScreen;
