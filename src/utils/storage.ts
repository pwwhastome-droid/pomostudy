import { Settings, Subject, Task, SessionRecord, ClassSchedule, ExamEvent, SpacedItem } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  soundType: 'zen',
  volume: 0.8,
  tickingSound: false,
  ambientNoise: 'none',
  vibrationEnabled: true,
  wakeLockEnabled: true,
  dailyGoalMinutes: 120,
};

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Mathematics', color: '#38bdf8', targetDailyMinutes: 60 },
  { id: 'sub-2', name: 'Computer Science', color: '#a855f7', targetDailyMinutes: 90 },
  { id: 'sub-3', name: 'Languages', color: '#10b981', targetDailyMinutes: 30 },
  { id: 'sub-4', name: 'Reading', color: '#f59e0b', targetDailyMinutes: 45 },
];

const KEYS = {
  SETTINGS: 'pomostudy_settings',
  SUBJECTS: 'pomostudy_subjects',
  TASKS: 'pomostudy_tasks',
  SESSIONS: 'pomostudy_sessions',
  CLASSES: 'pomostudy_classes',
  EXAMS: 'pomostudy_exams',
  SPACED_ITEMS: 'pomostudy_spaced_items',
};

export const storage = {
  getSettings(): Settings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Settings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  getSubjects(): Subject[] {
    try {
      const data = localStorage.getItem(KEYS.SUBJECTS);
      return data ? JSON.parse(data) : DEFAULT_SUBJECTS;
    } catch {
      return DEFAULT_SUBJECTS;
    }
  },

  saveSubjects(subjects: Subject[]) {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  },

  getTasks(): Task[] {
    try {
      const data = localStorage.getItem(KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveTasks(tasks: Task[]) {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  },

  getSessions(): SessionRecord[] {
    try {
      const data = localStorage.getItem(KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSessions(sessions: SessionRecord[]) {
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },

  getClasses(): ClassSchedule[] {
    try {
      const data = localStorage.getItem(KEYS.CLASSES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveClasses(classes: ClassSchedule[]) {
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
  },

  getExams(): ExamEvent[] {
    try {
      const data = localStorage.getItem(KEYS.EXAMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveExams(exams: ExamEvent[]) {
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(exams));
  },

  getSpacedItems(): SpacedItem[] {
    try {
      const data = localStorage.getItem(KEYS.SPACED_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSpacedItems(items: SpacedItem[]) {
    localStorage.setItem(KEYS.SPACED_ITEMS, JSON.stringify(items));
  },

  exportBackup(): string {
    const backup = {
      version: 3,
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      subjects: this.getSubjects(),
      tasks: this.getTasks(),
      sessions: this.getSessions(),
      classes: this.getClasses(),
      exams: this.getExams(),
      spacedItems: this.getSpacedItems(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (data.subjects) this.saveSubjects(data.subjects);
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.sessions) this.saveSessions(data.sessions);
      if (data.classes) this.saveClasses(data.classes);
      if (data.exams) this.saveExams(data.exams);
      if (data.spacedItems) this.saveSpacedItems(data.spacedItems);
      return true;
    } catch {
      return false;
    }
  },
};
