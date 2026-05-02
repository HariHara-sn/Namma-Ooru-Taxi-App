package com.virtualmaze.prcustomer

import android.app.Application
import com.dot.nenativemap.security.NENative
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.virtualmaze.services_core.utils.NEApiServices
import com.virtualmaze.prcustomer.overlay.OverlayPackage
import com.virtualmaze.prcustomer.driverTracking.BGLocationServicePackage
import com.virtualmaze.prcustomer.tripAlert.PlayTripSoundPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              add(com.virtualmaze.prcustomer.NeNativePackage())
              add(com.virtualmaze.prcustomer.tracking.LocationTrackingPackage())
              add(PlayTripSoundPackage());
              add(OverlayPackage());
              add(BGLocationServicePackage());
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    NEApiServices.initialize(this)
    NENative.getInstance(applicationContext, NEApiServices.getAccessToken())
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
  }
}

