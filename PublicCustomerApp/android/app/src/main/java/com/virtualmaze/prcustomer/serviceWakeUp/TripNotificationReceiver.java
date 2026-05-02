package com.virtualmaze.prcustomer.serviceWakeUp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import org.json.JSONObject;

import java.util.Iterator;

/**
 * Receives trip-related push broadcasts (used as a fallback when the
 * FirebaseMessagingService is not invoked, e.g., the app process is cold-started)
 * and forwards them to the driver overlay pipeline.
 */
public class TripNotificationReceiver extends BroadcastReceiver {

    private static final String TAG = "TripNotificationReceiver";
    private static final String ACTION_C2DM_RECEIVE = "com.google.android.c2dm.intent.RECEIVE";
    private static final String ACTION_TRIP_FALLBACK = "com.virtualmaze.prcustomer.NEW_TRIP_REQUEST";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) {
            return;
        }
        String action = intent.getAction();
        if (!ACTION_C2DM_RECEIVE.equals(action) && !ACTION_TRIP_FALLBACK.equals(action)) {
            return;
        }

        Bundle extras = intent.getExtras();
        if (extras == null || extras.isEmpty()) {
            Log.w(TAG, "Received broadcast without extras for action=" + action);
            return;
        }

        String tripId = extractTripId(extras);
        if (tripId == null || tripId.trim().isEmpty()) {
            Log.w(TAG, "TripNotificationReceiver missing tripId in extras: " + extras.keySet());
            return;
        }

        JSONObject payload = bundleToJson(extras);
        String title = payload.optString("title", "");
        if ("new trip request".equalsIgnoreCase(title)) {
            Log.i(TAG, "Broadcast trip payload for tripId=" + tripId + " -> " + payload);
            TripNotificationDispatcher.dispatch(context, tripId, payload);
        } else {
            Log.i(TAG, "TripNotificationReceiver ignored broadcast: title is not 'new trip request' (title=" + title + ")");
        }
    }

    private String extractTripId(Bundle extras) {
        if (extras.containsKey("tripId")) {
            return String.valueOf(extras.get("tripId"));
        }
        if (extras.containsKey("trip_id")) {
            return String.valueOf(extras.get("trip_id"));
        }
        if (extras.containsKey("request_id")) {
            return String.valueOf(extras.get("request_id"));
        }
        return null;
    }

    private JSONObject bundleToJson(Bundle extras) {
        JSONObject obj = new JSONObject();
        Iterator<String> keys = extras.keySet().iterator();
        while (keys.hasNext()) {
            String key = keys.next();
            Object val = extras.get(key);
            if (val == null) continue;
            try {
                obj.put(key, String.valueOf(val));
            } catch (Exception ignored) {}
        }
        return obj;
    }
}
