package com.virtualmaze.prcustomer.tripAlert;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class PlayTripSoundModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "PlayTripSoundModule";
    private final PlayTripSound playSound;

    public PlayTripSoundModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.playSound = PlayTripSound.getInstance(reactContext);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void playAlertSound(Promise promise) {
        playSound.playAlertSound(promise);
    }

    @ReactMethod
    public void stopAlertSound() {
        playSound.stopAlertSound();
    }

    @ReactMethod
    public void playAlertSoundWithLoop(int loopCount, Promise promise) {
        playSound.playAlertSoundWithLoop(loopCount, promise);
    }

    @ReactMethod
    public void playSound(String soundName, boolean loop, Promise promise) {
        playSound.playSound(soundName, loop, promise);
    }

    @ReactMethod
    public void playDefaultTripAlert(Promise promise) {
        playSound.playSound(null, true, promise);
    }

    @ReactMethod
    public void isPlaying(Promise promise) {
        promise.resolve(playSound.isPlaying());
    }

    public static void stopSoundIfActive() {
        PlayTripSound.stopSoundIfActive();
    }
}
