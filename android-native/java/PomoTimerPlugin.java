package com.pomostudy.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.lang.ref.WeakReference;

/** Bridge between the web app and the native timer notification (see PomoTimerCore). */
@CapacitorPlugin(
    name = "PomoTimer",
    permissions = {
        @Permission(strings = { "android.permission.POST_NOTIFICATIONS" }, alias = "notifications")
    }
)
public class PomoTimerPlugin extends Plugin {

    private static WeakReference<PomoTimerPlugin> instance = new WeakReference<>(null);

    @Override
    public void load() {
        instance = new WeakReference<>(this);
    }

    /** Called by the notification buttons so an open app can sync immediately. */
    static void notifyChanged() {
        PomoTimerPlugin p = instance.get();
        if (p != null) p.notifyListeners("changed", new JSObject());
    }

    @PluginMethod
    public void start(PluginCall call) {
        Context ctx = getContext();
        long endTime = call.getData().optLong("endTime", 0);
        if (endTime <= 0) {
            call.reject("endTime required");
            return;
        }
        PomoTimerCore.saveFromApp(ctx, call.getData(), "running");
        PomoTimerCore.scheduleAlarm(
            ctx,
            endTime + PomoTimerCore.ALARM_DELAY_MS,
            call.getData().optString("doneTitle", "Session complete"),
            call.getData().optString("doneBody", "Open PomoStudy to continue.")
        );

        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notifPermissionCallback");
        } else {
            PomoTimerCore.render(ctx);
            call.resolve();
        }
    }

    @PermissionCallback
    private void notifPermissionCallback(PluginCall call) {
        PomoTimerCore.render(getContext());
        call.resolve();
    }

    @PluginMethod
    public void pause(PluginCall call) {
        Context ctx = getContext();
        PomoTimerCore.saveFromApp(ctx, call.getData(), "paused");
        PomoTimerCore.cancelAlarm(ctx);
        PomoTimerCore.render(ctx);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        PomoTimerCore.clear(getContext());
        call.resolve();
    }

    /** Returns the native state; the flag `dirty` is true if a notification button changed it. */
    @PluginMethod
    public void sync(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences p = PomoTimerCore.prefs(ctx);
        PomoTimerCore.nm(ctx).cancel(PomoTimerCore.ID_DONE);

        JSObject ret = new JSObject();
        ret.put("status", p.getString("status", "idle"));
        ret.put("endTime", p.getLong("endTime", 0));
        ret.put("remainingSec", p.getInt("remainingSec", 0));
        ret.put("mode", p.getString("mode", "focus"));
        ret.put("totalDuration", p.getInt("totalDuration", 0));
        ret.put("sessionCount", p.getInt("sessionCount", 0));
        ret.put("dirty", p.getBoolean("dirty", false));

        if (p.getBoolean("dirty", false)) p.edit().putBoolean("dirty", false).apply();
        call.resolve(ret);
    }
}
