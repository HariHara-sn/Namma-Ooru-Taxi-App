import React, {useCallback, useState, useRef, useEffect, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Modal,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import {colors, Fonts} from '../../../constants/constants';
import NavBar from '../../../components/NavBar';
import {useStackScreenStore} from '../../../store/useStackScreenStore';
import useLocationStore from '../../../store/useLocationStore';
import { performSearch } from '../../../components/Native/NESearch';
import SearchResultContainer from '../components/searchResultContainer';
import SearchResultSkeleton from '../components/SearchResultSkeleton';
import HorizontalLoadingIndicator from '../components/HorizontalLoadingIndicator';
import StateVectorConatiner from '../../../components/StateVectorConatiner';
import { clearSingleStateVector, clearAllStateVectors } from "../../../components/Native/NESearch";
import HistoryCard from '../../shared/component/HistoryCard';
import { DataStore } from '../../../controllers/DataStore';
import {height} from '../../../utils/Utils';
import FavLabelItems from '../../home/components/FavLabelItems';
import { openFeedback } from '../../../utils/feedback';

// Debounce import
import debounce from 'lodash.debounce';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const searchCache = new Map();

const SearchScreenWrapper = ({onSearchClick=null,searchType,fromaddWayPoint=false,getwaitingTime=false,title=null,index=null,label=null,onClose=null,hidePickLocation=false, searchString="" }) => {
  // searchString now comes from props; internal input state removed
  const {goBack,setStackScreen} = useStackScreenStore();
  const [isLoading,setIsLoading] = useState(false);
  // Input focus state removed (no TextInput)
  const [isRegionModalVisible, setIsRegionModalVisible] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [onSearchResults, setOnSearchResults] = useState([]);
  const {location, setSelectedInput} = useLocationStore();
  const [stateVector, setStateVector] = useState(null);
  const [hasSearchResults, setHasSearchResults] = useState(true);
  const [matchedStrings, setMatchedStrings] = useState([]);
  const { t } = useTranslation(); 
  
  // Removed TextInput refs and animations (no longer needed)

  // Debounce ref for cleanup (removed unused ref)

  // Remove emojis and related modifiers from input
  const sanitizeNoEmoji = useCallback((text) => {
    if (!text) return '';
    const disallowedCodePoints = new Set([0x200D, 0xFE0E, 0xFE0F]); // ZWJ and variation selectors
    const sanitized = Array.from(text)
      .filter(ch => {
        const cp = ch.codePointAt(0);
        if (!cp) return false;
        if (disallowedCodePoints.has(cp)) return false;
        // Common emoji ranges
        if (cp >= 0x1F000 && cp <= 0x1FAFF) return false; // Misc symbols & pictographs, supplemental symbols & pictographs, etc.
        if (cp >= 0x2600 && cp <= 0x27BF) return false;   // Misc symbols, dingbats
        return true;
      })
      .join('');
    return sanitized;
  }, []);

  // Region configuration
  const REGIONS = useMemo(() => [
    { id: 1, name: 'India', value: 'india' },
    // { id: 2, name: 'United States', value: 'united states' }
  ], []);

  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);

  // Load recent searches when component mounts
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const recentSearches = await DataStore.loadData('recentSearches');
        if (recentSearches && recentSearches.data) {
          setRecentSearches(recentSearches.data);
        }
      } catch (error) {
        console.error("Error loading recent searches:", error);
      }
    };
    loadRecentSearches();
  }, []);

  const storeRecentSearch = async (item) => {
    try {
      const recentSearches = await DataStore.loadData('recentSearches');
      let updatedSearches = [];

      if (recentSearches && recentSearches.data) {
        // Check if item already exists
        const exists = recentSearches.data.some(search => search.name === item.name);
        
        if (!exists) {
          // Add new item to start of array, limit to 5 items
          updatedSearches = [item, ...recentSearches.data].slice(0, 5);
        } else {
          // Move existing item to start
          updatedSearches = [
            item,
            ...recentSearches.data.filter(search => search.name !== item.name)
          ].slice(0, 5);
        }
      } else {
        updatedSearches = [item];
      }

      await DataStore.storeData('recentSearches', updatedSearches);
      setRecentSearches(updatedSearches);
    } catch (error) {
      console.error("Error storing recent search:", error);
    }
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
        // If search is empty, don't call API
        if (!value && (!statevectore || Object.keys(statevectore).length === 0)) {
          setOnSearchResults([]);
          setHasSearchResults(true);
          setMatchedStrings([]);
          setIsLoading(false);
          return;
        }

        // console.log("call search api", value); // Removed as per instruction
        const normalizedStateVector = statevectore || {};
        const stateVectorStr = JSON.stringify(normalizedStateVector);
        const cacheKey = `${value.toLowerCase().trim()}_${stateVectorStr}`;
   

        if (statevectore && Object.keys(statevectore).length > 0) {
          fullSearch = true;
        }

        const searchParams = {
          latitude: location[1] || 11.0168,
          longitude: location[0] || 76.9558,
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

        console.log("Search Params:", searchParams);

        setIsLoading(true);

        const searchResults = await performSearch(searchParams);

        console.log("Search Results:", searchResults);

        // Process results
       
        if (searchResults?.unifiedSearchData && searchResults?.unifiedSearchData?.length > 0) {
          const searchDataArray = {
            title: "unifiedSearchData",
            data: searchResults.unifiedSearchData,
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
        // Ignore cancellation errors
        const msg = String(e?.message || e || '').toLowerCase();
        const code = String(e?.code || '').toLowerCase();
        const isCancelled = msg.includes('cancel') || code === 'cancelled' || code === 'canceled' || code === 'ecanceled';
        if (isCancelled) {
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

  // Trigger search when prop-driven searchString changes
  useEffect(() => {
    const cleaned = sanitizeNoEmoji(searchString || '');
    if (cleaned.trim() !== '') {
      searchAPI(cleaned);
    } else {
      // Reset results when empty
      setOnSearchResults([]);
      setHasSearchResults(true);
      setMatchedStrings([]);
    }
  }, [searchString, searchAPI, sanitizeNoEmoji]);

  // Debounced version of searchAPI for typing
  // Removed debounced search (prop-driven search triggers directly)

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      clearAllStateVectors();
      setStateVector(null);
    };
  }, []);

  // Debounced onChangeText handler
  // Removed _onChangeText handler (no local TextInput)

  // Removed focus animation effect
 
  const selectedCallBack = async (item) => {
    if (item?.sectionType === 'fast_match' || item?.stateVectorForMatches){
      if(item?.stateVectorForMatches){
        // For state vector, call API immediately (not debounced)
        await searchAPI('', item?.stateVectorForMatches);
        // Clear any existing search vector state (prop-driven string remains external)
        setStateVector(item?.stateVectorForMatches);
      }
    } else {
      onLocationNamePress(item);
    }
  };

  const removeStateVecotr = async (item) => {
    clearSingleStateVector(item.key, item.index);
    setOnSearchResults([])
    setStateVector(null);
    setMatchedStrings([]);
    // Call API immediately (not debounced)
    await searchAPI(searchString, null);
  }

  // onpress on search results
  const onLocationNamePress = useCallback((item) => {
    item["locationFrom"] = "SEARCH";
    storeRecentSearch(item);
    onSearchClick(item, searchType, index);
  }, [onSearchClick, searchType, index]);

  const fullSearch = () => {
    // Explicit full search trigger using current prop value
    searchAPI(searchString, null, true);
  }

  const onGoBack = () => {
    if (onClose) {
      onClose();
    } else {
      goBack();
    }
    setSelectedInput(null); // to disable locate on map when goBack or close
  }

  const onFeedbackPress = () => {
    openFeedback({
      screenName: 'SearchScreen',
      initialValues: {
        searchQuery: searchString || '',
        searchIssue: '',
      },
    });
  };

  const handleLocateOnMapCallback = (item) => {
    onSearchClick(item, searchType, index);
  }

  const handleLocateOnMap = () => {
    if(onClose){
      onClose();
      return;
    }
    goBack();
    setStackScreen('PickLocationScreen', {
      onPickLocationResultCallback: handleLocateOnMapCallback,
      locationTypes: searchType,
      fromaddWayPoint: fromaddWayPoint,
      getwaitingTime: getwaitingTime,
      title: title,
      index: index,
      label: label,
      isFromRidePointsSelection:searchType === 'DESTINATION_LOCATION' ? true : false
    });
  }

  // Focus/blur handlers removed (no TextInput)

  const hideRegionModal = () => {
    setIsRegionModalVisible(false);
  };

  const handleRegionSelect = useCallback((newRegion) => {
    setSelectedRegion(newRegion);
    hideRegionModal();
    searchCache.clear();
    if ((searchString || '').trim()) {
      searchAPI(searchString);
    }
  }, [searchString, searchAPI]);

  // Clear search handler removed (parent controls searchString prop)

  const handleFavouriteLocationPress = (locationType,labelLocation) => {
    labelLocation["locationFrom"] = "FAVOURITE";
    labelLocation["labelName"] = locationType;
    onSearchClick(labelLocation, searchType, index);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {/* <NavBar onBackPress={onGoBack} title={t('search')} feedbackIcon={true} onrightIconPress={onFeedbackPress} /> */}
        {/* TextInput removed; searchString provided via props */}

        {/* Region Selector */}
        {/* <View style={styles.regionRow}>
          <Text style={styles.regionLabel}>{t('search_region')}</Text>
          <TouchableOpacity style={styles.dropDownContainer} onPress={showRegionModal}>
            <Text style={styles.dropDownText}>
              {selectedRegion?.name || 'Select'}
            </Text>
            <Ionicons
              name={isRegionModalVisible ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.black}
            />
          </TouchableOpacity>
        </View> */}

        {/* State Vector Container */}
        <StateVectorConatiner matchedStrings={matchedStrings} removeStateVector={removeStateVecotr}/>
        
        {/* Search Results or Recent Searches */}
        {(searchString || '').trim() === '' && !onSearchResults && recentSearches.length > 0 ? (
          <View style={styles.recentSearchesContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultHeaderText}>{t('recent_searches')}</Text>
              
            </View>
            {isLoading && (
                <HorizontalLoadingIndicator 
                  width="100%" 
                  height={3} 
                  backgroundColor={colors.grey_light}
                  activeColor={colors.primary}
                  duration={1500}
                />
              )}
            {recentSearches.map((result, index) => (
              <TouchableOpacity
                key={`${result.name}-${index}`}
                style={styles.recentSearchItem}
                onPress={() => onLocationNamePress(result)}
              >
                <Ionicons name="time-outline" size={20} color={colors.grey} style={styles.recentSearchIcon} />
                <View style={styles.recentSearchTextContainer}>
                  <Text style={styles.recentSearchText}>{result.name}</Text>
                  <Text style={styles.recentSearchAddress}>{result.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (searchString || '').trim() !== '' || stateVector ? (
          <View>
            {/* <View style={styles.resultHeader}>
              <Text style={styles.resultHeaderText}>
                {(searchString || '').length < 1 ? `Search results` : `Search results for "${searchString}"`}
              </Text>
              
            </View> */}
            {isLoading && (
                <HorizontalLoadingIndicator 
                  width="100%" 
                  height={3} 
                  backgroundColor={colors.grey_light}
                  activeColor={colors.primary}
                  duration={1500}
                />
              )}
            {isLoading ? (
              <SearchResultSkeleton count={8} 
              />
            ) : (!hasSearchResults || (onSearchResults && onSearchResults.length === 0 ) )? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={40} color={colors.black} />
                <Text style={styles.noResultsText}>{t('no_results_found')}</Text>

                <Text style={styles.alternateFound}>{t('if_you_cannot_find_place_through_search_choose_place_by_mark_on_the_map')}</Text>
              </View>
            ) : (
                <SearchResultContainer    
                    data={onSearchResults}
                    onItemPress={selectedCallBack}
                 
                />
            )}
          </View>
        ) : (
          <>
           {/* <TouchableOpacity style={styles.bottomBtnSearch} onPress={()=>handleLocateOnMap()}>
                <Entypo name="location" size={18} color={colors.black} />
                <Text style={[styles.bottomBtnTxt, { color: colors.black }]}>{t('locate_on_map')}</Text>
              </TouchableOpacity> */}
          <ScrollView style={{paddingHorizontal:5, flex: 1}} contentContainerStyle={{paddingBottom: height*0.2}}>
             
            <FavLabelItems style={{marginBottom:10}} onLabelPress={handleFavouriteLocationPress} enableAdd={false}  />
            <HistoryCard style={{marginBottom:10}} selectCallback={onLocationNamePress}/>

          </ScrollView>
          </>
        )}
        
      { (!hidePickLocation && !(((searchString || '').trim() == '') || stateVector )) && ( <TouchableOpacity style={styles.bottomBtn} onPress={()=>handleLocateOnMap()}>
          <Entypo name="location" size={18} color={colors.white} />
          <Text style={styles.bottomBtnTxt}>{t('locate_on_map')}</Text>
        </TouchableOpacity>
       )}

        {/* Region Selection Modal */}
        <Modal
          visible={isRegionModalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={hideRegionModal}
          statusBarTranslucent={true}
        >
          <TouchableOpacity 
            style={styles.regionModalOverlay} 
            activeOpacity={1} 
            onPress={hideRegionModal}
          >
            <View style={styles.regionModalContent}>
              <View style={styles.regionModalHeader}>
                <Text style={styles.regionModalTitle}>Select Search Region</Text>
                <TouchableOpacity onPress={hideRegionModal}>
                  <Ionicons name="close" size={24} color={colors.black} />
                </TouchableOpacity>
              </View>
              <View style={styles.regionList}>
                {REGIONS.map((region) => (
                  <TouchableOpacity
                    key={region.id}
                    style={[
                      styles.regionItem,
                      selectedRegion.id === region.id && styles.selectedRegionItem
                    ]}
                    onPress={() => handleRegionSelect(region)}
                  >
                    <Text style={[
                      styles.regionItemText,
                      selectedRegion.id === region.id && styles.selectedRegionText
                    ]}>
                      {region.name}
                    </Text>
                    {selectedRegion.id === region.id && (
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
  );
};

SearchScreenWrapper.propTypes = {
  onSearchClick: PropTypes.func,
  searchType: PropTypes.any,
  fromaddWayPoint: PropTypes.bool,
  getwaitingTime: PropTypes.bool,
  title: PropTypes.any,
  index: PropTypes.any,
  label: PropTypes.any,
  onClose: PropTypes.func,
  searchString: PropTypes.string,
};

export default SearchScreenWrapper;

const styles = StyleSheet.create({
  screen: {
   
    backgroundColor: 'transparent',
    borderRadius:10,
    
  },
  inputContainer: {
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 12,
    backgroundColor: colors.grey_xxlight,
    borderWidth: 1,
    borderColor: colors.grey_light,
    marginTop: 5,
    marginBottom: 10,
    
    height: 50,
  
  },
  bottomBtnSearch: {  
    
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grey_xdark,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center',
    marginVertical: 5,
    
  },
  searchContainer: {
 
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  closeBtn: {
    width: '12%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 5,
    color: colors.black,
    fontFamily: Fonts.regular,
    fontSize: 16,
    backgroundColor: 'transparent'
  },
  regionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  regionLabel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: colors.grey_dark,
  },
  dropDownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.grey_light,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dropDownText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: colors.black,
    marginRight: 8,
  },
  resultHeader: {
    paddingHorizontal: 15,
    paddingVertical: 10,
   
    backgroundColor: 'black',
    gap: 8,
  },
  resultHeaderText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: colors.white,
  },
  recentSearchesContainer: {
    flex: 1,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey_light,
  },
  recentSearchIcon: {
    marginRight: 10,
  },
  recentSearchTextContainer: {
    flex: 1,
  },
  recentSearchText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: colors.black,
  },
  recentSearchAddress: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: colors.grey_dark,
    marginTop: 2,
  },

  noResultsContainer: {
    height:height*0.8,
    
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: height*0.1,
    
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: colors.black,
    marginTop: 10,
  },
  alternateFound: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: colors.grey_dark,
    marginTop: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  regionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  regionModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  regionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey_light,
  },
  regionModalTitle: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: colors.black,
  },
  regionList: {
    padding: 16,
  },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey_light,
  },
  selectedRegionItem: {
    backgroundColor: colors.grey_light,
  },
  regionItemText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: colors.black,
  },
  selectedRegionText: {
    fontFamily: Fonts.medium,
    color: colors.primary,
  },
  bottomBtn: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: colors.black,
    borderTopWidth: 1,
    borderTopColor: colors.grey_light,
  },
  bottomBtnTxt: {
    fontFamily: Fonts.regular,
    color: colors.white,
    fontSize: 16,
    marginLeft: 15,
  },
  searchAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingRight: 10
  },
});
