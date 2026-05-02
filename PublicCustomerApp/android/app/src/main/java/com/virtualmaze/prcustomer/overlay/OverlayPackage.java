package com.virtualmaze.prcustomer.overlay;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.uimanager.ViewManager;
import android.app.Application;
import android.content.Context;

import java.util.*;

public class OverlayPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(com.facebook.react.bridge.ReactApplicationContext ctx) {
    return Arrays.asList(new OverlayModule(ctx));
  }
  @Override
  public List<ViewManager> createViewManagers(com.facebook.react.bridge.ReactApplicationContext ctx) {
    return Collections.emptyList();
  }
}
