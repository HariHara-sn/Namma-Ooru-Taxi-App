package com.virtualmaze.prcustomer.tracking;

import android.content.Intent;
import android.os.Build;
import android.content.BroadcastReceiver;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.Context;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class LocationTrackingModule extends ReactContextBaseJavaModule {
  private BroadcastReceiver stopReceiver;

  public LocationTrackingModule(ReactApplicationContext ctx) {
    super(ctx);

    // Listen for service stop broadcasts and forward to JS
    stopReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(android.content.Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if ("com.virtualmaze.prcustomer.tracking.STOPPED".equals(action)) {
          String reason = intent.getStringExtra("reason");
          String status = intent.getStringExtra("status");
          WritableMap params = Arguments.createMap();
          if (reason != null) params.putString("reason", reason);
          if (status != null) params.putString("status", status);
          sendEvent("LocationTrackingStopped", params);
        }
      }
    };
    IntentFilter f = new IntentFilter("com.virtualmaze.prcustomer.tracking.STOPPED");
    if (Build.VERSION.SDK_INT >= 33) {
      ctx.registerReceiver(stopReceiver, f, Context.RECEIVER_NOT_EXPORTED);
    } else {
      ctx.registerReceiver(stopReceiver, f);
    }
  }

  @NonNull
  @Override
  public String getName() {
    return "LocationTracking";
  }

  private void sendEvent(String eventName, WritableMap params) {
    try {
      getReactApplicationContext()
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
    } catch (Throwable ignored) {}
  }

  @ReactMethod
  public void start(String apiUrl, double intervalMsDouble, String headersJson, Promise promise) {
    long intervalMs = (long) intervalMsDouble;
    Intent i = new Intent(getReactApplicationContext(), LocationForegroundService.class);
    i.setAction(LocationForegroundService.ACTION_START);
    i.putExtra("apiUrl", apiUrl);
    i.putExtra("intervalMs", intervalMs);
    i.putExtra("headersJson", headersJson);
    if (Build.VERSION.SDK_INT >= 26) {
      ContextCompat.startForegroundService(getReactApplicationContext(), i);
    } else {
      getReactApplicationContext().startService(i);
    }
    promise.resolve(true);
  }

  @ReactMethod
  public void stop(Promise promise) {
    Intent i = new Intent(getReactApplicationContext(), LocationForegroundService.class);
    i.setAction(LocationForegroundService.ACTION_STOP);
    if (Build.VERSION.SDK_INT >= 26) {
      ContextCompat.startForegroundService(getReactApplicationContext(), i);
    } else {
      getReactApplicationContext().startService(i);
    }
    promise.resolve(true);
  }

  @ReactMethod
  public void stopWithPayload(String reason, String status, Promise promise) {
    Intent i = new Intent(getReactApplicationContext(), LocationForegroundService.class);
    i.setAction(LocationForegroundService.ACTION_STOP);
    i.putExtra("stopReason", reason);
    i.putExtra("stopStatus", status);
    if (Build.VERSION.SDK_INT >= 26) {
      ContextCompat.startForegroundService(getReactApplicationContext(), i);
    } else {
      getReactApplicationContext().startService(i);
    }
    promise.resolve(true);
  }

  @ReactMethod
  public void isRunning(Promise promise) {
    try {
      boolean value = LocationForegroundService.isRunning();
      promise.resolve(value);
    } catch (Exception e) {
      promise.reject("E_STATUS", e);
    }
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    try {
      if (stopReceiver != null) {
        getReactApplicationContext().unregisterReceiver(stopReceiver);
      }
    } catch (IllegalArgumentException ignored) {}
    stopReceiver = null;
  }
}