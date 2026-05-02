package com.virtualmaze.prcustomer.tracking;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.content.ContextCompat;

public class StopTrackingReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    // Forward to service as ACTION_STOP
    Intent s = new Intent(context, LocationForegroundService.class);
    s.setAction(LocationForegroundService.ACTION_STOP);
    if (Build.VERSION.SDK_INT >= 26) {
      ContextCompat.startForegroundService(context, s);
    } else {
      context.startService(s);
    }
  }
}