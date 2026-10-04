import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Timer } from './components/Timer';
import { TaskTracker } from './components/TaskTracker';
import { Analytics } from './components/Analytics';
import { SubjectManager } from './components/SubjectManager';
import { ExamCalendar } from './components/ExamCalendar';
import { ClassReminderManager } from './components/ClassReminderManager';
import { SpacedRepetition } from './components/SpacedRepetition';
import { SettingsModal } from './components/SettingsModal';
import { MiniTimer } from './components/MiniTimer';
import { useTimer } from './hooks/useTimer';
import { useWakeLock } from './hooks/useWakeLock';
import { useMediaSession } from './hooks/useMediaSession';
import { usePictureInPicture } from './hooks/usePictureInPicture';
import { useScheduleReminders } from './hooks/useScheduleReminders';
import { storage } from './utils/storage';
import { Settings, Subject, Task, SessionRecord, TimerMode, ClassSchedule, ExamEvent, SpacedItem } from './types';
import {
  Timer as TimerIcon,
  CheckSquare,
  BarChart3,
  BookOpen,
  Calendar as CalendarIcon,
  Bell,
  Brain,
  Settings as SettingsIcon,
  Minimize2,
  ExternalLink,
} from 'lucide-react';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => storage.getSettings());
  const [subjects, setSubjects] = useState<Subject[]>(() => storage.getSubjects());
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [sessions, setSessions] = useState<SessionRecord[]>(() => storage.getSessions());
  const [classes, setClasses] = useState<ClassSchedule[]>(() => storage.getClasses());
  const [exams, setExams] = useState<ExamEvent[]>(() => storage.getExams());
  const [spacedItems, setSpacedItems] = useState<SpacedItem[]>(() => storage.getSpacedItems());

  const [activeTab, setActiveTab] = useState<'timer' | 'tasks' | 'schedule' | 'spaced' | 'analytics' | 'subjects'>('timer');
  const [scheduleSubTab, setScheduleSubTab] = useState<'calendar' | 'alarms'>('calendar');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(() => subjects[0] || null);
  const [activeTaskId, setActiveTaskId] = useState<string | undefined>();

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'],
    });
  };

  // On session completion handler
  const handleSessionComplete = useCallback(
    (completedMode: TimerMode, durationMinutes: number) => {
      const newSession: SessionRecord = {
        id: 'sess-' + Date.now(),
        mode: completedMode,
        subjectId: completedMode === 'focus' ? selectedSubject?.id : undefined,
        taskId: completedMode === 'focus' ? activeTaskId : undefined,
        durationMinutes,
        timestamp: new Date().toISOString(),
      };

      setSessions((prev) => {
        const updated = [newSession, ...prev];
        storage.saveSessions(updated);
        return updated;
      });

      if (completedMode === 'focus') {
        triggerConfetti();

        // Increment active task pomodoro count if assigned
        if (activeTaskId) {
          setTasks((prev) => {
            const updated = prev.map((t) => {
              if (t.id === activeTaskId) {
                const newCompleted = t.completedPomodoros + 1;
                return {
                  ...t,
                  completedPomodoros: newCompleted,
                  completed: newCompleted >= t.estimatedPomodoros ? true : t.completed,
                };
              }
              return t;
            });
            storage.saveTasks(updated);
            return updated;
          });
        }
      }
    },
    [selectedSubject, activeTaskId]
  );

  const timer = useTimer({
    settings,
    onSessionComplete: handleSessionComplete,
  });

  // Keep screen awake on Android / Desktop when timer is running
  useWakeLock(settings.wakeLockEnabled, timer.isRunning);

  // System Media Controls & Android Lock Screen presence
  useMediaSession({
    mode: timer.mode,
    timeLeft: timer.timeLeft,
    totalDuration: timer.totalDuration,
    isRunning: timer.isRunning,
    subjectName: selectedSubject?.name,
    onPlay: timer.start,
    onPause: timer.pause,
    onSkip: timer.skip,
  });

  // Background Class Reminder Engine
  useScheduleReminders({ classes, subjects });

  // Document Picture-in-Picture for native floating window
  const pip = usePictureInPicture({ containerId: 'pip-timer-wrapper' });

  // Desktop keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (timer.isRunning) timer.pause();
        else timer.start();
      } else if (e.altKey && e.code === 'KeyR') {
        e.preventDefault();
        timer.reset();
      } else if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        timer.skip();
      } else if (e.altKey && e.code === 'KeyM') {
        e.preventDefault();
        setIsMiniMode((m) => !m);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer]);

  // Update document title with remaining time
  useEffect(() => {
    const mins = Math.floor(timer.timeLeft / 60);
    const secs = timer.timeLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const modeLabel = timer.mode === 'focus' ? 'Focus' : 'Break';
    document.title = `${formatted} - ${modeLabel} | PomoStudy`;
  }, [timer.timeLeft, timer.mode]);

  // Handlers for settings & data
  const handleUpdateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  const handleExportData = () => {
    const backupJson = storage.exportBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomostudy-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonString: string) => {
    const success = storage.importBackup(jsonString);
    if (success) {
      setSettings(storage.getSettings());
      setSubjects(storage.getSubjects());
      setTasks(storage.getTasks());
      setSessions(storage.getSessions());
      setClasses(storage.getClasses());
      setExams(storage.getExams());
      setSpacedItems(storage.getSpacedItems());
      setIsSettingsOpen(false);
      alert('Data imported successfully!');
    } else {
      alert('Failed to parse backup file.');
    }
  };

  // Handlers for Tasks
  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completedPomodoros' | 'completed'>) => {
    const newTask: Task = {
      ...taskData,
      id: 'task-' + Date.now(),
      completedPomodoros: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    storage.saveTasks(updated);
  };

  const handleToggleComplete = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t
    );
    setTasks(updated);
    storage.saveTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    storage.saveTasks(updated);
    if (activeTaskId === taskId) setActiveTaskId(undefined);
  };

  const handleIncrementPomo = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
    );
    setTasks(updated);
    storage.saveTasks(updated);
  };

  // Handlers for Subjects
  const handleAddSubject = (subjectData: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...subjectData,
      id: 'sub-' + Date.now(),
    };
    const updated = [...subjects, newSubject];
    setSubjects(updated);
    storage.saveSubjects(updated);
    if (!selectedSubject) setSelectedSubject(newSubject);
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (subjects.length <= 1) return;
    const updated = subjects.filter((s) => s.id !== subjectId);
    setSubjects(updated);
    storage.saveSubjects(updated);
    if (selectedSubject?.id === subjectId) {
      setSelectedSubject(updated[0] || null);
    }
  };

  // Handlers for Classes
  const handleAddClass = (clsData: Omit<ClassSchedule, 'id'>) => {
    const newClass: ClassSchedule = {
      ...clsData,
      id: 'cls-' + Date.now(),
    };
    const updated = [...classes, newClass];
    setClasses(updated);
    storage.saveClasses(updated);
  };

  const handleToggleClass = (id: string) => {
    const updated = classes.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    setClasses(updated);
    storage.saveClasses(updated);
  };

  const handleDeleteClass = (id: string) => {
    const updated = classes.filter((c) => c.id !== id);
    setClasses(updated);
    storage.saveClasses(updated);
  };

  // Handlers for Exams
  const handleAddExam = (examData: Omit<ExamEvent, 'id'>) => {
    const newExam: ExamEvent = {
      ...examData,
      id: 'exam-' + Date.now(),
    };
    const updated = [...exams, newExam];
    setExams(updated);
    storage.saveExams(updated);
  };

  const handleDeleteExam = (id: string) => {
    const updated = exams.filter((e) => e.id !== id);
    setExams(updated);
    storage.saveExams(updated);
  };

  // Handlers for Spaced Repetition (1, 3, 7, 14 days)
  const handleAddSpacedItem = (title: string, subjectId?: string, studyDateStr?: string, notes?: string) => {
    const baseDate = studyDateStr ? new Date(studyDateStr + 'T00:00:00') : new Date();
    const intervals = [1, 3, 7, 14];

    const steps = intervals.map((interval) => {
      const scheduled = new Date(baseDate);
      scheduled.setDate(scheduled.getDate() + interval);
      const scheduledDate = scheduled.toISOString().split('T')[0];
      return {
        intervalDays: interval,
        scheduledDate,
        completed: false,
      };
    });

    const newItem: SpacedItem = {
      id: 'spaced-' + Date.now(),
      title,
      subjectId,
      studyDate: baseDate.toISOString().split('T')[0],
      notes,
      steps,
    };

    const updated = [newItem, ...spacedItems];
    setSpacedItems(updated);
    storage.saveSpacedItems(updated);
  };

  const handleToggleSpacedStep = (itemId: string, intervalDays: number) => {
    const updated = spacedItems.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          steps: item.steps.map((st) => {
            if (st.intervalDays === intervalDays) {
              const nextCompleted = !st.completed;
              return {
                ...st,
                completed: nextCompleted,
                completedAt: nextCompleted ? new Date().toISOString() : undefined,
              };
            }
            return st;
          }),
        };
      }
      return item;
    });
    setSpacedItems(updated);
    storage.saveSpacedItems(updated);
  };

  const handleDeleteSpacedItem = (itemId: string) => {
    const updated = spacedItems.filter((i) => i.id !== itemId);
    setSpacedItems(updated);
    storage.saveSpacedItems(updated);
  };

  const handleFocusSpacedItem = (topicTitle: string, subId?: string) => {
    if (subId) {
      const sub = subjects.find((s) => s.id === subId);
      if (sub) setSelectedSubject(sub);
    }
    // Also create or select active task
    const newTask: Task = {
      id: 'task-' + Date.now(),
      title: `Review: ${topicTitle}`,
      subjectId: subId,
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks([newTask, ...tasks]);
    storage.saveTasks([newTask, ...tasks]);
    setActiveTaskId(newTask.id);
    setActiveTab('timer');
  };

  return (
    <div className="min-h-screen bg-mesh-dark text-slate-100 flex flex-col justify-between relative selection:bg-rose-500/30 selection:text-rose-200">
      {/* Top Floating Glass Header */}
      <header className="w-full border-b border-white/5 bg-slate-950/60 backdrop-blur-2xl sticky top-0 z-30 px-4 py-3.5 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/pomo-icon.png"
              alt="PomoStudy"
              className="w-9 h-9 rounded-2xl shadow-lg shadow-rose-500/15 border border-white/10 object-cover"
            />
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                PomoStudy
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 font-bold border border-rose-500/20 uppercase tracking-widest">
                  Focus
                </span>
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1.5 glass-pill p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'timer' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TimerIcon className="w-4 h-4" />
              <span>Timer</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tasks' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Tasks</span>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'schedule' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Exams & Alarms</span>
            </button>
            <button
              onClick={() => setActiveTab('spaced')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'spaced' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Spaced Recall</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'subjects' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Subjects</span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {pip.isSupported && (
              <button
                onClick={pip.togglePip}
                title={pip.isPipOpen ? 'Close Floating Window' : 'Pop out floating window (Picture-in-Picture)'}
                className={`p-2.5 rounded-2xl glass-panel transition-all active:scale-95 ${
                  pip.isPipOpen
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsMiniMode(!isMiniMode)}
              title="Mini Floating Mode (Alt+M)"
              className="p-2.5 rounded-2xl glass-panel text-slate-400 hover:text-white hover:border-white/20 transition-all active:scale-95"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
              className="p-2.5 rounded-2xl glass-panel text-slate-400 hover:text-white hover:border-white/20 transition-all active:scale-95"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 pb-28 sm:pb-12 flex flex-col justify-center">
        {activeTab === 'timer' && (
          <div className="space-y-6">
            <div id="pip-original-host">
              <div id="pip-timer-wrapper">
                <Timer
                  mode={timer.mode}
                  timeLeft={timer.timeLeft}
                  totalDuration={timer.totalDuration}
                  isRunning={timer.isRunning}
                  sessionCount={timer.sessionCount}
                  selectedSubject={selectedSubject}
                  subjects={subjects}
                  settings={settings}
                  onSelectSubject={setSelectedSubject}
                  onStart={timer.start}
                  onPause={timer.pause}
                  onReset={timer.reset}
                  onSkip={timer.skip}
                  onSwitchMode={timer.switchMode}
                  onUpdateSettings={handleUpdateSettings}
                />
              </div>
            </div>

            {/* Quick Active Task Banner if selected */}
            {activeTaskId && (
              <div className="max-w-md mx-auto w-full p-3.5 glass-panel rounded-2xl flex items-center justify-between border-rose-500/20 animate-in fade-in">
                <div className="flex items-center gap-2.5 text-xs truncate mr-2">
                  <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-rose-500/10">Active Goal</span>
                  <span className="text-slate-100 truncate font-semibold">
                    {tasks.find((t) => t.id === activeTaskId)?.title}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTaskId(undefined)}
                  className="text-xs text-slate-400 hover:text-white font-medium px-2 py-1 rounded-lg hover:bg-slate-800 transition"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <TaskTracker
            tasks={tasks}
            subjects={subjects}
            activeTaskId={activeTaskId}
            onSelectTask={(id) => {
              setActiveTaskId(id);
              const task = tasks.find((t) => t.id === id);
              if (task?.subjectId) {
                const sub = subjects.find((s) => s.id === task.subjectId);
                if (sub) setSelectedSubject(sub);
              }
              setActiveTab('timer');
            }}
            onAddTask={handleAddTask}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onIncrementPomo={handleIncrementPomo}
            onOpenSchedule={() => setActiveTab('schedule')}
          />
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-5">
            {/* Sub-tab toggle */}
            <div className="flex items-center p-1.5 glass-pill rounded-2xl w-fit border border-white/10 gap-1.5">
              <button
                onClick={() => setScheduleSubTab('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  scheduleSubTab === 'calendar'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Exam Calendar</span>
              </button>
              <button
                onClick={() => setScheduleSubTab('alarms')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  scheduleSubTab === 'alarms'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Class Alarms ({classes.filter((c) => c.enabled).length})</span>
              </button>
            </div>

            {scheduleSubTab === 'calendar' ? (
              <ExamCalendar
                exams={exams}
                subjects={subjects}
                onAddExam={handleAddExam}
                onDeleteExam={handleDeleteExam}
              />
            ) : (
              <ClassReminderManager
                classes={classes}
                subjects={subjects}
                onAddClass={handleAddClass}
                onToggleClass={handleToggleClass}
                onDeleteClass={handleDeleteClass}
              />
            )}
          </div>
        )}

        {activeTab === 'spaced' && (
          <SpacedRepetition
            items={spacedItems}
            subjects={subjects}
            onAddItem={handleAddSpacedItem}
            onToggleStep={handleToggleSpacedStep}
            onDeleteItem={handleDeleteSpacedItem}
            onFocusItem={handleFocusSpacedItem}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics sessions={sessions} subjects={subjects} settings={settings} />
        )}

        {activeTab === 'subjects' && (
          <SubjectManager
            subjects={subjects}
            sessions={sessions}
            onAddSubject={handleAddSubject}
            onDeleteSubject={handleDeleteSubject}
          />
        )}
      </main>

      {/* Floating Mini Timer when enabled */}
      {isMiniMode && (
        <MiniTimer
          mode={timer.mode}
          timeLeft={timer.timeLeft}
          totalDuration={timer.totalDuration}
          isRunning={timer.isRunning}
          selectedSubject={selectedSubject}
          onStart={timer.start}
          onPause={timer.pause}
          onReset={timer.reset}
          onExpand={() => setIsMiniMode(false)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(s) => {
          setSettings(s);
          storage.saveSettings(s);
        }}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      {/* Mobile Floating Bottom Bar */}
      <div className="sm:hidden fixed bottom-4 left-4 right-4 z-30 glass-panel rounded-3xl p-1.5 flex items-center justify-around border-white/10 shadow-2xl backdrop-blur-2xl">
        <button
          onClick={() => setActiveTab('timer')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
            activeTab === 'timer'
              ? 'bg-rose-500/20 text-rose-300 font-extrabold shadow-md shadow-rose-500/10 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TimerIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-wider font-semibold">Timer</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
            activeTab === 'tasks'
              ? 'bg-rose-500/20 text-rose-300 font-extrabold shadow-md shadow-rose-500/10 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] tracking-wider font-semibold">Tasks</span>
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
            activeTab === 'schedule'
              ? 'bg-rose-500/20 text-rose-300 font-extrabold shadow-md shadow-rose-500/10 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-wider font-semibold">Schedule</span>
        </button>
        <button
          onClick={() => setActiveTab('spaced')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
            activeTab === 'spaced'
              ? 'bg-rose-500/20 text-rose-300 font-extrabold shadow-md shadow-rose-500/10 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-5 h-5" />
          <span className="text-[10px] tracking-wider font-semibold">Spaced</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
            activeTab === 'analytics'
              ? 'bg-rose-500/20 text-rose-300 font-extrabold shadow-md shadow-rose-500/10 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] tracking-wider font-semibold">Stats</span>
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
            activeTab === 'subjects'
              ? 'bg-rose-500/20 text-rose-300 font-extrabold shadow-md shadow-rose-500/10 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] tracking-wider font-semibold">Subjects</span>
        </button>
      </div>
    </div>
  );
};

export default App;
