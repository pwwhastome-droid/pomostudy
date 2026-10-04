import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerMode, Settings } from '../types';
import { soundEngine } from '../utils/audio';

interface UseTimerProps {
  settings: Settings;
  onSessionComplete: (mode: TimerMode, durationMinutes: number) => void;
}

export function useTimer({ settings, onSessionComplete }: UseTimerProps) {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

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

  const [timeLeft, setTimeLeft] = useState(() => getDurationForMode('focus'));
  const [totalDuration, setTotalDuration] = useState(() => getDurationForMode('focus'));

  const endTimeRef = useRef<number | null>(null);

  // Sync duration when settings change and timer is paused
  useEffect(() => {
    if (!isRunning) {
      const dur = getDurationForMode(mode);
      setTimeLeft(dur);
      setTotalDuration(dur);
    }
  }, [settings, mode, isRunning, getDurationForMode]);

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

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;

    // Audio & Haptic feedback
    if (settings.soundEnabled) {
      soundEngine.playAlarm(settings.soundType, settings.volume);
    }
    if (settings.vibrationEnabled) {
      soundEngine.vibrate([200, 100, 200, 100, 400]);
    }

    const durationMins = Math.round(totalDuration / 60);
    onSessionComplete(mode, durationMins);

    if (mode === 'focus') {
      const nextCount = sessionCount + 1;
      setSessionCount(nextCount);

      const isLong = nextCount % settings.longBreakInterval === 0;
      const nextMode: TimerMode = isLong ? 'longBreak' : 'shortBreak';
      const nextDur = getDurationForMode(nextMode);

      sendInteractiveNotification(
        'Focus Session Complete! 🎉',
        isLong ? 'Great job! Time for a well-deserved long break.' : 'Time for a quick recharge break.',
        true
      );

      setMode(nextMode);
      setTimeLeft(nextDur);
      setTotalDuration(nextDur);

      if (settings.autoStartBreaks) {
        setTimeout(() => {
          endTimeRef.current = Date.now() + nextDur * 1000;
          setIsRunning(true);
        }, 500);
      }
    } else {
      // Break finished
      sendInteractiveNotification('Break Finished! ⚡', 'Ready to dive back into your studies?', false);
      const focusDur = getDurationForMode('focus');
      setMode('focus');
      setTimeLeft(focusDur);
      setTotalDuration(focusDur);

      if (settings.autoStartFocus) {
        setTimeout(() => {
          endTimeRef.current = Date.now() + focusDur * 1000;
          setIsRunning(true);
        }, 500);
      }
    }
  }, [mode, totalDuration, settings, onSessionComplete, sessionCount, getDurationForMode, sendInteractiveNotification]);

  const skip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

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

  // Main countdown loop with drift correction
  useEffect(() => {
    if (!isRunning) return;

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current! - now) / 1000));

      if (settings.tickingSound && remaining > 0 && remaining < totalDuration) {
        soundEngine.playTick();
      }

      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleComplete();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, totalDuration, settings.tickingSound, handleComplete, timeLeft]);

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
