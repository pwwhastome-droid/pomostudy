import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { storage } from './storage';
import { TimerMode } from '../types';

export interface NativeTimerSync {
  status: 'running' | 'paused' | 'idle';
  endTime: number; // epoch ms (running)
  remainingSec: number; // paused
  mode: TimerMode;
  totalDuration: number; // seconds
  sessionCount: number;
  /** true when the notification buttons changed the state since the app last looked */
  dirty: boolean;
}

interface NativeTimerBase {
  mode: TimerMode;
  totalDuration: number; // seconds
  sessionCount: number;
  title: string;
  doneTitle: string;
  doneBody: string;
  /** What the notification's Skip button moves to (same as the in-app skip). */
  skipMode: TimerMode;
  skipDuration: number; // seconds
}

export interface NativeTimerStartOptions extends NativeTimerBase {
  endTime: number; // epoch ms
}

export interface NativeTimerPauseOptions extends NativeTimerBase {
  remainingSec: number;
}

interface PomoTimerPlugin {
  start(options: NativeTimerStartOptions): Promise<void>;
  pause(options: NativeTimerPauseOptions): Promise<void>;
  stop(): Promise<void>;
  sync(): Promise<NativeTimerSync>;
  addListener(eventName: 'changed', cb: () => void): Promise<PluginListenerHandle>;
}

// Only exists inside the Android app; on the web/PWA every call is a no-op.
const plugin: PomoTimerPlugin | null = Capacitor.isNativePlatform()
  ? registerPlugin<PomoTimerPlugin>('PomoTimer')
  : null;

export const nativeTimer = {
  start(options: NativeTimerStartOptions) {
    plugin?.start(options).catch(() => {});
  },
  pause(options: NativeTimerPauseOptions) {
    plugin?.pause(options).catch(() => {});
  },
  stop() {
    plugin?.stop().catch(() => {});
  },
  /** Resolves null on the web or if the native side doesn't answer. */
  async sync(): Promise<NativeTimerSync | null> {
    if (!plugin) return null;
    try {
      return await plugin.sync();
    } catch {
      return null;
    }
  },
  /** Fires when a notification button is pressed while the app is open. Returns an unsubscribe function. */
  onChanged(cb: () => void): () => void {
    if (!plugin) return () => {};
    let handle: PluginListenerHandle | null = null;
    let removed = false;
    plugin
      .addListener('changed', cb)
      .then((h) => {
        if (removed) h.remove();
        else handle = h;
      })
      .catch(() => {});
    return () => {
      removed = true;
      handle?.remove();
    };
  },
};

/**
 * Runs before the first render. Makes the app's saved timer match what Android has, so a timer that
 * was paused/resumed/skipped/reset from the notification (or whose app storage was lost) comes back right.
 */
export async function reconcileNativeTimer(): Promise<void> {
  if (!plugin) return;
  try {
    const native = await Promise.race<NativeTimerSync | null>([
      plugin.sync(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 600)),
    ]);
    if (!native) return;

    const local = storage.getTimerState();
    const base = {
      mode: native.mode || 'focus',
      totalDuration: native.totalDuration || 0,
      sessionCount: native.sessionCount || 0,
    };

    if (native.status === 'running' && native.endTime) {
      if (!local || !local.isRunning || local.endTime !== native.endTime) {
        storage.saveTimerState({ ...base, isRunning: true, endTime: native.endTime, timeLeft: 0 });
      }
    } else if (native.status === 'paused') {
      if (native.dirty || !local || local.isRunning) {
        storage.saveTimerState({ ...base, isRunning: false, endTime: null, timeLeft: native.remainingSec });
      }
    } else if (native.dirty) {
      // Reset or skipped from the notification
      storage.saveTimerState({ ...base, isRunning: false, endTime: null, timeLeft: base.totalDuration });
    }
  } catch {
    /* never block startup */
  }
}
