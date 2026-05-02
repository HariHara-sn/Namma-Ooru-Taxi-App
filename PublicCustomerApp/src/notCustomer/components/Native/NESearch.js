import { NativeModules } from "react-native";

const { NeNativeModule } = NativeModules;

const performSearch = async ({
  latitude,
  longitude,
  searchString,
  mapUnitName,
  stateVector = {},
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
      latitude,
      longitude,
      searchString,
      mapUnitName,
      stateVector,
      resultCount,
      langCode,
      debug,
      onlineOnly,
      makeFullSearch,
      isPoiSearch,
      radius,
      categoryFilter
    );

    return searchResponse;
  } catch (error) {
    console.error('Error performing search:', error, searchString);
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
  NeNativeModule.removeMarkers(markers);
};

export { performSearch, clearSingleStateVector, clearAllStateVectors, removeAllMarkers };
