package com.virtualmaze.prcustomer;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.List;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.uimanager.ViewManager;

public class NeNativePackage implements ReactPackage {
    private NeNativeModule sharedModule;

    public NeNativePackage() {
        // No context needed in constructor
    }

    private NeNativeModule getOrCreateModule(ReactApplicationContext reactContext) {
        if (sharedModule == null) {
            sharedModule = new NeNativeModule(reactContext);
        }
        return sharedModule;
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(getOrCreateModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        List<ViewManager> viewManagers = new ArrayList<>();
        viewManagers.add(getOrCreateModule(reactContext));
        return viewManagers;
    }
}