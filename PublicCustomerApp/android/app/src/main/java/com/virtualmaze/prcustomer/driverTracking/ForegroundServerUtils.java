package com.virtualmaze.prcustomer.driverTracking;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.location.Location;
import android.os.BatteryManager;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.IOException;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.Locale;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.atomic.AtomicBoolean;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.Callback;
import okhttp3.Call;

public class ForegroundServerUtils {
    private static final String TAG = "ForegroundServiceUtils";
    private static final String DATABASE_NAME = "Trip_locationbg";
    private static final String TABLE_NAME = "locationsv1";
    private static final int DATABASE_VERSION = 1;

    private final Context appContext;
    private final SQLiteOpenHelper dbHelper;
    private final SQLiteDatabase database;
    private final ExecutorService executorService;
    private final AtomicBoolean isRequestInProgress;
    private final AtomicBoolean sessionExpiredHandled;

    // Harsh braking events queue
    private final JSONArray harshBrakingEvents = new JSONArray();
    private final Object harshBrakingLock = new Object();

    // Hard acceleration events queue
    private final JSONArray hardAccelerationEvents = new JSONArray();
    private final Object hardAccelerationLock = new Object();

    // Hard cornering events queue
    private final JSONArray hardCorneringEvents = new JSONArray();
    private final Object hardCorneringLock = new Object();

    public ForegroundServerUtils(Context context) {
        this.appContext = context.getApplicationContext();
        this.dbHelper = new SQLiteOpenHelper(appContext, DATABASE_NAME, null, DATABASE_VERSION) {
            @Override
            public void onCreate(SQLiteDatabase db) {
                createLocationDBTables(db);
            }

            @Override
            public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
                // Handle database upgrades if needed
            }
        };
        this.database = dbHelper.getWritableDatabase();
        this.executorService = Executors.newSingleThreadExecutor();
        this.isRequestInProgress = new AtomicBoolean(false);
        this.sessionExpiredHandled = new AtomicBoolean(false);
    }

    private void createLocationDBTables(SQLiteDatabase db) {
        String createTableQuery = "CREATE TABLE IF NOT EXISTS `" + TABLE_NAME + "` (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "latitude REAL, " +
                "longitude REAL, " +
                "speed REAL, " +
                "accuracy REAL, " +
                "altitudeAccuracy REAL, " +
                "altitude REAL, " +
                "bearing REAL, " +
                "heading REAL, " +
                "battery REAL, " +
                "time REAL, " +
                "activity TEXT DEFAULT NULL, " +
                "is_sent INTEGER DEFAULT 0" +
                ")";
        db.execSQL(createTableQuery);
        Log.d(TAG, "Location table created");
    }

    public static int getBatteryLevel(Context context) {
        BatteryManager batteryManager = (BatteryManager) context.getSystemService(Context.BATTERY_SERVICE);
        if (batteryManager != null) {
            int batteryLevel = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
            Log.d("BatteryLevel", "Current battery level: " + batteryLevel + "%");
            return batteryLevel;
        }
        return 0;  // Return -1 if battery information is unavailable
    }

    public static boolean isCharging(Context context) {
        BatteryManager batteryManager = (BatteryManager) context.getSystemService(Context.BATTERY_SERVICE);
        if (batteryManager != null) {
            int status = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_STATUS);
            return status == BatteryManager.BATTERY_STATUS_CHARGING || 
                   status == BatteryManager.BATTERY_STATUS_FULL;
        }
        return false;
    }

    public double convertMetersPerSecondToKnots(double metersPerSecond) {
        return metersPerSecond * 1.94384;
    }

    public void addLocation(Location location, double battery, String activity) {
        ContentValues values = new ContentValues();
        values.put("latitude", location.getLatitude());
        values.put("longitude", location.getLongitude());
        //values.put("speed", location.getSpeed());
        // Convert speed from meters per second to knots using the conversion method
        double speedInKnots = convertMetersPerSecondToKnots(location.getSpeed());
        values.put("speed", speedInKnots);
        values.put("accuracy", location.getAccuracy());
        values.put("altitudeAccuracy", 0); // Not available in Android Location object
        values.put("altitude", location.getAltitude());
        values.put("bearing", location.getBearing());
        values.put("heading", location.getBearing()); // Using bearing as heading
        values.put("battery", battery);
        Instant instant = Instant.ofEpochMilli(location.getTime());

        // Use DateTimeFormatter to format the Instant to ISO 8601 format
        DateTimeFormatter formatter = DateTimeFormatter.ISO_INSTANT;

        values.put("time", formatter.format(instant));
        values.put("activity", activity);
        values.put("is_sent", 0);

        long newRowId = database.insert(TABLE_NAME, null, values);
        if (newRowId != -1) {
            Log.d(TAG, "New location added with ID: " + newRowId);
        } else {
            Log.e(TAG, "Error adding new location");
        }
    }

    public void addHarshBrakingEvent(JSONObject event) {
        synchronized (harshBrakingLock) {
            harshBrakingEvents.put(event);
            Log.d(TAG, "Harsh braking event queued. Total pending: " + harshBrakingEvents.length());
        }
    }

    private JSONArray drainHarshBrakingEvents() {
        synchronized (harshBrakingLock) {
            if (harshBrakingEvents.length() == 0) return null;
            JSONArray copy = new JSONArray();
            for (int i = 0; i < harshBrakingEvents.length(); i++) {
                try { copy.put(harshBrakingEvents.getJSONObject(i)); } catch (JSONException ignored) {}
            }
            // Clear after copying
            while (harshBrakingEvents.length() > 0) {
                harshBrakingEvents.remove(0);
            }
            return copy;
        }
    }

    public void addHardAccelerationEvent(JSONObject event) {
        synchronized (hardAccelerationLock) {
            hardAccelerationEvents.put(event);
            Log.d(TAG, "Hard acceleration event queued. Total pending: " + hardAccelerationEvents.length());
        }
    }

    private JSONArray drainHardAccelerationEvents() {
        synchronized (hardAccelerationLock) {
            if (hardAccelerationEvents.length() == 0) return null;
            JSONArray copy = new JSONArray();
            for (int i = 0; i < hardAccelerationEvents.length(); i++) {
                try { copy.put(hardAccelerationEvents.getJSONObject(i)); } catch (JSONException ignored) {}
            }
            while (hardAccelerationEvents.length() > 0) {
                hardAccelerationEvents.remove(0);
            }
            return copy;
        }
    }

    public void addHardCorneringEvent(JSONObject event) {
        synchronized (hardCorneringLock) {
            hardCorneringEvents.put(event);
            Log.d(TAG, "Hard cornering event queued. Total pending: " + hardCorneringEvents.length());
        }
    }

    private JSONArray drainHardCorneringEvents() {
        synchronized (hardCorneringLock) {
            if (hardCorneringEvents.length() == 0) return null;
            JSONArray copy = new JSONArray();
            for (int i = 0; i < hardCorneringEvents.length(); i++) {
                try { copy.put(hardCorneringEvents.getJSONObject(i)); } catch (JSONException ignored) {}
            }
            while (hardCorneringEvents.length() > 0) {
                hardCorneringEvents.remove(0);
            }
            return copy;
        }
    }

    public void deleteAllSentLocations() {
        int deletedRows = database.delete(TABLE_NAME, "is_sent = ?", new String[]{"1"});
        Log.d(TAG, "Deleted " + deletedRows + " sent locations from the table");
    }

    public JSONObject getLastLocation() {
        String query = "SELECT * FROM " + TABLE_NAME + " ORDER BY id DESC LIMIT 1";
        Cursor cursor = database.rawQuery(query, null);
        JSONObject lastLocation = null;

        if (cursor.moveToFirst()) {
            lastLocation = cursorToJson(cursor);
        }

        cursor.close();
        return lastLocation;
    }

    public JSONArray getAllUnsendLocations() {
        String query = "SELECT * FROM " + TABLE_NAME + " WHERE is_sent = 0 ORDER BY id ASC";
        Cursor cursor = database.rawQuery(query, null);
        JSONArray locations = new JSONArray();

        while (cursor.moveToNext()) {
            JSONObject location = cursorToJson(cursor);
            locations.put(location);
        }

        cursor.close();
        return locations;
    }

    private JSONObject cursorToJson(Cursor cursor) {
        JSONObject location = new JSONObject();
        try {
            int idIndex = cursor.getColumnIndex("id");
            int latitudeIndex = cursor.getColumnIndex("latitude");
            int longitudeIndex = cursor.getColumnIndex("longitude");
            int speedIndex = cursor.getColumnIndex("speed");
            int accuracyIndex = cursor.getColumnIndex("accuracy");
            int altitudeAccuracyIndex = cursor.getColumnIndex("altitudeAccuracy");
            int altitudeIndex = cursor.getColumnIndex("altitude");
            int bearingIndex = cursor.getColumnIndex("bearing");
            int headingIndex = cursor.getColumnIndex("heading");
            int batteryIndex = cursor.getColumnIndex("battery");
            int timeIndex = cursor.getColumnIndex("time");
            int activityIndex = cursor.getColumnIndex("activity");

            if (idIndex >= 0) location.put("id", cursor.getInt(idIndex));
            if (latitudeIndex >= 0 && longitudeIndex >= 0) {
                JSONArray locationArray = new JSONArray();
                locationArray.put(cursor.getDouble(longitudeIndex));
                locationArray.put(cursor.getDouble(latitudeIndex));
                location.put("location", locationArray);
            }
            if (speedIndex >= 0) location.put("speed", cursor.getDouble(speedIndex));
            if (accuracyIndex >= 0) location.put("accuracy", cursor.getDouble(accuracyIndex));
            if (altitudeAccuracyIndex >= 0) location.put("altitudeAccuracy", cursor.getDouble(altitudeAccuracyIndex));
            if (altitudeIndex >= 0) location.put("altitude", cursor.getDouble(altitudeIndex));
            if (bearingIndex >= 0) location.put("bearing", cursor.getDouble(bearingIndex));
            if (headingIndex >= 0) location.put("heading", cursor.getDouble(headingIndex));
            if (batteryIndex >= 0) location.put("battery", cursor.getDouble(batteryIndex));
            if (timeIndex >= 0) location.put("time", cursor.getString(timeIndex));
            if (activityIndex >= 0) location.put("activity", cursor.getString(activityIndex));
        } catch (JSONException e) {
            Log.e(TAG, "Error creating JSON object from cursor", e);
        }
        return location;
    }

    public interface ResponseCallback {
        void onSuccess(String responseBody);
    }

    public void sendToServer(String serverUrl, String authToken, String deviceId, String userRole, Runnable onSuccess, Runnable onFailure, ResponseCallback callback) {
        if (isRequestInProgress.get()) {
            Log.d(TAG, "A server request is already in progress. Skipping this request.");
            return;
        }

        executorService.execute(() -> {
            if (!isRequestInProgress.compareAndSet(false, true)) {
                Log.d(TAG, "Another thread started a request. Skipping this one.");
                return;
            }

            try {
                JSONArray locations = getAllUnsendLocations();
                if (locations.length() == 0) {
                    Log.d(TAG, "No locations to send");
                    isRequestInProgress.set(false);
                    return;
                }

                // Remove id from each location object
                JSONArray locationsWithoutId = new JSONArray();
                for (int i = 0; i < locations.length(); i++) {
                    JSONObject location = new JSONObject(locations.getJSONObject(i).toString());
                    location.remove("id");
                    locationsWithoutId.put(location);
                }

                OkHttpClient client = new OkHttpClient();
                MediaType JSON = MediaType.parse("application/json; charset=utf-8");
                
                JSONObject requestBody = new JSONObject();
                try {
                    Log.d(TAG, "sendToServer: " + userRole);
                    if ("driver".equalsIgnoreCase(userRole)){
                        requestBody.put("sessionId", deviceId);
                        requestBody.put("completed", false);
                    }
                    requestBody.put("id", deviceId);
                    requestBody.put("deviceType", "mobile");
                    requestBody.put("locations", locationsWithoutId);

                    JSONArray brakingEvents = drainHarshBrakingEvents();
                    if (brakingEvents != null) {
                        requestBody.put("harsh_braking", brakingEvents);
                    }

                    JSONArray accelEvents = drainHardAccelerationEvents();
                    if (accelEvents != null) {
                        requestBody.put("hard_acceleration", accelEvents);
                    }

                    JSONArray cornerEvents = drainHardCorneringEvents();
                    if (cornerEvents != null) {
                        requestBody.put("hard_cornering", cornerEvents);
                    }
                } catch (JSONException e) {
                    Log.e(TAG, "Error creating request body", e);
                    isRequestInProgress.set(false);
                    return;
                }

                Log.d(TAG, "Request body: " + requestBody.toString());

                RequestBody body = RequestBody.create(JSON, requestBody.toString());

                Request request = new Request.Builder()
                        .url(serverUrl)
                        .post(body)
                        .addHeader("Authorization", "Bearer " + authToken)
                        .addHeader("x-device-auth", "Bearer " + authToken)
                        .addHeader("Content-Type", "application/json")
                        .build();

                client.newCall(request).enqueue(new Callback() {
                    @Override
                    public void onFailure(Call call, IOException e) {
                        Log.e(TAG, "Error sending locations to server", e);
                        isRequestInProgress.set(false);
                        onFailure.run();
                    }

                    @Override
                    public void onResponse(Call call, Response response) throws IOException {
                        if (response.isSuccessful()) {
                            Log.d(TAG, "Locations sent successfully");
                            markLocationsAsSent(locations);
                            deleteAllSentLocations();
                            String responseString = response.body().string();
                            callback.onSuccess(responseString);
                        } else {
                            Log.e(TAG, "Failed to send locations. Response: " + response.body().string());
                        }
                        isRequestInProgress.set(false);
                        onSuccess.run();
                    }
                });
            } catch (Exception e) {
                Log.e(TAG, "Unexpected error in sendToServer", e);
                isRequestInProgress.set(false);
            }
        });
    }

    public void sendDriverLocaitonToServer(String serverUrl, String authToken, String deviceId, String userRole, Runnable onSuccess, Runnable onFailure, ResponseCallback callback) {
       
//        if (isRequestInProgress.get()) {
//            Log.d(TAG, "A server request is already in progress. Skipping this request.");
//            return;
//        }

        executorService.execute(() -> {
//            if (!isRequestInProgress.compareAndSet(false, true)) {
//                Log.d(TAG, "Another thread started a request. Skipping this one.");
//                return;
//            }



            try {
                JSONArray locations = getAllUnsendLocations();
                Log.d(TAG, "sendDriverLocaitonToServer: " + locations);
                if (locations.length() == 0) {
                    Log.d(TAG, "No locations to send");
                    isRequestInProgress.set(false);
                    return;
                }

                // Remove id from each location object
                JSONArray locationsWithoutId = new JSONArray();
                for (int i = 0; i < locations.length(); i++) {
                    JSONObject location = new JSONObject(locations.getJSONObject(i).toString());
                    location.remove("id");
                    locationsWithoutId.put(location);
                }

                OkHttpClient client = new OkHttpClient();
                MediaType JSON = MediaType.parse("application/json; charset=utf-8");
                
                JSONObject requestBody = new JSONObject();
                try {
                    if ("driver".equalsIgnoreCase(userRole)){
                        requestBody.put("completed", false);
                    }
//                    requestBody.put("id", deviceId);
                    requestBody.put("deviceType", "mobile");
                    requestBody.put("locations", locationsWithoutId);

                    JSONArray brakingEvents = drainHarshBrakingEvents();
                    if (brakingEvents != null) {
                        requestBody.put("harsh_braking", brakingEvents);
                    }

                    JSONArray accelEvents = drainHardAccelerationEvents();
                    if (accelEvents != null) {
                        requestBody.put("hard_acceleration", accelEvents);
                    }

                    JSONArray cornerEvents = drainHardCorneringEvents();
                    if (cornerEvents != null) {
                        requestBody.put("hard_cornering", cornerEvents);
                    }
                } catch (JSONException e) {
                    Log.e(TAG, "Error creating request body", e);
                    isRequestInProgress.set(false);
                    return;
                }

                Log.d(TAG, "Request body: " + requestBody.toString());

                RequestBody body = RequestBody.create(JSON, requestBody.toString());

                Request request = new Request.Builder()
                        .url(serverUrl)
                        .post(body)
                        .addHeader("Authorization", "Bearer " + authToken)
                        .addHeader("x-device-auth", "Bearer " + authToken)
                        .addHeader("Content-Type", "application/json")
                        .build();

                client.newCall(request).enqueue(new Callback() {
                    @Override
                    public void onFailure(Call call, IOException e) {
                        Log.e(TAG, "Error sending locations to server", e);
                        isRequestInProgress.set(false);
                        onFailure.run();
                    }

                    @Override
                    public void onResponse(Call call, Response response) {
                        String responseString = "";
                        boolean sessionExpired = false;
                        try {
                            if (response.body() != null) {
                                responseString = response.body().string();
                            }
                            sessionExpired = isSessionExpiredResponse(responseString);

                            if (response.isSuccessful()) {
                                if (sessionExpired) {
                                    Log.w(TAG, "Session expired detected in driver location response; preserving pending locations");
                                    handleSessionExpiredFromServer();
                                } else {
                                    Log.d(TAG, "Locations sent successfully");
                                    markLocationsAsSent(locations);
                                    deleteAllSentLocations();
                                    if (callback != null) {
                                        callback.onSuccess(responseString);
                                    }
                                }
                            } else {
                                Log.e(TAG, "Failed to send locations. Response: " + responseString);
                                if (sessionExpired) {
                                    handleSessionExpiredFromServer();
                                }
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Error handling driver location response", e);
                        } finally {
                            isRequestInProgress.set(false);
                            if (onSuccess != null) {
                                onSuccess.run();
                            }
                            response.close();
                        }
                    }
                });
            } catch (Exception e) {
                Log.e(TAG, "Unexpected error in sendToServer", e);
                isRequestInProgress.set(false);
            }
        });
    }

    private void handleSessionExpiredFromServer() {
        if (!sessionExpiredHandled.compareAndSet(false, true)) {
            return;
        }
        Log.w(TAG, "Session expired detected; stopping driver socket and location service");
        try {
            DriverLocationService service = DriverLocationService.getInstanceSafe();
            if (service != null) {
                service.onSessionExpiredFromServer();
            } else if (appContext != null) {
                Intent stopIntent = new Intent(appContext, DriverLocationService.class);
                appContext.stopService(stopIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop services after session expiration", e);
        }
    }

    private boolean isSessionExpiredResponse(String responseBody) {
        if (responseBody == null) {
            return false;
        }
        String trimmed = responseBody.trim();
        if (trimmed.isEmpty()) {
            return false;
        }

        try {
            Object parsed = new JSONTokener(trimmed).nextValue();
            if (containsSessionExpiredValue(parsed)) {
                return true;
            }
        } catch (JSONException ignored) {
            // Fall through to substring check
        }

        return trimmed.toLowerCase(Locale.US).contains("session_expired");
    }

    private boolean containsSessionExpiredValue(Object value) throws JSONException {
        if (value == null) {
            return false;
        }

        if (value instanceof JSONObject) {
            JSONObject obj = (JSONObject) value;
            Iterator<String> keys = obj.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                if (containsSessionExpiredValue(obj.opt(key))) {
                    return true;
                }
            }
            return false;
        }

        if (value instanceof JSONArray) {
            JSONArray arr = (JSONArray) value;
            for (int i = 0; i < arr.length(); i++) {
                if (containsSessionExpiredValue(arr.opt(i))) {
                    return true;
                }
            }
            return false;
        }

        if (value instanceof String) {
            return isSessionExpiredString((String) value);
        }

        return false;
    }

    private boolean isSessionExpiredString(String value) {
        if (value == null) {
            return false;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return false;
        }
        String lower = normalized.toLowerCase(Locale.US);
        return "session_expired".equals(lower) || "session expired".equals(lower) || lower.contains("session_expired");
    }


    private void markLocationsAsSent(JSONArray locations) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        db.beginTransaction();
        try {
            for (int i = 0; i < locations.length(); i++) {
                JSONObject location = locations.getJSONObject(i);
                int id = location.getInt("id");
                ContentValues values = new ContentValues();
                values.put("is_sent", 1);
                db.update(TABLE_NAME, values, "id = ?", new String[]{String.valueOf(id)});
            }
            db.setTransactionSuccessful();
        } catch (JSONException e) {
            Log.e(TAG, "Error marking locations as sent", e);
        } finally {
            db.endTransaction();
        }
    }
}
