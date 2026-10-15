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

if "TimerAlarmReceiver" not in s:
    s = s.replace(
        "</application>",
        '        <receiver android:name=".TimerAlarmReceiver" android:exported="false" />\n    </application>',
    )

with open(path, "w") as f:
    f.write(s)

print("AndroidManifest.xml patched")
