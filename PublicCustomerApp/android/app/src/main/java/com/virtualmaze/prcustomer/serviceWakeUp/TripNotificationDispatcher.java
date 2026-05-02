package com.virtualmaze.prcustomer.serviceWakeUp;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.virtualmaze.prcustomer.driverTracking.DriverLocationService;

import org.json.JSONObject;

/**
 * Centralizes logic for forwarding trip notifications to the driver overlay and
 * safely starting the background location service when needed.
 */
final class TripNotificationDispatcher {

    private static final String TAG = "TripNotificationDispatcher";
    private static final long SERVICE_START_DELAY_MS = 1_500L;

    private TripNotificationDispatcher() {}

    static void dispatch(Context context, String tripId, JSONObject payload) {
        if (context == null) {
            Log.w(TAG, "dispatch called with null context");
            return;
        }
        String normalizedTripId = tripId != null ? tripId.trim() : "";
        if (normalizedTripId.isEmpty()) {
            Log.w(TAG, "dispatch called without valid tripId");
            return;
        }

        JSONObject payloadCopy = null;
        if (payload != null) {
            try {
                payloadCopy = new JSONObject(payload.toString());
            } catch (Exception e) {
                payloadCopy = payload;
            }
        }

        Context appContext = context.getApplicationContext();
        DriverLocationService service = DriverLocationService.getInstanceSafe();
        if (service != null) {
            Log.i(TAG, "DriverLocationService alive; delivering tripId=" + normalizedTripId);
            service.onTripNotification(normalizedTripId, payloadCopy);
            return;
        }

        Log.i(TAG, "DriverLocationService inactive; starting for tripId=" + normalizedTripId);
        Intent svc = new Intent(appContext, DriverLocationService.class);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                appContext.startForegroundService(svc);
            } else {
                appContext.startService(svc);
            }
        } catch (Exception startError) {
            Log.e(TAG, "Failed to start DriverLocationService", startError);
            return;
        }

        Handler handler = new Handler(Looper.getMainLooper());
        JSONObject finalPayloadCopy = payloadCopy;
        handler.postDelayed(() -> {
            DriverLocationService running = DriverLocationService.getInstanceSafe();
            if (running != null) {
                Log.i(TAG, "Delivering tripId=" + normalizedTripId + " after service start");
                running.onTripNotification(normalizedTripId, finalPayloadCopy);
            } else {
                Log.w(TAG, "DriverLocationService still unavailable for tripId=" + normalizedTripId);
            }
        }, SERVICE_START_DELAY_MS);
    }
}
