package com.virtualmaze.prcustomer.driverTracking;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.work.WorkManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.virtualmaze.prcustomer.WaitingTimeManagement.ForegroundTimerManager;

public class BGLocationServiceModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;
    private static final String TAG = "BGLocationServiceModule";

    private final ForegroundTimerManager timerManager;

    public BGLocationServiceModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        timerManager = new ForegroundTimerManager(context, context); // ✅ fixed
    }

    @Override
    public String getName() {
        return "BGLocationServiceModule";
    }

    public static ReactApplicationContext getReactContext() {
        return reactContext;
    }

    @ReactMethod
    public void startDriverLocationService() {
        ReactApplicationContext context = getReactContext();
        Intent serviceIntent = new Intent(context, DriverLocationService.class);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);  // Required for Android 8.0+
            } else {
                context.startService(serviceIntent);  // Required for Android 7.0 and below
            }
            Log.d("NEWSERVICE", "Driver location service start requested");
        } catch (SecurityException | IllegalStateException serviceError) {
            Log.e("NEWSERVICE", "Unable to start driver location service", serviceError);
            try {
                context.stopService(serviceIntent);
            } catch (Exception stopError) {
                Log.w("NEWSERVICE", "stopService after failure threw", stopError);
            }
        }
    }

    @ReactMethod
    public void stopDriverLocationService() {
        try {
            ReactApplicationContext context = getReactContext();
            Intent serviceIntent = new Intent(context, DriverLocationService.class);
            context.stopService(serviceIntent);
            Log.d("NEWSERVICE", "Driver location service stopped");
        } catch (Exception e) {
            Log.e("NEWSERVICE", "Error stopping driver location service", e);
        }
    }

    @ReactMethod
    public void hideDriverOverlay() {
        try {
            DriverLocationService service = DriverLocationService.getInstanceSafe();
            if (service != null) {
                service.hideDriverOverlay();
                Log.d("NEWSERVICE", "Driver overlay hidden via React bridge");
            } else {
                Log.w("NEWSERVICE", "Driver overlay hide requested but service instance missing");
            }
        } catch (Exception e) {
            Log.e("NEWSERVICE", "Error hiding driver overlay", e);
        }
    }

    // public Rides driver waiting time
    @ReactMethod
    public void startTimer() {
        if (timerManager != null) timerManager.startTimer();
    }

    @ReactMethod
    public void stopTimer() {
        if (timerManager != null) timerManager.stopTimer();
    }

}
