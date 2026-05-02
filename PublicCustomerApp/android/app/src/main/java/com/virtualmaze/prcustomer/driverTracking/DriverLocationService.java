package com.virtualmaze.prcustomer.driverTracking;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.ForegroundServiceStartNotAllowedException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.location.Location;
import android.os.Build;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.provider.Settings.Secure;
import android.util.Log;
import android.widget.RemoteViews;
import android.media.MediaPlayer;
import android.media.AudioManager;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.virtualmaze.prcustomer.WaitingTimeManagement.ForegroundTimerManager;
import com.virtualmaze.prcustomer.BuildConfig;
import com.virtualmaze.prcustomer.MainActivity;
import com.virtualmaze.prcustomer.R;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import com.virtualmaze.prcustomer.AsyncStorageReader;
import com.virtualmaze.prcustomer.overlay.DriverOverlayController;
import com.virtualmaze.prcustomer.overlay.OverlayService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * Fixed version:
 * - Location callbacks on background looper (no main-thread pressure)
 * - No SharedPreferences/AsyncStorage reads on hot path
 * - Cached tripId/unitType via scheduled refresher
 */
public class DriverLocationService extends Service {

    private static final String TAG = "DRIVERLOCATIONSERVICE";
    public static final int FOREGROUND_NOTIFICATION_ID = 123;
    private static final String EVENT_DRIVER_SERVICE_ERROR = "driverLocationServiceError";

    String ROOT_API_URL = BuildConfig.ROOT_API_URL;

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private ForegroundServerUtils foregroundServerUtil;

    // In-memory cached values (refreshed in background)
    private volatile String storedToken;
    private volatile String storedDeviceId;
    private volatile String storedUserToken;
    private volatile String storedDistanceUnit = "km";
    private volatile String userRole = "unknown";
    private volatile String tripId; // refreshed periodically

    private String currentActivity = "UNKNOWN";
    private boolean synced = true;
    private String currentAccuracyMode = "Low Accuracy";

    // Threads
    private HandlerThread locationThread;
    private Looper locationLooper;
    private ScheduledExecutorService prefsRefresher;

    // Intervals
    private static final long HIGH_ACCURACY_UPDATE_INTERVAL = 5000;   // 5s
    private static final long NORMAL_UPDATE_INTERVAL = 20000;         // 20s
    private static final long WALKING_SPEED_INTERVAL = 30000;         // 30s
    private static final long SPEED_UPDATE_THRESHOLD = 5000;          // 5s
    private long lastApiCallTime = 0;

    // Speed thresholds (m/s)
    private static final float WALKING_SPEED_THRESHOLD = 2.0f;
    private static final float RUNNING_SPEED_THRESHOLD = 5.0f;

    // Harsh braking detection
    private static final float HARSH_BRAKING_THRESHOLD = 3.0f;   // m/s² deceleration
    private static final float MIN_SPEED_FOR_BRAKING = 2.78f;    // ~10 km/h
    private static final long  HARSH_BRAKING_COOLDOWN = 10000;   // 10s between events
    private float previousSpeed = 0.0f;
    private long previousSpeedTime = 0;
    private long lastHarshBrakingTime = 0;

    // Hard acceleration detection
    private static final float HARD_ACCELERATION_THRESHOLD = 3.0f;  // m/s² acceleration
    private static final float MIN_SPEED_FOR_ACCEL = 0.5f;          // ~1.8 km/h
    private static final long  HARD_ACCELERATION_COOLDOWN = 10000;  // 10s between events
    private long lastHardAccelerationTime = 0;

    // Hard cornering detection
    private static final float HARD_CORNERING_THRESHOLD = 30.0f;    // degrees/sec bearing change
    private static final float MIN_SPEED_FOR_CORNERING = 2.78f;     // ~10 km/h
    private static final long  HARD_CORNERING_COOLDOWN = 10000;     // 10s between events
    private float previousBearing = -1f;
    private long previousBearingTime = 0;
    private long lastHardCorneringTime = 0;

    // State for speed/distance
    private float currentSpeed = 0.0f;
    private long lastSpeedUpdateTime = 0;
    private float totalDistance = 0;
    private long startTime = System.currentTimeMillis();
    private Location lastLocation;

    // Colors
    private static final int COLOR_STILL = Color.parseColor("#2196F3");

    private ForegroundTimerManager timerManager;
    private MediaPlayer mediaPlayer;
    private volatile boolean overlayActive;

    private volatile Notification currentNotification;

    private static DriverLocationService instance;
    public static DriverLocationService getInstanceSafe() { return instance; }

    private DriverOverlayController driverOverlayController;
    private OverlayService overlayService;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

        if (!hasLocationRuntimePermission()) {
            Log.e(TAG, "Location permissions missing; aborting service start");
            // Must call startForeground() before stopSelf() to avoid
            // RemoteServiceException on Android 8+
            Notification stub = getNotification(
                    "Stopping...", "Permissions required",
                    "0.0 km", "0 mins", Color.GRAY, "unknown"
            );
            promoteToForeground(stub);
            emitServiceError("missing_permissions", "Location permissions are required to start driver tracking");
            stopSelf();
            return;
        }

        Notification early = getNotification(
                "Initializing...", "Please Check GPS...",
                "0.0 km", "0 mins", Color.GRAY, "unknown"
        );
        currentNotification = early;

        if (!promoteToForeground(early)) {
            stopSelf();
            return;
        }

        try {
            locationThread = new HandlerThread("DriverLocThread", android.os.Process.THREAD_PRIORITY_BACKGROUND);
            locationThread.start();
            locationLooper = locationThread.getLooper();

            fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
            foregroundServerUtil = new ForegroundServerUtils(this);

            timerManager = new ForegroundTimerManager(
                    getApplicationContext(),
                    BGLocationServiceModule.getReactContext()
            );

            driverOverlayController = new DriverOverlayController(getApplicationContext());
            overlayService = OverlayService.getInstance(getApplicationContext());

            Executors.newSingleThreadExecutor().execute(() -> {
                try {
                    storedDeviceId = Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);

                    userRole        = normalize(AsyncStorageReader.readValueFromAsyncStorage(this, "userRole"), "unknown");
                    storedUserToken = normalize(AsyncStorageReader.readValueFromAsyncStorage(this, "bg_userToken"), null);
                    tripId          = normalize(AsyncStorageReader.readValueFromAsyncStorage(this, "activeTripId"), null);
                    storedToken     = normalize(AsyncStorageReader.readValueFromAsyncStorage(this, "deviceToken"), null);
                    storedDistanceUnit = normalize(AsyncStorageReader.readValueFromAsyncStorage(this, "unitType"), "km");

                    if (storedUserToken == null) {
                        Log.e(TAG, "Driver role requires storedUserToken. Stopping service.");
                        stopForegroundSafe();
                        stopSelf();
                        return;
                    }

                    refreshOverlayBinding();

                    locationCallback = new LocationCallback() {
                        @Override
                        public void onLocationResult(LocationResult locationResult) {
                            if (locationResult == null) return;

                            for (Location location : locationResult.getLocations()) {
                                updateSpeedAndIntervals(location);
                                checkHarshBraking(location);
                                checkHardAcceleration(location);
                                checkHardCornering(location);
                                updatePreviousSpeedState(location);
                                int battery = ForegroundServerUtils.getBatteryLevel(DriverLocationService.this);
                                foregroundServerUtil.addLocation(location, battery, currentActivity);
                                updateDistanceAndDuration(location);
                                updateNotification(currentActivity, "");
                            }

                            long now = System.currentTimeMillis();
                            if (now - lastApiCallTime >= HIGH_ACCURACY_UPDATE_INTERVAL) {
                                lastApiCallTime = now;
                                performApiCall(ROOT_API_URL, storedUserToken, tripId);
                            }
                        }
                    };

                    startPrefsRefresher();
                    startLocationUpdates(tripId);

                } catch (Exception e) {
                    Log.e(TAG, "Async init failed: " + e.getMessage());
                    stopForegroundSafe();
                    stopSelf();
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "onCreate failed: " + e);
            stopForegroundSafe();
            stopSelf();
        }
    }

    private boolean promoteToForeground(Notification notification) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                        FOREGROUND_NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
                );
            } else {
                startForeground(FOREGROUND_NOTIFICATION_ID, notification);
            }
            return true;
        } catch (SecurityException se) {
            Log.e(TAG, "FGS start blocked by security exception", se);
            emitServiceError("start_blocked", "Unable to start foreground service due to missing permission");
            return false;
        } catch (RuntimeException e) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                    && e instanceof ForegroundServiceStartNotAllowedException) {
                Log.e(TAG, "FGS not allowed, stopping service gracefully", e);
                emitServiceError("start_not_allowed", "Unable to promote driver tracking service to foreground");
                return false;
            }
            Log.e(TAG, "Foreground promotion failed", e);
            emitServiceError("start_failed", "Driver tracking service could not enter foreground");
            return false;
        }
    }

    private boolean hasLocationRuntimePermission() {
        boolean fineGranted = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;

        boolean coarseGranted = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            boolean backgroundGranted = ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.ACCESS_BACKGROUND_LOCATION
            ) == PackageManager.PERMISSION_GRANTED;
            return fineGranted && coarseGranted && backgroundGranted;
        }

        return fineGranted && coarseGranted;
    }

    private void stopForegroundSafe() {
        try {
            stopForeground(true);
        } catch (Exception e) {
            Log.w(TAG, "stopForeground failed", e);
        }
    }

    private void emitServiceError(String code, String message) {
        ReactApplicationContext reactContext = BGLocationServiceModule.getReactContext();
        if (reactContext == null || !reactContext.hasActiveCatalystInstance()) {
            return;
        }

        WritableMap payload = Arguments.createMap();
        payload.putString("code", code);
        payload.putString("message", message);

        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(EVENT_DRIVER_SERVICE_ERROR, payload);
    }

    /** Poll AsyncStorage on a background thread to refresh cached values */
    private void startPrefsRefresher() {
        if (prefsRefresher != null) return;
        prefsRefresher = Executors.newSingleThreadScheduledExecutor();
        // Light polling; adjust if you want immediate updates.
        prefsRefresher.scheduleAtFixedRate(() -> {
            try {
                // Only normalize/assign if changed to reduce churn
                String newTrip = normalize(AsyncStorageReader.readValueFromAsyncStorage(this, "activeTripId"), null);
                if (!equalsSafe(tripId, newTrip)) tripId = newTrip;

                String newUnit = normalize(AsyncStorageReader.readValueFromAsyncStorage(this, "unitType"), "km");
                if (!equalsSafe(storedDistanceUnit, newUnit)) storedDistanceUnit = newUnit;

                String newRole = normalize(AsyncStorageReader.readValueFromAsyncStorage(this, "userRole"), userRole);
                if (!equalsSafe(userRole, newRole)) {
                    userRole = newRole;
                    refreshOverlayBinding();
                }

                String newToken = normalize(AsyncStorageReader.readValueFromAsyncStorage(this, "bg_userToken"), storedUserToken);
                if (!equalsSafe(storedUserToken, newToken)) storedUserToken = newToken;

            } catch (Throwable t) {
                Log.w(TAG, "Prefs refresher error: " + t.getMessage());
            }
        }, 0, 5, TimeUnit.SECONDS);
    }

    private static boolean equalsSafe(String a, String b) {
        if (a == null) return b == null;
        return a.equals(b);
    }

    private static String normalize(String v, String def) {
        if (v == null) return def;
        String s = v.replace("\"", "").trim();
        return s.isEmpty() ? def : s;
    }

    private static boolean isDriverRole(String role) {
        if (role == null) return false;
        String r = role.toLowerCase();
        return r.equals("driver") || r.equals("publicridedriver");
    }

    private void refreshOverlayBinding() {
        if (driverOverlayController == null) {
            return;
        }

        // if (!isDriverRole(userRole)) {
        //     driverOverlayController.stop();
        //     if (overlayService != null) {
        //         overlayService.stopOverlay();
        //     }
        //     return;
        // }

        if (!hasOverlayPermission()) {
            Log.w(TAG, "Overlay permission missing; driver overlay disabled");
            driverOverlayController.stop();
            if (overlayService != null) {
                overlayService.stopOverlay();
            }
            return;
        }

        driverOverlayController.start();
        if (overlayService != null) {
            overlayService.ensureOverlayBubble();
        }
    }

    public void onTripNotification(String tripId, JSONObject notificationData) {
        if (driverOverlayController == null) {
            driverOverlayController = new DriverOverlayController(getApplicationContext());
        }
        driverOverlayController.onTripNotification(tripId, notificationData);
    }

    public String getDriverAuthToken() {
        return storedUserToken;
    }

    private boolean hasOverlayPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return true;
        }
        return Settings.canDrawOverlays(getApplicationContext());
    }

    private void performApiCall(String apiUrl, String authToken, String currentTripId) {
        try {
            Log.d(TAG, "performApiCall apiUrl=" + apiUrl + " tripId=" + currentTripId);

            if (currentTripId == null || currentTripId.isEmpty() || "null".equals(currentTripId)) {
                foregroundServerUtil.sendDriverLocaitonToServer(
                        apiUrl + "/publicrides/driver/v2/updateDriverMovements",
                        authToken,
                        null,
                        userRole,
                        () -> { Log.d(TAG, "Location sent"); synced = true; },
                        () -> { Log.d(TAG, "Location failed"); synced = false; },
                        responseBody -> {
                            try {
                                JSONObject json = new JSONObject(responseBody);
                                boolean hasToConnectFastSocket = json.optBoolean("hasToConnectFastSocket", false);
                                Log.d(TAG, "hasToConnectFastSocket: " + hasToConnectFastSocket);
                            } catch (JSONException e) {
                                Log.e(TAG, "Parse error: ", e);
                            }
                        }
                );
            } else {
                foregroundServerUtil.sendToServer(
                        apiUrl + "/publicrides/driver/v2/addTripLocation",
                        authToken,
                        currentTripId,
                        userRole,
                        () -> { Log.d(TAG, "Trip location sent"); synced = true; },
                        () -> { Log.d(TAG, "Trip location failed"); synced = false; },
                        responseBody -> {
                            try {
                                JSONObject json = new JSONObject(responseBody);
                                boolean hasToConnectFastSocket = json.optBoolean("hasToConnectFastSocket", false);
                                Log.d(TAG, "hasToConnectFastSocket: " + hasToConnectFastSocket);
                            } catch (JSONException e) {
                                Log.e(TAG, "Parse error: ", e);
                            }
                        }
                );
            }
        } catch (Exception e) {
            Log.e(TAG, "performApiCall failed: ", e);
        }
    }

    // ===== Location scheduling =====

    private void startLocationUpdates(String initialTripId) {
        Log.d(TAG, "Starting location updates with tripId: " + initialTripId);
        tripId = initialTripId; // initial cache
        updateLocationRequest(tripId);
    }

    private void updateLocationRequest(String tId) {
        int priority;
        long interval;

        if (tId == null || "null".equals(tId)) {
            if (currentSpeed <= WALKING_SPEED_THRESHOLD) {
                priority = Priority.PRIORITY_LOW_POWER;
                interval = WALKING_SPEED_INTERVAL;
                currentAccuracyMode = "Low Accuracy";
                Log.d(TAG, "Speed walking -> LOW_POWER 30s");
            } else if (currentSpeed <= RUNNING_SPEED_THRESHOLD) {
                priority = Priority.PRIORITY_BALANCED_POWER_ACCURACY;
                interval = NORMAL_UPDATE_INTERVAL;
                currentAccuracyMode = "Balanced Accuracy";
                Log.d(TAG, "Speed running -> BALANCED 20s");
            } else {
                priority = Priority.PRIORITY_HIGH_ACCURACY;
                interval = HIGH_ACCURACY_UPDATE_INTERVAL;
                currentAccuracyMode = "High Accuracy";
                Log.d(TAG, "Speed vehicle -> HIGH 5s");
            }
        } else {
            priority = Priority.PRIORITY_HIGH_ACCURACY;
            interval = HIGH_ACCURACY_UPDATE_INTERVAL;
            currentAccuracyMode = "High Accuracy (Trip Active)";
            Log.d(TAG, "Trip active -> HIGH 5s");
        }

        Log.d(TAG, "updateLocationRequest priority=" + priority + " interval=" + interval + " tripId=" + tId + " speed=" + currentSpeed);

        LocationRequest req = new LocationRequest.Builder(priority, interval)
                .setWaitForAccurateLocation(false)
                .setMinUpdateIntervalMillis(interval)
                .setMaxUpdateDelayMillis(interval)
                .build();

        try {
            if (locationCallback != null) {
                fusedLocationClient.removeLocationUpdates(locationCallback);
            }
            fusedLocationClient.requestLocationUpdates(req, locationCallback, locationLooper);
        } catch (Exception e) {
            Log.e(TAG, "requestLocationUpdates failed: ", e);
        }
    }

    private void updateSpeedAndIntervals(Location newLocation) {
        long now = System.currentTimeMillis();

        if (now - lastSpeedUpdateTime >= SPEED_UPDATE_THRESHOLD) {
            if (lastLocation != null && newLocation.hasSpeed()) {
                currentSpeed = newLocation.getSpeed();
                Log.d(TAG, "Device speed: " + currentSpeed + " m/s");
            } else if (lastLocation != null) {
                float distance = lastLocation.distanceTo(newLocation);
                long diff = now - lastSpeedUpdateTime;
                if (diff > 0) currentSpeed = distance / (diff / 1000f);
                Log.d(TAG, "Calc speed: " + currentSpeed + " m/s");
            }
            lastSpeedUpdateTime = now;

            // IMPORTANT: no storage reads here; use cached tripId
            updateLocationRequest(tripId);
        }
    }

    private void checkHarshBraking(Location location) {
        long now = System.currentTimeMillis();
        float speed = location.hasSpeed() ? location.getSpeed() : currentSpeed;

        if (previousSpeedTime > 0 && previousSpeed >= MIN_SPEED_FOR_BRAKING) {
            float timeDeltaSec = (now - previousSpeedTime) / 1000f;
            if (timeDeltaSec > 0 && timeDeltaSec <= 15) {
                float deceleration = (previousSpeed - speed) / timeDeltaSec;
                if (deceleration >= HARSH_BRAKING_THRESHOLD && (now - lastHarshBrakingTime) > HARSH_BRAKING_COOLDOWN) {
                    lastHarshBrakingTime = now;
                    Log.w(TAG, "Harsh braking detected! deceleration=" + deceleration + " m/s²"
                            + " from=" + (previousSpeed * 3.6f) + " to=" + (speed * 3.6f) + " km/h");
                    try {
                        JSONObject event = new JSONObject();
                        event.put("details", String.format("Hard Brake: %.1f → %.1f km/h", previousSpeed * 3.6f, speed * 3.6f));
                        JSONObject loc = new JSONObject();
                        loc.put("lat", location.getLatitude());
                        loc.put("lon", location.getLongitude());
                        event.put("location", loc);
                        event.put("time", java.time.Instant.ofEpochMilli(now).toString());
                        foregroundServerUtil.addHarshBrakingEvent(event);
                    } catch (JSONException e) {
                        Log.e(TAG, "Error building harsh braking event", e);
                    }
                }
            }
        }

    }

    private void checkHardAcceleration(Location location) {
        long now = System.currentTimeMillis();
        float speed = location.hasSpeed() ? location.getSpeed() : currentSpeed;

        if (previousSpeedTime > 0 && speed >= MIN_SPEED_FOR_ACCEL) {
            float timeDeltaSec = (now - previousSpeedTime) / 1000f;
            if (timeDeltaSec > 0 && timeDeltaSec <= 15) {
                float acceleration = (speed - previousSpeed) / timeDeltaSec;
                if (acceleration >= HARD_ACCELERATION_THRESHOLD && (now - lastHardAccelerationTime) > HARD_ACCELERATION_COOLDOWN) {
                    lastHardAccelerationTime = now;
                    Log.w(TAG, "Hard acceleration detected! acceleration=" + acceleration + " m/s²"
                            + " from=" + (previousSpeed * 3.6f) + " to=" + (speed * 3.6f) + " km/h");
                    try {
                        JSONObject event = new JSONObject();
                        event.put("details", String.format("Hard Accel: %.1f → %.1f km/h", previousSpeed * 3.6f, speed * 3.6f));
                        JSONObject loc = new JSONObject();
                        loc.put("lat", location.getLatitude());
                        loc.put("lon", location.getLongitude());
                        event.put("location", loc);
                        event.put("time", java.time.Instant.ofEpochMilli(now).toString());
                        foregroundServerUtil.addHardAccelerationEvent(event);
                    } catch (JSONException e) {
                        Log.e(TAG, "Error building hard acceleration event", e);
                    }
                }
            }
        }
    }

    private void checkHardCornering(Location location) {
        long now = System.currentTimeMillis();
        float speed = location.hasSpeed() ? location.getSpeed() : currentSpeed;

        if (!location.hasBearing()) return;
        float bearing = location.getBearing();

        if (previousBearingTime > 0 && speed >= MIN_SPEED_FOR_CORNERING) {
            float timeDeltaSec = (now - previousBearingTime) / 1000f;
            if (timeDeltaSec > 0 && timeDeltaSec <= 15) {
                float bearingDelta = Math.abs(bearing - previousBearing);
                // Normalize to [0, 180] to handle wraparound (e.g. 350° -> 10°)
                if (bearingDelta > 180f) bearingDelta = 360f - bearingDelta;
                float bearingRate = bearingDelta / timeDeltaSec;

                if (bearingRate >= HARD_CORNERING_THRESHOLD && (now - lastHardCorneringTime) > HARD_CORNERING_COOLDOWN) {
                    lastHardCorneringTime = now;
                    Log.w(TAG, "Hard cornering detected! bearingRate=" + bearingRate + " °/s"
                            + " from=" + previousBearing + "° to=" + bearing + "° speed=" + (speed * 3.6f) + " km/h");
                    try {
                        JSONObject event = new JSONObject();
                        event.put("details", String.format("Hard Corner: %.0f° turn at %.1f km/h", bearingDelta, speed * 3.6f));
                        JSONObject loc = new JSONObject();
                        loc.put("lat", location.getLatitude());
                        loc.put("lon", location.getLongitude());
                        event.put("location", loc);
                        event.put("time", java.time.Instant.ofEpochMilli(now).toString());
                        foregroundServerUtil.addHardCorneringEvent(event);
                    } catch (JSONException e) {
                        Log.e(TAG, "Error building hard cornering event", e);
                    }
                }
            }
        }

        previousBearing = bearing;
        previousBearingTime = now;
    }

    private void updatePreviousSpeedState(Location location) {
        float speed = location.hasSpeed() ? location.getSpeed() : currentSpeed;
        previousSpeed = speed;
        previousSpeedTime = System.currentTimeMillis();
    }

    // ===== Notification =====

    private Notification getNotification(String title, String description, String distance, String duration, int backgroundColor, String userRoles) {
        Log.d(TAG, "Creating notification for role=" + userRoles);

        Intent notificationIntent = new Intent(this, MainActivity.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, flags);


        RemoteViews notificationView = new RemoteViews(getPackageName(), R.layout.notification_driver_location);
        RemoteViews compactView = new RemoteViews(getPackageName(), R.layout.notification_driver_location_compact);

        // Set text and color for system theme
        int textColor = getNotificationTextColor();
        notificationView.setTextViewText(R.id.notification_title, "Tracking Enabled");
        notificationView.setTextColor(R.id.notification_title, textColor);
        compactView.setTextViewText(R.id.notification_title, "Tracking Enabled");
        compactView.setTextColor(R.id.notification_title, textColor);

        String descriptionText = overlayActive
            ? "Trip request pending"
            : "Background Location - " + currentAccuracyMode;
        notificationView.setTextViewText(R.id.notification_description, descriptionText);
        notificationView.setTextColor(R.id.notification_description, textColor);
        compactView.setTextViewText(R.id.notification_description, descriptionText);
        compactView.setTextColor(R.id.notification_description, textColor);

        notificationView.setTextViewText(R.id.notification_distance, distance);
        notificationView.setTextViewText(R.id.notification_duration, duration);
        notificationView.setTextViewText(R.id.accuracy_mode, currentAccuracyMode);

        String statusText = overlayActive
            ? "Overlay active"
            : (synced ? "Online" : "Offline");
        notificationView.setTextViewText(R.id.status_text, statusText);
        compactView.setTextViewText(R.id.status_text, statusText);

        notificationView.setImageViewResource(R.id.notification_sync_status, getNotificationSyncImage(synced));
        compactView.setImageViewResource(R.id.notification_sync_status, getNotificationSyncImage(synced));

        String channelId = "LocationTracking";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                NotificationChannel existing = nm.getNotificationChannel(channelId);
                if (existing == null) {
                    NotificationChannel channel = new NotificationChannel(
                        channelId, "Location Tracking", NotificationManager.IMPORTANCE_LOW);
                    channel.setDescription("Used for location tracking");
                    channel.setShowBadge(false);
                    channel.setSound(null, null);
                    nm.createNotificationChannel(channel);
                } else {
                    // Optionally update properties if needed
                    existing.setDescription("Used for location tracking");
                    existing.setShowBadge(false);
                    existing.setSound(null, null);
                    nm.createNotificationChannel(existing);
                }
            }
        }

        return new NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_launcher)
            .setCustomContentView(compactView)
            .setCustomBigContentView(notificationView)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .setColorized(false)
            .build();
    }

    /**
     * Returns black for light mode, white for dark mode.
     */
    private int getNotificationTextColor() {
        int nightModeFlags = getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK;
        if (nightModeFlags == android.content.res.Configuration.UI_MODE_NIGHT_YES) {
            return Color.WHITE;
        } else {
            return Color.BLACK;
        }
    }

    private int getNotificationSyncImage(boolean s) {
        return s ? R.drawable.baseline_wifi_24 : R.drawable.baseline_signal_wifi_statusbar_connected_no_internet_4_24;
    }

    private void updateNotification(String activityType, String transitionType) {
        float distanceKm = totalDistance / 1000f;
        float distanceMi = distanceKm * 0.621371f;
        long durationMinutes = (System.currentTimeMillis() - startTime) / 60000;

        Notification notification = getNotification(
                "Location Tracking",
                "Background Location - " + currentAccuracyMode,
                String.format("%.2f %s",
                        "km".equalsIgnoreCase(storedDistanceUnit != null ? storedDistanceUnit.trim() : "km") ? distanceKm : distanceMi,
                        storedDistanceUnit != null ? storedDistanceUnit : "km"
                ),
                durationMinutes >= 60
                        ? String.format("%dh %dm", durationMinutes / 60, durationMinutes % 60)
                        : String.format("%d mins", durationMinutes),
                COLOR_STILL, userRole
        );

        currentNotification = notification;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(FOREGROUND_NOTIFICATION_ID, notification);
        } else {
            Log.e(TAG, "NotificationManager null");
        }
    }

    private void updateDistanceAndDuration(Location newLocation) {
        if (lastLocation != null && !"STILL".equals(currentActivity)) {
            totalDistance += lastLocation.distanceTo(newLocation);
        }
        lastLocation = newLocation;
    }

    // ===== Service lifecycle =====

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "onStartCommand");

        // Re-promote to foreground on every start command to satisfy the
        // startForegroundService() contract (covers START_STICKY restarts
        // and rapid stop/start cycles).
        if (currentNotification != null) {
            promoteToForeground(currentNotification);
        } else {
            Notification fallback = getNotification(
                    "Driver Tracking", "Initializing...",
                    "0.0 km", "0 mins", Color.GRAY, "unknown"
            );
            promoteToForeground(fallback);
        }

        // DO NOT read storage here; rely on refresher
        updateNotification(currentActivity, "");
        boolean overlayPermitted = hasOverlayPermission();
        if (driverOverlayController != null  && overlayPermitted) {
            driverOverlayController.start();
        }
        if (overlayService != null && overlayPermitted) {
            overlayService.ensureOverlayBubble();
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "onDestroy");

        instance = null;

        try { fusedLocationClient.removeLocationUpdates(locationCallback); } catch (Exception ignored) {}
        if (locationThread != null) {
            locationThread.quitSafely();
            locationThread = null;
            locationLooper = null;
        }
        if (prefsRefresher != null) {
            prefsRefresher.shutdownNow();
            prefsRefresher = null;
        }

        if (driverOverlayController != null) {
            driverOverlayController.stop();
        }

        if (overlayService != null) {
            overlayService.stopOverlay();
        }

        overlayActive = false;

        releaseMediaPlayer();

        super.onDestroy();
    }

    @Override public void onTaskRemoved(Intent rootIntent) {
        Log.e(TAG, "onTaskRemoved");
        super.onTaskRemoved(rootIntent);
    }

    @Nullable @Override
    public IBinder onBind(Intent intent) { return null; }

    public void setOverlayActive(boolean active) {
        if (overlayActive == active) {
            return;
        }
        overlayActive = active;
        updateNotification(currentActivity, "");
    }

    public Notification getCurrentNotification() {
        return currentNotification;
    }

    public void hideDriverOverlay() {
        if (driverOverlayController != null) {
            driverOverlayController.hideOverlay();
        }
    }

    public void handleOverlayPermissionGranted() {
        refreshOverlayBinding();
    }

    // ===== Sound helpers =====

    public void playAlertSound() {
        try {
            stopAlertSound();
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
            mediaPlayer.setVolume(0.5f, 0.5f);
            android.content.res.AssetFileDescriptor afd =
                    getResources().openRawResourceFd(getResources().getIdentifier("tripalert","raw",getPackageName()));
            mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            mediaPlayer.prepare();
            mediaPlayer.start();
            mediaPlayer.setOnCompletionListener(mp -> releaseMediaPlayer());
        } catch (Exception e) {
            Log.e(TAG, "playAlertSound error: " + e.getMessage());
            releaseMediaPlayer();
        }
    }

    public void playAlertSoundWithLoop(int loopCount) {
        try {
            stopAlertSound();
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
            mediaPlayer.setVolume(0.5f, 0.5f);
            android.content.res.AssetFileDescriptor afd =
                    getResources().openRawResourceFd(getResources().getIdentifier("tripalert","raw",getPackageName()));
            mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            mediaPlayer.setLooping(loopCount > 0);
            mediaPlayer.prepare();
            mediaPlayer.start();
            mediaPlayer.setOnCompletionListener(mp -> releaseMediaPlayer());
        } catch (Exception e) {
            Log.e(TAG, "playAlertSoundWithLoop error: " + e.getMessage());
            releaseMediaPlayer();
        }
    }

    public void stopAlertSound() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                releaseMediaPlayer();
            }
        } catch (Exception e) {
            Log.e(TAG, "stopAlertSound error: " + e.getMessage());
        }
    }

    public boolean isPlaying() {
        try { return mediaPlayer != null && mediaPlayer.isPlaying(); }
        catch (Exception e) { return false; }
    }

    private void releaseMediaPlayer() {
        try {
            if (mediaPlayer != null) {
                mediaPlayer.release();
                mediaPlayer = null;
            }
        } catch (Exception e) {
            Log.e(TAG, "releaseMediaPlayer error: " + e.getMessage());
        }
    }

    public void onSessionExpiredFromServer() {
        Log.w(TAG, "Session expired detected; stopping driver tracking service");
        emitServiceError("session_expired", "Driver session expired while sending locations");

        try {
            if (driverOverlayController != null) {
                driverOverlayController.stop();
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to stop overlay controller during session expiration", e);
        }

        if (overlayService != null) {
            overlayService.stopOverlay();
        }

        overlayActive = false;
        stopAlertSound();
        stopForegroundSafe();
        stopSelf();
    }

}
