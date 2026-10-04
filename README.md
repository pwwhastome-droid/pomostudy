# PomoStudy - Cross-Platform Pomodoro Study Tracker

A modern, offline-first Pomodoro study tracker engineered for **Android** and **Desktop**.

## ✨ Features

- **Accurate Timer Engine:** Drift-free timestamp delta tracking with configurable Focus, Short Break, and Long Break intervals.
- **Synthesized Audio & Ambient Sound:** Built-in Web Audio API sound generator (Singing bowl chime, Temple bell, Digital beep, Rain, and White noise) with zero external media files.
- **Task & Goal Management:** Track tasks with estimated vs. actual pomodoros, subject categorization, and fast focus switching.
- **Subject Analytics & Heatmap:** Track study time per subject, daily completion bars, consecutive study streak, and total logged hours.
- **Screen Wake Lock:** Prevents screen timeout during focus sessions on Android and Desktop.
- **Haptic Vibration:** Tactile vibration signals on session transitions on mobile.
- **Desktop Mini Mode:** Compact floating widget with global keyboard shortcuts (`Space` to toggle, `Alt+R` reset, `Alt+S` skip, `Alt+M` mini mode).
- **Data Portability:** 100% offline-first localStorage with 1-click JSON export & restore to sync between Android and PC.

## 🚀 Running on VPS / Local

```bash
cd /root/pomodoro-app
npm run build
npm run preview -- --host 0.0.0.0 --port 3000
```

## 📱 Android Deployment Options

1. **Standalone PWA (Instant, 0 setup):**
   - Open the web URL in Chrome on Android.
   - Tap Chrome menu (`⋮`) -> **"Add to Home screen"** or **"Install app"**.
   - Runs full-screen with offline support, wake lock, and notifications.

2. **Native Android APK (Automated via GitHub Actions):**
   - Push this repo to GitHub.
   - Go to the **Actions** tab -> **Build Android APK**.
   - Download the generated `app-debug.apk` directly to your phone.
