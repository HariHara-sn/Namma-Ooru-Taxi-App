package com.virtualmaze.prcustomer.overlay;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.PixelFormat;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.palette.graphics.Palette;

import com.facebook.react.HeadlessJsTaskService;
import com.virtualmaze.prcustomer.driverTracking.DriverLocationService;
import com.virtualmaze.prcustomer.MainActivity;
import com.virtualmaze.prcustomer.R;

/**
 * Replaces the old Android Service implementation with an in-process overlay manager.
 * Ensures we run the overlay UI alongside DriverLocationService without registering
 * an additional Android Service component.
 */
public class OverlayService {

  private static final String TAG = "OverlayService";

  public static final String ACTION_SHOW_VIEW = "com.virtualmaze.prcustomer.overlay.SHOW_VIEW";
  public static final String EXTRA_TITLE = "title";
  public static final String EXTRA_MESSAGE = "message";
  public static final String EXTRA_PAYLOAD = "payload";

  private static OverlayService instance;

  private final Context appContext;
  private final Handler mainHandler = new Handler(Looper.getMainLooper());

  private WindowManager windowManager;
  private View bubbleView;
  private View notificationView;

  private OverlayService(Context context) {
    this.appContext = context.getApplicationContext();
  }

  public static synchronized OverlayService getInstance(Context context) {
    if (instance == null) {
      instance = new OverlayService(context);
    }
    return instance;
  }

  public void ensureOverlayBubble() {
    runOnMainThread(this::ensureBubbleInternal);
  }

  public void stopOverlay() {
    runOnMainThread(this::stopOverlayInternal);
  }

  public void showOverlayView(String title, String message, String payload) {
    runOnMainThread(() -> showOverlayViewInternal(title, message, payload));
  }

  private void ensureBubbleInternal() {
    if (bubbleView != null) {
      return;
    }
    if (!ensureWindowManager()) {
      Log.e(TAG, "WindowManager unavailable; cannot attach overlay bubble");
      return;
    }
    if (isAppInForeground()) {
      updateOverlayState(false);
      return;
    }

    final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            getOverlayType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                    | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
    );
    params.gravity = Gravity.END | Gravity.CENTER_VERTICAL;
    params.x = dpToPx(40);

    ImageView logo = new ImageView(appContext);
    logo.setImageResource(R.mipmap.ic_launcher_round);
    int size = dpToPx(56);
    logo.setLayoutParams(new ViewGroup.LayoutParams(size, size));

    logo.setOnTouchListener(new View.OnTouchListener() {
      private int initX, initY;
      private float downX, downY;
      private long downTime;
      private boolean dragging = false;
      private final int slop = dpToPx(8);

      @Override
      public boolean onTouch(View v, MotionEvent event) {
        switch (event.getAction()) {
          case MotionEvent.ACTION_DOWN:
            initX = params.x;
            initY = params.y;
            downX = event.getRawX();
            downY = event.getRawY();
            downTime = System.currentTimeMillis();
            dragging = false;
            return true;
          case MotionEvent.ACTION_MOVE:
            float dx = event.getRawX() - downX;
            float dy = event.getRawY() - downY;
            if (!dragging && (Math.abs(dx) > slop || Math.abs(dy) > slop)) {
              dragging = true;
            }
            if (dragging) {
              params.x = initX - (int) dx;
              params.y = initY + (int) dy;
              try {
                windowManager.updateViewLayout(logo, params);
              } catch (IllegalArgumentException ignored) {
              }
            }
            return true;
          case MotionEvent.ACTION_UP:
            if (!dragging) {
              long elapsed = System.currentTimeMillis() - downTime;
              if (elapsed < 250) {
                try {
                  Intent i = new Intent(appContext, MainActivity.class);
                  i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                  appContext.startActivity(i);
                } catch (Exception ignored) {
                }
              }
            }
            return true;
        }
        return false;
      }
    });

    bubbleView = logo;
    try {
      windowManager.addView(bubbleView, params);
    } catch (Exception e) {
      Log.e(TAG, "Failed to add overlay bubble", e);
      bubbleView = null;
    }
  }

  private void stopOverlayInternal() {
    if (windowManager == null) {
      return;
    }
    if (bubbleView != null) {
      try {
        windowManager.removeView(bubbleView);
      } catch (Exception ignored) {
      }
      bubbleView = null;
    }
    if (notificationView != null) {
      try {
        windowManager.removeView(notificationView);
      } catch (Exception ignored) {
      }
      notificationView = null;
    }
    updateOverlayState(false);
  }

  private void showOverlayViewInternal(String title, String message, String payload) {
    if (!ensureWindowManager()) {
      return;
    }
    if (isAppInForeground()) {
      updateOverlayState(false);
      return;
    }

    updateOverlayState(true);

    int type = getOverlayType();
    DisplayMetrics dm = appContext.getResources().getDisplayMetrics();
    int targetWidth = (int) (dm.widthPixels * 0.95f);
    int targetHeight = (int) (dm.heightPixels * 0.5f);

    final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            targetWidth,
            targetHeight,
            type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                    | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
    );
    params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;

    LayoutInflater inflater = LayoutInflater.from(appContext);
    View container = inflater.inflate(R.layout.overlay_popup, null);
    TextView tvAppName = container.findViewById(R.id.overlay_app_name);
    ImageView ivIcon = container.findViewById(R.id.overlay_app_icon);
    TextView tvTitle = container.findViewById(R.id.overlay_title);
    TextView tvMsg = container.findViewById(R.id.overlay_message);
    Button viewBtn = container.findViewById(R.id.overlay_view_button);
    TextView tvTimer = container.findViewById(R.id.overlay_timer);

    try {
      CharSequence label = appContext.getApplicationInfo().loadLabel(appContext.getPackageManager());
      Drawable icon = appContext.getApplicationInfo().loadIcon(appContext.getPackageManager());
      tvAppName.setText(label);
      ivIcon.setImageDrawable(icon);
      try {
        Bitmap bmp;
        if (icon instanceof BitmapDrawable) {
          bmp = ((BitmapDrawable) icon).getBitmap();
        } else {
          bmp = Bitmap.createBitmap(64, 64, Bitmap.Config.ARGB_8888);
          Canvas c = new Canvas(bmp);
          icon.setBounds(0, 0, 64, 64);
          icon.draw(c);
        }
        Palette p = Palette.from(bmp).generate();
        int color = p.getVibrantColor(0xEE212121);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(color);
        float r = 16f * dm.density;
        bg.setCornerRadius(r);
        View root = container.findViewById(R.id.overlay_root);
        root.setBackground(bg);
      } catch (Exception ignored) {
      }
    } catch (Exception ignored) {
    }

    tvTitle.setText(title != null ? title : "Notification");
    tvMsg.setText(message != null ? message : "");

    viewBtn.setOnClickListener(v -> {
      String forcedTitle = "new trip request";
      Intent act = new Intent("com.virtualmaze.prcustomer.overlay.ACTION");
      act.putExtra("action", "view_details");
      act.putExtra(EXTRA_TITLE, forcedTitle);
      act.putExtra(EXTRA_MESSAGE, message);
      act.putExtra(EXTRA_PAYLOAD, payload);
      appContext.sendBroadcast(act);

      try {
        Intent headless = new Intent(appContext, OverlayHeadlessService.class);
        headless.putExtra(EXTRA_PAYLOAD, payload);
        appContext.startService(headless);
        HeadlessJsTaskService.acquireWakeLockNow(appContext);
      } catch (Exception ignored) {
      }

      String uri = "virtualmaze.prcustomer://home?src=overlay&action=view_details&title="
              + Uri.encode(forcedTitle)
              + "&message=" + Uri.encode(message != null ? message : "");
      Intent openApp = new Intent(Intent.ACTION_VIEW, Uri.parse(uri));
      openApp.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
      openApp.putExtra("overlay_open", true);
      openApp.putExtra("overlay_title", forcedTitle);
      openApp.putExtra("overlay_message", message);
      openApp.putExtra("overlay_payload", payload);
      try {
        appContext.startActivity(openApp);
      } catch (Exception ignored) {
      }

      if (notificationView != null) {
        try {
          windowManager.removeView(notificationView);
        } catch (Exception ignored) {
        }
        notificationView = null;
      }
      updateOverlayState(false);
    });

    if (notificationView != null) {
      try {
        windowManager.removeView(notificationView);
      } catch (Exception ignored) {
      }
    }
    notificationView = container;
    try {
      windowManager.addView(notificationView, params);
    } catch (Exception e) {
      Log.e(TAG, "Failed to attach overlay banner", e);
      notificationView = null;
      updateOverlayState(false);
      return;
    }

    Handler handler = new Handler(Looper.getMainLooper());
    final int[] seconds = new int[]{10};
    Runnable ticker = new Runnable() {
      @Override
      public void run() {
        if (notificationView == null) {
          return;
        }
        try {
          tvTimer.setText(seconds[0] + "s");
        } catch (Exception ignored) {
        }
        if (seconds[0] <= 0) {
          try {
            windowManager.removeView(notificationView);
          } catch (Exception ignored) {
          }
          notificationView = null;
          updateOverlayState(false);
          Intent timeout = new Intent("com.virtualmaze.prcustomer.overlay.ACTION");
          timeout.putExtra("action", "timeout");
          timeout.putExtra(EXTRA_TITLE, title);
          timeout.putExtra(EXTRA_MESSAGE, message);
          timeout.putExtra(EXTRA_PAYLOAD, payload);
          appContext.sendBroadcast(timeout);
          return;
        }
        seconds[0] -= 1;
        handler.postDelayed(this, 1000);
      }
    };
    handler.post(ticker);
  }

  private boolean ensureWindowManager() {
    if (windowManager == null) {
      windowManager = (WindowManager) appContext.getSystemService(Context.WINDOW_SERVICE);
    }
    return windowManager != null;
  }

  private int getOverlayType() {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;
  }

  private int dpToPx(int dp) {
    return Math.round(dp * appContext.getResources().getDisplayMetrics().density);
  }

  private void updateOverlayState(boolean active) {
    DriverLocationService locationService = DriverLocationService.getInstanceSafe();
    if (locationService != null) {
      locationService.setOverlayActive(active);
    }
  }

  private boolean isAppInForeground() {
    ActivityManager.RunningAppProcessInfo info = new ActivityManager.RunningAppProcessInfo();
    ActivityManager.getMyMemoryState(info);
    int importance = info.importance;
    return importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
            || importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_VISIBLE;
  }

  private void runOnMainThread(Runnable runnable) {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      runnable.run();
    } else {
      mainHandler.post(runnable);
    }
  }
}
