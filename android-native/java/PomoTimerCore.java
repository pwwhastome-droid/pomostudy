package com.pomostudy.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;

import java.util.Locale;

/**
 * The native copy of the Pomodoro state. The notification buttons change this state directly, so
 * they work even when the app is closed; the web app syncs from it when it opens.
 *
 * status: "running" | "paused" | "idle"
 * dirty:  true when the state was changed from the notification (the app must adopt it)
 */
final class PomoTimerCore {
    private PomoTimerCore() {}

    static final String PREFS = "pomostudy_native_timer";
    static final String CH_TIMER = "pomostudy_timer";
    static final String CH_DONE = "pomostudy_done";
    static final int ID_TIMER = 4101;
    static final int ID_DONE = 4102;

    static final String ACTION_TOGGLE = "com.pomostudy.app.TIMER_TOGGLE";
    static final String ACTION_SKIP = "com.pomostudy.app.TIMER_SKIP";
    static final String ACTION_RESET = "com.pomostudy.app.TIMER_RESET";

    // Small delay so, if the app is open, its own end-of-session handling wins and we don't double-alert.
    static final long ALARM_DELAY_MS = 1200;

    static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static NotificationManager nm(Context ctx) {
        return (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
    }

    // ------------------------------------------------------- state from the app

    /** status is "running" or "paused". Fields come from the JS call. */
    static void saveFromApp(Context ctx, org.json.JSONObject d, String status) {
        SharedPreferences.Editor e = prefs(ctx).edit();
        e.putString("status", status);
        e.putLong("endTime", "running".equals(status) ? d.optLong("endTime", 0) : 0);
        e.putInt("remainingSec", d.optInt("remainingSec", 0));
        e.putString("mode", d.optString("mode", "focus"));
        e.putInt("totalDuration", d.optInt("totalDuration", 0));
        e.putInt("sessionCount", d.optInt("sessionCount", 0));
        e.putString("title", d.optString("title", "PomoStudy"));
        e.putString("doneTitle", d.optString("doneTitle", "Session complete"));
        e.putString("doneBody", d.optString("doneBody", "Open PomoStudy to continue."));
        e.putString("skipMode", d.optString("skipMode", ""));
        e.putInt("skipDuration", d.optInt("skipDuration", 0));
        e.putBoolean("dirty", false);
        e.apply();
    }

    static void clear(Context ctx) {
        cancelAlarm(ctx);
        nm(ctx).cancel(ID_TIMER);
        prefs(ctx).edit().clear().apply();
    }

    // ------------------------------------------------- actions from the buttons

    static void handleAction(Context ctx, String action) {
        if (action == null) return;
        SharedPreferences p = prefs(ctx);
        String status = p.getString("status", "idle");
        long now = System.currentTimeMillis();
        SharedPreferences.Editor e = p.edit();

        if (ACTION_TOGGLE.equals(action)) {
            if ("running".equals(status)) {
                long remainingMs = Math.max(0, p.getLong("endTime", now) - now);
                e.putString("status", "paused");
                e.putInt("remainingSec", (int) ((remainingMs + 999) / 1000));
                e.putLong("endTime", 0);
                e.putBoolean("dirty", true);
                e.apply();
                cancelAlarm(ctx);
            } else if ("paused".equals(status)) {
                long end = now + p.getInt("remainingSec", 0) * 1000L;
                e.putString("status", "running");
                e.putLong("endTime", end);
                e.putBoolean("dirty", true);
                e.apply();
                scheduleAlarm(ctx, end + ALARM_DELAY_MS, p.getString("doneTitle", ""), p.getString("doneBody", ""));
            }
        } else if (ACTION_SKIP.equals(action)) {
            if ("idle".equals(status)) return;
            String nextMode = p.getString("skipMode", "");
            int nextDur = p.getInt("skipDuration", 0);
            if (!nextMode.isEmpty() && nextDur > 0) {
                e.putString("mode", nextMode);
                e.putInt("totalDuration", nextDur);
            }
            e.putString("status", "idle");
            e.putInt("remainingSec", nextDur > 0 ? nextDur : p.getInt("totalDuration", 0));
            e.putLong("endTime", 0);
            e.putBoolean("dirty", true);
            e.apply();
            cancelAlarm(ctx);
        } else if (ACTION_RESET.equals(action)) {
            if ("idle".equals(status)) return;
            e.putString("status", "idle");
            e.putInt("remainingSec", p.getInt("totalDuration", 0));
            e.putLong("endTime", 0);
            e.putBoolean("dirty", true);
            e.apply();
            cancelAlarm(ctx);
        }
        render(ctx);
    }

    // ------------------------------------------------------------ notification

    static void ensureChannels(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager m = nm(ctx);

        NotificationChannel timer = new NotificationChannel(CH_TIMER, "Running timer", NotificationManager.IMPORTANCE_LOW);
        timer.setDescription("Countdown with pause / skip / reset controls");
        timer.setShowBadge(false);
        m.createNotificationChannel(timer);

        NotificationChannel done = new NotificationChannel(CH_DONE, "Session finished", NotificationManager.IMPORTANCE_HIGH);
        done.setDescription("Alerts you when a focus session or break ends");
        m.createNotificationChannel(done);
    }

    /** Shows, updates or removes the timer notification to match the saved state. */
    static void render(Context ctx) {
        SharedPreferences p = prefs(ctx);
        String status = p.getString("status", "idle");
        boolean running = "running".equals(status);
        boolean paused = "paused".equals(status);
        if (!running && !paused) {
            nm(ctx).cancel(ID_TIMER);
            return;
        }
        ensureChannels(ctx);

        String title = p.getString("title", "PomoStudy");
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CH_TIMER)
            .setSmallIcon(smallIcon(ctx))
            .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
            .setCustomContentView(buildViews(ctx, p, running))
            .setCustomBigContentView(buildViews(ctx, p, running))
            .setContentTitle(title)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(openAppIntent(ctx));
        nm(ctx).notify(ID_TIMER, b.build());
    }

    private static RemoteViews buildViews(Context ctx, SharedPreferences p, boolean running) {
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.pomo_notification);
        String title = p.getString("title", "PomoStudy");

        if (running) {
            long endTime = p.getLong("endTime", 0);
            long base = SystemClock.elapsedRealtime() + (endTime - System.currentTimeMillis());
            rv.setViewVisibility(R.id.pomo_chrono, View.VISIBLE);
            rv.setViewVisibility(R.id.pomo_paused_time, View.GONE);
            rv.setChronometer(R.id.pomo_chrono, base, null, true);
            if (Build.VERSION.SDK_INT >= 24) rv.setChronometerCountDown(R.id.pomo_chrono, true);
            rv.setTextViewText(R.id.pomo_title, title);
            rv.setTextViewText(R.id.pomo_btn_toggle, "Pause");
        } else {
            int s = p.getInt("remainingSec", 0);
            rv.setViewVisibility(R.id.pomo_chrono, View.GONE);
            rv.setViewVisibility(R.id.pomo_paused_time, View.VISIBLE);
            rv.setTextViewText(R.id.pomo_paused_time, String.format(Locale.US, "%02d:%02d", s / 60, s % 60));
            rv.setTextViewText(R.id.pomo_title, title + " · Paused");
            rv.setTextViewText(R.id.pomo_btn_toggle, "Resume");
        }

        rv.setOnClickPendingIntent(R.id.pomo_btn_toggle, actionIntent(ctx, ACTION_TOGGLE, 11));
        rv.setOnClickPendingIntent(R.id.pomo_btn_skip, actionIntent(ctx, ACTION_SKIP, 12));
        rv.setOnClickPendingIntent(R.id.pomo_btn_reset, actionIntent(ctx, ACTION_RESET, 13));
        return rv;
    }

    static void postDone(Context ctx, String title, String body) {
        ensureChannels(ctx);
        NotificationManager m = nm(ctx);
        m.cancel(ID_TIMER);

        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CH_DONE)
            .setSmallIcon(smallIcon(ctx))
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setContentIntent(openAppIntent(ctx));
        m.notify(ID_DONE, b.build());
    }

    // ----------------------------------------------------------------- helpers

    private static int smallIcon(Context ctx) {
        int id = ctx.getResources().getIdentifier("ic_stat_pomo", "drawable", ctx.getPackageName());
        return id != 0 ? id : ctx.getApplicationInfo().icon;
    }

    private static PendingIntent openAppIntent(Context ctx) {
        Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (launch == null) launch = new Intent();
        return PendingIntent.getActivity(ctx, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent actionIntent(Context ctx, String action, int requestCode) {
        Intent i = new Intent(ctx, TimerActionReceiver.class);
        i.setAction(action);
        return PendingIntent.getBroadcast(ctx, requestCode, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent alarmIntent(Context ctx, String title, String body) {
        Intent i = new Intent(ctx, TimerAlarmReceiver.class);
        i.putExtra("title", title);
        i.putExtra("body", body);
        return PendingIntent.getBroadcast(ctx, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void scheduleAlarm(Context ctx, long atMillis, String title, String body) {
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

    static void cancelAlarm(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        am.cancel(alarmIntent(ctx, "", ""));
    }
}
