package com.virtualmaze.prcustomer.overlay;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ValueAnimator;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.LinearInterpolator;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.virtualmaze.prcustomer.AsyncStorageReader;
import com.virtualmaze.prcustomer.driverTracking.BGLocationServiceModule;
import com.virtualmaze.prcustomer.BuildConfig;
import com.virtualmaze.prcustomer.driverTracking.DriverLocationService;
import com.virtualmaze.prcustomer.tripAlert.PlayTripSoundModule;
import com.virtualmaze.prcustomer.R;

import androidx.core.app.NotificationCompat;
import com.google.firebase.analytics.FirebaseAnalytics;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.net.URI;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import io.socket.client.IO;
import io.socket.client.Socket;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Handles driver alert overlay logic (Socket.IO lifecycle + banner rendering) so the
 * location service stays lean. Requires SYSTEM_ALERT_WINDOW permission to show UI.
 */
public class DriverOverlayController {

    private static final String TAG = "DriverOverlayController";
    private static final long SOCKET_RETRY_DELAY_MS = 10_000L;
    private static final long SOCKET_HEALTH_INTERVAL_MS = 60_000L;
    private static final long NOTIFICATION_FALLBACK_DELAY_MS = 1_500L;
    private static final long SOCKET_HANDLED_CACHE_TTL_MS = 120_000L;
    private static final String ADDRESS_FALLBACK = "Address not available";
    private static final String EVENT_TRIP_OVERLAY_VISIBILITY = "driverTripOverlayVisibility";
    private static final String EVENT_TRIP_OVERLAY_RESPONSE = "driverTripOverlayResponse";
    private static final String CANCEL_CHANNEL_ID = "driver_trip_cancel_channel";
    private static final int CANCEL_NOTIFICATION_ID = 9_912;

    private final Context context;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable socketRetryRunnable = this::initDriverSocket;
    private final Runnable socketHealthCheckRunnable = this::runSocketHealthCheck;
    private final OkHttpClient httpClient = new OkHttpClient();
    private final Object tripFallbackLock = new Object();
    private static Typeface lexendBold;
    private static boolean fontInitAttempted;
    private Runnable overlayDismissRunnable;
    private Runnable pendingTripFetchRunnable;
    private ValueAnimator progressAnimator;

    private WindowManager windowManager;
    private View overlayView;
    private Socket driverSocket;
    private String cachedDriverId;
    private boolean hasStarted;
    private String pendingNotificationTripId;
    private boolean pendingTripHandled;
    private boolean fallbackFetchInFlight;
    private JSONObject pendingNotificationPayload;
    private final LinkedHashMap<String, Long> socketHandledTripCache = new LinkedHashMap<>(32, 0.75f, true);

    public DriverOverlayController(Context context) {
        this.context = context.getApplicationContext();
    }

    public synchronized void start() {
        if (hasStarted) {
            if (isDriverServiceRunning()) {
                scheduleSocketHealthCheck();
                mainHandler.post(this::initDriverSocket);
            } else {
                Log.d(TAG, "Driver service not running; skip socket init on start()");
            }
            return;
        }
        hasStarted = true;
        if (isDriverServiceRunning()) {
            scheduleSocketHealthCheck();
            mainHandler.post(this::initDriverSocket);
        } else {
            Log.d(TAG, "Driver service not running; start() will wait for service");
        }
    }

    public synchronized void stop() {
        if (!hasStarted && driverSocket == null && overlayView == null) {
            return;
        }
        hasStarted = false;
        mainHandler.removeCallbacks(socketRetryRunnable);
        mainHandler.removeCallbacks(socketHealthCheckRunnable);
        cancelOverlayAutoDismiss();
        removeOverlay();
        clearPendingTripFallback();
        stopAlertAudio();
        try {
            if (driverSocket != null) {
                driverSocket.off();
                driverSocket.disconnect();
            }
        } catch (Exception ignored) {}
        driverSocket = null;
    }

    private void initDriverSocket() {
        if (!hasStarted) {
            return;
        }
        if (!isDriverServiceRunning()) {
            Log.d(TAG, "Driver service inactive; skipping socket init");
            return;
        }
        mainHandler.removeCallbacks(socketRetryRunnable);

        try {
            if (driverSocket != null) {
                if (driverSocket.connected()) {
                    Log.d(TAG, "Driver socket already active; skipping re-init");
                    return;
                }
                try {
                    driverSocket.off();
                    driverSocket.disconnect();
                } catch (Exception ignored) {}
                driverSocket = null;
            }
        } catch (Exception resetError) {
            Log.e(TAG, "Error resetting driver socket", resetError);
        }

        try {
            final String driverId = ensureDriverId();
            if (driverId == null || driverId.isEmpty()) {
                Log.w(TAG, "Driver id missing; scheduling socket retry");
                scheduleSocketRetry();
                return;
            }

            URI uri = URI.create(BuildConfig.DRIVER_SOCKET_URL);
            String protocolAndHost = uri.getScheme() + "://" + uri.getHost();
            if (uri.getPort() != -1) {
                protocolAndHost += ":" + uri.getPort();
            }

            String path = uri.getPath();
            if (path == null || path.isEmpty()) {
                path = "/";
            }

            IO.Options options = new IO.Options();
            options.reconnection = true;
            options.reconnectionAttempts = Integer.MAX_VALUE;
            options.reconnectionDelay = 5_000;
            options.reconnectionDelayMax = 20_000;
            options.randomizationFactor = 0.5;
            options.timeout = 10_000;
            options.path = "/".equals(path) ? "/socket.io" : path + "/socket.io";
            options.query = "driver_id=" + driverId;

            driverSocket = IO.socket(protocolAndHost, options);

            driverSocket.on(Socket.EVENT_CONNECT, args -> {
                Log.i(TAG, "Driver socket connected as " + driverId);
                scheduleSocketHealthCheck();
            });
            driverSocket.on(Socket.EVENT_CONNECT_ERROR, args -> {
                Throwable err = (args != null && args.length > 0 && args[0] instanceof Throwable)
                        ? (Throwable) args[0]
                        : new Exception(args != null && args.length > 0 ? args[0].toString() : "unknown error");
                Log.e(TAG, "Driver socket connect error for " + driverId, err);
                scheduleSocketRetry();
            });
            driverSocket.on(Socket.EVENT_DISCONNECT, args -> {
                Log.w(TAG, "Driver socket disconnected for " + driverId);
                scheduleSocketRetry();
            });

             driverSocket.on("trip_request", args -> {
                 if (args != null && args.length > 0) {
                     Object payload = args[0];
                     if (payload instanceof JSONObject) {
                         JSONObject obj = (JSONObject) payload;
                         Log.i(TAG, "Received trip_request for driver=" + driverId + " payload=" + obj);
                         markTripRequestDataDelivered(obj);
                         // Log Firebase analytics for trip request receipt
                         try {
                             FirebaseAnalytics analytics = FirebaseAnalytics.getInstance(context);
                             Bundle params = new Bundle();
                             params.putString("category", "TB_Driver_Allocation(TB_DA)");
                             params.putString("action", "TB_DA:trip_request_received");
                             analytics.logEvent("Trip_Booking_TB", params);
                         } catch (Exception e) {
                             Log.w(TAG, "Failed to log Firebase event for trip_request", e);
                         }
                         // Before showing overlay, verify driver token session status
                         checkDriverTokenAndHandle(obj);
                     } else {
                         Log.w(TAG, "Unexpected trip_request payload type: " +
                                 (payload != null ? payload.getClass() : "null"));
                     }
                 }
             });

            driverSocket.on("cancel_ride_match", args -> {
                if (args == null || args.length == 0) {
                    Log.w(TAG, "Missing cancel_ride_match payload");
                    return;
                }

                Object payload = args[0];
                JSONObject cancelData = null;
                if (payload instanceof JSONObject) {
                    cancelData = (JSONObject) payload;
                } else if (payload instanceof String) {
                    try {
                        cancelData = new JSONObject((String) payload);
                    } catch (JSONException parseError) {
                        Log.e(TAG, "Failed to parse cancel_ride_match string payload", parseError);
                    }
                } else {
                    Log.w(TAG, "Unexpected cancel_ride_match payload type: " + payload.getClass());
                }

                if (cancelData != null) {
                    handleCancelRideMatch(cancelData);
                }
            });

            driverSocket.connect();
        } catch (Exception e) {
            Log.e(TAG, "initDriverSocket error", e);
            scheduleSocketRetry();
        }
    }

    /**
     * Calls server to verify the driver's token validity. If session has expired,
     * stops socket, alarm sound and tracking services; otherwise proceeds to show overlay.
     */
    private String loadDriverAuthToken() {
        try {
            final String token = stripQuotes(normalizeToken(
                    AsyncStorageReader.readValueFromAsyncStorage(context, "bg_userToken")));
            final String fallbackToken = stripQuotes(normalizeToken(
                    AsyncStorageReader.readValueFromAsyncStorage(context, "access_token")));
            String authToken = (token != null && !token.isEmpty()) ? token : fallbackToken;
            if (authToken == null || authToken.isEmpty()) {
                DriverLocationService service = DriverLocationService.getInstanceSafe();
                if (service != null) {
                    String serviceToken = stripQuotes(normalizeToken(service.getDriverAuthToken()));
                    if (serviceToken != null && !serviceToken.isEmpty()) {
                        authToken = serviceToken;
                    }
                }
            }
            if (authToken == null) {
                return null;
            }
            return authToken;
        } catch (Exception e) {
            Log.e(TAG, "Failed to load driver auth token", e);
            return null;
        }
    }

    private void checkDriverTokenAndHandle(JSONObject tripPayload) {
        try {
            final String authToken = loadDriverAuthToken();
            if (authToken == null || authToken.isEmpty()) {
                Log.w(TAG, "Missing auth token; proceeding without session check");
                stopAlertAudio();
                mainHandler.post(() -> showOverlay(tripPayload));
                return;
            }

            String url = BuildConfig.ROOT_API_URL + "/publicrides/driver/v2/checkDriverToken";
            OkHttpClient client = httpClient;
            Request request = new Request.Builder()
                    .url(url)
                    .get()
                    .addHeader("Authorization", "Bearer " + authToken)
                    .addHeader("x-device-auth", "Bearer " + authToken)
                    .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, java.io.IOException e) {
                    Log.e(TAG, "checkDriverToken request failed", e);
                    stopAlertAudio();
                    mainHandler.post(() -> showOverlay(tripPayload));
                }

                @Override
                public void onResponse(Call call, Response response) {
                    String body = null;
                    boolean expired = false;
                    try {
                        body = response.body() != null ? response.body().string() : null;
                        expired = isSessionExpiredFromBody(body);
                    } catch (Exception parseError) {
                        Log.w(TAG, "Failed parsing checkDriverToken response", parseError);
                    } finally {
                        try { if (response.body() != null) response.close(); } catch (Exception ignored) {}
                    }

                    if (expired) {
                        Log.w(TAG, "Session expired detected on checkDriverToken; stopping services");
                        mainHandler.post(() -> handleSessionExpired());
                    } else {
                        stopAlertAudio();
                        mainHandler.post(() -> showOverlay(tripPayload));
                    }
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "checkDriverTokenAndHandle error", e);
            stopAlertAudio();
            mainHandler.post(() -> showOverlay(tripPayload));
        }
    }

    private void handleSessionExpired() {
        try {
            stopAlertAudio();
            // Stop overlay + socket via the service's unified handler
            DriverLocationService service = DriverLocationService.getInstanceSafe();
            if (service != null) {
                service.onSessionExpiredFromServer();
            } else {
                // Fallback: stop overlay locally and disconnect socket
                stop();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to handle session expiration", e);
            try { stop(); } catch (Exception ignored) {}
        }
    }

    public void onTripNotification(String tripId, JSONObject notificationData) {
        String normalizedTripId = cleanDisplay(tripId);
        if (normalizedTripId == null || normalizedTripId.isEmpty()) {
            Log.w(TAG, "Ignoring trip notification without valid tripId");
            return;
        }

        synchronized (tripFallbackLock) {
            if (wasTripHandledBySocketLocked(normalizedTripId)) {
                Log.i(TAG, "Trip notification ignored; socket already delivered tripId=" + normalizedTripId);
                return;
            }
        }

        if (notificationData != null) {
            Log.i(TAG, "Trip notification payload=" + notificationData);
        } else {
            Log.w(TAG, "Trip notification received without payload for tripId=" + normalizedTripId);
        }

        JSONObject extrasCopy = null;
        if (notificationData != null) {
            try {
                extrasCopy = new JSONObject(notificationData.toString());
            } catch (Exception e) {
                extrasCopy = notificationData;
            }
        }

        Runnable scheduledRunnable;
        synchronized (tripFallbackLock) {
            cancelPendingTripFetchLocked();
            pendingNotificationTripId = normalizedTripId;
            pendingNotificationPayload = extrasCopy;
            pendingTripHandled = false;
            fallbackFetchInFlight = false;
            Runnable newRunnable = () -> maybeFetchTripDetailsFromApi();
            pendingTripFetchRunnable = newRunnable;
            scheduledRunnable = newRunnable;
        }

        if (scheduledRunnable != null) {
            Log.i(TAG, "Scheduled trip fallback check for tripId=" + normalizedTripId);
            mainHandler.postDelayed(scheduledRunnable, NOTIFICATION_FALLBACK_DELAY_MS);
        }
    }

    private void maybeFetchTripDetailsFromApi() {
        String tripId;
        JSONObject extras;
        synchronized (tripFallbackLock) {
            if (pendingTripHandled) {
                cancelPendingTripFetchLocked();
                return;
            }
            if (pendingNotificationTripId == null || pendingNotificationTripId.isEmpty()) {
                cancelPendingTripFetchLocked();
                return;
            }
            if (fallbackFetchInFlight) {
                return;
            }
            tripId = pendingNotificationTripId;
            extras = pendingNotificationPayload;
            fallbackFetchInFlight = true;
            pendingTripFetchRunnable = null;
        }

        fetchTripDetailsFromApi(tripId, extras);
    }

    private void fetchTripDetailsFromApi(String tripId, JSONObject notificationData) {
        final String authToken = loadDriverAuthToken();
        if (authToken == null || authToken.isEmpty()) {
            Log.w(TAG, "Cannot fetch trip details without auth token");
            synchronized (tripFallbackLock) {
                fallbackFetchInFlight = false;
                cancelPendingTripFetchLocked();
            }
            return;
        }

        HttpUrl baseUrl = HttpUrl.parse(BuildConfig.ROOT_API_URL + "/publicrides/driver/v2/getTrip");
        if (baseUrl == null) {
            Log.e(TAG, "Invalid trip detail endpoint URL");
            synchronized (tripFallbackLock) {
                fallbackFetchInFlight = false;
                cancelPendingTripFetchLocked();
            }
            return;
        }

        JSONObject extrasCopy = null;
        if (notificationData != null) {
            try {
                extrasCopy = new JSONObject(notificationData.toString());
            } catch (Exception ignored) {
                extrasCopy = notificationData;
            }
        }

        final String targetTripId = tripId;
        final JSONObject extrasForMerge = extrasCopy;

        Request request = new Request.Builder()
                .url(baseUrl.newBuilder().addQueryParameter("tripId", tripId).build())
                .get()
                .addHeader("Authorization", "Bearer " + authToken)
                .addHeader("x-device-auth", "Bearer " + authToken)
                .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, java.io.IOException e) {
                Log.e(TAG, "Trip detail fetch failed for tripId=" + targetTripId, e);
                synchronized (tripFallbackLock) {
                    fallbackFetchInFlight = false;
                    cancelPendingTripFetchLocked();
                }
            }

            @Override
            public void onResponse(Call call, Response response) {
                boolean deliver = false;
                JSONObject overlayPayload = null;
                try {
                    String bodyString = response.body() != null ? response.body().string() : null;
                    if (!response.isSuccessful()) {
                        Log.w(TAG, "Trip detail fetch unsuccessful for tripId=" + targetTripId + " status=" + response.code());
                        return;
                    }

                    JSONObject payload = bodyString != null ? parseJsonObject(bodyString) : null;
                    JSONObject tripData = extractTripDataFromApiPayload(payload);
                    if (tripData == null) {
                        Log.w(TAG, "Trip detail fetch returned empty payload for tripId=" + targetTripId);
                        return;
                    }

                    if (!tripData.has("trip_id")) {
                        tripData.put("trip_id", targetTripId);
                    }

                    mergeNotificationHintsIntoTrip(tripData, extrasForMerge);

                    overlayPayload = new JSONObject();
                    overlayPayload.put("type", "trip_request");
                    overlayPayload.put("data", tripData);
                    overlayPayload.put("source", "notification_fallback");

                    synchronized (tripFallbackLock) {
                        deliver = pendingNotificationTripId != null
                                && pendingNotificationTripId.equals(targetTripId)
                                && !pendingTripHandled;
                        pendingTripHandled = deliver || pendingTripHandled;
                        if (deliver) {
                            pendingNotificationTripId = null;
                            pendingNotificationPayload = null;
                        }
                        fallbackFetchInFlight = false;
                        cancelPendingTripFetchLocked();
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Trip detail fetch parse error for tripId=" + tripId, e);
                } finally {
                    try {
                        response.close();
                    } catch (Exception ignored) {}
                    if (!deliver) {
                        synchronized (tripFallbackLock) {
                            fallbackFetchInFlight = false;
                        }
                    }
                }

                if (deliver && overlayPayload != null) {
                    JSONObject finalPayload = overlayPayload;
                    mainHandler.post(() -> checkDriverTokenAndHandle(finalPayload));
                } else if (!deliver) {
                    Log.d(TAG, "Trip detail fetch ignored for tripId=" + targetTripId + " (already handled)");
                }
            }
        });
    }

    private JSONObject extractTripDataFromApiPayload(JSONObject payload) {
        if (payload == null) {
            return null;
        }
        JSONObject tripObject = payload.optJSONObject("trip");
        if (tripObject != null) {
            return tripObject;
        }
        JSONArray tripArray = payload.optJSONArray("trip");
        if (tripArray != null && tripArray.length() > 0) {
            JSONObject first = tripArray.optJSONObject(0);
            if (first != null) {
                return first;
            }
        }
        JSONObject dataObject = payload.optJSONObject("data");
        if (dataObject != null) {
            JSONObject nestedTrip = dataObject.optJSONObject("trip");
            if (nestedTrip != null) {
                return nestedTrip;
            }
            if (dataObject.has("_id") || dataObject.has("trip_id") || dataObject.has("stops")) {
                return dataObject;
            }
        }
        if (payload.has("_id") || payload.has("trip_id") || payload.has("stops")) {
            return payload;
        }
        return null;
    }

    private void mergeNotificationHintsIntoTrip(JSONObject tripData, JSONObject extras) {
        if (tripData == null) {
            return;
        }
        try {
            if (extras != null) {
                String currentFare = cleanDisplay(extras.optString("currentFare", ""));
                if (currentFare.isEmpty()) {
                    currentFare = cleanDisplay(extras.optString("current_fare", ""));
                }
                if (!currentFare.isEmpty() && !tripData.has("fare")) {
                    try {
                        double fareValue = Double.parseDouble(currentFare);
                        tripData.put("fare", fareValue);
                    } catch (NumberFormatException nfe) {
                        tripData.put("fare", currentFare);
                    }
                }

                String requestId = cleanDisplay(extras.optString("requestId", ""));
                if (requestId.isEmpty()) {
                    requestId = cleanDisplay(extras.optString("request_id", ""));
                }
                if (!requestId.isEmpty() && !tripData.has("request_id")) {
                    tripData.put("request_id", requestId);
                }
            }

            if (coerceTimeoutSeconds(tripData) <= 0) {
                int mergedTimeout = 0;
                if (extras != null) {
                    mergedTimeout = coerceTimeoutSeconds(extras);
                    if (mergedTimeout <= 0) {
                        mergedTimeout = coerceTimeoutSeconds(extras.optJSONObject("data"));
                    }
                }
                if (mergedTimeout > 0) {
                    tripData.put("timeout_seconds", mergedTimeout);
                    tripData.put("timeOutSeconds", mergedTimeout);
                    tripData.put("timeoutSeconds", mergedTimeout);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to merge notification hints into trip payload", e);
        }
    }

    private int resolveTimeoutSeconds(JSONObject tripData, JSONObject outerPayload) {
        int timeout = coerceTimeoutSeconds(tripData);
        if (timeout > 0) {
            return timeout;
        }
        timeout = coerceTimeoutSeconds(outerPayload);
        if (timeout > 0) {
            return timeout;
        }
        if (outerPayload != null) {
            timeout = coerceTimeoutSeconds(outerPayload.optJSONObject("data"));
        }
        return Math.max(timeout, 0);
    }

    private int coerceTimeoutSeconds(JSONObject source) {
        if (source == null) {
            return 0;
        }
        int value = source.optInt("timeout_seconds", -1);
        if (value <= 0) {
            value = source.optInt("timeoutSeconds", -1);
        }
        if (value <= 0) {
            value = source.optInt("timeOutSeconds", -1);
        }
        if (value <= 0) {
            value = source.optInt("trip_accept_duration", -1);
        }
        if (value <= 0) {
            value = parseTimeoutString(source.optString("timeout_seconds", null));
        }
        if (value <= 0) {
            value = parseTimeoutString(source.optString("timeoutSeconds", null));
        }
        if (value <= 0) {
            value = parseTimeoutString(source.optString("timeOutSeconds", null));
        }
        if (value <= 0) {
            value = parseTimeoutString(source.optString("trip_accept_duration", null));
        }
        return value > 0 ? value : 0;
    }

    private int parseTimeoutString(String rawValue) {
        String cleaned = cleanDisplay(rawValue);
        if (cleaned.isEmpty()) {
            return 0;
        }
        try {
            double numeric = Double.parseDouble(cleaned);
            if (numeric > 0) {
                return (int) Math.round(numeric);
            }
        } catch (NumberFormatException ignored) {}
        return 0;
    }

    private void markTripRequestDataDelivered(JSONObject payload) {
        String tripId = extractTripIdFromPayload(payload);
        if (tripId == null) {
            return;
        }
        synchronized (tripFallbackLock) {
            if (pendingNotificationTripId != null && pendingNotificationTripId.equals(tripId)) {
                pendingTripHandled = true;
                pendingNotificationTripId = null;
                pendingNotificationPayload = null;
                fallbackFetchInFlight = false;
                cancelPendingTripFetchLocked();
            }
            recordSocketTripHandledLocked(tripId);
        }
    }

    private void recordSocketTripHandledLocked(String tripId) {
        if (tripId == null || tripId.isEmpty()) {
            return;
        }
        long now = System.currentTimeMillis();
        pruneSocketHandledCacheLocked(now);
        socketHandledTripCache.put(tripId, now);
    }

    private boolean wasTripHandledBySocketLocked(String tripId) {
        if (tripId == null || tripId.isEmpty()) {
            return false;
        }
        long now = System.currentTimeMillis();
        pruneSocketHandledCacheLocked(now);
        return socketHandledTripCache.containsKey(tripId);
    }

    private void pruneSocketHandledCacheLocked(long now) {
        if (socketHandledTripCache.isEmpty()) {
            return;
        }
        Iterator<Map.Entry<String, Long>> iterator = socketHandledTripCache.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, Long> entry = iterator.next();
            if (now - entry.getValue() > SOCKET_HANDLED_CACHE_TTL_MS) {
                iterator.remove();
            }
        }
    }

    private String extractTripIdFromPayload(JSONObject payload) {
        if (payload == null) {
            return null;
        }
        JSONObject data = payload.optJSONObject("data");
        String tripId = null;
        if (data != null) {
            tripId = cleanDisplay(data.optString("trip_id", ""));
            if (tripId.isEmpty()) {
                tripId = cleanDisplay(data.optString("tripId", ""));
            }
            if (tripId.isEmpty()) {
                tripId = cleanDisplay(data.optString("_id", ""));
            }
        } else {
            tripId = cleanDisplay(payload.optString("trip_id", ""));
            if (tripId.isEmpty()) {
                tripId = cleanDisplay(payload.optString("tripId", ""));
            }
        }
        return (tripId == null || tripId.isEmpty()) ? null : tripId;
    }

    private void cancelPendingTripFetchLocked() {
        if (pendingTripFetchRunnable != null) {
            mainHandler.removeCallbacks(pendingTripFetchRunnable);
            pendingTripFetchRunnable = null;
        }
    }

    private void clearPendingTripFallback() {
        synchronized (tripFallbackLock) {
            pendingNotificationTripId = null;
            pendingNotificationPayload = null;
            pendingTripHandled = false;
            fallbackFetchInFlight = false;
            cancelPendingTripFetchLocked();
        }
    }

    private boolean isSessionExpiredFromBody(String responseBody) {
        if (responseBody == null) return false;
        String trimmed = responseBody.trim();
        if (trimmed.isEmpty()) return false;
        try {
            Object parsed = new JSONTokener(trimmed).nextValue();
            if (parsed instanceof JSONObject) {
                JSONObject obj = (JSONObject) parsed;
                String err = obj.optString("error", "");
                if (!err.isEmpty()) {
                    String lower = err.trim().toLowerCase(Locale.US);
                    if ("session_expired".equals(lower) || lower.contains("session_expired")) {
                        return true;
                    }
                }
                // Also consider message fields
                String msg = obj.optString("message", "");
                String code = obj.optString("code", "");
                String normMsg = msg != null ? msg.trim().toLowerCase(Locale.US) : "";
                String normCode = code != null ? code.trim().toLowerCase(Locale.US) : "";
                if (normMsg.contains("session_expired") || normCode.contains("session_expired")) {
                    return true;
                }
            } else if (parsed instanceof JSONArray) {
                JSONArray arr = (JSONArray) parsed;
                for (int i = 0; i < arr.length(); i++) {
                    String val = String.valueOf(arr.opt(i));
                    if (val != null && val.toLowerCase(Locale.US).contains("session_expired")) {
                        return true;
                    }
                }
            } else if (parsed instanceof String) {
                String s = (String) parsed;
                if (s.trim().toLowerCase(Locale.US).contains("session_expired")) {
                    return true;
                }
            }
        } catch (Exception ignored) {
            // Fallback to substring check below
        }
        return trimmed.toLowerCase(Locale.US).contains("session_expired");
    }

    private static String normalizeToken(String value) {
        if (value == null) return null;
        String v = value.trim();
        if (v.isEmpty() || "null".equalsIgnoreCase(v)) return null;
        return v;
    }

    private static String stripQuotes(String value) {
        if (value == null) return null;
        String v = value.trim();
        if (v.length() >= 2 && v.startsWith("\"") && v.endsWith("\"")) {
            v = v.substring(1, v.length() - 1);
        }
        return v;
    }

    private void scheduleSocketRetry() {
        if (!hasStarted) {
            return;
        }
        if (!isDriverServiceRunning()) {
            Log.d(TAG, "Driver service not running; skip socket retry");
            return;
        }
        mainHandler.removeCallbacks(socketRetryRunnable);
        mainHandler.postDelayed(socketRetryRunnable, SOCKET_RETRY_DELAY_MS);
    }

    private void scheduleSocketHealthCheck() {
        if (!hasStarted) {
            return;
        }
        if (!isDriverServiceRunning()) {
            Log.d(TAG, "Driver service not running; skip health check scheduling");
            return;
        }
        mainHandler.removeCallbacks(socketHealthCheckRunnable);
        mainHandler.postDelayed(socketHealthCheckRunnable, SOCKET_HEALTH_INTERVAL_MS);
    }

    private void runSocketHealthCheck() {
        if (!hasStarted) {
            return;
        }
        if (!isDriverServiceRunning()) {
            Log.d(TAG, "Driver service not running; cancel socket health check");
            return;
        }
        boolean connected = driverSocket != null && driverSocket.connected();
        if (!connected) {
            Log.w(TAG, "Socket health check triggered reconnect");
            initDriverSocket();
        }
        scheduleSocketHealthCheck();
    }

    private void showOverlay(JSONObject data) {
    if (windowManager == null) {
        windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
    }
    removeOverlay();

    if (isAppInForeground()) {
        Log.i(TAG, "App in foreground; skipping overlay banner");
        stopAlertAudio();
        DriverLocationService service = DriverLocationService.getInstanceSafe();
        if (service != null) {
            service.setOverlayActive(false);
        }
        emitOverlayVisibility(false);
        return;
    }

    try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            Log.w(TAG, "Overlay permission missing; cannot display trip banner");
            stopAlertAudio();
            cancelOverlayAutoDismiss();
            emitOverlayVisibility(false);
            return;
        }

        LayoutInflater inflater = LayoutInflater.from(context);
        overlayView = inflater.inflate(R.layout.driver_overlay_banner, null);

        DriverLocationService service = DriverLocationService.getInstanceSafe();
        if (service != null) {
            service.setOverlayActive(true);
            service.playAlertSoundWithLoop(1);
        }

        int paramsType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            paramsType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            //noinspection deprecation
            paramsType = WindowManager.LayoutParams.TYPE_PHONE;
        }

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                paramsType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP;

        ImageView appIcon = overlayView.findViewById(R.id.overlay_app_icon);
        if (appIcon != null) {
            appIcon.setImageResource(R.mipmap.ic_launcher_round);
        }

        TextView title = overlayView.findViewById(R.id.overlay_title);
        ProgressBar timerProgress = overlayView.findViewById(R.id.overlay_timer_progress);
        Button btnAccept = overlayView.findViewById(R.id.overlay_accept_btn);
        Button btnReject = overlayView.findViewById(R.id.overlay_reject_btn);
        TextView bonusText = overlayView.findViewById(R.id.overlay_bonus_text);
        TextView distanceText = overlayView.findViewById(R.id.overlay_distance_text);

        applyOverlayTypography(title, btnAccept, btnReject);

        title.setText("New Trip Request");

        JSONObject inner = data.optJSONObject("data");
        int timeoutSeconds = resolveTimeoutSeconds(inner, data);

        // Show bonus and distance information if available
        applyBonusAndDistanceUI(bonusText, distanceText, inner);
        bindTripDetails(overlayView, inner);

        btnAccept.setOnClickListener(v -> {
            emitDriverResponse(data, true);
            clearNotificationTray();
            removeOverlay();
            openApp();
            emitOverlayResponse(true, data);
        });

        btnReject.setOnClickListener(v -> {
            emitDriverResponse(data, false);
            clearNotificationTray();
            removeOverlay();
            emitOverlayResponse(false, data);
        });

        if (windowManager != null) {
            // ✅ IMPORTANT: attach overlay first
            windowManager.addView(overlayView, params);
            emitOverlayVisibility(true);

            // ✅ Start progress + auto-dismiss AFTER attach (prevents "starts on click" bug)
            overlayView.post(() -> {
                initTimerUI(timerProgress);
                scheduleOverlayAutoDismiss(timerProgress, timeoutSeconds);
            });
        } else {
            emitOverlayVisibility(false);
        }

    } catch (Exception e) {
        Log.e(TAG, "Failed to add overlay view", e);
        emitOverlayVisibility(false);
    }
}

    private void removeOverlay() {
        if (overlayView != null) {
            try {
                if (windowManager != null) {
                    windowManager.removeView(overlayView);
                }
            } catch (Exception ignored) {}
            overlayView = null;
        }
        cancelOverlayAutoDismiss();
        stopAlertAudio();
        DriverLocationService service = DriverLocationService.getInstanceSafe();
        if (service != null) {
            service.setOverlayActive(false);
        }
        emitOverlayVisibility(false);
    }

    private void handleCancelRideMatch(JSONObject payload) {
        if (payload == null) {
            Log.w(TAG, "cancel_ride_match event missing payload");
            return;
        }

        String status = payload.optString("status", "");
        if (!"CANCELLED".equalsIgnoreCase(status)) {
            Log.d(TAG, "cancel_ride_match ignored with status=" + status);
            return;
        }

        Log.i(TAG, "Received cancel_ride_match -> dismissing overlay");
        final JSONObject payloadCopy = payload;
        mainHandler.post(() -> {
            removeOverlay();
            showTripCancelledNotification(payloadCopy);
        });
    }

    private void showTripCancelledNotification(JSONObject payload) {
        try {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) {
                Log.w(TAG, "NotificationManager unavailable; cannot show cancel alert");
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel existing = manager.getNotificationChannel(CANCEL_CHANNEL_ID);
                if (existing == null) {
                    NotificationChannel channel = new NotificationChannel(
                            CANCEL_CHANNEL_ID,
                            "Trip updates",
                            NotificationManager.IMPORTANCE_HIGH
                    );
                    channel.enableVibration(true);
                    manager.createNotificationChannel(channel);
                }
            }

            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            PendingIntent contentIntent = null;
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                int pendingFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                        ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                        : PendingIntent.FLAG_UPDATE_CURRENT;
                contentIntent = PendingIntent.getActivity(context, 0, launchIntent, pendingFlags);
            }

            String message = payload != null ? payload.optString("message", "") : "";
            if (message == null || message.trim().isEmpty()) {
                message = "Trip has been cancelled by passanger.";
            }

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CANCEL_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher_round)
                    .setContentTitle("Trip cancelled")
                    .setContentText(message)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                    .setAutoCancel(true)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setDefaults(Notification.DEFAULT_ALL);

            if (contentIntent != null) {
                builder.setContentIntent(contentIntent);
            }

            manager.notify(CANCEL_NOTIFICATION_ID, builder.build());
        } catch (Exception e) {
            Log.e(TAG, "Failed to show cancellation notification", e);
        }
    }

    private void openApp() {
        try {
            if (isAppInForeground()) {
                Log.i(TAG, "App already in foreground; skipping launch after acceptance");
                return;
            }
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (launchIntent == null) {
                Log.w(TAG, "Launch intent unavailable; cannot open app");
                return;
            }
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            context.startActivity(launchIntent);
            Log.i(TAG, "Launched app after trip acceptance");
        } catch (Exception e) {
            Log.e(TAG, "Failed to open app after acceptance", e);
        }
    }

    private void emitDriverResponse(JSONObject data, boolean accept) {
        try {
            JSONObject tripData = data.optJSONObject("data");
            if (tripData == null) return;

            String tripIdValue = tripData.optString("trip_id");
            String requestId = tripData.optString("request_id");
            String driverId = tripData.optString("driver_id");
            if (driverId == null || driverId.isEmpty()) {
                driverId = ensureDriverId();
            }
            if (driverId == null || driverId.isEmpty()) {
                Log.w(TAG, "Cannot emit driver response without driver id");
                return;
            }

            JSONObject responsePayload = new JSONObject();
            responsePayload.put("driver_id", driverId);
            responsePayload.put("trip_id", tripIdValue);
            responsePayload.put("response", accept ? "accept" : "reject");
            responsePayload.put("request_id", requestId);

            if (driverSocket != null) {
                driverSocket.emit("driver_trip_response", responsePayload);
            }
            stopAlertAudio();
            Log.i(TAG, "Emitted driver_trip_response: " + responsePayload);
        } catch (Exception e) {
            Log.e(TAG, "emitDriverResponse error", e);
        }
    }

    private void clearNotificationTray() {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancelAll();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to clear notification tray", e);
        }
    }

    private boolean isAppInForeground() {
        ActivityManager.RunningAppProcessInfo info = new ActivityManager.RunningAppProcessInfo();
        ActivityManager.getMyMemoryState(info);
        int importance = info.importance;
        return importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                || importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_VISIBLE;
    }

    /**
     * Returns true if the background driver tracking service is active.
     * When the app UI is closed, this remains true if the service keeps running.
     */
    private boolean isDriverServiceRunning() {
        try {
            DriverLocationService service = DriverLocationService.getInstanceSafe();
            return service != null;
        } catch (Exception e) {
            Log.w(TAG, "Unable to determine DriverLocationService state", e);
            return false;
        }
    }

    private void stopAlertAudio() {
        try {
            DriverLocationService service = DriverLocationService.getInstanceSafe();
            if (service != null) {
                service.stopAlertSound();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop DriverLocationService alert audio", e);
        }
        try {
            PlayTripSoundModule.stopSoundIfActive();
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop PlayTripSoundModule audio", e);
        }
    }

    private String ensureDriverId() {
        if (cachedDriverId != null && !cachedDriverId.isEmpty()) {
            return cachedDriverId;
        }
        try {
            String rawUserInfo = normalizeUserInfo(AsyncStorageReader.readValueFromAsyncStorage(context, "userdetails"));
            Log.d(TAG, "Loaded userInfo from storage: " + rawUserInfo);
            if (rawUserInfo == null) {
                return null;
            }
            JSONObject info = parseJsonObject(rawUserInfo);
            if (info != null) {
                cachedDriverId = info.optString("_id", null);
                Log.d(TAG, "Resolved driverId=" + cachedDriverId);
                return cachedDriverId;
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to load driver id", e);
        }
        return null;
    }

    private static String normalizeUserInfo(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isEmpty() || "null".equalsIgnoreCase(trimmed)) {
            return null;
        }
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() > 1) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static JSONObject parseJsonObject(String raw) throws JSONException {
        try {
            return new JSONObject(raw);
        } catch (JSONException primary) {
            String decoded = decodeEscapedJson(raw);
            if (decoded != null && !decoded.equals(raw)) {
                Log.d(TAG, "Retrying JSON parse after unescaping storage payload");
                return new JSONObject(decoded);
            }
            throw primary;
        }
    }

    private static String decodeEscapedJson(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            Object candidate = new JSONTokener("\"" + raw + "\"").nextValue();
            if (candidate instanceof String) {
                return (String) candidate;
            }
        } catch (JSONException ignored) {}
        return raw;
    }

    private void applyOverlayTypography(TextView title, Button accept, Button reject) {
        Typeface bold = getLexendBold();
        if (bold != null) {
            if (title != null) {
                title.setTypeface(bold);
            }
            if (accept != null) {
                accept.setTypeface(bold);
            }
            if (reject != null) {
                reject.setTypeface(bold);
            }
        }
    }

    private Typeface getLexendBold() {
        if (lexendBold == null && !fontInitAttempted) {
            fontInitAttempted = true;
            try {
                lexendBold = Typeface.createFromAsset(context.getAssets(), "fonts/Lexend-Bold.ttf");
            } catch (Exception e) {
                Log.e(TAG, "Failed loading Lexend-Bold font; falling back to default", e);
                lexendBold = Typeface.DEFAULT_BOLD;
            }
        }
        return lexendBold;
    }

    private void scheduleOverlayAutoDismiss(ProgressBar progressBar, int timeoutSeconds) {
    cancelOverlayAutoDismiss();

    if (timeoutSeconds <= 0) {
        return;
    }

    long totalDurationMs = timeoutSeconds * 1000L;

    overlayDismissRunnable = this::removeOverlay;
    mainHandler.postDelayed(overlayDismissRunnable, totalDurationMs);

    if (progressBar != null) {
        progressBar.post(() -> {
            // Ensure ProgressBar is ready
            int max = progressBar.getMax();
            if (max <= 0) {
                max = 1000;
                progressBar.setMax(max);
            }
            progressBar.setIndeterminate(false);
            progressBar.setProgress(max);
            progressBar.invalidate();

            progressAnimator = ValueAnimator.ofInt(max, 0);
            progressAnimator.setDuration(totalDurationMs);
            progressAnimator.setInterpolator(new LinearInterpolator());
            progressAnimator.addUpdateListener(animation -> {
                int value = (int) animation.getAnimatedValue();
                progressBar.setProgress(value);

                // ✅ Force redraw for overlay windows (prevents "only animates after click")
                progressBar.invalidate();
            });
            progressAnimator.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    progressAnimator = null;
                }

                @Override
                public void onAnimationCancel(Animator animation) {
                    progressAnimator = null;
                }
            });
            progressAnimator.start();
        });
    }
}

    private void cancelOverlayAutoDismiss() {
        if (overlayDismissRunnable != null) {
            mainHandler.removeCallbacks(overlayDismissRunnable);
            overlayDismissRunnable = null;
        }
        if (progressAnimator != null) {
            progressAnimator.cancel();
            // Defensive null check in case cancel() sets progressAnimator to null
           if (progressAnimator != null) {
                progressAnimator.removeAllUpdateListeners();
                progressAnimator.removeAllListeners();
           }
            progressAnimator = null;
        }
    }

   private void initTimerUI(ProgressBar progressBar) {
    if (progressBar != null) {
        progressBar.setIndeterminate(false);
        progressBar.setMax(1000);
        progressBar.setProgress(1000);
        progressBar.invalidate();
    }
}

    public void hideOverlay() {
        mainHandler.post(this::removeOverlay);
    }

    private void bindTripDetails(View root, JSONObject tripData) {
        LinearLayout container = root.findViewById(R.id.overlay_trip_container);
        TextView header = root.findViewById(R.id.overlay_trip_header);
        if (container == null) {
            if (header != null) {
                header.setVisibility(View.GONE);
            }
            return;
        }

        container.removeAllViews();
        boolean hasAny = false;

        if (tripData != null) {
            LayoutInflater inflater = LayoutInflater.from(context);
            JSONArray stops = tripData.optJSONArray("stops");
            if (stops != null && stops.length() > 0) {
                for (int i = 0; i < stops.length(); i++) {
                    JSONObject stop = stops.optJSONObject(i);
                    if (stop == null) {
                        continue;
                    }
                    String rawName = cleanDisplay(stop.optString("name", ""));
                    String address = cleanDisplay(stop.optString("address", ""));
                    if (address.isEmpty()) {
                        address = formatLocation(stop.optJSONArray("location"));
                    }
                    if (address.isEmpty()) {
                        address = ADDRESS_FALLBACK;
                    }

                    int iconRes = iconForIndex(i, stops.length());
                    String label = labelForIndex(i, stops.length(), rawName);
                    addTripPointRow(inflater, container, iconRes, label, address);
                    hasAny = true;
                }
            } else {
                hasAny |= addFallbackPoint(inflater, container, tripData, true);
                hasAny |= addFallbackPoint(inflater, container, tripData, false);
            }
        }

        if (header != null) {
            header.setVisibility(hasAny ? View.VISIBLE : View.GONE);
        }
        container.setVisibility(hasAny ? View.VISIBLE : View.GONE);
    }

    private void emitOverlayVisibility(boolean visible) {
        ReactApplicationContext reactContext = BGLocationServiceModule.getReactContext();
        if (reactContext == null || !reactContext.hasActiveCatalystInstance()) {
            return;
        }

        WritableMap payload = Arguments.createMap();
        payload.putBoolean("visible", visible);

        try {
            reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(EVENT_TRIP_OVERLAY_VISIBILITY, payload);
        } catch (Exception e) {
            Log.e(TAG, "Failed to emit overlay visibility", e);
        }
    }

    private void emitOverlayResponse(boolean accepted, JSONObject rawPayload) {
        ReactApplicationContext reactContext = BGLocationServiceModule.getReactContext();
        if (reactContext == null || !reactContext.hasActiveCatalystInstance()) {
            return;
        }

        WritableMap payload = Arguments.createMap();
        payload.putBoolean("accepted", accepted);
        payload.putBoolean("rejected", !accepted);
        try {
            if (rawPayload != null) {
                payload.putString("raw", rawPayload.toString());
            }
        } catch (Exception e) {
            Log.w(TAG, "Unable to serialize overlay response payload", e);
        }

        try {
            reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(EVENT_TRIP_OVERLAY_RESPONSE, payload);
        } catch (Exception e) {
            Log.e(TAG, "Failed to emit overlay response", e);
        }
    }

    private boolean addFallbackPoint(LayoutInflater inflater, LinearLayout container, JSONObject tripData, boolean isStart) {
        String nameKey = isStart ? "pickup_name" : "dropoff_name";
        String addressKey = isStart ? "pickup_address" : "dropoff_address";
        String locationKey = isStart ? "pickup_location" : "dropoff_location";

        String rawName = cleanDisplay(tripData.optString(nameKey, ""));
        String address = cleanDisplay(tripData.optString(addressKey, ""));
        if (address.isEmpty()) {
            address = formatLocation(tripData.optJSONArray(locationKey));
        }
        if (rawName.isEmpty() && address.isEmpty()) {
            return false;
        }
        if (address.isEmpty()) {
            address = ADDRESS_FALLBACK;
        }

        int iconRes = isStart ? R.drawable.start_marker : R.drawable.end_marker;
        String label = isStart
                ? (rawName.isEmpty() ? "Start" : "Start: " + rawName)
                : (rawName.isEmpty() ? "Destination" : "Destination: " + rawName);

        addTripPointRow(inflater, container, iconRes, label, address);
        return true;
    }

    private void addTripPointRow(LayoutInflater inflater, LinearLayout container, int iconRes, String label, String address) {
        if (inflater == null || container == null) {
            return;
        }
        View row = inflater.inflate(R.layout.driver_overlay_trip_point, container, false);
        if (row == null) {
            return;
        }
        ImageView icon = row.findViewById(R.id.overlay_point_icon);
        TextView nameView = row.findViewById(R.id.overlay_point_name);
        TextView addressView = row.findViewById(R.id.overlay_point_address);

        if (icon != null) icon.setImageResource(iconRes);
        if (nameView != null) nameView.setText(label != null ? label : "");
        if (addressView != null) addressView.setText(address != null ? address : "");

        container.addView(row);
    }

    private String labelForIndex(int index, int total, String rawName) {
        String cleanName = cleanDisplay(rawName);
        if (index == 0) {
            return cleanName.isEmpty() ? "Start" : "Start: " + cleanName;
        }
        if (index == total - 1) {
            return cleanName.isEmpty() ? "Destination" : "Destination: " + cleanName;
        }
        String base = "Stop " + index;
        return cleanName.isEmpty() ? base : base + ": " + cleanName;
    }

    private int iconForIndex(int index, int total) {
        if (index == 0) {
            return R.drawable.start_marker;
        }
        if (index == total - 1) {
            return R.drawable.end_marker;
        }
        return R.drawable.marker_stop_blue;
    }

    private String formatLocation(JSONArray coords) {
        if (coords == null || coords.length() < 2) {
            return "";
        }
        double lon = coords.optDouble(0, Double.NaN);
        double lat = coords.optDouble(1, Double.NaN);
        if (Double.isNaN(lat) || Double.isNaN(lon)) {
            return "";
        }
        return String.format(Locale.US, "%.5f, %.5f", lat, lon);
    }

    private String cleanDisplay(String raw) {
        if (raw == null) {
            return "";
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty() || "null".equalsIgnoreCase(trimmed)) {
            return "";
        }
        return trimmed;
    }

    private void applyBonusAndDistanceUI(TextView bonusText, TextView distanceText, JSONObject tripData) {
        if (tripData == null) {
            if (bonusText != null) bonusText.setVisibility(View.GONE);
            if (distanceText != null) distanceText.setVisibility(View.GONE);
            return;
        }

        // Bonus banner: show when escalation_bonus > 0 or in debug for testing
        try {
            JSONObject esc = tripData.optJSONObject("escalation_details");
            double bonusVal = esc != null ? esc.optDouble("escalation_bonus", 0) : 0;
            if (bonusText != null) {
                // || BuildConfig.DEBUG
                if (bonusVal > 0 ) {
                    bonusText.setText("\uD83C\uDF81 Special bonus added for this trip");
                    bonusText.setVisibility(View.VISIBLE);
                } else {
                    bonusText.setVisibility(View.GONE);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to apply bonus UI", e);
            if (bonusText != null) bonusText.setVisibility(View.GONE);
        }

        // Distance: compute and show if valid
        try {
            double km = computeTripDistanceKm(tripData);
            if (distanceText != null) {
                if (km >= 0) {
                    String text = String.format(Locale.US, "\uD83D\uDCCF Distance: %.1f km", km);
                    distanceText.setText(text);
                    distanceText.setVisibility(View.VISIBLE);
                } else {
                    distanceText.setVisibility(View.GONE);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to apply distance UI", e);
            if (distanceText != null) distanceText.setVisibility(View.GONE);
        }
    }

    private double computeTripDistanceKm(JSONObject tripData) {
        if (tripData == null) return -1;
        // Prefer using stops if both first and last are available
        JSONArray stops = tripData.optJSONArray("stops");
        if (stops != null && stops.length() >= 2) {
            JSONObject first = stops.optJSONObject(0);
            JSONObject last = stops.optJSONObject(stops.length() - 1);
            if (first != null && last != null) {
                JSONArray a = first.optJSONArray("location");
                JSONArray b = last.optJSONArray("location");
                double[] A = parseLatLon(a);
                double[] B = parseLatLon(b);
                if (A != null && B != null) {
                    return haversineKm(A[0], A[1], B[0], B[1]);
                }
            }
        }
        // Fallback to pickup/dropoff
        double[] A = parseLatLon(tripData.optJSONArray("pickup_location"));
        double[] B = parseLatLon(tripData.optJSONArray("dropoff_location"));
        if (A != null && B != null) {
            return haversineKm(A[0], A[1], B[0], B[1]);
        }
        return -1;
    }

    private static double[] parseLatLon(JSONArray coords) {
        if (coords == null || coords.length() < 2) return null;
        double lon = coords.optDouble(0, Double.NaN);
        double lat = coords.optDouble(1, Double.NaN);
        if (Double.isNaN(lat) || Double.isNaN(lon)) return null;
        return new double[] { lat, lon };
    }

    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0088; // mean Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
