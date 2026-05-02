package com.virtualmaze.prcustomer.tripAlert;

 import com.facebook.react.ReactPackage;
 import com.facebook.react.bridge.NativeModule;
 import com.facebook.react.bridge.ReactApplicationContext;
 import com.facebook.react.uimanager.ViewManager;

 import java.util.ArrayList;
 import java.util.Collections;
 import java.util.List;

 public class PlayTripSoundPackage implements ReactPackage {

     @Override
     public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
         return Collections.emptyList();
     }

     @Override
     public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
         List<NativeModule> modules = new ArrayList<>();
         modules.add(new PlayTripSoundModule(reactContext));
         return modules;
     }
 }
