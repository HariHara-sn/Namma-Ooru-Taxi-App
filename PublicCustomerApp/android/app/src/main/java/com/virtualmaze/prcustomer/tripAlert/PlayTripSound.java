package com.virtualmaze.prcustomer.tripAlert;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Handles playing the trip alert audio independently of the React Native module layer.
 */
public final class PlayTripSound {
    private static final String TAG = "PlayTripSound";
    private static final String DEFAULT_SOUND_NAME = "tripalert";
    private static PlayTripSound instance;

    private final Context appContext;
    private final AudioManager audioManager;

    private MediaPlayer mediaPlayer;
    private AudioFocusRequest audioFocusRequest;

    private PlayTripSound(@NonNull Context context) {
        this.appContext = context.getApplicationContext();
        this.audioManager = (AudioManager) this.appContext.getSystemService(Context.AUDIO_SERVICE);
    }

    public static synchronized PlayTripSound getInstance(@NonNull Context context) {
        if (instance == null) {
            instance = new PlayTripSound(context);
        }
        return instance;
    }

    public static void stopSoundIfActive() {
        PlayTripSound helper = instance;
        if (helper != null) {
            helper.stopAlertSoundInternal();
        }
    }

    public void playAlertSound(@NonNull Promise promise) {
        playSoundInternal(null, false, 0, promise);
    }

    public void playAlertSoundWithLoop(int loopCount, @NonNull Promise promise) {
        playSoundInternal(null, true, loopCount, promise);
    }

    public void playSound(@Nullable String soundName, boolean loop, @NonNull Promise promise) {
        // loop=true with loopCount=0 means infinite looping
        playSoundInternal(soundName, loop, 0, promise);
    }

    public void stopAlertSound() {
        stopAlertSoundInternal();
    }

    public boolean isPlaying() {
        return mediaPlayer != null && mediaPlayer.isPlaying();
    }

    private void playSoundInternal(@Nullable String soundName, boolean enableLoop, int loopCount, @Nullable Promise promise) {
        final AtomicBoolean promiseSettled = new AtomicBoolean(false);
        try {
            stopAlertSoundInternal();

            String effectiveName = sanitizeSoundName(soundName);
            if (effectiveName == null || effectiveName.trim().isEmpty()) {
                effectiveName = DEFAULT_SOUND_NAME;
            }

            int resId = appContext.getResources().getIdentifier(effectiveName, "raw", appContext.getPackageName());
            if (resId == 0) {
                // Fallback to default if the requested sound is not found
                resId = appContext.getResources().getIdentifier(DEFAULT_SOUND_NAME, "raw", appContext.getPackageName());
                if (resId == 0) {
                    rejectPromise(promise, promiseSettled, "SOUND_ERROR", effectiveName + " resource not found, and default '" + DEFAULT_SOUND_NAME + "' missing");
                    return;
                }
                effectiveName = DEFAULT_SOUND_NAME;
            }

            requestAudioFocus();
            mediaPlayer = new MediaPlayer();
            configureAudioAttributes(mediaPlayer);
            mediaPlayer.setVolume(1.0f, 1.0f);

            AssetFileDescriptor afd = appContext.getResources().openRawResourceFd(resId);
            mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();

            setupLooping(mediaPlayer, enableLoop, loopCount);

            final String nameForLog = effectiveName;

            mediaPlayer.setOnPreparedListener(mp -> {
                try {
                    mp.start();
                    Log.d(TAG, "Alert sound started: " + nameForLog + ", loop=" + enableLoop + (enableLoop ? ", loopCount=" + loopCount : ""));
                    resolvePromise(promise, promiseSettled, "Sound started");
                } catch (Exception startErr) {
                    Log.e(TAG, "Start error: " + startErr.getMessage());
                    rejectPromise(promise, promiseSettled, "SOUND_ERROR", "Failed starting playback: " + startErr.getMessage());
                    stopAlertSoundInternal();
                }
            });

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error: " + what + ", " + extra);
                stopAlertSoundInternal();
                rejectPromise(promise, promiseSettled, "SOUND_ERROR", "Playback error: " + what + "/" + extra);
                return true;
            });

            mediaPlayer.prepareAsync();
        } catch (Exception e) {
            Log.e(TAG, "Error playing alert sound: " + e.getMessage(), e);
            rejectPromise(promise, promiseSettled, "SOUND_ERROR", "Failed to play sound: " + e.getMessage());
            stopAlertSoundInternal();
        }
    }

    private @Nullable String sanitizeSoundName(@Nullable String input) {
        if (input == null) return null;
        String name = input.trim();
        if (name.isEmpty()) return null;
        // Strip any path like "res/raw/driver_allocated.mp3" or "raw/driver_allocated.mp3"
        int slashIdx = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (slashIdx >= 0 && slashIdx + 1 < name.length()) {
            name = name.substring(slashIdx + 1);
        }
        // Strip extension if present
        int dotIdx = name.lastIndexOf('.');
        if (dotIdx > 0) {
            name = name.substring(0, dotIdx);
        }
        return name;
    }

    private void setupLooping(MediaPlayer player, boolean enableLoop, int loopCount) {
        if (!enableLoop) {
            player.setLooping(false);
            player.setOnCompletionListener(mp -> stopAlertSoundInternal());
            return;
        }

        if (loopCount <= 0) {
            player.setLooping(true);
            player.setOnCompletionListener(null);
            return;
        }

        player.setLooping(false);
        player.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
            private int completed = 0;

            @Override
            public void onCompletion(MediaPlayer mp) {
                completed++;
                if (completed < loopCount) {
                    try {
                        mp.seekTo(0);
                        mp.start();
                    } catch (Exception restartErr) {
                        Log.e(TAG, "Loop restart failed: " + restartErr.getMessage());
                        stopAlertSoundInternal();
                    }
                } else {
                    stopAlertSoundInternal();
                }
            }
        });
    }

    private synchronized void stopAlertSoundInternal() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.reset();
                mediaPlayer.release();
                mediaPlayer = null;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping alert sound: " + e.getMessage(), e);
        } finally {
            abandonAudioFocus();
        }
    }

    private void configureAudioAttributes(MediaPlayer player) {
        AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            player.setAudioAttributes(attrs);
        } else {
            player.setAudioStreamType(AudioManager.STREAM_ALARM);
        }
    }

    private void requestAudioFocus() {
        if (audioManager == null) {
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                        .setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build())
                        .setOnAudioFocusChangeListener(focusChange -> {
                            if (focusChange == AudioManager.AUDIOFOCUS_LOSS ||
                                    focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                                stopAlertSoundInternal();
                            }
                        })
                        .build();
                audioManager.requestAudioFocus(audioFocusRequest);
            } else {
                audioManager.requestAudioFocus(
                        focusChange -> {
                            if (focusChange == AudioManager.AUDIOFOCUS_LOSS ||
                                    focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                                stopAlertSoundInternal();
                            }
                        },
                        AudioManager.STREAM_ALARM,
                        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
                );
            }
        } catch (Exception e) {
            Log.e(TAG, "Audio focus request failed: " + e.getMessage(), e);
        }
    }

    private void abandonAudioFocus() {
        if (audioManager == null) {
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (audioFocusRequest != null) {
                    audioManager.abandonAudioFocusRequest(audioFocusRequest);
                    audioFocusRequest = null;
                }
            } else {
                audioManager.abandonAudioFocus(null);
            }
        } catch (Exception e) {
            Log.e(TAG, "Audio focus abandon failed: " + e.getMessage(), e);
        }
    }

    private void resolvePromise(@Nullable Promise promise, AtomicBoolean settled, @Nullable String value) {
        if (promise != null && settled.compareAndSet(false, true)) {
            promise.resolve(value);
        }
    }

    private void rejectPromise(@Nullable Promise promise, AtomicBoolean settled, @NonNull String code, @NonNull String message) {
        if (promise != null && settled.compareAndSet(false, true)) {
            promise.reject(code, message);
        }
    }
}
