package com.virtualmaze.prcustomer

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactRootView
import com.facebook.react.ReactApplication

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // Important for react-native-screens to avoid fragment restoration after process death
    super.onCreate(null)
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    val app = application as? ReactApplication
    val isReady = try {
      app?.reactNativeHost?.reactInstanceManager?.currentReactContext != null
    } catch (_: Throwable) {
      false
    }
    if (isReady) {
      super.onWindowFocusChanged(hasFocus)
    }
    // Ignore focus changes until RN context exists to avoid soft exceptions in ReactHostImpl
  }

  override fun getMainComponentName(): String = "CustomerApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return MainActivityDelegate(this, mainComponentName)
  }

  class MainActivityDelegate(activity: ReactActivity, mainComponentName: String) :
    ReactActivityDelegate(activity, mainComponentName) {
    override fun createRootView(): ReactRootView {
      val reactRootView = ReactRootView(context)
      reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED)
      return reactRootView
    }
  }
}


