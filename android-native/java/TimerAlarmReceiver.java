package com.pomostudy.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Fires when a running session reaches zero, even if the app was closed or killed. */
public class TimerAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        PomoTimerCore.postDone(
            context,
            title != null && !title.isEmpty() ? title : "Session complete",
            body != null && !body.isEmpty() ? body : "Open PomoStudy to continue."
        );
    }
}
