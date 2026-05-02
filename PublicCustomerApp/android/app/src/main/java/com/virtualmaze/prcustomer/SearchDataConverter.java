package com.virtualmaze.prcustomer;

import android.util.Log;

import com.dot.nenativemap.search.Area;
import com.dot.nenativemap.search.FastMatch;
import com.dot.nenativemap.search.FullSearch;
import com.dot.nenativemap.search.MatchedString;
import com.dot.nenativemap.search.SearchData;
import com.dot.nenativemap.search.Street;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.List;
import java.util.Map;

public class SearchDataConverter {

    public static WritableMap toReadableMap(SearchData searchData) {
        WritableMap map = Arguments.createMap();
        Log.d("TAG", "toReadableMap: hari---" + searchData);

        if (searchData == null) {
            Log.w("AJIN", "SearchData is null in converter");
            return map;
        }

        try {
            List<MatchedString> matchedStrings = searchData.getMatchedStrings();
            List<FastMatch> fastMatches = searchData.getFastMatch();
            List<FullSearch> fullSearches = searchData.getFullSearch();
            List<Area> country = searchData.getCountry();
            List<Area> state = searchData.getState();
            List<Area> city = searchData.getCity();
            List<Area> district = searchData.getDistrict();
            List<Street> street = searchData.getStreet();
            List<Area> area = searchData.getArea();

            Log.d("AJIN", "matchedStrings length: " + (matchedStrings != null ? matchedStrings.size() : 0));
            Log.d("AJIN", "fastMatches length: " + (fastMatches != null ? fastMatches.size() : 0));
            Log.d("AJIN", "fullSearches length: " + (fullSearches != null ? fullSearches.size() : 0));
            Log.d("AJIN", "country length: " + (country != null ? country.size() : 0));
            Log.d("AJIN", "state length: " + (state != null ? state.size() : 0));
            Log.d("AJIN", "city length: " + (city != null ? city.size() : 0));
            Log.d("AJIN", "district length: " + (district != null ? district.size() : 0));
            Log.d("AJIN", "street length: " + (street != null ? street.size() : 0));
            Log.d("AJIN", "area length: " + (area != null ? area.size() : 0));

            if (matchedStrings != null) {
                map.putArray("matchedStrings", convertMatchedStrings(matchedStrings));
            }
            if (fastMatches != null) {
                map.putArray("fastMatch", convertFastMatches(fastMatches));
            }
            if (fullSearches != null) {
                map.putArray("fullSearch", convertFullSearch(fullSearches));
            }
            if (country != null) {
                map.putArray("country", convertAreas(country));
            }
            if (state != null) {
                map.putArray("state", convertAreas(state));
            }
            if (city != null) {
                map.putArray("city", convertAreas(city));
            }
            if (district != null) {
                map.putArray("district", convertAreas(district));
            }
            if (street != null) {
                map.putArray("street", convertStreets(street));
            }
            if (area != null) {
                map.putArray("area", convertAreas(area));
            }
        } catch (Exception e) {
            Log.e("AJIN", "Error converting SearchData: " + e.getMessage());
            e.printStackTrace();
        }

        return map;
    }

    private static WritableArray convertMatchedStrings(List<MatchedString> matchedStrings) {
        WritableArray array = Arguments.createArray();
        if (matchedStrings != null) {
            for (MatchedString matchedString : matchedStrings) {
                WritableMap map = Arguments.createMap();
                if (matchedString.getIndex() != null) {
                    map.putInt("index", matchedString.getIndex());
                }
                if (matchedString.getKey() != null) {
                    map.putString("key", matchedString.getKey());
                }
                if (matchedString.getText() != null) {
                    map.putString("text", matchedString.getText());
                }
                array.pushMap(map);
            }
        }
        return array;
    }

    private static WritableArray convertAreas(List<Area> areas) {
        WritableArray array = Arguments.createArray();
        if (areas != null) {
            for (Area area : areas) {
                WritableMap map = Arguments.createMap();
                if (area.getName() != null) {
                    map.putArray("name", toReadableArray(area.getName()));
                }
                if (area.getPos() != null && area.getPos().size() >= 2) {
                    map.putDouble("latitude", area.getPos().get(0));
                    map.putDouble("longitude", area.getPos().get(1));
                }
                if (area.getDistance() != null) {
                    map.putDouble("distance", area.getDistance());
                }
                if (area.getInfo() != null) {
                    map.putString("info", area.getInfo());
                }
                if (area.getScore() != null) {
                    map.putDouble("score", area.getScore());
                }
                array.pushMap(map);
            }
        }
        return array;
    }

    private static WritableArray convertFastMatches(List<FastMatch> fastMatches) {
        WritableArray array = Arguments.createArray();
        Log.d("TAG", "convertFastMatches: " + fastMatches);
        if (fastMatches != null) {
            for (FastMatch fastMatch : fastMatches) {
                WritableMap map = Arguments.createMap();
                if (fastMatch.getPrimaryCategory() != null) {
                    map.putString("primaryCategory", fastMatch.getPrimaryCategory());
                }
                if (fastMatch.getPrimaryText() != null) {
                    map.putString("primaryText", fastMatch.getPrimaryText());
                }
                if (fastMatch.getSecondaryCategory() != null) {
                    map.putString("secondaryCategory", fastMatch.getSecondaryCategory());
                }
                if (fastMatch.getSecondaryText() != null) {
                    map.putString("secondaryText", fastMatch.getSecondaryText());
                }
                if (fastMatch.getStateVectorForMatches() != null) {
                    WritableMap stateVectorMap = Arguments.createMap();
                    for (Map.Entry<String, List<Object>> entry : fastMatch.getStateVectorForMatches().entrySet()) {
                        WritableArray valueArray = Arguments.createArray();
                        for (Object obj : entry.getValue()) {
                            if (obj instanceof String) {
                                valueArray.pushString((String) obj);
                            } else if (obj instanceof Integer) {
                                valueArray.pushInt((Integer) obj);
                            } else if (obj instanceof Double) {
                                valueArray.pushDouble((Double) obj);
                            } else if (obj instanceof Boolean) {
                                valueArray.pushBoolean((Boolean) obj);
                            }
                        }
                        stateVectorMap.putArray(entry.getKey(), valueArray);
                    }
                    map.putMap("stateVectorForMatches", stateVectorMap);
                }
                array.pushMap(map);
            }
        }
        return array;
    }

    private static WritableArray convertFullSearch(List<FullSearch> fullSearches) {
        WritableArray array = Arguments.createArray();
        if (fullSearches != null) {
            for (FullSearch fullSearch : fullSearches) {
                WritableMap map = Arguments.createMap();
                if (fullSearch.getAddress() != null) {
                    map.putArray("address", toReadableArray(fullSearch.getAddress()));
                }
                if (fullSearch.getAddressID() != null) {
                    map.putString("addressID", fullSearch.getAddressID());
                }
                if (fullSearch.getCategory() != null) {
                    map.putArray("category", toReadableArray(fullSearch.getCategory()));
                }
                if (fullSearch.getDistance() != null) {
                    map.putDouble("distance", fullSearch.getDistance());
                }
                if (fullSearch.getHouseNumber() != null) {
                    map.putString("houseNumber", fullSearch.getHouseNumber());
                }
                if (fullSearch.getInfo() != null) {
                    map.putString("info", fullSearch.getInfo());
                }
                if (fullSearch.getPlaceName() != null) {
                    map.putArray("place_name", toReadableArray(fullSearch.getPlaceName()));
                }
                if (fullSearch.getPos() != null && fullSearch.getPos().size() >= 2) {
                    map.putDouble("latitude", fullSearch.getPos().get(1));
                    map.putDouble("longitude", fullSearch.getPos().get(0));
                }
                if (fullSearch.getScore() != null) {
                    map.putDouble("score", fullSearch.getScore());
                }
                if (fullSearch.getShortcutName() != null) {
                    map.putString("shortcut_name", fullSearch.getShortcutName());
                }
                array.pushMap(map);
            }
        }
        return array;
    }

    private static WritableArray convertStreets(List<Street> streets) {
        WritableArray array = Arguments.createArray();
        if (streets != null) {
            for (Street street : streets) {
                WritableMap map = Arguments.createMap();
                map.putArray("streetName", toReadableArray(street.getName()));
                array.pushMap(map);
            }
        }
        return array;
    }

    private static <T> WritableArray toReadableArray(List<T> list) {
        WritableArray array = Arguments.createArray();
        if (list != null) {
            for (T item : list) {
                if (item instanceof String) {
                    array.pushString((String) item);
                } else if (item instanceof Number) {
                    array.pushDouble(((Number) item).doubleValue());
                } else if (item instanceof Boolean) {
                    array.pushBoolean((Boolean) item);
                }
            }
        }
        return array;
    }
}
