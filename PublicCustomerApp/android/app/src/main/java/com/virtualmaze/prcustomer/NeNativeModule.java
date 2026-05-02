package com.virtualmaze.prcustomer;
    
import android.content.Context;
import android.content.DialogInterface;
import android.graphics.PointF;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.app.Activity;
import android.graphics.Rect;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.view.MotionEvent;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import com.dot.nenativemap.search.UnifiedSearchData;
import com.facebook.react.bridge.Promise;

import com.dot.nenativemap.MapChangeListener;
import com.dot.nenativemap.annotations.CircleOptions;
import com.dot.nenativemap.TouchInput;
import com.dot.nenativemap.annotations.PolylineOptions;
import com.dot.nenativemap.directions.RouteElementInstructionsDisplay;
import com.dot.nenativemap.directions.RouteResponse;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.dot.nenativemap.annotations.PatternType;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactMethod;
import com.dot.nenativemap.CameraPosition;
import com.dot.nenativemap.MapView;
import com.dot.nenativemap.Marker;
import com.dot.nenativemap.MapController;
import com.dot.nenativemap.MapView.MapReadyCallback;
import com.dot.nenativemap.SceneError;
import com.dot.nenativemap.LngLat;
import com.dot.nenativemap.geometry.Polyline;
import com.dot.nenativemap.annotations.MarkerOptions;
import com.dot.nenativemap.LocationListener;
import com.dot.nenativemap.navigation.NavigationMode;
import com.dot.nenativemap.navigation.NavigationStatus;
import com.dot.nenativemap.navigation.Navigator;
import com.dot.nenativemap.directions.Directions;
import com.dot.nenativemap.directions.DirectionsCriteria;
import com.dot.nenativemap.directions.RouteCallback;
import com.dot.nenativemap.directions.RouteCount;
import com.dot.nenativemap.directions.RouteInstructionsDisplay;
import com.dot.nenativemap.directions.VHRoutingRequest;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReactApplicationContext;
import java.io.IOException;

import com.nemaps.geojson.Point;
import com.nenative.services.android.navigation.ui.v5.NavigationViewModel;
import com.nenative.services.android.navigation.ui.v5.navigationEndView.NavigationTripData;
import com.virtualmaze.bundle_downloader.NENativeMap;
import com.virtualmaze.bundle_downloader.listener.NENativeDownloadListener;
import com.virtualmaze.bundle_downloader.utils.ProgressType;
import androidx.appcompat.app.AlertDialog;
import com.facebook.react.bridge.ReadableType;
import com.dot.nenativemap.search.SearchResultCallback;
import com.dot.nenativemap.search.SearchResponse;

// import com.dot.nenativemap.search.Search;
// import com.dot.nenativemap.search.SearchResultCallback;
// import com.dot.nenativemap.search.SearchResponse;
// import com.dot.nenativemap.search.SearchData;
// import com.dot.nenativemap.search.PlaceName;
// import com.dot.nenativemap.search.AreaName;
// import com.dot.nenativemap.search.Coordinates;
// import com.dot.nenativemap.search.Postcode;
// import com.dot.nenativemap.search.StreetName;
// import com.dot.nenativemap.search.SearchPOIConstant;

import org.json.JSONArray;

import com.nenative.services.android.navigation.ui.v5.NENativeNavigationFragment;
import com.nenative.services.android.navigation.ui.v5.NavigationEndListener;
import com.nenative.services.android.navigation.ui.v5.NavigationRateListener;
import com.nenative.services.android.navigation.ui.v5.NavigationLauncher;
import com.nenative.services.android.navigation.ui.v5.NavigationLauncherOptions;
import com.nenative.services.android.navigation.ui.v5.utils.Coordinate;
import com.nenative.services.android.navigation.ui.v5.utils.RoutePointData;
import com.nenative.services.android.navigation.v5.routeprogress.ProgressChangeListener;
import com.virtualmaze.ne_location_management.location.ProviderType;
import com.dot.nenativemap.CameraUpdateFactory;
import com.dot.nenativemap.OnMarkerCreateListener;
import com.dot.nenativemap.annotations.StyleType;
import java.util.Collections;
import java.util.concurrent.ConcurrentHashMap;

import com.dot.nenativemap.search.SearchResultCallback;
import com.dot.nenativemap.search.Search;
import com.dot.nenativemap.search.SearchData;
import com.nenative.services.android.navigation.ui.v5.navigationEndView.NavigationTripData;
import com.nenative.services.android.navigation.ui.v5.NavigationView;
// import com.dot.nenativemap.annotations.PolylineOptions;

public class NeNativeModule extends ViewGroupManager<MapView> implements LifecycleEventListener {
    public static final String REACT_CLASS = "NeNativeModule";
    private final ReactApplicationContext reactApplicationContext;
    private int mapLoaded = 0;
    private MapView mapView;
    private String navMode = "realtime";
    private MapController mapController;
    public ThemedReactContext reactNativeContext;

    private ThemedReactContext reactNavigationContext;
    private Set<Polyline> addedPolylines = new HashSet<>();
    private Directions directions;
    private RouteInstructionsDisplay routeInstructionsDisplay;
//    private Navigator navigator;
    Set<String> markersInCreation = new HashSet<>();
    boolean isNavMode = false;
    private Map<String, String> settingsProps = new HashMap<>();

    private Search search;
    // Handler navHandler;
    Runnable navRunnable;
    private Location currentLocation;
   private List<RoutePointData> selectedRoutePoints;
    private LinearLayout parentLayout;
    private FrameLayout frameLayout;
    private android.view.View dummyView; // Us
    // private static final int DUMMY_VIEW_ID = View.generateViewId();
    private static final int DUMMY_VIEW_IDS = View.generateViewId();

    private Set<Marker> addedMarkers = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private HashMap<String, String> markerTextures = new HashMap<>();
    // Dedicated collections for vehicle markers so updates/removals don't affect other markers
    private Set<Marker> vehicleMarkers = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private HashMap<String, String> vehicleMarkerTextures = new HashMap<>();
    private Set<String> vehicleMarkersInCreation = Collections.newSetFromMap(new ConcurrentHashMap<>());

    private int[] routeMargins = new int[]{50, 50, 50, 700};

    // Guard against late callbacks arriving after the view/module has been destroyed
    private volatile boolean isViewDestroyed = false;

    // Stores a requested mode until the map scene is ready
    private String pendingMode = null;
    // Stores a requested bounds until the map scene is ready
    private ReadableArray pendingBounds = null;
    // Stores a requested route (array: [payloadMap, directionKey]) until the map scene is ready
    private ReadableArray pendingRoute = null;
    // Stores a requested route via findRouteWithRequest until the map scene is ready
    private ReadableArray pendingRouteRequest = null;
    // Stores a requested homeLocation until the map scene is ready
    private ReadableArray pendingHomeLocation = null;

    public NeNativeModule(ReactApplicationContext reactApplicationContext) {
        this.reactApplicationContext = reactApplicationContext;
    }

    private TouchInput.TapResponder tapResponder = new TouchInput.TapResponder() {
        @Override
        public boolean onSingleTapUp(float x, float y) {
            return false;
        }

        // on mapclick get the coordinates and emit event to react-native layer
        @Override
        public boolean onSingleTapConfirmed(float x, float y) {
            LngLat tappedPoint = mapController.screenPositionToLngLat(new PointF(x, y));
            double longitude = tappedPoint.longitude;
            double latitude = tappedPoint.latitude;
            // Guard against invalid coordinates (NaN/Infinity) which break RN JSON serialization
            if (Double.isNaN(longitude) || Double.isNaN(latitude) ||
                    Double.isInfinite(longitude) || Double.isInfinite(latitude)) {
                Log.w("NeNativeModule", "Tap produced invalid coords; skipping emit. lon=" + longitude + ", lat=" + latitude);
                return true;
            }
            WritableNativeMap eventData = new WritableNativeMap();
            eventData.putDouble("longitude", longitude);
            eventData.putDouble("latitude", latitude);
            // Avoid eventData.toString() as it can throw when containing special doubles
            Log.d("onMapClick", "lon=" + longitude + ", lat=" + latitude);
            reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onMapClick", eventData);
            return true;
        }
    };

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public void onHostResume() {
        if (mapView != null) {
            mapView.onResume();
            Log.e("RESUME", "RESUME");
        }
        // Try to apply any pending props on resume if controller is ready
        if (mapController != null && mapLoaded == 1) {
            // pending mode
            if (pendingMode != null) {
                try {
                    String mapStyleString = pendingMode.equals("light") ? "DAY2" : "NIGHT2";
                    MapController.MapStyle mapStyle = MapController.MapStyle.valueOf(mapStyleString);
                    mapController.setMapStyle(mapStyle);
                } catch (Throwable t) {
                    Log.e("NeNativeModule", "Failed to apply pending mode on resume", t);
                } finally {
                    pendingMode = null;
                }
            }
            // pending home
            if (pendingHomeLocation != null) {
                try { setHomeLocation(mapView, pendingHomeLocation); } catch (Throwable t) {
                    Log.e("NeNativeModule", "Failed to apply pending home on resume", t);
                } finally { pendingHomeLocation = null; }
            }
            // pending bounds
            if (pendingBounds != null) {
                try { applyBounds(pendingBounds); } catch (Throwable t) {
                    Log.e("NeNativeModule", "Failed to apply pending bounds on resume", t);
                } finally { pendingBounds = null; }
            }
            // pending route
            if (pendingRoute != null) {
                try { findRoute(mapView, pendingRoute); } catch (Throwable t) {
                    Log.e("NeNativeModule", "Failed to apply pending route on resume", t);
                } finally { pendingRoute = null; }
            }
            // pending route request (requests/response)
            if (pendingRouteRequest != null) {
                try { applyRouteRequest(pendingRouteRequest); } catch (Throwable t) {
                    Log.e("NeNativeModule", "Failed to apply pending routeRequest on resume", t);
                } finally { pendingRouteRequest = null; }
            }
        }
    }

    @ReactMethod
    public void pauseMap() {
        if (mapView != null) {
            mapView.onPause();
            Log.e("PAUSE", "PAUSE");
        }
    }

    @ReactMethod
    public void resumeMap() {
        if (mapView != null) {
            mapView.onResume();
            Log.e("RESUME", "RESUME");
        }
    }

    @Override
    public void onHostPause() {
        // Handle pause event, e.g.,
        if (mapView != null) {
            mapView.onPause();
            Log.e("PAUSE", "PAUSE");
        }

    }

    @Override
    public void onHostDestroy() {
        isViewDestroyed = true;
        if (mapView != null) {
            mapView.onDestroy();
            Log.e("DESTROY", "DESTROY");
        }
    }

    @Override
    protected MapView createViewInstance(ThemedReactContext reactContext) {
        reactNativeContext = reactContext;
        isViewDestroyed = false;
        // Prefer Activity context for views that may display UI (dialogs),
        // falling back to themed context if Activity is unavailable.
        Activity activity = reactContext.getCurrentActivity();
        boolean useActivity = activity != null
                && !activity.isFinishing()
                && (android.os.Build.VERSION.SDK_INT < 17 || !activity.isDestroyed());
        mapView = new MapView(useActivity ? activity : reactContext);
        mapView.onCreate(null);
        reactContext.addLifecycleEventListener(this);

        // Guard against rare MotionEvent pointerIndex crashes from the underlying SDK
        mapView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                try {
                    return v.onTouchEvent(event);
                } catch (IllegalArgumentException iae) {
                    // Known Android quirk: "invalid pointerIndex" may be thrown during multi-touch
                    // Swallow to avoid app crash; skip this problematic event
                    if (iae.getMessage() != null && iae.getMessage().contains("pointerIndex")) {
                        Log.w("NeNativeModule", "Swallowed invalid pointerIndex touch event", iae);
                        return true;
                    }
                    throw iae;
                }
            }
        });

        if (settingsProps != null) {
            boolean enable3D = Boolean.parseBoolean(settingsProps.get("enable3D"));
            MapController.enable3dBuildingsVisibility(enable3D);

            boolean enableExtrusions = Boolean.parseBoolean(settingsProps.get("enableExtrusions"));
            MapController.enableExtrusionsVisibility(enableExtrusions);
        }

        mapView.getMapAsync(

                new MapReadyCallback() {
                    @Override
                    public void onMapReady(MapController mapCtrler) {

                        // Ignore callbacks if the view/module has already been destroyed
                        if (isViewDestroyed) {
                            Log.w("NeNativeModule", "onMapReady called after destroy; ignoring");
                            return;
                        }

                        // Defensive: controller may be null if underlying map failed to initialize
                        if (mapCtrler == null) {
                            Log.e("NeNativeModule", "onMapReady called with null MapController");
                            return;
                        }

                        // set map controller
                        mapController = mapCtrler;
                        // set click listener safely
                        try {
                            TouchInput ti = mapCtrler.getTouchInput();
                            if (ti != null) {
                                ti.setTapResponder(tapResponder);
                            } else {
                                Log.w("NeNativeModule", "TouchInput is null on onMapReady");
                            }
                        } catch (Throwable t) {
                            Log.e("NeNativeModule", "Failed to set tap responder", t);
                        }

                        mapController.enable3dBuildingsVisibility(false);
                        mapController.enableExtrusionsVisibility(false);


                        if(settingsProps != null) {
                            String language = settingsProps.get("language");
                            if(language != null) {
                                mapController.setMapLangCode(language);
                            }
                            String mapStyleString = Boolean.parseBoolean(settingsProps.get("enableDarkTheme")) ? "NIGHT2" : "DAY2";
                            MapController.MapStyle mapStyle = MapController.MapStyle.valueOf(mapStyleString);
                            mapController.setMapStyle(mapStyle);
                        }

                        mapController.setMapChangeListener(new MapChangeListener() {
                            @Override
                            public void onViewComplete() {

                            }

                            @Override
                            public void onRegionWillChange(boolean b) {

                            }

                            @Override
                            public void onRegionIsChanging() {

                                float rotation = (float) Math.toDegrees(mapController.getCameraPosition().getRotation());

                                WritableMap eventData = Arguments.createMap();
                                eventData.putDouble("rotation", rotation);
                                reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                        .emit("onMapRotationChanged", eventData);

                            }

                            @Override
                            public void onRegionDidChange(boolean b) {

                                LngLat mapCenter = new LngLat(
                                        mapController.getCameraPosition().longitude,
                                        mapController.getCameraPosition().latitude);

                                double latitude = mapCenter.latitude;
                                double longitude = mapCenter.longitude;

                                // Guard invalid values before emitting
                                if (Double.isNaN(longitude) || Double.isNaN(latitude) ||
                                        Double.isInfinite(longitude) || Double.isInfinite(latitude)) {
                                    Log.w("NeNativeModule", "Center change invalid coords; lon=" + longitude + ", lat=" + latitude);
                                    return;
                                }

                                WritableMap eventData = Arguments.createMap();
                                eventData.putDouble("latitude", latitude);
                                eventData.putDouble("longitude", longitude);
                                eventData.putBoolean("moving", b);
                                reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                        .emit("onMapCenterChanged", eventData);
                            }
                        });

                        // Map is ready, perform any necessary operations
                        Log.e("MAP LOADING DONE", mapCtrler.toString());
                        mapCtrler.setMinimumZoomLevel(4.0f);
                        mapCtrler.setMaximumZoomLevel(18.0f);
                        mapCtrler.setMapMode(MapController.MapMode.ONLINE);
                        mapCtrler.setCurrentLocationEnabled(true);
                        LngLat origin = new LngLat(77.181608, 8.341317);
                        CameraPosition camera = mapCtrler.getCameraPosition();
                        camera.longitude = origin.longitude;
                        camera.latitude = origin.latitude;
                        camera.zoom = 10;
                        mapCtrler.flyToCameraPosition(camera, 100, null);

                        // mapCtrler.requestRender();
                        mapCtrler.setSceneLoadListener(new MapController.SceneLoadListener() {
                            @Override
                            public void onSceneReady(int sceneId, SceneError sceneError) {
                                Log.e("AJIN", "" + sceneId);
                                mapLoaded = 1;
                                initSearch("southern-zone", "India Southern Zone");
                                // Apply any pending map mode requested before scene was ready
                                if (pendingMode != null) {
                                    try {
                                        String mapStyleString = pendingMode.equals("light") ? "DAY2" : "NIGHT2";
                                        MapController.MapStyle mapStyle = MapController.MapStyle.valueOf(mapStyleString);
                                        mapController.setMapStyle(mapStyle);
                                    } catch (Throwable t) {
                                        Log.e("NeNativeModule", "Failed to apply pending mode", t);
                                    } finally {
                                        pendingMode = null;
                                    }
                                }
                                // Apply any pending bounds
                                if (pendingBounds != null) {
                                    try {
                                        applyBounds(pendingBounds);
                                    } catch (Throwable t) {
                                        Log.e("NeNativeModule", "Failed to apply pending bounds", t);
                                    } finally {
                                        pendingBounds = null;
                                    }
                                }
                                // Apply any pending homeLocation
                                if (pendingHomeLocation != null) {
                                    try {
                                        setHomeLocation(mapView, pendingHomeLocation);
                                    } catch (Throwable t) {
                                        Log.e("NeNativeModule", "Failed to apply pending homeLocation", t);
                                    } finally {
                                        pendingHomeLocation = null;
                                    }
                                }
                                // Apply any pending route
                                if (pendingRoute != null) {
                                    try {
                                        findRoute(mapView, pendingRoute);
                                    } catch (Throwable t) {
                                        Log.e("NeNativeModule", "Failed to apply pending route", t);
                                    } finally {
                                        pendingRoute = null;
                                    }
                                }
                                // Apply any pending findRouteWithRequest payload
                                if (pendingRouteRequest != null) {
                                    try {
                                        applyRouteRequest(pendingRouteRequest);
                                    } catch (Throwable t) {
                                        Log.e("NeNativeModule", "Failed to apply pending routeRequest", t);
                                    } finally {
                                        pendingRouteRequest = null;
                                    }
                                }
                                reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                        .emit("onMapReady", new WritableNativeMap());
                            }
                        });
                        mapCtrler.setRouteCallback(getRouteCallback());

                        mapCtrler.addCurrentLocationListener(new LocationListener() {
                            @Override
                            public void onLocationChanged(Location location) {
                                // Log.e("My Location",""+location);
                                double longitude = location.getLongitude();
                                double latitude = location.getLatitude();
                                if (Double.isNaN(longitude) || Double.isNaN(latitude) ||
                                        Double.isInfinite(longitude) || Double.isInfinite(latitude)) {
                                    Log.w("NeNativeModule", "Location invalid coords; lon=" + longitude + ", lat=" + latitude);
                                    return;
                                }
                                WritableNativeMap eventData = new WritableNativeMap();
                                eventData.putDouble("longitude", longitude);
                                eventData.putDouble("latitude", latitude);

                                reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                        .emit("onUserLocationChange", eventData);

                            }
                        });
                    }

                }

        );
        SharedDirections.setSharedMapView(mapView);
        return mapView;
    }

    @ReactProp(name = "settingsProps")
    public void setSettingsProps(MapView mapView, ReadableMap settingsProps) {
        Log.e("SettingsProps", " " + settingsProps);
        if (settingsProps != null) {
            ReadableMapKeySetIterator iterator = settingsProps.keySetIterator();
            while (iterator.hasNextKey()) {
                String key = iterator.nextKey();
                if (settingsProps.getType(key) == ReadableType.Boolean) {
                    boolean value = settingsProps.getBoolean(key);
                    this.settingsProps.put(key, String.valueOf(value));
                } else if (settingsProps.getType(key) == ReadableType.String) {
                    String value = settingsProps.getString(key);
                    this.settingsProps.put(key, value);
                }
            }
            // if(mapController != null)
            // mapController.setMapLangCode(this.settingsProps.get("language"));
        }
    }

    public void initSearch(String mapUnit, String mapUnitName) {
        Log.e("Error initSearch", " " + search + " " + mapController);
        if (mapController != null) {
            search = new Search();
            String pathPrefix = reactNativeContext.getFilesDir().getAbsolutePath();
            HashMap<String, String> searchFilePaths = new HashMap<>();
            if (!mapUnit.isEmpty() && !mapUnitName.isEmpty()) {
                searchFilePaths.put(mapUnit, mapUnitName);
            }
            Log.e("Search", "load" + " " + mapController + " " + pathPrefix + searchFilePaths);
            
            search.getInstance().init(
                mapController, pathPrefix, searchFilePaths);
        } else {
            Log.e("Search", "Error in initSearch: search or mapController is null");
        }
    }

    private static final double DEG2RADFACTOR = Math.PI / 180.0;
    private static final double KEquatorialRadius = 6378137.0; // in meters
    private static final double KPolarRadius = 6356752.3142; // in meters

    private double calculateDistance(double lon1, double lat1, double lon2, double lat2) {
        // calculates angle between latitude
        final double deltaLat = (lat2 - lat1) * DEG2RADFACTOR;
        // calculates angle between longitude
        final double deltaLon = (lon2 - lon1) * DEG2RADFACTOR;
        // calculates the earth radius at the specific latitude
        final double currentRadius = KEquatorialRadius * Math.cos(lat1 * DEG2RADFACTOR);
        // multiplies the latitude by the smaller polar radius
        final double meter_Y = KPolarRadius * deltaLat;
        // multiplies the longitude by the current earth radius.
        final double meter_X = currentRadius * deltaLon;
        // calculates the distance between the two points assuming that the
        // curvature is equal in X and Y using Pythagoras' theorem.
        return Math.sqrt(meter_X * meter_X + meter_Y * meter_Y);
    }

    private String capitalizeFirstLetter(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    }


    private void emitErrorEvent(String errorMessage) {
        WritableMap eventData = Arguments.createMap();
        eventData.putString("error", errorMessage);
        reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onSearchPOIError", eventData);
    }

    @ReactProp(name = "navMode")
    public void setNavMode(MapView mapView, String mode) {
        if (mapController != null) {
            navMode = mode;
        }
    }

    @ReactProp(name = "mode")
    public void setMode(MapView mapView, String mode) {
        // If controller or scene is not ready, store requested mode to apply later
        if (mapController == null || mapLoaded == 0) {
            pendingMode = mode;
            return;
        }
        try {
            String mapStyleString = mode.equals("light") ? "DAY2" : "NIGHT2";
            MapController.MapStyle mapStyle = MapController.MapStyle.valueOf(mapStyleString);
            mapController.setMapStyle(mapStyle);
        } catch (Throwable t) {
            // If the underlying controller pointer became invalid (e.g., after process death),
            // cache the mode and let it apply after a fresh controller is created
            Log.e("NeNativeModule", "setMode failed; deferring", t);
            pendingMode = mode;
        }
    }


    /**
     * Emits a general error event to React Native
     * Event name: "onNativeError"
     * Event data: { errorType, errorMessage, errorCode, timestamp }
     * 
     * Usage in React Native:
     * DeviceEventEmitter.addListener('onNativeError', (errorData) => {
     *   console.log('Native Error:', errorData.errorType, errorData.errorMessage, errorData.errorCode);
     * });
     */
    private void emitGeneralErrorEvent(String errorType, String errorMessage, String errorCode) {
        WritableMap eventData = Arguments.createMap();
        eventData.putString("errorType", errorType);
        eventData.putString("errorMessage", errorMessage);
        eventData.putString("errorCode", errorCode);
        eventData.putLong("timestamp", System.currentTimeMillis());
        reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onNativeError", eventData);
    }

        /**
     * Emits a navigation-specific error event to React Native
     * Event name: "onNavigationError"
     * Event data: { errorType: "NAVIGATION_ERROR", errorMessage, errorCode, timestamp }
     * 
     * Usage in React Native:
     * DeviceEventEmitter.addListener('onNavigationError', (errorData) => {
     *   console.log('Navigation Error:', errorData.errorMessage, errorData.errorCode);
     * });
     */
    private void emitNavigationErrorEvent(String errorMessage, String errorCode) {
        WritableMap eventData = Arguments.createMap();
        eventData.putString("errorType", "NAVIGATION_ERROR");
        eventData.putString("errorMessage", errorMessage);
        eventData.putString("errorCode", errorCode);
        eventData.putLong("timestamp", System.currentTimeMillis());
        reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onNavigationError", eventData);
    }

    @ReactProp(name = "homeLocation")
    public void setHomeLocation(MapView mapView, ReadableArray location) {
        if (location == null) {
            return;
        }
        if (mapController == null || mapLoaded == 0) {
            // cache until ready
            try { pendingHomeLocation = location; } catch (Throwable ignored) {}
            return;
        }
        try {
            Log.e("homeLocation", "location: " + location);
            ReadableMap homeLocation = location.getMap(0);
            CameraPosition camera = mapController.getCameraPosition();
            camera.longitude = homeLocation.getDouble("lng");
            camera.latitude = homeLocation.getDouble("lat");
            camera.zoom = homeLocation.getInt("zoom");
            mapController.flyToCameraPosition(camera, 1000, null);
        } catch (Throwable t) {
            Log.e("NeNativeModule", "setHomeLocation failed; deferring", t);
            try { pendingHomeLocation = location; } catch (Throwable ignored) {}
        }
    }

    // Add this method to handle cleanup when the component unmounts

    public void onDropViewInstance(MapView view) {
        isViewDestroyed = true;
        if (mapView != null) {
            try {
                mapView.onDestroy();
            } catch (Throwable t) {
                Log.e("NeNativeModule", "Error destroying mapView", t);
            }
        }
        mapController = null;
        mapView = null;
        addedPolylines = new HashSet<>();
        pendingMode = null;
        pendingBounds = null;
        pendingRoute = null;
        pendingHomeLocation = null;
        mapLoaded = 0;
        if (directions != null) {
            try {
                directions.getInstance().onDestroy();
            } catch (Throwable t) {
                Log.e("NeNativeModule", "Error destroying directions", t);
            }
        }
        directions = null;
        // routeInstructionsDisplay=null;
    }
    public Integer getMarkerDrawable(String type) {
        switch (type) {
           
            case "marker_start": return R.drawable.vehicle_start;
            case "marker_end": return R.drawable.vehicle_end;
            case "marker_waypoint": return R.drawable.marker_stop_grey;
            case "location_pin": return R.drawable.marker_stop_grey;
            case "stop_1": return R.drawable.stop_1;
            case "stop_2": return R.drawable.stop_2;
            case "stop_3": return R.drawable.stop_3;
            case "stop_4": return R.drawable.stop_4;
            case "stop_5": return R.drawable.stop_5;
            case "stop_6": return R.drawable.stop_6;
            case "drop_point": return R.drawable.drop_point;
            case "pickup_point": return R.drawable.pickup_point;
            case "bearing": return R.drawable.bearing;
            case "over_speed": return R.drawable.over_speed;
            case "hard_acceleration": return R.drawable.hard_acceleration;
            case "hard_braking": return R.drawable.hard_brake;
            case "hard_corner": return R.drawable.hard_corner;

            default: return null;
        }
    }

    private String getTextures(String markerType) {
        switch (markerType) {
            case "suv":
                return "not_suv";
            case "hatchback":
                return "not_hatch";
            case "sedan":
                return "not_sedan";
            case "bike":
                return "not_bike";
            case "auto":
                return "not_auto";
            case "electric_suv":
                return "not_electric_suv";
            case "electric_hatchback":
                return "not_electric_hatch";
            case "electric_sedan":
                return "not_electric_sedan";
            case "electric_bike":
                return "not_electric_bike";
            case "electric_auto":
                return "not_electric_auto";
            case "home":
                return "not_home";
            default:
                return null;
        }
    }
    
    @ReactMethod
    public synchronized void removeMarkers(ReadableArray markers) {
        for (int i = 0; i < markers.size(); i++) {
            ReadableMap markerData = markers.getMap(i);
            String markerId = markerData.getString("id");
            Marker marker = findMarkerWithId(markerId);
            
           
            if (marker != null) {
                
                mapController.removeMarker(marker.getMarkerId());
            }
        }
    }

    @ReactProp(name = "markers")
    public synchronized void setMarkers(MapView mapView, ReadableArray markers) {
        try {
            if (mapController == null) {
                markerTextures.clear();
                addedMarkers.clear();
                markersInCreation.clear();
                return;
            }
            if (markers == null) {
                mapController.removeAllMarkers();
                synchronized (addedMarkers) {
                    markerTextures.clear();
                    addedMarkers.clear();
                    markersInCreation.clear();
                }
                return;
            }
            if (markers.size() == 0) {
                mapController.removeAllMarkers();
                synchronized (addedMarkers) {
                    markerTextures.clear();
                    addedMarkers.clear();
                    markersInCreation.clear();
                }
                return;
            }
            HashSet <Marker> currentMarkers = new HashSet<>();
            HashSet<Marker> markersToRemove = new HashSet<>(addedMarkers);
            for (int i = 0; i < markers.size(); i++) {
                try {
                    ReadableMap markerData = markers.getMap(i);
                    double latitude = markerData.getDouble("lat");
                    double longitude = markerData.getDouble("lng");
                    String markerId = markerData.getString("id");
                    String markerType = markerData.getString("type");
                    int markerSize = markerData.getInt("size");
                    boolean isMarkerSelected = markerData.getBoolean("selected");
                    boolean focus = markerData.getBoolean("focus");
                    boolean animate = markerData.getBoolean("animate");
                    int animationTime = markerData.getInt("animationTime");
                    boolean showToolTip = markerData.getBoolean("showToolTip");
                    boolean doRotation = markerData.getBoolean("doRotation");
                    String title = markerData.getString("title");
                    String snippet = markerData.getString("snippet");
                    int angle = markerData.getInt("angle");
                    Marker marker = findMarkerWithId(markerId);
                    Integer markerDrawable = getMarkerDrawable(markerType);

                    System.out.println("AJIN MARKER TYPE------------------------ " + markerType + " DRAWABLE " + markerDrawable);
                    MarkerOptions markerOptions = new MarkerOptions()
                            .name(markerId)
                            .position(new LngLat(longitude, latitude))
                            .size(markerSize)
                            .interactive(true)
                            .flat(true)
                            .style(StyleType.ROTATABLE_MARKER);

                    if(markerDrawable==null){
                        String textureStr = getTextures(markerType);
                        if(textureStr!=null){   
                        markerOptions.texture(textureStr);
                        }else{
                            markerOptions.texture(markerType);
                        }
                    }else{
                        markerOptions.resource(markerDrawable);
                    }

                    if(!doRotation){
                        markerOptions.flat(false);
                    }
    //                    .texture(markerType);

                    if(showToolTip==true){
                        markerOptions.title(title).snippet(snippet);
                    }
                    if(doRotation){
                        markerOptions.rotation(angle);
                    }
                    if(marker!=null){
                        try {
                            Long prevMarkerId = marker.getMarkerId();
                            if (prevMarkerId == null) {
                                // Handle the case where prevMarkerId is null
                                Log.d("AJIN", "prevMarkerId is null");
                                marker = null;
                            }
                        } catch (Exception e) {
                            Log.e("MARKER_ERROR", "Error getting marker ID: " + e.getMessage());
                            marker = null;
                        }
                    }

                    if(marker==null){
                        /* Check marker is already queued for creation */
                        if(markersInCreation.contains(markerId)){
                            continue;
                        }
                        /* Add the marker id in queue for creation */
                        markersInCreation.add(markerId);
                        OnMarkerCreateListener onMarkerCreateListener = new OnMarkerCreateListener() {
                            @Override
                            public synchronized void onMarkerCreated(Marker marker) {
                                try {
                                    if(mapController==null){
                                        Log.d("AJIN", "MAP ctrl not");
                                        return;
                                    }
                                    Log.d("AJIN","MARKER CREATE EMMITED " + marker.getMarkerName());
                                    markersInCreation.remove(markerId);
                                    MarkerData userData = new MarkerData();
                                    userData.setId(markerId);
                                    marker.setUserData(userData);
                                    // marker.setDrawable(markerDrawable);
                                    Log.d("AJIN", markerId + " Set usedata");
                                    if(doRotation==true){
                                        mapController.NEMarkerSetAngle(marker, angle);
                                    }
                                    synchronized (addedMarkers) {
                                        addedMarkers.add(marker);
                                    }
                                    // markerTextures.put(markerId,markerType);
                                    if (isMarkerSelected) {
                                        mapController.selectMarker(marker);
                                    }else{
                                        mapController.deselectMarker(marker);
                                    }
                                    synchronized (currentMarkers) {
                                        currentMarkers.add(marker);
                                    }
                                } catch (Exception e) {
                                    Log.e("MARKER_ERROR", "Error in onMarkerCreated: " + e.getMessage());
                                }
                            }

                            @Override
                            public void onFailed(String name) {
                                Log.d("AJIN", "Failed marker " + name);
                                markersInCreation.remove(markerId);
                            }
                        };
                        try {
                            mapController.NEMarkerAdd(markerOptions, onMarkerCreateListener);
                        } catch (Exception e) {
                            Log.e("MARKER_ERROR", "Error adding marker: " + e.getMessage());
                            markersInCreation.remove(markerId);
                        }
                    }else{
                        try {
                            LngLat oldpos = marker.getPosition();
                            oldpos.longitude = longitude;
                            oldpos.latitude = latitude;
                            if(animate){
                                marker.setPointEased(oldpos,animationTime, MapController.EaseType.LINEAR);
                            }else{
                                marker.setPoint(new LngLat(longitude,latitude));
                            }
                            if(focus){
                                CameraPosition cameraPosition = mapController.getCameraPosition();
                                float zoom = 14;
                                float cameraZoom = cameraPosition.getZoom();
                                if(cameraZoom>14.0){
                                    zoom = cameraZoom;
                                }
                                mapController.updateCameraPosition(CameraUpdateFactory.newLngLatZoom(new LngLat(longitude,latitude), zoom),100);
                            }
                            if (isMarkerSelected) {
                                mapController.selectMarker(marker);
                            }else{
                                mapController.deselectMarker(marker);
                            }
                            String prevString = markerTextures.get(markerId);

                            if (prevString!= null && !markerType.equals(prevString)) {
                                marker.setVisible(false);
                                // mapController.NEMarkerSetStyle(marker, markerOptions);
                                // marker.setDrawable(markerDrawable);
                                // markerTextures.put(markerId, markerType);
                                marker.setVisible(true);
                           }
                            if(prevString==null){
                                marker.setVisible(false);
                                mapController.NEMarkerSetStyle(marker, markerOptions);
                                // marker.setDrawable(markerDrawable);
                                // markerTextures.put(markerId, markerType);
                                marker.setVisible(true);
                           }
                            if(doRotation){
                                mapController.NEMarkerSetAngle(marker, angle);
                            }
                            markersToRemove.remove(marker);
                            synchronized (currentMarkers) {
                                currentMarkers.add(marker);
                            }
                        } catch (Exception e) {
                            Log.e("MARKER_ERROR", "Error updating existing marker: " + e.getMessage());
                        }
                    }
                } catch (Exception e) {
                    Log.e("MARKER_ERROR", "Error processing marker at index " + i + ": " + e.getMessage());
                }
            }
            
            synchronized (addedMarkers) {
                addedMarkers.clear();
                addedMarkers.addAll(currentMarkers);
            }
            
            try {
                for(Marker marker : markersToRemove){
                    mapController.removeMarker(marker.getMarkerId());
                }
            } catch (Exception e) {
                Log.e("MARKER_ERROR", "Error removing markers: " + e.getMessage());
            }
            
            markersToRemove.clear();
        } catch (Exception e) {
            Log.e("MARKER_ERROR", "Error in setMarkers: " + e.getMessage());
        }
    }

    // New: handle vehicle markers independently without clearing non-vehicle markers
    @ReactProp(name = "vehicleMarkers")
    public synchronized void setVehicleMarkers(MapView mapView, ReadableArray markers) {
        System.out.println("AJIN setVehicleMarkers called with markers: " + markers);
        try {
            if (mapController == null) {
                vehicleMarkerTextures.clear();
                vehicleMarkers.clear();
                vehicleMarkersInCreation.clear();
                return;
            }
            if (markers == null || markers.size() == 0) {
                // Remove only vehicle markers
                synchronized (vehicleMarkers) {
                    for (Marker m : vehicleMarkers) {
                        try { mapController.removeMarker(m.getMarkerId()); } catch (Throwable t) { Log.e("MARKER_ERROR", "Error removing vehicle marker: " + t.getMessage()); }
                    }
                    vehicleMarkers.clear();
                    vehicleMarkerTextures.clear();
                    vehicleMarkersInCreation.clear();
                }
                return;
            }
            HashSet<Marker> currentVehicleMarkers = new HashSet<>();
            HashSet<Marker> vehicleMarkersToRemove = new HashSet<>(vehicleMarkers);
            for (int i = 0; i < markers.size(); i++) {
                try {
                    ReadableMap markerData = markers.getMap(i);
                    double latitude = markerData.getDouble("lat");
                    double longitude = markerData.getDouble("lng");
                    String markerId = markerData.getString("id");
                    String markerType = markerData.getString("type");
                    int markerSize = markerData.getInt("size");
                    boolean isMarkerSelected = markerData.getBoolean("selected");
                    boolean focus = markerData.getBoolean("focus");
                    boolean animate = markerData.getBoolean("animate");
                    int animationTime = markerData.getInt("animationTime");
                    boolean showToolTip = markerData.getBoolean("showToolTip");
                    boolean doRotation = markerData.getBoolean("doRotation");

                    String title = markerData.getString("title");
                    String snippet = markerData.getString("snippet");
                    int angle = markerData.getInt("angle");
                    Marker marker = findVehicleMarkerWithId(markerId);
                    Integer markerDrawable = getMarkerDrawable(markerType);
                    MarkerOptions markerOptions = new MarkerOptions()
                            .name(markerId)
                            .position(new LngLat(longitude, latitude))
                            .size(markerSize)
                            .interactive(true)
                            .flat(true)
                            .style(StyleType.MARKER);

                    if (markerDrawable != null) {
                        markerOptions.resource(markerDrawable);
                    } else {
                        String textureStr = getTextures(markerType);
                        if(textureStr!=null){   
                        markerOptions.texture(textureStr);
                        }else{
                            markerOptions.texture(markerType);
                        }
                    }
                    if(!doRotation){
                        markerOptions.flat(false);
                    }
                    
                    if(showToolTip==true){
                        markerOptions.title(title).snippet(snippet);
                    }
                    if(doRotation){
                        
                        markerOptions.rotation(angle);
                    }
                    if(marker!=null){
                        try {
                            Long prevMarkerId = marker.getMarkerId();
                            if (prevMarkerId == null) {
                                Log.d("AJIN", "prevMarkerId is null");
                                marker = null;
                            }
                        } catch (Exception e) {
                            Log.e("MARKER_ERROR", "Error getting marker ID: " + e.getMessage());
                            marker = null;
                        }
                    }

                    if(marker==null){
                        if(vehicleMarkersInCreation.contains(markerId)){
                            continue;
                        }
                        vehicleMarkersInCreation.add(markerId);
                        OnMarkerCreateListener onMarkerCreateListener = new OnMarkerCreateListener() {
                            @Override
                            public synchronized void onMarkerCreated(Marker marker) {
                                try {
                                    if(mapController==null){
                                        Log.d("AJIN", "MAP ctrl not");
                                        return;
                                    }
                                    vehicleMarkersInCreation.remove(markerId);
                                    MarkerData userData = new MarkerData();
                                    userData.setId(markerId);
                                    marker.setUserData(userData);
                                    // marker.setDrawable(markerDrawable);
                                    if(doRotation==true){
                                        mapController.NEMarkerSetAngle(marker, angle);
                                    }
                                    synchronized (vehicleMarkers) {
                                        vehicleMarkers.add(marker);
                                    }
                                    vehicleMarkerTextures.put(markerId,markerType);
                                    if (isMarkerSelected) {
                                        mapController.selectMarker(marker);
                                    }else{
                                        mapController.deselectMarker(marker);
                                    }
                                    synchronized (currentVehicleMarkers) {
                                        currentVehicleMarkers.add(marker);
                                    }
                                } catch (Exception e) {
                                    Log.e("MARKER_ERROR", "Error in onVehicleMarkerCreated: " + e.getMessage());
                                }
                            }

                            @Override
                            public void onFailed(String name) {
                                Log.d("AJIN", "Failed vehicle marker " + name);
                                vehicleMarkersInCreation.remove(markerId);
                            }
                        };
                        try {
                            mapController.NEMarkerAdd(markerOptions, onMarkerCreateListener);
                        } catch (Exception e) {
                            Log.e("MARKER_ERROR", "Error adding vehicle marker: " + e.getMessage());
                            vehicleMarkersInCreation.remove(markerId);
                        }
                    }else{
                        try {
                            LngLat oldpos = marker.getPosition();
                            oldpos.longitude = longitude;
                            oldpos.latitude = latitude;
                            if(animate){
                                marker.setPointEased(oldpos,animationTime, MapController.EaseType.LINEAR);
                            }else{
                                marker.setPoint(new LngLat(longitude,latitude));
                            }
                            if(focus){
                                CameraPosition cameraPosition = mapController.getCameraPosition();
                                float zoom = 14;
                                float cameraZoom = cameraPosition.getZoom();
                                if(cameraZoom>14.0){
                                    zoom = cameraZoom;
                                }
                                mapController.updateCameraPosition(CameraUpdateFactory.newLngLatZoom(new LngLat(longitude,latitude), zoom),100);
                            }
                            if (isMarkerSelected) {
                                mapController.selectMarker(marker);
                            }else{
                                mapController.deselectMarker(marker);
                            }
                            String prevString = vehicleMarkerTextures.get(markerId);
                            if (prevString!= null && !markerType.equals(prevString)) {
                                marker.setVisible(false);
                                // marker.setDrawable(markerDrawable);
                                // vehicleMarkerTextures.put(markerId, markerType);
                                marker.setVisible(true);
                           }
                            if(prevString==null){
                                marker.setVisible(false);
                                mapController.NEMarkerSetStyle(marker, markerOptions);
                                // marker.setDrawable(markerDrawable);
                                // vehicleMarkerTextures.put(markerId, markerType);
                                marker.setVisible(true);
                           }
                            if(doRotation){
                                mapController.NEMarkerSetAngle(marker, angle);
                            }
                            vehicleMarkersToRemove.remove(marker);
                            synchronized (currentVehicleMarkers) {
                                currentVehicleMarkers.add(marker);
                            }
                        } catch (Exception e) {
                            Log.e("MARKER_ERROR", "Error updating existing vehicle marker: " + e.getMessage());
                        }
                    }
                } catch (Exception e) {
                    Log.e("MARKER_ERROR", "Error processing vehicle marker at index " + i + ": " + e.getMessage());
                }
            }

            synchronized (vehicleMarkers) {
                vehicleMarkers.clear();
                vehicleMarkers.addAll(currentVehicleMarkers);
            }

            try {
                for(Marker marker : vehicleMarkersToRemove){
                    mapController.removeMarker(marker.getMarkerId());
                }
            } catch (Exception e) {
                Log.e("MARKER_ERROR", "Error removing stale vehicle markers: " + e.getMessage());
            }

            vehicleMarkersToRemove.clear();
        } catch (Exception e) {
            Log.e("MARKER_ERROR", "Error in setVehicleMarkers: " + e.getMessage());
        }
    }

    // Helper: find from vehicle marker set only
    private synchronized Marker findVehicleMarkerWithId(String id) {
        synchronized (vehicleMarkers) {
            for (Marker marker : vehicleMarkers) {
                MarkerData userData = (MarkerData) marker.getUserData();
                if(marker==null) continue;
                if(userData==null) continue;
                if (userData.getId().equals(id)) {
                    return marker;
                }
            }
        }
        return null;
    }

    private synchronized Marker findMarkerWithId(String id) {
        synchronized (addedMarkers) {
            for (Marker marker : addedMarkers) {
                MarkerData userData = (MarkerData) marker.getUserData();
                Log.e("Karthik", "marker: " + marker);
                Log.e("Karthik", "userData: " + userData);
                Log.e("Karthik", "userData: " + userData.getId());
                if(marker==null) continue;
                if(userData==null) continue;
                if (userData.getId().equals(id)) {
                    return marker;
                }
            }
        }
        return null;
    }

    @ReactMethod
    private void recenterNavigation() {
        Activity currentActivity = SharedDirections.getCurrentActivity();
        if (currentActivity == null) {
            return;
        }
        currentActivity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                NENativeNavigationFragment navigationFragment = NENativeNavigationFragment.getInstance();
                if (navigationFragment != null) {
                    NavigationView navigationView = navigationFragment.getNavigationView();
                    navigationView.performRecenterButton();
                }
            }
        });
    }

    @ReactProp(name = "polylines")
    public void setPolylines(MapView mapView, ReadableArray polylines) {
        if (mapController == null || mapLoaded == 0) {
            return;
        }
        try {
            // For every props update remove all previous polylines
            // Because the native code does not provide functionality to edit or delete
            // indiividual polylines
            mapController.clearLines();
            // empty already added polylines
            addedPolylines = new HashSet<>();
            if (polylines != null) {
                // Create a set to track polylines that need to be removed
                Set<Polyline> polylinesToRemove = new HashSet<>(addedPolylines);

                for (int i = 0; i < polylines.size(); i++) {
                    // Parse polyline object data from the prop
                    ReadableMap polylineData = polylines.getMap(i);

                    if (polylineData != null) {
                        ReadableArray coordinates = polylineData.getArray("coordinates");
                        String color = polylineData.getString("color");
                        int width = polylineData.getInt("width");

                        if (coordinates != null) {
                            List<LngLat> linePoints = new ArrayList<>();

                            // Iterate through coordinates to create a list of LngLat points
                            for (int j = 0; j < coordinates.size(); j++) {
                                ReadableArray coordinate = coordinates.getArray(j);

                                if (coordinate != null && coordinate.size() == 2) {
                                    double latitude = coordinate.getDouble(1);
                                    double longitude = coordinate.getDouble(0);
                                    linePoints.add(new LngLat(longitude, latitude));
                                }
                            }

                            // Create a PolylineOptions object
                            PolylineOptions polylineOptions = new PolylineOptions()
                                    .addAll(linePoints)
                                    .color(color)
                                    .width(width);
                            mapController.drawPolyLine(polylineOptions);
                        }
                    }
                }
            }
        } catch (Throwable t) {
            Log.e("NeNativeModule", "setPolylines failed", t);
        }
    }

    @ReactProp(name="bounds")
    public void zoomToBounds(MapView mapview, ReadableArray boundData){
        if (boundData == null) {
            return;
        }
        // Defer until controller and scene ready
        if (mapController == null || mapLoaded == 0) {
            pendingBounds = boundData;
            return;
        }
        try {
            applyBounds(boundData);
        } catch (Throwable t) {
            Log.e("NeNativeModule", "zoomToBounds failed; deferring", t);
            pendingBounds = boundData;
        }
    }

    // Helper to apply bounds safely when controller is valid
    private void applyBounds(ReadableArray boundData) {
        if (mapController == null || boundData == null) return;
        ReadableArray bounds = boundData.getArray(0);
        ReadableArray margin = boundData.getArray(1);
        double minLon = bounds.getDouble(0);
        double minLat = bounds.getDouble(1);
        double maxLon = bounds.getDouble(2);
        double maxLat = bounds.getDouble(3);
        mapController.updateCameraPosition(
                CameraUpdateFactory.newLngLatBounds(
                        new LngLat(minLon, minLat),
                        new LngLat(maxLon, maxLat),
                        new Rect(margin.getInt(0), margin.getInt(1), margin.getInt(2), margin.getInt(3)
                        )
                ), 500
        );
    }

    public void renderPolyline(ReadableMap polyline) {
        if(mapController==null){
            return;
        }

        ReadableArray coordinates = polyline.getArray("coordinates");
        String color = polyline.getString("color");
        String width = polyline.getString("width");
        boolean focus = polyline.getBoolean("focus");
        ReadableArray margin = polyline.getArray("padding");
        String pattern = polyline.getString("pattern");

       

        

        List<LngLat> linePoints = new ArrayList<>();
        double minLat = Double.MAX_VALUE;
        double maxLat = Double.MIN_VALUE;
        double minLon = Double.MAX_VALUE;
        double maxLon = Double.MIN_VALUE;
        for (int j = 0; j < coordinates.size(); j++) {
            ReadableArray coordinate = coordinates.getArray(j);
            double latitude = coordinate.getDouble(1);
            double longitude = coordinate.getDouble(0);
            linePoints.add(new LngLat(longitude, latitude));
            if (latitude < minLat) minLat = latitude;
            if (latitude > maxLat) maxLat = latitude;
            if (longitude < minLon) minLon = longitude;
            if (longitude > maxLon) maxLon = longitude;
        }

        if(focus){
            mapController.updateCameraPosition(
                    CameraUpdateFactory.newLngLatBounds(new LngLat(minLon, minLat), new LngLat(maxLon, maxLat),
                            new Rect(margin.getInt(0), margin.getInt(1), margin.getInt(2), margin.getInt(3))),500);
        }

        PolylineOptions.LineWidth polylineWidth = PolylineOptions.LineWidth.SMALL;
        if(width.equals("medium")){
            polylineWidth = PolylineOptions.LineWidth.REGULAR;
        }
        if(width.equals("large")){
            polylineWidth = PolylineOptions.LineWidth.LARGE;
        }
        PolylineOptions polylineOptions = new PolylineOptions()
                .addAll(linePoints)
                .color(color)
                .polylineWidth(polylineWidth);
        if(pattern.equals("dashed")){
            polylineOptions.patternType(PatternType.DOT);
        }
        mapController.drawPolyLine(polylineOptions);
    }

    public void renderCircle(ReadableMap circle){
        if(mapController==null){
            return;
        }
        double lat = circle.getDouble("lat");
        double lng = circle.getDouble("lng");
        double radius = circle.getDouble("radius");
        boolean focus = circle.getBoolean("focus");
        ReadableArray margin = circle.getArray("padding");
        String fillColor = circle.getString("fillColor");
        String strokeColor = circle.getString("strokeColor");
        String strokeWidth  = circle.getString("strokeWidth");

        LngLat center = new LngLat(lng,lat );
        CircleOptions circleOptions = new CircleOptions();

        CircleOptions.StrokeWidth circleStrokeWidth = CircleOptions.StrokeWidth.SMALL;
        if(strokeWidth.equals("medium")){
            circleStrokeWidth = CircleOptions.StrokeWidth.REGULAR;
        }
        if(strokeWidth.equals("large")){
            circleStrokeWidth = CircleOptions.StrokeWidth.LARGE;
        }

        Log.d("AJIN", strokeColor);
        Log.d("AJIN", fillColor);

        circleOptions
                .radius(radius)
                .center(center)
                .strokeColor(strokeColor)
                .strokeWidth(circleStrokeWidth)
                .fillColor(fillColor);
        List<LngLat> points = circleOptions.getPoints();
        double minLat = Double.MAX_VALUE;
        double maxLat = Double.MIN_VALUE;
        double minLon = Double.MAX_VALUE;
        double maxLon = Double.MIN_VALUE;
        for (int j = 0; j < points.size(); j++) {
            LngLat coordinate = points.get(j);
            double latitude = coordinate.latitude;
            double longitude = coordinate.longitude;
            if (latitude < minLat) minLat = latitude;
            if (latitude > maxLat) maxLat = latitude;
            if (longitude < minLon) minLon = longitude;
            if (longitude > maxLon) maxLon = longitude;
        }
        if(focus){
            mapController.updateCameraPosition(
                    CameraUpdateFactory.newLngLatBounds(new LngLat(minLon, minLat), new LngLat(maxLon, maxLat),
                            new Rect(margin.getInt(0), margin.getInt(1), margin.getInt(2), margin.getInt(3))),500);
        }
        mapController.drawCircle(circleOptions);
    }


    @ReactProp(name = "geometries")
    public void setGeometries(MapView mapView, ReadableArray geometries) {
        if (mapController == null || mapLoaded == 0) return;
        if (geometries == null) {
            mapController.clearLines();
            return;
        }
        mapController.clearLines();
        for (int i = 0; i < geometries.size(); i++) {
            // Parse polyline object data from the prop
            ReadableMap geometry = geometries.getMap(i);
            String type = geometry.getString("type");
            Log.d("AJIN", type);
            if (type.equals("polyline")) {
                renderPolyline(geometry);
            } else if (type.equals("circle")) {
                renderCircle(geometry);
            }
        }
    }

    @ReactMethod
    public void clearDirectionPoints() {
                    directions.getInstance().clearRoute();
                    routeInstructionsDisplay = null;
                    // directions.getInstance().onDestroy();
    }

    @ReactProp(name = "findRouteWithRequest")
    public void findRouteWithRequest(MapView mapView, ReadableArray routeRequestDataArray){
        // Defer until controller and scene ready
        if (routeRequestDataArray == null) {
            directions.getInstance().clearRoute();
            routeInstructionsDisplay = null;
            return;
        }
        if (mapController == null || mapLoaded == 0) {
            pendingRouteRequest = routeRequestDataArray;
            return;
        }
        applyRouteRequest(routeRequestDataArray);
    }

    // Helper to apply the findRouteWithRequest payload safely
    private void applyRouteRequest(ReadableArray routeRequestDataArray) {
        if (routeRequestDataArray == null) return;
        try {
            ReadableMap routeData = routeRequestDataArray.getMap(0);
            String requests = routeData.getString("requests");
            String response = routeData.getString("response");
            if (routeData.hasKey("padding")) {
                ReadableArray padding = routeData.getArray("padding");
                if (padding != null && padding.size() == 4) {
                    routeMargins = new int[]{
                            padding.getInt(0),
                            padding.getInt(1),
                            padding.getInt(2),
                            padding.getInt(3)
                    };
                }
            }
            Log.d("TAG", "findRouteWithRequest -- >> request: " + requests);
            Log.d("TAG", "findRouteWithRequest -- >> response: " + response);
            directions.getInstance().setRouteAsync(reactNativeContext, requests, response, 0);
        } catch (Throwable t) {
            Log.e("NeNativeModule", "applyRouteRequest failed", t);
        }
    }

    @ReactProp(name = "findRoute")
    public void findRoute(MapView mapView, ReadableArray routeDataArray) {
        // Defer until controller and scene ready
        if (routeDataArray != null && routeDataArray.size() > 0 && (mapController == null || mapLoaded == 0)) {
            // store entire array (payload + directionKey) for later
            pendingRoute = routeDataArray;
            return;
        }
        if (mapView != null && routeDataArray != null && routeDataArray.size() > 0 && mapController != null) {
            try {
            // Last element is a numeric directionKey to force updates; first element is the payload
            int lastIndex = routeDataArray.size() - 1;
            if (routeDataArray.getType(lastIndex) == ReadableType.Number) {
                double directionKey = routeDataArray.getDouble(lastIndex);
                Log.d("NeNative", "findRoute update key=" + directionKey);
            }
            if (routeDataArray.getType(0) != ReadableType.Map) {
                Log.e("NeNative", "findRoute: first element must be a Map");
                return;
            }
            ReadableMap routeData = routeDataArray.getMap(0);
            ReadableArray locationArray = routeData.getArray("locations");
            String type = routeData.getString("type");

            // Optional: read dynamic padding from React and store for later zoom
            try {
                    if (routeData.hasKey("padding")) {
                        ReadableArray padding = routeData.getArray("padding");
                    if (padding != null && padding.size() == 4) {
                        routeMargins = new int[]{
                                padding.getInt(0),
                                padding.getInt(1),
                                padding.getInt(2),
                                padding.getInt(3)
                        };
                    }
                    }
            } catch (Exception e) {
                Log.e("routeLOG", "Invalid padding, using default: " + e.getMessage());
            }


            WritableNativeMap loadingEventData = new WritableNativeMap();
            loadingEventData.putBoolean("loading", true);
            loadingEventData.putString("message", "Route calculation started");
            reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("route-loading", loadingEventData);

            if (routeInstructionsDisplay != null && mapView != null) {
                try {
                    mapView.getMapController().removeAll();
                    directions.getInstance().clearRoute();
                    routeInstructionsDisplay = null;
                    directions.getInstance().onDestroy();
                } catch (Exception e) {
                    routeInstructionsDisplay = null;
                    directions.getInstance().onDestroy();
                    Log.e("routeLOG", "inside remove 2");
                    return;
                }
            }
            Log.e("routeLOG", "called find route");

            WritableNativeMap eventData = new WritableNativeMap();
            eventData.putString("message", "called navigation" + reactNativeContext + ",");

            directions = new Directions();
            reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("navigation", eventData);
            showGetRouteProgress();
            mapController.setCurrentLocationEnabled(true);

            directions.getInstance().init(reactNativeContext, "ITC", "ITC", mapController.mapPointer);

            Log.e("crossareas", "crosses direction instance ");
            ArrayList<VHRoutingRequest.Location> locations = new ArrayList<>();
            for (int i = 0; i < locationArray.size(); i++) {
                ReadableMap locationObject = locationArray.getMap(i);
                if (locationObject != null) {
                    double latitude = locationObject.getDouble("lat");
                    double longitude = locationObject.getDouble("lon");
                    VHRoutingRequest.Location location = VHRoutingRequest.Location.builder()
                            .lat(latitude)
                            .lon(longitude)
                            .build();
                    locations.add(location);
                }
            }

            eventData = new WritableNativeMap();
            eventData.putString("message", "crosses initialization" + directions);

            reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("navigation", eventData);
            eventData = new WritableNativeMap();

            reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("direction-init", eventData);
            Map<String, Object> autooptions = new HashMap<>();
            Map<String, Object> bicycleOptions = new HashMap<>();
            Map<String, Object> walkOptions = new HashMap<>();
            String directionsCriteria = DirectionsCriteria.KILOMETERS;

           
           

            switch (settingsProps.get("highways")) {
                case "Prefer":
                    autooptions.put("use_highways", 1.0);
                    break;
                case "Avoid":
                    autooptions.put("use_highways", 0.0);
                    break;
                case "Slightly Prefer":
                    autooptions.put("use_highways", 0.5);
                    break;
                default:
                    break;
            }

            switch (settingsProps.get("tolls")) {
                case "Prefer":
                    autooptions.put("use_tolls", 1.0);
                    break;
                case "Avoid":
                    autooptions.put("use_tolls", 0.0);
                    break;
                case "Slightly Prefer":
                    autooptions.put("use_tolls", 0.5);
                    break;
                default:
                    break;
            }

            switch (settingsProps.get("ferry")) {
                case "Prefer":
                    autooptions.put("use_ferry", 1.0);
                    bicycleOptions.put("use_ferry", 1.0);
                    walkOptions.put("use_ferry", 1.0);
                    break;
                case "Avoid":
                    autooptions.put("use_ferry", 0.0);
                    bicycleOptions.put("use_ferry", 0.0);
                    walkOptions.put("use_ferry", 0.0);
                    break;
                case "Slightly Prefer":
                    autooptions.put("use_ferry", 0.5);
                    bicycleOptions.put("use_ferry", 0.5);
                    walkOptions.put("use_ferry", 0.5);
                    break;
                default:
                    break;
            }

            switch (settingsProps.get("livingStreet")) {
                case "Prefer":
                    autooptions.put("use_living_street", 0.4);
                    bicycleOptions.put("use_living_street", 0.6);
                    walkOptions.put("use_living_street", 1);
                    break;
                case "Avoid":
                    autooptions.put("use_living_street", 0.0);
                    bicycleOptions.put("use_living_street", 0.0);
                    walkOptions.put("use_living_street", 0.0);
                    break;
                case "Slightly Prefer":
                    autooptions.put("use_living_street", 0.2);
                    bicycleOptions.put("use_living_street", 0.4);
                    walkOptions.put("use_living_street", 0.6);
                    break;
                default:
                    break;
            }

            String profile = DirectionsCriteria.PROFILE_CAR;
            String language = settingsProps.get("language");
            String languageCode = "en-US";

            if (language.equals("en")) {
                languageCode = "en-US";
            } else {
                languageCode = "ar";
            }

            if (type.equals("bike")) {
                profile = DirectionsCriteria.PROFILE_BICYCLE;
            } else if (type.equals("train")) {
                profile = DirectionsCriteria.PROFILE_PEDESTRIAN;
            } else if (type.equals("motorcycle")) {
                profile = DirectionsCriteria.PROFILE_MOTORCYCLE;
            }

            VHRoutingRequest.CostingOptions costingOptions = VHRoutingRequest.CostingOptions
                    .builder()
                    .auto(autooptions)
                    .bicycle(bicycleOptions)
                    .pedestrian(walkOptions)
                    .build();
            VHRoutingRequest request = VHRoutingRequest.builder()
                    .locations(locations)
                    .costing(profile)
                    .costing_options(costingOptions)
                    .alternates(0)
                    .language(languageCode)
                    .units(directionsCriteria)
                    .build();

            double currBearingInDegrees = 0;
            directions.getInstance().getRouteAsync(reactNativeContext, request, currBearingInDegrees);
            } catch (Throwable t) {
                Log.e("NeNativeModule", "findRoute failed; deferring", t);
                // defer entire array so key is preserved
                pendingRoute = routeDataArray;
                return;
            }
        } else {
            Log.e("routeLOG", "inside remove 1");

            if (routeInstructionsDisplay != null && mapView != null) {
                try {
                    mapView.getMapController().removeAll();
                    directions.getInstance().clearRoute();
                    routeInstructionsDisplay = null;
                } catch (Exception e) {
                    routeInstructionsDisplay = null;
                }
            }
        }

        // When payload is null, re-enable current location
        ReadableMap payload = (routeDataArray != null && routeDataArray.size() > 0 && routeDataArray.getType(0) == ReadableType.Map)
                ? routeDataArray.getMap(0) : null;
        if (payload == null && mapController != null) {
            mapController.setCurrentLocationEnabled(true);
        }
    }

    // ProgressDialog progressDialog;
    public RouteCallback getRouteCallback() {
        return routeCallback;
    }



    private RouteCallback routeCallback = new RouteCallback() {
        @Override
        public void onSuccess(RouteResponse routeResponse) {
            Log.e("Success", "Res Success message");
            handleResponse(routeResponse);


           

            RouteCount routeCount = Directions.getInstance().getPrimaryRoute();
            int index = (int) routeCount.getPrimaryRouteIndex() + 1;
            if (index == routeCount.getRouteCount())
                index = 0;

            Directions.getInstance().selectRoute(index);
            Log.e("DIRECTION","zoom called");
            Directions.getInstance().zoomRoute(routeMargins, 0.8f, -1);
            routeInstructionsDisplay = Directions.getInstance().getRouteInstructions(index);
            if (routeInstructionsDisplay == null) {
                Log.e("RouteError", "Failed to get route instructions");
                return;
            }
            // Null check before calling setRouteCount
            routeInstructionsDisplay.setRouteCount(routeCount.getRouteCount());
            // Ensure we're not just getting the default toString() representation
            List<RouteElementInstructionsDisplay> routeInstructions = routeInstructionsDisplay
                    .getRouteElementInstructions();

            // Emit loading false on success
            WritableNativeMap loadingEventData = new WritableNativeMap();
            loadingEventData.putBoolean("loading", false);
            loadingEventData.putBoolean("error", false);
            loadingEventData.putString("message", "Route calculation completed successfully");
            reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("route-loading", loadingEventData);

            WritableNativeMap eventData = new WritableNativeMap();
            eventData.putString("message", "success");
            eventData.putInt("selectedRouteIndex", index);
            eventData.putInt("totalRoutes", routeCount.getRouteCount());

            WritableNativeArray routeInstructionsArray = new WritableNativeArray();
            for (RouteElementInstructionsDisplay instruction : routeInstructions) {
                WritableMap instructionMap = new WritableNativeMap();
                instructionMap.putString("text", instruction.getInstruction());
                // Add more properties of the instruction as needed
                routeInstructionsArray.pushMap(instructionMap);
            }
            eventData.putArray("routeInstructions", routeInstructionsArray);

            // You might want to add more route information to the eventData here
            // Prefer the already validated routeInstructionsDisplay to avoid null access
            if (routeInstructionsDisplay != null) {
                eventData.putDouble("distance", routeInstructionsDisplay.getTotalDistance());
                eventData.putDouble("duration", routeInstructionsDisplay.getTotalDuration());
            } else if (routeResponse != null && routeResponse.getRouteInstructions() != null) {
                eventData.putDouble("distance", routeResponse.getRouteInstructions().getTotalDistance());
                eventData.putDouble("duration", routeResponse.getRouteInstructions().getTotalDuration());
            }

            reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("direction-ready", eventData);
        }

        @Override
        public void onFailure(RouteResponse routeResponse) {
            Log.e("Failure", "Res Failure message" + routeResponse);
             // Emit loading false on failure
            WritableNativeMap loadingEventData = new WritableNativeMap();
            loadingEventData.putBoolean("loading", false);
            loadingEventData.putString("error", "true");
            loadingEventData.putString("message", "Route calculation failed");
            reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("route-loading", loadingEventData);
            WritableNativeMap eventData = new WritableNativeMap();
            eventData.putString("message", "success");
            reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("direction-ready", eventData);

        }
    };

    private void handleResponse(RouteResponse routeResponse) {
        if (routeResponse != null) {
            if (routeResponse.getRouteInstructions() != null) {
                Log.e("Success", "route instruvtion done");

                WritableNativeMap eventData = new WritableNativeMap();
                eventData.putString("message", "sucess got navigation response" + mapView);

                routeInstructionsDisplay = routeResponse.getRouteInstructions();
                Log.e("DIRECTION", "routeInstructionsDisplay" + routeResponse.getRouteInstructions());
                reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("navigation", eventData);
                int routeIndex = 0;
                directions.getInstance().getRouteInstructions(routeIndex);
                RouteCount routeCount = directions.getInstance().getPrimaryRoute();
                // Log.e("NENative", "RC: " + routeCount.getRouteCount() + " sel route " +
                // routeCount.getSelectedRoute());
                Log.e("DIRECTION","zoom called");
                directions.getInstance().zoomRoute(routeMargins, 0.8f, -1);
                Log.e("DIRECTION","zoom called 2");
                mapController.setCurrentLocationEnabled(true);
                SharedDirections.updateSharedArray(routeInstructionsDisplay);
            } else {
                handleFailure("Route instructions null", "");
            }
        } else {
            handleFailure("Route response null", "");
        }
    }

    private void handleFailure(String errorMessage, String displayMessage) {
        WritableNativeMap eventData = new WritableNativeMap();
        eventData.putString("message", "err" + errorMessage);

        reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("navigation", eventData);
        dismissGetRouteProgress();
    }

    @ReactMethod
    public void updatePointsOnNavigation(ReadableArray updatedPointsArray) {
        Activity currentActivity = SharedDirections.getCurrentActivity();
        if (currentActivity == null) {
            return;
        }
        Log.d("TAG", "updatePointsOnNavigation: " + updatedPointsArray);
        currentActivity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                NENativeNavigationFragment navigationFragment = NENativeNavigationFragment.getInstance();
                if (navigationFragment != null) {
                    NavigationView navigationView = navigationFragment.getNavigationView();
                    NavigationViewModel navigationViewModel = navigationView.getNavigationViewModel();

                    List<Point> updatedPoints = new ArrayList<>();
                    for (int i = 0; i < updatedPointsArray.size(); i++) {
                        ReadableArray pointArray = updatedPointsArray.getArray(i);
                        if (pointArray == null || pointArray.size() < 2) continue;

                        double lng = pointArray.getDouble(0); // longitude
                        double lat = pointArray.getDouble(1); // latitude

                        updatedPoints.add(Point.fromLngLat(lng, lat));
                    }
                    Log.d("TAG", "run + updatedPoints: " + updatedPoints);
                    navigationViewModel.handleUpdatePointsAndReroute(updatedPoints);
                }
            }
        });
    }

   @ReactProp(name = "navigation")
   public void navigationPreview(MapView mapView, boolean startNavigation) {
       if (mapView == null) {
           Log.e("ERROR", "MapView is null");
           return;
       }

       if (startNavigation) {
        if (!Directions.getInstance().hasRoute()) {
                Log.d("TAG", "launchNavigation: " + Directions.getInstance().hasRoute());
                Activity currentActivity = SharedDirections.getCurrentActivity();
                if (currentActivity == null) {
                    return;
                }
                currentActivity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (NENativeNavigationFragment.getInstance() != null) {
                            NENativeNavigationFragment.getInstance().onNavigationFinished();
                        }
                    }
                });
//                WritableNativeMap eventData = new WritableNativeMap();
                reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onNavigationRouteNotFoundError", "ROUTENOTFOUND");
                return;
            }
           createDummyView();

           int viewIds = DUMMY_VIEW_IDS;

           Log.e("DummyView", "Dummy view created with ID: " + viewIds);

           // Handle success
           WritableNativeMap eventData = new WritableNativeMap();
           eventData.putString("message", "shared Directions" + SharedDirections.getSharedArray());

           routeInstructionsDisplay = SharedDirections.getSharedArray();
           reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                   .emit("navigation", eventData);
           int routeIndex = 0;
           directions.getInstance().getRouteInstructions(routeIndex);
           RouteCount routeCount = directions.getInstance().getPrimaryRoute();
           int[] padding = { 50, 20, 30, 300 };
           directions.getInstance().zoomRoute(padding, 1, -1);
           if (mapController != null) {
               mapController.setCurrentLocationEnabled(true);
           }
           NavigationMode mode = NavigationMode.REALTIME;

           startNavigation(reactNativeContext.getCurrentActivity(), viewIds, mode,
                   new NavigationEndListener() {
                       @Override
                       public void onNavigationEnd() {
                           // Handle navigation end
                           WritableNativeMap eventData = new WritableNativeMap();
                           eventData.putString("message", "navigation end");
                           if (mapController != null) {
                               Log.e("NENative", "Called navigation end reset callbacks");
                               mapController.setRouteCallback(getRouteCallback());
                               mapController.getTouchInput().setTapResponder(tapResponder);
                           }
                           reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                   .emit("navigation", eventData);
                       }
                   });
       } else if (mapController != null) {
           mapController.setCurrentLocationEnabled(true);
       } else {
           WritableNativeMap eventData = new WritableNativeMap();
           eventData.putString("message", "err mapController is null");
           if(mapController != null) {
               mapController.getTouchInput().setTapResponder(tapResponder);
           }
           reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                   .emit("navigation", eventData);
       }
   }

    private void showGetRouteProgress() {
        System.out.println("getting gert route progress");
    }

   public void startNavigation(Activity activity, int viewIds, NavigationMode navigationMode,
           NavigationEndListener navigationEndListener) {
       if (activity == null) {
           Log.e("ERROR", "Activity is null");
           return;
       }

       WritableNativeMap eventData = new WritableNativeMap();
       eventData.putString("message", "inside start navigation" + mapView);

       reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
               .emit("navigation", eventData);
       Log.e("Status", "Navigation start called");
       launchNavigation(activity, navigationMode, new NavigationEndListener() {
           @Override
           public void onNavigationEnd() {
               // Handle navigation end
               Log.e("Status", "Navigation end called");
               WritableNativeMap eventData = new WritableNativeMap();
               eventData.putString("message", "navigation end");
               if (mapController != null) {
                   Log.e("NENative", "Called navigation end reset callbacks");
                   mapController.setRouteCallback(getRouteCallback());
               }
               if(mapController != null) {
                   mapController.getTouchInput().setTapResponder(tapResponder);
               }
               reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                       .emit("navigationEnd", eventData);
           }
       },
               new ProgressChangeListener() {
                   @Override
                   public void onProgressChange(Location location, NavigationStatus navigationStatus) {
                       Log.e("Status", "Progress called now");
                       // Add your logic for handling progress changes here
                       WritableNativeMap eventData = new WritableNativeMap();
                       float distance = navigationStatus.getRemainingRouteDistance();
                       float duration = navigationStatus.getRemainingRouteDuration();
                       eventData.putDouble("distance", distance);
                       eventData.putDouble("duration", duration);

                       reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                               .emit("onNavigationDistanceChange", eventData);
                   }
               }, viewIds);
   }

    @ReactMethod
    public View getDummyView() {
        return dummyView;
    }

    @ReactMethod
    public void createDummyView() {
        Activity currentActivity = reactNativeContext.getCurrentActivity();
        if (currentActivity == null) {
            Log.e("ERROR", "Current activity is null");
            return;
        }

        currentActivity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    // Create a custom FrameLayout that handles React Native's layout requests
                    FrameLayout container = new FrameLayout(reactNativeContext) {
                        @Override
                        public void requestLayout() {
                            super.requestLayout();
                            post(measureAndLayout);
                        }

                        private final Runnable measureAndLayout = new Runnable() {
                            @Override
                            public void run() {
                                measure(
                                        MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
                                        MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
                                layout(getLeft(), getTop(), getRight(), getBottom());
                            }
                        };
                    };
                    container.setId(DUMMY_VIEW_IDS); // Set a unique ID

                    // Check initialization of mapView
                    if (mapView == null) {
                        Log.e("ERROR", "mapView is null. Cannot create dummy view.");
                        return;
                    }

                    ViewGroup reactNativeView = (ViewGroup) mapView;

                    // Ensure that mapView has a parent
                    ViewGroup parentView = (ViewGroup) reactNativeView.getParent();
                    if (parentView == null) {
                        Log.e("ERROR", "Parent view is null. Cannot add container.");
                        return;
                    }
                    View dummyView = new View(currentActivity);
                    FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(
                            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
                    dummyView.setLayoutParams(layoutParams);
                    container.addView(dummyView);
                    reactNativeView.addView(container);
                    SharedDirections.setCurrentActivity(currentActivity);
                } catch (Exception e) {
                    Log.e("ERROR", "Error in createDummyView: " + e.getMessage());
                }
            }
        });
    }

   @ReactMethod
   private void moveToNextWaypoint() {
       Log.e("ERROR", "Calling");
       Navigator.getInstance().updateToNextNavLeg();
   }

   @ReactMethod
   private void endNavigation() {

       Activity currentActivity = SharedDirections.getCurrentActivity();
       if (currentActivity == null) {
           return;
       }
       currentActivity.runOnUiThread(new Runnable() {
           @Override
           public void run() {
               if (NENativeNavigationFragment.getInstance() != null) {
                   NENativeNavigationFragment.getInstance().onBackPressed(false);
               }
           }
       });
   }

       private void launchNavigation(Activity activity, NavigationMode navigationMode,
            NavigationEndListener navigationEndListener, ProgressChangeListener progressChangeListener, int viewIds) {

        ViewGroup reactNativeView = reactNativeContext.getCurrentActivity().findViewById(viewIds);
        WritableNativeMap eventData = new WritableNativeMap();
        eventData.putString("message", "insdie lunch navigation" + mapView);

        reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("navigation", eventData);
        boolean enableDebugInfo = false;
        boolean enablePoorGPSSimulation = false;
        String locationProvider = "auto";
        ProviderType providerType = ProviderType.AUTO;
        if (locationProvider.equals("android")) {
            providerType = ProviderType.ANDROID;
        } else if (locationProvider.equals("ne")) {
            providerType = ProviderType.NE_FUSED;
        }

        MapController.MapStyle mapStyle = MapController.MapStyle.DAY;
//        if(settingsProps != null) {
//            String mapStyleString = Boolean.parseBoolean(settingsProps.get("enableDarkTheme")) ? "NIGHT2" : "DAY2";
//            mapStyle = MapController.MapStyle.valueOf(mapStyleString);
//        }

        CameraPosition cameraPosition = new CameraPosition();
        // TODO : issue in updating the current location

        // TODO : issue - real time navigation, route found between two different point,
        // navigation camera zoom to user location, but is not rerouteing from current
        // location
        // TODO : in map box - it's rerouting from current location.
        LngLat origin = new LngLat(77.181608, 8.341317);
        cameraPosition.longitude = origin.longitude;
        cameraPosition.latitude = origin.latitude;
        cameraPosition.zoom = 15;
        double gpsReliability = 0.7;
        double navPrecision = 100;

        if (settingsProps != null) {

            switch (settingsProps.get("gpsReliability")) {
                case "High":
                    gpsReliability = 0.7;
                    break;
                case "Medium":
                    gpsReliability = 0.5;
                    break;
                case "Low":
                    gpsReliability = 0.3;
                    break;
            }

            switch (settingsProps.get("navAccuracy")) {
                case "High":
                    navPrecision = 100;
                    break;
                case "Medium":
                    navPrecision = 50;
                    break;
                case "Low":
                    navPrecision = 10;
                    break;
            }
        }

        eventData = new WritableNativeMap();
        eventData.putString("message", "before  start navigation" + mapView);

        reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("navigation", eventData);
        
        // Check if routeInstructionsDisplay is not null before building options
        if (routeInstructionsDisplay == null) {
            Log.e("NavigationError", "routeInstructionsDisplay is null, cannot start navigation");
            // Emit comprehensive error event
            emitNavigationErrorEvent("Route instructions not available for navigation launch", "ROUTE_INSTRUCTIONS_NULL_LAUNCH");
            emitGeneralErrorEvent("NAVIGATION_ERROR", "Cannot launch navigation: Route instructions not available", "NAV_002");
            return;
        }
        
        String directionCriteria = DirectionsCriteria.KILOMETERS;
        NavigationLauncherOptions options = NavigationLauncherOptions.builder()
                .directionsRoute(routeInstructionsDisplay)
                // .shouldSimulateRoute(simulateRoute)
                .enable3dBuildingVisibility(false)
                .setMapStyle(mapStyle)
                .setNavigationMode(navigationMode)
                .setLanguageCode(settingsProps.get("language"))
                .initialMapCameraPosition(cameraPosition)
                .extrusionVisibility(false)
                // .enableDebugInfoView(enableDebugInfo)
                .enablePoorGPSSimulation(enablePoorGPSSimulation)
                .providerType(providerType)
                .distanceUnit(directionCriteria)
                .legIsManuallyProvided(false)
                .gpsReliability(gpsReliability)
                .navPrecision(navPrecision)
                .build();
        // Call this method with Context from within an Activity
        if (mapView != null) {
            createDummyView();

            NavigationLauncher.startNavigation(
                    activity,
                    reactNativeView,
                    mapView,
                    mapController,
                    navigationEndListener,
                    new NavigationRateListener() {
                        @Override
                        public void onSendRating(float rating) {

                        }

                        @Override
                        public void onNavigationShare(NavigationTripData navigationTripData) {

                        }
                    },
                    new ProgressChangeListener() {
                        @Override
                        public void onProgressChange(Location location, NavigationStatus navigationStatus) {
                            WritableNativeMap eventData = new WritableNativeMap();
                            WritableArray locationArray = Arguments.createArray();
                            locationArray
                                    .pushDouble(navigationStatus.getLocation().getCoordinate().coordinates().get(1));
                            locationArray
                                    .pushDouble(navigationStatus.getLocation().getCoordinate().coordinates().get(0));
                            float remainingDistance = navigationStatus.getRemainingRouteDistance();
                            float remainingDuration = navigationStatus.getRemainingRouteDuration();
                            float ldistance = navigationStatus.getRemainingLegDistance();
                            float lduration = navigationStatus.getRemainingRouteDuration();
                            float speed = navigationStatus.getLocation().getSpeed();
                            float legIndex = navigationStatus.getLegIndex();
                            float bearing = navigationStatus.getLocation().getBearing();
                            locationArray.pushDouble(remainingDistance);
                            locationArray.pushDouble(remainingDuration);
                            locationArray.pushDouble(speed);
                            locationArray.pushDouble(ldistance);
                            locationArray.pushDouble(lduration);
                            locationArray.pushDouble(legIndex);
                            locationArray.pushDouble(bearing);

                            eventData.putArray("location", locationArray);

                            reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                    .emit("navigationLocation", eventData);

                            // Add your logic for handling progress changes here
                            Navigator.getInstance().setVanishingPoint(0.0f, 0.0f); // navigation icon view
                        }
                    }, options);
            eventData = new WritableNativeMap();
            eventData.putString("message", "err mapview is null");

            reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onNavigationReady", eventData);
            Activity currentActivity = SharedDirections.getCurrentActivity();
            if (currentActivity == null) {
                return;
            }
            currentActivity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    NENativeNavigationFragment.getInstance();
                    NENativeNavigationFragment navigationFragment = NENativeNavigationFragment.getInstance();
                    if (navigationFragment != null) {
//                        navigationFragment.setNavigationErrorListener(new NavigationErrorListener() {
//                            @Override
//                            public void onNavigationError(String message) {
//
//                            }
//                        });
                    }
                }
            });
                    
                    // Add 1 second delay before executing navigation view code
                    new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            Activity currentActivity = SharedDirections.getCurrentActivity();
                            if (currentActivity == null) {
                                return;
                            }
                            currentActivity.runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    NENativeNavigationFragment navigationFragment = NENativeNavigationFragment.getInstance();
                                    if (navigationFragment != null) {
                                        NavigationView navigationView = navigationFragment.getNavigationView();
                                        Log.d("TAG", "navigationView: bottomSheet -- 1"+ navigationView);
                                        if (navigationView == null) {
                                            Log.d("TAG", "navigationView: bottomSheet -- 2"+navigationView);
                                        } else {
                                            Log.d("TAG", "navigationView: bottomSheet -- 3"+navigationView);
                                            navigationView.isShowTripSummaryView(false);
                                        }
                                    }
                                }
                            });
                        }
                    }, 1000); // 1 second delay

        } else {
            Log.e("NavigationError", "mapView is null, cannot start navigation");
            // Emit comprehensive error event
            emitNavigationErrorEvent("Map view is null, cannot start navigation", "MAPVIEW_NULL");
            emitGeneralErrorEvent("NAVIGATION_ERROR", "Cannot start navigation: Map view is null", "NAV_003");
            
            eventData = new WritableNativeMap();
            eventData.putString("message", "err mapview is null");
            reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("navigation", eventData);
        }
        // Utils.setIsNavigationVoiceCommand(false);
    }
   
   public List<RoutePointData> getSelectedRoutePointsList() {
       return selectedRoutePoints;
   }

   private void getSimulateCameraPosition(CameraPosition cameraPosition) {
       Coordinate coordinate = getSelectedRoutePointsList().get(0).getPlaceCoordinate();
       cameraPosition.latitude = coordinate.getLatitude();
       cameraPosition.longitude = coordinate.getLongitude();
       cameraPosition.zoom = 16;
   }

    private void dismissGetRouteProgress() {
        System.out.println("dismissing");

    }

    public static boolean isInternetAvailable(ThemedReactContext currentContext) {
        ConnectivityManager conectivityManager = (ConnectivityManager) currentContext
                .getSystemService(Context.CONNECTIVITY_SERVICE);// as ConnectivityManager
        NetworkInfo networkInfo = conectivityManager.getActiveNetworkInfo();
        if (networkInfo != null) {
            if (networkInfo.getType() == ConnectivityManager.TYPE_WIFI) {
                return networkInfo.isAvailable();
            } else if (networkInfo.getType() == ConnectivityManager.TYPE_MOBILE) {
                return networkInfo.isAvailable();
            }
        }
        return false;
    }
    @ReactProp(name = "offlineMap")
    public void startDownloadOfflineMap(MapView mapView, boolean offlineMap) {
        if (offlineMap) {
            if (!isInternetAvailable(reactNativeContext)) {
                WritableNativeMap eventData = new WritableNativeMap();
                eventData.putString("message", "No internet connection");
                reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onDownloadFailed", eventData);
                return;
            }
            try {
                // Use a valid Activity context for any UI the SDK might attempt to show,
                // and avoid triggering SDK dialogs by passing the UI flag as false.
                android.app.Activity activity = reactNativeContext.getCurrentActivity();
                boolean isActivityInvalid = (activity == null)
                        || activity.isFinishing()
                        || (android.os.Build.VERSION.SDK_INT >= 17 && activity.isDestroyed());

                if (isActivityInvalid) {
                    WritableNativeMap eventData = new WritableNativeMap();
                    eventData.putString("message", "Cannot start download: Activity not available");
                    reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("onDownloadFailed", eventData);
                    return;
                }

                NENativeMap.getInstance().initializeOfflineFilesDownload(activity,
                        NENativeMap.OfflineType.ALL, false, new NENativeDownloadListener() {
                            @Override
                            public void onDownloading(int progressValue, ProgressType progressType,
                                    String progressData) {
                                WritableNativeMap eventData = new WritableNativeMap();
                                eventData.putInt("progressValue", progressValue);
                                eventData.putString("progressType", progressType.toString());
                                eventData.putString("progressData", progressData);
                                reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                        .emit("onDownloading", eventData);
                            }

                            @Override
                            public void onDownloadFailed(String message) {
                                Log.e("Download failed", "offline file download failed " + message);
                                WritableNativeMap eventData = new WritableNativeMap();
                                eventData.putString("message", "Download failed" + "\n\n" + message);
                                reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                        .emit("onDownloadFailed", eventData);
                            }

                            @Override
                            public void onDownloadFinished() {
                                WritableNativeMap eventData = new WritableNativeMap();
                                eventData.putString("message", "Download finished");
                                reactNativeContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                        .emit("onDownloadFinished", eventData);
                            }
                        });
            } catch (Exception e) {
                Log.e("Download failed", e.toString());
            }
        }
    }

    @ReactMethod
    public void reverseGeocode(double latitude, double longitude, Promise promise) {
        Context context = reactNativeContext != null ? reactNativeContext : reactApplicationContext;
        if (context == null && mapView != null) {
            context = mapView.getContext();
        }
        if (context == null) {
            promise.reject("NO_CONTEXT", "Context is not available for reverse geocoding");
            return;
        }

        if (!Geocoder.isPresent()) {
            promise.reject("GEOCODER_UNAVAILABLE", "Geocoder service is not available on this device");
            return;
        }

        final Context geocoderContext = context;

        new Thread(() -> {
            try {
                Geocoder geocoder = new Geocoder(geocoderContext, Locale.getDefault());
                List<Address> addresses = geocoder.getFromLocation(latitude, longitude, 5);

                WritableMap result = Arguments.createMap();
                WritableArray addressArray = Arguments.createArray();
                boolean hasAddressLines = false;
                boolean addressLineAdded = false;
                List<String> collectedLines = new ArrayList<>();
                String placeName = "Unnamed Location";

                if (addresses != null && !addresses.isEmpty()) {
                    Address address = addresses.get(0);

                    int maxIndex = address.getMaxAddressLineIndex();
                    for (int i = 0; i <= maxIndex; i++) {
                        String line = address.getAddressLine(i);
                        if (line != null) {
                            String trimmed = line.trim();
                            if (!trimmed.isEmpty()) {
                                collectedLines.add(trimmed);
                            }
                        }
                    }

                    String[] candidates = new String[] {
                            sanitizePlaceName(address.getFeatureName()),
                            sanitizePlaceName(address.getSubThoroughfare()),
                            sanitizePlaceName(address.getThoroughfare()),
                            sanitizePlaceName(address.getSubLocality()),
                            sanitizePlaceName(address.getLocality()),
                            sanitizePlaceName(address.getAdminArea())
                    };

                    for (String candidate : candidates) {
                        if (candidate != null && !candidate.isEmpty()) {
                            placeName = candidate;
                            break;
                        }
                    }
                }

                String placePattern = placeName != null ? "(?i)^" + Pattern.quote(placeName) + "\\s*,?\\s*" : null;

                for (String line : collectedLines) {
                    if (placeName.equalsIgnoreCase(line)) {
                        continue;
                    }

                    String cleanLine = line;
                    if (placePattern != null) {
                        cleanLine = cleanLine.replaceFirst(placePattern, "");
                    }

                    cleanLine = cleanLine.trim();
                    if (cleanLine.isEmpty() || placeName.equalsIgnoreCase(cleanLine)) {
                        continue;
                    }

                    addressLineAdded = true;
                    addressArray.pushString(cleanLine);
                }

                hasAddressLines = addressLineAdded;

                if (hasAddressLines) {
                    result.putArray("address", addressArray);
                } else {
                    result.putNull("address");
                }

                result.putString("placeName", placeName);
                promise.resolve(result);
            } catch (IOException ioException) {
                promise.reject("GEOCODER_IO", ioException);
            } catch (IllegalArgumentException illegalArgumentException) {
                promise.reject("INVALID_COORDINATES", illegalArgumentException);
            } catch (Exception exception) {
                promise.reject("GEOCODER_ERROR", exception);
            }
        }).start();
    }

    private String sanitizePlaceName(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @ReactMethod
    public void search(
            double CURRENT_LATITUDE,
            double CURRENT_LONGITUDE,
            String searchString,
            String mapUnitName,
            ReadableMap stateVectorForMatches,
            int resultCount,
            String lang_code,
            boolean debug,
            boolean onlineOnly,
            boolean makeFullSearch,
            boolean isPoiSearch,
            double radius,
            String category,
            Promise promise
    ) {
        // Log.d("AJIN","SEARCH CALL MADE");
        // Log.d("AJIN", "CURRENT_LATITUDE: " + CURRENT_LATITUDE);
        // Log.d("AJIN", "CURRENT_LONGITUDE: " + CURRENT_LONGITUDE);
        // Log.d("AJIN", "searchString: " + searchString);
        // Log.d("AJIN", "mapUnitName: " + mapUnitName);
        // Log.d("AJIN", "resultCount: " + resultCount);
        // Log.d("AJIN", "lang_code: " + lang_code);
        // Log.d("AJIN", "debug: " + debug);
        // Log.d("AJIN", "onlineOnly: " + onlineOnly);
        // Log.d("AJIN", "makeFullSearch: " + makeFullSearch);
        // Log.d("AJIN", "isPoiSearch: " + isPoiSearch);
        // Log.d("AJIN", "radius: " + radius);
        // Log.d("AJIN", "category: " + category);

        SearchResultCallback searchResultCallback = new SearchResultCallback() {
            @Override
            public void onSuccess(SearchResponse result) {
                Log.d("AJIN", "result come");
                WritableMap map = Arguments.createMap();
                SearchData searchData = result.getSearchData();
                try {
                    ReadableMap searchDataMap = SearchDataConverter.toReadableMap(searchData);
                    if (searchDataMap != null) {
                        ReadableMapKeySetIterator keys = searchDataMap.keySetIterator();
                        if (keys.hasNextKey()) {
                            map.putMap("searchData", searchDataMap);
                        }
                    }
                } catch (Exception e) {
                    Log.e("SEARCH", "Error converting searchData: " + e.getMessage());
                }

                if (result.isUnifiedSearch()) {
                    ArrayList<UnifiedSearchData> unifiedSearch = result.getUnifiedSearchData();
                    map.putArray("unifiedSearchData", UnifiedSearchDataConverter.toReadableMap(unifiedSearch));
                }

                


                map.putString("mapUnitName", mapUnitName);
                map.putString("searchString", searchString);
                Log.d("AJIN", "Search result map: " + map.toString());
                promise.resolve(map);

            }

            @Override
            public void onFailure(SearchResponse error) {
                Log.d("AJIN", "result failed: " + (error != null ? error.toString() : "null error"));
                promise.reject("SEARCH_FAILED", "Search operation failed");
            }

            @Override
            public void onCancelled(SearchResponse searchResponse) {
                Log.d("AJIN", "result onCancelled: " + (searchResponse != null ? searchResponse.toString() : "null response"));
                promise.reject("SEARCH_CANCELLED", "Search operation was cancelled");
            }
        };

        // Handle state vector as a map
        Map<String, List<Object>> sv = new HashMap<>();
        if (stateVectorForMatches != null) {
            try {
                ReadableMapKeySetIterator iterator = stateVectorForMatches.keySetIterator();
                while (iterator.hasNextKey()) {
                    String key = iterator.nextKey();
                    ReadableType valueType = stateVectorForMatches.getType(key);
                    if (valueType == ReadableType.Array) {
                        ReadableArray array = stateVectorForMatches.getArray(key);
                        if (array != null) {
                            List<Object> values = new ArrayList<>();
                            for (int j = 0; j < array.size(); j++) {
                                ReadableType arrayType = array.getType(j);
                                switch (arrayType) {
                                    case String:
                                        values.add(array.getString(j));
                                        break;
                                    case Number:
                                        values.add(array.getDouble(j));
                                        break;
                                    case Boolean:
                                        values.add(array.getBoolean(j));
                                        break;
                                    default:
                                        Log.d("AJIN", "Unsupported type in array: " + arrayType);
                                        break;
                                }
                            }
                            sv.put(key, values);
                        }
                    }
                }
            } catch (Exception e) {
                Log.e("AJIN", "Error processing state vector: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            Log.d("AJIN", "stateVectorForMatches is null");
        }

        // Determine if this should be a unified search
        boolean isUnifiedSearch = true;

        if(searchString.length() < 4 || (sv != null && !sv.isEmpty()) || isPoiSearch) {
            isUnifiedSearch = false;
        } else {
            makeFullSearch = false;
        }


        // Convert category to JSON string if provided
        String categoryJson ="[]";

        // Log all parameters before making the search call
        Log.d("SEARCH_PARAMS", "mapUnitName: " + mapUnitName);
        Log.d("SEARCH_PARAMS", "searchString: " + searchString);
        Log.d("SEARCH_PARAMS", "stateVector: " + sv.toString());
        Log.d("SEARCH_PARAMS", "resultCount: " + resultCount);
        Log.d("SEARCH_PARAMS", "lang_code: " + lang_code);
        Log.d("SEARCH_PARAMS", "CURRENT_LATITUDE: " + CURRENT_LATITUDE);
        Log.d("SEARCH_PARAMS", "CURRENT_LONGITUDE: " + CURRENT_LONGITUDE);
        Log.d("SEARCH_PARAMS", "debug: " + debug);
        Log.d("SEARCH_PARAMS", "onlineOnly: " + onlineOnly);
        Log.d("SEARCH_PARAMS", "makeFullSearch: " + makeFullSearch);
        Log.d("SEARCH_PARAMS", "isPoiSearch: " + isPoiSearch);
        Log.d("SEARCH_PARAMS", "isUnifiedSearch: " + isUnifiedSearch);
        Log.d("SEARCH_PARAMS", "radius: " + radius);
        Log.d("SEARCH_PARAMS", "categoryJson: " + categoryJson);

        Search.getInstance().handleSearchRequest(
                mapUnitName,
                searchString,
                sv,
                resultCount,
                lang_code,
                CURRENT_LATITUDE,
                CURRENT_LONGITUDE,
                debug,
                onlineOnly,
                makeFullSearch,
                isPoiSearch,
                isUnifiedSearch,
                radius,
                categoryJson,
                searchResultCallback
        );
    }

    @ReactMethod
    public void removeStateVector(String key, int index) {
        Search.getInstance().removeStateVector(key, (long)index);
    }


    @ReactMethod
    public void clearStateVector() {
        Search.getInstance().clearStateVector();
    }

}
