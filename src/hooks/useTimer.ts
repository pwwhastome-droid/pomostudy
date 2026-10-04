import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerMode, Settings } from '../types';
import { soundEngine } from '../utils/audio';
import { storage } from '../utils/storage';

interface UseTimerProps {
  settings: Settings;
  /** completedAt is only passed when a session finished while the app was closed. */
  onSessionComplete: (mode: TimerMode, durationMinutes: number, completedAt?: string) => void;
}

type FinishReason = 'complete' | 'skip' | 'late';

// A session that ended while the app was closed still counts if it ended recently;
// anything older is discarded (we can't know the user was really studying).
const LATE_GRACE_MS = 60 * 60 * 1000;

export function useTimer({ settings, onSessionComplete }: UseTimerProps) {
  const getDurationForMode = useCallback(
    (m: TimerMode) => {
      switch (m) {
        case 'focus':
          return settings.focusDuration * 60;
        case 'shortBreak':
          return settings.shortBreakDuration * 60;
        case 'longBreak':
          return settings.longBreakDuration * 60;
      }
    },
    [settings]
  );

  // ---- Restore a saved timer (reload / app killed) -------------------------------------------
  const [initial] = useState(() => {
    const saved = storage.getTimerState();
    const now = Date.now();
    if (!saved) return null;
    if (saved.isRunning && saved.endTime !== null) {
      if (saved.endTime > now) {
        return { ...saved, timeLeft: Math.ceil((saved.endTime - now) / 1000), expired: false, stale: false };
      }
      return { ...saved, timeLeft: 0, expired: true, stale: now - saved.endTime > LATE_GRACE_MS };
    }
    return { ...saved, expired: false, stale: false };
  });

  const [mode, setMode] = useState<TimerMode>(() => (initial && !initial.stale ? initial.mode : 'focus'));
  const [isRunning, setIsRunning] = useState(() => !!initial && initial.isRunning && !initial.expired);
  const [sessionCount, setSessionCount] = useState(() => initial?.sessionCount ?? 0);
  const [timeLeft, setTimeLeft] = useState(() =>
    initial && !initial.stale ? initial.timeLeft : getDurationForMode('focus')
  );
  const [totalDuration, setTotalDuration] = useState(() =>
    initial && !initial.stale ? initial.totalDuration : getDurationForMode('focus')
  );

  const endTimeRef = useRef<number | null>(
    initial && initial.isRunning && !initial.expired ? initial.endTime : null
  );
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const lastTickSecRef = useRef<number | null>(null);

  // ---- Keep timer in sync with duration settings (only when the *duration* changes) ----------
  const modeDuration = getDurationForMode(mode);
  const prevModeDurationRef = useRef(modeDuration);
  useEffect(() => {
    if (prevModeDurationRef.current === modeDuration) return;
    prevModeDurationRef.current = modeDuration;
    if (!isRunningRef.current) {
      setTimeLeft(modeDuration);
      setTotalDuration(modeDuration);
    }
  }, [modeDuration]);

  // ---- Persist ------------------------------------------------------------------------------
  // While running only endTime matters, so don't rewrite every second.
  const persistedTimeLeft = isRunning ? 0 : timeLeft;
  useEffect(() => {
    storage.saveTimerState({
      mode,
      isRunning,
      endTime: isRunning ? endTimeRef.current : null,
      timeLeft: persistedTimeLeft,
      totalDuration,
      sessionCount,
    });
  }, [mode, isRunning, persistedTimeLeft, totalDuration, sessionCount]);

  // Request native browser/system notifications
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Send interactive system notifications with actions
  const sendInteractiveNotification = useCallback(
    (title: string, body: string, isFocusComplete: boolean) => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const actions = isFocusComplete
        ? [
            { action: 'start_break', title: '☕ Take Break' },
            { action: 'skip_break', title: '⚡ Skip to Next' },
          ]
        : [
            { action: 'start_focus', title: '🎯 Start Focus' },
            { action: 'postpone', title: '⏳ 5m More' },
          ];

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.showNotification(title, {
              body,
              icon: '/pomo-icon.svg',
              badge: '/pomo-icon.svg',
              vibrate: [200, 100, 200],
              tag: 'pomostudy-timer',
              renotify: true,
              actions,
            } as NotificationOptions);
          })
          .catch(() => {
            new Notification(title, { body, icon: '/pomo-icon.svg' });
          });
      } else {
        new Notification(title, { body, icon: '/pomo-icon.svg' });
      }
    },
    []
  );

  const start = useCallback(() => {
    endTimeRef.current = Date.now() + timeLeft * 1000;
    setIsRunning(true);
  }, [timeLeft]);

  const pause = useCallback(() => {
    if (endTimeRef.current) {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      endTimeRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
    const dur = getDurationForMode(mode);
    setTimeLeft(dur);
    setTotalDuration(dur);
  }, [getDurationForMode, mode]);

  const switchMode = useCallback(
    (newMode: TimerMode) => {
      setIsRunning(false);
      endTimeRef.current = null;
      setMode(newMode);
      const dur = getDurationForMode(newMode);
      setTimeLeft(dur);
      setTotalDuration(dur);
    },
    [getDurationForMode]
  );

  /**
   * Move to the next phase.
   *  - 'complete': timer reached zero  -> log session, alarm, notification, optional autostart
   *  - 'late':     ended while app was closed -> log session at its real end time, no alarm
   *  - 'skip':     user jumped ahead -> NOTHING is logged (no stats, no confetti, no task credit,
   *                no cycle progress) and nothing auto-starts
   */
  const finish = useCallback(
    (reason: FinishReason, completedAt?: Date) => {
      setIsRunning(false);
      endTimeRef.current = null;

      const counted = reason !== 'skip';

      if (reason === 'complete') {
        if (settings.soundEnabled) soundEngine.playAlarm(settings.soundType, settings.volume);
        if (settings.vibrationEnabled) soundEngine.vibrate([200, 100, 200, 100, 400]);
      }

      if (counted) {
        onSessionComplete(mode, Math.round(totalDuration / 60), completedAt?.toISOString());
      }

      if (mode === 'focus') {
        const nextCount = counted ? sessionCount + 1 : sessionCount;
        setSessionCount(nextCount);

        const isLong = counted && nextCount % settings.longBreakInterval === 0;
        const nextMode: TimerMode = isLong ? 'longBreak' : 'shortBreak';
        const nextDur = getDurationForMode(nextMode);

        if (reason === 'complete') {
          sendInteractiveNotification(
            'Focus Session Complete! 🎉',
            isLong ? 'Great job! Time for a well-deserved long break.' : 'Time for a quick recharge break.',
            true
          );
        }

        setMode(nextMode);
        setTimeLeft(nextDur);
        setTotalDuration(nextDur);

        if (reason === 'complete' && settings.autoStartBreaks) {
          setTimeout(() => {
            endTimeRef.current = Date.now() + nextDur * 1000;
            setIsRunning(true);
          }, 500);
        }
      } else {
        if (reason === 'complete') {
          sendInteractiveNotification('Break Finished! ⚡', 'Ready to dive back into your studies?', false);
        }
        const focusDur = getDurationForMode('focus');
        setMode('focus');
        setTimeLeft(focusDur);
        setTotalDuration(focusDur);

        if (reason === 'complete' && settings.autoStartFocus) {
          setTimeout(() => {
            endTimeRef.current = Date.now() + focusDur * 1000;
            setIsRunning(true);
          }, 500);
        }
      }
    },
    [mode, totalDuration, settings, onSessionComplete, sessionCount, getDurationForMode, sendInteractiveNotification]
  );

  const skip = useCallback(() => finish('skip'), [finish]);

  // Session that ended while the app was closed: settle it once on mount.
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => {
    if (initial?.expired && !initial.stale && initial.endTime !== null) {
      finishRef.current('late', new Date(initial.endTime));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for actions from interactive notifications
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_ACTION') {
        const action = event.data.action;
        if (action === 'start_break' || action === 'start_focus') {
          start();
        } else if (action === 'skip_break') {
          skip();
        } else if (action === 'postpone') {
          setTimeLeft((prev) => prev + 300);
          setTotalDuration((prev) => prev + 300);
          start();
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [start, skip]);

  // Countdown (timestamp based, so background throttling can't cause drift)
  const tick = useCallback(() => {
    if (endTimeRef.current === null) return;
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));

    if (settings.tickingSound && remaining > 0 && remaining < totalDuration && lastTickSecRef.current !== remaining) {
      soundEngine.playTick();
    }
    lastTickSecRef.current = remaining;

    setTimeLeft(remaining);
    if (remaining <= 0) finish('complete');
  }, [settings.tickingSound, totalDuration, finish]);

  useEffect(() => {
    if (!isRunning) return;
    if (endTimeRef.current === null) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    }

    const interval = setInterval(tick, 250);
    // Browsers/Android throttle timers in the background: re-check the moment we're visible again.
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
    // timeLeft intentionally omitted: it only seeds endTime if missing and would recreate the interval every second
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, tick]);

  // Manage ambient noise playback
  useEffect(() => {
    if (isRunning && mode === 'focus') {
      soundEngine.setAmbientNoise(settings.ambientNoise, settings.volume);
    } else {
      soundEngine.setAmbientNoise('none');
    }
    return () => {
      soundEngine.setAmbientNoise('none');
    };
  }, [isRunning, mode, settings.ambientNoise, settings.volume]);

  return {
    mode,
    timeLeft,
    totalDuration,
    isRunning,
    sessionCount,
    start,
    pause,
    reset,
    skip,
    switchMode,
  };
}
