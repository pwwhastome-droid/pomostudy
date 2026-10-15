package com.pomostudy.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Keeps the Pomodoro visible outside the app:
 *  - an ongoing notification whose countdown is drawn by Android itself (no JS needed, survives app kill)
 *  - an alarm that posts a "finished" alert when the time is up
 *  - the running state saved natively so the app can restore it if its own storage was lost
 */
@CapacitorPlugin(
    name = "PomoTimer",
    permissions = {
        @Permission(strings = { "android.permission.POST_NOTIFICATIONS" }, alias = "notifications")
    }
)
public class PomoTimerPlugin extends Plugin {

    static final String CH_TIMER = "pomostudy_timer";
    static final String CH_DONE = "pomostudy_done";
    static final int ID_TIMER = 4101;
    static final int ID_DONE = 4102;
    static final String PREFS = "pomostudy_native_timer";
    // Small delay so, if the app is open, the in-app alarm wins and we don't double-notify.
    static final long ALARM_DELAY_MS = 1200;

    // ---------------------------------------------------------------- JS API

    @PluginMethod
    public void start(PluginCall call) {
        Context ctx = getContext();
        long endTime = call.getData().optLong("endTime", 0);
        if (endTime <= 0) {
            call.reject("endTime required");
            return;
        }

        SharedPreferences.Editor e = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        e.putBoolean("running", true);
        e.putLong("endTime", endTime);
        e.putString("mode", call.getString("mode", "focus"));
        e.putInt("totalDuration", call.getInt("totalDuration", 0));
        e.putInt("sessionCount", call.getInt("sessionCount", 0));
        e.apply();

        scheduleAlarm(
            ctx,
            endTime + ALARM_DELAY_MS,
            call.getString("doneTitle", "Session complete"),
            call.getString("doneBody", "Open PomoStudy to continue.")
        );

        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notifPermissionCallback");
        } else {
            postOngoing(call);
        }
    }

    @PermissionCallback
    private void notifPermissionCallback(PluginCall call) {
        postOngoing(call);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context ctx = getContext();
        cancelAlarm(ctx);
        notificationManager(ctx).cancel(ID_TIMER);
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply();
        call.resolve();
    }

    /** Called when the app opens: returns what the notification layer thinks is running. */
    @PluginMethod
    public void sync(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        notificationManager(ctx).cancel(ID_DONE);

        JSObject ret = new JSObject();
        ret.put("running", p.getBoolean("running", false));
        ret.put("endTime", p.getLong("endTime", 0));
        ret.put("mode", p.getString("mode", "focus"));
        ret.put("totalDuration", p.getInt("totalDuration", 0));
        ret.put("sessionCount", p.getInt("sessionCount", 0));
        call.resolve(ret);
    }

    // ------------------------------------------------------------ internals

    private void postOngoing(PluginCall call) {
        Context ctx = getContext();
        ensureChannels(ctx);
        long endTime = call.getData().optLong("endTime", 0);

        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CH_TIMER)
            .setSmallIcon(smallIcon(ctx))
            .setContentTitle(call.getString("title", "PomoStudy"))
            .setContentText(call.getString("text", "Tap to return to PomoStudy"))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setShowWhen(true)
            .setWhen(endTime)
            .setUsesChronometer(true)
            .setChronometerCountDown(true)
            .setContentIntent(openAppIntent(ctx));

        notificationManager(ctx).notify(ID_TIMER, b.build());
        call.resolve();
    }

    private static NotificationManager notificationManager(Context ctx) {
        return (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
    }

    static void ensureChannels(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = notificationManager(ctx);

        NotificationChannel timer = new NotificationChannel(CH_TIMER, "Running timer", NotificationManager.IMPORTANCE_LOW);
        timer.setDescription("Shows the Pomodoro countdown while it runs");
        timer.setShowBadge(false);
        nm.createNotificationChannel(timer);

        NotificationChannel done = new NotificationChannel(CH_DONE, "Session finished", NotificationManager.IMPORTANCE_HIGH);
        done.setDescription("Alerts you when a focus session or break ends");
        nm.createNotificationChannel(done);
    }

    static void postDone(Context ctx, String title, String body) {
        ensureChannels(ctx);
        NotificationManager nm = notificationManager(ctx);
        nm.cancel(ID_TIMER);

        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CH_DONE)
            .setSmallIcon(smallIcon(ctx))
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setContentIntent(openAppIntent(ctx));
        nm.notify(ID_DONE, b.build());
    }

    private static int smallIcon(Context ctx) {
        int id = ctx.getResources().getIdentifier("ic_stat_pomo", "drawable", ctx.getPackageName());
        return id != 0 ? id : ctx.getApplicationInfo().icon;
    }

    private static PendingIntent openAppIntent(Context ctx) {
        Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (launch == null) launch = new Intent();
        return PendingIntent.getActivity(ctx, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent alarmIntent(Context ctx, String title, String body) {
        Intent i = new Intent(ctx, TimerAlarmReceiver.class);
        i.putExtra("title", title);
        i.putExtra("body", body);
        return PendingIntent.getBroadcast(ctx, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void scheduleAlarm(Context ctx, long atMillis, String title, String body) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = alarmIntent(ctx, title, body);
        try {
            if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pi);
            } else {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pi);
            }
        } catch (SecurityException ex) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pi);
        }
    }

    private static void cancelAlarm(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        am.cancel(alarmIntent(ctx, "", ""));
    }
}
