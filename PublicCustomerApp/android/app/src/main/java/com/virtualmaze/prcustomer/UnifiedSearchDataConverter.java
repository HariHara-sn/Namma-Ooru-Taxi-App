package com.virtualmaze.prcustomer;

import com.dot.nenativemap.search.UnifiedSearchData;
import com.dot.nenativemap.search.NearbyStreet;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class UnifiedSearchDataConverter {
    public static WritableArray toReadableMap(ArrayList<UnifiedSearchData> dataList) {
        WritableArray unifiedSearchArray = Arguments.createArray();

        for (UnifiedSearchData data : dataList) {
            WritableMap itemMap = Arguments.createMap();

            // Convert category list
            if (data.getCategory() != null) {
                WritableArray categoryArray = Arguments.createArray();
                for (String category : data.getCategory()) {
                    categoryArray.pushString(category);
                }
                itemMap.putArray("category", categoryArray);
            }

            // Convert place name list
            if (data.getPlaceName() != null) {
                WritableArray placeNameArray = Arguments.createArray();
                for (String placeName : data.getPlaceName()) {
                    placeNameArray.pushString(placeName);
                }
                itemMap.putArray("placeName", placeNameArray);
            }

            // Convert score
            if (data.getScore() != null) {
                itemMap.putString("score", data.getScore());
            }

            // Convert section type
            if (data.getSectionType() != null) {
                itemMap.putString("sectionType", data.getSectionType());
            }

            // Convert state vector for matches
            if (data.getStateVectorForMatches() != null) {
                WritableMap stateVectorMap = Arguments.createMap();
                for (Map.Entry<String, List<Object>> entry : data.getStateVectorForMatches().entrySet()) {
                    WritableArray valueArray = Arguments.createArray();
                    for (Object value : entry.getValue()) {
                        if (value instanceof String) {
                            valueArray.pushString((String) value);
                        } else if (value instanceof Number) {
                            valueArray.pushDouble(((Number) value).doubleValue());
                        } else if (value instanceof Boolean) {
                            valueArray.pushBoolean((Boolean) value);
                        }
                    }
                    stateVectorMap.putArray(entry.getKey(), valueArray);
                }
                itemMap.putMap("stateVectorForMatches", stateVectorMap);
            }

            // Convert address list
            if (data.getAddress() != null) {
                WritableArray addressArray = Arguments.createArray();
                for (String address : data.getAddress()) {
                    addressArray.pushString(address);
                }
                itemMap.putArray("address", addressArray);
            }

            // Convert distance
            if (data.getDistance() != null) {
                itemMap.putString("distance", data.getDistance());
            }

            // Convert info
            if (data.getInfo() != null) {
                itemMap.putString("info", data.getInfo());
            }

            // Convert name list
            if (data.getName() != null) {
                WritableArray nameArray = Arguments.createArray();
                for (String name : data.getName()) {
                    nameArray.pushString(name);
                }
                itemMap.putArray("name", nameArray);
            }

            // Convert position list
            if (data.getPos() != null) {
                WritableArray posArray = Arguments.createArray();
                for (Double pos : data.getPos()) {
                    posArray.pushDouble(pos);
                }
                itemMap.putArray("pos", posArray);
            }

            // Convert tsrwscore
            if (data.getTsrwscore() != null) {
                itemMap.putString("tsrwscore", data.getTsrwscore());
            }

            // Convert addressID
            if (data.getAddressID() != null) {
                itemMap.putString("addressID", data.getAddressID());
            }

            // Convert house number
            if (data.getHouseNumber() != null) {
                itemMap.putString("houseNumber", data.getHouseNumber());
            }

            // Convert nearby streets
            if (data.getNearbyStreets() != null) {
                WritableArray nearbyStreetsArray = Arguments.createArray();
                for (NearbyStreet street : data.getNearbyStreets()) {
                    WritableMap streetMap = Arguments.createMap();
                    if (street.getClass_() != null) {
                        streetMap.putString("class", street.getClass_());
                    }
                    if (street.getDistance() != null) {
                        streetMap.putString("distance", street.getDistance());
                    }
                    if (street.getStreetName() != null) {
                        streetMap.putString("streetName", street.getStreetName());
                    }
                    nearbyStreetsArray.pushMap(streetMap);
                }
                itemMap.putArray("nearbyStreets", nearbyStreetsArray);
            }

            // Convert shortcut name
            if (data.getShortcutName() != null) {
                itemMap.putString("shortcutName", data.getShortcutName());
            }

            // Convert refine search
            if (data.getRefineSearch() != null) {
                itemMap.putBoolean("refineSearch", data.getRefineSearch());
            }

            unifiedSearchArray.pushMap(itemMap);
        }

        return unifiedSearchArray;
    }
}
