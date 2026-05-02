package com.virtualmaze.prcustomer.overlay;

import android.content.*;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.facebook.react.bridge.*;
import com.virtualmaze.prcustomer.driverTracking.DriverLocationService;
import com.virtualmaze.prcustomer.overlay.OverlayService;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class OverlayModule extends ReactContextBaseJavaModule {

  private static final String TAG = "OverlayModule";

  public OverlayModule(ReactApplicationContext ctx) { super(ctx); }

  @Override public String getName() { return "OverlayModule"; }

  private BroadcastReceiver overlayActionReceiver;

  @Override
  public void initialize() {
    super.initialize();
    // Listen for actions from OverlayService (Accept/Reject)
    if (overlayActionReceiver == null) {
      overlayActionReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
          if (intent == null) return;
          if (!"com.virtualmaze.prcustomer.overlay.ACTION".equals(intent.getAction())) return;
          String action = intent.getStringExtra("action");
          String title = intent.getStringExtra(OverlayService.EXTRA_TITLE);
          String message = intent.getStringExtra(OverlayService.EXTRA_MESSAGE);
          String payload = intent.getStringExtra(OverlayService.EXTRA_PAYLOAD);

          WritableMap map = Arguments.createMap();
          map.putString("action", action);
          map.putString("title", title);
          map.putString("message", message);
          map.putString("payload", payload);

          ReactApplicationContext ctx = getReactApplicationContext();
          if (ctx.hasActiveCatalystInstance()) {
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
              .emit("OverlayAction", map);
          }
        }
      };
      IntentFilter f = new IntentFilter("com.virtualmaze.prcustomer.overlay.ACTION");
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        getReactApplicationContext().registerReceiver(
          overlayActionReceiver,
          f,
          Context.RECEIVER_NOT_EXPORTED
        );
      } else {
        getReactApplicationContext().registerReceiver(overlayActionReceiver, f);
      }
    }
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    if (overlayActionReceiver != null) {
      try { getReactApplicationContext().unregisterReceiver(overlayActionReceiver); } catch (Exception ignored) {}
      overlayActionReceiver = null;
    }
  }

  @ReactMethod
  public void canDrawOverlays(Promise p) {
    boolean ok = Settings.canDrawOverlays(getReactApplicationContext());
    p.resolve(ok);
  }

  @ReactMethod
  public void openOverlaySettings() {
    ReactApplicationContext ctx = getReactApplicationContext();
    Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + ctx.getPackageName()));
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    ctx.startActivity(i);
  }

  @ReactMethod
  public void startOverlay(Promise p) {
    ReactApplicationContext ctx = getReactApplicationContext();
    if (!Settings.canDrawOverlays(ctx)) {
      p.reject("NO_PERMISSION", "Overlay permission not granted");
      return;
    }
    try {
      OverlayService.getInstance(ctx).ensureOverlayBubble();
      DriverLocationService service = DriverLocationService.getInstanceSafe();
      if (service != null) {
        service.handleOverlayPermissionGranted();
      }
      p.resolve(true);
    } catch (Exception e) {
      Log.e(TAG, "Failed to start overlay", e);
      p.reject("START_FAILED", e.getMessage());
    }
  }

  @ReactMethod
  public void stopOverlay() {
    ReactApplicationContext ctx = getReactApplicationContext();
    OverlayService.getInstance(ctx).stopOverlay();
  }

  @ReactMethod
  public void showOverlayView(String title, String message, Promise p) {
    ReactApplicationContext ctx = getReactApplicationContext();
    if (!Settings.canDrawOverlays(ctx)) {
      p.reject("NO_PERMISSION", "Overlay permission not granted");
      return;
    }
    try {
      OverlayService.getInstance(ctx).showOverlayView(title, message, null);
      DriverLocationService service = DriverLocationService.getInstanceSafe();
      if (service != null) {
        service.handleOverlayPermissionGranted();
      }
      p.resolve(true);
    } catch (Exception e) {
      Log.e(TAG, "Failed to show overlay", e);
      p.reject("START_FAILED", e.getMessage());
    }
  }

  // New method that also carries a full JSON payload string
  @ReactMethod
  public void showOverlayViewWithPayload(String title, String message, String payload, Promise p) {
    ReactApplicationContext ctx = getReactApplicationContext();
    if (!Settings.canDrawOverlays(ctx)) {
      p.reject("NO_PERMISSION", "Overlay permission not granted");
      return;
    }
    try {
      OverlayService.getInstance(ctx).showOverlayView(title, message, payload);
      DriverLocationService service = DriverLocationService.getInstanceSafe();
      if (service != null) {
        service.handleOverlayPermissionGranted();
      }
      p.resolve(true);
    } catch (Exception e) {
      Log.e(TAG, "Failed to show overlay with payload", e);
      p.reject("START_FAILED", e.getMessage());
    }
  }
}
