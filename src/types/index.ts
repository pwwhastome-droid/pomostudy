export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface Subject {
  id: string;
  name: string;
  color: string;
  targetDailyMinutes: number;
}

export interface Task {
  id: string;
  title: string;
  subjectId?: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface SessionRecord {
  id: string;
  mode: TimerMode;
  subjectId?: string;
  taskId?: string;
  durationMinutes: number;
  timestamp: string; // ISO string
}

export interface Settings {
  focusDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number; // e.g. 4
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  soundType: 'bell' | 'chime' | 'digital' | 'zen';
  volume: number; // 0.0 - 1.0
  tickingSound: boolean;
  ambientNoise: 'none' | 'white' | 'rain';
  vibrationEnabled: boolean;
  wakeLockEnabled: boolean;
  dailyGoalMinutes: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  sessionsCompleted: number;
  bySubject: Record<string, number>;
}
