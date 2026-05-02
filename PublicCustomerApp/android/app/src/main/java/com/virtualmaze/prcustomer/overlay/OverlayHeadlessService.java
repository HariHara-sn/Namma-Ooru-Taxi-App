package com.virtualmaze.prcustomer.overlay;

import android.content.Intent;
import androidx.annotation.Nullable;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import com.facebook.react.bridge.Arguments;
import android.os.Bundle;

public class OverlayHeadlessService extends HeadlessJsTaskService {
  @Override
  protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
    Bundle extras = intent != null ? intent.getExtras() : null;
    if (extras == null) extras = new Bundle();
    return new HeadlessJsTaskConfig(
      "OverlayPayloadTask",
      Arguments.fromBundle(extras),
      10000,
      true
    );
  }
}


