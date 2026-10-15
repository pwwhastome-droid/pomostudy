"""Adds the notification/alarm permissions and the alarm receiver to the generated Android manifest."""
path = "android/app/src/main/AndroidManifest.xml"

with open(path, "r") as f:
    s = f.read()

permissions = [
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.USE_EXACT_ALARM",
]
add = "".join(
    f'    <uses-permission android:name="{p}" />\n' for p in permissions if p not in s
)
if add:
    s = s.replace("</manifest>", add + "</manifest>")

receivers = ""
for name in ("TimerAlarmReceiver", "TimerActionReceiver"):
    if name not in s:
        receivers += f'        <receiver android:name=".{name}" android:exported="false" />\n'
if receivers:
    s = s.replace("</application>", receivers + "    </application>")

with open(path, "w") as f:
    f.write(s)

print("AndroidManifest.xml patched")
