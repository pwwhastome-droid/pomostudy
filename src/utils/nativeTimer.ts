import { Capacitor, registerPlugin } from '@capacitor/core';
import { storage } from './storage';
import { TimerMode } from '../types';

interface NativeTimerState {
  running: boolean;
  endTime?: number;
  mode?: TimerMode;
  totalDuration?: number;
  sessionCount?: number;
}

export interface NativeTimerStartOptions {
  endTime: number; // epoch ms
  mode: TimerMode;
  totalDuration: number; // seconds
  sessionCount: number;
  title: string;
  text: string;
  doneTitle: string;
  doneBody: string;
}

interface PomoTimerPlugin {
  start(options: NativeTimerStartOptions): Promise<void>;
  stop(): Promise<void>;
  sync(): Promise<NativeTimerState>;
}

// Only exists inside the Android app; on the web/PWA every call is a no-op.
const plugin: PomoTimerPlugin | null = Capacitor.isNativePlatform()
  ? registerPlugin<PomoTimerPlugin>('PomoTimer')
  : null;

export const nativeTimer = {
  start(options: NativeTimerStartOptions) {
    plugin?.start(options).catch(() => {});
  },
  stop() {
    plugin?.stop().catch(() => {});
  },
};

/**
 * Runs before the first render. If Android still knows about a running session but the app's own
 * storage lost it (process killed before the write was flushed), put it back so the timer resumes.
 */
export async function reconcileNativeTimer(): Promise<void> {
  if (!plugin) return;
  try {
    const native = await Promise.race<NativeTimerState | null>([
      plugin.sync(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 600)),
    ]);
    if (!native || !native.running || !native.endTime) return;

    const local = storage.getTimerState();
    if (!local || !local.isRunning || local.endTime !== native.endTime) {
      storage.saveTimerState({
        mode: native.mode || 'focus',
        isRunning: true,
        endTime: native.endTime,
        timeLeft: 0,
        totalDuration: native.totalDuration || 0,
        sessionCount: native.sessionCount || 0,
      });
    }
  } catch {
    /* never block startup */
  }
}
