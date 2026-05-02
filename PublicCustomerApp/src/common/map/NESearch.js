import { NativeModules } from "react-native";

const { NeNativeModule } = NativeModules;

const performSearch = async ({
  latitude,
  longitude,
  searchString,
  mapUnitName,
  stateVector={},
  resultCount = 10,
  langCode = 'en',
  debug = false,
  onlineOnly = true,
  makeFullSearch = false,
  isPoiSearch = false,
  radius = 50000,
  category = '',
}) => {
   
  try {
    const categoryFilter = JSON.stringify(category);
    
    const searchResponse = await NeNativeModule.search(
        latitude, //24.4539,    // latitude
        longitude, // 54.3773,  // longitude
        searchString,         // searchString - Text to search for
        mapUnitName,                // mapUnitName - Map region/zone name
        stateVector,          // stateVectorForMatches - State vector for matching results   
        resultCount,          // resultCount - Number of results to return
        langCode,             // lang_code - Language code for results
        debug,                // debug - Enable debug mode
        onlineOnly,           // onlineOnly - Search only online results
        makeFullSearch,       // makeFullSearch - Perform full search
        isPoiSearch,          // isPoiSearch - Search for points of interest
        radius,               // radius - Search radius in meters
        categoryFilter        // category - POI category filter
      );
      
    return searchResponse;
  } catch (error) {
    console.error('Error performing search:', error);
    throw error;
  }
};

const clearSingleStateVector = (vectorName, index) => {
  NeNativeModule.removeStateVector(vectorName, index);
};

const clearAllStateVectors = () => {
  NeNativeModule.clearStateVector();
};

const removeAllMarkers = (markers) => {
  console.log("markers", markers)
  NeNativeModule.removeMarkers(markers);
};

export { performSearch, clearSingleStateVector, clearAllStateVectors, removeAllMarkers };
