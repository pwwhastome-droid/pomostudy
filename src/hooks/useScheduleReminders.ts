import { useEffect, useRef } from 'react';
import { ClassSchedule, Subject } from '../types';
import { soundEngine } from '../utils/audio';
import { localDateStr } from '../utils/date';

interface UseScheduleRemindersProps {
  classes: ClassSchedule[];
  subjects: Subject[];
}

export function useScheduleReminders({ classes, subjects }: UseScheduleRemindersProps) {
  // Track already notified minutes to avoid duplicate alerts within the same minute: "YYYY-MM-DD-HH:MM-classId"
  const firedMap = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Request notification permission if needed
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const checkReminders = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const datePrefix = localDateStr(now);

      // Clean up firedMap entries from previous days
      if (firedMap.current.size > 200) {
        firedMap.current.clear();
      }

      for (const cls of classes) {
        if (!cls.enabled) continue;

        // Check if class occurs today and at this time
        if (cls.days.includes(currentDay) && cls.time === currentTimeStr) {
          const key = `${datePrefix}-${currentTimeStr}-${cls.id}`;
          if (!firedMap.current.has(key)) {
            firedMap.current.add(key);

            // Find subject name if any
            const subject = subjects.find((s) => s.id === cls.subjectId);
            const title = `Class Reminder: ${cls.title}`;
            const body = subject
              ? `Your ${subject.name} session is starting now!`
              : 'Your scheduled class session is starting now!';

            // Sound + Haptic Alert
            soundEngine.playAlarm('chime', 0.9);
            soundEngine.vibrate([200, 100, 200, 100, 400]);

            // System Notification
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.ready.then((reg) => {
                    reg.showNotification(title, {
                      body,
                      icon: '/pomo-icon.png',
                      badge: '/pomo-icon.png',
                      tag: `class-${cls.id}`,
                      renotify: true,
                    } as NotificationOptions);
                  }).catch(() => {
                    new Notification(title, { body, icon: '/pomo-icon.png' });
                  });
                } else {
                  new Notification(title, { body, icon: '/pomo-icon.png' });
                }
              } catch {
                // Fallback
              }
            }
          }
        }
      }
    };

    // Check immediately and every 10 seconds
    checkReminders();
    const timer = setInterval(checkReminders, 10000);

    return () => clearInterval(timer);
  }, [classes, subjects]);
}
