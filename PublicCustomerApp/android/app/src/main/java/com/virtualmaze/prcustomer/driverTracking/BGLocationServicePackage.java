package com.virtualmaze.prcustomer.driverTracking;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.uimanager.ViewManager;

public class BGLocationServicePackage implements ReactPackage {
    // Implement the methods required by the ReactPackage interface
    // You can leave them empty if they are not needed for your use case
    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new BGLocationServiceModule(reactContext));
        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

}