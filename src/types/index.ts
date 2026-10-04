export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface Subject {
  id: string;
  name: string;
  color: string;
  targetDailyMinutes: number;
}

export interface ClassSchedule {
  id: string;
  title: string;
  subjectId?: string;
  days: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  time: string; // "HH:MM" e.g. "19:00"
  enabled: boolean;
}

export interface ExamEvent {
  id: string;
  title: string;
  subjectId?: string;
  date: string; // "YYYY-MM-DD" e.g. "2026-10-14"
  time?: string; // "HH:MM"
  notes?: string;
}

export interface SpacedReviewStep {
  intervalDays: number; // 1, 3, 7, 14
  scheduledDate: string; // "YYYY-MM-DD"
  completed: boolean;
  completedAt?: string;
}

export interface SpacedItem {
  id: string;
  title: string; // e.g. "Biology - Chapter 3"
  subjectId?: string;
  studyDate: string; // "YYYY-MM-DD" original date studied
  notes?: string;
  steps: SpacedReviewStep[]; // 1, 3, 7, 14 days
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
  dueDate?: string; // YYYY-MM-DD
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

/** Running/paused timer snapshot so a reload or Android process kill doesn't lose the session. */
export interface PersistedTimer {
  mode: TimerMode;
  isRunning: boolean;
  endTime: number | null; // epoch ms, only when isRunning
  timeLeft: number; // seconds (authoritative when paused)
  totalDuration: number; // seconds
  sessionCount: number;
}

export interface TimerContext {
  subjectId?: string;
  taskId?: string;
}
