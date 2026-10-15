package com.pomostudy.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Handles the Pause / Resume, Skip and Reset buttons in the notification. */
public class TimerActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        PomoTimerCore.handleAction(context, intent.getAction());
        // If the app is open, tell it to pick up the change right away.
        PomoTimerPlugin.notifyChanged();
    }
}
