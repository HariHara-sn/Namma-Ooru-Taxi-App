package com.virtualmaze.prcustomer.tracking;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.virtualmaze.prcustomer.BuildConfig;
import com.virtualmaze.prcustomer.AsyncStorageReader;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class LocationForegroundService extends Service {
  public static final String ACTION_START = "com.virtualmaze.prcustomer.tracking.ACTION_START";
  public static final String ACTION_STOP = "com.virtualmaze.prcustomer.tracking.ACTION_STOP";

  private static final String CHANNEL_ID = "location_tracking";
  private static final int NOTIF_ID = 9123;
  private static volatile boolean running = false;

  private FusedLocationProviderClient fused;
  private LocationCallback callback;
  private String apiUrl = null;
  private long intervalMs = 10000L;
  private final HashMap<String, String> headers = new HashMap<>();
  private OkHttpClient http;
  private final Gson gson = new Gson();
  private String accessToken = null;
  private String sosEventId = null;
  private long autoStopMs = 60 * 60 * 1000L; // default 1 hour
  private volatile boolean autoStopScheduled = false;

  @Override
  public void onCreate() {
    super.onCreate();
    fused = LocationServices.getFusedLocationProviderClient(this);
    http = new OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build();
    createChannel();
  }

  private String stripQuotes(String v) {
    if (v == null) return null;
    String s = v.trim();
    if (s.length() >= 2 && s.startsWith("\"") && s.endsWith("\"")) {
      return s.substring(1, s.length() - 1);
    }
    return s;
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    String action = intent != null ? intent.getAction() : null;
    if (ACTION_STOP.equals(action)) {
      // Post stop payload if possible before stopping
      try {
        String reason = intent.getStringExtra("stopReason");
        String status = intent.getStringExtra("stopStatus");
        postStopPayload(reason, status);
      } catch (Throwable ignored) {}
      stopSelf();
      return START_NOT_STICKY;
    }

    if (ACTION_START.equals(action)) {
      // Prefer explicit apiUrl if provided; otherwise, default to SOS tracking endpoint
      apiUrl = intent.getStringExtra("apiUrl");
      if (apiUrl == null || apiUrl.isEmpty()) {
        apiUrl = BuildConfig.ROOT_API_URL + "/publicrides/customer/v2/sos/tracking/update";
      }
      intervalMs = intent.getLongExtra("intervalMs", 10000L);
      String headersJson = intent.getStringExtra("headersJson");
      if (headersJson != null) {
        Type type = new TypeToken<HashMap<String, String>>() {}.getType();
        HashMap<String, String> map = gson.fromJson(headersJson, type);
        if (map != null) headers.putAll(map);
        // Allow autoStopMs to be passed via headersJson as string
        try {
          String v = headers.get("autoStopMs");
          if (v != null) {
            long ms = Long.parseLong(v);
            if (ms > 0) autoStopMs = ms;
          }
        } catch (Throwable ignored) {}
      }
      // Also allow explicit intent extra
      long maybeAuto = intent.getLongExtra("autoStopMs", -1L);
      if (maybeAuto > 0) autoStopMs = maybeAuto;
      // Read tokens/event id from AsyncStorage
      try {
        accessToken = AsyncStorageReader.readValueFromAsyncStorage(getApplicationContext(), "access_token");
        accessToken = stripQuotes(accessToken);
      } catch (Exception e) {
        Log.w("LocationService", "Failed to read access_token", e);
      }
      try {
        sosEventId = AsyncStorageReader.readValueFromAsyncStorage(getApplicationContext(), "sOS_EVENTID");
      } catch (Exception e) {
        Log.w("LocationService", "Failed to read sOS_EVENTID", e);
      }
      startForeground(NOTIF_ID, buildNotification());
      startLocationUpdates();
      scheduleAutoStop();
      running = true;
      return START_STICKY;
    }

    // If service restarted by system without intent
    startForeground(NOTIF_ID, buildNotification());
    // Ensure defaults if restarted by system
    if (apiUrl == null || apiUrl.isEmpty()) {
      apiUrl = BuildConfig.ROOT_API_URL + "/publicrides/customer/v2/sos/tracking/update";
    }
    if (accessToken == null) {
      try { accessToken = AsyncStorageReader.readValueFromAsyncStorage(getApplicationContext(), "access_token"); accessToken = stripQuotes(accessToken); } catch (Exception ignored) {}
    }
    if (sosEventId == null) {
      try { sosEventId = AsyncStorageReader.readValueFromAsyncStorage(getApplicationContext(), "sOS_EVENTID"); } catch (Exception ignored) {}
    }
    startLocationUpdates();
    scheduleAutoStop();
    running = true;
    return START_STICKY;
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    if (fused != null && callback != null) {
      fused.removeLocationUpdates(callback);
    }
    moveAndClearEventId();
    running = false;
    // Broadcast to RN that tracking stopped
    try {
      Intent stopped = new Intent("com.virtualmaze.prcustomer.tracking.STOPPED");
      stopped.putExtra("reason", "stopped");
      stopped.putExtra("status", "stopped");
      sendBroadcast(stopped);
    } catch (Throwable ignored) {}
  }

  @Nullable
  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  private void createChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel ch = new NotificationChannel(
          CHANNEL_ID,
          "Location Tracking",
          NotificationManager.IMPORTANCE_LOW
      );
      ch.setDescription("Tracking your location for trips");
      NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
      nm.createNotificationChannel(ch);
    }
  }

  private Notification buildNotification() {
    // Stop action intent
    Intent stop = new Intent(this, StopTrackingReceiver.class);
    stop.setAction(ACTION_STOP);
    PendingIntent pStop = PendingIntent.getBroadcast(
        this,
        1,
        stop,
        (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0) | PendingIntent.FLAG_UPDATE_CURRENT
    );

    NotificationCompat.Action stopAction = new NotificationCompat.Action.Builder(
        android.R.drawable.ic_media_pause,
        "Stop",
        pStop
    ).build();

    NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_menu_mylocation)
        .setContentTitle("Tracking active")
        .setContentText("Sending your live location…")
        .setOnlyAlertOnce(true)
        .setOngoing(true)
        .addAction(stopAction)
        .setPriority(NotificationCompat.PRIORITY_LOW);
    return b.build();
  }

  private void startLocationUpdates() {
    LocationRequest req = new LocationRequest.Builder(intervalMs)
        .setPriority(Priority.PRIORITY_HIGH_ACCURACY)
        .setMinUpdateIntervalMillis(intervalMs)
        .setWaitForAccurateLocation(false)
        .build();

    callback = new LocationCallback() {
      @Override
      public void onLocationResult(LocationResult result) {
        if (result == null) return;
        for (Location loc : result.getLocations()) {
          sendToApi(loc);
        }
      }
    };

    try {
      fused.requestLocationUpdates(req, callback, getMainLooper());
    } catch (SecurityException se) {
      Log.e("LocationService", "Missing location permission", se);
    }
  }

  private void scheduleAutoStop() {
    if (autoStopMs <= 0 || autoStopScheduled) return;
    autoStopScheduled = true;
    new Thread(() -> {
      try {
        Thread.sleep(autoStopMs);
        if (running) {
          moveAndClearEventId();
          stopSelf();
        }
      } catch (InterruptedException ignored) {
      } finally {
        autoStopScheduled = false;
      }
    }).start();
  }

  private void moveAndClearEventId() {
    try {
      if (sosEventId != null && !sosEventId.isEmpty()) {
        AsyncStorageReader.writeValueToAsyncStorage(getApplicationContext(), "last_sOS_EVENTID", sosEventId);
        AsyncStorageReader.removeValueFromAsyncStorage(getApplicationContext(), "sOS_EVENTID");
      }
    } catch (Exception ignored) {}
  }

  private void postStopPayload(String reason, String status) {
    try {
      if (sosEventId == null || sosEventId.isEmpty()) {
        sosEventId = AsyncStorageReader.readValueFromAsyncStorage(getApplicationContext(), "sOS_EVENTID");
      }
      if (sosEventId == null || sosEventId.isEmpty()) return;

      String url = BuildConfig.ROOT_API_URL + "/publicrides/customer/v2/sos/stop";
      Map<String, Object> payload = new HashMap<>();
      payload.put("eventId", sosEventId);
      payload.put("reason", reason != null && !reason.isEmpty() ? reason : "Passenger safe at destination");
      payload.put("status", status != null && !status.isEmpty() ? status : "resolved");

      String body = gson.toJson(payload);
      RequestBody rb = RequestBody.create(JSON, body);
      Request.Builder builder = new Request.Builder().url(url).post(rb);
      if (accessToken == null || accessToken.isEmpty()) {
        accessToken = AsyncStorageReader.readValueFromAsyncStorage(getApplicationContext(), "access_token");
        accessToken = stripQuotes(accessToken);
      }
      if (accessToken != null && !accessToken.isEmpty()) {
        builder.addHeader("Authorization", "Bearer " + accessToken);
      }
      builder.addHeader("Content-Type", "application/json");
      Request req = builder.build();
      new Thread(() -> {
        try {
          Response resp = http.newCall(req).execute();
          if (!resp.isSuccessful()) {
            Log.w("LocationService", "SOS stop API error: " + resp.code());
          }
        } catch (IOException e) {
          Log.w("LocationService", "SOS stop API call failed: " + e.getMessage());
        }
      }).start();
    } catch (Throwable t) {
      Log.w("LocationService", "postStopPayload error", t);
    }
  }

  private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

  public static boolean isRunning() {
    return running;
  }

  private void sendToApi(Location loc) {
    if (apiUrl == null || apiUrl.isEmpty()) return;
    if (sosEventId == null || sosEventId.isEmpty()) return;

    Map<String, Object> payload = new HashMap<>();
    payload.put("eventId", sosEventId);
    ArrayList<Map<String, Object>> points = new ArrayList<>();
    Map<String, Object> point = new HashMap<>();
    point.put("latitude", loc.getLatitude());
    point.put("longitude", loc.getLongitude());
    point.put("time", loc.getTime());
    points.add(point);
    payload.put("points", points);

    String body = gson.toJson(payload);
    Log.d("LocationService", "payload: " + body);

    RequestBody rb = RequestBody.create(JSON, body);
    Request.Builder builder = new Request.Builder().url(apiUrl).post(rb);

    // Optional headers from RN
    for (Map.Entry<String, String> e : headers.entrySet()) {
      builder.addHeader(e.getKey(), e.getValue());
    }
    if (accessToken != null && !accessToken.isEmpty()) {
      builder.addHeader("Authorization", "Bearer " + accessToken);
    }
    builder.addHeader("Content-Type", "application/json");
    Request req = builder.build();

    // Enqueue on background thread
    new Thread(() -> {
      try {
        Response resp = http.newCall(req).execute();
        if (!resp.isSuccessful()) {
          Log.w("LocationService", "API error: " + resp.code());
        }
      } catch (IOException e) {
        Log.w("LocationService", "API call failed: " + e.getMessage());
      }
    }).start();
  }
}