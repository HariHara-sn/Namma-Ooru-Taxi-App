package com.virtualmaze.prcustomer.WaitingTimeManagement;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.virtualmaze.prcustomer.R;

import java.util.Locale;

import timber.log.Timber;

public class ForegroundTimerManager {

    private static final String TAG = "ForegroundTimerManager";
    private static final String TIMER_CHANNEL_ID = "TIMER_CHANNEL";
    private static final String TIMER_CHANNEL_NAME = "Foreground Timer Updates";
    private static final int TIMER_NOTIFICATION_ID = 2001;

    private final Context context;
    private final ReactApplicationContext reactContext;

    private Handler timerHandler;
    private Runnable timerRunnable;
    private long timerStartMillis;
    private boolean isTimerRunning = false;

    public ForegroundTimerManager(Context context, ReactApplicationContext reactContext) {
        this.context = context;
        this.reactContext = reactContext;
        createTimerNotificationChannel();
    }

    private void createTimerNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    TIMER_CHANNEL_ID,
                    TIMER_CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Channel for foreground timer updates");

            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    public void startTimer() {
        if (isTimerRunning) return;

        timerHandler = new Handler(Looper.getMainLooper());
        timerStartMillis = System.currentTimeMillis();
        isTimerRunning = true;

        timerRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isTimerRunning) return;

                long elapsedMillis = System.currentTimeMillis() - timerStartMillis;
                int seconds = (int) (elapsedMillis / 1000);

                emitWaitingTime(seconds);
                updateTimerNotification(seconds);

                timerHandler.postDelayed(this, 1000);
            }
        };

        timerHandler.post(timerRunnable);
    }

    public void stopTimer() {
        if (!isTimerRunning) return;

        isTimerRunning = false;
        if (timerHandler != null && timerRunnable != null) {
            timerHandler.removeCallbacks(timerRunnable);
        }

        long finalDurationSeconds = (System.currentTimeMillis() - timerStartMillis) / 1000;
        emitFinalWaitingTime((int) finalDurationSeconds);
        stopTimerNotification();
    }

    private void emitWaitingTime(int seconds) {
        WritableMap params = Arguments.createMap();
        params.putInt("seconds", seconds);

        if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
            reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("TIMER_TICK", params);
        } else {
            Timber.tag(TAG).w("ReactContext not ready. Cannot emit TIMER_TICK");
        }
    }

    private void emitFinalWaitingTime(int totalSeconds) {
        WritableMap params = Arguments.createMap();
        params.putInt("finalSeconds", totalSeconds);

        if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
            reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("TIMER_COMPLETE", params);
        } else {
            Log.w(TAG, "ReactContext not ready. Cannot emit TIMER_COMPLETE");
        }
    }

    private void updateTimerNotification(int secondsElapsed) {
        String formatted = formatDuration(secondsElapsed);

        Notification notification = new NotificationCompat.Builder(context, TIMER_CHANNEL_ID)
                .setContentTitle("Waiting Timer")
                .setContentText("Elapsed: " + formatted)
                .setSmallIcon(R.drawable.aaos_on)
                .setOnlyAlertOnce(true)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        manager.notify(TIMER_NOTIFICATION_ID, notification);
    }

    private void stopTimerNotification() {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        manager.cancel(TIMER_NOTIFICATION_ID);
    }

    private String formatDuration(int seconds) {
        int minutes = seconds / 60;
        int secs = seconds % 60;
        return String.format(Locale.getDefault(), "%02d:%02d", minutes, secs);
    }
}
